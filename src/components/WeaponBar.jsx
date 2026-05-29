// ── 畫面：武器選擇列 ─────────────────────────────────────────
import React from "react";
import Icon from "./Icon.jsx";
import { WEAPONS } from "../data/weapons.js";

export default function WeaponBar({ unlocked, weapon, setWeapon }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: "8px 10px 4px", flexShrink: 0, overflowX: "auto" }}>
      {Object.keys(WEAPONS).map((k) => {
        const locked = !unlocked.includes(k), active = weapon === k;
        return (
          <button key={k} onClick={() => !locked && setWeapon(k)} disabled={locked}
            style={{ flex: "1 0 auto", minWidth: 58, padding: "6px 4px", borderRadius: 10, border: `1px solid ${active ? "#22d3ee" : locked ? "#1e293b" : "#334155"}`, background: active ? "rgba(34,211,238,0.16)" : "rgba(15,23,42,0.5)", color: active ? "#67e8f9" : locked ? "#475569" : "#cbd5e1", cursor: locked ? "default" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Icon type={WEAPONS[k].icon} size={18} color={active ? "#67e8f9" : locked ? "#475569" : "#cbd5e1"} />
            <span style={{ fontSize: 9, fontWeight: 700 }}>{locked ? "🔒" : WEAPONS[k].name}</span>
          </button>
        );
      })}
    </div>
  );
}
