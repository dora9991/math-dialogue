// ============================================================
// Home.jsx — ホーム画面。モードを選ぶ入口。
// ============================================================
import { useState, useEffect } from "react";
import Header from "../components/Header.jsx";
import { goldenActive, goldenRemainMs, goldenEndedToday, todayEvent } from "../engine/daily.js";
import CharBubble, { voice } from "../components/CharBubble.jsx";
import { MathBackdrop } from "../components/Decorations.jsx";
import Dashboard from "../components/Dashboard.jsx";
import { findItem } from "../engine/items.js";
import { gradesWithChapters } from "../data/index.js";

const itemName = (id) => findItem(id)?.name ?? "";
const GRADE_LABEL = { 1: "中1", 2: "中2", 3: "中3" };
const GRADE_COLOR = { 1: "#818cf8", 2: "#f43f5e", 3: "#fbbf24" }; // 中1=藍 中2=赤 中3=黄

export default function Home({ player, records, mistakeCount, grade = 1, onSetGrade, onAnshin, onTimeAttack, onChallenge, onBattle, onRelearn, onDialogue, onClinic, onStartGolden, onShop, onSkill, onCollection, onPartners, onDetail, onHowTo, onCharacter }) {
  const availGrades = gradesWithChapters();
  const [msg] = useState(() => voice("open"));
  const greeting = player.name ? `${player.name}、${msg}` : msg;
  // ゴールデンタイム（その日の最初の15分・XP1.2倍）の残り時間を表示
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNowMs(Date.now()), 20000); return () => clearInterval(id); }, []);
  const today = new Date().toLocaleDateString("ja-JP");
  const gActive = goldenActive(player, nowMs, today);
  const gMin = Math.max(1, Math.min(15, Math.ceil(goldenRemainMs(player, nowMs, today) / 60000)));
  const gEnded = goldenEndedToday(player, nowMs, today);
  const gStartedToday = player.golden?.date === today; // 今日もう開始したか
  return (
    <div className="app">
      <MathBackdrop />
      <Header player={player} />
      <div className="content" style={{ position: "relative", zIndex: 1 }}>
        <CharBubble text={greeting} avatar={player.avatar} onAvatar={onCharacter} />

        {/* 今日の曜日イベント（毎週その曜日に自動発生） */}
        {(() => {
          const ev = todayEvent();
          if (!ev) return null;
          return (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              margin: "0 0 11px", padding: "10px 13px", borderRadius: 12,
              background: `linear-gradient(135deg, ${ev.color}22, ${ev.color}10)`,
              border: `1.5px solid ${ev.color}88`,
            }}>
              <span style={{ fontSize: 26, filter: `drop-shadow(0 0 6px ${ev.color})` }}>{ev.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: ev.color }}>今日は「{ev.label}」！</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)" }}>{ev.desc}</div>
              </div>
            </div>
          );
        })()}

        {/* ゴールデンタイム：自分のタイミングで開始 → 15分間 XP1.2倍 */}
        {gActive ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            margin: "0 0 11px", padding: "9px 12px", borderRadius: 12,
            background: "linear-gradient(135deg,rgba(251,191,36,.22),rgba(245,158,11,.22))",
            border: "1px solid rgba(251,191,36,.5)", color: "#fde047", fontWeight: 800, fontSize: 13,
          }}>
            ✨ ゴールデンタイム中！あと約{gMin}分は <span style={{ color: "#fbbf24" }}>XP1.2倍</span>
          </div>
        ) : !gStartedToday && onStartGolden ? (
          <button onClick={onStartGolden} data-sfx="none" style={{
            width: "100%", margin: "0 0 11px", padding: "11px 12px", borderRadius: 12, cursor: "pointer",
            background: "linear-gradient(135deg,rgba(251,191,36,.22),rgba(245,158,11,.22))",
            border: "1px solid rgba(251,191,36,.5)", color: "#fde047", fontWeight: 900, fontSize: 13.5,
          }}>
            ✨ ゴールデンタイムを始める（15分間 XP1.2倍）→ 準備ができたら押そう
          </button>
        ) : gEnded ? (
          <div style={{ margin: "0 0 11px", padding: "8px 12px", borderRadius: 12, textAlign: "center",
            border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 700 }}>
            今日のゴールデンタイムは終了しました（また明日！）
          </div>
        ) : null}

        {/* 遊び方・キャラへの導線 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 11 }}>
          <button className="title-link" style={{ flex: 1 }} onClick={onHowTo}>📖 遊び方</button>
          <button className="title-link" style={{ flex: 1 }} onClick={onCharacter}>🎨 キャラ設定</button>
        </div>

        {/* 学年えらび（タイムアタックの出題範囲） */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.5)", whiteSpace: "nowrap" }}>学年</span>
          {[1, 2, 3].map((g) => {
            const ready = availGrades.includes(g);
            const sel = grade === g;
            const c = GRADE_COLOR[g];
            return (
              <button key={g} onClick={() => ready && onSetGrade?.(g)} disabled={!ready}
                style={{
                  flex: 1, padding: "8px 4px", borderRadius: 10, cursor: ready ? "pointer" : "not-allowed",
                  fontSize: 13, fontWeight: 900,
                  border: sel ? `2px solid ${c}` : `1px solid ${c}66`,
                  background: sel ? `${c}3a` : `${c}14`,
                  color: ready ? (sel ? "#fff" : c) : "rgba(255,255,255,.35)",
                  boxShadow: sel ? `0 0 12px ${c}66` : "none",
                }}>
                {GRADE_LABEL[g]}{!ready && <span style={{ fontSize: 8, display: "block", fontWeight: 700 }}>準備中</span>}
              </button>
            );
          })}
        </div>

        {/* ★ あんしんモード（タイマーなし・まちがえても大丈夫）＝苦手な子の入口。一番上に大きく置く。 */}
        {onAnshin && (
          <button
            onClick={onAnshin}
            style={{
              width: "100%", marginBottom: 12, padding: "14px 16px", borderRadius: 16, border: "2px solid rgba(255,255,255,.25)",
              background: "linear-gradient(135deg,#22c55e,#10b981)", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12, textAlign: "left", boxShadow: "0 6px 18px rgba(16,185,129,.35)",
            }}
          >
            <span style={{ fontSize: 38, lineHeight: 1 }}>🛟</span>
            <span>
              <span style={{ fontSize: 17, fontWeight: 900, display: "block" }}>あんしんモード</span>
              <span style={{ fontSize: 12, fontWeight: 700, opacity: .92 }}>タイマーなし・まちがえても大丈夫。まずはここから！</span>
            </span>
          </button>
        )}

        {/* ★ AIと対話する授業（試作）：黒板を見ながら発問に答えていく */}
        {onDialogue && (
          <button
            onClick={onDialogue}
            style={{
              width: "100%", marginBottom: 12, padding: "14px 16px", borderRadius: 16, border: "2px solid rgba(255,255,255,.25)",
              background: "linear-gradient(135deg,#6366f1,#0ea5e9)", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12, textAlign: "left", boxShadow: "0 6px 18px rgba(99,102,241,.35)",
            }}
          >
            <span style={{ fontSize: 38, lineHeight: 1 }}>🧑‍🏫</span>
            <span>
              <span style={{ fontSize: 17, fontWeight: 900, display: "block" }}>AIと対話する授業 <span style={{ fontSize: 11, opacity: .85 }}>NEW</span></span>
              <span style={{ fontSize: 12, fontWeight: 700, opacity: .92 }}>黒板を見ながら、先生の問いに声や文字で答えよう</span>
            </span>
          </button>
        )}

        {/* 3段グリッド：①タイムアタック/学び直し ②バトル/計算王 ③ショップ/スキル */}
        <div className="mode-grid">
          {/* 1段目（左：タイムアタック／右：学び直し） */}
          <button className="mode-card mta" onClick={onTimeAttack}>
            <span style={{ fontSize: 36 }}>⏱️</span>
            <span style={{ fontSize: 15, fontWeight: 900 }}>タイムアタック</span>
            <span style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>限られた時間で<br />何問解ける？</span>
          </button>
          <button className="mode-card mut" onClick={onRelearn} style={{ position: "relative" }}>
            {mistakeCount > 0 && <span className="nb-badge" style={{ position: "absolute", top: 8, right: 8 }}>{mistakeCount}</span>}
            <span style={{ fontSize: 36 }}>📖</span>
            <span style={{ fontSize: 15, fontWeight: 900 }}>学び直し</span>
            <span style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>間違えた問題を<br />動画と練習で克服</span>
          </button>

          {/* 2段目 */}
          <button className="mode-card mba" onClick={onBattle}>
            <span style={{ fontSize: 36 }}>⚔️</span>
            <span style={{ fontSize: 15, fontWeight: 900 }}>バトルモード</span>
            <span style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>モンスターと対戦！</span>
          </button>
          <button className="mode-card mch" onClick={onChallenge}>
            <span style={{ fontSize: 36 }}>🧮</span>
            <span style={{ fontSize: 15, fontWeight: 900 }}>計算王への道</span>
            <span style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>ハイレベル問題に連続正解！<br />自己ベストに挑戦</span>
          </button>

          {/* 3段目 */}
          <button className="mode-card msh" onClick={onShop}>
            <span style={{ fontSize: 36 }}>🎒</span>
            <span style={{ fontSize: 15, fontWeight: 900 }}>アイテム</span>
            <span style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>
              どうぐ・そうび・回復を買おう<br />💰{player.coins ?? 0}
              {player.item && <> ／ 🎒{itemName(player.item)}</>}
            </span>
          </button>
          <button className="mode-card msk" onClick={onSkill}>
            <span style={{ fontSize: 36 }}>✨</span>
            <span style={{ fontSize: 15, fontWeight: 900 }}>スキル</span>
            <span style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>バトルで使うスキルを<br />セットしよう</span>
          </button>
        </div>

        {onCollection && (
          <button className="nb-btn" onClick={onCollection} style={{ marginBottom: 10, background: "linear-gradient(135deg,#0ea5e9,#22d3ee)", color: "#fff" }}>
            📖 モンスター図鑑（倒したモンスターを集めよう）
          </button>
        )}

        {onPartners && (
          <button className="nb-btn" onClick={onPartners} style={{ marginBottom: 10, background: "linear-gradient(135deg,#f59e0b,#f472b6)", color: "#fff" }}>
            🐾 なかま（仲間モンスターを編成・育成してバトルへ）
          </button>
        )}

        {onClinic && (
          <button className="nb-btn" onClick={onClinic} style={{ marginBottom: 10, background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff" }}>
            🩺 こまり感クリニック（つまずき診断→処方ドリル）
          </button>
        )}

        {/* 学習ダッシュボード */}
        <Dashboard player={player} records={records || []} onDetail={onDetail} grade={grade} />
      </div>
    </div>
  );
}
