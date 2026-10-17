#!/usr/bin/env node
/* iPhone のショートカットを、手で組み立てずにファイルで作る（Mac で動かす）。
   ・「ひびの手帳 同期」……… iPhone の予定（2日前〜60日後）と、終わっていないリマインダーを、アプリへ（毎朝のオートメーション用）
   ・「ひびの手帳 全部入れる」… 1年前〜1年後の予定と、リマインダーを、アプリへ（はじめに1回だけ）
   使い方（Mac のターミナルで）：
     node hibi/tools/make-shortcuts.cjs         … 作る → macOS の shortcuts コマンドで署名する → ショートカットApp で開く
     node hibi/tools/make-shortcuts.cjs --dry   … 署名しないファイルを作るだけ（できた場所を表示する）
   取りこむ画面で、裏側の URL と合言葉を聞かれる（ファイルの中には入れない）。取りこんだショートカットは、iCloud で iPhone にも届く。
   中身は js/guide.js の「①」と同じ（予定とリマインダーを辞書にして、ios.sync で送る）。日付の範囲は「過去◯日以内・次の◯日以内」で指定する。 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const OBJ = '￼';   // 文の中の変数の位置（Shortcuts の約束）
const uuid = () => crypto.randomUUID().toUpperCase();
const DAY = 16;          // 日付の単位：日（NSCalendarUnitDay）

/* ───── 値のつくり方（Shortcuts のファイルの形） ───── */
const out = (id, name) => ({ Type: 'ActionOutput', OutputUUID: id, OutputName: name });
const named = name => ({ Type: 'Variable', VariableName: name });
const withAggr = (ref, aggr) => Object.assign({}, ref, { Aggrandizements: aggr });
const prop = name => ({ Type: 'WFPropertyVariableAggrandizement', PropertyName: name });
const iso = () => ({ Type: 'WFDateFormatVariableAggrandizement', WFDateFormatStyle: 'ISO 8601', WFISO8601IncludeTime: true });
const attachment = ref => ({ Value: ref, WFSerializationType: 'WFTextTokenAttachment' });
/** 文。refs は OBJ の位置に順に入る変数 */
function text(str, refs) {
  const byRange = {};
  let n = 0;
  for (let i = 0; i < str.length; i++) if (str[i] === OBJ) byRange[`{${i}, 1}`] = refs[n++];
  if (n !== (refs || []).length) throw new Error('変数の数が合わない：' + str);
  return { Value: { string: str, attachmentsByRange: byRange }, WFSerializationType: 'WFTextTokenString' };
}
const item = (key, value) => ({ WFItemType: 0, WFKey: text(key, []), WFValue: typeof value === 'string' ? text(value, []) : value });
const dict = items => ({ Value: { WFDictionaryFieldValueItems: items }, WFSerializationType: 'WFDictionaryFieldValue' });
/** 繰り返し項目の、ある項目（日付なら ISO 8601 にする） */
const field = (name, isDate) => text(OBJ, [withAggr(named('Repeat Item'), isDate ? [prop(name), iso()] : [prop(name)])]);

/** 「開始日が 過去 N 日以内」または「次の M 日以内」（どちらか） */
function startDateWithin(pastDays, nextDays) {
  const t = (op, n) => ({ Property: 'Start Date', Operator: op, Removable: true, Values: { Number: n, Unit: DAY }, Number: n, Unit: DAY });
  return { Value: { WFActionParameterFilterPrefix: 0, WFContentPredicateBoundedDate: false,
    WFActionParameterFilterTemplates: [t(1001, pastDays), t(1000, nextDays)] }, WFSerializationType: 'WFContentPredicateTableTemplate' };
}
/** 「完了が オフ」 */
function notCompleted() {
  return { Value: { WFActionParameterFilterPrefix: 1, WFContentPredicateBoundedDate: false,
    WFActionParameterFilterTemplates: [{ Property: 'Is Completed', Operator: 4, Removable: true, Values: { Bool: false }, Bool: false }] },
  WFSerializationType: 'WFContentPredicateTableTemplate' };
}

