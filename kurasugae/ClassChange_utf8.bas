Attribute VB_Name = "ClassChange"
'==================================================================
'  クラス替えシート用マクロ（ClassChange）
'
'  はじめに1回だけ：Alt+F8 →「Setup_Buttons」→［実行］
'  （②クラス編成・③クラス一覧にボタンが作られます）
'
'  ボタンで動くもの
'    PasteAutoPlan   … ②の自動案（A・B列）を決定欄（D・E列）へ値で貼り付け
'    OptimizeAssign  … おまかせ最適化（分けたい人・男女・成績などを同時に考えて振り分け）
'    SwapByNumber    … ③で番号を2つ入れて入れ替え
'    MoveByNumber    … ③で番号と移動先の組を入れて1人だけ移動
'    SwapSelected    … ③（または②）で2人を選んで入れ替え
'    UndoLast        … 直前の入れ替え・移動を1つ戻す
'
'  ※ このファイルは make_kurasugae.py が「クラス替えマクロ.bas」（Shift_JIS）に変換します。
'==================================================================
Option Explicit

'--- シート名（シート名を変えたらここも直す） ---
Private Const SH_ROSTER As String = "①名簿入力"
Private Const SH_EDIT As String = "②クラス編成"
Private Const SH_VIEW As String = "③クラス一覧"
Private Const SH_SET As String = "設定"
Private Const SH_LOG As String = "入替履歴"

Private Const NCLS As Long = 3                 'クラス数

'--- ①名簿入力 ---
Private Const R_FIRST As Long = 4              'データの最初の行
Private Const R_LAST As Long = 153             'データの最後の行（150人分）
Private Const C_ID As Long = 1                 'A 番号
Private Const C_OLD As Long = 2                'B 旧クラス
Private Const C_AVG As Long = 11               'K 5教科平均
Private Const C_RUN As Long = 12               'L 50m走
Private Const C_AUTO As Long = 21              'U 自動案
Private Const C_GCODE As Long = 24             'X 性別コード（1男 2女 3その他）
Private Const C_PIANO As Long = 25             'Y ピアノ（1/0）
Private Const C_MOOD As Long = 26              'Z ムードメーカー（1/0）
Private Const C_CAUTION As Long = 27           'AA 注意（1/0）
Private Const C_ABSENT As Long = 28            'AB 休みがち（1/0）
Private Const C_SEP1 As Long = 33              'AG〜AI 分けたい人の番号
Private Const C_LASTCOL As Long = 36           'AJ

'--- ②クラス編成 ---
Private Const E_FIRST As Long = 9
Private Const E_LAST As Long = 158
Private Const E_AUTO_ID As Long = 1            'A 自動案の番号
Private Const E_AUTO_CLS As Long = 2           'B 自動案の組
Private Const E_ID As Long = 4                 'D 番号（決定欄）
Private Const E_CLS As Long = 5                'E 組（決定欄）
Private Const E_NAME As Long = 6               'F 氏名

'--- ③クラス一覧 ---
Private Const V_FIRST As Long = 17             '名前が並ぶ最初の行
Private Const V_LAST As Long = 66
Private Const V_BLOCK_START As Long = 2        '1組の左端（B列）
Private Const V_BLOCK_STEP As Long = 13        '次の組までの列数
Private Const V_BLOCK_WIDTH As Long = 12       '1つの組の列数
Private Const V_SWAP_A As String = "C5"
Private Const V_SWAP_B As String = "C6"
Private Const V_MOVE_ID As String = "P5"
Private Const V_MOVE_TO As String = "P6"
Private Const V_STATUS As String = "D7"
Private Const V_MARK_A As String = "AO3"       '直前に動かした人（黄色くする）
Private Const V_MARK_B As String = "AP3"

'--- 入替履歴 ---
Private Const LOG_FIRST As Long = 3

'--- おまかせ最適化 ---
Private Const W_SEP As Double = 1000           '分けたい人が同じ組（最優先）
Private Const W_PIANOMIN As Double = 100       'ピアノが0人の組をつくらない
Private Const F_MALE As Long = 1
Private Const F_FEMALE As Long = 2
Private Const F_SCORE As Long = 3
Private Const F_TOP As Long = 4
Private Const F_LOW As Long = 5
Private Const F_RUN As Long = 6
Private Const F_PIANO As Long = 7
Private Const F_MOOD As Long = 8
Private Const F_CAUTION As Long = 9
Private Const F_ABSENT As Long = 10
Private Const F_OLD0 As Long = 10              '旧クラスは11番目から

Private m_n As Long                            '人数
Private m_nF As Long                           'そろえたい項目の数
Private m_X() As Double                        'm_X(項目, 人)
Private m_W() As Double                        '項目ごとの重視度
Private m_S() As Double                        'm_S(項目, 組) 組ごとの合計
Private m_I() As Double                        'm_I(項目, 組) 理想の合計
Private m_cls() As Long                        'いまの組
Private m_g() As Long                          '性別コード
Private m_sz() As Long                         '組ごとの人数
Private m_adj() As Long                        '分けたい相手（両方向）
Private m_deg() As Long
Private m_pianoMin As Boolean


