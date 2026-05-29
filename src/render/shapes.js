// ── 動畫/渲染：形狀路徑 ──────────────────────────────────────
// 把各種敵人形狀畫到 canvas path（不負責填色，由 draw.js 決定樣式）。
export function drawShape(ctx, shape, x, y, r, rot) {
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(x, y, r, 0, 6.2832);
  } else if (shape === "cross") {
    const a = r * 0.42; ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.rect(-a, -r, a * 2, r * 2); ctx.rect(-r, -a, r * 2, a * 2); ctx.restore();
  } else if (shape === "diamond") {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, 0); ctx.closePath(); ctx.restore();
  } else if (shape === "star") {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, an = i * Math.PI / 5 - Math.PI / 2, px = Math.cos(an) * rr, py = Math.sin(an) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.restore();
  } else {
    const sides = shape === "triangle" ? 3 : shape === "hexagon" ? 6 : 4;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot + (shape === "square" ? Math.PI / 4 : 0));
    for (let i = 0; i < sides; i++) { const an = i * 6.2832 / sides - Math.PI / 2, px = Math.cos(an) * r, py = Math.sin(an) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.restore();
  }
}
