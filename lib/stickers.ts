// Flowerful icon & sticker pack. Hand-built SVGs in one line + fill style that echoes the flower icon:
// 100-unit viewBox, 4-unit rounded strokes, two colour slots (line, fill) plus an accent.
export type Pal = { line: string; fill: string; accent: string };
export type StickerGroup = "Botanicals" | "Badges" | "Shapes" | "Lifestyle";
export type StickerDef = { id: string; name: string; group: StickerGroup; natural: Pal; aspect?: number; text?: string; textArea?: { x: number; y: number; w: number; size: number }; flavours?: string[] };

const S = (p: Pal, body: string, vb = "0 0 100 100") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><g stroke="${p.line}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;

function chrys(p: Pal) {
  let petals = "";
  for (let i = 0; i < 18; i++) {
    const a = (i * 360) / 18;
    petals += `<path transform="rotate(${a} 50 50)" d="M50 50 C45 38 45 18 50 8 C55 18 55 38 50 50Z" fill="${i % 2 ? p.fill : p.accent}" stroke-width="2.6"/>`;
  }
  return petals + `<circle cx="50" cy="50" r="11" fill="${p.line}" stroke="none"/><circle cx="46" cy="46" r="3" fill="${p.accent}" stroke="none"/>`;
}
const drupes = (p: Pal) => {
  const pts = [[38, 46], [50, 44], [62, 46], [33, 58], [45, 57], [57, 57], [68, 58], [38, 70], [50, 70], [62, 70], [44, 81], [56, 81]];
  return pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.4" fill="${p.fill}" stroke-width="2.6"/><circle cx="${x - 2}" cy="${y - 2.2}" r="1.6" fill="${p.accent}" stroke="none"/>`).join("");
};

