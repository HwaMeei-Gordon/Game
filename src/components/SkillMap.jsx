// ── 畫面：永久技能地圖 ───────────────────────────────────────
// 可拖曳平移、雙指縮放。連線依狀態上色（已點亮亮、可點亮虛線發光、未解鎖灰暗），
// 並「預覽下一步」：選取節點時高亮它能通往的子節點。
import React, { useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { WEAPONS } from "../data/weapons.js";
import { MONO } from "../styles.js";
import {
  NODES, NODE_COL, MAX_BIG, nodeById, isBig, countBig,
  isNodeUnlocked, childrenOf, nodeDesc, spentDiamonds, resetFee,
} from "../data/skillTree.js";

const VW = 1500, VH = 1500, ORIGIN = 750;
const nodeR = (n) => (n.t === "keystone" ? 32 : isBig(n) ? 28 : n.t === "weapon" || n.t === "core" || n.t === "curse" ? 24 : 21);

export default function SkillMap({ nodes, diamonds, onBuy, onReset }) {
  const [sel, setSel] = useState("core");
  const [armed, setArmed] = useState(false);
  const [view, setView] = useState({ tx: 0, ty: -170, zoom: 0.78 });
  const box = useRef(null);
  const drag = useRef({ down: false, moved: false, sx: 0, sy: 0, otx: 0, oty: 0, lp: null, lpFired: false });
  const pinch = useRef({ active: false, d0: 0, oz: 1 });
  const big = countBig(nodes);

  const toWorld = (cx, cy) => {
    const r = box.current.getBoundingClientRect();
    const sx = (cx - r.left) / r.width * VW - ORIGIN, sy = (cy - r.top) / r.height * VH - ORIGIN;
    return { wx: (sx - view.tx) / view.zoom, wy: (sy - view.ty) / view.zoom };
  };
  const hit = (cx, cy) => {
    const { wx, wy } = toWorld(cx, cy); let found = null, fd = 1e9;
    for (const n of NODES) { const rr = nodeR(n) + 4; const dd = (n.x - wx) ** 2 + (n.y - wy) ** 2; if (dd < rr * rr && dd < fd) { fd = dd; found = n; } }
    return found;
  };
  const zoomBy = (f) => setView((v) => ({ ...v, zoom: Math.max(0.5, Math.min(2.4, +(v.zoom * f).toFixed(3))) }));
  const onDown = (e) => {
    if (pinch.current.active) return; const t = e.touches ? e.touches[0] : e;
    drag.current = { ...drag.current, down: true, moved: false, sx: t.clientX, sy: t.clientY, otx: view.tx, oty: view.ty, lpFired: false };
    const nd = hit(t.clientX, t.clientY);
    drag.current.lp = setTimeout(() => { if (!drag.current.moved && nd) { drag.current.lpFired = true; setSel(nd.id); } }, 280);
  };
  const onMove = (e) => {
    if (!drag.current.down || pinch.current.active) return; const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - drag.current.sx, dy = t.clientY - drag.current.sy;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      drag.current.moved = true; clearTimeout(drag.current.lp);
      const r = box.current.getBoundingClientRect(), kx = VW / r.width, ky = VH / r.height;
      setView((v) => ({ ...v, tx: drag.current.otx + dx * kx, ty: drag.current.oty + dy * ky }));
    }
  };
  const onUp = (e) => {
    clearTimeout(drag.current.lp); const moved = drag.current.moved, fired = drag.current.lpFired; drag.current.down = false;
    if (moved || fired || pinch.current.active) return;
    const t = e.changedTouches ? e.changedTouches[0] : e, nd = hit(t.clientX, t.clientY);
    if (!nd) return; setSel(nd.id);
    const owned = (nodes[nd.id] || 0) >= 1;
    if (owned) { if (isBig(nd)) onBuy(nd.id); return; }
    if (isNodeUnlocked(nd, nodes) && diamonds >= nd.cost && !(isBig(nd) && big >= MAX_BIG)) onBuy(nd.id);
  };
  const dist2 = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const onTStart = (e) => { if (e.touches.length === 2) { pinch.current = { active: true, d0: dist2(e.touches[0], e.touches[1]) || 1, oz: view.zoom }; clearTimeout(drag.current.lp); drag.current.down = false; drag.current.moved = false; } };
  const onTMove = (e) => { if (pinch.current.active && e.touches.length === 2) { const d = dist2(e.touches[0], e.touches[1]); setView((v) => ({ ...v, zoom: Math.max(0.5, Math.min(2.4, pinch.current.oz * d / pinch.current.d0)) })); } };
  const onTEnd = (e) => { if (e.touches.length < 2) pinch.current.active = false; };

  const selNode = sel ? nodeById[sel] : null;
  const selOwned = selNode ? (nodes[selNode.id] || 0) >= 1 : false;
  const selUnlocked = selNode ? isNodeUnlocked(selNode, nodes) : false;
  const selBigBlocked = selNode ? isBig(selNode) && !selOwned && big >= MAX_BIG : false;
  const selChildren = selNode ? childrenOf(selNode.id).map((n) => n.id) : [];
  const tmap = { small: "小型", major: "大型", curse: "詛咒", keystone: "終極", weapon: "武器", core: "核心" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#64748b" }}>拖曳平移 · 雙指縮放 · 點節點看路徑</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => zoomBy(1 / 1.25)} style={zbtn}>−</button>
          <button onClick={() => zoomBy(1.25)} style={zbtn}>＋</button>
          <span style={{ fontSize: 11, color: big >= MAX_BIG ? "#f43f5e" : "#fbbf24", fontWeight: 700, marginLeft: 4 }}>大型 {big}/{MAX_BIG}</span>
        </div>
      </div>

      <div ref={box} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
        onPointerLeave={() => { clearTimeout(drag.current.lp); drag.current.down = false; }}
        onTouchStart={onTStart} onTouchMove={onTMove} onTouchEnd={onTEnd}
        style={{ width: "100%", height: "46vh", overflow: "hidden", borderRadius: 12, background: "radial-gradient(circle at 50% 45%, #0b1626, #060c16)", border: "1px solid #131c2e", touchAction: "none", cursor: "grab" }}>
        <svg viewBox={`-${ORIGIN} -${ORIGIN} ${VW} ${VH}`} style={{ width: "100%", height: "100%", display: "block" }}>
          <g transform={`translate(${view.tx},${view.ty}) scale(${view.zoom})`}>
            {/* 連線：依狀態著色，可點亮的線發光虛線（預覽下一步） */}
            {NODES.map((nd) => {
              const parents = nd.reqAll || (nd.parent ? [nd.parent] : []);
              return parents.map((pid) => {
                const p = nodeById[pid];
                const childOwned = (nodes[nd.id] || 0) >= 1, parentOwned = (nodes[pid] || 0) >= 1;
                const cu = nd.t === "curse" || p.t === "curse";
                const baseCol = cu ? "#f43f5e" : NODE_COL[nd.br];
                const fromSel = sel === pid; // 從選取節點延伸出去的路徑
                let stroke = "#1b2740", width = 2, opacity = 0.4, dash = cu ? "6 5" : "none";
                if (childOwned && parentOwned) { stroke = baseCol; width = 4; opacity = 0.85; }
                else if (parentOwned) { stroke = baseCol; width = 3; opacity = fromSel ? 0.95 : 0.55; dash = "7 5"; }
                if (fromSel && !childOwned) { width = 3.5; opacity = 0.95; }
                return <line key={"l" + nd.id + pid} x1={nd.x} y1={nd.y} x2={p.x} y2={p.y} stroke={stroke} strokeWidth={width} opacity={opacity} strokeDasharray={dash} strokeLinecap="round" />;
              });
            })}
            {/* 節點 */}
            {NODES.map((nd) => {
              const owned = (nodes[nd.id] || 0) >= 1, unlocked = isNodeUnlocked(nd, nodes);
              const afford = unlocked && !owned && diamonds >= nd.cost;
              const blocked = isBig(nd) && !owned && big >= MAX_BIG;
              const reachable = unlocked && !owned && !blocked; // 現在可點（預覽）
              const isChildOfSel = selChildren.includes(nd.id);
              const col = nd.t === "curse" ? NODE_COL.curse : NODE_COL[nd.br];
              const rN = nodeR(nd), isz = Math.round(rN * 0.9);
              return (
                <g key={nd.id} style={{ cursor: "pointer" }}>
                  {sel === nd.id && <circle cx={nd.x} cy={nd.y} r={rN + 6} fill="none" stroke={col} strokeWidth="2.5" opacity="0.85" />}
                  {reachable && (
                    <circle cx={nd.x} cy={nd.y} r={rN + 4} fill="none" stroke={afford ? col : "#475569"} strokeWidth="2">
                      <animate attributeName="opacity" values="0.25;0.85;0.25" dur="1.6s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {isChildOfSel && !owned && <circle cx={nd.x} cy={nd.y} r={rN + 9} fill="none" stroke={col} strokeWidth="1.4" opacity="0.4" strokeDasharray="3 4" />}
                  {isBig(nd) && <circle cx={nd.x} cy={nd.y} r={rN + 3} fill="none" stroke={owned ? col : "#334155"} strokeWidth="1.5" opacity="0.5" />}
                  <circle cx={nd.x} cy={nd.y} r={rN}
                    fill={owned ? col + "44" : afford ? col + "22" : blocked ? "#1a1015" : "#0b1220"}
                    stroke={owned ? col : blocked ? "#7f1d1d" : afford ? col : unlocked ? "#64748b" : "#1e293b"}
                    strokeWidth={nd.t === "keystone" ? 3 : isBig(nd) ? 2.5 : 1.8} opacity={unlocked || owned ? 1 : 0.45} />
                  <g transform={`translate(${nd.x - isz / 2}, ${nd.y - isz / 2})`} opacity={unlocked || owned ? 1 : 0.5}>
                    <foreignObject x="0" y="0" width={isz} height={isz}>
                      <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: isz, height: isz }}>
                        <Icon type={nd.icon} size={isz} color={owned ? "#fff" : nd.t === "curse" ? "#fca5a5" : unlocked ? "#e2e8f0" : "#475569"} />
                      </div>
                    </foreignObject>
                  </g>
                  {!unlocked && !owned && <text x={nd.x} y={nd.y + rN + 14} fontSize="13" textAnchor="middle">🔒</text>}
                  {owned && (
                    <g>
                      <circle cx={nd.x + rN - 4} cy={nd.y - rN + 4} r="7.5" fill="#16a34a" stroke="#4ade80" strokeWidth="1.2" />
                      <path d={`M${nd.x + rN - 7.5} ${nd.y - rN + 4}l2 2.4 3.4-4`} stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* 詳細說明 + 操作 */}
      <div style={{ marginTop: 10, minHeight: 92, borderRadius: 12, border: `1px solid ${selNode ? (selNode.t === "curse" ? "#f43f5e" : NODE_COL[selNode.br]) + "55" : "#1e293b"}`, background: "rgba(15,23,42,0.5)", padding: "10px 12px" }}>
        {selNode && (() => {
          const col = selNode.t === "curse" ? NODE_COL.curse : NODE_COL[selNode.br];
          const dsc = nodeDesc(selNode);
          return (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: col }}>{selNode.name} <span style={{ fontSize: 10, color: "#64748b" }}>· {tmap[selNode.t]}</span></span>
                <span style={{ fontSize: 11, color: selOwned ? "#4ade80" : "#64748b" }}>{selOwned ? "已點亮" : selUnlocked ? "可點亮" : "未解鎖"}</span>
              </div>
              <div style={{ fontSize: 12, color: "#cbd5e1", margin: "4px 0 8px", lineHeight: 1.5 }}>
                {selNode.weapon ? WEAPONS[selNode.weapon].desc : selNode.info || dsc}{!selNode.weapon && selNode.info && dsc ? `（${dsc}）` : ""}
              </div>
              {selBigBlocked ? (
                <div style={{ fontSize: 12, color: "#f43f5e", textAlign: "center", padding: "8px 0" }}>大型節點已達上限 {MAX_BIG}/{MAX_BIG}，需先取消其他大型節點</div>
              ) : (
                <button onClick={() => { const owned = (nodes[selNode.id] || 0) >= 1; if (owned) { if (isBig(selNode)) onBuy(selNode.id); } else if (selUnlocked && diamonds >= selNode.cost) onBuy(selNode.id); }}
                  disabled={(selOwned && !isBig(selNode)) || (!selOwned && (!selUnlocked || diamonds < selNode.cost))}
                  style={{
                    width: "100%", padding: "9px 0", borderRadius: 9, fontWeight: 700, fontSize: 13, fontFamily: MONO,
                    cursor: (selOwned && isBig(selNode)) || (!selOwned && selUnlocked && diamonds >= selNode.cost) ? "pointer" : "default",
                    border: `1px solid ${selOwned ? (isBig(selNode) ? "#f43f5e" : "#16a34a") : !selUnlocked ? "#1e293b" : diamonds >= selNode.cost ? "#22d3ee" : "#334155"}`,
                    background: selOwned ? (isBig(selNode) ? "rgba(244,63,94,0.15)" : "rgba(22,163,74,0.18)") : diamonds >= selNode.cost && selUnlocked ? "rgba(14,116,144,0.35)" : "rgba(15,23,42,0.6)",
                    color: selOwned ? (isBig(selNode) ? "#fca5a5" : "#4ade80") : !selUnlocked ? "#64748b" : diamonds >= selNode.cost ? "#a5f3fc" : "#64748b",
                  }}>
                  {selOwned ? (isBig(selNode) ? `取消並退還 💎 ${selNode.cost}` : "✓ 已點亮") : !selUnlocked ? "需先點亮前置節點" : `點亮  💎 ${selNode.cost.toLocaleString()}`}
                </button>
              )}
            </>
          );
        })()}
      </div>
      {(() => {
        const spent = spentDiamonds(nodes), fee = resetFee(spent), refund = spent - fee;
        return (
          <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            {spent <= 0 ? (
              <div style={{ fontSize: 11, color: "#475569", textAlign: "center" }}>尚未點亮任何節點，無需重置</div>
            ) : armed ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#fca5a5", flex: 1, lineHeight: 1.4 }}>確定重置？將清空所有節點，退還 💎{refund.toLocaleString()}（手續費 {fee}）</span>
                <button onClick={() => { setArmed(false); onReset && onReset(); }} style={{ ...rbtn, border: "1px solid #f43f5e", background: "rgba(244,63,94,0.18)", color: "#fca5a5" }}>確定</button>
                <button onClick={() => setArmed(false)} style={rbtn}>取消</button>
              </div>
            ) : (
              <button onClick={() => setArmed(true)} style={{ width: "100%", padding: "9px 0", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid #7f1d1d", background: "rgba(127,29,29,0.25)", color: "#fca5a5" }}>
                ↺ 重置技能地圖（退還 💎{refund.toLocaleString()}，手續費 {fee}）
              </button>
            )}
          </div>
        );
      })()}
      <p style={{ fontSize: 11, color: "#475569", marginTop: 10, lineHeight: 1.6 }}>
        三大區塊：攻擊(左)、防禦(右)、混合(下)。<span style={{ color: "#f43f5e" }}>詛咒節點</span>有負面代價但通往更強分支(永久不可取消)。
        <span style={{ color: "#fbbf24" }}>大型/終極節點</span>最多點亮 {MAX_BIG} 個，可取消退款重新配置。發光虛線圈代表「現在就能點亮」。
        重置可花鑽石手續費清空整棵樹（含詛咒）重練。
      </p>
    </div>
  );
}

const zbtn = { width: 30, height: 26, borderRadius: 7, border: "1px solid #334155", background: "rgba(15,23,42,0.7)", color: "#cbd5e1", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 };
const rbtn = { padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid #334155", background: "rgba(15,23,42,0.7)", color: "#cbd5e1", whiteSpace: "nowrap" };
