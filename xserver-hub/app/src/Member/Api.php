<?php
declare(strict_types=1);

namespace Hub\Member;

use Hub\Kernel\App;
use Hub\Kernel\Http\Request;
use Hub\Kernel\Http\Response;
use Hub\Kernel\Json;
use Hub\Kernel\Time;
use Hub\Line\Friends;
use Hub\Line\Msg;
use Hub\Line\Outbox;
use Hub\Line\Settings;

/**
 * 会員サイト → ハブ の API（/api/v1/…）。呼び出し元は ApiAuth で確かめる。
 *
 *   POST   /api/v1/link-codes              { member_ref, plan?, rank? }       → { code, expires_at }        連携コードを作る（scope: link）
 *   GET    /api/v1/members/{ref}                                             → 連携の状態                    （scope: members）
 *   PUT    /api/v1/members/{ref}           { plan?, rank?, fields? }          → 会員の情報を入れる／変える      （scope: members）
 *   DELETE /api/v1/members/{ref}/link                                        → LINE との連携を外す            （scope: link）
 *   DELETE /api/v1/members/{ref}                                             → 会員の情報を消す（退会）        （scope: members）
 *   POST   /api/v1/notifications           { member_ref, title, body?, link?, idempotency_key } → LINE に通知を送る（scope: notify）
 *
 * 応答は { ok: true, … } か { ok: false, error: { code, message } }。LINE の userId は、会員サイトに返さない。
 */
final class Api
{
    private const REF_RE = '/^[A-Za-z0-9_.:@-]{1,100}$/';

    public static function handle(App $app, Request $req): Response
    {
        if (!$app->config->bool('member.enabled')) {
            return self::err(404, 'not_found', '会員サイトとの連携は、使っていません（member.enabled）');
        }
        $path = $req->path;
        $m = [];
        try {
            if ($req->method === 'POST' && $path === '/api/v1/link-codes') {
                return self::guard($app, $req, 'link', fn ($key) => self::createLinkCode($app, self::body($req), $key));
            }
            if ($req->method === 'POST' && $path === '/api/v1/notifications') {
                return self::guard($app, $req, 'notify', fn ($key) => self::notify($app, self::body($req), $key));
            }
            if (preg_match('#^/api/v1/members/([^/]+)/link$#', $path, $m) && $req->method === 'DELETE') {
                return self::guard($app, $req, 'link', fn ($key) => self::unlink($app, self::ref($m[1]), $key));
            }
            if (preg_match('#^/api/v1/members/([^/]+)$#', $path, $m)) {
                $ref = self::ref($m[1]);
                return match ($req->method) {
                    'GET' => self::guard($app, $req, 'members', fn ($key) => self::status($app, $ref)),
                    'PUT' => self::guard($app, $req, 'members', fn ($key) => self::upsertMember($app, $ref, self::body($req), $key)),
                    'DELETE' => self::guard($app, $req, 'members', fn ($key) => self::deleteMember($app, $ref, $key)),
                    default => self::err(405, 'method_not_allowed', 'この方法では呼び出せません'),
                };
            }
        } catch (\InvalidArgumentException $e) {
            return self::err(400, 'bad_request', $e->getMessage());
        }
        return self::err(404, 'not_found', '見つかりません');
    }

    private static function guard(App $app, Request $req, string $scope, callable $fn): Response
    {
        $a = ApiAuth::check($app, $req, $scope);
        if (!$a['ok']) {
            return self::err($a['status'], $a['code'], $a['message']);
        }
        try {
            $out = $fn($a['keyId']);
        } catch (\InvalidArgumentException $e) {
            return self::err(400, 'bad_request', $e->getMessage());
        } catch (\Throwable $e) {
            $app->log()->error('会員サイトの API の処理に失敗しました', ['path' => $req->path, 'error' => $e->getMessage()]);
            return self::err(500, 'internal', '内部エラーが起きました');
        }
        return $out instanceof Response ? $out : Response::json(['ok' => true] + $out);
    }

