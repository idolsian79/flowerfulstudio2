// Built-in background library. Plates contain NO can; the approved can is placed as its own layer.
// fg: optional transparent PNG drawn just above the can (flowers that wrap in front).
export type Scene = { id: string; group: string; flavour: "flourish" | "focus" | "flow" | "float"; src: string; fg: string | null; can: { x: number; y: number; scale: number } | null; light: "left"; kb: number };
export const scenes: Scene[] = [
 {
  "id": "flourish-collar",
  "group": "Couture",
  "flavour": "flourish",
  "src": "/library/flourish-collar.jpg",
  "fg": null,
  "can": {
   "x": 51.2,
   "y": 39.7,
   "scale": 0.543
  },
  "light": "left",
  "kb": 171
 },
 {
  "id": "flourish-crown",
  "group": "Couture",
  "flavour": "flourish",
  "src": "/library/flourish-crown.jpg",
  "fg": null,
  "can": {
   "x": 52.8,
   "y": 31.8,
   "scale": 0.52
  },
  "light": "left",
  "kb": 192
 },
 {
  "id": "focus-headdress",
  "group": "Couture",
  "flavour": "focus",
  "src": "/library/focus-headdress.jpg",
  "fg": null,
  "can": {
   "x": 49.7,
   "y": 49.5,
   "scale": 0.567
  },
  "light": "left",
  "kb": 257
 },
 {
  "id": "flow-gown",
  "group": "Couture",
  "flavour": "flow",
  "src": "/library/flow-gown.jpg",
  "fg": null,
  "can": {
   "x": 49.0,
   "y": 20.5,
   "scale": 0.473
  },
  "light": "left",
  "kb": 196
 },
 {
  "id": "float-wrap",
  "group": "Couture",
  "flavour": "float",
  "src": "/library/float-wrap.jpg",
  "fg": null,
  "can": {
   "x": 52.1,
   "y": 42.0,
   "scale": 0.543
  },
  "light": "left",
  "kb": 195
 },
 {
  "id": "float-arch-4x5",
  "group": "Arch",
  "flavour": "float",
  "src": "/library/float-arch-4x5.jpg",
  "fg": null,
  "can": null,
  "light": "left",
  "kb": 244
 },
 {
  "id": "float-cascade-4x5",
  "group": "Cascade",
  "flavour": "float",
  "src": "/library/float-cascade-4x5.jpg",
  "fg": null,
  "can": null,
  "light": "left",
  "kb": 164
 },
 {
  "id": "float-cascade-9x16",
  "group": "Cascade",
  "flavour": "float",
  "src": "/library/float-cascade-9x16.jpg",
  "fg": null,
  "can": null,
  "light": "left",
  "kb": 204
 },
 {
  "id": "flourish-cascade-4x5",
  "group": "Cascade",
  "flavour": "flourish",
  "src": "/library/flourish-cascade-4x5.jpg",
  "fg": null,
  "can": null,
  "light": "left",
  "kb": 198
 },
 {
  "id": "flow-cascade-4x5",
  "group": "Cascade",
  "flavour": "flow",
  "src": "/library/flow-cascade-4x5.jpg",
  "fg": null,
  "can": null,
  "light": "left",
  "kb": 193
 },
 {
  "id": "flow-cascade-9x16",
  "group": "Cascade",
  "flavour": "flow",
  "src": "/library/flow-cascade-9x16.jpg",
  "fg": null,
  "can": null,
  "light": "left",
  "kb": 228
 },
 {
  "id": "focus-cascade-4x5",
  "group": "Cascade",
  "flavour": "focus",
  "src": "/library/focus-cascade-4x5.jpg",
  "fg": null,
  "can": null,
  "light": "left",
  "kb": 234
 },
 {
  "id": "focus-cascade-9x16",
  "group": "Cascade",
  "flavour": "focus",
  "src": "/library/focus-cascade-9x16.jpg",
  "fg": null,
  "can": null,
  "light": "left",
  "kb": 274
 },
 {
  "id": "flourish-plinth-4x5",
  "group": "Plinth",
  "flavour": "flourish",
  "src": "/library/flourish-plinth-4x5.jpg",
  "fg": null,
  "can": null,
  "light": "left",
  "kb": 174
 },
 {
  "id": "flourish-plinth-9x16",
  "group": "Plinth",
  "flavour": "flourish",
  "src": "/library/flourish-plinth-9x16.jpg",
  "fg": null,
  "can": null,
  "light": "left",
  "kb": 181
 },
 {
  "id": "flow-plinth-4x5",
  "group": "Plinth",
  "flavour": "flow",
  "src": "/library/flow-plinth-4x5.jpg",
  "fg": null,
  "can": null,
  "light": "left",
  "kb": 133
 },
 {
  "id": "flourish-vessel",
  "group": "Vessel",
  "flavour": "flourish",
  "src": "/library/flourish-vessel.jpg",
  "fg": null,
  "can": {
   "x": 78.1,
   "y": 62.2,
   "scale": 0.567
  },
  "light": "left",
  "kb": 218
 },
 {
  "id": "focus-vessel",
  "group": "Vessel",
  "flavour": "focus",
  "src": "/library/focus-vessel.jpg",
  "fg": null,
  "can": {
   "x": 79.4,
   "y": 65.6,
   "scale": 0.59
  },
  "light": "left",
  "kb": 209
 },
 {
  "id": "flow-vessel",
  "group": "Vessel",
  "flavour": "flow",
  "src": "/library/flow-vessel.jpg",
  "fg": null,
  "can": {
   "x": 76.8,
   "y": 65.0,
   "scale": 0.543
  },
  "light": "left",
  "kb": 222
 },
 {
  "id": "float-vessel",
  "group": "Vessel",
  "flavour": "float",
  "src": "/library/float-vessel.jpg",
  "fg": null,
  "can": {
   "x": 79.4,
   "y": 64.3,
   "scale": 0.567
  },
  "light": "left",
  "kb": 229
 }
];
