// ── 入口層：應用協調者 (orchestrator) ────────────────────────
// 持有所有遊戲 ref 與跨局存檔狀態、跑遊戲迴圈、切換畫面與彈窗。
// 真正的「機制/戰鬥/渲染」都委派給 engine/ 與 render/，畫面交給 components/。
import React, { useRef, useEffect, useState, useCallback } from "react";
import { DIFF } from "./data/difficulty.js";
import { WORLD, DEFAULT_ZOOM, ZOOM_MIN, ZOOM_MAX } from "./data/tuning.js";
import { DEFAULT_WEAPON } from "./data/weapons.js";
import { ZERO_SKILL, findSkill, skillCost } from "./data/skills.js";
import { ZERO_NODES, nodeById, isBig, countBig, isNodeUnlocked, MAX_BIG, unlockedWeapons } from "./data/skillTree.js";
import { HEADSTART_OFFSET } from "./data/modes.js";
import { derive } from "./engine/stats.js";
import { encodeSave, decodeSave } from "./engine/save.js";
import { createRun, cumulativeWaveGold } from "./engine/game.js";
import { stepGame, triggerAbility } from "./engine/update.js";
import { draw } from "./render/draw.js";
import { FONT } from "./styles.js";

import Menu from "./components/Menu.jsx";
import GameScreen from "./components/GameScreen.jsx";
import Overlay from "./components/Overlay.jsx";
import StartOverlay from "./components/StartOverlay.jsx";
import SkillMap from "./components/SkillMap.jsx";
import StatsPanel from "./components/StatsPanel.jsx";
import EnemyPanel from "./components/EnemyPanel.jsx";
import CodesOverlay from "./components/CodesOverlay.jsx";

// 自動存檔：把進度寫進這支手機/瀏覽器的 localStorage（同裝置關掉重開都還在）。
// 進度代碼則用於換裝置/備份。鍵名含版本，存檔格式改變時不會誤讀舊資料。
// bestKills（無限生存最佳擊殺）另存一支 key，不放進可攜的進度代碼。
const SAVE_KEY = "thetower_save_v3";
const BESTKILLS_KEY = "thetower_bestkills";
function loadMeta() {
  let bestKills = 0;
  try { bestKills = parseInt(localStorage.getItem(BESTKILLS_KEY) || "0", 10) || 0; } catch {}
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) { const r = decodeSave(raw); if (r) return { diamonds: r.diamonds, nodes: { ...ZERO_NODES, ...r.nodes }, bestWave: r.bestWave, bestKills }; }
  } catch {}
  return { diamonds: 0, nodes: { ...ZERO_NODES }, bestWave: 1, bestKills };
}

