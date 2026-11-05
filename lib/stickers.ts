// Flowerful icon & sticker pack v2: fine-line botanical engraving and luxury-label iconography.
// 100-unit viewBox, 1.2-unit hairline strokes, no outlines heavier than that, one optional flat tone.
export type Pal = { line: string; fill: string; accent: string; tone?: number; shade?: boolean };
export type StickerGroup = "Botanicals" | "Badges" | "Shapes" | "Lifestyle";
export type StickerDef = { id: string; name: string; group: StickerGroup; natural: Pal; aspect?: number; text?: string; textArea?: { x: number; y: number; w: number; size: number }; flavours?: string[] };

const SW = 0.95;
const S = (p: Pal, body: string, vb = "0 0 100 100") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><defs><linearGradient id="sh" x1="0" y1="0" x2="1" y2="1"><stop offset=".35" stop-color="${p.line}" stop-opacity="0"/><stop offset="1" stop-color="${p.line}" stop-opacity=".38"/></linearGradient></defs><g stroke="${p.line}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round" fill="none">${body}</g></svg>`;
// a body shape: flat tone, optional soft shading (used by props), hairline outline
const B = (p: Pal, d: string, t = 1, w = SW) =>
  `<path d="${d}" fill="${p.fill}" fill-opacity="${(p.tone ?? 0.22) * t}" stroke="none"/>${p.shade ? `<path d="${d}" fill="url(#sh)" stroke="none"/>` : ""}<path d="${d}"${w !== SW ? ` stroke-width="${w}"` : ""}/>`;
// engraving hatch: fine diagonal lines clipped to a shape, only on the shadow side (x >= from)
let hid = 0;
const H = (d: string, from = 50, gap = 2.4, ang = 58, o = 0.55) => {
  const id = `h${++hid}`; let ls = "";
  for (let x = from - 60; x < 160; x += gap) ls += `M${x.toFixed(1)} -10 l${(-110 / Math.tan((ang * Math.PI) / 180)).toFixed(1)} 120 `;
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><clipPath id="${id}s"><rect x="${from}" y="0" width="${100 - from + 100}" height="200"/></clipPath><g clip-path="url(#${id})"><g clip-path="url(#${id}s)"><path d="${ls}" stroke-width=".45" opacity="${o}"/></g></g>`;
};
const fine = (d: string, o = 0.7, w = 0.8) => `<path d="${d}" stroke-width="${w}" opacity="${o}"/>`;
// deterministic jitter so hand-drawn repeats are never identical
const jit = (i: number, k = 1) => Math.sin(i * 12.9898 * k + 78.233) * 0.5;

