// ============================================================
// Onboarding.jsx — はじめの設定（目標設定）
//   0 ようこそ → 1 名前と学年 → 2 目標（志望校・目標レベル）→ 3 どこまで習ったか（学年 → 単元 → 小単元）
//   ・志望校は、高校も大学も選べる（小・中学生は高校が先）。選ぶと目標レベルが自動で入る（あとから変えてよい）
//   ・目標レベル：小学生・中学生は「基礎・標準・応用・入試レベル」、高校生は5段階
//   ・習った範囲：単元（章）をえらぶと、小単元が出てくる。習っていない（未修）ところは、小単元ごとにチェックできる
//   ・診断は任意（設定のあと、ホームの一番上に出る）。1日の目標は、いまは使わない
//  設定画面からの「目標を変える」でも同じ部品を使う（startStep で途中から）。
// ============================================================
import { useMemo, useState } from "react";
import { Coach, TopBar } from "../components/ui.jsx";
import {
  TRACKS, tiersFor, tierForStage, tierOf, tierOfSchool, findSchool, schoolsFor, stageOfGrade,
  defaultLearned, examInfo, daysUntil, remainText, targetLevels,
} from "../engine/goals.js";
import { UNITS, GRADE_LABEL, GRADE_ORDER, chaptersOfGrade, levelName } from "../content/index.js";
import { TEACHER } from "../lectures/index.js";
import useCenterActive from "../components/useCenterActive.js";

const GRADE_BTNS = [...GRADE_ORDER, "R"];
const gradeLabel = (g) => (g === "R" ? "既卒" : GRADE_LABEL[g]);
const STAGE_NAME = { E: "小学校", J: "中学校", H: "高校" };

export default function Onboarding({ initial, startStep = 0, onDone, onCancel }) {
  const [step, setStep] = useState(startStep);
  const [name, setName] = useState(initial?.name || "");
  const [grade, setGrade] = useState(initial?.grade || null);
  const [tier, setTier] = useState(initial?.goal?.tier || null);
  const [track, setTrack] = useState(initial?.goal?.track || "mitei");
  const [uni, setUni] = useState(initial?.goal?.uni || "");
  const [learned, setLearned] = useState(() => new Set(initial?.learnedV === 2 ? initial.learned : []));
  const [touched, setTouched] = useState(!!initial?.learnedV); // 習った範囲を、自分で直したか（直していなければ、学年を変えたときに案を作りなおす）

  const stage = grade ? stageOfGrade(grade) : null;
  const tiers = stage ? tiersFor(stage) : [];
  const profile = useMemo(() => ({ name, grade, goal: { tier, track, uni } }), [name, grade, tier, track, uni]);
  const school = findSchool(uni);

  const pickGrade = (g) => {
    setGrade(g);
    // 学年の段階（小・中／高）が変わったら、選んでいた目標レベルも、その段階の呼び名に読みかえる
    if (tier) setTier(tierForStage(tier, stageOfGrade(g)));
  };
  const pickSchool = (v) => {
    setUni(v);
    const s = findSchool(v);
    if (s && stage) setTier(tierOfSchool(s, stage));
  };

  const goStep3 = () => {
    if (!touched) setLearned(new Set(defaultLearned({ grade })));
    setStep(3);
  };
  const finish = () => onDone({
    name, grade, goal: { tier, track, uni }, learned: [...learned], learnedV: 2, createdAt: initial?.createdAt || Date.now(),
  });

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
              <br />まず、3つのことを決めよう。
            </Coach>
            <ol style={{ margin: "14px 0 0", paddingLeft: 22, lineHeight: 1.9 }}>
              <li><b>あなたの学年</b></li>
              <li><b>目標</b>　… 志望校や、目指すレベル</li>
              <li><b>どこまで習ったか</b>　… 学校で習った単元（未修のところも、チェックできる）</li>
            </ol>
            <div className="small muted mt8">そのあと、「今の理解度」を診断することもできます（任意）。</div>
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
                <div className="tiny muted" style={{ fontWeight: 800, marginBottom: 4 }}>{STAGE_NAME[st]}</div>
                <div className={`pick ${st === "E" ? "g3" : "g4"}`} style={st === "E" ? { gridTemplateColumns: "repeat(6, 1fr)" } : undefined}>
                  {GRADE_BTNS.filter((g) => (g === "R" ? st === "H" : g[0] === st)).map((g) => (
                    <button key={g} className={`pickbtn ${grade === g ? "on" : ""}`} onClick={() => pickGrade(g)}>{gradeLabel(g)}</button>
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
            <input
              className="input" list="solo-schools" value={uni} autoComplete="off"
              placeholder={stage === "H" ? "大学名を入力（例：佐賀大学）" : "高校名を入力（例：佐賀西高校）"}
              onChange={(e) => pickSchool(e.target.value)}
            />
            <datalist id="solo-schools">
              {schoolsFor(stage).map((s) => <option key={s.name} value={s.name} label={s.kind === "high" ? "高校" : "大学"} />)}
            </datalist>
            <div className="tiny muted mt8">
              {school
                ? <>「{school.name}」の目安：<b>{tierOf(profile).label}</b>（下で変えてもOK）</>
                : <>候補から選ぶと、目標レベルが自動で入ります（目安です。{stage === "H" ? "" : "高校だけでなく、大学も選べます。"}自由に変えてOK）。</>}
            </div>
          </div>

          <div className="card">
            <h2>🎯 目標レベル</h2>
            {stage === "E" && <div className="small muted" style={{ marginBottom: 8 }}>小学生は、小学校の単元を、選んだレベルまで目指します。いつでも変えられます。</div>}
            {stage === "J" && <div className="small muted" style={{ marginBottom: 8 }}>中学校の単元を、選んだレベルまで目指します（小学校の単元は、標準まで）。いつでも変えられます。</div>}
            <div className="pick">
              {tiers.map((t) => (
                <button key={t.id} className={`pickbtn ${tier === t.id ? "on" : ""}`} onClick={() => setTier(t.id)}>
                  <div className="row">
                    <span className="t grow">{t.label}</span>
                    {stage === "H" && <span className="chip" style={{ background: t.color + "22", color: t.color }}>高校 {levelName(t.levels.H, "H1")}まで</span>}
                  </div>
                  <div className="d">{stage === "E" ? t.descE : t.desc}</div>
                  <div className="d" style={{ color: "#6b7385" }}>例：{t.examples}</div>
                </button>
              ))}
            </div>
          </div>

          {stage === "H" && (
            <div className="card">
              <h2>📚 文系・理系</h2>
              <div className="pick g3">
                {TRACKS.map((t) => (
                  <button key={t.id} className={`pickbtn ${track === t.id ? "on" : ""}`} onClick={() => setTrack(t.id)}>{t.label}</button>
                ))}
              </div>
              <div className="tiny muted mt8">{TRACKS.find((t) => t.id === track)?.desc}</div>
            </div>
          )}

          {tier && grade && <GoalSummary profile={profile} stage={stage} />}
          <Nav onBack={() => setStep(1)} onNext={goStep3} disabled={!tier} />
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHead n={3} title="どこまで習ったか" />
          <LearnedPicker grade={grade} learned={learned} onChange={(s) => { setLearned(s); setTouched(true); }} />
          <Nav onBack={() => setStep(2)} onNext={finish} nextLabel={initial?.grade ? "保存する" : "設定おわり"} />
        </div>
      )}
    </div>
  );
}

