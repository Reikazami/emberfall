// The four element marks, drawn from paths so the game needs no image files.

function flame(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.bezierCurveTo(cx + s * 0.95, cy - s * 0.15, cx + s * 0.85, cy + s * 0.85, cx, cy + s);
  ctx.bezierCurveTo(cx - s * 0.85, cy + s * 0.85, cx - s * 0.95, cy - s * 0.15, cx, cy - s);
  ctx.fill();
  ctx.save();
  ctx.globalAlpha *= 0.55;
  ctx.fillStyle = '#fff3d0';
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.1);
  ctx.bezierCurveTo(cx + s * 0.45, cy + s * 0.25, cx + s * 0.4, cy + s * 0.75, cx, cy + s * 0.82);
  ctx.bezierCurveTo(cx - s * 0.4, cy + s * 0.75, cx - s * 0.45, cy + s * 0.25, cx, cy - s * 0.1);
  ctx.fill();
  ctx.restore();
}

function droplet(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.bezierCurveTo(cx + s * 0.3, cy - s * 0.45, cx + s * 0.9, cy - s * 0.05, cx + s * 0.9, cy + s * 0.3);
  ctx.arc(cx, cy + s * 0.3, s * 0.9, 0, Math.PI, false);
  ctx.bezierCurveTo(cx - s * 0.9, cy - s * 0.05, cx - s * 0.3, cy - s * 0.45, cx, cy - s);
  ctx.fill();
  ctx.save();
  ctx.globalAlpha *= 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.35, cy + s * 0.2, s * 0.14, s * 0.3, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function swirl(ctx, cx, cy, s) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.2;
  ctx.strokeStyle = ctx.fillStyle;
  const rows = [-0.55, 0, 0.55];
  rows.forEach((row, i) => {
    const y = cy + s * row;
    const r = s * (0.38 - i * 0.04);
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.95, y);
    ctx.lineTo(cx + s * 0.35, y);
    ctx.arc(cx + s * 0.35, y - r, r, Math.PI / 2, -Math.PI * 0.9, true);
    ctx.stroke();
  });
  ctx.restore();
}

function crystal(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s * 0.8, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.55, cy + s * 0.9);
  ctx.lineTo(cx - s * 0.55, cy + s * 0.9);
  ctx.lineTo(cx - s * 0.8, cy - s * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.globalAlpha *= 0.4;
  ctx.strokeStyle = '#3b2f22';
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx - s * 0.1, cy + s * 0.9);
  ctx.moveTo(cx - s * 0.8, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.55, cy + s * 0.9);
  ctx.moveTo(cx + s * 0.8, cy - s * 0.3);
  ctx.lineTo(cx - s * 0.55, cy + s * 0.9);
  ctx.stroke();
  ctx.restore();
}

const DRAWERS = { ember: flame, tide: droplet, gale: swirl, stone: crystal };

export function drawGlyph(ctx, element, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  DRAWERS[element](ctx, cx, cy, size);
  ctx.restore();
}