'==================================================================
'  ボタンを作る（はじめに1回だけ実行）
'==================================================================
Public Sub Setup_Buttons()
    On Error GoTo EH
    Dim e As Worksheet, v As Worksheet
    Set e = GetSheet(SH_EDIT)
    Set v = GetSheet(SH_VIEW)
    DeleteMyButtons e
    DeleteMyButtons v
    AddBtn e, "F5:F6", "自動案を貼り付け", "PasteAutoPlan"
    AddBtn e, "G5:J6", "おまかせ最適化", "OptimizeAssign"
    AddBtn e, "K5:N6", "選んだ2人を入替", "SwapSelected"
    AddBtn e, "O5:O6", "1つ戻す", "UndoLast"
    AddBtn v, "I5:L6", "入れ替え", "SwapByNumber"
    AddBtn v, "V5:Y6", "移動", "MoveByNumber"
    AddBtn v, "AB5:AG5", "選んだ2人を入れ替え", "SwapSelected"
    AddBtn v, "AI5:AM5", "1つ戻す", "UndoLast"
    MsgBox "ボタンを作りました。" & vbCrLf & vbCrLf & _
           "このあと［名前を付けて保存］で、ファイルの種類を" & vbCrLf & _
           "「Excel マクロ有効ブック（*.xlsm）」にして保存してください。", vbInformation, "クラス替え"
    Exit Sub
EH:
    MsgBox "ボタンを作れませんでした。" & vbCrLf & Err.Description, vbExclamation, "クラス替え"
End Sub


'==================================================================
'  ②：自動案（A・B列）を決定欄（D・E列）へ値で貼り付け
'==================================================================
Public Sub PasteAutoPlan()
    On Error GoTo EH
    Dim e As Worksheet, r As Long, cnt As Long
    Dim src As Variant, outArr() As Variant
    Set e = GetSheet(SH_EDIT)
    Application.Calculate
    src = e.Range(e.Cells(E_FIRST, E_AUTO_ID), e.Cells(E_LAST, E_AUTO_CLS)).Value
    ReDim outArr(1 To E_LAST - E_FIRST + 1, 1 To 2)
    For r = 1 To UBound(src, 1)
        If SafeStr(src(r, 1)) <> "" Then
            cnt = cnt + 1
            outArr(cnt, 1) = src(r, 1)
            outArr(cnt, 2) = src(r, 2)
        End If
    Next r
    If cnt = 0 Then
        MsgBox "自動案がありません。先に①名簿入力に名簿を入れてください。", vbExclamation, "自動案を貼り付け"
        Exit Sub
    End If
    If Not ConfirmOverwrite(e, "自動案を貼り付け") Then Exit Sub

    Application.ScreenUpdating = False
    WriteDecision e, outArr, cnt
    Application.ScreenUpdating = True
    AddLog "自動案貼付", "", cnt & "人", "", "", "", "", "", ""
    MarkMoved "", ""
    ShowStatus "自動案を決定欄に貼り付けました（" & cnt & "人）"
    Exit Sub
EH:
    Application.ScreenUpdating = True
    MsgBox "うまくいきませんでした。" & vbCrLf & Err.Description, vbExclamation, "自動案を貼り付け"
End Sub


'==================================================================
'  ③：番号を2つ入れて入れ替え
'==================================================================
Public Sub SwapByNumber()
    On Error GoTo EH
    Dim v As Worksheet, msg As String
    Set v = GetSheet(SH_VIEW)
    If DoSwap(v.Range(V_SWAP_A).Value, v.Range(V_SWAP_B).Value, msg) Then
        v.Range(V_SWAP_A).ClearContents
        v.Range(V_SWAP_B).ClearContents
        ShowStatus "入替：" & msg
    Else
        MsgBox msg, vbExclamation, "入れ替え"
    End If
    Exit Sub
EH:
    MsgBox "うまくいきませんでした。" & vbCrLf & Err.Description, vbExclamation, "入れ替え"
End Sub


'==================================================================
'  ③（または②）：選んだ2人を入れ替え
'    1人目をクリック → Ctrl を押しながら2人目をクリック → ボタン
'==================================================================
Public Sub SwapSelected()
    On Error GoTo EH
    Dim ids As Collection, msg As String
    If ActiveSheet.Name <> SH_VIEW And ActiveSheet.Name <> SH_EDIT Then
        MsgBox "③クラス一覧（または②クラス編成）で、入れ替える2人を選んでから押してください。", _
               vbInformation, "選んだ2人を入れ替え"
        Exit Sub
    End If
    Set ids = SelectedIds()
    If ids.Count <> 2 Then
        MsgBox "入れ替える2人を選んでください。" & vbCrLf & _
               "（1人目の名前をクリック → Ctrlキーを押しながら2人目をクリック）" & vbCrLf & vbCrLf & _
               "いま選ばれている人数： " & ids.Count & " 人", vbInformation, "選んだ2人を入れ替え"
        Exit Sub
    End If
    If DoSwap(ids(1), ids(2), msg) Then
        ShowStatus "入替：" & msg
    Else
        MsgBox msg, vbExclamation, "選んだ2人を入れ替え"
    End If
    Exit Sub
EH:
    MsgBox "うまくいきませんでした。" & vbCrLf & Err.Description, vbExclamation, "選んだ2人を入れ替え"
End Sub