const art: Record<string, (p: Pal) => string> = {
  "butterfly-pea": (p) => S(p, `<path d="M50 90 C22 82 10 54 20 33 C28 16 45 14 50 27 C55 14 72 16 80 33 C90 54 78 82 50 90Z" fill="${p.fill}"/>
    <path d="M50 74 C38 68 36 52 43 44 C46 41 50 43 50 47 C50 43 54 41 57 44 C64 52 62 68 50 74Z" fill="${p.accent}" stroke-width="2.6"/>
    <path d="M50 84 V52 M50 66 L42 58 M50 66 L58 58" stroke-width="2.6"/><path d="M50 90 L47 97" />`),
  raspberry: (p) => S(p, `<path d="M50 91 C30 88 22 66 25 50 C28 38 39 34 50 34 C61 34 72 38 75 50 C78 66 70 88 50 91Z" fill="${p.fill}"/>${drupes(p)}
    <path d="M50 36 C44 26 36 24 30 26 C36 32 42 36 50 36 C58 36 64 32 70 26 C64 24 56 26 50 36Z M50 36 V14" fill="${p.accent === "#FFFFFF" ? "#5E9E4A" : p.accent}" stroke-width="3"/>`),
  "saffron-thread": (p) => S(p, `<path d="M50 94 C47 72 38 50 28 24 M50 94 C50 70 51 46 52 14 M50 94 C54 72 62 52 73 26" stroke="${p.fill}" stroke-width="4.4" fill="none"/>
    <path d="M22 26 L28 12 L36 22 Z M46 16 L52 4 L59 15 Z M67 28 L74 14 L80 26 Z" fill="${p.fill}" stroke="${p.fill}" stroke-width="3"/>
    <path d="M50 94 V84" stroke="${p.accent}" stroke-width="5"/>`),
  "cardamom-pod": (p) => S(p, `<path d="M50 10 C72 26 74 66 50 92 C26 66 28 26 50 10Z" fill="${p.fill}"/>
    <path d="M50 16 C42 38 42 66 50 86 M50 16 C58 38 58 66 50 86" stroke-width="2.6" fill="none"/>
    <path d="M44 34 C40 40 39 48 40 56" stroke="${p.accent}" stroke-width="3" fill="none"/><path d="M50 10 L50 3"/>`),
  "roselle-bud": (p) => S(p, `<path d="M50 90 C30 86 24 66 30 50 C34 38 42 30 50 16 C58 30 66 38 70 50 C76 66 70 86 50 90Z" fill="${p.fill}"/>
    <path d="M50 88 C44 70 44 46 50 18 M37 82 C34 66 36 48 44 34 M63 82 C66 66 64 48 56 34" stroke-width="2.6" fill="none"/>
    <path d="M40 90 L32 96 M60 90 L68 96 M50 90 V98" stroke="${p.accent}"/>`),
  chrysanthemum: (p) => S(p, chrys(p)),
  leaf: (p) => S(p, `<path d="M18 82 C18 42 48 18 84 16 C82 52 58 82 18 82Z" fill="${p.fill}"/><path d="M18 82 C40 62 60 40 84 16 M44 56 L40 40 M56 44 L54 30 M44 56 L60 58 M56 44 L70 46" stroke-width="2.6" fill="none"/>`),
  petal: (p) => S(p, `<path d="M50 92 C24 72 24 36 50 10 C76 36 76 72 50 92Z" fill="${p.fill}"/><path d="M50 86 V30 M50 60 L40 48 M50 60 L60 48" stroke-width="2.6" fill="none" stroke="${p.accent}"/>`),
  petals: (p) => S(p, `<path d="M30 60 C14 50 14 30 28 16 C42 30 42 50 30 60Z" fill="${p.fill}" transform="rotate(-24 28 40)"/>
    <path d="M70 52 C56 42 56 22 70 8 C84 22 84 42 70 52Z" fill="${p.accent}" transform="rotate(18 70 30)"/>
    <path d="M52 94 C36 84 36 64 50 50 C64 64 64 84 52 94Z" fill="${p.fill}" transform="rotate(8 50 72)"/>`),
  // shapes
  sparkle: (p) => S(p, `<path d="M50 6 C54 38 62 46 94 50 C62 54 54 62 50 94 C46 62 38 54 6 50 C38 46 46 38 50 6Z" fill="${p.fill}"/>`),
  sparkles: (p) => S(p, `<path d="M40 14 C43 38 50 44 74 47 C50 50 43 56 40 80 C37 56 30 50 6 47 C30 44 37 38 40 14Z" fill="${p.fill}"/>
    <path d="M78 8 C79 18 82 20 92 21 C82 22 79 24 78 34 C77 24 74 22 64 21 C74 20 77 18 78 8Z" fill="${p.accent}" stroke-width="3"/>
    <path d="M80 66 C81 74 83 76 91 77 C83 78 81 80 80 88 C79 80 77 78 69 77 C77 76 79 74 80 66Z" fill="${p.fill}" stroke-width="3"/>`),
  bubbles: (p) => S(p, `<circle cx="38" cy="60" r="24" fill="${p.fill}" fill-opacity=".35"/><circle cx="74" cy="32" r="14" fill="${p.fill}" fill-opacity=".35"/><circle cx="76" cy="76" r="8" fill="${p.fill}" fill-opacity=".35"/><circle cx="24" cy="20" r="6" fill="${p.fill}" fill-opacity=".35"/>
    <path d="M26 52 C28 46 32 42 38 40 M68 26 C70 24 72 23 74 23" stroke="${p.accent}" stroke-width="3.4" fill="none"/>`),
  blob: (p) => S(p, `<path d="M52 8 C72 8 90 22 92 44 C94 66 80 90 56 92 C32 94 10 82 8 58 C6 34 28 8 52 8Z" fill="${p.fill}" stroke="none"/>`),
  wave: (p) => S(p, `<path d="M4 34 C16 22 28 22 40 34 S64 46 76 34 S96 22 96 22 M4 54 C16 42 28 42 40 54 S64 66 76 54 S96 42 96 42 M4 74 C16 62 28 62 40 74 S64 86 76 74 S96 62 96 62" fill="none" stroke="${p.fill}" stroke-width="5"/>`),
  arch: (p) => S(p, `<path d="M18 94 V46 A32 32 0 0 1 82 46 V94 Z" fill="${p.fill}"/><path d="M30 94 V48 A20 20 0 0 1 70 48 V94" fill="none" stroke="${p.accent}" stroke-width="2.6"/>`),
  frame: (p) => S(p, `<rect x="8" y="8" width="84" height="84" rx="16" fill="none" stroke="${p.fill}" stroke-width="3.4"/><rect x="16" y="16" width="68" height="68" rx="10" fill="none" stroke="${p.fill}" stroke-width="1.8" stroke-dasharray="2 6"/>
    <circle cx="8" cy="50" r="3.6" fill="${p.fill}" stroke="none"/><circle cx="92" cy="50" r="3.6" fill="${p.fill}" stroke="none"/>`),
  // lifestyle markers
  sun: (p) => S(p, `<circle cx="50" cy="50" r="20" fill="${p.fill}"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path transform="rotate(${a} 50 50)" d="M50 8 V20"/>`).join("")}`),
  headphones: (p) => S(p, `<path d="M20 62 V50 A30 30 0 0 1 80 50 V62" fill="none"/><rect x="12" y="56" width="18" height="30" rx="8" fill="${p.fill}"/><rect x="70" y="56" width="18" height="30" rx="8" fill="${p.fill}"/>`),
  notebook: (p) => S(p, `<rect x="24" y="12" width="56" height="78" rx="8" fill="${p.fill}"/><path d="M38 34 H68 M38 46 H68 M38 58 H60" stroke="${p.accent}" stroke-width="3.4"/>${[22, 38, 54, 70].map((y) => `<path d="M18 ${y} H30" />`).join("")}`),
  "yoga-mat": (p) => S(p, `<path d="M28 30 H78 A12 22 0 0 1 78 74 H28" fill="${p.fill}"/><ellipse cx="28" cy="52" rx="12" ry="22" fill="${p.accent}"/><ellipse cx="28" cy="52" rx="5" ry="10" fill="none" stroke-width="2.6"/><path d="M60 30 C58 44 58 60 60 74" stroke-width="2.6" fill="none"/>`),
  "gym-bag": (p) => S(p, `<path d="M36 40 C36 24 64 24 64 40" fill="none"/><rect x="12" y="38" width="76" height="44" rx="18" fill="${p.fill}"/><path d="M24 50 H76" stroke="${p.accent}" stroke-width="3"/><circle cx="70" cy="50" r="3" fill="${p.accent}" stroke="none"/>`),
  towel: (p) => S(p, `<rect x="14" y="54" width="72" height="26" rx="8" fill="${p.fill}"/><rect x="20" y="32" width="64" height="24" rx="8" fill="${p.accent}"/><path d="M28 40 H76 M22 66 H78" stroke-width="2.6"/>`),
  // badge shapes (text is drawn on top by the studio so it stays editable in Fredoka)
  "badge-pill": (p) => S(p, `<rect x="4" y="4" width="152" height="52" rx="26" fill="${p.fill}" stroke="none"/><rect x="10" y="10" width="140" height="40" rx="20" fill="none" stroke="${p.accent}" stroke-width="2" stroke-dasharray="1 5"/>`, "0 0 160 60"),
  "badge-round": (p) => S(p, `${Array.from({ length: 20 }, (_, i) => `<circle transform="rotate(${i * 18} 50 50)" cx="50" cy="7" r="7" fill="${p.fill}" stroke="none"/>`).join("")}<circle cx="50" cy="50" r="42" fill="${p.fill}" stroke="none"/><circle cx="50" cy="50" r="35" fill="none" stroke="${p.accent}" stroke-width="2"/>`),
  "badge-sugar": (p) => S(p, `<path d="M50 6 C66 10 80 12 90 12 V48 C90 72 72 88 50 96 C28 88 10 72 10 48 V12 C20 12 34 10 50 6Z" fill="${p.fill}" stroke="${p.accent}" stroke-width="3"/>`),
  "badge-ribbon": (p) => S(p, `<path d="M4 8 H196 L186 30 L196 52 H4 L14 30 Z" fill="${p.fill}" stroke="none"/><path d="M18 16 H182 M18 44 H182" stroke="${p.accent}" stroke-width="1.6" stroke-dasharray="1 5"/>`, "0 0 200 60"),
  "badge-tag": (p) => S(p, `<path d="M30 4 H152 A6 6 0 0 1 158 10 V50 A6 6 0 0 1 152 56 H30 L6 30 Z" fill="${p.fill}" stroke="none"/><circle cx="26" cy="30" r="5" fill="${p.accent}" stroke="none"/>`, "0 0 160 60"),
  "badge-swipe": (p) => S(p, `<rect x="4" y="4" width="152" height="52" rx="26" fill="${p.fill}" stroke="none"/><path d="M118 30 H142 M132 20 L142 30 L132 40" stroke="${p.accent}" stroke-width="4.4" fill="none"/>`, "0 0 160 60"),
};

const nat = {
  pea: { line: "#1B1F7A", fill: "#2E4BFF", accent: "#F7F1C9" },
  rasp: { line: "#7A1035", fill: "#E0285C", accent: "#FFFFFF" },
  saff: { line: "#8A1F00", fill: "#D8340F", accent: "#F6D7A6" },
  card: { line: "#3E5A1E", fill: "#9DBB5B", accent: "#E9F2C9" },
  ros: { line: "#5E0620", fill: "#B5123E", accent: "#6E8F3A" },
  chry: { line: "#9A6A00", fill: "#FFE08A", accent: "#FFF6D8" },
  leaf: { line: "#2F5A23", fill: "#7BB062", accent: "#D9EBC9" },
  ink: { line: "#241A1E", fill: "#FFFFFF", accent: "#241A1E" },
  white: { line: "#FFFFFF", fill: "#FFFFFF", accent: "#FFFFFF" },
  badge: { line: "#241A1E", fill: "#241A1E", accent: "#FFFFFF" },
};
export const stickers: StickerDef[] = [
  { id: "butterfly-pea", name: "Butterfly pea", group: "Botanicals", natural: nat.pea, flavours: ["flourish"] },
  { id: "raspberry", name: "Raspberry", group: "Botanicals", natural: nat.rasp, flavours: ["flourish"] },
  { id: "saffron-thread", name: "Saffron thread", group: "Botanicals", natural: nat.saff, flavours: ["focus"] },
  { id: "cardamom-pod", name: "Cardamom pod", group: "Botanicals", natural: nat.card, flavours: ["focus"] },
  { id: "roselle-bud", name: "Roselle bud", group: "Botanicals", natural: nat.ros, flavours: ["flow"] },
  { id: "chrysanthemum", name: "Chrysanthemum", group: "Botanicals", natural: nat.chry, flavours: ["float"] },
  { id: "leaf", name: "Leaf", group: "Botanicals", natural: nat.leaf },
  { id: "petal", name: "Petal", group: "Botanicals", natural: nat.pea },
  { id: "petals", name: "Petals", group: "Botanicals", natural: { ...nat.pea, accent: "#8A7BFF" } },
  { id: "badge-pill", name: "NEW", group: "Badges", natural: nat.badge, aspect: 160 / 60, text: "NEW", textArea: { x: 0.5, y: 0.5, w: 0.8, size: 0.4 } },
  { id: "badge-round", name: "Coming soon", group: "Badges", natural: nat.badge, text: "COMING\nSOON", textArea: { x: 0.5, y: 0.5, w: 0.62, size: 0.15 } },
  { id: "badge-sugar", name: "Sugar badge", group: "Badges", natural: { line: "#FFFFFF", fill: "#FFFFFF", accent: "#241A1E" }, text: "4%\nsugar", textArea: { x: 0.5, y: 0.5, w: 0.6, size: 0.2 } },
  { id: "badge-ribbon", name: "Lightly sparkling", group: "Badges", natural: nat.badge, aspect: 200 / 60, text: "LIGHTLY SPARKLING", textArea: { x: 0.5, y: 0.52, w: 0.8, size: 0.3 } },
  { id: "badge-tag", name: "Flavour tag", group: "Badges", natural: nat.badge, aspect: 160 / 60, text: "FLAVOUR", textArea: { x: 0.56, y: 0.52, w: 0.66, size: 0.34 } },
  { id: "badge-swipe", name: "Swipe", group: "Badges", natural: nat.badge, aspect: 160 / 60, text: "SWIPE", textArea: { x: 0.42, y: 0.52, w: 0.6, size: 0.36 } },
  { id: "sparkle", name: "Sparkle", group: "Shapes", natural: nat.white },
  { id: "sparkles", name: "Sparkles", group: "Shapes", natural: nat.white },
  { id: "bubbles", name: "Bubbles", group: "Shapes", natural: nat.white },
  { id: "blob", name: "Blob", group: "Shapes", natural: nat.white },
  { id: "wave", name: "Waves", group: "Shapes", natural: nat.white },
  { id: "arch", name: "Arch", group: "Shapes", natural: { line: "#FFFFFF", fill: "rgba(255,255,255,.22)", accent: "#FFFFFF" } },
  { id: "frame", name: "Frame", group: "Shapes", natural: nat.white },
  { id: "sun", name: "Sun", group: "Lifestyle", natural: nat.ink },
  { id: "headphones", name: "Headphones", group: "Lifestyle", natural: nat.ink },
  { id: "notebook", name: "Notebook", group: "Lifestyle", natural: nat.ink },
  { id: "yoga-mat", name: "Yoga mat", group: "Lifestyle", natural: nat.ink },
  { id: "gym-bag", name: "Gym bag", group: "Lifestyle", natural: nat.ink },
  { id: "towel", name: "Towel", group: "Lifestyle", natural: nat.ink },
];
export const stickerById = (id: string) => stickers.find((s) => s.id === id)!;
export const botanicalsFor = (product: string) => (({ flourish: ["butterfly-pea", "raspberry"], focus: ["saffron-thread", "cardamom-pod"], flow: ["roselle-bud", "petal"], float: ["chrysanthemum", "petal"], lineup: ["petal", "leaf"] }) as Record<string, string[]>)[product] ?? ["petal"];

function mix(hex: string, amt: number) {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("");
}
export type StickerColour = "natural" | "flavour" | "white" | "ink";
export function paletteFor(def: StickerDef, mode: StickerColour, sku: string): Pal {
  if (mode === "natural") return def.natural;
  if (mode === "white") return def.group === "Badges" ? { line: "#FFFFFF", fill: "#FFFFFF", accent: sku } : { line: "#FFFFFF", fill: "rgba(255,255,255,.9)", accent: mix(sku, 0.75) };
  if (mode === "ink") return { line: "#241A1E", fill: def.group === "Badges" ? "#241A1E" : "#3B2E33", accent: def.group === "Badges" ? "#FFFFFF" : "#D9CFD3" };
  return { line: mix(sku, -0.45), fill: sku, accent: mix(sku, 0.72) };
}
export const badgeTextColour = (def: StickerDef, pal: Pal) => (def.group === "Badges" ? (def.id === "badge-sugar" && pal.fill === "#FFFFFF" ? "#241A1E" : pal.accent) : "#fff");
export function stickerSvg(id: string, pal: Pal) { return art[id](pal); }
export const svgUrl = (svg: string) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
export { mix };