    private static function err(int $status, string $code, string $message): Response
    {
        return Response::json(['ok' => false, 'error' => ['code' => $code, 'message' => $message]], $status);
    }

    private static function body(Request $req): array
    {
        if (!$req->isJson()) {
            throw new \InvalidArgumentException('Content-Type は application/json にしてください');
        }
        $b = $req->json();
        if (!is_array($b) || ($b !== [] && array_is_list($b))) {
            throw new \InvalidArgumentException('本文は JSON のオブジェクトにしてください');
        }
        return $b;
    }

    private static function ref(string $raw): string
    {
        $ref = rawurldecode($raw);
        if (!preg_match(self::REF_RE, $ref)) {
            throw new \InvalidArgumentException('会員番号（member_ref）は、半角の英数字と _ . : @ - で100文字までです');
        }
        return $ref;
    }

    private static function actor(string $keyId): array
    {
        return ['id' => 'site:' . $keyId, 'email' => null];
    }

    /** 会員の情報を入れる（plan・rank は送られたものだけ変える） */
    private static function saveMember(App $app, string $ref, array $b): void
    {
        $plan = array_key_exists('plan', $b) ? $b['plan'] : null;
        if ($plan !== null && (!is_string($plan) || mb_strlen($plan) > 50)) {
            throw new \InvalidArgumentException('plan は50文字までの文字列にしてください');
        }
        $rank = array_key_exists('rank', $b) ? $b['rank'] : null;
        if ($rank !== null && !is_int($rank)) {
            throw new \InvalidArgumentException('rank は整数にしてください');
        }
        $fields = $b['fields'] ?? null;
        if ($fields !== null) {
            if (!Json::isObjLike($fields) || count((array) $fields) > 30) {
                throw new \InvalidArgumentException('fields は { 名前: 値 } の形（30項目まで）にしてください');
            }
            foreach ($fields as $k => $v) {
                if (!preg_match('/^[\p{L}\p{N}_.-]{1,40}$/u', (string) $k) || !(is_scalar($v) || $v === null) || mb_strlen((string) $v) > 200) {
                    throw new \InvalidArgumentException("fields の「{$k}」が正しくありません（名前は40文字・値は200文字まで）");
                }
            }
        }
        $now = $app->now();
        $db = $app->db();
        $db->exec(
            'INSERT INTO hub_members (member_ref, plan, `rank`, fields, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE plan = IF(?, VALUES(plan), plan), `rank` = IF(?, VALUES(`rank`), `rank`), fields = IF(?, VALUES(fields), fields), updated_at = VALUES(updated_at)',
            [$ref, $plan, $rank, Json::enc(Json::obj($fields ?? [])), $now, $now, array_key_exists('plan', $b), array_key_exists('rank', $b), $fields !== null]
        );
        // つながっている友だちの台帳にも反映する（会員の項目は「member.名前」の友だち情報として、一斉配信の絞り込みに使える）
        $friend = $db->one('SELECT line_user_id FROM line_friends WHERE member_ref = ?', [$ref]);
        if ($friend) {
            $app->adapter()->refreshMember($app, $friend['line_user_id']);
            foreach ((array) ($fields ?? []) as $k => $v) {
                Friends::setField($app, $friend['line_user_id'], 'member.' . $k, $v);
            }
        }
    }

