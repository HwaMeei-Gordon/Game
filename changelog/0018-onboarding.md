# 0018 · 新手引導（首次遊玩漸進提示）+ 主選單說明

- 日期：2026-05-29

## 摘要
依 onboarding 最佳實務（漸進式、一次一則、簡短、在遊戲中學），首次遊玩時底部一次跳一則提示，看完即不再出現；主選單新增「說明」可隨時回看。

## 細項
- `data/tips.js`：4 則簡短提示（同時開火/升級、長按看說明、縮放與倍速、死後用鑽石永久強化）。
- `App.jsx`：首次開局顯示漸進提示（`thetower_onboarded` 旗標），點一下換下一則、看完設旗標。
- `GameScreen.jsx`：底部非阻擋式提示卡，點擊前進。
- `HelpOverlay.jsx` + 主選單「❔ 說明」：完整提示與傷害公式速查。

## 設計參考
- 行動遊戲 onboarding：progressive disclosure、tooltip < 140 字、learn-by-doing。

## 影響範圍
- 純引導/UI；不影響數值或存檔。
