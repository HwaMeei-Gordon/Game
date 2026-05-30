// Headless 平衡模擬：用真正的戰鬥引擎 stepGame + 自動買升級 AI，量各情境/策略能撐到第幾波。
// 純邏輯（不含 DOM）。執行： node scripts/balance-sim.js
import { derive } from "../src/engine/stats.js";
import { createRun } from "../src/engine/game.js";
import { stepGame } from "../src/engine/update.js";
import { createSkill, ITEMS, WEAPON_CATS, DEF_ITEMS, globalItemCost, weaponItemCost } from "../src/data/skills.js";
import { BASE_TREE, WEAPON_TREE, unlockedWeapons } from "../src/data/skillTree.js";

const io = { addDiamonds() {}, reportWave() {}, reportSurvival() {} };

function makeMeta(opts = {}) {
  const m = { diamonds: 0, bestWave: 1, bestKills: 0, nodes: {}, weaponsOwned: {}, weaponBase: {}, relicsOwned: {}, relicEquipped: null, stats: { kills: 0, runs: 0 }, ach: {} };
  if (opts.allWeapons) for (const w of ["homing", "laser", "chain", "flame", "shard"]) m.weaponsOwned[w] = 1;
  if (opts.fullTree) { for (const n of BASE_TREE) m.nodes[n.id] = 1; for (const wk in WEAPON_TREE) for (const n of WEAPON_TREE[wk]) m.nodes[n.id] = 1; }
  if (opts.relic) m.relicEquipped = opts.relic;
  return m;
}
const lvlOf = (skill, t, k) => (t === "global" ? (skill.global[k] || 0) : ((skill.weapons[t] && skill.weapons[t][k]) || 0));

// 在「全域防禦 + 指定要投資的武器」中，貪婪買最便宜可負擔者（高效專精玩家）。
function autoBuy(g, meta, skill, buyWeapons) {
  const set = [];
  for (const k of DEF_ITEMS) set.push(["global", k]);
  for (const wk of buyWeapons) { const c = WEAPON_CATS[wk]; if (c) for (const k of [...c.atk, ...c.sp]) set.push([wk, k]); }
  let bought = false;
  for (let guard = 0; guard < 600; guard++) {
    let best = null, bestCost = Infinity;
    for (const [t, k] of set) {
      const def = ITEMS[k]; if (def.cap && lvlOf(skill, t, k) >= def.cap) continue;
      const c = t === "global" ? globalItemCost(skill, k) : weaponItemCost(skill, t, k);
      if (c < bestCost && c <= g.gold) { bestCost = c; best = [t, k]; }
    }
    if (!best) break;
    if (best[0] === "global") skill.global[best[1]] = (skill.global[best[1]] || 0) + 1;
    else skill.weapons[best[0]][best[1]] = (skill.weapons[best[0]][best[1]] || 0) + 1;
    g.gold -= bestCost; bought = true;
  }
  return bought;
}

function simRun(meta, diff, buyWeapons) {
  const skill = createSkill();
  let s = derive(meta, skill);
  const g = createRun(diff, s, { mode: "classic" });
  const weapons = unlockedWeapons(meta);
  const dt = 1 / 30; let buyT = 0;
  for (let frame = 0; frame < 30 * 900 && !g.gameOver; frame++) {
    stepGame(g, s, dt, weapons, io);
    g.sounds.length = 0;
    buyT += dt;
    if (buyT >= 0.4) { buyT = 0; if (autoBuy(g, meta, skill, buyWeapons)) { s = derive(meta, skill); const nm = s.maxHp; g.hp = Math.min(nm, g.hp + Math.max(0, nm - g.maxHp)); g.maxHp = nm; } }
  }
  return g.wave;
}

function med(meta, diff, buyWeapons, n = 7) {
  const r = []; for (let i = 0; i < n; i++) r.push(simRun(meta, diff, buyWeapons));
  r.sort((a, b) => a - b); return r[Math.floor(n / 2)];
}

function row(label, meta, diff = "normal") {
  const uw = unlockedWeapons(meta);
  const inter = (arr) => arr.filter((w) => uw.includes(w)); // 只投資已解鎖武器
  const focus = med(meta, diff, ["cannon"]);
  const dual = med(meta, diff, inter(["cannon", "laser"]));
  const multi = med(meta, diff, uw);
  console.log(`${label.padEnd(30)} 專精 ${String(focus).padStart(3)} · 雙修 ${String(dual).padStart(3)} · 多武器 ${String(multi).padStart(3)} 波`);
}

console.log("=== THE TOWER 平衡模擬 v2（中位波次；多策略對照）===");
console.log("情境                            專精  雙修  多武器");
row("A 首玩（標準彈，普通）", makeMeta());
row("B 全武器無樹（普通）", makeMeta({ allWeapons: true }));
row("C 全武器+全永久樹（普通）", makeMeta({ allWeapons: true, fullTree: true }));
row("D 全投入+力量道具（普通）", makeMeta({ allWeapons: true, fullTree: true, relic: "power" }));
row("E 全投入（困難）", makeMeta({ allWeapons: true, fullTree: true, relic: "power" }), "hard");
row("F 全投入（簡單）", makeMeta({ allWeapons: true, fullTree: true, relic: "power" }), "easy");
