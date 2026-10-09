// ============================================================
// MapScreen.jsx — 理解度マップ
//   下が小1、上が高3（＝目標の山頂）。横は4つの分野。1マス＝1単元。
//   色：目標達成・学習中・要復習・未確認…。タップすると単元の情報と前提が出る。
// ============================================================
import { useMemo, useState } from "react";
import { Brand, LevelPips, AreaChip, Radar } from "../components/ui.jsx";
import { UNITS, AREAS, AREA_INFO, GRADE_ORDER, GRADE_LABEL, LEVEL_INFO, getUnit, prereqsOf, dependentsOf, unitTitle } from "../content/index.js";
import { analyze, areaScores, goalProgress } from "../engine/recommend.js";
import { STATUS_INFO } from "../engine/mastery.js";
import { profileGradeIndex, tierOf } from "../engine/goals.js";

const LEGEND = ["goal", "beyond", "est", "learning", "weak", "unknown", "future", "out"];

export default function MapScreen({ state, onOpenUnit }) {
  const info = useMemo(() => analyze(state), [state]);
  const scores = useMemo(() => areaScores(state, info), [state, info]);
  const gp = useMemo(() => goalProgress(state, info), [state, info]);
  const [view, setView] = useState("map");
  const [sel, setSel] = useState(null);
  const gi = profileGradeIndex(state.profile);
  const tier = tierOf(state.profile);

  const selPre = sel ? new Set(prereqsOf(sel)) : new Set();
  const grades = [...GRADE_ORDER].reverse();

  return (
    <div>
      <Brand />
      <div className="seg" style={{ marginBottom: 12 }}>
        <button className={view === "map" ? "on" : ""} onClick={() => setView("map")}>🗺️ マップ</button>
        <button className={view === "list" ? "on" : ""} onClick={() => setView("list")}>📋 一覧</button>
        <button className={view === "radar" ? "on" : ""} onClick={() => setView("radar")}>🕸️ 分野</button>
      </div>

      {view === "map" && (
        <div className="card" style={{ padding: 10 }}>
          <div className="row small" style={{ marginBottom: 8, padding: "0 4px" }}>
            <span className="grow" style={{ fontWeight: 800 }}>🏁 目標：{state.profile.goal?.uni || tier.label}</span>
            <span className="muted">達成 {gp.done}/{gp.total}</span>
          </div>
          <div className="map">
            <div />
            {AREAS.map((a) => <div key={a} className="hd" style={{ color: AREA_INFO[a].color, background: AREA_INFO[a].color + "14" }}>{AREA_INFO[a].icon} {AREA_INFO[a].short}</div>)}
            {grades.map((g) => {
              const i = GRADE_ORDER.indexOf(g);
              const now = i === gi;
              return [
                <div key={g} className={`gl ${now ? "now" : ""}`} title={now ? "いまの学年" : ""}>{GRADE_LABEL[g]}</div>,
                ...AREAS.map((a) => (
                  <div key={g + a} className={`cell ${now ? "now" : ""}`}>
                    {UNITS.filter((u) => u.grade === g && u.area === a).map((u) => {
                      const x = info.get(u.id);
                      const st = STATUS_INFO[x.status];
                      return (
                        <button
                          key={u.id}
                          className={`tile ${x.status === "est" ? "est" : ""} ${sel === u.id ? "hl" : ""} ${selPre.has(u.id) ? "pre" : ""}`}
                          style={{ background: st.color, border: x.status === "out" || x.status === "future" ? "1px solid #e1e5ee" : "none" }}
                          title={`${GRADE_LABEL[u.grade]} ${u.name}（${st.label}）`}
                          aria-label={`${GRADE_LABEL[u.grade]} ${u.name}：${st.label}`}
                          onClick={() => setSel(u.id)}
                        />
                      );
                    })}
                  </div>
                )),
              ];
            })}
          </div>
          <div className="legend mt12">
            {LEGEND.map((k) => <span key={k}><i style={{ background: STATUS_INFO[k].color, backgroundImage: k === "est" ? "repeating-linear-gradient(45deg, rgba(255,255,255,.6) 0 2px, transparent 2px 5px)" : undefined }} />{STATUS_INFO[k].label}</span>)}
          </div>
          <div className="tiny muted mt8">マスをタップすると、その単元と前提（点線）が見られます。</div>
        </div>
      )}

      {view === "list" && (
        <div>
          {GRADE_ORDER.map((g) => {
            const list = UNITS.filter((u) => u.grade === g && info.get(u.id).req);
            if (!list.length) return null;
            const done = list.filter((u) => info.get(u.id).level >= info.get(u.id).req).length;
            return (
              <div key={g} className="card">
                <h2>{GRADE_LABEL[g]}{GRADE_ORDER.indexOf(g) === gi && <span className="chip" style={{ background: "#4f46e5", color: "#fff" }}>いまの学年</span>}<span className="sub">{done}/{list.length} 達成</span></h2>
                <div className="ulist">
                  {list.map((u) => {
                    const x = info.get(u.id);
                    return (
                      <div key={u.id} className="it" onClick={() => onOpenUnit(u.id)}>
                        <span className="dot" style={{ background: STATUS_INFO[x.status].color, border: "1px solid rgba(0,0,0,.08)" }} />
                        <span className="grow" style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.35 }}>{u.name}<span className="tiny muted" style={{ display: "block", fontWeight: 500 }}>{u.course ? `${u.course}・` : ""}{u.desc}</span></span>
                        <LevelPips level={x.level} req={x.req} max={u.maxLevel} estimated={x.estimated} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "radar" && (
        <div className="card">
          <h2>分野ごとの理解度<span className="sub">もう習った範囲・目標レベルに対して</span></h2>
          <Radar scores={scores} />
          <div className="small muted mt8">100% ＝ もう習った単元がすべて目標レベルに到達。いちばん低い分野からおすすめに出てきます。</div>
        </div>
      )}

      {sel && <UnitSheet id={sel} info={info} onClose={() => setSel(null)} onOpen={() => onOpenUnit(sel)} onSel={setSel} />}
    </div>
  );
}

function UnitSheet({ id, info, onClose, onOpen, onSel }) {
  const x = info.get(id);
  const u = x.u;
  const pre = prereqsOf(id).map(getUnit).filter(Boolean);
  const next = dependentsOf(id).map(getUnit).filter(Boolean);
  const st = STATUS_INFO[x.status];
  const chip = (v) => (
    <button key={v.id} className="chip" style={{ border: "none", cursor: "pointer", background: STATUS_INFO[info.get(v.id).status].color + "66" }} onClick={() => onSel(v.id)}>
      {GRADE_LABEL[v.grade]} {v.name}
    </button>
  );
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="row"><span className="chip">{GRADE_LABEL[u.grade]}{u.course ? `・${u.course}` : ""}</span><AreaChip area={u.area} /><span className="grow" /><button className="btn sm ghost" onClick={onClose}>✕</button></div>
        <div style={{ fontSize: 20, fontWeight: 900, marginTop: 8 }}>{u.name}</div>
        <div className="small muted">{u.desc}</div>
        <div className="row mt12">
          <span className="chip" style={{ background: st.color, color: "#1e2433" }}>{st.label}</span>
          <LevelPips level={x.level} req={x.req} max={u.maxLevel} estimated={x.estimated} size={1.2} />
          <span className="tiny muted">目標：{LEVEL_INFO[x.req]?.label || "範囲外"}</span>
        </div>
        {pre.length > 0 && <div className="mt12"><div className="tiny muted" style={{ fontWeight: 800 }}>⬇ この単元の前提（さかのぼり先）</div><div className="row wrap mt8" style={{ gap: 6 }}>{pre.map(chip)}</div></div>}
        {next.length > 0 && <div className="mt12"><div className="tiny muted" style={{ fontWeight: 800 }}>⬆ この単元を土台にする単元</div><div className="row wrap mt8" style={{ gap: 6 }}>{next.slice(0, 8).map(chip)}</div></div>}
        <button className="btn block mt16" onClick={onOpen} disabled={!u.maxLevel}>この単元を学ぶ（{unitTitle(u)}）</button>
      </div>
    </div>
  );
}
