/* ============================================================
   問題データ・採点ロジック（quiz.html / teacher.html 共通）
   数研出版 1年 4章 比例と反比例 準拠
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

const FIG = {
  box3d(){
    return `<svg class="fig" viewBox="0 0 340 240" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#16202e" stroke-width="1.3">
        <path d="M70 60 L230 60 L230 190 L70 190 Z"/>
        <path d="M70 60 L120 25 L280 25 L230 60"/>
        <path d="M230 190 L280 155 L280 25"/>
      </g>
      <path d="M70 130 L230 130 L280 95 L120 95 Z" fill="#dbe6f3" stroke="#24467d" stroke-width="1.1" opacity=".75"/>
      <path d="M70 130 L70 190 L230 190 L230 130 Z" fill="#dbe6f3" stroke="none" opacity=".45"/>
      <g stroke="#c8322d" stroke-width="1"><path d="M56 130 L56 190" marker-start="url(#a)" marker-end="url(#a)"/></g>
      <defs><marker id="a" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 3 L6 0 L6 6 Z" fill="#c8322d"/></marker></defs>
      <text x="26" y="164" font-size="13" fill="#c8322d" font-style="italic">x cm</text>
      <text x="140" y="209" font-size="13">8 cm</text>
      <text x="248" y="185" font-size="13">7 cm</text>
      <text x="240" y="120" font-size="13">10 cm</text>
    </svg>`;
  },
  axesPoints(){
    const P={A:[5,4],B:[-3,-4],C:[-2,2],D:[3,-4],E:[3,0],F:[0,-3]};
    return gridSVG(5,{extra:({X,Y})=>{
      let s=`<text x="${X(4.2)}" y="${Y(-0.35)}" font-size="13" fill="#c8322d">ア</text>`;
      s+=`<text x="${X(0.25)}" y="${Y(4.1)}" font-size="13" fill="#c8322d">イ</text>`;
      for(const k in P){ const [x,y]=P[k];
        s+=dot(X,Y,x,y,"#16202e",3.8)+`<text x="${X(x)+6}" y="${Y(y)-6}" font-size="13" font-weight="600">${k}</text>`; }
      return s;
    }}).svg;
  },
  fourLines(){
    const L=[[2,1,"①"],[1,3,"②"],[-2,5,"③"],[-3,2,"④"]];
    return gridSVG(5,{extra:({X,Y,R})=>{
      let s="";
      L.forEach(([n,d,lab])=>{
        s+=linePath(n,d,R,X,Y);
        const a=n/d; let x=R, y=a*x; if(Math.abs(y)>R){ y=Math.sign(y)*R; x=y/a; }
        s+=`<text x="${X(x)-16}" y="${Y(y)+(a>0?16:-8)}" font-size="13" fill="#24467d" font-weight="600">${lab}</text>`;
      });
      return s;
    }}).svg;
  },
  twoHyper(){
    return gridSVG(6,{extra:({X,Y,R})=>{
      let s = hyperPath(-4,R,X,Y) + hyperPath(6,R,X,Y);
      s+=`<text x="${X(-4.6)}" y="${Y(1.6)}" font-size="13" fill="#24467d" font-weight="600">①</text>`;
      s+=`<text x="${X(1.1)}" y="${Y(5.2)}" font-size="13" fill="#24467d" font-weight="600">②</text>`;
      s+=`<text x="${X(3.4)}" y="${Y(2.4)}" font-size="13" fill="#24467d" font-weight="600">②</text>`;
      s+=`<text x="${X(1.4)}" y="${Y(-3.6)}" font-size="13" fill="#24467d" font-weight="600">①</text>`;
      return s;
    }}).svg;
  }
};

/* ---------- 問題データ（数研出版 1年 4章 準拠） ---------- */
const CH = [
  { id:"M1-04-1", no:"4-1", name:"関数と変域", pages:"p.122–126", limit:480, qs:[
    {no:"1", type:"choice", lead:"次の x と y の関係について、y は x の関数であるかどうか答えましょう。",
      choices:["y は x の関数である","y は x の関数ではない"],
      subs:[
        {lb:"(1)", prompt:"1個100円のみかんを x 個買ったときの代金は y 円である。", a:0},
        {lb:"(2)", prompt:"1辺が x cm の正三角形の周の長さを y cm とする。", a:0},
        {lb:"(3)", prompt:"年齢が x 歳の人の靴のサイズは y cm である。", a:1},
        {lb:"(4)", prompt:"1日にちょうど30秒の割合で進んでいく時計がある。時刻を正確に合わせてから x 日後に、正しい時刻から進んでいる時間を y 分とする。", a:0},
        {lb:"(5)", prompt:"縦の長さが x cm の長方形の面積を y cm² とする。", a:1},
      ]},
    {no:"2", type:"input", lead:"次のような変数 x の変域を不等式で表しましょう。", ph:"例: x>3, -4≦x≦1",
      hint:"≦ は <= と打ってもかまいません。",
      subs:[
        {lb:"(1)", prompt:"x が 3 より大きい", mode:"ineq", a:"x>3"},
        {lb:"(2)", prompt:"x が -5 以上", mode:"ineq", a:"x≧-5"},
        {lb:"(3)", prompt:"x が 2 未満", mode:"ineq", a:"x<2"},
        {lb:"(4)", prompt:"x が -4 以上 1 以下", mode:"ineq", a:"-4≦x≦1"},
      ]},
  ],
    bonus:{ type:"input", lead:"ある0以上の整数 x を 4 でわったときの余りを y とします。y のとりうる値は全部で何個ですか。",
      ph:"…個", subs:[{mode:"num", a:4}],
      sol:"4 でわった余りは 0, 1, 2, 3 のどれか。だから 4 個。x がどんな整数でも y はこの4個のどれかにただ1つ決まるので、これは関数です。" },
  },

  { id:"M1-04-2", no:"4-2", name:"比例", pages:"p.127–130", limit:600, qs:[
    {no:"1", type:"input", fig:"box3d",
      lead:"右の図のような直方体の形をした水そうに水を入れます。水面の高さが x cm のときの水の体積を y cm³ とするとき、次の問いに答えましょう。",
      subs:[
        {lb:"(1)", prompt:"x と y の関係を式で表しましょう。", mode:"expr", a:"y=56x", ph:"y=..."},
        {lb:"(2)", prompt:"x の変域を不等式で表しましょう。", mode:"ineq", a:"0≦x≦10", ph:"例: 0≦x≦10"},
      ]},
    {no:"2", type:"choice", lead:"比例の関係 y=-3x について、x の値が 2倍、3倍、4倍、…… になると、y の値はどのように変化しますか。",
      choices:["y の値も 2倍、3倍、4倍、…… になる","y の値は 1/2倍、1/3倍、1/4倍、…… になる","y の値は変わらない","y の値は -2倍、-3倍、-4倍、…… になる"],
      subs:[{lb:"", prompt:"", a:0}]},
    {no:"3", type:"input", lead:"y は x に比例し、x=3 のとき y=-21 です。",
      subs:[
        {lb:"(1)", prompt:"y を x の式で表しましょう。", mode:"expr", a:"y=-7x", ph:"y=..."},
        {lb:"(2)", prompt:"x=-2 のときの y の値を求めましょう。", mode:"num", a:14, ph:"y=..."},
        {lb:"(3)", prompt:"y=35 となる x の値を求めましょう。", mode:"num", a:-5, ph:"x=..."},
      ]},
  ],
    bonus:{ type:"input", lead:"2点 A(-4, 6)、B(m, -18) が、原点を通る同じ直線上にあります。m の値を求めましょう。",
      ph:"m=…", subs:[{mode:"num", a:12}],
      sol:"原点を通る直線だから y=ax。A(-4, 6) より 6=-4a、a=-3/2。B もこの直線上にあるから -18=-3/2×m、m=12。" },
  },

  { id:"M1-04-3", no:"4-3", name:"座標", pages:"p.131–133", limit:600, qs:[
    {no:"1", type:"input", fig:"axesPoints", lead:"右の図について答えましょう。",
      subs:[
        {lb:"ア", prompt:"ア の数直線の名前", mode:"text", a:["x軸","横軸","エックス軸"], ph:"○軸"},
        {lb:"イ", prompt:"イ の数直線の名前", mode:"text", a:["y軸","縦軸","ワイ軸"], ph:"○軸"},
        {lb:"O",  prompt:"ア と イ の交点 O の名前", mode:"text", a:["原点"], ph:"..."},
      ]},
    {no:"2", type:"input", figRef:1, lead:"上の図の点 A〜F の座標をそれぞれ答えましょう。", hint:"(5, 4) のように書きます。",
      subs:[
        {lb:"A", prompt:"点 A の座標", mode:"coord", a:[5,4], ph:"( , )"},
        {lb:"B", prompt:"点 B の座標", mode:"coord", a:[-3,-4], ph:"( , )"},
        {lb:"C", prompt:"点 C の座標", mode:"coord", a:[-2,2], ph:"( , )"},
        {lb:"D", prompt:"点 D の座標", mode:"coord", a:[3,-4], ph:"( , )"},
        {lb:"E", prompt:"点 E の座標", mode:"coord", a:[3,0], ph:"( , )"},
        {lb:"F", prompt:"点 F の座標", mode:"coord", a:[0,-3], ph:"( , )"},
      ]},
    {no:"3", type:"plot", lead:"次の点を図にかき入れましょう。ラベルを選んでから、方眼のマス目の交点をタップします。",
      R:5, points:[["A",3,5],["B",2,-5],["C",-4,4],["D",-5,-3],["E",0,4],["F",-3,0]]},
  ],
    bonus:{ type:"input", lead:"3点 A(5, -2)、B(-4, -2)、C(1, 4) を頂点とする三角形 ABC の面積を求めましょう。座標の1めもりを1cmとします。",
      ph:"…cm²", subs:[{mode:"num", a:27}],
      sol:"A と B は y 座標が同じなので、AB を底辺とみると AB=5-(-4)=9 cm。高さは C までの縦の距離で 4-(-2)=6 cm。面積 = 1/2×9×6 = 27（cm²）。" },
  },

  { id:"M1-04-4", no:"4-4", name:"比例のグラフ", pages:"p.134–137", limit:600, qs:[
    {no:"1(1)", type:"line", lead:"比例 y=4x のグラフをかきましょう。原点以外に、グラフが通る格子点を1つタップします。",
      R:5, n:4, d:1},
    {no:"1(2)", type:"line", lead:"比例 y=-⅔x のグラフをかきましょう。原点以外に、グラフが通る格子点を1つタップします。",
      R:5, n:-2, d:3},
    {no:"2", type:"input", fig:"fourLines", lead:"グラフが右の図の ①〜④ の直線になる比例の式をそれぞれ求めましょう。",
      hint:"分数は 2/5 のように書きます。y=-2/5x と入力すれば (-2/5)x として判定します。",
      subs:[
        {lb:"①", prompt:"", mode:"expr", a:"y=2x", ph:"y=..."},
        {lb:"②", prompt:"", mode:"expr", a:"y=(1/3)x", ph:"y=..."},
        {lb:"③", prompt:"", mode:"expr", a:"y=(-2/5)x", ph:"y=..."},
        {lb:"④", prompt:"", mode:"expr", a:"y=(-3/2)x", ph:"y=..."},
      ]},
  ],
    bonus:{ type:"input", lead:"比例 y=3/4x のグラフ上で、x座標も y座標も整数になる点のうち、x座標がいちばん小さい正の整数である点の座標を答えましょう。",
      hint:"( , ) の形で書きます。", ph:"( , )", subs:[{mode:"coord", a:[4,3]}],
      sol:"y=3/4x で y が整数になるのは x が 4 の倍数のとき。正の x で最小は x=4、このとき y=3/4×4=3。よって (4, 3)。" },
  },

  { id:"M1-04-5", no:"4-5", name:"反比例", pages:"p.139–142", limit:600, qs:[
    {no:"1(1)", type:"input", lead:"20 km の道のりを時速 x km で進むと y 時間かかる。y は x に反比例することを示し、比例定数を答えましょう。",
      subs:[
        {lb:"式", prompt:"y を x の式で表す", mode:"expr", a:"y=20/x", ph:"y=..."},
        {lb:"比例定数", prompt:"", mode:"num", a:20, ph:"..."},
      ]},
    {no:"1(2)", type:"input", lead:"120 cm のひもを x 等分したときの1本の長さを y cm とする。同じように答えましょう。",
      subs:[
        {lb:"式", prompt:"y を x の式で表す", mode:"expr", a:"y=120/x", ph:"y=..."},
        {lb:"比例定数", prompt:"", mode:"num", a:120, ph:"..."},
      ]},
    {no:"2", type:"choice", lead:"反比例の関係 y=8/x について、x の値が 2倍、3倍、4倍、…… になると、y の値はどのように変化しますか。",
      choices:["y の値も 2倍、3倍、4倍、…… になる","y の値は 1/2倍、1/3倍、1/4倍、…… になる","y の値は変わらない","y の値は -2倍、-3倍、-4倍、…… になる"],
      subs:[{lb:"", prompt:"", a:1}]},
    {no:"3", type:"input", lead:"y は x に反比例し、x=-4 のとき y=3 です。",
      subs:[
        {lb:"(1)", prompt:"y を x の式で表しましょう。", mode:"expr", a:"y=-12/x", ph:"y=..."},
        {lb:"(2)", prompt:"x=6 のときの y の値を求めましょう。", mode:"num", a:-2, ph:"y=..."},
      ]},
  ],
    bonus:{ type:"input", lead:"y は x に反比例し、x=-6 のとき y=8 です。x=4 のときの y の値を求めましょう。",
      ph:"y=…", subs:[{mode:"num", a:-12}],
      sol:"反比例では比例定数 a=xy。a=(-6)×8=-48。よって y=-48/x。x=4 のとき y=-48÷4=-12。" },
  },

  { id:"M1-04-6", no:"4-6", name:"反比例のグラフ", pages:"p.143–146", limit:660, qs:[
    {no:"1(1)", type:"hyper", lead:"反比例 y=4/x のグラフをかきましょう。x が正の側に1点、負の側に1点、グラフが通る格子点までドラッグします。",
      R:5, a:4},
    {no:"1(2)", type:"hyper", lead:"反比例 y=-8/x のグラフをかきましょう。同じように、x が正の側に1点、負の側に1点ドラッグします。",
      R:8, a:-8},
    {no:"2", type:"input", fig:"twoHyper", lead:"グラフが右の図の ①、② の双曲線になる反比例の式をそれぞれ求めましょう。",
      subs:[
        {lb:"①", prompt:"", mode:"expr", a:"y=-4/x", ph:"y=..."},
        {lb:"②", prompt:"", mode:"expr", a:"y=6/x", ph:"y=..."},
      ]},
  ],
    bonus:{ type:"input", lead:"反比例のグラフが2点 (-3, 8) と (6, b) を通っています。b の値を求めましょう。",
      ph:"b=…", subs:[{mode:"num", a:-4}],
      sol:"比例定数 a=xy=(-3)×8=-24。よって y=-24/x。b=-24÷6=-4。" },
  },

  { id:"M1-04-7", no:"4-7", name:"比例・反比例の活用", pages:"p.148–151", limit:600, qs:[
    {no:"1", type:"input", lead:"同じくぎがたくさんあります。全部の重さを量ると 540 g で、20本の重さを量ると 45 g でした。",
      subs:[
        {lb:"(1)", prompt:"くぎは全部で何本あるか答えましょう。", mode:"num", a:240, ph:"...本"},
        {lb:"(2)", prompt:"このくぎ x 本の重さを y g とするとき、y を x の式で表しましょう。", mode:"expr", a:"y=(9/4)x", ph:"y=..."},
      ]},
    {no:"2", type:"input", lead:"120 L 入る水そうがあります。",
      subs:[
        {lb:"(1)", prompt:"毎分 6 L ずつ入れる予定でしたが、かかる時間を最初の予定の 1/3 にしたい。1分間に入れる水の量を何 L にすればよいか答えましょう。", mode:"num", a:18, ph:"...L"},
        {lb:"(2)", prompt:"毎分 x L ずつ入れるとき、いっぱいになるまでに y 分かかるとして、y を x の式で表しましょう。", mode:"expr", a:"y=120/x", ph:"y=..."},
      ]},
  ],
    bonus:{ type:"input", lead:"かみ合った2つの歯車 A、B があります。A は歯数24で毎秒5回転します。かみ合う歯車では「歯数×回転数」が両方で等しくなります。B の歯数が30のとき、B は毎秒何回転しますか。",
      ph:"…回転", subs:[{mode:"num", a:4}],
      sol:"かみ合う歯車では（歯数）×（回転数）が等しい。A は 24×5=120。B も x×y=120 で y=120/x。x=30 のとき y=120÷30=4（回転）。" },
  },
];