'==================================================================
'  ③：1人だけ移動（番号と移動先の組を入れる）
'==================================================================
Public Sub MoveByNumber()
    On Error GoTo EH
    Dim v As Worksheet, e As Worksheet, r As Long, toC As Long, fromC As Variant, nm As String
    Set v = GetSheet(SH_VIEW)
    Set e = GetSheet(SH_EDIT)
    If SafeStr(v.Range(V_MOVE_ID).Value) = "" Then
        MsgBox "動かす人の番号を入れてください。", vbExclamation, "移動"
        Exit Sub
    End If
    r = FindEditRow(v.Range(V_MOVE_ID).Value)
    If r = 0 Then
        MsgBox "番号 " & SafeStr(v.Range(V_MOVE_ID).Value) & " が②の決定欄にありません。", vbExclamation, "移動"
        Exit Sub
    End If
    If Not IsValidClass(v.Range(V_MOVE_TO).Value) Then
        MsgBox "移動先の組（1～" & NCLS & "）を入れてください。", vbExclamation, "移動"
        Exit Sub
    End If
    toC = CLng(v.Range(V_MOVE_TO).Value)
    fromC = e.Cells(r, E_CLS).Value
    nm = NameOf(r)
    If SafeStr(fromC) = CStr(toC) Then
        MsgBox nm & " は、すでに " & toC & " 組です。", vbInformation, "移動"
        Exit Sub
    End If
    e.Cells(r, E_CLS).Value = toC
    AddLog "移動", e.Cells(r, E_ID).Value, nm, fromC, toC, "", "", "", ""
    MarkMoved e.Cells(r, E_ID).Value, ""
    v.Range(V_MOVE_ID).ClearContents
    ShowStatus "移動：" & nm & "（" & SafeStr(fromC) & "組→" & toC & "組）"
    Exit Sub
EH:
    MsgBox "うまくいきませんでした。" & vbCrLf & Err.Description, vbExclamation, "移動"
End Sub


'==================================================================
'  直前の「入替」「移動」を1つ戻す
'==================================================================
Public Sub UndoLast()
    On Error GoTo EH
    Dim lg As Worksheet, e As Worksheet, last As Long, op As String
    Dim r1 As Long, r2 As Long, desc As String
    Set lg = GetSheet(SH_LOG)
    Set e = GetSheet(SH_EDIT)
    last = LastLogRow(lg)
    If last < LOG_FIRST Then
        MsgBox "戻せる操作がありません。", vbInformation, "1つ戻す"
        Exit Sub
    End If
    op = SafeStr(lg.Cells(last, 2).Value)
    If op <> "入替" And op <> "移動" Then
        MsgBox "直前の操作「" & op & "」は、まとめて書きかえる操作なので戻せません。" & vbCrLf & _
               "（戻せるのは「入替」と「移動」だけです）", vbInformation, "1つ戻す"
        Exit Sub
    End If
    r1 = FindEditRow(lg.Cells(last, 3).Value)
    If r1 = 0 Then
        MsgBox "番号 " & SafeStr(lg.Cells(last, 3).Value) & " が②の決定欄にないため、戻せません。", vbExclamation, "1つ戻す"
        Exit Sub
    End If
    desc = SafeStr(lg.Cells(last, 4).Value)
    If op = "入替" Then
        r2 = FindEditRow(lg.Cells(last, 7).Value)
        If r2 = 0 Then
            MsgBox "番号 " & SafeStr(lg.Cells(last, 7).Value) & " が②の決定欄にないため、戻せません。", vbExclamation, "1つ戻す"
            Exit Sub
        End If
        e.Cells(r2, E_CLS).Value = lg.Cells(last, 9).Value
        desc = desc & " ⇔ " & SafeStr(lg.Cells(last, 8).Value)
        MarkMoved lg.Cells(last, 3).Value, lg.Cells(last, 7).Value
    Else
        MarkMoved lg.Cells(last, 3).Value, ""
    End If
    e.Cells(r1, E_CLS).Value = lg.Cells(last, 5).Value
    lg.Rows(last).Delete
    ShowStatus "1つ戻しました（" & op & "：" & desc & "）"
    Exit Sub
EH:
    MsgBox "うまくいきませんでした。" & vbCrLf & Err.Description, vbExclamation, "1つ戻す"
End Sub