function chrysanthemum(p: Pal) {
  let o = "";
  const ring = (n: number, L: number, w: number, off: number, t: number) => {
    for (let i = 0; i < n; i++) {
      const a = off + (i * 360) / n + jit(i, L) * 10, l = L * (1 + jit(i + 3, 2) * 0.16), ww = w * (1 + jit(i, 5) * 0.3), bend = jit(i, 7) * 6;
      const d = `M50 50 C${50 - ww} ${50 - l * 0.35} ${50 - ww * 0.9 + bend} ${50 - l * 0.82} ${50 + bend * 0.6} ${50 - l} C${50 + ww * 0.9 + bend} ${50 - l * 0.82} ${50 + ww} ${50 - l * 0.35} 50 50Z`;
      o += `<g transform="rotate(${a.toFixed(1)} 50 50)">${B(p, d, t, 0.6)}${fine(`M50 ${50 - l * 0.25} L${50 + bend * 0.5} ${50 - l * 0.85}`, 0.45, 0.6)}</g>`;
    }
  };
  ring(26, 42, 3.6, 0, 0.9); ring(18, 30, 3.4, 7, 1.2); ring(12, 18, 3, 3, 1.5);
  let dots = "";
  for (let i = 0; i < 22; i++) { const a = i * 2.4, r = Math.sqrt(i) * 1.5; dots += `<circle cx="${(50 + Math.cos(a) * r).toFixed(2)}" cy="${(50 + Math.sin(a) * r).toFixed(2)}" r=".55" fill="${p.line}" stroke="none"/>`; }
  return o + `<circle cx="50" cy="50" r="7.6" fill="${p.fill}" fill-opacity="${Math.min(1, (p.tone ?? 0.22) * 2.4)}" stroke="none"/><circle cx="50" cy="50" r="7.6"/>` + dots;
}
function raspberry(p: Pal) {
  // drupelets packed on an ovoid, smaller and tighter towards the tip, each with a fine highlight
  let o = "";
  const rows = [[35, 5, 4.6], [43.5, 6, 4.9], [52, 7, 4.9], [60.5, 7, 4.9], [69, 6, 4.8], [77, 5, 4.4], [84, 4, 3.9], [89.5, 2, 3.2]];
  rows.forEach(([y, n, r], ri) => {
    const half = [17, 20.5, 23, 23.2, 21.5, 18, 13.5, 6][ri];
    for (let i = 0; i < n; i++) {
      const x = 50 - half + (i + 0.5) * ((half * 2) / n) + (ri % 2 ? 1.4 : -1.4) + jit(ri * 7 + i) * 1.2, yy = y + jit(i * 3 + ri) * 1.4;
      const rr = r * 0.92;
      o += `<circle cx="${x.toFixed(2)}" cy="${yy.toFixed(2)}" r="${rr.toFixed(2)}" fill="${p.fill}" fill-opacity="${(p.tone ?? 0.2) * 1.3}" stroke="none"/>`
        + `<path d="M${(x - rr).toFixed(2)} ${yy.toFixed(2)} A${rr} ${rr} 0 0 0 ${(x + rr * 0.7).toFixed(2)} ${(yy - rr * 0.7).toFixed(2)}" stroke-width=".45" opacity=".55"/>`
        + `<path d="M${(x - rr * 0.95).toFixed(2)} ${(yy + rr * 0.3).toFixed(2)} A${rr} ${rr} 0 0 0 ${(x + rr).toFixed(2)} ${(yy - rr * 0.1).toFixed(2)}" stroke-width=".8"/>`
        + `<circle cx="${(x - rr * 0.35).toFixed(2)}" cy="${(yy - rr * 0.35).toFixed(2)}" r="${(rr * 0.2).toFixed(2)}" fill="#fff" fill-opacity=".85" stroke="none"/>`
        + (x > 50 ? `<path d="M${(x - rr * 0.4).toFixed(2)} ${(yy + rr * 0.75).toFixed(2)} q${(rr * 0.6).toFixed(2)} ${(rr * 0.15).toFixed(2)} ${(rr * 1.1).toFixed(2)} ${(-rr * 0.45).toFixed(2)}" stroke-width=".45" opacity=".6"/>` : "");
    }
  });
  const sep = (a: number, l: number) => `<path transform="rotate(${a} 50 31)" d="M50 31 C48 27 48.6 ${31 - l * 0.6} 50 ${31 - l} C51.4 ${31 - l * 0.6} 52 27 50 31Z" fill="${p.accent}" fill-opacity=".5"/>`;
  return o + [-112, -70, -28, 20, 64, 104].map((a, i) => sep(a, 9 + (i % 2) * 3)).join("") + `<path d="M50 30 C50 22 52 14 58 7"/>` + fine("M51 22 C53 20 55 19 57 19", 0.6);
}
const art: Record<string, (p: Pal) => string> = {
  // Clitoria ternatea, side view: broad standard petal with pale blaze and veins, keel, calyx, trifoliate leaf, tendril
  "butterfly-pea": (p) => S(p, `<g transform="rotate(-12 52 64)">${B(p, "M52 64 C37 66 21 60 15.5 47 C11 36 14 24 22 17.5 C30 11 40 9.6 48 11.6 C51 12.6 53.6 12.4 57 12.4 C69 10 82 17 85.5 30 C89 44 80 55 69 60 C63.5 62.6 57.5 64 52 64Z", 0.8)}${H("M52 64 C37 66 21 60 15.5 47 C11 36 14 24 22 17.5 C30 11 40 9.6 48 11.6 C51 12.6 53.6 12.4 57 12.4 C69 10 82 17 85.5 30 C89 44 80 55 69 60 C63.5 62.6 57.5 64 52 64Z", 58, 2.2, 62, 0.5)}
    <path d="M22 52 C20 55 21 57.5 23.5 58.5 M80 50 C83 52 83.5 55 81.5 57" stroke-width=".55" opacity=".7"/>
    <path d="M52 63 C46 57 43 50 44 42 C47 38 50 37 53 38 C57 41 59 48 57 56 C56 59 54 61.5 52 63Z" fill="${p.accent}" fill-opacity=".9" stroke-width=".6"/>${fine("M50 60 C48.5 53 48.6 46 50 40 M52.5 60 C53 53 54 47 54.5 41", 0.5, 0.4)}
    ${fine("M52 62 C40 55 28 46 22 34 M52 62 C43 50 35 37 31 22 M52 62 C47 47 44 33 44 20 M52 62 C55 47 58 32 62 18 M52 62 C60 50 69 38 76 26 M52 62 C64 56 74 48 81 39 M52 62 C40 60 28 56 20 48", 0.4, 0.5)}</g>
    ${B(p, "M52 64 C50 68 49 72 50 75 C53 74 55 70 55 66Z", 1.4, 0.7)}
    <path d="M50.5 75 C49 82 46 90 41 98"/>
    <path d="M47 85 C41 83 33 84 26 89" stroke-width=".8"/>
    ${B(p, "M34 84 C31 77 24 75 18 77 C21 83 28 86 34 84Z", 0.6, 0.7)}${fine("M34 84 C28 81 23 79 18 77", 0.5, 0.45)}
    ${B(p, "M27 88 C22 93 16 95 10 94 C14 89 20 86.5 27 88Z", 0.6, 0.7)}${fine("M27 88 C21 91 15 93 10 94", 0.5, 0.45)}
    <path d="M45 90 C52 89 57 92 56.5 95.5 C56 98 53 97.6 53.4 95.6" stroke-width=".6"/>`),
  raspberry: (p) => S(p, raspberry(p)),
  // three crocus stigmas joined at a pale style, each flaring to a frilled trumpet
  "saffron-thread": (p) => S(p, `${B(p, "M48.6 92 C47 74 40 56 30 38 C26 31 23 26 18 22 L15.5 15.8 Q18 16.6 19.8 14.4 Q22 17.2 25 16.2 L24.4 23 C29 28 32 33 35 39 C43 56 49.6 74 50.4 92Z", 2.6)}
    ${B(p, "M49.4 92 C48.8 71 48.8 45 48 19 L44.6 10.8 Q47.2 11.5 49.2 9 Q51.8 11.6 54.8 10.4 L52.2 19 C51.8 45 51 71 50.6 92Z", 2.6)}
    ${B(p, "M50.2 92 C52 76 58 60 66 46 C70 39 73 35 76 32 L75.6 25 Q78.4 26.6 80.8 24.2 Q83 27.6 85.8 27.2 L81.4 34 C77 38 73 43 69 49 C61 62 55 77 51.8 92Z", 2.6)}
    ${fine("M49.5 88 C47 72 40 56 30 40 C27 33 24 28 20.5 22 M49.8 88 C49.8 68 50 44 50.2 15 M50.6 88 C53 74 59 60 67 48 C72 40 75 36 79 30", 0.5, 0.6)}
    <path d="M50 92 C50 94.5 49.4 97 48.6 99" stroke="${p.accent}" stroke-width="1.6"/>`),
  // trilocular green pods with longitudinal ridges and fine striation, one turned behind
  "cardamom-pod": (p) => S(p, `<g transform="rotate(28 66 46)">${B(p, "M66 18 C79 28 80 56 66 74 C52 56 53 28 66 18Z", 0.7)}${fine("M66 22 C61 36 61 56 66 70 M66 22 C71 36 71 56 66 70", 0.5)}<path d="M66 18 V14.5"/></g>
    <g transform="rotate(-16 44 56)">${B(p, "M44 16 C62 30 63 68 44 94 C25 68 26 30 44 16Z")}
    <path d="M44 20 C37 38 37 66 44 89 M44 20 C51 38 51 66 44 89" stroke-width=".9"/>
    ${fine(Array.from({ length: 13 }, (_, i) => { const y = 28 + i * 4.6, w = Math.sin(((y - 16) / 78) * Math.PI) * 15; return `M${(44 + w * 0.44).toFixed(1)} ${y} q${(w * 0.22).toFixed(1)} 1 ${(w * 0.4).toFixed(1)} 2.4`; }).join(" "), 0.45, 0.6)}
    <path d="M44 16 L44 11 M42.8 94 L42 98.5"/></g>`),
  // Hibiscus sabdariffa calyx: five fleshy pointed sepals closed into a bud, narrow epicalyx bracts
  "roselle-bud": (p) => S(p, `${B(p, "M50 90 C37 87 31 72 34 57 C37 45 44 35 50 13 C56 35 63 45 66 57 C69 72 63 87 50 90Z")}${H("M50 90 C37 87 31 72 34 57 C37 45 44 35 50 13 C56 35 63 45 66 57 C69 72 63 87 50 90Z", 55, 2.1)}
    <path d="M50 88 C46.5 70 46.5 44 50 16 M41 84 C37 67 39.5 49 46.5 30 M59 84 C63 67 60.5 49 53.5 30" stroke-width=".9"/>
    <path d="M45 89 C39 92 33 94 26 94 M47 90 C43 94 39 97 34 99 M55 89 C61 92 67 94 74 94 M53 90 C57 94 61 97 66 99"/>
    <path d="M50 90 C50.5 93 50 96 49 99.5" stroke-width="1.4"/>`),
  chrysanthemum: (p) => S(p, chrysanthemum(p)),
  leaf: (p) => S(p, `${B(p, "M14 88 C17 58 36 30 70 16 C78 13 84 12 88 12 C86 42 70 72 40 84 C31 87.5 22 88.5 14 88Z")}
    <path d="M14 88 C30 70 54 42 88 12"/>${fine("M29 72 C27 64 27 56 30 49 M29 72 C37 72 45 70 52 66 M42 58 C41 50 42 42 46 35 M42 58 C50 58 57 55 63 51 M55 44 C55 37 57 31 61 26 M55 44 C62 43 68 41 73 37 M67 31 C68 26 70 22 73 19 M67 31 C72 30 76 28 79 25", 0.55, 0.7)}
    <path d="M14 88 L7 95"/>`),
  petal: (p) => S(p, `${B(p, "M47 94 C27 80 22 50 33 28 C38 18 45 11 52 7 C64 17 76 37 74 58 C72 76 62 88 47 94Z")}
    ${fine("M47 92 C45 70 46 44 51 10 M47 80 C40 66 35 52 34 34 M47 80 C55 66 62 52 66 38 M47 66 C42 58 39 50 38 42 M48 64 C53 56 57 48 59 40", 0.5, 0.65)}
    <path d="M52 7 C55 9 57 12 58 15" stroke-width=".7" opacity=".6"/>`),
  petals: (p) => S(p, `<g transform="rotate(-28 30 40)">${B(p, "M28 62 C16 52 15 34 24 21 C28 15 32 12 35 11 C42 22 44 38 38 52 C35 57 32 60 28 62Z", 0.9)}${fine("M28 60 C28 46 30 30 34 13", 0.5, 0.6)}</g>
    <g transform="rotate(22 70 30)">${B(p, "M70 52 C60 44 58 28 64 17 C67 12 70 9 73 8 C79 17 81 31 77 43 C75 47 73 50 70 52Z", 0.7)}${fine("M70 50 C70 38 71 24 73 10", 0.5, 0.6)}</g>
    <g transform="rotate(6 52 74)">${B(p, "M51 96 C40 88 38 72 44 60 C47 55 50 52 53 51 C60 60 62 74 58 86 C56 91 54 94 51 96Z", 1.1)}${fine("M51 94 C51 80 52 66 53 53", 0.5, 0.6)}</g>`),
  // pomegranate aril: small faceted jewel-like seed with a pale core and a fine highlight
  aril: (p) => S(p, `${B(p, "M50 12 C62 24 74 40 74 58 C74 76 63 90 50 90 C37 90 26 76 26 58 C26 40 38 24 50 12Z")}${H("M50 12 C62 24 74 40 74 58 C74 76 63 90 50 90 C37 90 26 76 26 58 C26 40 38 24 50 12Z", 56, 2.2)}
    ${fine("M50 16 L42 46 L50 86 M50 16 L60 48 L50 86 M30 60 L42 46 L60 48 L70 62", 0.4, 0.55)}
    <path d="M48 52 C46 58 47 66 50 70 C53 66 54 58 52 52 C51 50 49 50 48 52Z" fill="${p.accent}" fill-opacity=".55" stroke-width=".5"/>
    <path d="M36 40 C38 33 42 27 46 23" stroke="${p.accent}" stroke-width="1.4" opacity=".8"/>`),
  // shapes: hairline glints, fine effervescence, grain, rules, arches, frames
  sparkle: (p) => S(p, `<path d="M50 8 C51 38 52.5 47.5 92 50 C52.5 52.5 51 62 50 92 C49 62 47.5 52.5 8 50 C47.5 47.5 49 38 50 8Z" fill="${p.fill}" fill-opacity="${(p.tone ?? 0.22) * 0.6}"/><circle cx="50" cy="50" r=".9" fill="${p.line}" stroke="none"/>`),
  sparkles: (p) => S(p, `<path d="M38 16 C38.8 40 40 45 62 46 C40 47 38.8 52 38 76 C37.2 52 36 47 14 46 C36 45 37.2 40 38 16Z"/>
    <path d="M76 12 C76.4 22 77 23.4 86 24 C77 24.6 76.4 26 76 36 C75.6 26 75 24.6 66 24 C75 23.4 75.6 22 76 12Z" stroke-width=".9"/>
    <path d="M74 66 C74.3 72 74.6 73 80 73.4 C74.6 73.8 74.3 74.8 74 80.8 C73.7 74.8 73.4 73.8 68 73.4 C73.4 73 73.7 72 74 66Z" stroke-width=".8"/>
    <circle cx="58" cy="86" r=".9" fill="${p.line}" stroke="none"/><circle cx="88" cy="48" r=".7" fill="${p.line}" stroke="none"/>`),
  bubbles: (p) => S(p, [[40, 64, 13], [66, 36, 7.5], [72, 74, 4.4], [26, 30, 3.4], [52, 18, 2.4], [84, 56, 2], [30, 86, 1.6], [58, 52, 1.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>${r > 3 ? `<path d="M${x - r * 0.62} ${y - r * 0.2} A${r * 0.68} ${r * 0.68} 0 0 1 ${x - r * 0.1} ${y - r * 0.66}" stroke-width=".7" opacity=".7"/>` : ""}`).join("")),
  blob: (p) => { let o = ""; let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); for (let i = 0; i < 260; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 44; const x = 50 + Math.cos(a) * d, y = 50 + Math.sin(a) * d * 0.92; o += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(0.35 + r() * 0.55 * (1 - d / 50)).toFixed(2)}" fill="${p.line}" opacity="${(0.35 + 0.6 * (1 - d / 46)).toFixed(2)}" stroke="none"/>`; } return S(p, o); },
  wave: (p) => S(p, `<path d="M6 40 C22 33 34 33 50 40 S78 47 94 40"/><path d="M6 50 C22 43 34 43 50 50 S78 57 94 50" stroke-width=".8" opacity=".75"/><path d="M6 60 C22 53 34 53 50 60 S78 67 94 60" stroke-width=".6" opacity=".55"/>`),
  arch: (p) => S(p, `<path d="M20 96 V46 A30 30 0 0 1 80 46 V96" fill="${p.fill}" fill-opacity="${(p.tone ?? 0.22) * 0.5}"/><path d="M26 96 V47 A24 24 0 0 1 74 47 V96" stroke-width=".7" opacity=".7"/><path d="M14 96 H86" stroke-width=".8"/>`),
  frame: (p) => S(p, `<rect x="8" y="8" width="84" height="84"/><rect x="12" y="12" width="76" height="76" stroke-width=".6" opacity=".75"/>${[[8, 8], [92, 8], [8, 92], [92, 92]].map(([x, y]) => `<path d="M${x - 3} ${y} H${x + 3} M${x} ${y - 3} V${y + 3}" stroke-width=".8"/>`).join("")}<path d="M44 8 H56 M44 92 H56" stroke="${p.line}" stroke-width="2.4" opacity="0"/><circle cx="50" cy="8" r="1.1" fill="${p.line}" stroke="none"/><circle cx="50" cy="92" r="1.1" fill="${p.line}" stroke="none"/>`),
  // lifestyle markers, refined monoline
  sun: (p) => S(p, `<circle cx="50" cy="50" r="15"/><circle cx="50" cy="50" r="11.5" stroke-width=".6" opacity=".6"/>${Array.from({ length: 24 }, (_, i) => `<path transform="rotate(${i * 15} 50 50)" d="M50 ${i % 2 ? 26 : 22} V${i % 2 ? 31 : 30}" stroke-width="${i % 2 ? 0.7 : 1.1}"/>`).join("")}`),
  headphones: (p) => S(p, `<path d="M22 60 V50 C22 33 35 22 50 22 C65 22 78 33 78 50 V60"/><path d="M26 58 V50 C26 36 37 26 50 26 C63 26 74 36 74 50 V58" stroke-width=".6" opacity=".6"/>
    <path d="M17 58 C17 55 19 54 22 54 H27 V82 H22 C19 82 17 81 17 78Z"/><path d="M83 58 C83 55 81 54 78 54 H73 V82 H78 C81 82 83 81 83 78Z"/>${fine("M21 62 V74 M79 62 V74", 0.5, 0.6)}`),
  notebook: (p) => S(p, `<path d="M27 12 H76 C78 12 79 13 79 15 V87 C79 89 78 90 76 90 H27 Z"/><path d="M33 12 V90" stroke-width=".7"/>${fine("M41 30 H71 M41 37 H71 M41 44 H71 M41 51 H64", 0.55, 0.6)}
    <path d="M70 12 V30 L73 27 L76 30 V12" stroke-width=".8"/><path d="M82 22 L86 20 V84 C86 86 85 87 83 87" stroke-width=".7" opacity=".7"/>`),
  "yoga-mat": (p) => S(p, `<ellipse cx="28" cy="50" rx="10" ry="19"/><path d="M28 31 H76 C82 31 86 39.5 86 50 C86 60.5 82 69 76 69 H28"/>
    <path d="M28 41 C24 42 22.5 46 22.5 50 C22.5 54 24.5 57.5 28 58 C30.5 57.5 32 54 32 50 C32 47 31 45 29 44.5" stroke-width=".8"/>
    ${fine("M44 31 C42 43 42 57 44 69 M60 31 C58 43 58 57 60 69", 0.45, 0.6)}<path d="M40 31 V26 C40 24 41 23 43 23 H61 C63 23 64 24 64 26 V31" stroke-width=".8"/>`),
  "gym-bag": (p) => S(p, `<path d="M16 46 C16 41 19 38 24 38 H76 C81 38 84 41 84 46 V78 C84 81 82 83 79 83 H21 C18 83 16 81 16 78Z"/>
    <path d="M36 38 C36 26 42 20 50 20 C58 20 64 26 64 38"/><path d="M39 38 C39 28 44 23.5 50 23.5 C56 23.5 61 28 61 38" stroke-width=".6" opacity=".6"/>
    <path d="M16 52 H84" stroke-width=".7"/>${fine("M22 49 H78", 0.4, 0.5)}<circle cx="72" cy="52" r="1.6"/><path d="M28 83 V88 M72 83 V88" stroke-width=".8"/>`),
  towel: (p) => S(p, `<path d="M16 34 H80 C83 34 84 36 84 38 V46 H16 Z"/><path d="M16 46 H84 V62 H16 Z"/><path d="M16 62 H84 V74 C84 77 82 78 80 78 H16 Z"/>
    ${fine("M16 38.5 H84 M16 66 H84 M16 70 H84", 0.45, 0.6)}${fine(Array.from({ length: 16 }, (_, i) => `M${20 + i * 4} 78 v3`).join(" "), 0.55, 0.6)}`),
  // badges: thin-ruled tags and seals. Text is drawn by the studio so it stays editable.
  "badge-pill": (p) => S(p, `<rect x="3" y="3" width="154" height="54" rx="1.5" fill="${p.fill}" fill-opacity="${p.tone ?? 1}"/><rect x="8" y="8" width="144" height="44" stroke-width=".6"/>${fine("M18 15 H34 M126 15 H142 M18 45 H34 M126 45 H142", 0)}`, "0 0 160 60"),
  "badge-round": (p) => S(p, `<circle cx="50" cy="50" r="46" fill="${p.fill}" fill-opacity="${p.tone ?? 1}"/><circle cx="50" cy="50" r="41.5" stroke-width=".6"/><circle cx="50" cy="50" r="39.5" stroke-width=".4" opacity=".6"/>
    ${Array.from({ length: 48 }, (_, i) => `<path transform="rotate(${i * 7.5} 50 50)" d="M50 5.5 V7.5" stroke-width=".5"/>`).join("")}
    <path d="M40 30 H60 M40 70 H60" stroke-width=".6"/><path d="M50 26 l1.4 4 -1.4 4 -1.4 -4Z M50 66 l1.4 4 -1.4 4 -1.4 -4Z" fill="${p.line}" stroke="none"/>`),
  "badge-sugar": (p) => S(p, `<path d="M50 4 C70 4 86 12 92 22 V78 C86 88 70 96 50 96 C30 96 14 88 8 78 V22 C14 12 30 4 50 4Z" fill="${p.fill}" fill-opacity="${p.tone ?? 1}"/><path d="M50 9 C68 9 82 16 87 25 V75 C82 84 68 91 50 91 C32 91 18 84 13 75 V25 C18 16 32 9 50 9Z" stroke-width=".6"/>`),
  "badge-ribbon": (p) => S(p, `<path d="M3 14 H197 L189 30 L197 46 H3 L11 30 Z" fill="${p.fill}" fill-opacity="${p.tone ?? 1}"/><path d="M16 19 H184 M16 41 H184" stroke-width=".5"/>`, "0 0 200 60"),
  "badge-tag": (p) => S(p, `<path d="M28 6 H154 V54 H28 L8 30 Z" fill="${p.fill}" fill-opacity="${p.tone ?? 1}"/><path d="M31 10.5 H149.5 V49.5 H31 L14 30 Z" stroke-width=".5"/><circle cx="24" cy="30" r="3.2"/><path d="M21 30 C14 30 6 26 1 18" stroke-width=".7"/>`, "0 0 160 60"),
  "badge-swipe": (p) => S(p, `<path d="M8 44 H152" stroke-width=".6"/><path d="M110 50 H150 M144 46 L150 50 L144 54" stroke-width=".9"/><path d="M8 16 H40" stroke-width=".6"/>`, "0 0 160 60"),
};

const nat = {
  pom: { line: "#4A0414", fill: "#B3122F", accent: "#F7D9DF", tone: 0.26 },
  pea: { line: "#1A2160", fill: "#2E4BFF", accent: "#F2EBD2", tone: 0.2 },
  rasp: { line: "#5C1027", fill: "#C42552", accent: "#5E7F3E", tone: 0.2 },
  saff: { line: "#7A1A05", fill: "#C8320E", accent: "#E9C77E", tone: 0.26 },
  card: { line: "#33471C", fill: "#8CA85A", accent: "#E9F2C9", tone: 0.24 },
  ros: { line: "#4E0619", fill: "#A8143C", accent: "#6E8F3A", tone: 0.22 },
  chry: { line: "#6E5214", fill: "#E8C25A", accent: "#FFF6D8", tone: 0.24 },
  leaf: { line: "#284A20", fill: "#6E9A57", accent: "#D9EBC9", tone: 0.2 },
  ink: { line: "#241A1E", fill: "#241A1E", accent: "#241A1E", tone: 0.08 },
  white: { line: "#FFFFFF", fill: "#FFFFFF", accent: "#FFFFFF", tone: 0.18 },
  badge: { line: "#241A1E", fill: "#F6F1E7", accent: "#241A1E", tone: 1 },
};
export const stickers: StickerDef[] = [
  { id: "butterfly-pea", name: "Butterfly pea", group: "Botanicals", natural: nat.pea, flavours: ["flourish"] },
  { id: "raspberry", name: "Raspberry", group: "Botanicals", natural: nat.rasp, flavours: ["flourish"] },
  { id: "saffron-thread", name: "Saffron threads", group: "Botanicals", natural: nat.saff, flavours: ["focus"] },
  { id: "cardamom-pod", name: "Cardamom pods", group: "Botanicals", natural: nat.card, flavours: ["focus"] },
  { id: "roselle-bud", name: "Roselle calyx", group: "Botanicals", natural: nat.ros, flavours: ["flow"] },
  { id: "chrysanthemum", name: "Chrysanthemum", group: "Botanicals", natural: nat.chry, flavours: ["float"] },
  { id: "leaf", name: "Leaf", group: "Botanicals", natural: nat.leaf },
  { id: "petal", name: "Butterfly pea petal", group: "Botanicals", natural: nat.pea, flavours: ["flourish"] },
  { id: "petals", name: "Butterfly pea petals", group: "Botanicals", natural: nat.pea, flavours: ["flourish"] },
  { id: "petal-roselle", name: "Roselle petal", group: "Botanicals", natural: nat.ros, flavours: ["flow"] },
  { id: "petals-roselle", name: "Roselle petals", group: "Botanicals", natural: nat.ros, flavours: ["flow"] },
  { id: "aril", name: "Pomegranate aril", group: "Botanicals", natural: nat.pom, flavours: ["flow"] },
  { id: "petal-chrys", name: "Chrysanthemum petal", group: "Botanicals", natural: nat.chry, flavours: ["float"] },
  { id: "petals-chrys", name: "Chrysanthemum petals", group: "Botanicals", natural: nat.chry, flavours: ["float"] },
  { id: "petal-saffron", name: "Crocus petal", group: "Botanicals", natural: { line: "#3E1F5C", fill: "#8E5BC9", accent: "#F2E6FF", tone: 0.2 }, flavours: ["focus"] },
  { id: "badge-pill", name: "New", group: "Badges", natural: nat.badge, aspect: 160 / 60, text: "NEW", textArea: { x: 0.5, y: 0.52, w: 0.62, size: 0.26 } },
  { id: "badge-round", name: "Coming soon seal", group: "Badges", natural: nat.badge, text: "COMING\nSOON", textArea: { x: 0.5, y: 0.5, w: 0.56, size: 0.1 } },
  { id: "badge-sugar", name: "Sugar seal", group: "Badges", natural: nat.badge, text: "4%\nSUGAR", textArea: { x: 0.5, y: 0.5, w: 0.5, size: 0.12 } },
  { id: "badge-ribbon", name: "Lightly sparkling", group: "Badges", natural: nat.badge, aspect: 200 / 60, text: "LIGHTLY SPARKLING", textArea: { x: 0.5, y: 0.51, w: 0.78, size: 0.2 } },
  { id: "badge-tag", name: "Flavour tag", group: "Badges", natural: nat.badge, aspect: 160 / 60, text: "FLAVOUR", textArea: { x: 0.56, y: 0.51, w: 0.6, size: 0.24 } },
  { id: "badge-swipe", name: "Swipe", group: "Badges", natural: { ...nat.badge, tone: 0 }, aspect: 160 / 60, text: "SWIPE", textArea: { x: 0.36, y: 0.5, w: 0.5, size: 0.24 } },
  { id: "sparkle", name: "Glint", group: "Shapes", natural: nat.white },
  { id: "sparkles", name: "Glints", group: "Shapes", natural: nat.white },
  { id: "bubbles", name: "Effervescence", group: "Shapes", natural: nat.white },
  { id: "blob", name: "Grain", group: "Shapes", natural: nat.white },
  { id: "wave", name: "Fine rules", group: "Shapes", natural: nat.white },
  { id: "arch", name: "Arch", group: "Shapes", natural: nat.white },
  { id: "frame", name: "Frame", group: "Shapes", natural: nat.white },
  { id: "sun", name: "Sun", group: "Lifestyle", natural: nat.ink },
  { id: "headphones", name: "Headphones", group: "Lifestyle", natural: nat.ink },
  { id: "notebook", name: "Notebook", group: "Lifestyle", natural: nat.ink },
  { id: "yoga-mat", name: "Yoga mat", group: "Lifestyle", natural: nat.ink },
  { id: "gym-bag", name: "Holdall", group: "Lifestyle", natural: nat.ink },
  { id: "towel", name: "Towel", group: "Lifestyle", natural: nat.ink },
];
export const stickerById = (id: string) => stickers.find((s) => s.id === id)!;
// each flavour only ever gets props from its own ingredients
export const botanicalsFor = (product: string) => (({ flourish: ["butterfly-pea", "raspberry", "petal"], focus: ["saffron-thread", "cardamom-pod"], flow: ["roselle-bud", "petal-roselle", "aril"], float: ["chrysanthemum", "petal-chrys"], lineup: ["leaf"] }) as Record<string, string[]>)[product] ?? ["leaf"];
// loose petal stickers in the flavour's own flower
export const petalsFor = (product: string) => (({ flourish: ["petal", "petals"], flow: ["petal-roselle", "petals-roselle"], float: ["petal-chrys", "petals-chrys"], focus: ["saffron-thread", "cardamom-pod"], lineup: ["leaf", "leaf"] }) as Record<string, string[]>)[product] ?? ["leaf", "leaf"];
art["petal-roselle"] = art.petal; art["petals-roselle"] = art.petals; art["petal-chrys"] = art.petal; art["petals-chrys"] = art.petals; art["petal-saffron"] = art.petal;

function mix(hex: string, amt: number) {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("");
}
export type StickerColour = "natural" | "flavour" | "white" | "ink";
export function paletteFor(def: StickerDef, mode: StickerColour, sku: string): Pal {
  const badge = def.group === "Badges", t0 = def.natural.tone ?? 0.22;
  if (mode === "natural") return def.natural;
  if (mode === "white") return badge ? { line: "#FFFFFF", fill: "#FFFFFF", accent: "#FFFFFF", tone: 0 } : { line: "#FFFFFF", fill: "#FFFFFF", accent: "#FFFFFF", tone: 0.16 };
  if (mode === "ink") return badge ? { line: "#F6F1E7", fill: "#241A1E", accent: "#F6F1E7", tone: t0 ? 1 : 0 } : { line: "#241A1E", fill: "#241A1E", accent: "#6B5C62", tone: 0.1 };
  return badge ? { line: mix(sku, -0.55), fill: mix(sku, 0.86), accent: mix(sku, -0.55), tone: t0 ? 1 : 0 } : { line: mix(sku, -0.5), fill: sku, accent: mix(sku, 0.7), tone: 0.24 };
}
// props: the same drawing with a fuller flat tone and soft side shading so they read as objects on a surface
export const propPalette = (def: StickerDef): Pal => ({ ...def.natural, tone: Math.min(0.85, (def.natural.tone ?? 0.22) * 3.4), shade: true });
export const badgeTextColour = (def: StickerDef, pal: Pal) => (def.group === "Badges" ? pal.line : "#fff");
// refined label typography: Inter, small caps feel through caps and generous tracking
export const badgeFont = (fs: number) => `500 ${fs}px Inter`;
export const badgeTracking = 0.24; // em
export function stickerSvg(id: string, pal: Pal) { return art[id](pal); }
export const svgUrl = (svg: string) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
export { mix };
