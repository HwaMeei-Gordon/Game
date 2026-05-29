// ── 畫面：局內升級列（全域 + 各武器分頁） ───────────────────
// 所有已啟用武器同時開火；這裡分頁切換要「加點」的對象（全域或某武器）。
import React, { useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { WEAPONS } from "../data/weapons.js";
import { ITEMS, GLOBAL_ITEMS, WEAPON_ITEMS, weaponItemCost, globalItemCost } from "../data/skills.js";
import { MONO } from "../styles.js";

export default function UpgradeBar({ unlocked, upTab, setUpTab, skill, gold, onBuy }) {
  const tabs = ["global", ...unlocked];
  const isGlobal = upTab === "global";
  const items = isGlobal ? GLOBAL_ITEMS : (WEAPON_ITEMS[upTab] || []);
  const col = isGlobal ? "#7dd3fc" : "#fca5a5";

  return (
    <>
      <div style={{ display: "flex", gap: 5, padding: "0 10px 6px", flexShrink: 0, overflowX: "auto" }}>
        {tabs.map((tk) => {
          const active = upTab === tk, label = tk === "global" ? "全域" : WEAPONS[tk].name;
          return (
            <button key={tk} onClick={() => setUpTab(tk)} style={{ flex: "1 0 auto", minWidth: 52, padding: "6px 8px", borderRadius: 8, border: `1px solid ${active ? (tk === "global" ? "#22d3ee" : "#f87171") : "#1e293b"}`, background: active ? (tk === "global" ? "rgba(34,211,238,0.16)" : "rgba(248,113,113,0.14)") : "rgba(15,23,42,0.5)", color: active ? (tk === "global" ? "#67e8f9" : "#fca5a5") : "#64748b", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
              {tk === "global" ? "🛡 全域" : <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon type={WEAPONS[tk].icon} size={13} color={active ? "#fca5a5" : "#64748b"} />{label}</span>}
            </button>
          );
        })}
      </div>
      <div style={{ flexShrink: 0, padding: "0 10px 10px" }}>
        <div style={{ display: "flex", gap: 6, justifyContent: items.length > 4 ? "space-between" : "space-around" }}>
          {items.map((k) => {
            const def = ITEMS[k];
            const lvl = isGlobal ? (skill.global[k] || 0) : ((skill.weapons[upTab] && skill.weapons[upTab][k]) || 0);
            const capped = def.cap && lvl >= def.cap;
            const c = isGlobal ? globalItemCost(skill, k) : weaponItemCost(skill, upTab, k);
            const ok = !capped && gold >= c;
            return <Cell key={k} def={def} lvl={lvl} capped={capped} c={c} ok={ok} col={col} coupled={!isGlobal} onClick={() => onBuy(upTab, k)} />;
          })}
        </div>
        <div style={{ fontSize: 9, color: "#475569", textAlign: "center", marginTop: 6 }}>
          {isGlobal ? "全域升級對塔與所有武器生效" : "已啟用武器同時開火 · 每買一級攻擊類升級，全攻擊類價格 +1% · 長按看說明"}
        </div>
      </div>
    </>
  );
}

function Cell({ def, lvl, capped, c, ok, col, coupled, onClick }) {
  const [tip, setTip] = useState(false);
  const t = useRef(null), longF = useRef(false);
  const down = () => { longF.current = false; t.current = setTimeout(() => { longF.current = true; setTip(true); }, 320); };
  const up = () => { clearTimeout(t.current); if (!longF.current && !capped && ok) onClick(); setTip(false); };
  const leave = () => { clearTimeout(t.current); setTip(false); };
  return (
    <div style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {tip && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", width: 138, background: "#0b1220", border: `1px solid ${col}`, borderRadius: 8, padding: "8px 10px", zIndex: 10, fontSize: 11, color: "#e2e8f0", boxShadow: "0 4px 14px rgba(0,0,0,0.55)" }}>
          <div style={{ fontWeight: 700, color: col, marginBottom: 3 }}>{def.name}</div>
          <div style={{ color: "#94a3b8" }}>目前：{lvl > 0 ? def.fmt(lvl) : "未升級"}</div>
          <div style={{ color: "#cbd5e1" }}>下一級：{capped ? "已滿級" : def.fmt(lvl + 1)}</div>
          {coupled && <div style={{ color: "#fca5a5", marginTop: 3 }}>每買一級攻擊類，全攻擊類價格 +1%</div>}
        </div>
      )}
      <button onPointerDown={down} onPointerUp={up} onPointerLeave={leave}
        style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 11, border: `1px solid ${ok ? col + "99" : "#1e293b"}`, background: ok ? col + "16" : "rgba(15,23,42,0.55)", color: "#e2e8f0", cursor: capped || !ok ? "default" : "pointer", opacity: capped ? 0.5 : 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: 2 }}>
        <Icon type={def.icon} size={22} color={ok ? col : "#64748b"} />
        <span style={{ fontSize: 8, color: "#64748b", lineHeight: 1 }}>Lv{lvl}{def.cap ? "/" + def.cap : ""}</span>
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 9, color: capped ? "#475569" : ok ? "#fcd34d" : "#64748b" }}>{capped ? "MAX" : `🪙${c}`}</span>
      </button>
    </div>
  );
}
