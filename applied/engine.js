/* ============================================================
   engine.js — 数式パーサ＋採点＋方眼SVG
   数学小テストツール(quiz/quizdata.js)から抽出した共通エンジン。
   応用チャレンジ(challenge.html / teacher.html)が読み込む。
   ============================================================ */

/* ---------- 数式パーサ（同値判定の心臓部） ---------- */
function normalize(s){
  return String(s)
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0)-0xFEE0))
    .replace(/[×✕✖・＊]/g,"*").replace(/[÷／]/g,"/")
    .replace(/[−–—ー－ｰ‐]/g,"-").replace(/[＋]/g,"+").replace(/[＝]/g,"=").replace(/[＾]/g,"^")
    .replace(/[（]/g,"(").replace(/[）]/g,")")
    .replace(/[，、]/g,",")
    .replace(/\s|　/g,"")
    .toLowerCase()
    .replace(/pi/g,"π");
}
function tokenize(s){
  const t=[]; let i=0;
  while(i<s.length){
    const c=s[i];
    if(/[\d.]/.test(c)){ let j=i; while(j<s.length && /[\d.]/.test(s[j])) j++; t.push({t:"n",v:parseFloat(s.slice(i,j))}); i=j; }
    else if(c==="π"){ t.push({t:"n",v:Math.PI}); i++; }
    else if(c==="x"){ t.push({t:"v"}); i++; }
    else if("+-*/^()".includes(c)){ t.push({t:"o",v:c}); i++; }
    else throw new Error("unexpected: "+c);
  }
  const out=[];
  for(let k=0;k<t.length;k++){
    out.push(t[k]);
    const a=t[k], b=t[k+1]; if(!b) break;
    const aEnd = a.t==="n"||a.t==="v"||(a.t==="o"&&a.v===")");
    const bBeg = b.t==="n"||b.t==="v"||(b.t==="o"&&b.v==="(");
    if(aEnd&&bBeg) out.push({t:"o",v:"*"});   // 暗黙の掛け算： 2x, 3(x+1)
  }
  return out;
}
const PREC={"+":1,"-":1,"*":2,"/":2,"u":3,"^":4}, RIGHT={"^":1,"u":1};
function toRPN(tk){
  const out=[],ops=[]; let prev=null;
  for(const t of tk){
    if(t.t==="n"||t.t==="v"){ out.push(t); }
    else if(t.v==="("){ ops.push(t); }
    else if(t.v===")"){
      while(ops.length && ops[ops.length-1].v!=="(") out.push(ops.pop());
      if(!ops.length) throw new Error("paren");
      ops.pop();
    } else {
      let v=t.v;
      const unary = (v==="-"||v==="+") && (prev===null || (prev.t==="o" && prev.v!==")"));
      if(unary) v = (v==="-") ? "u" : "up";
      if(v==="up"){ prev=t; continue; }              // 単項プラスは捨てる
      while(ops.length){
        const top=ops[ops.length-1]; if(top.v==="(") break;
        const pt=PREC[top.v], pv=PREC[v];
        if(pt>pv || (pt===pv && !RIGHT[v])) out.push(ops.pop()); else break;
      }
      ops.push({t:"o",v});
    }
    prev=t;
  }
  while(ops.length){ const o=ops.pop(); if(o.v==="(") throw new Error("paren"); out.push(o); }
  return out;
}
function compile(src){
  const rpn = toRPN(tokenize(normalize(src)));
  return (x) => {
    const st=[];
    for(const t of rpn){
      if(t.t==="n") st.push(t.v);
      else if(t.t==="v") st.push(x);
      else if(t.v==="u") st.push(-st.pop());
      else {
        const b=st.pop(), a=st.pop();
        if(a===undefined||b===undefined) throw new Error("arity");
        st.push(t.v==="+"?a+b : t.v==="-"?a-b : t.v==="*"?a*b : t.v==="/"?a/b : Math.pow(a,b));
      }
    }
    if(st.length!==1) throw new Error("stack");
    return st[0];
  };
}
function stripLHS(s){ return normalize(s).replace(/^[xy]=/,""); }
const SAMPLES=[1.3,2.7,-1.9,3.4,0.6,-3.3,4.1,-0.7,5.2,-2.4];
function exprEqual(userRaw, correctRaw){
  let f,g;
  try{ f=compile(stripLHS(userRaw)); }catch(e){ return false; }
  try{ g=compile(stripLHS(correctRaw)); }catch(e){ return false; }
  let n=0;
  for(const x of SAMPLES){
    let p,q;
    try{ p=f(x); q=g(x); }catch(e){ return false; }
    if(!isFinite(p)||!isFinite(q)) continue;
    if(Math.abs(p-q) > 1e-6*(1+Math.abs(q))) return false;
    n++;
  }
  return n>=4;
}
function numEqual(userRaw, correct){
  let s = normalize(userRaw).replace(/^[a-z]=/,"").replace(/(本|l|cm|個|分|時間|g|円|倍)$/,"");
  if(!s) return false;
  try{ const v = compile(s)(0); return isFinite(v) && Math.abs(v-correct) < 1e-9; }catch(e){ return false; }
}
function normIneq(s){
  return normalize(s).replace(/>=|=>/g,"≧").replace(/<=|=</g,"≦")
    .replace(/[≥]/g,"≧").replace(/[≤]/g,"≦").replace(/[＞]/g,">").replace(/[＜]/g,"<");
}
function parseIneq(raw){
  const s = normIneq(raw);
  const parts = s.split(/(≦|≧|<|>)/).filter(p=>p!=="");
  const val = t => { const v = compile(t)(NaN); return v; };
  let lo=-Infinity, loI=false, hi=Infinity, hiI=false;
  const apply = (a,op,b)=>{
    if(a==="x"){ const n=val(b);
      if(op===">"){lo=n;loI=false;} else if(op==="≧"){lo=n;loI=true;}
      else if(op==="<"){hi=n;hiI=false;} else {hi=n;hiI=true;}
    } else if(b==="x"){ const n=val(a);
      if(op===">"){hi=n;hiI=false;} else if(op==="≧"){hi=n;hiI=true;}
      else if(op==="<"){lo=n;loI=false;} else {lo=n;loI=true;}
    } else throw new Error("no x");
  };
  if(parts.length===3) apply(parts[0],parts[1],parts[2]);
  else if(parts.length===5){ apply(parts[0],parts[1],parts[2]); apply(parts[2],parts[3],parts[4]); }
  else throw new Error("form");
  return {lo,loI,hi,hiI};
}
function ineqEqual(userRaw, correctRaw){
  let a,b;
  try{ a=parseIneq(userRaw); }catch(e){ return false; }
  try{ b=parseIneq(correctRaw); }catch(e){ return false; }
  const eq=(p,q)=> (p===q) || (isFinite(p)&&isFinite(q)&&Math.abs(p-q)<1e-9);
  return eq(a.lo,b.lo)&&eq(a.hi,b.hi)&&a.loI===b.loI&&a.hiI===b.hiI;
}
function coordEqual(userRaw, pt){
  const s = normalize(userRaw).replace(/^[a-f]=/,"").replace(/[()]/g,"");
  const m = s.split(",");
  if(m.length!==2) return false;
  try{ return Math.abs(compile(m[0])(0)-pt[0])<1e-9 && Math.abs(compile(m[1])(0)-pt[1])<1e-9; }catch(e){ return false; }
}
function textEqual(userRaw, accepts){
  const s = normalize(userRaw);
  return accepts.some(a => normalize(a)===s);
}
function gradeSub(mode, user, ans){
  if(user===undefined||user===null||String(user).trim()==="") return false;
  switch(mode){
    case "expr":  return exprEqual(user, ans);
    case "ineq":  return ineqEqual(user, ans);
    case "num":   return numEqual(user, ans);
    case "coord": return coordEqual(user, ans);
    case "text":  return textEqual(user, ans);
    default: return false;
  }
}

