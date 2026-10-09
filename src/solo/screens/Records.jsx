// ============================================================
// Records.jsx — 学習の記録（毎日の問題数・合計・分野のバランス・バッジ・到達した単元）
// ============================================================
import { useMemo } from "react";
import { Brand, DayBars, Radar } from "../components/ui.jsx";
import { getUnit, GRADE_LABEL } from "../content/index.js";
import { analyze, areaScores } from "../engine/recommend.js";
import { lastDays, streakDays, bestStreak, BADGES, playerLevel } from "../engine/motivation.js";

export default function Records({ state, onOpenUnit }) {
  const info = useMemo(() => analyze(state), [state]);
  const scores = useMemo(() => areaScores(state, info), [state, info]);
  const days = lastDays(state.daily, 14);
  const t = state.totals;
  const sec = Object.values(state.daily).reduce((s, d) => s + (d.sec || 0), 0);
  const week = days.slice(-7).reduce((s, d) => s + d.n, 0);
  const pl = playerLevel(t.xp);
  const reached = Object.entries(state.reached || {}).sort((a, b) => b[1] - a[1]);
  const goal = state.profile.dailyGoal || 10;

  return (
    <div>
      <Brand />
      <div className="stats" style={{ marginBottom: 10 }}>
        <div className="stat"><div className="v">{t.n}</div><div className="k">解いた問題</div></div>
        <div className="stat"><div className="v">{t.n ? Math.round((t.c / t.n) * 100) : 0}<span className="small">%</span></div><div className="k">正答率</div></div>
        <div className="stat"><div className="v">{Math.round(sec / 60)}<span className="small">分</span></div><div className="k">学習時間</div></div>
      </div>
      <div className="stats" style={{ marginBottom: 14 }}>
        <div className="stat"><div className="v">🔥{streakDays(state.daily)}</div><div className="k">連続日数（最高 {bestStreak(state.daily)}）</div></div>
        <div className="stat"><div className="v">{reached.length}</div><div className="k">目標達成の単元</div></div>
        <div className="stat"><div className="v">Lv.{pl.lv}</div><div className="k">{t.xp} XP</div></div>
      </div>

      <div className="card">
        <h2>📅 毎日の問題数<span className="sub">この1週間で {week} 問</span></h2>
        <DayBars days={days} goal={goal} />
        <div className="row tiny muted" style={{ justifyContent: "space-between" }}>
          <span>{days[0].label}</span><span>点線＝1日の目標（{goal}問）</span><span>今日</span>
        </div>
      </div>

      <div className="card">
        <h2>🕸️ 分野のバランス</h2>
        <Radar scores={scores} />
      </div>

      <div className="card">
        <h2>🏅 バッジ<span className="sub">{Object.keys(state.badges || {}).length}/{BADGES.length}</span></h2>
        <div className="badges">
          {BADGES.map((b) => {
            const got = state.badges?.[b.id];
            return (
              <div key={b.id} className={`bdg ${got ? "" : "off"}`} title={b.desc}>
                <div className="i">{b.icon}</div>
                <div className="n">{b.name}</div>
                <div className="tiny muted" style={{ lineHeight: 1.3 }}>{b.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {reached.length > 0 && (
        <div className="card">
          <h2>🎯 目標レベルに到達した単元</h2>
          <div className="ulist">
            {reached.slice(0, 30).map(([id, at]) => {
              const u = getUnit(id);
              if (!u) return null;
              return (
                <div key={id} className="it" onClick={() => onOpenUnit(id)}>
                  <span className="dot" style={{ background: "#22c55e" }} />
                  <span className="grow small"><b>{GRADE_LABEL[u.grade]}</b>　{u.name}</span>
                  <span className="tiny muted">{new Date(at).toLocaleDateString("ja-JP")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
