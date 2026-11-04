"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight, Check, Download, Eye, EyeOff, ImagePlus, Layers3, LockKeyhole, Redo2,
  RefreshCw, RotateCcw, Sparkles, Undo2, Upload, WandSparkles, AlignLeft, AlignCenter, ExternalLink,
} from "lucide-react";
import { BgSettings, GradientType, LightDir, bgPresets, defaultPresetFor, drawBackground, drawCanShadow } from "@/lib/background";
import { CopyGroup, copyGroups, groupForProduct, headerLines, originalCount, subLines } from "@/lib/copy";

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
type OverlayKey = "product" | "radial" | "logo" | "wordmark" | "header" | "sub";
type T = { x: number; y: number; scale: number };
type Align = "left" | "center";
type Tone = "white" | "silver" | "black";
type Doc = {
  product: ProductKey;
  bgSource: "create" | "image";
  bg: BgSettings;
  bgPreset: string | null;
  image: string | null;
  layers: { background: boolean; wash: boolean; radial: boolean; product: boolean; shadow: boolean; logo: boolean; wordmark: boolean; header: boolean; sub: boolean };
  t: Record<OverlayKey, T>;
  header: { text: string; caps: boolean; size: number; align: Align };
  sub: { text: string; custom: boolean; caps: boolean; size: number; align: Align };
  tone: Tone;
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
  layers: { background: true, wash: false, radial: false, product: true, shadow: true, logo: false, wordmark: true, header: true, sub: true },
  t: {
    product: { x: 50, y: 62, scale: 1 },
    radial: { x: 76, y: 76, scale: 1 },
    logo: { x: 50, y: 10, scale: 0.6 },
    wordmark: { x: 50, y: 8, scale: 0.6 },
    header: { x: 50, y: 19, scale: 1 },
    sub: { x: 50, y: 28, scale: 1 },
  },
  header: { text: "BLUE IS THE NEW BLACK", caps: true, size: 7.4, align: "center" },
  sub: { text: products.flourish.flavour, custom: false, caps: true, size: 2.2, align: "center" },
  tone: "white",
  aligned: null,
  output: "ig-square",
  format: "png",
};
const STORE = "flowerful-studio-v2";
const layerOrder: Array<{ key: keyof Doc["layers"]; label: string; overlay?: OverlayKey; tab: Tab }> = [
  { key: "sub", label: "Sub line", overlay: "sub", tab: "text" },
  { key: "header", label: "Header", overlay: "header", tab: "text" },
  { key: "wordmark", label: "Horizontal lockup", overlay: "wordmark", tab: "brand" },
  { key: "logo", label: "Stacked lockup", overlay: "logo", tab: "brand" },
  { key: "product", label: "Can", overlay: "product", tab: "can" },
  { key: "shadow", label: "Can shadow", tab: "can" },
  { key: "radial", label: "Flower radial", overlay: "radial", tab: "brand" },
  { key: "wash", label: "Colour wash", tab: "brand" },
  { key: "background", label: "Background", tab: "background" },
];
type Tab = "background" | "can" | "text" | "brand" | "export";
const tabs: Array<[Tab, string]> = [["background", "Background"], ["can", "Can"], ["text", "Text"], ["brand", "Brand"], ["export", "Export"]];

