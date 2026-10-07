// ============================================================
// Problem.jsx — 1問を解く部品（4択 or 数字キーパッド、ヒント、わからない、解説）
//
//  mode = "practice" … 答えるとすぐ ○× と解説を出す
//  mode = "test"     … ヒントなし。○× と解説は出す
//  mode = "diag"     … 診断。正誤は見せずに次へ（落ち込ませない）
//  onAnswer({ correct, hinted, gaveUp, sec }) を1回だけ呼ぶ。onNext() で次の問題へ。
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import M from "./M.jsx";
import { checkAnswer } from "../engine/answer.js";
import { LevelChip } from "./ui.jsx";
import { GRADE_LABEL, getUnit } from "../content/index.js";

/** 入力中の値を表示（分数は上下2段で） */
function AnswerDisplay({ value, unit }) {
  const neg = value.startsWith("-");
  const body = neg ? value.slice(1) : value;
  let inner;
  if (body.includes("/")) {
    const [n, d] = body.split("/");
    inner = (
      <span className="frac">
        <span>{n || " "}</span>
        <span className="cur">{d}<i className="caret" /></span>
      </span>
    );
  } else {
    inner = <span>{body}<i className="caret" /></span>;
  }
  return (
    <div className="answerbox" aria-live="polite">
      {value === "" ? <span className="ph">下のキーで答えを入力</span> : <>{neg && <span>−</span>}{inner}</>}
      {unit && <span className="unit">{unit}</span>}
    </div>
  );
}

function Keypad({ value, setValue, onSubmit, disabled }) {
  const press = (k) => {
    if (disabled) return;
    if (k === "ok") return onSubmit();
    if (k === "bs") return setValue((v) => v.slice(0, -1));
    if (k === "neg") return setValue((v) => (v.startsWith("-") ? v.slice(1) : "-" + v));
    if (k === "/") return setValue((v) => (v.includes("/") || v.replace("-", "") === "" ? v : v + "/"));
    if (k === ".") return setValue((v) => {
      const cur = v.includes("/") ? v.split("/")[1] : v.replace("-", "");
      if (cur.includes(".")) return v;
      return v + (cur === "" ? "0." : ".");
    });
    return setValue((v) => (v.length > 14 ? v : v + k));
  };
  // パソコンのキーボードでも入力できる
  const ref = useRef(press);
  ref.current = press;
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (/^[0-9]$/.test(e.key)) ref.current(e.key);
      else if (e.key === "." ) ref.current(".");
      else if (e.key === "/") ref.current("/");
      else if (e.key === "-") ref.current("neg");
      else if (e.key === "Backspace") ref.current("bs");
      else if (e.key === "Enter") ref.current("ok");
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const K = (k, label, cls = "") => (
    <button key={k} className={`key ${cls}`} onClick={() => press(k)} disabled={disabled} aria-label={typeof label === "string" ? label : k}>{label}</button>
  );
  return (
    <div className="keypad">
      {K("7", "7")}{K("8", "8")}{K("9", "9")}{K("bs", "⌫", "fn")}
      {K("4", "4")}{K("5", "5")}{K("6", "6")}{K("neg", "＋/−", "fn")}
      {K("1", "1")}{K("2", "2")}{K("3", "3")}{K("/", "分数", "fn")}
      {K("0", "0")}{K(".", "．", "fn")}
      <button className="key go" style={{ gridColumn: "span 2" }} onClick={() => press("ok")} disabled={disabled || value === "" || value === "-"}>答える</button>
    </div>
  );
}

