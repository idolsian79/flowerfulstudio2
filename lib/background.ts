// Flowerful background generator. One renderer drives both the live preview and the export,
// so what you see on the artboard is exactly what you download.
export type GradientType = "linear" | "radial" | "floor";
export type LightDir = "left" | "top-left" | "top" | "top-right" | "right";
export type BgSettings = {
  c1: string;
  c2: string;
  type: GradientType;
  angle: number; // degrees, 0 = top to bottom, 90 = left to right
  light: LightDir;
  lightStrength: number; // 0-100
  horizon: number; // floor type: % from top
  grain: number; // 0-100
  vignette: number; // 0-100
};
export type BgPreset = { id: string; name: string; group: string; s: BgSettings };

const base = { lightStrength: 45, horizon: 66, grain: 18, vignette: 22 };
export const bgPresets: BgPreset[] = [
  { id: "flourish-dusk", name: "Petal dusk", group: "FLOURISH", s: { ...base, c1: "#0066FF", c2: "#6B4CFF", type: "linear", angle: 160, light: "left" } },
  { id: "flourish-floor", name: "Blue studio", group: "FLOURISH", s: { ...base, c1: "#3D7BFF", c2: "#1B2D8F", type: "floor", angle: 180, light: "left", horizon: 64 } },
  { id: "flourish-berry", name: "Berry glow", group: "FLOURISH", s: { ...base, c1: "#5A8CFF", c2: "#C2386F", type: "radial", angle: 0, light: "top-left", lightStrength: 35 } },
  { id: "focus-sand", name: "Saffron sand", group: "FOCUS", s: { ...base, c1: "#FF6A00", c2: "#F6C9A0", type: "linear", angle: 200, light: "left" } },
  { id: "focus-floor", name: "Amber studio", group: "FOCUS", s: { ...base, c1: "#FFB070", c2: "#C24A00", type: "floor", angle: 180, light: "left", horizon: 64 } },
  { id: "focus-gold", name: "Golden hour", group: "FOCUS", s: { ...base, c1: "#FFD08A", c2: "#E85A00", type: "radial", angle: 0, light: "top-left", lightStrength: 40 } },
  { id: "flow-rose", name: "Roselle field", group: "FLOW", s: { ...base, c1: "#E6005C", c2: "#FF9BB8", type: "linear", angle: 165, light: "left" } },
  { id: "float-honey", name: "Honey light", group: "FLOAT", s: { ...base, c1: "#FFC400", c2: "#FFF1C2", type: "linear", angle: 190, light: "left" } },
  { id: "stone", name: "Warm stone", group: "Neutral", s: { ...base, c1: "#F3EDE6", c2: "#CDBFB6", type: "floor", angle: 180, light: "left", grain: 24 } },
  { id: "ink", name: "After dark", group: "Neutral", s: { ...base, c1: "#3A2E44", c2: "#0E0B12", type: "radial", angle: 0, light: "top-left", lightStrength: 30, vignette: 40 } },
];
export const defaultPresetFor = (product: string) =>
  (bgPresets.find((p) => p.group.toLowerCase() === product) ?? bgPresets[bgPresets.length - 2]).s;

export const lightPos = (d: LightDir) =>
  ({ left: [0.02, 0.38], "top-left": [0.12, 0.06], top: [0.5, -0.04], "top-right": [0.88, 0.06], right: [0.98, 0.38] })[d] as [number, number];

function shade(hex: string, amt: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `rgb(${r},${g},${b})`;
}

function linear(c: CanvasRenderingContext2D, w: number, h: number, angle: number, a: string, b: string, y0 = 0, y1 = h) {
  const rad = (angle * Math.PI) / 180;
  const cx = w / 2, cy = (y0 + y1) / 2, hh = y1 - y0;
  const len = Math.abs(w * Math.sin(rad)) / 2 + Math.abs(hh * Math.cos(rad)) / 2;
  const dx = Math.sin(rad) * len, dy = -Math.cos(rad) * len;
  const g = c.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  c.fillStyle = g;
  c.fillRect(0, y0, w, hh);
}

