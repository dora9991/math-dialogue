// 使い方: node showdis.cjs <tag> <id...>  解き手の えらんだ 選択肢の 文と、作者の 正解の 文を 出す
const fs=require('fs');const [tag,...ids]=process.argv.slice(2);
const txt=fs.readFileSync(`blind/${tag}.txt`,'utf8');const ans=JSON.parse(fs.readFileSync(`blind/${tag}.answers.json`,'utf8'));
const items=JSON.parse(fs.readFileSync(`out/${tag}.json`,'utf8'));
for(const id of ids){const blk=txt.split('### '+id+'\n')[1].split('\n### ')[0].trim();const a=ans['答え'][id];
 const line=blk.split('\n').find(l=>l.startsWith(a+'. '));const it=items.find(x=>x.id===id);
 console.log(`\n## ${id}\n${it.q}\n 作者: ${it.c.find(c=>c.k).t}\n 解き手: ${line}\n e: ${it.e.replace(/\n/g,' / ')}`);}
