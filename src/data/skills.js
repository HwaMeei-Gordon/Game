// ── 資料：局內技能（金幣即時升級） ──────────────────────────
// 這些是「一局之內」用金幣購買的升級，死亡後歸零。
// 與永久的「技能地圖」(skillTree.js) 不同。
//
// base：第 1 級花費 · mult：每級花費倍率 · cap：等級上限 · fmt：目前數值文字 · nxt：下一級增益
export const TREE = {
  attack: { name: "攻擊", col: "#fca5a5", items: {
    dmg:   { name: "攻擊力", icon: "dmg",   base: 10, mult: 1.14,          fmt: (l) => `+${l * 5} 傷害`,            nxt: "+5 傷害" },
    rate:  { name: "攻速",   icon: "rate",  base: 14, mult: 1.18, cap: 16, fmt: (l) => `+${(l * 0.12).toFixed(2)}/s`, nxt: "+0.12 次/秒" },
    range: { name: "範圍",   icon: "range", base: 12, mult: 1.15, cap: 9,  fmt: (l) => `+${l} 射程`,                nxt: "+1 射程" },
    multi: { name: "多重",   icon: "multi", base: 60, mult: 1.7,  cap: 4,  fmt: (l) => `+${l} 發`,                  nxt: "+1 發子彈" },
  }},
  defense: { name: "防禦", col: "#7dd3fc", items: {
    hp:    { name: "生命", icon: "hp",    base: 12, mult: 1.15, fmt: (l) => `+${l * 30} 生命`,        nxt: "+30 生命" },
    regen: { name: "恢復", icon: "regen", base: 16, mult: 1.18, fmt: (l) => `+${(l * 1.4).toFixed(1)}/s`, nxt: "+1.4 生命/秒" },
    armor: { name: "護甲", icon: "armor", base: 20, mult: 1.20, fmt: (l) => `+${(l * 1.5).toFixed(0)} 護甲`, nxt: "+1.5 護甲" },
  }},
  special: { name: "特殊", col: "#d8b4fe", items: {
    pierce: { name: "穿透", icon: "pierce", base: 50, mult: 1.6, cap: 4,  fmt: (l) => `貫穿 ${l}`,       nxt: "+1 貫穿" },
    crit:   { name: "暴擊", icon: "crit",   base: 45, mult: 1.5, cap: 10, fmt: (l) => `暴擊 ${l * 5}%`,  nxt: "+5% 暴擊率" },
    splash: { name: "濺射", icon: "splash", base: 55, mult: 1.6, cap: 8,  fmt: (l) => `濺射 ${l * 12}%`, nxt: "+12% 濺射傷害" },
  }},
};

export const SKILL_KEYS = ["dmg", "rate", "range", "multi", "hp", "regen", "armor", "pierce", "crit", "splash"];
export const ZERO_SKILL = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0]));

export function findSkill(k) { for (const c in TREE) if (TREE[c].items[k]) return TREE[c].items[k]; }
export const skillCost = (def, lvl) => Math.floor(def.base * Math.pow(def.mult, lvl));

// 主動技能（CD 觸發）。
export const ABILITIES = [
  { key: "over",   name: "過載", icon: "⚡", cd: 16, dur: 6, color: "#fbbf24", info: "6 秒內傷害 ×3。" },
  { key: "nova",   name: "新星", icon: "✺", cd: 13, dur: 0, color: "#f43f5e", info: "全場爆發傷害並擊退敵人。" },
  { key: "frost",  name: "冰霜", icon: "❄", cd: 15, dur: 5, color: "#67e8f9", info: "5 秒內敵人移速降為 35%。" },
  { key: "repair", name: "修復", icon: "✛", cd: 20, dur: 0, color: "#4ade80", info: "立即回復 40% 生命。" },
];
