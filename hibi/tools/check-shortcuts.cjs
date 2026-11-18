#!/usr/bin/env node
/* tools/make-shortcuts.cjs が作るショートカットの中身を確かめる（本物の iPhone では確かめられないので、つながりと形だけ）。
   ・変数の参照（ActionOutput の UUID）が、どれもあるアクションを指しているか
   ・「繰り返す」の始まりと終わりが組になっているか
   ・取りこむときの質問が、あるアクションの、ある項目を指しているか（URL と合言葉）
   ・文の中の変数の位置（{位置, 1}）に、置きかえの印（U+FFFC）があるか
   ・送る JSON の項目が、裏側の ios.sync と同じ名前か。plist（XML）が閉じているか
   使い方：node hibi/tools/check-shortcuts.cjs */
'use strict';
const { build, plist, SHORTCUTS } = require('./make-shortcuts.cjs');

let failures = 0, passed = 0;
const ok = (c, msg) => { if (c) passed++; else { failures++; console.log('  ✗ ' + msg); } };

function walk(o, fn) {
  if (Array.isArray(o)) o.forEach(x => walk(x, fn));
  else if (o && typeof o === 'object') { fn(o); Object.values(o).forEach(x => walk(x, fn)); }
}
const keysOf = d => d.Value.WFDictionaryFieldValueItems.map(i => i.WFKey.Value.string);

for (const s of SHORTCUTS) {
  console.log('■ ' + s.name);
  const sc = build(s.name, s.past, s.next);
  const acts = sc.WFWorkflowActions;
  const id = a => a.WFWorkflowActionIdentifier.replace('is.workflow.actions.', '');
  const P = a => a.WFWorkflowActionParameters;

  const uuids = new Set(acts.map(a => P(a).UUID).filter(Boolean));
  const refs = [];
  walk(acts, o => { if (o.Type === 'ActionOutput') refs.push(o.OutputUUID); });
  ok(refs.length >= 10 && refs.every(r => uuids.has(r)), 'どの参照も、あるアクションを指す');
  ok(uuids.size === acts.filter(a => P(a).UUID).length, 'UUID が重ならない');

  const loops = {};
  acts.filter(a => id(a) === 'repeat.each').forEach(a => { (loops[P(a).GroupingIdentifier] = loops[P(a).GroupingIdentifier] || []).push(P(a).WFControlFlowMode); });
  ok(Object.keys(loops).length === 2 && Object.values(loops).every(m => m.join() === '0,2'), '「繰り返す」が2つ、始まりと終わりが組');

  let posOk = true;
  walk(acts, o => {
    if (o.WFSerializationType !== 'WFTextTokenString') return;
    const str = o.Value.string;
    Object.keys(o.Value.attachmentsByRange).forEach(k => { const i = Number(/^\{(\d+), 1\}$/.exec(k)[1]); if (str[i] !== '￼') posOk = false; });
  });
  ok(posOk, '文の中の変数の位置に、置きかえの印がある');

  const q = sc.WFWorkflowImportQuestions;
  ok(q.length === 2 && q.every(x => x.Category === 'Parameter' && x.ParameterKey in P(acts[x.ActionIndex])), '取りこむときの質問が、ある項目を指す');
  ok(id(acts[q[0].ActionIndex]) === 'downloadurl' && q[0].ParameterKey === 'WFURL', '1つめの質問は、送り先の URL');
  ok(id(acts[q[1].ActionIndex]) === 'gettext' && q[1].ParameterKey === 'WFTextActionText', '2つめの質問は、合言葉');
  ok(!/hb_[0-9a-f]{12,}/.test(JSON.stringify(sc)) && !/script\.google\.com\/macros\/s\//.test(JSON.stringify(sc)), 'ファイルに合言葉も URL も入っていない');

  const post = acts.find(a => id(a) === 'downloadurl');
  ok(P(post).WFHTTPMethod === 'POST' && P(post).WFHTTPBodyType === 'JSON', 'POST・JSON で送る');
  ok(keysOf(P(post).WFJSONValues).join() === 'token,action,events,reminders', '送る項目：token・action・events・reminders');
  ok(P(post).WFJSONValues.Value.WFDictionaryFieldValueItems[1].WFValue.Value.string === 'ios.sync', 'action は ios.sync');
  const dicts = acts.filter(a => id(a) === 'dictionary').map(a => keysOf(P(a).WFItems));
  ok(dicts[0].join() === 'title,start,end,allDay,cal,loc', '予定の辞書の項目（裏側の normEvent_ と同じ名前）');
  ok(dicts[1].join() === 'title,due,list,prio,flag', 'リマインダーの辞書の項目（裏側の normReminder_ と同じ名前）');
  const appends = acts.filter(a => id(a) === 'appendvariable').map(a => P(a).WFVariableName);
  const sent = [];
  walk(P(post).WFJSONValues, o => { if (o.Type === 'Variable') sent.push(o.VariableName); });
  ok(appends.join() === '予定,リマインダー一覧' && sent.join() === '予定,リマインダー一覧', '「変数に追加」した変数を、そのまま送る');

  const tpl = P(acts[0]).WFContentItemFilter.Value.WFActionParameterFilterTemplates;
  ok(id(acts[0]) === 'filter.calendarevents' && P(acts[0]).WFContentItemFilter.Value.WFActionParameterFilterPrefix === 0, '予定は「どれかに合う」でさがす');
  ok(tpl.map(t => `${t.Property}:${t.Operator}:${t.Values.Number}:${t.Values.Unit}`).join() === `Start Date:1001:${s.past}:16,Start Date:1000:${s.next}:16`,
    `開始日が 過去${s.past}日以内 か 次の${s.next}日以内`);
  const rem = acts.find(a => id(a) === 'filter.reminders');
  ok(P(rem).WFContentItemFilter.Value.WFActionParameterFilterTemplates[0].Values.Bool === false, 'リマインダーは、終わっていないものだけ');

  const xml = plist(sc);
  const count = re => (xml.match(re) || []).length;
  ok(xml.startsWith('<?xml') && count(/<dict>/g) === count(/<\/dict>/g) && count(/<array>/g) === count(/<\/array>/g), 'plist の dict・array が閉じている');
  const bare = xml.replace(/<\?xml[^>]*\?>|<!DOCTYPE[^>]*>|<\/?(plist|dict|array|key|string|integer|real)( [^>]*)?>|<(true|false|dict|array)\/>/g, '');
  ok(!/[<>]/.test(bare) && !/&(?!amp;|lt;|gt;)/.test(bare), '文字の < > & はよけてある');
}

console.log(`\n${failures ? '✗' : '✓'} ${passed} 件 OK${failures ? `、${failures} 件 失敗` : ''}`);
process.exit(failures ? 1 : 0);
