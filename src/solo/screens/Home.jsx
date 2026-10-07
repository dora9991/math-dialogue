// ============================================================
// Home.jsx — ホーム（目標までの道のり・今日のおすすめ・今日の目標・連続日数）
// ============================================================
import { useMemo } from "react";
import { Brand, Coach, Ring, LevelPips, AreaChip } from "../components/ui.jsx";
import { GRADE_LABEL } from "../content/index.js";
import { analyze, recommend, goalProgress } from "../engine/recommend.js";
import { tierOf, examDate, daysUntil } from "../engine/goals.js";
import { streakDays, todayKey, playerLevel, greeting, cheer } from "../engine/motivation.js";

const KIND = {
  sakanobori: { icon: "🌱", label: "さかのぼり", bg: "#ecfdf3" },
  weak: { icon: "🩹", label: "立て直し", bg: "#fdecef" },
  goal: { icon: "🎯", label: "目標へ", bg: "#eef0ff" },
  review: { icon: "🔁", label: "復習", bg: "#fff6e0" },
  check: { icon: "🔍", label: "確認", bg: "#eef2f7" },
  confirm: { icon: "✅", label: "確認テスト", bg: "#ecfdf3" },
  ahead: { icon: "🚀", label: "予習", bg: "#f3e8ff" },
};

export default function Home({ state, onOpenUnit, onMix, onDiag, onGo }) {
  const info = useMemo(() => analyze(state), [state]);
  const recs = useMemo(() => recommend(state, { info, limit: 5 }), [state, info]);
  const gp = useMemo(() => goalProgress(state, info), [state, info]);
  const profile = state.profile;
  const tier = tierOf(profile);
  const days = daysUntil(examDate(profile));
  const today = state.daily[todayKey()] || { n: 0, c: 0, xp: 0 };
  const goal = profile.dailyGoal || 10;
  const streak = streakDays(state.daily);
  const pl = playerLevel(state.totals.xp);
  const remainingUnits = gp.total - gp.done;
  // ペース：残りの単元 ÷ 残りの週
  const weeks = Math.max(1, Math.round(days / 7));
  const pace = Math.max(1, Math.ceil(remainingUnits / weeks));
  const msg = today.n >= goal ? "今日の目標クリア！ 余裕があれば、もう少しだけ。" : recs[0]?.kind === "sakanobori" ? cheer("sakanobori") : greeting(profile.name);

  return (
    <div>
      <Brand right={<span className="chip" title="学習者レベル">Lv.{pl.lv}</span>} />

      <div className="hero">
        <div className="row" style={{ alignItems: "center", gap: 14 }}>
          <Ring pct={gp.pct}>
            <div><div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{gp.pct}<span style={{ fontSize: 12 }}>%</span></div><div style={{ fontSize: 10, opacity: .9 }}>目標まで</div></div>
          </Ring>
          <div className="grow">
            <div className="lbl">🎓 目標</div>
            <div className="goal">{profile.goal?.uni || tier.label}</div>
            <div className="meta">{tier.label}　・　{profile.grade === "R" ? "既卒" : GRADE_LABEL[profile.grade]}</div>
            <div className="meta mt8">共通テストまで <b style={{ fontSize: 16 }}>{days}</b> 日　・　1週間に <b>{pace}</b> 単元のペースで間に合う</div>
          </div>
        </div>
        <div className="row mt12 small" style={{ gap: 6, opacity: .95 }}>
          {[["E", "小"], ["J", "中"], ["H", "高"]].map(([k, l]) => {
            const s = gp.stages[k];
            if (!s.total) return null;
            return (
              <div key={k} className="grow">
                <div className="tiny" style={{ opacity: .85 }}>{l} {s.done}/{s.total}</div>
                <div className="bar"><i style={{ width: `${(s.done / s.total) * 100}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card"><Coach>{msg}</Coach></div>

      <div className="stats" style={{ marginBottom: 14 }}>
        <div className="stat">
          <div className="v" style={{ color: today.n >= goal ? "#16a34a" : undefined }}>{today.n}<span className="small muted">/{goal}</span></div>
          <div className="k">今日の問題</div>
          <div className="progress mt8" style={{ height: 5 }}><i style={{ width: `${Math.min(100, (today.n / goal) * 100)}%` }} /></div>
        </div>
        <div className="stat"><div className="v">🔥{streak}</div><div className="k">連続日数</div></div>
        <div className="stat"><div className="v">{state.totals.xp}</div><div className="k">XP（次のLvまで {pl.need - pl.cur}）</div></div>
      </div>

      {!state.diag && (
        <div className="card" style={{ border: "2px solid #c7cdf9" }}>
          <h2>🧭 まずは理解度診断から</h2>
          <div className="small muted">10〜25問で、今の理解度と「つまずきの根っこ」を見つけます。</div>
          <button className="btn block mt12" onClick={onDiag}>診断をはじめる</button>
        </div>
      )}

      <div className="card">
        <h2>✨ 今日のおすすめ<span className="sub">理解度と目標から</span></h2>
        {recs.length === 0 && <div className="small muted">おすすめはまだありません。マップから単元を選んでみよう。</div>}
        {recs.map((r) => {
          const x = info.get(r.unitId);
          const k = KIND[r.kind] || KIND.goal;
          return (
            <button key={r.unitId} className="rec" onClick={() => onOpenUnit(r.unitId)}>
              <span className="badge" style={{ background: k.bg }}>{k.icon}</span>
              <span className="grow">
                <span className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                  <span className="chip" style={{ background: k.bg }}>{k.label}</span>
                  <span className="tiny muted">{GRADE_LABEL[x.u.grade]}</span>
                </span>
                <span className="nm" style={{ display: "block", marginTop: 2 }}>{x.u.name}</span>
                <span className="why" style={{ display: "block" }}>{r.reason}</span>
                <span className="row mt8" style={{ gap: 8 }}><LevelPips level={x.level} req={x.req} max={x.u.maxLevel} estimated={x.estimated} /><AreaChip area={x.u.area} /></span>
              </span>
              <span className="go">›</span>
            </button>
          );
        })}
        {recs.length > 0 && (
          <button className="btn block grad mt8" onClick={onMix}>⚡ おすすめをまとめて10問</button>
        )}
      </div>

      <div className="row" style={{ gap: 10 }}>
        <button className="btn ghost grow" onClick={() => onGo("map")}>🗺️ 理解度マップ</button>
        <button className="btn ghost grow" onClick={() => onGo("records")}>📊 学習の記録</button>
      </div>
      {state.diag && <div className="center mt16"><button className="btn sm soft" onClick={onDiag}>🧭 もう一度診断する</button></div>}
    </div>
  );
}
