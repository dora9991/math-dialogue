// ============================================================
// Lecture.jsx — 講義（解説）
//   ・ホー先生の解説がある単元 … スライドを1枚ずつ（話す→板書→ポイント→例題→理解チェック）
//   ・まだ無い単元 … 要点＋例題（タップで1行ずつ解き方）。ホー先生の解説動画（lectures/videos.js）があれば一緒に出す
// ============================================================
import { useMemo, useState } from "react";
import M from "./M.jsx";
import { Coach } from "./ui.jsx";
import { getLecture, TEACHER } from "../lectures/index.js";
import { genProblem } from "../content/index.js";
import { getVideos } from "../lectures/videos.js";

function Board({ lines, title }) {
  return (
    <div className="board mt12">
      {title && <div style={{ fontSize: 13, opacity: .8 }}>{title}</div>}
      {lines.map((l, i) => <div key={i}><M>{l}</M></div>)}
    </div>
  );
}

/** 例題：タップで1行ずつ解き方を見せる */
function Example({ ex }) {
  const [shown, setShown] = useState(0);
  const done = shown >= ex.steps.length;
  return (
    <div className="mt12" style={{ border: "2px solid #e3e7f0", borderRadius: 14, padding: 14 }}>
      <div className="small" style={{ fontWeight: 800, color: "#4f46e5" }}>例題</div>
      <div style={{ fontSize: 17, fontWeight: 700 }}><M>{ex.q}</M></div>
      <ol className="steps">
        {ex.steps.slice(0, shown).map((s, i) => <li key={i}><M>{s}</M></li>)}
      </ol>
      {done ? (
        <div className="mt8" style={{ fontWeight: 800 }}>答え：<M>{ex.ans}</M></div>
      ) : (
        <button className="btn sm soft mt8" onClick={() => setShown((n) => n + 1)}>{shown === 0 ? "解き方を見る" : "次の行 ▸"}</button>
      )}
    </div>
  );
}

/** 理解チェック（答えるまで正解は見せない） */
function Check({ ck, onDone }) {
  const [sel, setSel] = useState(null);
  const ok = sel != null && String(ck.choices[sel]) === String(ck.ans);
  return (
    <div className="mt12">
      <div style={{ fontSize: 17, fontWeight: 700 }}><span className="chip" style={{ marginRight: 6 }}>考えてみよう</span><M>{ck.q}</M></div>
      <div className="choices mt8">
        {ck.choices.map((c, i) => {
          let cls = "";
          if (sel != null) cls = String(c) === String(ck.ans) ? "right" : i === sel ? "wrong" : "";
          return (
            <button key={i} className={`choice ${cls}`} disabled={sel != null} onClick={() => { setSel(i); onDone?.(); }}>
              <span className="no">{i + 1}</span><M breakable>{String(c)}</M>
            </button>
          );
        })}
      </div>
      {sel != null && (
        <div className={`feedback mt8 ${ok ? "ok" : "ng"}`} style={{ marginBottom: 0 }}>
          <M>{ok ? ck.ok || "正解！" : ck.ng || `答えは ${ck.ans}`}</M>
        </div>
      )}
    </div>
  );
}

function SlidePlayer({ lecture, onFinish }) {
  const [i, setI] = useState(0);
  const s = lecture.slides[i];
  const last = i === lecture.slides.length - 1;
  return (
    <div>
      <div className="row small muted" style={{ marginBottom: 8 }}>
        <span style={{ fontWeight: 800, color: "#1e2433" }}>{lecture.title}</span>
        <span className="grow" />
        <span>{i + 1} / {lecture.slides.length}</span>
      </div>
      <div className="progress" style={{ marginBottom: 12 }}><i style={{ width: `${((i + 1) / lecture.slides.length) * 100}%` }} /></div>
      <div className="slide" key={i}>
        {s.say && <Coach><M>{s.say}</M></Coach>}
        {s.board && <Board lines={s.board} title={s.boardTitle} />}
        {s.point && <div className="point mt12"><M>{s.point}</M></div>}
        {s.example && <Example ex={s.example} />}
        {s.check && <Check ck={s.check} />}
        {s.yt && <div className="video mt12"><iframe src={`https://www.youtube-nocookie.com/embed/${s.yt}`} title="解説動画" allowFullScreen /></div>}
      </div>
      <div className="row mt12">
        <button className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>‹ もどる</button>
        <span className="grow" />
        {last
          ? <button className="btn" onClick={onFinish}>演習へすすむ ▸</button>
          : <button className="btn" onClick={() => setI(i + 1)}>次へ ▸</button>}
      </div>
    </div>
  );
}

