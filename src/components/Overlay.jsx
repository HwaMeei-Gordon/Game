// ── 畫面：底部彈出面板容器 ───────────────────────────────────
// 修正了往上滑動會卡住的問題：內容區用 overscrollBehavior:contain +
// WebkitOverflowScrolling:touch，並讓上方留白點擊關閉、但不攔截滾動。
import React from "react";
import { miniBtn, MONO } from "../styles.js";

export default function Overlay({ title, children, onClose, extra }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(4,6,10,0.82)", backdropFilter: "blur(4px)", zIndex: 20, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ flex: 1, minHeight: 40 }} />
      <div style={{
        background: "#080d16", borderTop: "1px solid #1e293b", borderRadius: "18px 18px 0 0",
        padding: "16px 14px calc(16px + env(safe-area-inset-bottom))", maxHeight: "90dvh",
        overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, position: "sticky", top: 0 }}>
          <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 16, color: "#e2e8f0", letterSpacing: 1 }}>{title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>{extra}<button onClick={onClose} style={{ ...miniBtn, padding: "4px 12px" }}>✕</button></div>
        </div>
        {children}
      </div>
    </div>
  );
}
