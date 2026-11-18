# 授業ライブを自分のPCで試すための簡易サーバー（キャッシュ無効＝更新がすぐ反映される）
# 使い方: python3 lesson-live/serve.py [ポート]   例: python3 lesson-live/serve.py 8794
import http.server, socketserver, sys, os

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8794

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        super().end_headers()
    def log_message(self, *a):
        pass

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('127.0.0.1', PORT), H) as httpd:
    print(f'授業ライブ: 先生 http://127.0.0.1:{PORT}/teacher.html ／ 生徒 http://127.0.0.1:{PORT}/index.html')
    httpd.serve_forever()
