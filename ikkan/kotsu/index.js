// ============================================================
// index.js — ikkan の授業ごとの問題（演習プリント・小テスト）を、コツコツくんの問題テンプレートにしたもの（まとめ）
//   UNITS   … 単元（1授業＝1単元）。コツコツくんの src/solo/content の UNITS と同じ形
//             空間図形（中1・全15時）J1-kk01〜15／データの活用（中1・全11時）J1-dk01〜11／式の計算（中2第1章・全11時）J2-sk01〜11／連立方程式（中2第2章・全13時）J2-rk01〜13
//   SKIPPED … 移さなかった ikkan の問題（問題ID と理由）
//   BY_UNIT … 単元のキー（kukan・data・shiki・renritsu）ごとの { UNITS, SKIPPED }
//   つなぎ方は README.md
// ============================================================
import { UNITS as U_k01, SKIPPED as S_k01 } from "./content/kukan-01.js";
import { UNITS as U_k02, SKIPPED as S_k02 } from "./content/kukan-02.js";
import { UNITS as U_k03, SKIPPED as S_k03 } from "./content/kukan-03.js";
import { UNITS as U_k04, SKIPPED as S_k04 } from "./content/kukan-04.js";
import { UNITS as U_k05, SKIPPED as S_k05 } from "./content/kukan-05.js";
import { UNITS as U_k06, SKIPPED as S_k06 } from "./content/kukan-06.js";
import { UNITS as U_k07, SKIPPED as S_k07 } from "./content/kukan-07.js";
import { UNITS as U_k08, SKIPPED as S_k08 } from "./content/kukan-08.js";
import { UNITS as U_k09, SKIPPED as S_k09 } from "./content/kukan-09.js";
import { UNITS as U_k10, SKIPPED as S_k10 } from "./content/kukan-10.js";
import { UNITS as U_k11, SKIPPED as S_k11 } from "./content/kukan-11.js";
import { UNITS as U_k12, SKIPPED as S_k12 } from "./content/kukan-12.js";
import { UNITS as U_k13, SKIPPED as S_k13 } from "./content/kukan-13.js";
import { UNITS as U_k14, SKIPPED as S_k14 } from "./content/kukan-14.js";
import { UNITS as U_k15, SKIPPED as S_k15 } from "./content/kukan-15.js";
import { UNITS as U_d01, SKIPPED as S_d01 } from "./content/data-01.js";
import { UNITS as U_d02, SKIPPED as S_d02 } from "./content/data-02.js";
import { UNITS as U_d03, SKIPPED as S_d03 } from "./content/data-03.js";
import { UNITS as U_d04, SKIPPED as S_d04 } from "./content/data-04.js";
import { UNITS as U_d05, SKIPPED as S_d05 } from "./content/data-05.js";
import { UNITS as U_d06, SKIPPED as S_d06 } from "./content/data-06.js";
import { UNITS as U_d07, SKIPPED as S_d07 } from "./content/data-07.js";
import { UNITS as U_d08, SKIPPED as S_d08 } from "./content/data-08.js";
import { UNITS as U_d09, SKIPPED as S_d09 } from "./content/data-09.js";
import { UNITS as U_d10, SKIPPED as S_d10 } from "./content/data-10.js";
import { UNITS as U_d11, SKIPPED as S_d11 } from "./content/data-11.js";
import { UNITS as U_s01, SKIPPED as S_s01 } from "./content/shiki-01.js";
import { UNITS as U_s02, SKIPPED as S_s02 } from "./content/shiki-02.js";
import { UNITS as U_s03, SKIPPED as S_s03 } from "./content/shiki-03.js";
import { UNITS as U_s04, SKIPPED as S_s04 } from "./content/shiki-04.js";
import { UNITS as U_s05, SKIPPED as S_s05 } from "./content/shiki-05.js";
import { UNITS as U_s06, SKIPPED as S_s06 } from "./content/shiki-06.js";
import { UNITS as U_s07, SKIPPED as S_s07 } from "./content/shiki-07.js";
import { UNITS as U_s08, SKIPPED as S_s08 } from "./content/shiki-08.js";
import { UNITS as U_s09, SKIPPED as S_s09 } from "./content/shiki-09.js";
import { UNITS as U_s10, SKIPPED as S_s10 } from "./content/shiki-10.js";
import { UNITS as U_s11, SKIPPED as S_s11 } from "./content/shiki-11.js";
import { UNITS as U_r01, SKIPPED as S_r01 } from "./content/renritsu-01.js";
import { UNITS as U_r02, SKIPPED as S_r02 } from "./content/renritsu-02.js";
import { UNITS as U_r03, SKIPPED as S_r03 } from "./content/renritsu-03.js";
import { UNITS as U_r04, SKIPPED as S_r04 } from "./content/renritsu-04.js";
import { UNITS as U_r05, SKIPPED as S_r05 } from "./content/renritsu-05.js";
import { UNITS as U_r06, SKIPPED as S_r06 } from "./content/renritsu-06.js";
import { UNITS as U_r07, SKIPPED as S_r07 } from "./content/renritsu-07.js";
import { UNITS as U_r08, SKIPPED as S_r08 } from "./content/renritsu-08.js";
import { UNITS as U_r09, SKIPPED as S_r09 } from "./content/renritsu-09.js";
import { UNITS as U_r10, SKIPPED as S_r10 } from "./content/renritsu-10.js";
import { UNITS as U_r11, SKIPPED as S_r11 } from "./content/renritsu-11.js";
import { UNITS as U_r12, SKIPPED as S_r12 } from "./content/renritsu-12.js";
import { UNITS as U_r13, SKIPPED as S_r13 } from "./content/renritsu-13.js";

