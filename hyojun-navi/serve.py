# 授業ナビ 標準版の簡易サーバー（キャッシュ無効・自分のPCだけで使う）。
# 使い方: python3 hyojun-navi/serve.py [ポート]
# /api/ws/<名前> で、編集したワークシート・演習プリント・小テストを worksheets/<名前>.json に保存・読み込み・削除する。
import http.server, socketserver, sys, os, re, json, urllib.parse
from datetime import datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8811
WS_DIR = os.path.join(ROOT, 'worksheets')
WS_ID = re.compile(r'^/api/ws/([a-z]+-\d{2})$')
WS_MAX = 8 * 1024 * 1024  # 画像入りでも十分な大きさ

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()
    def send_json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def api_allowed(self):
        # 自分のPCのページからだけ受け付ける（他のサイトからの書き込みを防ぐため、専用ヘッダーも必須）
        host = (self.headers.get('Host') or '').rsplit(':', 1)[0]
        return host in ('127.0.0.1', 'localhost', '[::1]') and self.headers.get('X-Hyojun-Navi') == '1'
    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path == '/api/ws' or WS_ID.match(path):
            if not self.api_allowed(): return self.send_json(403, {'error': 'forbidden'})
            if path == '/api/ws':
                ids = sorted(f[:-5] for f in os.listdir(WS_DIR) if f.endswith('.json')) if os.path.isdir(WS_DIR) else []
                return self.send_json(200, ids)
            p = os.path.join(WS_DIR, WS_ID.match(path).group(1) + '.json')
            if not os.path.isfile(p): return self.send_json(200, None)   # まだ保存していない（null を返す）
            with open(p, encoding='utf-8') as fh:
                return self.send_json(200, json.load(fh))
        super().do_GET()
    def do_PUT(self):
        m = WS_ID.match(urllib.parse.urlparse(self.path).path)
        if not m or not self.api_allowed(): return self.send_json(403, {'error': 'forbidden'})
        n = int(self.headers.get('Content-Length') or 0)
        if n <= 0 or n > WS_MAX: return self.send_json(413, {'error': 'size'})
        try:
            data = json.loads(self.rfile.read(n).decode('utf-8'))
            if not isinstance(data, dict) or not isinstance(data.get('blocks'), list): raise ValueError('blocks')
        except Exception as e:
            return self.send_json(400, {'error': 'bad json: ' + str(e)})
        os.makedirs(WS_DIR, exist_ok=True)
        p = os.path.join(WS_DIR, m.group(1) + '.json')
        with open(p + '.tmp', 'w', encoding='utf-8') as fh:
            json.dump(data, fh, ensure_ascii=False, indent=1)
        os.replace(p + '.tmp', p)
        return self.send_json(200, {'ok': True, 'saved': datetime.now().isoformat(timespec='seconds')})
    def do_DELETE(self):
        m = WS_ID.match(urllib.parse.urlparse(self.path).path)
        if not m or not self.api_allowed(): return self.send_json(403, {'error': 'forbidden'})
        p = os.path.join(WS_DIR, m.group(1) + '.json')
        if os.path.isfile(p): os.remove(p)
        return self.send_json(200, {'ok': True})
    def log_message(self, *a):
        pass

socketserver.ThreadingTCPServer.allow_reuse_address = True
socketserver.ThreadingTCPServer.daemon_threads = True
with socketserver.ThreadingTCPServer(('127.0.0.1', PORT), H) as httpd:
    print(f'授業ナビ 標準版: http://127.0.0.1:{PORT}/')
    httpd.serve_forever()
