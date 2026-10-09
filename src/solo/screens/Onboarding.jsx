// ============================================================
// Onboarding.jsx — はじめの設定（目標設定）
//   0 ようこそ → 1 名前と学年 → 2 目標（志望校・レベル・文理）→ 3 学校で習った単元 → 4 1日の目標
//  設定画面からの「目標を変える」でも同じ部品を使う（startStep で途中から）。
// ============================================================
import { useMemo, useState } from "react";
import { Coach, TopBar, AreaChip } from "../components/ui.jsx";
import { TIERS, TRACKS, UNIVERSITIES, TIER_BY_ID, guessLearnedThisYear, examDate, daysUntil, requiredLevel } from "../engine/goals.js";
import { UNITS, GRADE_LABEL, GRADE_ORDER, LEVEL_INFO } from "../content/index.js";
import { TEACHER } from "../lectures/index.js";

const GRADE_BTNS = [...GRADE_ORDER, "R"];
const gradeLabel = (g) => (g === "R" ? "既卒" : GRADE_LABEL[g]);

export default function Onboarding({ initial, startStep = 0, onDone, onCancel }) {
  const [step, setStep] = useState(startStep);
  const [name, setName] = useState(initial?.name || "");
  const [grade, setGrade] = useState(initial?.grade || null);
  const [tier, setTier] = useState(initial?.goal?.tier || null);
  const [track, setTrack] = useState(initial?.goal?.track || "mitei");
  const [uni, setUni] = useState(initial?.goal?.uni || "");
  const [learned, setLearned] = useState(initial?.learned || null);
  const [dailyGoal, setDailyGoal] = useState(initial?.dailyGoal || 10);

  const profile = useMemo(() => ({ name, grade, goal: { tier, track, uni }, learned: learned || [], dailyGoal }), [name, grade, tier, track, uni, learned, dailyGoal]);
  const thisYear = useMemo(() => {
    if (!grade || grade === "R") return [];
    return UNITS.filter((u) => u.grade === grade && requiredLevel(u, { ...profile, goal: { tier: tier || "kyotsu", track } }) > 0);
  }, [grade, tier, track, profile]);

  const pickUni = (v) => {
    setUni(v);
    const hit = UNIVERSITIES.find((x) => x.name === v);
    if (hit) setTier(hit.tier);
  };

  const goStep3 = () => {
    if (learned == null || initial?.grade !== grade) setLearned(guessLearnedThisYear(UNITS, profile));
    setStep(grade === "R" || thisYear.length === 0 ? 4 : 3);
  };

  const finish = () => onDone({ ...profile, learned: learned || [], createdAt: initial?.createdAt || Date.now() });

  const stage = grade ? (grade === "R" ? "H" : grade[0]) : null;

  return (
    <div>
      {onCancel ? <TopBar title="目標と学年の設定" onBack={onCancel} /> : <div style={{ height: 16 }} />}

      {step === 0 && (
        <div>
          <div className="hero center" style={{ padding: "28px 18px" }}>
            <div style={{ fontSize: 44 }}>∑</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>数学ラボ ソロ</div>
            <div className="meta mt8">小1から高3まで。ひとりで、自分のペースで、<br />「わかる」を「できる」に。</div>
          </div>
          <div className="card">
            <Coach>
              はじめまして、{TEACHER.name}だよ。ここは授業とは別に、<b>ひとりで習熟する</b>ための場所。
              <br />まず3つのことを一緒に決めよう。
            </Coach>
            <ol style={{ margin: "14px 0 0", paddingLeft: 22, lineHeight: 1.9 }}>
              <li><b>目標</b>　… 志望校から、必要なレベルを決める</li>
              <li><b>現在地</b>　… 診断で、今の理解度とつまずきを見つける</li>
              <li><b>毎日のおすすめ</b>　… 講義・演習・復習を自動で選ぶ</li>
            </ol>
          </div>
          <button className="btn block grad" onClick={() => setStep(1)}>はじめる</button>
        </div>
      )}

      {step === 1 && (
        <div>
          <StepHead n={1} title="あなたのこと" />
          <div className="card">
            <label className="small" style={{ fontWeight: 800 }}>呼び名（ニックネームでOK・空でもOK）</label>
            <input className="input mt8" value={name} maxLength={12} placeholder="例：かず" onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="card">
            <h2>いまの学年</h2>
            {["E", "J", "H"].map((st) => (
              <div key={st} className="mt8">
                <div className="tiny muted" style={{ fontWeight: 800, marginBottom: 4 }}>{{ E: "小学校", J: "中学校", H: "高校" }[st]}</div>
                <div className={`pick ${st === "E" ? "g3" : "g4"}`} style={st === "E" ? { gridTemplateColumns: "repeat(6, 1fr)" } : undefined}>
                  {GRADE_BTNS.filter((g) => (g === "R" ? st === "H" : g[0] === st)).map((g) => (
                    <button key={g} className={`pickbtn ${grade === g ? "on" : ""}`} onClick={() => setGrade(g)}>{gradeLabel(g)}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Nav onBack={startStep < 1 ? () => setStep(0) : onCancel} onNext={() => setStep(2)} disabled={!grade} />
        </div>
      )}

      {step === 2 && (
        <div>
          <StepHead n={2} title="目標を決めよう" />
          <div className="card">
            <h2>🎓 志望校<span className="sub">決まっていなくてもOK</span></h2>
            <input className="input" list="solo-unis" value={uni} placeholder="大学名を入力（例：佐賀大学）" onChange={(e) => pickUni(e.target.value)} />
            <datalist id="solo-unis">{UNIVERSITIES.map((u) => <option key={u.name} value={u.name} />)}</datalist>
            <div className="tiny muted mt8">候補から選ぶと、目標レベルが自動で入ります（目安です。自由に変えてOK）。</div>
          </div>
          <div className="card">
            <h2>🎯 目標レベル</h2>
            {stage === "E" && <div className="small muted" style={{ marginBottom: 8 }}>小学生のうちは「共通テスト・中堅大」か「国公立・上位私大」がおすすめ。いつでも変えられます。</div>}
            <div className="pick">
              {TIERS.map((t) => (
                <button key={t.id} className={`pickbtn ${tier === t.id ? "on" : ""}`} onClick={() => setTier(t.id)}>
                  <div className="row">
                    <span className="t grow">{t.label}</span>
                    <span className="chip" style={{ background: t.color + "22", color: t.color }}>高校 {LEVEL_INFO[t.levels.H].label}まで</span>
                  </div>
                  <div className="d">{t.desc}</div>
                  <div className="d" style={{ color: "#6b7385" }}>例：{t.examples}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <h2>📚 文系・理系</h2>
            <div className="pick g3">
              {TRACKS.map((t) => (
                <button key={t.id} className={`pickbtn ${track === t.id ? "on" : ""}`} onClick={() => setTrack(t.id)}>{t.label}</button>
              ))}
            </div>
            <div className="tiny muted mt8">{TRACKS.find((t) => t.id === track)?.desc}</div>
          </div>
          {tier && grade && (
            <div className="card" style={{ background: "#f6f5ff" }}>
              <Coach>
                <span className="small">
                  目標は「<b>{uni || TIER_BY_ID[tier].label}</b>」。
                  小学校は<b>{LEVEL_INFO[TIER_BY_ID[tier].levels.E].label}</b>、中学校は<b>{LEVEL_INFO[TIER_BY_ID[tier].levels.J].label}</b>、
                  高校は<b>{LEVEL_INFO[TIER_BY_ID[tier].levels.H].label}</b>レベルまでを目指そう。
                  共通テストまで、あと<b>{daysUntil(examDate(profile))}</b>日。
                </span>
              </Coach>
            </div>
          )}
          <Nav onBack={() => setStep(1)} onNext={goStep3} disabled={!tier} />
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHead n={3} title={`${gradeLabel(grade)}で、もう習った単元`} />
          <div className="card">
            <div className="small muted" style={{ marginBottom: 10 }}>学校の授業でもう習った単元にチェック。今の時期から予想して入れてあります。前の学年の単元は、すべて「習った」として診断します。</div>
            <div className="row" style={{ marginBottom: 8 }}>
              <button className="btn sm ghost" onClick={() => setLearned(thisYear.map((u) => u.id))}>全部</button>
              <button className="btn sm ghost" onClick={() => setLearned([])}>まだ何も</button>
            </div>
            <div className="ulist">
              {thisYear.map((u) => {
                const on = (learned || []).includes(u.id);
                return (
                  <label key={u.id} className="it" style={{ cursor: "pointer" }}>
                    <input type="checkbox" checked={on} onChange={() => setLearned((l) => (on ? l.filter((x) => x !== u.id) : [...(l || []), u.id]))} style={{ width: 20, height: 20 }} />
                    <span className="grow"><b style={{ fontSize: 14.5 }}>{u.chapterName ? `${u.chapterName}：` : ""}{u.name}</b><span className="tiny muted" style={{ display: "block" }}>{u.desc}</span></span>
                    <AreaChip area={u.area} />
                  </label>
                );
              })}
            </div>
          </div>
          <Nav onBack={() => setStep(2)} onNext={() => setStep(4)} />
        </div>
      )}

      {step === 4 && (
        <div>
          <StepHead n={4} title="1日の目標" />
          <div className="card">
            <div className="small muted" style={{ marginBottom: 10 }}>毎日つづけられる量がいちばん。少なめから始めて、慣れたら増やそう。</div>
            <div className="pick g4">
              {[5, 10, 15, 20].map((n) => (
                <button key={n} className={`pickbtn ${dailyGoal === n ? "on" : ""}`} onClick={() => setDailyGoal(n)}>{n}問<div className="tiny muted">約{Math.round(n * 1.2)}分</div></button>
              ))}
            </div>
          </div>
          <Nav onBack={() => setStep(grade === "R" || thisYear.length === 0 ? 2 : 3)} onNext={finish} nextLabel={initial?.grade ? "保存する" : "設定おわり"} />
        </div>
      )}
    </div>
  );
}

function StepHead({ n, title }) {
  return (
    <div style={{ margin: "4px 0 12px" }}>
      <div className="row" style={{ gap: 6 }}>
        {[1, 2, 3, 4].map((k) => <span key={k} style={{ flex: 1, height: 5, borderRadius: 9, background: k <= n ? "#4f46e5" : "#dfe3ee" }} />)}
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, marginTop: 10 }}>{title}</div>
    </div>
  );
}

function Nav({ onBack, onNext, disabled, nextLabel = "次へ" }) {
  return (
    <div className="row" style={{ marginTop: 6 }}>
      {onBack ? <button className="btn ghost" onClick={onBack}>‹ もどる</button> : <span />}
      <span className="grow" />
      <button className="btn" onClick={onNext} disabled={disabled}>{nextLabel} ▸</button>
    </div>
  );
}
