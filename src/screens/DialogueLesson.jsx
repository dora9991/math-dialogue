// ============================================================
// DialogueLesson.jsx — 対話型数学授業（試作）
//  ・黒板（板書：書いて残る）と 先生（発話：声で消える）を空間的に分離
//  ・本発問→補助発問→説明 の発問モデルで、AI先生と対話しながら進む
//  ・音声入力(Web Speech API)＋文字入力の両対応、先生の声は音声合成
//  データ：src/data/dialogue/questionBank.json（発問バンク中1）
//  エンジン：src/data/dialogue/teacher.js（将来 Claude API に差し替え可）
// ============================================================
import { useState, useEffect, useRef } from "react";
import Header from "../components/Header.jsx";
import bank from "../data/dialogue/questionBank.json";
import { startLesson, respond, isScripted } from "../data/dialogue/teacher.js";

// 図(png)をURLとして解決（Viteのglob）。questionBank の "figures/xxx.png" と突き合わせる
const FIG_URLS = import.meta.glob("../data/dialogue/figures/*.png", { eager: true, query: "?url", import: "default" });
const figUrl = (rel) => {
  const name = (rel || "").split("/").pop();
  const hit = Object.entries(FIG_URLS).find(([k]) => k.endsWith("/" + name));
  return hit ? hit[1] : null;
};

const CHAP_NAME = (title) => (title.match(/「(.+?)」/)?.[1]) || title;

// 板書1行の色分け（黒板のチョーク色）
const LINE_STYLE = {
  problem: { color: "#fef9c3", fontWeight: 800 },           // 課題＝黄チョーク
  work: { color: "#bae6fd", fontWeight: 600 },              // 途中の考え＝水色
  student: { color: "#fff", fontWeight: 700 },              // 生徒が言ったこと＝白（強調）
  result: { color: "#86efac", fontWeight: 900, fontSize: 19 },// 結論＝緑チョーク・大
  goal: { color: "#fda4af", fontWeight: 800 },              // まとめ・ねらい＝桃チョーク
};

export default function DialogueLesson({ player, onBack }) {
  const [lesson, setLesson] = useState(null);  // 選択中レッスン（null=選択画面）
  if (!lesson) return <Picker player={player} onPick={setLesson} onBack={onBack} />;
  return <Board player={player} lesson={lesson} onExit={() => setLesson(null)} />;
}

