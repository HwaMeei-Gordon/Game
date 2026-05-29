// ── 畫面：共用小元件 ─────────────────────────────────────────
import React from "react";
import { MONO } from "../styles.js";

// HUD 上的數值膠囊
export function Pill({ label, v, c }) {
  return (
    <div style={{ flex: "1 1 auto", textAlign: "center", minWidth: 0 }}>
      <div style={{ fontSize: 9, color: "#64748b", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: c, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</div>
    </div>
  );
}

// 數值面板中的一列：標籤 + 基礎值 → 目前值
export function StatRow({ label, base, now, accent = "#67e8f9" }) {
  const up = now > base, down = now < base;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #131c2e", fontSize: 13 }}>
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span style={{ fontFamily: MONO, fontWeight: 700 }}>
        <span style={{ color: "#64748b" }}>{base}</span>
        <span style={{ color: "#475569", margin: "0 6px" }}>→</span>
        <span style={{ color: up ? "#4ade80" : down ? "#f87171" : accent }}>{now}</span>
      </span>
    </div>
  );
}
