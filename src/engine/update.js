// ── 機制：每幀模擬更新 ───────────────────────────────────────
// 一個 tick 內的所有遊戲邏輯：生成、移動、開火、子彈、碰撞、波次推進。
// 全部對傳入的 g（遊戲狀態）做就地修改；渲染與 React 都在外層。
import { CFG, WORLD } from "../data/tuning.js";
import { WEAPONS } from "../data/weapons.js";
import { ABILITIES } from "../data/skills.js";
import { SURVIVAL_SECONDS } from "../data/modes.js";
import { CRIT_MULT } from "./stats.js";
import { spawnEnemy, startWave, killEnemy, burst, ringFx, floatText, tagDmg, addShake, damageEnemy, mitigate, mitigateDot, chainHit } from "./game.js";

export function rangeOf(s) {
  return Math.min(WORLD.rangeMax, WORLD.rangeBase + s.rangeBonus * WORLD.rangeStep) + (s.rangeFlat || 0);
}

// weapons：目前已啟用、會同時開火的武器 key 陣列。
// io：{ addDiamonds(n), reportWave(n) } — 把跨局的鑽石/最佳波次回報給外層。
export function stepGame(g, s, dt, weapons, io) {
  if (g.gameOver) return;
  g.t += dt;

  for (const kk in g.cds) if (g.cds[kk] > 0) g.cds[kk] = Math.max(0, g.cds[kk] - dt);
  if (g.buffs.over > 0) g.buffs.over -= dt;
  if (g.buffs.frost > 0) g.buffs.frost -= dt;

  // 生成 / 波次節奏（依模式）
  if (g.mode === "survival") {
    // 無限生存：以固定強度持續猛攻，並隨時間越來越密集；時間到即結束。
    g.survivalTime -= dt; g.spawnTimer -= dt; g.bossTimer -= dt;
    if (g.spawnTimer <= 0) {
      const elapsed = SURVIVAL_SECONDS - g.survivalTime;
      if (g.bossTimer <= 0) { spawnEnemy(g, "boss"); g.bossTimer = 20; g.sounds.push("boss"); addShake(g, 9); }
      else spawnEnemy(g, null);
      g.spawnTimer = Math.max(0.12, 0.55 - elapsed * 0.0012);
    }
    if (g.survivalTime <= 0) { g.survivalTime = 0; endRun(g, s, io); }
  } else {
    if (g.waveActive && g.spawnQueue > 0) {
      g.spawnTimer -= dt;
      if (g.spawnTimer <= 0) {
        const boss = g.spawnQueue === 1 && g.wave % 5 === 0;
        spawnEnemy(g, boss ? "boss" : null);
        if (boss) { g.sounds.push("boss"); addShake(g, 9); }
        g.spawnQueue--;
        g.spawnTimer = Math.max(0.16, 0.65 - g.wave * 0.01);
      }
    }
    if (g.waveActive && g.spawnQueue === 0 && g.enemies.length === 0) {
      g.waveActive = false; g.cooldown = 1.4; g.sounds.push("wave");
      io.reportWave(g.wave);
      g.gold += Math.floor((CFG.waveGoldBase + g.wave * CFG.waveGoldSlope) * g.diff.gold * s.goldMult);
      if (g.wave % 5 === 0) { const gem = Math.floor(6 * g.diff.gem * s.gemYield); io.addDiamonds(gem); g.runGems += gem; }
    }
    if (!g.waveActive) { g.cooldown -= dt; if (g.cooldown <= 0) startWave(g, g.wave + 1); }
  }

  // 敵人移動 / 荊棘 / 撞塔
  const frost = g.buffs.frost > 0 ? 0.35 : 1;
  const spdScale = Math.min(CFG.spdScaleCap, Math.pow(CFG.spdScaleBase, g.wave - 1));
  for (let i = g.enemies.length - 1; i >= 0; i--) {
    const e = g.enemies[i], dist = Math.hypot(e.x, e.y) || 1, rim = WORLD.tower + e.r;
    e.rot += dt * 1.4;
    if (e.maxShield > 0 && e.shield < e.maxShield) e.shield = Math.min(e.maxShield, e.shield + e.maxShield * 0.04 * dt);
    if (e.eliteRegen) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.02 * dt); // 再生菁英
    // 冰霜（全域）+ 火焰減速（個別、短時）
    const slow = frost * (e.slowUntil > g.t ? (1 - (e.slowF || 0)) : 1);
    if (e.move === "kite") {
      // 射手：逼近到 shootRange 後停下，朝塔連續射擊
      if (dist > WORLD.shootRange) { const v = e.sr * spdScale * slow; e.x -= (e.x / dist) * v * dt; e.y -= (e.y / dist) * v * dt; }
      e.shootCd = (e.shootCd == null ? 1.2 : e.shootCd) - dt * slow;
      if (e.shootCd <= 0 && dist <= WORLD.shootRange + 0.4) {
        e.shootCd = 1.6;
        const a = Math.atan2(-e.y, -e.x);
        g.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * WORLD.eBulletSpd, vy: Math.sin(a) * WORLD.eBulletSpd, dmg: e.atk, life: 7 });
      }
    } else if (dist > rim) {
      if (e.move === "weave") {
        const inward = e.sr * spdScale * slow, ang = Math.atan2(e.y, e.x);
        const ndist = dist - inward * dt, na = ang + e.weaveDir * (e.sr * 1.5 / Math.max(dist, 0.15)) * dt;
        e.x = Math.cos(na) * ndist; e.y = Math.sin(na) * ndist;
      } else if (e.move === "dash") {
        const burstF = Math.sin(e.dashT * 2.6) > 0.2 ? 2.3 : 0.45; e.dashT += dt;
        const v = e.sr * spdScale * slow * burstF; e.x -= (e.x / dist) * v * dt; e.y -= (e.y / dist) * v * dt;
      } else {
        const v = e.sr * spdScale * slow; e.x -= (e.x / dist) * v * dt; e.y -= (e.y / dist) * v * dt;
      }
    }
    // 治療者：定期治療周圍敵人
    if (e.trait === "healer") {
      e.healCd = (e.healCd == null ? 2 : e.healCd) - dt;
      if (e.healCd <= 0) {
        e.healCd = 2;
        for (const o of g.enemies) { if (o !== e) { const dd = (o.x - e.x) ** 2 + (o.y - e.y) ** 2; if (dd < 0.6 * 0.6) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.06); } }
        burst(g, e.x, e.y, "#34d399", 5);
      }
    }
    if (s.thorns > 0 && dist < rim + WORLD.thornsBand) { damageEnemy(e, s.thorns * dt); if (Math.random() < 0.25) burst(g, e.x, e.y, "#fcd34d", 1); }
    if (e.hp <= 0) { killEnemy(g, s, e, i); continue; }
    if (dist <= rim + 0.012) {
      let armor = s.armor; if (s.fortress && g.hp < g.maxHp * 0.3) armor += 45;
      g.hp -= Math.max(1, e.atk - armor) * s.takeDmgMult;
      g.sounds.push("hurt"); addShake(g, 6);
      ringFx(g, 0, 0, e.col, WORLD.tower * 2.2, 0.22); burst(g, e.x, e.y, e.col, 6);
      g.enemies.splice(i, 1);
      if (g.hp <= 0) {
        if (s.immortal && !g.immortalUsed) { g.hp = g.maxHp * 0.35; g.immortalUsed = true; addShake(g, 12); ringFx(g, 0, 0, "#4ade80", WORLD.tower * 5, 0.5); burst(g, 0, 0, "#4ade80", 22); }
        else { g.hp = 0; endRun(g, s, io); }
      }
      continue;
    }
  }

  // 敵方子彈（射手）→ 命中塔扣血
  for (let i = g.ebullets.length - 1; i >= 0; i--) {
    const eb = g.ebullets[i]; eb.x += eb.vx * dt; eb.y += eb.vy * dt; eb.life -= dt;
    if (Math.hypot(eb.x, eb.y) < WORLD.tower + 0.05) {
      let armor = s.armor; if (s.fortress && g.hp < g.maxHp * 0.3) armor += 45;
      g.hp -= Math.max(1, eb.dmg - armor) * s.takeDmgMult; g.sounds.push("hurt"); addShake(g, 5);
      ringFx(g, 0, 0, "#fb7185", WORLD.tower * 1.8, 0.18); g.ebullets.splice(i, 1);
      if (g.hp <= 0) {
        if (s.immortal && !g.immortalUsed) { g.hp = g.maxHp * 0.35; g.immortalUsed = true; addShake(g, 12); ringFx(g, 0, 0, "#4ade80", WORLD.tower * 5, 0.5); burst(g, 0, 0, "#4ade80", 22); }
        else { g.hp = 0; endRun(g, s, io); }
      }
      continue;
    }
    if (eb.life <= 0) g.ebullets.splice(i, 1);
  }

  // 軌道無人機
  if (s.orbs > 0) {
    g.orbAngle += dt * 2.2; const odps = s.damage * WORLD.orbDpsF;
    for (let o = 0; o < s.orbs; o++) {
      const a = g.orbAngle + o * 6.28 / s.orbs, ox = Math.cos(a) * WORLD.orbR, oy = Math.sin(a) * WORLD.orbR;
      for (let j = g.enemies.length - 1; j >= 0; j--) {
        const e = g.enemies[j];
        if ((ox - e.x) ** 2 + (oy - e.y) ** 2 < (e.r + 0.03) ** 2) { damageEnemy(e, mitigateDot(odps, e.def) * dt); if (e.hp <= 0) killEnemy(g, s, e, j); }
      }
    }
  }

  // 依距離排序所有敵人；各武器再用自己的射程篩選（每把武器射程不同）
  const byDist = g.enemies.map((e) => ({ e, dd: Math.hypot(e.x, e.y) })).sort((a, b) => a.dd - b.dd);
  const dm = g.buffs.over > 0 ? 3 : 1;

  // 所有已啟用武器同時開火，各自使用自己的數值 s.weapons[wk]（含各自暴擊率）
  for (const wk of weapons) {
    const wp = WEAPONS[wk], ws = s.weapons[wk]; if (!wp || !ws) continue;
    const inRange = byDist.filter((o) => o.dd <= ws.range);
    const wcrit = ws.critChance || 0;
    if (wk === "laser") {
      // 持續鎖定：光束每幀畫；傷害以 tickInterval 結算，持續打同目標時每跳等比增傷
      const targets = inRange.slice(0, ws.multishot);
      for (const { e } of targets) g.beams.push({ x1: 0, y1: 0, x2: e.x, y2: e.y, col: "#67e8f9", life: 0.05, wgt: 3 });
      g.laserAcc = (g.laserAcc || 0) + dt;
      if (g.laserAcc >= ws.tickInterval) {
        g.laserAcc -= ws.tickInterval;
        const ids = new Set();
        for (const { e } of targets) {
          ids.add(e.id);
          e.lstack = Math.min(800, (e.lstack || 0) + 1);
          const ramp = Math.min(3, Math.pow(1 + ws.rampPerTick, e.lstack));
          const crit = Math.random() < wcrit * 0.3;
          const ld = mitigateDot(ws.damage * ramp * dm * (crit ? CRIT_MULT : 1), e.def) * ws.tickInterval;
          damageEnemy(e, ld); tagDmg(g, "laser", ld);
          if (e.hp <= 0) { const j = g.enemies.indexOf(e); if (j >= 0) killEnemy(g, s, e, j); }
        }
        for (const e of g.enemies) if (!ids.has(e.id) && e.lstack) e.lstack = Math.max(0, e.lstack - 3); // 換目標即衰退
      }
    } else if (wk === "flame") {
      for (let j = g.enemies.length - 1; j >= 0; j--) {
        const e = g.enemies[j];
        if (Math.hypot(e.x, e.y) <= ws.flameRange) {
          const crit = Math.random() < wcrit * 0.3;
          const fd = mitigateDot(ws.damage * dm * (crit ? CRIT_MULT : 1), e.def) * dt;
          damageEnemy(e, fd); tagDmg(g, "flame", fd);
          if (ws.flameSlow > 0) { e.slowUntil = g.t + 0.4; e.slowF = ws.flameSlow; }
          if (Math.random() < 0.15) burst(g, e.x, e.y, "#fb923c", 1);
          if (e.hp <= 0) killEnemy(g, s, e, j);
        }
      }
    } else {
      g.fireCd[wk] = (g.fireCd[wk] || 0) - dt;
      if (g.fireCd[wk] <= 0 && inRange.length) {
        const bspd = ws.bulletSpeed;
        if (wk === "chain") {
          // 多重：朝最近的數個目標各射一道折射彈
          const n = Math.max(1, Math.min(ws.multishot, inRange.length));
          for (let bi = 0; bi < n; bi++) {
            const tgt = inRange[bi].e, crit = Math.random() < wcrit, a = Math.atan2(tgt.y, tgt.x);
            g.bullets.push({ x: 0, y: 0, vx: Math.cos(a) * bspd, vy: Math.sin(a) * bspd, dmg: ws.damage * dm * (crit ? CRIT_MULT : 1), crit, life: 3.4, type: "chain", hits: [], spd: bspd, bounces: ws.bounces, maxSplit: ws.maxSplit });
          }
        } else {
          for (const { e } of inRange.slice(0, ws.multishot)) {
            const a = Math.atan2(e.y, e.x), crit = Math.random() < wcrit;
            g.bullets.push({ x: 0, y: 0, vx: Math.cos(a) * bspd, vy: Math.sin(a) * bspd, dmg: ws.damage * dm * (crit ? CRIT_MULT : 1), crit, life: 3.4, type: wk, hits: [], spd: bspd, pierce: ws.pierce, splash: ws.splash, splashR: ws.splashRadius, frags: ws.fragCount });
          }
        }
        g.fireCd[wk] = 1 / ws.fireRate;
      }
    }
  }

  // 子彈飛行與命中
  for (let i = g.bullets.length - 1; i >= 0; i--) {
    const b = g.bullets[i]; let dead = false;
    if (b.type === "homing") {
      let best = null, bd = 9;
      for (const e of g.enemies) { if (b.hits.includes(e.id)) continue; const d = (e.x - b.x) ** 2 + (e.y - b.y) ** 2; if (d < bd) { bd = d; best = e; } }
      if (best) {
        const ta = Math.atan2(best.y - b.y, best.x - b.x), ca = Math.atan2(b.vy, b.vx);
        let da = ta - ca; while (da > Math.PI) da -= 6.28; while (da < -Math.PI) da += 6.28;
        const na = ca + Math.max(-4 * dt, Math.min(4 * dt, da)); b.vx = Math.cos(na) * b.spd; b.vy = Math.sin(na) * b.spd;
      }
    }
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0 || Math.hypot(b.x, b.y) > WORLD.spawnR + 0.2) dead = true;
    if (!dead) for (let j = g.enemies.length - 1; j >= 0; j--) {
      const e = g.enemies[j];
      if (b.hits && b.hits.includes(e.id)) continue;
      if ((b.x - e.x) ** 2 + (b.y - e.y) ** 2 < (e.r + WORLD.bulletHit) ** 2) {
        if (b.type === "chain") { chainHit(g, s, b, e); dead = true; break; }
        const dealt = mitigate(b.dmg, e.def);
        damageEnemy(e, dealt); b.hits.push(e.id); tagDmg(g, b.type === "frag" ? "shard" : b.type, dealt);
        floatText(g, b.x, b.y, "" + Math.round(dealt), b.crit ? "#ffffff" : "#fde68a", b.crit);
        if (b.type === "shard") {
          const n = Math.round(b.frags || 4), fs = (b.spd || WORLD.bulletSpd) * 0.85;
          for (let f = 0; f < n; f++) {
            const ang = (f / n) * 6.2832 + Math.random() * 0.4;
            g.bullets.push({ x: b.x, y: b.y, vx: Math.cos(ang) * fs, vy: Math.sin(ang) * fs, dmg: b.dmg * 0.4, crit: b.crit, life: 0.5, type: "frag", hits: [], spd: fs, pierce: 1 });
          }
          ringFx(g, b.x, b.y, "#f0abfc", WORLD.splashR * 0.8, 0.24); burst(g, b.x, b.y, "#f0abfc", 6);
        }
        if (b.type === "homing") {
          const sr = b.splashR || WORLD.splashR, f = 0.5 + (b.splash || 0);
          ringFx(g, b.x, b.y, "#fbbf24", sr, 0.28);
          for (const e2 of g.enemies) if (e2.id !== e.id && (e2.x - e.x) ** 2 + (e2.y - e.y) ** 2 < sr * sr) damageEnemy(e2, mitigate(b.dmg * f, e2.def));
          burst(g, b.x, b.y, "#fbbf24", 5);
        }
        if (b.type === "cannon" && b.splash > 0) {
          const sr = b.splashR || WORLD.splashR;
          ringFx(g, e.x, e.y, "#fde68a", sr, 0.26);
          for (const e2 of g.enemies) if (e2.id !== e.id && (e2.x - e.x) ** 2 + (e2.y - e.y) ** 2 < sr * sr) damageEnemy(e2, mitigate(b.dmg * b.splash, e2.def));
        }
        if (e.hp <= 0) { const k = g.enemies.indexOf(e); if (k >= 0) killEnemy(g, s, e, k); }
        else burst(g, b.x, b.y, b.crit ? "#fff" : "#fde68a", b.crit ? 4 : 2);
        // 標準彈與追蹤彈都用穿透計數（hits 已記錄，穿透後不會再打同一目標）
        b.pierce -= 1; if (b.pierce <= 0) dead = true;
        break;
      }
    }
    if (dead) g.bullets.splice(i, 1);
  }

  // 光束、粒子、光環特效衰減
  for (let i = g.beams.length - 1; i >= 0; i--) { g.beams[i].life -= dt; if (g.beams[i].life <= 0) g.beams.splice(i, 1); }
  for (let i = g.particles.length - 1; i >= 0; i--) { const p = g.particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vx *= 0.92; p.vy *= 0.92; if (p.life <= 0) g.particles.splice(i, 1); }
  for (let i = g.fx.length - 1; i >= 0; i--) { g.fx[i].life -= dt; if (g.fx[i].life <= 0) g.fx.splice(i, 1); }
  if (g.texts) for (let i = g.texts.length - 1; i >= 0; i--) { const t = g.texts[i]; t.y += t.vy * dt; t.life -= dt; if (t.life <= 0) g.texts.splice(i, 1); }
  if (g.shake) g.shake = Math.max(0, g.shake - dt * 32); // 螢幕震動衰退
}

