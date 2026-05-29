// ── 資料：遊戲模式 ───────────────────────────────────────────
// classic   經典：從第 1 波開始，挑戰最高波次。
// headstart 續戰：從「最佳波次 − HEADSTART_OFFSET」開始，並結算跳過波次的金幣。
// survival  無限生存：以最佳波次的敵人強度持續猛攻 SURVIVAL_SECONDS 秒，比拼擊殺數。
export const HEADSTART_OFFSET = 10;
export const SURVIVAL_SECONDS = 300; // 5 分鐘

export const MODES = {
  classic:   { name: "經典",     icon: "▶",  col: "#22d3ee", desc: "從第 1 波開始，挑戰你的最高波次紀錄。" },
  headstart: { name: "續戰",     icon: "⏭",  col: "#a78bfa", desc: "從『最佳波次 −10』開始，並先結算前面波次的金幣，省去重刷前期、直接衝高紀錄。" },
  survival:  { name: "無限生存", icon: "♾",  col: "#f43f5e", desc: "以你最佳波次的敵人強度持續猛攻 5 分鐘，比拼這段時間的擊殺數（測試/壓測用）。" },
};