'==================================================================
'  おまかせ最適化
'    分けたい人（最優先）・男女・成績・上位/下位・50m・ピアノ・
'    ムードメーカー・注意・休みがち・旧クラスの偏りを同時に考え、
'    2人の入れ替えをくり返して、いちばんバランスのよい案を②に書き込む。
'==================================================================
Public Sub OptimizeAssign()
    On Error GoTo EH
    Dim rs As Worksheet, e As Worksheet, st As Worksheet
    Dim data As Variant, rowOf() As Long, ids() As Variant
    Dim n As Long, i As Long, j As Long, k As Long, r As Long, s As Long, t As Long, g As Long
    Dim trials As Long, ii As Long, pass As Long
    Dim x As Double, d As Double, improved As Boolean
    Dim curCost As Double, bestCost As Double
    Dim best() As Long, ord() As Long, autoCls() As Long
    Dim avgv() As Double, hasAvg() As Boolean, runv() As Double, hasRun() As Boolean
    Dim oldIdx() As Long, oldLab() As String, nOld As Long, lab As String
    Dim wts(1 To 9) As Double
    Dim topThr As Double, lowThr As Double, hasTop As Boolean, hasLow As Boolean
    Dim sum1 As Double, sum2 As Double, cnt As Long, mean As Double, sd As Double
    Dim pairA() As Long, pairB() As Long, nPair As Long, maxDeg As Long
    Dim outArr() As Variant, conflicts As Long

    Set rs = GetSheet(SH_ROSTER)
    Set e = GetSheet(SH_EDIT)
    Set st = GetSheet(SH_SET)
    Application.Calculate

    '--- 名簿を読む ---
    data = rs.Range(rs.Cells(R_FIRST, 1), rs.Cells(R_LAST, C_LASTCOL)).Value
    ReDim rowOf(1 To UBound(data, 1))
    For r = 1 To UBound(data, 1)
        If SafeStr(data(r, C_ID)) <> "" Then
            n = n + 1
            rowOf(n) = r
        End If
    Next r
    If n < NCLS Then
        MsgBox "①名簿入力に名簿が入っていません。", vbExclamation, "おまかせ最適化"
        Exit Sub
    End If
    If Not ConfirmOverwrite(e, "おまかせ最適化") Then Exit Sub

    m_n = n
    ReDim ids(1 To n)
    ReDim m_g(1 To n)
    ReDim autoCls(1 To n)
    ReDim avgv(1 To n)
    ReDim hasAvg(1 To n)
    ReDim runv(1 To n)
    ReDim hasRun(1 To n)
    ReDim oldIdx(1 To n)
    ReDim oldLab(1 To n)
    For i = 1 To n
        r = rowOf(i)
        ids(i) = data(r, C_ID)
        m_g(i) = 3
        If TryNum(data(r, C_GCODE), x) Then m_g(i) = CLng(x)
        If m_g(i) < 1 Or m_g(i) > 3 Then m_g(i) = 3
        hasAvg(i) = TryNum(data(r, C_AVG), x)
        avgv(i) = x
        hasRun(i) = TryNum(data(r, C_RUN), x)
        runv(i) = x
        autoCls(i) = 0
        If TryNum(data(r, C_AUTO), x) Then autoCls(i) = CLng(x)
        If autoCls(i) < 1 Or autoCls(i) > NCLS Then autoCls(i) = ((i - 1) Mod NCLS) + 1
        lab = SafeStr(data(r, C_OLD))
        oldIdx(i) = 0
        If lab <> "" Then
            For k = 1 To nOld
                If oldLab(k) = lab Then
                    oldIdx(i) = k
                    Exit For
                End If
            Next k
            If oldIdx(i) = 0 Then
                nOld = nOld + 1
                oldLab(nOld) = lab
                oldIdx(i) = nOld
            End If
        End If
    Next i

    '--- 設定を読む ---
    For k = 1 To 9
        wts(k) = 5
        If TryNum(st.Cells(4 + k, 3).Value, x) Then wts(k) = x
        If wts(k) < 0 Then wts(k) = 0
    Next k
    m_pianoMin = (SafeStr(st.Range("C16").Value) <> "しない")
    trials = 20
    If TryNum(st.Range("C17").Value, x) Then trials = CLng(x)
    If trials < 1 Then trials = 1
    If trials > 500 Then trials = 500
    hasTop = TryNum(st.Range("C35").Value, topThr)
    hasLow = TryNum(st.Range("C36").Value, lowThr)

    '--- そろえたい項目をつくる（組ごとの合計を、人数に見合った値に近づける） ---
    m_nF = F_OLD0 + nOld
    ReDim m_X(1 To m_nF, 1 To n)
    ReDim m_W(1 To m_nF)
    m_W(F_MALE) = wts(1)
    m_W(F_FEMALE) = wts(1)
    m_W(F_SCORE) = wts(2)
    m_W(F_TOP) = wts(3)
    m_W(F_LOW) = wts(3)
    m_W(F_RUN) = wts(4)
    m_W(F_PIANO) = wts(5)
    m_W(F_MOOD) = wts(6)
    m_W(F_CAUTION) = wts(7)
    m_W(F_ABSENT) = wts(8)
    For k = 1 To nOld
        m_W(F_OLD0 + k) = wts(9)
    Next k

    ' 5教科平均は「平均からどれだけ離れているか」（標準化）にする
    sum1 = 0: sum2 = 0: cnt = 0
    For i = 1 To n
        If hasAvg(i) Then
            sum1 = sum1 + avgv(i)
            sum2 = sum2 + avgv(i) * avgv(i)
            cnt = cnt + 1
        End If
    Next i
    mean = 0: sd = 0
    If cnt > 0 Then mean = sum1 / cnt
    If cnt > 1 Then sd = Sqr(MaxD(0, sum2 / cnt - mean * mean))

    For i = 1 To n
        r = rowOf(i)
        If m_g(i) = 1 Then m_X(F_MALE, i) = 1
        If m_g(i) = 2 Then m_X(F_FEMALE, i) = 1
        If hasAvg(i) And sd > 0 Then m_X(F_SCORE, i) = (avgv(i) - mean) / sd
        If hasAvg(i) And hasTop And avgv(i) >= topThr Then m_X(F_TOP, i) = 1
        If hasAvg(i) And hasLow And avgv(i) <= lowThr Then m_X(F_LOW, i) = 1
        If TryNum(data(r, C_PIANO), x) Then m_X(F_PIANO, i) = x
        If TryNum(data(r, C_MOOD), x) Then m_X(F_MOOD, i) = x
        If TryNum(data(r, C_CAUTION), x) Then m_X(F_CAUTION, i) = x
        If TryNum(data(r, C_ABSENT), x) Then m_X(F_ABSENT, i) = x
        If oldIdx(i) > 0 Then m_X(F_OLD0 + oldIdx(i), i) = 1
    Next i

    ' 50m走は男女別に標準化する
    For g = 1 To 3
        sum1 = 0: sum2 = 0: cnt = 0
        For i = 1 To n
            If m_g(i) = g And hasRun(i) Then
                sum1 = sum1 + runv(i)
                sum2 = sum2 + runv(i) * runv(i)
                cnt = cnt + 1
            End If
        Next i
        If cnt > 1 Then
            mean = sum1 / cnt
            sd = Sqr(MaxD(0, sum2 / cnt - mean * mean))
            If sd > 0 Then
                For i = 1 To n
                    If m_g(i) = g And hasRun(i) Then m_X(F_RUN, i) = (runv(i) - mean) / sd
                Next i
            End If
        End If
    Next g

    ' ピアノが3人以上いるときだけ「各組に最低1人」を考える
    sum1 = 0
    For i = 1 To n
        sum1 = sum1 + m_X(F_PIANO, i)
    Next i
    If sum1 < NCLS Then m_pianoMin = False

    '--- 分けたい人のつながり（どちらが書いても同じ扱い） ---
    ReDim m_deg(1 To n)
    ReDim pairA(1 To n * 3)
    ReDim pairB(1 To n * 3)
    nPair = 0
    For i = 1 To n
        r = rowOf(i)
        For s = 0 To 2
            j = FindIndex(ids, n, data(r, C_SEP1 + s))
            If j > 0 And j <> i Then
                nPair = nPair + 1
                pairA(nPair) = i
                pairB(nPair) = j
                m_deg(i) = m_deg(i) + 1
                m_deg(j) = m_deg(j) + 1
            End If
        Next s
    Next i
    maxDeg = 1
    For i = 1 To n
        If m_deg(i) > maxDeg Then maxDeg = m_deg(i)
        m_deg(i) = 0
    Next i
    ReDim m_adj(1 To n, 1 To maxDeg)
    For k = 1 To nPair
        i = pairA(k)
        j = pairB(k)
        m_deg(i) = m_deg(i) + 1
        m_adj(i, m_deg(i)) = j
        m_deg(j) = m_deg(j) + 1
        m_adj(j, m_deg(j)) = i
    Next k

    '--- 組の人数は自動案と同じにする（差は最大1人） ---
    ReDim m_sz(1 To NCLS)
    For i = 1 To n
        m_sz(autoCls(i)) = m_sz(autoCls(i)) + 1
    Next i

    '--- 入れ替えをくり返す（1回目は自動案から、2回目以降はランダムな案から） ---
    ReDim m_cls(1 To n)
    ReDim best(1 To n)
    ReDim ord(1 To n)
    ReDim m_S(1 To m_nF, 1 To NCLS)
    ReDim m_I(1 To m_nF, 1 To NCLS)
    Randomize
    bestCost = 1E+300
    For t = 1 To trials
        If t = 1 Then
            For i = 1 To n
                m_cls(i) = autoCls(i)
            Next i
        Else
            RandomInit
        End If
        RecalcSums
        pass = 0
        Do
            improved = False
            pass = pass + 1
            ShuffleOrder ord, n
            For ii = 1 To n
                i = ord(ii)
                For j = 1 To n
                    If m_cls(j) <> m_cls(i) Then
                        d = SwapDelta(i, j)
                        If d < -0.000001 Then
                            ApplySwap i, j
                            improved = True
                        End If
                    End If
                Next j
            Next ii
        Loop While improved And pass < 100
        curCost = TotalCost()
        If curCost < bestCost - 0.000001 Then
            bestCost = curCost
            For i = 1 To n
                best(i) = m_cls(i)
            Next i
        End If
        Application.StatusBar = "おまかせ最適化：計算中… " & t & " / " & trials
        DoEvents
    Next t
    Application.StatusBar = False

    '--- ②に書き込む ---
    For i = 1 To n
        m_cls(i) = best(i)
    Next i
    conflicts = CountConflicts()
    ReDim outArr(1 To E_LAST - E_FIRST + 1, 1 To 2)
    For i = 1 To n
        outArr(i, 1) = ids(i)
        outArr(i, 2) = best(i)
    Next i
    Application.ScreenUpdating = False
    WriteDecision e, outArr, n
    Application.ScreenUpdating = True
    AddLog "おまかせ最適化", "", n & "人", "", "", "", "", "", ""
    MarkMoved "", ""
    ShowStatus "おまかせ最適化で振り分けました（" & n & "人・分けたい人の重なり " & conflicts & " 件）"
    MsgBox "おまかせ最適化が終わりました。" & vbCrLf & vbCrLf & _
           "分けたい人が同じ組： " & conflicts & " 件" & vbCrLf & _
           "③クラス一覧で確かめてください。" & vbCrLf & _
           "（もう一度押すと、少し違う案が出ます）", vbInformation, "おまかせ最適化"
    Exit Sub
