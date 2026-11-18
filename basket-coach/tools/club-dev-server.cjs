#!/usr/bin/env node
/* クラブの検査用サーバー：Supabase（PostgREST）の「/rest/v1/rpc/<関数>」と同じ形で、手元の Postgres の bg_* 関数を呼ぶ。
   本番の Supabase には向けない（手元の検査用の Postgres だけ）。
   使い方：
     NODE_PATH=$(npm root -g) node tools/club-dev-server.cjs [--port=54435] [--db=postgres://postgres@127.0.0.1:54434/bgtest] [--schema]
       --schema …… はじめに club/schema.sql を流す（何回流してもよい）
   PostgREST とそろえていること：
     ・bg_ で始まる関数だけ呼べる。引数の名前が関数とぴったり合わないと 404（PGRST202）
     ・anon ロールで実行する（set local role anon。権限の取り消しが効いているか確かめられる）
     ・request.headers に x-forwarded-for を入れる（回数制限が IP で数えるため。ヘッダー x-test-ip でかえられる）
     ・関数の返り値（jsonb）を、そのまま JSON で返す
   ほかのツールから require して使える：const srv = await require('./club-dev-server.cjs').start({ port, db, schema }) */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function start(opt = {}) {
  const port = opt.port || 54435;
  const pool = new Pool({ connectionString: opt.db || process.env.BG_DB || 'postgres://postgres@127.0.0.1:54434/bgtest', max: 8 });
  if (opt.schema) {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'club', 'schema.sql'), 'utf8');
    await pool.query(sql);
  }
  // 関数の引数（名前と型）
  const fns = {};
  const loadFns = async () => {
    const r = await pool.query(`select p.proname, p.proargnames, array(select format_type(t, null) from unnest(p.proargtypes) t) as types
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'bg\\_%'`);
    for (const k of Object.keys(fns)) delete fns[k];
    for (const row of r.rows) fns[row.proname] = { names: row.proargnames || [], types: row.types };
  };
  await loadFns();
  const send = (res, code, body) => {
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };
  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204, '');
    const m = /^\/rest\/v1\/rpc\/([a-z0-9_]+)$/.exec((req.url || '').split('?')[0]);
    if (req.method !== 'POST' || !m) return send(res, 404, { code: 'PGRST125', message: 'not found' });
    let raw = '';
    for await (const ch of req) raw += ch;
    let args;
    try { args = raw ? JSON.parse(raw) : {}; } catch (e) { return send(res, 400, { code: 'PGRST102', message: 'bad json' }); }
    const f = fns[m[1]];
    const keys = Object.keys(args || {}).sort();
    if (!f || keys.join(',') !== f.names.slice().sort().join(',')) return send(res, 404, { code: 'PGRST202', message: `function ${m[1]}(${keys}) not found` });
    const vals = f.names.map((n) => { const v = args[n]; return v == null ? null : typeof v === 'object' ? JSON.stringify(v) : String(v); });
    const call = `select public.${m[1]}(${f.names.map((n, i) => `${n} => $${i + 1}::${f.types[i]}`).join(', ')}) as r`;
    const ip = req.headers['x-test-ip'] || '127.0.0.1';
    const cli = await pool.connect();
    try {
      await cli.query('begin');
      await cli.query('set local role anon');
      await cli.query(`select set_config('request.headers', $1, true)`, [JSON.stringify({ 'x-forwarded-for': ip })]);
      const r = await cli.query(call, vals);
      await cli.query('commit');
      send(res, 200, JSON.stringify(r.rows[0].r));
    } catch (e) {
      await cli.query('rollback').catch(() => {});
      send(res, 400, { code: e.code, message: e.message });
    } finally {
      cli.release();
    }
  });
  await new Promise((ok) => server.listen(port, '127.0.0.1', ok));
  return {
    url: `http://127.0.0.1:${port}`,
    pool,
    reload: loadFns,
    close: async () => { await new Promise((ok) => server.close(ok)); await pool.end(); },
  };
}
module.exports = { start };

if (require.main === module) {
  const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
  start({ port: +arg('port', 54435), db: arg('db'), schema: process.argv.includes('--schema') })
    .then((s) => console.log('クラブの検査用サーバー：' + s.url + '/rest/v1/rpc/…'))
    .catch((e) => { console.error(e.message); process.exit(1); });
}
