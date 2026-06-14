// ============================================================
// UnitTestSelect.jsx — 単元テストの章を選ぶ画面（全学年）
// ============================================================
import Header from "../components/Header.jsx";
import { allChapters } from "../data/index.js";
import { unitTestTimeLimit, formatTime } from "../engine/unitTest.js";

export default function UnitTestSelect({ player, onStart, onBack }) {
  const chapters = allChapters();
  const grades = [...new Set(chapters.map((c) => c.grade))];
  return (
    <div className="app">
      <Header player={player} back="ホーム" onBack={onBack} />
      <div className="content">
        <div className="pg-ttl">📝 単元テスト</div>
        <div className="pg-sub">章を選ぶと、その章の全単元から出題されます（文字入力で回答・制限時間あり）</div>
        {grades.map((g) => (
          <div key={"grade-" + g}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#818cf8", margin: "14px 2px 6px", borderBottom: "1px solid rgba(129,140,248,.35)", paddingBottom: 4 }}>
              中学{g}年
            </div>
            {chapters.filter((c) => c.grade === g).map((c) => {
              const qCount = c.units.length * 2; // 標準＋発展
              const limit = unitTestTimeLimit(qCount);
              return (
                <button
                  key={c.id}
                  className="chap-card"
                  style={{ background: `linear-gradient(135deg, ${c.color}cc, ${c.color}88)` }}
                  onClick={() => onStart(c)}
                >
                  <div className="chap-em">{c.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div className="chap-nm">{c.name}</div>
                    <div className="chap-sub">全{qCount}問 ・ ⏳制限 {formatTime(limit)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
