import React, { useRef, useEffect, useState, useCallback } from "react";

// ════════════════════════════════════════════════════════════
//  THE TOWER · 無盡塔防 v4
//  技能地圖(小/大/詛咒/終極 四類, 三區塊, 可拖曳縮放) · 敵人差異化移動
// ════════════════════════════════════════════════════════════

const DIFF = {
  easy:   { name: "簡單", ehp: 0.7, edmg: 0.75, gold: 1.0, gem: 0.8, col: "#4ade80", desc: "敵人較弱" },
  normal: { name: "普通", ehp: 1.0, edmg: 1.0,  gold: 1.0, gem: 1.0, col: "#67e8f9", desc: "標準挑戰" },
  hard:   { name: "困難", ehp: 1.6, edmg: 1.35, gold: 1.25, gem: 1.6, col: "#f43f5e", desc: "高風險高報酬" },
};
const CFG = {
  hpScaleBase: 1.16, atkScaleBase: 1.07, defScaleBase: 1.04, spdScaleBase: 1.015,
  baseRegen: 1.0, countBase: 3, countSlope: 1.0, waveGoldBase: 10, waveGoldSlope: 5,
};
const W = {
  spawnR: 2.8, tower: 0.0725, bulletHit: 0.028,
  rangeBase: 0.72, rangeStep: 0.07, rangeMax: 1.35,
  bulletSpd: 2.8, orbR: 0.26, orbDpsF: 0.8, novaPush: 0.45, thornsBand: 0.11,
  flameRange: 0.62, splashR: 0.17, viewDiv: 1.55,
};

const ENEMIES = {
  grunt:   { name: "步兵",   shape: "circle",   hp: 9,  spd: 0.142, atk: 4.5, def: 0,  r: 0.050, rw: 8,  col: "#fca5a5", move: "straight", trait: null,     info: "直線逼近，最基礎" },
  dasher:  { name: "衝刺者", shape: "triangle", hp: 6,  spd: 0.255, atk: 6,   def: 0,  r: 0.045, rw: 12, col: "#c084fc", move: "dash",     trait: null,     info: "一衝一停爆發突進，瞄準難" },
  brute:   { name: "重甲",   shape: "square",   hp: 32, spd: 0.072, atk: 12,  def: 6,  r: 0.073, rw: 18, col: "#fb923c", move: "straight", trait: null,     info: "高血高防，需高單發傷害或破甲" },
  weaver:  { name: "遊蛇",   shape: "cross",    hp: 13, spd: 0.118, atk: 6,   def: 2,  r: 0.060, rw: 16, col: "#34d399", move: "weave",    trait: null,     info: "螺旋繞圈，閃避直線子彈" },
  warden:  { name: "護盾兵", shape: "star",     hp: 14, spd: 0.118, atk: 7,   def: 4,  r: 0.058, rw: 16, col: "#38bdf8", move: "straight", trait: "shield", info: "外圈護盾，須先破盾" },
  splitter:{ name: "分裂體", shape: "diamond",  hp: 16, spd: 0.10,  atk: 6,   def: 2,  r: 0.062, rw: 14, col: "#f0abfc", move: "straight", trait: "split",  info: "死亡裂成兩隻碎片" },
  boss:    { name: "首領",   shape: "hexagon",  hp: 70, spd: 0.066, atk: 16,  def: 10, r: 0.098, rw: 34, col: "#f43f5e", move: "straight", trait: "boss",   info: "每 5 波出現的首領" },
  mini:    { name: "碎片",   shape: "circle",   hp: 5,  spd: 0.185, atk: 4,   def: 0,  r: 0.033, rw: 4,  col: "#6ee7b7", move: "straight", trait: null,     info: "" },
};

const WEAPONS = {
  cannon: { name: "標準彈", icon: "cannon", dmgF: 1.0, rateF: 1.0, cont: false,
    desc: "直線發射，可多重射擊與穿透。隨「多重/穿透」成長最猛，全能基礎。" },
  homing: { name: "追蹤彈", icon: "homing", dmgF: 0.85, rateF: 0.85, cont: false,
    desc: "自動轉向追蹤，命中小範圍爆炸，永不落空。剋高速衝刺者與螺旋遊蛇。射速略慢。" },
  laser:  { name: "雷射", icon: "laser", dmgF: 1.54, rateF: 1.0, cont: true,
    desc: "持續鎖定光束，單體 DPS 最高(+40%)。專剋重甲與首領。清群弱。" },
  chain:  { name: "折射激光", icon: "chain", dmgF: 0.7, rateF: 0.9, cont: false,
    desc: "命中後在鄰近敵人間彈射(最多4跳，傷害遞減)。清群神器，單體偏弱。" },
  flame:  { name: "火焰", icon: "flame", dmgF: 0.61, rateF: 1.0, cont: true,
    desc: "塔周圍短射程範圍持續灼燒，同時燒多個。近身清場強，射程短需放敵人逼近。" },
};
const DEFAULT_WEAPON = "cannon";

const NODE_COL = { atk: "#fca5a5", def: "#7dd3fc", mix: "#d8b4fe", core: "#fbbf24", curse: "#f43f5e" };
const MAX_BIG = 3;
const NODES = [
  { id: "core", t: "core", br: "core", x: 0, y: 0, parent: null, name: "核心", icon: "core", cost: 0, bonus: { dmgM: 0.05, hpM: 0.05 }, info: "起點，免費啟動" },
  { id: "a_dmg1",  t: "small", br: "atk", x: -78, y: -26, parent: "core",    name: "火力", icon: "dmg",  cost: 30, bonus: { dmgM: 0.08 } },
  { id: "a_rate1", t: "small", br: "atk", x: -80, y: 30,  parent: "core",    name: "連射", icon: "rate", cost: 30, bonus: { rateM: 0.06 } },
  { id: "a_dmg2",  t: "small", br: "atk", x: -148, y: -52, parent: "a_dmg1", name: "火力", icon: "dmg",  cost: 45, bonus: { dmgM: 0.08 } },
  { id: "a_crit1", t: "small", br: "atk", x: -150, y: 6,  parent: "a_rate1", name: "暴擊", icon: "crit", cost: 45, bonus: { critC: 0.04 } },
  { id: "a_pierce1", t: "small", br: "atk", x: -150, y: 64, parent: "a_rate1", name: "穿甲", icon: "pierce", cost: 60, bonus: { pierce: 1 } },
  { id: "W_homing", t: "weapon", br: "atk", x: -150, y: -112, parent: "a_dmg2", name: "追蹤彈", icon: "homing", cost: 120, weapon: "homing" },
  { id: "A_multi", t: "major", br: "atk", x: -218, y: -48, parent: "a_dmg2", name: "多重射擊", icon: "multi", cost: 200, bonus: { multishot: 2 }, info: "同時射出 +2 發子彈" },
  { id: "A_overload", t: "major", br: "atk", x: -222, y: 50, parent: "a_crit1", name: "過載核心", icon: "rate", cost: 220, bonus: { rateM: 0.15 }, special: "overload", info: "攻速 +15%，且攻速越高傷害加成越大" },
  { id: "W_laser", t: "weapon", br: "atk", x: -226, y: -118, parent: "W_homing", name: "雷射", icon: "laser", cost: 150, weapon: "laser" },
  { id: "a_curse", t: "curse", br: "atk", x: -262, y: 4, parent: "a_pierce1", name: "狂戰士", icon: "curse", cost: 50, bonus: { dmgM: 0.40, hpM: -0.30 }, info: "傷害 +40%，但生命 -30%（永久，不可取消）" },
  { id: "a_berserk", t: "small", br: "atk", x: -312, y: -44, parent: "a_curse", name: "嗜血", icon: "dmg", cost: 90, bonus: { dmgM: 0.20, critC: 0.06 }, info: "詛咒之後的強化路徑" },
  { id: "A_glass", t: "keystone", br: "atk", x: -320, y: 54, parent: "a_curse", name: "玻璃大砲", icon: "dmg", cost: 300, bonus: { dmgM: 0.50 }, special: "glass", info: "傷害 ×1.5，但完全失去護甲（armor=0）。極限輸出" },
  { id: "d_hp1",   t: "small", br: "def", x: 78, y: -26, parent: "core",    name: "強健", icon: "hp",    cost: 30, bonus: { hpM: 0.10 } },
  { id: "d_armor1", t: "small", br: "def", x: 80, y: 30, parent: "core",    name: "裝甲", icon: "armor", cost: 30, bonus: { armor: 12 } },
  { id: "d_hp2",   t: "small", br: "def", x: 148, y: -52, parent: "d_hp1",  name: "強健", icon: "hp",    cost: 45, bonus: { hpM: 0.10 } },
  { id: "d_regen1", t: "small", br: "def", x: 150, y: 6, parent: "d_armor1", name: "再生", icon: "regen", cost: 45, bonus: { regen: 2.5 } },
  { id: "d_thorn1", t: "small", br: "def", x: 150, y: 64, parent: "d_armor1", name: "荊棘", icon: "thorns", cost: 60, bonus: { thorns: 5 } },
  { id: "W_flame", t: "weapon", br: "def", x: 150, y: -112, parent: "d_hp2", name: "火焰", icon: "flame", cost: 120, weapon: "flame" },
  { id: "D_fortress", t: "major", br: "def", x: 218, y: -48, parent: "d_hp2", name: "壁壘", icon: "armor", cost: 200, special: "fortress", bonus: { armor: 10 }, info: "生命低於 30% 時，傷害減免大幅提升" },
  { id: "D_thorn", t: "major", br: "def", x: 222, y: 50, parent: "d_thorn1", name: "荊棘光環", icon: "thorns", cost: 200, bonus: { thorns: 16 }, info: "近身灼燒大幅提升" },
  { id: "d_curse", t: "curse", br: "def", x: 262, y: 4, parent: "d_regen1", name: "重裝", icon: "curse", cost: 50, bonus: { hpM: 0.50, rateM: -0.25 }, info: "生命 +50%，但攻速 -25%（永久，不可取消）" },
  { id: "d_bulwark", t: "small", br: "def", x: 312, y: -44, parent: "d_curse", name: "銅牆", icon: "armor", cost: 90, bonus: { armor: 30, hpM: 0.10 }, info: "詛咒之後的強化路徑" },
  { id: "D_immortal", t: "keystone", br: "def", x: 320, y: 54, parent: "d_curse", name: "不屈意志", icon: "hp", cost: 300, special: "immortal", bonus: { hpM: 0.15 }, info: "每一波承受致命傷害時免死一次（回復 35% 生命）" },
  { id: "m_gold1", t: "small", br: "mix", x: -28, y: 80, parent: "core",    name: "拾荒", icon: "gold", cost: 30, bonus: { goldM: 0.12 } },
  { id: "m_gem1",  t: "small", br: "mix", x: 28, y: 80, parent: "core",    name: "鑽石", icon: "gem",  cost: 40, bonus: { gem: 0.15 } },
  { id: "m_gold2", t: "small", br: "mix", x: -56, y: 148, parent: "m_gold1", name: "暴富", icon: "gold", cost: 50, bonus: { goldM: 0.12 } },
  { id: "m_crit1", t: "small", br: "mix", x: 0, y: 150, parent: "m_gem1",  name: "精算", icon: "crit", cost: 50, bonus: { critC: 0.04 } },
  { id: "m_splash1", t: "small", br: "mix", x: 56, y: 148, parent: "m_gem1", name: "爆裂", icon: "splash", cost: 60, bonus: { splash: 0.15 } },
  { id: "W_chain", t: "weapon", br: "mix", x: -112, y: 150, parent: "m_gold2", name: "折射激光", icon: "chain", cost: 150, weapon: "chain" },
  { id: "M_orb", t: "major", br: "mix", x: -54, y: 216, parent: "m_gold2", name: "軌道無人機", icon: "orb", cost: 200, bonus: { orbs: 2 }, info: "+2 顆環繞無人機，自動傷害" },
  { id: "M_lifesteal", t: "major", br: "mix", x: 54, y: 216, parent: "m_crit1", name: "吸血", icon: "regen", cost: 220, bonus: { lifesteal: 0.05 }, info: "每次擊殺回復生命" },
  { id: "m_curse", t: "curse", br: "mix", x: 0, y: 256, parent: "m_splash1", name: "貪婪", icon: "curse", cost: 50, bonus: { goldM: 0.60, takeDmg: 0.20 }, info: "金幣 +60%，但承受傷害 +20%（永久，不可取消）" },
  { id: "m_jackpot", t: "small", br: "mix", x: -48, y: 312, parent: "m_curse", name: "頭獎", icon: "gem", cost: 90, bonus: { gem: 0.30, goldM: 0.15 }, info: "詛咒之後的強化路徑" },
  { id: "M_chaos", t: "keystone", br: "mix", x: 54, y: 314, parent: "m_curse", name: "混沌引擎", icon: "crit", cost: 300, bonus: { dmgM: 0.12, hpM: 0.12, goldM: 0.12, critC: 0.08, orbs: 1 }, info: "全屬性綜合強化的終極節點" },
];
const NODE_KEYS = NODES.map((n) => n.id);
const ZERO_NODES = Object.fromEntries(NODE_KEYS.map((k) => [k, 0]));
const nodeById = Object.fromEntries(NODES.map((n) => [n.id, n]));
const isBig = (n) => n.t === "major" || n.t === "keystone";
const countBig = (nodes) => NODES.reduce((a, n) => a + (isBig(n) && (nodes[n.id] || 0) >= 1 ? 1 : 0), 0);

