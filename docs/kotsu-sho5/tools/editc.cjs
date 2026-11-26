// 使い方: node editc.cjs <tag> <id> <json: {q?, c?:[{t,k?,w?}...], e?}>  out/<tag>/<授業>.json の 1問を 直す（あとで merge_e5）
const fs=require('fs');const [tag,id,js]=process.argv.slice(2);const patch=JSON.parse(js);
const les=id.replace(/-L\d-\d\d$/,'');const f=`out/${tag}/${les}.json`;const a=JSON.parse(fs.readFileSync(f,'utf8'));
const it=a.find(x=>x.id===id);if(!it)throw new Error('id なし '+id);
for(const k of ['q','e','c']) if(patch[k]!==undefined) it[k]=patch[k];
fs.writeFileSync(f,JSON.stringify(a,null,1));console.log('ok',id);
