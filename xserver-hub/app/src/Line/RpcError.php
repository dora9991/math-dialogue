<?php
declare(strict_types=1);

namespace Hub\Line;

/** 管理 API の、画面に返すエラー（code と HTTP の status つき） */
final class RpcError extends \RuntimeException
{
    public function __construct(public readonly string $codeName, string $message, public readonly int $status = 400)
    {
        parent::__construct($message);
    }
}
