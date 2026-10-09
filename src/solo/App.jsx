// ============================================================
// App.jsx — 数学ラボ ソロ（画面のつなぎ役）
//   データの記録は engine/actions.js、保存は engine/store.js に任せて、ここは画面の切り替えだけ。
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { load, save, blankState, clearAll } from "./engine/store.js";
import { applyAnswer, applyTest, applyDiag, applyReview } from "./engine/actions.js";
import { mixPlan } from "./engine/recommend.js";
import { BADGES } from "./engine/motivation.js";
import { getUnit } from "./content/index.js";
import { BottomNav, Toast } from "./components/ui.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import Home from "./screens/Home.jsx";
import MapScreen from "./screens/MapScreen.jsx";
import UnitScreen from "./screens/UnitScreen.jsx";
import Practice from "./screens/Practice.jsx";
import Records from "./screens/Records.jsx";
import Settings from "./screens/Settings.jsx";
import { DiagIntro, DiagRun, DiagResult } from "./screens/Diagnosis.jsx";

const TABS = ["home", "map", "records", "settings"];

export default function App() {
  const [state, setState] = useState(load);
  const [route, setRoute] = useState(() => (state.profile ? { name: "home" } : { name: "onboard" }));
  const [stack, setStack] = useState([]);
  const [toast, setToast] = useState(null);

  // 最新の state（1問ごとに続けて記録するので、描画を待たずに参照できるようにしておく）
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; save(state); }, [state]);
  const commit = (next) => { stateRef.current = next; setState(next); };

  const go = useCallback((name, params = {}, { push = true } = {}) => {
    setRoute((cur) => {
      // 演習・診断の途中画面は「もどる」先にしない（戻ると最初からやり直しになるため）
      if (push && !TABS.includes(name) && cur.name !== "practice" && cur.name !== "diag") setStack((s) => [...s, cur].slice(-20));
      if (TABS.includes(name)) setStack([]);
      return { name, ...params };
    });
    window.scrollTo(0, 0);
  }, []);
  const back = useCallback(() => {
    setStack((s) => {
      const prev = s[s.length - 1];
      setRoute(prev || { name: "home" });
      return s.slice(0, -1);
    });
    window.scrollTo(0, 0);
  }, []);

  const notifyBadges = (ids) => {
    if (!ids?.length) return;
    const b = BADGES.find((x) => x.id === ids[0]);
    if (b) setToast(`${b.icon} バッジ「${b.name}」を手に入れた！`);
  };

  // ── 学習の記録 ──
  const onAnswer = (p, correct, opts) => {
    const out = applyAnswer(stateRef.current, p, correct, opts);
    commit(out.state);
    notifyBadges(out.newlyBadges);
    return out;
  };
  const onTestDone = (unitId, level, score, total) => {
    const out = applyTest(stateRef.current, unitId, level, score, total);
    commit(out.state);
    notifyBadges(out.newlyBadges);
    return out;
  };
  const onReviewDone = (acc) => commit(applyReview(stateRef.current, acc));
  const onDiagDone = (result) => {
    if (!result) { setToast("診断できる単元がまだありません。まずは単元を学ぼう！"); go("home"); return; }
    const out = applyDiag(stateRef.current, result);
    commit(out.state);
    notifyBadges(out.newlyBadges);
    setStack([]);
    setRoute({ name: "diagResult" });
    window.scrollTo(0, 0);
  };

  const openUnit = (unitId) => {
    if (!getUnit(unitId)) return;
    go("unit", { unitId });
  };
  const startPractice = (cfg) => {
    if (cfg.kind === "mix" && !cfg.plan) {
      const plan = mixPlan(stateRef.current, 10);
      if (!plan.length) { setToast("おすすめの単元がまだありません"); return; }
      cfg = { kind: "mix", plan };
    }
    go("practice", { cfg, key: Date.now() });
  };

  let body = null;
  switch (route.name) {
    case "onboard":
      body = (
        <Onboarding
          onDone={(profile) => {
            commit({ ...stateRef.current, profile });
            setStack([]);
            setRoute({ name: "diagIntro" });
          }}
        />
      );
      break;
    case "editProfile":
      body = (
        <Onboarding
          initial={state.profile} startStep={1} onCancel={back}
          onDone={(profile) => { commit({ ...stateRef.current, profile }); setToast("保存しました"); back(); }}
        />
      );
      break;
    case "diagIntro":
      body = <DiagIntro state={state} onStart={(budget) => go("diag", { budget }, { push: false })} onSkip={() => { setStack([]); setRoute({ name: "home" }); }} />;
      break;
    case "diag":
      body = <DiagRun key={route.budget} state={state} budget={route.budget} onFinish={onDiagDone} onQuit={() => { setStack([]); setRoute({ name: "home" }); }} />;
      break;
    case "diagResult":
      body = <DiagResult state={state} onHome={() => go("home")} onOpenUnit={openUnit} />;
      break;
    case "unit":
      body = (
        <UnitScreen
          key={route.unitId} state={state} unitId={route.unitId} tab={route.tab}
          onBack={back} onPractice={startPractice} onOpenUnit={openUnit}
        />
      );
      break;
    case "practice":
      body = (
        <Practice
          key={route.key} state={state} cfg={route.cfg}
          onAnswer={onAnswer} onTestDone={onTestDone} onReviewDone={onReviewDone}
          onExit={back} onHome={() => go("home")} onOpenUnit={openUnit} onRestart={startPractice}
        />
      );
      break;
    case "map":
      body = <MapScreen state={state} onOpenUnit={openUnit} />;
      break;
    case "records":
      body = <Records state={state} onOpenUnit={openUnit} />;
      break;
    case "settings":
      body = (
        <Settings
          state={state}
          onEditProfile={() => go("editProfile")}
          onDiag={() => go("diagIntro")}
          onReplace={(s) => commit(s)}
          onReset={() => { clearAll(); commit(blankState()); setStack([]); setRoute({ name: "onboard" }); }}
        />
      );
      break;
    default:
      body = (
        <Home
          state={state} onOpenUnit={openUnit} onMix={() => startPractice({ kind: "mix" })}
          onDiag={() => go("diagIntro")} onGo={(n) => go(n)}
        />
      );
  }

  const showNav = state.profile && TABS.includes(route.name);
  return (
    <div className="app">
      {body}
      {showNav && <BottomNav cur={route.name} onGo={(n) => go(n)} />}
      <Toast msg={toast} onDone={() => setToast(null)} />
    </div>
  );
}
