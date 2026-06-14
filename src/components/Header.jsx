// Header.jsx — 画面上部の共通ヘッダー（XP・レベル・連続日数 or 戻るボタン）
import { levelProgress, levelColor, levelTitle, playerLevel, playerXp } from "../engine/scoring.js";

export default function Header({ player, back, onBack }) {
  const xp = playerXp(player);      // 現在ワールド（学年）の累計XP
  const lv = playerLevel(player);   // 現在ワールドのレベル
  const pct = levelProgress(xp);
  const col = levelColor(lv);
  return (
    <div className="hdr">
      <span className="logo">📐 数学ラボ</span>
      <div className="hdr-r">
        {back ? (
          <button className="back-btn" onClick={onBack}>← {back}</button>
        ) : (
          <>
            <div className="chip cc">💰{player.coins ?? 0}</div>
            <div className="chip cx">💎{player.crystals ?? 0}</div>
            <div className="chip cs">🔥{player.streaks}日</div>
            <div className="chip cl">
              <span style={{ fontSize: 11, fontWeight: 700, color: col }}>Lv.{lv}</span>
              <div className="xpm"><div className="xpf" style={{ width: pct + "%", background: col }} /></div>
              <span className="xpt">{xp}XP</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
