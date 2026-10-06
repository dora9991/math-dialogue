'use strict';
/* ============================================================
   net.js — 部屋コードでつなぐ（PeerJS = WebRTCのP2P）。
   ・ホストが4文字のコードを作り、ゲストがそれを入れるとつながる
   ・つながったあとは、ふたりのブラウザが直接やりとりする（入力だけを送る）
   ・コードの受け渡しにだけ、PeerJSの無料の仲介サーバーを使う
   ============================================================ */
const NET_PREFIX = 'kmbt1-';
const NET_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // 見まちがえやすい I O 0 1 は使わない
const NET_PROTOCOL = 1;

const Net = {
  peer: null, conn: null, role: null, code: '', status: 'idle', rtt: 0, session: null,
  early: [], pending: [], listener: null, cb: null, lastRecv: 0, timers: [],

  /* テストや将来の自前サーバー用に、?peerhost=... などで仲介サーバーを差し替えられる */
  opts() {
    const q = new URLSearchParams(location.search), base = window.MECHA_NET || {};
    const host = q.get('peerhost') || base.host;
    const o = { debug: 0 };
    if (host) {
      o.host = host; o.port = +(q.get('peerport') || base.port || 9000); o.path = q.get('peerpath') || base.path || '/';
      o.secure = (q.get('peersecure') || (base.secure ? '1' : '0')) === '1';
    }
    if ((q.get('ice') || '') === 'none') o.config = { iceServers: [] };
    return o;
  },
  makeCode() { let s = ''; for (let i = 0; i < 4; i++) s += NET_CHARS[(Math.random() * NET_CHARS.length) | 0]; return s; },
  validCode(c) { return /^[A-HJ-NP-Z2-9]{4}$/.test(c); },
  inviteLink(code) { return location.href.split('#')[0] + '#' + code; },

  reset() {
    this.timers.forEach(clearTimeout); this.timers = [];
    try { if (this.conn) this.conn.close(); } catch (e) { /* 無視 */ }
    try { if (this.peer) this.peer.destroy(); } catch (e) { /* 無視 */ }
    this.peer = null; this.conn = null; this.role = null; this.code = ''; this.status = 'idle'; this.rtt = 0;
    this.session = null; this.early = []; this.pending = []; this.cb = null;
    if (this.pingT) { clearInterval(this.pingT); this.pingT = null; }
  },
  close() { const l = this.listener; this.reset(); this.listener = l; },

  errText(e) {
    const t = e && e.type ? e.type : e;
    switch (t) {
      case 'peer-unavailable': return 'そのコードの へやが みつかりません';
      case 'unavailable-id': return 'コードが つかえませんでした。もういちど';
      case 'network': case 'socket-error': case 'socket-closed': case 'server-error': return 'サーバーに つながりません（ネットを かくにん）';
      case 'webrtc': return 'つうしんの じゅんびに しっぱいしました';
      case 'timeout': return 'じかんぎれ（つうしんが ブロックされているかも）';
      case 'nopeer': return 'このページでは オンラインが つかえません';
      case 'version': return 'あいてと バージョンが ちがいます';
      default: return 'つながりませんでした' + (e && e.message ? '（' + String(e.message).slice(0, 24) + '）' : '');
    }
  },
  fail(e) {
    const cb = this.cb;
    this.status = 'error';
    try { if (this.peer) this.peer.destroy(); } catch (x) { /* 無視 */ }
    if (cb && cb.onError) cb.onError(this.errText(e));
  },

  /* ホスト：コードを作って待つ */
  host(cb) {
    this.reset(); this.cb = cb; this.role = 'host'; this.status = 'opening';
    if (typeof Peer === 'undefined') { this.fail('nopeer'); return; }
    const open = (n) => {
      const code = this.makeCode();
      let peer;
      try { peer = this.peer = new Peer(NET_PREFIX + code, this.opts()); } catch (e) { this.fail(e); return; }
      peer.on('open', () => { this.code = code; this.status = 'waiting'; if (cb.onCode) cb.onCode(code); });
      peer.on('connection', (conn) => { if (this.conn) { try { conn.close(); } catch (e) { /* 無視 */ } return; } this.attach(conn); });
      peer.on('error', (e) => {
        if (e && e.type === 'unavailable-id' && n < 6) { try { peer.destroy(); } catch (x) { /* 無視 */ } open(n + 1); return; }
        this.fail(e);
      });
    };
    open(0);
    this.timers.push(setTimeout(() => { if (this.status === 'opening') this.fail('timeout'); }, 12000));
  },

  /* ゲスト：コードの部屋に入る */
  join(code, cb) {
    this.reset(); this.cb = cb; this.role = 'guest'; this.status = 'connecting'; this.code = code;
    if (typeof Peer === 'undefined') { this.fail('nopeer'); return; }
    let peer;
    try { peer = this.peer = new Peer(this.opts()); } catch (e) { this.fail(e); return; }
    peer.on('open', () => {
      const conn = peer.connect(NET_PREFIX + code, { reliable: true, serialization: 'json' });
      this.attach(conn);
    });
    peer.on('error', (e) => this.fail(e));
    this.timers.push(setTimeout(() => { if (this.status !== 'connected') this.fail('timeout'); }, 20000));
  },

  attach(conn) {
    this.conn = conn;
    conn.on('open', () => {
      this.status = 'connected'; this.lastRecv = performance.now();
      this.send({ t: 'hello', v: NET_PROTOCOL });
      this.pingT = setInterval(() => this.send({ t: 'ping', ts: performance.now() }), 1000);
      if (this.cb && this.cb.onConnect) this.cb.onConnect();
    });
    conn.on('data', (d) => this.onData(d));
    conn.on('close', () => this.lost());
    conn.on('error', () => this.lost());
  },
  send(o) { try { if (this.conn && this.conn.open) this.conn.send(o); } catch (e) { /* 送れなかった */ } },

  onData(d) {
    if (!d || typeof d !== 'object') return;
    this.lastRecv = performance.now();
    switch (d.t) {
      case 'in':
        if (this.session) { if (d.s === this.session.seed) this.session.receive(d); }
        else { this.early.push(d); if (this.early.length > 400) this.early.shift(); }
        return;
      case 'sum': if (this.session && d.s === this.session.seed) this.session.receiveSum(d.f, d.h); return;
      case 'ping': this.send({ t: 'pong', ts: d.ts }); return;
      case 'pong': { const r = performance.now() - d.ts; this.rtt = this.rtt ? this.rtt * 0.7 + r * 0.3 : r; return; }
      default: break;
    }
    if (this.listener) this.listener(d); else this.pending.push(d);
  },
  setListener(fn) { this.listener = fn; if (fn) { const p = this.pending; this.pending = []; p.forEach((m) => fn(m)); } },

  lost() {
    if (this.status === 'lost' || this.status === 'idle') return;
    this.status = 'lost';
    if (this.pingT) { clearInterval(this.pingT); this.pingT = null; }
    if (this.listener) this.listener({ t: '_lost' });
  },
  /* 毎tick：しばらく何も届かなければ切断とみなす */
  watchdog() { if (this.status === 'connected' && performance.now() - this.lastRecv > 6000) this.lost(); },

  /* 試合をはじめる（ホスト・ゲスト共通。cfg は同じ内容） */
  begin(cfg, me) {
    this.session = new RollbackSession(cfg, me, { delay: 2, maxPred: 10 });
    const e = this.early; this.early = [];
    e.forEach((p) => { if (p.s === cfg.seed) this.session.receive(p); });
    return this.session;
  },
  /* 1tickぶんの通信（自分の入力と、ハッシュ） */
  pump() {
    const s = this.session; if (!s) return;
    this.send(s.packet());
    for (const x of s.takeSums()) this.send(x);
  },
};
