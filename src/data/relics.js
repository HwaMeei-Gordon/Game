// ── 資料：道具（永久道具，鑽石購買，一場只能帶一個） ────────
// bonus 會在 derive 中加到全域加成（與基礎屬性樹同一套 key）。
// flag 用於開關型效果（例如免死）。
export const RELICS = {
  power:    { name: "力量核心", icon: "dmg",    cost: 200, bonus: { dmgM: 0.20 }, desc: "所有武器傷害 +20%" },
  vitality: { name: "生命核心", icon: "hp",     cost: 200, bonus: { hpM: 0.30 }, desc: "生命上限 +30%" },
  bulwark:  { name: "壁壘核心", icon: "armor",  cost: 220, bonus: { armor: 25 }, desc: "護甲 +25" },
  fortune:  { name: "財富核心", icon: "gold",   cost: 250, bonus: { goldM: 0.40 }, desc: "金幣獲得 +40%" },
  prism:    { name: "稜鏡核心", icon: "gem",    cost: 250, bonus: { gem: 0.50 }, desc: "鑽石獲得 +50%" },
  fury:     { name: "狂怒核心", icon: "crit",   cost: 300, bonus: { critC: 0.15 }, desc: "暴擊率 +15%" },
  bramble:  { name: "荊棘核心", icon: "thorns", cost: 250, bonus: { thorns: 14 }, desc: "近身荊棘灼燒 +14/s" },
  orbit:    { name: "軌道核心", icon: "orb",    cost: 320, bonus: { orbs: 2 }, desc: "+2 顆軌道無人機" },
  phoenix:  { name: "不死核心", icon: "regen",  cost: 360, bonus: { hpM: 0.10 }, flag: "immortal", desc: "每波免死一次（回復 35% 生命）" },
  bloodlust:{ name: "嗜血核心", icon: "regen",  cost: 300, bonus: { lifesteal: 0.06 }, desc: "每次擊殺回復少量生命" },
  berserk:  { name: "狂戰核心", icon: "dmg",    cost: 340, bonus: { dmgM: 0.55 }, flag: "glass", desc: "傷害 +55%，但護甲歸零（玻璃大砲）" },
  fortress: { name: "要塞核心", icon: "armor",  cost: 340, bonus: { hpM: 0.15 }, flag: "fortress", desc: "生命低於 30% 時，傷害減免大幅提升" },
  greed:    { name: "貪婪核心", icon: "gold",   cost: 280, bonus: { goldM: 0.70, takeDmg: 0.25 }, desc: "金幣 +70%，但承受傷害 +25%（高風險高報酬）" },
};
