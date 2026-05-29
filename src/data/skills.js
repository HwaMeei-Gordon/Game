// ── 資料：局內升級（金幣，多武器系統） ──────────────────────
// 設計：所有已解鎖武器「同時開火」，但每把武器各自獨立加點。
//  - 攻擊類升級屬於各武器（每把分開記等級）。
//  - 同一項目在「所有武器」的等級會累加，作為該項目的「漲價依據」：
//    在 A 武器升某項，B 武器的同項目也會變貴（weaponItemCost 用跨武器總等級）。
//  - 不同武器有不同的可升項目（例：雷射沒有穿透，火焰只有傷害與火域）。
//  - 全域(塔)升級：生命/恢復/護甲/範圍/暴擊，對所有武器與塔生效，單獨計價。

// 升級項目主表（base：首級花費 · mult：每級漲價 · cap：上限 · fmt：目前數值文字）
export const ITEMS = {
  // 武器類
  dmg:    { name: "傷害", icon: "dmg",    base: 12, mult: 1.14,          fmt: (l) => `+${l * 5} 傷害` },
  rate:   { name: "攻速", icon: "rate",   base: 16, mult: 1.18, cap: 14, fmt: (l) => `+${(l * 0.12).toFixed(2)}/s` },
  multi:  { name: "多重", icon: "multi",  base: 55, mult: 1.6,  cap: 4,  fmt: (l) => `+${l} 發/束` },
  pierce: { name: "穿透", icon: "pierce", base: 50, mult: 1.6,  cap: 4,  fmt: (l) => `貫穿 ${l}` },
  splash: { name: "濺射", icon: "splash", base: 50, mult: 1.55, cap: 8,  fmt: (l) => `濺射 +${l * 12}%` },
  bounce: { name: "彈射", icon: "chain",  base: 50, mult: 1.6,  cap: 4,  fmt: (l) => `+${l} 彈射` },
  frange: { name: "火域", icon: "flame",  base: 40, mult: 1.4,  cap: 8,  fmt: (l) => `火焰範圍 +${l * 12}%` },
  bspd:   { name: "彈速", icon: "homing", base: 16, mult: 1.16, cap: 8,  fmt: (l) => `彈速 +${l * 30}%` },
  // 全域(塔)
  hp:     { name: "生命", icon: "hp",    base: 12, mult: 1.15,          fmt: (l) => `+${l * 30} 生命` },
  regen:  { name: "恢復", icon: "regen", base: 16, mult: 1.18,          fmt: (l) => `+${(l * 1.4).toFixed(1)}/s` },
  armor:  { name: "護甲", icon: "armor", base: 20, mult: 1.20,          fmt: (l) => `+${(l * 1.5).toFixed(0)} 護甲` },
  range:  { name: "範圍", icon: "range", base: 14, mult: 1.15, cap: 9,  fmt: (l) => `+${l} 射程` },
  crit:   { name: "暴擊", icon: "crit",  base: 45, mult: 1.50, cap: 10, fmt: (l) => `暴擊 ${l * 5}%` },
};

export const GLOBAL_ITEMS = ["hp", "regen", "armor", "range", "crit"];

// 各武器可升的項目（刻意不同：雷射無穿透、火焰只有傷害與火域等）
export const WEAPON_ITEMS = {
  cannon: ["dmg", "rate", "multi", "pierce", "splash", "bspd"],
  homing: ["dmg", "rate", "multi", "splash", "bspd"],
  laser:  ["dmg", "multi"],                 // multi = 同時鎖定光束數
  chain:  ["dmg", "rate", "bounce", "bspd"],
  flame:  ["dmg", "frange"],
};

// 建立一份歸零的局內升級狀態
export function createSkill() {
  const weapons = {};
  for (const wk in WEAPON_ITEMS) { const o = {}; for (const k of WEAPON_ITEMS[wk]) o[k] = 0; weapons[wk] = o; }
  const global = {}; for (const k of GLOBAL_ITEMS) global[k] = 0;
  return { global, weapons };
}
export function cloneSkill(s) {
  const weapons = {}; for (const wk in s.weapons) weapons[wk] = { ...s.weapons[wk] };
  return { global: { ...s.global }, weapons };
}

// 某武器項目在「所有武器」的累計等級（漲價依據）
export function weaponItemTotal(skill, itemKey) {
  let t = 0; for (const wk in skill.weapons) { const v = skill.weapons[wk]; if (v && v[itemKey]) t += v[itemKey]; } return t;
}
// 武器項目花費：以跨武器總等級指數成長（在別把武器升級，這把也會變貴）
export function weaponItemCost(skill, itemKey) {
  const def = ITEMS[itemKey]; return Math.floor(def.base * Math.pow(def.mult, weaponItemTotal(skill, itemKey)));
}
// 全域項目花費：以自身等級成長
export function globalItemCost(skill, itemKey) {
  const def = ITEMS[itemKey]; return Math.floor(def.base * Math.pow(def.mult, skill.global[itemKey] || 0));
}

// 主動技能（CD 觸發）。
export const ABILITIES = [
  { key: "over",   name: "過載", icon: "⚡", cd: 16, dur: 6, color: "#fbbf24", info: "6 秒內全武器傷害 ×3。" },
  { key: "nova",   name: "新星", icon: "✺", cd: 13, dur: 0, color: "#f43f5e", info: "全場爆發傷害並擊退敵人。" },
  { key: "frost",  name: "冰霜", icon: "❄", cd: 15, dur: 5, color: "#67e8f9", info: "5 秒內敵人移速降為 35%。" },
  { key: "repair", name: "修復", icon: "✛", cd: 20, dur: 0, color: "#4ade80", info: "立即回復 40% 生命。" },
];
