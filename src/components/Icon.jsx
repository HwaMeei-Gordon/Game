// ── 畫面：向量圖示 ───────────────────────────────────────────
// 統一的 SVG 圖示集，供技能、武器、節點共用。
import React from "react";

export default function Icon({ type, size = 18, color = "#e2e8f0" }) {
  const p = { fill: "none", stroke: color, strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" };
  const f = { fill: color };
  const paths = {
    dmg:    <path d="M5 19L19 5M19 5h-5M19 5v5" {...p} />,
    rate:   <path d="M13 2L4 14h6l-1 8 9-12h-6z" {...f} />,
    range:  <g {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2" {...f} /></g>,
    multi:  <g {...p}><path d="M12 4v16M6 8v12M18 8v12" /></g>,
    pierce: <path d="M3 12h14m0 0l-4-4m4 4l-4 4M19 6v12" {...p} />,
    hp:     <path d="M12 20s-7-4.5-7-9a4 4 0 018-1 4 4 0 018 1c0 4.5-7 9-7 9z" {...f} />,
    regen:  <path d="M12 4v16M4 12h16" {...p} />,
    armor:  <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" {...p} />,
    crit:   <path d="M12 3l2.5 6L21 9.5l-5 4 1.8 6.5L12 16l-5.8 4L8 13.5l-5-4 6.5-.5z" {...f} />,
    splash: <g {...p}><circle cx="12" cy="12" r="3" {...f} /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" /></g>,
    thorns: <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" {...f} />,
    gold:   <g><circle cx="12" cy="12" r="8" {...p} /><path d="M12 8v8M9.5 10h3.5a1.5 1.5 0 010 3H9.5" {...p} /></g>,
    gem:    <path d="M6 4h12l3 5-9 11L3 9z" {...p} />,
    orb:    <g {...p}><circle cx="12" cy="12" r="3" {...f} /><ellipse cx="12" cy="12" rx="9" ry="4" /></g>,
    core:   <g {...p}><circle cx="12" cy="12" r="4" {...f} /><circle cx="12" cy="12" r="9" /><path d="M12 1v3M12 20v3M1 12h3M20 12h3" /></g>,
    curse:  <g {...p}><path d="M12 3l9 16H3z" /><path d="M12 9v5" /><circle cx="12" cy="16.5" r="0.6" {...f} /></g>,
    cannon: <g {...p}><circle cx="12" cy="12" r="3.5" {...f} /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></g>,
    homing: <path d="M3 12c6-8 12 8 18 0M16 9l2 3-2 3" {...p} />,
    laser:  <g><path d="M5 12h14" stroke={color} strokeWidth="3" strokeLinecap="round" /><circle cx="5" cy="12" r="2.5" {...f} /></g>,
    chain:  <path d="M5 5l4 5-3 1 5 4-1-4 4 4" {...p} />,
    flame:  <path d="M12 3c3 4 5 6 5 9a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 2-1-3 0-5 1-7z" {...f} />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[type] || paths.dmg}</svg>;
}
