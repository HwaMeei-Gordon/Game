// ── 畫面：遊戲內頂部資訊列（精簡：只留即時資訊 + 暫停）──────
import React from "react";
import { Pill } from "./widgets.jsx";
import { miniBtn } from "../styles.js";

const mmss = (t) => { const s = Math.max(0, Math.ceil(t)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

export default function Hud({ hud, diamonds, paused, onMenu, onPause }) {
  const survival = hud.mode === "survival";
  return (
    <div style={{ padding: "8px 10px 6px", flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
        <button onClick={onMenu} style={{ ...miniBtn, minWidth: 36, fontSize: 16 }}>‹</button>
        {survival ? (
          <>
            <Pill label="⏱ 時間" v={mmss(hud.timeLeft)} c="#f43f5e" />
            <Pill label="☠ 擊殺" v={hud.kills} c="#fca5a5" />
          </>
        ) : (
          <Pill label="波次" v={hud.wave} c="#67e8f9" />
        )}
        <Pill label="🪙 金幣" v={hud.gold.toLocaleString()} c="#fcd34d" />
        <Pill label="💎 鑽石" v={diamonds.toLocaleString()} c="#67e8f9" />
        <button onClick={onPause} style={{ ...miniBtn, minWidth: 40, fontSize: 14 }}>{paused ? "▶" : "❚❚"}</button>
      </div>
      <div style={{ marginTop: 6, height: 9, background: "#0f172a", borderRadius: 5, overflow: "hidden", border: "1px solid #1e293b" }}>
        <div style={{ height: "100%", width: `${Math.max(0, (hud.hp / hud.maxHp) * 100)}%`, background: hud.hp / hud.maxHp > 0.3 ? "linear-gradient(90deg,#22d3ee,#34d399)" : "linear-gradient(90deg,#f43f5e,#fb923c)", transition: "width .1s linear" }} />
      </div>
      <div style={{ textAlign: "center", fontSize: 9, color: "#64748b", marginTop: 2 }}>{hud.hp.toLocaleString()} / {hud.maxHp.toLocaleString()} HP</div>
    </div>
  );
}
