// ============================================================
// index.js — ikkan の空間図形（全15時）を、コツコツくんの問題テンプレートにしたもの（まとめ）
//   UNITS   … 単元（1授業＝1単元。id は J1-kk01〜J1-kk15）。コツコツくんの src/solo/content の UNITS と同じ形
//   SKIPPED … 移さなかった ikkan の問題（問題ID と理由）
//   つなぎ方は README.md
// ============================================================
import { UNITS as U01, SKIPPED as S01 } from "./content/kukan-01.js";
import { UNITS as U02, SKIPPED as S02 } from "./content/kukan-02.js";
import { UNITS as U03, SKIPPED as S03 } from "./content/kukan-03.js";
import { UNITS as U04, SKIPPED as S04 } from "./content/kukan-04.js";
import { UNITS as U05, SKIPPED as S05 } from "./content/kukan-05.js";
import { UNITS as U06, SKIPPED as S06 } from "./content/kukan-06.js";
import { UNITS as U07, SKIPPED as S07 } from "./content/kukan-07.js";
import { UNITS as U08, SKIPPED as S08 } from "./content/kukan-08.js";
import { UNITS as U09, SKIPPED as S09 } from "./content/kukan-09.js";
import { UNITS as U10, SKIPPED as S10 } from "./content/kukan-10.js";
import { UNITS as U11, SKIPPED as S11 } from "./content/kukan-11.js";
import { UNITS as U12, SKIPPED as S12 } from "./content/kukan-12.js";
import { UNITS as U13, SKIPPED as S13 } from "./content/kukan-13.js";
import { UNITS as U14, SKIPPED as S14 } from "./content/kukan-14.js";
import { UNITS as U15, SKIPPED as S15 } from "./content/kukan-15.js";

export const UNITS = [
  ...U01, ...U02, ...U03, ...U04, ...U05, ...U06, ...U07, ...U08, ...U09, ...U10, ...U11, ...U12, ...U13, ...U14, ...U15,
];

export const SKIPPED = [
  ...S01, ...S02, ...S03, ...S04, ...S05, ...S06, ...S07, ...S08, ...S09, ...S10, ...S11, ...S12, ...S13, ...S14, ...S15,
];
