// ── 畫面：數值面板（全域 + 各武器） ──────────────────────────
import React from "react";
import { StatRow } from "./widgets.jsx";
import { MONO } from "../styles.js";
import { derive } from "../engine/stats.js";
import { unlockedWeapons } from "../data/skillTree.js";
import { createSkill } from "../data/skills.js";
import { WEAPONS } from "../data/weapons.js";

const EMPTY_META = { diamonds: 0, nodes: {}, weaponsOwned: {}, weaponBase: {}, relicsOwned: {}, relicEquipped: null };

const r0 = (x) => Math.round(x);
const r1 = (x) => x.toFixed(1);
const r2 = (x) => x.toFixed(2);
const pct = (x) => Math.round(x * 100) + "%";

function weaponDps(wk, w) {
  const wp = WEAPONS[wk];
  if (wp.cont) return wk === "laser" ? w.damage * w.multishot : w.damage; // 每秒
  return w.damage * w.fireRate * w.multishot;
}

export default function StatsPanel({ meta, skill }) {
  const sk = skill || createSkill();
  const base = derive(EMPTY_META, createSkill());
  const now = derive(meta, sk);
  const unlocked = unlockedWeapons(meta);

  const globalRows = [
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
        已啟用武器會同時開火。下方先列各武器目前的傷害與理論 DPS，再列全域（塔）數值的 基礎 → 目前 對照。
      </div>

      <div style={{ fontSize: 12, color: "#fca5a5", fontWeight: 700, margin: "2px 0 4px" }}>武器（目前值）</div>
      <div style={{ borderRadius: 12, border: "1px solid #1e293b", background: "rgba(15,23,42,0.5)", padding: "4px 12px", marginBottom: 12 }}>
        {unlocked.map((wk) => {
          const w = now.weapons[wk];
          return (
            <div key={wk} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #131c2e", fontSize: 13 }}>
              <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{WEAPONS[wk].name}</span>
              <span style={{ fontFamily: MONO, fontSize: 12 }}>
                <span style={{ color: "#64748b" }}>傷 </span><span style={{ color: "#fde68a" }}>{r0(w.damage)}</span>
                <span style={{ color: "#64748b", marginLeft: 8 }}>DPS </span><span style={{ color: "#4ade80" }}>{r0(weaponDps(wk, w))}</span>
                <span style={{ color: "#64748b", marginLeft: 8 }}>射 </span><span style={{ color: "#67e8f9" }}>{r2(w.range)}</span>
                <span style={{ color: "#64748b", marginLeft: 8 }}>暴 </span><span style={{ color: "#f0abfc" }}>{pct(w.critChance)}</span>
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: "#7dd3fc", fontWeight: 700, margin: "2px 0 4px" }}>全域（基礎 → 目前）</div>
      <div style={{ borderRadius: 12, border: "1px solid #1e293b", background: "rgba(15,23,42,0.5)", padding: "4px 12px" }}>
        {globalRows.map((r) => <StatRow key={r[0]} label={r[0]} base={r[1]} now={r[2]} />)}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: "#475569", lineHeight: 1.6, fontFamily: MONO }}>
        傷害公式：實際傷害 = max(1, 攻擊 − 對方防禦)；暴擊為 1.5×。玩家與敵人雙向通用。
      </div>
    </div>
  );
}