export default function App() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const game = useRef(null);
  const dims = useRef({ w: 360, h: 320, cx: 180, cy: 160, base: 90, dpr: 1 });
  const cam = useRef({ zoom: DEFAULT_ZOOM });
  const statsRef = useRef(derive(ZERO_NODES, ZERO_SKILL));
  const weaponRef = useRef(DEFAULT_WEAPON);
  const lastDia = useRef(0);
  const wasOver = useRef(false);

  const metaRef = useRef(loadMeta());
  const [metaV, setMetaV] = useState(metaRef.current);
  const commitMeta = useCallback(() => setMetaV({ diamonds: metaRef.current.diamonds, nodes: { ...metaRef.current.nodes }, bestWave: metaRef.current.bestWave, bestKills: metaRef.current.bestKills || 0 }), []);
  // 進度每次變動就自動寫回本機（涵蓋升級、買節點、讀代碼、過波/死亡結算）。
  useEffect(() => { try { localStorage.setItem(SAVE_KEY, encodeSave(metaV.diamonds, metaV.nodes, metaV.bestWave)); } catch {} }, [metaV]);
  useEffect(() => { try { localStorage.setItem(BESTKILLS_KEY, String(metaV.bestKills || 0)); } catch {} }, [metaV.bestKills]);

  const skillRef = useRef({ ...ZERO_SKILL });
  const [skillV, setSkillV] = useState(skillRef.current);

  const [screen, setScreen] = useState("menu");
  const [overlay, setOverlay] = useState(null);
  const [skillCat, setSkillCat] = useState("attack");
  const [weapon, setWeapon] = useState(DEFAULT_WEAPON);
  const [hud, setHud] = useState({ gold: 0, wave: 1, hp: 100, maxHp: 100, gameOver: false, diff: "normal", mode: "classic", timeLeft: 0, kills: 0 });
  const [cds, setCds] = useState({ over: 0, nova: 0, frost: 0, repair: 0 });
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused || overlay != null; }, [paused, overlay]);
  useEffect(() => { weaponRef.current = weapon; }, [weapon]);

  const recompute = () => { statsRef.current = derive(metaRef.current.nodes, skillRef.current); };
  function syncHp() { const g = game.current; if (!g) return; const nm = statsRef.current.maxHp, d = nm - g.maxHp; g.maxHp = nm; g.hp = Math.min(nm, g.hp + Math.max(0, d)); }

  const io = useRef({
    addDiamonds: (n) => { metaRef.current.diamonds += n; },
    reportWave: (n) => { metaRef.current.bestWave = Math.max(metaRef.current.bestWave, n); },
    reportSurvival: (k) => { metaRef.current.bestKills = Math.max(metaRef.current.bestKills || 0, k); },
  });

  const newRun = useCallback((diffKey, mode = "classic") => {
    skillRef.current = { ...ZERO_SKILL }; recompute();
    const best = metaRef.current.bestWave;
    const opts = { mode };
    if (mode === "headstart") {
      const sw = Math.max(1, best - HEADSTART_OFFSET);
      opts.startWave = sw;
      opts.startGold = cumulativeWaveGold(sw, DIFF[diffKey]);
    } else if (mode === "survival") {
      opts.survivalStrength = Math.max(1, best);
    }
    game.current = createRun(diffKey, statsRef.current, opts);
    cam.current.zoom = DEFAULT_ZOOM;
    lastDia.current = metaRef.current.diamonds; wasOver.current = false;
    setSkillV({ ...skillRef.current });
  }, []);

  const buySkill = useCallback((k) => {
    const g = game.current; if (!g) return; const def = findSkill(k);
    setSkillV(() => {
      if (def.cap && skillRef.current[k] >= def.cap) return { ...skillRef.current };
      const c = skillCost(def, skillRef.current[k]); if (g.gold < c) return { ...skillRef.current };
      g.gold -= c; skillRef.current[k] += 1; recompute(); syncHp(); return { ...skillRef.current };
    });
  }, []);

  const buyNode = useCallback((id) => {
    const def = nodeById[id];
    setMetaV(() => {
      const nd = metaRef.current.nodes, owned = (nd[id] || 0) >= 1;
      if (owned) { if (isBig(def)) { nd[id] = 0; metaRef.current.diamonds += def.cost; } return snap(); }
      if (!isNodeUnlocked(def, nd)) return snap();
      if (isBig(def) && countBig(nd) >= MAX_BIG) return snap();
      if (metaRef.current.diamonds < def.cost) return snap();
      metaRef.current.diamonds -= def.cost; nd[id] = 1; return snap();
    });
    function snap() { return { diamonds: metaRef.current.diamonds, nodes: { ...metaRef.current.nodes }, bestWave: metaRef.current.bestWave, bestKills: metaRef.current.bestKills || 0 }; }
  }, []);

  const useAbility = useCallback((k) => {
    const g = game.current; if (!g || pausedRef.current) return;
    if (triggerAbility(g, statsRef.current, k)) setCds({ ...g.cds });
  }, []);

  const startGame = (dk, mode = "classic") => { newRun(dk, mode); setWeapon(DEFAULT_WEAPON); setOverlay(null); setPaused(false); setSkillCat("attack"); setScreen("playing"); };
  const toMenu = () => { setScreen("menu"); setOverlay(null); };
  const restart = () => { newRun(game.current.diffKey, game.current.mode); setWeapon(DEFAULT_WEAPON); setPaused(false); setSkillCat("attack"); };

  // 量測畫布尺寸（含 DPR）
  useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current, cv = canvasRef.current; if (!wrap || !cv) return;
      const r = wrap.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = Math.max(160, r.width), h = Math.max(160, r.height);
      cv.width = w * dpr; cv.height = h * dpr; cv.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
      dims.current = { w, h, cx: w / 2, cy: h / 2, base: Math.min(w, h) / 2 / WORLD.viewDiv, dpr };
    };
    measure();
    let ro; if (wrapRef.current) { ro = new ResizeObserver(measure); ro.observe(wrapRef.current); }
    window.addEventListener("resize", measure);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [screen]);

  // 戰鬥畫布雙指縮放
  useEffect(() => {
    if (screen !== "playing") return;
    const cv = canvasRef.current; let pinchD = 0, startZoom = 1;
    const d2 = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const ts = (e) => { if (e.touches.length === 2) { pinchD = d2(e.touches); startZoom = cam.current.zoom; } };
    const tm = (e) => { if (e.touches.length === 2 && pinchD) { e.preventDefault(); cam.current.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, startZoom * d2(e.touches) / pinchD)); } };
    const te = (e) => { if (e.touches.length < 2) pinchD = 0; };
    cv.addEventListener("touchstart", ts, { passive: false });
    cv.addEventListener("touchmove", tm, { passive: false });
    cv.addEventListener("touchend", te);
    return () => { cv.removeEventListener("touchstart", ts); cv.removeEventListener("touchmove", tm); cv.removeEventListener("touchend", te); };
  }, [screen]);

  // 遊戲主迴圈
  useEffect(() => {
    if (screen !== "playing") return;
    const ctx = canvasRef.current.getContext("2d");
    let raf, last = performance.now(), acc = 0;
    const loop = (now) => {
      let dt = (now - last) / 1000; last = now; if (dt > 0.05) dt = 0.05;
      const g = game.current, s = statsRef.current;
      if (!pausedRef.current && !g.gameOver) stepGame(g, s, dt, weaponRef.current, io.current);
      draw(ctx, g, s, dims.current, cam.current, weaponRef.current);
      acc += dt;
      if (acc > 0.08) {
        acc = 0;
        setHud({ gold: Math.floor(g.gold), wave: g.wave, hp: Math.ceil(g.hp), maxHp: Math.round(g.maxHp), gameOver: g.gameOver, diff: g.diffKey, mode: g.mode, timeLeft: g.survivalTime, kills: g.kills });
        setCds({ ...g.cds });
        if (metaRef.current.diamonds !== lastDia.current) { lastDia.current = metaRef.current.diamonds; commitMeta(); }
        if (g.gameOver && !wasOver.current) { wasOver.current = true; commitMeta(); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [screen, commitMeta]);

  const uw = unlockedWeapons(metaV.nodes);
  const inGame = screen === "playing";
  const panelSkill = inGame ? skillV : ZERO_SKILL;
  const panelDamage = inGame ? statsRef.current.damage : derive(metaV.nodes, ZERO_SKILL).damage;

  return (
    <div style={{ height: "100dvh", width: "100%", maxWidth: 480, margin: "0 auto", background: "#04060a", color: "#e2e8f0", display: "flex", flexDirection: "column", fontFamily: FONT, overflow: "hidden", userSelect: "none", WebkitUserSelect: "none", position: "relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=Rajdhani:wght@500;600;700&family=Noto+Sans+TC:wght@500;700&display=swap');*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}button{font-family:inherit}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:3px}`}</style>

      {screen === "menu" ? (
        <Menu metaV={metaV} onStart={() => setOverlay("start")} onPerm={() => setOverlay("perm")} onStats={() => setOverlay("stats")} onDex={() => setOverlay("dex")} onCodes={() => setOverlay("codes")} />
      ) : (
        <GameScreen
          wrapRef={wrapRef} canvasRef={canvasRef} hud={hud} diamonds={metaV.diamonds} bestKills={metaV.bestKills} paused={paused}
          onMenu={toMenu} onPause={() => setPaused((p) => !p)} onOpenStats={() => setOverlay("stats")} onOpenDex={() => setOverlay("dex")} onRestart={restart}
          unlockedWeapons={uw} weapon={weapon} setWeapon={setWeapon}
          cds={cds} onUseAbility={useAbility}
          skillCat={skillCat} setSkillCat={setSkillCat} skillV={skillV} onBuySkill={buySkill}
        />
      )}

      {overlay === "start" && (
        <StartOverlay bestWave={metaV.bestWave} bestKills={metaV.bestKills} onStart={startGame} onClose={() => setOverlay(null)} />
      )}
      {overlay === "perm" && (
        <Overlay title="技能地圖 · 💎鑽石" onClose={() => setOverlay(null)} extra={<span style={{ color: "#67e8f9", fontWeight: 700 }}>💎 {metaV.diamonds.toLocaleString()}</span>}>
          <SkillMap nodes={metaV.nodes} diamonds={metaV.diamonds} onBuy={buyNode} />
        </Overlay>
      )}
      {overlay === "stats" && (
        <Overlay title="數值面板" onClose={() => setOverlay(null)}>
          <StatsPanel nodes={metaV.nodes} skill={panelSkill} />
        </Overlay>
      )}
      {overlay === "dex" && (
        <Overlay title="敵人圖鑑 / 波次數值" onClose={() => setOverlay(null)}>
          <EnemyPanel initialWave={inGame ? hud.wave : 1} initialDiff={inGame ? hud.diff : "normal"} playerDamage={panelDamage} />
        </Overlay>
      )}
      {overlay === "codes" && <CodesOverlay metaRef={metaRef} commitMeta={commitMeta} metaV={metaV} onClose={() => setOverlay(null)} />}
    </div>
  );
}
