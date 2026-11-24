#!/usr/bin/env python3
"""サンプルの資料 PDF（4つ）を作り、js/sample-pdfs.js に base64 で書き出す。
   使い方：  python3 tools/make-sample-pdfs.py
   必要なもの：reportlab（pip install reportlab）と、日本語の TrueType フォント（IPAゴシック ipag.ttf など）
   中身はすべて「サンプル（仮）」。本番の資料は、管理画面の「資料（PDF）」から入れる。 """
import base64
import io
import os
import sys

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_CANDIDATES = [
    '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf',
    '/usr/share/fonts/truetype/fonts-japanese-gothic.ttf',
    os.path.expanduser('~/Library/Fonts/ipag.ttf'),
]
font_path = next((p for p in FONT_CANDIDATES if os.path.exists(p)), None)
if not font_path:
    sys.exit('日本語の TrueType フォント（IPAゴシック ipag.ttf）が見つかりません')
pdfmetrics.registerFont(TTFont('JP', font_path))

W, H = A4
INK = colors.HexColor('#13265a')
GOLD = colors.HexColor('#b8913a')
GRAY = colors.HexColor('#5b6577')
LINE = colors.HexColor('#d9d4c4')
TITLE = '第109回 全国算数・数学教育研究（佐賀）大会'