export default function Problem({ p, mode = "practice", index, total, onAnswer, onNext, showUnit = false, nextLabel = "次へ", extra }) {
  const [input, setInput] = useState("");
  const [sel, setSel] = useState(null);
  const [hinted, setHinted] = useState(false);
  const [result, setResult] = useState(null); // { correct, note, gaveUp }
  const t0 = useRef(Date.now());
  const unit = getUnit(p.unitId);

  useEffect(() => {
    setInput(""); setSel(null); setHinted(false); setResult(null);
    t0.current = Date.now();
  }, [p.key]);

  const finish = (res) => {
    if (result) return;
    const sec = Math.min(300, Math.round((Date.now() - t0.current) / 1000));
    setResult(res);
    onAnswer?.({ correct: res.correct, hinted, gaveUp: !!res.gaveUp, sec });
    if (mode === "diag") setTimeout(() => onNext?.(), 250);
  };

  const submitInput = () => {
    if (!input || input === "-") return;
    const r = checkAnswer(p, input);
    if (!r.correct && r.note && /約分|数字で/.test(r.note)) {
      // 形式だけのミスはやり直させる（1回目のみ）
      setResult(null);
      setNote(r.note);
      return;
    }
    finish(r);
  };
  const [note, setNote] = useState(null);
  useEffect(() => setNote(null), [p.key, input]);

  const choose = (c, i) => {
    if (result) return;
    setSel(i);
    finish(checkAnswer(p, c));
  };

  // 4択のキーボードショートカット 1〜4
  useEffect(() => {
    if (!p.choices) return;
    const onKey = (e) => {
      const i = Number(e.key) - 1;
      if (i >= 0 && i < p.choices.length && !result) choose(p.choices[i], i);
      if (e.key === "Enter" && result && mode !== "diag") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  useEffect(() => {
    if (p.choices || !result || mode === "diag") return;
    const onKey = (e) => { if (e.key === "Enter") { e.preventDefault(); onNext?.(); } };
    const id = setTimeout(() => window.addEventListener("keydown", onKey), 50);
    return () => { clearTimeout(id); window.removeEventListener("keydown", onKey); };
  }, [result, p.choices, mode, onNext]);

  const showFeedback = result && mode !== "diag";
  const ansIndex = useMemo(() => (p.choices ? p.choices.findIndex((c) => String(c) === String(p.ans)) : -1), [p]);

  return (
    <div>
      <div className="qcard">
        <div className="qmeta">
          {total != null && <span className="chip">{index + 1} / {total}</span>}
          {mode !== "diag" && <LevelChip level={p.level} />}
          {(showUnit || mode === "diag") && unit && <span className="chip">{GRADE_LABEL[unit.grade]}・{unit.name}</span>}
          {mode === "test" && <span className="chip" style={{ background: "#fff4e0", color: "#b45309" }}>確認テスト</span>}
        </div>
        <div className="qtext"><M>{p.q}</M></div>
        {hinted && !result && <div className="point mt12 small"><span>💡 </span><M>{p.hint}</M></div>}
      </div>

      {p.choices ? (
        <div className={`choices ${p.choices.every((c) => String(c).length < 28) ? "two" : ""}`}>
          {p.choices.map((c, i) => {
            let cls = "";
            if (showFeedback) cls = i === ansIndex ? "right" : i === sel ? "wrong" : "";
            else if (sel === i) cls = "sel";
            return (
              <button key={i} className={`choice ${cls}`} disabled={!!result} onClick={() => choose(c, i)}>
                <span className="no">{i + 1}</span><M>{String(c)}</M>
              </button>
            );
          })}
        </div>
      ) : (
        !showFeedback && (
          <>
            <AnswerDisplay value={input} unit={p.unit} />
            {note && <div className="small center mt8" style={{ color: "#b45309", fontWeight: 700 }}>{note}</div>}
            <Keypad value={input} setValue={setInput} onSubmit={submitInput} disabled={!!result} />
          </>
        )
      )}

      {!result && (
        <div className="row mt12" style={{ justifyContent: "space-between" }}>
          {mode === "practice" ? (
            <button className="btn sm ghost" onClick={() => setHinted(true)} disabled={hinted}>💡 ヒント</button>
          ) : <span />}
          <button className="btn sm ghost" onClick={() => finish({ correct: false, gaveUp: true })}>
            {mode === "diag" ? "わからない →" : "わからない（解説を見る）"}
          </button>
        </div>
      )}

      {showFeedback && (
        <div className={`feedback mt12 ${result.correct ? "ok" : "ng"}`}>
          <div className="row">
            <span className="big" style={{ color: result.correct ? "var(--ok)" : "var(--ng)" }}>{result.correct ? "⭕ 正解！" : result.gaveUp ? "📖 解説を読もう" : "❌ ざんねん"}</span>
            {extra && <span className="grow small" style={{ textAlign: "right", fontWeight: 700 }}>{extra}</span>}
          </div>
          {!result.correct && (
            <div className="mt8" style={{ fontWeight: 700 }}>
              正解：<M>{String(p.ans)}</M>{!p.choices && p.unit ? ` ${p.unit}` : ""}
              {!p.choices && input && !result.gaveUp && <span className="muted small">（あなたの答え：{input.replace("-", "−")}）</span>}
            </div>
          )}
          {result.note && <div className="small mt8" style={{ fontWeight: 700 }}>{result.note}</div>}
          <ol className="steps">
            {(p.steps || []).map((s, i) => <li key={i}><M>{s}</M></li>)}
          </ol>
          <button className="btn block mt12" onClick={onNext} autoFocus>{nextLabel}</button>
        </div>
      )}
    </div>
  );
}
