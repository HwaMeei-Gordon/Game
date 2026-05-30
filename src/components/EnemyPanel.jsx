// ── 畫面：敵人圖鑑 / 波次數值面板 ────────────────────────────
// 可調整「波次」與「難度」，查看每種敵人在該情境下的實際血量/攻擊/防禦/移速，
// 方便玩家分析「我大概要把傷害堆到多少才能突破第 N 波」。
import React, { useState } from "react";
import { DIFF } from "../data/difficulty.js";
import { ENEMIES, ENEMY_DEX } from "../data/enemies.js";
import { enemyStatsAt } from "../engine/stats.js";
import { MONO, miniBtn, tabStyle } from "../styles.js";

const r0 = (x) => Math.round(x);
const r2 = (x) => x.toFixed(2);

export default function EnemyPanel({ initialWave = 1, initialDiff = "normal", playerDamage = null }) {
  const [wave, setWave] = useState(Math.max(1, initialWave));
  const [diffKey, setDiffKey] = useState(initialDiff);
  const diff = DIFF[diffKey];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {Object.keys(DIFF).map((dk) => (
          <button key={dk} onClick={() => setDiffKey(dk)} style={tabStyle(diffKey === dk, DIFF[dk].col)}>{DIFF[dk].name}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 10 }}>
        <button onClick={() => setWave((w) => Math.max(1, w - 1))} style={{ ...miniBtn, padding: "6px 14px" }}>−</button>
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 16, color: "#67e8f9" }}>第 {wave} 波</span>
        <button onClick={() => setWave((w) => Math.min(99, w + 1))} style={{ ...miniBtn, padding: "6px 14px" }}>＋</button>
        <button onClick={() => setWave((w) => Math.min(99, w + 5))} style={{ ...miniBtn, padding: "6px 10px", fontSize: 11 }}>+5</button>
      </div>

      {playerDamage != null && (
        <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginBottom: 8 }}>
          你目前單發傷害 <span style={{ color: "#fde68a", fontFamily: MONO }}>{r0(playerDamage)}</span>（下表「實傷」= 你的傷害扣掉該敵防禦）
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {ENEMY_DEX.map((type) => {
          const e = ENEMIES[type], st = enemyStatsAt(type, wave, diff);
          const eff = playerDamage != null ? Math.max(1, playerDamage - st.def) : null;
          return (
            <div key={type} style={{ borderRadius: 10, border: `1px solid ${e.col}44`, background: e.col + "10", padding: "9px 11px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: type === "brute" ? 2 : "50%", background: e.col, boxShadow: `0 0 8px ${e.col}` }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: e.col }}>{e.name}</span>
                {e.trait && <span style={{ fontSize: 10, color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, padding: "1px 6px" }}>{traitName(e.trait)}</span>}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px", fontFamily: MONO, fontSize: 12 }}>
                <Stat k="血量" v={r0(st.hp)} c="#4ade80" />
                <Stat k="攻擊" v={r0(st.atk)} c="#f87171" />
                <Stat k="防禦" v={r0(st.def)} c="#7dd3fc" />
                <Stat k="移速" v={r2(st.spd)} c="#cbd5e1" />
                {eff != null && <Stat k="實傷" v={r0(eff)} c="#fde68a" />}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.4 }}>{e.info}</div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: "#475569", marginTop: 12, lineHeight: 1.6 }}>
        敵人數值隨波次指數成長（血量 ×1.16/波、攻擊 ×1.07/波、防禦 ×1.04/波、移速 ×1.015/波），再乘上難度倍率。每 5 波出現一次首領。
      </p>
    </div>
  );
}

function Stat({ k, v, c }) {
  return <span><span style={{ color: "#64748b" }}>{k} </span><span style={{ color: c, fontWeight: 700 }}>{v}</span></span>;
}
function traitName(t) { return { shield: "護盾", split: "分裂", boss: "首領" }[t] || t; }
