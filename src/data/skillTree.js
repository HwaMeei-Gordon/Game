// ── 資料：永久技能地圖（鑽石強化） ──────────────────────────
// 跨局保留的永久強化樹。用鑽石「點亮」節點，大型/終極節點可取消退款。
//
// 節點型別 t：core 核心 / small 小型 / weapon 武器解鎖 / major 大型 / keystone 終極 / curse 詛咒
// 區塊 br：atk 攻擊(左) / def 防禦(右) / mix 混合(下) / core
// parent：前置節點（須先點亮才能解鎖）。reqAll：需同時點亮多個前置（進階用）。
// bonus：點亮後提供的加成（見 engine/stats.js 的 derive 如何累加）。
//
// v4：節點更多、座標拉開（更好看、更易辨識連線），並支援「預覽下一步」。
export const NODE_COL = { atk: "#fca5a5", def: "#7dd3fc", mix: "#d8b4fe", core: "#fbbf24", curse: "#f43f5e" };
export const MAX_BIG = 3; // 大型/終極節點可同時點亮的上限

// 座標採「直排樹狀」配置：核心在最上方，三條主幹（攻擊左、混合中、防禦右）
// 依深度一層層往下生長（y = 深度 × 108），同層兄弟在 x 方向散開。
export const NODES = [
  { id: "core", t: "core", br: "core", x: 0, y: -95, parent: null, name: "核心", icon: "core", cost: 0, bonus: { dmgM: 0.05, hpM: 0.05 }, info: "起點，免費啟動。" },

  // ── 攻擊主幹（左） ──
  { id: "a_dmg1",    t: "small",    br: "atk", x: -400, y: 108, parent: "core",     name: "火力", icon: "dmg",    cost: 30,  bonus: { dmgM: 0.08 } },
  { id: "a_rate1",   t: "small",    br: "atk", x: -320, y: 108, parent: "core",     name: "連射", icon: "rate",   cost: 30,  bonus: { rateM: 0.06 } },
  { id: "a_dmg2",    t: "small",    br: "atk", x: -430, y: 216, parent: "a_dmg1",   name: "火力", icon: "dmg",    cost: 45,  bonus: { dmgM: 0.08 } },
  { id: "a_crit1",   t: "small",    br: "atk", x: -355, y: 216, parent: "a_rate1",  name: "暴擊", icon: "crit",   cost: 45,  bonus: { critC: 0.04 } },
  { id: "a_pierce1", t: "small",    br: "atk", x: -285, y: 216, parent: "a_rate1",  name: "穿甲", icon: "pierce", cost: 60,  bonus: { pierce: 1 } },
  { id: "a_dmg3",    t: "small",    br: "atk", x: -465, y: 324, parent: "a_dmg2",   name: "火力", icon: "dmg",    cost: 70,  bonus: { dmgM: 0.10 } },
  { id: "W_homing",  t: "weapon",   br: "atk", x: -405, y: 324, parent: "a_dmg2",   name: "追蹤彈", icon: "homing", cost: 120, weapon: "homing" },
  { id: "A_multi",   t: "major",    br: "atk", x: -350, y: 324, parent: "a_dmg2",   name: "多重射擊", icon: "multi", cost: 200, bonus: { multishot: 2 }, info: "同時多射出 2 發子彈。" },
  { id: "A_overload",t: "major",    br: "atk", x: -295, y: 324, parent: "a_crit1",  name: "過載核心", icon: "rate", cost: 220, bonus: { rateM: 0.15 }, special: "overload", info: "攻速 +15%，且攻速越高傷害加成越大。" },
  { id: "a_pierce2", t: "small",    br: "atk", x: -240, y: 324, parent: "a_pierce1",name: "穿甲", icon: "pierce", cost: 90,  bonus: { pierce: 1 } },
  { id: "a_curse",   t: "curse",    br: "atk", x: -185, y: 324, parent: "a_pierce1",name: "狂戰士", icon: "curse", cost: 50,  bonus: { dmgM: 0.40, hpM: -0.30 }, info: "傷害 +40%，但生命 -30%（永久，不可取消）。" },
  { id: "a_dmg4",    t: "small",    br: "atk", x: -490, y: 432, parent: "a_dmg3",   name: "火力", icon: "dmg",    cost: 90,  bonus: { dmgM: 0.10 } },
  { id: "W_laser",   t: "weapon",   br: "atk", x: -420, y: 432, parent: "W_homing", name: "雷射", icon: "laser",  cost: 150, weapon: "laser" },
  { id: "a_rate2",   t: "small",    br: "atk", x: -330, y: 432, parent: "A_overload",name: "連射", icon: "rate",  cost: 90,  bonus: { rateM: 0.08 } },
  { id: "a_berserk", t: "small",    br: "atk", x: -235, y: 432, parent: "a_curse",  name: "嗜血", icon: "dmg",    cost: 90,  bonus: { dmgM: 0.20, critC: 0.06 }, info: "詛咒之後的強化路徑。" },
  { id: "A_glass",   t: "keystone", br: "atk", x: -160, y: 432, parent: "a_curse",  name: "玻璃大砲", icon: "dmg",  cost: 300, bonus: { dmgM: 0.50 }, special: "glass", info: "傷害 ×1.5，但完全失去護甲（armor=0）。極限輸出。" },
  { id: "a_focus",   t: "small",    br: "atk", x: -300, y: 540, parent: "a_berserk",name: "聚焦", icon: "crit",   cost: 130, bonus: { critC: 0.06, dmgM: 0.08 } },
  { id: "a_overpower",t: "small",   br: "atk", x: -185, y: 540, parent: "A_glass",  name: "碾壓", icon: "crit",   cost: 160, bonus: { dmgM: 0.15, critC: 0.04 } },

  // ── 防禦主幹（右） ──
  { id: "d_hp1",     t: "small",    br: "def", x: 320, y: 108, parent: "core",      name: "強健", icon: "hp",    cost: 30,  bonus: { hpM: 0.10 } },
  { id: "d_armor1",  t: "small",    br: "def", x: 400, y: 108, parent: "core",      name: "裝甲", icon: "armor", cost: 30,  bonus: { armor: 12 } },
  { id: "d_hp2",     t: "small",    br: "def", x: 300, y: 216, parent: "d_hp1",     name: "強健", icon: "hp",    cost: 45,  bonus: { hpM: 0.10 } },
  { id: "d_regen1",  t: "small",    br: "def", x: 380, y: 216, parent: "d_armor1",  name: "再生", icon: "regen", cost: 45,  bonus: { regen: 2.5 } },
  { id: "d_thorn1",  t: "small",    br: "def", x: 455, y: 216, parent: "d_armor1",  name: "荊棘", icon: "thorns",cost: 60,  bonus: { thorns: 5 } },
  { id: "d_curse",   t: "curse",    br: "def", x: 250, y: 324, parent: "d_regen1",  name: "重裝", icon: "curse", cost: 50,  bonus: { hpM: 0.50, rateM: -0.25 }, info: "生命 +50%，但攻速 -25%（永久，不可取消）。" },
  { id: "d_hp3",     t: "small",    br: "def", x: 305, y: 324, parent: "d_hp2",     name: "強健", icon: "hp",    cost: 70,  bonus: { hpM: 0.12 } },
  { id: "W_flame",   t: "weapon",   br: "def", x: 360, y: 324, parent: "d_hp2",     name: "火焰", icon: "flame", cost: 120, weapon: "flame" },
  { id: "D_fortress",t: "major",    br: "def", x: 415, y: 324, parent: "d_hp2",     name: "壁壘", icon: "armor", cost: 200, special: "fortress", bonus: { armor: 10 }, info: "生命低於 30% 時，傷害減免大幅提升。" },
  { id: "D_thorn",   t: "major",    br: "def", x: 470, y: 324, parent: "d_thorn1",  name: "荊棘光環", icon: "thorns", cost: 200, bonus: { thorns: 16 }, info: "近身灼燒大幅提升。" },
  { id: "d_regen2",  t: "small",    br: "def", x: 525, y: 324, parent: "d_thorn1",  name: "再生", icon: "regen", cost: 90,  bonus: { regen: 3 } },
  { id: "d_armor2",  t: "small",    br: "def", x: 580, y: 324, parent: "d_thorn1",  name: "裝甲", icon: "armor", cost: 90,  bonus: { armor: 18 } },
  { id: "d_bulwark", t: "small",    br: "def", x: 235, y: 432, parent: "d_curse",   name: "銅牆", icon: "armor", cost: 90,  bonus: { armor: 30, hpM: 0.10 }, info: "詛咒之後的強化路徑。" },
  { id: "D_immortal",t: "keystone", br: "def", x: 305, y: 432, parent: "d_curse",   name: "不屈意志", icon: "hp", cost: 300, special: "immortal", bonus: { hpM: 0.15 }, info: "每一波承受致命傷害時免死一次（回復 35% 生命）。" },
  { id: "d_vit",     t: "small",    br: "def", x: 510, y: 432, parent: "d_regen2",  name: "活力", icon: "hp",    cost: 130, bonus: { hpM: 0.12, regen: 2 } },
  { id: "d_guard",   t: "small",    br: "def", x: 235, y: 540, parent: "d_bulwark", name: "守護", icon: "hp",    cost: 130, bonus: { armor: 20, hpM: 0.10 } },
  { id: "d_aegis",   t: "small",    br: "def", x: 320, y: 540, parent: "D_immortal",name: "神盾", icon: "armor", cost: 160, bonus: { armor: 20, hpM: 0.05 } },
  { id: "d_range1",  t: "small",    br: "def", x: 660, y: 230, parent: "d_armor1",  name: "鷹眼", icon: "range", cost: 150, bonus: { rangeFlat: 0.35 }, info: "增加攻擊範圍。可突破原本射程上限（建議搭配局內『範圍』點滿）。" },
  { id: "d_range2",  t: "small",    br: "def", x: 700, y: 350, parent: "d_range1",  name: "超級範圍", icon: "range", cost: 260, bonus: { rangeFlat: 0.7 }, info: "進一步大幅增加攻擊範圍，遠遠突破原本射程上限。" },

  // ── 混合主幹（中） ──
  { id: "m_gold1",   t: "small",    br: "mix", x: -40, y: 108, parent: "core",      name: "拾荒", icon: "gold",  cost: 30,  bonus: { goldM: 0.12 } },
  { id: "m_gem1",    t: "small",    br: "mix", x: 40,  y: 108, parent: "core",      name: "鑽石", icon: "gem",   cost: 40,  bonus: { gem: 0.15 } },
  { id: "m_gold2",   t: "small",    br: "mix", x: -95, y: 216, parent: "m_gold1",   name: "暴富", icon: "gold",  cost: 50,  bonus: { goldM: 0.12 } },
  { id: "m_crit1",   t: "small",    br: "mix", x: -10, y: 216, parent: "m_gem1",    name: "精算", icon: "crit",  cost: 50,  bonus: { critC: 0.04 } },
  { id: "m_splash1", t: "small",    br: "mix", x: 70,  y: 216, parent: "m_gem1",    name: "爆裂", icon: "splash",cost: 60,  bonus: { splash: 0.15 } },
  { id: "m_gold3",   t: "small",    br: "mix", x: -150,y: 324, parent: "m_gold2",   name: "財閥", icon: "gold",  cost: 80,  bonus: { goldM: 0.15 } },
  { id: "W_chain",   t: "weapon",   br: "mix", x: -95, y: 324, parent: "m_gold2",   name: "折射激光", icon: "chain", cost: 150, weapon: "chain" },
  { id: "M_orb",     t: "major",    br: "mix", x: -40, y: 324, parent: "m_gold2",   name: "軌道無人機", icon: "orb", cost: 200, bonus: { orbs: 2 }, info: "+2 顆環繞無人機，自動造成傷害。" },
  { id: "M_lifesteal",t: "major",   br: "mix", x: 20,  y: 324, parent: "m_crit1",   name: "吸血", icon: "regen", cost: 220, bonus: { lifesteal: 0.05 }, info: "每次擊殺回復生命。" },
  { id: "m_splash2", t: "small",    br: "mix", x: 85,  y: 324, parent: "m_splash1", name: "轟炸", icon: "splash",cost: 80,  bonus: { splash: 0.15 } },
  { id: "m_curse",   t: "curse",    br: "mix", x: 150, y: 324, parent: "m_splash1", name: "貪婪", icon: "curse", cost: 50,  bonus: { goldM: 0.60, takeDmg: 0.20 }, info: "金幣 +60%，但承受傷害 +20%（永久，不可取消）。" },
  { id: "m_gold4",   t: "small",    br: "mix", x: -150,y: 432, parent: "m_gold3",   name: "財源", icon: "gold",  cost: 90,  bonus: { goldM: 0.15 } },
  { id: "m_crit2",   t: "small",    br: "mix", x: 20,  y: 432, parent: "M_lifesteal",name: "精算", icon: "crit", cost: 90,  bonus: { critC: 0.05 } },
  { id: "m_jackpot", t: "small",    br: "mix", x: 120, y: 432, parent: "m_curse",   name: "頭獎", icon: "gem",   cost: 90,  bonus: { gem: 0.30, goldM: 0.15 }, info: "詛咒之後的強化路徑。" },
  { id: "M_chaos",   t: "keystone", br: "mix", x: 195, y: 432, parent: "m_curse",   name: "混沌引擎", icon: "crit", cost: 300, bonus: { dmgM: 0.12, hpM: 0.12, goldM: 0.12, critC: 0.08, orbs: 1 }, info: "全屬性綜合強化的終極節點。" },
  { id: "m_fortune", t: "small",    br: "mix", x: 120, y: 540, parent: "m_jackpot", name: "幸運", icon: "crit",  cost: 130, bonus: { gem: 0.25, critC: 0.05 } },
  { id: "m_overflow",t: "small",    br: "mix", x: 200, y: 540, parent: "M_chaos",   name: "滿溢", icon: "core",   cost: 160, bonus: { dmgM: 0.08, hpM: 0.08 } },
];

