"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Layers3,
  LockKeyhole,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
const products = {
  flow: {
    name: "FLOW",
    flavour: "Roselle + Pomegranate",
    color: "#E6005C",
    radial: "/assets/radial-flow.jpg",
    index: 0,
  },
  flourish: {
    name: "FLOURISH",
    flavour: "Butterfly Pea + Raspberry",
    color: "#0066FF",
    radial: "/assets/radial-flourish.jpg",
    index: 1,
  },
  focus: {
    name: "FOCUS",
    flavour: "Saffron + Cardamom",
    color: "#FF6A00",
    radial: "/assets/radial-focus.jpg",
    index: 2,
  },
  float: {
    name: "FLOAT",
    flavour: "Chrysanthemum + Honey",
    color: "#FFC400",
    radial: "/assets/radial-float.jpg",
    index: 3,
  },
  lineup: {
    name: "FULL CAN LINE-UP",
    flavour: "FLOW · FLOURISH · FOCUS · FLOAT",
    color: "#333333",
    radial: "/assets/inspiration-grid.png",
    index: -1,
  },
} as const;
const themes = {
  "Botanical Couture": [
    "Sculptural bloom",
    "Translucent petals",
    "Chrome botanicals",
    "Ingredient macro",
  ],
  "Urban Bloom": [
    "Dubai morning",
    "Design café",
    "Rooftop social",
    "Pool architecture",
  ],
  "After-Dark Botanical": [
    "Midnight chrome",
    "Projected radials",
    "Neon botanicals",
    "Dark stone",
  ],
  "Colour Architecture": [
    "Monochrome field",
    "Tonal gradient",
    "Hard shadow",
    "Geometric plinth",
  ],
  "Everyday Brighter": [
    "Post-yoga reset",
    "Workday ritual",
    "Golden hour",
    "Shared table",
  ],
} as const;
const outputs = [
  { id: "ig-square", label: "IG Square", w: 1080, h: 1080 },
  { id: "ig-portrait", label: "IG Portrait", w: 1080, h: 1350 },
  { id: "ig-reel", label: "IG Reel", w: 1080, h: 1920 },
  { id: "ig-story", label: "IG Story", w: 1080, h: 1920 },
  { id: "tiktok", label: "TikTok", w: 1080, h: 1920 },
  { id: "ad-banner", label: "Ad Banner", w: 1200, h: 628 },
  { id: "web-banner", label: "Web Banner", w: 1920, h: 720 },
  { id: "web-hero", label: "Website Hero", w: 1920, h: 1080 },
  { id: "web-box", label: "Web Box", w: 1200, h: 1200 },
];
const steps = ["Background", "Can", "Text", "Finishes", "Output"],
  remixParts = {
    light: [
      "crisp sunrise light",
      "hard-flash editorial light",
      "cinematic side light",
      "projected botanical shadows",
      "soft silver reflections",
    ],
    lens: [
      "close product portrait",
      "wide architectural frame",
      "low hero angle",
      "macro crop",
      "candid documentary frame",
    ],
    material: [
      "translucent acrylic",
      "brushed chrome",
      "cool limestone",
      "high-gloss colour",
      "water and crushed ice",
    ],
  };
