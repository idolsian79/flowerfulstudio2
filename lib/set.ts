// Plinth and set builder: 2.5D geometric blocks with faces lit from the chosen side,
// long crisp cast shadows and a one-colour world. Everything is in artboard units so
// preview and export share one renderer.
import { mix } from "./stickers";
export type SetShape = "cube" | "stack" | "steps" | "arch" | "cylinder" | "slab";
export type PropArr = "none" | "base" | "both" | "top" | "scatter";
export type SetSettings = {
  on: boolean; shape: SetShape; block: string; wall: string; floor: number; size: number;
  light: "left" | "right"; shadow: number; world: boolean; props: PropArr; propSize: number;
};
export const setShapes: Array<[SetShape, string]> = [["cube", "Cube"], ["stack", "Stacked"], ["steps", "Steps"], ["arch", "Arch"], ["cylinder", "Cylinder"], ["slab", "Slab"]];
export const propArrangements: Array<[PropArr, string]> = [["none", "None"], ["base", "At the base"], ["both", "Both sides"], ["top", "On the plinth"], ["scatter", "Scattered floor"]];
// palette variants per flavour: [wall, block]
export const setPalettes: Record<string, Array<{ name: string; wall: string; block: string }>> = {
  flourish: [{ name: "Cobalt", wall: "#2F5BFF", block: "#2F5BFF" }, { name: "Violet", wall: "#5B4BEA", block: "#6A5BFF" }, { name: "Pale sky", wall: "#9DB6FF", block: "#3D6BFF" }, { name: "Deep blue", wall: "#1E2E9E", block: "#3550E0" }],
  focus: [{ name: "Saffron", wall: "#FF7417", block: "#FF7417" }, { name: "Apricot", wall: "#F7A25C", block: "#FF7A1F" }, { name: "Sand", wall: "#F4CFA6", block: "#F08A3A" }, { name: "Ember", wall: "#C9480C", block: "#E8621A" }],
  flow: [{ name: "Ruby", wall: "#E0145E", block: "#E0145E" }, { name: "Blush", wall: "#F7A3BE", block: "#E3306E" }],
  float: [{ name: "Butter", wall: "#FFC72C", block: "#FFC72C" }, { name: "Cream", wall: "#FFEBB0", block: "#FFC23A" }],
  lineup: [{ name: "Stone", wall: "#E9E1D9", block: "#D8CCC1" }, { name: "Ink", wall: "#2B2330", block: "#3A3040" }],
};
export const defaultSet = (product: string, i = 0): SetSettings => {
  const p = (setPalettes[product] ?? setPalettes.lineup)[i % (setPalettes[product] ?? setPalettes.lineup).length];
  return { on: false, shape: "stack", block: p.block, wall: p.wall, floor: 86, size: 1, light: "left", shadow: 60, world: true, props: "base", propSize: 1 };
};

