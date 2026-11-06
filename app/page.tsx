"use client";
import { scenes } from "@/lib/scenes";
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight, Check, ChevronDown, ChevronUp, Download, Eye, EyeOff, ImagePlus, Layers3, LockKeyhole, Redo2,
  RefreshCw, RotateCcw, Sparkles, Shuffle, Lock, LockOpen, FlipHorizontal2, Copy, Trash2, ShieldCheck, X, ArrowRight, ArrowLeft as ArrowBack, Undo2, Upload, WandSparkles, AlignLeft, AlignCenter, ExternalLink,
} from "lucide-react";
import { BgSettings, GradientType, LightDir, bgPresets, defaultPresetFor, drawBackground, drawCanShadow } from "@/lib/background";
import { CopyGroup, Slide, copyGroups, groupForProduct, headerLines, originalCount, storyTemplates, subLines } from "@/lib/copy";
import { makeZip } from "@/lib/zip";
import { StickerColour, StickerGroup, badgeFont, badgeTracking, propPalette, badgeTextColour, botanicalsFor, petalsFor, mix, paletteFor, stickerById, stickerSvg, stickers, svgUrl } from "@/lib/stickers";
import { PropArr, SetSettings, SetShape, defaultSet, drawSet, drawWorld, propArrangements, propSpots, setGeometry, setPalettes, setShapes } from "@/lib/set";

const FLAVOUR_ORDER = ["flow", "flourish", "focus", "float", "lineup"];
const products = {
  flow: { name: "FLOW", flavour: "Roselle + Pomegranate", color: "#E6005C", radial: "/assets/radial-flow.jpg", soon: true },
  flourish: { name: "FLOURISH", flavour: "Butterfly Pea + Raspberry", color: "#0066FF", radial: "/assets/radial-flourish.jpg", soon: false },
  focus: { name: "FOCUS", flavour: "Saffron + Cardamom", color: "#FF6A00", radial: "/assets/radial-focus.jpg", soon: false },
  float: { name: "FLOAT", flavour: "Chrysanthemum + Honey", color: "#FFC400", radial: "/assets/radial-float.jpg", soon: true },
  lineup: { name: "LINE-UP", flavour: "FLOW · FLOURISH · FOCUS · FLOAT", color: "#333333", radial: "", soon: false },
} as const;
type ProductKey = keyof typeof products;
const themes = {
  "Botanical Couture": ["Sculptural bloom", "Translucent petals", "Chrome botanicals", "Ingredient macro"],
  "Urban Bloom": ["City morning", "Design café", "Rooftop social", "Pool architecture"],
  "After-Dark Botanical": ["Midnight chrome", "Projected radials", "Neon botanicals", "Dark stone"],
  "Colour Architecture": ["Monochrome field", "Tonal gradient", "Hard shadow", "Geometric plinth"],
  "Everyday Brighter": ["Post-yoga moment", "Workday ritual", "Golden hour", "Shared table"],
} as const;
type ThemeKey = keyof typeof themes;
const outputs = [
  { id: "ig-square", label: "Square", ratio: "1:1", w: 1080, h: 1080 },
  { id: "ig-portrait", label: "Portrait", ratio: "4:5", w: 1080, h: 1350 },
  { id: "ig-story", label: "Story / Reel", ratio: "9:16", w: 1080, h: 1920 },
  { id: "ad-banner", label: "Ad banner", ratio: "1.91:1", w: 1200, h: 628 },
  { id: "web-hero", label: "Web hero", ratio: "16:9", w: 1920, h: 1080 },
  { id: "web-banner", label: "Web banner", ratio: "8:3", w: 1920, h: 720 },
];
const remixParts = {
  light: ["crisp sunrise light", "hard-flash editorial light", "cinematic side light", "projected botanical shadows", "soft silver reflections"],
  lens: ["close product portrait", "wide architectural frame", "low hero angle", "macro crop", "candid documentary frame"],
  material: ["translucent acrylic", "brushed chrome", "cool limestone", "high-gloss colour", "water and crushed ice"],
};
type OverlayKey = "product" | "radial" | "icon" | "wordmark" | "lockup" | "tagline" | "header" | "sub";
type MarkColour = "silver" | "white" | "ink" | "flavour";
const defaultOrder: OverlayKey[] = ["radial", "product", "icon", "wordmark", "lockup", "tagline", "header", "sub"];
// brand mark sources (alpha masks, recoloured at render time)
const ICON = { src: "/assets/brand-mark-white.png", a: 309 / 275 };
const WORD = { src: "/assets/brand-wordmark-white.png", a: 1378 / 269 };
// "drink brighter" set in Fredoka (the brand's rounded display face), lowercase, as on the can
const TAG = { src: "/assets/brand-tagline-white.png", a: 2449 / 367 };
// can-flow.png: tagline width = 62% of wordmark width, gap below wordmark = 38% of wordmark height
const TAG_W = 0.62, TAG_GAP = 0.38, tagW = 0.3;
const markCss = (m: MarkColour, sku: string) =>
  m === "silver" ? "linear-gradient(160deg,#f2f2f2 0%,#b9b9b9 45%,#e2e2e2 70%,#9d9d9d 100%)" : m === "white" ? "#ffffff" : m === "ink" ? "#241A1E" : sku;
// lockup geometry as fractions of artboard width (shared by preview and export)
function lockupGeom(layout: "left" | "above", spacing: number, tag = false) {
  if (layout === "left") {
    // side by side: icon restrained to the wordmark's ascender (cap) height
    const ih = 1, iw = ih * ICON.a, wh = 1, ww = wh * WORD.a, gap = (spacing / 100) * ih;
    const tw = iw + gap + ww, k = 0.5 / tw;
    const tgw = ww * TAG_W, tgh = tgw / TAG.a, th = tag ? ih + TAG_GAP * wh + tgh : ih;
    return { w: tw * k, h: th * k, icon: { x: 0, y: 0, w: iw * k, h: ih * k }, word: { x: (iw + gap) * k, y: ((ih - wh) / 2) * k, w: ww * k, h: wh * k }, tag: tag ? { x: (iw + gap + (ww - tgw) / 2) * k, y: (ih + TAG_GAP * wh) * k, w: tgw * k, h: tgh * k } : null };
  }
  // stacked (Ian's lockup rule): icon width = 30% of wordmark width, gap = 20% of icon height
  const ih = 1, iw = ih * ICON.a, wh = iw / 0.3 / WORD.a, ww = wh * WORD.a, gap = (spacing / 100) * ih;
  const tw = Math.max(iw, ww), k = 0.4 / tw;
  const tgw = ww * TAG_W, tgh = tgw / TAG.a, ty = ih + gap + wh + TAG_GAP * wh;
  return { w: tw * k, h: (tag ? ty + tgh : ih + gap + wh) * k, icon: { x: ((tw - iw) / 2) * k, y: 0, w: iw * k, h: ih * k }, word: { x: ((tw - ww) / 2) * k, y: (ih + gap) * k, w: ww * k, h: wh * k }, tag: tag ? { x: ((tw - tgw) / 2) * k, y: ty * k, w: tgw * k, h: tgh * k } : null };
}
const iconW = 0.3, wordW = 0.44;
type LogoKey = "icon" | "wordmark" | "lockup" | "tagline";
const LOGO_KEYS: LogoKey[] = ["icon", "wordmark", "lockup", "tagline"];
// lockup rule: icon width = 30% of wordmark width. Bases are iconW / wordW of the artboard, so iconScale = wordW * wordScale.
const WORD_DEFAULT_SCALE = 0.55;
const LOGO_DEFAULT_SCALE: Record<LogoKey, number> = {
  wordmark: WORD_DEFAULT_SCALE,
  icon: wordW * WORD_DEFAULT_SCALE, // ~0.242 → ~7.3% of artboard (= 30% of default wordmark)
  lockup: 0.7,
  tagline: (wordW * WORD_DEFAULT_SCALE * TAG_W) / tagW, // ~62% of default wordmark width
};
function logoBandBusy(d: Doc, y: number, except?: LogoKey, band = 14) {
  return LOGO_KEYS.some((k) => k !== except && d.layers[k] && Math.abs(d.t[k].y - y) < band);
}
function placeLogo(d: Doc, k: LogoKey): T {
  const scale = LOGO_DEFAULT_SCALE[k];
  const topBusy = LOGO_KEYS.some((x) => x !== k && d.layers[x] && d.t[x].y < 40);
  let candidates: number[];
  if (k === "icon") candidates = topBusy ? [88, 8, 14, 80] : [8, 12, 88, 18];
  else if (k === "wordmark") candidates = topBusy ? [90, 86, 8, 16] : [8, 90, 14, 86];
  else if (k === "lockup") candidates = topBusy ? [88, 10, 16, 80] : [10, 88, 16];
  else candidates = [92, 84, 22, 8];
  for (const y of candidates) if (!logoBandBusy(d, y, k)) return { x: 50, y, scale };
  return { x: 50, y: candidates[0], scale };
}
/** Turn a logo layer on without removing others; place it in a free spot at a lockup-rule size. */
function addLogo(d: Doc, k: LogoKey): Doc {
  if (d.layers[k]) return d;
  return { ...d, layers: { ...d.layers, [k]: true }, t: { ...d.t, [k]: placeLogo(d, k) } };
}
function toggleLogo(d: Doc, k: LogoKey): Doc {
  if (d.layers[k]) return { ...d, layers: { ...d.layers, [k]: false } };
  return addLogo(d, k);
}
// wizard / one-shot presets only: exclusive logo style with text clearance
function applyLogoStyle(d: Doc, k: "none" | "icon" | "wordmark" | "lockup" | "both"): Doc {
  const layers = { ...d.layers, lockup: k === "lockup", icon: k === "icon" || k === "both", wordmark: k === "wordmark" || k === "both" };
  const t = { ...d.t };
  const textAt = (y: number) => {
    t.header = { ...t.header, y }; t.sub = { ...t.sub, y: y + 9 };
    const top = y + 12, scale = Math.min(t.product.scale, (100 - top - 3) / 68);
    t.product = { ...t.product, scale, y: top + (68 * scale) / 2 };
  };
  if (k === "icon") { t.icon = { x: 50, y: 9, scale: LOGO_DEFAULT_SCALE.icon }; textAt(22); }
  if (k === "wordmark") { t.wordmark = { x: 50, y: 8, scale: LOGO_DEFAULT_SCALE.wordmark }; textAt(19); }
  // icon top, wordmark bottom, sized to the lockup rule
  if (k === "both") { t.icon = { x: 50, y: 8, scale: LOGO_DEFAULT_SCALE.icon }; t.wordmark = { x: 50, y: 90, scale: LOGO_DEFAULT_SCALE.wordmark }; textAt(22); }
  if (k === "lockup") { t.lockup = { x: 50, y: d.lockup.layout === "above" ? 11 : 8, scale: d.lockup.layout === "above" ? 0.6 : 0.8 }; textAt(d.lockup.layout === "above" ? 27 : 20); }
  return { ...d, layers, t };
}
type T = { x: number; y: number; scale: number };
type Repeat = "none" | "grid" | "scatter" | "border";
type StickerLayer = { uid: string; kind: string; x: number; y: number; scale: number; rot: number; flip: boolean; opacity: number; colour: StickerColour; text?: string; repeat: Repeat; density: number };
type Align = "left" | "center";
type Tone = "white" | "silver" | "black";
type Doc = {
  product: ProductKey;
  bgSource: "create" | "image";
  bg: BgSettings;
  bgPreset: string | null;
  image: string | null;
  fg?: string | null;
  layers: { background: boolean; wash: boolean; radial: boolean; product: boolean; shadow: boolean; icon: boolean; wordmark: boolean; lockup: boolean; tagline?: boolean; header: boolean; sub: boolean };
  t: Record<OverlayKey, T>;
  header: { text: string; caps: boolean; size: number; align: Align };
  sub: { text: string; custom: boolean; caps: boolean; size: number; align: Align };
  tone: Tone;
  markColour: MarkColour;
  lockup: { layout: "left" | "above"; spacing: number; tagline?: boolean };
  tagColour?: MarkColour;
  bgT?: { src: string; x: number; y: number; z: number };
  order: OverlayKey[];
  carousel: { slides: Slide[]; active: number; size: "ig-square" | "ig-portrait"; base?: { t: Doc["t"]; size: number } };
  set: SetSettings;
  stickers: StickerLayer[];
  aligned: string | null;
  output: string;
  format: "png" | "jpg" | "webp";
};
const toneHex: Record<Tone, string> = { white: "#ffffff", silver: "#c9c9c9", black: "#181818" };
const initialDoc: Doc = {
  product: "flourish",
  bgSource: "create",
  bg: defaultPresetFor("flourish"),
  bgPreset: "flourish-dusk",
  image: null,
  layers: { background: true, wash: false, radial: false, product: true, shadow: true, icon: false, wordmark: true, lockup: false, header: true, sub: true },
  t: {
    product: { x: 50, y: 62, scale: 1 },
    radial: { x: 76, y: 76, scale: 1 },
    icon: { x: 50, y: 9, scale: 0.242 },
    lockup: { x: 50, y: 9, scale: 1 },
    tagline: { x: 50, y: 33, scale: 1 },
    wordmark: { x: 50, y: 8, scale: 0.6 },
    header: { x: 50, y: 19, scale: 1 },
    sub: { x: 50, y: 28, scale: 1 },
  },
  header: { text: "BLUE IS THE NEW BLACK", caps: true, size: 7.4, align: "center" },
  sub: { text: "Butterfly Pea & Raspberry", custom: false, caps: true, size: 2.2, align: "center" },
  tone: "white",
  markColour: "white",
  lockup: { layout: "left", spacing: 22 },
  order: defaultOrder,
  carousel: { slides: [], active: 0, size: "ig-square" },
  set: defaultSet("flourish"),
  stickers: [],
  aligned: null,
  output: "ig-square",
  format: "png",
};
const STORE = "flowerful-studio-v3";
const overlayMeta: Record<OverlayKey, { label: string; layer: keyof Doc["layers"]; tab: Tab }> = {
  sub: { label: "Sub line", layer: "sub", tab: "text" },
  header: { label: "Header", layer: "header", tab: "text" },
  lockup: { label: "Lockup", layer: "lockup", tab: "text" },
  tagline: { label: "Tagline", layer: "tagline", tab: "text" },
  wordmark: { label: "Wordmark", layer: "wordmark", tab: "text" },
  icon: { label: "Icon", layer: "icon", tab: "text" },
  product: { label: "Can", layer: "product", tab: "can" },
  radial: { label: "Flower radial", layer: "radial", tab: "can" },
};
const fixedLayers: Array<{ key: keyof Doc["layers"]; label: string; tab: Tab }> = [
  { key: "shadow", label: "Can shadow", tab: "can" },
  { key: "wash", label: "Colour wash", tab: "can" },
  { key: "background", label: "Background", tab: "background" },
];
type Tab = "set" | "stickers" | "background" | "can" | "text" | "brand" | "carousel" | "motion" | "export";
const tabs: Array<[Tab, string]> = [["set", "Set"], ["stickers", "Stickers"], ["background", "Background"], ["can", "Can"], ["text", "Words & logo"], ["carousel", "Carousel"], ["motion", "Motion"], ["export", "Export"]];

