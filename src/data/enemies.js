// ── 資料：敵人定義 ───────────────────────────────────────────
// 每種敵人的「基礎」屬性（第 1 波、普通難度的值）。
// 實際進場時會依波次/難度做指數縮放（見 engine/stats.js 的 enemyStatsAt）。
//
// 欄位說明：
//   shape 形狀 · hp 血量 · spd 移速 · atk 攻擊 · def 防禦 · r 半徑 · rw 擊殺金幣
//   move  移動模式：straight 直線 / dash 衝刺 / weave 螺旋繞行
//   trait 特性：shield 護盾 / split 死亡分裂 / boss 首領 / null 無
//
// v4：半徑與移速配合放大的戰場做了上調，敵人從更遠處湧入。
export const ENEMIES = {
  grunt:    { name: "步兵",   shape: "circle",   hp: 9,  spd: 0.185, atk: 4.5, def: 0,  r: 0.075, rw: 8,  col: "#fca5a5", move: "straight", trait: null,     info: "直線逼近，最基礎的雜兵。" },
  dasher:   { name: "衝刺者", shape: "triangle", hp: 6,  spd: 0.33,  atk: 6,   def: 0,  r: 0.068, rw: 12, col: "#c084fc", move: "dash",     trait: null,     info: "一衝一停、爆發突進，直線子彈難瞄準。追蹤彈剋之。" },
  brute:    { name: "重甲",   shape: "square",   hp: 32, spd: 0.094, atk: 12,  def: 6,  r: 0.110, rw: 18, col: "#fb923c", move: "straight", trait: null,     info: "高血高防，需要高單發傷害（雷射/玻璃大砲）才打得動。" },
  weaver:   { name: "遊蛇",   shape: "cross",    hp: 13, spd: 0.153, atk: 6,   def: 2,  r: 0.090, rw: 16, col: "#34d399", move: "weave",    trait: null,     info: "螺旋繞圈靠近，能閃避直線子彈。追蹤彈剋之。" },
  warden:   { name: "護盾兵", shape: "star",     hp: 14, spd: 0.153, atk: 7,   def: 4,  r: 0.087, rw: 16, col: "#38bdf8", move: "straight", trait: "shield", info: "外圈有護盾，須先破盾才能傷血。護盾會緩慢回復。" },
  splitter: { name: "分裂體", shape: "diamond",  hp: 16, spd: 0.13,  atk: 6,   def: 2,  r: 0.093, rw: 14, col: "#f0abfc", move: "straight", trait: "split",  info: "死亡時裂成兩隻碎片，清群武器要小心被淹沒。" },
  boss:     { name: "首領",   shape: "hexagon",  hp: 70, spd: 0.086, atk: 16,  def: 10, r: 0.147, rw: 34, col: "#f43f5e", move: "straight", trait: "boss",   info: "每 5 波出現一次，高血高防高攻。" },
  mini:     { name: "碎片",   shape: "circle",   hp: 5,  spd: 0.24,  atk: 4,   def: 0,  r: 0.050, rw: 4,  col: "#6ee7b7", move: "straight", trait: null,     info: "分裂體死亡後產生的小型敵人。" },
};

// 玩家可在敵人面板查看的種類（不含 mini，因為它是衍生物）。
export const ENEMY_DEX = ["grunt", "dasher", "brute", "weaver", "warden", "splitter", "boss"];

// 依波次決定生成哪種敵人（隨機 roll）。
export function pickType(n) {
  const roll = Math.random();
  if (n >= 4 && roll < 0.15) return "brute";
  if (n >= 6 && roll < 0.28) return "dasher";
  if (n >= 5 && roll < 0.40) return "splitter";
  if (n >= 7 && roll < 0.54) return "weaver";
  if (n >= 9 && roll < 0.66) return "warden";
  return "grunt";
}
