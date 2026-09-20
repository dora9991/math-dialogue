// ============================================================
// TamperWarningOverlay.jsx — 保存データの改ざんを検知したときの警告
//  ・レベル/コイン/クリスタル/スキル/装備/なかま等が保存後に直接
//    書き換えられていた場合に表示（localStore.js の改ざん検知より）。
//  ・見た目だけの脅しではなく、実際にこの時点で進行状況は初期化済み。
// ============================================================
export default function TamperWarningOverlay({ onDone }) {
  return (
    <div onClick={onDone} style={bg}>
      <div onClick={(e) => e.stopPropagation()} style={card}>
        <div style={{ fontSize: 30, margin: "2px 0 6px" }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#fecaca" }}>保存データがおかしいよ</div>
        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.85)", lineHeight: 1.8, marginTop: 10 }}>
          レベル・コイン・クリスタル・スキルなどのデータが、アプリの外から書きかえられた形跡がありました。<br />
          <b style={{ color: "#fde047" }}>これらの進行状況を初期状態にもどしました。</b><br />
          学習の記録（挑戦の履歴）はそのまま残っています。
        </div>
        <button onClick={onDone} data-sfx="none" style={btn}>わかった</button>
      </div>
    </div>
  );
}

const bg = { position: "fixed", inset: 0, background: "rgba(0,0,0,.68)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 90, cursor: "pointer" };
const card = { background: "linear-gradient(160deg,#450a0a,#7f1d1d)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 18, padding: "22px 26px", textAlign: "center", maxWidth: 320, boxShadow: "0 18px 50px rgba(0,0,0,.5)" };
const btn = { marginTop: 16, padding: "11px 28px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 900, color: "#450a0a", background: "linear-gradient(135deg,#f87171,#fca5a5)" };
