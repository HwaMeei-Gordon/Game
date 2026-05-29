// ── 動畫/渲染：畫布繪製 ──────────────────────────────────────
// 每幀把遊戲狀態 g 畫到 2D canvas。著重質感：漸層、外發光、AOE 光環，
// 不只靠粒子。座標系：世界座標 (0,0) 為塔，X/Y/L 函式做縮放與平移。
import { WORLD } from "../data/tuning.js";
import { drawShape } from "./shapes.js";
import { rangeOf } from "../engine/update.js";

export function draw(ctx, g, s, d, camera, weapons) {
  const { w, h, cx, cy, base } = d, z = camera.zoom, sc = base * z;
  const X = (wx) => cx + wx * sc, Y = (wy) => cy + wy * sc, L = (v) => v * sc;
  // 攻擊圈以「已啟用武器中最遠射程」為準
  let range = rangeOf(s);
  if (Array.isArray(weapons) && s.weapons) for (const wk of weapons) { const w = s.weapons[wk]; if (w && wk !== "flame" && w.range > range) range = w.range; }

  // 背景：深空漸層
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.75);
  bg.addColorStop(0, "#0a1426"); bg.addColorStop(0.55, "#070d18"); bg.addColorStop(1, "#04060c");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

  // 網格
  const R0 = WORLD.spawnR + 0.2, step = 0.4;
  const gline = (v, horiz) => {
    const axis = Math.abs(v) < 0.01;
    ctx.strokeStyle = axis ? "rgba(34,211,238,0.28)" : "rgba(56,189,248,0.06)";
    ctx.lineWidth = axis ? 1.4 : 1;
    ctx.beginPath();
    if (horiz) { ctx.moveTo(X(-R0), Y(v)); ctx.lineTo(X(R0), Y(v)); } else { ctx.moveTo(X(v), Y(-R0)); ctx.lineTo(X(v), Y(R0)); }
    ctx.stroke();
  };
  for (let gx = -R0; gx <= R0 + 0.001; gx += step) { if (X(gx) >= -2 && X(gx) <= w + 2) gline(gx, false); }
  for (let gy = -R0; gy <= R0 + 0.001; gy += step) { if (Y(gy) >= -2 && Y(gy) <= h + 2) gline(gy, true); }

  // 暈影
  const vg = ctx.createRadialGradient(cx, cy, L(0.3), cx, cy, L(R0));
  vg.addColorStop(0, "rgba(4,6,12,0)"); vg.addColorStop(0.75, "rgba(4,6,12,0.18)"); vg.addColorStop(1, "rgba(4,6,12,0.92)");
  ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);

  // 生成環
  ctx.strokeStyle = "rgba(244,63,94,0.14)"; ctx.setLineDash([4, 8]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(cx, cy, L(WORLD.spawnR), 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);

  // 射程指示：射程虛線圈；若火焰啟用，另外畫火焰範圍實心暈圈
  const has = (k) => Array.isArray(weapons) && weapons.includes(k);
  if (has("flame")) {
    const flr = L((s.weapons.flame && s.weapons.flame.flameRange) || WORLD.flameRange);
    const fgr = ctx.createRadialGradient(cx, cy, L(WORLD.tower), cx, cy, flr);
    fgr.addColorStop(0, "rgba(251,146,60,0.30)"); fgr.addColorStop(0.7, "rgba(249,115,22,0.12)"); fgr.addColorStop(1, "rgba(249,115,22,0)");
    ctx.fillStyle = fgr; ctx.beginPath(); ctx.arc(cx, cy, flr, 0, 6.2832); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(cx, cy, L(range), 0, 6.2832);
  ctx.strokeStyle = g.buffs?.frost > 0 ? "rgba(103,232,249,0.42)" : "rgba(34,211,238,0.18)";
  ctx.setLineDash([5, 8]); ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);

  // AOE / 命中光環（擴張淡出，讓範圍傷害看得見）
  for (const fx of g.fx) {
    const t = 1 - fx.life / fx.maxLife; // 0→1 擴張
    ctx.save(); ctx.globalAlpha = Math.max(0, fx.life / fx.maxLife) * 0.8;
    ctx.strokeStyle = fx.col; ctx.lineWidth = 2.5; ctx.shadowBlur = 12; ctx.shadowColor = fx.col;
    ctx.beginPath(); ctx.arc(X(fx.x), Y(fx.y), L(fx.r * (0.35 + t * 0.85)), 0, 6.2832); ctx.stroke(); ctx.restore();
  }

  // 粒子
  for (const p of g.particles) { ctx.globalAlpha = Math.max(0, p.life / (p.maxLife || 0.5)); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), L(p.r || 0.012), 0, 6.2832); ctx.fill(); }
  ctx.globalAlpha = 1;

  // 光束（雷射/折射）
  for (const bm of g.beams) {
    ctx.save(); ctx.globalAlpha = Math.min(1, bm.life / 0.1); ctx.strokeStyle = bm.col;
    ctx.shadowBlur = 10; ctx.shadowColor = bm.col; ctx.lineWidth = bm.wgt; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(X(bm.x1), Y(bm.y1)); ctx.lineTo(X(bm.x2), Y(bm.y2)); ctx.stroke(); ctx.restore();
  }

  // 子彈（光暈＋拖尾）
  for (const b of g.bullets) {
    ctx.save(); const c = b.type === "homing" ? "#fbbf24" : b.crit ? "#fff" : "#fde68a";
    ctx.globalAlpha = 0.35; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X(b.x - b.vx * 0.025), Y(b.y - b.vy * 0.025), L(0.012), 0, 6.2832); ctx.fill();
    ctx.globalAlpha = 1; ctx.shadowBlur = 8; ctx.shadowColor = c; ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), L(b.crit ? 0.02 : 0.016), 0, 6.2832); ctx.fill(); ctx.restore();
  }

  // 敵人（徑向漸層球體＋外發光＋高光）
  for (const e of g.enemies) {
    const ex = X(e.x), ey = Y(e.y), er = L(e.r);
    ctx.save(); ctx.shadowBlur = 14; ctx.shadowColor = e.col;
    const eg = ctx.createRadialGradient(ex - er * 0.3, ey - er * 0.3, er * 0.1, ex, ey, er);
    eg.addColorStop(0, "#ffffff"); eg.addColorStop(0.35, e.col); eg.addColorStop(1, shade(e.col, -0.35));
    ctx.fillStyle = eg; drawShape(ctx, e.shape, ex, ey, er, e.rot); ctx.fill(); ctx.restore();
    ctx.lineWidth = 1.4; ctx.strokeStyle = "rgba(255,255,255,0.5)"; drawShape(ctx, e.shape, ex, ey, er, e.rot); ctx.stroke();
    if (e.shield > 0) { ctx.strokeStyle = "rgba(125,211,252,0.9)"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(ex, ey, er + 5, -1.57, -1.57 + 6.2832 * (e.shield / e.maxShield)); ctx.stroke(); }
    if (e.hp < e.maxHp) {
      const bw = er * 2.2, by = ey - er - 7; ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(ex - bw / 2, by, bw, 3.5);
      ctx.fillStyle = e.type === "boss" ? "#f43f5e" : "#4ade80"; ctx.fillRect(ex - bw / 2, by, bw * Math.max(0, e.hp / e.maxHp), 3.5);
    }
  }

  // 軌道無人機
  if (s.orbs > 0) for (let o = 0; o < s.orbs; o++) {
    const a = g.orbAngle + o * 6.2832 / s.orbs, ox = X(Math.cos(a) * WORLD.orbR), oy = Y(Math.sin(a) * WORLD.orbR);
    ctx.save(); ctx.shadowBlur = 9; ctx.shadowColor = "#a5f3fc"; ctx.fillStyle = "#cffafe"; ctx.beginPath(); ctx.arc(ox, oy, L(0.022), 0, 6.2832); ctx.fill(); ctx.restore();
  }

  // 塔（旋轉護環 + 漸層核心 + 光暈 + 脈動）
  const TR = L(WORLD.tower);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(g.t * 0.5);
  ctx.strokeStyle = g.buffs?.over > 0 ? "rgba(251,191,36,0.55)" : "rgba(34,211,238,0.4)"; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.arc(0, 0, TR * 1.6, 0.4, 2.4); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, TR * 1.6, 3.5, 5.5); ctx.stroke(); ctx.restore();
  const pulse = 1 + Math.sin(g.t * 3) * 0.06;
  ctx.save(); ctx.shadowBlur = 22; ctx.shadowColor = g.buffs?.over > 0 ? "#fbbf24" : s.glass ? "#f43f5e" : "#22d3ee";
  const tg = ctx.createRadialGradient(cx, cy, 1, cx, cy, TR * pulse);
  tg.addColorStop(0, g.buffs?.over > 0 ? "#fde68a" : "#a5f3fc");
  tg.addColorStop(1, g.buffs?.over > 0 ? "#d97706" : s.glass ? "#b91c1c" : "#0891b2");
  ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(cx, cy, TR * pulse, 0, 6.2832); ctx.fill(); ctx.restore();
  ctx.strokeStyle = "#cffafe"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(cx, cy, TR, 0, 6.2832); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.beginPath(); ctx.arc(cx, cy, TR * 0.4, 0, 6.2832); ctx.fill();

  if (!g.waveActive && !g.gameOver) {
    ctx.fillStyle = "rgba(103,232,249,0.92)"; ctx.font = "700 13px 'Orbitron',monospace"; ctx.textAlign = "center";
    ctx.fillText(`第 ${g.wave + 1} 波來襲`, cx, cy - L(WORLD.spawnR) - 6);
  }
}

// 把 hex 顏色加深/變亮 amt（-1~1）。
function shade(hex, amt) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const f = (v) => Math.max(0, Math.min(255, Math.round(parseInt(v, 16) * (1 + amt))));
  return `rgb(${f(m[1])},${f(m[2])},${f(m[3])})`;
}