type Box = { x: number; y: number; w: number; h: number; d: number; kind: "box" | "cyl" };
// geometry: blocks are placed under the can (cx) and rest on the floor line.
export function setGeometry(W: number, H: number, s: SetSettings, cx: number) {
  const fy = (H * s.floor) / 100, u = W * s.size, dep = u * 0.1;
  const L = s.light === "left" ? 1 : -1; // secondary blocks go away from the light
  const boxes: Box[] = [];
  let topY = fy, topW = u * 0.3, topCx = cx;
  const add = (bx: number, w: number, h: number, base: number, kind: Box["kind"] = "box") => { boxes.push({ x: bx - w / 2, y: base - h, w, h, d: dep, kind }); return base - h; };
  switch (s.shape) {
    case "cube": topW = u * 0.34; topY = add(cx, topW, u * 0.2, fy); break;
    case "stack": { const b = add(cx + L * u * 0.04, u * 0.46, u * 0.1, fy); topW = u * 0.3; topY = add(cx - L * u * 0.02, topW, u * 0.1, b); break; }
    case "steps": add(cx + L * u * 0.38, u * 0.22, u * 0.07, fy); add(cx + L * u * 0.2, u * 0.2, u * 0.13, fy); topW = u * 0.24; topY = add(cx, topW, u * 0.2, fy); break;
    case "arch": topW = u * 0.5; topY = add(cx, topW, u * 0.07, fy); break;
    case "cylinder": topW = u * 0.34; topY = add(cx, topW, u * 0.17, fy, "cyl"); break;
    case "slab": topW = u * 0.7; topY = add(cx, topW, u * 0.06, fy); break;
  }
  // the can stands in the middle of the top face
  return { boxes, fy, topY, topW, topCx, canBase: topY - dep * 0.5, dep };
}
function poly(c: CanvasRenderingContext2D, pts: number[][], fill: string | CanvasGradient) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = fill; c.fill();
}
function hull(pts: number[][]) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: number[][] = [], up: number[][] = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
export function drawWorld(c: CanvasRenderingContext2D, W: number, H: number, s: SetSettings) {
  const fy = (H * s.floor) / 100, lx = s.light === "left" ? 0 : W;
  const g = c.createLinearGradient(0, 0, 0, fy);
  g.addColorStop(0, mix(s.wall, -0.06)); g.addColorStop(1, mix(s.wall, 0.1));
  c.fillStyle = g; c.fillRect(0, 0, W, fy);
  const f = c.createLinearGradient(0, fy, 0, H);
  f.addColorStop(0, mix(s.wall, -0.1)); f.addColorStop(1, mix(s.wall, -0.24));
  c.fillStyle = f; c.fillRect(0, fy, W, H - fy);
  // hard side light: a broad warm wash from the light side
  const r = c.createRadialGradient(lx, fy * 0.5, 0, lx, fy * 0.5, W * 1.1);
  r.addColorStop(0, "rgba(255,250,240,.28)"); r.addColorStop(1, "rgba(255,250,240,0)");
  c.fillStyle = r; c.fillRect(0, 0, W, H);
}
export function drawArchBackdrop(c: CanvasRenderingContext2D, W: number, H: number, s: SetSettings, cx: number) {
  const fy = (H * s.floor) / 100, u = W * s.size, aw = u * 0.66, ah = Math.min(fy * 0.86, u * 1.15), x = cx - aw / 2, top = fy - ah;
  c.save();
  c.beginPath(); c.moveTo(x, fy); c.lineTo(x, top + aw / 2); c.arc(cx, top + aw / 2, aw / 2, Math.PI, 0); c.lineTo(x + aw, fy); c.closePath();
  const g = c.createLinearGradient(x, 0, x + aw, 0);
  const lit = mix(s.block, 0.22), dark = mix(s.block, -0.12);
  g.addColorStop(0, s.light === "left" ? lit : dark); g.addColorStop(1, s.light === "left" ? dark : lit);
  c.fillStyle = g; c.fill();
  c.restore();
}
// faces lit from the side; shadows thrown long and crisp away from the light
export function drawSet(c: CanvasRenderingContext2D, W: number, H: number, s: SetSettings, cx: number, canW: number, canH: number, lightShift = 0) {
  const geo = setGeometry(W, H, s, cx);
  if (s.shape === "arch") drawArchBackdrop(c, W, H, s, cx);
  const dir = s.light === "left" ? 1 : -1, sl = (s.shadow / 100) * W * 0.55 * (1 + lightShift), sv = (s.shadow / 100) * W * 0.035;
  const top = mix(s.block, 0.2), front = mix(s.block, s.light === "left" ? 0.02 : -0.14), side = mix(s.block, s.light === "left" ? -0.24 : 0.08);
  const dx = geo.dep * 0.9 * -dir * 0, dy = geo.dep; // frontal camera, slightly above
  // floor cast shadows
  c.save(); c.globalAlpha = 0.3 + (s.shadow / 100) * 0.25; c.filter = `blur(${Math.max(1, W / 540)}px)`;
  for (const b of geo.boxes) {
    const foot = [[b.x, geo.fy], [b.x + b.w, geo.fy], [b.x + b.w, geo.fy - dy], [b.x, geo.fy - dy]];
    const k = b.h / (W * 0.3);
    const shifted = foot.map(([x, y]) => [x + dir * sl * k, y - sv * k]);
    poly(c, hull([...foot, ...shifted]), mix(s.wall, -0.45));
  }
  // can shadow continues from the plinth top across the floor
  const ch = canH / (W * 0.3);
  const cf = [[geo.topCx - canW * 0.42, geo.fy - dy * 0.5], [geo.topCx + canW * 0.42, geo.fy - dy * 0.5]];
  const tip = cf.map(([x, y]) => [x + dir * sl * (ch + (geo.fy - geo.canBase) / (W * 0.3)), y - sv * ch]);
  poly(c, hull([...cf, ...tip]), mix(s.wall, -0.45));
  c.restore();
  c.filter = "none";
  for (const b of [...geo.boxes].sort((a, b2) => a.h - b2.h)) {
    if (b.kind === "cyl") {
      const rx = b.w / 2, ry = b.d * 0.9, x0 = b.x;
      const g = c.createLinearGradient(x0, 0, x0 + b.w, 0);
      g.addColorStop(0, s.light === "left" ? mix(s.block, 0.18) : mix(s.block, -0.26)); g.addColorStop(0.55, s.block); g.addColorStop(1, s.light === "left" ? mix(s.block, -0.28) : mix(s.block, 0.16));
      c.beginPath(); c.moveTo(x0, b.y); c.lineTo(x0, b.y + b.h); c.ellipse(x0 + rx, b.y + b.h, rx, ry, 0, Math.PI, 0, true); c.lineTo(x0 + b.w, b.y); c.closePath(); c.fillStyle = g; c.fill();
      c.beginPath(); c.ellipse(x0 + rx, b.y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = top; c.fill();
      continue;
    }
    // front face
    poly(c, [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]], front);
    // top face (seen from slightly above)
    poly(c, [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w + dx, b.y - dy], [b.x + dx, b.y - dy]], top);
    // shaded side band on the dark edge for a crisp 2.5D read
    const bw = b.w * 0.06, sx = s.light === "left" ? b.x + b.w - bw : b.x;
    const sg = c.createLinearGradient(sx, 0, sx + bw, 0);
    sg.addColorStop(s.light === "left" ? 0 : 1, "rgba(0,0,0,0)"); sg.addColorStop(s.light === "left" ? 1 : 0, side);
    poly(c, [[sx, b.y], [sx + bw, b.y], [sx + bw, b.y + b.h], [sx, b.y + b.h]], sg);
    // bright edge where top meets front
    c.fillStyle = "rgba(255,255,255,.22)"; c.fillRect(b.x, b.y - 0.5, b.w, Math.max(1, W / 900));
    // shadow of the block above falls onto this face
    for (const o of geo.boxes) if (o !== b && Math.abs(o.y + o.h - b.y) < 1) {
      const ex = dir > 0 ? o.x + o.w : o.x, len = Math.min(sl * (o.h / (W * 0.3)), b.w);
      c.save(); c.globalAlpha = 0.28; poly(c, [[ex, b.y - dy], [ex + dir * len, b.y - dy], [ex + dir * len * 0.85, b.y], [ex, b.y]], mix(s.block, -0.5)); c.restore();
    }
  }
  // can's shadow across the top face of its plinth
  c.save(); c.globalAlpha = 0.34;
  const tb = geo.boxes.find((b) => Math.abs(b.y - geo.topY) < 1);
  if (tb) {
    c.beginPath(); c.rect(tb.x, tb.y - dy * 1.4, tb.w, dy * 1.4); c.clip();
    const x0 = geo.topCx - canW * 0.42, x1 = geo.topCx + canW * 0.42, y = geo.canBase;
    poly(c, [[x0, y], [x1, y], [x1 + dir * sl * ch, y - sv * ch], [x0 + dir * sl * ch, y - sv * ch]], mix(s.block, -0.55));
  }
  c.restore();
  return geo;
}

