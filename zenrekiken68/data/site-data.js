/* 全歴研 第68回 佐賀大会 サイトの中身（ここだけ書き換えれば画面に反映される）
 *
 * - 【要入力】で始まる文字は、画面で黄色くマークされる。確定した情報に差し替えると消える。
 * - 公開前チェック：draft を false に／【要入力】が画面に残っていないか／README の「公開前チェック」参照
 * - リンク（url）は https:// から始まる完全なURLを入れる。空のままなら「準備中」表示になる。
 */
window.SITE = {
  draft: true, // true の間は画面上部に「試作版」の帯を出す。公開するときに false に

  name: "全歴研 第68回 佐賀大会",
  org: "全歴研",
  orgFull: "【要入力】全歴研の正式名称",
  theme: "【要入力】大会テーマ",
  dates: "【要入力】20XX年X月X日（X）〜X日（X）",
  venue: "【要入力】会場名",

  // お知らせ（新しい順）
  news: [
    { date: "【要入力】", title: "【要入力】お知らせのタイトル", body: "【要入力】本文（1〜2文）。リンクを付けるときは url に入れる。", url: "" }
  ],

  // 開催概要（左：項目、右：内容）。項目は増減してよい
  overview: [
    { k: "大会名", v: "全歴研 第68回 佐賀大会" },
    { k: "主催", v: "【要入力】" },
    { k: "共催・後援", v: "【要入力】" },
    { k: "日程", v: "【要入力】" },
    { k: "会場", v: "【要入力】" },
    { k: "対象", v: "【要入力】" },
    { k: "参加費", v: "【要入力】" }
  ],

  // プログラム：日ごとに items を並べる
  program: [
    {
      label: "1日目", date: "【要入力】X月X日（X）",
      items: [
        { time: "【要入力】", title: "【要入力】プログラム項目", place: "【要入力】", speaker: "" },
        { time: "【要入力】", title: "【要入力】プログラム項目", place: "【要入力】", speaker: "" }
      ]
    },
    {
      label: "2日目", date: "【要入力】X月X日（X）",
      items: [
        { time: "【要入力】", title: "【要入力】プログラム項目", place: "【要入力】", speaker: "" },
        { time: "【要入力】", title: "【要入力】プログラム項目", place: "【要入力】", speaker: "" }
      ]
    }
  ],

  // アーカイブ（YouTube）
  //   id … YouTube の動画ID（https://www.youtube.com/watch?v=XXXXXXXXXXX の XXXXXXXXXXX・11文字）。空なら「公開準備中」
  //   playlistId … 再生リストID（あれば「再生リストで通して見る」ボタンが出る）
  //   channelUrl … チャンネルのURL（あればリンクが出る）
  archive: {
    note: "【要入力】アーカイブ公開の案内（公開期間・視聴条件など）",
    channelUrl: "",
    playlistId: "",
    videos: [
      { id: "", title: "【要入力】セッション名", day: "1日目", speaker: "【要入力】" },
      { id: "", title: "【要入力】セッション名", day: "1日目", speaker: "【要入力】" },
      { id: "", title: "【要入力】セッション名", day: "2日目", speaker: "【要入力】" }
    ]
  },

  access: {
    venue: "【要入力】会場名",
    address: "【要入力】〒000-0000 佐賀県…",
    directions: [
      "【要入力】最寄り駅・バス停からの行き方",
      "【要入力】駐車場の案内"
    ],
    mapUrl: "",   // Google マップの共有URL
    mapEmbed: ""  // Google マップの「埋め込み」URL（https://www.google.com/maps/embed?... で始まるもの）
  },

  apply: {
    deadline: "【要入力】申込締切",
    fee: "【要入力】参加費・支払い方法",
    note: "【要入力】申込についての注意（定員、キャンセルなど）",
    formUrl: ""   // 申込フォームのURL
  },

  contact: {
    office: "【要入力】大会事務局",
    email: "",
    tel: "",
    note: "【要入力】受付時間など"
  }
};
