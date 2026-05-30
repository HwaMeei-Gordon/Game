# 0020 · 成就 / 里程碑系統

- 日期：2026-05-29

## 摘要
新增成就系統：達成里程碑自動發放鑽石，給長期目標感與探索獎勵（呼應 onboarding/retention 研究的 achievements & progress tracking）。

## 細項
- `data/achievements.js`：9 個成就（波次 5/10/20/30、累計擊殺 500/5000、解鎖全武器、生存擊殺 100、遊玩 20 場），各含 check 與進度。
- 終身統計：`meta.stats {kills, runs}`、已解鎖 `meta.ach`；結算時 `processAchievements` 更新統計、檢查新解鎖並發鑽石。
- `AchievementsOverlay` + 主選單「🏆 成就」：清單含進度條與獎勵；結算畫面跳出本局新解鎖。
- 存檔（JSON 自動存檔 + 進度代碼）納入 stats/ach。

## 影響範圍
- 不破壞舊存檔（缺欄位自動補預設）。
