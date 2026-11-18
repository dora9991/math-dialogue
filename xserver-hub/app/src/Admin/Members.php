<?php
declare(strict_types=1);

namespace Hub\Admin;

use Hub\Kernel\App;
use Hub\Kernel\Password;
use Hub\Kernel\Text;

/**
 * 運営メンバー（管理画面を使う人）と権限（line-hub の members.js を、このハブのログインに合わせたもの）。
 *
 *   owner    … 全部（運営メンバーの追加・権限の変更を含む）
 *   admin    … 全部（運営メンバーの管理を除く）
 *   operator … チャットで返す・タグや属性を付ける・友だちを見る
 *   viewer   … 見るだけ
 *
 * 追加：オーナーが、メールアドレスと役割を入れる → 1回だけ見える仮パスワードを返す。
 *   本人は、最初のログインで「自分のパスワードに変える」「二段階認証を登録する」まで、管理画面に入れない。
 */
final class Members
{
    public const ROLES = ['owner', 'admin', 'operator', 'viewer'];
    public const ROLE_LABEL = ['owner' => 'オーナー', 'admin' => '管理者', 'operator' => '担当者（チャット）', 'viewer' => '閲覧のみ'];
    private const ADMIN_PERMS = ['read', 'chat', 'friends', 'edit', 'send', 'settings'];
    public const ROLE_PERMS = [
        'viewer' => ['read'],
        'operator' => ['read', 'chat', 'friends'],
        'admin' => self::ADMIN_PERMS,
        'owner' => [...self::ADMIN_PERMS, 'members'],
    ];
    public const PERM_LABEL = [
        'read' => '見る', 'chat' => 'チャットで送る', 'friends' => 'タグ・属性を付ける', 'edit' => 'ルール・ステップ配信・アンケートを作る',
        'send' => '一斉配信・テスト送信', 'settings' => '設定を変える', 'members' => '運営メンバーを管理する',
    ];

    public static function can(?string $role, string $perm): bool
    {
        return in_array($perm, self::ROLE_PERMS[$role ?? ''] ?? [], true);
    }

    public static function normEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }

    public static function validEmail(string $email): bool
    {
        return (bool) preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email) && strlen($email) <= 200;
    }

    public static function get(App $app, string $id): ?array
    {
        if (!Text::isUuid($id)) {
            return null;
        }
        return $app->db()->one('SELECT * FROM hub_admins WHERE id = ?', [$id]);
    }

    public static function getByEmail(App $app, string $email): ?array
    {
        return $app->db()->one('SELECT * FROM hub_admins WHERE email_norm = ?', [self::normEmail($email)]);
    }

    public static function list(App $app): array
    {
        return $app->db()->all(
            'SELECT id AS user_id, role, email, display_name, must_change_password, added_by, created_at, updated_at, last_login_at AS last_sign_in_at,
                    (totp_enabled_at IS NOT NULL) AS totp_enabled, (disabled_at IS NOT NULL) AS disabled
             FROM hub_admins ORDER BY created_at, id'
        );
    }

    private static function owners(App $app): int
    {
        return (int) $app->db()->value("SELECT COUNT(*) FROM hub_admins WHERE role = 'owner' AND disabled_at IS NULL");
    }

    /** アカウントを作る（コマンドの create-owner と、画面の追加の両方から）。@return string id */
    public static function create(App $app, string $email, string $role, ?string $displayName, string $password, bool $mustChange, ?string $actor): string
    {
        $mail = self::normEmail($email);
        if (!self::validEmail($mail)) {
            throw new \InvalidArgumentException('メールアドレスの形が正しくありません');
        }
        if (!in_array($role, self::ROLES, true)) {
            throw new \InvalidArgumentException('役割は ' . implode(' / ', self::ROLES) . ' のどれかです');
        }
        if (self::getByEmail($app, $mail)) {
            throw new \InvalidArgumentException('この人は、すでに運営メンバーです（役割を変えるときは、一覧から変えてください）');
        }
        $id = Text::uuid();
        $now = $app->now();
        $name = $displayName === null ? null : (mb_substr(trim($displayName), 0, 40) ?: null);
        $app->db()->exec(
            'INSERT INTO hub_admins (id, email, email_norm, display_name, role, password_hash, must_change_password, password_changed_at, added_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$id, $mail, $mail, $name, $role, $app->password()->hash($password), $mustChange, $mustChange ? null : $now, $actor, $now, $now]
        );
        return $id;
    }

    /** 画面から追加する（仮パスワードを1回だけ返す） */
    public static function add(App $app, string $email, string $role, ?string $displayName, ?string $actor): array
    {
        $temp = Password::generateTemp();
        $id = self::create($app, $email, $role, $displayName, $temp, true, $actor);
        return ['ok' => true, 'userId' => $id, 'created' => true, 'tempPassword' => $temp];
    }

    /** 役割を変える。オーナーが0人になる変更は断る */
    public static function setRole(App $app, string $id, string $role): array
    {
        if (!in_array($role, self::ROLES, true)) {
            throw new \InvalidArgumentException('役割は ' . implode(' / ', self::ROLES) . ' のどれかです');
        }
        $m = self::get($app, $id);
        if (!$m) {
            throw new \InvalidArgumentException('運営メンバーが見つかりません');
        }
        if ($m['role'] === 'owner' && $role !== 'owner' && self::owners($app) <= 1) {
            throw new \InvalidArgumentException('オーナーが1人もいなくなるため、変えられません（先に、ほかの人をオーナーにしてください）');
        }
        $app->db()->exec('UPDATE hub_admins SET role = ?, updated_at = ? WHERE id = ?', [$role, $app->now(), $id]);
        return ['ok' => true];
    }

    /** 運営メンバーから外す（アカウントごと消す。ログイン中の画面も、次の操作で締め出される）。最後のオーナーは外せない */
    public static function remove(App $app, string $id): array
    {
        $m = self::get($app, $id);
        if (!$m) {
            throw new \InvalidArgumentException('運営メンバーが見つかりません');
        }
        if ($m['role'] === 'owner' && self::owners($app) <= 1) {
            throw new \InvalidArgumentException('最後のオーナーは外せません（先に、ほかの人をオーナーにしてください）');
        }
        $app->db()->exec('DELETE FROM hub_admins WHERE id = ?', [$id]); // ログインの状態・回復コードも一緒に消える
        return ['ok' => true];
    }

    /** 仮パスワードを作り直す（パスワードを忘れた人のため）。ログイン中の画面からも締め出す。二段階認証はそのまま */
    public static function resetPassword(App $app, string $id): array
    {
        if (!self::get($app, $id)) {
            throw new \InvalidArgumentException('運営メンバーが見つかりません');
        }
        $temp = Password::generateTemp();
        $app->db()->exec(
            'UPDATE hub_admins SET password_hash = ?, must_change_password = 1, failed_logins = 0, locked_until = NULL, updated_at = ? WHERE id = ?',
            [$app->password()->hash($temp), $app->now(), $id]
        );
        $app->db()->exec('DELETE FROM hub_sessions WHERE admin_id = ?', [$id]);
        return ['ok' => true, 'tempPassword' => $temp];
    }
}
