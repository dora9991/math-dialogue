// ============================================================
// UnitScreen.jsx — 単元のページ（講義 → 演習 → 確認テスト）
// ============================================================
import { useState } from "react";
import { TopBar, LevelPips, AreaChip, Coach } from "../components/ui.jsx";
import Lecture from "../components/Lecture.jsx";
import { getUnit, prereqsOf, dependentsOf, GRADE_LABEL, LEVEL_INFO, LEVELS } from "../content/index.js";
import { requiredLevel, isLearned } from "../engine/goals.js";
import { displayLevel, masteredLevel, startLevel, unitStatus, STATUS_INFO } from "../engine/mastery.js";
import { getLecture } from "../lectures/index.js";

export default function UnitScreen({ state, unitId, tab: tab0, onBack, onPractice, onOpenUnit }) {
  const u = getUnit(unitId);
  const us = state.units[unitId];
  const req = requiredLevel(u, state.profile);
  const learned = isLearned(u, state.profile);
  const { level, estimated } = displayLevel(us);
  const mastered = masteredLevel(us);
  const status = unitStatus(us, req, learned);
  const hasLecture = !!getLecture(unitId);
  const touched = Object.keys(us?.lv || {}).length > 0;
  const [tab, setTab] = useState(tab0 || (touched || estimated ? "practice" : "lecture"));
  const [pl, setPl] = useState(() => startLevel(us, req || u.maxLevel, u.maxLevel));
  const nextTest = Math.max(1, Math.min(mastered + 1, u.maxLevel));
  const [tl, setTl] = useState(nextTest);
  const pre = prereqsOf(unitId).map(getUnit).filter(Boolean);
  const next = dependentsOf(unitId).map(getUnit).filter(Boolean);

  const unitLink = (v) => {
    const vs = displayLevel(state.units[v.id]);
    const vr = requiredLevel(v, state.profile);
    return (
      <button key={v.id} className="rec" style={{ padding: 9 }} onClick={() => onOpenUnit(v.id)}>
        <span className="grow"><span className="tiny muted">{GRADE_LABEL[v.grade]}</span><span className="nm" style={{ display: "block", fontSize: 14 }}>{v.name}</span></span>
        <LevelPips level={vs.level} req={vr} max={v.maxLevel} estimated={vs.estimated} />
      </button>
    );
  };

  return (
    <div>
      <TopBar title={u.name} onBack={onBack} />
      <div className="card">
        <div className="row wrap" style={{ gap: 6 }}>
          <span className="chip">{GRADE_LABEL[u.grade]}{u.course ? `・${u.course}` : ""}{u.chapterName ? `・${u.chapterName}` : ""}</span>
          <AreaChip area={u.area} />
          <span className="chip" style={{ background: STATUS_INFO[status].color + "88", color: "#1e2433" }}>{STATUS_INFO[status].label}</span>
        </div>
        <div style={{ fontSize: 21, fontWeight: 900, marginTop: 8, lineHeight: 1.35 }}>{u.name}</div>
        <div className="small muted">{u.desc}</div>
        <div className="row mt12" style={{ gap: 14, alignItems: "flex-end" }}>
          <div>
            <div className="tiny muted" style={{ fontWeight: 800 }}>いまのレベル{estimated ? "（診断の推定）" : ""}</div>
            <div className="row" style={{ gap: 8 }}><LevelPips level={level} req={req} max={u.maxLevel} estimated={estimated} size={1.4} /><b>{LEVEL_INFO[level]?.label || "まだ"}</b></div>
          </div>
          <div className="grow" />
          <div style={{ textAlign: "right" }}>
            <div className="tiny muted" style={{ fontWeight: 800 }}>目標</div>
            <b style={{ color: LEVEL_INFO[req]?.color }}>{req ? LEVEL_INFO[req].label : "範囲外"}</b>
          </div>
        </div>
        {us?.weak && <div className="small mt12" style={{ color: "#be123c", fontWeight: 700 }}>🌱 診断で見つかった「つまずきの根っこ」。ここを固めると上の単元が楽になるよ。</div>}
      </div>

      <div className="seg" style={{ marginBottom: 14 }}>
        <button className={tab === "lecture" ? "on" : ""} onClick={() => setTab("lecture")}>📖 講義{hasLecture ? "✨" : ""}</button>
        <button className={tab === "practice" ? "on" : ""} onClick={() => setTab("practice")}>✏️ 演習</button>
        <button className={tab === "test" ? "on" : ""} onClick={() => setTab("test")}>🏅 確認テスト</button>
      </div>

      {tab === "lecture" && <Lecture unit={u} onStartPractice={() => setTab("practice")} />}

      {tab === "practice" && (
        <div>
          <div className="card">
            <h2>✏️ 演習（5問）</h2>
            <div className="small muted">2問続けて正解するとレベルが上がり、2問続けてまちがえると1つ下がります。いつも「ちょうどいい難しさ」で。</div>
            <div className="tiny muted mt12" style={{ fontWeight: 800 }}>はじめのレベル</div>
            <LevelPicker u={u} value={pl} onChange={setPl} us={us} req={req} />
            <button className="btn block mt12" onClick={() => onPractice({ kind: "unit", unitId, level: pl, n: 5 })}>演習をはじめる</button>
          </div>
          <LevelStats u={u} us={us} />
        </div>
      )}

      {tab === "test" && (
        <div className="card">
          <h2>🏅 確認テスト（5問・ヒントなし）</h2>
          <div className="small muted">5問中4問正解で、そのレベルを「習得」。間をあけて受けると、記憶がしっかり残ります。</div>
          <div className="tiny muted mt12" style={{ fontWeight: 800 }}>レベル</div>
          <LevelPicker u={u} value={tl} onChange={setTl} us={us} req={req} test />
          <button className="btn block mt12 ok" onClick={() => onPractice({ kind: "test", unitId, level: tl, n: 5 })}>{LEVEL_INFO[tl].label}のテストを受ける</button>
        </div>
      )}

      {(pre.length > 0 || next.length > 0) && (
        <div className="card">
          {pre.length > 0 && (
            <>
              <h2>⬇ 前提の単元（わからないときは、ここへさかのぼる）</h2>
              {pre.map(unitLink)}
            </>
          )}
          {next.length > 0 && (
            <>
              <h2 className="mt12">⬆ この単元の先にある単元</h2>
              {next.slice(0, 6).map(unitLink)}
            </>
          )}
        </div>
      )}
      {!learned && req > 0 && (
        <div className="card"><Coach><span className="small">この単元は、まだ学校で習っていないかも。予習として挑戦するのは大歓迎！</span></Coach></div>
      )}
    </div>
  );
}

