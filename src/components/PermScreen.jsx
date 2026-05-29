// ── 畫面：永久進度（基礎樹 / 武器箱 / 武器樹 / 道具） ────────
import React, { useState } from "react";
import Icon from "./Icon.jsx";
import TreeView from "./TreeView.jsx";
import Armory from "./Armory.jsx";
import RelicShop from "./RelicShop.jsx";
import { WEAPONS } from "../data/weapons.js";
import { BASE_TREE, WEAPON_TREE, NODE_COL, unlockedWeapons } from "../data/skillTree.js";

export default function PermScreen({ meta, diamonds, onBuyNode, onResetTree, onUnlock, onBuyBase, onBuyRelic, onEquip }) {
  const [tab, setTab] = useState("base");
  const owned = unlockedWeapons(meta);
  const [wsub, setWsub] = useState(owned[0] || "cannon");
  const wsel = owned.includes(wsub) ? wsub : owned[0];

  const TABS = [["base", "🧬 基礎"], ["armory", "🧰 武器箱"], ["weapon", "⚔ 武器樹"], ["relic", "🎲 道具"]];

  return (
    <div>
      <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${tab === k ? "#22d3ee" : "#1e293b"}`, background: tab === k ? "rgba(34,211,238,0.16)" : "rgba(15,23,42,0.5)", color: tab === k ? "#67e8f9" : "#64748b" }}>{label}</button>
        ))}
      </div>

      {tab === "base" && (
        <TreeView tree={BASE_TREE} owned={meta.nodes} diamonds={diamonds} col={NODE_COL.base} onBuy={onBuyNode} onReset={() => onResetTree(BASE_TREE)} />
      )}
      {tab === "armory" && (
        <Armory meta={meta} diamonds={diamonds} onUnlock={onUnlock} onBuyBase={onBuyBase} />
      )}
      {tab === "weapon" && (
        <div>
          <div style={{ display: "flex", gap: 5, marginBottom: 8, overflowX: "auto" }}>
            {owned.map((wk) => (
              <button key={wk} onClick={() => setWsub(wk)} style={{ flex: "1 0 auto", minWidth: 56, padding: "6px 8px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${wsel === wk ? "#f87171" : "#1e293b"}`, background: wsel === wk ? "rgba(248,113,113,0.14)" : "rgba(15,23,42,0.5)", color: wsel === wk ? "#fca5a5" : "#64748b", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                <Icon type={WEAPONS[wk].icon} size={14} color={wsel === wk ? "#fca5a5" : "#64748b"} />{WEAPONS[wk].name}
              </button>
            ))}
          </div>
          <TreeView key={wsel} tree={WEAPON_TREE[wsel]} owned={meta.nodes} diamonds={diamonds} col={NODE_COL.weapon} onBuy={onBuyNode} onReset={() => onResetTree(WEAPON_TREE[wsel])} />
        </div>
      )}
      {tab === "relic" && (
        <RelicShop meta={meta} diamonds={diamonds} onBuy={onBuyRelic} onEquip={onEquip} />
      )}
    </div>
  );
}
