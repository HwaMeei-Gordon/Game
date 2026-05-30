// ── 資料：永久進度（基礎屬性樹 + 各武器樹） ──────────────────
// 兩種樹皆為「節點圖」（parent 前置、bonus 加成）。
//  - BASE_TREE：全域基礎屬性，影響塔與所有武器。
//  - WEAPON_TREE[wk]：每把武器專屬樹，只強化該武器。
// 通用工具函式以 (tree 陣列, owned 擁有對照表) 操作；節點 id 全域唯一（含前綴）。
export const NODE_COL = { base: "#67e8f9", weapon: "#fca5a5", curse: "#f43f5e" };

// 全域基礎屬性樹（三條主幹：攻擊 / 防禦 / 經濟，影響塔與所有武器）
export const BASE_TREE = [
  { id: "b_core",  x: 0,    y: 0,   parent: null,     name: "核心",   icon: "core",   cost: 0,   bonus: { dmgM: 0.03, hpM: 0.03 }, info: "起點，免費啟動。" },
  // 攻擊主幹（左）
  { id: "b_dmg1",  x: -150, y: 110, parent: "b_core",  name: "攻擊力", icon: "dmg",   cost: 40,  bonus: { dmgM: 0.08 } },
  { id: "b_dmg2",  x: -210, y: 220, parent: "b_dmg1",  name: "攻擊力", icon: "dmg",   cost: 70,  bonus: { dmgM: 0.10 } },
  { id: "b_crit1", x: -90,  y: 220, parent: "b_dmg1",  name: "暴擊",   icon: "crit",  cost: 80,  bonus: { critC: 0.05 } },
  { id: "b_dmg3",  x: -210, y: 330, parent: "b_dmg2",  name: "攻擊力", icon: "dmg",   cost: 110, bonus: { dmgM: 0.12 } },
  { id: "b_crit2", x: -90,  y: 330, parent: "b_crit1", name: "暴擊",   icon: "crit",  cost: 120, bonus: { critC: 0.05 } },
  { id: "b_dmg4",  x: -210, y: 440, parent: "b_dmg3",  name: "毀滅",   icon: "dmg",   cost: 160, bonus: { dmgM: 0.15 } },
  { id: "b_pen",   x: -90,  y: 440, parent: "b_crit2",  name: "破甲",   icon: "pierce",cost: 150, bonus: { armorPen: 12 }, info: "降低所有武器面對敵方的有效防禦（全武器通用穿甲）。" },
  // 防禦主幹（中）
  { id: "b_hp1",   x: 0,    y: 110, parent: "b_core",  name: "生命",   icon: "hp",    cost: 40,  bonus: { hpM: 0.10 } },
  { id: "b_hp2",   x: -45,  y: 220, parent: "b_hp1",   name: "生命",   icon: "hp",    cost: 70,  bonus: { hpM: 0.12 } },
  { id: "b_armor1",x: 50,   y: 220, parent: "b_hp1",   name: "防禦",   icon: "armor", cost: 70,  bonus: { armor: 14 } },
  { id: "b_regen1",x: -45,  y: 330, parent: "b_hp2",   name: "恢復",   icon: "regen", cost: 100, bonus: { regen: 3 } },
  { id: "b_armor2",x: 55,   y: 330, parent: "b_armor1",name: "防禦",   icon: "armor", cost: 110, bonus: { armor: 22 } },
  { id: "b_hp3",   x: 0,    y: 440, parent: "b_regen1",name: "堅韌",   icon: "hp",    cost: 160, bonus: { hpM: 0.15, regen: 2 } },
  // 經濟主幹（右）
  { id: "b_gold1", x: 160,  y: 110, parent: "b_core",  name: "拾荒",   icon: "gold",  cost: 40,  bonus: { goldM: 0.15 } },
  { id: "b_gold2", x: 110,  y: 220, parent: "b_gold1", name: "暴富",   icon: "gold",  cost: 70,  bonus: { goldM: 0.15 } },
  { id: "b_gem1",  x: 215,  y: 220, parent: "b_gold1", name: "鑽石",   icon: "gem",   cost: 90,  bonus: { gem: 0.20 } },
  { id: "b_gold3", x: 110,  y: 330, parent: "b_gold2", name: "財閥",   icon: "gold",  cost: 120, bonus: { goldM: 0.20 } },
  { id: "b_gem2",  x: 215,  y: 330, parent: "b_gem1",  name: "鑽石",   icon: "gem",   cost: 130, bonus: { gem: 0.25 } },
  { id: "b_range", x: 160,  y: 440, parent: "b_gold3", name: "視野",   icon: "range", cost: 150, bonus: { rangeFlat: 0.30, goldM: 0.10 } },
];

