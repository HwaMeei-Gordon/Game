// ── 資料：永久進度（基礎屬性樹 + 各武器樹） ──────────────────
// 兩種樹皆為「節點圖」（parent 前置、bonus 加成）。
//  - BASE_TREE：全域基礎屬性，影響塔與所有武器。
//  - WEAPON_TREE[wk]：每把武器專屬樹，只強化該武器。
// 通用工具函式以 (tree 陣列, owned 擁有對照表) 操作；節點 id 全域唯一（含前綴）。
export const NODE_COL = { base: "#67e8f9", weapon: "#fca5a5", curse: "#f43f5e" };

// 全域基礎屬性樹
export const BASE_TREE = [
  { id: "b_core",  x: 0,    y: 0,   parent: null,     name: "核心",   icon: "core",   cost: 0,   bonus: { dmgM: 0.03, hpM: 0.03 }, info: "起點，免費啟動。" },
  { id: "b_dmg1",  x: -130, y: 110, parent: "b_core", name: "攻擊力", icon: "dmg",    cost: 40,  bonus: { dmgM: 0.08 } },
  { id: "b_hp1",   x: 0,    y: 110, parent: "b_core", name: "生命",   icon: "hp",     cost: 40,  bonus: { hpM: 0.10 } },
  { id: "b_armor1",x: 130,  y: 110, parent: "b_core", name: "防禦",   icon: "armor",  cost: 40,  bonus: { armor: 14 } },
  { id: "b_dmg2",  x: -180, y: 220, parent: "b_dmg1", name: "攻擊力", icon: "dmg",    cost: 70,  bonus: { dmgM: 0.10 } },
  { id: "b_crit",  x: -70,  y: 220, parent: "b_dmg1", name: "暴擊",   icon: "crit",   cost: 80,  bonus: { critC: 0.05 } },
  { id: "b_hp2",   x: 20,   y: 220, parent: "b_hp1",  name: "生命",   icon: "hp",     cost: 70,  bonus: { hpM: 0.12 } },
  { id: "b_regen", x: 110,  y: 220, parent: "b_hp1",  name: "恢復",   icon: "regen",  cost: 80,  bonus: { regen: 3 } },
  { id: "b_armor2",x: 200,  y: 220, parent: "b_armor1",name: "防禦",  icon: "armor",  cost: 80,  bonus: { armor: 20 } },
  { id: "b_dmg3",  x: -180, y: 330, parent: "b_dmg2", name: "攻擊力", icon: "dmg",    cost: 120, bonus: { dmgM: 0.12 } },
  { id: "b_gold",  x: -50,  y: 330, parent: "b_crit", name: "拾荒",   icon: "gold",   cost: 90,  bonus: { goldM: 0.15 } },
  { id: "b_gem",   x: 80,   y: 330, parent: "b_regen",name: "鑽石",   icon: "gem",    cost: 100, bonus: { gem: 0.20 } },
  { id: "b_range", x: 200,  y: 330, parent: "b_armor2",name: "視野",  icon: "range",  cost: 120, bonus: { rangeFlat: 0.30 } },
];

// 各武器專屬樹（只強化該武器；special 為該武器的進階強節點）
export const WEAPON_TREE = {
  cannon: [
    { id: "c_dmg1",   x: 0,   y: 0,   parent: null,     name: "膛線",   icon: "dmg",    cost: 60,  bonus: { dmgM: 0.10 } },
    { id: "c_multi1", x: -90, y: 110, parent: "c_dmg1", name: "散射",   icon: "multi",  cost: 120, bonus: { multishot: 1 } },
    { id: "c_splash1",x: 90,  y: 110, parent: "c_dmg1", name: "爆裂彈", icon: "splash", cost: 100, bonus: { splash: 0.18 } },
    { id: "c_dmg2",   x: 0,   y: 220, parent: "c_dmg1", name: "重砲",   icon: "dmg",    cost: 140, bonus: { dmgM: 0.15 } },
    { id: "c_pierce1",x: -90, y: 220, parent: "c_multi1",name: "穿甲彈",icon: "pierce", cost: 120, bonus: { pierce: 1 } },
    { id: "c_multi2", x: -90, y: 330, parent: "c_pierce1",name: "彈幕", icon: "multi", cost: 240, bonus: { multishot: 2 }, special: 1, info: "標準彈專屬：齊射 +2 發。" },
  ],
  homing: [
    { id: "h_dmg1",   x: 0,   y: 0,   parent: null,     name: "彈頭",   icon: "dmg",    cost: 60,  bonus: { dmgM: 0.10 } },
    { id: "h_multi1", x: -90, y: 110, parent: "h_dmg1", name: "齊發",   icon: "multi",  cost: 120, bonus: { multishot: 1 } },
    { id: "h_splash1",x: 90,  y: 110, parent: "h_dmg1", name: "爆破",   icon: "splash", cost: 120, bonus: { splash: 0.25 } },
    { id: "h_rate1",  x: 0,   y: 220, parent: "h_dmg1", name: "裝填",   icon: "rate",   cost: 120, bonus: { rateM: 0.12 } },
    { id: "h_dmg2",   x: -90, y: 220, parent: "h_multi1",name: "追命",  icon: "dmg",    cost: 200, bonus: { dmgM: 0.18, splash: 0.15 }, special: 1, info: "追蹤彈專屬：傷害與爆破再強化。" },
  ],
  laser: [
    { id: "l_dmg1",   x: 0,   y: 0,   parent: null,     name: "聚能",   icon: "dmg",    cost: 60,  bonus: { dmgM: 0.10 } },
    { id: "l_beam1",  x: -80, y: 110, parent: "l_dmg1", name: "分光",   icon: "multi",  cost: 150, bonus: { multishot: 1 } },
    { id: "l_dmg2",   x: 80,  y: 110, parent: "l_dmg1", name: "高頻",   icon: "dmg",    cost: 120, bonus: { dmgM: 0.15 } },
    { id: "l_dmg3",   x: 0,   y: 220, parent: "l_dmg2", name: "過載光束",icon: "laser", cost: 220, bonus: { dmgM: 0.25 }, special: 1, info: "雷射專屬：單體 DPS 暴增。" },
  ],
  chain: [
    { id: "ch_dmg1",  x: 0,   y: 0,   parent: null,     name: "導電",   icon: "dmg",    cost: 60,  bonus: { dmgM: 0.10 } },
    { id: "ch_bounce1",x: -80,y: 110, parent: "ch_dmg1",name: "增幅",   icon: "chain",  cost: 120, bonus: { bounce: 1 } },
    { id: "ch_rate1", x: 80,  y: 110, parent: "ch_dmg1",name: "充能",   icon: "rate",   cost: 120, bonus: { rateM: 0.12 } },
    { id: "ch_dmg2",  x: 0,   y: 220, parent: "ch_dmg1",name: "高壓",   icon: "dmg",    cost: 140, bonus: { dmgM: 0.15 } },
    { id: "ch_bounce2",x: -80,y: 220, parent: "ch_bounce1",name: "連鎖風暴",icon: "chain",cost: 220, bonus: { bounce: 2 }, special: 1, info: "折射專屬：彈射 +2 次。" },
  ],
  flame: [
    { id: "f_dmg1",   x: 0,   y: 0,   parent: null,     name: "高溫",   icon: "dmg",    cost: 60,  bonus: { dmgM: 0.12 } },
    { id: "f_range1", x: -80, y: 110, parent: "f_dmg1", name: "擴焰",   icon: "flame",  cost: 100, bonus: { frange: 0.15 } },
    { id: "f_dmg2",   x: 80,  y: 110, parent: "f_dmg1", name: "白熱",   icon: "dmg",    cost: 140, bonus: { dmgM: 0.18 } },
    { id: "f_range2", x: 0,   y: 220, parent: "f_range1",name: "烈焰風暴",icon: "flame",cost: 220, bonus: { frange: 0.30 }, special: 1, info: "火焰專屬：火域大幅擴張。" },
  ],
};