EH:
    Application.StatusBar = False
    Application.ScreenUpdating = True
    MsgBox "うまくいきませんでした。" & vbCrLf & Err.Description, vbExclamation, "おまかせ最適化"
End Sub


'==================================================================
'  ここから下は、上のマクロが使う部品
'==================================================================

'--- 2人を入れ替える（②のE列を書きかえる） ---
Private Function DoSwap(ByVal idA As Variant, ByVal idB As Variant, ByRef msg As String) As Boolean
    Dim e As Worksheet, ra As Long, rb As Long, ca As Variant, cb As Variant
    Dim na As String, nb As String
    Set e = GetSheet(SH_EDIT)
    If SafeStr(idA) = "" Or SafeStr(idB) = "" Then
        msg = "入れ替える2人の番号を入れてください。"
        Exit Function
    End If
    ra = FindEditRow(idA)
    rb = FindEditRow(idB)
    If ra = 0 Then
        msg = "番号 " & SafeStr(idA) & " が②の決定欄にありません。"
        Exit Function
    End If
    If rb = 0 Then
        msg = "番号 " & SafeStr(idB) & " が②の決定欄にありません。"
        Exit Function
    End If
    If ra = rb Then
        msg = "同じ人が選ばれています。"
        Exit Function
    End If
    ca = e.Cells(ra, E_CLS).Value
    cb = e.Cells(rb, E_CLS).Value
    na = NameOf(ra)
    nb = NameOf(rb)
    If SafeStr(ca) = SafeStr(cb) Then
        msg = na & " と " & nb & " は、どちらも " & SafeStr(ca) & " 組です。"
        Exit Function
    End If
    e.Cells(ra, E_CLS).Value = cb
    e.Cells(rb, E_CLS).Value = ca
    AddLog "入替", e.Cells(ra, E_ID).Value, na, ca, cb, e.Cells(rb, E_ID).Value, nb, cb, ca
    MarkMoved e.Cells(ra, E_ID).Value, e.Cells(rb, E_ID).Value
    msg = na & "（" & SafeStr(ca) & "組→" & SafeStr(cb) & "組）　⇔　" & _
          nb & "（" & SafeStr(cb) & "組→" & SafeStr(ca) & "組）"
    DoSwap = True