/** ホー先生の解説動画・会話授業（lectures/videos.js）。url はこの画面の中で再生／別タブで開く、yt は YouTube の埋め込み */
function VideoCard({ videos }) {
  const [video, setVideo] = useState(null);
  return (
    <div className="card">
      <h2>📺 {TEACHER.name}の解説動画</h2>
      {video?.yt && (
        <div className="video"><iframe src={`https://www.youtube-nocookie.com/embed/${video.yt}?autoplay=1`} title="解説動画" allow="autoplay; encrypted-media" allowFullScreen /></div>
      )}
      {video?.url && (
        <div>
          <iframe
            className="talkframe" src={video.url} title={video.title || "会話授業"}
            allow="autoplay; fullscreen; encrypted-media" allowFullScreen referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
          />
          <div className="tiny muted mt8">
            うまく表示されない・画面が小さいときは、
            <a href={video.url} target="_blank" rel="noopener noreferrer">新しいタブで開く ↗</a>
          </div>
        </div>
      )}
      <div className="mt8">
        {videos.map((v) => {
          const key = v.yt || v.url;
          const on = video && (video.yt || video.url) === key;
          const name = v.title || `${TEACHER.name}の解説`;
          if (v.yt) {
            return (
              <button key={key} className="rec" onClick={() => setVideo(on ? null : v)} style={{ marginBottom: 6 }}>
                <span className="badge" style={{ background: "#fff7e6" }}>▶</span>
                <span className="grow"><span className="nm">{name}</span></span>
              </button>
            );
          }
          return (
            <div key={key} className="row" style={{ gap: 8, marginBottom: 6, alignItems: "stretch" }}>
              <button className="rec grow" onClick={() => setVideo(on ? null : v)} style={{ marginBottom: 0, borderColor: on ? "var(--pri)" : undefined }}>
                <span className="badge" style={{ background: "#fff7e6" }}>▶</span>
                <span className="grow"><span className="nm">{name}</span><span className="why" style={{ display: "block" }}>{on ? "上で再生中（もう一度おすと閉じます）" : "この画面で見る"}</span></span>
              </button>
              <a className="btn sm ghost" href={v.url} target="_blank" rel="noopener noreferrer" style={{ display: "grid", placeItems: "center", textDecoration: "none" }} aria-label={`${name}を新しいタブで開く`}>↗<br /><span className="tiny">別タブ</span></a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Lecture({ unit, onStartPractice }) {
  const lecture = getLecture(unit.id);
  const [mode, setMode] = useState(lecture ? "slides" : "summary");
  const example = useMemo(() => genProblem(unit.id, 1), [unit.id]);
  const videos = getVideos(unit.id);
  const vcard = videos.length > 0 && <VideoCard key={unit.id} videos={videos} />;

  // スライドの解説がある単元でも、動画・会話授業は先頭に出す
  if (lecture && mode === "slides") {
    return <div>{vcard}<SlidePlayer lecture={lecture} onFinish={onStartPractice} /></div>;
  }

  return (
    <div>
      {lecture ? (
        <button className="btn block grad" onClick={() => setMode("slides")} style={{ marginBottom: 14 }}>
          {TEACHER.icon} {TEACHER.name}の解説を見る（約{lecture.minutes}分）
        </button>
      ) : videos.length === 0 && (
        <div className="card" style={{ background: "#fffaf0" }}>
          <Coach>
            <span className="small">この単元の{TEACHER.name}の解説は、いま準備中だよ。まずは要点と例題で確かめよう。</span>
          </Coach>
        </div>
      )}

      {vcard}

      <div className="card">
        <h2>📌 この単元の要点</h2>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {unit.points.map((pt, i) => <li key={i} style={{ marginBottom: 6 }}><M>{pt}</M></li>)}
        </ul>
      </div>

      {example && (
        <div className="card">
          <h2>✏️ 例題<span className="sub">（毎回ちがう問題）</span></h2>
          <Example key={example.key} ex={{
            q: example.q,
            steps: example.steps,
            ans: example.choices ? String(example.ans) : `${example.ans}${example.unit ? " " + example.unit : ""}`,
          }} />
          {example.hint && <div className="small muted mt8">💡 考え方：<M>{example.hint}</M></div>}
        </div>
      )}

      <button className="btn block" onClick={onStartPractice}>演習へすすむ ▸</button>
    </div>
  );
}
