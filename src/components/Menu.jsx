// ── 畫面：主選單 ─────────────────────────────────────────────
import React from "react";
import { menuBtn, MONO } from "../styles.js";

export default function Menu({ metaV, onStart, onPerm, onStats, onDex, onCodes, onSettings, onHelp }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 35%, rgba(34,211,238,0.14), transparent 60%)" }} />
      <div style={{ zIndex: 1, textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 38, letterSpacing: 5, color: "#67e8f9", textShadow: "0 0 22px rgba(34,211,238,0.5)" }}>THE TOWER</div>
        <div style={{ fontSize: 16, letterSpacing: 8, color: "#64748b", marginTop: 2, marginBottom: 24 }}>無 盡 塔 防</div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 26, fontSize: 14, flexWrap: "wrap" }}>
          <span style={{ color: "#67e8f9" }}>💎 {metaV.diamonds.toLocaleString()}</span>
          <span style={{ color: "#c4b5fd" }}>⭐ 最佳 第{metaV.bestWave}波</span>
          {metaV.bestKills > 0 && <span style={{ color: "#fca5a5" }}>☠ 生存 {metaV.bestKills}</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11, width: 250, margin: "0 auto" }}>
          <button onClick={onStart} style={menuBtn("#0e7490", "#22d3ee", "#ecfeff", true)}>▶ 開始遊戲</button>
          <button onClick={onPerm} style={menuBtn("rgba(15,23,42,0.7)", "#334155", "#cbd5e1")}>💎 技能地圖</button>
          <button onClick={onStats} style={menuBtn("rgba(15,23,42,0.7)", "#334155", "#cbd5e1")}>📊 數值面板</button>
          <button onClick={onDex} style={menuBtn("rgba(15,23,42,0.7)", "#334155", "#cbd5e1")}>👾 敵人圖鑑</button>
          <button onClick={onCodes} style={menuBtn("rgba(15,23,42,0.7)", "#334155", "#cbd5e1")}>💾 進度代碼</button>
          <button onClick={onSettings} style={menuBtn("rgba(15,23,42,0.7)", "#334155", "#cbd5e1")}>⚙ 設定</button>
          <button onClick={onHelp} style={menuBtn("rgba(15,23,42,0.7)", "#334155", "#cbd5e1")}>❔ 說明</button>
        </div>
        <p style={{ fontSize: 11, color: "#475569", marginTop: 24, maxWidth: 290, lineHeight: 1.6 }}>進度會自動存在這支手機的瀏覽器，關掉重開都還在。換手機或想備份時，請用「進度代碼」複製/貼回。</p>
      </div>
    </div>
  );
}
