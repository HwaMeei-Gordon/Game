// ── 紀錄/畫面：進度代碼存讀 ──────────────────────────────────
import React, { useState } from "react";
import Overlay from "./Overlay.jsx";
import { miniBtn, MONO } from "../styles.js";
import { encodeSave, decodeSave } from "../engine/save.js";

export default function CodesOverlay({ metaRef, commitMeta, metaV, onClose }) {
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState(null);
  const current = encodeSave(metaV);

  const copy = async () => {
    try { await navigator.clipboard.writeText(current); setMsg({ t: "ok", m: "已複製到剪貼簿" }); }
    catch { setMsg({ t: "ok", m: "請長按上方代碼手動複製" }); }
  };
  const load = () => {
    const r = decodeSave(input);
    if (!r) { setMsg({ t: "err", m: "代碼無效（格式或校驗失敗）" }); return; }
    const m = metaRef.current;
    m.diamonds = r.diamonds; m.bestWave = r.bestWave; m.bestKills = r.bestKills || m.bestKills || 0;
    m.nodes = r.nodes || {}; m.weaponsOwned = r.weaponsOwned || {}; m.weaponBase = r.weaponBase || {};
    m.relicsOwned = r.relicsOwned || {}; m.relicEquipped = r.relicEquipped || null;
    commitMeta(); setMsg({ t: "ok", m: `讀取成功 · 💎${r.diamonds} · 最佳第${r.bestWave}波` });
  };

  return (
    <Overlay title="進度代碼" onClose={onClose}>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>你目前的進度代碼</div>
      <div onClick={copy} style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 1, color: "#67e8f9", background: "#0b1220", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 14px", textAlign: "center", cursor: "pointer", wordBreak: "break-all", userSelect: "all", WebkitUserSelect: "all" }}>{current}</div>
      <button onClick={copy} style={{ ...miniBtn, width: "100%", marginTop: 8, padding: "10px 0", background: "#0e7490", color: "#ecfeff", border: "1px solid #22d3ee" }}>複製代碼</button>
      <div style={{ height: 1, background: "#1e293b", margin: "18px 0" }} />
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>貼上代碼以還原進度</div>
      <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="貼上代碼…" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, background: "#0b1220", border: "1px solid #334155", color: "#e2e8f0", fontSize: 13, fontFamily: MONO, letterSpacing: 1, outline: "none", textTransform: "uppercase" }} />
      <button onClick={load} style={{ ...miniBtn, width: "100%", marginTop: 8, padding: "10px 0", background: "rgba(14,116,144,0.3)", color: "#a5f3fc", border: "1px solid #0e7490" }}>讀取代碼</button>
      {msg && <div style={{ marginTop: 12, fontSize: 13, textAlign: "center", color: msg.t === "ok" ? "#4ade80" : "#f87171" }}>{msg.m}</div>}
      <p style={{ fontSize: 11, color: "#475569", marginTop: 14, lineHeight: 1.6 }}>代碼記錄鑽石、技能地圖所有節點與最佳波次，含校驗碼。讀取會覆蓋目前進度，竄改後失效。</p>
    </Overlay>
  );
}