// 結束本局並依模式結算（死亡或生存時間到都走這裡）。
function endRun(g, s, io) {
  if (g.gameOver) return;
  g.gameOver = true;
  g.sounds.push("gameover"); addShake(g, 12);
  if (g.mode === "survival") {
    io.reportSurvival(g.kills);
    const gem = Math.floor(g.kills * 0.5 * s.gemYield * g.diff.gem); io.addDiamonds(gem); g.runGems += gem;
  } else {
    io.reportWave(g.wave);
    const gem = Math.floor(g.wave * 3 * s.gemYield * g.diff.gem); io.addDiamonds(gem); g.runGems += gem;
  }
}

// 主動技能。回傳是否成功施放。
export function triggerAbility(g, s, k) {
  if (!g || g.gameOver || g.cds[k] > 0) return false;
  const ab = ABILITIES.find((a) => a.key === k);
  g.cds[k] = ab.cd;
  if (k === "over") g.buffs.over = ab.dur;
  if (k === "frost") { g.buffs.frost = ab.dur; ringFx(g, 0, 0, "#67e8f9", WORLD.spawnR * 0.6, 0.5); }
  if (k === "repair") { g.hp = Math.min(g.maxHp, g.hp + g.maxHp * 0.4); burst(g, 0, 0, "#4ade80", 16); ringFx(g, 0, 0, "#4ade80", WORLD.tower * 4, 0.4); }
  if (k === "nova") {
    const dmg = s.damage * 6; ringFx(g, 0, 0, "#f43f5e", WORLD.spawnR * 0.55, 0.5); addShake(g, 8);
    for (let i = g.enemies.length - 1; i >= 0; i--) {
      const e = g.enemies[i], dist = Math.hypot(e.x, e.y) || 1;
      e.x += (e.x / dist) * WORLD.novaPush; e.y += (e.y / dist) * WORLD.novaPush;
      damageEnemy(e, mitigate(dmg, e.def)); burst(g, e.x, e.y, "#f43f5e", 5);
      if (e.hp <= 0) killEnemy(g, s, e, i);
    }
  }
  return true;
}