const UNITS_kukan = [...U_k01, ...U_k02, ...U_k03, ...U_k04, ...U_k05, ...U_k06, ...U_k07, ...U_k08, ...U_k09, ...U_k10, ...U_k11, ...U_k12, ...U_k13, ...U_k14, ...U_k15];
const SKIPPED_kukan = [...S_k01, ...S_k02, ...S_k03, ...S_k04, ...S_k05, ...S_k06, ...S_k07, ...S_k08, ...S_k09, ...S_k10, ...S_k11, ...S_k12, ...S_k13, ...S_k14, ...S_k15];
const UNITS_data = [...U_d01, ...U_d02, ...U_d03, ...U_d04, ...U_d05, ...U_d06, ...U_d07, ...U_d08, ...U_d09, ...U_d10, ...U_d11];
const SKIPPED_data = [...S_d01, ...S_d02, ...S_d03, ...S_d04, ...S_d05, ...S_d06, ...S_d07, ...S_d08, ...S_d09, ...S_d10, ...S_d11];
const UNITS_shiki = [...U_s01, ...U_s02, ...U_s03, ...U_s04, ...U_s05, ...U_s06, ...U_s07, ...U_s08, ...U_s09, ...U_s10, ...U_s11];
const SKIPPED_shiki = [...S_s01, ...S_s02, ...S_s03, ...S_s04, ...S_s05, ...S_s06, ...S_s07, ...S_s08, ...S_s09, ...S_s10, ...S_s11];
const UNITS_renritsu = [...U_r01, ...U_r02, ...U_r03, ...U_r04, ...U_r05, ...U_r06, ...U_r07, ...U_r08, ...U_r09, ...U_r10, ...U_r11, ...U_r12, ...U_r13];
const SKIPPED_renritsu = [...S_r01, ...S_r02, ...S_r03, ...S_r04, ...S_r05, ...S_r06, ...S_r07, ...S_r08, ...S_r09, ...S_r10, ...S_r11, ...S_r12, ...S_r13];

export const BY_UNIT = {
  kukan: { UNITS: UNITS_kukan, SKIPPED: SKIPPED_kukan },
  data: { UNITS: UNITS_data, SKIPPED: SKIPPED_data },
  shiki: { UNITS: UNITS_shiki, SKIPPED: SKIPPED_shiki },
  renritsu: { UNITS: UNITS_renritsu, SKIPPED: SKIPPED_renritsu },
};
export const UNITS = [...UNITS_kukan, ...UNITS_data, ...UNITS_shiki, ...UNITS_renritsu];
export const SKIPPED = [...SKIPPED_kukan, ...SKIPPED_data, ...SKIPPED_shiki, ...SKIPPED_renritsu];
