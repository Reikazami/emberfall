// Where everything sits on the 1280 by 720 table. Drawing and mouse hit-testing both read these.

export const W = 1280;
export const H = 720;
export const CARD_SIZE = { hand: { w: 120, h: 170 }, board: { w: 104, h: 134 } };
export const HAND_LIFT = 28;
export const END_BUTTON = { x: 1090, y: 318, w: 170, h: 64 };
export const PREVIEW = { x: 1040, y: 14, w: 210, h: 298 };
export const AGAIN_BUTTON = { x: 440, y: 470, w: 190, h: 56 };
export const TITLE_BUTTON = { x: 650, y: 470, w: 190, h: 56 };
export const START_BUTTON = { x: 520, y: 596, w: 240, h: 62 };

export function handRects(count) {
  const { w, h } = CARD_SIZE.hand;
  const spacing = Math.min(132, 900 / Math.max(count, 1));
  const total = (count - 1) * spacing + w;
  const startX = 640 - total / 2 + 30;
  const rects = [];
  for (let i = 0; i < count; i++) rects.push({ x: startX + i * spacing, y: H - h - 8, w, h });
  return rects;
}

export function boardRects(side, count) {
  const { w, h } = CARD_SIZE.board;
  const spacing = 116;
  const total = (count - 1) * spacing + w;
  const startX = 640 - total / 2 - 20;
  const y = side === 1 ? 150 : 330;
  const rects = [];
  for (let i = 0; i < count; i++) rects.push({ x: startX + i * spacing, y, w, h });
  return rects;
}

export function heroCircle(side) {
  return side === 1 ? { x: 110, y: 96, r: 52 } : { x: 110, y: 540, r: 52 };
}

export function inRect(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function inCircle(c, x, y) {
  return (x - c.x) ** 2 + (y - c.y) ** 2 <= c.r ** 2;
}
