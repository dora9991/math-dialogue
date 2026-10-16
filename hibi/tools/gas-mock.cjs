/* hibi/tools/gas-mock.cjs
   Google Apps Script の「にせもの」。Code.gs を Node の中で動かして確かめるために使う（本物の Google には一切つながない）。
   ・ドライブ（フォルダ・ファイル・ゴミ箱・サムネイル）、Google ドキュメント、スクリプトのプロパティ、ロック、トリガー、
     ContentService、Utilities（base64・日付の書式・UUID）を、必要なぶんだけメモリの上で再現する。
   ・使い方：const env = createGasEnv(); env.call('setup'); env.post('ping', {...})
   本物とのちがい：権限・割り当て（回数の上限）・ドライブの検索の細かい仕様・ネットワークの遅さは再現しない。 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const GOOGLE_DOCS = 'application/vnd.google-apps.document';
const FOLDER = 'application/vnd.google-apps.folder';

function iterator(list) {
  let i = 0;
  return { hasNext: () => i < list.length, next: () => { if (i >= list.length) throw new Error('no more'); return list[i++]; } };
}

function toSigned(buf) { return Array.from(buf, b => (b > 127 ? b - 256 : b)); }
function toBuffer(bytes) {
  if (Buffer.isBuffer(bytes)) return bytes;
  if (typeof bytes === 'string') return Buffer.from(bytes, 'utf8');
  return Buffer.from(Array.from(bytes, b => b & 0xff));
}

/** Java の SimpleDateFormat の、使うぶんだけ（yyyy MM dd HH mm ss XXX と '…' の文字そのまま） */
function formatDate(date, tz, pattern) {
  const offsetMin = /^(UTC|GMT|Etc\/UTC)$/i.test(tz) ? 0 : 9 * 60; // テストでは Asia/Tokyo と UTC だけ使う
  const d = new Date(date.getTime() + offsetMin * 60000);
  const p2 = n => String(n).padStart(2, '0');
  const tokens = { yyyy: String(d.getUTCFullYear()), MM: p2(d.getUTCMonth() + 1), dd: p2(d.getUTCDate()), HH: p2(d.getUTCHours()), mm: p2(d.getUTCMinutes()), ss: p2(d.getUTCSeconds()),
    XXX: offsetMin === 0 ? 'Z' : '+' + p2(Math.floor(offsetMin / 60)) + ':' + p2(offsetMin % 60) };
  let out = '';
  for (let i = 0; i < pattern.length;) {
    if (pattern[i] === "'") { const j = pattern.indexOf("'", i + 1); out += pattern.slice(i + 1, j); i = j + 1; continue; }
    const t = ['yyyy', 'XXX', 'MM', 'dd', 'HH', 'mm', 'ss'].find(k => pattern.startsWith(k, i));
    if (t) { out += tokens[t]; i += t.length; } else { out += pattern[i]; i++; }
  }
  return out;
}

