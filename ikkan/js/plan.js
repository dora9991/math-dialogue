/* ikkan：授業計画（1 コマ＝A4 1枚）の紙面。画面を持たない（core.js のあとに読む）。
   授業計画のデータ（data/lesson_*.js の plan）：
     type   授業の型（'探（課題解決）' など）
     aim    ねらい
     prep   準備するもの・教卓に置くもの［文…］
     flow   時間割［{ m:分, scene:場面, do:先生がすること, q:発問［文…］, st:生徒の動き・想定される反応, note:ひとこと }…］。分の合計は 50
     words  この時間に押さえる重要語句［…］
     think  { q:考えよう の問い, views:想定される見方（深まりの順）［…］, hints:ヒント（出す順）［…］, direction:最後に伝える方向性（答えは示さない）}
     manabi 演習プリントの学び合い発問［{ kind, text }…］
     see    見取り［[観点, 見るところ]…］
     tips   つまずきと手立て［[つまずき, 手立て]…］ */
(function () {
  'use strict';
  const IK = window.IK, R = IK.render;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const t = s => R.inl(s);   // {{ }}・累乗・分数などの書き方は、ワークシートと同じ

  // 時間割の「時刻」（0–3、3–8、…）を、分から組み立てる
  function clock(flow) {
    let at = 0;
    return flow.map(f => { const a = at; at += f.m; return { a, b: at }; });
  }

  function planHTML(p, l) {
    const ck = clock(p.flow);
    const flow = p.flow.map((f, i) => `<tr>
        <td class="t"><b>${ck[i].a}–${ck[i].b}</b><small>${f.m}分</small><div class="s">${t(f.scene)}</div></td>
        <td>${t(f.do || '')}${(f.q || []).map(q => `<div class="q">${t(q)}</div>`).join('')}${f.note ? `<div class="n">${t(f.note)}</div>` : ''}</td>
        <td>${t(f.st || '')}</td></tr>`).join('');
    const th = p.think || {};
    const li = (a, ord) => `<${ord ? 'ol' : 'ul'}>${(a || []).map(x => `<li>${t(x)}</li>`).join('')}</${ord ? 'ol' : 'ul'}>`;
    return `<div class="wsp plan-page" style="width:210mm;height:297mm">
  <div class="plan-body">
    <header class="plan-h">
      <div class="pl-meta">${esc(l.unitName || '')}　${esc(l.no || '')}　<span class="pl-type">${esc(p.type || '')}</span>　<span class="pl-min">50分</span></div>
      <h1>${esc(l.title)}</h1>
      <p class="pl-aim"><b>ねらい</b>${t(p.aim)}</p>
    </header>
    <section class="pl-flow">
      <table><thead><tr><th>時間・場面</th><th>先生がすること（青い線の文は発問）</th><th>生徒の動き・想定される反応</th></tr></thead><tbody>${flow}</tbody></table>
    </section>
    <section class="pl-words"><b>重要語句</b>${(p.words || []).map(w => `<span>${t(w)}</span>`).join('')}</section>
    <section class="pl-think">
      <h3>考えよう（学び合いの課題）</h3>
      <p class="pq">${t(th.q || '')}</p>
      <div class="pl-two">
        <div><h4>想定される見方（深まりの順）</h4>${li(th.views, true)}</div>
        <div><h4>ヒント（出す順。答えは言わない）</h4>${li(th.hints, true)}</div>
      </div>
      <p class="pdir"><b>最後に伝える方向性</b>${t(th.direction || '')}<small>（答えは示さない。教卓の解答にも載せない）</small></p>
    </section>
    <div class="pl-two pl-low">
      <section><h3>演習プリントの学び合い発問</h3><ul>${(p.manabi || []).map(m => `<li><b>【${esc(m.kind)}】</b>${t(m.text)}</li>`).join('')}</ul></section>
      <section><h3>見取り</h3><ul>${(p.see || []).map(s => `<li><b>${esc(s[0])}</b>${t(s[1])}</li>`).join('')}</ul></section>
    </div>
    <section class="pl-tips"><h3>つまずきと手立て</h3><ul>${(p.tips || []).map(s => `<li><b>${t(s[0])}</b>${t(s[1])}</li>`).join('')}</ul></section>
    <footer class="pl-prep"><b>準備・教卓</b>${(p.prep || []).map(x => `<span>${t(x)}</span>`).join('')}</footer>
  </div>
</div>`;
  }
  R.planHTML = planHTML;
})();
