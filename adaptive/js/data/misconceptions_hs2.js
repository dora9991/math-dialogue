// ============================================================
// misconceptions_hs2.js — まちがいパターン辞書（高校の追加単元：数学Ⅰ〜Ⅲ・A〜C）
//
//  書式は misconceptions.js と同じ：{ name, blame, tip }
//   name  … 生徒がやってしまっている考え方（先生・保護者向けの言葉）
//   blame … 原因になっている単元ID（ここが弱いとこの誤答が出やすい）。なければ null
//   tip   … 声かけ・復習のヒント
// ============================================================

export const MISCONCEPTIONS_HS2 = {
  // ── 因数分解（数Ⅰ） ──
  "MC-FACTOR-SQDIFF": { name: "「平方の差」の形に変形して因数分解することに気づかない／変形を誤る", blame: "factor_formula", tip: "x⁴＋kx²＋a² は (x²＋a)²−(bx)² と見て、A²−B²＝(A＋B)(A−B) を使う。" },

  // ── 条件付き確率（数A） ──
  "MC-PCOND-JOINT": { name: "条件付き確率を「両方が起こる確率」と取りちがえる（全体でわってしまう）", blame: "prob_hs", tip: "「〜であったとき」は、全体をその条件にあてはまるものだけにしぼってから考える。" },
  "MC-PCOND-REVERSE": { name: "条件と結果の向きを逆にする（P_A(B) と P_B(A) を取りちがえる）", blame: null, tip: "どちらが「わかっていること（条件）」かを、問題文から先に決める。" },
  "MC-PCOND-IGNORE": { name: "条件を無視して、全体の中での確率を答える", blame: "prob_basic", tip: "条件がつくと、分母（起こりうる場合）が変わる。" },
  "MC-PCOND-TOTAL-PART": { name: "場合分けが必要なのに、一方の場合しか計算していない", blame: "prob_hs", tip: "原因（どこから来たか）で場合を分けて、それぞれの確率をたす。" },
  "MC-PCOND-TOTAL-ADD": { name: "割合の割合を、そのままたしたり平均したりする", blame: "percent_uses", tip: "全体の何％のうちの何％かは、かけ算で求める。" },
  "MC-PCOND-BASE": { name: "結果がわかったのに、原因の割合（もとの割合）のまま答える", blame: null, tip: "結果が起こった中で、その原因によるものの割合を考える（樹形図や表で整理）。" },
  "MC-PCOND-INDEP": { name: "もとにもどさない試行なのに、2回目も同じ確率として計算する", blame: "prob_multi", tip: "1回目に取り出した分だけ、2回目の全体と当たりの数が変わる。" },
  "MC-PCOND-DENOM": { name: "2回目の確率で、全体の数（分母）を減らし忘れる", blame: "prob_multi", tip: "もとにもどさないときは、2回目の全体は1つ少ない。" },
  "MC-PCOND-ORDER": { name: "くじを引く順番で当たる確率が変わると思う", blame: "prob_multi", tip: "場合分けして計算すると、先に引いても後に引いても当たる確率は同じになる。" },

  // ── 整数の性質（数A） ──
  "MC-DIVISOR-COUNT-NO-PLUS1": { name: "約数の個数で、指数に1をたさずにかける", blame: "prime_factor", tip: "p^a の約数は p^0 から p^a までの (a＋1) 個。p^0＝1 を忘れない。" },
  "MC-DIVISOR-COUNT-ADD": { name: "約数の個数を、かけ算でなくたし算で数える／1 や自分自身の扱いを誤る", blame: null, tip: "それぞれの素因数の指数を「独立に」選ぶので、選び方の数をかける。" },
  "MC-DIVISOR-SUM-FORMULA": { name: "約数の総和の求め方を誤る", blame: null, tip: "(1＋p＋…＋p^a)(1＋q＋…＋q^b) を展開すると、約数がちょうど1回ずつ出てくる。" },
  "MC-EUCLID-STOP": { name: "互除法の途中の数（最初の余りなど）を最大公約数と答える", blame: "div_rem", tip: "余りが 0 になるまでくり返し、そのときの「わる数」が最大公約数。" },
  "MC-LCM-PRODUCT": { name: "最小公倍数を2数の積のまま答える（最大公約数でわらない）", blame: "gcd_lcm", tip: "最小公倍数＝2数の積÷最大公約数。" },
  "MC-GCD-LCM-SWAP": { name: "最大公約数と最小公倍数（または 2 数の役割）を取りちがえる", blame: "gcd_lcm", tip: "a＝g a′、b＝g b′（a′, b′ は互いに素）とおいて整理する。" },
  "MC-MOD-NOT-REDUCED": { name: "余りを、わる数以上の数のまま答える", blame: "div_rem", tip: "余りは 0 以上（わる数−1）以下になるまで、わる数を引く。" },
  "MC-MOD-CYCLE": { name: "余りの周期を使うとき、何番目にあたるかを1つずらす", blame: null, tip: "指数を周期でわった余りが r なら、r 番目（r＝0 なら周期の最後）と同じ。" },
  "MC-DIOPH-SIGN": { name: "不定方程式の一般解で、x と y の変わり方の符号を誤る", blame: null, tip: "a(x−x₀)＝−b(y−y₀) から、x は b ずつ増えると y は a ずつ減る。" },
  "MC-DIOPH-COUNT": { name: "解の個数で、端（0 をふくむか・1 以上か）の扱いを誤る", blame: null, tip: "「0以上」か「1以上（正の整数）」かを確かめ、端の解を代入して確かめる。" },
  "MC-BASE-REVERSE": { name: "n 進法の数字を、逆の順（下の位から）に読む・書く", blame: null, tip: "わり算の余りは、最後に出たものが一番上の位。" },
  "MC-BASE-PLACE": { name: "n 進法の位の重み（n の何乗か）を1つずらす", blame: "neg_power_mixed", tip: "一番右の位は n⁰＝1。左へ n¹、n²、… となる。" },
  "MC-BASE-AS-DECIMAL": { name: "n 進法の数を、10進法の数のように扱う", blame: null, tip: "まず10進法になおしてから計算するか、n でくり上がることを意識する。" },

  // ── 図形の性質（数A） ──
  "MC-CENTER-HALF": { name: "中心角は円周角の2倍という関係を使えていない（外心の角）", blame: "circle_angle", tip: "外心は外接円の中心。∠BOC は弧 BC に対する中心角で、円周角 ∠BAC の2倍。" },
  "MC-CENTER-CONFUSE": { name: "外心・内心・重心・垂心の性質を取りちがえる", blame: null, tip: "外心＝3頂点から等距離、内心＝3辺から等距離、重心＝中線を 2:1、垂心＝垂線の交点。" },
  "MC-INCENTER-HALF": { name: "内心で、角が二等分されていることを使えていない", blame: null, tip: "内心は内角の二等分線の交点。∠IBC＝½∠B、∠ICB＝½∠C。" },
  "MC-CENTROID-RATIO": { name: "重心が中線を分ける比（頂点の側が 2）を逆にする", blame: null, tip: "重心は中線を、頂点の側から 2:1 に分ける。AG は GD の2倍。" },
  "MC-CENTROID-HALF": { name: "重心を中線の中点（ちょうど半分の位置）と思う", blame: null, tip: "重心は中線の真ん中ではなく、頂点から 2/3 の位置。" },
  "MC-CENTROID-NO-DIV3": { name: "重心の座標で、3でわり忘れる（または2でわる）", blame: "avg_calc", tip: "重心の座標は3つの頂点の座標の平均＝合計÷3。" },
  "MC-BISECTOR-SWAP": { name: "角の二等分線の比で、対応する辺を逆にする", blame: "ratio_eq", tip: "BD:DC＝AB:AC。B の側の線分には B をふくむ辺 AB が対応する。" },
  "MC-BISECTOR-MIDPOINT": { name: "角の二等分線は対辺の中点を通ると思う", blame: null, tip: "二等辺三角形でないかぎり、角の二等分線は対辺を等しくは分けない。" },
  "MC-BISECTOR-EXTERNAL": { name: "外角の二等分線（外分）を、内角の二等分線（内分）と同じように計算する", blame: null, tip: "外角の二等分線は対辺を AB:AC に「外分」する。点は辺の延長上にある。" },
  "MC-CEVA-ORDER": { name: "チェバ・メネラウスの定理で、比をかける順番（一周の向き）を誤る", blame: null, tip: "頂点→分点→頂点 と三角形を一周する順に、比を分数にしてかける。" },
  "MC-RATIO-REVERSE": { name: "求めた比を逆の順に答える", blame: "ratio_basic", tip: "「AR:RB」なら A の側を先に書く。" },
  "MC-CYCLIC-EQUAL": { name: "円に内接する四角形の向かい合う角が等しいと思う（和が 180° を使えない）", blame: "circle_angle", tip: "向かい合う角の円周角が見込む弧をたすと円1周（360°）なので、角の和は 180°。" },
  "MC-CYCLIC-EXTERIOR": { name: "内接四角形の外角と、となりの内角の対角（内対角）の関係を誤る", blame: "parallel_angle", tip: "外角＝180°−となりの内角＝向かい合う内角。" },
  "MC-TANGENT-CHORD-SIDE": { name: "接弦定理で、反対側の弧に対する角と取りちがえる", blame: "circle_angle", tip: "接線と弦のつくる角の「内側にある弧」に対する円周角と等しい。" },
  "MC-TANGENT-CHORD-DOUBLE": { name: "接弦定理で、角を2倍（中心角）にしてしまう", blame: "circle_angle", tip: "接線と弦のつくる角は、円周角と等しい（中心角ではない）。" },
  "MC-POWER-PAIRING": { name: "方べきの定理で、かけ合わせる線分の組み合わせを誤る", blame: null, tip: "同じ直線上の2つの線分（P から両端まで）をかける：PA·PB＝PC·PD。" },
  "MC-POWER-SEGMENT": { name: "方べきの定理で、P から測った長さでなく弦の長さを使う", blame: null, tip: "P の外から引いた直線では、PB＝PA＋AB。どちらも P から測る。" },
  "MC-POWER-TANGENT": { name: "接線の方べきの定理で、PT を2乗しない（または2乗したまま答える）", blame: "sqrt_meaning", tip: "PT²＝PA·PB。PT は平方根をとる。" },
  "MC-POLY-EDGE-DOUBLE": { name: "多面体の辺の数で、1本の辺が2つの面で共有されていることを考えない", blame: null, tip: "面ごとに数えた辺の合計を 2 でわる。" },
  "MC-POLY-VERTEX-SHARED": { name: "多面体の頂点の数で、1つの頂点にいくつの面が集まるかを考えない", blame: null, tip: "面ごとに数えた頂点の合計を、1つの頂点に集まる面の数でわる。" },
  "MC-EULER-SIGN": { name: "オイラーの多面体定理（v−e＋f＝2）の符号や定数を誤る", blame: null, tip: "立方体（8−12＋6＝2）で式を確かめてから使う。" },
  "MC-SKEW-PARALLEL": { name: "平行な直線を「ねじれの位置」と取りちがえる", blame: null, tip: "ねじれの位置は「平行でもなく、交わりもしない」。まず平行かどうかを見る。" },
  "MC-SKEW-INTERSECT": { name: "空間で交わる（または延長すると交わる）直線を「ねじれの位置」と取りちがえる", blame: null, tip: "同じ平面上にある2直線は、平行でなければ交わる。同じ面にのっているかを見る。" },
  "MC-PERP-SKEW-MISS": { name: "ねじれの位置でも垂直になる（2直線のなす角が 90°）ことを見落とす／垂直でないものを選ぶ", blame: null, tip: "ねじれの位置の2直線は、一方を平行移動して交わらせたときの角で垂直かどうかを判断する。" },

  // ── データの分析・仮説検定の考え方（数Ⅰ） ──
  "MC-COV-NO-DIVIDE": { name: "共分散で、偏差の積の和をデータの個数でわり忘れる", blame: "avg_calc", tip: "共分散は偏差の積の「平均」。和をデータの個数でわる。" },
  "MC-COV-RAW": { name: "共分散で、偏差ではなく値そのものをかける", blame: "variance_sd", tip: "先に平均値をひいて偏差にしてから、x と y の偏差をかける。" },
  "MC-COV-SCALE": { name: "変量を定数倍したときの共分散の変化を誤る", blame: null, tip: "u＝ax＋b、v＝cy＋d なら、共分散は ac 倍（足した定数は関係ない）。" },
  "MC-COV-SHIFT": { name: "変量に足した定数が共分散に影響すると思う", blame: null, tip: "定数を足しても偏差は変わらないので、共分散も変わらない。" },
  "MC-CORR-COV": { name: "相関係数と共分散を取りちがえる", blame: null, tip: "相関係数は、共分散を「x の標準偏差 × y の標準偏差」でわったもの（−1〜1 の値）。" },
  "MC-CORR-NO-SQRT": { name: "相関係数の分母で、平方根をとり忘れる（分散のままわる）", blame: "sqrt_meaning", tip: "分母は標準偏差の積＝√(偏差の2乗の和) の積。" },
  "MC-CORR-SIGN": { name: "相関の正負（右上がり・右下がり）を取りちがえる", blame: null, tip: "右上がりの分布は正の相関、右下がりは負の相関。" },
  "MC-CORR-STRENGTH": { name: "相関の強さ（点の集まり方）を読み誤る", blame: null, tip: "点が直線の近くに集まるほど相関は強く、相関係数の絶対値は 1 に近い。" },
  "MC-CORR-SCALE": { name: "変量を定数倍すると相関係数も定数倍されると思う", blame: null, tip: "相関係数は単位によらない。定数倍で変わるのは符号（負の数をかけたとき）だけ。" },
  "MC-CORR-CAUSE": { name: "相関があれば、原因と結果の関係（因果関係）があると思う", blame: null, tip: "相関は「一緒に変わる傾向」。別の原因がある場合や偶然の場合もある。" },
  "MC-HYPO-TAIL-EQUAL": { name: "「〜以上」の割合で、境目の値の度数をふくめ忘れる", blame: "freq_table", tip: "「15回以上」は 15 回もふくむ。" },
  "MC-HYPO-TAIL-ONLY": { name: "「〜以上」の割合なのに、その値ちょうどの度数だけで考える", blame: "freq_table", tip: "その値と、それより大きいすべての値の度数をたす。" },
  "MC-HYPO-TAIL-SIDE": { name: "調べるべき側（大きい側・小さい側、片側・両側）を取りちがえる", blame: null, tip: "主張したいこと（表が出やすい など）に合わせて、極端な側の割合を調べる。" },
  "MC-HYPO-REVERSE": { name: "基準（5%）との大小から出す結論を逆にする", blame: null, tip: "起こる割合が基準より「小さい」ときに、仮定を否定する（主張が正しいと判断する）。" },
  "MC-HYPO-ACCEPT": { name: "仮定を否定できないとき、「仮定が正しい」と結論してしまう", blame: null, tip: "否定できないときは「どちらともいえない（判断できない）」。仮定が正しいと証明されたわけではない。" },

  // ── いろいろな式（数Ⅱ） ──
  "MC-FRACEXP-CANCEL-TERMS": { name: "分数式で、因数ではなく項どうしを約分してしまう", blame: "frac_reduce", tip: "約分できるのは、分子・分母を因数分解したときの「かけ算の因数」だけ。" },
  "MC-FRACEXP-WRONG-FACTOR": { name: "分数式で、約分する因数を取りちがえる", blame: "factor_formula", tip: "分子・分母を因数分解して、両方に共通な因数を線で消す。" },
  "MC-FRACEXP-INVERT": { name: "分数式の分子と分母を逆にしてしまう", blame: null, tip: "どちらが分子（上）かを確かめながら約分する。" },
  "MC-FRACEXP-DIV-NO-INVERT": { name: "分数式のわり算で、わる式の分子・分母を入れかえずにかける", blame: "frac_div", tip: "わり算は、わる式の逆数（分母と分子を入れかえたもの）をかける。" },
  "MC-FRACEXP-ADD-DENOM": { name: "分数式のたし算で、分母どうし・分子どうしをたしてしまう", blame: "frac_add_unlike", tip: "分母をそろえて（通分して）から、分子だけをたす。" },
  "MC-FRACEXP-CROSS": { name: "通分するとき、分子にかける式を取りちがえる（または、かけ忘れる）", blame: "frac_add_unlike", tip: "分子には、自分の分母にない方の因数をかける。" },
  "MC-FRACEXP-SUB-SIGN": { name: "分数式のひき算で、ひく式の分子の符号を一部だけ変える", blame: "poly_addsub", tip: "ひく式の分子全体にかっこをつけてから計算する。" },
  "MC-IDENTITY-SWAP": { name: "恒等式で、どの係数どうしを比べるか（対応）を取りちがえる", blame: null, tip: "同じ次数の項（x², x, 定数項）どうしの係数を比べる。" },
  "MC-IDENTITY-SIGN": { name: "恒等式の計算で、展開や代入の符号を誤る", blame: "expand_formula", tip: "(x−h)² を展開したときの −2hx の符号や、代入する値の符号に注意。" },
  "MC-IDENTITY-SUBST": { name: "係数の和などを求めるとき、代入する値（x＝1、−1）の使い方を誤る", blame: "lit_evaluate", tip: "係数の和は x＝1 を代入した値。偶数次・奇数次は f(1) と f(−1) を組み合わせる。" },
  "MC-AMGM-NO-2": { name: "相加平均・相乗平均の関係で、2 をかけ忘れる（a＋b ≧ √(ab) としてしまう）", blame: null, tip: "a＋b ≧ 2√(ab)。平均の形 (a＋b)/2 ≧ √(ab) から 2 をかける。" },
  "MC-AMGM-NO-SQRT": { name: "相加平均・相乗平均の関係で、平方根をとり忘れる", blame: "sqrt_meaning", tip: "積 ab の「平方根」の 2 倍。" },
  "MC-AMGM-SHIFT": { name: "式を変形したときに出る定数を、最後に足し忘れる／ずらす", blame: null, tip: "x＋k/(x−c)＝(x−c)＋k/(x−c)＋c のように、足した分・引いた分をもどす。" },
  "MC-AMGM-EQUALITY": { name: "相加平均・相乗平均の関係を別々に使い、等号が同時に成り立たないことを見落とす", blame: null, tip: "等号の条件がそろうか確かめる。そろわないときは、展開してから1回だけ使う。" },
  "MC-AMGM-COEF": { name: "相加平均・相乗平均の関係を使うとき、係数を落とす", blame: null, tip: "ax と b/x の積は ab。係数もふくめてかける。" },
  "MC-AMGM-VALUE-X": { name: "最小値と、最小になるときの x の値を取りちがえる", blame: null, tip: "何を聞かれているか（値か、そのときの x か）を確かめる。" },

  // ── 図形と方程式（数Ⅱ） ──
  "MC-LOCUS-PERP": { name: "2点から等距離の点の軌跡を、2点を通る直線と取りちがえる（垂直でなく平行な傾き）", blame: "coord_line", tip: "等距離の点の集まりは、線分の中点を通り、線分に垂直な直線（傾きの積が −1）。" },
  "MC-LOCUS-SIGN": { name: "軌跡の式を整理するとき、符号を誤る", blame: "expand_formula", tip: "展開した後、移項の符号をひとつずつ確かめる。" },
  "MC-LOCUS-RATIO": { name: "距離の比の条件を、式にするときに逆にする（または中点と考える）", blame: null, tip: "AP:BP＝k:1 なら AP＝k·BP、両辺を2乗して AP²＝k²·BP²。" },
  "MC-LOCUS-RADIUS": { name: "円の方程式の右辺（r²）を、そのまま半径と答える", blame: "coord_circle", tip: "(x−a)²＋(y−b)²＝r² の右辺は半径の2乗。" },
  "MC-LOCUS-MIDPOINT": { name: "中点の軌跡で、中心や半径を半分にし忘れる", blame: null, tip: "中点は「平均」。中心も半径も、もとの円と定点との関係から半分になる。" },
  "MC-LOCUS-VERTEX": { name: "頂点の座標を求めるとき、平方完成で出る −t² を落とす", blame: "quad_vertex", tip: "x²−2tx＝(x−t)²−t²。頂点の y 座標は −t² をふくむ。" },
  "MC-REGION-VERTEX": { name: "領域での最大・最小を、頂点を全部調べずに1つの頂点だけで決める", blame: null, tip: "直線 px＋qy＝k を平行に動かし、領域の頂点の値をすべて比べる。" },
  "MC-REGION-SIDE": { name: "不等式が表す領域の「上側・下側」「内部・外部」を取りちがえる", blame: "ineq_linear", tip: "y＞f(x) は上側、x²＋y²＜r² は内部。領域内の1点を代入して確かめる。" },
  "MC-REGION-SLOPE": { name: "境界線の式（傾き）を読み誤る", blame: "linear_eq", tip: "境界の直線が通る2点から、傾きと切片を確かめる。" },
  "MC-REGION-RADIUS": { name: "円の不等式で、右辺を r² でなく r にする", blame: "coord_circle", tip: "半径 r の円は x²＋y²＝r²。" },
  "MC-REGION-CIRCLE": { name: "円の領域での最大・最小を、x・y をそれぞれ半径にして計算する", blame: null, tip: "ax＋by＝k が円と接するときを考える（原点との距離が半径）。" },
  "MC-DIGITS-NO-PLUS1": { name: "常用対数から桁数を求めるとき、1 をたし忘れる（または位置を1つずらす）", blame: "log_calc", tip: "10^k は k＋1 桁。10^k ≦ N ＜ 10^(k＋1) なら N は k＋1 桁。" },
  "MC-DIGITS-ROUND": { name: "常用対数の値を四捨五入して桁数を決める", blame: "log_calc", tip: "整数部分（切り捨て）で決める。0.9 でも切り上げない。" },

  // ── 数列（数B） ──
  "MC-SEQDIFF-UPTO": { name: "階差数列の和を、n−1 項目までではなく n 項目までとってしまう", blame: "seq_sigma", tip: "a_n＝a₁＋(b₁＋…＋b_{n−1})。n 項目の値は、n−1 回の差をたしたもの。" },
  "MC-SEQDIFF-A1": { name: "階差数列から一般項を求めるとき、初項 a₁ をたし忘れる", blame: null, tip: "差の合計は「a₁ からどれだけ増えたか」。最後に a₁ をたす。" },
  "MC-SEQDIFF-SUM": { name: "階差の和を計算するとき、和の公式（Σk や等比数列の和）の使い方を誤る", blame: "seq_sigma", tip: "Σ_{k=1}^{n−1} k＝(n−1)n/2、等比数列の和は a(rⁿ−1)/(r−1)。上端が n−1 であることにも注意。" },
  "MC-SEQDIFF-TYPE": { name: "階差数列の形を見ずに、もとの数列を等差・等比数列とみてしまう", blame: "seq_arith", tip: "となりどうしの差を並べて、その差の規則を先に見つける。" },
  "MC-SN-AS-AN": { name: "和 S_n の値を、そのまま第 n 項 a_n と答える", blame: null, tip: "a_n＝S_n−S_{n−1}（n≧2）。S_n は初項から第 n 項までの合計。" },
  "MC-SN-A1-TRAP": { name: "S_n から求めた a_n の式を、n＝1 のときにもそのまま使う", blame: null, tip: "a₁＝S₁ は別に求め、n≧2 の式と一致するか確かめる。" },
  "MC-INDUCT-SUBST": { name: "n＝k＋1 のときの式で、n をすべて k＋1 に置きかえていない", blame: "lit_evaluate", tip: "式の中の n を1つ残らず (k＋1) に置きかえ、かっこをつけて整理する。" },
  "MC-INDUCT-TERM": { name: "n＝k＋1 のときに加わる項（第 k＋1 項）を誤る", blame: "seq_sigma", tip: "Σ の上端が k から k＋1 に増えると、i＝k＋1 の項が1つ加わる。" },
  "MC-INDUCT-CIRCULAR": { name: "これから示したい n＝k＋1 の式を、途中で使ってしまう", blame: null, tip: "使ってよいのは n＝k の仮定だけ。n＝k＋1 の式は、最後にたどり着く目標。" },
  "MC-INDUCT-START": { name: "数学的帰納法の出発点を、最初に成り立つ値だけで決める", blame: null, tip: "その値から先で「ずっと」成り立つかを確かめる（途中で成り立たない値がないか）。" },

  // ── 統計的な推測（数B） ──
  "MC-VAR-FORMULA": { name: "分散の公式 V(X)＝E(X²)−{E(X)}² で、2乗や引き算を落とす", blame: "variance_sd", tip: "E(X²) から、期待値の2乗 {E(X)}² をひく。" },
  "MC-VAR-MEAN": { name: "分散（ちらばり）を、期待値（平均）と取りちがえる", blame: "expected_value", tip: "期待値は中心、分散は中心からのはなれぐあい。" },
  "MC-VAR-LINEAR-A": { name: "V(aX＋b) を aV(X) とする（a を2乗しない）", blame: null, tip: "偏差が a 倍になるので、偏差の2乗の平均（分散）は a² 倍。" },
  "MC-VAR-ADD-B": { name: "期待値・分散の変換で、定数 b の扱いを誤る", blame: null, tip: "E(aX＋b)＝aE(X)＋b。分散・標準偏差には b は影響しない。" },
  "MC-VAR-DIFF": { name: "独立な確率変数の差の分散を、ひき算で求める", blame: null, tip: "V(X−Y)＝V(X)＋V(Y)。ちらばりは打ち消し合わない。" },
  "MC-BINOM-MEAN-VAR": { name: "二項分布の期待値 np と分散 np(1−p) を取りちがえる", blame: null, tip: "期待値 np、分散 np(1−p)、標準偏差 √{np(1−p)}。" },
  "MC-BINOM-VAR-P2": { name: "二項分布の分散を np² や n(1−p)² とする", blame: null, tip: "分散は np(1−p)＝n×(成功の確率)×(失敗の確率)。" },
  "MC-BINOM-SD": { name: "二項分布の標準偏差で、分散の平方根をとり忘れる", blame: "sqrt_meaning", tip: "σ(X)＝√V(X)＝√{np(1−p)}。" },
  "MC-BINOM-PARAM": { name: "二項分布 B(n, p) の n と p（回数と確率）を取りちがえる", blame: null, tip: "n は試行の回数、p は1回の試行で成功する確率。" },
  "MC-NORMAL-TAIL": { name: "正規分布表の値（0 から z までの確率）を、そのまま端の確率とする", blame: null, tip: "P(Z≧z)＝0.5−P(0≦Z≦z)。表の値は 0 から z までの面積。" },
  "MC-NORMAL-SIDE": { name: "正規分布の確率で、0 をはさむ区間とはさまない区間の計算を取りちがえる", blame: null, tip: "0 をはさむならたす、同じ側ならひく。図にかいて面積で考える。" },
  "MC-ESTIMATE-NO-SQRTN": { name: "信頼区間で、σ を √n でわり忘れる", blame: null, tip: "標本平均の標準偏差は σ/√n。" },
  "MC-ESTIMATE-N-NOT-SQRT": { name: "信頼区間で、σ を √n ではなく n でわる", blame: "sqrt_meaning", tip: "わるのは √n。n＝400 なら 20 でわる。" },
  "MC-ESTIMATE-WRONG-Z": { name: "信頼度と係数（95%→1.96、99%→2.58）の対応を誤る", blame: null, tip: "信頼度 95% は 1.96。信頼度を上げると区間は広くなる。" },
  "MC-ESTIMATE-HALF": { name: "信頼区間の幅と、その半分（片側の長さ）を取りちがえる", blame: null, tip: "幅は（上の端）−（下の端）＝2×1.96×σ/√n。" },
  "MC-ESTIMATE-SIZE": { name: "標本の大きさと区間の幅の関係（幅は √n に反比例）を誤る", blame: "sqrt_meaning", tip: "幅を半分にするには、n を 4 倍にする。" },
  "MC-ESTIMATE-POP": { name: "信頼区間を、母集団の値の 95% が入る範囲と考える", blame: null, tip: "信頼区間は「母平均」を推定する区間。個々の値の範囲ではない。" },
  "MC-ESTIMATE-SAMPLE": { name: "信頼区間を、標本の値（標本平均）が入る範囲と考える", blame: null, tip: "区間を作る方法をくり返すと、95% の区間が母平均をふくむ、という意味。" },
  "MC-HTEST-SD": { name: "検定統計量 Z を求めるとき、標準偏差ではなく分散や n でわる", blame: null, tip: "Z＝(X−平均)÷標準偏差。標準偏差は √{np(1−p)} や σ/√n。" },
  "MC-HTEST-ZCALC": { name: "検定統計量 Z の符号（平均との差の向き）を誤る", blame: null, tip: "Z＝(観測した値 − 帰無仮説のもとでの平均)÷標準偏差。" },
  "MC-DIGITS-LEAD": { name: "最高位の数字を、対数の小数部分と log 1〜log 9 を比べずに決める", blame: "log_calc", tip: "小数部分が log a 以上 log(a＋1) 未満なら、最高位の数字は a。" },

  // ── ベクトル（数C） ──
  "MC-DIVIDE-EXTERNAL": { name: "外分点を、内分点と同じ式で計算する（n を −n にしない）", blame: null, tip: "m:n に外分する点は (−n·A＋m·B)/(m−n)。内分の式の n を −n にかえる。" },
  "MC-VECTOR-INTERSECT": { name: "交点の位置ベクトルを、2通りの表し方の係数を比べずに見当で決める", blame: "simul_add", tip: "交点を2本の線分それぞれの上の点として2通りに表し、a と b の係数を比べて連立方程式を解く。" },
  "MC-VEC-NORM-COEF": { name: "|ka|² を k|a|² とする（係数を2乗しない）", blame: null, tip: "|ka|＝|k||a| なので、2乗すると k²|a|²。" },
  "MC-SPACE-COMPONENT": { name: "空間の距離・大きさで、z 成分を落として平面の公式のまま計算する", blame: "pythagorean_apps", tip: "空間では √(x²＋y²＋z²)。3つの成分すべての2乗をたす。" },
  "MC-SPACE-SYMMETRY": { name: "空間の対称点で、符号を変える成分を取りちがえる", blame: "coord_basic", tip: "xy 平面に関して対称なら z だけ、x 軸に関して対称なら y と z の符号が変わる。" },

  // ── 2次曲線（数C） ──
  "MC-CONIC-PARABOLA-P": { name: "放物線 y²＝4px の p を、係数そのもの（4p）やその半分と取りちがえる", blame: null, tip: "y²＝8x なら 4p＝8 で p＝2。焦点は (2, 0)。" },
  "MC-CONIC-DIRECTRIX": { name: "放物線の準線の位置（焦点と原点をはさんで反対側）や、準線までの距離を誤る", blame: null, tip: "焦点 (p, 0) なら準線は x＝−p。曲線上の点から焦点までの距離＝準線までの距離。" },
  "MC-CONIC-AXIS": { name: "焦点や長軸が、x 軸・y 軸のどちらの上にあるかを取りちがえる", blame: null, tip: "楕円は分母の大きい方の軸の上に焦点がある。双曲線は右辺が 1 なら x 軸上、−1 なら y 軸上。" },
  "MC-CONIC-ELLIPSE-HYPER": { name: "楕円と双曲線の式や焦点の公式（c²＝a²−b² と c²＝a²＋b²）を取りちがえる", blame: null, tip: "楕円は「距離の和が一定」で c²＝a²−b²、双曲線は「距離の差が一定」で c²＝a²＋b²。" },
  "MC-CONIC-VERTEX-FOCUS": { name: "頂点（軸の端）と焦点を取りちがえる", blame: null, tip: "焦点は頂点とは別の点。楕円では頂点より内側、双曲線では頂点より外側にある。" },
  "MC-CONIC-ASYMPTOTE": { name: "双曲線の漸近線の傾き b/a を a/b とする", blame: null, tip: "x²/a²−y²/b²＝1 の右辺を 0 にすると y＝±(b/a)x。" },
  "MC-CONIC-2A": { name: "焦点からの距離の和（差）を、2a でなく a や別の長さにする", blame: null, tip: "楕円上の点では PF＋PF′＝2a（長軸の長さ）、双曲線では |PF−PF′|＝2a。" },

  // ── 媒介変数表示・極座標（数C） ──
  "MC-PARAM-SUBST": { name: "媒介変数を消去するとき、t や cosθ を x・y で表す式の符号・移項を誤る", blame: "lit_eq_solve", tip: "x＝t＋2 なら t＝x−2。求めた式を y の式に、かっこごと代入する。" },
  "MC-PARAM-PYTH": { name: "cos²θ＋sin²θ＝1 などに持ちこむときに、2乗し忘れたり、たし算をひき算にしたりする", blame: "trig_radian", tip: "cosθ＝x/a、sinθ＝y/b をそれぞれ2乗してたすと 1 になる。" },
  "MC-POLAR-XY": { name: "極座標と直交座標の変換で、x＝r cosθ・y＝r sinθ の対応や r のかけ忘れを誤る", blame: "trig_radian", tip: "x は cos（横）、y は sin（縦）。どちらも r 倍する。" },
  "MC-ARG-QUADRANT": { name: "偏角（θ）を、点がどの象限にあるかを考えずに基準の角のまま答える", blame: "trig_radian", tip: "まず点を図にかき、どの象限にあるかを確かめてから角を決める。" },
  "MC-ARG-RANGE": { name: "偏角を、指定された範囲（0≦θ＜2π など）に直さずに答える", blame: "trig_radian", tip: "−π/3 は 5π/3 と同じ向き。範囲に合わせて 2π をたす・ひく。" },
  "MC-POLAR-CIRCLE-HALF": { name: "極方程式 r＝2a cosθ＋2b sinθ の円の中心を (2a, 2b) とする（半分にしない）", blame: "coord_circle", tip: "両辺に r をかけて x²＋y²＝2ax＋2by、平方完成すると中心は (a, b)。" },

  // ── 複素数平面（数C） ──
  "MC-CPOLAR-RULE": { name: "複素数の積・商で、絶対値と偏角の計算のきまりを取りちがえる", blame: null, tip: "積は「絶対値はかける・偏角はたす」、商は「絶対値はわる・偏角はひく」。" },
  "MC-CPOLAR-ARG-ORDER": { name: "商 z₁/z₂ の偏角や絶対値で、ひく順・わる順を逆にする", blame: null, tip: "z₁/z₂ の偏角は (z₁ の偏角)−(z₂ の偏角)、絶対値は |z₁|÷|z₂|。" },
  "MC-DEMOIVRE-R": { name: "ド・モアブルの定理で、絶対値 r の n 乗を忘れる（または n 倍にする）", blame: "exp_law", tip: "{r(cosθ＋i sinθ)}ⁿ＝rⁿ(cos nθ＋i sin nθ)。絶対値は n 乗、偏角は n 倍。" },
  "MC-ROT-DIR": { name: "回転の向き（正の向き＝反時計まわり）を逆にする", blame: "trig_radian", tip: "i をかけると反時計まわりに π/2 回転、−i をかけると時計まわり。" },
  "MC-ROT-CENTER": { name: "原点以外の点を中心とする回転で、中心を引いてから回し、たしてもどす手順を落とす", blame: null, tip: "中心 c のまわりの回転は w−c＝(回転を表す数)×(z−c)。" },
  "MC-CPLANE-MAXMIN": { name: "円周上の点と原点の距離の最大・最小で、中心までの距離と半径の足し引きを誤る", blame: "coord_circle", tip: "最大は（中心までの距離）＋（半径）、最小は |（中心までの距離）−（半径）|。" },

  // ── 数学Ⅲ：関数 ──
  "MC-ASYMPTOTE-SIGN": { name: "漸近線 x＝p の符号を逆にする（x−p を見て x＝−p とする）", blame: "quad_vertex", tip: "分母が 0 になる x が縦の漸近線。x−3 なら x＝3。" },
  "MC-ASYMPTOTE-RATIO": { name: "分数関数の横の漸近線を、x の係数どうしの比以外（定数項の比など）で求める", blame: null, tip: "y＝(ax＋b)/(cx＋d) は、x が大きいとき a/c に近づく。分子を分母でわって確かめる。" },
  "MC-ASYMPTOTE-OBLIQUE": { name: "斜めの漸近線（y＝ax＋b）を見落とす・定数だけにする", blame: null, tip: "分子の次数が分母より1高いときは、わり算の商 ax＋b が斜めの漸近線になる。" },
  "MC-INVERSE-EVAL": { name: "逆関数の値 f⁻¹(k) を、f(k) と取りちがえる", blame: "lit_evaluate", tip: "f⁻¹(k) は「f(x)＝k となる x」。方程式を解いて求める。" },
  "MC-INVERSE-RECIP": { name: "逆関数 f⁻¹(x) を逆数 1/f(x) と考える", blame: null, tip: "f⁻¹ の −1 は「逆向きの対応」の記号で、−1 乗（逆数）ではない。" },
  "MC-COMPOSE-ORDER": { name: "合成関数 (g∘f)(x)＝g(f(x)) の順番を逆にする", blame: null, tip: "(g∘f)(x) は、先に f、あとで g。右側の関数から順に計算する。" },
  "MC-IRR-EXTRANEOUS": { name: "無理方程式で、2乗して出てきた解を元の式で確かめない（または確かめを誤る）", blame: null, tip: "2乗すると解が増えることがある。√ の側は 0 以上なので、反対側も 0 以上かを確かめる。" },
  "MC-IRR-SQUARE": { name: "√ をはずすときに、反対側を2乗し忘れる", blame: "sqrt_meaning", tip: "√A＝B なら A＝B²（B≧0）。両辺を2乗する。" },

  // ── 数学Ⅲ：微分 ──
  "MC-DYDX-INVERT": { name: "dy/dx を dx/dy（逆数）と取りちがえる", blame: null, tip: "dy/dx は「x が少し変わったときの y の変化の割合」。(dy/dt)÷(dx/dt) の順。" },
  "MC-DYDX-PART": { name: "媒介変数表示の微分で、dy/dt（または dx/dt）のまま答える", blame: null, tip: "dy/dx＝(dy/dt)÷(dx/dt)。両方を求めてからわる。" },
  "MC-HIGHER-ORDER": { name: "第 n 次導関数で、微分する回数を取りちがえる（1回だけ・1回足りない）", blame: null, tip: "f″ は2回、f‴ は3回微分する。1回ごとに式を書いて数える。" },
  "MC-NORMAL-TANGENT": { name: "法線（接線に垂直な直線）を求める場面で、接線を答える", blame: null, tip: "法線の傾きは −1÷(接線の傾き)。接点を通ることは同じ。" },
  "MC-INFLECT-STATIONARY": { name: "変曲点を f′(x)＝0 の点（極値の点）と取りちがえる", blame: null, tip: "変曲点は f″(x) の符号が変わる点（グラフの曲がり方が変わる点）。極値は f′ で調べる。" },
  "MC-CONCAVE-DIR": { name: "上に凸・下に凸と f″ の符号の対応を逆にする", blame: null, tip: "f″＞0 で下に凸（お椀の形）、f″＜0 で上に凸。" },
  "MC-MOTION-LEVEL": { name: "位置・速度・加速度を取りちがえる（微分する回数を誤る）", blame: null, tip: "位置を1回微分すると速度、2回微分すると加速度。" },
  "MC-ROOTCOUNT-GRAPH": { name: "方程式の実数解の個数を、グラフと直線の共有点の数として正しく数えられない", blame: "deriv_extrema", tip: "f(x)＝k の解の個数は、y＝f(x) のグラフと直線 y＝k の共有点の数。極値や近づく値と k を比べる。" },

  // ── 数学Ⅲ：積分 ──
  "MC-RIEMANN-RANGE": { name: "区分求積法で、積分する区間（k の範囲から決まる端）を誤る", blame: "seq_sigma", tip: "x＝k/n とおき、k の最初と最後で x がいくつになるかを調べて区間の端にする。" },
  "MC-RIEMANN-ENDPOINT": { name: "区分求積で、区間の端の値だけを使って答える（積分しない）", blame: "integ_basic", tip: "(1/n)Σf(k/n) は長方形の面積の和。n→∞ で ∫f(x)dx（面積）になる。" },
  "MC-RIEMANN-FORM": { name: "区分求積で、和を (1/n)Σf(k/n) の形に直すときに式を誤る", blame: null, tip: "1/n を1つくくり出し、残りを k/n だけの式にする。n が残っていたら変形の途中。" },
  "MC-VOLUME-NO-SQUARE": { name: "回転体の体積で、y を2乗し忘れる（π∫y dx とする）", blame: null, tip: "切り口は半径 y の円なので、面積は πy²。V＝π∫y²dx。" },
  "MC-VOLUME-WASHER": { name: "2曲線ではさまれた部分の回転体を、差の2乗 π∫(f−g)²dx で計算する", blame: null, tip: "くりぬいた形なので、π∫(f²−g²)dx（2乗の差）。" },
  "MC-VOLUME-AXIS": { name: "回転の軸（x 軸・y 軸）を取りちがえて体積を計算する", blame: null, tip: "x 軸のまわりなら π∫y²dx、y 軸のまわりなら π∫x²dy。" },
  "MC-SYMMETRY-FACTOR": { name: "対称性を使って一部分だけ計算したあと、何倍かするのを忘れる", blame: null, tip: "半分だけ計算したら 2 倍、4 分の 1 なら 4 倍。どこを計算したかを図で確かめる。" },
  "MC-ARCLEN-FORMULA": { name: "曲線の長さの公式 ∫√(1＋(y′)²)dx を正しく使えない（√ や 1 を落とす、高さの差にする）", blame: null, tip: "小さな直角三角形の斜辺 √(dx²＋dy²) を足し合わせる、と考える。" },
  "MC-DISTANCE-DISPLACEMENT": { name: "道のり（動いた距離の合計）を、位置の変化（∫v dt）と取りちがえる", blame: null, tip: "道のりは ∫|v|dt。向きが変わるところで区間を分け、それぞれ正の値にしてたす。" },
};