End Function

'--- いま選ばれているセルから、番号を集める ---
Private Function SelectedIds() As Collection
    Dim col As Collection, ws As Worksheet, ar As Range
    Dim r As Long, c As Long, r1 As Long, r2 As Long, c1 As Long, c2 As Long
    Dim k As Long, off As Long, id As String
    Set col = New Collection
    Set SelectedIds = col
    If TypeName(Selection) <> "Range" Then Exit Function
    Set ws = ActiveSheet
    If ws.Name = SH_VIEW Then
        For Each ar In Selection.Areas
            r1 = MaxL(ar.Row, V_FIRST)
            r2 = MinL(ar.Row + ar.Rows.Count - 1, V_LAST)
            c1 = MaxL(ar.Column, V_BLOCK_START)
            c2 = MinL(ar.Column + ar.Columns.Count - 1, V_BLOCK_START + V_BLOCK_STEP * (NCLS - 1) + V_BLOCK_WIDTH - 1)
            For r = r1 To r2
                For c = c1 To c2
                    k = (c - V_BLOCK_START) \ V_BLOCK_STEP
                    off = (c - V_BLOCK_START) Mod V_BLOCK_STEP
                    If off < V_BLOCK_WIDTH Then
                        id = SafeStr(ws.Cells(r, V_BLOCK_START + k * V_BLOCK_STEP + 1).Value)
                        If id <> "" Then AddUnique col, id
                    End If
                Next c
            Next r
        Next ar
    ElseIf ws.Name = SH_EDIT Then
        For Each ar In Selection.Areas
            r1 = MaxL(ar.Row, E_FIRST)
            r2 = MinL(ar.Row + ar.Rows.Count - 1, E_LAST)
            For r = r1 To r2
                id = SafeStr(ws.Cells(r, E_ID).Value)
                If id <> "" Then AddUnique col, id
            Next r
        Next ar
    End If
End Function

Private Sub AddUnique(ByVal col As Collection, ByVal id As String)
    On Error Resume Next
    col.Add id, "k" & id
    On Error GoTo 0
End Sub

'--- ②の決定欄で、その番号がある行を探す（なければ0） ---
Private Function FindEditRow(ByVal id As Variant) As Long
    Dim e As Worksheet, v As Variant, r As Long, sv As String
    sv = NormId(id)
    If sv = "" Then Exit Function
    Set e = GetSheet(SH_EDIT)
    v = e.Range(e.Cells(E_FIRST, E_ID), e.Cells(E_LAST, E_ID)).Value
    For r = 1 To UBound(v, 1)
        If NormId(v(r, 1)) = sv Then
            FindEditRow = E_FIRST + r - 1
            Exit Function
        End If
    Next r
End Function

Private Function NameOf(ByVal r As Long) As String
    Dim e As Worksheet
    Set e = GetSheet(SH_EDIT)
    NameOf = SafeStr(e.Cells(r, E_NAME).Value)
    If NameOf = "" Then NameOf = "番号" & SafeStr(e.Cells(r, E_ID).Value)
End Function

'--- 決定欄（②のD・E列）を空にして、先頭から cnt 行だけ書く ---
Private Sub WriteDecision(ByVal e As Worksheet, ByRef arr() As Variant, ByVal cnt As Long)
    Dim outArr() As Variant, i As Long
    e.Range(e.Cells(E_FIRST, E_ID), e.Cells(E_LAST, E_CLS)).ClearContents
    If cnt < 1 Then Exit Sub
    ReDim outArr(1 To cnt, 1 To 2)
    For i = 1 To cnt
        outArr(i, 1) = arr(i, 1)
        outArr(i, 2) = arr(i, 2)
    Next i
    e.Range(e.Cells(E_FIRST, E_ID), e.Cells(E_FIRST + cnt - 1, E_CLS)).Value = outArr
End Sub

'--- 入替履歴の最後の行（まだ何もなければ LOG_FIRST - 1） ---
Private Function LastLogRow(ByVal lg As Worksheet) As Long
    Dim r As Long
    r = LOG_FIRST
    Do While SafeStr(lg.Cells(r, 2).Value) <> ""
        r = r + 1
    Loop
    LastLogRow = r - 1
End Function

Private Function ConfirmOverwrite(ByVal e As Worksheet, ByVal ttl As String) As Boolean
    Dim filled As Double
    filled = Application.WorksheetFunction.CountA(e.Range(e.Cells(E_FIRST, E_ID), e.Cells(E_LAST, E_CLS)))
    If filled = 0 Then
        ConfirmOverwrite = True
    Else
        ConfirmOverwrite = (MsgBox("決定欄（②のD・E列）に入っている内容を上書きします。" & vbCrLf & _
            "手で直した組も書きかわります。よろしいですか？", _
            vbYesNo + vbQuestion + vbDefaultButton2, ttl) = vbYes)
    End If
