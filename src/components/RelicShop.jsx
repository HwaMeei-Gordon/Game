// ── 畫面：道具（鑽石購買、一場只能裝備一個） ────────────────
import React from "react";
import Icon from "./Icon.jsx";
import { RELICS } from "../data/relics.js";
import { MONO } from "../styles.js";

export default function RelicShop({ meta, diamonds, onBuy, onEquip }) {
  const owned = meta.relicsOwned || {};
  const equipped = meta.relicEquipped || null;
  return (
    <div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, lineHeight: 1.6 }}>
        道具用鑽石永久購買；但<span style={{ color: "#fbbf24" }}>一場戰鬥只能裝備一個</span>。點「裝備」切換，開始遊戲時生效。
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.keys(RELICS).map((rk) => {
          const r = RELICS[rk], have = owned[rk], isEq = equipped === rk, can = diamonds >= r.cost;
          return (
            <div key={rk} style={{ borderRadius: 12, border: `1px solid ${isEq ? "#fbbf24" : "#1e293b"}`, background: isEq ? "rgba(251,191,36,0.1)" : "rgba(15,23,42,0.5)", padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <Icon type={r.icon} size={22} color={have ? "#fcd34d" : "#64748b"} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: have ? "#e2e8f0" : "#94a3b8" }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.desc}</div>
              </div>
              {!have ? (
                <button onClick={() => can && onBuy(rk)} disabled={!can}
                  style={{ padding: "8px 12px", borderRadius: 9, fontWeight: 700, fontSize: 12, fontFamily: MONO, whiteSpace: "nowrap", cursor: can ? "pointer" : "default", border: `1px solid ${can ? "#22d3ee" : "#334155"}`, background: can ? "rgba(14,116,144,0.35)" : "rgba(15,23,42,0.6)", color: can ? "#a5f3fc" : "#64748b" }}>
                  購買 💎{r.cost}
                </button>
              ) : (
                <button onClick={() => onEquip(isEq ? null : rk)}
                  style={{ padding: "8px 14px", borderRadius: 9, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", cursor: "pointer", border: `1px solid ${isEq ? "#fbbf24" : "#334155"}`, background: isEq ? "rgba(251,191,36,0.2)" : "rgba(15,23,42,0.7)", color: isEq ? "#fcd34d" : "#cbd5e1" }}>
                  {isEq ? "✓ 已裝備" : "裝備"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
