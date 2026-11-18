<?php
declare(strict_types=1);

namespace Hub\Member;

use Hub\Kernel\App;
use Hub\Line\Env;

/**
 * 「LINE の友だち」と「会員サイトの会員」をつなぐ差し替え口（line-hub のアダプター）。
 *   NullAdapter … 会員サイトなし（既定）
 *   SiteAdapter … 会員サイトあり（設定 member.enabled）。連携コード・会員の情報・会員サイトへの知らせ
 */
interface Adapter
{
    /** 管理画面に見せる名前（'none' / 'genie'。'genie' のとき、画面に会員の絞り込みが出る） */
    public function name(): string;

    /** @return list<array{code:string,name:string,rank:int}> 会員プランの一覧 */
    public function plans(App $app): array;

    /**
     * ルールより先に処理する文字（連携コードなど）。
     * @return array{handled:bool,replies?:list<mixed>,tagsAdd?:list<string>}
     */
    public function onText(App $app, string $userId, string $text, Env $env): array;

    /** 1人分の会員情報（member_ref・member_plan・member_rank）を台帳に反映する */
    public function refreshMember(App $app, string $userId): void;

    /** 全員分（一斉配信の宛先を決める前） */
    public function refreshAll(App $app): void;

    /** Zoom の参加者を、会員の情報から LINE の友だちに結びつける（できなければ null） */
    public function resolveZoomParticipant(App $app, ?string $email, ?string $name): ?string;

    /** LINE 公式のアカウント連携（accountLink イベント）。いまは使っていない（将来のため） */
    public function onAccountLink(App $app, string $userId, array $link): void;

    /** 毎分：会員サイトへの知らせを届ける */
    public function tick(App $app): array;
}