// 各武器專屬樹（順著該武器「攻擊方式」的發展路線；special 為招牌節點）
export const WEAPON_TREE = {
  // 標準彈：直線投射 → 傷害線 / 多重連射線 / 穿透濺射線
  cannon: [
    { id: "c_dmg1",   x: 0,    y: 0,   parent: null,      name: "膛線",   icon: "dmg",    cost: 60,  bonus: { dmgM: 0.10 } },
    { id: "c_dmg2",   x: -120, y: 110, parent: "c_dmg1",  name: "重砲",   icon: "dmg",    cost: 100, bonus: { dmgM: 0.12 } },
    { id: "c_dmg3",   x: -120, y: 220, parent: "c_dmg2",  name: "破壞",   icon: "dmg",    cost: 150, bonus: { dmgM: 0.15 } },
    { id: "c_crit1",  x: -120, y: 330, parent: "c_dmg3",  name: "弱點",   icon: "crit",   cost: 180, bonus: { critC: 0.06 } },
    { id: "c_multi1", x: 0,    y: 110, parent: "c_dmg1",  name: "散射",   icon: "multi",  cost: 120, bonus: { multishot: 1 } },
    { id: "c_rate1",  x: 0,    y: 220, parent: "c_multi1",name: "速射",   icon: "rate",   cost: 140, bonus: { rateM: 0.12 } },
    { id: "c_multi2", x: 0,    y: 330, parent: "c_rate1", name: "彈幕",   icon: "multi",  cost: 260, bonus: { multishot: 2 }, special: 1, info: "招牌：齊射 +2 發。" },
    { id: "c_pierce1",x: 120,  y: 110, parent: "c_dmg1",  name: "穿甲彈", icon: "pierce", cost: 120, bonus: { pierce: 1 } },
    { id: "c_splash1",x: 120,  y: 220, parent: "c_pierce1",name: "爆裂彈",icon: "splash", cost: 140, bonus: { splash: 0.2 } },
    { id: "c_pierce2",x: 120,  y: 330, parent: "c_splash1",name: "貫穿",  icon: "pierce", cost: 180, bonus: { pierce: 1 } },
    { id: "c_splash2",x: 120,  y: 440, parent: "c_pierce2",name: "榴霰",  icon: "splash", cost: 260, bonus: { splash: 0.3 }, special: 1, info: "招牌：濺射大幅提升，成排清場。" },
  ],
  // 追蹤彈：自動追蹤爆破 → 傷害暴擊線 / 多發連射線 / 爆破貫穿線
  homing: [
    { id: "h_dmg1",   x: 0,    y: 0,   parent: null,      name: "彈頭",   icon: "dmg",    cost: 60,  bonus: { dmgM: 0.10 } },
    { id: "h_dmg2",   x: -110, y: 110, parent: "h_dmg1",  name: "聚能彈頭",icon: "dmg",   cost: 110, bonus: { dmgM: 0.12 } },
    { id: "h_crit1",  x: -110, y: 220, parent: "h_dmg2",  name: "精準",   icon: "crit",   cost: 150, bonus: { critC: 0.06 } },
    { id: "h_dmg3",   x: -110, y: 330, parent: "h_crit1", name: "殲滅彈頭",icon: "dmg",   cost: 200, bonus: { dmgM: 0.18 } },
    { id: "h_multi1", x: 0,    y: 110, parent: "h_dmg1",  name: "齊發",   icon: "multi",  cost: 120, bonus: { multishot: 1 } },
    { id: "h_rate1",  x: 0,    y: 220, parent: "h_multi1",name: "裝填",   icon: "rate",   cost: 140, bonus: { rateM: 0.12 } },
    { id: "h_multi2", x: 0,    y: 330, parent: "h_rate1", name: "飽和攻擊",icon: "multi", cost: 240, bonus: { multishot: 1 }, special: 1, info: "招牌：再多一發追蹤彈。" },
    { id: "h_splash1",x: 110,  y: 110, parent: "h_dmg1",  name: "爆破",   icon: "splash", cost: 120, bonus: { splash: 0.25 } },
    { id: "h_pierce1",x: 110,  y: 220, parent: "h_splash1",name: "貫穿彈頭",icon: "pierce",cost: 150, bonus: { pierce: 1 } },
    { id: "h_splash2",x: 110,  y: 330, parent: "h_pierce1",name: "燃燒爆破",icon: "splash",cost: 240, bonus: { splash: 0.3 }, special: 1, info: "招牌：爆破範圍與傷害大增。" },
  ],
  // 雷射：持續鎖定 → 傷害暴擊線 / 多束線 / 聚焦增傷線（頻率+增幅）
  laser: [
    { id: "l_dmg1",   x: 0,    y: 0,   parent: null,      name: "聚能",   icon: "dmg",    cost: 60,  bonus: { dmgM: 0.12 } },
    { id: "l_dmg2",   x: -110, y: 110, parent: "l_dmg1",  name: "高頻",   icon: "dmg",    cost: 120, bonus: { dmgM: 0.15 } },
    { id: "l_crit1",  x: -110, y: 220, parent: "l_dmg2",  name: "灼點",   icon: "crit",   cost: 160, bonus: { critC: 0.08 } },
    { id: "l_pen",    x: -220, y: 110, parent: "l_dmg1",  name: "熔甲",   icon: "pierce", cost: 150, bonus: { armorPen: 14 } },
    { id: "l_dmg3",   x: -110, y: 330, parent: "l_crit1", name: "湮滅光",  icon: "dmg",   cost: 220, bonus: { dmgM: 0.22 }, special: 1, info: "招牌：單體 DPS 暴增。" },
    { id: "l_beam1",  x: 0,    y: 110, parent: "l_dmg1",  name: "分光",   icon: "multi",  cost: 150, bonus: { multishot: 1 } },
    { id: "l_beam2",  x: 0,    y: 220, parent: "l_beam1", name: "稜射",   icon: "multi",  cost: 220, bonus: { multishot: 1 } },
    { id: "l_tick1",  x: 110,  y: 110, parent: "l_dmg1",  name: "脈衝",   icon: "rate",   cost: 130, bonus: { ltick: 1 } },
    { id: "l_amp1",   x: 110,  y: 220, parent: "l_tick1", name: "灼蝕",   icon: "crit",   cost: 160, bonus: { lamp: 2 } },
    { id: "l_tick2",  x: 110,  y: 330, parent: "l_amp1",  name: "共振",   icon: "rate",   cost: 200, bonus: { ltick: 1 } },
    { id: "l_amp2",   x: 110,  y: 440, parent: "l_tick2", name: "崩解",   icon: "dmg",    cost: 260, bonus: { lamp: 3 }, special: 1, info: "招牌：持續同目標，傷害滾雪球更猛。" },
  ],
  // 折射：敵群彈射 → 傷害線 / 跳數分裂線 / 多重發射線
  chain: [
    { id: "ch_dmg1",  x: 0,    y: 0,   parent: null,      name: "導電",   icon: "dmg",    cost: 60,  bonus: { dmgM: 0.10 } },
    { id: "ch_dmg2",  x: -110, y: 110, parent: "ch_dmg1", name: "高壓",   icon: "dmg",    cost: 120, bonus: { dmgM: 0.15 } },
    { id: "ch_rate1", x: -110, y: 220, parent: "ch_dmg2", name: "充能",   icon: "rate",   cost: 140, bonus: { rateM: 0.12 } },
    { id: "ch_crit1", x: -110, y: 330, parent: "ch_rate1",name: "導體",   icon: "crit",   cost: 180, bonus: { critC: 0.06 } },
    { id: "ch_pen",   x: -210, y: 220, parent: "ch_dmg2", name: "離子穿甲",icon: "pierce", cost: 150, bonus: { armorPen: 12 } },
    { id: "ch_bounce1",x: 0,   y: 110, parent: "ch_dmg1", name: "增幅",   icon: "chain",  cost: 120, bonus: { bounce: 1 } },
    { id: "ch_bounce2",x: 0,   y: 220, parent: "ch_bounce1",name: "躍遷", icon: "chain",  cost: 160, bonus: { bounce: 1 } },
    { id: "ch_split1",x: 0,    y: 330, parent: "ch_bounce2",name: "裂變", icon: "splash", cost: 200, bonus: { split: 1 } },
    { id: "ch_storm", x: 0,    y: 440, parent: "ch_split1",name: "連鎖風暴",icon: "chain",cost: 280, bonus: { bounce: 2, split: 1 }, special: 1, info: "招牌：彈射 +2、擊殺額外分裂。" },
    { id: "ch_multi1",x: 110,  y: 110, parent: "ch_dmg1", name: "分歧",   icon: "multi",  cost: 150, bonus: { multishot: 1 } },
    { id: "ch_multi2",x: 110,  y: 220, parent: "ch_multi1",name: "多束",  icon: "multi",  cost: 220, bonus: { multishot: 1 } },
  ],
  // 火焰：近身範圍 → 傷害暴擊線 / 火域線 / 減速控場線
  flame: [
    { id: "f_dmg1",   x: 0,    y: 0,   parent: null,      name: "高溫",   icon: "dmg",    cost: 60,  bonus: { dmgM: 0.12 } },
    { id: "f_dmg2",   x: -100, y: 110, parent: "f_dmg1",  name: "白熱",   icon: "dmg",    cost: 120, bonus: { dmgM: 0.15 } },
    { id: "f_crit1",  x: -100, y: 220, parent: "f_dmg2",  name: "熔蝕",   icon: "crit",   cost: 150, bonus: { critC: 0.06 } },
    { id: "f_pen",    x: -200, y: 110, parent: "f_dmg1",  name: "熔甲",   icon: "pierce", cost: 140, bonus: { armorPen: 12 } },
    { id: "f_dmg3",   x: -100, y: 330, parent: "f_crit1", name: "煉獄",   icon: "dmg",    cost: 200, bonus: { dmgM: 0.2 } },
    { id: "f_range1", x: 0,    y: 110, parent: "f_dmg1",  name: "擴焰",   icon: "flame",  cost: 100, bonus: { frange: 0.15 } },
    { id: "f_range2", x: 0,    y: 220, parent: "f_range1",name: "燎原",   icon: "flame",  cost: 150, bonus: { frange: 0.20 } },
    { id: "f_storm",  x: 0,    y: 330, parent: "f_range2",name: "烈焰風暴",icon: "flame", cost: 260, bonus: { frange: 0.30, slow: 1 }, special: 1, info: "招牌：火域大幅擴張並附帶減速。" },
    { id: "f_slow1",  x: 100,  y: 110, parent: "f_dmg1",  name: "凝滯",   icon: "orb",    cost: 120, bonus: { slow: 2 } },
    { id: "f_slow2",  x: 100,  y: 220, parent: "f_slow1", name: "冰封烈焰",icon: "orb",   cost: 180, bonus: { slow: 2 } },
  ],
  // 分裂彈：命中分裂 → 傷害暴擊線 / 碎片數線 / 穿透速射線
  shard: [
    { id: "sh_dmg1",   x: 0,    y: 0,   parent: null,       name: "裝藥",   icon: "dmg",    cost: 60,  bonus: { dmgM: 0.10 } },
    { id: "sh_dmg2",   x: -100, y: 110, parent: "sh_dmg1",  name: "強裝藥", icon: "dmg",    cost: 120, bonus: { dmgM: 0.15 } },
    { id: "sh_crit1",  x: -100, y: 220, parent: "sh_dmg2",  name: "尖銳",   icon: "crit",   cost: 150, bonus: { critC: 0.06 } },
    { id: "sh_shards1",x: 0,    y: 110, parent: "sh_dmg1",  name: "增片",   icon: "multi",  cost: 130, bonus: { shards: 1 } },
    { id: "sh_shards2",x: 0,    y: 220, parent: "sh_shards1",name: "霰彈",  icon: "multi",  cost: 170, bonus: { shards: 1 } },
    { id: "sh_storm",  x: 0,    y: 330, parent: "sh_shards2",name: "碎片風暴",icon: "splash",cost: 260, bonus: { shards: 2 }, special: 1, info: "招牌：碎片數大增，群戰覆蓋面爆炸。" },
    { id: "sh_pierce1",x: 100,  y: 110, parent: "sh_dmg1",  name: "穿芯",   icon: "pierce", cost: 120, bonus: { pierce: 1 } },
    { id: "sh_rate1",  x: 100,  y: 220, parent: "sh_pierce1",name: "速裝填",icon: "rate",   cost: 140, bonus: { rateM: 0.12 } },
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
  if (b.armorPen) parts.push(`穿甲 +${b.armorPen}`);
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
  shard:  { unlock: 160, base: ["dmg", "rate"] },
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
