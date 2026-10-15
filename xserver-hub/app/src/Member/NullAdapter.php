<?php
declare(strict_types=1);

namespace Hub\Member;

use Hub\Kernel\App;
use Hub\Line\Env;

/** 会員連携なし（既定）。会員サイトを持たない団体はこれで動く */
final class NullAdapter implements Adapter
{
    public function name(): string
    {
        return 'none';
    }

    public function plans(App $app): array
    {
        return [];
    }

    public function onText(App $app, string $userId, string $text, Env $env): array
    {
        return ['handled' => false];
    }

    public function refreshMember(App $app, string $userId): void
    {
    }

    public function refreshAll(App $app): void
    {
    }

    public function resolveZoomParticipant(App $app, ?string $email, ?string $name): ?string
    {
        return null;
    }

    public function onAccountLink(App $app, string $userId, array $link): void
    {
    }

    public function tick(App $app): array
    {
        return [];
    }
}
