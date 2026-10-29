#!/usr/bin/env python3
"""クラス替えシート（Excel）を作るスクリプト.

使い方:
    python3 kurasugae/make_kurasugae.py            （LibreOffice があれば計算済みの値も保存）
    python3 kurasugae/make_kurasugae.py --no-values

出力（このファイルと同じフォルダ）:
    クラス替えシート.xlsx               … 空の名簿（実際に使う方）
    クラス替えシート_サンプル入り.xlsx  … 架空の105人入り（動きを見る用）
    クラス替えマクロ.bas                … Excel に取り込むマクロ（Shift_JIS / CRLF）

シートの作り
    ①名簿入力   … 名簿を貼り付け、点数などを入れる。U列に「自動案」（数式）が出る
    ②クラス編成 … 自動案を「値」で貼り付ける決定欄。組の数字は直接書き換えOK
    ③クラス一覧 … 3クラスを横に並べて表示。分けたい人が同じ組なら赤
    使い方 / 設定 / 入替履歴
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile
import warnings
import zipfile
from decimal import Decimal, ROUND_HALF_UP
from xml.sax.saxutils import escape
import random

from openpyxl import Workbook
from openpyxl.formatting.rule import CellIsRule, DataBarRule, FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter as CL
from openpyxl.workbook.properties import CalcProperties
from openpyxl.worksheet.datavalidation import DataValidation

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- 定数
SH1, SH2, SH3 = "①名簿入力", "②クラス編成", "③クラス一覧"
SH_HOW, SH_SET, SH_LOG = "使い方", "設定", "入替履歴"
R = f"'{SH1}'!"
E = f"'{SH2}'!"
V = f"'{SH3}'!"
S = f"'{SH_SET}'!"
SH_CALC = "計算"
C = f"'{SH_CALC}'!"

R_FIRST, R_LAST = 4, 153       # ① データ行（150人分）
E_FIRST, E_LAST = 9, 158       # ② データ行
V_FIRST, V_LAST = 17, 66       # ③ 名前が並ぶ行（1クラス50人まで）
NCLS = 3

# 設定シートの「自動で計算」欄の行（数式・マクロから参照する）
SET_TOP, SET_LOW, SET_MEAN, SET_SD = 35, 36, 37, 38
SET_N, SET_DONE, SET_UNASSIGNED, SET_DUP, SET_NOTIN, SET_BADCLS, SET_PROBLEMS = 39, 40, 41, 42, 43, 44, 45
SET_OLD_FIRST = 48             # 旧クラスの一覧（6つ）
OLD_MIX = 0.25                 # 自動案で旧クラスを混ぜる強さ（成績のそろい方とのかね合い）
RUN_MIX = 0.5                  # 自動案で50m走（男女別）をそろえる強さ

FONT = "Meiryo UI"

CLASS_DARK = {1: "2F75B5", 2: "548235", 3: "C55A11"}
CLASS_LIGHT = {1: "DDEBF7", 2: "E2EFDA", 3: "FCE4D6"}
FLAG_FILL = {"piano": "E4DFEC", "mood": "FFF2CC", "caution": "F8CBAD", "absent": "D9D9D9"}
RED_FILL, RED_FONT = "FFC7CE", "9C0006"
ORANGE_FILL = "FFD966"
MOVED_FILL = "FFFF99"
INPUT_FILL = "FFFFFF"
CALC_FILL = "F2F2F2"
HEAD_FILL = "D9E1F2"
EXAMPLE_FILL = "EDEDED"

THIN = Side(style="thin", color="BFBFBF")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def fill(color):
    return PatternFill(start_color=color, end_color=color, fill_type="solid")


def font(size=10, bold=False, color="000000", italic=False):
    return Font(name=FONT, size=size, bold=bold, color=color, italic=italic)


def style_range(ws, ref, *, f=None, fl=None, al=None, border=True):
    for row in ws[ref]:
        for c in row:
            if f is not None:
                c.font = f
            if fl is not None:
                c.fill = fl
            if al is not None:
                c.alignment = al
            if border:
                c.border = BORDER


CENTER = Alignment(horizontal="center", vertical="center")
LEFT = Alignment(horizontal="left", vertical="center")
WRAP = Alignment(horizontal="left", vertical="center", wrap_text=True)
SHRINK = Alignment(horizontal="left", vertical="center", shrink_to_fit=True)
CENTER_WRAP = Alignment(horizontal="center", vertical="center", wrap_text=True)


def is_yes(v):
    return v in ("〇", "○", "◯")


# ================================================================ ①名簿入力
# 列: A番号 B旧クラス C氏名 D ふりがな E性別 F-J 5教科 K 5教科平均 L 50m
#     M ピアノ N ムードメーカー O 注意 P 休みがち Q-S 分けたい人 T 備考
#     U 自動案 V 決定（②の組） W-AJ 計算用（隠し列）
ROSTER_HEAD = [
    ("A", "番号", 7.5), ("B", "旧\nクラス", 6.5), ("C", "氏名", 13), ("D", "ふりがな", 15),
    ("E", "性別", 5), ("F", "国語", 5.5), ("G", "数学", 5.5), ("H", "英語", 5.5),
    ("I", "理科", 5.5), ("J", "社会", 5.5), ("K", "5教科\n平均", 6.5), ("L", "50m走\n(秒)", 6.5),
    ("M", "ピアノ", 6.5), ("N", "ムード\nメーカー", 8), ("O", "注意", 5.5), ("P", "休み\nがち", 5.5),
    ("Q", "分けたい人①", 15), ("R", "分けたい人②", 15), ("S", "分けたい人③", 15),
    ("T", "備考", 24), ("U", "自動案\n(組)", 7.5), ("V", "決定\n(②の組)", 8.5),
]
ROSTER_HELP = [
    ("W", "選択肢"), ("X", "性別ｺｰﾄﾞ"), ("Y", "ピアノ01"), ("Z", "ムード01"), ("AA", "注意01"),
    ("AB", "休み01"), ("AC", "区分"), ("AD", "平均(補完)"), ("AE", "並びキー"), ("AF", "並び順"),
    ("AG", "分けたいID①"), ("AH", "分けたいID②"), ("AI", "分けたいID③"), ("AJ", "旧クラス番号"),
    ("AK", "50m二乗"), ("AL", "50m z"),
]


def build_roster(ws, students):
    ws.sheet_properties.tabColor = "4472C4"
    ws["A1"] = "① 名簿入力"
    ws["A1"].font = font(14, True, "1F3864")
    ws["D1"] = ("4行目から名簿を貼り付け（白い欄＝入力／灰色＝自動計算）。"
                "〇・性別・分けたい人はリストから選べます。U列に「自動案」が出ます → ②へ")
    ws["D1"].font = font(10, False, "404040")
    ws.row_dimensions[1].height = 24
    ws.row_dimensions[2].height = 40

    for col, name, width in ROSTER_HEAD:
        c = ws[f"{col}2"]
        c.value = name
        ws.column_dimensions[col].width = width
    for col, name in ROSTER_HELP:
        ws[f"{col}2"] = name
        ws.column_dimensions[col].width = 9
    style_range(ws, "A2:AL2", f=font(10, True), fl=fill(HEAD_FILL), al=CENTER_WRAP)
    style_range(ws, "U2:V2", f=font(10, True, "FFFFFF"), fl=fill("1F3864"), al=CENTER_WRAP)
    style_range(ws, "W2:AL2", f=font(8, False, "7F7F7F"), fl=fill(CALC_FILL), al=CENTER_WRAP)

    # 3行目：記入例（計算には入らない）
    example = ["2101", 1, "佐賀　太郎", "さが　たろう", "男", 72, 65, 80, 58, 70, "(自動)", 7.8,
               "〇", "〇", "", "", "2105 山田　花子", "", "", "← 記入例（この行は計算に入りません）",
               "(自動)", "(自動)"]
    for i, v in enumerate(example):
        c = ws.cell(row=3, column=i + 1, value=v)
        c.font = font(9, False, "7F7F7F", italic=True)
        c.fill = fill(EXAMPLE_FILL)
        c.border = BORDER
        c.alignment = CENTER if i not in (2, 3, 16, 19) else LEFT

    rows = range(R_FIRST, R_LAST + 1)
    for r in rows:
        f = {}
        f["K"] = f'=IF(COUNT(F{r}:J{r})=0,"",ROUND(AVERAGE(F{r}:J{r}),1))'
        f["U"] = f'=IF(A{r}="","",INDEX({C}$Z$2:$Z$151,AF{r}))'
        f["V"] = (f'=IF(A{r}="","",IFERROR(IF(INDEX({E}$E$9:$E$158,MATCH(A{r},{E}$D$9:$D$158,0))="","未",'
                  f'INDEX({E}$E$9:$E$158,MATCH(A{r},{E}$D$9:$D$158,0))),"未"))')
        f["W"] = f'=IF(A{r}="","",A{r}&" "&C{r})'
        f["X"] = f'=IF(A{r}="","",IF(E{r}="男",1,IF(E{r}="女",2,3)))'
        for col, src in (("Y", "M"), ("Z", "N"), ("AA", "O"), ("AB", "P")):
            f[col] = f'=IF(OR({src}{r}="〇",{src}{r}="○",{src}{r}="◯"),1,0)'
        f["AC"] = f'=IF(A{r}="","",IF(AA{r}=1,1,IF(Y{r}=1,2,IF(Z{r}=1,3,IF(AB{r}=1,4,5)))))'
        f["AD"] = f'=IF(A{r}="","",IF(K{r}="",{S}$C${SET_MEAN},K{r}))'
        # 並びキー：区分（注意→ピアノ→ムード→休み→その他）、その中で平均から遠い人ほど先
        f["AE"] = (f'=IF(A{r}="","",AC{r}*10000000'
                   f'-ROUND(ABS((AD{r}-{S}$C${SET_MEAN})/{S}$C${SET_SD})*10000,0))')
        f["AF"] = (f'=IF(A{r}="","",COUNTIF($AE$4:$AE$153,"<"&AE{r})'
                   f'+COUNTIFS($AE$4:$AE$153,AE{r},$A$4:$A$153,"<"&A{r})+1)')
        for col, src in (("AG", "Q"), ("AH", "R"), ("AI", "S")):
            f[col] = (f'=IF({src}{r}="","",IFERROR(VALUE(LEFT({src}{r},FIND(" ",{src}{r}&" ")-1)),'
                      f'IFERROR(INDEX($A$4:$A$153,MATCH({src}{r},$C$4:$C$153,0)),"")))')
        f["AJ"] = (f'=IF(OR(A{r}="",B{r}=""),"",IF(COUNTIFS($B$4:B{r},B{r},$A$4:A{r},"<>")=1,'
                   f'MAX($AJ$3:AJ{r - 1})+1,""))')
        f["AK"] = f'=IF(OR(A{r}="",NOT(ISNUMBER(L{r}))),"",L{r}^2)'
        f["AL"] = (f'=IF(OR(A{r}="",NOT(ISNUMBER(L{r}))),0,'
                   f'(L{r}-INDEX({C}$AE$7:$AG$7,X{r}))/INDEX({C}$AE$8:$AG$8,X{r}))')
        for col, formula in f.items():
            ws[f"{col}{r}"] = formula

        for col, _, _ in ROSTER_HEAD:
            c = ws[f"{col}{r}"]
            c.border = BORDER
            c.font = font(10)
            if col in ("K", "U", "V"):
                c.fill = fill(CALC_FILL)
            if col in ("C", "D", "Q", "R", "S", "T"):
                c.alignment = SHRINK if col in ("Q", "R", "S") else LEFT
            else:
                c.alignment = CENTER
        ws[f"K{r}"].number_format = "0.0"
        ws[f"L{r}"].number_format = "0.0"
        for col, _ in ROSTER_HELP:
            ws[f"{col}{r}"].font = font(8, False, "7F7F7F")

    # サンプルの名簿を書き込む
    for i, st in enumerate(students):
        r = R_FIRST + i
        vals = [st["id"], st["old"], st["name"], st["kana"], st["sex"], *st["scores"], None,
                st["run"], st["piano"], st["mood"], st["caution"], st["absent"],
                st["sep"][0], st["sep"][1], st["sep"][2], st["note"]]
        for j, v in enumerate(vals):
            if j == 10 or v in (None, ""):
                continue
            ws.cell(row=r, column=j + 1, value=v)

    # 入力リスト
    dv_sex = DataValidation(type="list", formula1='"男,女"', allow_blank=True)
    dv_piano = DataValidation(type="list", formula1='"〇,×"', allow_blank=True)
    dv_flag = DataValidation(type="list", formula1='"〇"', allow_blank=True)
    dv_sep = DataValidation(type="list", formula1="=$W$4:$W$153", allow_blank=True,
                            showErrorMessage=False)
    dv_sep.promptTitle = "分けたい人"
    dv_sep.prompt = "リストから「番号 氏名」を選ぶか、番号だけ入力してください。"
    dv_sep.showInputMessage = True
    for dv, ref in ((dv_sex, "E4:E153"), (dv_piano, "M4:M153"), (dv_flag, "N4:P153"),
                    (dv_sep, "Q4:S153")):
        ws.add_data_validation(dv)
        dv.add(ref)

    cf = ws.conditional_formatting
    # 番号の重複・数字でない
    cf.add("A4:A153", FormulaRule(formula=['AND($A4<>"",COUNTIF($A$4:$A$153,$A4)>1)'],
                                  fill=fill(RED_FILL), font=Font(color=RED_FONT, bold=True)))
    cf.add("A4:A153", FormulaRule(formula=['AND($A4<>"",NOT(ISNUMBER($A4)))'], fill=fill(ORANGE_FILL)))
    # 分けたい人が名簿にいない・自分自身
    cf.add("Q4:S153", FormulaRule(
        formula=['AND(Q4<>"",OR(AG4="",ISNA(MATCH(AG4,$A$4:$A$153,0)),AG4=$A4))'],
        fill=fill(ORANGE_FILL)))
    # 組の色
    for k in range(1, NCLS + 1):
        cf.add("U4:V153", CellIsRule(operator="equal", formula=[str(k)], fill=fill(CLASS_LIGHT[k])))
    cf.add("V4:V153", CellIsRule(operator="equal", formula=['"未"'], font=Font(color="C00000", bold=True)))
    # 〇の色
    for col, key in (("M", "piano"), ("N", "mood"), ("O", "caution"), ("P", "absent")):
        cf.add(f"{col}4:{col}153", FormulaRule(
            formula=[f'OR({col}4="〇",{col}4="○",{col}4="◯")'], fill=fill(FLAG_FILL[key])))
    # 性別の文字色
    cf.add("E4:E153", CellIsRule(operator="equal", formula=['"男"'], font=Font(color="1F4E79", bold=True)))
    cf.add("E4:E153", CellIsRule(operator="equal", formula=['"女"'], font=Font(color="C00000", bold=True)))

    ws.column_dimensions.group("W", "AL", hidden=True, outline_level=1)
    ws.freeze_panes = "D3"
    ws.auto_filter.ref = "A2:V153"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_title_rows = "2:2"
    ws.print_area = "A1:V153"


# ================================================================ ②クラス編成
EDIT_HEAD = [
    ("A", "番号", 7.5), ("B", "自動案", 6.5), ("C", "", 2), ("D", "番号", 8), ("E", "組", 5.5),
    ("F", "氏名", 14), ("G", "性別", 5), ("H", "旧クラス", 6), ("I", "5教科\n平均", 6.5),
    ("J", "50m", 6), ("K", "ピアノ", 6), ("L", "ムード", 6), ("M", "注意", 5),
    ("N", "休み\nがち", 5), ("O", "分けたい相手（いまの組）", 26),
    ("P", "⚠ 同じ組にいる分けたい相手", 24), ("Q", "備考", 22),
]
EDIT_HELP = [
    "S:名簿行", "T:分けたいID①", "U:分けたいID②", "V:分けたいID③", "W:相手①の組", "X:相手②の組",
    "Y:相手③の組", "Z:同組①", "AA:同組②", "AB:同組③", "AC:逆キー①", "AD:逆キー②", "AE:逆キー③",
    "AF:逆の件数", "AG:重なり合計", "AH:逆の行①", "AI:逆の行②", "AJ:逆の行③", "AK:同組名(自分から)",
    "AL:同組名(相手から)", "AM:相手①表示", "AN:相手②表示", "AO:相手③表示", "AP:性別ｺｰﾄﾞ",
    "AQ:並びキー", "AR:組内の順", "AS:一覧キー", "AT:国", "AU:数", "AV:英", "AW:理", "AX:社",
]


def build_edit(ws, decided):
    ws.sheet_properties.tabColor = "70AD47"
    ws["A1"] = "② クラス編成（ここが「決定したクラス」です）"
    ws["A1"].font = font(14, True, "375623")
    ws["A2"] = ("手順1：A〜B列（自動案）を選んでコピー → D9 を右クリック →［貼り付けのオプション］の「値」で貼り付け"
                "（マクロを入れた場合は［自動案を貼り付け］ボタンでもOK）")
    ws["A3"] = ("手順2：E列（組）の数字は直接書き換えてOK。入れ替えは③の画面か、ここで2人の行を Ctrl＋クリックして"
                "［選んだ2人を入替］。赤い行＝分けたい人と同じ組")
    for a in ("A2", "A3"):
        ws[a].font = font(10, False, "404040")
    ws.merge_cells("A4:Q4")
    ws["A4"] = STATUS_FORMULA
    ws["A4"].font = font(10, True, "375623")
    ws["A4"].alignment = LEFT
    ws["A5"] = "▼ マクロを入れると、右にボタンが出ます"
    ws["A5"].font = font(8, False, "A6A6A6")
    ws.row_dimensions[5].height = 18
    ws.row_dimensions[6].height = 18

    ws.merge_cells("A7:B7")
    ws["A7"] = "自動案（コピー元）"
    ws.merge_cells("D7:Q7")
    ws["D7"] = "決定欄：D列＝番号・E列＝組 に「値」で貼り付け（E列は直接書き換えOK）"
    style_range(ws, "A7:B7", f=font(9, True, "404040"), fl=fill("D9D9D9"), al=CENTER)
    style_range(ws, "D7:Q7", f=font(9, True, "FFFFFF"), fl=fill("548235"), al=LEFT)
    ws.row_dimensions[8].height = 30
    for col, name, width in EDIT_HEAD:
        ws[f"{col}8"] = name
        ws.column_dimensions[col].width = width
    style_range(ws, "A8:B8", f=font(10, True), fl=fill("D9D9D9"), al=CENTER_WRAP)
    style_range(ws, "D8:Q8", f=font(10, True), fl=fill(HEAD_FILL), al=CENTER_WRAP)
    ws["C8"].border = Border()
    for item in EDIT_HELP:
        col, name = item.split(":")
        ws[f"{col}8"] = name
        ws[f"{col}8"].font = font(8, False, "7F7F7F")
        ws[f"{col}8"].alignment = CENTER_WRAP
        ws.column_dimensions[col].width = 9

    for r in range(E_FIRST, E_LAST + 1):
        rr = r - (E_FIRST - R_FIRST)    # ①の同じ順番の行
        f = {}
        f["A"] = f'=IF({R}A{rr}="","",{R}A{rr})'
        f["B"] = f'=IF(A{r}="","",{R}U{rr})'
        f["S"] = f'=IF(D{r}="","",IFERROR(MATCH(D{r},{R}$A$4:$A$153,0),""))'
        f["F"] = f'=IF(D{r}="","",IF(S{r}="","（名簿にない番号）",INDEX({R}$C$4:$C$153,S{r})&""))'
        f["G"] = f'=IF(S{r}="","",INDEX({R}$E$4:$E$153,S{r})&"")'
        for col, src in (("H", "B"), ("I", "K"), ("J", "L")):
            f[col] = (f'=IF(S{r}="","",IF(INDEX({R}${src}$4:${src}$153,S{r})="","",'
                      f'INDEX({R}${src}$4:${src}$153,S{r})))')
        for col, src in (("K", "Y"), ("L", "Z"), ("M", "AA"), ("N", "AB")):
            f[col] = f'=IF(S{r}="","",IF(INDEX({R}${src}$4:${src}$153,S{r})=1,"〇",""))'
        f["Q"] = f'=IF(S{r}="","",INDEX({R}$T$4:$T$153,S{r})&"")'
        for col, src in (("T", "AG"), ("U", "AH"), ("V", "AI")):
            f[col] = (f'=IF(S{r}="","",IF(INDEX({R}${src}$4:${src}$153,S{r})=D{r},"",'
                      f'INDEX({R}${src}$4:${src}$153,S{r})))')
        for col, src in (("W", "T"), ("X", "U"), ("Y", "V")):
            f[col] = (f'=IF({src}{r}="","",IFERROR(IF(INDEX($E$9:$E$158,MATCH({src}{r},$D$9:$D$158,0))="","",'
                      f'INDEX($E$9:$E$158,MATCH({src}{r},$D$9:$D$158,0))),""))')
        for col, idc, clc in (("Z", "T", "W"), ("AA", "U", "X"), ("AB", "V", "Y")):
            f[col] = f'=IF(AND({idc}{r}<>"",{clc}{r}<>"",E{r}<>""),IF({clc}{r}=E{r},1,0),0)'
        for col, src in (("AC", "T"), ("AD", "U"), ("AE", "V")):
            f[col] = f'=IF(OR({src}{r}="",E{r}=""),"",{src}{r}&"|"&E{r})'
        key = f'D{r}&"|"&E{r}'
        f["AF"] = (f'=IF(OR(D{r}="",E{r}=""),0,COUNTIF($AC$9:$AC$158,{key})'
                   f'+COUNTIF($AD$9:$AD$158,{key})+COUNTIF($AE$9:$AE$158,{key}))')
        f["AG"] = f"=Z{r}+AA{r}+AB{r}+AF{r}"
        for col, src in (("AH", "AC"), ("AI", "AD"), ("AJ", "AE")):
            f[col] = f'=IF(OR(D{r}="",E{r}=""),"",IFERROR(MATCH({key},${src}$9:${src}$158,0),""))'
        name_of = lambda idc: f'IFERROR(INDEX($F$9:$F$158,MATCH({idc}{r},$D$9:$D$158,0)),"")'
        f["AK"] = (f'=IF(Z{r}=1,{name_of("T")}&"、","")&IF(AA{r}=1,{name_of("U")}&"、","")'
                   f'&IF(AB{r}=1,{name_of("V")}&"、","")')

        def rev(rowc, skip):
            idx = f"INDEX($D$9:$D$158,{rowc}{r})"
            cond_skip = "".join(f",{rowc}{r}={s}{r}" for s in skip)
            return (f'IF(OR({rowc}{r}=""{cond_skip}),"",IF(OR({idx}=T{r},{idx}=U{r},{idx}=V{r}),"",'
                    f'INDEX($F$9:$F$158,{rowc}{r})&"、"))')

        f["AL"] = "=" + rev("AH", []) + "&" + rev("AI", ["AH"]) + "&" + rev("AJ", ["AH", "AI"])
        f["P"] = (f'=IF(AG{r}=0,"",IF(AK{r}&AL{r}="","⚠",LEFT(AK{r}&AL{r},LEN(AK{r}&AL{r})-1)))')
        for col, idc, clc in (("AM", "T", "W"), ("AN", "U", "X"), ("AO", "V", "Y")):
            f[col] = (f'=IF({idc}{r}="","",IFERROR(INDEX({R}$C$4:$C$153,MATCH({idc}{r},{R}$A$4:$A$153,0)),"?")'
                      f'&IF({clc}{r}="","","("&{clc}{r}&"組)"))')
        f["O"] = (f'=AM{r}&IF(AND(AM{r}<>"",AN{r}<>""),"、","")&AN{r}'
                  f'&IF(AND(AM{r}&AN{r}<>"",AO{r}<>""),"、","")&AO{r}')
        f["AP"] = f'=IF(G{r}="男",1,IF(G{r}="女",2,3))'
        f["AQ"] = (f'=IF(OR(S{r}="",E{r}=""),"",IFERROR(IF({V}$AD$6="番号順",0,AP{r}*1000000000)+D{r},""))')
        f["AR"] = f'=IF(AQ{r}="","",COUNTIFS($E$9:$E$158,E{r},$AQ$9:$AQ$158,"<"&AQ{r})+1)'
        f["AS"] = f'=IF(AR{r}="","",E{r}&"-"&AR{r})'
        for col, src in zip(("AT", "AU", "AV", "AW", "AX"), "FGHIJ"):
            f[col] = (f'=IF(S{r}="","",IF(INDEX({R}${src}$4:${src}$153,S{r})="","",'
                      f'INDEX({R}${src}$4:${src}$153,S{r})))')
        for col, formula in f.items():
            ws[f"{col}{r}"] = formula

        for col, _, _ in EDIT_HEAD:
            if col == "C":
                continue
            c = ws[f"{col}{r}"]
            c.border = BORDER
            c.font = font(10)
            if col in ("A", "B"):
                c.fill = fill(CALC_FILL)
                c.font = font(10, False, "595959")
            elif col not in ("D", "E"):
                c.fill = fill(CALC_FILL)
            c.alignment = SHRINK if col in ("F", "O", "P", "Q") else CENTER
        ws[f"E{r}"].font = font(11, True)
        ws[f"I{r}"].number_format = "0.0"
        ws[f"J{r}"].number_format = "0.0"
        for item in EDIT_HELP:
            ws[f"{item.split(':')[0]}{r}"].font = font(8, False, "7F7F7F")

    for i, (sid, k) in enumerate(decided):
        ws[f"D{E_FIRST + i}"] = sid
        ws[f"E{E_FIRST + i}"] = k

    dv = DataValidation(type="list", formula1='"1,2,3"', allow_blank=True)
    dv.errorTitle = "組"
    dv.error = "組は 1・2・3 のどれかを入れてください。"
    ws.add_data_validation(dv)
    dv.add("E9:E158")

    cf = ws.conditional_formatting
    for k in range(1, NCLS + 1):
        cf.add("B9:B158", CellIsRule(operator="equal", formula=[str(k)], fill=fill(CLASS_LIGHT[k])))
        cf.add("E9:E158", CellIsRule(operator="equal", formula=[str(k)], fill=fill(CLASS_LIGHT[k])))
    cf.add("D9:D158", FormulaRule(formula=['AND($D9<>"",COUNTIF($D$9:$D$158,$D9)>1)'],
                                  fill=fill(RED_FILL), font=Font(color=RED_FONT, bold=True)))
    cf.add("D9:F158", FormulaRule(formula=['AND($D9<>"",$S9="")'], fill=fill(ORANGE_FILL)))
    cf.add("E9:E158", FormulaRule(formula=['AND($D9<>"",NOT(OR($E9=1,$E9=2,$E9=3)))'],
                                  fill=fill(ORANGE_FILL)))
    cf.add("F9:Q158", FormulaRule(formula=["$AG9>0"], fill=fill(RED_FILL), font=Font(color=RED_FONT)))
    for col, key in (("K", "piano"), ("L", "mood"), ("M", "caution"), ("N", "absent")):
        cf.add(f"{col}9:{col}158", CellIsRule(operator="equal", formula=['"〇"'], fill=fill(FLAG_FILL[key])))
    cf.add("G9:G158", CellIsRule(operator="equal", formula=['"男"'], font=Font(color="1F4E79", bold=True)))
    cf.add("G9:G158", CellIsRule(operator="equal", formula=['"女"'], font=Font(color="C00000", bold=True)))
    cf.add("A4", FormulaRule(formula=[f"{S}$C${SET_PROBLEMS}>0"], font=Font(color="C00000", bold=True)))

    ws.column_dimensions.group("R", "AX", hidden=True, outline_level=1)
    ws.freeze_panes = "F9"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_title_rows = "8:8"
    ws.print_area = "A1:Q158"


STATUS_FORMULA = (f'="名簿 "&{S}$C${SET_N}&"人　／　編成済み "&{S}$C${SET_DONE}&"人　／　未割当 "'
                  f'&{S}$C${SET_UNASSIGNED}&"人"'
                  f'&IF({S}$C${SET_PROBLEMS}>0,"　／　⚠ 番号や組の入力に問題が "&{S}$C${SET_PROBLEMS}&" 件'
                  f'（①②の色のついたセルを確認）","")')


# ================================================================ ③クラス一覧
BLOCK_COLS = [  # (見出し, 幅, ②の列)
    ("No", 4, None), ("番号", 7, "D"), ("氏名", 13, "F"), ("性", 3.6, "G"), ("旧", 4, "H"),
    ("平均", 6, "I"), ("50m", 5.6, "J"), ("ピ", 3.6, "K"), ("ム", 3.6, "L"), ("注", 3.6, "M"),
    ("休", 3.6, "N"), ("分けたい相手(同組)", 13, "P"),
]
BLOCK_STEP = 13
POS_COL = {1: "AO", 2: "AP", 3: "AQ"}

# 統計の並び（行, ラベル位置, ラベル, 目安の行）
STATS = [
    # row, [(label, value_formula_key, threshold_row or None)] × 3
    (10, [("人数", "cnt", 22), ("男子", "male", 23), ("女子", "female", 24)]),
    (11, [("5教科平均", "avg", 25), ("50m男子", "runm", 26), ("50m女子", "runf", 27)]),
    (12, [("成績上位", "top", 28), ("成績下位", "low", 29), ("重なり(人)", "conf", None)]),
    (13, [("ピアノ", "piano", 30), ("ムード", "mood", 31), ("注意", "caution", 32)]),
]


def bcol(k, off):
    return CL(2 + BLOCK_STEP * (k - 1) + off)


def stat_formula(key, k):
    ek = f"{E}$E$9:$E$158,{k}"
    ok = f"{E}$S$9:$S$158,\">=1\""
    return {
        "cnt": f"=COUNTIFS({ek},{ok})",
        "male": f'=COUNTIFS({ek},{ok},{E}$G$9:$G$158,"男")',
        "female": f'=COUNTIFS({ek},{ok},{E}$G$9:$G$158,"女")',
        "avg": f'=IFERROR(ROUND(AVERAGEIFS({E}$I$9:$I$158,{ek}),1),"-")',
        "runm": f'=IFERROR(ROUND(AVERAGEIFS({E}$J$9:$J$158,{ek},{E}$G$9:$G$158,"男"),2),"-")',
        "runf": f'=IFERROR(ROUND(AVERAGEIFS({E}$J$9:$J$158,{ek},{E}$G$9:$G$158,"女"),2),"-")',
        "top": f'=IF({S}$C${SET_TOP}="","-",COUNTIFS({ek},{E}$I$9:$I$158,">="&{S}$C${SET_TOP}))',
        "low": f'=IF({S}$C${SET_LOW}="","-",COUNTIFS({ek},{E}$I$9:$I$158,"<="&{S}$C${SET_LOW}))',
        "conf": f'=COUNTIFS({ek},{E}$AG$9:$AG$158,">0")',
        "piano": f'=COUNTIFS({ek},{E}$K$9:$K$158,"〇")',
        "mood": f'=COUNTIFS({ek},{E}$L$9:$L$158,"〇")',
        "caution": f'=COUNTIFS({ek},{E}$M$9:$M$158,"〇")',
        "absent": f'=COUNTIFS({ek},{E}$N$9:$N$158,"〇")',
    }[key]


def build_view(ws):
    ws.sheet_properties.tabColor = "ED7D31"
    ws.column_dimensions["A"].width = 1.5
    for k in range(1, NCLS + 1):
        for off, (_, w, _) in enumerate(BLOCK_COLS):
            ws.column_dimensions[bcol(k, off)].width = w
        if k < NCLS:
            ws.column_dimensions[bcol(k, 12)].width = 2
    ws.column_dimensions["AN"].width = 2

    ws["B1"] = "③ クラス一覧（3クラスを並べて確認・入れ替え）"
    ws["B1"].font = font(14, True, "843C0C")
    ws["B2"] = ("赤い行＝分けたい人と同じ組　／　オレンジ＝3クラスの差が目安（設定シート）より大きい　／　"
                "黄色＝直前に動かした人　／　ピ＝ピアノ　ム＝ムードメーカー　注＝注意　休＝休みがち　／　青い棒＝5教科平均")
    ws["B2"].font = font(9, False, "404040")
    ws["B3"] = STATUS_FORMULA
    ws["B3"].font = font(10, True, "843C0C")
    ws.conditional_formatting.add("B3", FormulaRule(formula=[f"{S}$C${SET_PROBLEMS}>0"],
                                                    font=Font(color="C00000", bold=True)))

    # 操作パネル（マクロ）
    panel_fill = fill("FFF2CC")
    ws["B4"] = "■ 番号で入れ替え（マクロ）"
    ws["O4"] = "■ 1人だけ移動（マクロ）"
    ws["AB4"] = "■ 選んで入れ替え：1人目をクリック → Ctrl＋クリックで2人目 → ボタン"
    for a in ("B4", "O4", "AB4"):
        ws[a].font = font(9, True, "7F6000")
    ws["B5"], ws["B6"] = "番号", "番号"
    ws["O5"], ws["O6"] = "番号", "移動先"
    for a in ("B5", "B6", "O5", "O6"):
        ws[a].font = font(9)
        ws[a].alignment = CENTER
    for a in ("C5", "C6", "P5", "P6"):
        ws[a].fill = panel_fill
        ws[a].border = Border(left=Side("thin", "BF8F00"), right=Side("thin", "BF8F00"),
                              top=Side("thin", "BF8F00"), bottom=Side("thin", "BF8F00"))
        ws[a].font = font(11, True)
        ws[a].alignment = CENTER
    lookup = (lambda a: f'=IF({a}="","",IFERROR(INDEX({E}$F$9:$F$158,MATCH({a},{E}$D$9:$D$158,0))&"（"&'
                        f'INDEX({E}$E$9:$E$158,MATCH({a},{E}$D$9:$D$158,0))&"組）","②にない番号"))')
    for row, src in ((5, "C5"), (6, "C6")):
        ws.merge_cells(f"D{row}:G{row}")
        ws[f"D{row}"] = lookup(src)
        ws[f"D{row}"].font = font(10)
        ws[f"D{row}"].alignment = SHRINK
    ws.merge_cells("H5:H6")
    ws["H5"] = "⇔"
    ws["H5"].font = font(14, True, "7F6000")
    ws["H5"].alignment = CENTER
    ws.merge_cells("Q5:T5")
    ws["Q5"] = lookup("P5")
    ws["Q5"].font = font(10)
    ws["Q5"].alignment = SHRINK
    ws["Q6"] = "組へ"
    ws["Q6"].font = font(9)
    ws["AB6"] = "並び順"
    ws["AB6"].font = font(9)
    ws["AD6"] = "男女別"
    ws["AD6"].fill = panel_fill
    ws["AD6"].font = font(10, True)
    ws["AD6"].alignment = CENTER
    ws["AE6"] = "（男女別／番号順）"
    ws["AE6"].font = font(8, False, "7F7F7F")
    dv = DataValidation(type="list", formula1='"1,2,3"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add("P6")
    dv2 = DataValidation(type="list", formula1='"男女別,番号順"', allow_blank=False)
    ws.add_data_validation(dv2)
    dv2.add("AD6")
    ws.row_dimensions[5].height = 20
    ws.row_dimensions[6].height = 20
    ws.merge_cells("B7:C7")
    ws["B7"] = "直前の操作："
    ws["B7"].font = font(9, True, "7F6000")
    ws.merge_cells("D7:AM7")
    ws["D7"].font = font(10, False, "7F6000")
    ws["D7"].alignment = LEFT
    ws["AO2"] = "直前に動かした番号"

    for k in range(1, NCLS + 1):
        c0, c11 = bcol(k, 0), bcol(k, 11)
        dark, light = CLASS_DARK[k], CLASS_LIGHT[k]
        # 組の見出し
        ws.merge_cells(f"{c0}9:{c11}9")
        ws[f"{c0}9"] = f'="{k}組　（"&{bcol(k, 2)}10&"人）"'
        ws[f"{c0}9"].font = font(14, True, "FFFFFF")
        ws[f"{c0}9"].fill = fill(dark)
        ws[f"{c0}9"].alignment = CENTER
        ws.row_dimensions[9].height = 24
        # 統計
        for row, items in STATS:
            for p, (label, key, _) in enumerate(items):
                l1, l2, vcol = [(0, 1, 2), (3, 5, 6), (7, 10, 11)][p]
                ws.merge_cells(f"{bcol(k, l1)}{row}:{bcol(k, l2)}{row}")
                ws[f"{bcol(k, l1)}{row}"] = label
                ws[f"{bcol(k, vcol)}{row}"] = stat_formula(key, k)
        # 休みがち・旧クラス
        ws.merge_cells(f"{bcol(k, 0)}14:{bcol(k, 1)}14")
        ws[f"{bcol(k, 0)}14"] = "休みがち"
        ws[f"{bcol(k, 2)}14"] = stat_formula("absent", k)
        ws.merge_cells(f"{bcol(k, 3)}14:{bcol(k, 5)}14")
        ws[f"{bcol(k, 3)}14"] = "旧クラス"
        ws.merge_cells(f"{bcol(k, 6)}14:{bcol(k, 11)}14")
        parts = []
        for i in range(6):
            lab = f"{S}$B${SET_OLD_FIRST + i}"
            parts.append(f'IF({lab}="","",{lab}&":"&COUNTIFS({E}$E$9:$E$158,{k},{E}$H$9:$H$158,{lab})&"人　")')
        ws[f"{bcol(k, 6)}14"] = "=" + "&".join(parts)
        # 教科平均
        ws.merge_cells(f"{bcol(k, 0)}15:{bcol(k, 1)}15")
        ws[f"{bcol(k, 0)}15"] = "教科平均"
        ws.merge_cells(f"{bcol(k, 2)}15:{bcol(k, 11)}15")
        sub = []
        for col, rcol in zip(("AT", "AU", "AV", "AW", "AX"), "FGHIJ"):
            sub.append(f'LEFT({R}${rcol}$2,1)&IFERROR(TEXT(AVERAGEIFS({E}${col}$9:${col}$158,'
                       f'{E}$E$9:$E$158,{k}),"0.0"),"-")')
        ws[f"{bcol(k, 2)}15"] = '=' + '&"　"&'.join(sub)

        for row in range(10, 16):
            for off in range(12):
                c = ws[f"{bcol(k, off)}{row}"]
                c.border = BORDER
                c.fill = fill(light)
                is_val = (off in (2, 6, 11)) or (row >= 14 and off >= 2 and not (row == 14 and off in (3, 4, 5)))
                c.font = font(10, True) if is_val else font(9, False, "404040")
                c.alignment = CENTER if is_val and row < 14 else (SHRINK if is_val else CENTER)
        for row, vcol in ((11, 2),):
            ws[f"{bcol(k, vcol)}{row}"].number_format = "0.0"
        ws[f"{bcol(k, 6)}11"].number_format = "0.00"
        ws[f"{bcol(k, 11)}11"].number_format = "0.00"

        # 名簿の見出し
        for off, (name, _, _) in enumerate(BLOCK_COLS):
            c = ws[f"{bcol(k, off)}16"]
            c.value = name
            c.font = font(9, True, "FFFFFF")
            c.fill = fill(dark)
            c.alignment = CENTER_WRAP
            c.border = BORDER
        ws.row_dimensions[16].height = 26

        pos = POS_COL[k]
        for v in range(V_FIRST, V_LAST + 1):
            n = v - V_FIRST + 1
            ws[f"{pos}{v}"] = f'=IFERROR(MATCH("{k}-{n}",{E}$AS$9:$AS$158,0),"")'
            ws[f"{pos}{v}"].font = font(8, False, "7F7F7F")
            for off, (_, _, src) in enumerate(BLOCK_COLS):
                c = ws[f"{bcol(k, off)}{v}"]
                if src is None:
                    c.value = f'=IF(${pos}{v}="","",{n})'
                else:
                    c.value = f'=IF(${pos}{v}="","",INDEX({E}${src}$9:${src}$158,${pos}{v}))'
                c.border = BORDER
                c.font = font(10, off == 2)
                c.alignment = SHRINK if off in (2, 11) else CENTER
            ws[f"{bcol(k, 5)}{v}"].number_format = "0.0"
            ws[f"{bcol(k, 6)}{v}"].number_format = "0.0"
            ws[f"{bcol(k, 0)}{v}"].font = font(8, False, "7F7F7F")

    # ---- 条件付き書式 ----
    cf = ws.conditional_formatting
    for k in range(1, NCLS + 1):
        rng = f"{bcol(k, 0)}{V_FIRST}:{bcol(k, 11)}{V_LAST}"
        partner = f"${bcol(k, 11)}{V_FIRST}"
        idc = f"${bcol(k, 1)}{V_FIRST}"
        cf.add(rng, FormulaRule(formula=[f'{partner}<>""'], fill=fill(RED_FILL),
                                font=Font(color=RED_FONT, bold=True)))
        cf.add(rng, FormulaRule(formula=[f'AND({idc}<>"",OR({idc}=$AO$3,{idc}=$AP$3))'],
                                fill=fill(MOVED_FILL), font=Font(bold=True)))
        sx = f"{bcol(k, 3)}{V_FIRST}:{bcol(k, 3)}{V_LAST}"
        cf.add(sx, CellIsRule(operator="equal", formula=['"男"'], font=Font(color="1F4E79", bold=True)))
        cf.add(sx, CellIsRule(operator="equal", formula=['"女"'], font=Font(color="C00000", bold=True)))
        for off, key in ((7, "piano"), (8, "mood"), (9, "caution"), (10, "absent")):
            cr = f"{bcol(k, off)}{V_FIRST}:{bcol(k, off)}{V_LAST}"
            cf.add(cr, CellIsRule(operator="equal", formula=['"〇"'], fill=fill(FLAG_FILL[key])))
    bars = " ".join(f"{bcol(k, 5)}{V_FIRST}:{bcol(k, 5)}{V_LAST}" for k in range(1, NCLS + 1))
    cf.add(bars, DataBarRule(start_type="num", start_value=0, end_type="max", color="9BC2E6",
                             showValue=True))
    # 統計：3クラスの差が目安より大きいとき、いちばん多い組・少ない組をオレンジに
    for row, items in STATS:
        for p, (_, key, thr) in enumerate(items):
            vcol = (2, 6, 11)[p]
            cells = [f"${bcol(k, vcol)}${row}" for k in range(1, NCLS + 1)]
            mx, mn = f"MAX({','.join(cells)})", f"MIN({','.join(cells)})"
            for k in range(1, NCLS + 1):
                me = f"{bcol(k, vcol)}{row}"
                if thr is None:
                    rule = FormulaRule(formula=[f"{me}>0"], fill=fill(RED_FILL), font=Font(color=RED_FONT, bold=True))
                else:
                    rule = FormulaRule(formula=[f"AND(ISNUMBER({me}),{mx}-{mn}>{S}$C${thr},OR({me}={mx},{me}={mn}))"],
                                       fill=fill(ORANGE_FILL))
                cf.add(me, rule)
    cells = [f"${bcol(k, 2)}$14" for k in range(1, NCLS + 1)]
    mx, mn = f"MAX({','.join(cells)})", f"MIN({','.join(cells)})"
    for k in range(1, NCLS + 1):
        me = f"{bcol(k, 2)}14"
        cf.add(me, FormulaRule(formula=[f"AND(ISNUMBER({me}),{mx}-{mn}>{S}$C$33,OR({me}={mx},{me}={mn}))"],
                               fill=fill(ORANGE_FILL)))

    ws.column_dimensions.group("AO", "AQ", hidden=True, outline_level=1)
    ws.sheet_view.zoomScale = 85
    ws.page_setup.orientation = "landscape"
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_area = "B1:AM66"
    ws.page_margins.left = ws.page_margins.right = 0.3
    ws.page_margins.top = ws.page_margins.bottom = 0.4


# ================================================================ 計算（隠しシート）
# 自動案：①の並び順（AF列）の1人目から順に、
#   「同じ性別の人数」→「同じ特記事項（注意・ピアノ・ムード・休み）の人数」→
#   「成績のかたより＋旧クラスの人数」がいちばん小さくなる組へ入れていく。
#   各行はそれより上の行の結果だけを見るので、循環参照にはならない。
def build_calc(ws):
    heads = ["順", "①の行", "性別", "成績z", "旧", "ピアノ", "ムード", "注意", "休み",
             "人数1", "人数2", "人数3", "同性1", "同性2", "同性3", "特記1", "特記2", "特記3",
             "旧1", "旧2", "旧3", "成績1", "成績2", "成績3", "50m z", "決定", "点1", "点2", "点3"]
    for i, h in enumerate(heads):
        ws.cell(row=1, column=i + 1, value=h)
    ws["AE1"], ws["AF1"], ws["AG1"] = "定員1", "定員2", "定員3"
    for k in range(1, NCLS + 1):
        ws.cell(row=2, column=30 + k,
                value=f"=INT({S}$C${SET_N}/{NCLS})+IF({k}<=MOD({S}$C${SET_N},{NCLS}),1,0)")
    ws["AI1"], ws["AJ1"], ws["AK1"] = "50m1", "50m2", "50m3"
    ws["AD4"], ws["AF4"] = "旧クラスを混ぜる強さ", OLD_MIX
    ws["AD5"], ws["AF5"] = "50m走をそろえる強さ", RUN_MIX
    ws["AD6"] = "（どちらも大きくするほどよくそろうが、そのぶん成績のそろい方は少し落ちる）"
    ws["AD7"] = "50m平均（性別1〜3）"
    ws["AD8"] = "50mの標準偏差"
    for k in range(1, 4):
        col = CL(30 + k)
        ws[f"{col}7"] = f"=IFERROR(AVERAGEIFS({R}$L$4:$L$153,{R}$X$4:$X$153,{k}),0)"
        ws[f"{col}8"] = (f"=IFERROR(IF(SQRT(MAX(0,AVERAGEIFS({R}$AK$4:$AK$153,{R}$X$4:$X$153,{k})-{col}7^2))=0,1,"
                         f"SQRT(MAX(0,AVERAGEIFS({R}$AK$4:$AK$153,{R}$X$4:$X$153,{k})-{col}7^2))),1)")
    for p in range(1, R_LAST - R_FIRST + 2):
        r = p + 1
        q = r - 1
        f = {
            "A": p,
            "B": f'=IFERROR(MATCH(A{r},{R}$AF$4:$AF$153,0),"")',
            "C": f'=IF(B{r}="","",INDEX({R}$X$4:$X$153,B{r}))',
            "D": f'=IF(B{r}="","",(INDEX({R}$AD$4:$AD$153,B{r})-{S}$C${SET_MEAN})/{S}$C${SET_SD})',
            "E": f'=IF(B{r}="","",INDEX({R}$B$4:$B$153,B{r})&"")',
        }
        for col, src in (("F", "Y"), ("G", "Z"), ("H", "AA"), ("I", "AB")):
            f[col] = f'=IF(B{r}="",0,INDEX({R}${src}$4:${src}$153,B{r}))'
        for k in range(1, NCLS + 1):
            got = f"$Z$1:Z{q},{k}"
            f[CL(9 + k)] = f"=COUNTIF({got})"
            f[CL(12 + k)] = f"=COUNTIFS({got},$C$1:C{q},C{r})"
            f[CL(15 + k)] = "=" + "+".join(f"{fl}{r}*COUNTIFS({got},${fl}$1:{fl}{q},1)" for fl in "FGHI")
            f[CL(18 + k)] = f'=IF(E{r}="",0,COUNTIFS({got},$E$1:E{q},E{r}))'
            f[CL(21 + k)] = f"=SUMIF($Z$1:Z{q},{k},$D$1:D{q})"
            cap = f"{CL(30 + k)}$2"
            f[CL(26 + k)] = (f'=IF(B{r}="","",IF({CL(9 + k)}{r}>=${cap},1E+15,{CL(12 + k)}{r}*1E+10'
                             f'+{CL(15 + k)}{r}*1E+8+ROUND(100*(D{r}*{CL(21 + k)}{r}+$AF$5*Y{r}*{CL(34 + k)}{r}'
                             f'+$AF$4*{CL(18 + k)}{r}),0)+1E+6))')
        f["Y"] = f'=IF(B{r}="",0,INDEX({R}$AL$4:$AL$153,B{r}))'
        for k in range(1, NCLS + 1):
            f[CL(34 + k)] = f"=SUMIFS($Y$1:Y{q},$Z$1:Z{q},{k},$C$1:C{q},C{r})"
        f["Z"] = f'=IF(B{r}="","",MATCH(MIN(AA{r}:AC{r}),AA{r}:AC{r},0))'
        for col, formula in f.items():
            ws[f"{col}{r}"] = formula
    ws.sheet_state = "hidden"


# ================================================================ 設定
WEIGHTS = [
    ("男女の人数", 10, "男子・女子の人数をそろえる"),
    ("5教科平均", 6, "クラスの平均点をそろえる"),
    ("成績の上位層・下位層", 4, "上位・下位の人数をそろえる（基準は下の自動計算）"),
    ("50m走", 3, "足の速さ（男女別）をそろえる"),
    ("ピアノ", 6, "ピアノを弾ける人の人数をそろえる"),
    ("ムードメーカー", 5, "ムードメーカーの人数をそろえる"),
    ("注意", 8, "注意が必要な人の人数をそろえる"),
    ("休みがち", 4, "休みがちな人の人数をそろえる"),
    ("旧クラスの偏り", 4, "前のクラスのメンバーがかたよらないようにする"),
]
THRESH = [  # 行22〜33
    ("人数", 1), ("男子", 1), ("女子", 1), ("5教科平均", 3), ("50m男子(秒)", 0.2), ("50m女子(秒)", 0.2),
    ("成績上位", 2), ("成績下位", 2), ("ピアノ", 1), ("ムードメーカー", 1), ("注意", 1), ("休みがち", 1),
]


def build_settings(ws):
    ws.sheet_properties.tabColor = "A5A5A5"
    ws.column_dimensions["A"].width = 2
    ws.column_dimensions["B"].width = 34
    ws.column_dimensions["C"].width = 14
    ws.column_dimensions["D"].width = 60
    ws["B1"] = "設定（ふだんは触らなくてOK）"
    ws["B1"].font = font(14, True)
    ws["B3"] = "■ おまかせ最適化（マクロ）で、何をどれくらい重視するか"
    ws["B3"].font = font(11, True, "1F3864")
    for i, h in enumerate(("項目", "重視度（0〜10）", "説明")):
        c = ws.cell(row=4, column=2 + i, value=h)
    style_range(ws, "B4:D4", f=font(10, True), fl=fill(HEAD_FILL), al=CENTER)
    for i, (name, w, desc) in enumerate(WEIGHTS):
        r = 5 + i
        ws[f"B{r}"], ws[f"C{r}"], ws[f"D{r}"] = name, w, desc
    ws["B14"], ws["C14"], ws["D14"] = "分けたい人", "最優先", "同じ組にならないことを、いちばん優先します（変えられません）"
    style_range(ws, "B5:D14", f=font(10), al=LEFT)
    style_range(ws, "C5:C14", f=font(11, True), al=CENTER)
    ws["C14"].fill = fill(CALC_FILL)
    dvw = DataValidation(type="whole", operator="between", formula1="0", formula2="10")
    dvw.error = "0〜10の整数を入れてください。"
    ws.add_data_validation(dvw)
    dvw.add("C5:C13")

    ws["B16"], ws["C16"], ws["D16"] = "ピアノを各組に最低1人", "する", "ピアノが3人以上いるとき、0人の組をつくらない"
    ws["B17"], ws["C17"], ws["D17"] = "おまかせ最適化の試行回数", 20, "多いほど良い案が出やすい（そのぶん時間がかかる）"
    style_range(ws, "B16:D17", f=font(10), al=LEFT)
    style_range(ws, "C16:C17", f=font(11, True), al=CENTER)
    dvp = DataValidation(type="list", formula1='"する,しない"', allow_blank=False)
    ws.add_data_validation(dvp)
    dvp.add("C16")

    ws["B20"] = "■ ③で色をつける目安（3クラスの差がこれより大きいとオレンジ）"
    ws["B20"].font = font(11, True, "1F3864")
    ws["B21"], ws["C21"], ws["D21"] = "項目", "目安（差）", "例：人数が 1 → 3クラスの人数差が2人以上でオレンジ"
    style_range(ws, "B21:D21", f=font(10, True), fl=fill(HEAD_FILL), al=CENTER)
    for i, (name, t) in enumerate(THRESH):
        r = 22 + i
        ws[f"B{r}"], ws[f"C{r}"] = name, t
    style_range(ws, "B22:C33", f=font(10), al=LEFT)
    style_range(ws, "C22:C33", f=font(11, True), al=CENTER)

    ws["B34"] = "■ 自動で計算（触らない）"
    ws["B34"].font = font(11, True, "7F7F7F")
    calc = [
        (SET_TOP, "成績上位の基準（5教科平均がこれ以上）",
         f'=IFERROR(ROUND(PERCENTILE({R}$K$4:$K$153,0.8),1),"")', "全体の上位20%"),
        (SET_LOW, "成績下位の基準（5教科平均がこれ以下）",
         f'=IFERROR(ROUND(PERCENTILE({R}$K$4:$K$153,0.2),1),"")', "全体の下位20%"),
        (SET_MEAN, "5教科平均の全体の平均", f"=IFERROR(AVERAGE({R}$K$4:$K$153),0)", "自動案で使う"),
        (SET_SD, "5教科平均のばらつき（標準偏差）",
         f"=IF(IFERROR(STDEVP({R}$K$4:$K$153),0)=0,1,STDEVP({R}$K$4:$K$153))", "自動案で使う"),
        (SET_N, "名簿の人数", f"=COUNTA({R}$A$4:$A$153)", ""),
        (SET_DONE, "編成済み（②で組が1〜3の人）",
         f'=COUNTIFS({E}$E$9:$E$158,">=1",{E}$E$9:$E$158,"<=3",{E}$S$9:$S$158,">=1")', ""),
        (SET_UNASSIGNED, "未割当（②にまだいない人）", f'=COUNTIF({R}$V$4:$V$153,"未")', ""),
        (SET_DUP, "番号の重複（①と②）",
         f'=SUMPRODUCT(({E}$D$9:$D$158<>"")*(COUNTIF({E}$D$9:$D$158,{E}$D$9:$D$158)>1))'
         f'+SUMPRODUCT(({R}$A$4:$A$153<>"")*(COUNTIF({R}$A$4:$A$153,{R}$A$4:$A$153)>1))', ""),
        (SET_NOTIN, "②で名簿にない番号", f'=SUMPRODUCT(({E}$D$9:$D$158<>"")*({E}$S$9:$S$158=""))', ""),
        (SET_BADCLS, "②で組が1〜3以外",
         f'=SUMPRODUCT(({E}$D$9:$D$158<>"")*({E}$E$9:$E$158<>1)*({E}$E$9:$E$158<>2)*({E}$E$9:$E$158<>3))', ""),
        (SET_PROBLEMS, "問題の合計", f"=C{SET_DUP}+C{SET_NOTIN}+C{SET_BADCLS}", ""),
    ]
    for r, name, formula, note in calc:
        ws[f"B{r}"], ws[f"C{r}"], ws[f"D{r}"] = name, formula, note
        style_range(ws, f"B{r}:D{r}", f=font(10, False, "595959"), fl=fill(CALC_FILL), al=LEFT)
        ws[f"C{r}"].alignment = CENTER
    ws[f"C{SET_MEAN}"].number_format = "0.0"
    ws[f"C{SET_SD}"].number_format = "0.0"
    ws[f"B{SET_OLD_FIRST - 1}"] = "旧クラスの一覧（①から自動）"
    ws[f"B{SET_OLD_FIRST - 1}"].font = font(10, True, "7F7F7F")
    for i in range(6):
        r = SET_OLD_FIRST + i
        ws[f"B{r}"] = f'=IFERROR(INDEX({R}$B$4:$B$153,MATCH({i + 1},{R}$AJ$4:$AJ$153,0)),"")'
        style_range(ws, f"B{r}:B{r}", f=font(10, False, "595959"), fl=fill(CALC_FILL), al=LEFT)
    ws[f"C{SET_OLD_FIRST}"] = "← ③の「旧クラス」の行は最初の6つまで表示"
    ws[f"C{SET_OLD_FIRST}"].font = font(9, False, "7F7F7F")


# ================================================================ 入替履歴
def build_log(ws):
    ws.sheet_properties.tabColor = "A5A5A5"
    ws["A1"] = "入替履歴（マクロが自動で書きます。［1つ戻す］は一番下の行を戻します）"
    ws["A1"].font = font(12, True)
    heads = ["日時", "操作", "番号①", "氏名①", "元の組①", "新しい組①", "番号②", "氏名②", "元の組②", "新しい組②"]
    widths = [14, 12, 8, 14, 8, 9, 8, 14, 8, 9]
    for i, (h, w) in enumerate(zip(heads, widths)):
        c = ws.cell(row=2, column=i + 1, value=h)
        ws.column_dimensions[CL(i + 1)].width = w
    style_range(ws, "A2:J2", f=font(10, True), fl=fill(HEAD_FILL), al=CENTER)
    ws.freeze_panes = "A3"


# ================================================================ 使い方
HOWTO = [
    ("title", "使い方（クラス替えシート）"),
    ("p", "※ ダウンロードしたファイルは「保護ビュー」で開きます。上に出る［編集を有効にする］を押してから使ってください。"),
    ("h", "■ 全体の流れ"),
    ("p", "1.「①名簿入力」の4行目から名簿を貼り付けます（番号・旧クラス・氏名・ふりがな・性別）。"),
    ("p", "2. 5教科の点数、50m走、ピアノ（〇×）、ムードメーカー・注意・休みがち（〇）、分けたい人、備考を入れます。"),
    ("p", "　 → U列「自動案」に、バランスよく分けた組（1〜3）が自動で出ます。"),
    ("p", "3.「②クラス編成」のA〜B列（自動案）をコピーして、D9 に「値」で貼り付けます。"),
    ("p", "　 （D9を右クリック →［貼り付けのオプション］の「値」（123のアイコン））"),
    ("p", "　 ここからが「決定したクラス」です。数式ではないので、あとで成績を直しても勝手に変わりません。"),
    ("p", "4.「③クラス一覧」で3クラスを並べて確認します。"),
    ("p", "　 ・赤い行 … 分けたい人と同じ組になっている（右端に相手の名前）"),
    ("p", "　 ・オレンジ … 3クラスの差が目安より大きい項目（目安は「設定」で変えられます）"),
    ("p", "5. 調整します。"),
    ("p", "　 ・いちばん簡単：②のE列（組）の数字を書き換える"),
    ("p", "　 ・マクロを入れると、③で「番号で入れ替え」「1人だけ移動」「選んだ2人を入れ替え」「1つ戻す」ができます"),
    ("p", "　 ・入れ替えた記録は「入替履歴」に残ります"),
    ("h", "■ 自動案（数式）のしくみ"),
    ("p", "「注意 → ピアノ → ムードメーカー → 休みがち → その他」の順に、その中では成績が平均から離れている人（上位・下位）から1人ずつ、"),
    ("p", "「同じ性別の人数」→「同じ特記事項の人数」→「成績・50m走（男女別）のかたよりと旧クラスの人数」がいちばん少ない組へ入れていきます。"),
    ("p", "→ 人数・男女・成績・50m走・特記事項・旧クラスがそろいます。分けたい人は考えないので、③の赤いところを直してください（マクロなら自動で直せます）。"),
    ("h", "■ おまかせ最適化（マクロ）"),
    ("p", "分けたい人（最優先）・男女・成績・上位/下位・50m・ピアノ・ムードメーカー・注意・休みがち・旧クラスの偏りを、"),
    ("p", "「設定」シートの重視度に合わせて同時に考え、2人の入れ替えを何千回も試して、いちばんバランスのよい案を②に書き込みます。"),
    ("p", "押すたびに少し違う案が出ます。気に入らなければ［1つ戻す］ではなく、もう一度押すか、②に自動案を貼り直してください。"),
    ("h", "■ マクロの入れ方（はじめに1回だけ）"),
    ("p", "1. このファイルを開いて、Alt＋F11（VBAの画面が開きます）"),
    ("p", "2. メニュー［ファイル］→［ファイルのインポート］→「クラス替えマクロ.bas」を選ぶ"),
    ("p", "3. VBAの画面を閉じて、Alt＋F8 →「Setup_Buttons」を選んで［実行］→ ②と③にボタンが出ます"),
    ("p", "4.［名前を付けて保存］→ ファイルの種類を「Excel マクロ有効ブック（*.xlsm）」にして保存"),
    ("p", "5. 次から開くときは、上に出る黄色い帯の［コンテンツの有効化］を押す"),
    ("p", "※ 取り込んだ文字が化けたとき：.bas をメモ帳で開いて全部コピー → VBA画面の［挿入］→［標準モジュール］に貼り付け"),
    ("p", "　 （1行目の「Attribute VB_Name = …」の行は消してください）"),
    ("p", "※ マクロがブロックされるとき：ファイルを右クリック →［プロパティ］→ 下の「許可する」にチェック → OK"),
    ("h", "■ 気をつけること"),
    ("p", "・番号は数字で、重複しないようにしてください（例：2年1組5番 → 2105）。重複すると赤くなります。"),
    ("p", "・入れられるのは150人まで（1クラス50人まで）です。"),
    ("p", "・〇は「〇」「○」どちらでもOKです。ピアノは「〇」か「×」。"),
    ("p", "・分けたい人は「番号 氏名」をリストから選ぶか、番号だけ入れます。どちらか片方に書けば、両方に効きます。"),
    ("p", "・5教科の平均だけしかない場合は、K列（5教科平均）に直接入れてもOKです（数式は消えます）。"),
    ("p", "・シート名や列の位置を変えると、マクロや数式が動かなくなります。隠しシート「計算」は自動案の計算用なので触らないでください。"),
    ("p", "・サンプルを消すとき：①の A4〜T153 を選んで Delete、②の D9〜E158 を選んで Delete。"),
]


def build_howto(ws):
    ws.sheet_properties.tabColor = "FFC000"
    ws.column_dimensions["A"].width = 2
    ws.column_dimensions["B"].width = 140
    r = 1
    for kind, text in HOWTO:
        if kind == "h":
            r += 1                      # 見出しの前は1行あける
        c = ws[f"B{r}"]
        c.value = text
        if kind == "title":
            c.font = font(16, True, "7F6000")
            ws.row_dimensions[r].height = 28
        elif kind == "h":
            c.font = font(12, True, "1F3864")
        else:
            c.font = font(10)
        r += 1


# ================================================================ サンプルの名簿
SURNAMES = [
    ("佐藤", "さとう"), ("鈴木", "すずき"), ("高橋", "たかはし"), ("田中", "たなか"), ("伊藤", "いとう"),
    ("渡辺", "わたなべ"), ("山本", "やまもと"), ("中村", "なかむら"), ("小林", "こばやし"), ("加藤", "かとう"),
    ("吉田", "よしだ"), ("山田", "やまだ"), ("佐々木", "ささき"), ("山口", "やまぐち"), ("松本", "まつもと"),
    ("井上", "いのうえ"), ("木村", "きむら"), ("林", "はやし"), ("清水", "しみず"), ("山崎", "やまざき"),
    ("森", "もり"), ("池田", "いけだ"), ("橋本", "はしもと"), ("阿部", "あべ"), ("石川", "いしかわ"),
    ("前田", "まえだ"), ("藤田", "ふじた"), ("小川", "おがわ"), ("岡田", "おかだ"), ("後藤", "ごとう"),
    ("村上", "むらかみ"), ("近藤", "こんどう"), ("石井", "いしい"), ("坂本", "さかもと"), ("遠藤", "えんどう"),
    ("青木", "あおき"), ("藤井", "ふじい"), ("西村", "にしむら"), ("福田", "ふくだ"), ("太田", "おおた"),
    ("三浦", "みうら"), ("岡本", "おかもと"), ("松田", "まつだ"), ("中川", "なかがわ"), ("原田", "はらだ"),
    ("小野", "おの"), ("田村", "たむら"), ("竹内", "たけうち"), ("金子", "かねこ"), ("和田", "わだ"),
    ("中山", "なかやま"), ("石田", "いしだ"), ("上田", "うえだ"), ("森田", "もりた"), ("柴田", "しばた"),
    ("酒井", "さかい"), ("江口", "えぐち"), ("古賀", "こが"), ("江頭", "えがしら"), ("副島", "そえじま"),
    ("野中", "のなか"), ("北川", "きたがわ"), ("宮崎", "みやざき"), ("大久保", "おおくぼ"), ("山下", "やました"),
]
BOYS = [
    ("大翔", "ひろと"), ("蓮", "れん"), ("悠真", "ゆうま"), ("湊", "みなと"), ("陽翔", "はると"), ("樹", "いつき"),
    ("悠人", "ゆうと"), ("朝陽", "あさひ"), ("颯太", "そうた"), ("律", "りつ"), ("陸", "りく"), ("大和", "やまと"),
    ("奏太", "かなた"), ("健太", "けんた"), ("翔太", "しょうた"), ("拓海", "たくみ"), ("海斗", "かいと"),
    ("駿", "しゅん"), ("隼人", "はやと"), ("康介", "こうすけ"), ("亮", "りょう"), ("一輝", "かずき"),
    ("直樹", "なおき"), ("航", "わたる"), ("圭吾", "けいご"), ("智也", "ともや"), ("誠", "まこと"), ("太一", "たいち"),
]
GIRLS = [
    ("陽葵", "ひまり"), ("凛", "りん"), ("結菜", "ゆな"), ("葵", "あおい"), ("紬", "つむぎ"), ("芽依", "めい"),
    ("咲良", "さくら"), ("結衣", "ゆい"), ("美桜", "みお"), ("心春", "こはる"), ("杏", "あん"), ("莉子", "りこ"),
    ("優奈", "ゆうな"), ("彩花", "あやか"), ("千尋", "ちひろ"), ("美咲", "みさき"), ("七海", "ななみ"),
    ("花音", "かのん"), ("遥", "はるか"), ("愛莉", "あいり"), ("真央", "まお"), ("沙耶", "さや"), ("詩織", "しおり"),
    ("楓", "かえで"), ("琴音", "ことね"), ("日菜", "ひな"), ("美羽", "みう"), ("理沙", "りさ"),
]
NOTES = ["部活：サッカー", "部活：吹奏楽", "部活：バスケットボール", "部活：卓球", "部活：美術",
         "学級委員の経験あり", "生徒会", "合唱の伴奏経験あり", "部活：陸上", "図書委員"]


def make_students(seed=2026):
    rnd = random.Random(seed)
    used = set()
    students = []
    for old in (1, 2, 3):
        group = []
        for i in range(35):
            sex = "男" if i < 18 else "女"
            given = BOYS if sex == "男" else GIRLS
            while True:
                sn, sk = rnd.choice(SURNAMES)
                gn, gk = rnd.choice(given)
                if (sn + gn) not in used:
                    used.add(sn + gn)
                    break
            ability = rnd.gauss(62, 14)
            scores = [max(12, min(100, round(ability + rnd.gauss(0, 9)))) for _ in range(5)]
            if sex == "男":
                run = round(max(6.4, min(9.6, rnd.gauss(7.7, 0.45))), 1)
            else:
                run = round(max(7.4, min(10.8, rnd.gauss(8.9, 0.55))), 1)
            group.append({"old": old, "name": f"{sn}　{gn}", "kana": f"{sk}　{gk}", "sex": sex,
                          "scores": scores, "run": run, "piano": "×", "mood": "", "caution": "",
                          "absent": "", "sep": ["", "", ""], "note": ""})
        group.sort(key=lambda s: s["kana"])
        for i, st in enumerate(group):
            st["id"] = 2000 + old * 100 + i + 1
        students.extend(group)

    girls = [s for s in students if s["sex"] == "女"]
    boys = [s for s in students if s["sex"] == "男"]
    for s in rnd.sample(girls, 6) + rnd.sample(boys, 2):
        s["piano"] = "〇"
    for s in rnd.sample(students, 9):
        s["mood"] = "〇"
    for s in rnd.sample(boys, 5) + rnd.sample(girls, 2):
        s["caution"] = "〇"
    for s in rnd.sample(students, 5):
        s["absent"] = "〇"
    for s in rnd.sample(students, 14):
        s["note"] = rnd.choice(NOTES)
    # 分けたい人：同じ旧クラスの中で（実際によくある形）
    label = lambda s: f'{s["id"]} {s["name"]}'
    for _ in range(10):
        old = rnd.choice((1, 2, 3))
        a, b = rnd.sample([s for s in students if s["old"] == old], 2)
        slot = a["sep"].index("") if "" in a["sep"] else None
        if slot is not None and label(b) not in a["sep"]:
            a["sep"][slot] = label(b)
    # お互いに書いている組も1つ
    a, b = rnd.sample([s for s in students if s["old"] == 2], 2)
    a["sep"][2], b["sep"][2] = label(b), label(a)
    return students


def round_half_up(x, nd):
    q = Decimal(1).scaleb(-nd)
    return float(Decimal(str(x)).quantize(q, rounding=ROUND_HALF_UP))


def auto_plan(students):
    """①U列（自動案）と同じ計算を Python でする（サンプルの②を埋める・検算用）."""
    n = len(students)
    avg = {st["id"]: round_half_up(sum(st["scores"]) / len(st["scores"]), 1) for st in students}
    mean = sum(avg.values()) / n
    sd = (sum((a - mean) ** 2 for a in avg.values()) / n) ** 0.5 or 1
    z = {sid: (a - mean) / sd for sid, a in avg.items()}
    zr = {}
    for sex in ("男", "女"):
        runs = [st["run"] for st in students if st["sex"] == sex]
        if not runs:
            continue
        m = sum(runs) / len(runs)
        v = (sum(x ** 2 for x in runs) / len(runs) - m * m) ** 0.5
        v = v if v > 0 else 1
        for st in students:
            if st["sex"] == sex:
                zr[st["id"]] = (st["run"] - m) / v

    def grp(st):
        return (1 if is_yes(st["caution"]) else 2 if is_yes(st["piano"]) else 3 if is_yes(st["mood"])
                else 4 if is_yes(st["absent"]) else 5)

    key = {st["id"]: grp(st) * 10 ** 7 - int(Decimal(str(abs(z[st["id"]]) * 10000)).quantize(Decimal(1), ROUND_HALF_UP))
           for st in students}
    order = sorted(students, key=lambda st: (key[st["id"]], st["id"]))
    base, extra = divmod(n, NCLS)
    cap = {k: base + (1 if k <= extra else 0) for k in range(1, NCLS + 1)}
    flags = ("piano", "mood", "caution", "absent")
    plan, done = {}, []
    for st in order:
        keys = []
        for k in range(1, NCLS + 1):
            mem = [t for t in done if plan[t["id"]] == k]
            if len(mem) >= cap[k]:
                keys.append(1e15)
                continue
            g = sum(t["sex"] == st["sex"] for t in mem)
            fl = sum(sum(is_yes(t[x]) for t in mem) for x in flags if is_yes(st[x]))
            o = sum(t["old"] == st["old"] for t in mem)
            dev = sum(z[t["id"]] for t in mem)
            devr = sum(zr[t["id"]] for t in mem if t["sex"] == st["sex"])
            low = 100 * (z[st["id"]] * dev + RUN_MIX * zr[st["id"]] * devr + OLD_MIX * o)
            low = int(Decimal(repr(low)).quantize(Decimal(1), ROUND_HALF_UP))
            keys.append(g * 1e10 + fl * 1e8 + low + 1e6)
        plan[st["id"]] = keys.index(min(keys)) + 1
        done.append(st)
    return [(st["id"], plan[st["id"]]) for st in students]


# ================================================================ 組み立て
def build(path, students):
    wb = Workbook()
    ws1 = wb.active
    ws1.title = SH1
    ws2 = wb.create_sheet(SH2)
    ws3 = wb.create_sheet(SH3)
    ws_how = wb.create_sheet(SH_HOW)
    ws_set = wb.create_sheet(SH_SET)
    ws_log = wb.create_sheet(SH_LOG)
    ws_calc = wb.create_sheet(SH_CALC)
    build_roster(ws1, students)
    build_edit(ws2, auto_plan(students) if students else [])
    build_view(ws3)
    build_howto(ws_how)
    build_settings(ws_set)
    build_log(ws_log)
    build_calc(ws_calc)
    wb.calculation = CalcProperties(fullCalcOnLoad=True)
    wb.active = 0
    wb.save(path)


def add_cached_values(path):
    """LibreOffice で計算した値を、数式セルの「保存済みの値」として書き足す.

    Excel は保護ビュー（ダウンロード直後）では再計算しないので、値がないと空っぽに見える。
    数式・書式・隠し列などは openpyxl が書いたまま残し、<v> の中身だけを埋める。
    LibreOffice（soffice）がなければ何もしない（Excel で開けば計算される）。
    """
    from openpyxl import load_workbook
    if shutil.which("soffice") is None:
        print("  (soffice が見つからないので、保存済みの値は書き足しません)")
        return
    with tempfile.TemporaryDirectory() as tmp:
        prof = os.path.join(tmp, "profile")
        subprocess.run(["soffice", f"-env:UserInstallation=file://{prof}", "--headless",
                        "--convert-to", "xlsx:Calc MS Excel 2007 XML", "--outdir", tmp, path],
                       check=True, capture_output=True, timeout=600)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")      # LibreOffice が書いた拡張部分の警告は無視
            computed = load_workbook(os.path.join(tmp, os.path.basename(path)), data_only=True)
        with zipfile.ZipFile(path) as z:
            files = {n: z.read(n) for n in z.namelist()}
    wbxml = files["xl/workbook.xml"].decode("utf-8")
    rels = files["xl/_rels/workbook.xml.rels"].decode("utf-8")
    targets = dict(re.findall(r'<Relationship[^>]*Id="(rId\d+)"[^>]*Target="([^"]+)"', rels))
    targets.update({k: v for v, k in re.findall(r'<Relationship[^>]*Target="([^"]+)"[^>]*Id="(rId\d+)"', rels)})
    for name, rid in re.findall(r'<sheet[^>]*name="([^"]+)"[^>]*r:id="(rId\d+)"', wbxml):
        name = name.replace("&amp;", "&")
        target = targets[rid].lstrip("/")
        part = target if target.startswith("xl/") else "xl/" + target
        ws = computed[name]

        def fill_value(m):
            ref, attrs, formula = m.group(1), m.group(2), m.group(3)
            v = ws[ref].value
            if v is None or v == "":
                return f'<c r="{ref}"{attrs} t="str"><f>{formula}</f><v></v></c>'
            if isinstance(v, bool):
                return f'<c r="{ref}"{attrs} t="b"><f>{formula}</f><v>{int(v)}</v></c>'
            if isinstance(v, (int, float)):
                return f'<c r="{ref}"{attrs}><f>{formula}</f><v>{repr(v) if isinstance(v, float) else v}</v></c>'
            return f'<c r="{ref}"{attrs} t="str"><f>{formula}</f><v>{escape(str(v))}</v></c>'

        xml = files[part].decode("utf-8")
        xml = re.sub(r'<c r="([A-Z]+[0-9]+)"((?: s="[0-9]+")?)><f>(.*?)</f><v ?/?>(?:</v>)?</c>', fill_value, xml)
        files[part] = xml.encode("utf-8")
    tmp_out = path + ".tmp"
    with zipfile.ZipFile(tmp_out, "w", zipfile.ZIP_DEFLATED) as z:
        for n, data in files.items():
            z.writestr(n, data)
    os.replace(tmp_out, path)


def write_bas():
    src = os.path.join(HERE, "ClassChange_utf8.bas")
    dst = os.path.join(HERE, "クラス替えマクロ.bas")
    with open(src, encoding="utf-8") as f:
        text = f.read()
    text = text.replace("\r\n", "\n").replace("\n", "\r\n")
    with open(dst, "wb") as f:
        f.write(text.encode("cp932"))   # 日本語版Excelの取り込みは Shift_JIS
    return dst


def main():
    out_blank = os.path.join(HERE, "クラス替えシート.xlsx")
    out_sample = os.path.join(HERE, "クラス替えシート_サンプル入り.xlsx")
    build(out_blank, [])
    build(out_sample, make_students())
    if "--no-values" not in sys.argv:
        for p in (out_blank, out_sample):
            add_cached_values(p)
    bas = write_bas()
    for p in (out_blank, out_sample, bas):
        print("wrote", os.path.relpath(p, HERE))


if __name__ == "__main__":
    main()
