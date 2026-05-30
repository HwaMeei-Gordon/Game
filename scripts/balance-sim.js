// Headless 平衡模擬：用真正的戰鬥引擎 stepGame，搭配「自動買最便宜可負擔升級」的 AI，
// 量測各情境能撐到第幾波。純邏輯（不含 DOM）。執行： node scripts/balance-sim.js
import { derive } from "../src/engine/stats.js";
import { createRun } from "../src/engine/game.js";
import { stepGame } from "../src/engine/update.js";
import { createSkill, ITEMS, WEAPON_CATS, DEF_ITEMS, weaponItemCost, globalItemCost } from "../src/data/skills.js";
import { BASE_TREE, WEAPON_TREE, unlockedWeapons } from "../src/data/skillTree.js";

const io = { addDiamonds() {}, reportWave() {}, reportSurvival() {} };

function makeMeta(opts = {}) {
  const m = { diamonds: 0, bestWave: 1, bestKills: 0, nodes: {}, weaponsOwned: {}, weaponBase: {}, relicsOwned: {}, relicEquipped: null, stats: { kills: 0, runs: 0 }, ach: {} };
  if (opts.allWeapons) for (const w of ["homing", "laser", "chain", "flame", "shard"]) m.weaponsOwned[w] = 1;
  if (opts.fullTree) {
    for (const n of BASE_TREE) m.nodes[n.id] = 1;
    for (const wk in WEAPON_TREE) for (const n of WEAPON_TREE[wk]) m.nodes[n.id] = 1;
  }
  if (opts.relic) m.relicEquipped = opts.relic;
  return m;
}

// 真人式專精買法：依優先序買（防禦打底 + 專精主武 + 次要武器點綴）
const PRI = [
  ["global", "hp"], ["cannon", "dmg"], ["global", "armor"], ["cannon", "multi"], ["cannon", "rate"],
  ["cannon", "crit"], ["global", "hp"], ["cannon", "splash"], ["cannon", "pierce"], ["global", "regen"],
  ["cannon", "bspd"], ["cannon", "wrange"], ["global", "hp"], ["global", "armor"],
  ["laser", "dmg"], ["laser", "ltick"], ["laser", "lamp"], ["homing", "dmg"], ["homing", "multi"],
  ["chain", "dmg"], ["chain", "bounce"], ["flame", "dmg"], ["flame", "frange"], ["shard", "dmg"], ["shard", "shards"],
];
function isAvail(meta, target, key) {
  if (target === "global") return DEF_ITEMS.includes(key);
  if (!unlockedWeapons(meta).includes(target)) return false;
  const c = WEAPON_CATS[target]; return c && (c.atk.includes(key) || c.sp.includes(key));
}
function costOf(skill, target, key) { return target === "global" ? globalItemCost(skill, key) : weaponItemCost(skill, key === undefined ? key : target, key); }
function lvlOf(skill, target, key) { return target === "global" ? (skill.global[key] || 0) : ((skill.weapons[target] && skill.weapons[target][key]) || 0); }
// 專精標準彈的高效玩家：在「全域防禦 + 標準彈攻擊/特殊」中買最便宜可負擔者，
// 其餘武器維持基礎輸出（同時開火）。給穩定一致的基準。
function autoBuy(g, meta, skill) {
  const set = [];
  for (const k of DEF_ITEMS) set.push(["global", k]);
  for (const k of [...WEAPON_CATS.cannon.atk, ...WEAPON_CATS.cannon.sp]) set.push(["cannon", k]);
  let bought = false;
  for (let guard = 0; guard < 400; guard++) {
    let best = null, bestCost = Infinity;
    for (const [target, key] of set) {
      const def = ITEMS[key]; if (def.cap && lvlOf(skill, target, key) >= def.cap) continue;
      const c = target === "global" ? globalItemCost(skill, key) : weaponItemCost(skill, target, key);
      if (c < bestCost && c <= g.gold) { bestCost = c; best = [target, key]; }
    }
    if (!best) break;
    if (best[0] === "global") skill.global[best[1]] = (skill.global[best[1]] || 0) + 1;
    else skill.weapons[best[0]][best[1]] = (skill.weapons[best[0]][best[1]] || 0) + 1;
    g.gold -= bestCost; bought = true;
  }
  return bought;
}

function simRun(meta, diff = "normal", verbose = false) {
  const skill = createSkill();
  let s = derive(meta, skill);
  const g = createRun(diff, s, { mode: "classic" });
  const weapons = unlockedWeapons(meta);
  const dt = 1 / 30; let buyT = 0;
  for (let frame = 0; frame < 30 * 700 && !g.gameOver; frame++) {
    stepGame(g, s, dt, weapons, io);
    g.sounds.length = 0;
    buyT += dt;
    if (buyT >= 0.4) {
      buyT = 0;
      if (autoBuy(g, meta, skill)) {
        s = derive(meta, skill);
        const nm = s.maxHp; g.hp = Math.min(nm, g.hp + Math.max(0, nm - g.maxHp)); g.maxHp = nm;
      }
    }
  }
  if (verbose) {
    const types = {}; for (const e of g.enemies) types[e.type] = (types[e.type] || 0) + 1;
    const dps = {}; for (const wk in g.wdmg) dps[wk] = Math.round(g.wdmg[wk] / Math.max(1, g.t));
    console.log(`  死於第 ${g.wave} 波 · maxHp ${Math.round(g.maxHp)} · 場上敵人 ${g.enemies.length} ${JSON.stringify(types)} · 平均DPS ${JSON.stringify(dps)} · 標準彈射程 ${s.weapons.cannon.range.toFixed(2)}`);
  }
  return g.wave;
}

function trials(label, meta, n = 7) {
  const res = [];
  for (let i = 0; i < n; i++) res.push(simRun(meta));
  res.sort((a, b) => a - b);
  const med = res[Math.floor(n / 2)];
  const avg = (res.reduce((a, b) => a + b, 0) / n).toFixed(1);
  console.log(`${label.padEnd(34)} 中位 ${String(med).padStart(3)} 波 · 平均 ${avg} · 範圍 ${res[0]}-${res[n - 1]}`);
}

console.log("=== THE TOWER 平衡模擬（普通難度，自動買升級）===");
console.log("[診斷] 全永久樹單局：");
simRun(makeMeta({ allWeapons: true, fullTree: true }), "normal", true);
console.log("[診斷] 首玩單局：");
simRun(makeMeta(), "normal", true);
trials("A 首玩（只有標準彈）", makeMeta());
trials("B 解鎖全武器（無永久樹）", makeMeta({ allWeapons: true }));
trials("C 全武器+全永久樹", makeMeta({ allWeapons: true, fullTree: true }));
trials("D 全投入+力量核心道具", makeMeta({ allWeapons: true, fullTree: true, relic: "power" }));
