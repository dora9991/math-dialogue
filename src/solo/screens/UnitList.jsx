// ============================================================
// UnitList.jsx — 単元一覧（学年 → 単元（章）→ 小単元）
//   AI のおすすめとは別に、自分で学年・単元・小単元を選んで学ぶためのページ。
//   小単元をえらぶと、講義・演習・確認テストのページが開く（難易度もそこで選べる）。
//   「未修」（学校でまだ習っていない）の印も、ここで見られる。
// ============================================================
import { useMemo, useState } from "react";
import { Brand, LevelPips } from "../components/ui.jsx";
import { GRADE_LABEL, GRADE_ORDER, chaptersOfGrade } from "../content/index.js";
import { analyze } from "../engine/recommend.js";
import { STATUS_INFO } from "../engine/mastery.js";
import { profileGradeIndex } from "../engine/goals.js";
import useCenterActive from "../components/useCenterActive.js";

const FILTERS = [
  { id: "all", label: "すべて" },
  { id: "mishu", label: "未修" },
  { id: "todo", label: "これから・復習" },
  { id: "done", label: "目標達成" },
];

const matches = (f, x) => {
  if (f === "all") return true;
  if (f === "mishu") return !x.learned;
  if (f === "done") return x.status === "goal" || x.status === "beyond";
  return x.learned && ["learning", "weak", "unknown", "est"].includes(x.status) && x.req > 0;
};

export default function UnitList({ state, grade, onGrade, onOpenUnit }) {
  const info = useMemo(() => analyze(state), [state]);
  const [filter, setFilter] = useState("all");
  const gi = profileGradeIndex(state.profile);
  const nowGrade = GRADE_ORDER[gi];
  const tab = grade || nowGrade;
  const tabsRef = useCenterActive(tab);

  const chapters = useMemo(() => chaptersOfGrade(tab), [tab]);
  const all = chapters.flatMap((c) => c.units);
  const nDone = all.filter((u) => matches("done", info.get(u.id))).length;
  const nMishu = all.filter((u) => !info.get(u.id).learned).length;

  return (
    <div>
      <Brand />
      <div style={{ fontSize: 20, fontWeight: 900, margin: "2px 0 2px" }}>📚 単元から学ぶ</div>
      <div className="small muted" style={{ marginBottom: 10 }}>学年をえらんで、単元・小単元を選ぶと、講義・演習・確認テストができます（難易度も選べます）。</div>

      <div className="gtabs" role="tablist" aria-label="学年" ref={tabsRef}>
        {GRADE_ORDER.map((g) => (
          <button key={g} role="tab" aria-selected={tab === g} className={`gtab ${tab === g ? "on" : ""}`} onClick={() => onGrade(g)}>
            <span>{GRADE_LABEL[g]}</span>
            {g === nowGrade && <em>いま</em>}
          </button>
        ))}
      </div>

      <div className="card" style={{ paddingBottom: 12 }}>
        <div className="row wrap" style={{ gap: 8 }}>
          <b style={{ fontSize: 16 }}>{GRADE_LABEL[tab]}</b>
          <span className="chip">{chapters.length} 単元・{all.length} 小単元</span>
          <span className="chip" style={{ background: "#e8f8ee", color: "#15803d" }}>目標達成 {nDone}</span>
          {nMishu > 0 && <span className="chip" style={{ background: "#fff1e6", color: "#c2410c" }}>未修 {nMishu}</span>}
        </div>
        <div className="row wrap mt8" style={{ gap: 6 }}>
          {FILTERS.map((f) => (
            <button key={f.id} className={`fchip ${filter === f.id ? "on" : ""}`} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
      </div>

      {chapters.map((ch) => {
        const shown = ch.units.filter((u) => matches(filter, info.get(u.id)));
        if (!shown.length) return null;
        const done = ch.units.filter((u) => matches("done", info.get(u.id))).length;
        return (
          <details key={ch.id + filter} className="chcard" open>
            <summary className="chsum">
              <span className="grow">
                {ch.course && <span className="tiny muted" style={{ display: "block", fontWeight: 700 }}>{ch.course}</span>}
                <b>{ch.name}</b>
              </span>
              <span className="small muted">達成 {done}/{ch.units.length}</span>
              <span className="chev">▾</span>
            </summary>
            <div className="chbody" style={{ padding: "2px 8px 6px" }}>
              {shown.map((u) => {
                const x = info.get(u.id);
                const st = STATUS_INFO[x.status];
                return (
                  <button key={u.id} className="urow2" onClick={() => onOpenUnit(u.id)} disabled={!u.maxLevel}>
                    <span className="dot" style={{ background: st.color }} />
                    <span className="grow">
                      <span className="unname" style={{ display: "block" }}>{u.name}</span>
                      <span className="tiny muted" style={{ display: "block" }}>{u.desc}</span>
                      <span className="row wrap" style={{ gap: 5, marginTop: 4 }}>
                        {!x.learned && <span className="chip" style={{ background: "#fff1e6", color: "#c2410c" }}>未修</span>}
                        {x.learned && x.status !== "future" && <span className="chip" style={{ background: st.color + "66", color: "#1e2433" }}>{st.label}</span>}
                        {x.req === 0 && <span className="chip">目標の範囲外</span>}
                      </span>
                    </span>
                    <LevelPips level={x.level} req={x.req} max={u.maxLevel} estimated={x.estimated} grade={u.grade} />
                  </button>
                );
              })}
            </div>
          </details>
        );
      })}
      {all.length > 0 && chapters.every((ch) => !ch.units.some((u) => matches(filter, info.get(u.id)))) && (
        <div className="card center muted small">この条件に合う小単元はありません。</div>
      )}
    </div>
  );
}
