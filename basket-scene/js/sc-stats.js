/* バスケ シーン — タブ「stats」（まだ中身はありません。土台だけ） */
(function (root) {
  'use strict';
  const SC = root.SC, { h } = root.BT.ui;
  SC.app.panel('stats', { mount(el) { el.innerHTML = ''; el.append(h('p', { class: 'sc-stub' }, 'ここは、これから作ります（stats）')); }, show() {}, hide() {}, badge() { return ''; } });
})(typeof window !== 'undefined' ? window : globalThis);
