// ── 共用樣式常數 ─────────────────────────────────────────────
export const miniBtn = {
  background: "rgba(15,23,42,0.8)", border: "1px solid #334155", color: "#cbd5e1",
  borderRadius: 8, padding: "6px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer",
};
export const menuBtn = (bg, bd, c, big) => ({
  background: bg, border: `1px solid ${bd}`, color: c, borderRadius: 12,
  padding: big ? "15px 0" : "13px 0", fontSize: big ? 17 : 15, fontWeight: 700, letterSpacing: 1, cursor: "pointer",
});
export const FONT = "'Rajdhani','Noto Sans TC','Segoe UI',sans-serif";
export const MONO = "'Orbitron',monospace";
