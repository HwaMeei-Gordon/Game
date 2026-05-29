// ── 入口層：應用協調者 (orchestrator) ────────────────────────
// 持有所有遊戲 ref 與跨局存檔狀態、跑遊戲迴圈、切換畫面與彈窗。
// 真正的「機制/戰鬥/渲染」都委派給 engine/ 與 render/，畫面交給 components/。
import React, { useRef, useEffect, useState, useCallback } from "react";
import { DIFF } from "./data/difficulty.js";
import { WORLD, DEFAULT_ZOOM, ZOOM_MIN, ZOOM_MAX } from "./data/tuning.js";
import { createSkill, cloneSkill, ITEMS, globalItemCost, weaponItemCost } from "./data/skills.js";
import { ZERO_NODES, nodeById, isBig, countBig, isNodeUnlocked, MAX_BIG, unlockedWeapons, spentDiamonds, resetFee } from "./data/skillTree.js";
import { HEADSTART_OFFSET } from "./data/modes.js";
import { derive } from "./engine/stats.js";
import { legacyDecodeV3 } from "./engine/save.js";
import { createRun, cumulativeWaveGold } from "./engine/game.js";
import { stepGame, triggerAbility } from "./engine/update.js";
import { draw } from "./render/draw.js";
import * as audio from "./engine/audio.js";
import { FONT } from "./styles.js";

import Menu from "./components/Menu.jsx";
import GameScreen from "./components/GameScreen.jsx";
import Overlay from "./components/Overlay.jsx";
import StartOverlay from "./components/StartOverlay.jsx";
import SkillMap from "./components/SkillMap.jsx";
import StatsPanel from "./components/StatsPanel.jsx";
import EnemyPanel from "./components/EnemyPanel.jsx";
import CodesOverlay from "./components/CodesOverlay.jsx";
import Settings from "./components/Settings.jsx";

// 自動存檔：本機進度以 JSON 保存（對「新增節點」具前向相容，不會被清空）。
// 進度代碼（CodesOverlay）才用編碼字串，供換裝置/備份。
// bestKills（無限生存最佳擊殺）另存一支 key。
const META_KEY = "thetower_meta";
const OLD_V3_KEY = "thetower_save_v3"; // 舊版自動存檔字串，啟動時一次性遷移
const BESTKILLS_KEY = "thetower_bestkills";
function loadMeta() {
  let bestKills = 0;
  try { bestKills = parseInt(localStorage.getItem(BESTKILLS_KEY) || "0", 10) || 0; } catch {}
  // 1) 新版 JSON
  try {
    const j = JSON.parse(localStorage.getItem(META_KEY) || "null");
    if (j && typeof j.diamonds === "number") return { diamonds: j.diamonds, nodes: { ...ZERO_NODES, ...(j.nodes || {}) }, bestWave: j.bestWave || 1, bestKills };
  } catch {}
  // 2) 從舊版 v3 字串遷移（保留鑽石/節點/最佳波次）
  try {
    const r = legacyDecodeV3(localStorage.getItem(OLD_V3_KEY));
    if (r) return { diamonds: r.diamonds, nodes: { ...ZERO_NODES, ...r.nodes }, bestWave: r.bestWave, bestKills };
  } catch {}
  return { diamonds: 0, nodes: { ...ZERO_NODES }, bestWave: 1, bestKills };
}

