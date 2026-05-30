// ── 資料：難度 ───────────────────────────────────────────────
// ehp/edmg：敵人血量、攻擊的倍率；gold/gem：獎勵倍率。
export const DIFF = {
  easy:   { name: "簡單", ehp: 0.7, edmg: 0.75, gold: 1.0,  gem: 0.8, col: "#4ade80", desc: "敵人較弱，適合熟悉機制" },
  normal: { name: "普通", ehp: 1.0, edmg: 1.0,  gold: 1.0,  gem: 1.0, col: "#67e8f9", desc: "標準挑戰" },
  hard:   { name: "困難", ehp: 1.7, edmg: 1.4,  gold: 1.0,  gem: 1.7, col: "#f43f5e", desc: "高風險高報酬：敵人更強、金幣不加成，但鑽石收益最高" },
};
