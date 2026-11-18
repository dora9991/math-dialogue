/* hibi/js/sample.js
   「おためし」で見せるサンプルのデータ（今日の日付に合わせてつくる）。保存はしない。
   中身はすべて架空のもの（ニュース・メールも本物ではない）。 */
(function (root) {
  'use strict';
  const HB = root.HB = root.HB || {};

  function paper(lines, tint) {
    const rows = lines.map((t, i) => `<text x="14" y="${30 + i * 18}" font-size="${i ? 10 : 12}" font-weight="${i ? 400 : 700}" fill="#333">${t}</text>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" fill="${tint}"/>` +
      `<rect x="8" y="10" width="164" height="162" rx="4" fill="#fff" stroke="#ddd"/>${rows}</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function build() {
    const t = HB.today(), d = n => HB.addDays(t, n);
    const now = new Date().toISOString();
    const settings = {
      categories: [
        { name: '学校・授業', hint: '' }, { name: '家族・子ども', hint: '' }, { name: '手続き・お金', hint: '' }, { name: '健康', hint: '' },
        { name: '創作・音楽', hint: '' }, { name: '研究・学び', hint: '' }, { name: 'コミュニティ', hint: '' }, { name: '暮らし・買い物', hint: '' }, { name: 'その他', hint: '' }
      ],
      rules: ['園のおたよりの締切は、いつもリマインダーに入れる'],
      briefing: { news: ['日本の今日の主なニュース'], ai: ['生成AIの新しい動き'], gmailQuery: 'in:inbox', maxNews: 5, maxAi: 5, maxGmail: 8 },
      shortcuts: { sync: 'ひびの手帳 同期', send: 'ひびの手帳へ送る', add: 'ひびの手帳から登録' }, appUrl: ''
    };
    const items = [
      { id: 'i_sample00001', fileId: 'f1', name: 'えんだより.jpg', mime: 'image/jpeg', kind: 'photo', title: 'いもほり遠足のおたより', summary: `${HB.labelShort(d(3))} いもほり遠足。持ち物：軍手・タオル・着替え。申込は ${HB.labelShort(d(1))} まで。`,
        text: '（サンプル）えんだより …', note: '', category: '家族・子ども', categorySource: 'claude', status: 'organized', dates: [d(1), d(3)], dateNotes: { [d(1)]: '申込の締切', [d(3)]: '遠足の日' },
        important: true, createdAt: now, _thumb: paper(['えんだより', 'いもほり遠足', '持ち物：軍手・タオル', '申込は締切までに'], '#fde9c9') },
      { id: 'i_sample00002', fileId: 'f2', name: '板書.jpg', mime: 'image/jpeg', kind: 'photo', title: '一次関数の板書', summary: '変化の割合の説明。生徒の発言を残した板書。', text: '', note: '',
        category: '学校・授業', categorySource: 'claude', status: 'organized', dates: [t], important: false, createdAt: now, _thumb: paper(['一次関数', 'y = ax + b', '変化の割合 = a'], '#d8e6f8') },
      { id: 'i_sample00003', fileId: 'f3', name: '写真_0915.jpg', mime: 'image/jpeg', kind: 'photo', title: '手書きのメモの写真', summary: '何かの手書きメモ。文字が薄くて読み切れなかった。', text: '', note: '',
        category: '', status: 'pending', suggestedCategory: '創作・音楽', dates: [], important: false, createdAt: now, _thumb: paper(['（手書き）', '♪ ド ミ ソ …', '……'], '#e4ddf3') },
      { id: 'i_sample00004', fileId: 'f4', name: '健診の案内.pdf', mime: 'application/pdf', kind: 'pdf', title: '健康診断の案内', summary: `${HB.labelShort(d(9))} 9:00〜 健康診断。前日21時以降は絶食。`, text: '', note: '',
        category: '健康', status: 'organized', dates: [d(8), d(9)], dateNotes: { [d(8)]: '前日：21時以降は絶食', [d(9)]: '健診の日' }, important: false, createdAt: now, _thumb: paper(['健康診断のご案内', '日時：9:00〜', '前日21時以降は絶食'], '#d9f0e3') }
    ];
    const memos = [
      { id: 'm_sample00001', text: '授業のアイデア\n「変化の割合」を、階段の傾きで体験させる。生徒に段差を測らせる。', important: true, dates: [], category: '学校・授業', categorySource: 'claude', tags: ['一次関数'], createdAt: now, updatedAt: now },
      { id: 'm_sample00002', text: '遠足の申込書を出す', important: true, dates: [d(1)], category: '家族・子ども', categorySource: 'claude', tags: [], createdAt: now, updatedAt: now },
      { id: 'm_sample00003', text: '牛乳・パン・軍手（遠足用）', important: false, dates: [t], category: '暮らし・買い物', categorySource: 'manual', tags: [], createdAt: now, updatedAt: now },
      { id: 'm_sample00004', text: '新しい曲：朝の光のイメージ。Cメジャー → Am', important: false, dates: [], category: '', categorySource: '', tags: [], createdAt: now, updatedAt: now }
    ];
    const proposals = [
      { id: 'p_sample00001', kind: 'category', question: '「手書きのメモの写真」はどの分類にしますか？', context: '文字が薄くて読み切れませんでした。音符のような記号があります。',
        target: { type: 'file', itemId: 'i_sample00003' }, options: ['創作・音楽', '学校・授業', '研究・学び', 'その他'].map(c => ({ label: c, patch: { category: c } })), rule: '' },
      { id: 'p_sample00002', kind: 'reminder', question: '遠足の申込書の提出を、リマインダーに入れますか？', context: `締切は ${HB.labelShort(d(1))}。おたよりから読みとりました。`,
        target: { type: 'file', itemId: 'i_sample00001' }, options: [{ label: `入れる（${HB.labelShort(d(1))} 7:00）`, ios: { type: 'reminder', title: '遠足の申込書を出す', due: d(1) + ' 07:00' } }, { label: '入れない', patch: {} }],
        rule: '園のおたよりの締切は、いつもリマインダーに入れる' },
      { id: 'p_sample00003', kind: 'reply', question: '面談の日程のメールに、返信の予定を入れますか？', context: '「候補日を金曜までに」と書いてあります。',
        target: { type: 'mail', threadId: 'x', url: '', subject: '面談の日程について' }, options: [{ label: 'あしたの朝に返信する', ios: { type: 'reminder', title: '面談の日程に返信', due: d(1) + ' 08:00' } }, { label: 'いらない', patch: {} }] }
    ];
    const briefings = {
      [t]: {
        runAt: now,
        summary: '（サンプル）今日は 15:30 から職員会議。あしたは遠足の申込書の締切です。メールで返信が必要なものが1件あります。',
        gmail: [
          { subject: '（サンプル）面談の日程について', from: '学年主任', summary: '候補日を金曜までに知らせてほしい、とのこと。', action: '返信', due: d(2), url: '' },
          { subject: '（サンプル）研修の資料', from: '教育センター', summary: '来週の研修の資料が届いています。目を通すだけでよさそう。', action: '参考', due: '', url: '' }
        ],
        ai: [
          { title: '（サンプル）ここに AI の新しい動きが入ります', summary: '毎朝、Claude が調べて 3〜5 件にまとめます。', source: 'サンプル', url: '' },
          { title: '（サンプル）教育での AI の使い方', summary: '授業や校務に使えそうな話題を選びます。', source: 'サンプル', url: '' }
        ],
        news: [
          { title: '（サンプル）ここに今日の主なニュースが入ります', summary: '日本の主なニュース・教育のニュース・佐賀のニュースから選びます。', source: 'サンプル', url: '' }
        ]
      }
    };
    const ios = {
      syncedAt: now,
      events: [
        { title: '朝の会議', d0: t, d1: t, t0: '08:15', t1: '08:35', allDay: false, cal: '仕事', loc: '' },
        { title: '職員会議', d0: t, d1: t, t0: '15:30', t1: '17:00', allDay: false, cal: '仕事', loc: '会議室' },
        { title: 'いもほり遠足', d0: d(3), d1: d(3), t0: '', t1: '', allDay: true, cal: '家族', loc: '' },
        { title: '健康診断', d0: d(9), d1: d(9), t0: '09:00', t1: '11:00', allDay: false, cal: '仕事', loc: '' },
        { title: '授業研究会', d0: d(-2), d1: d(-2), t0: '14:00', t1: '16:00', allDay: false, cal: '仕事', loc: '' },
        { title: '学年会', d0: d(1), d1: d(1), t0: '15:40', t1: '16:30', allDay: false, cal: '仕事', loc: '' },
        { title: '部活', d0: d(2), d1: d(2), t0: '16:00', t1: '18:00', allDay: false, cal: '部活', loc: '' },
        { title: '修学旅行', d0: d(5), d1: d(7), t0: '', t1: '', allDay: true, cal: '学校行事', loc: '' },
        { title: '家族で買い物', d0: d(6), d1: d(6), t0: '10:00', t1: '12:00', allDay: false, cal: '家族', loc: '' },
        { title: '保育園の参観', d0: d(12), d1: d(12), t0: '09:30', t1: '11:00', allDay: false, cal: '家族', loc: '' },
        { title: '文化祭の準備', d0: d(14), d1: d(15), t0: '', t1: '', allDay: true, cal: '学校行事', loc: '' },
        { title: '練習試合', d0: d(16), d1: d(16), t0: '09:00', t1: '15:00', allDay: false, cal: '部活', loc: '' }
      ],
      reminders: [
        { title: '図書館の本を返す', due: d(-1), dueTime: '', list: 'リマインダー', prio: 0, flag: false },
        { title: '教材の印刷', due: t, dueTime: '07:30', list: '仕事', prio: 2, flag: true },
        { title: '遠足の申込書を出す', due: d(1), dueTime: '07:00', list: '家族', prio: 3, flag: false },
        { title: '牛乳を買う', due: d(4), dueTime: '', list: '家庭', prio: 0, flag: false }
      ]
    };
    return { rev: 0, today: t, demo: true, settings, memos, items, proposals, briefings, ios,
      lastRun: { at: now, files: 3, memos: 2, proposals: 3 }, exportedAt: now, outboxErrors: [], folders: {} };
  }

  HB.sample = { build };
})(typeof globalThis !== 'undefined' ? globalThis : this);