    private static function createLinkCode(App $app, array $b, string $keyId): array
    {
        $ref = self::ref((string) ($b['member_ref'] ?? ''));
        self::saveMember($app, $ref, array_intersect_key($b, ['plan' => 1, 'rank' => 1]));
        $digits = SiteAdapter::digits($app);
        $ttl = max(5, min(1440, $app->config->int('member.link_code_ttl_min', 30)));
        $db = $app->db();
        $now = $app->now();
        // 同じ会員の、まだ使っていないコードは消す（いちばん新しいコードだけが使える）
        $db->exec('DELETE FROM hub_link_codes WHERE member_ref = ? AND used_at IS NULL', [$ref]);
        $db->exec('DELETE FROM hub_link_codes WHERE expires_at < ? AND used_at IS NULL', [$now]);
        for ($i = 0; $i < 20; $i++) {
            $code = str_pad((string) random_int(0, 10 ** $digits - 1), $digits, '0', STR_PAD_LEFT);
            $n = $db->exec(
                'INSERT INTO hub_link_codes (code_hash, member_ref, expires_at, created_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = id',
                [$app->crypto()->index($code, 'link_code'), $ref, Time::addMinutes($now, $ttl), $now]
            );
            if ($n === 1) {
                $app->audit()->record(self::actor($keyId), 'api.link_code', ['member_ref' => $ref]);
                return ['code' => $code, 'expires_at' => Time::iso(Time::addMinutes($now, $ttl)), 'digits' => $digits];
            }
        }
        throw new \RuntimeException('連携コードを作れませんでした（使われているコードが多すぎます）');
    }

    private static function status(App $app, string $ref): array
    {
        $db = $app->db();
        $f = $db->one('SELECT status, member_synced_at FROM line_friends WHERE member_ref = ?', [$ref]);
        $m = $db->one('SELECT plan, `rank`, updated_at FROM hub_members WHERE member_ref = ?', [$ref]);
        return [
            'member_ref' => $ref,
            'known' => $m !== null,
            'linked' => $f !== null,
            'line_status' => $f['status'] ?? null, // active（友だち）／blocked（ブロック中）／null（つながっていない）
            'linked_at' => $f['member_synced_at'] ?? null,
            'plan' => $m['plan'] ?? null,
            'rank' => $m['rank'] ?? null,
        ];
    }

    private static function upsertMember(App $app, string $ref, array $b, string $keyId): array
    {
        self::saveMember($app, $ref, $b);
        $app->audit()->record(self::actor($keyId), 'api.member_upsert', ['member_ref' => $ref, 'plan' => $b['plan'] ?? null, 'rank' => $b['rank'] ?? null, 'fields' => isset($b['fields']) ? array_keys((array) $b['fields']) : null]);
        return self::status($app, $ref);
    }

    private static function unlinkFriend(App $app, string $ref): bool
    {
        $db = $app->db();
        $f = $db->one('SELECT line_user_id FROM line_friends WHERE member_ref = ?', [$ref]);
        if (!$f) {
            return false;
        }
        $db->exec('UPDATE line_friends SET member_ref = NULL, member_plan = NULL, member_rank = NULL, member_synced_at = ?, updated_at = ? WHERE line_user_id = ?', [$app->now(), $app->now(), $f['line_user_id']]);
        Friends::removeTag($app, $f['line_user_id'], SiteAdapter::LINK_TAG);
        $db->exec("DELETE FROM line_friend_fields WHERE line_user_id = ? AND `key` LIKE 'member.%'", [$f['line_user_id']]);
        return true;
    }

    private static function unlink(App $app, string $ref, string $keyId): array
    {
        $done = self::unlinkFriend($app, $ref);
        $app->db()->exec('DELETE FROM hub_link_codes WHERE member_ref = ? AND used_at IS NULL', [$ref]);
        $app->audit()->record(self::actor($keyId), 'api.unlink', ['member_ref' => $ref, 'unlinked' => $done]);
        return ['unlinked' => $done];
    }

    /** 退会：会員の情報と連携を消す（LINE の友だちとしての記録は、友だちのまま残る） */
    private static function deleteMember(App $app, string $ref, string $keyId): array
    {
        $done = self::unlinkFriend($app, $ref);
        $app->db()->exec('DELETE FROM hub_link_codes WHERE member_ref = ?', [$ref]);
        $deleted = $app->db()->exec('DELETE FROM hub_members WHERE member_ref = ?', [$ref]) > 0;
        $app->audit()->record(self::actor($keyId), 'api.member_delete', ['member_ref' => $ref, 'unlinked' => $done, 'deleted' => $deleted]);
        return ['deleted' => $deleted, 'unlinked' => $done];
    }

