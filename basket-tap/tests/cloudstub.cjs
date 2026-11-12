// テストでは、本物のクラウド（Supabase）に送らない：通信を受け止めて、それらしい返事をする（受け取った記録は、ここに覚える）
//   const { stubCloud } = require('./cloudstub.cjs'); const cloud = await stubCloud(ctx);  cloud.games … 送られた試合
//   場面パックの購入コード（btap_code_check）：cloud.codes['ABCDEFGHJKMN'] = { club, plan, expires_at, revoked }（正規化したコードで）。cloud.down = true で通信失敗
async function stubCloud(ctx) {
  const store = { games: {}, calls: [], codes: {}, down: false };
  await ctx.route(/supabase\.co\/rest\/v1\/rpc\//, async (route) => {
    const name = route.request().url().split('/rpc/')[1];
    let body = {};
    try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) { /* 空 */ }
    store.calls.push(name);
    let res = { ok: true };
    if (name === 'btap_code_check' && store.down) { await route.abort('failed'); return; }
    if (name === 'btap_put') { store.games[body.p_id] = { data: body.p_data, summary: body.p_summary, at: body.p_at }; res = { ok: true, at: body.p_at }; }
    else if (name === 'btap_list') res = { ok: true, games: Object.keys(store.games).map((id) => ({ id, summary: store.games[id].summary, at: store.games[id].at })) };
    else if (name === 'btap_get') res = store.games[body.p_id] ? { ok: true, data: store.games[body.p_id].data, at: store.games[body.p_id].at } : { error: 'none' };
    else if (name === 'btap_code_check') {
      const c = String(body.p_code || '').toUpperCase().replace(/[\s-]/g, ''), r = store.codes[c];
      res = !/^[2-9A-HJKMNP-Z]{12}$/.test(c) ? { ok: false, error: 'format' } : !r ? { ok: false, error: 'none' }
        : r.revoked ? { ok: false, error: 'revoked' } : Date.parse(r.expires_at) <= Date.now() ? { ok: false, error: 'expired' }
        : { ok: true, club: r.club, plan: r.plan || 'scene', expires_at: r.expires_at };
    }
    else if (name === 'btap_del') { delete store.games[body.p_id]; res = { ok: true }; }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(res), headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  return store;
}
module.exports = { stubCloud };
