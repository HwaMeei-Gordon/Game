// ── 畫面：說明（可從主選單隨時回看） ────────────────────────
import React from "react";
import Overlay from "./Overlay.jsx";
import { TIPS } from "../data/tips.js";

export default function HelpOverlay({ onClose }) {
  return (
    <Overlay title="遊戲說明" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {TIPS.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(15,23,42,0.5)", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 12px" }}>
            <span style={{ color: "#67e8f9", fontWeight: 700, fontFamily: "'Orbitron',monospace" }}>{i + 1}</span>
            <span style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>{t}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: "#475569", marginTop: 12, lineHeight: 1.6 }}>
        傷害公式：實際傷害 = max(1, 攻擊 − 防禦)，暴擊 ×1.5。每把武器射程/攻速/特性都不同，發展路線也不同——多嘗試組合！
      </p>
    </Overlay>
  );
}
