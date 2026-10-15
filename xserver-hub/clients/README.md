# clients：会員サイト側の見本

会員サイトのサーバーから、ハブの「会員サイト連携 API」を呼ぶための道具です。説明は [docs/06_会員サイト連携API.md](../docs/06_会員サイト連携API.md)。

| ファイル | 動くところ | 中身 |
|---|---|---|
| `js/hub-client.mjs` | Supabase Edge Functions（Deno）・Node.js 18 以上・Cloudflare Workers | `createHubClient()`（連携コード・会員の情報・通知・解除・退会）、`verifyHubWebhook()`（ハブからの知らせを確かめる） |
| `php/HubClient.php` | PHP 8.1 以上（curl） | 同じもの（`HubClient::verifyWebhook()`） |

- **秘密は、会員サイトのサーバーの中だけ**（環境変数・Secrets）。ブラウザ・アプリに入れない
- どちらも、1ファイルをコピーして使えます（ほかのライブラリは要らない）
- ハブのテスト（`tests/ClientsTest.php`）が、ハブと同じ署名になることを確かめています