const backgroundBank: Array<{ name: string; src: string; group?: string }> = [];
type OverlayKey = "product" | "radial" | "logo" | "wordmark" | "headline";
type OverlayTransform = { x: number; y: number; scale: number };
const initialTransforms: Record<OverlayKey, OverlayTransform> = {
  product: { x: 50, y: 62, scale: 1 },
  radial: { x: 76, y: 76, scale: 1 },
  logo: { x: 22, y: 14, scale: 1 },
  wordmark: { x: 27, y: 12, scale: 1 },
  headline: { x: 39, y: 27, scale: 1 },
};
export default function Home() {
  const [step, setStep] = useState(0),
    [product, setProduct] = useState<keyof typeof products>("flow"),
    [theme, setTheme] = useState<keyof typeof themes>("Botanical Couture"),
    [subtheme, setSubtheme] = useState<string>(themes["Botanical Couture"][0]),
    [scene, setScene] = useState(
      "A decisive premium product moment with generous negative space and tactile botanical detail.",
    ),
    [vibe, setVibe] = useState("Editorial & sculptural"),
    [energy, setEnergy] = useState([68]),
    [headline, setHeadline] = useState("DRINK BRIGHTER"),
    [output, setOutput] = useState(outputs[1].id),
    [downloadFormat, setDownloadFormat] = useState("png"),
    [downloadAsset, setDownloadAsset] = useState<{ url: string; filename: string } | null>(null),
    [remix, setRemix] = useState(0),
    [generatedImage, setGeneratedImage] = useState<string | null>(null),
    [apiKey, setApiKey] = useState(""),
    [isGenerating, setIsGenerating] = useState(false),
    [themeAligned, setThemeAligned] = useState(false),
    [canFilter, setCanFilter] = useState("none"),
    [bankBackground, setBankBackground] = useState<string | null>(null),
    [brandTone, setBrandTone] = useState<"white" | "silver" | "black">("white"),
    [layers, setLayers] = useState({
      background: false,
      wash: false,
      radial: false,
      product: false,
      logo: false,
      wordmark: false,
      headline: false,
    }),
    [notice, setNotice] = useState<string | null>(null),
    [selectedOverlay, setSelectedOverlay] = useState<OverlayKey | null>(null),
    [transforms, setTransforms] = useState<Record<OverlayKey, OverlayTransform>>(initialTransforms);
  const uploadRef = useRef<HTMLInputElement>(null),
    artboardRef = useRef<HTMLDivElement>(null),
    p = products[product],
    out = outputs.find((x) => x.id === output)!,
    activeBackground = generatedImage ?? bankBackground;
  const remixDirection = useMemo(
    () =>
      `${remixParts.light[remix % 5]}, ${remixParts.lens[(remix * 2) % 5]}, ${remixParts.material[(remix * 3) % 5]}`,
    [remix],
  );
  const headlineLines = useMemo(() => splitHeadline(headline), [headline]);
  const prompt = useMemo(() => {
    return `Create a clean, unbranded Flowerful campaign background plate. Theme: ${theme}. Sub-theme: ${subtheme}. Scene: ${scene}. Art direction: ${vibe}, energy ${energy[0]}%, ${remixDirection}. Harmonise the lighting and accents with the ${p.name} colour world ${p.color}, without creating a product. Modern, vibrant, editorial and photoreal. COMPOSITION RULE: reserve the top 22% as clean uncluttered negative space and reserve the bottom-right 28% as clean negative space for locked logos and campaign text. Keep the central/lower-central area believable for later can placement, with a coherent directional light and a realistic contact-shadow surface. Absolutely no cans, drinks, packaging, products, people holding products, logo, wordmark, label, radial flower device, typography or text. No watercolor, wreaths, rustic apothecary, generic spa imagery or stock-photo smiles. Output ${out.w} × ${out.h}.`;
  }, [product, p, theme, subtheme, scene, vibe, energy, remixDirection, out]);
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      const image = Array.from(event.clipboardData?.files ?? []).find((file) =>
        file.type.startsWith("image/"),
      );
      if (image) {
        event.preventDefault();
        loadImage(image);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });
  function beginOverlayInteraction(
    e: React.PointerEvent,
    key: OverlayKey,
    mode: "move" | "resize",
  ) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedOverlay(key);
    const board = artboardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = transforms[key];
    const move = (event: PointerEvent) => {
      if (mode === "move") {
        const x = Math.max(0, Math.min(100, start.x + ((event.clientX - startX) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, start.y + ((event.clientY - startY) / rect.height) * 100));
        setTransforms((current) => ({ ...current, [key]: { ...current[key], x, y } }));
      } else {
        const delta = ((event.clientX - startX) / rect.width + (event.clientY - startY) / rect.height) * 0.9;
        const scale = Math.max(0.3, Math.min(2.6, start.scale + delta));
        setTransforms((current) => ({ ...current, [key]: { ...current[key], scale } }));
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }
  function clearOverlays(background = true) {
    setLayers({
      background,
      wash: false,
      radial: false,
      product: false,
      logo: false,
      wordmark: false,
      headline: false,
    });
  }
  function changeTheme(v: string) {
    const k = v as keyof typeof themes;
    setTheme(k);
    setSubtheme(themes[k][0]);
  }
  function doRemix() {
    setRemix((x) => x + 1);
    setGeneratedImage(null);
    setBankBackground(null);
    clearOverlays(false);
    setNotice("Direction remixed. Add only the overlays you need.");
  }
  async function generate() {
    try {
      await navigator.clipboard.writeText(prompt);
      window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
      setNotice(
        "Prompt copied. Generate in ChatGPT, then load the image here.",
      );
    } catch {
      setNotice(
        "Copy the production prompt below into ChatGPT, then load the result here.",
      );
    }
  }
  async function generateInside() {
    setIsGenerating(true);
    setNotice("Creating a clean background plate inside Flowerful Studio…");
    try {
      const ratio = out.w / out.h;
      const size = ratio > 1.2 ? "1536x1024" : ratio < 0.84 ? "1024x1536" : "1024x1024";
      const response = await fetch("/api/generate-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size, apiKey: apiKey.trim() || undefined }),
      });
      const result = (await response.json()) as { error?: string; image?: string };
      if (!response.ok) throw new Error(result.error || "Background generation failed.");
      setGeneratedImage(`data:image/png;base64,${result.image}`);
      clearOverlays();
      setThemeAligned(false);
      setCanFilter("none");
      setNotice("New background ready. Add the can, text and finishes step by step.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Background generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }
  function loadImage(f?: Blob) {
    if (!f || !f.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => {
      setGeneratedImage(String(r.result));
      clearOverlays();
      setThemeAligned(false);
      setCanFilter("none");
      setNotice(
        "Your image is now the background. Add the can, text and finishes step by step.",
      );
    };
    r.readAsDataURL(f);
  }
  async function alignCanToScene() {
    if (themeAligned) {
      setThemeAligned(false);
      setCanFilter("none");
      setNotice("Theme alignment removed. The original can master is unchanged.");
      return;
    }
    try {
      if (!activeBackground) {
        setNotice("Add or generate a background before using theme alignment.");
        return;
      }
      const image = await load(activeBackground);
      const sample = document.createElement("canvas");
      sample.width = 48;
      sample.height = 48;
      const context = sample.getContext("2d", { willReadFrequently: true })!;
      context.drawImage(image, 0, 0, 48, 48);
      const pixels = context.getImageData(14, 20, 20, 20).data;
      let light = 0, warmth = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        light += pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722;
        warmth += pixels[i] - pixels[i + 2];
      }
      const luminance = light / (pixels.length / 4);
      const temperature = warmth / (pixels.length / 4);
      const brightness = luminance < 75 ? 0.74 : luminance < 145 ? 0.88 : 1;
      const contrast = luminance < 110 ? 1.18 : 1.06;
      const sepia = temperature > 12 ? 0.1 : 0;
      const shadow = luminance < 85 ? "rgba(0,0,0,.62)" : "rgba(0,0,0,.38)";
      setCanFilter(`brightness(${brightness}) contrast(${contrast}) saturate(.94) sepia(${sepia}) drop-shadow(0 18px 16px ${shadow})`);
      setThemeAligned(true);
      setNotice("Can lighting aligned to the scene. The locked can artwork remains unchanged.");
    } catch {
      setCanFilter("drop-shadow(0 18px 16px rgba(0,0,0,.4))");
      setThemeAligned(true);
      setNotice("Grounding shadow applied. The locked can artwork remains unchanged.");
    }
  }
  async function pasteBackground() {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (imageType) {
          loadImage(await item.getType(imageType));
          return;
        }
      }
      setNotice("No image found on your clipboard. Copy an image, then try again.");
    } catch {
      setNotice("Press Ctrl+V or ⌘V anywhere outside a text field to paste your background.");
    }
  }
  const load = (src: string) =>
    new Promise<HTMLImageElement>((ok, no) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = no;
      i.src = src;
    });
  async function exportCreative() {
    try {
    const canvas = document.createElement("canvas");
    canvas.width = out.w;
    canvas.height = out.h;
    const c = canvas.getContext("2d")!;
    if (downloadFormat === "jpg") {
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, out.w, out.h);
    }
    if (layers.background && activeBackground) {
      const bg = await load(activeBackground),
        cover = Math.max(out.w / bg.width, out.h / bg.height);
      c.drawImage(
        bg,
        (out.w - bg.width * cover) / 2,
        (out.h - bg.height * cover) / 2,
        bg.width * cover,
        bg.height * cover,
      );
    }
    if (layers.wash) {
      c.globalAlpha = 0.52;
      c.globalCompositeOperation = "color";
      c.fillStyle = p.color;
      c.fillRect(0, 0, out.w, out.h);
      c.globalAlpha = 1;
      c.globalCompositeOperation = "source-over";
    }
    if (layers.radial && product !== "lineup") {
      const r = await load(p.radial),
        rw = out.w * 0.58 * transforms.radial.scale,
        rh = (rw * r.height) / r.width;
      c.globalAlpha = 0.76;
      c.globalCompositeOperation = "multiply";
      c.drawImage(r, out.w * transforms.radial.x / 100 - rw / 2, out.h * transforms.radial.y / 100 - rh / 2, rw, rh);
      c.globalAlpha = 1;
      c.globalCompositeOperation = "source-over";
    }
    if (layers.product) {
      c.filter = themeAligned ? canFilter : "none";
      if (product === "lineup") {
        const range = await load("/assets/can-lineup.png");
        const w = out.w * 0.82 * transforms.product.scale,
          h = (w * range.height) / range.width;
        c.drawImage(range, out.w * transforms.product.x / 100 - w / 2, out.h * transforms.product.y / 100 - h / 2, w, h);
      } else {
        const can = await load(`/assets/can-${product}.png`),
          dh = out.h * 0.68 * transforms.product.scale,
          dw = (dh * can.width) / can.height;
        c.drawImage(can, out.w * transforms.product.x / 100 - dw / 2, out.h * transforms.product.y / 100 - dh / 2, dw, dh);
      }
      c.filter = "none";
    }
    if (layers.logo) {
      const logo = await load(`/assets/brand-mark-${brandTone}.png`),
        lw = out.w * 0.34 * transforms.logo.scale,
        lh = (lw * logo.height) / logo.width;
      c.drawImage(
        logo,
        out.w * transforms.logo.x / 100 - lw / 2,
        out.h * transforms.logo.y / 100 - lh / 2,
        lw,
        lh,
      );
    }
    if (layers.wordmark) {
      const mark = await load(`/assets/brand-wordmark-${brandTone}.png`),
        mw = out.w * 0.44 * transforms.wordmark.scale,
        mh = (mw * mark.height) / mark.width;
      c.drawImage(
        mark,
        out.w * transforms.wordmark.x / 100 - mw / 2,
        out.h * transforms.wordmark.y / 100 - mh / 2,
        mw,
        mh,
      );
    }
    if (layers.headline) {
      const t = transforms.headline;
      const textWidth = out.w * 0.68 * t.scale;
      const textX = out.w * t.x / 100 - textWidth / 2;
      const lineHeight = out.w * 0.068 * t.scale;
      const totalHeight = headlineLines.length * lineHeight + out.w * 0.055 * t.scale;
      const textY = out.h * t.y / 100 - totalHeight / 2 + lineHeight * 0.78;
      c.fillStyle = brandTone === "black" ? "#181818" : "#fff";
      c.font = `300 ${Math.round(out.w * 0.062 * t.scale)}px Montserrat,Arial`;
      headlineLines.forEach((line, index) => c.fillText(line, textX, textY + index * lineHeight));
      c.font = `600 ${Math.max(14, Math.round(out.w * 0.013 * t.scale))}px Montserrat,Arial`;
      c.fillText(p.flavour.toUpperCase(), textX, textY + headlineLines.length * lineHeight + out.w * 0.025 * t.scale);
    }
    const mime = downloadFormat === "jpg" ? "image/jpeg" : `image/${downloadFormat}`;
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (file) => file ? resolve(file) : reject(new Error("Export failed")),
        mime,
        downloadFormat === "png" ? undefined : 0.94,
      ),
    );
    const url = URL.createObjectURL(blob);
    if (downloadAsset) URL.revokeObjectURL(downloadAsset.url);
    setDownloadAsset({
      url,
      filename: `flowerful-${product}-${out.w}x${out.h}-r${remix}.${downloadFormat}`,
    });
    setNotice(`Artwork prepared. Click “Download now” to save the ${downloadFormat.toUpperCase()} file.`);
    } catch {
      setNotice("The artwork could not be downloaded. Reload the page and try again.");
    }
  }
  return (
    <main>
      <header className="studio-header">
        <div className="brand-head">
          <img src="/assets/brand-mark-black.png" alt="Flowerful emblem" />
          <img src="/assets/brand-wordmark-black.png" alt="Flowerful" />
          <span>CREATIVE STUDIO</span>
        </div>
        <Button onClick={generate}>
          <ExternalLink />
          Generate in ChatGPT
        </Button>
      </header>
      <div className="studio-grid">
        <nav className="steps">
          {steps.map((x, i) => (
            <button
              key={x}
              onClick={() => setStep(i)}
              className={step === i ? "active" : ""}
            >
              <span>{step > i ? <Check size={14} /> : `0${i + 1}`}</span>
              <small>{x}</small>
            </button>
          ))}
        </nav>
        <section className="builder">
          <div className="builder-title">
            <div>
              <p className="eyebrow">Step {step + 1} of 5</p>
              <h1>
                {
                  [
                    "Direct the background",
                    "Choose one product",
                    "Add the text",
                    "Add optional finishes",
                    "Choose the output",
                  ][step]
                }
              </h1>
            </div>
            <span>{(step + 1) * 20}%</span>
          </div>
          <div className="builder-body">
            {step === 0 && (
              <div className="stack">
                <Field label="Prompted theme">
                  <Select value={theme} onValueChange={changeTheme}>
                    <SelectTrigger className="select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="theme-menu" position="popper" sideOffset={6}>
                      {Object.keys(themes).map((x) => (
                        <SelectItem key={x} value={x}>{x}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Sub-theme">
                  <div className="chip-grid">
                    {themes[theme].map((x) => (
                      <button key={x} onClick={() => setSubtheme(x)} className={subtheme === x ? "on" : ""}>{x}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Background bank">
                  {backgroundBank.length ? (
                    <div className="asset-bank">
                      {backgroundBank.map((x) => (
                        <button key={x.name} onClick={() => { setBankBackground(x.src); setGeneratedImage(null); clearOverlays(true); }} className={activeBackground === x.src ? "on" : ""}>
                          <img src={x.src} alt="" /><span>{x.name}{x.group && <small>{x.group}</small>}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-background-bank">
                      Background bank cleared. Upload, paste or generate your new background below.
                    </div>
                  )}
                </Field>
                <div className="composition-rule">
                  <LockKeyhole />
                  <span><strong>Composition-safe by default</strong><small>Top 22% and bottom-right 28% remain clear for logos and text.</small></span>
                </div>
                <Field label="Add your own background">
                  <div
                    className="background-import"
                    tabIndex={0}
                    onPaste={(event) => {
                      const image = Array.from(event.clipboardData.files).find((file) =>
                        file.type.startsWith("image/"),
                      );
                      if (image) {
                        event.preventDefault();
                        loadImage(image);
                      }
                    }}
                  >
                    <div>
                      <Upload />
                      <span>
                        <strong>Upload or paste an image</strong>
                        <small>PNG, JPG or WEBP · Ctrl+V / ⌘V works anywhere outside a text field</small>
                      </span>
                    </div>
                    <div className="background-import-actions">
                      <button onClick={() => uploadRef.current?.click()}>Upload image</button>
                      <button onClick={pasteBackground}>Paste from clipboard</button>
                    </div>
                  </div>
                </Field>
                <Field label="Describe your moment"><Textarea value={scene} onChange={(e) => setScene(e.target.value)} /></Field>
                <Field label="Create inside Flowerful Studio">
                  <div className="inside-generator">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      placeholder="OpenAI API key — used for this session only"
                      autoComplete="off"
                    />
                    <button onClick={generateInside} disabled={isGenerating || !apiKey.trim()}>
                      <WandSparkles />
                      <span><strong>{isGenerating ? "Creating background…" : "Generate inside app"}</strong><small>Uses the theme, sub-theme, scene and mandatory safe zones</small></span>
                    </button>
                    <small>{apiKey.trim() ? "Ready to generate. Your key is used for this request only." : "Enter an OpenAI API key to activate in-app generation. It is never saved."}</small>
                  </div>
                </Field>
                <div className="background-actions">
                  <button className="remix" onClick={doRemix}><RefreshCw /><span><strong>Remix direction</strong><small>{remixDirection}</small></span></button>
                  <button className="new-background" onClick={generate}><Sparkles /><span><strong>Copy prompt to ChatGPT</strong><small>Alternative when no API key is connected</small></span></button>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="product-grid">
                {Object.entries(products).map(([id, x]) => (
                  <button
                    key={id}
                    onClick={() => {
                      const next = id as keyof typeof products;
                      setProduct(next);
                      setLayers((x) => ({ ...x, product: true, wash: false, radial: false }));
                      setNotice(
                        `${products[next].name} added as the only product layer. Optional finishes remain off.`,
                      );
                    }}
                    className={`product-card ${product === id ? "selected" : ""} ${id === "lineup" ? "wide" : ""}`}
                    style={{ "--sku": x.color } as React.CSSProperties}
                  >
                    <img src={id === "lineup" ? "/assets/can-lineup.png" : `/assets/can-${id}.png`} alt="" />
                    <strong>{x.name}</strong>
                    <small>{x.flavour}</small>
                    {product === id && <Check className="tick" />}
                  </button>
                ))}
              </div>
            )}
            {step === 2 && (
              <div className="stack">
                <Field label="Headline">
                  <input
                    className="headline-input"
                    value={headline}
                    onChange={(e) => { setHeadline(e.target.value.toUpperCase()); setLayers((x) => ({...x, headline: true})); }}
                  />
                </Field>
                <button
                  className={`text-layer-toggle ${layers.headline ? "active" : ""}`}
                  onClick={() => setLayers((x) => ({ ...x, headline: !x.headline }))}
                >
                  {layers.headline ? <><Trash2 /> Remove text from artwork</> : <><Plus /> Add text to artwork</>}
                </button>
                <Field label="Prompted inspiration">
                  <div className="chip-grid">
                    {[
                      "DRINK BRIGHTER",
                      "GOOD PEOPLE. BRIGHTER DAYS.",
                      "NATURE HAS A BRIGHTER SIDE",
                      "FOUR WAYS TO DRINK BRIGHTER",
                      "SMALL BOTANICALS. BIG IMPACT.",
                      "A BRIGHTER KIND OF ROUTINE",
                    ].map((x) => (
                      <button key={x} onClick={() => { setHeadline(x); setLayers((l) => ({...l, headline: true})); }}>
                        {x}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            )}
            {step === 3 && (
              <div className="stack">
                <Field label="Visual direction">
                  <Select value={vibe} onValueChange={(x) => setVibe(x ?? vibe)}>
                    <SelectTrigger className="select"><SelectValue /></SelectTrigger>
                    <SelectContent className="theme-menu" position="popper" sideOffset={6}>
                      {["Editorial & sculptural","Bright & architectural","Cinematic & nocturnal","Playful & kinetic","Quiet luxury","Hard-flash documentary"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={`Energy — ${energy[0]}%`}><Slider value={energy} onValueChange={setEnergy} /></Field>
                <div className="finish-note"><strong>Finishes start off.</strong><span>Add logo, wordmark, colour wash or the approved SKU radial from Visual Layers only when required.</span></div>
                <button className={`theme-align ${themeAligned ? "active" : ""}`} onClick={alignCanToScene} disabled={!layers.product}>
                  <WandSparkles />
                  <span><strong>{themeAligned ? "Theme alignment on" : "Align can to scene"}</strong><small>Matches light, contrast and grounding shadow without changing the can master</small></span>
                </button>
                <BrandLock />
              </div>
            )}
            {step === 4 && (
              <div className="stack">
                <div className="output-grid">
                  {outputs.map((x) => (
                    <button key={x.id} onClick={() => setOutput(x.id)} className={output === x.id ? "selected" : ""}>
                      <span style={{ aspectRatio: `${x.w}/${x.h}` }} /><strong>{x.label}</strong><small>{x.w} × {x.h}</small>
                    </button>
                  ))}
                </div>
                <Field label="Download format"><div className="format-pills">{["png","webp","jpg"].map((x) => <button className={downloadFormat === x ? "on" : ""} key={x} onClick={() => setDownloadFormat(x)}>{x.toUpperCase()}</button>)}</div></Field>
              </div>
            )}
          </div>
          <div className="builder-nav">
            <Button
              variant="ghost"
              disabled={!step}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft />
              Back
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)}>
                Continue
                <ArrowRight />
              </Button>
            ) : downloadAsset ? (
              <a
                className="generate download-artwork-final download-ready"
                href={downloadAsset.url}
                download={downloadAsset.filename}
                onClick={() => window.setTimeout(() => {
                  URL.revokeObjectURL(downloadAsset.url);
                  setDownloadAsset(null);
                }, 3000)}
              >
                <Download />
                Download now · {downloadFormat.toUpperCase()}
              </a>
            ) : (
              <Button onClick={exportCreative} className="generate download-artwork-final">
                <Download />
                Prepare artwork · {downloadFormat.toUpperCase()}
              </Button>
            )}
          </div>
        </section>
        <section className="preview">
          <div className="preview-head">
            <div>
              <p className="eyebrow">Live artboard</p>
              <p>
                {out.label} · {out.w} × {out.h}
              </p>
              <p className="editor-hint">Select an overlay, drag to move, use the corner handle to resize.</p>
            </div>
            <div>
              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => loadImage(e.target.files?.[0])}
              />
              {generatedImage && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedImage(null);
                    clearOverlays();
                  }}
                >
                  <Trash2 /> Remove image
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => uploadRef.current?.click()}
              >
                <Upload />
                Load result
              </Button>
              {downloadAsset ? (
                <a
                  className="download-artwork download-ready"
                  href={downloadAsset.url}
                  download={downloadAsset.filename}
                  onClick={() => window.setTimeout(() => {
                    URL.revokeObjectURL(downloadAsset.url);
                    setDownloadAsset(null);
                  }, 3000)}
                >
                  <Download />
                  <span><strong>Download now</strong><small>{downloadFormat.toUpperCase()} · ready</small></span>
                </a>
              ) : (
                <Button onClick={exportCreative} className="download-artwork">
                  <Download />
                  <span><strong>Prepare download</strong><small>{downloadFormat.toUpperCase()} · {out.w} × {out.h}px</small></span>
                </Button>
              )}
            </div>
          </div>
          <div className="design-area">
            <LayerPanel
              layers={layers}
              setLayers={setLayers}
              product={product}
              tone={brandTone}
              setTone={setBrandTone}
            />
            <div className="artboard-shell">
              <div
                className="artboard"
                ref={artboardRef}
                onPointerDown={() => setSelectedOverlay(null)}
                style={
                  {
                    aspectRatio: `${out.w}/${out.h}`,
                    "--sku": p.color,
                  } as React.CSSProperties
                }
              >
                {layers.background && activeBackground && (
                  <img
                    className="scene"
                    src={activeBackground}
                    alt="Creative preview"
                  />
                )}
                {layers.wash && <div className="wash" />}
                {layers.radial && product !== "lineup" && (
                  <EditableOverlay id="radial" transform={transforms.radial} selected={selectedOverlay === "radial"} className="overlay-radial" onStart={beginOverlayInteraction}>
                    <img
                      src={p.radial}
                      alt="Approved radial master"
                    />
                  </EditableOverlay>
                )}
                {layers.product && (
                  <EditableOverlay id="product" transform={transforms.product} selected={selectedOverlay === "product"} className={product === "lineup" ? "overlay-product lineup" : "overlay-product single"} onStart={beginOverlayInteraction}>
                    <div className="theme-aligned-pack" style={{ filter: themeAligned ? canFilter : "none" }}>
                      <ProductPack product={product} />
                    </div>
                  </EditableOverlay>
                )}
                {layers.logo && (
                  <EditableOverlay id="logo" transform={transforms.logo} selected={selectedOverlay === "logo"} className="overlay-logo" onStart={beginOverlayInteraction}>
                    <img
                      src={`/assets/brand-mark-${brandTone}.png`}
                      alt="Flowerful stacked lockup"
                    />
                  </EditableOverlay>
                )}
                {layers.wordmark && (
                  <EditableOverlay id="wordmark" transform={transforms.wordmark} selected={selectedOverlay === "wordmark"} className="overlay-wordmark" onStart={beginOverlayInteraction}>
                    <img src={`/assets/brand-wordmark-${brandTone}.png`} alt="Flowerful horizontal lockup" />
                  </EditableOverlay>
                )}
                {layers.headline && (
                  <EditableOverlay id="headline" transform={transforms.headline} selected={selectedOverlay === "headline"} className={`overlay-headline tone-${brandTone}`} onStart={beginOverlayInteraction}>
                    <h2>{headlineLines.map((line) => <span key={line}>{line}</span>)}</h2>
                    <p>{p.flavour}</p>
                  </EditableOverlay>
                )}
                <div className="locked-badge">
                  <LockKeyhole />
                  BRAND LOCKED
                </div>
              </div>
            </div>
          </div>
          {notice && (
            <div className="notice">
              <Sparkles />
              {notice}
            </div>
          )}
          <details>
            <summary>Production prompt</summary>
            <p>{prompt}</p>
          </details>
        </section>
      </div>
    </main>
  );
}
function EditableOverlay({
  id,
  transform,
  selected,
  className,
  onStart,
  children,
}: {
  id: OverlayKey;
  transform: OverlayTransform;
  selected: boolean;
  className: string;
  onStart: (e: React.PointerEvent, key: OverlayKey, mode: "move" | "resize") => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`editable-overlay ${className} ${selected ? "selected" : ""}`}
      style={{
        left: `${transform.x}%`,
        top: `${transform.y}%`,
        transform: `translate(-50%, -50%) scale(${transform.scale})`,
      }}
      onPointerDown={(e) => onStart(e, id, "move")}
    >
      {children}
      {selected && (
        <button
          className="resize-handle"
          aria-label={`Resize ${id} proportionally`}
          onPointerDown={(e) => onStart(e, id, "resize")}
        />
      )}
    </div>
  );
}
function ProductPack({ product }: { product: keyof typeof products }) {
  if (product === "lineup")
    return (
      <div className="pack lineup">
        <img src="/assets/can-lineup.png" alt="Full Flowerful can line-up" />
      </div>
    );
  return (
    <div className="pack single">
      <img
        src={`/assets/can-${product}.png`}
        alt={`${products[product].name} can`}
      />
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function BrandLock() {
  return (
    <div className="brand-lock">
      <div>
        <LockKeyhole />
        <span>
          <strong>Brand masters</strong>
          <small>Immutable in every remix and export</small>
        </span>
      </div>
      {["Stacked lockup", "Horizontal lockup", "Radial artwork", "SKU colour masters"].map((x) => (
        <span key={x}>
          <Check /> {x}
        </span>
      ))}
      <p>
        Exact supplied artwork is composited after generation. Colour values
        stay locked to the approved master swatches; no Pantone references are
        invented.
      </p>
    </div>
  );
}
function splitHeadline(text: string) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > 18 && current) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}
function LayerPanel({
  layers,
  setLayers,
  product,
  tone,
  setTone,
}: {
  layers: Record<string, boolean>;
  setLayers: React.Dispatch<
    React.SetStateAction<{
      background: boolean;
      wash: boolean;
      radial: boolean;
      product: boolean;
      logo: boolean;
      wordmark: boolean;
      headline: boolean;
    }>
  >;
  product: keyof typeof products;
  tone: "white" | "silver" | "black";
  setTone: (v: "white" | "silver" | "black") => void;
}) {
  const labels: Record<string, string> = {
    background: "Background",
    product: "Selected product",
    headline: "Text",
    logo: "Stacked lockup",
    wordmark: "Horizontal lockup",
    wash: "Colour wash",
    ...(product === "lineup" ? {} : { radial: "Matching radial" }),
  };
  return (
    <aside className="layer-panel">
      <div>
        <Layers3 />
        Visual layers
      </div>
      {Object.entries(labels).map(([key, label]) => (
        <button
          key={key}
          onClick={() =>
            setLayers((x) => ({ ...x, [key]: !x[key as keyof typeof x] }))
          }
          className={!layers[key] ? "off" : ""}
        >
          {layers[key] ? <Eye /> : <EyeOff />}
          <span>{label}</span>
          <b>
            {layers[key] ? (
              <>
                <Trash2 />
                Remove
              </>
            ) : (
              <>
                <Plus />
                Add
              </>
            )}
          </b>
        </button>
      ))}
      <div className="tone-picker">
        <span>Brand colour</span>
        {(["white", "silver", "black"] as const).map((x) => (
          <button
            key={x}
            onClick={() => setTone(x)}
            className={tone === x ? "on" : ""}
          >
            <i
              style={{
                background:
                  x === "white"
                    ? "#fff"
                    : x === "silver"
                      ? "#bebebe"
                      : "#181818",
              }}
            />
            {x}
          </button>
        ))}
      </div>
      <small>
        Only the selected product can be shown: one SKU or the four-can line-up,
        never both. Text is a separate removable layer. The radial is optional
        and is never added automatically.
      </small>
    </aside>
  );
}