const TREE = {
  attack: { name: "攻擊", col: "#fca5a5", items: {
    dmg:   { name: "攻擊力", icon: "dmg",   base: 10, mult: 1.14, fmt: (l) => `+${l * 5} 傷害`, nxt: "+5 傷害" },
    rate:  { name: "攻速",   icon: "rate",  base: 14, mult: 1.18, cap: 16, fmt: (l) => `+${(l * 0.12).toFixed(2)}/s`, nxt: "+0.12/s" },
    range: { name: "範圍",   icon: "range", base: 12, mult: 1.15, cap: 9, fmt: (l) => `+${l} 射程`, nxt: "+1 射程" },
    multi: { name: "多重",   icon: "multi", base: 60, mult: 1.7, cap: 4, fmt: (l) => `+${l} 發`, nxt: "+1 發子彈" },
  }},
  defense: { name: "防禦", col: "#7dd3fc", items: {
    hp:    { name: "生命", icon: "hp",    base: 12, mult: 1.15, fmt: (l) => `+${l * 30} 生命`, nxt: "+30 生命" },
    regen: { name: "恢復", icon: "regen", base: 16, mult: 1.18, fmt: (l) => `+${(l * 1.4).toFixed(1)}/s`, nxt: "+1.4/s" },
    armor: { name: "護甲", icon: "armor", base: 20, mult: 1.20, fmt: (l) => `+${(l * 1.5).toFixed(0)} 護甲`, nxt: "+1.5 護甲" },
  }},
  special: { name: "特殊", col: "#d8b4fe", items: {
    pierce: { name: "穿透", icon: "pierce", base: 50, mult: 1.6, cap: 4, fmt: (l) => `貫穿 ${l}`, nxt: "+1 貫穿" },
    crit:   { name: "暴擊", icon: "crit",   base: 45, mult: 1.5, cap: 10, fmt: (l) => `暴擊 ${l * 5}%`, nxt: "+5% 暴擊率" },
    splash: { name: "濺射", icon: "splash", base: 55, mult: 1.6, cap: 8, fmt: (l) => `濺射 ${l * 12}%`, nxt: "+12% 濺射" },
  }},
};
const SKILL_KEYS = ["dmg","rate","range","multi","hp","regen","armor","pierce","crit","splash"];
const ZERO_SKILL = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0]));
function findSkill(k) { for (const c in TREE) if (TREE[c].items[k]) return TREE[c].items[k]; }
const cost = (def, lvl) => Math.floor(def.base * Math.pow(def.mult, lvl));

const ABILITIES = [
  { key: "over", name: "過載", icon: "⚡", cd: 16, dur: 6, color: "#fbbf24" },
  { key: "nova", name: "新星", icon: "✺", cd: 13, dur: 0, color: "#f43f5e" },
  { key: "frost", name: "冰霜", icon: "❄", cd: 15, dur: 5, color: "#67e8f9" },
  { key: "repair", name: "修復", icon: "✛", cd: 20, dur: 0, color: "#4ade80" },
];

