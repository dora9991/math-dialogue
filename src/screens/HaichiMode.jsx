// ============================================================
// HaichiMode.jsx — 「はいちモード」：葉一さん（19ch）のレッスン一覧から学ぶ入口
//  ・葉一さんの単元・小単元の並びに沿って、学年→大単元（章）→小単元 を一覧表示。
//  ・小単元を選ぶと Lesson 画面へ（YouTube動画の埋め込み＋19chワークシート＋手書き）。
//  ・Lesson から「この単元の練習問題」へ進める（学んだこととリンクした問題）。
//
//  動画・プリントは「とある男が授業をしてみた／葉一」さん（19ch.tv）のもの。
//  葉一さんからYouTube埋め込み・ワークシート表示の正式な許可を得て掲載。
// ============================================================
import { useState } from "react";
import Header from "../components/Header.jsx";
import { chaptersForGrade, gradesWithChapters } from "../data/index.js";
import { lessonMediaFor } from "../data/lessonMedia.js";

const GRADE_LABEL = { 1: "中1", 2: "中2", 3: "中3" };
const GRADE_COLOR = { 1: "#818cf8", 2: "#f43f5e", 3: "#fbbf24" };

export default function HaichiMode({ player, grade = 1, onSetGrade, onOpenLesson, onBack }) {
  const availGrades = gradesWithChapters();
  const [openChap, setOpenChap] = useState(null); // 開いている大単元（章）id。null=全部閉じる前の初期
  const chapters = chaptersForGrade(grade);

  return (
    <div className="app">
      <Header player={player} back="ホーム" onBack={onBack} />
      <div className="content">
        <div className="pg-ttl" style={{ fontSize: 20 }}>📺 はいちモード</div>
        <div className="pg-sub">
          葉一さん（19ch）の授業を見ながらプリントに書きこみ、学んだ単元の練習問題を解こう
        </div>

        {/* 学年えらび */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 14px" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.5)", whiteSpace: "nowrap" }}>学年</span>
          {[1, 2, 3].map((g) => {
            const ready = availGrades.includes(g);
            const sel = grade === g;
            const c = GRADE_COLOR[g];
            return (
              <button key={g} onClick={() => ready && onSetGrade?.(g)} disabled={!ready} data-sfx="none"
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

        {/* 大単元（章）→ 小単元（単元）一覧。章ヘッダーで開閉。 */}
        {chapters.map((chapter, ci) => {
          const isOpen = openChap == null ? ci === 0 : openChap === chapter.id; // 初期は先頭章を開く
          return (
            <div key={chapter.id} style={{ marginBottom: 10 }}>
              <button
                data-sfx="none"
                onClick={() => setOpenChap(isOpen ? "__none__" : chapter.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                  padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                  background: `linear-gradient(135deg, ${chapter.color}28, ${chapter.color}12)`,
                  border: `1.5px solid ${chapter.color}77`, color: "#fff",
                }}>
                <span style={{ fontSize: 24, lineHeight: 1 }}>{chapter.emoji}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, display: "block", color: chapter.color }}>{chapter.name}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>小単元 {chapter.units.length} ・タップで{isOpen ? "閉じる" : "ひらく"}</span>
                </span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,.6)" }}>{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                  {chapter.units.map((u, ui) => {
                    const media = lessonMediaFor(u.id);
                    const canEmbed = !!(media && (media.youtubeId || media.playlistId));
                    return (
                      <button
                        key={u.id}
                        data-sfx="none"
                        onClick={() => onOpenLesson(chapter, u)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                          padding: "11px 13px", borderRadius: 11, cursor: "pointer",
                          background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", color: "#fff",
                        }}>
                        <span style={{
                          width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: `${chapter.color}33`, color: chapter.color, fontSize: 12, fontWeight: 900,
                        }}>{ui + 1}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, display: "block" }}>{u.emoji} {u.name}</span>
                          {u.desc && <span style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>{u.desc}</span>}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: "3px 7px", borderRadius: 999, flexShrink: 0,
                          background: canEmbed ? "rgba(239,68,68,.22)" : "rgba(255,255,255,.08)",
                          color: canEmbed ? "#fca5a5" : "rgba(255,255,255,.55)",
                          border: canEmbed ? "1px solid rgba(239,68,68,.5)" : "1px solid rgba(255,255,255,.15)",
                        }}>{canEmbed ? "▶ 動画" : "📺 19ch"}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.4)", textAlign: "center", marginTop: 16, lineHeight: 1.7 }}>
          ※ 動画は <b>葉一さん（とある男が授業をしてみた）の YouTube 公式埋め込み</b>、
          プリントは <b>19ch.tv の無料プリントを読み込み表示</b>。著作権は葉一さん／19ch.tv に帰属します。
          葉一さんの許可を得て掲載しています。
        </div>
      </div>
    </div>
  );
}
