// ============================================================
// dialogs.js — 画面の中で出す「確認」と「コピーして保存」
//
//  ・confirm() の代わり：埋め込み表示（iframe など）では confirm()/alert() が何も出さずに閉じてしまい、
//    「削除」「読み込み」「すべて消す」が黙って効かなくなる。画面の中の <dialog> で確認する
//  ・saveText()：ファイルとして保存する。ダウンロードが禁止された枠の中（globalThis.TSUMAZUKI_SANDBOX）では、
//    保存のかわりに「コピーして貼りつける」ダイアログを出す（1 枚版を Artifact 形式で作るときに立てる旗）
// ============================================================
import { h, button, download, copyText } from "./dom.js";

let seq = 0;

function openModal(dlg) {
  document.body.append(dlg);
  if (dlg.showModal) dlg.showModal();
  else dlg.setAttribute("open", "");
}

/**
 * はい／いいえの確認。押した結果を Promise(true|false) で返す（Esc・背景クリックは false）。
 * danger: 元にもどせない操作。初期フォーカスを「やめる」側に置き、ボタンを赤にする
 */
export function confirmDialog(message, { title = "確認", okLabel = "OK", cancelLabel = "やめる", danger = false } = {}) {
  return new Promise((resolve) => {
    const id = `dlg-confirm-${++seq}`;
    const dlg = h("dialog", { class: "dlg dlg-narrow", "aria-labelledby": id });
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      dlg.close?.();
      dlg.remove();
      resolve(value);
    };
    const cancel = button(cancelLabel, () => finish(false), "btn ghost");
    const ok = h("button", { type: "submit", class: `btn ${danger ? "danger" : "primary"}` }, okLabel);
    dlg.append(
      h(
        "form",
        { onsubmit: (e) => (e.preventDefault(), finish(true)) },
        h("h2", { id }, title),
        String(message)
          .split("\n")
          .map((line) => h("p", null, line)),
        h("div", { class: "actions" }, cancel, ok),
      ),
    );
    dlg.addEventListener("cancel", (e) => (e.preventDefault(), finish(false)));
    dlg.addEventListener("click", (e) => e.target === dlg && finish(false)); // 背景（::backdrop）のクリック
    openModal(dlg);
    (danger ? cancel : ok).focus();
  });
}

/** 長い文字列をそのまま見せて、コピーできるようにする（ファイルに保存できないときの代わり） */
export function textDialog({ title, note, text }) {
  const id = `dlg-text-${++seq}`;
  const ta = h("textarea", { class: "in-text mono", rows: "10", readonly: true, "aria-label": title });
  ta.value = text;
  const dlg = h("dialog", { class: "dlg", "aria-labelledby": id });
  const close = () => {
    dlg.close?.();
    dlg.remove();
  };
  const copy = h("button", { type: "button", class: "btn primary" }, "コピー");
  copy.addEventListener("click", async () => {
    const ok = await copyText(text);
    if (!ok) {
      ta.focus();
      ta.select(); // コピーできない環境では、選択状態にして長押し・Ctrl+C にまかせる
    }
    copy.textContent = ok ? "コピーしました" : "選択しました。長押し（Ctrl+C）でコピーしてください";
    setTimeout(() => (copy.textContent = "コピー"), 2600);
  });
  dlg.append(h("h2", { id }, title), h("p", { class: "muted small" }, note), ta, h("div", { class: "actions" }, copy, button("閉じる", close, "btn ghost")));
  dlg.addEventListener("cancel", () => dlg.remove());
  openModal(dlg);
  ta.select();
}

/** ファイルとして保存する。保存が禁止された枠の中では、コピー用のダイアログに切りかえる */
export function saveText(filename, text, type = "application/json") {
  if (globalThis.TSUMAZUKI_SANDBOX) {
    textDialog({
      title: filename,
      note: "この画面からはファイルを直接保存できません。「コピー」を押して、メモアプリなどに貼りつけて保存してください（あとで「貼りつけて読み込む」から戻せます）。",
      text: text.replace(/^﻿/, ""),
    });
  } else {
    download(filename, text, type);
  }
}
