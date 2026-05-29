// ── 機制：數值衍生 ───────────────────────────────────────────
// 把「永久技能地圖節點」+「局內技能等級」換算成實際戰鬥數值。
// 這是數值面板與戰鬥共用的單一真相來源。
import { sumBonus } from "../data/skillTree.js";
import { CFG, WORLD } from "../data/tuning.js";
import { ENEMIES } from "../data/enemies.js";

export function derive(nodes, skill) {
  const G = (k) => sumBonus(nodes, k);
  const dmgM = 1 + G("dmgM");
  const rateM = Math.max(0.3, 1 + G("rateM"));
  const hpM = Math.max(0.3, 1 + G("hpM"));
  const goldM = 1 + G("goldM");
  const glass = (nodes.A_glass || 0) >= 1;
  const overload = (nodes.A_overload || 0) >= 1;

  let fireRate = (1.1 + skill.rate * 0.12) * rateM;
  let damage = (13 + skill.dmg * 5) * dmgM;
  // 過載核心：攻速越高，傷害加成越大。
  if (overload) damage *= 1 + Math.max(0, fireRate - 1.5) * 0.15;

  return {
    damage, fireRate,
    rangeBonus: skill.range,
    rangeFlat: G("rangeFlat"),
    maxHp: (100 + skill.hp * 30) * hpM,
    regen: skill.regen * 1.4 + G("regen") + CFG.baseRegen,
    armor: glass ? 0 : skill.armor * 1.5 + G("armor"),
    multishot: 1 + G("multishot"),
    pierce: 1 + skill.pierce + G("pierce"),
    thorns: G("thorns"),
    splash: skill.splash * 0.12 + G("splash"),
    bulletSpeed: WORLD.bulletSpd * (1 + skill.bspd * 0.3),
    splashRadius: WORLD.splashR * (1 + skill.splashR * 0.25),
    critChance: skill.crit * 0.05 + G("critC"),
    orbs: G("orbs"),
    gemYield: 1 + G("gem"),
    goldMult: goldM,
    lifesteal: G("lifesteal"),
    takeDmgMult: 1 + G("takeDmg"),
    glass,
    fortress: (nodes.D_fortress || 0) >= 1,
    immortal: (nodes.D_immortal || 0) >= 1,
  };
}

// 暴擊倍率：固定 1.5×（爆擊就 ×1.5，否則 ×1）。
export const CRIT_MULT = 1.5;

// 某波次、某難度下，指定敵人的實際屬性（給敵人數值面板用）。
export function enemyStatsAt(type, wave, diff) {
  const t = ENEMIES[type];
  const hpS = Math.pow(CFG.hpScaleBase, wave - 1) * diff.ehp;
  const atkS = Math.pow(CFG.atkScaleBase, wave - 1) * diff.edmg;
  const defS = Math.pow(CFG.defScaleBase, wave - 1);
  const spdS = Math.pow(CFG.spdScaleBase, wave - 1);
  return { hp: t.hp * hpS, atk: t.atk * atkS, def: t.def * defS, spd: t.spd * spdS };
}