/* ---------- 出席番号ヘルパー（例：1年2組3番 → 1203） ---------- */
const makeSid = (g,c,n) => `${g}${c}${String(n).padStart(2,"0")}`;
const readSid = sid => ({ g:+sid[0], c:+sid[1], n:+sid.slice(2) });
const sidLabel = sid => { const {g,c,n}=readSid(sid); return `${g}年${c}組${n}番`; };

/* ---------- アカウントIDヘルパー（例：E-101236 = 学校コード"E-10" + 出席番号"1236"） ----------
   学校コードは「アルファベット1文字」+「1〜100の数字」。生徒番号(4桁)は末尾4文字として必ず切り出せる
   （数字部分が5〜7桁で、末尾4桁が出席番号・残りが学校コードの数字部分、という決め方のため）。 */
const parseAccountId = id => {
  const m = /^([A-Z])-([0-9]{5,7})$/.exec(String(id||"").trim().toUpperCase());
  if(!m) return null;
  const rest = m[2], sid4 = rest.slice(-4), groupNum = rest.slice(0,-4);
  if(!groupNum || !/^\d{4}$/.test(sid4)) return null;
  return { id:`${m[1]}-${rest}`, letter:m[1], groupNum:+groupNum, sid4 };
};
const buildAccountId = (letter, groupNum, sid4) => `${letter}-${groupNum}${sid4}`;
const accountLabel = id => { const p=parseAccountId(id); return p ? sidLabel(p.sid4) : String(id||""); };
const classOf = sid => {
  const p = parseAccountId(sid);
  const s4 = p ? p.sid4 : sid;
  return /^\d{4}$/.test(s4) ? `${s4[0]}-${s4[1]}` : "?";
};
/** 学校コードだけを取り出す（例：E-101236 → "E-10"）。複数校が同じサイトを使う場合の絞り込み用。 */
const schoolOf = sid => { const p = parseAccountId(sid); return p ? `${p.letter}-${p.groupNum}` : "?"; };
