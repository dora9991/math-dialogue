<?php
declare(strict_types=1);

namespace Hub\Line;

/**
 * 1つのイベント（友だちの操作）を処理する間の入れ物（line-hub の makeEnv）。
 *   ・replyBuffer：返信（無料）で返すメッセージをためる。同じイベントの分は、最後にまとめて1回で返す
 *   ・タグ付与→ルール…の連鎖では depth だけ増やし、replyBuffer と vars は同じものを使う（child）
 */
final class Env
{
    public ReplyBuffer $replyBuffer;
    /** @var array<string,mixed> 差し込み（{{display_name}} など） */
    public array $vars = [];
    public ?string $replySource = null;

    public function __construct(public string $userId, public ?string $replyToken = null, array $vars = [], public int $depth = 0)
    {
        $this->vars = $vars;
        $this->replyBuffer = new ReplyBuffer();
    }

    /** 連鎖の1段深い入れ物（返信のたまり場と差し込みは共有する） */
    public function child(): self
    {
        $c = new self($this->userId, $this->replyToken, [], $this->depth + 1);
        $c->replyBuffer = $this->replyBuffer;
        $c->vars = &$this->vars;
        $c->replySource = $this->replySource;
        return $c;
    }
}