/** ショートカット1つ分。pastDays・nextDays は予定をさがす範囲 */
function build(name, pastDays, nextDays) {
  const A = [];
  const add = (id, params) => { A.push({ WFWorkflowActionIdentifier: 'is.workflow.actions.' + id, WFWorkflowActionParameters: params }); return A.length - 1; };
  const ids = { ev: uuid(), evDict: uuid(), rem: uuid(), remDict: uuid(), token: uuid(), post: uuid(), data: uuid(), msg: uuid(), err: uuid() };
  const loopEv = uuid(), loopRem = uuid();

  // 予定
  add('filter.calendarevents', { UUID: ids.ev, WFContentItemFilter: startDateWithin(pastDays, nextDays),
    WFContentItemSortProperty: 'Start Date', WFContentItemSortOrder: 'Oldest First', WFContentItemLimitEnabled: false });
  add('repeat.each', { GroupingIdentifier: loopEv, WFControlFlowMode: 0, WFInput: attachment(out(ids.ev, 'Calendar Events')) });
  add('dictionary', { UUID: ids.evDict, WFItems: dict([
    item('title', field('Title')), item('start', field('Start Date', true)), item('end', field('End Date', true)),
    item('allDay', field('Is All Day')), item('cal', field('Calendar')), item('loc', field('Location'))]) });
  add('appendvariable', { WFVariableName: '予定', WFInput: attachment(out(ids.evDict, 'Dictionary')) });
  add('repeat.each', { GroupingIdentifier: loopEv, WFControlFlowMode: 2, UUID: uuid() });
  // リマインダー（終わっていないもの全部）
  add('filter.reminders', { UUID: ids.rem, WFContentItemFilter: notCompleted(), WFContentItemLimitEnabled: false });
  add('repeat.each', { GroupingIdentifier: loopRem, WFControlFlowMode: 0, WFInput: attachment(out(ids.rem, 'Reminders')) });
  add('dictionary', { UUID: ids.remDict, WFItems: dict([
    item('title', field('Title')), item('due', field('Due Date', true)), item('list', field('List')),
    item('prio', field('Priority')), item('flag', field('Is Flagged'))]) });
  add('appendvariable', { WFVariableName: 'リマインダー一覧', WFInput: attachment(out(ids.remDict, 'Dictionary')) });
  add('repeat.each', { GroupingIdentifier: loopRem, WFControlFlowMode: 2, UUID: uuid() });
  // 送る（合言葉と URL は、取りこむときに聞く）
  const qToken = add('gettext', { UUID: ids.token, WFTextActionText: '' });
  const qUrl = add('downloadurl', { UUID: ids.post, WFURL: '', WFHTTPMethod: 'POST', WFHTTPBodyType: 'JSON', ShowHeaders: false,
    WFJSONValues: dict([
      item('token', text(OBJ, [out(ids.token, 'Text')])),
      item('action', 'ios.sync'),
      item('events', text(OBJ, [named('予定')])),
      item('reminders', text(OBJ, [named('リマインダー一覧')]))]) });
  // 返事（「予定 120件…を同期しました」か、まちがいの名前）を通知に出す
  add('getvalueforkey', { UUID: ids.data, WFGetDictionaryValueType: 'Value', WFDictionaryKey: 'data', WFInput: attachment(out(ids.post, 'Contents of URL')) });
  add('getvalueforkey', { UUID: ids.msg, WFGetDictionaryValueType: 'Value', WFDictionaryKey: 'message', WFInput: attachment(out(ids.data, 'Dictionary Value')) });
  add('getvalueforkey', { UUID: ids.err, WFGetDictionaryValueType: 'Value', WFDictionaryKey: 'error', WFInput: attachment(out(ids.post, 'Contents of URL')) });
  add('notification', { WFNotificationActionTitle: name, WFNotificationActionSound: false,
    WFNotificationActionBody: text(OBJ + OBJ, [out(ids.msg, 'Dictionary Value'), out(ids.err, 'Dictionary Value')]) });

  return {
    WFWorkflowName: name,
    WFWorkflowClientVersion: '3036.0.4.2',
    WFWorkflowMinimumClientVersion: 900,
    WFWorkflowMinimumClientVersionString: '900',
    WFWorkflowIcon: { WFWorkflowIconStartColor: 463140863, WFWorkflowIconGlyphNumber: 59681 },
    WFWorkflowImportQuestions: [
      { ActionIndex: qUrl, Category: 'Parameter', DefaultValue: '', ParameterKey: 'WFURL',
        Text: 'ひびの手帳の「裏側の URL」（https://script.google.com/… /exec）を貼ってください。アプリの 設定 → iPhone 連携 →「つくり方を見る」で、押すとコピーできます。' },
      { ActionIndex: qToken, Category: 'Parameter', DefaultValue: '', ParameterKey: 'WFTextActionText',
        Text: 'ひびの手帳の「合言葉」（hb_ で始まる文字）を貼ってください。同じ画面で、押すとコピーできます。' }
    ],
    WFWorkflowTypes: [],
    WFWorkflowInputContentItemClasses: ['WFStringContentItem'],
    WFWorkflowOutputContentItemClasses: [],
    WFWorkflowHasShortcutInputVariables: false,
    WFWorkflowHasOutputFallback: false,
    WFQuickActionSurfaces: [],
    WFWorkflowActions: A
  };
}

