// ── 畫面：遊戲畫面組裝 ───────────────────────────────────────
// 純呈現：把 HUD、戰鬥畫布、主動技能與升級列組裝起來。
// 多武器系統：所有已啟用武器同時開火，升級列只負責「加點對象」。
import React from "react";
import Hud from "./Hud.jsx";
import AbilityBar from "./AbilityBar.jsx";
import UpgradeBar from "./UpgradeBar.jsx";
import { WEAPONS } from "../data/weapons.js";
import { miniBtn, MONO } from "../styles.js";

const mmss = (t) => { const s = Math.max(0, Math.floor(t)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

export default function GameScreen(props) {
  const {
    wrapRef, canvasRef, hud, diamonds, bestKills = 0, paused,
    onMenu, onPause, onOpenStats, onOpenDex, onOpenSettings, onRestart, summary,
    unlocked, upTab, setUpTab, skill, onBuyUpgrade,
    speed = 1, onCycleSpeed,
    cds, onUseAbility,
  } = props;
  const survival = hud.mode === "survival";
  const survivedToEnd = survival && hud.timeLeft <= 0;

  return (
    <>
      <Hud hud={hud} diamonds={diamonds} paused={paused} onMenu={onMenu} onPause={onPause} onStats={onOpenStats} onDex={onOpenDex} />

      <div ref={wrapRef} style={{ flex: "1 1 auto", minHeight: 0, position: "relative", touchAction: "none" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
        <div style={{ position: "absolute", top: 6, right: 8, fontSize: 9, color: "#475569" }}>雙指縮放</div>
        <button onClick={onCycleSpeed} style={{ position: "absolute", top: 6, left: 8, padding: "4px 10px", borderRadius: 8, border: `1px solid ${speed > 1 ? "#fbbf24" : "#334155"}`, background: speed > 1 ? "rgba(251,191,36,0.18)" : "rgba(15,23,42,0.75)", color: speed > 1 ? "#fcd34d" : "#cbd5e1", fontFamily: MONO, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{speed}×</button>
        {paused && !hud.gameOver && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 14, alignItems: "center", justifyContent: "center", background: "rgba(4,6,10,0.55)" }}>
            <span style={{ fontFamily: MONO, fontSize: 22, color: "#67e8f9", letterSpacing: 2 }}>⏸ 已暫停</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onPause} style={{ ...miniBtn, fontSize: 14, padding: "9px 18px", background: "#0e7490", color: "#ecfeff", border: "1px solid #22d3ee" }}>▶ 繼續</button>
              <button onClick={onOpenSettings} style={{ ...miniBtn, fontSize: 14, padding: "9px 18px" }}>⚙ 設定</button>
            </div>
          </div>
        )}
        {hud.gameOver && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(4,6,10,0.9)", backdropFilter: "blur(3px)", padding: "0 24px", overflowY: "auto" }}>
            <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 26, color: survivedToEnd ? "#4ade80" : "#f43f5e", letterSpacing: 2 }}>{survivedToEnd ? "時間到！" : "基地淪陷"}</div>
            <div style={{ color: "#94a3b8", margin: "4px 0 10px", fontSize: 14 }}>
              {survival ? `生存擊殺 ${hud.kills} 隻 · 最佳 ${Math.max(bestKills, hud.kills)}` : `抵達第 ${hud.wave} 波`}
            </div>
            {summary && (
              <div style={{ width: "100%", maxWidth: 320, background: "rgba(15,23,42,0.6)", border: "1px solid #1e293b", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: "#94a3b8" }}>擊殺 <b style={{ color: "#fca5a5" }}>{summary.kills}</b></span>
                  <span style={{ color: "#94a3b8" }}>時間 <b style={{ color: "#67e8f9" }}>{mmss(summary.time)}</b></span>
                  <span style={{ color: "#94a3b8" }}>獲得 <b style={{ color: "#67e8f9" }}>💎{summary.gems}</b></span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>各武器傷害佔比</div>
                {summary.weapons.length === 0 && <div style={{ fontSize: 12, color: "#475569" }}>—</div>}
                {summary.weapons.map((w) => (
                  <div key={w.wk} style={{ marginBottom: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#cbd5e1" }}>
                      <span>{WEAPONS[w.wk] ? WEAPONS[w.wk].name : w.wk}</span><span style={{ fontFamily: MONO, color: "#94a3b8" }}>{Math.round(w.pct * 100)}%</span>
                    </div>
                    <div style={{ height: 6, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.max(2, w.pct * 100)}%`, background: "linear-gradient(90deg,#f43f5e,#fb923c)" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onRestart} style={{ ...miniBtn, fontSize: 14, padding: "10px 20px", background: "#0e7490", color: "#ecfeff", border: "1px solid #22d3ee" }}>↻ 再來一局</button>
              <button onClick={onMenu} style={{ ...miniBtn, fontSize: 14, padding: "10px 20px" }}>主選單</button>
            </div>
          </div>
        )}
      </div>

      <AbilityBar cds={cds} onUse={onUseAbility} />
      <div style={{ textAlign: "center", fontSize: 9, color: "#475569", margin: "0 0 2px" }}>長按技能 / 升級圖示可看說明</div>
      <UpgradeBar unlocked={unlocked} upTab={upTab} setUpTab={setUpTab} skill={skill} gold={hud.gold} onBuy={onBuyUpgrade} />
    </>
  );
}
