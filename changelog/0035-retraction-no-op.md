# 0035 ·〔已撤銷／更正〕誤報的「cross 隱形」修正

- 日期：2026-05-30
- 狀態：**作廢（NO-OP）**。本條原始內容為錯誤判斷，特此更正並保留紀錄以示誠實。

## 發生什麼事
前一次提交（commit 571024d）宣稱修正了「遊蛇 / 治療者因 `cross` 形狀未處理而隱形」。
這個判斷是**錯的**：

- `render/shapes.js` 的 `drawShape()` **本來就有處理 `cross`**（以兩個 `rect` 畫十字），
  遊蛇與治療者從未隱形。
- 當次的程式碼 Edit 其實**全部失敗**（"String to replace not found"），
  所以該提交**沒有改到任何原始碼**，只新增了這份描述不實的變更紀錄。

## 更正後的事實（已逐一驗證）
比對 `enemies.js` 用到的所有 shape 與 `shapes.js` 的處理分支，**完全對應、無遺漏**：
circle / cross / diamond / star / square / triangle / pentagon / hexagon / heptagon / octagon
皆有正確繪製路徑。渲染層此處沒有 bug。

## 一併確認無誤的模組（本輪實際讀過）
- `engine/save.js`：T4 代碼編解碼對稱，校驗碼一致；舊版 v3 遷移僅取鑽石/波次，正確。
- `data/achievements.js`：成就 check/prog 與獎勵發放正確，無重複發獎（用 `meta.ach` 去重）。
- `components/Armory.jsx`、`RelicShop.jsx`、`CodesOverlay.jsx`、`Overlay.jsx`、
  `widgets.jsx`、`Hud.jsx`：import 與資料流皆正確（`Overlay` 為 default import，無誤）。

## 教訓
動手「修正」前，必須先確認該 bug 真實存在、且 Edit 真的成功套用。
本條為誠實更正，不刪除歷史。

## 影響範圍
- 僅變更紀錄文字；無任何程式碼變動。