const imgCache = new Map<string, Promise<HTMLImageElement>>();
const loadImg = (src: string) => {
  let pr = imgCache.get(src);
  if (!pr) {
    pr = new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = (e) => { imgCache.delete(src); no(e); }; i.src = src; });
    if (imgCache.size > 40) imgCache.clear();
    imgCache.set(src, pr);
  }
  return pr;
};
type MotionKind = "drift" | "sweep" | "petals" | "typeon" | "reveal";
type Anim = { kind: MotionKind; t: number };
const motionPresets: Array<[MotionKind, string, string]> = [
  ["drift", "Gradient drift", "Colours breathe and rotate slowly"],
  ["sweep", "Light sweep", "Light travels left to right, the can shadow follows"],
  ["petals", "Drifting petals", "Flower artwork floats gently through the frame"],
  ["typeon", "Header type-on", "The header writes itself, then holds"],
  ["reveal", "Colour-change reveal", "FLOURISH turns from blue to violet and back, like the real drink"],
];
const STORY_TOP = 250 / 1920, STORY_BOTTOM = 340 / 1920;
const safeBand = (id: string) => (id === "ig-story" ? [STORY_TOP * 100, 100 - STORY_BOTTOM * 100] : [0, 100]);
// move a layout designed at one size onto another, keeping text and logos inside Story safe zones
// background plate placement: x/y in -1..1 of the spare overflow, z >= 1 on top of cover, so the plate always fills the canvas
function bgPlace(d: Doc, W: number, H: number, iw: number, ih: number) {
  const t = d.bgT && d.bgT.src === d.image ? d.bgT : { x: 0, y: 0, z: 1 };
  const s = Math.max(W / iw, H / ih) * Math.max(1, t.z), w = iw * s, h = ih * s;
  return { x: (W - w) * (1 - t.x) / 2, y: (H - h) * (1 - t.y) / 2, w, h, t };
}
function reflow(d: Doc, fromId: string, toId: string): Doc {
  if (fromId === toId) return d;
  const from = outputs.find((o) => o.id === fromId)!, to = outputs.find((o) => o.id === toId)!;
  const [f0, f1] = safeBand(fromId), [t0, t1] = safeBand(toId);
  const t = { ...d.t };
  (Object.keys(t) as OverlayKey[]).forEach((k) => {
    const n = (t[k].y - f0) / (f1 - f0);
    let y = t0 + n * (t1 - t0);
    if (k !== "product") y = Math.max(t0 + 2, Math.min(t1 - 2, y));
    t[k] = { ...t[k], y };
  });
  // can height is a share of artboard height, so keep its pixel size similar across ratios
  const k = Math.pow((from.h / from.w) / (to.h / to.w), 0.7);
  t.product = { ...t.product, scale: t.product.scale * k };
  if (toId === "ig-story") {
    const half = (68 * t.product.scale) / 2, bottom = t1 - 1;
    if (t.product.y + half > bottom) t.product.y = bottom - half;
  }
  const stickers = d.stickers.map((st) => ({ ...st, y: Math.max(t0 + 3, Math.min(t1 - 3, t0 + ((st.y - f0) / (f1 - f0)) * (t1 - t0))), scale: st.scale * Math.pow((from.h / from.w) / (to.h / to.w), 0.3) }));
  const r = { ...d, output: toId, t, stickers };
  return applySceneFormat(r, toId);
}
// Illustrated scenes carry a plate, can position and text positions per format
const fmtKey = (id: string) => (id === "reel" ? "ig-story" : id);
function applySceneFormat(d: Doc, toId: string): Doc {
  const sc = scenes.find((x) => x.formats && Object.values(x.formats).some((f) => f.src === d.image));
  const f = sc?.formats?.[fmtKey(toId)];
  if (!f) return d;
  return { ...d, image: f.src, fg: f.fg ?? null, t: { ...d.t, product: { ...d.t.product, ...f.can }, header: { ...d.t.header, y: f.header_y }, sub: { ...d.t.sub, y: f.sub_y } } };
}
// ---------- v3 helpers ----------
let uidN = 0;
const uid = () => `s${Date.now().toString(36)}${(uidN++).toString(36)}`;
const groupOf = (p: ProductKey): CopyGroup => groupForProduct(p);
function lerpHex(a: string, b: string, k: number) {
  const pa = parseInt(a.slice(1, 7), 16), pb = parseInt(b.slice(1, 7), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k);
  return "#" + [16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, "0")).join("");
}
const measureCtx = () => { const c = document.createElement("canvas").getContext("2d")!; return c; };
let mctx: CanvasRenderingContext2D | null = null;
// badge text size in the same unit as w, shrunk to fit the badge
function badgeFs(def: ReturnType<typeof stickerById>, text: string, w: number) {
  const a = def.aspect ?? 1, h = w / a, ta = def.textArea!;
  const lines = text.split("\n");
  let fs = h * ta.size;
  if (typeof document === "undefined") return fs;
  mctx ??= measureCtx();
  mctx.font = badgeFont(100);
  const widest = Math.max(...lines.map((l) => mctx!.measureText(l).width + badgeTracking * 100 * l.length)) / 100;
  if (widest * fs > w * ta.w) fs = (w * ta.w) / widest;
  return fs;
}
const stickerW = (W: number, st: StickerLayer) => W * 0.16 * st.scale;
const layoutKinds = [["centre", "Hero centre"], ["poster", "Type poster"], ["side", "Can left, type right"]] as const;
type LayoutKind = (typeof layoutKinds)[number][0];
// fit the can between the sub line and the plinth top, and inside the plinth's top face
function fitCan(d: Doc): Doc {
  if (!d.set.on || !d.layers.product) return d;
  const o = outputs.find((x) => x.id === d.output)!, W = o.w, H = o.h;
  const cx = (W * d.t.product.x) / 100, g = setGeometry(W, H, d.set, cx);
  const textBottom = d.layers.sub ? d.t.sub.y + 5 : d.layers.header ? d.t.header.y + 8 : 8;
  const avail = g.canBase - (H * textBottom) / 100;
  const aspect = d.product === "lineup" ? 1.6 : 0.36;
  let h = Math.min(avail, H * 0.6);
  const maxW = d.product === "lineup" ? g.topW * 1.1 : g.topW * 0.78;
  if (h * aspect > maxW) h = maxW / aspect;
  const scale = d.product === "lineup" ? (h * aspect) / (W * 0.82) : h / (H * 0.68);
  return { ...d, t: { ...d.t, product: { ...d.t.product, scale: Math.max(0.2, Math.min(1.2, scale)) } } };
}
function fitSize(text: string, max: number, widthPct: number) {
  const longest = Math.max(...text.split("\n").map((l) => l.length), 1);
  return Math.min(max, Math.round((widthPct / (longest * 0.64)) * 10) / 10);
}
function applyLayout(d0: Doc, k: LayoutKind): Doc {
  const d = { ...d0, t: { ...d0.t }, header: { ...d0.header }, sub: { ...d0.sub } };
  const [a] = safeBand(d.output), off = a;
  if (k === "centre") {
    d.t.header = { x: 50, y: off + 17, scale: 1 }; d.t.sub = { x: 50, y: off + 25, scale: 1 }; d.t.product = { ...d.t.product, x: 50 };
    d.header.align = "center"; d.sub.align = "center"; d.header.size = fitSize(d.header.text, 7.4, 90);
    d.set = { ...d.set, floor: d.output === "ig-story" ? 80 : 86 };
  } else if (k === "poster") {
    d.t.header = { x: 50, y: off + 24, scale: 1 }; d.t.sub = { x: 50, y: off + 37, scale: 1 }; d.t.product = { ...d.t.product, x: 70 };
    d.header.align = "center"; d.sub.align = "center"; d.header.size = fitSize(d.header.text, 10.4, 92);
    d.set = { ...d.set, floor: d.output === "ig-story" ? 80 : 88, size: 0.8 };
  } else {
    d.t.header = { x: 72, y: off + 36, scale: 0.52 }; d.t.sub = { x: 72, y: off + 48, scale: 0.6 }; d.t.product = { ...d.t.product, x: 30 };
    d.header.align = "left"; d.sub.align = "left"; d.header.size = fitSize(d.header.text, 10, 50 / 0.52);
    d.set = { ...d.set, floor: d.output === "ig-story" ? 80 : 86 };
  }
  d.t.wordmark = { x: 50, y: off + 8, scale: 0.6 };
  d.layers = { ...d.layers, wordmark: !d.layers.lockup && !d.layers.icon ? true : d.layers.wordmark };
  return fitCan(d);
}
const stickerSpots: Record<LayoutKind, Array<[number, number]>> = {
  centre: [[15, 48], [85, 46], [84, 62], [16, 64], [86, 30]],
  poster: [[18, 62], [84, 14], [30, 72], [14, 48]],
  side: [[86, 18], [88, 64], [60, 64], [14, 22]],
};
function makeSticker(kind: string, x: number, y: number, product: ProductKey, extra: Partial<StickerLayer> = {}): StickerLayer {
  const def = stickerById(kind);
  const colour: StickerColour = "white";
  const text = def.id === "badge-tag" ? products[product].name : def.text;
  return { uid: uid(), kind, x, y, scale: def.group === "Badges" ? 0.9 : 0.7, rot: 0, flip: false, opacity: 1, colour, text, repeat: "none", density: 1, ...extra };
}
export type Locks = { set: boolean; palette: boolean; stickers: boolean; layout: boolean; line: boolean };
function shuffleDoc(d: Doc, locks: Locks): { doc: Doc; layout: LayoutKind } {
  const r = Math.random, pick = <X,>(a: readonly X[]) => a[Math.floor(r() * a.length)];
  let n: Doc = { ...d, set: { ...d.set } };
  const pals = setPalettes[n.product] ?? setPalettes.lineup;
  if (!locks.set) {
    n.set = { ...n.set, on: true, shape: pick(setShapes.map((x) => x[0]).filter((x) => n.product !== "lineup" || x === "slab" || x === "cube")), props: pick(["base", "both", "top", "scatter", "base"] as PropArr[]), light: r() < 0.7 ? "left" : "right", size: 0.9 + r() * 0.25, world: true, shadow: 50 + Math.round(r() * 30) };
  }
  if (!locks.palette) {
    const a = pick(pals), b = r() < 0.35 ? pick(pals) : a;
    n.set = { ...n.set, wall: a.wall, block: b.block };
    const bgs = bgPresets.filter((x) => x.group.toLowerCase() === n.product);
    if (bgs.length) { const pr = pick(bgs); n = { ...n, bg: pr.s, bgPreset: pr.id, bgSource: "create" }; }
  }
  const layout: LayoutKind = locks.layout ? "centre" : pick(layoutKinds.map((x) => x[0]));
  if (!locks.layout) n = applyLayout(n, layout); else n = fitCan(n);
  if (!locks.line) {
    const g = groupOf(n.product), lines = headerLines[g];
    n = { ...n, header: { ...n.header, text: pick(lines) }, sub: { ...n.sub, text: r() < 0.6 ? flavourText(n.product) : pick(subLines[g] ?? [flavourText(n.product)]), custom: true } };
    const [mx, wp] = layout === "centre" ? [7.4, 90] : layout === "poster" ? [10.4, 92] : [10, 50 / 0.52];
    n = fitCan({ ...n, header: { ...n.header, size: fitSize(n.header.text, mx, wp) } });
  }
  if (!locks.stickers) {
    const pool = [...petalsFor(n.product), "leaf", "sparkle", "sparkles", "badge-ribbon", "badge-tag", n.product === "flow" || n.product === "float" ? "badge-round" : "badge-pill"];
    const count = 1 + Math.floor(r() * 3), spots = [...stickerSpots[layout]].sort(() => r() - 0.5), chosen: StickerLayer[] = [];
    const used = new Set<string>();
    for (let i = 0; i < count; i++) {
      let k = pick(pool); let tries = 0;
      while ((used.has(k) || (stickerById(k).group === "Badges" && [...used].some((u) => stickerById(u).group === "Badges"))) && tries++ < 10) k = pick(pool);
      used.add(k);
      const [x, y] = spots[i % spots.length];
      const [a0] = safeBand(n.output);
      chosen.push(makeSticker(k, x, a0 + y * (n.output === "ig-story" ? 0.69 : 1), n.product, { rot: Math.round((r() - 0.5) * 30), scale: stickerById(k).group === "Badges" ? 0.85 : 0.5 + r() * 0.3 }));
    }
    n = { ...n, stickers: [...d.stickers.filter((x) => x.repeat !== "none"), ...chosen] };
  }
  return { doc: n, layout };
}
// same composition in another flavour world
function seriesDoc(d: Doc, to: ProductKey): Doc {
  if (to === d.product) return d;
  const fromPals = setPalettes[d.product] ?? setPalettes.lineup, toPals = setPalettes[to] ?? setPalettes.lineup;
  const wi = Math.max(0, fromPals.findIndex((x) => x.wall === d.set.wall)), bi = Math.max(0, fromPals.findIndex((x) => x.block === d.set.block));
  const g0 = groupOf(d.product), g1 = groupOf(to), hi = headerLines[g0].indexOf(d.header.text);
  const bf = botanicalsFor(d.product), bt = botanicalsFor(to);
  const pi = bgPresets.filter((x) => x.group.toLowerCase() === d.product).findIndex((x) => x.id === d.bgPreset);
  const tb = bgPresets.filter((x) => x.group.toLowerCase() === to);
  return {
    ...d, product: to, aligned: null,
    set: { ...d.set, wall: toPals[wi % toPals.length].wall, block: toPals[bi % toPals.length].block },
    ...(d.bgSource === "create" && tb.length ? { bg: tb[Math.max(0, pi) % tb.length].s, bgPreset: tb[Math.max(0, pi) % tb.length].id } : {}),
    header: { ...d.header, text: hi >= 0 && g0 !== g1 ? headerLines[g1][hi % headerLines[g1].length] : d.header.text },
    sub: { ...d.sub, text: d.sub.text.toLowerCase() === flavourText(d.product).toLowerCase() || !d.sub.custom ? flavourText(to) : d.sub.text },
    stickers: d.stickers.map((st) => ({ ...st, kind: petalsFor(d.product).includes(st.kind) ? petalsFor(to)[petalsFor(d.product).indexOf(st.kind)] : bf.includes(st.kind) ? bt[bf.indexOf(st.kind) % bt.length] : st.kind, text: st.kind === "badge-tag" ? products[to].name : st.text })),
  };
}
// brand safety check (en-GB house rules, UAE GSO 2333 claim caution)
const claimWords = ["healthy", "health", "detox", "boost", "energy", "energis", "immun", "cure", "heal", "fat burn", "weight", "slim", "skinny", "gut", "digest", "superfood", "vitamin", "antioxidant", "guilt-free", "guilt free", "sugar-free", "sugar free", "zero sugar", "no sugar", "low calorie", "calorie", "wellness", "medicinal", "focus your mind", "brain", "stress", "anxiety", "sleep better", "hydrat"];
const clicheWords = ["desert", "camel", "oasis", "lantern", "majlis", "mashrabiya", "arabian", "sheikh", "habibi", "yalla", "thirst", "quench", "splash", "refreshing", "zesty"];
type Issue = { level: "stop" | "warn"; msg: string };
function checkDoc(d: Doc, extra: string[] = []): Issue[] {
  const texts: Array<[string, string]> = [];
  if (d.layers.header) texts.push(["Header", d.header.text]);
  if (d.layers.sub) texts.push(["Sub line", d.sub.text]);
  d.stickers.forEach((st) => st.text && texts.push([`${stickerById(st.kind).name} badge`, st.text]));
  d.carousel.slides.forEach((sl, i) => { texts.push([`Slide ${i + 1} header`, sl.header]); texts.push([`Slide ${i + 1} sub line`, sl.sub]); });
  extra.forEach((x, i) => texts.push([`Text ${i + 1}`, x]));
  const out: Issue[] = [];
  for (const [where, t] of texts) {
    const low = t.toLowerCase().replace(/\n/g, " ");
    if (/[\u2014\u2013]/.test(t)) out.push({ level: "stop", msg: `${where} uses a dash (— or –). Use a comma, full stop or "&".` });
    const c = claimWords.find((w) => low.includes(w));
    if (c) out.push({ level: "stop", msg: `${where} contains "${c}", which can read as a health or performance claim.` });
    const k = clicheWords.find((w) => low.includes(w));
    if (k) out.push({ level: "warn", msg: `${where} contains "${k}", a regional or beverage cliché.` });
    if (/\b(color|flavor|favorite|center)\b/i.test(t)) out.push({ level: "warn", msg: `${where} uses US spelling. Use en-GB (colour, flavour, favourite, centre).` });
  }
  const W = outputs.find((o) => o.id === d.output)!.w;
  const subPx = (d.sub.size / 100) * W * d.t.sub.scale * (1080 / W);
  if (d.layers.sub && subPx < 20) out.push({ level: "warn", msg: `Sub line is tiny (${Math.round(subPx)}px at 1080 wide). Aim for 22px or more so it reads on a phone.` });
  const hPx = (d.header.size / 100) * 1080 * d.t.header.scale;
  if (d.layers.header && hPx < 36) out.push({ level: "warn", msg: `Header is small (${Math.round(hPx)}px). Headers read best from 48px.` });
  const n = d.stickers.length;
  if (n > 3) out.push({ level: "warn", msg: `${n} stickers. Keep it to 3 or fewer so the post stays calm.` });
  if (!d.layers.wordmark && !d.layers.lockup && !d.layers.icon) out.push({ level: "warn", msg: "No Flowerful logo on the artboard." });
  if (d.output === "ig-story") {
    const bad = (["header", "sub", "wordmark", "lockup", "icon"] as OverlayKey[]).filter((k) => d.layers[overlayMeta[k].layer] && (d.t[k].y < STORY_TOP * 100 || d.t[k].y > 100 - STORY_BOTTOM * 100));
    if (bad.length) out.push({ level: "warn", msg: `${bad.map((k) => overlayMeta[k].label).join(", ")} sit in the Story UI zones.` });
  }
  return out;
}
type Wizard = { step: number; product: ProductKey; goal: string; format: string; style: string; layout: LayoutKind; line: string; props: boolean; stickers: boolean; logo: "wordmark" | "lockup" | "icon" };
const goals = [["awareness", "Awareness", "Say hello to Flowerful"], ["intro", "Flavour intro", "Show one can and its colour world"], ["story", "Ingredient story", "Five slides on what is inside"], ["engage", "Engagement", "A line that gets a reply"], ["launch", "Launch or drop", "NEW or COMING SOON moment"], ["brand", "Brand moment", "Calm, premium, logo-led"]] as const;
const formats = [["ig-square", "Post 1:1"], ["ig-portrait", "Post 4:5"], ["ig-story", "Story 9:16"], ["reel", "Reel loop 9:16"], ["carousel", "Carousel, 5 slides"]] as const;
const guidedStyles = [
  ["plinth", "Monochrome plinth", "One can on stacked blocks, all in one hue, ingredients at the base. Your favourite."],
  ["steps", "Architectural steps", "Stepped terraces in a pale sky of the flavour colour."],
  ["world", "One-colour world", "Low slab, scattered ingredients, long soft shadow."],
  ["poster", "Graphic type poster", "Big Fredoka line, can small, flat flavour colour."],
  ["pattern", "Pattern and repeat", "Botanical icon repeat behind the can."],
  ["reveal", "Colour-change reveal", "FLOURISH turning blue to violet as a Reel loop."],
] as const;
function composeGuided(base: Doc, w: Wizard): Doc {
  let d: Doc = { ...base, product: w.product, carousel: { ...base.carousel, slides: [], base: undefined }, stickers: [], aligned: null };
  const tb = bgPresets.filter((x) => x.group.toLowerCase() === w.product);
  d = { ...d, bg: tb[0]?.s ?? d.bg, bgPreset: tb[0]?.id ?? d.bgPreset, bgSource: "create", output: w.format === "reel" ? "ig-story" : w.format === "carousel" ? "ig-portrait" : w.format };
  const pals = setPalettes[w.product] ?? setPalettes.lineup;
  const shape: SetShape = w.style === "steps" ? "steps" : w.style === "world" ? "slab" : w.style === "reveal" ? "cube" : w.style === "poster" ? "cube" : "stack";
  const pal = w.style === "steps" ? pals[2 % pals.length] : pals[0];
  d.set = { ...defaultSet(w.product), on: w.style !== "pattern", shape, wall: pal.wall, block: pal.block, props: !w.props ? "none" : w.style === "world" ? "scatter" : w.style === "steps" ? "top" : "base" };
  d.layers = { ...d.layers, product: true, shadow: true, header: true, sub: true, lockup: w.logo === "lockup", wordmark: w.logo === "wordmark", icon: w.logo === "icon", radial: false, wash: false };
  d.header = { ...d.header, text: w.line, caps: true };
  d.sub = { ...d.sub, text: flavourText(w.product), custom: true, caps: true };
  d = applyLayout(d, w.style === "poster" ? "poster" : w.layout);
  if (w.logo === "lockup") d.t.lockup = { x: 50, y: d.t.wordmark.y, scale: 0.8 };
  if (w.logo === "icon") d.t.icon = { x: 50, y: d.t.wordmark.y + 1, scale: 0.36 };
  const [a0] = safeBand(d.output), k = d.output === "ig-story" ? 0.69 : 1;
  const st: StickerLayer[] = [];
  if (w.style === "pattern") st.push(makeSticker(botanicalsFor(w.product)[0], 50, 50, w.product, { repeat: "scatter", opacity: 0.22, colour: "white", scale: 0.55 }));
  if (w.goal === "launch") st.push(makeSticker(w.product === "flow" || w.product === "float" ? "badge-round" : "badge-pill", 84, a0 + 46 * k, w.product, { rot: 10 }));
  if (w.stickers) {
    st.push(makeSticker(petalsFor(w.product)[1], 16, a0 + 50 * k, w.product, { rot: -14, scale: 0.55 }));
    if (w.goal !== "launch") st.push(makeSticker("sparkles", 85, a0 + 44 * k, w.product, { scale: 0.42 }));
  }
  if (w.goal === "story") st.push(makeSticker("badge-swipe", 82, a0 + 90 * k, w.product, { scale: 0.7 }));
  d.stickers = st;
  return d;
}
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}
const toBlob = (cv: HTMLCanvasElement, fmt: string) => new Promise<Blob>((ok, no) => cv.toBlob((b) => (b ? ok(b) : no(new Error())), fmt === "jpg" ? "image/jpeg" : `image/${fmt}`, fmt === "png" ? undefined : 0.94));
function slideDoc(d: Doc, sl: Slide): Doc {
  const t = { ...d.t };
  if (!sl.can) {
    const n = sl.header.split("\n").length, [a, b] = safeBand(d.output), mid = (a + b) / 2;
    t.header = { ...t.header, y: mid - 4 }; t.sub = { ...t.sub, y: mid - 4 + n * 4.6 + 4 };
  }
  return { ...d, t, header: { ...d.header, text: sl.header, size: sl.can ? d.header.size : d.header.size * 1.15 }, sub: { ...d.sub, text: sl.sub, custom: true }, layers: { ...d.layers, product: sl.can } };
}
const linesOf = (text: string, caps: boolean) => (caps ? text.toUpperCase() : text).split("\n");
const flavourText = (p: ProductKey) => products[p].flavour.replace(" + ", " & ");

