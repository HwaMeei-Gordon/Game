// ── 資料：成就 / 里程碑（達成給鑽石獎勵） ───────────────────
// check(meta) 回傳是否達成；prog(meta) 回傳 [目前, 目標] 供進度條。
function weaponCount(m) {
  let n = 1; // 標準彈預設擁有
  for (const w of ["homing", "laser", "chain", "flame", "shard"]) if (m.weaponsOwned && m.weaponsOwned[w]) n++;
  return n;
}
const K = (m) => (m.stats && m.stats.kills) || 0;
const R = (m) => (m.stats && m.stats.runs) || 0;

export const ACHIEVEMENTS = [
  { id: "w5",   name: "初出茅廬", icon: "core",  reward: 20,  desc: "抵達第 5 波",     check: (m) => m.bestWave >= 5,   prog: (m) => [Math.min(m.bestWave, 5), 5] },
  { id: "w10",  name: "站穩腳步", icon: "armor", reward: 40,  desc: "抵達第 10 波",    check: (m) => m.bestWave >= 10,  prog: (m) => [Math.min(m.bestWave, 10), 10] },
  { id: "w20",  name: "中流砥柱", icon: "hp",    reward: 100, desc: "抵達第 20 波",    check: (m) => m.bestWave >= 20,  prog: (m) => [Math.min(m.bestWave, 20), 20] },
  { id: "w30",  name: "塔防大師", icon: "crit",  reward: 250, desc: "抵達第 30 波",    check: (m) => m.bestWave >= 30,  prog: (m) => [Math.min(m.bestWave, 30), 30] },
  { id: "k500", name: "百人斬",   icon: "dmg",   reward: 50,  desc: "累計擊殺 500",    check: (m) => K(m) >= 500,       prog: (m) => [Math.min(K(m), 500), 500] },
  { id: "k5000",name: "萬軍辟易", icon: "multi", reward: 200, desc: "累計擊殺 5000",   check: (m) => K(m) >= 5000,      prog: (m) => [Math.min(K(m), 5000), 5000] },
  { id: "arms", name: "軍火庫",   icon: "cannon",reward: 150, desc: "解鎖全部 6 種武器", check: (m) => weaponCount(m) >= 6, prog: (m) => [weaponCount(m), 6] },
  { id: "sv100",name: "生存專家", icon: "flame", reward: 80,  desc: "無限生存擊殺 100", check: (m) => (m.bestKills || 0) >= 100, prog: (m) => [Math.min(m.bestKills || 0, 100), 100] },
  { id: "run20",name: "百折不撓", icon: "regen", reward: 60,  desc: "遊玩 20 場",      check: (m) => R(m) >= 20,        prog: (m) => [Math.min(R(m), 20), 20] },
];

// 結算時：更新終身統計、檢查新解鎖成就（直接改 meta，回傳新解鎖清單）
export function processAchievements(meta, runKills) {
  if (!meta.stats) meta.stats = { kills: 0, runs: 0 };
  meta.stats.kills += runKills || 0;
  meta.stats.runs += 1;
  if (!meta.ach) meta.ach = {};
  const newly = [];
  for (const a of ACHIEVEMENTS) {
    if (!meta.ach[a.id] && a.check(meta)) { meta.ach[a.id] = 1; meta.diamonds += a.reward; newly.push(a); }
  }
  return newly;
}
