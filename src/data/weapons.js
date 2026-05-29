// ── 資料：武器定義（每把武器根本性差異） ────────────────────
// dmgF/rateF：相對標準彈的傷害、射速倍率。
// rangeF：射程倍率（每把武器看得遠近不同）。spd：子彈速度倍率（投射型）。
// cont：是否為持續性武器（雷射、火焰）。special：該武器的核心特性（文字）。
export const WEAPONS = {
  cannon: { name: "標準彈", icon: "cannon", dmgF: 1.0,  rateF: 1.0,  rangeF: 1.0,  spd: 1.6, cont: false, special: "穿透",
    desc: "直線高速彈，特性為穿透：可貫穿多名敵人。中庸全能。" },
  homing: { name: "追蹤彈", icon: "homing", dmgF: 0.85, rateF: 0.8,  rangeF: 1.25, spd: 1.0, cont: false, special: "追蹤爆破",
    desc: "射程最遠、自動追蹤，命中小範圍爆破。剋高速與螺旋，射速較慢。" },
  laser:  { name: "雷射",   icon: "laser",  dmgF: 1.7,  rateF: 1.0,  rangeF: 1.1,  spd: 1,   cont: true,  special: "持續高 DPS",
    desc: "持續鎖定光束，單體 DPS 最高。專剋重甲與首領，清群弱。" },
  chain:  { name: "折射激光", icon: "chain", dmgF: 0.7, rateF: 0.9,  rangeF: 0.9,  spd: 1.3, cont: false, special: "彈射",
    desc: "命中後在鄰近敵人間彈射（傷害遞減）。射程較短，清群神器。" },
  flame:  { name: "火焰",   icon: "flame",  dmgF: 0.55, rateF: 1.0,  rangeF: 1.0,  spd: 1,   cont: true,  special: "近身範圍",
    desc: "塔周圍範圍持續灼燒，同時燒多隻。射程短需放敵人逼近，近身清場強。" },
};
export const DEFAULT_WEAPON = "cannon";
