# 0001 · 建立可運行的 Vite 專案骨架與遊戲基線

- 日期：2026-05-29

## 摘要
把原本單一檔案的 React 塔防遊戲，整理成可 `npm run dev/build` 的 Vite 專案，並加入 GitHub Pages 自動部署設定。

## 細項
- 新增 `package.json`、`vite.config.js`（base 相對路徑）、`index.html`、`src/main.jsx`。
- 新增 `.github/workflows/deploy.yml`：push 到 `main` 自動 build 並發佈 Pages。
- 新增 `.gitignore`、`README.md`。
- 遊戲先以單檔形式置於 `src/App.jsx`，確保可玩。

## 影響範圍
- 專案結構初始化，尚未拆分模組。
