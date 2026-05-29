// ── 畫面：局內技能升級列（金幣購買） ────────────────────────
import React, { useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { TREE, skillCost } from "../data/skills.js";
import { MONO } from "../styles.js";

export default function SkillBar({ skillCat, setSkillCat, skillV, gold, onBuy }) {
  return (
    <>
      <div style={{ display: "flex", gap: 6, padding: "0 10px 6px", flexShrink: 0 }}>
        {Object.keys(TREE).map((cat) => (
          <button key={cat} onClick={() => setSkillCat(cat)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: `1px solid ${skillCat === cat ? TREE[cat].col : "#1e293b"}`, background: skillCat === cat ? `${TREE[cat].col}1f` : "rgba(15,23,42,0.5)", color: skillCat === cat ? TREE[cat].col : "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{TREE[cat].name}</button>
        ))}
      </div>
      <div style={{ flexShrink: 0, padding: "0 10px 12px" }}>
        <div style={{ display: "flex", gap: 7, justifyContent: "space-around" }}>
          {Object.keys(TREE[skillCat].items).map((k) => {
            const def = TREE[skillCat].items[k], lvl = skillV[k], capped = def.cap && lvl >= def.cap, c = skillCost(def, lvl), ok = !capped && gold >= c;
            return <SkillCell key={k} def={def} lvl={lvl} capped={capped} c={c} ok={ok} col={TREE[skillCat].col} onClick={() => onBuy(k)} />;
          })}
        </div>
        <div style={{ fontSize: 9, color: "#475569", textAlign: "center", marginTop: 6 }}>長按圖示看詳細數值</div>
      </div>
    </>
  );
}

function SkillCell({ def, lvl, capped, c, ok, col, onClick }) {
  const [tip, setTip] = useState(false);
  const t = useRef(null), longF = useRef(false);
  const down = () => { longF.current = false; t.current = setTimeout(() => { longF.current = true; setTip(true); }, 320); };
  const up = () => { clearTimeout(t.current); if (!longF.current && !capped && ok) onClick(); setTip(false); };
  const leave = () => { clearTimeout(t.current); setTip(false); };
  return (
    <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {tip && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", width: 134, background: "#0b1220", border: `1px solid ${col}`, borderRadius: 8, padding: "8px 10px", zIndex: 10, fontSize: 11, color: "#e2e8f0", boxShadow: "0 4px 14px rgba(0,0,0,0.55)" }}>
          <div style={{ fontWeight: 700, color: col, marginBottom: 3 }}>{def.name}</div>
          <div style={{ color: "#94a3b8" }}>目前：{lvl > 0 ? def.fmt(lvl) : "未升級"}</div>
          <div style={{ color: "#cbd5e1" }}>下一級：{def.cap && lvl >= def.cap ? "已滿級" : def.nxt}</div>
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
