# 0010 · 多武器系統大改版（同時開火 · 各武器分開加點 · 跨武器漲價）

- 日期：2026-05-29

## 摘要
重做局內升級系統：所有已解鎖武器同時開火；每把武器各自獨立加點；同一升級項在不同武器間「漲價耦合」；不同武器有不同可升項目（雷射無穿透等）；防禦/範圍/暴擊改為全域。進度（鑽石/技能地圖/紀錄）保留。

## 細項
- **同時開火**：`stepGame(g, s, dt, weapons[], io)` 對每把已啟用武器各自開火；專案投射物各自有 `g.fireCd[wk]`、各自的傷害/攻速/多重/穿透/濺射/彈速/彈射。
- **數值換算**：`derive` 回傳全域數值 + `out.weapons[wk]`（每把武器的戰鬥數值，含節點全域加成）。
- **局內升級**（`data/skills.js`）：`ITEMS` 主表 + `GLOBAL_ITEMS`（hp/regen/armor/range/crit）+ `WEAPON_ITEMS`（各武器不同項目）。
  - `weaponItemCost` 以「跨所有武器的該項目總等級」指數漲價（A 升某項，B 同項變貴）；`globalItemCost` 以自身等級漲價。
- **介面**：新增 `UpgradeBar`（全域 + 各已啟用武器分頁、長按看說明、顯示漲價提示）取代原武器切換列與三分頁升級列；移除 `WeaponBar`、`SkillBar`。
- **數值面板**：改列各武器目前傷害/DPS + 全域 基礎→目前。
- **渲染**：`draw` 改吃武器陣列；火焰範圍圈在火焰啟用時顯示，射程虛線圈恆顯示。
- 子彈攜帶自身 `spd/pierce/splash/splashR/bounces`；`chainHit` 用 `b.bounces`；追蹤彈以 `b.spd` 轉向。

## 影響範圍
- 局內升級結構全面改變（不影響存檔，局內升級本就不持久化）；移除 `TREE/ZERO_SKILL/findSkill/skillCost`，新增 `ITEMS/GLOBAL_ITEMS/WEAPON_ITEMS/createSkill/...`。