const SHORTCUTS = [
  { name: 'ひびの手帳 同期', past: 2, next: 60 },
  { name: 'ひびの手帳 全部入れる', past: 365, next: 365 }
];

/* ───── plist（XML）に書く ───── */
function plist(v) {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const w = (x, ind) => {
    const pad = '\t'.repeat(ind);
    if (Array.isArray(x)) return x.length ? `${pad}<array>\n${x.map(y => w(y, ind + 1)).join('')}${pad}</array>\n` : `${pad}<array/>\n`;
    if (x && typeof x === 'object') {
      const ks = Object.keys(x);
      return ks.length ? `${pad}<dict>\n${ks.map(k => `${pad}\t<key>${esc(k)}</key>\n${w(x[k], ind + 1)}`).join('')}${pad}</dict>\n` : `${pad}<dict/>\n`;
    }
    if (typeof x === 'boolean') return `${pad}<${x}/>\n`;
    if (typeof x === 'number') return Number.isInteger(x) ? `${pad}<integer>${x}</integer>\n` : `${pad}<real>${x}</real>\n`;
    return `${pad}<string>${esc(x)}</string>\n`;
  };
  return '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n' + w(v, 0) + '</plist>\n';
}

function main() {
  const dry = process.argv.includes('--dry');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hibi-shortcuts-'));
  const made = SHORTCUTS.map(s => {
    const raw = path.join(dir, s.name + ' (未署名).shortcut');
    fs.writeFileSync(raw, plist(build(s.name, s.past, s.next)));
    return { s, raw, signed: path.join(dir, s.name + '.shortcut') };
  });
  if (dry) { console.log('作った（未署名）：\n' + made.map(m => '  ' + m.raw).join('\n')); return; }
  if (process.platform !== 'darwin') { console.error('署名は Mac でしかできません（--dry で、ファイルを作るだけはできます）'); process.exit(1); }
  for (const m of made) {
    const r = spawnSync('shortcuts', ['sign', '-m', 'people-who-know-me', '-i', m.raw, '-o', m.signed], { encoding: 'utf8' });
    if (r.status !== 0) { console.error(`「${m.s.name}」の署名ができませんでした：\n${r.stderr || r.error || ''}`); process.exit(1); }
  }
  console.log('ショートカットApp で開きます。それぞれ「裏側の URL」と「合言葉」を貼って、「ショートカットを追加」を押してください。');
  for (const m of made) spawnSync('open', [m.signed]);
  console.log(`\nできたファイル：${dir}\n` +
    'つぎに：iPhone のショートカットApp で「ひびの手帳 全部入れる」を1回動かす（数分かかります）。\n' +
    'そのあと「オートメーション」→「時刻」5:30・毎日 →「すぐに実行」→「ひびの手帳 同期」。');
}

if (require.main === module) main();
module.exports = { build, plist, SHORTCUTS };
