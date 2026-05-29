// ── 畫面：武器箱（購買/解鎖武器 + 升級武器基礎數值） ────────
import React from "react";
import Icon from "./Icon.jsx";
import { WEAPONS } from "../data/weapons.js";
import { ARMORY, ARMORY_BASE, armoryBaseCost } from "../data/skillTree.js";
import { MONO } from "../styles.js";

export default function Armory({ meta, diamonds, onUnlock, onBuyBase }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, lineHeight: 1.6 }}>
        在這裡購買/解鎖武器，並升級各武器的「基礎數值」。已解鎖的武器會在遊戲中同時開火，進階強化請到「武器樹」。
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Object.keys(ARMORY).map((wk) => {
          const a = ARMORY[wk], wp = WEAPONS[wk];
          const owned = wk === "cannon" || (meta.weaponsOwned && meta.weaponsOwned[wk]);
          const wb = (meta.weaponBase && meta.weaponBase[wk]) || {};
          return (
            <div key={wk} style={{ borderRadius: 12, border: `1px solid ${owned ? "#334155" : "#1e293b"}`, background: "rgba(15,23,42,0.5)", padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon type={wp.icon} size={22} color={owned ? "#fca5a5" : "#64748b"} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: owned ? "#e2e8f0" : "#94a3b8" }}>{wp.name} <span style={{ fontSize: 10, color: "#f59e0b" }}>· {wp.special}</span></div>
                  <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{wp.desc}</div>
                </div>
                {!owned && (
                  <button onClick={() => diamonds >= a.unlock && onUnlock(wk)} disabled={diamonds < a.unlock}
                    style={{ padding: "8px 12px", borderRadius: 9, fontWeight: 700, fontSize: 12, fontFamily: MONO, whiteSpace: "nowrap", cursor: diamonds >= a.unlock ? "pointer" : "default", border: `1px solid ${diamonds >= a.unlock ? "#22d3ee" : "#334155"}`, background: diamonds >= a.unlock ? "rgba(14,116,144,0.35)" : "rgba(15,23,42,0.6)", color: diamonds >= a.unlock ? "#a5f3fc" : "#64748b" }}>
                    解鎖 💎{a.unlock}
                  </button>
                )}
                {owned && <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>已擁有</span>}
              </div>
              {owned && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {a.base.map((k) => {
                    const lvl = wb[k] || 0, c = armoryBaseCost(lvl), ok = diamonds >= c, def = ARMORY_BASE[k];
                    return (
                      <button key={k} onClick={() => ok && onBuyBase(wk, k)} disabled={!ok}
                        style={{ flex: 1, padding: "7px 4px", borderRadius: 9, cursor: ok ? "pointer" : "default", border: `1px solid ${ok ? "#334155" : "#1e293b"}`, background: ok ? "rgba(34,211,238,0.1)" : "rgba(15,23,42,0.5)", color: "#e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{def.name}</span>
                        <span style={{ fontSize: 9, color: "#64748b" }}>Lv{lvl} · {def.per}</span>
                        <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: ok ? "#67e8f9" : "#64748b" }}>💎{c}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