const A36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function enc(n, w) { let s = ""; n = Math.max(0, Math.floor(n)); for (let i = 0; i < w; i++) { s = A36[n % 36] + s; n = Math.floor(n / 36); } return s; }
function dec(s) { let n = 0; for (const c of s) { const i = A36.indexOf(c); if (i < 0) return null; n = n * 36 + i; } return n; }
function packBits(bits) { let s = ""; for (let i = 0; i < bits.length; i += 5) { let v = 0; for (let j = 0; j < 5; j++) v |= (bits[i + j] || 0) << j; s += A36[v]; } return s; }
function unpackBits(str, n) { const a = []; for (const c of str) { const v = A36.indexOf(c); if (v < 0) return null; for (let j = 0; j < 5; j++) a.push((v >> j) & 1); } return a.slice(0, n); }
const NCHUNK = Math.ceil(NODE_KEYS.length / 5);
function encodeSave(diamonds, nodes, bestWave) {
  let p = "2" + enc(Math.min(diamonds, 36 ** 5 - 1), 5);
  p += packBits(NODE_KEYS.map((k) => ((nodes[k] || 0) >= 1 ? 1 : 0)));
  p += enc(Math.min(bestWave, 36 ** 2 - 1), 2);
  let sum = 0; for (const c of p) sum += c.charCodeAt(0);
  p += enc(sum % 1296, 2);
  return p.match(/.{1,5}/g).join("-");
}
function decodeSave(str) {
  const s = (str || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  const N = 1 + 5 + NCHUNK + 2 + 2;
  if (s.length !== N || s[0] !== "2") return null;
  const body = s.slice(0, N - 2), chk = s.slice(N - 2);
  let sum = 0; for (const c of body) sum += c.charCodeAt(0);
  if (enc(sum % 1296, 2) !== chk) return null;
  const diamonds = dec(s.slice(1, 6));
  const bits = unpackBits(s.slice(6, 6 + NCHUNK), NODE_KEYS.length);
  if (!bits || diamonds === null) return null;
  const nodes = {}; NODE_KEYS.forEach((k, i) => (nodes[k] = bits[i]));
  const bestWave = dec(s.slice(6 + NCHUNK, 6 + NCHUNK + 2));
  if (bestWave === null) return null;
  return { diamonds, nodes, bestWave };
}

function isNodeUnlocked(def, nodes) {
  if (def.reqAll) return def.reqAll.every((k) => (nodes[k] || 0) >= 1);
  if (!def.parent) return true;
  return (nodes[def.parent] || 0) >= 1;
}
function sumBonus(nodes, key) { let v = 0; for (const n of NODES) if (n.bonus && n.bonus[key]) v += n.bonus[key] * (nodes[n.id] || 0); return v; }
function unlockedWeapons(nodes) { const w = ["cannon"]; for (const n of NODES) if (n.weapon && (nodes[n.id] || 0) >= 1) w.push(n.weapon); return w; }

function derive(nodes, skill) {
  const G = (k) => sumBonus(nodes, k);
  const dmgM = 1 + G("dmgM"), rateM = Math.max(0.3, 1 + G("rateM")), hpM = Math.max(0.3, 1 + G("hpM")), goldM = 1 + G("goldM");
  const glass = (nodes.A_glass || 0) >= 1, overload = (nodes.A_overload || 0) >= 1;
  let fireRate = (1.1 + skill.rate * 0.12) * rateM;
  let damage = (13 + skill.dmg * 5) * dmgM;
  if (overload) damage *= 1 + Math.max(0, fireRate - 1.5) * 0.15;
  return {
    damage, fireRate, rangeBonus: skill.range,
    maxHp: (100 + skill.hp * 30) * hpM,
    regen: skill.regen * 1.4 + G("regen") + CFG.baseRegen,
    armor: glass ? 0 : skill.armor * 1.5 + G("armor"),
    multishot: 1 + skill.multi + G("multishot"),
    pierce: 1 + skill.pierce + G("pierce"),
    thorns: G("thorns"),
    splash: skill.splash * 0.12 + G("splash"),
    critChance: skill.crit * 0.05 + G("critC"),
    orbs: G("orbs"),
    gemYield: 1 + G("gem"),
    goldMult: goldM,
    lifesteal: G("lifesteal"),
    takeDmgMult: 1 + G("takeDmg"),
    glass, fortress: (nodes.D_fortress || 0) >= 1, immortal: (nodes.D_immortal || 0) >= 1,
  };
}

function Icon({ type, size = 18, color = "#e2e8f0" }) {
  const p = { fill: "none", stroke: color, strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" };
  const f = { fill: color };
  const paths = {
    dmg:    <path d="M5 19L19 5M19 5h-5M19 5v5" {...p} />,
    rate:   <path d="M13 2L4 14h6l-1 8 9-12h-6z" {...f} />,
    range:  <g {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2" {...f} /></g>,
    multi:  <g {...p}><path d="M12 4v16M6 8v12M18 8v12" /></g>,
    pierce: <path d="M3 12h14m0 0l-4-4m4 4l-4 4M19 6v12" {...p} />,
    hp:     <path d="M12 20s-7-4.5-7-9a4 4 0 018-1 4 4 0 018 1c0 4.5-7 9-7 9z" {...f} />,
    regen:  <path d="M12 4v16M4 12h16" {...p} />,
    armor:  <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" {...p} />,
    crit:   <path d="M12 3l2.5 6L21 9.5l-5 4 1.8 6.5L12 16l-5.8 4L8 13.5l-5-4 6.5-.5z" {...f} />,
    splash: <g {...p}><circle cx="12" cy="12" r="3" {...f} /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" /></g>,
    thorns: <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" {...f} />,
    gold:   <g><circle cx="12" cy="12" r="8" {...p} /><path d="M12 8v8M9.5 10h3.5a1.5 1.5 0 010 3H9.5" {...p} /></g>,
    gem:    <path d="M6 4h12l3 5-9 11L3 9z" {...p} />,
    orb:    <g {...p}><circle cx="12" cy="12" r="3" {...f} /><ellipse cx="12" cy="12" rx="9" ry="4" /></g>,
    core:   <g {...p}><circle cx="12" cy="12" r="4" {...f} /><circle cx="12" cy="12" r="9" /><path d="M12 1v3M12 20v3M1 12h3M20 12h3" /></g>,
    curse:  <g {...p}><path d="M12 3l9 16H3z" /><path d="M12 9v5" /><circle cx="12" cy="16.5" r="0.6" {...f} /></g>,
    cannon: <g {...p}><circle cx="12" cy="12" r="3.5" {...f} /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></g>,
    homing: <path d="M3 12c6-8 12 8 18 0M16 9l2 3-2 3" {...p} />,
    laser:  <g><path d="M5 12h14" stroke={color} strokeWidth="3" strokeLinecap="round" /><circle cx="5" cy="12" r="2.5" {...f} /></g>,
    chain:  <path d="M5 5l4 5-3 1 5 4-1-4 4 4" {...p} />,
    flame:  <path d="M12 3c3 4 5 6 5 9a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 2-1-3 0-5 1-7z" {...f} />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[type] || paths.dmg}</svg>;
}

export default function App() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const game = useRef(null);
  const dims = useRef({ w: 360, h: 320, cx: 180, cy: 160, base: 130, dpr: 1 });
  const cam = useRef({ zoom: 1 });
  const statsRef = useRef(derive(ZERO_NODES, ZERO_SKILL));
  const weaponRef = useRef(DEFAULT_WEAPON);

  const metaRef = useRef({ diamonds: 0, nodes: { ...ZERO_NODES }, bestWave: 1 });
  const [metaV, setMetaV] = useState(metaRef.current);
  const commitMeta = () => setMetaV({ diamonds: metaRef.current.diamonds, nodes: { ...metaRef.current.nodes }, bestWave: metaRef.current.bestWave });

  const skillRef = useRef({ ...ZERO_SKILL });
  const [skillV, setSkillV] = useState(skillRef.current);

  const [screen, setScreen] = useState("menu");
  const [overlay, setOverlay] = useState(null);
  const [skillCat, setSkillCat] = useState("attack");
  const [weapon, setWeapon] = useState(DEFAULT_WEAPON);
  const [hud, setHud] = useState({ gold: 0, wave: 1, hp: 100, maxHp: 100, gameOver: false, diff: "normal" });
  const [cds, setCds] = useState({ over: 0, nova: 0, frost: 0, repair: 0 });
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { weaponRef.current = weapon; }, [weapon]);

  const recompute = () => { statsRef.current = derive(metaRef.current.nodes, skillRef.current); };
  function syncHp() { const g = game.current; if (!g) return; const nm = statsRef.current.maxHp, d = nm - g.maxHp; g.maxHp = nm; g.hp = Math.min(nm, g.hp + Math.max(0, d)); }

  const newRun = useCallback((diffKey) => {
    skillRef.current = { ...ZERO_SKILL }; recompute();
    const s = statsRef.current;
    game.current = { gold: 50, maxHp: s.maxHp, hp: s.maxHp, diff: DIFF[diffKey], diffKey,
      wave: 1, waveActive: true, spawnQueue: 0, spawnTimer: 0, cooldown: 0, immortalUsed: false,
      enemies: [], bullets: [], beams: [], particles: [], fx: [], eid: 0, fireCd: 0, orbAngle: 0,
      buffs: { over: 0, frost: 0 }, cds: { over: 0, nova: 0, frost: 0, repair: 0 }, gameOver: false, t: 0 };
    startWave(1); setSkillV({ ...skillRef.current });
  }, []);

  function startWave(num) { const g = game.current; g.wave = num; g.spawnQueue = Math.floor(CFG.countBase + num * CFG.countSlope); g.spawnTimer = 0; g.waveActive = true; g.immortalUsed = false; }

  function pickType(n) {
    const roll = Math.random();
    if (n >= 4 && roll < 0.15) return "brute";
    if (n >= 6 && roll < 0.28) return "dasher";
    if (n >= 5 && roll < 0.40) return "splitter";
    if (n >= 7 && roll < 0.54) return "weaver";
    if (n >= 9 && roll < 0.66) return "warden";
    return "grunt";
  }
  function spawnEnemy(forceType) {
    const g = game.current, n = g.wave, type = forceType || pickType(n), t = ENEMIES[type];
    const hpS = Math.pow(CFG.hpScaleBase, n - 1) * g.diff.ehp, atkS = Math.pow(CFG.atkScaleBase, n - 1) * g.diff.edmg, defS = Math.pow(CFG.defScaleBase, n - 1);
    const ang = Math.random() * 6.2832, hp = t.hp * hpS;
    g.enemies.push({ id: g.eid++, x: Math.cos(ang) * W.spawnR, y: Math.sin(ang) * W.spawnR,
      hp, maxHp: hp, sr: t.spd, r: t.r, atk: t.atk * atkS, def: t.def * defS, rw: t.rw, col: t.col, shape: t.shape, move: t.move, trait: t.trait, type,
      rot: Math.random() * 6.2832, dashT: Math.random() * 6, weaveDir: Math.random() < 0.5 ? 1 : -1,
      shield: t.trait === "shield" ? hp * 0.6 : 0, maxShield: t.trait === "shield" ? hp * 0.6 : 0 });
  }
  function spawnMini(x, y, n) {
    const g = game.current, t = ENEMIES.mini, hpS = Math.pow(CFG.hpScaleBase, n - 1) * g.diff.ehp, atkS = Math.pow(CFG.atkScaleBase, n - 1) * g.diff.edmg, hp = t.hp * hpS;
    g.enemies.push({ id: g.eid++, x, y, hp, maxHp: hp, sr: t.spd, r: t.r, atk: t.atk * atkS, def: 0, rw: t.rw, col: t.col, shape: t.shape, move: "straight", trait: null, type: "mini", rot: 0, dashT: 0, weaveDir: 1, shield: 0, maxShield: 0 });
  }
  function killEnemy(e, idx) {
    const g = game.current, s = statsRef.current;
    g.gold += Math.floor(e.rw * g.diff.gold * s.goldMult);
    if (s.lifesteal > 0) g.hp = Math.min(g.maxHp, g.hp + g.maxHp * 0.004);
    burst(e.x, e.y, e.col, e.type === "boss" ? 20 : 9);
    if (e.trait === "split") { spawnMini(e.x, e.y, g.wave); spawnMini(e.x, e.y, g.wave); }
    g.enemies.splice(idx, 1);
  }
  function burst(x, y, col, n) { const g = game.current; for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, sp = 0.1 + Math.random() * 0.35; g.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5, col }); } }
  function addFx(x, y, col, life, r) { game.current.fx.push({ x, y, col, life, maxLife: life, r: r || 0.17 }); }

  const buySkill = useCallback((k) => {
    const g = game.current; if (!g) return; const def = findSkill(k);
    setSkillV(() => { if (def.cap && skillRef.current[k] >= def.cap) return { ...skillRef.current };
      const c = cost(def, skillRef.current[k]); if (g.gold < c) return { ...skillRef.current };
      g.gold -= c; skillRef.current[k] += 1; recompute(); syncHp(); return { ...skillRef.current }; });
  }, []);
  const buyNode = useCallback((id) => {
    const def = nodeById[id];
    setMetaV(() => {
      const nd = metaRef.current.nodes, owned = (nd[id] || 0) >= 1;
      if (owned) {
        if (isBig(def)) { nd[id] = 0; metaRef.current.diamonds += def.cost; }
        return { diamonds: metaRef.current.diamonds, nodes: { ...nd }, bestWave: metaRef.current.bestWave };
      }
      if (!isNodeUnlocked(def, nd)) return { ...metaRef.current };
      if (isBig(def) && countBig(nd) >= MAX_BIG) return { ...metaRef.current };
      if (metaRef.current.diamonds < def.cost) return { ...metaRef.current };
      metaRef.current.diamonds -= def.cost; nd[id] = 1;
      return { diamonds: metaRef.current.diamonds, nodes: { ...nd }, bestWave: metaRef.current.bestWave };
    });
  }, []);

  const useAbility = useCallback((k) => {
    const g = game.current; if (!g || g.gameOver || pausedRef.current || g.cds[k] > 0) return;
    const s = statsRef.current, ab = ABILITIES.find((a) => a.key === k);
    g.cds[k] = ab.cd;
    if (k === "over") g.buffs.over = ab.dur;
    if (k === "frost") g.buffs.frost = ab.dur;
    if (k === "repair") { g.hp = Math.min(g.maxHp, g.hp + g.maxHp * 0.4); burst(0, 0, "#4ade80", 16); }
    if (k === "nova") { const dmg = s.damage * 6;
      for (let i = g.enemies.length - 1; i >= 0; i--) { const e = g.enemies[i], dist = Math.hypot(e.x, e.y) || 1;
        e.x += (e.x / dist) * W.novaPush; e.y += (e.y / dist) * W.novaPush; e.hp -= dmg; burst(e.x, e.y, "#f43f5e", 5);
        if (e.hp <= 0) killEnemy(e, i); } }
  }, []);

  const startGame = (dk) => { newRun(dk); setWeapon(DEFAULT_WEAPON); setOverlay(null); setPaused(false); setSkillCat("attack"); setScreen("playing"); };
  const toMenu = () => { setScreen("menu"); setOverlay(null); };
  const restart = () => { newRun(game.current.diffKey); setWeapon(DEFAULT_WEAPON); setPaused(false); setSkillCat("attack"); };

  useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current, cv = canvasRef.current; if (!wrap || !cv) return;
      const r = wrap.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = Math.max(160, r.width), h = Math.max(160, r.height);
      cv.width = w * dpr; cv.height = h * dpr; cv.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
      dims.current = { w, h, cx: w / 2, cy: h / 2, base: Math.min(w, h) / 2 / W.viewDiv, dpr };
    };
    measure();
    let ro; if (wrapRef.current) { ro = new ResizeObserver(measure); ro.observe(wrapRef.current); }
    window.addEventListener("resize", measure);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [screen]);

  useEffect(() => {
    if (screen !== "playing") return;
    const cv = canvasRef.current;
    let pinchD = 0, startZoom = 1;
    const d2 = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const ts = (e) => { if (e.touches.length === 2) { pinchD = d2(e.touches); startZoom = cam.current.zoom; } };
    const tm = (e) => { if (e.touches.length === 2 && pinchD) { e.preventDefault(); cam.current.zoom = Math.max(0.55, Math.min(2.6, startZoom * d2(e.touches) / pinchD)); } };
    const te = (e) => { if (e.touches.length < 2) pinchD = 0; };
    cv.addEventListener("touchstart", ts, { passive: false });
    cv.addEventListener("touchmove", tm, { passive: false });
    cv.addEventListener("touchend", te);
    return () => { cv.removeEventListener("touchstart", ts); cv.removeEventListener("touchmove", tm); cv.removeEventListener("touchend", te); };
  }, [screen]);

  useEffect(() => {
    if (screen !== "playing") return;
    const ctx = canvasRef.current.getContext("2d");
    let raf, last = performance.now(), acc = 0;
    const loop = (now) => {
      let dt = (now - last) / 1000; last = now; if (dt > 0.05) dt = 0.05;
      const g = game.current, s = statsRef.current;
      const range = Math.min(W.rangeMax, W.rangeBase + s.rangeBonus * W.rangeStep);
      const wk = weaponRef.current, wp = WEAPONS[wk];

      if (!pausedRef.current && !g.gameOver) {
        g.t += dt;
        for (const kk in g.cds) if (g.cds[kk] > 0) g.cds[kk] = Math.max(0, g.cds[kk] - dt);
        if (g.buffs.over > 0) g.buffs.over -= dt;
        if (g.buffs.frost > 0) g.buffs.frost -= dt;

        if (g.waveActive && g.spawnQueue > 0) { g.spawnTimer -= dt;
          if (g.spawnTimer <= 0) { const boss = g.spawnQueue === 1 && g.wave % 5 === 0; spawnEnemy(boss ? "boss" : null); g.spawnQueue--; g.spawnTimer = Math.max(0.16, 0.65 - g.wave * 0.01); } }
        if (g.waveActive && g.spawnQueue === 0 && g.enemies.length === 0) {
          g.waveActive = false; g.cooldown = 1.4;
          metaRef.current.bestWave = Math.max(metaRef.current.bestWave, g.wave);
          g.gold += Math.floor((CFG.waveGoldBase + g.wave * CFG.waveGoldSlope) * g.diff.gold * s.goldMult);
          if (g.wave % 5 === 0) metaRef.current.diamonds += Math.floor(4 * g.diff.gem * s.gemYield);
        }
        if (!g.waveActive) { g.cooldown -= dt; if (g.cooldown <= 0) startWave(g.wave + 1); }

        const slow = g.buffs.frost > 0 ? 0.35 : 1;
        const spdScale = Math.pow(CFG.spdScaleBase, g.wave - 1);
        for (let i = g.enemies.length - 1; i >= 0; i--) {
          const e = g.enemies[i], dist = Math.hypot(e.x, e.y) || 1, rim = W.tower + e.r;
          e.rot += dt * 1.4;
          if (e.maxShield > 0 && e.shield < e.maxShield) e.shield = Math.min(e.maxShield, e.shield + e.maxShield * 0.04 * dt);
          if (dist > rim) {
            if (e.move === "weave") {
              const inward = e.sr * spdScale * slow, ang = Math.atan2(e.y, e.x);
              const ndist = dist - inward * dt, na = ang + e.weaveDir * (e.sr * 1.5 / Math.max(dist, 0.15)) * dt;
              e.x = Math.cos(na) * ndist; e.y = Math.sin(na) * ndist;
            } else if (e.move === "dash") {
              const burstF = Math.sin(e.dashT * 2.6) > 0.2 ? 2.3 : 0.45; e.dashT += dt;
              const v = e.sr * spdScale * slow * burstF; e.x -= (e.x / dist) * v * dt; e.y -= (e.y / dist) * v * dt;
            } else { const v = e.sr * spdScale * slow; e.x -= (e.x / dist) * v * dt; e.y -= (e.y / dist) * v * dt; }
          }
          if (s.thorns > 0 && dist < rim + W.thornsBand) { e.hp -= s.thorns * dt; if (Math.random() < 0.25) burst(e.x, e.y, "#fcd34d", 1); }
          if (e.hp <= 0) { killEnemy(e, i); continue; }
          if (dist <= rim + 0.012) {
            let armor = s.armor; if (s.fortress && g.hp < g.maxHp * 0.3) armor += 45;
            g.hp -= Math.max(1, e.atk - armor) * s.takeDmgMult;
            addFx(0, 0, e.col, 0.18, 0.16); burst(e.x, e.y, e.col, 6); g.enemies.splice(i, 1);
            if (g.hp <= 0) {
              if (s.immortal && !g.immortalUsed) { g.hp = g.maxHp * 0.35; g.immortalUsed = true; addFx(0, 0, "#4ade80", 0.5, 0.5); burst(0, 0, "#4ade80", 20); }
              else { g.hp = 0; g.gameOver = true; metaRef.current.bestWave = Math.max(metaRef.current.bestWave, g.wave);
                metaRef.current.diamonds += Math.floor(g.wave * 2 * s.gemYield * g.diff.gem); commitMeta(); }
            }
            continue;
          }
        }

        if (s.orbs > 0) { g.orbAngle += dt * 2.2; const odps = s.damage * W.orbDpsF;
          for (let o = 0; o < s.orbs; o++) { const a = g.orbAngle + o * 6.28 / s.orbs, ox = Math.cos(a) * W.orbR, oy = Math.sin(a) * W.orbR;
            for (let j = g.enemies.length - 1; j >= 0; j--) { const e = g.enemies[j];
              if ((ox - e.x) ** 2 + (oy - e.y) ** 2 < (e.r + 0.02) ** 2) { dealDamage(e, odps * dt); if (e.hp <= 0) killEnemy(e, j); } } } }

        const inRange = g.enemies.map((e) => ({ e, dd: Math.hypot(e.x, e.y) })).filter((o) => o.dd <= range).sort((a, b) => a.dd - b.dd);
        const dm = g.buffs.over > 0 ? 3 : 1;
        if (wp.cont) {
          if (wk === "laser") { g.beams = [];
            for (const { e } of inRange.slice(0, s.multishot)) { const crit = Math.random() < s.critChance * 0.3; dealDamage(e, s.damage * wp.dmgF * dm * dt * (crit ? 1.5 : 1));
              g.beams.push({ x1: 0, y1: 0, x2: e.x, y2: e.y, col: "#67e8f9", life: 0.05, wgt: 3 });
              if (e.hp <= 0) { const j = g.enemies.indexOf(e); if (j >= 0) killEnemy(e, j); } } }
          else if (wk === "flame") { for (let j = g.enemies.length - 1; j >= 0; j--) { const e = g.enemies[j];
            if (Math.hypot(e.x, e.y) <= W.flameRange) { dealDamage(e, s.damage * wp.dmgF * dm * dt); if (Math.random() < 0.15) burst(e.x, e.y, "#fb923c", 1); if (e.hp <= 0) killEnemy(e, j); } } }
        } else {
          g.fireCd -= dt;
          if (g.fireCd <= 0 && inRange.length) { const bspd = W.bulletSpd;
            if (wk === "chain") { const first = inRange[0].e, crit = Math.random() < s.critChance, a = Math.atan2(first.y, first.x);
              g.bullets.push({ x: 0, y: 0, vx: Math.cos(a) * bspd, vy: Math.sin(a) * bspd, dmg: s.damage * wp.dmgF * dm * (crit ? 2.2 : 1), crit, life: 1.6, type: "chain", hits: [] }); }
            else { for (const { e } of inRange.slice(0, s.multishot)) { const a = Math.atan2(e.y, e.x), crit = Math.random() < s.critChance;
              g.bullets.push({ x: 0, y: 0, vx: Math.cos(a) * bspd, vy: Math.sin(a) * bspd, dmg: s.damage * wp.dmgF * dm * (crit ? 2.2 : 1), crit, life: 1.6, type: wk, hits: [], pierce: s.pierce }); } }
            g.fireCd = 1 / (s.fireRate * wp.rateF); }
        }

        for (let i = g.bullets.length - 1; i >= 0; i--) {
          const b = g.bullets[i]; let dead = false;
          if (b.type === "homing") { let best = null, bd = 9;
            for (const e of g.enemies) { if (b.hits.includes(e.id)) continue; const d = (e.x - b.x) ** 2 + (e.y - b.y) ** 2; if (d < bd) { bd = d; best = e; } }
            if (best) { const ta = Math.atan2(best.y - b.y, best.x - b.x), ca = Math.atan2(b.vy, b.vx); let da = ta - ca; while (da > Math.PI) da -= 6.28; while (da < -Math.PI) da += 6.28;
              const na = ca + Math.max(-4 * dt, Math.min(4 * dt, da)); b.vx = Math.cos(na) * W.bulletSpd; b.vy = Math.sin(na) * W.bulletSpd; } }
          b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
          if (b.life <= 0 || Math.hypot(b.x, b.y) > W.spawnR + 0.1) dead = true;
          if (!dead) for (let j = g.enemies.length - 1; j >= 0; j--) { const e = g.enemies[j];
            if (b.hits && b.hits.includes(e.id)) continue;
            if ((b.x - e.x) ** 2 + (b.y - e.y) ** 2 < (e.r + W.bulletHit) ** 2) {
              if (b.type === "chain") { chainHit(b, e); dead = true; break; }
              dealDamage(e, b.dmg); b.hits.push(e.id);
              if (b.type === "homing") { for (const e2 of g.enemies) if (e2.id !== e.id && (e2.x - e.x) ** 2 + (e2.y - e.y) ** 2 < W.splashR * W.splashR) dealDamage(e2, b.dmg * 0.5); burst(b.x, b.y, "#fbbf24", 5); }
              if (s.splash > 0 && b.type === "cannon") for (const e2 of g.enemies) if (e2.id !== e.id && (e2.x - e.x) ** 2 + (e2.y - e.y) ** 2 < W.splashR * W.splashR) dealDamage(e2, b.dmg * s.splash);
              if (e.hp <= 0) { const k = g.enemies.indexOf(e); if (k >= 0) killEnemy(e, k); } else burst(b.x, b.y, b.crit ? "#fff" : "#fde68a", b.crit ? 4 : 2);
              if (b.type === "homing") dead = true; else { b.pierce -= 1; if (b.pierce <= 0) dead = true; }
              break;
            } }
          if (dead) g.bullets.splice(i, 1);
        }
        for (let i = g.beams.length - 1; i >= 0; i--) { g.beams[i].life -= dt; if (g.beams[i].life <= 0) g.beams.splice(i, 1); }
        for (let i = g.particles.length - 1; i >= 0; i--) { const p = g.particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vx *= 0.92; p.vy *= 0.92; if (p.life <= 0) g.particles.splice(i, 1); }
      }

      draw(ctx, g, s, dims.current, cam.current, range, weaponRef.current);
      acc += dt;
      if (acc > 0.08) { acc = 0; setHud({ gold: Math.floor(g.gold), wave: g.wave, hp: Math.ceil(g.hp), maxHp: Math.round(g.maxHp), gameOver: g.gameOver, diff: g.diffKey }); setCds({ ...g.cds });
        if (metaV.diamonds !== metaRef.current.diamonds) commitMeta(); }
      raf = requestAnimationFrame(loop);
    };
    function dealDamage(e, dmg) { if (e.shield > 0) { e.shield -= dmg; if (e.shield < 0) { e.hp += e.shield; e.shield = 0; } } else e.hp -= dmg; }
    function chainHit(b, first) {
      const g = game.current; let cur = first, hit = [first.id], links = [{ x1: b.x, y1: b.y, x2: first.x, y2: first.y }], dmg = b.dmg;
      dealDamage(cur, dmg); let k0 = g.enemies.indexOf(cur); if (cur.hp <= 0 && k0 >= 0) killEnemy(cur, k0);
      for (let n = 0; n < 3; n++) { dmg *= 0.72; let best = null, bd = 0.28 * 0.28;
        for (const e of g.enemies) { if (hit.includes(e.id)) continue; const d = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2; if (d < bd) { bd = d; best = e; } }
        if (!best) break; links.push({ x1: cur.x, y1: cur.y, x2: best.x, y2: best.y }); hit.push(best.id);
        dealDamage(best, dmg); const k = g.enemies.indexOf(best); if (best.hp <= 0 && k >= 0) killEnemy(best, k); cur = best; }
      for (const l of links) g.beams.push({ ...l, col: "#a5b4fc", life: 0.12, wgt: 2 });
      burst(first.x, first.y, "#c7d2fe", 4);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [screen]);

  function drawShape(ctx, shape, x, y, r, rot) {
    ctx.beginPath();
    if (shape === "circle") { ctx.arc(x, y, r, 0, 6.2832); }
    else if (shape === "cross") { const a = r * 0.42; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.rect(-a, -r, a * 2, r * 2); ctx.rect(-r, -a, r * 2, a * 2); ctx.restore(); }
    else if (shape === "diamond") { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, 0); ctx.closePath(); ctx.restore(); }
    else if (shape === "star") { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, an = i * Math.PI / 5 - Math.PI / 2, px = Math.cos(an) * rr, py = Math.sin(an) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.restore(); }
    else { const sides = shape === "triangle" ? 3 : shape === "hexagon" ? 6 : 4; ctx.save(); ctx.translate(x, y); ctx.rotate(rot + (shape === "square" ? Math.PI / 4 : 0)); for (let i = 0; i < sides; i++) { const an = i * 6.2832 / sides - Math.PI / 2, px = Math.cos(an) * r, py = Math.sin(an) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.restore(); }
  }

  function draw(ctx, g, s, d, camera, range, wk) {
    const { w, h, cx, cy, base } = d, z = camera.zoom, sc = base * z;
    const X = (wx) => cx + wx * sc, Y = (wy) => cy + wy * sc, L = (v) => v * sc;
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#060912"; ctx.fillRect(0, 0, w, h);
    const R0 = W.spawnR + 0.14, step = 0.2;
    const gline = (v, horiz) => { const major = Math.round(v / step) % 2 === 0; ctx.strokeStyle = Math.abs(v) < 0.01 ? "rgba(34,211,238,0.3)" : major ? "rgba(56,189,248,0.1)" : "rgba(56,189,248,0.045)"; ctx.lineWidth = Math.abs(v) < 0.01 ? 1.5 : 1;
      ctx.beginPath(); if (horiz) { ctx.moveTo(X(-R0), Y(v)); ctx.lineTo(X(R0), Y(v)); } else { ctx.moveTo(X(v), Y(-R0)); ctx.lineTo(X(v), Y(R0)); } ctx.stroke(); };
    for (let gx = -R0; gx <= R0 + 0.001; gx += step) { if (X(gx) < -2 || X(gx) > w + 2) continue; gline(gx, false); }
    for (let gy = -R0; gy <= R0 + 0.001; gy += step) { if (Y(gy) < -2 || Y(gy) > h + 2) continue; gline(gy, true); }
    const vg = ctx.createRadialGradient(cx, cy, L(0.25), cx, cy, L(R0)); vg.addColorStop(0, "rgba(6,9,18,0)"); vg.addColorStop(0.75, "rgba(6,9,18,0.2)"); vg.addColorStop(1, "rgba(6,9,18,0.92)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(244,63,94,0.13)"; ctx.setLineDash([3, 6]); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, L(W.spawnR), 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
    if (wk === "flame") { const flr = L(W.flameRange), fgr = ctx.createRadialGradient(cx, cy, L(W.tower), cx, cy, flr);
      fgr.addColorStop(0, "rgba(251,146,60,0.3)"); fgr.addColorStop(0.7, "rgba(249,115,22,0.12)"); fgr.addColorStop(1, "rgba(249,115,22,0)"); ctx.fillStyle = fgr; ctx.beginPath(); ctx.arc(cx, cy, flr, 0, 6.2832); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(cx, cy, L(range), 0, 6.2832); ctx.strokeStyle = g.buffs?.frost > 0 ? "rgba(103,232,249,0.4)" : "rgba(34,211,238,0.18)"; ctx.setLineDash([4, 7]); ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]); }

    for (const p of g.particles) { ctx.globalAlpha = Math.max(0, p.life / 0.5); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), L(0.01), 0, 6.2832); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (const bm of g.beams) { ctx.save(); ctx.globalAlpha = Math.min(1, bm.life / 0.1); ctx.strokeStyle = bm.col; ctx.shadowBlur = 9; ctx.shadowColor = bm.col; ctx.lineWidth = bm.wgt; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(X(bm.x1), Y(bm.y1)); ctx.lineTo(X(bm.x2), Y(bm.y2)); ctx.stroke(); ctx.restore(); }
    for (const b of g.bullets) { ctx.save(); const c = b.type === "homing" ? "#fbbf24" : b.crit ? "#fff" : "#fde68a";
      ctx.globalAlpha = 0.35; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X(b.x - b.vx * 0.025), Y(b.y - b.vy * 0.025), L(0.01), 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 1; ctx.shadowBlur = 7; ctx.shadowColor = c; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), L(b.crit ? 0.017 : 0.014), 0, 6.2832); ctx.fill(); ctx.restore(); }
    for (const e of g.enemies) {
      const ex = X(e.x), ey = Y(e.y), er = L(e.r);
      ctx.save(); ctx.shadowBlur = 11; ctx.shadowColor = e.col; ctx.fillStyle = e.col; drawShape(ctx, e.shape, ex, ey, er, e.rot); ctx.fill(); ctx.restore();
      ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,255,255,0.55)"; drawShape(ctx, e.shape, ex, ey, er, e.rot); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.18)"; drawShape(ctx, e.shape, ex, ey, er * 0.45, e.rot); ctx.fill();
      if (e.shield > 0) { ctx.strokeStyle = "rgba(125,211,252,0.85)"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(ex, ey, er + 4, -1.57, -1.57 + 6.2832 * (e.shield / e.maxShield)); ctx.stroke(); }
      if (e.hp < e.maxHp) { const bw = er * 2, by = ey - er - 6; ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(ex - bw / 2, by, bw, 3); ctx.fillStyle = e.type === "boss" ? "#f43f5e" : "#4ade80"; ctx.fillRect(ex - bw / 2, by, bw * Math.max(0, e.hp / e.maxHp), 3); }
    }
    if (s.orbs > 0) for (let o = 0; o < s.orbs; o++) { const a = g.orbAngle + o * 6.2832 / s.orbs, ox = X(Math.cos(a) * W.orbR), oy = Y(Math.sin(a) * W.orbR);
      ctx.save(); ctx.shadowBlur = 8; ctx.shadowColor = "#a5f3fc"; ctx.fillStyle = "#cffafe"; ctx.beginPath(); ctx.arc(ox, oy, L(0.018), 0, 6.2832); ctx.fill(); ctx.restore(); }
    const TR = L(W.tower);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(g.t * 0.5); ctx.strokeStyle = g.buffs?.over > 0 ? "rgba(251,191,36,0.5)" : "rgba(34,211,238,0.35)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, TR * 1.5, 0.4, 2.4); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, TR * 1.5, 3.5, 5.5); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.shadowBlur = 18; ctx.shadowColor = g.buffs?.over > 0 ? "#fbbf24" : s.glass ? "#f43f5e" : "#22d3ee";
    const tg = ctx.createRadialGradient(cx, cy, 1, cx, cy, TR); tg.addColorStop(0, g.buffs?.over > 0 ? "#fde68a" : "#a5f3fc"); tg.addColorStop(1, g.buffs?.over > 0 ? "#d97706" : s.glass ? "#b91c1c" : "#0891b2");
    ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(cx, cy, TR, 0, 6.2832); ctx.fill(); ctx.restore();
    ctx.strokeStyle = "#cffafe"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(cx, cy, TR, 0, 6.2832); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(cx, cy, TR * 0.4, 0, 6.2832); ctx.fill();
    if (!g.waveActive && !g.gameOver) { ctx.fillStyle = "rgba(103,232,249,0.9)"; ctx.font = "700 12px 'Orbitron',monospace"; ctx.textAlign = "center"; ctx.fillText(`第 ${g.wave + 1} 波來襲`, cx, cy - L(W.spawnR) - 4); }
  }

  const uw = unlockedWeapons(metaV.nodes);

  return (
    <div style={{ height: "100dvh", width: "100%", maxWidth: 480, margin: "0 auto", background: "#04060a", color: "#e2e8f0", display: "flex", flexDirection: "column", fontFamily: "'Rajdhani','Noto Sans TC','Segoe UI',sans-serif", overflow: "hidden", userSelect: "none", WebkitUserSelect: "none", position: "relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=Rajdhani:wght@500;600;700&family=Noto+Sans+TC:wght@500;700&display=swap');*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}button{font-family:inherit}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:3px}`}</style>

      {screen === "menu" ? (
        <Menu metaV={metaV} onStart={() => setOverlay("diff")} onPerm={() => setOverlay("perm")} onCodes={() => setOverlay("codes")} />
      ) : (
        <>
          <div style={{ padding: "8px 10px 6px", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
              <button onClick={toMenu} style={{ ...miniBtn, minWidth: 34 }}>‹</button>
              <Pill label="波次" v={hud.wave} c="#67e8f9" />
              <Pill label="🪙金幣" v={hud.gold.toLocaleString()} c="#fcd34d" />
              <Pill label="💎鑽石" v={metaV.diamonds.toLocaleString()} c="#67e8f9" />
              <Pill label="難度" v={DIFF[hud.diff].name} c={DIFF[hud.diff].col} />
              <button onClick={() => setPaused((p) => !p)} style={{ ...miniBtn, minWidth: 34 }}>{paused ? "▶" : "❚❚"}</button>
            </div>
            <div style={{ marginTop: 5, height: 8, background: "#0f172a", borderRadius: 4, overflow: "hidden", border: "1px solid #1e293b" }}>
              <div style={{ height: "100%", width: `${Math.max(0, (hud.hp / hud.maxHp) * 100)}%`, background: hud.hp / hud.maxHp > 0.3 ? "linear-gradient(90deg,#22d3ee,#34d399)" : "linear-gradient(90deg,#f43f5e,#fb923c)", transition: "width .1s linear" }} />
            </div>
          </div>

          <div ref={wrapRef} style={{ flex: "1 1 auto", minHeight: 0, position: "relative", touchAction: "none" }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
            <div style={{ position: "absolute", top: 6, right: 8, fontSize: 9, color: "#475569" }}>雙指縮放</div>
            {hud.gameOver && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(4,6,10,0.86)", backdropFilter: "blur(3px)" }}>
                <div style={{ fontFamily: "'Orbitron',monospace", fontWeight: 800, fontSize: 26, color: "#f43f5e", letterSpacing: 2 }}>基地淪陷</div>
                <div style={{ color: "#94a3b8", margin: "6px 0 3px", fontSize: 14 }}>抵達第 {hud.wave} 波</div>
                <div style={{ color: "#67e8f9", fontSize: 13, marginBottom: 14 }}>鑽石已結算 · 回選單強化技能地圖</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={restart} style={{ ...miniBtn, fontSize: 14, padding: "10px 20px", background: "#0e7490", color: "#ecfeff", border: "1px solid #22d3ee" }}>↻ 再來一局</button>
                  <button onClick={toMenu} style={{ ...miniBtn, fontSize: 14, padding: "10px 20px" }}>主選單</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 6, padding: "8px 10px 4px", flexShrink: 0, overflowX: "auto" }}>
            {Object.keys(WEAPONS).map((k) => { const locked = !uw.includes(k), active = weapon === k;
              return (<button key={k} onClick={() => !locked && setWeapon(k)} disabled={locked} style={{ flex: "1 0 auto", minWidth: 58, padding: "6px 4px", borderRadius: 10, border: `1px solid ${active ? "#22d3ee" : locked ? "#1e293b" : "#334155"}`, background: active ? "rgba(34,211,238,0.16)" : "rgba(15,23,42,0.5)", color: active ? "#67e8f9" : locked ? "#475569" : "#cbd5e1", cursor: locked ? "default" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Icon type={WEAPONS[k].icon} size={18} color={active ? "#67e8f9" : locked ? "#475569" : "#cbd5e1"} />
                <span style={{ fontSize: 9, fontWeight: 700 }}>{locked ? "🔒" : WEAPONS[k].name}</span></button>); })}
          </div>

          <div style={{ display: "flex", gap: 6, padding: "2px 10px 6px", flexShrink: 0 }}>
            {ABILITIES.map((ab) => { const cd = cds[ab.key], ready = cd <= 0, pct = ready ? 0 : cd / ab.cd;
              return (<button key={ab.key} onClick={() => useAbility(ab.key)} disabled={!ready} style={{ flex: 1, position: "relative", overflow: "hidden", height: 46, borderRadius: 11, border: `1px solid ${ready ? ab.color : "#1e293b"}`, background: ready ? `${ab.color}22` : "#0b1220", color: ready ? ab.color : "#475569", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: ready ? "pointer" : "default" }}>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${pct * 100}%`, background: "rgba(2,6,12,0.72)" }} />
                <span style={{ fontSize: 16, zIndex: 1, lineHeight: 1 }}>{ab.icon}</span>
                <span style={{ fontSize: 9, zIndex: 1, fontWeight: 700 }}>{ready ? ab.name : Math.ceil(cd) + "s"}</span></button>); })}
          </div>

          <div style={{ display: "flex", gap: 6, padding: "0 10px 6px", flexShrink: 0 }}>
            {Object.keys(TREE).map((cat) => (<button key={cat} onClick={() => setSkillCat(cat)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: `1px solid ${skillCat === cat ? TREE[cat].col : "#1e293b"}`, background: skillCat === cat ? `${TREE[cat].col}1f` : "rgba(15,23,42,0.5)", color: skillCat === cat ? TREE[cat].col : "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{TREE[cat].name}</button>))}
          </div>

          <div style={{ flexShrink: 0, padding: "0 10px 12px" }}>
            <div style={{ display: "flex", gap: 7, justifyContent: "space-around" }}>
              {Object.keys(TREE[skillCat].items).map((k) => { const def = TREE[skillCat].items[k], lvl = skillV[k], capped = def.cap && lvl >= def.cap, c = cost(def, lvl), ok = !capped && hud.gold >= c;
                return <SkillCell key={k} def={def} lvl={lvl} capped={capped} c={c} ok={ok} col={TREE[skillCat].col} onClick={() => buySkill(k)} />; })}
            </div>
            <div style={{ fontSize: 9, color: "#475569", textAlign: "center", marginTop: 6 }}>長按圖示看詳細數值</div>
          </div>
        </>
      )}

      {overlay === "diff" && (
        <Overlay title="選擇難度" onClose={() => setOverlay(null)}>
          {Object.keys(DIFF).map((dk) => { const dd = DIFF[dk];
            return (<button key={dk} onClick={() => startGame(dk)} style={{ width: "100%", textAlign: "left", padding: "14px 16px", marginBottom: 8, borderRadius: 12, border: `1px solid ${dd.col}55`, background: `${dd.col}14`, color: "#e2e8f0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontWeight: 700, fontSize: 17, color: dd.col }}>{dd.name}</div><div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{dd.desc}</div></div>
              <div style={{ fontSize: 11, color: "#64748b", textAlign: "right" }}>敵人 ×{dd.ehp}<br />鑽石 ×{dd.gem}</div></button>); })}
        </Overlay>
      )}
      {overlay === "perm" && (
        <Overlay title="技能地圖 · 💎鑽石" onClose={() => setOverlay(null)} extra={<span style={{ color: "#67e8f9", fontWeight: 700 }}>💎 {metaV.diamonds.toLocaleString()}</span>}>
          <SkillMap nodes={metaV.nodes} diamonds={metaV.diamonds} onBuy={buyNode} />
        </Overlay>
      )}
      {overlay === "codes" && <CodesOverlay metaRef={metaRef} commitMeta={commitMeta} metaV={metaV} onClose={() => setOverlay(null)} />}
    </div>
  );
}

function Menu({ metaV, onStart, onPerm, onCodes }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 35%, rgba(34,211,238,0.12), transparent 60%)" }} />
      <div style={{ zIndex: 1, textAlign: "center" }}>
        <div style={{ fontFamily: "'Orbitron',monospace", fontWeight: 800, fontSize: 38, letterSpacing: 5, color: "#67e8f9", textShadow: "0 0 22px rgba(34,211,238,0.5)" }}>THE TOWER</div>
        <div style={{ fontSize: 16, letterSpacing: 8, color: "#64748b", marginTop: 2, marginBottom: 26 }}>無 盡 塔 防</div>
        <div style={{ display: "flex", gap: 18, justifyContent: "center", marginBottom: 30, fontSize: 14 }}>
          <span style={{ color: "#67e8f9" }}>💎 {metaV.diamonds.toLocaleString()}</span>
          <span style={{ color: "#c4b5fd" }}>⭐ 最佳 第{metaV.bestWave}波</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 240, margin: "0 auto" }}>
          <button onClick={onStart} style={menuBtn("#0e7490", "#22d3ee", "#ecfeff", true)}>▶ 開始遊戲</button>
          <button onClick={onPerm} style={menuBtn("rgba(15,23,42,0.7)", "#334155", "#cbd5e1")}>💎 技能地圖</button>
          <button onClick={onCodes} style={menuBtn("rgba(15,23,42,0.7)", "#334155", "#cbd5e1")}>💾 進度代碼</button>
        </div>
        <p style={{ fontSize: 11, color: "#475569", marginTop: 28, maxWidth: 280, lineHeight: 1.6 }}>進度不會自動保存。離開前請至「進度代碼」複製代碼，下次貼回即可還原。</p>
      </div>
    </div>
  );
}

function SkillMap({ nodes, diamonds, onBuy }) {
  const [sel, setSel] = useState("core");
  const [view, setView] = useState({ tx: 0, ty: 0, zoom: 1.15 });
  const box = useRef(null);
  const drag = useRef({ down: false, moved: false, sx: 0, sy: 0, otx: 0, oty: 0, lp: null, lpFired: false });
  const pinchRef = useRef({ active: false, d0: 0, oz: 1 });
  const VW = 760, VH = 760, ORIGIN = 380;
  const big = countBig(nodes);

  const screenToWorld = (clientX, clientY) => {
    const r = box.current.getBoundingClientRect();
    const sx = (clientX - r.left) / r.width * VW - ORIGIN;
    const sy = (clientY - r.top) / r.height * VH - ORIGIN;
    return { wx: (sx - view.tx) / view.zoom, wy: (sy - view.ty) / view.zoom };
  };
  const hit = (clientX, clientY) => {
    const { wx, wy } = screenToWorld(clientX, clientY);
    let found = null, fd = 1e9;
    for (const n of NODES) { const rr = n.t === "keystone" ? 30 : isBig(n) ? 26 : n.t === "weapon" || n.t === "core" || n.t === "curse" ? 22 : 19;
      const dd = (n.x - wx) ** 2 + (n.y - wy) ** 2; if (dd < rr * rr && dd < fd) { fd = dd; found = n; } }
    return found;
  };
  const zoomBy = (f) => setView((v) => ({ ...v, zoom: Math.max(0.6, Math.min(2.4, +(v.zoom * f).toFixed(3))) }));
  const onDown = (e) => { if (pinchRef.current.active) return; const t = e.touches ? e.touches[0] : e;
    drag.current = { ...drag.current, down: true, moved: false, sx: t.clientX, sy: t.clientY, otx: view.tx, oty: view.ty, lpFired: false };
    const nd = hit(t.clientX, t.clientY);
    drag.current.lp = setTimeout(() => { if (!drag.current.moved && nd) { drag.current.lpFired = true; setSel(nd.id); } }, 300); };
  const onMove = (e) => { if (!drag.current.down || pinchRef.current.active) return;
    const t = e.touches ? e.touches[0] : e, dx = t.clientX - drag.current.sx, dy = t.clientY - drag.current.sy;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) { drag.current.moved = true; clearTimeout(drag.current.lp);
      const r = box.current.getBoundingClientRect(), kx = VW / r.width, ky = VH / r.height;
      setView((v) => ({ ...v, tx: drag.current.otx + dx * kx, ty: drag.current.oty + dy * ky })); } };
  const onUp = (e) => { clearTimeout(drag.current.lp); const wasMoved = drag.current.moved, fired = drag.current.lpFired; drag.current.down = false;
    if (wasMoved || fired || pinchRef.current.active) return;
    const t = e.changedTouches ? e.changedTouches[0] : e, nd = hit(t.clientX, t.clientY);
    if (!nd) return; setSel(nd.id);
    const owned = (nodes[nd.id] || 0) >= 1;
    if (owned) { if (isBig(nd)) onBuy(nd.id); return; }
    if (isNodeUnlocked(nd, nodes) && diamonds >= nd.cost && !(isBig(nd) && big >= MAX_BIG)) onBuy(nd.id); };
  const dist2 = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const onTStart = (e) => { if (e.touches.length === 2) { pinchRef.current = { active: true, d0: dist2(e.touches[0], e.touches[1]) || 1, oz: view.zoom }; clearTimeout(drag.current.lp); drag.current.down = false; drag.current.moved = false; } };
  const onTMove = (e) => { if (pinchRef.current.active && e.touches.length === 2) { const d = dist2(e.touches[0], e.touches[1]); setView((v) => ({ ...v, zoom: Math.max(0.6, Math.min(2.4, pinchRef.current.oz * d / pinchRef.current.d0)) })); } };
  const onTEnd = (e) => { if (e.touches.length < 2) pinchRef.current.active = false; };

  const selNode = sel ? nodeById[sel] : null;
  const selOwned = selNode ? (nodes[selNode.id] || 0) >= 1 : false;
  const selUnlocked = selNode ? isNodeUnlocked(selNode, nodes) : false;
  const selBigBlocked = selNode ? isBig(selNode) && !selOwned && big >= MAX_BIG : false;
  const tmap = { small: "小型", major: "大型", curse: "詛咒", keystone: "終極", weapon: "武器", core: "核心" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#64748b" }}>拖曳平移 · 雙指縮放 · 長按看說明</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => zoomBy(1 / 1.25)} style={{ width: 30, height: 26, borderRadius: 7, border: "1px solid #334155", background: "rgba(15,23,42,0.7)", color: "#cbd5e1", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>−</button>
          <button onClick={() => zoomBy(1.25)} style={{ width: 30, height: 26, borderRadius: 7, border: "1px solid #334155", background: "rgba(15,23,42,0.7)", color: "#cbd5e1", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>＋</button>
          <span style={{ fontSize: 11, color: big >= MAX_BIG ? "#f43f5e" : "#fbbf24", fontWeight: 700, marginLeft: 4 }}>大型 {big}/{MAX_BIG}</span>
        </div>
      </div>
      <div ref={box} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => { clearTimeout(drag.current.lp); drag.current.down = false; }}
        onTouchStart={onTStart} onTouchMove={onTMove} onTouchEnd={onTEnd}
        style={{ width: "100%", height: "42vh", overflow: "hidden", borderRadius: 12, background: "radial-gradient(circle at 50% 50%, #0a1424, #060c16)", border: "1px solid #131c2e", touchAction: "none", cursor: "grab" }}>
        <svg viewBox={`-${ORIGIN} -${ORIGIN} ${VW} ${VH}`} style={{ width: "100%", height: "100%", display: "block" }}>
          <g transform={`translate(${view.tx},${view.ty}) scale(${view.zoom})`}>
            {NODES.map((nd) => { const parents = nd.reqAll || (nd.parent ? [nd.parent] : []);
              return parents.map((pid) => { const p = nodeById[pid], on = (nodes[pid] || 0) >= 1, cu = nd.t === "curse" || p.t === "curse";
                return <line key={"l" + nd.id + pid} x1={nd.x} y1={nd.y} x2={p.x} y2={p.y} stroke={on ? (cu ? "#f43f5e" : NODE_COL[nd.br]) : "#1e293b"} strokeWidth={on ? 3 : 2} opacity={on ? 0.6 : 0.35} strokeDasharray={cu ? "5 4" : "none"} />; }); })}
            {NODES.map((nd) => { const owned = (nodes[nd.id] || 0) >= 1, unlocked = isNodeUnlocked(nd, nodes), afford = unlocked && !owned && diamonds >= nd.cost;
              const blocked = isBig(nd) && !owned && big >= MAX_BIG;
              const col = nd.t === "curse" ? NODE_COL.curse : NODE_COL[nd.br];
              const rN = nd.t === "keystone" ? 30 : isBig(nd) ? 26 : nd.t === "weapon" || nd.t === "core" || nd.t === "curse" ? 22 : 19;
              const isz = Math.round(rN * 0.9);
              return (
                <g key={nd.id} style={{ cursor: "pointer" }}>
                  {sel === nd.id && <circle cx={nd.x} cy={nd.y} r={rN + 5} fill="none" stroke={col} strokeWidth="2" opacity="0.7" />}
                  {isBig(nd) && <circle cx={nd.x} cy={nd.y} r={rN + 3} fill="none" stroke={owned ? col : "#334155"} strokeWidth="1.5" opacity="0.5" />}
                  <circle cx={nd.x} cy={nd.y} r={rN} fill={owned ? col + "44" : afford ? col + "22" : blocked ? "#1a1015" : "#0b1220"}
                    stroke={owned ? col : blocked ? "#7f1d1d" : afford ? col : unlocked ? "#475569" : "#1e293b"} strokeWidth={nd.t === "keystone" ? 3 : isBig(nd) ? 2.5 : 1.8} opacity={unlocked || owned ? 1 : 0.42} />
                  <g transform={`translate(${nd.x - isz / 2}, ${nd.y - isz / 2})`} opacity={unlocked || owned ? 1 : 0.5}>
                    <foreignObject x="0" y="0" width={isz} height={isz}><div xmlns="http://www.w3.org/1999/xhtml" style={{ width: isz, height: isz }}><Icon type={nd.icon} size={isz} color={owned ? "#fff" : nd.t === "curse" ? "#fca5a5" : unlocked ? "#e2e8f0" : "#475569"} /></div></foreignObject>
                  </g>
                  {!unlocked && !owned && <text x={nd.x} y={nd.y + rN + 13} fontSize="12" textAnchor="middle">🔒</text>}
                  {owned && <g><circle cx={nd.x + rN - 4} cy={nd.y - rN + 4} r="7" fill="#16a34a" stroke="#4ade80" strokeWidth="1.2" /><path d={`M${nd.x + rN - 7.5} ${nd.y - rN + 4}l2 2.4 3.4-4`} stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
                </g>
              ); })}
          </g>
        </svg>
      </div>
      <div style={{ marginTop: 10, minHeight: 92, borderRadius: 12, border: `1px solid ${selNode ? (selNode.t === "curse" ? "#f43f5e" : NODE_COL[selNode.br]) + "55" : "#1e293b"}`, background: "rgba(15,23,42,0.5)", padding: "10px 12px" }}>
        {selNode && (() => {
          const col = selNode.t === "curse" ? NODE_COL.curse : NODE_COL[selNode.br];
          const dsc = nodeDesc(selNode);
          return (<>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: col }}>{selNode.name} <span style={{ fontSize: 10, color: "#64748b" }}>· {tmap[selNode.t]}</span></span>
              <span style={{ fontSize: 11, color: selOwned ? "#4ade80" : "#64748b" }}>{selOwned ? "已點亮" : selUnlocked ? "可點亮" : "未解鎖"}</span>
            </div>
            <div style={{ fontSize: 12, color: "#cbd5e1", margin: "4px 0 8px", lineHeight: 1.5 }}>{selNode.weapon ? WEAPONS[selNode.weapon].desc : selNode.info || dsc}{!selNode.weapon && selNode.info && dsc ? `（${dsc}）` : ""}</div>
            {selBigBlocked ? <div style={{ fontSize: 12, color: "#f43f5e", textAlign: "center", padding: "8px 0" }}>大型節點已達上限 {MAX_BIG}/{MAX_BIG}，需先取消其他大型節點</div> :
              <button onClick={() => { const owned = (nodes[selNode.id] || 0) >= 1; if (owned) { if (isBig(selNode)) onBuy(selNode.id); } else if (selUnlocked && diamonds >= selNode.cost) onBuy(selNode.id); }}
                disabled={(selOwned && !isBig(selNode)) || (!selOwned && (!selUnlocked || diamonds < selNode.cost))}
                style={{ width: "100%", padding: "9px 0", borderRadius: 9, fontWeight: 700, fontSize: 13, fontFamily: "'Orbitron',monospace",
                  cursor: (selOwned && isBig(selNode)) || (!selOwned && selUnlocked && diamonds >= selNode.cost) ? "pointer" : "default",
                  border: `1px solid ${selOwned ? (isBig(selNode) ? "#f43f5e" : "#16a34a") : !selUnlocked ? "#1e293b" : diamonds >= selNode.cost ? "#22d3ee" : "#334155"}`,
                  background: selOwned ? (isBig(selNode) ? "rgba(244,63,94,0.15)" : "rgba(22,163,74,0.18)") : diamonds >= selNode.cost && selUnlocked ? "rgba(14,116,144,0.35)" : "rgba(15,23,42,0.6)",
                  color: selOwned ? (isBig(selNode) ? "#fca5a5" : "#4ade80") : !selUnlocked ? "#64748b" : diamonds >= selNode.cost ? "#a5f3fc" : "#64748b" }}>
                {selOwned ? (isBig(selNode) ? `取消並退還 💎 ${selNode.cost}` : "✓ 已點亮") : !selUnlocked ? "需先點亮前置節點" : `點亮  💎 ${selNode.cost.toLocaleString()}`}
              </button>}
          </>);
        })()}
      </div>
      <p style={{ fontSize: 11, color: "#475569", marginTop: 10, lineHeight: 1.6 }}>三大區塊：攻擊(左)、防禦(右)、混合(下)。<span style={{ color: "#f43f5e" }}>詛咒節點</span>有負面代價但通往更強分支(永久不可取消)。<span style={{ color: "#fbbf24" }}>大型/終極節點</span>最多點亮 {MAX_BIG} 個，可取消退款重新配置。</p>
    </div>
  );
}
function nodeDesc(nd) {
  const b = nd.bonus || {}, parts = [];
  if (b.dmgM) parts.push(`傷害 ${b.dmgM > 0 ? "+" : ""}${(b.dmgM * 100).toFixed(0)}%`);
  if (b.rateM) parts.push(`攻速 ${b.rateM > 0 ? "+" : ""}${(b.rateM * 100).toFixed(0)}%`);
  if (b.hpM) parts.push(`生命 ${b.hpM > 0 ? "+" : ""}${(b.hpM * 100).toFixed(0)}%`);
  if (b.goldM) parts.push(`金幣 +${(b.goldM * 100).toFixed(0)}%`);
  if (b.critC) parts.push(`暴擊 +${(b.critC * 100).toFixed(0)}%`);
  if (b.regen) parts.push(`恢復 +${b.regen}/s`);
  if (b.armor) parts.push(`護甲 +${b.armor}`);
  if (b.thorns) parts.push(`灼燒 +${b.thorns}/s`);
  if (b.splash) parts.push(`濺射 +${(b.splash * 100).toFixed(0)}%`);
  if (b.multishot) parts.push(`+${b.multishot} 發子彈`);
  if (b.pierce) parts.push(`穿透 +${b.pierce}`);
  if (b.orbs) parts.push(`+${b.orbs} 無人機`);
  if (b.gem) parts.push(`鑽石 +${(b.gem * 100).toFixed(0)}%`);
  if (b.lifesteal) parts.push(`擊殺回血`);
  if (b.takeDmg) parts.push(`受傷 +${(b.takeDmg * 100).toFixed(0)}%`);
  return parts.join("、");
}

function CodesOverlay({ metaRef, commitMeta, metaV, onClose }) {
  const [input, setInput] = useState(""); const [msg, setMsg] = useState(null);
  const current = encodeSave(metaV.diamonds, metaV.nodes, metaV.bestWave);
  const copy = async () => { try { await navigator.clipboard.writeText(current); setMsg({ t: "ok", m: "已複製到剪貼簿" }); } catch { setMsg({ t: "ok", m: "請長按上方代碼手動複製" }); } };
  const load = () => { const r = decodeSave(input); if (!r) { setMsg({ t: "err", m: "代碼無效（格式或校驗失敗）" }); return; }
    metaRef.current.diamonds = r.diamonds; metaRef.current.nodes = { ...ZERO_NODES, ...r.nodes }; metaRef.current.bestWave = r.bestWave; commitMeta(); setMsg({ t: "ok", m: `讀取成功 · 💎${r.diamonds} · 最佳第${r.bestWave}波` }); };
  return (
    <Overlay title="進度代碼" onClose={onClose}>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>你目前的進度代碼</div>
      <div onClick={copy} style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, letterSpacing: 1, color: "#67e8f9", background: "#0b1220", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 14px", textAlign: "center", cursor: "pointer", wordBreak: "break-all", userSelect: "all", WebkitUserSelect: "all" }}>{current}</div>
      <button onClick={copy} style={{ ...miniBtn, width: "100%", marginTop: 8, padding: "10px 0", background: "#0e7490", color: "#ecfeff", border: "1px solid #22d3ee" }}>複製代碼</button>
      <div style={{ height: 1, background: "#1e293b", margin: "18px 0" }} />
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>貼上代碼以還原進度</div>
      <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="貼上代碼…" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, background: "#0b1220", border: "1px solid #334155", color: "#e2e8f0", fontSize: 13, fontFamily: "'Orbitron',monospace", letterSpacing: 1, outline: "none", textTransform: "uppercase" }} />
      <button onClick={load} style={{ ...miniBtn, width: "100%", marginTop: 8, padding: "10px 0", background: "rgba(14,116,144,0.3)", color: "#a5f3fc", border: "1px solid #0e7490" }}>讀取代碼</button>
      {msg && <div style={{ marginTop: 12, fontSize: 13, textAlign: "center", color: msg.t === "ok" ? "#4ade80" : "#f87171" }}>{msg.m}</div>}
      <p style={{ fontSize: 11, color: "#475569", marginTop: 14, lineHeight: 1.6 }}>代碼記錄鑽石、技能地圖所有節點與最佳波次，含校驗碼。讀取會覆蓋目前進度，竄改後失效。</p>
    </Overlay>
  );
}

function Overlay({ title, children, onClose, extra }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(4,6,10,0.82)", backdropFilter: "blur(4px)", zIndex: 20, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ flex: 1 }} />
      <div style={{ background: "#080d16", borderTop: "1px solid #1e293b", borderRadius: "18px 18px 0 0", padding: "16px 14px calc(16px + env(safe-area-inset-bottom))", maxHeight: "90dvh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontFamily: "'Orbitron',monospace", fontWeight: 700, fontSize: 16, color: "#e2e8f0", letterSpacing: 1 }}>{title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>{extra}<button onClick={onClose} style={{ ...miniBtn, padding: "4px 12px" }}>✕</button></div>
        </div>
        {children}
      </div>
    </div>
  );
}
function Pill({ label, v, c }) {
  return (<div style={{ flex: "1 1 auto", textAlign: "center", minWidth: 0 }}>
    <div style={{ fontSize: 9, color: "#64748b", whiteSpace: "nowrap" }}>{label}</div>
    <div style={{ fontFamily: "'Orbitron',monospace", fontWeight: 700, fontSize: 13, color: c, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</div>
  </div>);
}
function SkillCell({ def, lvl, capped, c, ok, col, onClick }) {
  const [tip, setTip] = useState(false);
  const t = useRef(null), longF = useRef(false);
  const down = () => { longF.current = false; t.current = setTimeout(() => { longF.current = true; setTip(true); }, 320); };
  const up = () => { clearTimeout(t.current); if (!longF.current && !capped && ok) onClick(); setTip(false); };
  const leave = () => { clearTimeout(t.current); setTip(false); };
  return (
    <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {tip && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", width: 134, background: "#0b1220", border: `1px solid ${col}`, borderRadius: 8, padding: "8px 10px", zIndex: 10, fontSize: 11, color: "#e2e8f0", boxShadow: "0 4px 14px rgba(0,0,0,0.55)" }}>
          <div style={{ fontWeight: 700, color: col, marginBottom: 3 }}>{def.name}</div>
          <div style={{ color: "#94a3b8" }}>目前：{lvl > 0 ? def.fmt(lvl) : "未升級"}</div>
          <div style={{ color: "#cbd5e1" }}>下一級：{def.cap && lvl >= def.cap ? "已滿級" : def.nxt}</div>
        </div>
      )}
      <button onPointerDown={down} onPointerUp={up} onPointerLeave={leave}
        style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 11, border: `1px solid ${ok ? col + "99" : "#1e293b"}`, background: ok ? col + "16" : "rgba(15,23,42,0.55)", color: "#e2e8f0", cursor: capped || !ok ? "default" : "pointer", opacity: capped ? 0.5 : 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: 2 }}>
        <Icon type={def.icon} size={22} color={ok ? col : "#64748b"} />
        <span style={{ fontSize: 8, color: "#64748b", lineHeight: 1 }}>Lv{lvl}{def.cap ? "/" + def.cap : ""}</span>
        <span style={{ fontFamily: "'Orbitron',monospace", fontWeight: 700, fontSize: 9, color: capped ? "#475569" : ok ? "#fcd34d" : "#64748b" }}>{capped ? "MAX" : `🪙${c}`}</span>
      </button>
    </div>
  );
}
const miniBtn = { background: "rgba(15,23,42,0.8)", border: "1px solid #334155", color: "#cbd5e1", borderRadius: 8, padding: "6px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const menuBtn = (bg, bd, c, big) => ({ background: bg, border: `1px solid ${bd}`, color: c, borderRadius: 12, padding: big ? "15px 0" : "13px 0", fontSize: big ? 17 : 15, fontWeight: 700, letterSpacing: 1, cursor: "pointer" });
