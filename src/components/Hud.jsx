// ── 畫面：遊戲內頂部資訊列 ───────────────────────────────────
import React from "react";
import { DIFF } from "../data/difficulty.js";
import { Pill } from "./widgets.jsx";
import { miniBtn } from "../styles.js";

export default function Hud({ hud, diamonds, paused, onMenu, onPause, onStats, onDex }) {
  return (
    <div style={{ padding: "8px 10px 6px", flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 5 }}>
        <button onClick={onMenu} style={{ ...miniBtn, minWidth: 32 }}>‹</button>
        <Pill label="波次" v={hud.wave} c="#67e8f9" />
        <Pill label="🪙金幣" v={hud.gold.toLocaleString()} c="#fcd34d" />
        <Pill label="💎鑽石" v={diamonds.toLocaleString()} c="#67e8f9" />
        <Pill label="難度" v={DIFF[hud.diff].name} c={DIFF[hud.diff].col} />
        <button onClick={onStats} style={{ ...miniBtn, minWidth: 32 }}>📊</button>
        <button onClick={onDex} style={{ ...miniBtn, minWidth: 32 }}>👾</button>
        <button onClick={onPause} style={{ ...miniBtn, minWidth: 32 }}>{paused ? "▶" : "❚❚"}</button>
      </div>
      <div style={{ marginTop: 5, height: 8, background: "#0f172a", borderRadius: 4, overflow: "hidden", border: "1px solid #1e293b" }}>
        <div style={{ height: "100%", width: `${Math.max(0, (hud.hp / hud.maxHp) * 100)}%`, background: hud.hp / hud.maxHp > 0.3 ? "linear-gradient(90deg,#22d3ee,#34d399)" : "linear-gradient(90deg,#f43f5e,#fb923c)", transition: "width .1s linear" }} />
      </div>
      <div style={{ textAlign: "center", fontSize: 9, color: "#64748b", marginTop: 2 }}>{hud.hp.toLocaleString()} / {hud.maxHp.toLocaleString()} HP</div>
    </div>
  );
}