def frame(c, page_title, page_no):
    c.setFillColor(INK)
    c.rect(0, H - 28 * mm, W, 28 * mm, stroke=0, fill=1)
    c.setFillColor(GOLD)
    c.rect(0, H - 29.2 * mm, W, 1.2 * mm, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont('JP', 9)
    c.drawString(18 * mm, H - 11 * mm, '公益社団法人 日本数学教育学会')
    c.setFont('JP', 15)
    c.drawString(18 * mm, H - 20 * mm, TITLE)
    c.setFillColor(GOLD)
    c.setFont('JP', 10)
    c.drawRightString(W - 18 * mm, H - 20 * mm, page_title)
    # すかし
    c.saveState()
    c.setFillColor(colors.HexColor('#c0392b'))
    c.setFillAlpha(0.08)
    c.setFont('JP', 72)
    c.translate(W / 2, H / 2)
    c.rotate(30)
    c.drawCentredString(0, 0, 'サンプル（仮）')
    c.restoreState()
    c.setFillColor(GRAY)
    c.setFont('JP', 8)
    c.drawString(18 * mm, 12 * mm, 'この資料はシステムのサンプルです。日程・会場・金額などはすべて仮のものです。')
    c.drawRightString(W - 18 * mm, 12 * mm, f'{page_no}')


class Pen:
    def __init__(self, c, y):
        self.c, self.y = c, y

    def h(self, text, size=13):
        self.y -= 4 * mm
        self.c.setFillColor(INK)
        self.c.rect(18 * mm, self.y - 1.2 * mm, 1.4 * mm, size * 0.42 * mm + 2 * mm, stroke=0, fill=1)
        self.c.setFont('JP', size)
        self.c.drawString(22 * mm, self.y, text)
        self.y -= size * 0.5 * mm + 3 * mm

    def p(self, text, size=10, indent=22, color=colors.black, gap=1.6):
        self.c.setFillColor(color)
        self.c.setFont('JP', size)
        maxw = W - (indent + 18) * mm
        for para in text.split('\n'):
            line = ''
            for ch in para:
                if pdfmetrics.stringWidth(line + ch, 'JP', size) > maxw:
                    self.c.drawString(indent * mm, self.y, line)
                    self.y -= size * 0.35 * mm * gap + 1.2 * mm
                    line = ''
                line += ch
            self.c.drawString(indent * mm, self.y, line)
            self.y -= size * 0.35 * mm * gap + 1.2 * mm

    def table(self, rows, widths, size=9.5, head=True):
        x0 = 22 * mm
        rh = 7.5 * mm
        for i, row in enumerate(rows):
            x = x0
            if head and i == 0:
                self.c.setFillColor(colors.HexColor('#e9eefb'))
                self.c.rect(x0, self.y - rh + 5 * mm, sum(widths) * mm, rh, stroke=0, fill=1)
            for j, cell in enumerate(row):
                self.c.setFillColor(INK if head and i == 0 else colors.black)
                self.c.setFont('JP', size)
                self.c.drawString(x + 2 * mm, self.y, str(cell))
                x += widths[j] * mm
            self.c.setStrokeColor(LINE)
            self.c.setLineWidth(0.5)
            self.c.line(x0, self.y - rh + 5 * mm, x0 + sum(widths) * mm, self.y - rh + 5 * mm)
            self.y -= rh
        self.y -= 2 * mm


def info1():
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4, pageCompression=1)
    c.setTitle('第1次案内（開催要項）サンプル')
    frame(c, '第1次案内（開催要項）', 1)
    pen = Pen(c, H - 42 * mm)
    pen.h('1　大会主題')
    pen.p('数学的に考え、未来を拓く子どもの育成\n― 問いが生まれ、問いがつながる授業 ―', size=12)
    pen.h('2　主催など')
    pen.p('主催：公益社団法人 日本数学教育学会\n主管：第109回大会 佐賀大会実行委員会（仮）\n後援：（調整中）')
    pen.h('3　期日（仮）')
    pen.table([
        ['日', '内容'],
        ['8月3日（火）', '講習会 1日目'],
        ['8月4日（水）', '講習会 2日目／研究協議会'],
        ['8月5日（木）', '研究大会 1日目（開会式・基調講演・分科会・情報交換会）'],
        ['8月6日（金）', '研究大会 2日目（分科会・部会別まとめ・閉会）'],
    ], [34, 120])
    pen.h('4　会場（仮）')
    pen.p('中学校部会・高等学校部会：佐賀県立致遠館中学校・高等学校（会場校）\n全体会・小学校部会・高専・大学部会：佐賀市内（調整中）')
    pen.h('5　参加費（仮）')
    pen.table([
        ['区分', '金額', '備考'],
        ['会員', '4,000円', ''],
        ['一般（非会員）', '6,000円', ''],
        ['学生', '1,000円', '学生証の提示'],
        ['講習会（1日ごと）', '2,000円', ''],
        ['弁当（1食）', '1,000円', '8/5・8/6'],
        ['情報交換会', '7,000円', '8/5 夜'],
    ], [50, 34, 70])
    c.showPage()
    frame(c, '第1次案内（開催要項）', 2)
    pen = Pen(c, H - 42 * mm)
    pen.h('6　参加申込')
    pen.p('大会ホームページの「参加申込」から申し込んでください。\n申込が終わると、受付番号と本人用のQRコードが出ます。当日は、このQRコードで受付をします。\n申込期間（仮）：2026年10月1日（木）〜 2027年6月30日（水）')
    pen.h('7　参加費の支払い')
    pen.p('銀行振込（振込先はマイページに出ます）。振込人名の前に受付番号をつけてください。')
    pen.h('8　研究発表')
    pen.p('研究発表の申込は、参加申込とは別に行います。「研究発表 申込要項」をご覧ください。')
    pen.h('9　ライブ配信')
    pen.p('基調講演と、部会別まとめをライブ配信します（予定）。配信のURLは大会ホームページに掲載します。')
    pen.h('10　問い合わせ')
    pen.p('佐賀大会実行委員会 事務局（サンプル）\nメール：saga-taikai@example.com　電話：0952-00-0000（平日 16:00〜18:00）\n大会ホームページの「問い合わせ」からも送れます。')
    c.showPage()
    c.save()
    return buf.getvalue()


def happyo():
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4, pageCompression=1)
    c.setTitle('研究発表 申込要項 サンプル')
    frame(c, '研究発表 申込要項', 1)
    pen = Pen(c, H - 42 * mm)
    pen.h('1　発表の資格')
    pen.p('日本数学教育学会の会員（共同発表者を含む）。発表は1人1件まで。')
    pen.h('2　申込の方法と締切（仮）')
    pen.p('大会ホームページの参加申込で「発表する」を選んだうえで、発表申込フォームから、題目・要旨（400字）を送ってください。\n締切：2027年3月31日（水）')
    pen.h('3　発表原稿')
    pen.p('A4・2ページ（PDF）。上下左右の余白は20mm、本文は10.5ポイント。\n提出の締切：2027年5月31日（月）（仮）\n提出された原稿は、大会冊子と参加者限定の資料集に載せます。')
    pen.h('4　発表の時間')
    pen.table([['項目', '時間'], ['発表', '20分'], ['質疑・協議', '10分'], ['入れかえ', '5分']], [60, 40])
    pen.h('5　当日の機器')
    pen.p('各教室にプロジェクター・HDMIケーブルを用意します。パソコンはご持参ください。\n無線LANは、会場校のゲスト用回線を用意する予定です。')
    c.showPage()
    c.save()
    return buf.getvalue()


