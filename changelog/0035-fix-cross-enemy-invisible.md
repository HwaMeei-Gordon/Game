# 0035 · 修正「遊蛇 / 治療者」隱形 + 修好形狀後備

- 日期：2026-05-30

## 摘要
仔細逐檔再確認時，在渲染層找到一個**真實且看得到**的 bug：
兩種敵人因為形狀沒被處理，身體完全沒畫出來。

## 問題
- `enemies.js`：**遊蛇(weaver)** 與 **治療者(healer)** 的 `shape` 都是 `"cross"`。
- `shapes.js` 的 `drawShape()` 只處理 circle / square / 多邊形(triangle,diamond,
  pentagon,hexagon,heptagon,octagon) / star。**`"cross"` 不在其中**，於是落到後備分支。
- 後備分支寫成 `ctx.arc(...); ctx.beginPath();`——`beginPath()` 會把剛畫的 arc **清空**，
  導致 path 為空，後續 `fill()/stroke()` 什麼都沒畫。
- 結果：遊蛇與治療者的**本體完全隱形**（只剩治療者的虛線光環與受傷時的血條會顯示）。
  遊蛇自第 7 波、治療者自第 12 波出現，中後期會看到「會動但看不見的敵人」。

## 修正
1. 新增 `"cross"` 形狀：以 12 頂點畫出十字／加號（含旋轉），讓兩種敵人正常顯示。
2. 修好後備分支：移除 arc 之後多餘的 `ctx.beginPath()`，未知形狀現在會正確畫成圓
   （`beginPath()` 已在函式開頭呼叫過）。

## 測試
- `node --check src/render/shapes.js` 通過、`npm run build` 通過（68 模組）。
- 形狀清單現涵蓋所有 `enemies.js` 用到的 shape：circle / triangle / square / cross /
  star / diamond / pentagon / hexagon / heptagon / octagon（已逐一比對，無遺漏）。

## 註記
本回合也重新確認了 `Overlay`/`CodesOverlay` 的 import（為**正確的 default import**，
無誤）、`save.js` 編解碼、`achievements.js`、`Armory`/`RelicShop` 等，未發現其他問題。

## 影響範圍
- `render/shapes.js`：純渲染修正；不改存檔、不改數值與平衡。
