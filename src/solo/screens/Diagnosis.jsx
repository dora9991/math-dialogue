// ============================================================
// Diagnosis.jsx — 理解度診断（はじめの説明 → 出題 → 結果）
// ============================================================
import { useEffect, useRef, useState } from "react";
import Problem from "../components/Problem.jsx";
import { TopBar, Coach, AreaChip } from "../components/ui.jsx";
import { DIAG_SIZES, startDiagnosis, nextDiagUnit, answerDiag, finishDiag, probeLevel } from "../engine/diagnosis.js";
import { genProblem, getUnit, GRADE_LABEL, AREAS, AREA_INFO, unitTitle } from "../content/index.js";

export function DiagIntro({ state, onStart, onSkip }) {
  const [size, setSize] = useState("normal");
  return (
    <div>
      <TopBar title="理解度診断" onBack={onSkip} backLabel={state.diag ? "もどる" : "あとで"} />
      <div className="card">
        <Coach>
          今の「現在地」を見つけよう。いちばん最近習った単元から出題して、まちがえたら<b>その前提の単元へさかのぼって</b>、つまずきの根っこを探すよ。
        </Coach>
        <ul className="small" style={{ margin: "14px 0 0", paddingLeft: 20, lineHeight: 1.9 }}>
          <li>診断中は正解・不正解を表示しません（気にせずどんどん）</li>
          <li>わからない問題は「わからない」でOK。それも大事な情報です</li>
          <li>結果から、毎日の「おすすめ」が決まります</li>
        </ul>
      </div>
      <div className="card">
        <h2>問題数</h2>
        <div className="pick">
          {DIAG_SIZES.map((s) => (
            <button key={s.id} className={`pickbtn ${size === s.id ? "on" : ""}`} onClick={() => setSize(s.id)}>
              <span className="t">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <button className="btn block grad" onClick={() => onStart(DIAG_SIZES.find((s) => s.id === size).budget)}>診断をはじめる</button>
      {!state.diag && <button className="btn block ghost mt12" onClick={onSkip}>診断せずにはじめる</button>}
    </div>
  );
}

export function DiagRun({ state, budget, onFinish, onQuit }) {
  const sess = useRef(null);
  const [p, setP] = useState(null);
  const [n, setN] = useState(0);
  const recent = useRef([]);

  const ask = () => {
    const s = sess.current;
    const id = nextDiagUnit(s);
    if (!id) return done();
    const u = getUnit(id);
    const q = genProblem(id, probeLevel(u, state.profile), recent.current);
    if (!q) { // 問題が作れない単元は飛ばす
      answerDiag(s, id, probeLevel(u, state.profile), true);
      return ask();
    }
    recent.current = [q.tplId, ...recent.current].slice(0, 5);
    setP(q);
  };
  const done = () => onFinish(finishDiag(sess.current, state.profile));

  useEffect(() => {
    sess.current = startDiagnosis(state.profile, budget);
    if (sess.current.scope.length === 0) { onFinish(null); return; }
    ask();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return <div className="card mt16">準備中…</div>;
  const total = sess.current.budget;
  return (
    <div>
      <TopBar title="理解度診断" onBack={() => { if (window.confirm("診断を中断しますか？（ここまでの結果で判定します）")) (n > 0 ? done() : onQuit()); }} backLabel="中断" />
      <div className="row small muted" style={{ marginBottom: 6 }}>
        <span>{n + 1} 問目</span><span className="grow" /><span>最大 {total} 問</span>
      </div>
      <div className="progress" style={{ marginBottom: 12 }}><i style={{ width: `${(n / total) * 100}%` }} /></div>
      <Problem
        p={p} mode="diag"
        onAnswer={({ correct }) => { answerDiag(sess.current, p.unitId, p.level, correct); }}
        onNext={() => { setN((k) => k + 1); ask(); }}
      />
    </div>
  );
}

export function DiagResult({ state, onHome, onOpenUnit }) {
  const d = state.diag;
  if (!d) return null;
  const pct = d.total ? Math.round((d.correct / d.total) * 100) : 0;
  return (
    <div>
      <TopBar title="診断の結果" />
      <div className="hero">
        <div className="lbl">あなたの現在地</div>
        <div className="goal">{d.total}問中 {d.correct}問 正解</div>
        {d.inferredOk > 0 && <div className="meta mt8">正解した単元の前提 {d.inferredOk} 単元も「たぶんOK」と判定しました。</div>}
      </div>

      <div className="card">
        <Coach>
          {d.weakRoots.length === 0
            ? <>つまずきは見つからなかったよ。すばらしい！ 次は目標レベルに向けて、一段上の問題に挑戦していこう。</>
            : <>つまずきの<b>根っこ</b>が {d.weakRoots.length} か所見つかったよ。ここを先に固めると、上の単元が一気にわかるようになる。<b>さかのぼるのは後退じゃなくて、近道</b>だよ。</>}
        </Coach>
      </div>

      {d.weakRoots.length > 0 && (
        <div className="card">
          <h2>🌱 つまずきの根っこ（ここから始めよう）</h2>
          {d.weakRoots.map((id) => {
            const u = getUnit(id);
            if (!u) return null;
            return (
              <button key={id} className="rec" onClick={() => onOpenUnit(id)}>
                <span className="badge" style={{ background: "#fdecef" }}>🌱</span>
                <span className="grow"><span className="nm">{unitTitle(u)}</span><span className="why" style={{ display: "block" }}>{u.desc}</span></span>
                <AreaChip area={u.area} />
              </button>
            );
          })}
        </div>
      )}

      <div className="card">
        <h2>分野ごとの正解</h2>
        {AREAS.map((a) => {
          const x = d.byArea[a];
          if (!x?.asked) return null;
          return (
            <div key={a} className="row" style={{ marginBottom: 8 }}>
              <span style={{ width: 92, fontWeight: 800, fontSize: 13.5, color: AREA_INFO[a].color }}>{AREA_INFO[a].icon} {AREA_INFO[a].label}</span>
              <div className="progress grow" style={{ height: 10 }}><i style={{ width: `${(x.correct / x.asked) * 100}%`, background: AREA_INFO[a].color }} /></div>
              <span className="small" style={{ width: 44, textAlign: "right" }}>{x.correct}/{x.asked}</span>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2>出題した単元</h2>
        <div className="ulist">
          {d.asked.map((a, i) => {
            const u = getUnit(a.unitId);
            if (!u) return null;
            return (
              <div key={i} className="it" onClick={() => onOpenUnit(a.unitId)}>
                <span style={{ width: 22, textAlign: "center" }}>{a.correct ? "⭕" : "・"}</span>
                <span className="grow small"><b>{GRADE_LABEL[u.grade]}</b>　{u.name}</span>
                <AreaChip area={u.area} />
              </div>
            );
          })}
        </div>
        <div className="tiny muted mt8">正答率 {pct}%。診断は「設定」からいつでもやり直せます。</div>
      </div>

      <button className="btn block grad" onClick={onHome}>おすすめから学習をはじめる</button>
    </div>
  );
}