End Function

'--- 入替履歴に1行書く ---
Private Sub AddLog(ByVal op As String, ByVal id1 As Variant, ByVal nm1 As String, _
                   ByVal from1 As Variant, ByVal to1 As Variant, ByVal id2 As Variant, _
                   ByVal nm2 As String, ByVal from2 As Variant, ByVal to2 As Variant)
    Dim lg As Worksheet, r As Long
    On Error GoTo Done
    Set lg = GetSheet(SH_LOG)
    r = LastLogRow(lg) + 1
    lg.Cells(r, 1).Value = Now
    lg.Cells(r, 1).NumberFormat = "m/d h:mm:ss"
    lg.Cells(r, 2).Value = op
    lg.Cells(r, 3).Value = id1
    lg.Cells(r, 4).Value = nm1
    lg.Cells(r, 5).Value = from1
    lg.Cells(r, 6).Value = to1
    lg.Cells(r, 7).Value = id2
    lg.Cells(r, 8).Value = nm2
    lg.Cells(r, 9).Value = from2
    lg.Cells(r, 10).Value = to2
Done:
End Sub

'--- ③の「直前の操作」欄に書く ---
Private Sub ShowStatus(ByVal msg As String)
    On Error Resume Next
    GetSheet(SH_VIEW).Range(V_STATUS).Value = Format$(Now, "h:mm") & "　" & msg
    Application.StatusBar = False
End Sub

'--- 直前に動かした人を③で黄色くする ---
Private Sub MarkMoved(ByVal idA As Variant, ByVal idB As Variant)
    On Error Resume Next
    GetSheet(SH_VIEW).Range(V_MARK_A).Value = idA
    GetSheet(SH_VIEW).Range(V_MARK_B).Value = idB
End Sub

'--- ボタン ---
Private Sub DeleteMyButtons(ByVal ws As Worksheet)
    Dim i As Long
    For i = ws.Shapes.Count To 1 Step -1
        If Left$(ws.Shapes(i).Name, 6) = "btnCC_" Then ws.Shapes(i).Delete
    Next i
End Sub

Private Sub AddBtn(ByVal ws As Worksheet, ByVal addr As String, ByVal cap As String, ByVal macroName As String)
    Dim rg As Range, wsObj As Object, b As Object
    Set rg = ws.Range(addr)
    Set wsObj = ws
    Set b = wsObj.Buttons.Add(rg.Left + 2, rg.Top + 2, rg.Width - 4, rg.Height - 4)
    b.OnAction = macroName
    b.Caption = cap
    b.Name = "btnCC_" & macroName
End Sub

'--- シートを名前で取り出す ---
Private Function GetSheet(ByVal nm As String) As Worksheet
    On Error Resume Next
    Set GetSheet = ThisWorkbook.Worksheets(nm)
    On Error GoTo 0
    If GetSheet Is Nothing Then
        Err.Raise vbObjectError + 513, "ClassChange", _
            "シート「" & nm & "」が見つかりません。（シート名を変えた場合は、元の名前に戻してください）"
    End If
End Function

'--- 小さな道具 ---
Private Function SafeStr(ByVal v As Variant) As String
    If IsError(v) Then Exit Function
    If IsEmpty(v) Or IsNull(v) Then Exit Function
    SafeStr = Trim$(CStr(v))
End Function

Private Function NormId(ByVal v As Variant) As String
    NormId = SafeStr(v)
    On Error Resume Next
    NormId = StrConv(NormId, vbNarrow)          '全角の数字も半角とみなす
End Function

Private Function TryNum(ByVal v As Variant, ByRef outV As Double) As Boolean
    outV = 0
    If IsError(v) Then Exit Function
    If IsEmpty(v) Or IsNull(v) Then Exit Function
    If VarType(v) = vbString Then
        If Trim$(v) = "" Then Exit Function
    End If
    If Not IsNumeric(v) Then Exit Function
    outV = CDbl(v)
    TryNum = True
End Function

Private Function IsValidClass(ByVal v As Variant) As Boolean
    Dim x As Double
    If Not TryNum(v, x) Then Exit Function
    If x <> Int(x) Then Exit Function
    If x < 1 Or x > NCLS Then Exit Function
    IsValidClass = True
End Function

Private Function FindIndex(ByRef ids() As Variant, ByVal n As Long, ByVal v As Variant) As Long
    Dim i As Long, sv As String
    sv = NormId(v)
    If sv = "" Then Exit Function
    For i = 1 To n
        If NormId(ids(i)) = sv Then
            FindIndex = i
            Exit Function
        End If
    Next i
End Function

Private Function MaxD(ByVal a As Double, ByVal b As Double) As Double
    If a > b Then MaxD = a Else MaxD = b
End Function

Private Function MaxL(ByVal a As Long, ByVal b As Long) As Long
    If a > b Then MaxL = a Else MaxL = b
End Function

Private Function MinL(ByVal a As Long, ByVal b As Long) As Long
    If a < b Then MinL = a Else MinL = b
End Function

'--- 最適化の部品 ---
Private Sub ShuffleOrder(ByRef ord() As Long, ByVal n As Long)
    Dim i As Long, j As Long, tmp As Long
    For i = 1 To n
        ord(i) = i
    Next i
    For i = n To 2 Step -1
        j = Int(Rnd() * i) + 1
        tmp = ord(i)
        ord(i) = ord(j)
        ord(j) = tmp
    Next i
