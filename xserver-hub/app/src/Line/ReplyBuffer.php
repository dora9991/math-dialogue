<?php
declare(strict_types=1);

namespace Hub\Line;

/** 返信でまとめて返すメッセージのたまり場（共有できるよう、配列ではなくオブジェクトにしている） */
final class ReplyBuffer
{
    /** @var list<array> */
    public array $items = [];

    public function push(array ...$msgs): void
    {
        foreach ($msgs as $m) {
            $this->items[] = $m;
        }
    }

    /** @return list<array> 全部取り出して、空にする */
    public function take(): array
    {
        $out = $this->items;
        $this->items = [];
        return $out;
    }

    public function count(): int
    {
        return count($this->items);
    }

    public function clear(): void
    {
        $this->items = [];
    }
}
