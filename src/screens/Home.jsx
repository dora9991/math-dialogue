// ============================================================
// Home.jsx — ホーム。まず「ゲーム／学習」を選び、それぞれ専用メニューを出す。
//   mode: "hub"=モード選択 / "game"=ゲームモード / "learn"=学習モード
//   ・共通（全モード）：あいさつ・曜日イベント・遊び方/キャラ・学年えらび
//   ・ゲーム：タイムアタック/バトル/計算王/アイテム/スキル/図鑑/なかま＋ゴールデンタイム
//   ・学習：あんしん/はいち/AI対話/学び直し/ステップアップ/単元テスト/クリニック＋学習の記録
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
const GAME_COLOR = "#f59e0b";  // ゲームモードのテーマ色
const LEARN_COLOR = "#22c55e"; // 学習モードのテーマ色

export default function Home({
  player, records, mistakeCount, grade = 1, onSetGrade,
  mode = "hub", onSetMode,
  canPrestige = false, prestige = 0, onPrestige,
  onAnshin, onTimeAttack, onChallenge, onBattle, onRelearn, onDialogue, onHaichi,
  onClinic, onUnitTest, onStepUp, onStartGolden, onShop, onSkill, onCollection, onPartners,
  onDetail, onHowTo, onCharacter,
}) {
  const availGrades = gradesWithChapters();
  const [msg] = useState(() => voice("open"));
  const greeting = player.name ? `${player.name}、${msg}` : msg;
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNowMs(Date.now()), 20000); return () => clearInterval(id); }, []);
  const today = new Date().toLocaleDateString("ja-JP");
  const gActive = goldenActive(player, nowMs, today);
  const gMin = Math.max(1, Math.min(15, Math.ceil(goldenRemainMs(player, nowMs, today) / 60000)));
  const gEnded = goldenEndedToday(player, nowMs, today);
  const gStartedToday = player.golden?.date === today;

  // 大きな入口ボタン（あんしん・はいち等で共通利用）
  const bigBtn = (onClick, icon, title, sub, bg, shadow, badge) => (
    <button onClick={onClick} style={{
      width: "100%", marginBottom: 12, padding: "14px 16px", borderRadius: 16, border: "2px solid rgba(255,255,255,.25)",
      background: bg, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left", boxShadow: shadow,
    }}>
      <span style={{ fontSize: 38, lineHeight: 1 }}>{icon}</span>
      <span>
        <span style={{ fontSize: 17, fontWeight: 900, display: "block" }}>{title}{badge && <span style={{ fontSize: 11, opacity: .85 }}> {badge}</span>}</span>
        <span style={{ fontSize: 12, fontWeight: 700, opacity: .92 }}>{sub}</span>
      </span>
    </button>
  );

  // モード切替（サブメニュー上部のセグメント）
  const seg = (on, color) => ({
    flex: 1, padding: "10px 6px", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 900,
    border: on ? `2px solid ${color}` : `1px solid ${color}55`, background: on ? `${color}33` : "rgba(255,255,255,.05)",
    color: on ? "#fff" : color, boxShadow: on ? `0 0 12px ${color}55` : "none",
  });
  const ModeSwitch = () => (
    <div style={{ display: "flex", gap: 8, margin: "2px 0 14px" }}>
      <button data-sfx="none" onClick={() => onSetMode?.("game")} style={seg(mode === "game", GAME_COLOR)}>🎮 ゲーム</button>
      <button data-sfx="none" onClick={() => onSetMode?.("learn")} style={seg(mode === "learn", LEARN_COLOR)}>📚 学習</button>
      <button data-sfx="back" onClick={() => onSetMode?.("hub")} title="モード選択へ"
        style={{ width: 46, borderRadius: 12, cursor: "pointer", fontSize: 18, fontWeight: 900, color: "rgba(255,255,255,.7)", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.15)" }}>≡</button>
    </div>
  );

  const ev = todayEvent();

  return (
    <div className="app">
      <MathBackdrop />
      <Header player={player} />
      <div className="content" style={{ position: "relative", zIndex: 1 }}>
        {/* あいさつ吹き出し ＋ 右側に小さめのゴールデンタイムボタン */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <CharBubble text={greeting} avatar={player.avatar} onAvatar={onCharacter} />
          </div>
          {gActive ? (
            <div style={{ flexShrink: 0, width: 104, whiteSpace: "nowrap", padding: "8px 6px", borderRadius: 12, textAlign: "center", lineHeight: 1.3,
              background: "rgba(251,191,36,.18)", border: "1px solid rgba(251,191,36,.5)", color: "#fde047", fontWeight: 800, fontSize: 10.5 }}>
              ✨XP1.2倍<br />あと{gMin}分
            </div>
          ) : !gStartedToday && onStartGolden ? (
            <button onClick={onStartGolden} data-sfx="none" title="15分間 XP1.2倍"
              style={{ flexShrink: 0, width: 104, whiteSpace: "nowrap", padding: "9px 6px", borderRadius: 12, cursor: "pointer", lineHeight: 1.3, textAlign: "center",
                background: "linear-gradient(135deg,#fbbf24,#f59e0b)", border: "1px solid rgba(251,191,36,.6)", color: "#3a2a00", fontWeight: 900, fontSize: 11 }}>
              ✨ゴールデン<br />タイム開始
            </button>
          ) : gEnded ? (
            <div style={{ flexShrink: 0, width: 104, whiteSpace: "nowrap", padding: "8px 6px", borderRadius: 12, textAlign: "center", lineHeight: 1.3,
              border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.4)", fontWeight: 700, fontSize: 10 }}>
              ✨また<br />あした！
            </div>
          ) : null}
        </div>

        {/* 今日の曜日イベント（共通） */}
        {ev && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, margin: "0 0 11px", padding: "10px 13px", borderRadius: 12,
            background: `linear-gradient(135deg, ${ev.color}22, ${ev.color}10)`, border: `1.5px solid ${ev.color}88`,
          }}>
            <span style={{ fontSize: 26, filter: `drop-shadow(0 0 6px ${ev.color})` }}>{ev.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: ev.color }}>今日は「{ev.label}」！</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)" }}>{ev.desc}</div>
            </div>
          </div>
        )}

        {/* 遊び方・キャラ（共通） */}
        <div style={{ display: "flex", gap: 8, marginBottom: 11 }}>
          <button className="title-link" style={{ flex: 1 }} onClick={onHowTo}>📖 遊び方</button>
          <button className="title-link" style={{ flex: 1 }} onClick={onCharacter}>🎨 キャラ設定</button>
        </div>

        {/* 学年えらび（共通） */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.5)", whiteSpace: "nowrap" }}>学年</span>
          {[1, 2, 3].map((g) => {
            const ready = availGrades.includes(g);
            const sel = grade === g;
            const c = GRADE_COLOR[g];
            return (
              <button key={g} onClick={() => ready && onSetGrade?.(g)} disabled={!ready}
                style={{
                  flex: 1, padding: "8px 4px", borderRadius: 10, cursor: ready ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 900,
                  border: sel ? `2px solid ${c}` : `1px solid ${c}66`, background: sel ? `${c}3a` : `${c}14`,
                  color: ready ? (sel ? "#fff" : c) : "rgba(255,255,255,.35)", boxShadow: sel ? `0 0 12px ${c}66` : "none",
                }}>
                {GRADE_LABEL[g]}{!ready && <span style={{ fontSize: 8, display: "block", fontWeight: 700 }}>準備中</span>}
              </button>
            );
          })}
        </div>

        {/* ===== ① モード選択ハブ ===== */}
        {mode === "hub" && (
          <>
            <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.55)", textAlign: "center", margin: "2px 0 12px" }}>
              今日はどっちで学ぶ？（あとから切り替えられるよ）
            </div>
            <button data-sfx="none" onClick={() => onSetMode?.("game")} style={{
              width: "100%", marginBottom: 12, padding: "18px 18px", borderRadius: 18, cursor: "pointer", textAlign: "left",
              border: "2px solid rgba(255,255,255,.25)", color: "#fff", background: "linear-gradient(135deg,#f59e0b,#ef4444)", boxShadow: "0 6px 20px rgba(239,68,68,.35)",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 44, lineHeight: 1 }}>🎮</span>
                <span><span style={{ fontSize: 20, fontWeight: 900, display: "block" }}>ゲームモード</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, opacity: .92 }}>ガンガン勉強してレベルアップ！</span></span>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, opacity: .9, display: "block", marginTop: 8 }}>
                ⏱️タイムアタック ・ ⚔️バトル ・ 🧮計算王 ・ 🎒装備/✨スキル ・ 📖図鑑/🐾なかま
              </span>
            </button>
            <button data-sfx="none" onClick={() => onSetMode?.("learn")} style={{
              width: "100%", marginBottom: 4, padding: "18px 18px", borderRadius: 18, cursor: "pointer", textAlign: "left",
              border: "2px solid rgba(255,255,255,.25)", color: "#fff", background: "linear-gradient(135deg,#22c55e,#10b981)", boxShadow: "0 6px 20px rgba(16,185,129,.35)",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 44, lineHeight: 1 }}>📚</span>
                <span><span style={{ fontSize: 20, fontWeight: 900, display: "block" }}>学習モード</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, opacity: .92 }}>じっくり・苦手をこくふく</span></span>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, opacity: .9, display: "block", marginTop: 8 }}>
                🛟あんしん ・ 📺はいちモード ・ 📖学び直し ・ 🧑‍🏫AI対話 ・ 📊学習の記録
              </span>
            </button>
          </>
        )}

        {/* ===== ② ゲームモード ===== */}
        {mode === "game" && (
          <>
            <ModeSwitch />

            {/* 👑 もう一周（周回）：魔王を倒したら、強さ等は残してお金/クリスタルをまた稼げる */}
            {canPrestige && onPrestige && (
              <button onClick={onPrestige} data-sfx="none" style={{
                width: "100%", margin: "0 0 11px", padding: "12px 14px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#3a2a00", border: "2px solid rgba(255,255,255,.35)",
                display: "flex", alignItems: "center", gap: 12, boxShadow: "0 5px 16px rgba(245,158,11,.4)",
              }}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>👑</span>
                <span>
                  <span style={{ fontSize: 15.5, fontWeight: 900, display: "block" }}>中{[1, 2, 3].includes(grade) ? grade : 1}の魔王を撃破！もう一周する{prestige > 0 ? `（${prestige}周クリア）` : ""}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 800, opacity: .85 }}>強さ・装備・仲間はそのまま／お金とクリスタルがまた稼げる！</span>
                </span>
              </button>
            )}

            {/* ゴールデンタイムは、あいさつ吹き出しの右の小ボタンに移動済み */}
            <div className="mode-grid">
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
              <button className="mode-card mba" onClick={onBattle}>
                <span style={{ fontSize: 36 }}>⚔️</span>
                <span style={{ fontSize: 15, fontWeight: 900 }}>バトルモード</span>
                <span style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>モンスターと対戦！</span>
              </button>
              <button className="mode-card mch" onClick={onChallenge}>
                <span style={{ fontSize: 36 }}>🧮</span>
                <span style={{ fontSize: 15, fontWeight: 900 }}>計算王への道</span>
                <span style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>連続正解で<br />自己ベストに挑戦</span>
              </button>
              <button className="mode-card msh" onClick={onShop}>
                <span style={{ fontSize: 36 }}>🎒</span>
                <span style={{ fontSize: 15, fontWeight: 900 }}>アイテム</span>
                <span style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>
                  どうぐ・そうび・回復<br />💰{player.coins ?? 0}{player.item && <> ／ 🎒{itemName(player.item)}</>}
                </span>
              </button>
              <button className="mode-card msk" onClick={onSkill}>
                <span style={{ fontSize: 36 }}>✨</span>
                <span style={{ fontSize: 15, fontWeight: 900 }}>スキル</span>
                <span style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>バトルで使う<br />スキルをセット</span>
              </button>
            </div>

            {onCollection && (
              <button className="nb-btn" onClick={onCollection} style={{ marginTop: 10, background: "linear-gradient(135deg,#0ea5e9,#22d3ee)", color: "#fff" }}>
                📖 モンスター図鑑（倒したモンスターを集めよう）
              </button>
            )}

            {onPartners && (
              <button className="nb-btn" onClick={onPartners} style={{ marginTop: 10, background: "linear-gradient(135deg,#f59e0b,#f472b6)", color: "#fff" }}>
                🐾 なかま（仲間モンスターを編成・育成してバトルへ）
              </button>
            )}
          </>
        )}

        {/* ===== ③ 学習モード ===== */}
        {mode === "learn" && (
          <>
            <ModeSwitch />

            <div className="mode-grid">
              {/* 1段目：左=はいちモード／右=学び直し */}
              <button className="mode-card" style={{ background: "linear-gradient(135deg,#ef4444,#f59e0b)" }} onClick={onHaichi}>
                <span style={{ fontSize: 36 }}>📺</span>
                <span style={{ fontSize: 15, fontWeight: 900 }}>はいちモード</span>
                <span style={{ fontSize: 11, opacity: 0.85, lineHeight: 1.5 }}>葉一さんの授業→<br />リンク問題で確認</span>
              </button>
              <button className="mode-card mut" onClick={onRelearn} style={{ position: "relative" }}>
                {mistakeCount > 0 && <span className="nb-badge" style={{ position: "absolute", top: 8, right: 8 }}>{mistakeCount}</span>}
                <span style={{ fontSize: 36 }}>📖</span>
                <span style={{ fontSize: 15, fontWeight: 900 }}>学び直し</span>
                <span style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>間違えた問題を<br />動画と練習で克服</span>
              </button>
              {/* 2段目：左=あんしんモード／右=計算王への道 */}
              <button className="mode-card" style={{ background: "linear-gradient(135deg,#22c55e,#10b981)" }} onClick={onAnshin}>
                <span style={{ fontSize: 36 }}>🛟</span>
                <span style={{ fontSize: 15, fontWeight: 900 }}>あんしんモード</span>
                <span style={{ fontSize: 11, opacity: 0.85, lineHeight: 1.5 }}>タイマーなし・<br />まちがえてもOK</span>
              </button>
              <button className="mode-card mch" onClick={onChallenge}>
                <span style={{ fontSize: 36 }}>🧮</span>
                <span style={{ fontSize: 15, fontWeight: 900 }}>計算王への道</span>
                <span style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>連続正解で<br />自己ベストに挑戦</span>
              </button>
              {/* 3段目：左=単元テスト／右=タイムアタック */}
              <button className="mode-card" style={{ background: "linear-gradient(135deg,#0ea5e9,#6366f1)" }} onClick={onUnitTest}>
                <span style={{ fontSize: 36 }}>📝</span>
                <span style={{ fontSize: 15, fontWeight: 900 }}>単元テスト</span>
                <span style={{ fontSize: 11, opacity: 0.85, lineHeight: 1.5 }}>章のまとめ<br />力だめし</span>
              </button>
              <button className="mode-card mta" onClick={onTimeAttack}>
                <span style={{ fontSize: 36 }}>⏱️</span>
                <span style={{ fontSize: 15, fontWeight: 900 }}>タイムアタック</span>
                <span style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>限られた時間で<br />何問解ける？</span>
              </button>
            </div>

            {/* 学習の記録（ダッシュボード） */}
            <Dashboard player={player} records={records || []} onDetail={onDetail} grade={grade} />
          </>
        )}
      </div>
    </div>
  );
}