// ── レッスン選択（章 → 授業） ─────────────────────────
function Picker({ player, onPick, onBack }) {
  const [chap, setChap] = useState(null);
  const chapters = bank.chapters;
  const lessonsOf = (cid) => bank.lessons.filter((l) => l.chapterId === cid);

  return (
    <div className="app">
      <Header player={player} />
      <div className="content">
        <button className="back-btn" onClick={onBack}>← もどる</button>
        <div className="glass" style={{ padding: 16, marginTop: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>🧑‍🏫 AIと対話する授業</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.6)", lineHeight: 1.6 }}>
            先生が黒板を使いながら問いかけます。声でも文字でも答えてOK。
            答えを当てるより「どう考えたか」を大事にする授業です。
          </div>
        </div>

        {!chap ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)", marginBottom: 8 }}>中1・単元をえらぶ</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {chapters.map((c) => {
                const ls = lessonsOf(c.chapterId);
                const ready = ls.filter((l) => isScripted(l.id)).length;
                return (
                  <button key={c.chapterId} className="mode-card" onClick={() => setChap(c)}
                    style={{ background: "rgba(255,255,255,.05)", alignItems: "flex-start", textAlign: "left", padding: 14 }}>
                    <span style={{ fontSize: 15, fontWeight: 900 }}>{CHAP_NAME(c.title)}</span>
                    <span style={{ fontSize: 11, opacity: .7 }}>{ls.length}授業
                      {ready > 0 && <span style={{ color: "#86efac" }}> ・対話{ready}本✨</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            <button className="back-btn" onClick={() => setChap(null)} style={{ marginBottom: 8 }}>← 単元一覧</button>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 8 }}>{CHAP_NAME(chap.title)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lessonsOf(chap.chapterId).map((l) => {
                const ready = isScripted(l.id);
                return (
                  <button key={l.id} onClick={() => onPick(l)} className="nb-btn"
                    style={{ textAlign: "left", display: "flex", gap: 10, alignItems: "center",
                      borderColor: ready ? "rgba(134,239,172,.4)" : "rgba(255,255,255,.11)" }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: ready ? "#86efac" : "rgba(255,255,255,.4)", whiteSpace: "nowrap" }}>
                      {ready ? "対話✨" : "発問のみ"}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, display: "block" }}>{l.shosetsu}</span>
                      <span style={{ fontSize: 11, opacity: .6, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{l.hatsumon}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 黒板＋先生＋入力 ───────────────────────────────────
function Board({ player, lesson, onExit }) {
  const [state, setState] = useState(() => startLesson(lesson));
  const [input, setInput] = useState("");
  const [voiceOn, setVoiceOn] = useState(true);   // 先生の声（音声合成）
  const [listening, setListening] = useState(false);
  const boardRef = useRef(null);
  const recogRef = useRef(null);

  const lastTeacher = [...state.messages].reverse().find((m) => m.who === "teacher");

  // 板書が伸びたら下までスクロール
  useEffect(() => {
    if (boardRef.current) boardRef.current.scrollTop = boardRef.current.scrollHeight;
  }, [state.board.length]);

  // 先生の最新の発話を読み上げる
  useEffect(() => {
    if (!voiceOn || !lastTeacher) return;
    try {
      const u = new SpeechSynthesisUtterance(lastTeacher.text.replace(/（補助）/g, ""));
      u.lang = "ja-JP"; u.rate = 1.02; u.pitch = 1.1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* 非対応ブラウザは黙ってスキップ */ }
    return () => { try { window.speechSynthesis.cancel(); } catch {} };
  }, [state.messages.length, voiceOn]); // eslint-disable-line

  const send = (text) => {
    const t = (text ?? input).trim();
    if (!t || state.done) return;
    setState((s) => respond(s, lesson, t));
    setInput("");
  };

  // 音声入力（Web Speech API）。非対応なら黙って無効。
  const toggleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("このブラウザは音声入力に未対応です。文字で入力してね。"); return; }
    if (listening) { recogRef.current?.stop(); return; }
    const r = new SR();
    r.lang = "ja-JP"; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => { const txt = e.results[0][0].transcript; setInput(txt); setTimeout(() => send(txt), 150); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r; setListening(true); r.start();
  };

  const teacherFace = state.done ? "🎉" : (lastTeacher?.text.includes("（補助）") || lastTeacher?.text.includes("ヒント")) ? "🤔" : "🧑‍🏫";
  const fig = lesson.figures?.[0] ? figUrl(lesson.figures[0]) : null;

  return (
    <div className="app">
      <Header player={player} />
      <div className="content" style={{ maxWidth: 880, display: "flex", flexDirection: "column", height: "calc(100dvh - 64px)" }}>
        {/* 上部バー：めあて */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <button className="back-btn" onClick={onExit}>← 授業をえらぶ</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 900, color: "#fef9c3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              📌 めあて：{(lesson.nerai || "").split("／")[0]}
            </div>
          </div>
          <button className="back-btn" onClick={() => setVoiceOn((v) => !v)} title="先生の声">
            {voiceOn ? "🔊 声ON" : "🔇 声OFF"}
          </button>
        </div>

        {/* 黒板 ＋ 先生（左右分割） */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 12 }}>
          {/* 左：黒板（書いて残る） */}
          <div ref={boardRef} style={{
            flex: 1, minWidth: 0, overflowY: "auto",
            background: "linear-gradient(160deg,#15352b,#0f2a22)",
            border: "10px solid #6b4423", borderRadius: 12,
            boxShadow: "inset 0 0 60px rgba(0,0,0,.5)", padding: "18px 20px",
            fontFamily: "'Yu Kyokasho','Hiragino Maru Gothic ProN',sans-serif",
          }}>
            {fig && <img src={fig} alt="" style={{ maxWidth: "62%", borderRadius: 8, marginBottom: 14, background: "rgba(255,255,255,.92)", padding: 6 }} />}
            {state.board.map((ln, i) => (
              <div key={i} style={{ marginBottom: 11, fontSize: 17, lineHeight: 1.5, letterSpacing: ".02em", ...LINE_STYLE[ln.kind], animation: "fadeUp .35s both" }}>
                {ln.mark && <span style={{ marginRight: 6 }}>{ln.mark}</span>}{ln.text}
              </div>
            ))}
          </div>

          {/* 右：先生（声で問いかける・消える） */}
          <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ textAlign: "center", fontSize: 64, lineHeight: 1, filter: "drop-shadow(0 4px 10px rgba(0,0,0,.4))" }}>{teacherFace}</div>
            <div className="glass" style={{ flex: 1, padding: 13, fontSize: 13.5, lineHeight: 1.65, position: "relative", overflowY: "auto" }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: "#a5b4fc", marginBottom: 5 }}>先生</div>
              {lastTeacher?.text.replace(/（補助）/g, "💡 ")}
            </div>
          </div>
        </div>

        {/* 下：生徒の応答（音声・文字） */}
        <div style={{ marginTop: 10 }}>
          {state.done ? (
            <button className="nb-btn" onClick={onExit} style={{ background: "linear-gradient(135deg,#22c55e,#10b981)", color: "#fff", fontWeight: 900, fontSize: 15, padding: 14 }}>
              🎉 授業おわり！ ほかの授業をえらぶ
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={toggleMic} title="音声で答える" style={{
                width: 52, height: 48, borderRadius: 12, flexShrink: 0, cursor: "pointer", fontSize: 22,
                border: "none", color: "#fff", background: listening ? "linear-gradient(135deg,#ef4444,#f97316)" : "rgba(255,255,255,.1)",
                animation: listening ? "pulse 1s infinite" : "none",
              }}>🎤</button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={listening ? "聞いています…" : "ここに答えを書く（声でもOK）"}
                style={{ flex: 1, padding: "13px 14px", borderRadius: 12, fontSize: 15, fontFamily: "inherit",
                  border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)", color: "#fff", outline: "none" }}
              />
              <button onClick={() => send()} data-sfx="none" style={{
                padding: "0 18px", height: 48, borderRadius: 12, flexShrink: 0, cursor: "pointer", fontWeight: 900, fontSize: 15,
                border: "none", color: "#fff", background: "linear-gradient(135deg,#6366f1,#818cf8)" }}>送信</button>
            </div>
          )}
          {!state.done && (
            <button onClick={() => send("わからない")} style={{
              marginTop: 7, fontSize: 11.5, color: "rgba(255,255,255,.5)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              うーん、ヒントがほしい（補助発問をもらう）
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
