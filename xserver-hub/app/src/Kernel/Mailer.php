<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * メール（運営への知らせ・毎日の報告）。Xserver の PHP の mail()（サーバーの sendmail）で送る。
 *   ・差出人（alert.from）は、そのサーバーのドメインのアドレスにする（迷惑メールに入りにくい）
 *   ・本文に個人の情報（トークの中身など）は入れない。件数・状態・どこを見ればよいか、だけ
 */
final class Mailer
{
    /** @var list<array{to:string,subject:string,body:string}> テスト用（送らずに、ここへためる） */
    public array $sent = [];

    public function __construct(private string $from, private bool $dryRun = false)
    {
    }

    public function send(string $to, string $subject, string $body): bool
    {
        $to = trim($to);
        if ($to === '' || preg_match('/[\r\n]/', $to . $subject . $this->from)) {
            return false; // 宛先が無い・ヘッダーに改行（ヘッダーの差し込み）
        }
        if ($this->dryRun) {
            $this->sent[] = ['to' => $to, 'subject' => $subject, 'body' => $body];
            return true;
        }
        $headers = [
            'From' => $this->from,
            'MIME-Version' => '1.0',
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Content-Transfer-Encoding' => 'base64',
            'X-Mailer' => 'hub',
        ];
        $subj = mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n");
        // 差出人の封筒（-f）は、メールアドレスの形のときだけ付ける（mail() が内部で escapeshellcmd する）
        $params = filter_var($this->from, FILTER_VALIDATE_EMAIL) ? '-f' . $this->from : '';
        return @mail($to, $subj, chunk_split(base64_encode($body)), $headers, $params);
    }
}
