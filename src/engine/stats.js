// ── 機制：數值衍生 ───────────────────────────────────────────
// 由「永久進度 meta」(基礎屬性樹 + 武器箱基礎 + 各武器樹 + 裝備道具)
// 與「局內升級 skill」(全域 + 各武器) 換算出實際數值。
// 回傳：全域(塔)數值，以及每把武器各自的戰鬥數值 out.weapons[wk]。
import { CFG, WORLD } from "../data/tuning.js";
import { ENEMIES } from "../data/enemies.js";
import { WEAPONS } from "../data/weapons.js";
import { BASE_TREE, WEAPON_TREE, treeBonus } from "../data/skillTree.js";
import { RELICS } from "../data/relics.js";

export const CRIT_MULT = 1.5;

export function derive(meta, skill) {
  const N = (meta && meta.nodes) || {};
  const relic = meta && meta.relicEquipped ? RELICS[meta.relicEquipped] : null;
  // 全域加成 = 基礎屬性樹 + 裝備道具
  const Bg = (k) => treeBonus(BASE_TREE, N, k) + (relic && relic.bonus && relic.bonus[k] ? relic.bonus[k] : 0);
  const dmgM = 1 + Bg("dmgM");
  const hpM = Math.max(0.3, 1 + Bg("hpM"));
  const gl = (skill && skill.global) || {};
  const glass = !!(relic && relic.flag === "glass"); // 玻璃大砲：護甲歸零

  const out = {
    maxHp: (100 + (gl.hp || 0) * 30) * hpM,
    regen: (gl.regen || 0) * 1.4 + Bg("regen") + CFG.baseRegen,
    armor: glass ? 0 : (gl.armor || 0) * 1.5 + Bg("armor"),
    rangeBonus: 0,
    rangeFlat: Bg("rangeFlat"),
    critChance: Bg("critC"),
    thorns: Bg("thorns"),
    orbs: Bg("orbs"),
    gemYield: 1 + Bg("gem"),
    goldMult: 1 + Bg("goldM"),
    lifesteal: Bg("lifesteal"),
    takeDmgMult: 1 + Bg("takeDmg"),
    glass,
    fortress: !!(relic && relic.flag === "fortress"),
    immortal: !!(relic && relic.flag === "immortal"),
    weapons: {},
  };

  // 全域基礎射程（各武器再乘自己的 rangeF）
  const baseRange = Math.min(WORLD.rangeMax, WORLD.rangeBase + out.rangeBonus * WORLD.rangeStep) + out.rangeFlat;

  for (const wk in WEAPONS) {
    const wp = WEAPONS[wk];
    const wt = WEAPON_TREE[wk] || [];
    const Wt = (k) => treeBonus(wt, N, k);
    const ab = (meta && meta.weaponBase && meta.weaponBase[wk]) || {};
    const ws = (skill && skill.weapons && skill.weapons[wk]) || {};
    const wDmgM = dmgM * (1 + Wt("dmgM"));
    let damage = (13 + (ab.dmg || 0) * 5 + (ws.dmg || 0) * 5) * wDmgM * wp.dmgF;
    const rateM = 1 + Wt("rateM");
    const fireRate = wp.cont ? 0 : (1.1 + (ab.rate || 0) * 0.08 + (ws.rate || 0) * 0.12) * rateM * wp.rateF;
    const flameRange = WORLD.flameRange * (1 + (ws.frange || 0) * 0.12 + Wt("frange"));
    out.weapons[wk] = {
      damage, fireRate,
      range: wk === "flame" ? flameRange : (baseRange + (ws.wrange || 0) * 0.1) * wp.rangeF, // 各武器射程不同
      critChance: out.critChance + (ws.crit || 0) * 0.05 + Wt("critC"), // 各武器暴擊
      multishot: 1 + (ws.multi || 0) + Wt("multishot"),
      pierce: 1 + (ws.pierce || 0) + Wt("pierce"),
      splash: (ws.splash || 0) * 0.12 + Wt("splash"),
      bounces: 3 + (ws.bounce || 0) + Wt("bounce"),
      flameRange,
      bulletSpeed: WORLD.bulletSpd * wp.spd * (1 + (ws.bspd || 0) * 0.3),
      splashRadius: WORLD.splashR,
      // 雷射：傷害計算頻率（tick 間隔，越小越頻繁）與每跳傷害增幅（局內 + 武器樹）
      tickInterval: Math.max(0.02, 0.12 / (1 + ((ws.ltick || 0) + Wt("ltick")) * 0.4)),
      rampPerTick: 0.001 + ((ws.lamp || 0) + Wt("lamp")) * 0.0015,
      // 折射：擊殺時額外折射數（上限 3）
      maxSplit: Math.min(3, (ws.split || 0) + Wt("split")),
      // 火焰：減速幅度（移速扣除比例）
      flameSlow: Math.min(0.6, ((ws.slow || 0) + Wt("slow")) * 0.12),
      // 分裂彈：命中時迸出的碎片數
      fragCount: 4 + (ws.shards || 0) + Wt("shards"),
    };
  }
  out.range = baseRange; // 代表射程（畫面外圈參考）
  out.damage = out.weapons.cannon ? out.weapons.cannon.damage : 13 * dmgM;
  return out;
}

// 某波次、某難度下，指定敵人的實際屬性（給敵人數值面板用）。
export function enemyStatsAt(type, wave, diff) {
  const t = ENEMIES[type];
  const hpS = Math.pow(CFG.hpScaleBase, wave - 1) * diff.ehp;
  const atkS = Math.pow(CFG.atkScaleBase, wave - 1) * diff.edmg;
  const defS = Math.pow(CFG.defScaleBase, wave - 1);
  const spdS = Math.pow(CFG.spdScaleBase, wave - 1);
  return { hp: t.hp * hpS, atk: t.atk * atkS, def: t.def * defS, spd: t.spd * spdS };
}