const loadImg = (src: string) => new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
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
        replace({ ...initialDoc, ...saved, layers: { ...initialDoc.layers, ...saved.layers }, t: { ...initialDoc.t, ...saved.t } });
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
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); toggleLayer(selected === "product" ? "product" : selected); setSelected(null); }
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
  const paintBase = useCallback(async (c: CanvasRenderingContext2D, W: number, H: number, d: Doc) => {
    if (d.layers.background) {
      if (d.bgSource === "image" && d.image) {
        const bg = await loadImg(d.image);
        const cover = Math.max(W / bg.width, H / bg.height);
        c.drawImage(bg, (W - bg.width * cover) / 2, (H - bg.height * cover) / 2, bg.width * cover, bg.height * cover);
      } else drawBackground(c, W, H, d.bg);
    }
    if (d.layers.wash) {
      c.save(); c.globalAlpha = 0.52; c.globalCompositeOperation = "color"; c.fillStyle = products[d.product].color; c.fillRect(0, 0, W, H); c.restore();
    }
    if (d.layers.product && d.layers.shadow) {
      const b = canBox(W, H, d);
      drawCanShadow(c, b.cx, b.cy + b.h / 2 - b.h * 0.012, d.product === "lineup" ? b.w * 0.8 : b.w, d.bgSource === "create" ? d.bg : null);
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

  // actions
  const setT = (k: OverlayKey, v: Partial<T>, key = "t-" + k) => commit((d) => ({ ...d, t: { ...d.t, [k]: { ...d.t[k], ...v } } }), key);
  const setBg = (v: Partial<BgSettings>, key: string) => commit((d) => ({ ...d, bg: { ...d.bg, ...v }, bgPreset: null, bgSource: "create", layers: { ...d.layers, background: true } }), key);
  function toggleLayer(k: keyof Doc["layers"]) { commit((d) => ({ ...d, layers: { ...d.layers, [k]: !d.layers[k] } })); }
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
    setTab(layerOrder.find((l) => l.overlay === key)!.tab);
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

  async function exportArt() {
    setBusy(true);
    try {
      await Promise.all([document.fonts.load(`500 40px Fredoka`), document.fonts.load(`600 20px Inter`)]);
      const W = out.w, H = out.h, d = doc;
      const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      const c = cv.getContext("2d")!;
      if (d.format === "jpg") { c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); }
      await paintBase(c, W, H, d);
      if (d.layers.radial && d.product !== "lineup") {
        const r = await loadImg(products[d.product].radial), t = d.t.radial, rw = W * 0.58 * t.scale, rh = (rw * r.height) / r.width;
        c.save(); c.globalAlpha = 0.76; c.globalCompositeOperation = "multiply"; c.drawImage(r, (W * t.x) / 100 - rw / 2, (H * t.y) / 100 - rh / 2, rw, rh); c.restore();
      }
      if (d.layers.product) {
        const img = await loadImg(d.product === "lineup" ? "/assets/can-lineup.png" : `/assets/can-${d.product}.png`);
        const b = canBox(W, H, d);
        c.save(); c.filter = d.aligned ?? "none"; c.drawImage(img, b.cx - b.w / 2, b.cy - b.h / 2, b.w, b.h); c.restore();
      }
      for (const k of ["logo", "wordmark"] as const) {
        if (!d.layers[k]) continue;
        const img = await loadImg(`/assets/brand-${k === "logo" ? "mark" : "wordmark"}-${d.tone}.png`), t = d.t[k];
        const w = W * (k === "logo" ? 0.34 : 0.44) * t.scale, h = (w * img.height) / img.width;
        c.drawImage(img, (W * t.x) / 100 - w / 2, (H * t.y) / 100 - h / 2, w, h);
      }
      const drawText = (k: "header" | "sub") => {
        const cfg = d[k], t = d.t[k];
        const lines = linesOf(cfg.text, cfg.caps), fs = (cfg.size / 100) * W * t.scale;
        const lh = fs * (k === "header" ? 1.02 : 1.3), boxW = W * (k === "header" ? 0.86 : 0.76) * t.scale;
        const cx = (W * t.x) / 100, top = (H * t.y) / 100 - (lines.length * lh) / 2;
        c.save();
        c.fillStyle = toneHex[d.tone];
        c.font = k === "header" ? `500 ${fs}px Fredoka` : `600 ${fs}px Inter`;
        (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = k === "sub" && cfg.caps ? `${fs * 0.16}px` : k === "header" ? `${fs * -0.01}px` : "0px";
        c.textAlign = cfg.align === "center" ? "center" : "left";
        c.textBaseline = "middle";
        const x = cfg.align === "center" ? cx : cx - boxW / 2;
        lines.forEach((ln, i) => c.fillText(ln, x, top + (i + 0.5) * lh + fs * 0.04));
        c.restore();
      };
      if (d.layers.header) drawText("header");
      if (d.layers.sub) drawText("sub");
      const mime = d.format === "jpg" ? "image/jpeg" : `image/${d.format}`;
      const blob = await new Promise<Blob>((ok, no) => cv.toBlob((b) => (b ? ok(b) : no(new Error())), mime, d.format === "png" ? undefined : 0.94));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `flowerful-${d.product}-${W}x${H}.${d.format}`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setNotice(`Downloaded ${W} × ${H} ${d.format.toUpperCase()} (${Math.round(blob.size / 1024)} KB).`);
    } catch { setNotice("Export failed. Reload and try again."); }
    finally { setBusy(false); }
  }

  const sel = (k: OverlayKey) => selected === k;
  const txt = (k: "header" | "sub") => {
    const cfg = doc[k];
    return (
      <div className={`textbox ${k}`} style={{ width: `${k === "header" ? 86 : 76}cqw`, textAlign: cfg.align, color: toneHex[doc.tone], fontSize: `${cfg.size}cqw` }}>
        {linesOf(cfg.text, cfg.caps).map((ln, i) => <div key={i} className={cfg.caps && k === "sub" ? "caps" : ""}>{ln || "\u00a0"}</div>)}
      </div>
    );
  };

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
            {layerOrder.filter((l) => !(l.key === "radial" && doc.product === "lineup")).map((l) => (
              <div key={l.key} className={`layer ${l.overlay && sel(l.overlay) ? "on" : ""} ${doc.layers[l.key] ? "" : "off"}`}
                onClick={() => { setTab(l.tab); if (l.overlay) setSelected(l.overlay); }}>
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
              <button key={o.id} className={doc.output === o.id ? "on" : ""} onClick={() => commit((d) => ({ ...d, output: o.id }))}>
                <span className="r" style={{ aspectRatio: `${o.w}/${o.h}` }} /><b>{o.ratio}</b><small>{o.label}</small>
              </button>
            ))}
          </div>
          <div className="shell" ref={shellRef} onPointerDown={() => setSelected(null)}>
            <div className="artboard" ref={boardRef} style={{ width: board.w, height: board.h }}>
              <canvas ref={baseRef} className="base" />
              {doc.layers.radial && doc.product !== "lineup" && (
                <Overlay id="radial" t={doc.t.radial} selected={sel("radial")} onStart={beginDrag} className="o-radial"><img src={p.radial} alt="" /></Overlay>
              )}
              {doc.layers.product && (
                <Overlay id="product" t={doc.t.product} selected={sel("product")} onStart={beginDrag} className={doc.product === "lineup" ? "o-lineup" : "o-can"}>
                  <img src={doc.product === "lineup" ? "/assets/can-lineup.png" : `/assets/can-${doc.product}.png`} alt={`${p.name} can`} style={{ filter: doc.aligned ?? "none" }}
                    onLoad={(e) => { const i = e.currentTarget; const a = i.naturalWidth / i.naturalHeight; setCanAspect((m) => (m[doc.product] === a ? m : { ...m, [doc.product]: a })); }} />
                </Overlay>
              )}
              {doc.layers.logo && <Overlay id="logo" t={doc.t.logo} selected={sel("logo")} onStart={beginDrag} className="o-logo"><img src={`/assets/brand-mark-${doc.tone}.png`} alt="" /></Overlay>}
              {doc.layers.wordmark && <Overlay id="wordmark" t={doc.t.wordmark} selected={sel("wordmark")} onStart={beginDrag} className="o-wordmark"><img src={`/assets/brand-wordmark-${doc.tone}.png`} alt="" /></Overlay>}
              {doc.layers.header && <Overlay id="header" t={doc.t.header} selected={sel("header")} onStart={beginDrag} className="o-text">{txt("header")}</Overlay>}
              {doc.layers.sub && <Overlay id="sub" t={doc.t.sub} selected={sel("sub")} onStart={beginDrag} className="o-text">{txt("sub")}</Overlay>}
              {selected && <div className="guide" style={{ left: `${doc.t[selected].x}%`, opacity: doc.t[selected].x === 50 ? 1 : 0 }} />}
            </div>
          </div>
          <div className="stage-foot">
            <span>{out.label} · {out.w} × {out.h}px</span>
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
                <Group label="Logo and text colour">
                  <div className="seg">
                    {(["white", "silver", "black"] as Tone[]).map((x) => <button key={x} className={doc.tone === x ? "on" : ""} onClick={() => commit((d) => ({ ...d, tone: x }))}><i className="dot" style={{ background: toneHex[x] }} /> {x[0].toUpperCase() + x.slice(1)}</button>)}
                  </div>
                </Group>
                {([["wordmark", "Horizontal lockup"], ["logo", "Stacked lockup"], ...(doc.product === "lineup" ? [] : [["radial", "Flower radial"]])] as Array<["wordmark" | "logo" | "radial", string]>).map(([k, l]) => (
                  <div key={k} className="card">
                    <div className="card-h"><b>{l}</b><Switch on={doc.layers[k]} onClick={() => toggleLayer(k)} /></div>
                    {doc.layers[k] && <Range label="Size" unit="%" min={20} max={300} value={Math.round(doc.t[k].scale * 100)} onChange={(v) => setT(k, { scale: v / 100 })} />}
                  </div>
                ))}
                <div className="card"><div className="card-h"><b>Colour wash</b><Switch on={doc.layers.wash} onClick={() => toggleLayer("wash")} /></div><small>Tints the background in the {p.name} colour.</small></div>
              </>
            )}

            {tab === "export" && (
              <>
                <Group label="Size">
                  <div className="outs">
                    {outputs.map((o) => <button key={o.id} className={doc.output === o.id ? "on" : ""} onClick={() => commit((d) => ({ ...d, output: o.id }))}><b>{o.label}</b><small>{o.ratio} · {o.w} × {o.h}</small></button>)}
                  </div>
                </Group>
                <Group label="Format">
                  <div className="seg">{(["png", "jpg", "webp"] as const).map((f) => <button key={f} className={doc.format === f ? "on" : ""} onClick={() => commit((d) => ({ ...d, format: f }))}>{f.toUpperCase()}</button>)}</div>
                </Group>
                <button className="primary wide" onClick={exportArt} disabled={busy}><Download /> {busy ? "Preparing…" : `Download ${out.w} × ${out.h} ${doc.format.toUpperCase()}`}</button>
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
