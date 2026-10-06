#!/usr/bin/env python3
"""ビルド：src/*.js と page.html を1枚のHTMLにまとめる。
  dist/artifact.html   … Artifactに公開する本体（<title>から始まる断片）
  dist/standalone.html … 手元テスト用（doctype付きで包んだもの）
日本語ドットフォント(DotGothic16, OFL)は、使う文字だけ切り出して埋め込む。"""
import base64, io, os, sys, re

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
DIST = os.path.join(ROOT, 'dist')
ORDER = ['core', 'chars', 'sim', 'ai', 'art', 'render', 'stages', 'input', 'audio', 'rollback', 'net', 'scenes', 'main']
VENDOR = ['vendor/peerjs.min']   # 外部ライブラリ（PeerJS, MIT）。別の<script>として先に読み込む


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def build_font(text):
    from fontTools import subset
    from fontTools.ttLib import TTFont
    chars = set(ch for ch in text if ord(ch) > 127)
    chars |= set(chr(c) for c in range(0x20, 0x7f))
    chars |= set(chr(c) for c in range(0x3040, 0x3100))          # ひらがな・カタカナ
    chars |= set('←↑→↓・…ー〜～！？（）：＋／「」、。＝×')
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    opts.notdef_outline = True
    font = TTFont(os.path.join(DIST, 'DotGothic16-Regular.ttf'))
    sub = subset.Subsetter(opts)
    sub.populate(text=''.join(sorted(chars)))
    sub.subset(font)
    buf = io.BytesIO()
    font.flavor = 'woff2'
    font.save(buf)
    return base64.b64encode(buf.getvalue()).decode('ascii'), len(chars)


def main():
    js_parts = [read(os.path.join(SRC, n + '.js')) for n in ORDER]
    vendor = '\n'.join(read(os.path.join(SRC, n + '.js')) for n in VENDOR)
    page = read(os.path.join(SRC, 'page.html'))
    all_text = page + '\n'.join(js_parts)
    b64, n = build_font(all_text)
    js = '\n'.join(js_parts)
    assert '</script>' not in js and '</script>' not in vendor, '</script> がJS内にあります'
    frag = page.replace('/*FONT_DATA*/', 'url(data:font/woff2;base64,%s) format("woff2")' % b64)
    frag = frag.replace('<!--SCRIPTS-->', '<script>\n' + vendor + '\n</script>\n<script>\n' + js + '\n</script>')
    with open(os.path.join(DIST, 'artifact.html'), 'w', encoding='utf-8') as f:
        f.write(frag)
    wrap = ('<!doctype html>\n<html lang="ja"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}'
            'body{margin:0;font:14px system-ui,sans-serif;background:#f7f7f5;color:#111}img{max-width:100%}[hidden]{display:none!important}</style>'
            '</head><body>\n' + frag + '\n</body></html>\n')
    with open(os.path.join(DIST, 'standalone.html'), 'w', encoding='utf-8') as f:
        f.write(wrap)
    # そのままWebに置ける形（GitHub Pages など）
    site = os.path.join(DIST, 'site')
    os.makedirs(site, exist_ok=True)
    page_site = ('<!doctype html>\n<html lang="ja"><head><meta charset="utf-8">'
                 '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
                 '<meta name="description" content="パーツが宙に浮いたロボ8体で戦う、ファミコン風の格闘ゲーム。ひとりでも、2人でも、ネットでも。">'
                 '<link rel="icon" href="data:,">'
                 '<style>:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}'
                 'body{margin:0}[hidden]{display:none!important}</style></head><body>\n' + frag + '\n</body></html>\n')
    with open(os.path.join(site, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(page_site)
    lic = ['きょうだいメカバトル — 同梱している外部ソフトウェア・フォントのライセンス', '']
    lic += ['== PeerJS (MIT License) ==', read(os.path.join(SRC, 'vendor', 'peerjs.LICENSE.txt')), '']
    ofl = os.path.join(DIST, 'OFL.txt')
    if os.path.exists(ofl):
        lic += ['== DotGothic16 (SIL Open Font License 1.1) — 使う文字だけを切り出して埋め込んでいます ==', read(ofl)]
    with open(os.path.join(site, 'LICENSES.txt'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(lic))
    print('glyphs=%d  font(b64)=%dKB  artifact=%dKB' % (n, len(b64) // 1024, os.path.getsize(os.path.join(DIST, 'artifact.html')) // 1024))


if __name__ == '__main__':
    main()
