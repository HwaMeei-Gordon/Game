// ── 畫面：開始遊戲（選模式 + 難度） ──────────────────────────
import React, { useState } from "react";
import Overlay from "./Overlay.jsx";
import { DIFF } from "../data/difficulty.js";
import { MODES, HEADSTART_OFFSET } from "../data/modes.js";
import { MONO } from "../styles.js";

export default function StartOverlay({ bestWave, bestKills = 0, onStart, onClose }) {
  const [mode, setMode] = useState("classic");
  const headWave = Math.max(1, bestWave - HEADSTART_OFFSET);
  const headAvailable = bestWave - HEADSTART_OFFSET >= 2; // 需有可跳過的波次才有意義

  const extra = {
    classic: `最佳波次：第 ${bestWave} 波`,
    headstart: headAvailable ? `從第 ${headWave} 波開始（前面金幣會先結算）` : `最佳波次需超過 ${HEADSTART_OFFSET + 1} 波才能使用`,
    survival: `敵人強度：第 ${bestWave} 波 · 限時 5 分鐘 · 最佳擊殺 ${bestKills}`,
  };
  const disabled = mode === "headstart" && !headAvailable;

  return (
    <Overlay title="開始遊戲" onClose={onClose}>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>選擇模式</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {Object.keys(MODES).map((mk) => {
          const m = MODES[mk], active = mode === mk;
          const locked = mk === "headstart" && !headAvailable;
          return (
            <button key={mk} onClick={() => setMode(mk)}
              style={{ width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: 12, cursor: "pointer", opacity: locked ? 0.6 : 1,
                border: `1px solid ${active ? m.col : "#1e293b"}`, background: active ? m.col + "1c" : "rgba(15,23,42,0.5)", color: "#e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18, color: m.col }}>{m.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: active ? m.col : "#e2e8f0" }}>{m.name}</span>
                {locked && <span style={{ fontSize: 10, color: "#f59e0b" }}>🔒 尚未解鎖</span>}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, lineHeight: 1.5 }}>{m.desc}</div>
              <div style={{ fontSize: 11, color: m.col, marginTop: 4, fontFamily: MONO }}>{extra[mk]}</div>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>選擇難度後開始</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.keys(DIFF).map((dk) => { const dd = DIFF[dk];
          return (
            <button key={dk} disabled={disabled} onClick={() => onStart(dk, mode)}
              style={{ width: "100%", textAlign: "left", padding: "13px 16px", borderRadius: 12, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1,
                border: `1px solid ${dd.col}55`, background: `${dd.col}14`, color: "#e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontWeight: 700, fontSize: 16, color: dd.col }}>{dd.name}</div><div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{dd.desc}</div></div>
              <div style={{ fontSize: 11, color: "#64748b", textAlign: "right" }}>敵人 ×{dd.ehp}<br />鑽石 ×{dd.gem}</div>
            </button>
          ); })}
      </div>
    </Overlay>
  );
}
