// ============================================================
// TitleScreen.jsx — タイトル画面（リッチ演出）
//  ・回転する光のリング＋浮遊するロゴ＋シマーするタイトル
//  ・「はじめる」でホームへ。遊び方・キャラへの導線も。
//  ・📐を5回すばやくタップで管理用モード（隠しコマンド・生徒には見えない）。
// ============================================================
import { useEffect, useRef } from "react";
import { MathBackdrop } from "../components/Decorations.jsx";
import * as bgm from "../audio/bgm.js";

export default function TitleScreen({ onEnter, onAdmin, onHowTo, onCharacter }) {
  useEffect(() => { bgm.play("op"); }, []); // 念のためOPを継続

  // 隠しコマンド：📐を5回すばやくタップで管理用モードへ
  const tapRef = useRef({ n: 0, t: 0 });
  function secretTap() {
    const now = Date.now();
    const s = tapRef.current;
    s.n = now - s.t < 800 ? s.n + 1 : 1;
    s.t = now;
    if (s.n >= 5) { s.n = 0; onAdmin?.(); }
  }

  return (
    <div className="app" style={{ alignItems: "center", justifyContent: "center" }}>
      <MathBackdrop />
      <div className="title-wrap">
        <div className="title-stage">
          <div className="title-ring" />
          <div className="title-ring2" />
          <div className="title-logo" onClick={secretTap} style={{ cursor: "default", userSelect: "none" }}>📐</div>
        </div>

        <div className="title-name">数学ラボ</div>
        <div className="title-sub">～ MATH LAB ～</div>
        <div className="title-tag">解いて、戦って、レベルアップ！</div>

        <div style={{ marginTop: 26 }}>
          <button className="title-cta" onClick={onEnter}>▶ はじめる</button>
        </div>

        <div className="title-links">
          {onHowTo && <button className="title-link" onClick={onHowTo}>📖 遊び方</button>}
          {onCharacter && <button className="title-link" onClick={onCharacter}>🎨 キャラ</button>}
        </div>

        <div className="title-hint">♪ 音楽が流れます</div>
      </div>
    </div>
  );
}
