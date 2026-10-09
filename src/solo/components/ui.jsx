// ============================================================
// ui.jsx — 小さな共通部品（バー・ナビ・先生の吹き出し・レベルのつぶ・リング・グラフ）
// ============================================================
import { useEffect } from "react";
import { LEVEL_INFO, AREA_INFO, AREAS } from "../content/index.js";
import { TEACHER } from "../lectures/index.js";

export function TopBar({ title, onBack, backLabel = "もどる", right }) {
  return (
    <div className="topbar">
      {onBack && <button className="back" onClick={onBack}>‹ {backLabel}</button>}
      <h1>{title}</h1>
      {right}
    </div>
  );
}

export function Brand({ right }) {
  return (
    <div className="topbar">
      <div className="brand grow"><span className="logo">∑</span>数学ラボ ソロ</div>
      {right}
    </div>
  );
}

const NAV = [
  { id: "home", icon: "🏠", label: "ホーム" },
  { id: "map", icon: "🗺️", label: "マップ" },
  { id: "records", icon: "📊", label: "記録" },
  { id: "settings", icon: "⚙️", label: "設定" },
];
export function BottomNav({ cur, onGo }) {
  return (
    <nav className="bottomnav">
      <div className="inner">
        {NAV.map((n) => (
          <button key={n.id} className={cur === n.id ? "on" : ""} onClick={() => onGo(n.id)}>
            <span className="ic">{n.icon}</span>{n.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/** 先生の吹き出し */
export function Coach({ children, face = TEACHER.icon, name = TEACHER.name }) {
  return (
    <div className="coach">
      <div className="face">{face}</div>
      <div className="bubble"><span className="who">{name}</span>{children}</div>
    </div>
  );
}

/** レベルのつぶ（4つ）。level=今のレベル、req=目標（線）、max=この単元の最高 */
export function LevelPips({ level = 0, req = 0, max = 4, estimated = false, size = 1 }) {
  return (
    <span className="pips" title={`今：${LEVEL_INFO[level]?.label || "まだ"} ／ 目標：${LEVEL_INFO[req]?.label || "-"}`}>
      {[1, 2, 3, 4].map((L) => (
        <span
          key={L}
          className={`pip ${L === req ? "req" : ""} ${estimated && L <= level ? "est" : ""}`}
          style={{
            width: 18 * size, height: 8 * size,
            background: L <= level ? LEVEL_INFO[L].color : L > max ? "transparent" : undefined,
            border: L > max ? "1px dashed #d4d9e4" : undefined,
          }}
        />
      ))}
    </span>
  );
}

export function LevelChip({ level }) {
  const info = LEVEL_INFO[level];
  if (!info) return null;
  return <span className="chip" style={{ background: info.color + "1f", color: info.color }}>{info.label}</span>;
}

export function AreaChip({ area }) {
  const a = AREA_INFO[area];
  if (!a) return null;
  return <span className="chip" style={{ background: a.color + "1c", color: a.color }}>{a.icon} {a.label}</span>;
}

/** 円のリング（0〜100） */
export function Ring({ pct = 0, size = 88, stroke = 9, color = "#fff", track = "rgba(255,255,255,.25)", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, Math.max(0, pct)) / 100)} style={{ transition: "stroke-dashoffset .6s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>{children}</div>
    </div>
  );
}

/** 分野ごとの理解度レーダー（scores: {num: 0..100, ...}） */
export function Radar({ scores = {}, size = 230 }) {
  // 左右のラベル（「データ・確率」など）が切れないよう、横に余白をとる
  const padX = 34;
  const cx = size / 2 + padX, cy = size / 2, R = size / 2 - 40;
  const n = AREAS.length;
  const pt = (i, v) => {
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [cx + Math.cos(ang) * R * v, cy + Math.sin(ang) * R * v];
  };
  const poly = AREAS.map((a, i) => pt(i, (scores[a] ?? 0) / 100).join(",")).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${size + padX * 2} ${size}`} style={{ maxWidth: 340, display: "block", margin: "0 auto" }} role="img" aria-label="分野ごとの理解度">
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon key={k} points={AREAS.map((_, i) => pt(i, k).join(",")).join(" ")} fill="none" stroke="#e3e7f0" strokeWidth={k === 1 ? 1.5 : 1} />
      ))}
      {AREAS.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e3e7f0" />; })}
      <polygon points={poly} fill="rgba(79,70,229,.22)" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" />
      {AREAS.map((a, i) => {
        const [x, y] = pt(i, (scores[a] ?? 0) / 100);
        return <circle key={a} cx={x} cy={y} r="3.5" fill="#4f46e5" />;
      })}
      {AREAS.map((a, i) => {
        const [x, y] = pt(i, 1.22);
        return (
          <text key={a} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="11.5" fontWeight="800" fill={AREA_INFO[a].color}>
            {AREA_INFO[a].label}
            <tspan x={x} dy="14" fill="#4b5468" fontWeight="700">{scores[a] == null ? "—" : `${scores[a]}%`}</tspan>
          </text>
        );
      })}
    </svg>
  );
}

/** 日ごとの棒グラフ（days: [{label, dow, n}]、goal: 目標の線） */
export function DayBars({ days, goal = 10, height = 120 }) {
  const max = Math.max(goal, ...days.map((d) => d.n), 1);
  const w = 100 / days.length;
  return (
    <svg width="100%" viewBox={`0 0 100 ${height / 3}`} preserveAspectRatio="none" style={{ height, display: "block" }} role="img" aria-label="毎日の解いた問題数">
      {days.map((d, i) => {
        const h = (d.n / max) * (height / 3 - 6);
        const reached = d.n >= goal;
        return (
          <g key={d.key}>
            <rect x={i * w + w * 0.18} y={height / 3 - 4 - h} width={w * 0.64} height={Math.max(h, d.n ? 0.8 : 0)} rx="0.8"
              fill={reached ? "#4f46e5" : "#a5b4fc"}><title>{`${d.label}（${d.dow}）${d.n}問`}</title></rect>
          </g>
        );
      })}
      <line x1="0" x2="100" y1={height / 3 - 4 - (goal / max) * (height / 3 - 6)} y2={height / 3 - 4 - (goal / max) * (height / 3 - 6)}
        stroke="#f59e0b" strokeWidth="0.3" strokeDasharray="1.2 1" />
    </svg>
  );
}

/** 画面上部に少しだけ出るお知らせ */
export function Toast({ msg, onDone, ms = 2200 }) {
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(onDone, ms);
    return () => clearTimeout(id);
  }, [msg, onDone, ms]);
  if (!msg) return null;
  return <div className="toast" role="status">{msg}</div>;
}

/** お祝い（習得・バッジ） */
export function Celebrate({ data, onClose }) {
  if (!data) return null;
  return (
    <div className="celebrate" onClick={onClose}>
      <div className="box" onClick={(e) => e.stopPropagation()}>
        <div className="em">{data.icon || "🎉"}</div>
        <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>{data.title}</div>
        {data.lines?.map((l, i) => <div key={i} className="small" style={{ color: "#4b5468", marginTop: 6 }}>{l}</div>)}
        <button className="btn block mt16" onClick={onClose}>つづける</button>
      </div>
    </div>
  );
}