/* ---------- 図形描画（SVG） ---------- */
function gridSVG(R, opts={}){
  const S=400, M=26, U=(S-2*M)/(2*R), C=S/2;
  const X = gx => C + gx*U, Y = gy => C - gy*U;
  let g="";
  for(let i=-R;i<=R;i++){
    const w = i===0 ? 0 : 1;
    if(i!==0){
      g+=`<line x1="${X(i)}" y1="${Y(-R)}" x2="${X(i)}" y2="${Y(R)}" stroke="#e6ebf1" stroke-width="1"/>`;
      g+=`<line x1="${X(-R)}" y1="${Y(i)}" x2="${X(R)}" y2="${Y(i)}" stroke="#e6ebf1" stroke-width="1"/>`;
    }
  }
  g+=`<line x1="${X(-R)-8}" y1="${C}" x2="${X(R)+8}" y2="${C}" stroke="#16202e" stroke-width="1.4"/>`;
  g+=`<line x1="${C}" y1="${Y(-R)+8}" x2="${C}" y2="${Y(R)-8}" stroke="#16202e" stroke-width="1.4"/>`;
  g+=`<text x="${X(R)+11}" y="${C+4}" font-size="12" font-style="italic">x</text>`;
  g+=`<text x="${C+6}" y="${Y(R)-9}" font-size="12" font-style="italic">y</text>`;
  g+=`<text x="${C-11}" y="${C+14}" font-size="12">O</text>`;
  const lab = R<=5?[R]:[R, Math.round(R/2)];
  lab.forEach(v=>{
    g+=`<text x="${X(v)-3}" y="${C+15}" font-size="10" fill="#4a5768">${v}</text>`;
    g+=`<text x="${X(-v)-6}" y="${C+15}" font-size="10" fill="#4a5768">-${v}</text>`;
    g+=`<text x="${C+5}" y="${Y(v)+4}" font-size="10" fill="#4a5768">${v}</text>`;
    g+=`<text x="${C+5}" y="${Y(-v)+4}" font-size="10" fill="#4a5768">-${v}</text>`;
  });
  if(opts.extra) g += opts.extra({X,Y,R,U,C});
  return {svg:`<svg class="${opts.cls||"fig"}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`, X, Y, U, C, S, M};
}
function linePath(n,d,R,X,Y){
  const a=n/d; let x1=-R,y1=a*x1,x2=R,y2=a*x2;
  if(Math.abs(y1)>R){ y1=Math.sign(y1)*R; x1=y1/a; }
  if(Math.abs(y2)>R){ y2=Math.sign(y2)*R; x2=y2/a; }
  return `<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" stroke="#24467d" stroke-width="1.8"/>`;
}
function hyperPath(a,R,X,Y,sgn){
  const sgns = sgn ? [sgn] : [1,-1];
  let out="";
  for(const s of sgns){
    const pts=[];
    for(let i=0;i<=120;i++){
      const x = s*( Math.abs(a)/R + (R-Math.abs(a)/R)*i/120 );
      const y = a/x;
      if(Math.abs(y)<=R+0.001 && Math.abs(x)<=R+0.001) pts.push(`${X(x).toFixed(1)},${Y(y).toFixed(1)}`);
    }
    if(pts.length>1) out+=`<polyline points="${pts.join(" ")}" fill="none" stroke="#24467d" stroke-width="1.8"/>`;
  }
  return out;
}
function dot(X,Y,x,y,color="#c8322d",r=4.5){ return `<circle cx="${X(x)}" cy="${Y(y)}" r="${r}" fill="${color}"/>`; }
