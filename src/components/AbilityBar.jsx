// ── 畫面：主動技能列（CD 觸發，長按看說明） ──────────────────
import React, { useRef, useState } from "react";
import { ABILITIES } from "../data/skills.js";

export default function AbilityBar({ cds, onUse }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: "2px 10px 6px", flexShrink: 0 }}>
      {ABILITIES.map((ab) => <AbilityBtn key={ab.key} ab={ab} cd={cds[ab.key]} onUse={onUse} />)}
    </div>
  );
}

function AbilityBtn({ ab, cd, onUse }) {
  const ready = cd <= 0, pct = ready ? 0 : cd / ab.cd;
  const [tip, setTip] = useState(false);
  const t = useRef(null), longF = useRef(false);
  const down = () => { longF.current = false; t.current = setTimeout(() => { longF.current = true; setTip(true); }, 300); };
  const up = () => { clearTimeout(t.current); if (!longF.current && ready) onUse(ab.key); setTip(false); };
  const leave = () => { clearTimeout(t.current); setTip(false); };
  return (
    <div style={{ position: "relative", flex: 1, display: "flex" }}>
      {tip && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", width: 150, background: "#0b1220", border: `1px solid ${ab.color}`, borderRadius: 8, padding: "8px 10px", zIndex: 10, fontSize: 11, color: "#e2e8f0", boxShadow: "0 4px 14px rgba(0,0,0,0.55)" }}>
          <div style={{ fontWeight: 700, color: ab.color, marginBottom: 3 }}>{ab.icon} {ab.name}</div>
          <div style={{ color: "#cbd5e1", lineHeight: 1.4 }}>{ab.info}</div>
          <div style={{ color: "#64748b", marginTop: 3 }}>冷卻 {ab.cd}s{ab.dur ? ` · 持續 ${ab.dur}s` : ""}</div>
        </div>
      )}
      <button onPointerDown={down} onPointerUp={up} onPointerLeave={leave} disabled={!ready}
        style={{ flex: 1, position: "relative", overflow: "hidden", height: 46, borderRadius: 11, border: `1px solid ${ready ? ab.color : "#1e293b"}`, background: ready ? `${ab.color}22` : "#0b1220", color: ready ? ab.color : "#475569", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: ready ? "pointer" : "default" }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${pct * 100}%`, background: "rgba(2,6,12,0.72)" }} />
        <span style={{ fontSize: 16, zIndex: 1, lineHeight: 1 }}>{ab.icon}</span>
        <span style={{ fontSize: 9, zIndex: 1, fontWeight: 700 }}>{ready ? ab.name : Math.ceil(cd) + "s"}</span>
      </button>
    </div>
  );
}
