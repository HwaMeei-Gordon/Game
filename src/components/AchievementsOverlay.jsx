// ── 畫面：成就 / 里程碑 ───────────────────────────────────────
import React from "react";
import Overlay from "./Overlay.jsx";
import Icon from "./Icon.jsx";
import { ACHIEVEMENTS } from "../data/achievements.js";
import { MONO } from "../styles.js";

export default function AchievementsOverlay({ meta, onClose }) {
  const ach = meta.ach || {};
  const done = ACHIEVEMENTS.filter((a) => ach[a.id]).length;
  return (
    <Overlay title="成就" onClose={onClose} extra={<span style={{ color: "#fbbf24", fontWeight: 700 }}>{done}/{ACHIEVEMENTS.length}</span>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ACHIEVEMENTS.map((a) => {
          const unlocked = !!ach[a.id], [cur, goal] = a.prog(meta), pct = Math.min(1, cur / goal);
          return (
            <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "center", borderRadius: 10, border: `1px solid ${unlocked ? "#fbbf24" : "#1e293b"}`, background: unlocked ? "rgba(251,191,36,0.1)" : "rgba(15,23,42,0.5)", padding: "9px 11px", opacity: unlocked ? 1 : 0.92 }}>
              <Icon type={a.icon} size={22} color={unlocked ? "#fcd34d" : "#64748b"} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: unlocked ? "#fcd34d" : "#cbd5e1" }}>{a.name}{unlocked ? " ✓" : ""}</span>
                  <span style={{ fontSize: 11, color: "#67e8f9", fontFamily: MONO }}>💎{a.reward}</span>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", margin: "1px 0 4px" }}>{a.desc}</div>
                <div style={{ height: 5, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct * 100}%`, background: unlocked ? "#fbbf24" : "linear-gradient(90deg,#22d3ee,#34d399)" }} />
                </div>
              </div>
              {!unlocked && <span style={{ fontSize: 10, color: "#64748b", fontFamily: MONO, whiteSpace: "nowrap" }}>{cur}/{goal}</span>}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: "#475569", marginTop: 12, lineHeight: 1.6 }}>達成成就會自動發放鑽石獎勵；進度持續累積，遊玩越多解越多。</p>
    </Overlay>
  );
}