// deterministic noise so preview and export grain match
function grainTile(size = 128) {
  const t = document.createElement("canvas");
  t.width = t.height = size;
  const x = t.getContext("2d")!;
  const img = x.createImageData(size, size);
  let seed = 7;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const v = seed % 256;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return t;
}
let tile: HTMLCanvasElement | null = null;

export function drawBackground(c: CanvasRenderingContext2D, w: number, h: number, s: BgSettings) {
  c.save();
  if (s.type === "linear") linear(c, w, h, s.angle, s.c1, s.c2);
  else if (s.type === "radial") {
    const [lx, ly] = lightPos(s.light);
    const g = c.createRadialGradient(w * (0.5 + (lx - 0.5) * 0.5), h * (0.45 + (ly - 0.4) * 0.5), 0, w / 2, h / 2, Math.hypot(w, h) * 0.62);
    g.addColorStop(0, s.c1);
    g.addColorStop(1, s.c2);
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  } else {
    const hy = (h * s.horizon) / 100;
    linear(c, w, h, s.angle, s.c1, s.c2, 0, hy);
    const fg = c.createLinearGradient(0, hy, 0, h);
    fg.addColorStop(0, shade(s.c2, -0.08));
    fg.addColorStop(1, shade(s.c2, -0.32));
    c.fillStyle = fg;
    c.fillRect(0, hy, w, h - hy);
    const edge = c.createLinearGradient(0, hy - h * 0.012, 0, hy + h * 0.02);
    edge.addColorStop(0, "rgba(255,255,255,0)");
    edge.addColorStop(0.45, "rgba(255,255,255,0.18)");
    edge.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = edge;
    c.fillRect(0, hy - h * 0.012, w, h * 0.032);
  }
  if (s.lightStrength > 0) {
    const [lx, ly] = lightPos(s.light);
    const r = Math.max(w, h) * 0.85;
    const g = c.createRadialGradient(w * lx, h * ly, 0, w * lx, h * ly, r);
    const a = (s.lightStrength / 100) * 0.55;
    g.addColorStop(0, `rgba(255,252,246,${a})`);
    g.addColorStop(0.45, `rgba(255,252,246,${a * 0.35})`);
    g.addColorStop(1, "rgba(255,252,246,0)");
    c.globalCompositeOperation = "soft-light";
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "screen";
    c.globalAlpha = 0.5;
    c.fillRect(0, 0, w, h);
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
  }
  if (s.vignette > 0) {
    const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(10,6,14,${(s.vignette / 100) * 0.55})`);
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }
  if (s.grain > 0) {
    tile ??= grainTile();
    const scale = Math.max(1, w / 1080);
    const pat = c.createPattern(tile, "repeat")!;
    pat.setTransform(new DOMMatrix().scale(scale));
    c.globalCompositeOperation = "overlay";
    c.globalAlpha = (s.grain / 100) * 0.22;
    c.fillStyle = pat;
    c.fillRect(0, 0, w, h);
  }
  c.restore();
}

// soft contact shadow under the can, thrown away from the light
export function drawCanShadow(c: CanvasRenderingContext2D, cx: number, baseY: number, canW: number, s: BgSettings | null, strength = 1) {
  const [lx] = s ? lightPos(s.light) : [0.5];
  const off = (0.5 - lx) * canW * 0.9;
  c.save();
  c.translate(cx + off * 0.5, baseY);
  c.scale(1, 0.16);
  const r = canW * (0.75 + Math.abs(off) / canW * 0.5);
  const g = c.createRadialGradient(off * 0.4, 0, 0, off * 0.4, 0, r);
  g.addColorStop(0, `rgba(12,6,10,${0.5 * strength})`);
  g.addColorStop(0.55, `rgba(12,6,10,${0.18 * strength})`);
  g.addColorStop(1, "rgba(12,6,10,0)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(off * 0.4, 0, r, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
