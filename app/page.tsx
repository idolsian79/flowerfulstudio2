"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight, Check, ChevronDown, ChevronUp, Download, Eye, EyeOff, ImagePlus, Layers3, LockKeyhole, Redo2,
  RefreshCw, RotateCcw, Sparkles, Undo2, Upload, WandSparkles, AlignLeft, AlignCenter, ExternalLink,
} from "lucide-react";
import { BgSettings, GradientType, LightDir, bgPresets, defaultPresetFor, drawBackground, drawCanShadow } from "@/lib/background";
import { CopyGroup, Slide, copyGroups, groupForProduct, headerLines, originalCount, storyTemplates, subLines } from "@/lib/copy";
import { makeZip } from "@/lib/zip";

const products = {
  flourish: { name: "FLOURISH", flavour: "Butterfly Pea + Raspberry", color: "#0066FF", radial: "/assets/radial-flourish.jpg", soon: false },
  focus: { name: "FOCUS", flavour: "Saffron + Cardamom", color: "#FF6A00", radial: "/assets/radial-focus.jpg", soon: false },
  flow: { name: "FLOW", flavour: "Roselle + Pomegranate", color: "#E6005C", radial: "/assets/radial-flow.jpg", soon: true },
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
type OverlayKey = "product" | "radial" | "icon" | "wordmark" | "lockup" | "header" | "sub";
type MarkColour = "silver" | "white" | "ink" | "flavour";
const defaultOrder: OverlayKey[] = ["radial", "product", "icon", "wordmark", "lockup", "header", "sub"];
// brand mark sources (alpha masks, recoloured at render time)
const ICON = { src: "/assets/brand-mark-white.png", a: 309 / 275 };
const WORD = { src: "/assets/brand-wordmark-white.png", a: 1378 / 269 };
const markCss = (m: MarkColour, sku: string) =>
  m === "silver" ? "linear-gradient(160deg,#f2f2f2 0%,#b9b9b9 45%,#e2e2e2 70%,#9d9d9d 100%)" : m === "white" ? "#ffffff" : m === "ink" ? "#241A1E" : sku;
// lockup geometry as fractions of artboard width (shared by preview and export)
function lockupGeom(layout: "left" | "above", spacing: number) {
  if (layout === "left") {
    const ih = 1, iw = ih * ICON.a, wh = 0.5, ww = wh * WORD.a, gap = (spacing / 100) * ih;
    const tw = iw + gap + ww, k = 0.5 / tw;
    return { w: tw * k, h: ih * k, icon: { x: 0, y: 0, w: iw * k, h: ih * k }, word: { x: (iw + gap) * k, y: ((ih - wh) / 2) * k, w: ww * k, h: wh * k } };
  }
  const ih = 1, iw = ih * ICON.a, wh = 0.42, ww = wh * WORD.a, gap = (spacing / 100) * ih;
  const tw = Math.max(iw, ww), k = 0.4 / tw;
  return { w: tw * k, h: (ih + gap + wh) * k, icon: { x: ((tw - iw) / 2) * k, y: 0, w: iw * k, h: ih * k }, word: { x: ((tw - ww) / 2) * k, y: (ih + gap) * k, w: ww * k, h: wh * k } };
}
const iconW = 0.3, wordW = 0.44;
// choosing a logo style also lays it out cleanly above the text (one undo step)
function applyLogoStyle(d: Doc, k: "none" | "icon" | "wordmark" | "lockup" | "both"): Doc {
  const layers = { ...d.layers, lockup: k === "lockup", icon: k === "icon" || k === "both", wordmark: k === "wordmark" || k === "both" };
  const t = { ...d.t };
  const textAt = (y: number) => {
    t.header = { ...t.header, y }; t.sub = { ...t.sub, y: y + 9 };
    // keep the can clear of the sub line
    const top = y + 12, scale = Math.min(t.product.scale, (100 - top - 3) / 68);
    t.product = { ...t.product, scale, y: top + (68 * scale) / 2 };
  };
  if (k === "icon") { t.icon = { x: 50, y: 9, scale: 0.4 }; textAt(22); }
  if (k === "wordmark") { t.wordmark = { x: 50, y: 8, scale: 0.6 }; textAt(19); }
  if (k === "both") { t.icon = { x: 50, y: 7, scale: 0.28 }; t.wordmark = { x: 50, y: 15, scale: 0.5 }; textAt(26); }
  if (k === "lockup") { t.lockup = { x: 50, y: d.lockup.layout === "above" ? 11 : 8, scale: d.lockup.layout === "above" ? 0.6 : 0.8 }; textAt(d.lockup.layout === "above" ? 27 : 20); }
  return { ...d, layers, t };
}
type T = { x: number; y: number; scale: number };
type Align = "left" | "center";
type Tone = "white" | "silver" | "black";
type Doc = {
  product: ProductKey;
  bgSource: "create" | "image";
  bg: BgSettings;
  bgPreset: string | null;
  image: string | null;
  layers: { background: boolean; wash: boolean; radial: boolean; product: boolean; shadow: boolean; icon: boolean; wordmark: boolean; lockup: boolean; header: boolean; sub: boolean };
  t: Record<OverlayKey, T>;
  header: { text: string; caps: boolean; size: number; align: Align };
  sub: { text: string; custom: boolean; caps: boolean; size: number; align: Align };
  tone: Tone;
  markColour: MarkColour;
  lockup: { layout: "left" | "above"; spacing: number };
  order: OverlayKey[];
  carousel: { slides: Slide[]; active: number; size: "ig-square" | "ig-portrait"; base?: { t: Doc["t"]; size: number } };
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
    icon: { x: 50, y: 9, scale: 0.5 },
    lockup: { x: 50, y: 9, scale: 1 },
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
  aligned: null,
  output: "ig-square",
  format: "png",
};
const STORE = "flowerful-studio-v2";
const overlayMeta: Record<OverlayKey, { label: string; layer: keyof Doc["layers"]; tab: Tab }> = {
  sub: { label: "Sub line", layer: "sub", tab: "text" },
  header: { label: "Header", layer: "header", tab: "text" },
  lockup: { label: "Lockup", layer: "lockup", tab: "brand" },
  wordmark: { label: "Wordmark", layer: "wordmark", tab: "brand" },
  icon: { label: "Icon", layer: "icon", tab: "brand" },
  product: { label: "Can", layer: "product", tab: "can" },
  radial: { label: "Flower radial", layer: "radial", tab: "brand" },
};
const fixedLayers: Array<{ key: keyof Doc["layers"]; label: string; tab: Tab }> = [
  { key: "shadow", label: "Can shadow", tab: "can" },
  { key: "wash", label: "Colour wash", tab: "brand" },
  { key: "background", label: "Background", tab: "background" },
];
type Tab = "background" | "can" | "text" | "brand" | "carousel" | "motion" | "export";
const tabs: Array<[Tab, string]> = [["background", "Background"], ["can", "Can"], ["text", "Text"], ["brand", "Brand"], ["carousel", "Carousel"], ["motion", "Motion"], ["export", "Export"]];

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
type MotionKind = "drift" | "sweep" | "petals" | "typeon";
type Anim = { kind: MotionKind; t: number };
const motionPresets: Array<[MotionKind, string, string]> = [
  ["drift", "Gradient drift", "Colours breathe and rotate slowly"],
  ["sweep", "Light sweep", "Light travels left to right, the can shadow follows"],
  ["petals", "Drifting petals", "Flower artwork floats gently through the frame"],
  ["typeon", "Header type-on", "The header writes itself, then holds"],
];
const STORY_TOP = 250 / 1920, STORY_BOTTOM = 340 / 1920;
const safeBand = (id: string) => (id === "ig-story" ? [STORY_TOP * 100, 100 - STORY_BOTTOM * 100] : [0, 100]);
// move a layout designed at one size onto another, keeping text and logos inside Story safe zones
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
  return { ...d, output: toId, t };
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
  const [bgMode, setBgMode] = useState<"create" | "upload" | "ai">("create");
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
  // AI (secondary) state is per session only
  const [theme, setTheme] = useState<ThemeKey>("Botanical Couture");
  const [subtheme, setSubtheme] = useState<string>(themes["Botanical Couture"][0]);
  const [scene, setScene] = useState("A decisive premium product moment with generous negative space and tactile botanical detail.");
  const [remix, setRemix] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
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
        replace({ ...initialDoc, ...saved, order, carousel: { ...initialDoc.carousel, ...saved.carousel }, lockup: { ...initialDoc.lockup, ...saved.lockup }, layers: { ...initialDoc.layers, ...saved.layers }, t: { ...initialDoc.t, ...saved.t } });
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
      if (typing || !selected) return;
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
    return { cx: (W * t.x) / 100, cy: (H * t.y) / 100, w, h };
  }, [canAspect]);

  // background base: gradient or image, plus can shadow. Same code paints preview and export.
  const paintBase = useCallback(async (c: CanvasRenderingContext2D, W: number, H: number, d: Doc, anim?: Anim) => {
    const TAU = Math.PI * 2;
    let bg = d.bg, lp: [number, number] | undefined;
    if (anim?.kind === "drift") bg = { ...bg, angle: bg.angle + 16 * Math.sin(TAU * anim.t), lightStrength: bg.lightStrength * (0.85 + 0.15 * Math.cos(TAU * anim.t)) };
    if (anim?.kind === "sweep") lp = [0.5 - 0.46 * Math.cos(TAU * anim.t), 0.22 + 0.1 * Math.sin(TAU * anim.t)];
    if (d.layers.background) {
      if (d.bgSource === "image" && d.image) {
        const bg = await loadImg(d.image);
        const cover = Math.max(W / bg.width, H / bg.height);
        c.drawImage(bg, (W - bg.width * cover) / 2, (H - bg.height * cover) / 2, bg.width * cover, bg.height * cover);
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
    if (d.layers.product && d.layers.shadow) {
      const b = canBox(W, H, d);
      drawCanShadow(c, b.cx, b.cy + b.h / 2 - b.h * 0.012, d.product === "lineup" ? b.w * 0.8 : b.w, d.bgSource === "create" ? d.bg : null, 1, lp ?? (d.bgSource === "image" ? undefined : undefined));
    }
  }, [canBox]);

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
  function toggleLayer(k: keyof Doc["layers"]) { commit((d) => ({ ...d, layers: { ...d.layers, [k]: !d.layers[k], ...(k === "lockup" && !d.layers.lockup ? { icon: false, wordmark: false } : {}), ...((k === "icon" || k === "wordmark") && !d.layers[k] ? { lockup: false } : {}) } })); }
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
    r.onload = () => { commit((d) => ({ ...d, image: String(r.result), bgSource: "image", aligned: null, layers: { ...d.layers, background: true } })); setNotice("Image set as the background."); };
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
      commit((d) => ({ ...d, image: `data:image/png;base64,${result.image}`, bgSource: "image", aligned: null, layers: { ...d.layers, background: true } }));
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
      const drawMark = async (src: string, x: number, y: number, w: number, h: number) => {
        const img = await loadImg(src);
        const off = document.createElement("canvas"); off.width = Math.max(1, Math.round(w)); off.height = Math.max(1, Math.round(h));
        const o = off.getContext("2d")!;
        o.drawImage(img, 0, 0, off.width, off.height);
        o.globalCompositeOperation = "source-in";
        if (d.markColour === "silver") {
          // same angle and stops as the CSS gradient
          const g = o.createLinearGradient(0, 0, off.width, off.height * 0.6);
          [["#f2f2f2", 0], ["#b9b9b9", 0.45], ["#e2e2e2", 0.7], ["#9d9d9d", 1]].forEach(([c, t]) => g.addColorStop(t as number, c as string));
          o.fillStyle = g;
        } else o.fillStyle = markCss(d.markColour, sku);
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
        } else if (k === "icon" || k === "wordmark") {
          const m = k === "icon" ? ICON : WORD, w = W * (k === "icon" ? iconW : wordW) * t.scale, h = w / m.a;
          await drawMark(m.src, cx - w / 2, cy - h / 2, w, h);
        } else if (k === "lockup") {
          const g = lockupGeom(d.lockup.layout, d.lockup.spacing), s2 = W * t.scale, x0 = cx - (g.w * s2) / 2, y0 = cy - (g.h * s2) / 2;
          await drawMark(ICON.src, x0 + g.icon.x * s2, y0 + g.icon.y * s2, g.icon.w * s2, g.icon.h * s2);
          await drawMark(WORD.src, x0 + g.word.x * s2, y0 + g.word.y * s2, g.word.w * s2, g.word.h * s2);
        } else if (k === "header" || k === "sub") drawText(k);
      }
  };
  const fontsReady = () => Promise.all([document.fonts.load(`500 40px Fredoka`), document.fonts.load(`600 20px Inter`)]);
  const renderToCanvas = async (d: Doc, W: number, H: number) => {
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    await renderDoc(cv.getContext("2d")!, W, H, d);
    return cv;
  };
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
  const markStyle = (src: string, w: number, h: number): React.CSSProperties => ({
    width: `${w}cqw`, height: `${h}cqw`, background: markCss(doc.markColour, p.color),
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
    if (k === "lockup") {
      const g = lockupGeom(doc.lockup.layout, doc.lockup.spacing);
      return (
        <Overlay key={k} {...common} className="o-mark">
          <div style={{ position: "relative", width: `${g.w * 100}cqw`, height: `${g.h * 100}cqw` }}>
            <i style={{ ...markStyle(ICON.src, g.icon.w * 100, g.icon.h * 100), position: "absolute", left: `${g.icon.x * 100}cqw`, top: `${g.icon.y * 100}cqw` }} />
            <i style={{ ...markStyle(WORD.src, g.word.w * 100, g.word.h * 100), position: "absolute", left: `${g.word.x * 100}cqw`, top: `${g.word.y * 100}cqw` }} />
          </div>
        </Overlay>
      );
    }
    return <Overlay key={k} {...common} className="o-text">{txt(k)}</Overlay>;
  };
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
          <button className="primary" onClick={exportArt} disabled={busy}><Download /> {busy ? "Preparing…" : `Download ${doc.format.toUpperCase()}`}</button>
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
          <div className="shell" ref={shellRef} onPointerDown={() => setSelected(null)}>
            <div className="artboard" ref={boardRef} style={{ width: board.w, height: board.h }}>
              <canvas ref={baseRef} className="base" />
              {doc.order.map((k) => doc.layers[overlayMeta[k].layer] && renderOverlay(k))}
              {doc.output === "ig-story" && showSafe && (
                <>
                  <div className="safe top" style={{ height: `${STORY_TOP * 100}%` }}><span>Story UI · keep clear</span></div>
                  <div className="safe bottom" style={{ height: `${STORY_BOTTOM * 100}%` }}><span>Reply bar · keep clear</span></div>
                </>
              )}
              {selected && <div className="guide" style={{ left: `${doc.t[selected].x}%`, opacity: doc.t[selected].x === 50 ? 1 : 0 }} />}
            </div>
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
            {tab === "background" && (
              <>
                <div className="seg">
                  {([["create", "Create"], ["upload", "Upload"], ["ai", "AI"]] as const).map(([k, l]) => <button key={k} className={bgMode === k ? "on" : ""} onClick={() => setBgMode(k)}>{l}</button>)}
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
              </>
            )}

            {tab === "brand" && (
              <>
                <Group label="Text colour">
                  <div className="seg">
                    {(["white", "silver", "black"] as Tone[]).map((x) => <button key={x} className={doc.tone === x ? "on" : ""} onClick={() => commit((d) => ({ ...d, tone: x }))}><i className="dot" style={{ background: toneHex[x] }} /> {x[0].toUpperCase() + x.slice(1)}</button>)}
                  </div>
                </Group>
                <Group label="Logo colour">
                  <div className="seg">
                    {([["silver", "Matte silver"], ["white", "White"], ["ink", "Ink"], ["flavour", p.name === "LINE-UP" ? "Flavour" : p.name[0] + p.name.slice(1).toLowerCase()]] as Array<[MarkColour, string]>).map(([x, l]) => (
                      <button key={x} className={doc.markColour === x ? "on" : ""} onClick={() => commit((d) => ({ ...d, markColour: x }))}><i className="dot" style={{ background: markCss(x, p.color) }} /> {l}</button>
                    ))}
                  </div>
                </Group>
                <div className="card">
                  <div className="card-h"><b>Logo style</b></div>
                  <div className="seg small">
                    {([["none", "None"], ["icon", "Icon"], ["wordmark", "Wordmark"], ["lockup", "Lockup"], ["both", "Icon + wordmark"]] as const).map(([k, l]) => {
                      const L = doc.layers, cur = L.lockup ? "lockup" : L.icon && L.wordmark ? "both" : L.icon ? "icon" : L.wordmark ? "wordmark" : "none";
                      return <button key={k} className={cur === k ? "on" : ""} onClick={() => commit((d) => applyLogoStyle(d, k))}>{l}</button>;
                    })}
                  </div>
                  <small className="muted">Lockup keeps the icon and wordmark together as one layer. Icon + wordmark gives two separate layers you can place apart.</small>
                </div>
                {doc.layers.lockup && (
                  <div className="card">
                    <div className="card-h"><b>Lockup</b><Switch on onClick={() => toggleLayer("lockup")} /></div>
                    <div className="seg">
                      {([["left", "Icon left"], ["above", "Icon above"]] as const).map(([k, l]) => <button key={k} className={doc.lockup.layout === k ? "on" : ""} onClick={() => commit((d) => applyLogoStyle({ ...d, lockup: { ...d.lockup, layout: k } }, "lockup"))}>{l}</button>)}
                    </div>
                    <Range label="Spacing" unit="%" min={0} max={80} value={doc.lockup.spacing} onChange={(v) => commit((d) => ({ ...d, lockup: { ...d.lockup, spacing: v } }), "lsp")} />
                    <Range label="Size" unit="%" min={20} max={300} value={Math.round(doc.t.lockup.scale * 100)} onChange={(v) => setT("lockup", { scale: v / 100 })} />
                  </div>
                )}
                {([["icon", "Icon"], ["wordmark", "Wordmark"], ...(doc.product === "lineup" ? [] : [["radial", "Flower radial"]])] as Array<["icon" | "wordmark" | "radial", string]>).filter(([k]) => k === "radial" || doc.layers[k]).map(([k, l]) => (
                  <div key={k} className="card">
                    <div className="card-h"><b>{l}</b><Switch on={doc.layers[k]} onClick={() => toggleLayer(k)} /></div>
                    {doc.layers[k] && <Range label="Size" unit="%" min={20} max={300} value={Math.round(doc.t[k].scale * 100)} onChange={(v) => setT(k, { scale: v / 100 })} />}
                  </div>
                ))}
                <div className="card"><div className="card-h"><b>Colour wash</b><Switch on={doc.layers.wash} onClick={() => toggleLayer("wash")} /></div><small>Tints the background in the {p.name} colour.</small></div>
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
                    <button className="primary wide" onClick={exportCarousel} disabled={busy}><Download /> {busy ? "Preparing…" : `Download ${doc.carousel.slides.length} slides (${doc.format === "jpg" ? "JPG" : "PNG"} zip)`}</button>
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
                <button className="primary wide" onClick={exportArt} disabled={busy}><Download /> {busy ? "Preparing…" : `Download ${out.w} × ${out.h} ${doc.format.toUpperCase()}`}</button>
                <button className="ghost wide" onClick={exportAllSizes} disabled={busy}><Download /> Every size: 1:1, 4:5 and 9:16 (zip)</button>
                <p className="hint">PNG for crisp text, JPG for the smallest file. Everything on the artboard is exported at full size.</p>
              </>
            )}
          </div>
        </aside>
      </div>
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
