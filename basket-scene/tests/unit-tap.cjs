// ① 記録の、画面を持たない部分（js/sc-tap.js の SC.tap.logic）
//   node tests/unit-tap.cjs
const path = require('path');
const T = require('./helpers.cjs');
require(path.join(T.ROOT, 'js/lib/core.js'));
require(path.join(T.ROOT, 'js/sc-tap.js'));
const L = globalThis.SC.tap.logic;
const ALL = { miss: true, reb: true, rebSplit: true, ast: true, stl: true, blk: true, tov: true, foul: true, mark: true };
const OFF = { miss: false, reb: false, rebSplit: false, ast: false, stl: false, blk: false, tov: false, foul: false, mark: false };

T.section('ボタンの並び（plays）');
T.eq(L.plays(ALL), ['fg2', 'fg2x', 'fg3', 'fg3x', 'ft', 'ftx', 'oreb', 'dreb', 'ast', 'stl', 'blk', 'tov', 'foul'], '全部オン：13こ（この順）');
T.eq(L.plays(OFF), ['fg2', 'fg3', 'ft'], '全部オフ：2P 3P FT');
T.eq(L.plays(Object.assign({}, ALL, { rebSplit: false })), ['fg2', 'fg2x', 'fg3', 'fg3x', 'ft', 'ftx', 'reb', 'ast', 'stl', 'blk', 'tov', 'foul'], '分けない：リバ 1つ');
T.eq(L.plays(Object.assign({}, OFF, { rebSplit: true })), ['fg2', 'fg3', 'ft'], 'リバウンドがオフなら、分けるかは関係なし');
T.eq(L.plays(undefined), L.plays(ALL), '設定がないときは、全部オン');
T.ok(L.plays(ALL).every((t) => globalThis.BT.TYPE[t]), 'どれも BT.TYPES にある種類');

T.section('背番号の列（numCols）');
T.eq(L.numCols(13, 374, 40, 6), 7, '13こ・374px → 7列（7＋6）');
T.eq(L.numCols(16, 374, 40, 6), 8, '16こ・374px → 8列（8＋8）');
T.eq(L.numCols(1, 374, 40, 6), 1, '1こ（チーム）→ 1列');
T.eq(L.numCols(13, 304, 40, 4), 7, '13こ・304px → 7列');
T.eq(L.numCols(16, 300, 40, 6), 6, '16こ・300px → 6列（6＋6＋4）');
T.eq(L.numCols(0, 300, 40, 6), 1, '0こでも 1');

T.section('選び方（step）');
let r = L.step(null, { type: 'fg2' }, 10);
T.eq(r, { pick: { type: 'fg2', has: 'type', t: 10 }, rec: null, cancel: false }, 'プレーを先に：選びかけ（時刻はこのとき）');
T.eq(L.step(r.pick, { no: '7' }, 13).rec, { type: 'fg2', no: '7', t: 10 }, '→ 背番号で記録（時刻は、はじめに押したとき）');
r = L.step(null, { no: '5' }, 20);
T.eq(L.step(r.pick, { type: 'ast' }, 22).rec, { type: 'ast', no: '5', t: 20 }, '背番号を先に → プレーで記録');
T.eq(L.step(L.step(null, { no: null }, 3).pick, { type: 'ft' }, 4).rec, { type: 'ft', no: null, t: 3 }, '「？」（no: null）');
T.eq(L.step({ type: 'fg3', has: 'type', t: 1 }, { type: 'fg3' }, 2), { pick: null, rec: null, cancel: true }, '同じプレーをもう一度 → やめる');
T.eq(L.step({ no: null, has: 'no', t: 1 }, { no: null }, 2), { pick: null, rec: null, cancel: true }, '同じ番号（？）をもう一度 → やめる');
T.eq(L.step({ type: 'fg3', has: 'type', t: 1 }, { type: 'fg2' }, 2).pick, { type: 'fg2', has: 'type', t: 1 }, '別のプレー → 選び直し（時刻はそのまま）');
T.eq(L.step({ no: '4', has: 'no', t: 1 }, { no: '8' }, 2).pick, { no: '8', has: 'no', t: 1 }, '別の番号 → 選び直し');
T.eq(L.OPP, { 1: 'ft', 2: 'fg2', 3: 'fg3' }, '相手：+1 ft・+2 fg2・+3 fg3');
T.eq(L.KEEP, 20, '選びかけは 20 秒まで');
T.done();
