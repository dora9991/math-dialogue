// ============================================================
// Settings.jsx — 設定（目標・学年の変更、診断のやり直し、データの書き出し／読み込み、しくみの説明）
// ============================================================
import { useRef, useState } from "react";
import { Brand, Coach } from "../components/ui.jsx";
import { tierOf } from "../engine/goals.js";
import { exportJson, importJson } from "../engine/store.js";
import { GRADE_LABEL, UNITS } from "../content/index.js";
import { TEACHER } from "../lectures/index.js";

export default function Settings({ state, onEditProfile, onDiag, onReplace, onReset }) {
  const p = state.profile;
  const file = useRef(null);
  const [msg, setMsg] = useState(null);

  const download = () => {
    const blob = new Blob([exportJson(state)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `数学ラボソロ_${p.name || "記録"}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const upload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const s = importJson(await f.text());
      if (window.confirm("いまの記録を、読み込んだ記録で置きかえますか？")) { onReplace(s); setMsg("読み込みました"); }
    } catch (err) {
      setMsg(`読み込めませんでした：${err.message}`);
    }
    e.target.value = "";
  };

  const nUnits = UNITS.length;
  const nTpl = UNITS.reduce((s, u) => s + Object.values(u.levels || {}).reduce((a, l) => a + l.length, 0), 0);

  return (
    <div>
      <Brand />
      <div className="card">
        <h2>🎓 目標と学年</h2>
        <div className="small">{p.name ? `${p.name}さん・` : ""}{p.grade === "R" ? "既卒" : GRADE_LABEL[p.grade]}</div>
        <div className="small">目標：<b>{p.goal?.uni || "（志望校未入力）"}</b>（{tierOf(p).label}・{{ bunkei: "文系", rikei: "理系", mitei: "文理未定" }[p.goal?.track] || "文理未定"}）</div>
        <div className="small">1日の目標：{p.dailyGoal}問</div>
        <button className="btn sm mt12" onClick={onEditProfile}>変更する</button>
      </div>
      <div className="card">
        <h2>🧭 理解度診断</h2>
        <div className="small muted">{state.diag ? `前回：${new Date(state.diag.at).toLocaleDateString("ja-JP")}（${state.diag.total}問）` : "まだ受けていません"}</div>
        <button className="btn sm mt12" onClick={onDiag}>{state.diag ? "もう一度診断する" : "診断する"}</button>
      </div>
      <div className="card">
        <h2>💾 記録の保存</h2>
        <div className="small muted">記録はこの端末のブラウザに保存されています。別の端末に移すときや、念のための控えに。</div>
        <div className="row wrap mt12">
          <button className="btn sm" onClick={download}>ファイルに書き出す</button>
          <button className="btn sm ghost" onClick={() => file.current?.click()}>ファイルから読み込む</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={upload} />
        </div>
        {msg && <div className="small mt8" style={{ fontWeight: 700 }}>{msg}</div>}
      </div>
      <div className="card">
        <h2>🔍 このアプリのしくみ</h2>
        <Coach><span className="small">先生・保護者の方へ。どうやって「おすすめ」を決めているか、短くまとめました。</span></Coach>
        <ul className="small" style={{ paddingLeft: 20, lineHeight: 1.8, marginBottom: 0 }}>
          <li><b>単元マップ</b>：小1〜高3の {nUnits} 単元を「前提 → 発展」のつながりで結んでいます。問題テンプレートは {nTpl} 種類（数字が毎回変わる）。</li>
          <li><b>目標</b>：志望校のレベルから、小・中・高それぞれ「簡単／標準／応用／難関」のどこまで必要かを決めます。</li>
          <li><b>診断</b>：最近習った単元から出題し、まちがえたら前提の単元へさかのぼって「つまずきの根っこ」を探します。</li>
          <li><b>理解度</b>：レベルごとに「次も正解できる見込み」を、最近の結果ほど重く計算。3問以上で80%以上、または確認テスト（5問中4問）合格で「習得」。</li>
          <li><b>おすすめ</b>：①つまずきの根っこ ②目標に届いていない単元 ③復習の時期（3→7→16→35日）④未確認 ⑤予習 の順。土台になる単元ほど優先。</li>
          <li><b>演習</b>：2問続けて正解でレベルアップ、2問続けて不正解でレベルダウン。いちばん下でもつまずくと、前提へのさかのぼりを提案します。</li>
        </ul>
      </div>
      <div className="card">
        <h2>⚠️ 記録を消す</h2>
        <button className="btn sm ghost" style={{ color: "#e11d48" }} onClick={() => { if (window.confirm("すべての記録を消して、最初からやり直しますか？（元に戻せません）")) onReset(); }}>すべての記録を消す</button>
      </div>
      <div className="tiny muted center">数学ラボ ソロ（試作版）・解説：{TEACHER.name}（準備中）</div>
    </div>
  );
}