function useHistory(initial: Doc) {
  const [state, setState] = useState({ past: [] as Doc[], doc: initial, future: [] as Doc[] });
  const last = useRef<{ key: string | null; at: number }>({ key: null, at: 0 });
  const commit = useCallback((fn: (d: Doc) => Doc, key: string | null = null) => {
    setState((s) => {
      const next = fn(s.doc);
      if (next === s.doc) return s;
      const now = Date.now();
      const coalesce = key !== null && last.current.key === key && now - last.current.at < 800;
      last.current = { key, at: now };
      return { past: coalesce ? s.past : [...s.past.slice(-79), s.doc], doc: next, future: [] };
    });
  }, []);
  const undo = useCallback(() => setState((s) => { last.current.key = null; return s.past.length ? { past: s.past.slice(0, -1), doc: s.past[s.past.length - 1], future: [s.doc, ...s.future] } : s; }), []);
  const redo = useCallback(() => setState((s) => { last.current.key = null; return s.future.length ? { past: [...s.past, s.doc], doc: s.future[0], future: s.future.slice(1) } : s; }), []);
  const replace = useCallback((d: Doc) => setState({ past: [], doc: d, future: [] }), []);
  return { doc: state.doc, commit, undo, redo, replace, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}

export default function Home() {
  const { doc, commit, undo, redo, replace, canUndo, canRedo } = useHistory(initialDoc);
  const [tab, setTab] = useState<Tab>("background");
  const [bgMode, setBgMode] = useState<"create" | "library" | "upload" | "ai">("create");
  const [copyTab, setCopyTab] = useState<CopyGroup>("FLOURISH");
  const [selected, setSelected] = useState<OverlayKey | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [canAspect, setCanAspect] = useState<Record<string, number>>({});
  const [board, setBoard] = useState({ w: 600, h: 600 });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [motion, setMotion] = useState<MotionKind>("drift");
  const [motionSecs, setMotionSecs] = useState(7);
  const [showSafe, setShowSafe] = useState(true);
  const [motionPreview, setMotionPreview] = useState(false);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [selSticker, setSelSticker] = useState<string | null>(null);
  const [stGroup, setStGroup] = useState<StickerGroup>("Botanicals");
  const [locks, setLocks] = useState<Locks>({ set: false, palette: false, stickers: false, layout: false, line: false });
  const [shuffles, setShuffles] = useState(0);
  const [wiz, setWiz] = useState<Wizard | null>(null);
  const [gate, setGate] = useState<{ issues: Issue[]; run: () => void } | null>(null);
  const [seriesSoon, setSeriesSoon] = useState(false);
  // AI (secondary) state is per session only
  const [theme, setTheme] = useState<ThemeKey>("Botanical Couture");
  const [subtheme, setSubtheme] = useState<string>(themes["Botanical Couture"][0]);
  const [scene, setScene] = useState("A decisive premium product moment with generous negative space and tactile botanical detail.");
  const [remix, setRemix] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [bgEdit, setBgEdit] = useState(false);
  const bgDims = useRef<{ w: number; h: number } | null>(null);
  const bgDrag = useRef<{ px: number; py: number; x: number; y: number; z: number } | null>(null);
  const curBgT = () => (doc.bgT && doc.bgT.src === doc.image ? doc.bgT : { src: doc.image ?? "", x: 0, y: 0, z: 1 });
  const setBgT = (v: Partial<{ x: number; y: number; z: number }>, key: string) => commit((d) => { const b = d.bgT && d.bgT.src === d.image ? d.bgT : { src: d.image ?? "", x: 0, y: 0, z: 1 }; const n = { ...b, ...v }; n.x = Math.max(-1, Math.min(1, n.x)); n.y = Math.max(-1, Math.min(1, n.y)); n.z = Math.max(1, Math.min(4, n.z)); if ((v.x !== undefined || v.y !== undefined) && v.z === undefined && n.z < 1.02) n.z = 1.15; return { ...d, bgT: n }; }, key);
  const boardRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const p = products[doc.product];
  const out = outputs.find((o) => o.id === doc.output)!;

  // restore + autosave
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Doc>;
        const order = saved.order && defaultOrder.every((k) => saved.order!.includes(k)) ? saved.order.filter((k) => defaultOrder.includes(k)) : defaultOrder;
        replace({ ...initialDoc, ...saved, order, carousel: { ...initialDoc.carousel, ...saved.carousel }, set: { ...initialDoc.set, ...saved.set }, stickers: saved.stickers ?? [], lockup: { ...initialDoc.lockup, ...saved.lockup }, layers: { ...initialDoc.layers, ...saved.layers }, t: { ...initialDoc.t, ...saved.t } });
        if (saved.product) setCopyTab(groupForProduct(saved.product));
      }
    } catch {}
  }, [replace]);
  useEffect(() => {
    const id = setTimeout(() => {
      try { localStorage.setItem(STORE, JSON.stringify(doc)); }
      catch { try { localStorage.setItem(STORE, JSON.stringify({ ...doc, image: null })); } catch {} }
    }, 400);
    return () => clearTimeout(id);
  }, [doc]);

  // keyboard: undo / redo / delete / nudge
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable='true']");
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !typing) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && e.key.toLowerCase() === "y" && !typing) { e.preventDefault(); redo(); return; }
      if (typing) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selSticker) { e.preventDefault(); commit((d) => ({ ...d, stickers: d.stickers.filter((x) => x.uid !== selSticker) })); setSelSticker(null); return; }
      if (!selected) return;
      const step = e.shiftKey ? 2 : 0.4;
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (d) { e.preventDefault(); commit((x) => ({ ...x, t: { ...x.t, [selected]: { ...x.t[selected], x: x.t[selected].x + d[0], y: x.t[selected].y + d[1] } } }), "nudge-" + selected); }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); toggleLayer(overlayMeta[selected].layer); setSelected(null); }
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  // paste an image anywhere
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest("input, textarea")) return;
      const f = Array.from(e.clipboardData?.files ?? []).find((x) => x.type.startsWith("image/"));
      if (f) { e.preventDefault(); loadFile(f); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  // fit the artboard inside the stage
  useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const ratio = out.w / out.h;
      let w = r.width, h = w / ratio;
      if (h > r.height) { h = r.height; w = h * ratio; }
      setBoard({ w: Math.floor(w), h: Math.floor(h) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [out.w, out.h]);

  // can geometry in output-relative units (shared by preview and export)
  const canBox = useCallback((W: number, H: number, d: Doc) => {
    const t = d.t.product;
    const a = canAspect[d.product] ?? (d.product === "lineup" ? 1.6 : 0.36);
    let w: number, h: number;
    if (d.product === "lineup") { w = W * 0.82 * t.scale; h = w / a; }
    else { h = H * 0.68 * t.scale; w = h * a; }
    const cx = (W * t.x) / 100;
    if (d.set.on) { const g = setGeometry(W, H, d.set, cx); return { cx, cy: g.canBase - h / 2 + h * 0.006, w, h }; }
    return { cx, cy: (H * t.y) / 100, w, h };
  }, [canAspect]);

  // background base: gradient or image, plus can shadow. Same code paints preview and export.
  const paintBase = useCallback(async (c: CanvasRenderingContext2D, W: number, H: number, d: Doc, anim?: Anim) => {
    const TAU = Math.PI * 2;
    let bg = d.bg, lp: [number, number] | undefined;
    if (anim?.kind === "drift") bg = { ...bg, angle: bg.angle + 16 * Math.sin(TAU * anim.t), lightStrength: bg.lightStrength * (0.85 + 0.15 * Math.cos(TAU * anim.t)) };
    if (anim?.kind === "sweep") lp = [0.5 - 0.46 * Math.cos(TAU * anim.t), 0.22 + 0.1 * Math.sin(TAU * anim.t)];
    let set = d.set;
    if (anim?.kind === "reveal") {
      const k = 0.5 - 0.5 * Math.cos(TAU * anim.t), ease = k * k * (3 - 2 * k);
      const v1 = d.product === "flourish" ? "#7A45F0" : (setPalettes[d.product] ?? setPalettes.lineup)[1 % (setPalettes[d.product] ?? setPalettes.lineup).length].block;
      const v2 = d.product === "flourish" ? "#A54BE0" : mix(v1, 0.2);
      set = { ...set, wall: lerpHex(set.wall, v1, ease), block: lerpHex(set.block, mix(v1, 0.08), ease) };
      bg = { ...bg, c1: lerpHex(bg.c1, v1, ease), c2: lerpHex(bg.c2, v2, ease) };
    }
    const world = set.on && set.world;
    if (world && d.layers.background && !(d.bgSource === "image" && d.image)) drawWorld(c, W, H, set);
    else if (d.layers.background) {
      if (d.bgSource === "image" && d.image) {
        const bg = await loadImg(d.image);
        const g = bgPlace(d, W, H, bg.width, bg.height); bgDims.current = { w: bg.width, h: bg.height };
        c.drawImage(bg, g.x, g.y, g.w, g.h);
      } else drawBackground(c, W, H, bg, lp);
    }
    if (d.layers.wash) {
      c.save(); c.globalAlpha = 0.52; c.globalCompositeOperation = "color"; c.fillStyle = products[d.product].color; c.fillRect(0, 0, W, H); c.restore();
    }
    if (anim?.kind === "petals" && d.product !== "lineup") {
      const r = await loadImg(products[d.product].radial);
      c.save(); c.globalCompositeOperation = "multiply";
      for (let i = 0; i < 9; i++) {
        const seed = (i * 0.618) % 1, size = W * (0.07 + 0.06 * ((i * 0.37) % 1));
        const y = (((seed + anim.t) % 1) * 1.3 - 0.15) * H;
        const x = W * (0.08 + 0.84 * ((i * 0.29 + 0.1) % 1)) + Math.sin(TAU * (anim.t * 2 + seed)) * W * 0.03;
        c.globalAlpha = 0.28 + 0.2 * ((i * 0.53) % 1);
        c.translate(x, y); c.rotate(TAU * (anim.t + seed) * (i % 2 ? 1 : -1) * 0.5);
        c.drawImage(r, -size / 2, -size / 2, size, (size * r.height) / r.width);
        c.setTransform(1, 0, 0, 1, 0, 0);
      }
      c.restore();
    }
    // repeated stickers become a pattern on the wall, behind the set and can
    for (const st of d.stickers) if (st.repeat !== "none") await drawStickerLayer(c, W, H, d, st, true);
    if (set.on) {
      const b = canBox(W, H, d);
      const g = drawSet(c, W, H, set, b.cx, b.w, d.layers.product ? b.h : 0, anim?.kind === "sweep" ? 0.4 * Math.sin(TAU * anim.t) : 0);
      if (set.props !== "none" && d.product !== "lineup") {
        const kinds = botanicalsFor(d.product), dir = set.light === "left" ? 1 : -1;
        for (const sp of propSpots(W, H, set, b.cx, b.w, set.props)) {
          const def = stickerById(kinds[sp.i % kinds.length]), img = await loadImg(svgUrl(stickerSvg(def.id, propPalette(def))));
          const pw = W * 0.085 * sp.s * set.propSize, ph = pw;
          // contact + cast shadow on the surface it rests on
          c.save(); c.globalAlpha = 0.35; c.fillStyle = mix(set.wall, -0.55);
          c.beginPath(); c.ellipse(sp.x + dir * pw * 0.35, sp.y, pw * 0.62, pw * 0.1, 0, 0, TAU); c.fill(); c.restore();
          // loose ingredients lie on the surface; upright ones (flowers, berries, buds) stand on their base
          const lie = ({ "saffron-thread": 84, "cardamom-pod": 72, petal: 76, "petal-roselle": 76, "petal-chrys": 76, "petal-saffron": 76, leaf: 50, petals: 0 } as Record<string, number>)[def.id];
          c.save();
          if (lie) { c.translate(sp.x, sp.y - pw * 0.13); c.rotate(((sp.i % 2 ? -1 : 1) * lie + sp.r * 0.3) * Math.PI / 180); c.drawImage(img, -pw / 2, -ph / 2, pw, ph); }
          else { c.translate(sp.x, sp.y); c.rotate((sp.r * Math.PI) / 180 * 0.4); c.drawImage(img, -pw / 2, -ph * 0.94, pw, ph); }
          c.restore();
        }
        void g;
      }
    }
    if (d.layers.product && d.layers.shadow) {
      const b = canBox(W, H, d);
      drawCanShadow(c, b.cx, b.cy + b.h / 2 - b.h * 0.012, d.product === "lineup" ? b.w * 0.8 : b.w, d.set.on ? { ...d.bg, light: d.set.light } : d.bgSource === "create" ? d.bg : null, d.set.on ? 0.8 : 1, lp);
    }
  }, [canBox]);
  // stickers: single layers sit above the artwork; repeats become a pattern
  async function drawStickerLayer(c: CanvasRenderingContext2D, W: number, H: number, d: Doc, st: StickerLayer, asPattern = false) {
    const def = stickerById(st.kind); if (!def) return;
    const pal = paletteFor(def, st.colour, products[d.product].color);
    const img = await loadImg(svgUrl(stickerSvg(def.id, pal)));
    const w = stickerW(W, st), h = w / (def.aspect ?? 1);
    const one = (x: number, y: number, rot: number, sc = 1) => {
      c.save(); c.globalAlpha = st.opacity; c.translate(x, y); c.rotate((rot * Math.PI) / 180); c.scale(st.flip ? -sc : sc, sc);
      c.drawImage(img, -w / 2, -h / 2, w, h);
      if (def.textArea && st.text) {
        if (st.flip) c.scale(-1, 1);
        const fs = badgeFs(def, st.text, w), lines = st.text.split("\n");
        c.font = badgeFont(fs); c.fillStyle = badgeTextColour(def, pal); c.textAlign = "center"; c.textBaseline = "middle";
        (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${fs * badgeTracking}px`;
        const cx = (def.textArea.x - 0.5) * w, cy = (def.textArea.y - 0.5) * h;
        lines.forEach((ln, i) => c.fillText(ln, cx + (fs * badgeTracking) / 2, cy + (i - (lines.length - 1) / 2) * fs * 1.2 + fs * 0.04));
      }
      c.restore();
    };
    if (!asPattern || st.repeat === "none") { one((W * st.x) / 100, (H * st.y) / 100, st.rot); return; }
    const step = (w * 1.9) / st.density;
    if (st.repeat === "grid") { let row = 0; for (let y = step / 2; y < H + step; y += step * 0.9, row++) for (let x = (row % 2 ? step / 2 : 0); x < W + step; x += step) one(x, y, st.rot); }
    if (st.repeat === "scatter") { let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); const n = Math.round(((W * H) / (step * step)) * 1.1); for (let i = 0; i < n; i++) one(rnd() * W, rnd() * H, st.rot + (rnd() - 0.5) * 120, 0.6 + rnd() * 0.5); }
    if (st.repeat === "border") { const m = w * 0.62, gap = (w * 1.35) / st.density; for (let x = m; x <= W - m + 1; x += gap) { one(x, m, st.rot); one(x, H - m, st.rot); } for (let y = m + gap; y < H - m - gap / 2; y += gap) { one(m, y, st.rot); one(W - m, y, st.rot); } }
  }

  useEffect(() => {
    const cv = baseRef.current;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(board.w * dpr), H = Math.round(board.h * dpr);
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d")!;
    let live = true;
    (async () => {
      const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H;
      await paintBase(tmp.getContext("2d")!, W, H, doc);
      if (live) { c.clearRect(0, 0, W, H); c.drawImage(tmp, 0, 0); }
    })().catch(() => {});
    return () => { live = false; };
  }, [doc, board, paintBase]);

  // carousel thumbnails
  useEffect(() => {
    if (tab !== "carousel" || !carouselOn) return;
    let dead = false;
    const id = setTimeout(async () => {
      await fontsReady();
      const cb = doc.carousel.base ?? { t: doc.t, size: doc.header.size };
      const base = { ...doc, t: cb.t, header: { ...doc.header, size: cb.size } };
      const o = outputs.find((x) => x.id === doc.output)!, W = 180, H = Math.round((180 * o.h) / o.w), urls: string[] = [];
      for (const sl of doc.carousel.slides) { const cv = await renderToCanvas({ ...slideDoc(base, sl), format: "jpg" }, W, H); urls.push(cv.toDataURL("image/jpeg", 0.8)); }
      if (!dead) setThumbs(urls);
    }, 350);
    return () => { dead = true; clearTimeout(id); };
  }, [doc, tab]); // eslint-disable-line react-hooks/exhaustive-deps
  // live motion preview
  const motionRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (tab !== "motion" || !motionPreview) return;
    const cv = motionRef.current; if (!cv) return;
    const W = 300, H = Math.round((300 * out.h) / out.w); cv.width = W; cv.height = H;
    const c = cv.getContext("2d")!, buf = document.createElement("canvas"); buf.width = W; buf.height = H;
    const bc = buf.getContext("2d")!; let dead = false; const start = performance.now();
    (async () => {
      await fontsReady();
      while (!dead) {
        const t = ((performance.now() - start) % (motionSecs * 1000)) / (motionSecs * 1000);
        bc.clearRect(0, 0, W, H); await renderDoc(bc, W, H, doc, { kind: motion, t }); c.drawImage(buf, 0, 0);
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      }
    })();
    return () => { dead = true; };
  }, [tab, motionPreview, motion, motionSecs, doc, out]); // eslint-disable-line react-hooks/exhaustive-deps
  // actions
  const setT = (k: OverlayKey, v: Partial<T>, key = "t-" + k) => commit((d) => ({ ...d, t: { ...d.t, [k]: { ...d.t[k], ...v } } }), key);
  const setBg = (v: Partial<BgSettings>, key: string) => commit((d) => ({ ...d, bg: { ...d.bg, ...v }, bgPreset: null, bgSource: "create", layers: { ...d.layers, background: true } }), key);
  function toggleLayer(k: keyof Doc["layers"]) {
    // logo layers (icon / wordmark / lockup / tagline) toggle independently so several can sit on the canvas together
    if (k === "icon" || k === "wordmark" || k === "lockup" || k === "tagline") { commit((d) => toggleLogo(d, k)); return; }
    commit((d) => ({ ...d, layers: { ...d.layers, [k]: !d.layers[k] } }));
  }
  function pickProduct(k: ProductKey) {
    commit((d) => ({
      ...d, product: k, aligned: null,
      sub: d.sub.custom ? d.sub : { ...d.sub, text: flavourText(k) },
      layers: { ...d.layers, product: true },
      ...(d.bgPreset ? { bg: defaultPresetFor(k), bgPreset: bgPresets.find((x) => x.group.toLowerCase() === k)?.id ?? d.bgPreset } : {}),
    }));
    setCopyTab(groupForProduct(k));
  }
  function loadFile(f?: Blob | null) {
    if (!f || !f.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => { commit((d) => ({ ...d, image: String(r.result), fg: null, bgSource: "image", aligned: null, layers: { ...d.layers, background: true } })); setNotice("Image set as the background."); };
    r.readAsDataURL(f);
  }
  const remixDirection = `${remixParts.light[remix % 5]}, ${remixParts.lens[(remix * 2) % 5]}, ${remixParts.material[(remix * 3) % 5]}`;
  const prompt = useMemo(() => `Create a clean, unbranded Flowerful campaign background plate. Theme: ${theme}. Sub-theme: ${subtheme}. Scene: ${scene}. Art direction: quiet luxury, ${remixDirection}. Harmonise the lighting and accents with the ${p.name} colour world ${p.color}, without creating a product. Modern, vibrant, editorial and photoreal, light falling from the left. COMPOSITION RULE: reserve the top 22% as clean uncluttered negative space and reserve the bottom-right 28% as clean negative space for locked logos and campaign text. Keep the central/lower-central area believable for later can placement, with a coherent directional light and a realistic contact-shadow surface. Absolutely no cans, drinks, packaging, products, people holding products, logo, wordmark, label, radial flower device, typography or text. No watercolour, wreaths, rustic apothecary, generic spa imagery, desert, camels, lanterns, arabesque patterns or stock-photo smiles. Output ${out.w} × ${out.h}.`, [theme, subtheme, scene, remixDirection, p, out]);
  async function generateInside() {
    setIsGenerating(true); setNotice("Creating a background plate…");
    try {
      const ratio = out.w / out.h;
      const size = ratio > 1.2 ? "1536x1024" : ratio < 0.84 ? "1024x1536" : "1024x1024";
      const res = await fetch("/api/generate-background", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, size, apiKey: apiKey.trim() || undefined }) });
      const result = (await res.json()) as { error?: string; image?: string };
      if (!res.ok) throw new Error(result.error || "Background generation failed.");
      commit((d) => ({ ...d, image: `data:image/png;base64,${result.image}`, fg: null, bgSource: "image", aligned: null, layers: { ...d.layers, background: true } }));
      setNotice("AI background ready.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Background generation failed."); }
    finally { setIsGenerating(false); }
  }
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(prompt); window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer"); setNotice("Prompt copied. Generate in ChatGPT, then upload the result."); }
    catch { setNotice("Copy the prompt below into ChatGPT, then upload the result."); }
  }
  async function alignCan() {
    if (doc.aligned) { commit((d) => ({ ...d, aligned: null })); return; }
    try {
      const s = document.createElement("canvas"); s.width = s.height = 48;
      const c = s.getContext("2d", { willReadFrequently: true })!;
      await paintBase(c, 48, 48, { ...doc, layers: { ...doc.layers, shadow: false } });
      const px = c.getImageData(14, 20, 20, 20).data;
      let light = 0, warm = 0;
      for (let i = 0; i < px.length; i += 4) { light += px[i] * 0.2126 + px[i + 1] * 0.7152 + px[i + 2] * 0.0722; warm += px[i] - px[i + 2]; }
      const lum = light / (px.length / 4), temp = warm / (px.length / 4);
      const f = `brightness(${lum < 75 ? 0.8 : lum < 145 ? 0.92 : 1}) contrast(${lum < 110 ? 1.12 : 1.04}) saturate(.96) sepia(${temp > 12 ? 0.08 : 0})`;
      commit((d) => ({ ...d, aligned: f }));
      setNotice("Can lighting matched to the scene. The can artwork itself is unchanged.");
    } catch { setNotice("Could not read the background."); }
  }

  function beginDrag(e: React.PointerEvent, key: OverlayKey, mode: "move" | "resize") {
    e.preventDefault(); e.stopPropagation();
    setSelected(key);
    setTab(overlayMeta[key].tab);
    const rect = boardRef.current!.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, start = doc.t[key], gk = `drag-${key}-${Date.now()}`;
    const move = (ev: PointerEvent) => {
      if (mode === "move") {
        let x = start.x + ((ev.clientX - sx) / rect.width) * 100, y = start.y + ((ev.clientY - sy) / rect.height) * 100;
        if (Math.abs(x - 50) < 1.2) x = 50; // centre snap
        setT(key, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }, gk);
      } else {
        const delta = ((ev.clientX - sx) / rect.width + (ev.clientY - sy) / rect.height) * 0.9;
        setT(key, { scale: Math.max(0.2, Math.min(3, start.scale + delta)) }, gk);
      }
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }

  const renderDoc = async (c: CanvasRenderingContext2D, W: number, H: number, d: Doc, anim?: Anim) => {
      if (d.format === "jpg") { c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); }
      await paintBase(c, W, H, d, anim);
      const sku = products[d.product].color;
      const drawMark = async (src: string, x: number, y: number, w: number, h: number, mc: MarkColour = d.markColour) => {
        const img = await loadImg(src);
        const off = document.createElement("canvas"); off.width = Math.max(1, Math.round(w)); off.height = Math.max(1, Math.round(h));
        const o = off.getContext("2d")!;
        o.drawImage(img, 0, 0, off.width, off.height);
        o.globalCompositeOperation = "source-in";
        if (mc === "silver") {
          // same angle and stops as the CSS gradient
          const g = o.createLinearGradient(0, 0, off.width, off.height * 0.6);
          [["#f2f2f2", 0], ["#b9b9b9", 0.45], ["#e2e2e2", 0.7], ["#9d9d9d", 1]].forEach(([c, t]) => g.addColorStop(t as number, c as string));
          o.fillStyle = g;
        } else o.fillStyle = markCss(mc, sku);
        o.fillRect(0, 0, off.width, off.height);
        c.drawImage(off, x, y, w, h);
      };
      const drawText = (k: "header" | "sub") => {
        const cfg = d[k], t = d.t[k];
        let lines = linesOf(cfg.text, cfg.caps);
        const fs = (cfg.size / 100) * W * t.scale;
        const lh = fs * (k === "header" ? 1.02 : 1.3), boxW = W * (k === "header" ? 0.86 : 0.76) * t.scale;
        const cx = (W * t.x) / 100, top = (H * t.y) / 100 - (lines.length * lh) / 2;
        if (k === "header" && anim?.kind === "typeon") {
          const total = lines.join("").length, shown = Math.floor(total * Math.min(1, anim.t / 0.45));
          let left = shown; lines = lines.map((ln) => { const s2 = ln.slice(0, Math.max(0, left)); left -= ln.length; return s2; });
        }
        c.save();
        if (anim?.kind === "typeon") c.globalAlpha = anim.t > 0.9 ? (1 - anim.t) / 0.1 : 1;
        c.fillStyle = toneHex[d.tone];
        c.font = k === "header" ? `500 ${fs}px Fredoka` : `600 ${fs}px Inter`;
        (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = k === "sub" && cfg.caps ? `${fs * 0.16}px` : k === "header" ? `${fs * -0.01}px` : "0px";
        c.textAlign = cfg.align === "center" ? "center" : "left";
        c.textBaseline = "middle";
        const x = cfg.align === "center" ? cx : cx - boxW / 2;
        lines.forEach((ln, i) => c.fillText(ln, x, top + (i + 0.5) * lh + fs * 0.04));
        c.restore();
      };
      for (const k of d.order) {
        if (!d.layers[overlayMeta[k].layer]) continue;
        const t = d.t[k], cx = (W * t.x) / 100, cy = (H * t.y) / 100;
        if (k === "radial" && d.product !== "lineup") {
          const r = await loadImg(products[d.product].radial), rw = W * 0.58 * t.scale, rh = (rw * r.height) / r.width;
          c.save(); c.globalAlpha = 0.76; c.globalCompositeOperation = "multiply"; c.drawImage(r, cx - rw / 2, cy - rh / 2, rw, rh); c.restore();
        } else if (k === "product") {
          const img = await loadImg(d.product === "lineup" ? "/assets/can-lineup.png" : `/assets/can-${d.product}.png`);
          const b = canBox(W, H, d);
          c.save(); c.filter = d.aligned ?? "none"; c.drawImage(img, b.cx - b.w / 2, b.cy - b.h / 2, b.w, b.h); c.restore();
          if (d.fg && d.bgSource === "image") { const f = await loadImg(d.fg); const g = bgPlace(d, W, H, f.width, f.height); c.drawImage(f, g.x, g.y, g.w, g.h); }
        } else if (k === "icon" || k === "wordmark") {
          const m = k === "icon" ? ICON : WORD, w = W * (k === "icon" ? iconW : wordW) * t.scale, h = w / m.a;
          await drawMark(m.src, cx - w / 2, cy - h / 2, w, h);
        } else if (k === "lockup") {
          const g = lockupGeom(d.lockup.layout, d.lockup.spacing, !!d.lockup.tagline), s2 = W * t.scale, x0 = cx - (g.w * s2) / 2, y0 = cy - (g.h * s2) / 2;
          await drawMark(ICON.src, x0 + g.icon.x * s2, y0 + g.icon.y * s2, g.icon.w * s2, g.icon.h * s2);
          await drawMark(WORD.src, x0 + g.word.x * s2, y0 + g.word.y * s2, g.word.w * s2, g.word.h * s2);
          if (g.tag) await drawMark(TAG.src, x0 + g.tag.x * s2, y0 + g.tag.y * s2, g.tag.w * s2, g.tag.h * s2, d.tagColour ?? "flavour");
        } else if (k === "tagline") {
          const w = W * tagW * t.scale, h = w / TAG.a;
          await drawMark(TAG.src, cx - w / 2, cy - h / 2, w, h, d.tagColour ?? "flavour");
        } else if (k === "header" || k === "sub") drawText(k);
      }
      for (const st of d.stickers) if (st.repeat === "none") await drawStickerLayer(c, W, H, d, st);
  };
  const fontsReady = () => Promise.all([document.fonts.load(`500 40px Fredoka`), document.fonts.load(`600 20px Inter`)]);
  const renderToCanvas = async (d: Doc, W: number, H: number) => {
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    await renderDoc(cv.getContext("2d")!, W, H, d);
    return cv;
  };
  const guarded = (fn: () => void, extra: string[] = []) => () => { const issues = checkDoc(doc, extra); if (issues.length) setGate({ issues, run: fn }); else fn(); };
  async function exportArt() {
    setBusy(true);
    try {
      await fontsReady();
      const cv = await renderToCanvas(doc, out.w, out.h), blob = await toBlob(cv, doc.format);
      downloadBlob(blob, `flowerful-${doc.product}-${out.w}x${out.h}.${doc.format}`);
      setNotice(`Downloaded ${out.w} × ${out.h} ${doc.format.toUpperCase()} (${Math.round(blob.size / 1024)} KB).`);
    } catch { setNotice("Export failed. Reload and try again."); }
    finally { setBusy(false); }
  }
  async function exportAllSizes() {
    setBusy(true);
    try {
      await fontsReady();
      const files = [];
      for (const id of ["ig-square", "ig-portrait", "ig-story"]) {
        const o = outputs.find((x) => x.id === id)!, d2 = reflow(doc, doc.output, id);
        files.push({ name: `flowerful-${doc.product}-${o.ratio.replace(":", "x")}-${o.w}x${o.h}.${doc.format}`, blob: await toBlob(await renderToCanvas(d2, o.w, o.h), doc.format) });
      }
      const zip = await makeZip(files);
      downloadBlob(zip, `flowerful-${doc.product}-all-sizes.zip`);
      setNotice(`Downloaded 1:1, 4:5 and 9:16 as a zip (${Math.round(zip.size / 1024)} KB). Story text kept inside the safe zones.`);
    } catch { setNotice("Export failed. Reload and try again."); }
    finally { setBusy(false); }
  }
  async function recordMotion() {
    if (typeof MediaRecorder === "undefined") { setNotice("This browser cannot record video."); return; }
    setBusy(true); setProgress(0);
    try {
      await fontsReady();
      const W = 1080, H = Math.round((1080 * out.h) / out.w), ms = motionSecs * 1000;
      const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      const c = cv.getContext("2d")!;
      const mp4 = ["video/mp4;codecs=avc1.42E01F", "video/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
      const mime = mp4 ?? ["video/webm;codecs=vp9", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "video/webm";
      // pre-render each frame offscreen, then blit, so the stream never sees a half-drawn frame
      const buf = document.createElement("canvas"); buf.width = W; buf.height = H;
      const bc = buf.getContext("2d")!;
      await renderDoc(bc, W, H, doc, { kind: motion, t: 0 }); c.drawImage(buf, 0, 0);
      const stream = cv.captureStream(30), rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
      const chunks: Blob[] = []; rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const done = new Promise<void>((ok) => (rec.onstop = () => ok()));
      rec.start(250);
      const start = performance.now();
      for (;;) {
        const el = performance.now() - start;
        if (el >= ms) break;
        bc.clearRect(0, 0, W, H);
        await renderDoc(bc, W, H, doc, { kind: motion, t: el / ms });
        c.drawImage(buf, 0, 0);
        setProgress(el / ms);
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      }
      rec.stop(); await done; stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: mime.split(";")[0] }), ext = mp4 ? "mp4" : "webm";
      downloadBlob(blob, `flowerful-${doc.product}-${motion}-${W}x${H}.${ext}`);
      setNotice(`Video ready: ${ext.toUpperCase()}, ${motionSecs}s, ${Math.round(blob.size / 1024)} KB.${mp4 ? "" : " This browser records WebM only; Instagram may need MP4, so convert or record in a Chromium browser that supports MP4."}`);
    } catch { setNotice("Video recording failed. Try again or switch preset."); }
    finally { setBusy(false); setProgress(null); }
  }
  // carousel
  const carouselOn = doc.carousel.slides.length > 0;
  const applySlide = (d: Doc, i: number): Doc => {
    const sl = d.carousel.slides[i];
    if (!sl) return d;
    const b = d.carousel.base ?? { t: d.t, size: d.header.size };
    const base = { ...d, output: d.carousel.size, carousel: { ...d.carousel, active: i, base: b } };
    const sd = slideDoc({ ...base, t: b.t, header: { ...base.header, size: b.size } }, sl);
    return { ...base, header: sd.header, sub: sd.sub, layers: sd.layers, t: sd.t };
  };
  function startCarousel(kind: "flourish" | "focus" | "blank") {
    const slides = kind === "blank" ? [0, 1, 2].map(() => ({ header: doc.header.text, sub: doc.sub.text, can: true })) : storyTemplates[kind].slides;
    commit((d) => {
      const d0 = kind === "blank" ? d : { ...d, product: kind as ProductKey, ...(d.bgPreset ? { bg: defaultPresetFor(kind), bgPreset: bgPresets.find((x) => x.group.toLowerCase() === kind)?.id ?? d.bgPreset } : {}) };
      const d1 = reflow(d0, d0.output, d.carousel.size);
      return applySlide({ ...d1, carousel: { slides, active: 0, size: d.carousel.size, base: { t: d1.t, size: d1.header.size } } }, 0);
    });
    if (kind !== "blank") setCopyTab(groupForProduct(kind));
  }
  const updateSlide = (i: number, v: Partial<Slide>, key: string) => commit((d) => {
    const slides = d.carousel.slides.map((sl, j) => (j === i ? { ...sl, ...v } : sl));
    const nd = { ...d, carousel: { ...d.carousel, slides } };
    return i === d.carousel.active ? applySlide(nd, i) : nd;
  }, key);
  function moveSlide(i: number, dir: number) {
    commit((d) => { const s2 = [...d.carousel.slides], j = i + dir; if (j < 0 || j >= s2.length) return d; [s2[i], s2[j]] = [s2[j], s2[i]]; return applySlide({ ...d, carousel: { ...d.carousel, slides: s2 } }, j); });
  }
  async function exportCarousel() {
    setBusy(true);
    try {
      await fontsReady();
      const o = outputs.find((x) => x.id === doc.carousel.size)!, files = [];
      const cb = doc.carousel.base ?? { t: doc.t, size: doc.header.size };
      const base = reflow({ ...doc, t: cb.t, header: { ...doc.header, size: cb.size } }, doc.output, o.id);
      for (const [i, sl] of doc.carousel.slides.entries()) {
        const d2 = slideDoc(base, sl);
        files.push({ name: `flowerful-${doc.product}-carousel-${String(i + 1).padStart(2, "0")}.${doc.format === "webp" ? "png" : doc.format}`, blob: await toBlob(await renderToCanvas(d2, o.w, o.h), doc.format === "webp" ? "png" : doc.format) });
      }
      const zip = await makeZip(files);
      downloadBlob(zip, `flowerful-${doc.product}-carousel-${o.ratio.replace(":", "x")}.zip`);
      setNotice(`Carousel downloaded: ${files.length} slides at ${o.w} × ${o.h} (${Math.round(zip.size / 1024)} KB).`);
    } catch { setNotice("Carousel export failed."); }
    finally { setBusy(false); }
  }


  const txt = (k: "header" | "sub") => {
    const cfg = doc[k];
    return (
      <div className={`textbox ${k}`} style={{ width: `${k === "header" ? 86 : 76}cqw`, textAlign: cfg.align, color: toneHex[doc.tone], fontSize: `${cfg.size}cqw` }}>
        {linesOf(cfg.text, cfg.caps).map((ln, i) => <div key={i} className={cfg.caps && k === "sub" ? "caps" : ""}>{ln || "\u00a0"}</div>)}
      </div>
    );
  };  const sel = (k: OverlayKey) => selected === k;
  const markStyle = (src: string, w: number, h: number, mc: MarkColour = doc.markColour): React.CSSProperties => ({
    width: `${w}cqw`, height: `${h}cqw`, background: markCss(mc, p.color),
    WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%",
  });
  const renderOverlay = (k: OverlayKey) => {
    const common = { id: k, t: doc.t[k], selected: sel(k), onStart: beginDrag };
    if (k === "radial") return doc.product === "lineup" ? null : <Overlay key={k} {...common} className="o-radial"><img src={p.radial} alt="" /></Overlay>;
    if (k === "product") return (
      <Overlay key={k} {...common} className={doc.product === "lineup" ? "o-lineup" : "o-can"}>
        <img src={doc.product === "lineup" ? "/assets/can-lineup.png" : `/assets/can-${doc.product}.png`} alt={`${p.name} can`} style={{ filter: doc.aligned ?? "none" }}
          onLoad={(e) => { const i = e.currentTarget; const a = i.naturalWidth / i.naturalHeight; setCanAspect((m) => (m[doc.product] === a ? m : { ...m, [doc.product]: a })); }} />
      </Overlay>
    );
    if (k === "icon") return <Overlay key={k} {...common} className="o-mark"><i style={markStyle(ICON.src, iconW * 100, (iconW * 100) / ICON.a)} /></Overlay>;
    if (k === "wordmark") return <Overlay key={k} {...common} className="o-mark"><i style={markStyle(WORD.src, wordW * 100, (wordW * 100) / WORD.a)} /></Overlay>;
    if (k === "tagline") return <Overlay key={k} {...common} className="o-mark"><i style={markStyle(TAG.src, tagW * 100, (tagW * 100) / TAG.a, doc.tagColour ?? "flavour")} /></Overlay>;
    if (k === "lockup") {
      const g = lockupGeom(doc.lockup.layout, doc.lockup.spacing, !!doc.lockup.tagline);
      return (
        <Overlay key={k} {...common} className="o-mark">
          <div style={{ position: "relative", width: `${g.w * 100}cqw`, height: `${g.h * 100}cqw` }}>
            <i style={{ ...markStyle(ICON.src, g.icon.w * 100, g.icon.h * 100), position: "absolute", left: `${g.icon.x * 100}cqw`, top: `${g.icon.y * 100}cqw` }} />
            <i style={{ ...markStyle(WORD.src, g.word.w * 100, g.word.h * 100), position: "absolute", left: `${g.word.x * 100}cqw`, top: `${g.word.y * 100}cqw` }} />
            {g.tag && <i style={{ ...markStyle(TAG.src, g.tag.w * 100, g.tag.h * 100, doc.tagColour ?? "flavour"), position: "absolute", left: `${g.tag.x * 100}cqw`, top: `${g.tag.y * 100}cqw` }} />}
          </div>
        </Overlay>
      );
    }
    return <Overlay key={k} {...common} className="o-text">{txt(k)}</Overlay>;
  };
  // ---------- v3 actions ----------
  const setSet = (v: Partial<SetSettings>, key: string | null = null) => commit((d) => fitCan({ ...d, set: { ...d.set, ...v } }), key);
  const updSticker = (id: string, v: Partial<StickerLayer>, key: string | null = null) => commit((d) => ({ ...d, stickers: d.stickers.map((x) => (x.uid === id ? { ...x, ...v } : x)) }), key);
  function addSticker(kind: string) {
    const st = makeSticker(kind, 50 + (Math.random() - 0.5) * 40, 44 + (Math.random() - 0.5) * 20, doc.product);
    commit((d) => ({ ...d, stickers: [...d.stickers, st] }));
    setSelSticker(st.uid); setSelected(null);
  }
  function doShuffle() {
    const r = shuffleDoc(doc, locks);
    commit(() => r.doc);
    setShuffles((n) => n + 1); setSelSticker(null); setSelected(null);
    setNotice(`Shuffled: ${r.doc.set.on ? setShapes.find((x) => x[0] === r.doc.set.shape)![1].toLowerCase() + " set, " : ""}${layoutKinds.find((x) => x[0] === r.layout)![1].toLowerCase()} layout, ${r.doc.stickers.filter((x) => x.repeat === "none").length} sticker(s).`);
  }
  function beginStickerDrag(e: React.PointerEvent, st: StickerLayer, mode: "move" | "resize" | "rotate") {
    e.preventDefault(); e.stopPropagation();
    setSelSticker(st.uid); setSelected(null); setTab("stickers");
    const rect = boardRef.current!.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, gk = `sd-${st.uid}-${Date.now()}`;
    const cx = rect.left + (rect.width * st.x) / 100, cy = rect.top + (rect.height * st.y) / 100;
    const move = (ev: PointerEvent) => {
      if (mode === "move") updSticker(st.uid, { x: Math.max(0, Math.min(100, st.x + ((ev.clientX - sx) / rect.width) * 100)), y: Math.max(0, Math.min(100, st.y + ((ev.clientY - sy) / rect.height) * 100)) }, gk);
      else if (mode === "resize") updSticker(st.uid, { scale: Math.max(0.15, Math.min(4, st.scale * (Math.hypot(ev.clientX - cx, ev.clientY - cy) / Math.max(8, Math.hypot(sx - cx, sy - cy))))) }, gk);
      else updSticker(st.uid, { rot: Math.round(((Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90 + 360) % 360) > 180 ? Math.round(((Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90 + 360) % 360) - 360 : Math.round(((Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90 + 360) % 360) }, gk);
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }
  const renderSticker = (st: StickerLayer) => {
    const def = stickerById(st.kind); if (!def) return null;
    const pal = paletteFor(def, st.colour, p.color), w = 16 * st.scale, h = w / (def.aspect ?? 1), on = selSticker === st.uid;
    const fs = def.textArea && st.text ? badgeFs(def, st.text, w) : 0;
    return (
      <div key={st.uid} className={`ov o-sticker ${on ? "sel" : ""}`} style={{ left: `${st.x}%`, top: `${st.y}%`, width: `${w}cqw`, height: `${h}cqw`, opacity: st.opacity, transform: `translate(-50%, -50%) rotate(${st.rot}deg)` }} onPointerDown={(e) => beginStickerDrag(e, st, "move")}>
        <img src={svgUrl(stickerSvg(def.id, pal))} alt={def.name} style={{ transform: st.flip ? "scaleX(-1)" : undefined }} draggable={false} />
        {def.textArea && st.text && (
          <div className="st-text" style={{ left: `${def.textArea.x * 100}%`, top: `${def.textArea.y * 100}%`, fontSize: `${fs}cqw`, color: badgeTextColour(def, pal), letterSpacing: `${fs * badgeTracking}cqw`, fontFamily: "Inter, sans-serif", lineHeight: 1.2, paddingLeft: `${fs * badgeTracking}cqw` }}>
            {st.text.split("\n").map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}
        {on && <>
          <button className="handle" aria-label="Resize sticker" onPointerDown={(e) => beginStickerDrag(e, st, "resize")} />
          <button className="handle rot" aria-label="Rotate sticker" onPointerDown={(e) => beginStickerDrag(e, st, "rotate")} />
        </>}
      </div>
    );
  };
  async function exportSeries() {
    setBusy(true);
    try {
      await fontsReady();
      const list: ProductKey[] = seriesSoon ? ["flow", "flourish", "focus", "float"] : ["flourish", "focus"], files = [];
      for (const pk of list) {
        const d2 = seriesDoc(doc, pk);
        files.push({ name: `flowerful-series-${String(files.length + 1).padStart(2, "0")}-${pk}-${out.w}x${out.h}.${doc.format}`, blob: await toBlob(await renderToCanvas(d2, out.w, out.h), doc.format) });
      }
      const zip = await makeZip(files);
      downloadBlob(zip, `flowerful-flavour-world-series-${out.ratio.replace(":", "x")}.zip`);
      setNotice(`Flavour world series: ${list.map((x) => products[x].name).join(", ")} in one zip (${Math.round(zip.size / 1024)} KB).`);
    } catch { setNotice("Series export failed."); }
    finally { setBusy(false); }
  }
  const [seriesThumbs, setSeriesThumbs] = useState<string[]>([]);
  useEffect(() => {
    if (tab !== "export") return;
    let dead = false;
    const id = setTimeout(async () => {
      await fontsReady();
      const W = 150, H = Math.round((150 * out.h) / out.w), urls: string[] = [];
      for (const pk of (seriesSoon ? ["flow", "flourish", "focus", "float"] : ["flourish", "focus"]) as ProductKey[]) urls.push((await renderToCanvas({ ...seriesDoc(doc, pk), format: "jpg" }, W, H)).toDataURL("image/jpeg", 0.8));
      if (!dead) setSeriesThumbs(urls);
    }, 400);
    return () => { dead = true; clearTimeout(id); };
  }, [doc, tab, seriesSoon]); // eslint-disable-line react-hooks/exhaustive-deps
  const openWizard = () => setWiz({ step: 0, product: doc.product === "lineup" ? "flourish" : doc.product, goal: "intro", format: "ig-portrait", style: "plinth", layout: "centre", line: headerLines[groupOf(doc.product)][0], props: true, stickers: true, logo: "wordmark" });
  function finishWizard(w: Wizard) {
    let d = composeGuided(doc, w);
    if (w.format === "carousel" && (w.product === "flourish" || w.product === "focus")) {
      const slides = storyTemplates[w.product].slides;
      d = { ...d, carousel: { slides, active: 0, size: "ig-portrait", base: { t: d.t, size: d.header.size } } };
      d = applySlide(d, 0);
    }
    commit(() => d);
    if (w.format === "reel" || w.style === "reveal") { setMotion(w.style === "reveal" ? "reveal" : "drift"); setTab("motion"); setMotionPreview(true); }
    else if (w.format === "carousel") setTab("carousel");
    else setTab("set");
    setWiz(null);
    const issues = checkDoc(d);
    setNotice(issues.length ? `Post ready. Safety check: ${issues.length} note(s), shown before export.` : "Post ready. Safety check passed.");
  }
  const moveLayer = (k: OverlayKey, dir: 1 | -1) => commit((d) => {
    const o = [...d.order], i = o.indexOf(k), j = i + dir;
    if (j < 0 || j >= o.length) return d;
    [o[i], o[j]] = [o[j], o[i]];
    return { ...d, order: o };
  });


  return (
    <main className="app">
      <header className="top">
        <div className="brand">
          <img src="/assets/brand-mark-black.png" alt="" />
          <span className="wm">flowerful</span>
          <span className="sub">creative studio</span>
        </div>
        <div className="tb">
          <button className="ghost icon" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"><Undo2 /> Undo</button>
          <button className="ghost icon" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)"><Redo2 /> Redo</button>
          <span className="sep" />
          <button className="ghost" onClick={() => { if (confirm("Start a fresh design? Undo can bring it back.")) commit(() => initialDoc); }}><RotateCcw /> New</button>
          <button className="ghost wiz-btn" onClick={openWizard}><WandSparkles /> Create a post</button>
          <button className="primary" onClick={guarded(exportArt)} disabled={busy}><Download /> {busy ? "Preparing…" : `Download ${doc.format.toUpperCase()}`}</button>
        </div>
      </header>
      <div className="work">
        <aside className="left panel">
          <div className="ph"><Layers3 /> Layers</div>
          <div className="layers">
            {[...doc.order].reverse().filter((k) => !(k === "radial" && doc.product === "lineup")).map((k, idx, arr) => {
              const m = overlayMeta[k], on = doc.layers[m.layer];
              return (
                <div key={k} className={`layer ${sel(k) ? "on" : ""} ${on ? "" : "off"}`} onClick={() => { setTab(m.tab); setSelected(k); }}>
                  <button className="eye" title={on ? "Hide" : "Show"} onClick={(e) => { e.stopPropagation(); toggleLayer(m.layer); }}>{on ? <Eye /> : <EyeOff />}</button>
                  <span>{m.label}</span>
                  <span className="mv">
                    <button title="Bring forward" disabled={idx === 0} onClick={(e) => { e.stopPropagation(); moveLayer(k, 1); }}><ChevronUp /></button>
                    <button title="Send backward" disabled={idx === arr.length - 1} onClick={(e) => { e.stopPropagation(); moveLayer(k, -1); }}><ChevronDown /></button>
                  </span>
                </div>
              );
            })}
            {fixedLayers.map((l) => (
              <div key={l.key} className={`layer fixed ${doc.layers[l.key] ? "" : "off"}`} onClick={() => setTab(l.tab)}>
                <button className="eye" title={doc.layers[l.key] ? "Hide" : "Show"} onClick={(e) => { e.stopPropagation(); toggleLayer(l.key); }}>{doc.layers[l.key] ? <Eye /> : <EyeOff />}</button>
                <span>{l.label}</span>
                {l.key === "background" && <i className="sw" style={{ background: doc.bgSource === "image" && doc.image ? `center/cover url(${doc.image})` : `linear-gradient(135deg, ${doc.bg.c1}, ${doc.bg.c2})` }} />}
              </div>
            ))}
          </div>
          <div className="ph small">Product</div>
          <div className="prod-list">
            {(Object.keys(products) as ProductKey[]).map((k) => (
              <button key={k} className={doc.product === k ? "on" : ""} onClick={() => pickProduct(k)} style={{ "--sku": products[k].color } as React.CSSProperties}>
                <i /> <b>{products[k].name}</b>{products[k].soon && <small>soon</small>}
              </button>
            ))}
          </div>
          <p className="hint">Click a layer on the artboard to select it. Drag to move, corner to resize, arrow keys to nudge, Delete to hide.</p>
        </aside>

        <section className="stage">
          <div className="sizes">
            {outputs.map((o) => (
              <button key={o.id} className={doc.output === o.id ? "on" : ""} onClick={() => commit((d) => reflow(d, d.output, o.id))}>
                <span className="r" style={{ aspectRatio: `${o.w}/${o.h}` }} /><b>{o.ratio}</b><small>{o.label}</small>
              </button>
            ))}
          </div>
          <div className={`shell ${bgEdit ? "bg-edit" : ""}`} ref={shellRef} style={bgEdit ? { cursor: "grab" } : undefined}
            onPointerDown={(e) => {
              setSelected(null); setSelSticker(null);
              // drag the plate: in edit mode anywhere, otherwise on empty canvas (no layer under the pointer)
              const empty = e.target === baseRef.current || e.target === boardRef.current;
              if ((bgEdit || empty) && doc.bgSource === "image" && doc.image && doc.layers.background) {
                let b = curBgT();
                if (b.z < 1.02) { b = { ...b, z: 1.15 }; setBgT({ z: 1.15 }, "bgpan"); } // a plate that exactly fits has nothing to pan, so give it a little room
                bgDrag.current = { px: e.clientX, py: e.clientY, x: b.x, y: b.y, z: b.z };
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              }
            }}
            onPointerMove={(e) => {
              const g = bgDrag.current, el = boardRef.current; if (!g || !el) return;
              const r = el.getBoundingClientRect(), dm = bgDims.current ?? { w: r.width, h: r.height };
              const s = Math.max(r.width / dm.w, r.height / dm.h) * g.z, sx = (dm.w * s) / r.width - 1, sy = (dm.h * s) / r.height - 1;
              setBgT({ x: sx > 0.001 ? g.x + (2 * (e.clientX - g.px)) / r.width / sx : g.x, y: sy > 0.001 ? g.y + (2 * (e.clientY - g.py)) / r.height / sy : g.y }, "bgpan");
            }}
            onPointerUp={() => { bgDrag.current = null; }}
            onDoubleClick={(e) => { if ((e.target === baseRef.current || e.target === boardRef.current || e.target === shellRef.current || bgEdit) && doc.bgSource === "image" && doc.image) { setBgEdit(true); setTab("background"); } }}
            onWheel={(e) => { if (bgEdit && doc.bgSource === "image" && doc.image) setBgT({ z: curBgT().z * (e.deltaY < 0 ? 1.05 : 1 / 1.05) }, "bgzoom"); }}>
            {bgEdit && <button className="primary bg-done" onPointerDown={(e) => e.stopPropagation()} onClick={() => setBgEdit(false)}>Done moving background</button>}
            <div className="artboard" ref={boardRef} style={{ width: board.w, height: board.h }}>
              <canvas ref={baseRef} className="base" />
              {doc.order.map((k) => doc.layers[overlayMeta[k].layer] && (k === "product" && doc.fg && doc.bgSource === "image" ? <Fragment key={k}>{renderOverlay(k)}<img key="fg" src={doc.fg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", ...(() => { const t = doc.bgT && doc.bgT.src === doc.image ? doc.bgT : { x: 0, y: 0, z: 1 }; const o = `${((1 - t.x) / 2) * 100}% ${((1 - t.y) / 2) * 100}%`; return { objectPosition: o, transformOrigin: o, transform: `scale(${Math.max(1, t.z)})` }; })() }} /></Fragment> : renderOverlay(k)))}
              {doc.stickers.filter((x) => x.repeat === "none").map(renderSticker)}
              {doc.output === "ig-story" && showSafe && (
                <>
                  <div className="safe top" style={{ height: `${STORY_TOP * 100}%` }}><span>Story UI · keep clear</span></div>
                  <div className="safe bottom" style={{ height: `${STORY_BOTTOM * 100}%` }}><span>Reply bar · keep clear</span></div>
                </>
              )}
              {selected && <div className="guide" style={{ left: `${doc.t[selected].x}%`, opacity: doc.t[selected].x === 50 ? 1 : 0 }} />}
            </div>
          </div>
          <div className="shuffle-bar">
            <button className="primary" onClick={doShuffle}><Shuffle /> Shuffle</button>
            {(Object.keys(locks) as Array<keyof Locks>).map((k) => (
              <button key={k} className={`lock ${locks[k] ? "on" : ""}`} onClick={() => setLocks((l) => ({ ...l, [k]: !l[k] }))} title={locks[k] ? `Keep ${k}` : `Shuffle ${k}`}>
                {locks[k] ? <Lock /> : <LockOpen />} {k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
          <div className="stage-foot">
            <span>{out.label} · {out.w} × {out.h}px</span>
            {doc.output === "ig-story" && <button className={`ghost small ${showSafe ? "on" : ""}`} onClick={() => setShowSafe((v) => !v)}>Safe zones {showSafe ? "on" : "off"}</button>}
            {carouselOn && <span className="slide-tag">Slide {doc.carousel.active + 1} of {doc.carousel.slides.length}</span>}
            {notice && <span className="notice"><Sparkles /> {notice}</span>}
          </div>
        </section>

        <aside className="right panel">
          <nav className="tabs">{tabs.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</nav>
          <div className="pane">
            {tab === "set" && (
              <>
                <div className="card"><div className="card-h"><b>Plinth and set</b><Switch on={doc.set.on} onClick={() => setSet({ on: !doc.set.on })} /></div><small>Geometric blocks lit from the side with long crisp shadows. The can stands on top and follows when you drag it sideways.</small></div>
                <Group label="Set presets">
                  <div className="set-presets">
                    {setPresets.map((sp) => (
                      <button key={sp.name} className={doc.set.on && doc.set.shape === sp.shape && doc.set.props === sp.props ? "on" : ""} onClick={() => commit((d) => { const pals = setPalettes[d.product] ?? setPalettes.lineup, pl = pals[sp.pal % pals.length]; return fitCan({ ...d, set: { ...d.set, on: true, shape: sp.shape, props: sp.props, wall: pl.wall, block: sp.two ? pals[(sp.pal + 1) % pals.length].block : pl.block, light: sp.light, floor: sp.floor ?? d.set.floor, world: true } }); })}>
                        <SetThumb s={{ ...doc.set, on: true, shape: sp.shape, props: sp.props, wall: (setPalettes[doc.product] ?? setPalettes.lineup)[sp.pal % (setPalettes[doc.product] ?? setPalettes.lineup).length].wall, block: (setPalettes[doc.product] ?? setPalettes.lineup)[(sp.pal + (sp.two ? 1 : 0)) % (setPalettes[doc.product] ?? setPalettes.lineup).length].block, light: sp.light }} />
                        <span>{sp.name}</span>
                      </button>
                    ))}
                  </div>
                </Group>
                {doc.set.on && (
                  <>
                    <Group label="Shape">
                      <div className="seg wrap">{setShapes.map(([k, l]) => <button key={k} className={doc.set.shape === k ? "on" : ""} onClick={() => setSet({ shape: k })}>{l}</button>)}</div>
                    </Group>
                    <Group label="Colour world">
                      <div className="swatches">
                        {(setPalettes[doc.product] ?? setPalettes.lineup).map((pl) => <button key={pl.name} title={pl.name} className={doc.set.wall === pl.wall ? "on" : ""} onClick={() => setSet({ wall: pl.wall, block: pl.block })} style={{ background: `linear-gradient(135deg, ${pl.wall} 50%, ${pl.block} 50%)` }} />)}
                      </div>
                      <div className="row"><ColourPick label="Wall" value={doc.set.wall.toUpperCase()} onChange={(v) => setSet({ wall: v }, "set-wall")} /><ColourPick label="Blocks" value={doc.set.block.toUpperCase()} onChange={(v) => setSet({ block: v }, "set-block")} /></div>
                      <label className="chk"><input type="checkbox" checked={doc.set.world} onChange={(e) => setSet({ world: e.target.checked })} /> One-colour world (wall and floor in the set colour)</label>
                    </Group>
                    <Group label="Light comes from">
                      <div className="seg">{(["left", "right"] as const).map((l) => <button key={l} className={doc.set.light === l ? "on" : ""} onClick={() => setSet({ light: l })}>{l === "left" ? "Left" : "Right"}</button>)}</div>
                    </Group>
                    <Range label="Shadow length" min={0} max={100} value={doc.set.shadow} onChange={(v) => setSet({ shadow: v }, "set-sh")} />
                    <Range label="Block size" unit="%" min={60} max={140} value={Math.round(doc.set.size * 100)} onChange={(v) => setSet({ size: v / 100 }, "set-size")} />
                    <Range label="Floor line" unit="%" min={55} max={92} value={doc.set.floor} onChange={(v) => setSet({ floor: v }, "set-floor")} />
                    <Group label="Ingredient props">
                      <div className="seg wrap">{propArrangements.map(([k, l]) => <button key={k} className={doc.set.props === k ? "on" : ""} onClick={() => setSet({ props: k })}>{l}</button>)}</div>
                      {doc.set.props !== "none" && <Range label="Prop size" unit="%" min={50} max={180} value={Math.round(doc.set.propSize * 100)} onChange={(v) => setSet({ propSize: v / 100 }, "set-ps")} />}
                      <p className="hint">{doc.product === "lineup" ? "Props are per flavour; pick a single can to use them." : `${botanicalsFor(doc.product).map((k) => stickerById(k).name.toLowerCase()).join(" and ")}, resting on the floor or plinth with their own shadows.`}</p>
                    </Group>
                  </>
                )}
              </>
            )}

            {tab === "stickers" && (
              <>
                <div className="seg small wrap">{(["Botanicals", "Badges", "Shapes", "Lifestyle"] as StickerGroup[]).map((g) => <button key={g} className={stGroup === g ? "on" : ""} onClick={() => setStGroup(g)}>{g}</button>)}</div>
                <div className="st-grid">
                  {stickers.filter((x) => x.group === stGroup).sort((a, b) => Number(!!b.flavours?.includes(doc.product)) - Number(!!a.flavours?.includes(doc.product))).map((def) => {
                    const pal = paletteFor(def, def.group === "Botanicals" ? "natural" : "flavour", p.color);
                    return (
                      <button key={def.id} title={`Add ${def.name}`} onClick={() => addSticker(def.id)} className={def.flavours?.includes(doc.product) ? "match" : ""}>
                        <span className="st-prev" style={{ aspectRatio: `${def.aspect ?? 1}` }}><img src={svgUrl(stickerSvg(def.id, pal))} alt="" />{def.text && <em style={{ color: badgeTextColour(def, pal) }}>{def.id === "badge-tag" ? p.name : def.text.split("\n")[0]}</em>}</span>
                        <small>{def.name}</small>
                      </button>
                    );
                  })}
                </div>
                <p className="hint">Keep it to 1 to 3 per post. Badges never carry claims; edit the words below.</p>
                {doc.stickers.length > 0 && (
                  <Group label={`On the artboard (${doc.stickers.length})`}>
                    <div className="st-list">
                      {doc.stickers.map((st) => <button key={st.uid} className={selSticker === st.uid ? "on" : ""} onClick={() => setSelSticker(st.uid)}>{stickerById(st.kind).name}{st.repeat !== "none" ? ` · ${st.repeat}` : ""}</button>)}
                    </div>
                  </Group>
                )}
                {(() => {
                  const st = doc.stickers.find((x) => x.uid === selSticker); if (!st) return null;
                  const def = stickerById(st.kind);
                  return (
                    <div className="card">
                      <div className="card-h"><b>{def.name}</b>
                        <span className="row tight">
                          <button className="ghost small" title="Flip" onClick={() => updSticker(st.uid, { flip: !st.flip })}><FlipHorizontal2 /></button>
                          <button className="ghost small" title="Duplicate" onClick={() => { const c2 = { ...st, uid: uid(), x: Math.min(95, st.x + 6), y: Math.min(95, st.y + 4) }; commit((d) => ({ ...d, stickers: [...d.stickers, c2] })); setSelSticker(c2.uid); }}><Copy /></button>
                          <button className="ghost small" title="Remove" onClick={() => { commit((d) => ({ ...d, stickers: d.stickers.filter((x) => x.uid !== st.uid) })); setSelSticker(null); }}><Trash2 /></button>
                        </span>
                      </div>
                      {def.text !== undefined && <textarea rows={2} value={st.text ?? ""} onChange={(e) => updSticker(st.uid, { text: e.target.value.toUpperCase() === e.target.value || def.id === "badge-sugar" ? e.target.value : e.target.value }, `st-t-${st.uid}`)} aria-label="Badge text" />}
                      <div className="seg small">{(["natural", "flavour", "white", "ink"] as StickerColour[]).map((c) => <button key={c} className={st.colour === c ? "on" : ""} onClick={() => updSticker(st.uid, { colour: c })}>{c === "flavour" ? "Can colour" : c[0].toUpperCase() + c.slice(1)}</button>)}</div>
                      <Range label="Size" unit="%" min={15} max={400} value={Math.round(st.scale * 100)} onChange={(v) => updSticker(st.uid, { scale: v / 100 }, `st-s-${st.uid}`)} />
                      <Range label="Rotate" unit="°" min={-180} max={180} value={st.rot} onChange={(v) => updSticker(st.uid, { rot: v }, `st-r-${st.uid}`)} />
                      <Range label="Opacity" unit="%" min={5} max={100} value={Math.round(st.opacity * 100)} onChange={(v) => updSticker(st.uid, { opacity: v / 100 }, `st-o-${st.uid}`)} />
                      <div className="gl">Repeat</div>
                      <div className="seg small">{(["none", "grid", "scatter", "border"] as Repeat[]).map((r) => <button key={r} className={st.repeat === r ? "on" : ""} onClick={() => updSticker(st.uid, { repeat: r, ...(r !== "none" && st.repeat === "none" ? { opacity: Math.min(st.opacity, 0.35), scale: Math.min(st.scale, 0.5) } : {}) })}>{r === "none" ? "Single" : r[0].toUpperCase() + r.slice(1)}</button>)}</div>
                      {st.repeat !== "none" && <Range label="Density" unit="×" min={0.5} max={2.5} step={0.1} value={st.density} onChange={(v) => updSticker(st.uid, { density: v }, `st-d-${st.uid}`)} />}
                    </div>
                  );
                })()}
              </>
            )}

            {tab === "background" && (
              <>
                {doc.bgSource === "image" && doc.image && (
                  <div className="card">
                    <div className="card-h"><b>Plate position</b><button className={`ghost small ${bgEdit ? "on" : ""}`} onClick={() => setBgEdit((v) => !v)}>{bgEdit ? "Done" : "Move background"}</button></div>
                    <p className="hint">{bgEdit ? "Drag the artboard to pan, scroll to zoom. The plate always covers the canvas and never stretches." : "Drag any empty part of the artboard to move the plate, or double-click it for move mode. Kept per artwork and across ratios."}</p>
                    <Range label="Zoom" unit="%" min={100} max={400} value={Math.round(curBgT().z * 100)} onChange={(v) => setBgT({ z: v / 100 }, "bgz")} />
                    <Range label="Pan X" unit="" min={-100} max={100} value={Math.round(curBgT().x * 100)} onChange={(v) => setBgT({ x: v / 100 }, "bgx")} />
                    <Range label="Pan Y" unit="" min={-100} max={100} value={Math.round(curBgT().y * 100)} onChange={(v) => setBgT({ y: v / 100 }, "bgy")} />
                    <button className="ghost" onClick={() => commit((d) => ({ ...d, bgT: undefined }))}>Reset / fit</button>
                  </div>
                )}
                <div className="seg">
                  {([["create", "Create"], ["library", "Library"], ["upload", "Upload"], ["ai", "AI"]] as const).map(([k, l]) => <button key={k} className={bgMode === k ? "on" : ""} onClick={() => setBgMode(k)}>{l}</button>)}
                </div>
                {bgMode === "create" && (
                  <>
                    {doc.bgSource === "image" && doc.image && (
                      <div className="callout">Your image is the background now. <button className="link" onClick={() => commit((d) => ({ ...d, bgSource: "create" }))}>Use the generated one</button></div>
                    )}
                    <Group label="Presets">
                      <div className="presets">
                        {bgPresets.map((pr) => (
                          <button key={pr.id} className={doc.bgPreset === pr.id && doc.bgSource === "create" ? "on" : ""} title={`${pr.group} · ${pr.name}`}
                            onClick={() => commit((d) => ({ ...d, bg: pr.s, bgPreset: pr.id, bgSource: "create", layers: { ...d.layers, background: true } }))}>
                            <PresetThumb s={pr.s} />
                            <span>{pr.name}<small>{pr.group}</small></span>
                          </button>
                        ))}
                      </div>
                    </Group>
                    <Group label="Colours">
                      <div className="colours">
                        <ColourPick value={doc.bg.c1} onChange={(v) => setBg({ c1: v }, "c1")} label="From" />
                        <button className="ghost icon" title="Swap" onClick={() => setBg({ c1: doc.bg.c2, c2: doc.bg.c1 }, "swap" + Date.now())}><ArrowLeftRight /></button>
                        <ColourPick value={doc.bg.c2} onChange={(v) => setBg({ c2: v }, "c2")} label="To" />
                      </div>
                      <div className="chips">
                        {["#0066FF", "#6B4CFF", "#FF6A00", "#F6C9A0", "#E6005C", "#FFC400", "#F3EDE6", "#241A1E"].map((c) => (
                          <button key={c} style={{ background: c }} title={`Set "To" colour ${c}`} onClick={() => setBg({ c2: c }, "chip" + Date.now())} />
                        ))}
                      </div>
                    </Group>
                    <Group label="Style">
                      <div className="seg">
                        {(["linear", "radial", "floor"] as GradientType[]).map((k) => <button key={k} className={doc.bg.type === k ? "on" : ""} onClick={() => setBg({ type: k }, "type" + Date.now())}>{k === "floor" ? "Floor + wall" : k[0].toUpperCase() + k.slice(1)}</button>)}
                      </div>
                    </Group>
                    {doc.bg.type !== "radial" && <Range label="Angle" unit="°" min={0} max={360} value={doc.bg.angle} onChange={(v) => setBg({ angle: v }, "angle")} />}
                    {doc.bg.type === "floor" && <Range label="Horizon" unit="%" min={40} max={85} value={doc.bg.horizon} onChange={(v) => setBg({ horizon: v }, "horizon")} />}
                    <Group label="Light comes from">
                      <div className="seg small">
                        {([["left", "Left"], ["top-left", "Top left"], ["top", "Top"], ["top-right", "Top right"], ["right", "Right"]] as Array<[LightDir, string]>).map(([k, l]) => <button key={k} className={doc.bg.light === k ? "on" : ""} onClick={() => setBg({ light: k }, "light" + Date.now())}>{l}</button>)}
                      </div>
                    </Group>
                    <Range label="Light" unit="%" min={0} max={100} value={doc.bg.lightStrength} onChange={(v) => setBg({ lightStrength: v }, "ls")} />
                    <Range label="Grain" unit="%" min={0} max={100} value={doc.bg.grain} onChange={(v) => setBg({ grain: v }, "grain")} />
                    <Range label="Vignette" unit="%" min={0} max={100} value={doc.bg.vignette} onChange={(v) => setBg({ vignette: v }, "vig")} />
                    <p className="hint">The can shadow follows the light. Switch it off in Layers if you don&apos;t want it.</p>
                  </>
                )}
                {bgMode === "library" && (
                  <>
                    <p className="hint">Scene plates with no can. Your approved can stays its own layer, so you can move and resize it. Cover scenes also add the approved Flowerful lockup as the masthead, plus an editable cover line.</p>
                    {["Illustrated", "Floral photo", "Cover", "Couture", "Gallery", "Vessel", "Plinth", "Cascade", "Arch"].map((g) => {
                      const list = scenes.filter((x) => x.group === g).sort((a, b) => (Number(!!b.hero) - Number(!!a.hero)) || (FLAVOUR_ORDER.indexOf(a.flavour) - FLAVOUR_ORDER.indexOf(b.flavour)));
                      if (!list.length) return null;
                      return (
                        <div key={g}>
                          <h4 style={{ margin: "10px 0 6px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", opacity: 0.7 }}>{g}</h4>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                            {list.map((sc) => (
                              <button key={sc.id} title={sc.id} className={doc.image === sc.src ? "on" : ""} style={{ padding: 0, aspectRatio: "4 / 5", borderRadius: 8, overflow: "hidden", background: `center/cover url(${sc.src})`, outline: doc.image === sc.src ? "2px solid #0066FF" : "none" }}
                                onClick={() => {
                                  commit((d) => {
                                    const mh = sc.masthead; const cp = sc.copy;
                                    return applySceneFormat({
                                      ...d,
                                      image: sc.src,
                                      fg: sc.fg,
                                      bgSource: "image",
                                      aligned: null,
                                      product: sc.flavour,
                                      set: { ...d.set, on: false },
                                      markColour: mh ? mh.colour : d.markColour,
                                      lockup: mh ? { ...d.lockup, layout: "left" as const } : d.lockup,
                                      header: cp ? { ...d.header, text: cp.headers[0], caps: true, align: "center" as Align } : d.header,
                                      sub: cp ? { ...d.sub, text: cp.sub, custom: true, caps: true, align: "center" as Align } : mh ? { ...d.sub, text: mh.line, custom: true, caps: true, align: "center" as Align } : (d.sub.custom ? d.sub : { ...d.sub, text: flavourText(sc.flavour) }),
                                      layers: {
                                        ...d.layers,
                                        background: true,
                                        product: true,
                                        header: cp ? true : mh ? false : d.layers.header,
                                        sub: cp || mh ? true : d.layers.sub,
                                        // Cover masthead is the approved icon + wordmark lockup (movable layer)
                                        wordmark: cp || mh ? false : d.layers.wordmark,
                                        icon: cp || mh ? false : d.layers.icon,
                                        lockup: cp ? false : mh ? true : d.layers.lockup,
                                      },
                                      t: {
                                        ...d.t,
                                        ...(sc.can ? { product: { ...d.t.product, ...sc.can } } : {}),
                                        ...(mh ? {
                                          lockup: { ...d.t.lockup, x: 50, y: mh.lockup_y, scale: mh.lockup_scale },
                                          sub: { ...d.t.sub, x: 50, y: mh.sub_y, scale: 0.95 },
                                        } : {}),
                                        ...(cp ? { header: { ...d.t.header, x: 50 }, sub: { ...d.t.sub, x: 50 } } : {}),
                                      },
                                    }, d.output);
                                  });
                                  setCopyTab(groupForProduct(sc.flavour));
                                  setNotice(sc.copy ? `Illustrated scene: ${sc.copy.story} Header and sub line are pre-filled and editable. Other headers: ${sc.copy.headers.slice(1).join(" / ")}. Best as: ${sc.copy.format}.` : sc.masthead ? "Cover set. Real can, approved Flowerful lockup and cover line are separate layers." : "Scene set. The can is the real approved artwork and stays movable.");
                                }} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                {bgMode === "upload" && (
                  <>
                    <div className="drop" tabIndex={0} onClick={() => uploadRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); }}>
                      <ImagePlus /><b>Drop, click or paste an image</b><small>PNG, JPG or WEBP · Ctrl+V works anywhere</small>
                    </div>
                    <input ref={uploadRef} type="file" accept="image/*" hidden onChange={(e) => loadFile(e.target.files?.[0])} />
                    {doc.image && (
                      <div className="row">
                        <button className="ghost" onClick={() => commit((d) => ({ ...d, bgSource: "image", layers: { ...d.layers, background: true } }))} disabled={doc.bgSource === "image"}><Check /> Use image</button>
                        <button className="ghost" onClick={() => commit((d) => ({ ...d, image: null, bgSource: "create" }))}>Remove image</button>
                      </div>
                    )}
                    <div className="callout"><LockKeyhole /> Keep the top 22% and bottom right 28% clear for logos and text.</div>
                  </>
                )}
                {bgMode === "ai" && (
                  <>
                    <p className="hint">Optional. Builds a photoreal plate from a prompt. Without an API key set on the server, paste a key for this session only or copy the prompt into ChatGPT.</p>
                    <Group label="Theme">
                      <select value={theme} onChange={(e) => { const k = e.target.value as ThemeKey; setTheme(k); setSubtheme(themes[k][0]); }}>
                        {Object.keys(themes).map((x) => <option key={x}>{x}</option>)}
                      </select>
                      <div className="chips text">{themes[theme].map((x) => <button key={x} className={subtheme === x ? "on" : ""} onClick={() => setSubtheme(x)}>{x}</button>)}</div>
                    </Group>
                    <Group label="Describe the moment"><textarea value={scene} onChange={(e) => setScene(e.target.value)} rows={3} /></Group>
                    <Group label="Direction">
                      <button className="ghost wide" onClick={() => setRemix((x) => x + 1)}><RefreshCw /> Remix: {remixDirection}</button>
                    </Group>
                    <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="OpenAI API key (optional, session only)" autoComplete="off" />
                    <div className="row">
                      <button className="primary" onClick={generateInside} disabled={isGenerating}><WandSparkles /> {isGenerating ? "Creating…" : "Generate"}</button>
                      <button className="ghost" onClick={copyPrompt}><ExternalLink /> Copy to ChatGPT</button>
                    </div>
                    <details className="prompt"><summary>Prompt</summary><p>{prompt}</p></details>
                  </>
                )}
              </>
            )}

            {tab === "can" && (
              <>
                <div className="cans">
                  {(Object.keys(products) as ProductKey[]).map((k) => (
                    <button key={k} className={`${doc.product === k ? "on" : ""} ${k === "lineup" ? "wide" : ""}`} onClick={() => pickProduct(k)} style={{ "--sku": products[k].color } as React.CSSProperties}>
                      <img src={k === "lineup" ? "/assets/can-lineup.png" : `/assets/can-${k}.png`} alt="" />
                      <b>{products[k].name}</b><small>{products[k].soon ? "Coming soon" : products[k].flavour}</small>
                    </button>
                  ))}
                </div>
                <Range label="Size" unit="%" min={20} max={300} value={Math.round(doc.t.product.scale * 100)} onChange={(v) => setT("product", { scale: v / 100 })} />
                <div className="row">
                  <button className={`ghost ${doc.layers.shadow ? "on" : ""}`} onClick={() => toggleLayer("shadow")}>{doc.layers.shadow ? <Check /> : null} Contact shadow</button>
                  <button className={`ghost ${doc.aligned ? "on" : ""}`} onClick={alignCan}><WandSparkles /> {doc.aligned ? "Matched to scene" : "Match light to scene"}</button>
                </div>
                <button className="ghost wide" onClick={() => setT("product", initialDoc.t.product, "reset" + Date.now())}>Re-centre can</button>
                <div className="callout"><LockKeyhole /> Can artwork is the locked master. It can be moved and scaled, never redrawn.</div>
                {((doc.product === "lineup" ? [] : [["radial", "Flower radial"]]) as Array<["icon" | "wordmark" | "radial", string]>).filter(([k]) => k === "radial" || doc.layers[k]).map(([k, l]) => (
                  <div key={k} className="card">
                    <div className="card-h"><b>{l}</b><Switch on={doc.layers[k]} onClick={() => toggleLayer(k)} /></div>
                    {doc.layers[k] && <Range label="Size" unit="%" min={20} max={300} value={Math.round(doc.t[k].scale * 100)} onChange={(v) => setT(k, { scale: v / 100 })} />}
                  </div>
                ))}
                <div className="card"><div className="card-h"><b>Colour wash</b><Switch on={doc.layers.wash} onClick={() => toggleLayer("wash")} /></div><small>Tints the background in the {p.name} colour.</small></div>
              </>
            )}

            {tab === "text" && (
              <>
                <TextControls label="Header" on={doc.layers.header} onToggle={() => toggleLayer("header")} align={doc.header.align}
                  onAlign={(a) => commit((d) => ({ ...d, header: { ...d.header, align: a }, t: { ...d.t, header: { ...d.t.header, x: 50 } } }))}
                  caps={doc.header.caps} onCaps={() => commit((d) => ({ ...d, header: { ...d.header, caps: !d.header.caps } }))}
                  size={doc.header.size} min={3} max={14} onSize={(v) => commit((d) => ({ ...d, header: { ...d.header, size: v } }), "hs")}>
                  <textarea className="big" rows={3} value={doc.header.text} placeholder="Type your header. Enter starts a new line."
                    onFocus={() => setSelected("header")}
                    onChange={(e) => { const v = e.target.value; commit((d) => ({ ...d, header: { ...d.header, text: v }, layers: { ...d.layers, header: true } }), "htext"); }} />
                </TextControls>
                <TextControls label="Sub line" on={doc.layers.sub} onToggle={() => toggleLayer("sub")} align={doc.sub.align}
                  onAlign={(a) => commit((d) => ({ ...d, sub: { ...d.sub, align: a } }))}
                  caps={doc.sub.caps} onCaps={() => commit((d) => ({ ...d, sub: { ...d.sub, caps: !d.sub.caps } }))}
                  size={doc.sub.size} min={1} max={6} step={0.1} onSize={(v) => commit((d) => ({ ...d, sub: { ...d.sub, size: v } }), "ss")}>
                  <textarea rows={2} value={doc.sub.text} placeholder="Flavour or support line"
                    onFocus={() => setSelected("sub")}
                    onChange={(e) => { const v = e.target.value; commit((d) => ({ ...d, sub: { ...d.sub, text: v, custom: true }, layers: { ...d.layers, sub: true } }), "stext"); }} />
                  {doc.sub.custom && <button className="link" onClick={() => commit((d) => ({ ...d, sub: { ...d.sub, text: flavourText(d.product), custom: false } }))}><RotateCcw /> Reset to flavour</button>}
                </TextControls>
                <button className="ghost wide" onClick={() => commit((d) => ({ ...d, t: { ...d.t, header: { ...d.t.header, x: 50 }, sub: { ...d.t.sub, x: 50, y: d.t.header.y + (linesOf(d.header.text, true).length * d.header.size * 1.02 * (out.w / out.h)) / 2 + 4 } } }))}>
                  Stack sub line under header
                </button>
                <Group label="Text colour">
                  <div className="seg">
                    {(["white", "silver", "black"] as Tone[]).map((x) => <button key={x} className={doc.tone === x ? "on" : ""} onClick={() => commit((d) => ({ ...d, tone: x }))}><i className="dot" style={{ background: toneHex[x] }} /> {x[0].toUpperCase() + x.slice(1)}</button>)}
                  </div>
                </Group>
                <Group label="Header lines">
                  <div className="seg small">{copyGroups.map((g) => <button key={g} className={copyTab === g ? "on" : ""} onClick={() => setCopyTab(g)}>{g}</button>)}</div>
                  <div className="lines">
                    {headerLines[copyTab].map((l, i) => (
                      <button key={l} className={doc.header.text === l ? "on" : ""} onClick={() => commit((d) => ({ ...d, header: { ...d.header, text: l }, layers: { ...d.layers, header: true } }))}>
                        {l.replace(/\n/g, " ")}{copyTab === "Brand" && i < originalCount && <small>original</small>}
                      </button>
                    ))}
                  </div>
                </Group>
                <Group label="Sub lines">
                  <div className="chips text">
                    {subLines[copyTab].map((l) => <button key={l} className={doc.sub.text === l ? "on" : ""} onClick={() => commit((d) => ({ ...d, sub: { ...d.sub, text: l, custom: true }, layers: { ...d.layers, sub: true } }))}>{l}</button>)}
                  </div>
                </Group>
                <div className="ph" style={{ marginTop: 18 }}>Tagline & logo</div>
                <div className="card">
                  <div className="card-h"><b>Tagline: drink brighter</b></div>
                  <div className="row">
                    <button className={`ghost small ${doc.lockup.tagline ? "on" : ""}`} onClick={() => commit((d) => ({ ...d, lockup: { ...d.lockup, tagline: !d.lockup.tagline }, layers: { ...d.layers, lockup: true } }))}>{doc.lockup.tagline ? "Remove from lockup" : "Add under lockup"}</button>
                    <button className={`ghost small ${doc.layers.tagline ? "on" : ""}`} onClick={() => toggleLayer("tagline")}>{doc.layers.tagline ? "Remove layer" : "Add as own layer"}</button>
                  </div>
                  <div className="seg small">
                    {([["flavour", "Flavour"], ["white", "White"], ["ink", "Ink"], ["silver", "Silver"]] as Array<[MarkColour, string]>).map(([x, l]) => (
                      <button key={x} className={(doc.tagColour ?? "flavour") === x ? "on" : ""} onClick={() => commit((d) => ({ ...d, tagColour: x }))}><i className="dot" style={{ background: markCss(x, p.color) }} /> {l}</button>
                    ))}
                  </div>
                  {doc.layers.tagline && <Range label="Tagline size" unit="%" min={20} max={300} value={Math.round(doc.t.tagline.scale * 100)} onChange={(v) => setT("tagline", { scale: v / 100 })} />}
                  <small className="muted">Set in Fredoka like the can. In the lockup it sits under the wordmark at the can's proportions.</small>
                </div>
                <Group label="Logo colour">
                  <div className="seg">
                    {([["silver", "Matte silver"], ["white", "White"], ["ink", "Ink"], ["flavour", p.name === "LINE-UP" ? "Flavour" : p.name[0] + p.name.slice(1).toLowerCase()]] as Array<[MarkColour, string]>).map(([x, l]) => (
                      <button key={x} className={doc.markColour === x ? "on" : ""} onClick={() => commit((d) => ({ ...d, markColour: x }))}><i className="dot" style={{ background: markCss(x, p.color) }} /> {l}</button>
                    ))}
                  </div>
                </Group>
                <div className="card">
                  <div className="card-h"><b>Logo elements</b></div>
                  <div className="seg small wrap">
                    {([["icon", "Icon"], ["wordmark", "Wordmark"], ["lockup", "Lockup"], ["tagline", "drink brighter"]] as const).map(([k, l]) => (
                      <button key={k} className={doc.layers[k] ? "on" : ""} onClick={() => commit((d) => toggleLogo(d, k))} /* independent */>{l}</button>
                    ))}
                  </div>
                  <small className="muted">Add several at once. Each stays its own layer, so you can put the icon at the top and the wordmark at the bottom. New ones land in a free spot at lockup proportions (icon ~30% of wordmark width).</small>
                </div>
                {doc.layers.lockup && (
                  <div className="card">
                    <div className="card-h"><b>Lockup</b><Switch on onClick={() => toggleLayer("lockup")} /></div>
                    <div className="seg">
                      {([["left", "Icon left"], ["above", "Icon above"]] as const).map(([k, l]) => <button key={k} className={doc.lockup.layout === k ? "on" : ""} onClick={() => commit((d) => ({ ...d, lockup: { ...d.lockup, layout: k, spacing: k === "above" ? 20 : 22 } }))}>{l}</button>)}
                    </div>
                    <Range label="Spacing" unit="%" min={0} max={80} value={doc.lockup.spacing} onChange={(v) => commit((d) => ({ ...d, lockup: { ...d.lockup, spacing: v } }), "lsp")} />
                    <Range label="Size" unit="%" min={20} max={300} value={Math.round(doc.t.lockup.scale * 100)} onChange={(v) => setT("lockup", { scale: v / 100 })} />
                  </div>
                )}
                {([["icon", "Icon"], ["wordmark", "Wordmark"], ["tagline", "drink brighter"]] as Array<[LogoKey, string]>).filter(([k]) => !!doc.layers[k]).map(([k, l]) => (
                  <div key={k} className="card">
                    <div className="card-h"><b>{l}</b><Switch on={!!doc.layers[k]} onClick={() => toggleLayer(k)} /></div>
                    <Range label="Size" unit="%" min={20} max={300} value={Math.round(doc.t[k].scale * 100)} onChange={(v) => setT(k, { scale: v / 100 })} />
                  </div>
                ))}
              </>
            )}


            {tab === "carousel" && (
              <>
                <Group label="Start from">
                  <div className="seg">
                    <button onClick={() => startCarousel("flourish")}>FLOURISH story</button>
                    <button onClick={() => startCarousel("focus")}>FOCUS story</button>
                    <button onClick={() => startCarousel("blank")}>Blank</button>
                  </div>
                  <p className="hint">Five-slide ingredient stories. Every slide shares the background, logo and colours; each has its own header, sub line and can.</p>
                </Group>
                {carouselOn && (
                  <>
                    <Group label="Size">
                      <div className="seg">{(["ig-square", "ig-portrait"] as const).map((id) => <button key={id} className={doc.carousel.size === id ? "on" : ""} onClick={() => commit((d) => { const nd = reflow(d, d.output, id), base = d.carousel.base ? { t: reflow({ ...d, t: d.carousel.base.t }, d.output, id).t, size: d.carousel.base.size } : undefined; return applySlide({ ...nd, carousel: { ...d.carousel, size: id, base } }, d.carousel.active); })}>{id === "ig-square" ? "1:1 Post" : "4:5 Portrait"}</button>)}</div>
                    </Group>
                    <div className="slides">
                      {doc.carousel.slides.map((sl, i) => (
                        <div key={i} className={`slide card ${doc.carousel.active === i ? "on" : ""}`} onClick={() => doc.carousel.active !== i && commit((d) => applySlide(d, i))}>
                          <div className="slide-top">
                            {thumbs[i] ? <img src={thumbs[i]} alt={`Slide ${i + 1}`} /> : <div className="ph-thumb" />}
                            <div className="slide-meta">
                              <b>{String(i + 1).padStart(2, "0")}</b>
                              <div className="row tight">
                                <button className="ghost small" title="Move up" onClick={(e) => { e.stopPropagation(); moveSlide(i, -1); }} disabled={i === 0}>↑</button>
                                <button className="ghost small" title="Move down" onClick={(e) => { e.stopPropagation(); moveSlide(i, 1); }} disabled={i === doc.carousel.slides.length - 1}>↓</button>
                                <button className="ghost small" title="Remove slide" disabled={doc.carousel.slides.length <= 2} onClick={(e) => { e.stopPropagation(); commit((d) => { const s2 = d.carousel.slides.filter((_, j) => j !== i); return applySlide({ ...d, carousel: { ...d.carousel, slides: s2 } }, Math.min(d.carousel.active, s2.length - 1)); }); }}>×</button>
                              </div>
                              <label className="chk"><input type="checkbox" checked={sl.can} onChange={(e) => updateSlide(i, { can: e.target.checked }, "")} /> Can</label>
                            </div>
                          </div>
                          <textarea rows={2} value={sl.header} onChange={(e) => updateSlide(i, { header: e.target.value }, `sl-h-${i}`)} aria-label={`Slide ${i + 1} header`} />
                          <input value={sl.sub} onChange={(e) => updateSlide(i, { sub: e.target.value }, `sl-s-${i}`)} aria-label={`Slide ${i + 1} sub line`} />
                        </div>
                      ))}
                    </div>
                    <button className="ghost wide" disabled={doc.carousel.slides.length >= 10} onClick={() => commit((d) => { const s2 = [...d.carousel.slides, { ...d.carousel.slides[d.carousel.slides.length - 1] }]; return applySlide({ ...d, carousel: { ...d.carousel, slides: s2 } }, s2.length - 1); })}>+ Add slide ({doc.carousel.slides.length}/10)</button>
                    <button className="primary wide" onClick={guarded(exportCarousel)} disabled={busy}><Download /> {busy ? "Preparing…" : `Download ${doc.carousel.slides.length} slides (${doc.format === "jpg" ? "JPG" : "PNG"} zip)`}</button>
                    <button className="link" onClick={() => commit((d) => ({ ...d, carousel: { ...d.carousel, slides: [], base: undefined } }))}>End carousel</button>
                  </>
                )}
              </>
            )}

            {tab === "motion" && (
              <>
                <Group label="Preset">
                  <div className="outs">
                    {motionPresets.map(([k, l, h]) => <button key={k} className={motion === k ? "on" : ""} onClick={() => setMotion(k)}><b>{l}</b><small>{h}</small></button>)}
                  </div>
                </Group>
                <Range label="Length" unit="s" min={6} max={8} value={motionSecs} onChange={setMotionSecs} />
                <div className="motion-prev">
                  {motionPreview ? <canvas ref={motionRef} /> : <button className="ghost" onClick={() => setMotionPreview(true)}>Play preview</button>}
                  {motionPreview && <button className="link" onClick={() => setMotionPreview(false)}>Stop preview</button>}
                </div>
                <button className="primary wide" onClick={recordMotion} disabled={busy}><Download /> {progress !== null ? `Recording… ${Math.round(progress * 100)}%` : `Record ${motionSecs}s loop · 1080 wide`}</button>
                <p className="hint">Records in real time from the artboard at {out.ratio}. MP4 where the browser supports it (recent Chrome, Edge and Safari), otherwise WebM. Keep this tab in front while it records.</p>
              </>
            )}

            {tab === "export" && (
              <>
                <Group label="Size">
                  <div className="outs">
                    {outputs.map((o) => <button key={o.id} className={doc.output === o.id ? "on" : ""} onClick={() => commit((d) => reflow(d, d.output, o.id))}><b>{o.label}</b><small>{o.ratio} · {o.w} × {o.h}</small></button>)}
                  </div>
                </Group>
                <Group label="Format">
                  <div className="seg">{(["png", "jpg", "webp"] as const).map((f) => <button key={f} className={doc.format === f ? "on" : ""} onClick={() => commit((d) => ({ ...d, format: f }))}>{f.toUpperCase()}</button>)}</div>
                </Group>
                <button className="primary wide" onClick={guarded(exportArt)} disabled={busy}><Download /> {busy ? "Preparing…" : `Download ${out.w} × ${out.h} ${doc.format.toUpperCase()}`}</button>
                <button className="ghost wide" onClick={guarded(exportAllSizes)} disabled={busy}><Download /> Every size: 1:1, 4:5 and 9:16 (zip)</button>
                <Group label="Flavour world series">
                  <p className="hint">The same composition in each flavour world: colours, set, props, stickers and line swap automatically.</p>
                  <div className="series">{seriesThumbs.map((u, i) => <img key={i} src={u} alt="" />)}</div>
                  <label className="chk"><input type="checkbox" checked={seriesSoon} onChange={(e) => setSeriesSoon(e.target.checked)} /> Include FLOW and FLOAT (coming soon)</label>
                  <button className="ghost wide" onClick={guarded(exportSeries)} disabled={busy}><Download /> Download series (zip)</button>
                </Group>
                <button className="link" onClick={() => { const i = checkDoc(doc); setGate({ issues: i, run: () => {} }); }}><ShieldCheck /> Run brand safety check</button>
                <p className="hint">PNG for crisp text, JPG for the smallest file. Everything on the artboard is exported at full size.</p>
              </>
            )}
          </div>
        </aside>
      </div>
      {gate && (
        <div className="modal-bg" onClick={() => setGate(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-h"><b><ShieldCheck /> Brand safety check</b><button className="ghost small" onClick={() => setGate(null)}><X /></button></div>
            {gate.issues.length === 0 ? <p className="ok"><Check /> All clear: no claims, no dashes, readable text, calm sticker count.</p> : (
              <ul className="issues">{gate.issues.map((i, n) => <li key={n} className={i.level}><b>{i.level === "stop" ? "Fix" : "Check"}</b> {i.msg}</li>)}</ul>
            )}
            <div className="row end">
              <button className="ghost" onClick={() => setGate(null)}>Go back and fix</button>
              {gate.issues.length > 0 && <button className="primary" onClick={() => { const r = gate.run; setGate(null); r(); }}>Export anyway</button>}
            </div>
          </div>
        </div>
      )}
      {wiz && <WizardModal wiz={wiz} setWiz={setWiz} onFinish={finishWizard} />}
    </main>
  );
}

function Overlay({ id, t, selected, className, onStart, children }: { id: OverlayKey; t: T; selected: boolean; className: string; onStart: (e: React.PointerEvent, k: OverlayKey, m: "move" | "resize") => void; children: React.ReactNode }) {
  return (
    <div className={`ov ${className} ${selected ? "sel" : ""}`} style={{ left: `${t.x}%`, top: `${t.y}%`, transform: `translate(-50%, -50%) scale(${t.scale})` }} onPointerDown={(e) => onStart(e, id, "move")}>
      {children}
      {selected && <button className="handle" aria-label={`Resize ${id}`} style={{ transform: `scale(${1 / t.scale})` }} onPointerDown={(e) => onStart(e, id, "resize")} />}
    </div>
  );
}
const setPresets: Array<{ name: string; shape: SetShape; props: PropArr; pal: number; two?: boolean; light: "left" | "right"; floor?: number }> = [
  { name: "Two-block stack", shape: "stack", props: "base", pal: 0, light: "left" },
  { name: "Hero cube", shape: "cube", props: "both", pal: 0, light: "left" },
  { name: "Sky steps", shape: "steps", props: "top", pal: 2, two: false, light: "left" },
  { name: "Arch niche", shape: "arch", props: "base", pal: 1, light: "right" },
  { name: "Pillar", shape: "cylinder", props: "base", pal: 3, light: "left" },
  { name: "Low slab", shape: "slab", props: "scatter", pal: 1, two: true, light: "left", floor: 80 },
];
function SetThumb({ s }: { s: SetSettings }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; c.width = 120; c.height = 120;
    const x = c.getContext("2d")!; drawWorld(x, 120, 120, s);
    const ss = { ...s, floor: 80 };
    const g = drawSet(x, 120, 120, ss, 60, 14, 38);
    x.fillStyle = "#f4f4f4"; x.beginPath(); x.roundRect(53, g.canBase - 38, 14, 38, 3); x.fill();
  }, [s]);
  return <canvas ref={ref} className="thumb" />;
}
function WizardModal({ wiz, setWiz, onFinish }: { wiz: Wizard; setWiz: (w: Wizard | null) => void; onFinish: (w: Wizard) => void }) {
  const steps = ["Goal", "Format", "Style", "Layout", "Line", "Finish"];
  const up = (v: Partial<Wizard>) => setWiz({ ...wiz, ...v });
  const g = groupForProduct(wiz.product);
  const lineOptions = (() => {
    const all = wiz.goal === "brand" || wiz.goal === "awareness" ? [...headerLines.Brand.slice(0, 4), ...headerLines[g].slice(0, 4)] : wiz.goal === "engage" ? [...headerLines[g], ...headerLines.Brand].filter((l) => /[?!]|YOU|YOUR/.test(l)).slice(0, 8) : headerLines[g].slice(0, 8);
    return all.length ? all : headerLines[g].slice(0, 8);
  })();
  const styleOk = (k: string) => k !== "reveal" || wiz.product === "flourish";
  return (
    <div className="modal-bg">
      <div className="modal wiz">
        <div className="modal-h"><b><WandSparkles /> Create a post</b><button className="ghost small" onClick={() => setWiz(null)}><X /></button></div>
        <ol className="wiz-steps">{steps.map((st, i) => <li key={st} className={i === wiz.step ? "on" : i < wiz.step ? "done" : ""} onClick={() => i < wiz.step && up({ step: i })}><span>{i + 1}</span>{st}</li>)}</ol>
        <div className="wiz-body">
          {wiz.step === 0 && (<>
            <div className="gl">Which can?</div>
            <div className="seg">{(["flow", "flourish", "focus", "float"] as ProductKey[]).map((k) => <button key={k} className={wiz.product === k ? "on" : ""} onClick={() => up({ product: k, line: headerLines[groupForProduct(k)][0], style: wiz.style === "reveal" && k !== "flourish" ? "plinth" : wiz.style })}>{products[k].name}{products[k].soon ? " (soon)" : ""}</button>)}</div>
            <div className="gl">What is the post for?</div>
            <div className="choice">{goals.map(([k, l, h]) => <button key={k} className={wiz.goal === k ? "on" : ""} onClick={() => up({ goal: k, format: k === "story" ? "carousel" : wiz.format })}><b>{l}</b><small>{h}</small></button>)}</div>
          </>)}
          {wiz.step === 1 && <div className="choice">{formats.map(([k, l]) => <button key={k} className={wiz.format === k ? "on" : ""} onClick={() => up({ format: k })}><b>{l}</b><small>{k === "reel" ? "Looping MP4 from the Motion tab" : k === "carousel" ? (wiz.product === "flourish" || wiz.product === "focus" ? "Ingredient story starter" : "Starter available for FLOURISH and FOCUS") : outputs.find((o) => o.id === k)?.w + " × " + outputs.find((o) => o.id === k)?.h}</small></button>)}</div>}
          {wiz.step === 2 && <div className="choice">{guidedStyles.map(([k, l, h]) => <button key={k} disabled={!styleOk(k)} className={wiz.style === k ? "on" : ""} onClick={() => up({ style: k })}><b>{l}</b><small>{styleOk(k) ? h : "FLOURISH only: it is the can that changes colour."}</small></button>)}</div>}
          {wiz.step === 3 && <div className="choice">{layoutKinds.map(([k, l]) => <button key={k} className={wiz.layout === k ? "on" : ""} onClick={() => up({ layout: k })}><b>{l}</b><small>{k === "centre" ? "Logo, line, can on the set" : k === "poster" ? "Big line, small can to the side" : "Can on the left, line on the right"}</small></button>)}</div>}
          {wiz.step === 4 && (<>
            <div className="choice lines">{lineOptions.map((l) => <button key={l} className={wiz.line === l ? "on" : ""} onClick={() => up({ line: l })}><b>{l.replace(/\n/g, " ")}</b></button>)}</div>
            <button className="link" onClick={() => up({ line: headerLines[g][Math.floor(Math.random() * headerLines[g].length)] })}><Shuffle /> Surprise me</button>
          </>)}
          {wiz.step === 5 && (<>
            <label className="chk"><input type="checkbox" checked={wiz.props} onChange={(e) => up({ props: e.target.checked })} /> Real ingredients at the base ({botanicalsFor(wiz.product).map((k) => stickerById(k).name.toLowerCase()).join(", ")})</label>
            <label className="chk"><input type="checkbox" checked={wiz.stickers} onChange={(e) => up({ stickers: e.target.checked })} /> One or two matching stickers</label>
            <div className="gl">Logo</div>
            <div className="seg">{(["wordmark", "lockup", "icon"] as const).map((k) => <button key={k} className={wiz.logo === k ? "on" : ""} onClick={() => up({ logo: k })}>{k[0].toUpperCase() + k.slice(1)}</button>)}</div>
            <p className="hint">The brand safety check runs on the result and again before every export.</p>
          </>)}
        </div>
        <div className="row end">
          {wiz.step > 0 && <button className="ghost" onClick={() => up({ step: wiz.step - 1 })}><ArrowBack /> Back</button>}
          {wiz.step < 5 ? <button className="primary" onClick={() => up({ step: wiz.step + 1 })}>Next <ArrowRight /></button> : <button className="primary" onClick={() => onFinish(wiz)}><Sparkles /> Create post</button>}
        </div>
      </div>
    </div>
  );
}
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="group"><div className="gl">{label}</div>{children}</div>;
}
function Range({ label, value, min, max, step = 1, unit = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <label className="range">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ "--pct": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties} />
      <b>{Number.isInteger(value) ? value : value.toFixed(1)}{unit}</b>
    </label>
  );
}
function ColourPick({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <label className="cpick">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} />
      <span><small>{label}</small><input value={draft} maxLength={7} onChange={(e) => { setDraft(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value.toUpperCase()); }} /></span>
    </label>
  );
}
function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return <button className={`switch ${on ? "on" : ""}`} onClick={onClick} aria-pressed={on}><i /></button>;
}
function TextControls({ label, on, onToggle, align, onAlign, caps, onCaps, size, min, max, step = 0.1, onSize, children }: { label: string; on: boolean; onToggle: () => void; align: Align; onAlign: (a: Align) => void; caps: boolean; onCaps: () => void; size: number; min: number; max: number; step?: number; onSize: (v: number) => void; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="card-h"><b>{label}</b><Switch on={on} onClick={onToggle} /></div>
      {children}
      <div className="row tight">
        <div className="seg small">
          <button className={align === "left" ? "on" : ""} onClick={() => onAlign("left")} title="Align left"><AlignLeft /></button>
          <button className={align === "center" ? "on" : ""} onClick={() => onAlign("center")} title="Centre"><AlignCenter /></button>
        </div>
        <button className={`ghost small ${caps ? "on" : ""}`} onClick={onCaps}>Aa → AA</button>
      </div>
      <Range label="Size" min={min} max={max} step={step} value={size} onChange={onSize} />
    </div>
  );
}
function PresetThumb({ s }: { s: BgSettings }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const c = ref.current; if (!c) return; c.width = 96; c.height = 96; drawBackground(c.getContext("2d")!, 96, 96, s); }, [s]);
  return <canvas ref={ref} className="thumb" />;
}
