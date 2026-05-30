// ── 共用樣式 / 設計系統 ───────────────────────────────────────
export const FONT = "'Rajdhani','Noto Sans TC','Segoe UI',sans-serif";
export const MONO = "'Orbitron',monospace";

// 統一色票
export const C = {
  text: "#e2e8f0", sub: "#94a3b8", dim: "#64748b", faint: "#475569",
  border: "#1e293b", borderHi: "#334155",
  panel: "rgba(15,23,42,0.5)", panelSolid: "#0b1220",
  cyan: "#22d3ee", cyanL: "#67e8f9", gold: "#fcd34d",
  red: "#f43f5e", rose: "#fca5a5", green: "#4ade80", purple: "#d8b4fe",
};

// 統一面板卡片
export const card = { borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel };

// 統一分頁樣式（各畫面共用）：active 用 accent 色，未選為灰
export function tabStyle(active, accent = C.cyan, fixedWidth) {
  return {
    flex: fixedWidth ? "0 0 auto" : "1 1 0", width: fixedWidth || undefined, minWidth: fixedWidth ? undefined : 0,
    padding: "7px 8px", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
    border: `1px solid ${active ? accent : C.border}`, background: active ? accent + "22" : "rgba(15,23,42,0.5)",
    color: active ? accent : C.dim, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
  };
}

// 統一按鈕：variant = secondary(預設) / primary / danger / ghost
export function btn(variant = "secondary", extra = {}) {
  const base = { borderRadius: 10, fontWeight: 700, cursor: "pointer", fontFamily: FONT, padding: "10px 16px", fontSize: 14, border: "1px solid", transition: "background .12s" };
  const v = {
    primary:   { background: "#0e7490", border: `1px solid ${C.cyan}`, color: "#ecfeff" },
    secondary: { background: "rgba(15,23,42,0.8)", border: `1px solid ${C.borderHi}`, color: "#cbd5e1" },
    danger:    { background: "rgba(244,63,94,0.15)", border: "1px solid #f43f5e", color: C.rose },
    ghost:     { background: "rgba(15,23,42,0.5)", border: `1px solid ${C.border}`, color: C.dim },
  }[variant] || {};
  return { ...base, ...v, ...extra };
}

// 既有相容別名
export const miniBtn = { background: "rgba(15,23,42,0.8)", border: "1px solid #334155", color: "#cbd5e1", borderRadius: 8, padding: "6px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
export const menuBtn = (bg, bd, c, big) => ({ background: bg, border: `1px solid ${bd}`, color: c, borderRadius: 12, padding: big ? "15px 0" : "13px 0", fontSize: big ? 17 : 15, fontWeight: 700, letterSpacing: 1, cursor: "pointer" });
