/* アーカイブ配信（YouTube）の一覧。ここを書き換えるだけで、ページの「アーカイブ配信」に反映される。
 *
 *   id          … YouTube の動画ID。https://www.youtube.com/watch?v=XXXXXXXXXXX の XXXXXXXXXXX（11文字）
 *   title       … 動画のタイトル（分科会名・講演名など）
 *   group       … 絞り込みの見出し（「1日目」「記念講演」など。同じ文字のものがまとまり、ボタンは出てくる順。空でもよい）
 *   speaker     … 登壇者（空でもよい）
 *   playlistId  … 再生リストID（あれば「再生リストで通して見る」ボタンが出る）
 *   channelUrl  … チャンネルのURL（あればリンクが出る）
 *
 * videos が空のあいだは「現在公開中のアーカイブはありません」と表示される。
 * 公開する前に、登壇者・発表者の了承と、映像に映る方の同意を主催者側で確認すること。
 */
window.ARCHIVE = {
  channelUrl: "",
  playlistId: "",
  videos: [
    // { id: "XXXXXXXXXXX", title: "記念講演", group: "2日目", speaker: "登壇者名" },
  ]
};
