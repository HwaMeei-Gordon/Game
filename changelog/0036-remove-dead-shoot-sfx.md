# 0036 · 移除唯一一處死碼：未被觸發的 shoot 音效

- 日期：2026-05-30

## 摘要
把剩餘還沒稽核的模組全部讀過一遍，並用腳本做客觀檢查（未解析的 import、
未使用的具名 import、未被引用的 export）。只找到**一處真正的死碼**並移除。

## 客觀檢查結果
- **所有本地 import 都解析得到對應檔案** ✓（腳本掃描全 `src`）。
- **沒有未使用的具名 import** ✓。
- 「疑似未使用的 export」13 個候選，**逐一人工確認後，12 個皆為誤報**：
  - `skills.js` 的 `WEAPON_ITEMS / CLASS_MULT / attackTotal / globalTotal` → 在
    `skills.js` 內部被使用（成本計算）。
  - `game.js` 的 `spawnMini` → 分裂體死亡時內部呼叫。
  - `audio.js` 的 `setTrack/resume/setSfx/setBgm/getSfx/getBgm` → 透過
    `import * as audio` 命名空間使用。
  - `weapons.js` `DEFAULT_WEAPON`、`styles.js` `card` → 合理的公開預設/設計 token，保留。

## 唯一的真死碼
- `engine/audio.js` 的 `SFX.shoot`：定義了開火音效，但**全專案沒有任何地方觸發它**
  （`g.sounds.push("shoot")` / `audio.play("shoot")` 皆為 0 處）。
- 成因：多武器系統後所有武器每幀開火，逐發播放開火音會變成噪音轟炸，因此實際上
  從未呼叫此音效。屬於早期遺留、無法到達的程式碼。
- 處置：移除該定義（一行）。其餘 10 個音效（kill/bosskill/hurt/upgrade/buy/ability/
  wave/boss/gameover/click）皆有實際觸發點，保留。

## 測試
- `grep` 確認移除後無殘留引用；`node --check` 通過；`npm run build` 通過。

## 影響範圍
- `engine/audio.js`：移除一行死碼；不影響任何現有音效、不改存檔與平衡。
