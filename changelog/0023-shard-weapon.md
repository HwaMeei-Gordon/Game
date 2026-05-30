# 0023 · 新武器：分裂彈（命中分裂散射）

- 日期：2026-05-29

## 摘要
新增第 6 把武器「分裂彈」：命中後炸成數片碎片向四周飛散，每片造成傷害；招牌特性為「碎片數」，群戰覆蓋面廣。

## 細項
- `data/weapons.js`：新增 `shard`（dmgF 0.8、spd 1.9、命中分裂）。
- `data/skills.js`：新增 ITEM `shards`（碎片數）；`WEAPON_CATS.shard`（攻：傷害/攻速/彈速/射程；特：碎片/穿透/暴擊）。
- `data/skillTree.js`：武器箱可解鎖（160💎）；新增分裂彈武器樹（傷害暴擊 / 碎片數 / 穿透速射，含招牌「碎片風暴」）。
- `engine/stats.js`：`out.weapons[wk].fragCount`。
- `engine/update.js`：分裂彈命中時依 fragCount 迸出 `frag` 碎片彈（短命、各打一隻）；碎片傷害計入分裂彈統計。
- 成就「軍火庫」更新為解鎖全部 6 種武器。

## 影響範圍
- 新增內容；無死碼（所有 key 皆被消耗）。