// where ingredient props rest: surface y and x positions, never floating
export function propSpots(W: number, H: number, s: SetSettings, cx: number, canW: number, arr: PropArr) {
  const g = setGeometry(W, H, s, cx), dir = s.light === "left" ? 1 : -1;
  const tb = g.boxes.find((b) => Math.abs(b.y - g.topY) < 1)!;
  const base = g.boxes.reduce((m, b) => ({ l: Math.min(m.l, b.x), r: Math.max(m.r, b.x + b.w) }), { l: W, r: 0 });
  const fy = g.fy + W * 0.012; // a touch in front of the blocks
  const spots: Array<{ x: number; y: number; s: number; i: number; r: number }> = [];
  const lowSteps = s.shape === "steps" ? g.boxes.filter((b) => b !== tb) : [];
  if (arr === "base" || arr === "both") {
    const sx = dir > 0 ? base.l - W * 0.02 : base.r + W * 0.02;
    spots.push({ x: sx - dir * W * 0.03, y: fy + W * 0.02, s: 1, i: 0, r: -12 }, { x: sx + dir * W * 0.06, y: fy + W * 0.035, s: 0.8, i: 1, r: 18 }, { x: sx - dir * W * 0.1, y: fy + W * 0.04, s: 0.7, i: 1, r: 40 });
  }
  if (arr === "both") { const sx = dir > 0 ? base.r + W * 0.04 : base.l - W * 0.04; spots.push({ x: sx, y: fy + W * 0.03, s: 0.85, i: 0, r: 10 }, { x: sx + dir * W * 0.08, y: fy + W * 0.05, s: 0.6, i: 1, r: -20 }); }
  if (arr === "top" && tb) {
    const room = (tb.w - canW) / 2;
    if (room > W * 0.04) spots.push({ x: g.topCx - dir * (canW / 2 + room * 0.55), y: g.canBase, s: Math.min(0.75, room / (W * 0.1)), i: 0, r: -8 });
    spots.push({ x: dir > 0 ? base.l - W * 0.05 : base.r + W * 0.05, y: fy + W * 0.03, s: 0.9, i: 1, r: 14 });
    lowSteps.forEach((b, j) => spots.push({ x: b.x + b.w / 2, y: b.y - g.dep * 0.5, s: 0.65, i: j % 2, r: 6 }));
  }
  if (arr === "scatter") [[-0.36, 0.05, 0.8], [-0.24, 0.09, 0.6], [-0.12, 0.07, 0.7], [0.2, 0.1, 0.55], [0.32, 0.06, 0.75], [0.42, 0.12, 0.6]].forEach(([ox, oy, sc], j) => spots.push({ x: W * (0.5 + ox), y: g.fy + W * oy, s: sc, i: j % 2, r: j * 37 - 50 }));
  return spots.filter((p) => p.y <= H * 0.995);
}