def access():
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4, pageCompression=1)
    c.setTitle('会場案内図 サンプル')
    frame(c, '会場案内図（会場校）', 1)
    pen = Pen(c, H - 42 * mm)
    pen.h('佐賀県立致遠館中学校・高等学校（会場校）の配置（仮）')
    pen.p('この図はサンプルです。実際の建物の配置とは異なります。', color=GRAY)

    def box(x, y, w, h, label, fill='#e9eefb', sub=''):
        c.setFillColor(colors.HexColor(fill))
        c.setStrokeColor(INK)
        c.setLineWidth(1)
        c.roundRect(x * mm, y * mm, w * mm, h * mm, 2 * mm, stroke=1, fill=1)
        c.setFillColor(INK)
        c.setFont('JP', 11)
        c.drawCentredString((x + w / 2) * mm, (y + h / 2) * mm + 1 * mm, label)
        if sub:
            c.setFont('JP', 8)
            c.setFillColor(GRAY)
            c.drawCentredString((x + w / 2) * mm, (y + h / 2) * mm - 4 * mm, sub)

    box(24, 150, 70, 40, '中学棟', sub='中学校部会（2〜3階）')
    box(110, 150, 76, 40, '高校棟', sub='高等学校部会・エレベーターあり')
    box(24, 95, 70, 40, '体育館', '#f6efd9', sub='（使いません）')
    box(110, 95, 76, 34, '受付（昇降口前）', '#fde8d0', sub='QRコードで受付')
    box(110, 60, 76, 22, 'バス乗り場', '#e3f3f4', sub='佐賀駅⇔会場校')
    c.setStrokeColor(GOLD)
    c.setLineWidth(2)
    c.setDash(4, 3)
    c.line(148 * mm, 82 * mm, 148 * mm, 95 * mm)
    c.line(148 * mm, 129 * mm, 148 * mm, 150 * mm)
    c.line(110 * mm, 112 * mm, 94 * mm, 160 * mm)
    c.setDash()
    c.setFillColor(INK)
    c.setFont('JP', 10)
    c.drawString(24 * mm, 70 * mm, '正門 →')
    pen.y = 50 * mm
    pen.p('・会場校に参加者用の駐車場はありません。\n・受付は昇降口前です。本人用のQRコードをご用意ください。')
    c.showPage()
    c.save()
    return buf.getvalue()


def member():
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4, pageCompression=1)
    c.setTitle('分科会 発表資料集（参加者限定）サンプル')
    frame(c, '分科会 発表資料集（参加者限定）', 1)
    pen = Pen(c, H - 42 * mm)
    pen.p('この資料は、参加者のマイページからだけ見られる「参加者限定」の資料のサンプルです。', color=GRAY)
    pen.h('中学校部会')
    pen.p('第1分科会（数と式）\n　文字式の意味を「説明する」活動を軸にした単元構成 ほか\n第2分科会（図形）\n　証明の「書き出し」でつまずく生徒への手立て ほか\n第3分科会（関数）／第4分科会（データの活用）')
    pen.h('高等学校部会')
    pen.p('第1分科会（数学Ⅰ・Aの授業づくり）\n　二次関数の最大・最小を、問いの連鎖で組み立てる ほか\n第2分科会（探究・課題研究）／第3分科会（評価とICT活用）')
    pen.p('（本番では、ここに各発表の原稿が入ります）', color=GRAY)
    c.showPage()
    c.save()
    return buf.getvalue()


pdfs = {'doc-info1': info1(), 'doc-happyo': happyo(), 'doc-access': access(), 'doc-member': member()}
lines = ['/* サンプルの資料 PDF（tools/make-sample-pdfs.py で作る。手で直さない） */', 'window.T = window.T || {};', 'T.SAMPLE_PDFS = {']
for k, v in pdfs.items():
    lines.append(f"  '{k}': '{base64.b64encode(v).decode()}',")
    print(f'{k}: {len(v) // 1024} KB')
lines.append('};')
with open(os.path.join(ROOT, 'js', 'sample-pdfs.js'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')
print('書き出した：js/sample-pdfs.js')
