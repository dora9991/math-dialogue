// ============================================================
// NudgeOverlay.jsx — 「制限はかけない・促すだけ」の声かけ表示
//   ① ログイン後（ゲーム画面に入ったあと）に1日1回：テスト期間の声かけ
//   ② 30分プレイしたら（このセッションで1回）：そろそろ休もうの声かけ
// App.jsx には手を入れず、main.jsx に <NudgeOverlay/> を1行足すだけで動く独立部品。
//
// ▼運用メモ（ここだけ直せばOK）
//   ・期末テストが終わったら TEST_PERIOD を false に（ログイン時の声かけが止まる）。
//   ・文章は LOGIN_MSG / REST_MSG を書き換えるだけ。
//   ・「何分で休憩を促すか」は REST_AFTER_MIN（分）。
// ============================================================
import { useEffect, useRef, useState } from "react";

const TEST_PERIOD = true;      // ← 期末テストが終わったら false にする
const REST_AFTER_MIN = 30;     // 何分プレイしたら「そろそろ休もう」を出すか

const LOGIN_TITLE = "📣 先生からのメッセージ";
const LOGIN_MSG =
  "いつもたくさん使ってくれてありがとう！\n\n" +
  "ただ、今は期末テスト期間なので、紙での勉強も頑張ってみよう！皆さんの頑張りを応援しています。";

const REST_TITLE = "🍵 ひとやすみしよう";
const REST_MSG =
  "たくさん遊んでくれてありがとう＾＾　そろそろ他の勉強もはじめてみてはどうかな？\n\n" +
  "楽しんでくれていることはとても嬉しいけれど、まだまだあなたは隠れた力を持っています。\n" +
  "最大限発揮するためにも、できることを頑張ってみよう！";

// 今日の日付（1日1回判定用）
const ymd = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
// ホーム/プレイ中の合図＝所持コイン表示（💰）。スタート/タイトル/OP には出ない＝ログイン後の目印。
const inGame = () => { try { return document.body.innerText.includes("💰"); } catch { return false; } };

export default function NudgeOverlay() {
  const [msg, setMsg] = useState(null); // null | { title, body }
  const started = useRef(false);

  useEffect(() => {
    let restTimer = null;
    const iv = setInterval(() => {
      if (started.current || !inGame()) return;
      started.current = true;       // ログイン後（ゲーム内）に入ったのを一度だけ検知
      clearInterval(iv);

      // ① テスト期間の声かけ（1日1回・既存ログインボーナスの少しあとに）
      if (TEST_PERIOD) {
        try {
          if (localStorage.getItem("nudge_login_ymd") !== ymd()) {
            localStorage.setItem("nudge_login_ymd", ymd());
            setTimeout(() => setMsg({ title: LOGIN_TITLE, body: LOGIN_MSG }), 3500);
          }
        } catch { setTimeout(() => setMsg({ title: LOGIN_TITLE, body: LOGIN_MSG }), 3500); }
      }

      // ② 30分プレイで「そろそろ休もう」（このセッションで1回）
      restTimer = setTimeout(() => setMsg({ title: REST_TITLE, body: REST_MSG }), REST_AFTER_MIN * 60 * 1000);
    }, 1000);

    return () => { clearInterval(iv); if (restTimer) clearTimeout(restTimer); };
  }, []);

  if (!msg) return null;
  return (
    <div onClick={() => setMsg(null)} style={S.overlay}>
      <div onClick={(e) => e.stopPropagation()} style={S.card}>
        <div style={S.title}>{msg.title}</div>
        <div style={S.body}>{msg.body}</div>
        <button onClick={() => setMsg(null)} style={S.btn}>わかった！</button>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 100000, padding: 20,
    background: "rgba(6,4,20,.72)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  card: {
    width: "100%", maxWidth: 380, textAlign: "center", color: "#eef1ff",
    background: "linear-gradient(160deg,#1e1b4b,#0f1226)", border: "1px solid rgba(167,139,250,.5)",
    borderRadius: 20, padding: "22px 20px 18px", boxShadow: "0 20px 60px rgba(0,0,0,.5)",
    fontFamily: "'M PLUS Rounded 1c', system-ui, sans-serif",
  },
  title: { fontSize: 18, fontWeight: 900, marginBottom: 12, color: "#c4b5fd" },
  body: { fontSize: 15, lineHeight: 1.85, whiteSpace: "pre-wrap", textAlign: "left", color: "#e8ecff", marginBottom: 18 },
  btn: {
    width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer",
    fontSize: 16, fontWeight: 900, color: "#fff", background: "linear-gradient(135deg,#6366f1,#a855f7)", fontFamily: "inherit",
  },
};
