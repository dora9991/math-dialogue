// ============================================================
// Practice.jsx — 演習（1単元・確認テスト・おすすめミックス）
//
//  kind = "unit" … 1単元を5問。2問続けて正解→1つ上のレベル、2問続けて不正解→1つ下へ（ちょうどいい難しさ）
//                   いちばん下のレベルでもつまずいたら、前提単元へのさかのぼりを提案
//  kind = "test" … 確認テスト。指定レベルを5問、ヒントなし。4問以上で合格＝そのレベルを習得
//  kind = "mix"  … おすすめミックス。おすすめ上位の単元を混ぜて10問（交互に解くと定着しやすい）
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import Problem from "../components/Problem.jsx";
import { TopBar, Coach, LevelPips } from "../components/ui.jsx";
import { getUnit, genProblem, usableLevel, prereqsOf, GRADE_LABEL, LEVEL_INFO, unitTitle } from "../content/index.js";
import { requiredLevel } from "../engine/goals.js";
import { displayLevel, startLevel, masteredLevel } from "../engine/mastery.js";
import { cheer, BADGES } from "../engine/motivation.js";

const shuffleArr = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

export default function Practice({ state, cfg, onAnswer, onTestDone, onReviewDone, onExit, onHome, onOpenUnit, onRestart }) {
  const kind = cfg.kind;
  const total = kind === "mix" ? cfg.plan.length : cfg.n || 5;
  const plan = useMemo(() => (kind === "mix" ? shuffleArr(cfg.plan) : null), [cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  // 単元ごとの「今のレベル」（ミックスでは単元ごとに持つ）
  const initLevels = () => {
    const m = {};
    const ids = kind === "mix" ? [...new Set(cfg.plan.map((x) => x.unitId))] : [cfg.unitId];
    for (const id of ids) {
      const u = getUnit(id);
      const req = requiredLevel(u, state.profile) || u.maxLevel;
      const planned = kind === "mix" ? cfg.plan.find((x) => x.unitId === id)?.level : cfg.level;
      m[id] = usableLevel(u, planned || startLevel(state.units[id], req, u.maxLevel));
    }
    return m;
  };
  const [levels, setLevels] = useState(initLevels);
  const before = useRef(Object.fromEntries(Object.keys(levels).map((id) => [id, displayLevel(state.units[id])])));
  const [i, setI] = useState(0);
  const [p, setP] = useState(null);
  const [log, setLog] = useState([]); // { unitId, level, correct, hinted }
  const [extra, setExtra] = useState(null);
  const [done, setDone] = useState(false);
  const [testRes, setTestRes] = useState(null);
  const [sakanobori, setSakanobori] = useState(null);
  const recent = useRef([]);
  const runs = useRef({}); // unitId → 連続（正:+n / 誤:-n）
  const events = useRef({ badges: [], reached: [], xp: 0 });

  const unitIdAt = (k) => (kind === "mix" ? plan[k].unitId : cfg.unitId);

  // 問題をつくる
  useEffect(() => {
    if (done) return;
    const uid = unitIdAt(i);
    const L = kind === "test" ? cfg.level : levels[uid];
    let q = genProblem(uid, L, recent.current);
    if (q && recent.current.includes(q.key)) q = genProblem(uid, L, recent.current) || q;
    if (q) recent.current = [q.tplId, ...recent.current].slice(0, 3);
    setP(q);
    setExtra(null);
  }, [i, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = ({ correct, hinted, gaveUp, sec }) => {
    const res = onAnswer(p, correct, { hinted, firstTry: !hinted, sec });
    events.current.xp += res?.xp || 0;
    if (res?.newlyBadges?.length) events.current.badges.push(...res.newlyBadges);
    if (res?.newlyReached?.length) events.current.reached.push(...res.newlyReached);
    setLog((l) => [...l, { unitId: p.unitId, level: p.level, correct, hinted, gaveUp }]);

    let msg = correct ? `${cheer("correct")} +${res?.xp || 0}XP` : cheer("wrong");
    if (kind !== "test") {
      const uid = p.unitId;
      const u = getUnit(uid);
      const r = runs.current[uid] || 0;
      const nr = correct && !hinted ? Math.max(1, r + 1) : correct ? 0 : Math.min(-1, r - 1);
      runs.current[uid] = nr;
      const L = levels[uid];
      if (nr >= 2 && L < u.maxLevel) {
        const up = usableLevel(u, L + 1);
        if (up > L) {
          setLevels((m) => ({ ...m, [uid]: up }));
          runs.current[uid] = 0;
          msg = `${cheer("streak")} 次は「${LEVEL_INFO[up].label}」へ ↑`;
        }
      } else if (nr <= -2 && L > 1) {
        const down = usableLevel(u, L - 1);
        setLevels((m) => ({ ...m, [uid]: down }));
        runs.current[uid] = 0;
        msg = `「${LEVEL_INFO[down].label}」にもどって確実に`;
      } else if (nr <= -2 && L === 1 && !sakanobori) {
        // いちばん下でもつまずく → 前提へさかのぼる提案
        const pre = prereqsOf(uid)
          .map((id) => ({ id, lv: displayLevel(state.units[id]).level, req: requiredLevel(getUnit(id), state.profile) }))
          .filter((x) => x.req > 0)
          .sort((a, b) => a.lv - b.lv)[0];
        if (pre) setSakanobori(pre.id);
      }
    }
    setExtra(msg);
  };

  const next = () => {
    if (i + 1 >= total) {
      finish();
      return;
    }
    setI(i + 1);
  };

  const finish = () => {
    if (kind === "test" && log.length === total) {
      const score = log.filter((x) => x.correct).length;
      const r = onTestDone(cfg.unitId, cfg.level, score, total);
      if (r?.newlyBadges?.length) events.current.badges.push(...r.newlyBadges);
      if (r?.newlyReached?.length) events.current.reached.push(...r.newlyReached);
      setTestRes({ score, pass: r?.pass, bonus: r?.bonus || 0 });
    }
    if (kind === "mix") {
      const acc = {};
      for (const x of log) { const a = (acc[x.unitId] ||= { n: 0, c: 0 }); a.n++; a.c += x.correct ? 1 : 0; }
      onReviewDone?.(Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, v.c / v.n])));
    }
    setDone(true);
    window.scrollTo(0, 0);
  };

  const title = kind === "mix" ? "おすすめ演習" : kind === "test" ? `確認テスト（${LEVEL_INFO[cfg.level].label}）` : `演習：${getUnit(cfg.unitId)?.name}`;

  if (done) {
    return (
      <Summary
        state={state} kind={kind} cfg={cfg} log={log} before={before.current} events={events.current}
        testRes={testRes} sakanobori={sakanobori} onHome={onHome || onExit} onOpenUnit={onOpenUnit} onRestart={onRestart}
      />
    );
  }

  return (
    <div>
      <TopBar title={title} backLabel="やめる" onBack={() => {
        if (!log.length) return onExit();
        if (window.confirm("演習をやめますか？（ここまでの記録は保存されます）")) finish();
      }} />
      <div className="progress" style={{ marginBottom: 12 }}><i style={{ width: `${(i / total) * 100}%` }} /></div>
      {sakanobori && (
        <div className="card" style={{ background: "#f3f0ff" }}>
          <Coach>
            <span className="small">ここでつまずいているなら、前の単元「<b>{unitTitle(getUnit(sakanobori))}</b>」にもどると近道かも。{cheer("sakanobori")}</span>
            <div className="row mt8">
              <button className="btn sm" onClick={() => onOpenUnit(sakanobori)}>さかのぼる</button>
              <button className="btn sm ghost" onClick={() => setSakanobori(null)}>このまま続ける</button>
            </div>
          </Coach>
        </div>
      )}
      {p ? (
        <Problem
          p={p} mode={kind === "test" ? "test" : "practice"} index={i} total={total}
          showUnit={kind === "mix"} onAnswer={handleAnswer} onNext={next} extra={extra}
          nextLabel={i + 1 >= total ? "結果を見る" : "次へ"}
        />
      ) : (
        <div className="card">問題を用意できませんでした。<button className="btn sm mt8" onClick={onExit}>もどる</button></div>
      )}
    </div>
  );
}

function Summary({ state, kind, cfg, log, before, events, testRes, sakanobori, onHome, onOpenUnit, onRestart }) {
  const c = log.filter((x) => x.correct).length;
  const ids = [...new Set(log.map((x) => x.unitId))];
  const reachedNames = [...new Set(events.reached)].map((id) => getUnit(id)?.name).filter(Boolean);
  const badgeList = [...new Set(events.badges)].map((id) => BADGES.find((b) => b.id === id)).filter(Boolean);
  const u = kind !== "mix" ? getUnit(cfg.unitId) : null;
  const req = u ? requiredLevel(u, state.profile) : 0;
  const mastered = u ? masteredLevel(state.units[u.id]) : 0;
  const nextTestLevel = u ? Math.max(1, Math.min(Math.max(mastered + 1, 1), u.maxLevel)) : 1;

  let headline = c === log.length ? "全問正解！" : c >= log.length * 0.6 ? "よくがんばった！" : "おつかれさま！";
  let face = c === log.length ? "🎉" : c >= log.length * 0.6 ? "😊" : "💪";
  if (testRes) {
    headline = testRes.pass ? `合格！「${LEVEL_INFO[cfg.level].label}」を習得` : "あと少し！";
    face = testRes.pass ? "🏅" : "🌱";
  }

  return (
    <div>
      <TopBar title="結果" />
      <div className="card center">
        <div style={{ fontSize: 54, lineHeight: 1.1 }}>{face}</div>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{headline}</div>
        <div className="muted mt8">{log.length}問中 <b style={{ color: "#1e2433", fontSize: 20 }}>{c}</b> 問正解　・　<b style={{ color: "#4f46e5" }}>+{events.xp + (testRes?.bonus || 0)} XP</b></div>
        {testRes && !testRes.pass && <div className="small mt8">5問中4問で合格。解説を見直して、もう一度挑戦しよう。</div>}
      </div>

      {reachedNames.length > 0 && (
        <div className="card" style={{ background: "#e8f8ee" }}>
          <div style={{ fontWeight: 900 }}>🎯 目標レベルに到達！</div>
          <div className="small mt8">{reachedNames.join("、")}</div>
        </div>
      )}
      {badgeList.length > 0 && (
        <div className="card">
          <h2>🏅 バッジを手に入れた</h2>
          <div className="badges">
            {badgeList.map((b) => <div key={b.id} className="bdg"><div className="i">{b.icon}</div><div className="n">{b.name}</div></div>)}
          </div>
        </div>
      )}

      <div className="card">
        <h2>📈 理解度の変化</h2>
        {ids.map((id) => {
          const uu = getUnit(id);
          const r = requiredLevel(uu, state.profile);
          const b = before[id] || { level: 0 };
          const a = displayLevel(state.units[id]);
          const mine = log.filter((x) => x.unitId === id);
          return (
            <div key={id} className="row" style={{ padding: "8px 0", borderBottom: "1px solid #eef1f7", cursor: "pointer" }} onClick={() => onOpenUnit(id)}>
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>{GRADE_LABEL[uu.grade]}　{uu.name}</div>
                <div className="tiny muted">{mine.filter((x) => x.correct).length}/{mine.length} 正解{a.level > b.level && !a.estimated ? "　・　レベルアップ！" : ""}</div>
              </div>
              <LevelPips level={a.level} req={r} max={uu.maxLevel} estimated={a.estimated} />
            </div>
          );
        })}
      </div>

      {log.some((x) => !x.correct) && (
        <div className="card">
          <h2>📝 まちがえた問題は、また出てくるよ</h2>
          <div className="small muted">間をあけてもう一度解くと、記憶にしっかり残ります。</div>
        </div>
      )}

      {sakanobori && (
        <div className="card" style={{ background: "#f3f0ff" }}>
          <Coach><span className="small">「{unitTitle(getUnit(sakanobori))}」にさかのぼって、土台から固めよう。{cheer("sakanobori")}</span></Coach>
          <button className="btn block mt12" onClick={() => onOpenUnit(sakanobori)}>さかのぼって学ぶ</button>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {kind === "unit" && <button className="btn" onClick={() => onRestart({ kind: "unit", unitId: cfg.unitId, n: 5 })}>もう5問</button>}
        {kind === "unit" && u && mastered < u.maxLevel && (
          <button className="btn soft" onClick={() => onRestart({ kind: "test", unitId: u.id, level: nextTestLevel, n: 5 })}>
            確認テスト（{LEVEL_INFO[nextTestLevel].label}）に挑戦{nextTestLevel >= req && req ? "・目標レベル" : ""}
          </button>
        )}
        {kind === "test" && !testRes?.pass && <button className="btn" onClick={() => onRestart({ kind: "unit", unitId: cfg.unitId, n: 5 })}>演習で練習してから</button>}
        {kind === "test" && testRes?.pass && u && mastered < u.maxLevel && (
          <button className="btn soft" onClick={() => onRestart({ kind: "test", unitId: u.id, level: Math.min(u.maxLevel, mastered + 1), n: 5 })}>
            次のレベル（{LEVEL_INFO[Math.min(u.maxLevel, mastered + 1)].label}）に挑戦
          </button>
        )}
        {kind === "mix" && <button className="btn" onClick={() => onRestart({ kind: "mix" })}>おすすめをもう10問</button>}
        {u && <button className="btn ghost" onClick={() => onOpenUnit(u.id)}>単元のページへ</button>}
        <button className="btn ghost" onClick={onHome}>ホームへ</button>
      </div>
    </div>
  );
}
