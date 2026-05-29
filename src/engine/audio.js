// ── 動畫/音訊：8-bit 音效與背景音樂 ──────────────────────────
// 用 Web Audio API 即時合成 chiptune，零外部檔案、可離線、輕量。
// 行動裝置需在使用者手勢後才能發聲，故 resume() 要在第一次互動時呼叫。
let ctx = null, master = null;
let sfxOn = true, bgmOn = true, unlocked = false;
let bgmTimer = null, bgmStep = 0;

const SFX_KEY = "thetower_sfx", BGM_KEY = "thetower_bgm";
try { sfxOn = localStorage.getItem(SFX_KEY) !== "0"; bgmOn = localStorage.getItem(BGM_KEY) !== "0"; } catch {}

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
  }
  return ctx;
}

// 一個短促的方波音符（含淡入淡出）。
function blip(freq, dur, type = "square", vol = 0.3, when = 0, dest = null) {
  const c = ensure(); if (!c) return;
  const t = c.currentTime + when;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || master);
  o.start(t); o.stop(t + dur + 0.02);
}

const SFX = {
  shoot:    () => blip(880, 0.04, "square", 0.12),
  kill:     () => { blip(523, 0.07, "square", 0.22); blip(784, 0.06, "square", 0.18, 0.04); },
  bosskill: () => { blip(196, 0.16, "sawtooth", 0.3); blip(330, 0.14, "square", 0.24, 0.08); blip(523, 0.18, "square", 0.22, 0.16); },
  hurt:     () => blip(150, 0.14, "sawtooth", 0.32),
  upgrade:  () => { blip(523, 0.06, "square", 0.24); blip(784, 0.09, "square", 0.2, 0.05); },
  buy:      () => { blip(659, 0.06, "square", 0.24); blip(988, 0.1, "square", 0.2, 0.06); },
  ability:  () => { blip(330, 0.05, "square", 0.24); blip(495, 0.05, "square", 0.22, 0.04); blip(740, 0.1, "square", 0.2, 0.08); },
  wave:     () => { blip(392, 0.1, "triangle", 0.24); blip(587, 0.13, "triangle", 0.2, 0.09); },
  boss:     () => { blip(98, 0.26, "sawtooth", 0.32); blip(98, 0.26, "sawtooth", 0.26, 0.2); },
  gameover: () => { blip(330, 0.18, "square", 0.3); blip(247, 0.18, "square", 0.27, 0.16); blip(165, 0.32, "square", 0.25, 0.32); },
  click:    () => blip(660, 0.04, "square", 0.16),
};

export function play(name) { if (!sfxOn || !unlocked) return; const f = SFX[name]; if (f) try { f(); } catch {} }

// ── 背景音樂：16 步循環的 chiptune（旋律 + 低音）──
const MEL  = [523, 659, 784, 659, 587, 659, 784, 988, 880, 784, 659, 587, 523, 587, 659, 784];
const BASS = [131, 0, 196, 0, 165, 0, 196, 0, 147, 0, 175, 0, 131, 0, 196, 0];
const STEP_MS = 150;

function bgmTick() {
  if (!bgmOn || !unlocked) return;
  const m = MEL[bgmStep % 16], b = BASS[bgmStep % 16];
  if (m) blip(m, 0.13, "square", 0.1);
  if (b) blip(b, 0.17, "triangle", 0.16);
  bgmStep++;
}
function startBgm() { if (bgmTimer || !unlocked) return; bgmStep = 0; bgmTimer = setInterval(bgmTick, STEP_MS); }
function stopBgm() { if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } }

export function resume() {
  ensure();
  if (ctx && ctx.state === "suspended") ctx.resume();
  unlocked = true;
  if (bgmOn) startBgm();
}
export function setSfx(on) { sfxOn = on; try { localStorage.setItem(SFX_KEY, on ? "1" : "0"); } catch {} if (on) play("click"); }
export function setBgm(on) { bgmOn = on; try { localStorage.setItem(BGM_KEY, on ? "1" : "0"); } catch {} if (on) startBgm(); else stopBgm(); }
export function getSfx() { return sfxOn; }
export function getBgm() { return bgmOn; }
