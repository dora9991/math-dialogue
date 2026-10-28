/* 保存先2つ（ローカル／Supabase）の検査。Supabase は偽のサーバー（fake-supabase.js）に対して行う。
   使い方：node conference-editor/test/store.js */
"use strict";
const S = require("../js/schema.js");
const Local = require("../js/store-local.js");
const Sb = require("../js/store-supabase.js");
const { createFake, ANON } = require("./fake-supabase.js");
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log("✗", m); } else if (process.env.VERBOSE) console.log("✓", m); };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m + "  期待 " + JSON.stringify(b) + " 実際 " + JSON.stringify(a));
const memStorage = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m }; };
async function code(p) { try { await p; return "ok"; } catch (e) { return e.code || "?"; } }

(async () => {
  // ================= ローカル =================
  {
    const st = new Local({ storage: memStorage() });
    ok((await st.init()).needsLogin === false, "ローカル：ログイン不要");
    let all = await st.loadAll();
    eq(S.KEYS.map((k) => all[k].version), [1, 1, 1], "ローカル：初期状態は version 1");
    const r = await st.saveDraft("news", [{ date: "2027-01-01", text: "A", url: "javascript:x" }, { text: "" }], 1);
    eq(r.version, 2, "ローカル：保存すると version が上がる");
    all = await st.loadAll();
    eq(all.news.draft.length, 2, "ローカル：下書きは空の行も残す");
    eq(all.news.draft[0].url, "", "ローカル：不正なURLは保存時に空になる");
    eq(await code(st.saveDraft("news", [], 1)), "conflict", "ローカル：古い version での保存は衝突");
    eq(all.news.published_at, null, "ローカル：公開前は published_at が null");
    const p = await st.publish("news");
    ok(!!p.published_at && p.version === 3, "ローカル：公開すると published_at と version が入る");
    all = await st.loadAll();
    eq(all.news.published.length, 1, "ローカル：公開用は空の行を除く");
    eq(await code(st.saveDraft("nothing", [], 1)), "invalid", "ローカル：不明な key は拒否");
    // 別の store から見ても同じ中身（保存されている）
  }

  // ================= Supabase =================
  const cfg = { SUPABASE_URL: "https://fake.supabase.test", SUPABASE_ANON_KEY: ANON };
  function make(fake, extra) {
    const storage = (extra && extra.storage) || memStorage();
    const loc = (extra && extra.location) || { origin: "https://site.example", pathname: "/editor/", search: "", hash: "" };
    const calls = [];
    const hist = { replaceState: (...a) => calls.push(a) };
    return { st: new Sb(cfg, { fetch: fake.fetch, storage, location: loc, history: hist }), storage, loc, hist: calls };
  }

  {
    const fake = createFake();
    const { st, storage } = make(fake);
    const init = await st.init();
    ok(init.needsLogin && init.user === null, "Supabase：最初はログインが必要");

    eq(await code(st.requestLogin("nobody@example.com")), "other", "Supabase：招待されていないメールは送れない");
    ok((await st.requestLogin("Editor@Example.com ")) === undefined, "Supabase：招待済みのメールには送れる（大文字・空白は整える）");
    ok(fake.state.log.some((l) => l === "POST /auth/v1/otp"), "Supabase：otp を呼んだ");

    eq(await code(st.verifyCode("editor@example.com", "000000")), "auth", "Supabase：コードが違えば auth エラー");
    const v = await st.verifyCode("editor@example.com", "123 456");
    eq(v.user, "editor@example.com", "Supabase：コード（途中の空白は無視）でログインできる");
    ok(!!storage.getItem("conferenceEditor.session"), "Supabase：ログイン情報を保存する");

    // 再読み込み相当
    const again = make(fake, { storage });
    const init2 = await again.st.init();
    eq(init2.user, "editor@example.com", "Supabase：再読み込みしてもログインが残る");

    const all = await st.loadAll();
    eq(S.KEYS.every((k) => all[k] && all[k].version === 1), true, "Supabase：3つの項目を読める");

    const s1 = await st.saveDraft("news", [{ date: "2027-01-01", text: "A", url: "javascript:x" }, { text: "" }], 1);
    eq(s1.version, 2, "Supabase：保存すると version が上がる");
    eq(fake.state.rows.news.draft.length, 2, "Supabase：空の行も下書きには残る");
    eq(fake.state.rows.news.draft[0].url, "", "Supabase：不正なURLは送る前に空になる");
    eq(await code(st.saveDraft("news", [], 1)), "conflict", "Supabase：古い version での保存は衝突");
    ok(fake.state.log.some((l) => l === "PATCH /rest/v1/conf_content"), "Supabase：PATCH で保存している");

    const pub = await st.publish("news");
    ok(!!pub.published_at && pub.version === 3, "Supabase：公開すると published_at が入る");
    eq(fake.state.rows.news.published.length, 2, "Supabase：公開は下書きのコピー（サーバー側）");

    await st.signOut();
    ok(storage.getItem("conferenceEditor.session") === null, "Supabase：ログアウトで保存したログイン情報が消える");
    eq(await code(st.loadAll()), "auth", "Supabase：ログアウト後は読めない");
  }

  { // 編集者として登録されていない人
    const fake = createFake();
    const { st } = make(fake);
    await st.init();
    await st.verifyCode("stranger@example.com", "123456");
    eq(await code(st.loadAll()), "forbidden", "Supabase：編集者でない人は読み込めない（forbidden）");
    eq(await code(st.publish("news")), "forbidden", "Supabase：編集者でない人は公開できない");
  }

  { // 期限が近いトークンは、リクエストの前に更新する
    const fake = createFake({ ttl: 30 });
    const { st } = make(fake);
    await st.init();
    await st.verifyCode("editor@example.com", "123456");
    await st.loadAll();
    ok(fake.state.log.some((l) => l === "POST /auth/v1/token"), "Supabase：期限が近ければトークンを更新する");
  }
  { // 更新に失敗したら、ログインし直しを求める
    const fake = createFake({ ttl: 30 });
    const { st, storage } = make(fake);
    await st.init();
    await st.verifyCode("editor@example.com", "123456");
    fake.state.refresh.clear();
    eq(await code(st.loadAll()), "auth", "Supabase：更新できなければ auth エラー");
    ok(storage.getItem("conferenceEditor.session") === null, "Supabase：更新できなければログイン情報を消す");
  }

  { // メールのリンクから戻ってきたとき
    const fake = createFake();
    const loc = { origin: "https://site.example", pathname: "/editor/", search: "", hash: "#access_token=" + fake.session("editor@example.com").access_token + "&refresh_token=r1&expires_in=3600&type=magiclink" };
    const m = make(fake, { location: loc });
    const init = await m.st.init();
    eq(init.user, "editor@example.com", "Supabase：リンクのトークンでログインできる");
    ok(m.hist.length === 1 && m.hist[0][2] === "/editor/", "Supabase：URL からトークンを消す");
    const bad = make(fake, { location: { origin: "https://site.example", pathname: "/editor/", search: "", hash: "#error=access_denied&error_code=otp_expired" } });
    const i2 = await bad.st.init();
    ok(i2.needsLogin && /リンク/.test(i2.error || ""), "Supabase：期限切れのリンクは説明を出す");
  }

  { // 通信できないとき
    const fake = createFake();
    const { st } = make(fake);
    const down = new Sb(cfg, { fetch: () => Promise.reject(new Error("offline")), storage: memStorage(), location: { origin: "https://x", pathname: "/", search: "", hash: "" } });
    eq(await code(down.requestLogin("editor@example.com")), "network", "Supabase：通信できなければ network エラー");
  }

  console.log(bad ? "\n失敗 " + bad + " 件" : "store: すべて通過");
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error("検査が異常終了:", e); process.exit(2); });