export const NODE_KEYS = NODES.map((n) => n.id);
export const ZERO_NODES = Object.fromEntries(NODE_KEYS.map((k) => [k, 0]));
export const nodeById = Object.fromEntries(NODES.map((n) => [n.id, n]));

export const isBig = (n) => n.t === "major" || n.t === "keystone";
export const countBig = (nodes) => NODES.reduce((a, n) => a + (isBig(n) && (nodes[n.id] || 0) >= 1 ? 1 : 0), 0);

export function isNodeUnlocked(def, nodes) {
  if (def.reqAll) return def.reqAll.every((k) => (nodes[k] || 0) >= 1);
  if (!def.parent) return true;
  return (nodes[def.parent] || 0) >= 1;
}
export function sumBonus(nodes, key) {
  let v = 0;
  for (const n of NODES) if (n.bonus && n.bonus[key]) v += n.bonus[key] * (nodes[n.id] || 0);
  return v;
}
export function unlockedWeapons(nodes) {
  const w = ["cannon"];
  for (const n of NODES) if (n.weapon && (nodes[n.id] || 0) >= 1) w.push(n.weapon);
  return w;
}
// 「預覽下一步」：取得某節點所有直接子節點（它能通往哪些節點）。
export function childrenOf(id) {
  return NODES.filter((n) => (n.reqAll ? n.reqAll.includes(id) : n.parent === id));
}

// 已花在技能地圖上的鑽石總額（核心免費，不計）。
export function spentDiamonds(nodes) {
  let v = 0;
  for (const n of NODES) if (n.cost > 0 && (nodes[n.id] || 0) >= 1) v += n.cost;
  return v;
}
// 重置技能地圖的手續費（你「付」的鑽石）：花費的 15%，至少 20。
export function resetFee(spent) { return spent <= 0 ? 0 : Math.max(20, Math.floor(spent * 0.15)); }

// 把節點 bonus 轉成可讀文字（給說明面板用）。
export function nodeDesc(nd) {
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
  if (b.rangeFlat) parts.push(`攻擊範圍 +${b.rangeFlat}`);
  if (b.multishot) parts.push(`+${b.multishot} 發子彈`);
  if (b.pierce) parts.push(`穿透 +${b.pierce}`);
  if (b.orbs) parts.push(`+${b.orbs} 無人機`);
  if (b.gem) parts.push(`鑽石 +${(b.gem * 100).toFixed(0)}%`);
  if (b.lifesteal) parts.push(`擊殺回血`);
  if (b.takeDmg) parts.push(`受傷 +${(b.takeDmg * 100).toFixed(0)}%`);
  return parts.join("、");
}