// ── 通用工具（以 tree 陣列 + owned 對照表操作） ──
export function nodeMap(tree) { const m = {}; for (const n of tree) m[n.id] = n; return m; }
export function isNodeUnlocked(def, owned) { if (!def.parent) return true; return (owned[def.parent] || 0) >= 1; }
export function treeBonus(tree, owned, key) { let v = 0; for (const n of tree) if (n.bonus && n.bonus[key]) v += n.bonus[key] * (owned[n.id] || 0); return v; }
export function childrenOf(tree, id) { return tree.filter((n) => n.parent === id); }
export function spentInTree(tree, owned) { let v = 0; for (const n of tree) if (n.cost > 0 && (owned[n.id] || 0) >= 1) v += n.cost; return v; }
export function resetFee(spent) { return spent <= 0 ? 0 : Math.max(20, Math.floor(spent * 0.15)); }

export function nodeDesc(nd) {
  const b = nd.bonus || {}, parts = [];
  if (b.dmgM) parts.push(`傷害 +${(b.dmgM * 100).toFixed(0)}%`);
  if (b.rateM) parts.push(`攻速 +${(b.rateM * 100).toFixed(0)}%`);
  if (b.hpM) parts.push(`生命 +${(b.hpM * 100).toFixed(0)}%`);
  if (b.armor) parts.push(`護甲 +${b.armor}`);
  if (b.critC) parts.push(`暴擊 +${(b.critC * 100).toFixed(0)}%`);
  if (b.regen) parts.push(`恢復 +${b.regen}/s`);
  if (b.goldM) parts.push(`金幣 +${(b.goldM * 100).toFixed(0)}%`);
  if (b.gem) parts.push(`鑽石 +${(b.gem * 100).toFixed(0)}%`);
  if (b.rangeFlat) parts.push(`攻擊範圍 +${b.rangeFlat}`);
  if (b.multishot) parts.push(`+${b.multishot} 發/束`);
  if (b.pierce) parts.push(`穿透 +${b.pierce}`);
  if (b.splash) parts.push(`濺射 +${(b.splash * 100).toFixed(0)}%`);
  if (b.bounce) parts.push(`彈射 +${b.bounce}`);
  if (b.frange) parts.push(`火域 +${(b.frange * 100).toFixed(0)}%`);
  return parts.join("、");
}

// ── 武器箱（購買解鎖 + 基礎數值升級） ──
export const ARMORY = {
  cannon: { unlock: 0,   base: ["dmg", "rate"] },
  homing: { unlock: 120, base: ["dmg", "rate"] },
  laser:  { unlock: 150, base: ["dmg"] },
  chain:  { unlock: 150, base: ["dmg", "rate"] },
  flame:  { unlock: 120, base: ["dmg"] },
};
export const ARMORY_BASE = {
  dmg:  { name: "基礎傷害", icon: "dmg",  per: "+5 傷害" },
  rate: { name: "基礎攻速", icon: "rate", per: "+0.08/s" },
};
export function armoryBaseCost(level) { return Math.floor(45 * Math.pow(1.2, level)); }

export function unlockedWeapons(meta) {
  const w = [];
  for (const wk in ARMORY) if (wk === "cannon" || (meta.weaponsOwned && meta.weaponsOwned[wk])) w.push(wk);
  return w;
}
