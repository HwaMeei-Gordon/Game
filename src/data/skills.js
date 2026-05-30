// ── 資料：局內升級（金幣，多武器 · 攻擊/防禦/特殊 分類） ─────
// 所有已解鎖武器同時開火。每把武器各自加點，且分成三類：
//   攻擊類(atk)：傷害/攻速/彈速/射程等「縮放」項（投射型才有攻速/彈速）。
//   特殊類(sp)：該武器專屬機制（穿透/濺射/多重/彈射/暴擊/火域…）。
//   防禦類(def)：全塔共用（生命/恢復/護甲），在每把武器頁面都看得到、共用同一池。
// 設計原則：清單只放「對該武器有意義」的項目，不放無用項。
// 攻擊類連動漲價：每買任一武器升級（攻擊+特殊）一級，全部武器升級價格 ×1.01。

export const ITEMS = {
  dmg:    { name: "傷害", icon: "dmg",    base: 12, mult: 1.14,          fmt: (l) => `+${l * 5} 傷害` },
  rate:   { name: "攻速", icon: "rate",   base: 16, mult: 1.18, cap: 14, fmt: (l) => `+${(l * 0.12).toFixed(2)}/s` },
  bspd:   { name: "彈速", icon: "homing", base: 16, mult: 1.16, cap: 8,  fmt: (l) => `彈速 +${l * 30}%` },
  wrange: { name: "射程", icon: "range",  base: 18, mult: 1.16, cap: 8,  fmt: (l) => `射程 +${(l * 0.1).toFixed(1)}` },
  multi:  { name: "多重", icon: "multi",  base: 55, mult: 1.6,  cap: 4,  fmt: (l) => `+${l} 發/束` },
  pierce: { name: "穿透", icon: "pierce", base: 50, mult: 1.6,  cap: 4,  fmt: (l) => `貫穿 ${l}` },
  splash: { name: "濺射", icon: "splash", base: 50, mult: 1.55, cap: 8,  fmt: (l) => `濺射 +${l * 12}%` },
  bounce: { name: "彈射", icon: "chain",  base: 50, mult: 1.6,  cap: 4,  fmt: (l) => `+${l} 彈射` },
  frange: { name: "火域", icon: "flame",  base: 40, mult: 1.4,  cap: 8,  fmt: (l) => `火域 +${l * 12}%` },
  crit:   { name: "暴擊", icon: "crit",   base: 45, mult: 1.5,  cap: 10, fmt: (l) => `暴擊 +${l * 5}%` },
  // 雷射專屬
  ltick:  { name: "計算頻率", icon: "rate", base: 55, mult: 1.4, cap: 6, fmt: (l) => `傷害計算頻率 +${l * 40}%` },
  lamp:   { name: "傷害增幅", icon: "dmg",  base: 60, mult: 1.45, cap: 8, fmt: (l) => `持續同目標每跳 +${(0.1 + l * 0.15).toFixed(2)}%` },
  // 折射專屬
  split:  { name: "分裂", icon: "chain",  base: 120, mult: 1.7, cap: 3, fmt: (l) => `擊殺時額外折射 ${l}（上限3）` },
  // 火焰專屬
  slow:   { name: "減速", icon: "orb",    base: 55, mult: 1.4, cap: 5, fmt: (l) => `灼燒減速 ${Math.min(60, l * 12)}%` },
  // 分裂彈專屬
  shards: { name: "碎片", icon: "multi",  base: 55, mult: 1.55, cap: 6, fmt: (l) => `+${l} 碎片` },
  // 防禦類（全塔共用）
  hp:     { name: "生命", icon: "hp",    base: 12, mult: 1.15,          fmt: (l) => `+${l * 30} 生命` },
  regen:  { name: "恢復", icon: "regen", base: 16, mult: 1.18,          fmt: (l) => `+${(l * 1.4).toFixed(1)}/s` },
  armor:  { name: "護甲", icon: "armor", base: 20, mult: 1.20,          fmt: (l) => `+${(l * 1.5).toFixed(0)} 護甲` },
};

// 防禦類（全塔共用，存於 skill.global）
export const DEF_ITEMS = ["hp", "regen", "armor"];

// 各武器的 攻擊類 / 特殊類（存於 skill.weapons[wk]，只放對該武器有用的）
export const WEAPON_CATS = {
  cannon: { atk: ["dmg", "rate", "bspd", "wrange"], sp: ["multi", "pierce", "splash", "crit"] },
  homing: { atk: ["dmg", "rate", "bspd", "wrange"], sp: ["multi", "splash", "pierce", "crit"] },
  laser:  { atk: ["dmg", "wrange", "ltick", "lamp"], sp: ["multi", "crit"] },
  chain:  { atk: ["dmg", "rate", "bspd", "wrange"], sp: ["bounce", "multi", "split", "crit"] },
  flame:  { atk: ["dmg", "frange"],                 sp: ["slow", "crit"] },
  shard:  { atk: ["dmg", "rate", "bspd", "wrange"], sp: ["shards", "pierce", "crit"] },
};
// 每把武器所有可升項目（atk+sp 扁平），供建立狀態用
export const WEAPON_ITEMS = {};
for (const wk in WEAPON_CATS) WEAPON_ITEMS[wk] = [...WEAPON_CATS[wk].atk, ...WEAPON_CATS[wk].sp];

export function createSkill() {
  const weapons = {};
  for (const wk in WEAPON_ITEMS) { const o = {}; for (const k of WEAPON_ITEMS[wk]) o[k] = 0; weapons[wk] = o; }
  const global = {}; for (const k of DEF_ITEMS) global[k] = 0;
  return { global, weapons };
}
export function cloneSkill(s) {
  const weapons = {}; for (const wk in s.weapons) weapons[wk] = { ...s.weapons[wk] };
  return { global: { ...s.global }, weapons };
}

export const CLASS_MULT = 1.01;
export function attackTotal(skill) {
  let t = 0; for (const wk in skill.weapons) { const v = skill.weapons[wk]; for (const k in v) t += v[k] || 0; } return t;
}
export function globalTotal(skill) { let t = 0; for (const k in skill.global) t += skill.global[k] || 0; return t; }
export function weaponItemCost(skill, wk, key) {
  const def = ITEMS[key], lvl = (skill.weapons[wk] && skill.weapons[wk][key]) || 0;
  return Math.floor(def.base * Math.pow(def.mult, lvl) * Math.pow(CLASS_MULT, attackTotal(skill)));
}
export function globalItemCost(skill, key) {
  const def = ITEMS[key];
  return Math.floor(def.base * Math.pow(def.mult, skill.global[key] || 0) * Math.pow(CLASS_MULT, globalTotal(skill)));
}

export const ABILITIES = [
  { key: "over",   name: "過載", icon: "⚡", cd: 16, dur: 6, color: "#fbbf24", info: "6 秒內全武器傷害 ×3。" },
  { key: "nova",   name: "新星", icon: "✺", cd: 13, dur: 0, color: "#f43f5e", info: "全場爆發傷害並擊退敵人。" },
  { key: "frost",  name: "冰霜", icon: "❄", cd: 15, dur: 5, color: "#67e8f9", info: "5 秒內敵人移速降為 35%。" },
  { key: "repair", name: "修復", icon: "✛", cd: 20, dur: 0, color: "#4ade80", info: "立即回復 40% 生命。" },
];
