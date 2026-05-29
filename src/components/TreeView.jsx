// ── 畫面：通用技能樹檢視（基礎樹 / 各武器樹共用） ───────────
// 點一下只選取；購買走下方按鈕（防誤觸）。連線不隨縮放變細、可預覽鑽石花費。
import React, { useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { MONO } from "../styles.js";
import { nodeMap, isNodeUnlocked, childrenOf, nodeDesc, spentInTree, resetFee } from "../data/skillTree.js";

const VW = 2000, VH = 2000, ORIGIN = 1000;
const SPREAD = 2.0;
const nodeR = (n) => (n.special ? 30 : n.parent === null ? 26 : 22);
const NX = (n) => n.x * SPREAD, NY = (n) => n.y * SPREAD;

export default function TreeView({ tree, owned, diamonds, col = "#67e8f9", onBuy, onReset }) {
  const byId = nodeMap(tree);
  const [sel, setSel] = useState(tree[0] ? tree[0].id : null);
  const [armed, setArmed] = useState(false);
  const [view, setView] = useState({ tx: 0, ty: -120, zoom: 0.7 });
  const box = useRef(null);
  const drag = useRef({ down: false, moved: false, sx: 0, sy: 0, otx: 0, oty: 0, lp: null, lpFired: false });
  const pinch = useRef({ active: false, d0: 0, oz: 1 });

  const toWorld = (cx, cy) => {
    const r = box.current.getBoundingClientRect();
    const sx = (cx - r.left) / r.width * VW - ORIGIN, sy = (cy - r.top) / r.height * VH - ORIGIN;
    return { wx: (sx - view.tx) / view.zoom, wy: (sy - view.ty) / view.zoom };
  };
  const hit = (cx, cy) => {
    const { wx, wy } = toWorld(cx, cy); let f = null, fd = 1e9;
    for (const n of tree) { const rr = nodeR(n) + 6; const dd = (NX(n) - wx) ** 2 + (NY(n) - wy) ** 2; if (dd < rr * rr && dd < fd) { fd = dd; f = n; } }
    return f;
  };
  const zoomBy = (k) => setView((v) => ({ ...v, zoom: Math.max(0.4, Math.min(2.6, +(v.zoom * k).toFixed(3))) }));
  const onDown = (e) => {
    if (pinch.current.active) return; const t = e.touches ? e.touches[0] : e;
    drag.current = { ...drag.current, down: true, moved: false, sx: t.clientX, sy: t.clientY, otx: view.tx, oty: view.ty };
    clearTimeout(drag.current.lp);
  };
  const onMove = (e) => {
    if (!drag.current.down || pinch.current.active) return; const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - drag.current.sx, dy = t.clientY - drag.current.sy;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      drag.current.moved = true;
      const r = box.current.getBoundingClientRect();
      setView((v) => ({ ...v, tx: drag.current.otx + dx * (VW / r.width), ty: drag.current.oty + dy * (VH / r.height) }));
    }
  };
  const onUp = (e) => {
    const moved = drag.current.moved; drag.current.down = false;
    if (moved || pinch.current.active) return;
    const t = e.changedTouches ? e.changedTouches[0] : e, nd = hit(t.clientX, t.clientY);
    if (nd) setSel(nd.id);
  };
  const dist2 = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const onTStart = (e) => { if (e.touches.length === 2) { pinch.current = { active: true, d0: dist2(e.touches[0], e.touches[1]) || 1, oz: view.zoom }; drag.current.down = false; } };
  const onTMove = (e) => { if (pinch.current.active && e.touches.length === 2) { const d = dist2(e.touches[0], e.touches[1]); setView((v) => ({ ...v, zoom: Math.max(0.4, Math.min(2.6, pinch.current.oz * d / pinch.current.d0)) })); } };
  const onTEnd = (e) => { if (e.touches.length < 2) pinch.current.active = false; };

  const selNode = sel ? byId[sel] : null;
  const selOwned = selNode ? (owned[selNode.id] || 0) >= 1 : false;
  const selUnlocked = selNode ? isNodeUnlocked(selNode, owned) : false;
  const selChildren = selNode ? childrenOf(tree, selNode.id).map((n) => n.id) : [];
  const spent = spentInTree(tree, owned), fee = resetFee(spent), refund = spent - fee;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#64748b" }}>拖曳平移 · 雙指縮放 · 點節點選取</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => zoomBy(1 / 1.25)} style={zbtn}>−</button>
          <button onClick={() => zoomBy(1.25)} style={zbtn}>＋</button>
        </div>
      </div>

      <div ref={box} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
        onPointerLeave={() => { drag.current.down = false; }} onTouchStart={onTStart} onTouchMove={onTMove} onTouchEnd={onTEnd}
        style={{ width: "100%", height: "40vh", overflow: "hidden", borderRadius: 12, background: "radial-gradient(circle at 50% 40%, #0b1626, #060c16)", border: "1px solid #131c2e", touchAction: "none", cursor: "grab" }}>
        <svg viewBox={`-${ORIGIN} -${ORIGIN} ${VW} ${VH}`} style={{ width: "100%", height: "100%", display: "block" }}>
          <g transform={`translate(${view.tx},${view.ty}) scale(${view.zoom})`}>
            {tree.map((nd) => {
              if (!nd.parent) return null; const p = byId[nd.parent]; if (!p) return null;
              const childOwned = (owned[nd.id] || 0) >= 1, parentOwned = (owned[nd.parent] || 0) >= 1, fromSel = sel === nd.parent;
              let stroke = "#46577a", width = 2.4, opacity = 0.8, dash = "none";
              if (childOwned && parentOwned) { stroke = col; width = 4; opacity = 1; }
              else if (parentOwned) { stroke = col; width = 3; opacity = fromSel ? 1 : 0.8; dash = "6 5"; }
              return <line key={"l" + nd.id} x1={NX(nd)} y1={NY(nd)} x2={NX(p)} y2={NY(p)} stroke={stroke} strokeWidth={width} opacity={opacity} strokeDasharray={dash} strokeLinecap="round" vectorEffect="non-scaling-stroke" />;
            })}
            {tree.map((nd) => {
              const own = (owned[nd.id] || 0) >= 1, unlocked = isNodeUnlocked(nd, owned), afford = unlocked && !own && diamonds >= nd.cost;
              const reachable = unlocked && !own, child = selChildren.includes(nd.id);
              const rN = nodeR(nd), isz = Math.round(rN * 0.9), X = NX(nd), Y = NY(nd);
              return (
                <g key={nd.id} style={{ cursor: "pointer" }}>
                  {sel === nd.id && <circle cx={X} cy={Y} r={rN + 6} fill="none" stroke={col} strokeWidth="2.5" opacity="0.85" />}
                  {reachable && <circle cx={X} cy={Y} r={rN + 4} fill="none" stroke={afford ? col : "#475569"} strokeWidth="2"><animate attributeName="opacity" values="0.25;0.85;0.25" dur="1.6s" repeatCount="indefinite" /></circle>}
                  {child && !own && <circle cx={X} cy={Y} r={rN + 9} fill="none" stroke={col} strokeWidth="1.4" opacity="0.4" strokeDasharray="3 4" />}
                  {nd.special && <circle cx={X} cy={Y} r={rN + 3} fill="none" stroke={own ? col : "#334155"} strokeWidth="1.5" opacity="0.5" />}
                  <circle cx={X} cy={Y} r={rN} fill={own ? col + "44" : afford ? col + "22" : "#0b1220"} stroke={own ? col : afford ? col : unlocked ? "#64748b" : "#1e293b"} strokeWidth={nd.special ? 3 : 1.8} opacity={unlocked || own ? 1 : 0.45} />
                  <g transform={`translate(${X - isz / 2}, ${Y - isz / 2})`} opacity={unlocked || own ? 1 : 0.5}>
                    <foreignObject x="0" y="0" width={isz} height={isz}>
                      <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: isz, height: isz }}><Icon type={nd.icon} size={isz} color={own ? "#fff" : unlocked ? "#e2e8f0" : "#475569"} /></div>
                    </foreignObject>
                  </g>
                  {!own && nd.cost > 0 && <text x={X} y={Y + rN + 17} fontSize="15" fontWeight="700" textAnchor="middle" fill={afford ? col : "#475569"}>{unlocked ? "" : "🔒"}💎{nd.cost}</text>}
                  {own && <g><circle cx={X + rN - 4} cy={Y - rN + 4} r="7.5" fill="#16a34a" stroke="#4ade80" strokeWidth="1.2" /><path d={`M${X + rN - 7.5} ${Y - rN + 4}l2 2.4 3.4-4`} stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div style={{ marginTop: 10, minHeight: 86, borderRadius: 12, border: `1px solid ${col}55`, background: "rgba(15,23,42,0.5)", padding: "10px 12px" }}>
        {selNode && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: col }}>{selNode.name}{selNode.special ? " ★" : ""}</span>
              <span style={{ fontSize: 11, color: selOwned ? "#4ade80" : "#64748b" }}>{selOwned ? "已點亮" : selUnlocked ? "可點亮" : "未解鎖"}</span>
            </div>
            <div style={{ fontSize: 12, color: "#cbd5e1", margin: "4px 0 8px", lineHeight: 1.5 }}>{selNode.info || nodeDesc(selNode)}</div>
            <button onClick={() => { if (!selOwned && selUnlocked && diamonds >= selNode.cost) onBuy(selNode.id); }}
              disabled={selOwned || !selUnlocked || diamonds < selNode.cost}
              style={{ width: "100%", padding: "9px 0", borderRadius: 9, fontWeight: 700, fontSize: 13, fontFamily: MONO,
                cursor: !selOwned && selUnlocked && diamonds >= selNode.cost ? "pointer" : "default",
                border: `1px solid ${selOwned ? "#16a34a" : !selUnlocked ? "#1e293b" : diamonds >= selNode.cost ? "#22d3ee" : "#334155"}`,
                background: selOwned ? "rgba(22,163,74,0.18)" : diamonds >= selNode.cost && selUnlocked ? "rgba(14,116,144,0.35)" : "rgba(15,23,42,0.6)",
                color: selOwned ? "#4ade80" : !selUnlocked ? "#64748b" : diamonds >= selNode.cost ? "#a5f3fc" : "#64748b" }}>
              {selOwned ? "✓ 已點亮" : !selUnlocked ? "需先點亮前置節點" : `點亮  💎 ${selNode.cost.toLocaleString()}`}
            </button>
          </>
        )}
      </div>

      {onReset && spent > 0 && (
        <div style={{ marginTop: 8 }}>
          {armed ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#fca5a5", flex: 1 }}>確定重置此樹？退還 💎{refund}（手續費 {fee}）</span>
              <button onClick={() => { setArmed(false); onReset(); }} style={{ ...rbtn, border: "1px solid #f43f5e", color: "#fca5a5" }}>確定</button>
              <button onClick={() => setArmed(false)} style={rbtn}>取消</button>
            </div>
          ) : (
            <button onClick={() => setArmed(true)} style={{ width: "100%", padding: "8px 0", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid #7f1d1d", background: "rgba(127,29,29,0.25)", color: "#fca5a5" }}>↺ 重置此樹（退還 💎{refund}，手續費 {fee}）</button>
          )}
        </div>
      )}
    </div>
  );
}

const zbtn = { width: 30, height: 26, borderRadius: 7, border: "1px solid #334155", background: "rgba(15,23,42,0.7)", color: "#cbd5e1", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 };
const rbtn = { padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid #334155", background: "rgba(15,23,42,0.7)", color: "#cbd5e1", whiteSpace: "nowrap" };