/** 目標のまとめ（先生の吹き出し） */
function GoalSummary({ profile, stage }) {
  const t = tierOf(profile);
  const lv = targetLevels(profile);
  const ex = examInfo(profile);
  const days = daysUntil(ex.date);
  const goalName = profile.goal.uni || t.label;
  return (
    <div className="card" style={{ background: "#f6f5ff" }}>
      <Coach>
        <span className="small">
          目標は「<b>{goalName}</b>」。
          {stage === "H" && <>小学校は<b>{levelName(lv.E, "E1")}</b>、中学校は<b>{levelName(lv.J, "J1")}</b>、高校は<b>{levelName(lv.H, "H1")}</b>レベルまでを目指そう。</>}
          {stage === "J" && <>中学校は<b>{levelName(lv.J, "J1")}</b>レベルまで（小学校は<b>{levelName(lv.E, "E1")}</b>まで）を目指そう。</>}
          {stage === "E" && <>小学校は<b>{levelName(lv.E, "E1")}</b>レベルまでを目指そう。</>}
          {" "}{ex.label}まで、あと<b>{remainText(days)}</b>。
        </span>
      </Coach>
    </div>
  );
}

// ── 習った範囲：学年のタブ → 単元（章）→ 小単元 ─────────────────
function LearnedPicker({ grade, learned, onChange }) {
  const [tab, setTab] = useState(grade === "R" ? "H3" : grade);
  const tabsRef = useCenterActive(tab);
  const [open, setOpen] = useState(() => new Set());

  const chapters = useMemo(() => chaptersOfGrade(tab), [tab]);
  const unitsOf = (g) => UNITS.filter((u) => u.grade === g);
  const countOf = (g) => { const us = unitsOf(g); return [us.filter((u) => learned.has(u.id)).length, us.length]; };
  const [done, total] = countOf(tab);

  const setMany = (ids, on) => {
    const next = new Set(learned);
    for (const id of ids) (on ? next.add(id) : next.delete(id));
    onChange(next);
  };
  const toggleOpen = (cid) => setOpen((o) => { const n = new Set(o); n.has(cid) ? n.delete(cid) : n.add(cid); return n; });
  const toggleChapter = (ch) => {
    const all = ch.units.every((u) => learned.has(u.id));
    setMany(ch.units.map((u) => u.id), !all);
    // 習った単元にすると、小単元が出てくる（未修のところを、チェックできるように）
    setOpen((o) => { const n = new Set(o); if (all) n.delete(ch.id); else n.add(ch.id); return n; });
  };

  const gi = GRADE_ORDER.indexOf(grade === "R" ? "H3" : grade);

  return (
    <div>
      <div className="card" style={{ paddingBottom: 12 }}>
        <div className="small muted">
          学校でもう習った単元を、えらんでください。<b>前の学年は、ぜんぶ習ったことにしてあります。</b>
          習っていない（<b>未修</b>の）ところは、小単元ごとにチェックできます。
        </div>
      </div>

      <div className="gtabs" role="tablist" aria-label="学年" ref={tabsRef}>
        {GRADE_ORDER.map((g) => {
          const [d, t] = countOf(g);
          const state = d === t ? "all" : d === 0 ? "none" : "part";
          return (
            <button key={g} role="tab" aria-selected={tab === g} className={`gtab ${tab === g ? "on" : ""}`} onClick={() => setTab(g)}>
              <span>{GRADE_LABEL[g]}</span>
              <i className={`gdot ${state}`} title={`${d}/${t}`} />
              {GRADE_ORDER.indexOf(g) === gi && <em>いま</em>}
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="row wrap" style={{ gap: 8 }}>
          <b style={{ fontSize: 16 }}>{GRADE_LABEL[tab]}</b>
          <span className="chip">習った {done}／{total} 小単元</span>
          {total - done > 0 && <span className="chip" style={{ background: "#fff1e6", color: "#c2410c" }}>未修 {total - done}</span>}
          <span className="grow" />
          <button className="btn sm ghost" onClick={() => setMany(unitsOf(tab).map((u) => u.id), true)}>全部 習った</button>
          <button className="btn sm ghost" onClick={() => setMany(unitsOf(tab).map((u) => u.id), false)}>全部 未修</button>
        </div>
      </div>

      {chapters.map((ch) => {
        const n = ch.units.filter((u) => learned.has(u.id)).length;
        const state = n === ch.units.length ? "all" : n === 0 ? "none" : "part";
        const isOpen = open.has(ch.id);
        return (
          <div key={ch.id} className="chcard">
            <div className="chhead">
              <button
                className={`chk ${state}`} role="checkbox" aria-checked={state === "all" ? true : state === "part" ? "mixed" : false}
                aria-label={`${ch.name}を習った`} onClick={() => toggleChapter(ch)}
              ><span className="box">{state === "all" ? "✓" : state === "part" ? "−" : ""}</span></button>
              <button className="chtitle" onClick={() => toggleOpen(ch.id)} aria-expanded={isOpen}>
                <span className="grow">
                  {ch.course && <span className="tiny muted" style={{ display: "block", fontWeight: 700 }}>{ch.course}</span>}
                  <b>{ch.name}</b>
                </span>
                <span className="small muted">{n}/{ch.units.length}</span>
                <span className="chev">{isOpen ? "▾" : "▸"}</span>
              </button>
            </div>
            {isOpen && (
              <div className="chbody">
                {ch.units.map((u) => {
                  const on = learned.has(u.id);
                  return (
                    <div key={u.id} className="unrow">
                      <div className="grow">
                        <div className="unname">{u.name}</div>
                        <div className="tiny muted">{u.desc}</div>
                      </div>
                      <div className="segtog" role="group" aria-label={`${u.name}：習った／未修`}>
                        <button aria-pressed={on} className={on ? "on" : ""} onClick={() => setMany([u.id], true)}>習った</button>
                        <button aria-pressed={!on} className={!on ? "on mi" : ""} onClick={() => setMany([u.id], false)}>未修</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepHead({ n, title }) {
  return (
    <div style={{ margin: "4px 0 12px" }}>
      <div className="row" style={{ gap: 6 }}>
        {[1, 2, 3].map((k) => <span key={k} style={{ flex: 1, height: 5, borderRadius: 9, background: k <= n ? "#4f46e5" : "#dfe3ee" }} />)}
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