End Sub

'男子→女子→その他の順に、人数に空きがある組のうち同じ性別が少ない組へ入れていく
Private Sub RandomInit()
    Dim cap() As Long, gcnt() As Long, ord() As Long
    Dim i As Long, ii As Long, c As Long, bestC As Long, g As Long, nTie As Long
    ReDim cap(1 To NCLS)
    ReDim gcnt(1 To 3, 1 To NCLS)
    ReDim ord(1 To m_n)
    For c = 1 To NCLS
        cap(c) = m_sz(c)
    Next c
    ShuffleOrder ord, m_n
    For g = 1 To 3
        For ii = 1 To m_n
            i = ord(ii)
            If m_g(i) = g Then
                bestC = 0
                nTie = 0
                For c = 1 To NCLS
                    If cap(c) > 0 Then
                        If bestC = 0 Then
                            bestC = c
                            nTie = 1
                        ElseIf gcnt(g, c) < gcnt(g, bestC) Then
                            bestC = c
                            nTie = 1
                        ElseIf gcnt(g, c) = gcnt(g, bestC) Then
                            nTie = nTie + 1
                            If Rnd() < 1 / nTie Then bestC = c
                        End If
                    End If
                Next c
                m_cls(i) = bestC
                cap(bestC) = cap(bestC) - 1
                gcnt(g, bestC) = gcnt(g, bestC) + 1
            End If
        Next ii
    Next g
End Sub

Private Sub RecalcSums()
    Dim f As Long, c As Long, i As Long, tot As Double
    For f = 1 To m_nF
        For c = 1 To NCLS
            m_S(f, c) = 0
        Next c
    Next f
    For i = 1 To m_n
        For f = 1 To m_nF
            m_S(f, m_cls(i)) = m_S(f, m_cls(i)) + m_X(f, i)
        Next f
    Next i
    For f = 1 To m_nF
        tot = 0
        For c = 1 To NCLS
            tot = tot + m_S(f, c)
        Next c
        For c = 1 To NCLS
            m_I(f, c) = tot * m_sz(c) / m_n
        Next c
    Next f
End Sub

'i と j を入れ替えたら、全体の「ずれ」がどれだけ変わるか（マイナスなら良くなる）
Private Function SwapDelta(ByVal i As Long, ByVal j As Long) As Double
    Dim a As Long, b As Long, f As Long, k As Long, v As Long, cnt As Long
    Dim d As Double, tot As Double, pa As Double, pb As Double
    a = m_cls(i)
    b = m_cls(j)
    For f = 1 To m_nF
        d = m_X(f, j) - m_X(f, i)
        If d <> 0 Then
            tot = tot + m_W(f) * (2 * d * ((m_S(f, a) - m_I(f, a)) - (m_S(f, b) - m_I(f, b))) + 2 * d * d)
        End If
    Next f
    cnt = 0
    For k = 1 To m_deg(i)
        v = m_adj(i, k)
        If v <> j Then
            If m_cls(v) = b Then cnt = cnt + 1
            If m_cls(v) = a Then cnt = cnt - 1
        End If
    Next k
    For k = 1 To m_deg(j)
        v = m_adj(j, k)
        If v <> i Then
            If m_cls(v) = a Then cnt = cnt + 1
            If m_cls(v) = b Then cnt = cnt - 1
        End If
    Next k
    tot = tot + W_SEP * cnt
    If m_pianoMin Then
        d = m_X(F_PIANO, j) - m_X(F_PIANO, i)
        If d <> 0 Then
            pa = m_S(F_PIANO, a)
            pb = m_S(F_PIANO, b)
            tot = tot + W_PIANOMIN * (ZeroFlag(pa + d) + ZeroFlag(pb - d) - ZeroFlag(pa) - ZeroFlag(pb))
        End If
    End If
    SwapDelta = tot
End Function

Private Function ZeroFlag(ByVal x As Double) As Double
    If x < 0.5 Then ZeroFlag = 1 Else ZeroFlag = 0
End Function

Private Sub ApplySwap(ByVal i As Long, ByVal j As Long)
    Dim a As Long, b As Long, f As Long, d As Double
    a = m_cls(i)
    b = m_cls(j)
    For f = 1 To m_nF
        d = m_X(f, j) - m_X(f, i)
        If d <> 0 Then
            m_S(f, a) = m_S(f, a) + d
            m_S(f, b) = m_S(f, b) - d
        End If
    Next f
    m_cls(i) = b
    m_cls(j) = a
End Sub

Private Function CountConflicts() As Long
    Dim i As Long, k As Long, cnt As Long
    For i = 1 To m_n
        For k = 1 To m_deg(i)
            If m_cls(m_adj(i, k)) = m_cls(i) Then cnt = cnt + 1
        Next k
    Next i
    CountConflicts = cnt \ 2
End Function

Private Function TotalCost() As Double
    Dim f As Long, c As Long, tot As Double
    For f = 1 To m_nF
        For c = 1 To NCLS
            tot = tot + m_W(f) * (m_S(f, c) - m_I(f, c)) ^ 2
        Next c
    Next f
    tot = tot + W_SEP * CountConflicts()
    If m_pianoMin Then
        For c = 1 To NCLS
            If m_S(F_PIANO, c) < 0.5 Then tot = tot + W_PIANOMIN
        Next c
    End If
    TotalCost = tot
End Function
