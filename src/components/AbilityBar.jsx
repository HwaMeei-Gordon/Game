// ── 畫面：主動技能列（CD 觸發） ──────────────────────────────
import React from "react";
import { ABILITIES } from "../data/skills.js";

export default function AbilityBar({ cds, onUse }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: "2px 10px 6px", flexShrink: 0 }}>
      {ABILITIES.map((ab) => {
        const cd = cds[ab.key], ready = cd <= 0, pct = ready ? 0 : cd / ab.cd;
        return (
          <button key={ab.key} onClick={() => onUse(ab.key)} disabled={!ready}
            style={{ flex: 1, position: "relative", overflow: "hidden", height: 46, borderRadius: 11, border: `1px solid ${ready ? ab.color : "#1e293b"}`, background: ready ? `${ab.color}22` : "#0b1220", color: ready ? ab.color : "#475569", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: ready ? "pointer" : "default" }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${pct * 100}%`, background: "rgba(2,6,12,0.72)" }} />
            <span style={{ fontSize: 16, zIndex: 1, lineHeight: 1 }}>{ab.icon}</span>
            <span style={{ fontSize: 9, zIndex: 1, fontWeight: 700 }}>{ready ? ab.name : Math.ceil(cd) + "s"}</span>
          </button>
        );
      })}
    </div>
  );
}