function createGasEnv(opts = {}) {
  let seq = 0;
  const nodes = new Map(); // id → { id, name, mimeType, parents:[id], trashed, content:Buffer, created, thumbnail:Buffer|null, isFolder }
  const newId = () => 'id' + (++seq).toString(36).padStart(5, '0') + crypto.randomBytes(3).toString('hex');
  const props = new Map();
  const triggers = [];
  const logs = [];
  const fetchHandlers = opts.fetch || [];
  nodes.set('root', { id: 'root', name: 'マイドライブ', mimeType: FOLDER, parents: [], trashed: false, isFolder: true, created: new Date() });

  function children(id) { return [...nodes.values()].filter(n => n.parents.includes(id)); }

  function makeBlob(bytes, contentType, name) {
    let buf = toBuffer(bytes == null ? '' : bytes);
    let type = contentType || 'application/octet-stream';
    let nm = name || '';
    const blob = {
      getBytes: () => toSigned(buf), getContentType: () => type, getName: () => nm,
      setName: n => { nm = n; return blob; }, setContentType: t => { type = t; return blob; },
      getDataAsString: () => buf.toString('utf8'), _buf: () => buf
    };
    return blob;
  }

  function fileObj(node) {
    const self = {
      getId: () => node.id, getName: () => node.name, getMimeType: () => node.mimeType, getSize: () => (node.content ? node.content.length : 0),
      getUrl: () => (node.isFolder ? 'https://drive.google.com/drive/folders/' : 'https://drive.google.com/file/d/') + node.id + (node.isFolder ? '' : '/view'),
      getDateCreated: () => node.created, isTrashed: () => node.trashed, setTrashed: v => { node.trashed = !!v; return self; },
      getParents: () => iterator(node.parents.map(p => folderObj(nodes.get(p)))),
      getBlob: () => {
        if (node.mimeType === GOOGLE_DOCS) return makeBlob(Buffer.from('%PDF-fake'), 'application/pdf', node.name + '.pdf');
        return makeBlob(node.content, node.mimeType, node.name);
      },
      setContent: s => { node.content = Buffer.from(String(s), 'utf8'); return self; },
      moveTo: folder => { node.parents = [folder.getId()]; return self; },
      getThumbnail: () => (node.thumbnail ? makeBlob(node.thumbnail, 'image/png', 'thumb.png') : null),
      setName: n => { node.name = n; return self; }
    };
    return self;
  }

  function folderObj(node) {
    const self = Object.assign(fileObj(node), {
      getFoldersByName: name => iterator(children(node.id).filter(n => n.isFolder && n.name === name).map(folderObj)),
      getFolders: () => iterator(children(node.id).filter(n => n.isFolder).map(folderObj)),
      getFiles: () => iterator(children(node.id).filter(n => !n.isFolder).map(fileObj)),
      getFilesByName: name => iterator(children(node.id).filter(n => !n.isFolder && n.name === name).map(fileObj)),
      createFolder: name => folderObj(addNode({ name, mimeType: FOLDER, parents: [node.id], isFolder: true })),
      createFile: (a, content, mime) => {
        if (typeof a === 'string') return fileObj(addNode({ name: a, mimeType: mime || 'text/plain', parents: [node.id], content: Buffer.from(String(content || ''), 'utf8') }));
        return fileObj(addNode({ name: a.getName() || 'untitled', mimeType: a.getContentType(), parents: [node.id], content: a._buf() }));
      }
    });
    return self;
  }

  function addNode(n) {
    const node = Object.assign({ id: newId(), trashed: false, created: new Date(), thumbnail: null, isFolder: false, content: null }, n);
    nodes.set(node.id, node);
    return node;
  }
  function getNode(id) { const n = nodes.get(id); if (!n) throw new Error('Exception: No item with the given ID could be found.'); return n; }

  const DriveApp = {
    getRootFolder: () => folderObj(nodes.get('root')),
    getFolderById: id => { const n = getNode(id); if (!n.isFolder) throw new Error('not a folder'); return folderObj(n); },
    getFileById: id => { const n = getNode(id); if (n.isFolder) throw new Error('not a file'); return fileObj(n); },
    getFoldersByName: name => iterator([...nodes.values()].filter(n => n.isFolder && n.name === name).map(folderObj))
  };

  const docText = id => (getNode(id).content || Buffer.alloc(0)).toString('utf8');
  function docObj(node) {
    return {
      getId: () => node.id, getName: () => node.name,
      getBody: () => ({ setText: t => { node.content = Buffer.from(String(t), 'utf8'); }, getText: () => docText(node.id) }),
      saveAndClose: () => {}
    };
  }
  const DocumentApp = {
    create: name => docObj(addNode({ name, mimeType: GOOGLE_DOCS, parents: ['root'], content: Buffer.alloc(0) })),
    openById: id => { const n = getNode(id); if (n.mimeType !== GOOGLE_DOCS) throw new Error('not a doc'); return docObj(n); }
  };

  const Utilities = {
    base64Decode: s => {
      const str = String(s);
      if (/[^A-Za-z0-9+/=_-]/.test(str)) throw new Error('Could not decode string.');
      return toSigned(Buffer.from(str, 'base64'));
    },
    base64Encode: bytes => toBuffer(bytes).toString('base64'),
    base64EncodeWebSafe: s => toBuffer(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
    newBlob: (bytes, mime, name) => makeBlob(bytes, mime, name),
    getUuid: () => crypto.randomUUID(),
    formatDate,
    Charset: { UTF_8: 'UTF-8' }
  };

  const ContentService = {
    MimeType: { JSON: 'application/json', TEXT: 'text/plain', ICAL: 'text/calendar' },
    createTextOutput: s => {
      let mime = 'text/plain';
      const o = { setMimeType: m => { mime = m; return o; }, getContent: () => s, getMimeType: () => mime };
      return o;
    }
  };
  const HtmlService = { createHtmlOutput: h => ({ getContent: () => h, setTitle() { return this; } }) };
  const PropertiesService = {
    getScriptProperties: () => ({
      getProperty: k => (props.has(k) ? props.get(k) : null),
      setProperty: (k, v) => { props.set(k, String(v)); },
      deleteProperty: k => { props.delete(k); }
    })
  };
  let locked = false;
  const LockService = { getScriptLock: () => ({ waitLock: () => { if (locked) throw new Error('ロックが取れない（入れ子）'); locked = true; }, releaseLock: () => { locked = false; } }) };
  const ScriptApp = {
    getProjectTriggers: () => triggers.slice(),
    deleteTrigger: t => { const i = triggers.indexOf(t); if (i >= 0) triggers.splice(i, 1); },
    newTrigger: fn => {
      const t = { fn, getHandlerFunction: () => fn };
      const b = { timeBased: () => b, everyHours: h => { t.everyHours = h; return b; }, create: () => { triggers.push(t); return t; } };
      return b;
    },
    getService: () => ({ getUrl: () => opts.serviceUrl || 'https://script.google.com/macros/s/MOCK/exec' }),
    getOAuthToken: () => 'mock-oauth-token'
  };
  /** Drive API の「ドキュメントに変えて OCR」を再現する。画像のバイトの中の TEXT=… を、読みとった文字にする */
  function fakeOcr(url, o) {
    if (!/^https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files\?uploadType=multipart&ocrLanguage=ja/.test(url)) return null;
    const buf = toBuffer(o.payload);
    const s = buf.toString('utf8');
    const meta = JSON.parse(s.slice(s.indexOf('{'), s.indexOf('}\r\n') + 1));
    const m = /TEXT=([^\u0000]*?)(?:\r\n--hibi|$)/.exec(s);
    const doc = addNode({ name: meta.name, mimeType: GOOGLE_DOCS, parents: [meta.parents[0]], content: Buffer.from('-----\n\n' + (m ? m[1] : ''), 'utf8') });
    env.ocrCalls = (env.ocrCalls || 0) + 1;
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ id: doc.id }) };
  }
  const UrlFetchApp = {
    fetch: (url, o) => {
      const ocr = fakeOcr(url, o);
      if (ocr) return ocr;
      for (const h of fetchHandlers) { const r = h(url, o, { nodes }); if (r) return r; }
      return { getResponseCode: () => 404, getContentText: () => '{}', getBlob: () => makeBlob('', 'text/plain', '') };
    }
  };
  const MimeType = { GOOGLE_DOCS, FOLDER };

  const context = vm.createContext({
    DriveApp, DocumentApp, Utilities, ContentService, HtmlService, PropertiesService, LockService, ScriptApp, UrlFetchApp, MimeType,
    console: { log: (...a) => logs.push(a.join(' ')), warn: (...a) => logs.push('[warn] ' + a.join(' ')), error: (...a) => logs.push('[error] ' + a.join(' ')) },
    Logger: { log: (...a) => logs.push(a.join(' ')) }
  });
  const code = fs.readFileSync(opts.codePath || path.join(__dirname, '..', 'gas', 'Code.gs'), 'utf8');
  vm.runInContext(code, context, { filename: 'Code.gs' });

  /** 実行のたびに、本物と同じく「その実行だけのキャッシュ」を消す */
  function fresh() { vm.runInContext('FOLDERS_ = null; CAT_CACHE_ = {};', context); }

  var env = {
    context, nodes, props, triggers, logs,
    call(name, ...args) { fresh(); return context[name](...args); },
    post(action, payload = {}, token) {
      fresh();
      const body = JSON.stringify(Object.assign({ action, token: token === undefined ? props.get('TOKEN') : token }, payload));
      const out = context.doPost({ postData: { contents: body, type: 'text/plain' }, parameter: {} });
      return JSON.parse(out.getContent());
    },
    postRaw(body, parameter = {}) {
      fresh();
      return JSON.parse(context.doPost({ postData: body == null ? undefined : { contents: body }, parameter }).getContent());
    },
    get(parameter = {}) { fresh(); return context.doGet({ parameter }); },
    /** 開発用サーバーから：本物の Apps Script と同じく、本文（文字列）を受けて、返事の文字列と種類を返す */
    handle(method, body, parameter = {}) {
      fresh();
      const out = method === 'POST' ? context.doPost({ postData: body == null ? undefined : { contents: body, type: 'text/plain' }, parameter }) : context.doGet({ parameter });
      return { content: out.getContent(), mime: out.getMimeType ? out.getMimeType() : 'text/html' };
    },
    // ── ドライブを、人や Claude が直接さわったようにする ──
    find(pathStr) {
      let cur = 'root';
      for (const part of pathStr.split('/').filter(Boolean)) {
        const n = children(cur).find(c => c.name === part && !c.trashed);
        if (!n) return null;
        cur = n.id;
      }
      return nodes.get(cur);
    },
    list(pathStr) { const f = env.find(pathStr); return f ? children(f.id).filter(n => !n.trashed).map(n => n.name).sort() : null; },
    putFile(folderPath, name, mimeType, content, extra = {}) {
      const f = env.find(folderPath);
      if (!f) throw new Error('no folder ' + folderPath);
      return addNode(Object.assign({ name, mimeType, parents: [f.id], content: toBuffer(content) }, extra));
    },
    readText(id) { return getNode(id).content.toString('utf8'); },
    parentPath(id) {
      const names = [];
      let n = getNode(id);
      while (n.parents.length) { n = getNode(n.parents[0]); names.unshift(n.name); }
      return names.slice(1).join('/');
    },
    exportJson() {
      const doc = [...nodes.values()].find(n => n.mimeType === GOOGLE_DOCS && n.name === 'claudeへ' && !n.trashed);
      const t = doc.content.toString('utf8');
      return JSON.parse(t.slice(t.indexOf('{')));
    },
    today() { return formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'); }
  };
  return env;
}

module.exports = { createGasEnv, formatDate, GOOGLE_DOCS, FOLDER };
