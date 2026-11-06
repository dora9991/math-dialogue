// テストでは、本物のクラウド（Supabase）に送らない：通信を受け止めて、それらしい返事をする（受け取った記録は、ここに覚える）
//   const { stubCloud } = require('./cloudstub.cjs'); const cloud = await stubCloud(ctx);  cloud.games … 送られた試合
async function stubCloud(ctx) {
  const store = { games: {}, calls: [] };
  await ctx.route(/supabase\.co\/rest\/v1\/rpc\//, async (route) => {
    const name = route.request().url().split('/rpc/')[1];
    let body = {};
    try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) { /* 空 */ }
    store.calls.push(name);
    let res = { ok: true };
    if (name === 'btap_put') { store.games[body.p_id] = { data: body.p_data, summary: body.p_summary, at: body.p_at }; res = { ok: true, at: body.p_at }; }
    else if (name === 'btap_list') res = { ok: true, games: Object.keys(store.games).map((id) => ({ id, summary: store.games[id].summary, at: store.games[id].at })) };
    else if (name === 'btap_get') res = store.games[body.p_id] ? { ok: true, data: store.games[body.p_id].data, at: store.games[body.p_id].at } : { error: 'none' };
    else if (name === 'btap_del') { delete store.games[body.p_id]; res = { ok: true }; }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(res), headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  return store;
}
module.exports = { stubCloud };