    /** 会員への通知を LINE で送る（優先度10＝販促より先。月間上限のうち、会員通知の取り置きも使える） */
    private static function notify(App $app, array $b, string $keyId): array|Response
    {
        $ref = self::ref((string) ($b['member_ref'] ?? ''));
        $title = $b['title'] ?? null;
        $text = $b['body'] ?? '';
        $link = $b['link'] ?? null;
        $key = $b['idempotency_key'] ?? null;
        if (!is_string($title) || $title === '' || mb_strlen($title) > 200) {
            throw new \InvalidArgumentException('title（200文字まで）が必要です');
        }
        if (!is_string($text) || mb_strlen($text) > 4000) {
            throw new \InvalidArgumentException('body は4000文字までの文字列にしてください');
        }
        if ($link !== null && (!is_string($link) || strlen($link) > 500 || !preg_match('#^(/|https://)#', $link))) {
            throw new \InvalidArgumentException('link は / で始まるサイト内の場所か、https:// の URL にしてください');
        }
        if (!is_string($key) || !preg_match('/^[A-Za-z0-9_.:-]{8,100}$/', $key)) {
            throw new \InvalidArgumentException('idempotency_key（8〜100文字の英数字。同じ通知を二重に送らないための印）が必要です');
        }
        $settings = Settings::get($app);
        if (!$settings['genie_notify_enabled']) {
            return Response::json(['ok' => false, 'error' => ['code' => 'disabled', 'message' => '会員通知→LINE は、まだ止めています（管理画面の設定「会員サイトの通知を LINE へ」をオンにしてください）']], 409);
        }
        $ref2 = 'notify:' . $keyId . ':' . $key;
        // 同じ会員への通知は1つずつ受け付ける（やり直しの呼び出しが重なっても、二重に送らない）
        $busy = Response::json(['ok' => false, 'error' => ['code' => 'in_progress', 'message' => 'この会員への通知を、いま受け付けています。少し待ってから、同じ idempotency_key でもう一度どうぞ']], 409);
        return $app->lease()->with('notify:' . substr(hash('sha256', $ref), 0, 40), 30, function () use ($app, $ref, $ref2, $title, $text, $link, $settings, $keyId) {
            $db = $app->db();
            $dup = $db->one("SELECT id, status FROM line_outbox WHERE source = 'notification' AND source_ref = ?", [$ref2]);
            if ($dup) {
                return ['delivered' => true, 'duplicate' => true, 'status' => $dup['status']];
            }
            $f = $db->one('SELECT line_user_id, status FROM line_friends WHERE member_ref = ?', [$ref]);
            if (!$f) {
                return ['delivered' => false, 'reason' => 'not_linked'];
            }
            if ($f['status'] !== 'active') {
                return ['delivered' => false, 'reason' => 'blocked'];
            }
            $site = rtrim((string) ($settings['site_url'] ?: $app->config->str('member.site_url')), '/');
            $url = $link === null ? null : (str_starts_with($link, '/') ? ($site !== '' ? $site . $link : null) : $link);
            $msg = mb_substr(implode("\n", array_values(array_filter([$title, $text, $url], fn ($x) => $x !== null && $x !== ''))), 0, 4900);
            $id = Outbox::enqueue($app, [$f['line_user_id']], Msg::normalize([$msg], []), 'notification', $ref2, 10);
            $app->audit()->record(self::actor($keyId), 'api.notify', ['member_ref' => $ref, 'outbox' => $id]);
            return ['delivered' => true, 'queued' => true];
        }, $busy);
    }
}
