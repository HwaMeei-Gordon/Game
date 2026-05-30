// ── 機制：戰鬥核心 ───────────────────────────────────────────
// 遊戲狀態的建立，以及生成、傷害、擊殺、波次等對 g（可變遊戲狀態）的操作。
// 這裡不碰 React、不碰畫布；純資料運算，方便測試與閱讀。
import { DIFF } from "../data/difficulty.js";
import { CFG, WORLD } from "../data/tuning.js";
import { ENEMIES, pickType } from "../data/enemies.js";
import { SURVIVAL_SECONDS } from "../data/modes.js";

// 建立一場新遊戲的狀態物件。
// opts: { mode, startWave, startGold, survivalStrength }
export function createRun(diffKey, stats, opts = {}) {
  const mode = opts.mode || "classic";
  const g = {
    gold: opts.startGold ?? 50, maxHp: stats.maxHp, hp: stats.maxHp,
    diff: DIFF[diffKey], diffKey, mode,
    wave: 1, waveActive: true, spawnQueue: 0, spawnTimer: 0, cooldown: 0, immortalUsed: false,
    enemies: [], bullets: [], beams: [], particles: [], fx: [],
    eid: 0, fireCd: {}, orbAngle: 0,
    buffs: { over: 0, frost: 0 },
    cds: { over: 0, nova: 0, frost: 0, repair: 0 },
    gameOver: false, t: 0,
    kills: 0, sounds: [], texts: [],
    survivalTime: mode === "survival" ? SURVIVAL_SECONDS : 0,
    survivalStrength: Math.max(1, opts.survivalStrength || 1),
    bossTimer: 12,
  };
  if (mode === "survival") { g.wave = g.survivalStrength; g.waveActive = true; g.spawnTimer = 0.6; }
  else startWave(g, opts.startWave || 1);
  return g;
}

// 續戰模式：結算「從第 1 波到第 (startWave-1) 波」累積的金幣（含起始 50）。
export function cumulativeWaveGold(startWave, diff) {
  let g = 50;
  for (let w = 1; w < startWave; w++) g += (CFG.waveGoldBase + w * CFG.waveGoldSlope) * diff.gold;
  return Math.floor(g);
}

export function startWave(g, num) {
  g.wave = num;
  g.spawnQueue = Math.min(CFG.countCap, Math.floor(CFG.countBase + num * CFG.countSlope));
  g.spawnTimer = 0;
  g.waveActive = true;
  g.immortalUsed = false;
}

export function spawnEnemy(g, forceType) {
  const n = g.wave, type = forceType || pickType(n), t = ENEMIES[type];
  const hpS = Math.pow(CFG.hpScaleBase, n - 1) * g.diff.ehp;
  const atkS = Math.pow(CFG.atkScaleBase, n - 1) * g.diff.edmg;
  const defS = Math.pow(CFG.defScaleBase, n - 1);
  const ang = Math.random() * 6.2832, hp = t.hp * hpS;
  g.enemies.push({
    id: g.eid++, x: Math.cos(ang) * WORLD.spawnR, y: Math.sin(ang) * WORLD.spawnR,
    hp, maxHp: hp, sr: t.spd, r: t.r, atk: t.atk * atkS, def: t.def * defS, rw: t.rw,
    col: t.col, shape: t.shape, move: t.move, trait: t.trait, type,
    rot: Math.random() * 6.2832, dashT: Math.random() * 6, weaveDir: Math.random() < 0.5 ? 1 : -1,
    shield: t.trait === "shield" ? hp * 0.6 : 0, maxShield: t.trait === "shield" ? hp * 0.6 : 0,
  });
}

export function spawnMini(g, x, y, n) {
  const t = ENEMIES.mini;
  const hpS = Math.pow(CFG.hpScaleBase, n - 1) * g.diff.ehp;
  const atkS = Math.pow(CFG.atkScaleBase, n - 1) * g.diff.edmg;
  const hp = t.hp * hpS;
  g.enemies.push({
    id: g.eid++, x, y, hp, maxHp: hp, sr: t.spd, r: t.r, atk: t.atk * atkS, def: 0, rw: t.rw,
    col: t.col, shape: t.shape, move: "straight", trait: null, type: "mini",
    rot: 0, dashT: 0, weaveDir: 1, shield: 0, maxShield: 0,
  });
}

