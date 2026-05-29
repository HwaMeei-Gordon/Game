// ── 資料：武器定義 ───────────────────────────────────────────
// dmgF / rateF：相對標準彈的傷害、射速倍率。
// cont：是否為持續性武器（雷射、火焰），否則為發射型（彈丸）。
export const WEAPONS = {
  cannon: { name: "標準彈", icon: "cannon", dmgF: 1.0,  rateF: 1.0,  cont: false,
    desc: "直線發射，可多重射擊與穿透。隨「多重/穿透」成長最猛，全能基礎武器。" },
  homing: { name: "追蹤彈", icon: "homing", dmgF: 0.85, rateF: 0.85, cont: false,
    desc: "自動轉向追蹤，命中後小範圍爆炸，幾乎不落空。剋高速衝刺者與螺旋遊蛇，射速略慢。" },
  laser:  { name: "雷射",   icon: "laser",  dmgF: 1.54, rateF: 1.0,  cont: true,
    desc: "持續鎖定光束，單體 DPS 最高（+54%）。專剋重甲與首領，清群弱。" },
  chain:  { name: "折射激光", icon: "chain", dmgF: 0.7, rateF: 0.9,  cont: false,
    desc: "命中後在鄰近敵人間彈射（最多 4 跳、傷害遞減）。清群神器，單體偏弱。" },
  flame:  { name: "火焰",   icon: "flame",  dmgF: 0.61, rateF: 1.0,  cont: true,
    desc: "塔周圍短射程範圍持續灼燒，可同時燒多隻。近身清場強，但射程短、要放敵人靠近。" },
};
export const DEFAULT_WEAPON = "cannon";
