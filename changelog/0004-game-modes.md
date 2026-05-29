# 0004 · 新增遊戲模式：續戰 + 無限生存

- 日期：2026-05-29

## 摘要
除了經典模式，新增「續戰」與「無限生存」兩種模式，開始遊戲時可選（搭配難度）。

## 細項
- `data/modes.js`：定義三種模式與常數 `HEADSTART_OFFSET=10`、`SURVIVAL_SECONDS=300`。
- **續戰 headstart**：從「最佳波次 −10」開始，`cumulativeWaveGold` 先結算前面波次累積金幣，開場即可升級；最佳波次需 > 11 解鎖。
- **無限生存 survival**：以最佳波次的敵人強度持續猛攻 5 分鐘，spawn 隨時間加密、每 20 秒一隻首領，比拼擊殺數。
- `engine/game.js`：`createRun` 接受 `opts(mode/startWave/startGold/survivalStrength)`；`killEnemy` 計入 `g.kills`；新增 `cumulativeWaveGold`。
- `engine/update.js`：`stepGame` 依模式分流（生存獨立生成/計時）；新增 `endRun` 統一結算（死亡或時間到），生存以擊殺數給鑽石。
- `App.jsx`：`newRun(diffKey, mode)`、`io.reportSurvival`、HUD 帶 `mode/timeLeft/kills`、`bestKills` 以獨立 localStorage key 保存。
- 介面：`StartOverlay`（選模式 + 難度）取代原難度彈窗；`Hud` 生存模式顯示倒數計時與擊殺數；`GameScreen` 生存結束顯示「時間到 / 擊殺數 / 最佳」；主選單顯示最佳生存擊殺。

## 影響範圍
- 進度代碼格式不變（版本 `3`）；`bestKills` 不納入代碼，僅存本機。
