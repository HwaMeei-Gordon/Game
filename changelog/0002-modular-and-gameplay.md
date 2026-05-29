# 0002 · 模組化重構 + 玩法強化 + GitHub Pages 部署

- 日期：2026-05-29

## 摘要
把單檔遊戲拆成「各司其職」的模組，並依需求方回饋強化玩法與畫面，補上完整設計文件與變更紀錄。

## 架構（模組化）
- `data/`：difficulty、tuning、enemies、weapons、skills、skillTree（純資料）。
- `engine/`：stats（數值衍生/敵人波次數值）、save（進度代碼）、game（生成/傷害/擊殺）、update（每幀模擬/主動技能）。
- `render/`：shapes、draw（畫布繪製）。
- `components/`：Menu、Hud、GameScreen、WeaponBar、AbilityBar、SkillBar、SkillMap、StatsPanel、EnemyPanel、CodesOverlay、Icon、widgets。
- `App.jsx`：協調者（ref/狀態/迴圈/彈窗）；`main.jsx`：入口。

## 玩法強化
- **明確傷害公式**：實際傷害 = max(1, 攻擊 − 防禦)，暴擊固定 1.5×；玩家與敵人雙向通用；持續傷害以每秒值減防後 ×dt。
- **更大的戰場**：生成半徑 2.8→4.0，敵人從更遠處湧入，視野調整讓整個生成環可見。
- **技能地圖升級**：節點更多（約 44 個）、座標拉開、連線依狀態著色、選取節點高亮子節點「預覽下一步」、可點亮節點發光虛線提示。
- **數值面板**：基礎值 → 目前值對照（含理論 DPS），標示提升/下降。
- **敵人圖鑑/波次面板**：可選波次與難度，查看各敵人實際數值與「我的實傷」。
- **AOE 特效可視化**：濺射/追蹤爆炸/新星/冰霜等以擴張光環呈現範圍。
- **畫面精緻化**：背景與敵人徑向漸層、外發光、塔脈動與旋轉護環。
- **滑動修正**：彈出面板加入 `overscroll-behavior: contain` 等，改善往上滑卡住。
- **彈窗即暫停**：開啟面板時自動暫停模擬。

## 部署
- `deploy.yml` 加入 `actions/configure-pages@v5 (enablement: true)`，首次部署自動開啟 Pages。

## 文件
- 新增 `DESIGN.md`（完整機制/數值/存檔/架構/需求方期望與路線圖）。
- 新增 `changelog/` 變更紀錄區（一筆一檔）。

## 影響範圍
- `src/App.jsx` 由單檔改為協調者；存檔版本碼提升為 `3`（舊代碼不相容）。
