// ── 畫面：設定（音樂 / 音效 分開開關） ───────────────────────
import React from "react";
import Overlay from "./Overlay.jsx";

function Toggle({ label, desc, on, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", marginBottom: 10, borderRadius: 12, cursor: "pointer", border: `1px solid ${on ? "#22d3ee" : "#334155"}`, background: on ? "rgba(34,211,238,0.12)" : "rgba(15,23,42,0.5)", color: "#e2e8f0", textAlign: "left" }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ width: 52, height: 28, borderRadius: 14, background: on ? "#0e7490" : "#1e293b", border: `1px solid ${on ? "#22d3ee" : "#334155"}`, position: "relative", flexShrink: 0, transition: "background .15s" }}>
        <div style={{ position: "absolute", top: 2, left: on ? 26 : 2, width: 22, height: 22, borderRadius: "50%", background: on ? "#a5f3fc" : "#64748b", transition: "left .15s" }} />
      </div>
    </button>
  );
}

export default function Settings({ sfxOn, bgmOn, onToggleSfx, onToggleBgm, onClose }) {
  return (
    <Overlay title="設定" onClose={onClose}>
      <Toggle label="🎵 背景音樂" desc="8-bit 循環配樂" on={bgmOn} onClick={onToggleBgm} />
      <Toggle label="🔊 音效" desc="擊殺、升級、技能、受擊等音效" on={sfxOn} onClick={onToggleSfx} />
      <p style={{ fontSize: 11, color: "#475569", marginTop: 8, lineHeight: 1.6 }}>
        音訊在你第一次點擊畫面後才會啟動（行動裝置限制）。音樂與音效可分開開關，設定會自動記住。
      </p>
    </Overlay>
  );
}
