// ── 機制：數值衍生 ───────────────────────────────────────────
// 把「永久技能地圖節點」+「局內技能等級」換算成實際戰鬥數值。
// 這是數值面板與戰鬥共用的單一真相來源。
import { sumBonus } from "../data/skillTree.js";
import { CFG, WORLD } from "../data/tuning.js";
import { ENEMIES } from "../data/enemies.js";
import { WEAPONS } from "../data/weapons.js";

// 由「永久技能地圖節點」+「局內升級（全域 + 各武器）」換算出實際數值。
// 回傳：全域(塔)數值，以及每把武器各自的戰鬥數值 out.weapons[wk]。
export function derive(nodes, skill) {
  const G = (k) => sumBonus(nodes, k);
  const dmgM = 1 + G("dmgM");
  const rateM = Math.max(0.3, 1 + G("rateM"));
  const hpM = Math.max(0.3, 1 + G("hpM"));
  const goldM = 1 + G("goldM");
  const glass = (nodes.A_glass || 0) >= 1;
  const overload = (nodes.A_overload || 0) >= 1;
  const gl = (skill && skill.global) || {};

  const out = {
    maxHp: (100 + (gl.hp || 0) * 30) * hpM,
    regen: (gl.regen || 0) * 1.4 + G("regen") + CFG.baseRegen,
    armor: glass ? 0 : (gl.armor || 0) * 1.5 + G("armor"),
    rangeBonus: (gl.range || 0),
    rangeFlat: G("rangeFlat"),
    critChance: (gl.crit || 0) * 0.05 + G("critC"),
    thorns: G("thorns"),
    orbs: G("orbs"),
    gemYield: 1 + G("gem"),
    goldMult: goldM,
    lifesteal: G("lifesteal"),
    takeDmgMult: 1 + G("takeDmg"),
    glass,
    fortress: (nodes.D_fortress || 0) >= 1,
    immortal: (nodes.D_immortal || 0) >= 1,
    weapons: {},
  };

  for (const wk in WEAPONS) {
    const wp = WEAPONS[wk];
    const ws = (skill && skill.weapons && skill.weapons[wk]) || {};
    let damage = (13 + (ws.dmg || 0) * 5) * dmgM * wp.dmgF;
    const fireRate = wp.cont ? 0 : (1.1 + (ws.rate || 0) * 0.12) * rateM * wp.rateF;
    if (overload && fireRate > 0) damage *= 1 + Math.max(0, fireRate - 1.5) * 0.15;
    out.weapons[wk] = {
      damage, fireRate,
      multishot: 1 + (ws.multi || 0) + G("multishot"),
      pierce: 1 + (ws.pierce || 0) + G("pierce"),
      splash: (ws.splash || 0) * 0.12 + G("splash"),
      bounces: 3 + (ws.bounce || 0),
      flameRange: WORLD.flameRange * (1 + (ws.frange || 0) * 0.12),
      bulletSpeed: WORLD.bulletSpd * (1 + (ws.bspd || 0) * 0.3),
      splashRadius: WORLD.splashR,
    };
  }
  // 軌道無人機/新星等以「標準彈傷害」作為代表傷害。
  out.damage = out.weapons.cannon ? out.weapons.cannon.damage : 13 * dmgM;
  return out;
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