export function killEnemy(g, s, e, idx) {
  g.kills = (g.kills || 0) + 1;
  if (g.sounds) g.sounds.push(e.type === "boss" ? "bosskill" : "kill");
  const gold = Math.floor(e.rw * g.diff.gold * s.goldMult);
  g.gold += gold;
  floatText(g, e.x, e.y - e.r, "+" + gold, "#fcd34d");
  if (s.lifesteal > 0) g.hp = Math.min(g.maxHp, g.hp + g.maxHp * 0.004);
  burst(g, e.x, e.y, e.col, e.type === "boss" ? 22 : 9);
  ringFx(g, e.x, e.y, e.col, e.r * 2.6, 0.32);
  if (e.trait === "split") { spawnMini(g, e.x, e.y, g.wave); spawnMini(g, e.x, e.y, g.wave); }
  g.enemies.splice(idx, 1);
}

// 傷害公式：實際傷害 = max(1, 攻擊 − 防禦)（離散傷害，例如子彈）
export const mitigate = (raw, def) => Math.max(1, raw - def);
// 持續性傷害（雷射/火焰，每秒值）：防禦可把弱攻擊完全擋下，故下限 0。
export const mitigateDot = (rawPerSec, def) => Math.max(0, rawPerSec - def);

// 對敵人實際扣血（dmg 已是減防後的值）：先扣護盾，溢出再扣血。
export function damageEnemy(e, dmg) {
  if (e.shield > 0) { e.shield -= dmg; if (e.shield < 0) { e.hp += e.shield; e.shield = 0; } }
  else e.hp -= dmg;
}

// 折射激光：命中後在鄰近敵人間彈射，最多 4 段、傷害遞減。
export function chainHit(g, s, b, first) {
  let cur = first, hit = [first.id];
  const links = [{ x1: b.x, y1: b.y, x2: first.x, y2: first.y }];
  let dmg = b.dmg;
  damageEnemy(cur, mitigate(dmg, cur.def));
  let splits = b.maxSplit || 0; // 折射分裂：剛好擊殺時額外折射（上限由 maxSplit 決定）
  let budget = b.bounces || 3;
  { const k0 = g.enemies.indexOf(cur); if (cur.hp <= 0) { if (k0 >= 0) killEnemy(g, s, cur, k0); if (splits > 0) { splits--; budget++; } } }
  for (let n = 0; n < budget; n++) {
    dmg *= 0.72;
    let best = null, bd = 0.7 * 0.7;
    for (const e of g.enemies) { if (hit.includes(e.id)) continue; const d = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2; if (d < bd) { bd = d; best = e; } }
    if (!best) break;
    links.push({ x1: cur.x, y1: cur.y, x2: best.x, y2: best.y }); hit.push(best.id);
    damageEnemy(best, mitigate(dmg, best.def));
    const k = g.enemies.indexOf(best);
    if (best.hp <= 0) { if (k >= 0) killEnemy(g, s, best, k); if (splits > 0) { splits--; budget++; } } // 擊殺→額外折射
    cur = best;
  }
  for (const l of links) g.beams.push({ ...l, col: "#a5b4fc", life: 0.14, wgt: 2.4 });
  burst(g, first.x, first.y, "#c7d2fe", 4);
}

// ── 視覺效果（資料層，畫面層負責繪製） ──
export function burst(g, x, y, col, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, sp = 0.12 + Math.random() * 0.45;
    g.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5, maxLife: 0.5, col, r: 0.012 + Math.random() * 0.01 });
  }
}
// 擴張光環特效（命中、爆炸、AOE 範圍可視化）。
export function ringFx(g, x, y, col, r, life) {
  g.fx.push({ x, y, col, life, maxLife: life, r, kind: "ring" });
}
// 浮動文字（傷害數字、擊殺金幣跳字）。
export function floatText(g, x, y, str, col, big) {
  if (!g.texts) g.texts = [];
  if (g.texts.length > 60) return; // 上限避免爆量
  g.texts.push({ x: x + (Math.random() - 0.5) * 0.06, y, vy: -0.5, life: 0.7, maxLife: 0.7, str, col, big: !!big });
}
