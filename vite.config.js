import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Vite の設定。
// base は GitHub Pages のリポジトリ名と完全一致させる（公開URL github.io/ここ/）。
// リポジトリ名: math-dialogue → base: "/math-dialogue/"
// ※ ここがズレると公開時に真っ白になる。リポジトリ名を変えたらここも直すこと。
//
// ページは2つ：
//   index.html      … 数学ラボ（ゲーム・対話授業）
//   solo/index.html … 数学ラボ ソロ（小1〜高3の一人で学ぶ習熟アプリ）→ 公開URL …/math-dialogue/solo/
export default defineConfig({
  base: "/math-dialogue/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        solo: resolve(__dirname, "solo/index.html"),
      },
    },
  },
});