export default function App() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const game = useRef(null);
  const dims = useRef({ w: 360, h: 320, cx: 180, cy: 160, base: 90, dpr: 1 });
  const cam = useRef({ zoom: DEFAULT_ZOOM });
  const statsRef = useRef(derive(ZERO_NODES, createSkill()));
  const weaponsRef = useRef(["cannon"]); // 目前已啟用、同時開火的武器
  const lastDia = useRef(0);
  const wasOver = useRef(false);

  const metaRef = useRef(loadMeta());
  const [metaV, setMetaV] = useState(metaRef.current);
  const commitMeta = useCallback(() => setMetaV({ diamonds: metaRef.current.diamonds, nodes: { ...metaRef.current.nodes }, bestWave: metaRef.current.bestWave, bestKills: metaRef.current.bestKills || 0 }), []);
  // 進度每次變動就自動寫回本機（涵蓋升級、買節點、讀代碼、過波/死亡結算）。
  useEffect(() => { try { localStorage.setItem(META_KEY, JSON.stringify({ diamonds: metaV.diamonds, nodes: metaV.nodes, bestWave: metaV.bestWave })); } catch {} }, [metaV]);
  useEffect(() => { try { localStorage.setItem(BESTKILLS_KEY, String(metaV.bestKills || 0)); } catch {} }, [metaV.bestKills]);

  const skillRef = useRef(createSkill());
  const [skillV, setSkillV] = useState(skillRef.current);

  const [screen, setScreen] = useState("menu");
  const [overlay, setOverlay] = useState(null);
  const [upTab, setUpTab] = useState("global"); // 升級加點的對象：global 或某武器
  const [hud, setHud] = useState({ gold: 0, wave: 1, hp: 100, maxHp: 100, gameOver: false, diff: "normal", mode: "classic", timeLeft: 0, kills: 0 });
  const [cds, setCds] = useState({ over: 0, nova: 0, frost: 0, repair: 0 });
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused || overlay != null; }, [paused, overlay]);
  useEffect(() => { weaponsRef.current = unlockedWeapons(metaV.nodes); }, [metaV.nodes]);

  // 倍速（1x / 2x / 4x）：以多次模擬子步驟達成，物理穩定。
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(1);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  const cycleSpeed = () => setSpeed((v) => (v === 1 ? 2 : v === 2 ? 4 : 1));

  // 音訊：分開的音樂/音效開關（持久化於 audio 模組）。
  const [sfxOn, setSfxOn] = useState(audio.getSfx());
  const [bgmOn, setBgmOn] = useState(audio.getBgm());
  const toggleSfx = () => { const v = !sfxOn; setSfxOn(v); audio.setSfx(v); };
  const toggleBgm = () => { const v = !bgmOn; setBgmOn(v); audio.setBgm(v); };
  // 行動裝置需在首次手勢後才能發聲：第一次點擊就解鎖音訊並（若開啟）播放音樂。
  useEffect(() => {
    const unlock = () => { audio.resume(); window.removeEventListener("pointerdown", unlock); };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  const recompute = () => { statsRef.current = derive(metaRef.current.nodes, skillRef.current); };
  function syncHp() { const g = game.current; if (!g) return; const nm = statsRef.current.maxHp, d = nm - g.maxHp; g.maxHp = nm; g.hp = Math.min(nm, g.hp + Math.max(0, d)); }

  const io = useRef({
    addDiamonds: (n) => { metaRef.current.diamonds += n; },
    reportWave: (n) => { metaRef.current.bestWave = Math.max(metaRef.current.bestWave, n); },
    reportSurvival: (k) => { metaRef.current.bestKills = Math.max(metaRef.current.bestKills || 0, k); },
  });

  const newRun = useCallback((diffKey, mode = "classic") => {
    skillRef.current = createSkill(); recompute();
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

  // 升級加點：target 為 "global" 或某武器 key。
  const buyUpgrade = useCallback((target, key) => {
    const g = game.current; if (!g) return; const def = ITEMS[key]; const sk = skillRef.current;
    if (target === "global") {
      const lvl = sk.global[key] || 0;
      if (def.cap && lvl >= def.cap) return;
      const c = globalItemCost(sk, key); if (g.gold < c) return;
      g.gold -= c; sk.global[key] = lvl + 1;
    } else {
      const w = sk.weapons[target]; if (!w) return;
      const lvl = w[key] || 0;
      if (def.cap && lvl >= def.cap) return;
      const c = weaponItemCost(sk, key); if (g.gold < c) return;
      g.gold -= c; w[key] = lvl + 1;
    }
    recompute(); syncHp(); setSkillV(cloneSkill(sk)); audio.play("upgrade");
  }, []);

  const buyNode = useCallback((id) => {
    const def = nodeById[id], nd = metaRef.current.nodes, owned = (nd[id] || 0) >= 1;
    if (owned) { if (isBig(def)) { nd[id] = 0; metaRef.current.diamonds += def.cost; audio.play("buy"); commitMeta(); } return; }
    if (!isNodeUnlocked(def, nd)) return;
    if (isBig(def) && countBig(nd) >= MAX_BIG) return;
    if (metaRef.current.diamonds < def.cost) return;
    metaRef.current.diamonds -= def.cost; nd[id] = 1; audio.play("buy"); commitMeta();
  }, [commitMeta]);

  // 重置技能地圖：退還已花費鑽石，扣除手續費，清空所有節點（含詛咒）。
  const resetTree = useCallback(() => {
    const spent = spentDiamonds(metaRef.current.nodes);
    if (spent <= 0) return;
    metaRef.current.diamonds += spent - resetFee(spent);
    metaRef.current.nodes = { ...ZERO_NODES };
    audio.play("buy"); commitMeta();
  }, [commitMeta]);

  const useAbility = useCallback((k) => {
    const g = game.current; if (!g || pausedRef.current) return;
    if (triggerAbility(g, statsRef.current, k)) { setCds({ ...g.cds }); audio.play("ability"); }
  }, []);

  const startGame = (dk, mode = "classic") => { newRun(dk, mode); setOverlay(null); setPaused(false); setSpeed(1); setUpTab("global"); setScreen("playing"); };
  const toMenu = () => { setScreen("menu"); setOverlay(null); };
  const restart = () => { newRun(game.current.diffKey, game.current.mode); setPaused(false); setUpTab("global"); };

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
      if (!pausedRef.current && !g.gameOver) { const steps = speedRef.current; for (let i = 0; i < steps; i++) stepGame(g, s, dt, weaponsRef.current, io.current); }
      // 播放本幀累積的音效（限量避免一次太多）。
      if (g.sounds && g.sounds.length) { const n = Math.min(g.sounds.length, 4); for (let i = 0; i < n; i++) audio.play(g.sounds[i]); g.sounds.length = 0; }
      draw(ctx, g, s, dims.current, cam.current, weaponsRef.current);
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
  const panelSkill = inGame ? skillV : createSkill();
  const panelDamage = inGame ? statsRef.current.damage : derive(metaV.nodes, createSkill()).damage;

  return (
    <div style={{ height: "100dvh", width: "100%", maxWidth: 480, margin: "0 auto", background: "#04060a", color: "#e2e8f0", display: "flex", flexDirection: "column", fontFamily: FONT, overflow: "hidden", userSelect: "none", WebkitUserSelect: "none", position: "relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=Rajdhani:wght@500;600;700&family=Noto+Sans+TC:wght@500;700&display=swap');*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}button{font-family:inherit}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:3px}`}</style>

      {screen === "menu" ? (
        <Menu metaV={metaV} onStart={() => setOverlay("start")} onPerm={() => setOverlay("perm")} onStats={() => setOverlay("stats")} onDex={() => setOverlay("dex")} onCodes={() => setOverlay("codes")} onSettings={() => setOverlay("settings")} />
      ) : (
        <GameScreen
          wrapRef={wrapRef} canvasRef={canvasRef} hud={hud} diamonds={metaV.diamonds} bestKills={metaV.bestKills} paused={paused}
          onMenu={toMenu} onPause={() => setPaused((p) => !p)} onOpenStats={() => setOverlay("stats")} onOpenDex={() => setOverlay("dex")} onOpenSettings={() => setOverlay("settings")} onRestart={restart}
          unlocked={uw} upTab={upTab} setUpTab={setUpTab} skill={skillV} onBuyUpgrade={buyUpgrade}
          speed={speed} onCycleSpeed={cycleSpeed}
          cds={cds} onUseAbility={useAbility}
        />
      )}

      {overlay === "start" && (
        <StartOverlay bestWave={metaV.bestWave} bestKills={metaV.bestKills} onStart={startGame} onClose={() => setOverlay(null)} />
      )}
      {overlay === "perm" && (
        <Overlay title="技能地圖 · 💎鑽石" onClose={() => setOverlay(null)} extra={<span style={{ color: "#67e8f9", fontWeight: 700 }}>💎 {metaV.diamonds.toLocaleString()}</span>}>
          <SkillMap nodes={metaV.nodes} diamonds={metaV.diamonds} onBuy={buyNode} onReset={resetTree} />
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
      {overlay === "settings" && <Settings sfxOn={sfxOn} bgmOn={bgmOn} onToggleSfx={toggleSfx} onToggleBgm={toggleBgm} onClose={() => setOverlay(null)} />}
    </div>
  );
}