function LevelPicker({ u, value, onChange, us, req, test }) {
  return (
    <div className="pick g4 mt8">
      {LEVELS.map((L) => {
        const has = (u.levels?.[L] || []).length > 0;
        const s = us?.lv?.[L];
        const passed = s?.passed;
        return (
          <button key={L} className={`pickbtn ${value === L ? "on" : ""}`} disabled={!has} onClick={() => onChange(L)}
            style={{ opacity: has ? 1 : .35, borderColor: value === L ? LEVEL_INFO[L].color : undefined, background: value === L ? LEVEL_INFO[L].color + "18" : undefined }}>
            <div style={{ color: LEVEL_INFO[L].color }}>{LEVEL_INFO[L].label}</div>
            <div className="tiny muted">{!has ? "準備中" : test && passed ? "合格済" : L === req ? "目標" : " "}</div>
          </button>
        );
      })}
    </div>
  );
}

function LevelStats({ u, us }) {
  const rows = LEVELS.filter((L) => us?.lv?.[L]?.n);
  if (!rows.length) return null;
  return (
    <div className="card">
      <h2>📈 これまでの記録</h2>
      {rows.map((L) => {
        const s = us.lv[L];
        return (
          <div key={L} className="row" style={{ marginBottom: 8 }}>
            <span style={{ width: 44, fontWeight: 800, color: LEVEL_INFO[L].color, fontSize: 14 }}>{LEVEL_INFO[L].label}</span>
            <div className="progress grow" style={{ height: 10 }}><i style={{ width: `${Math.round((s.p ?? 0) * 100)}%`, background: LEVEL_INFO[L].color }} /></div>
            <span className="small" style={{ width: 96, textAlign: "right" }}>{s.c}/{s.n}問{s.passed ? " 🏅" : ""}</span>
          </div>
        );
      })}
      <div className="tiny muted">バーは「次も正解できそうな見込み」。最近の結果ほど重く計算しています。</div>
      <div className="tiny muted">{u.maxLevel < 4 ? `この単元は「${LEVEL_INFO[u.maxLevel].label}」までの問題があります。` : ""}</div>
    </div>
  );
}
