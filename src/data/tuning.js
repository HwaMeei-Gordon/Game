// ── 資料：數值調校常數 ───────────────────────────────────────
// 全域的成長曲線與世界尺寸常數，集中在這裡方便平衡。

// 波次成長：每往後一波，敵人屬性以下列底數做指數成長。
export const CFG = {
  hpScaleBase: 1.16,   // 血量成長
  atkScaleBase: 1.07,  // 攻擊成長
  defScaleBase: 1.04,  // 防禦成長
  spdScaleBase: 1.012, // 移動速度成長（微幅）
  spdScaleCap: 1.9,    // 移速成長上限（避免後期快到無法反應）
  baseRegen: 1.0,      // 塔的基礎回血
  countBase: 3,        // 每波敵人數量基底
  countSlope: 0.6,     // 每波 +0.6 敵人（微幅）
  countCap: 22,        // 每波敵人數量上限
  waveGoldBase: 10,    // 過波獎勵金幣基底
  waveGoldSlope: 5,    // 每波 +5 金幣
};

// 世界尺寸（單位為抽象世界座標，渲染時再依畫面大小縮放）。
// v4 調整：戰場放大，敵人從更遠處生成、往中心靠近。
export const WORLD = {
  spawnR: 4.0,        // 敵人生成半徑（比舊版 2.8 大，戰場更開闊）
  tower: 0.12,        // 塔半徑
  bulletHit: 0.04,    // 子彈命中判定半徑
  rangeBase: 1.0,     // 基礎射程
  rangeStep: 0.1,     // 每級射程
  rangeMax: 1.95,     // 射程上限
  bulletSpd: 1.05,    // 子彈基礎速度（已較舊版減慢 75%，靠「彈速」技能加回）
  orbR: 0.36,         // 無人機環繞半徑
  orbDpsF: 0.8,       // 無人機 DPS 係數（× 塔傷害）
  novaPush: 0.6,      // 新星擊退距離
  thornsBand: 0.16,   // 荊棘灼燒生效的環帶寬度
  flameRange: 0.85,   // 火焰射程
  splashR: 0.26,      // 濺射半徑
  viewDiv: 4.2,       // 視野除數：越大畫面看到的範圍越廣（讓整個生成環可見）
};

export const DEFAULT_ZOOM = 1.0;
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 3.0;
