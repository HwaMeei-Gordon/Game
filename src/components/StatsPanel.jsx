// ── 畫面：數值面板 ───────────────────────────────────────────
// 顯示「基礎（全裸塔） → 目前（永久技能地圖 + 局內升級）」的對照，
// 讓玩家清楚知道點的東西實際帶來多少數值差異。
import React from "react";
import { StatRow } from "./widgets.jsx";
import { MONO } from "../styles.js";
import { derive } from "../engine/stats.js";
import { rangeOf } from "../engine/update.js";
import { ZERO_NODES } from "../data/skillTree.js";
import { ZERO_SKILL } from "../data/skills.js";

const r0 = (x) => Math.round(x);
const r1 = (x) => x.toFixed(1);
const r2 = (x) => x.toFixed(2);
const pct = (x) => Math.round(x * 100) + "%";

export default function StatsPanel({ nodes, skill }) {
  const base = derive(ZERO_NODES, ZERO_SKILL);
  const now = derive(nodes, skill || ZERO_SKILL);
  const dps = (st, mult) => st.damage * st.fireRate * mult; // 理論 DPS（單彈、未計爆擊/濺射）

  const rows = [
    ["攻擊力", r0(base.damage), r0(now.damage)],
    ["攻速 (次/秒)", r2(base.fireRate), r2(now.fireRate)],
    ["理論 DPS", r0(dps(base, base.multishot)), r0(dps(now, now.multishot))],
    ["射程", r2(rangeOf(base)), r2(rangeOf(now))],
    ["多重射擊", base.multishot, now.multishot],
    ["穿透", base.pierce, now.pierce],
    ["暴擊率", pct(base.critChance), pct(now.critChance)],
    ["濺射", pct(base.splash), pct(now.splash)],
    ["生命", r0(base.maxHp), r0(now.maxHp)],
    ["每秒回復", r1(base.regen), r1(now.regen)],
    ["護甲", r0(base.armor), r0(now.armor)],
    ["荊棘灼燒/秒", r1(base.thorns), r1(now.thorns)],
    ["軌道無人機", base.orbs, now.orbs],
    ["金幣加成", pct(base.goldMult - 1), pct(now.goldMult - 1)],
    ["鑽石加成", pct(base.gemYield - 1), pct(now.gemYield - 1)],
    ["承受傷害", pct(base.takeDmgMult), pct(now.takeDmgMult)],
  ];

  return (
    <div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, lineHeight: 1.6 }}>
        左為<span style={{ color: "#64748b" }}> 基礎值</span>（全裸塔），右為<span style={{ color: "#67e8f9" }}> 目前值</span>（永久技能地圖 + 本局升級）。
        綠色代表提升、紅色代表下降（詛咒/玻璃大砲的代價）。
      </div>
      <div style={{ borderRadius: 12, border: "1px solid #1e293b", background: "rgba(15,23,42,0.5)", padding: "4px 12px" }}>
        {rows.map((r) => <StatRow key={r[0]} label={r[0]} base={r[1]} now={r[2]} />)}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: "#475569", lineHeight: 1.6, fontFamily: MONO }}>
        傷害公式：實際傷害 = max(1, 攻擊 − 對方防禦)；暴擊為 1.5×。此規則玩家與敵人雙向通用。
      </div>
    </div>
  );
}
