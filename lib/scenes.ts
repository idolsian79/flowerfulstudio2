// Built-in background library. Plates contain NO can; the approved can is placed as its own layer.
// fg: optional transparent PNG drawn just above the can (flowers that wrap in front).
export type Scene = { id: string; group: string; flavour: "flourish" | "focus" | "flow" | "float" | "lineup"; src: string; fg: string | null; can: { x: number; y: number; scale: number } | null; light: "left"; kb: number; copy?: { story: string; headers: string[]; sub: string; format: string }; masthead?: { logo: "lockup"; colour: "white" | "ink"; line: string; lockup_y: number; lockup_scale: number; sub_y: number } };
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
 },
 {
  "id": "flourish-gallery",
  "group": "Gallery",
  "flavour": "flourish",
  "src": "/library/flourish-gallery.jpg",
  "fg": null,
  "can": {
   "x": 76.2,
   "y": 44.4,
   "scale": 0.461
  },
  "light": "left",
  "kb": 262
 },
 {
  "id": "focus-gallery",
  "group": "Gallery",
  "flavour": "focus",
  "src": "/library/focus-gallery.jpg",
  "fg": null,
  "can": {
   "x": 72.9,
   "y": 38.3,
   "scale": 0.49
  },
  "light": "left",
  "kb": 291
 },
 {
  "id": "flow-gallery",
  "group": "Gallery",
  "flavour": "flow",
  "src": "/library/flow-gallery.jpg",
  "fg": null,
  "can": {
   "x": 75.9,
   "y": 41.0,
   "scale": 0.461
  },
  "light": "left",
  "kb": 295
 },
 {
  "id": "float-gallery",
  "group": "Gallery",
  "flavour": "float",
  "src": "/library/float-gallery.jpg",
  "fg": null,
  "can": {
   "x": 77.0,
   "y": 43.7,
   "scale": 0.437
  },
  "light": "left",
  "kb": 279
 },
 {
  "id": "lineup-gallery",
  "group": "Gallery",
  "flavour": "lineup",
  "src": "/library/lineup-gallery.jpg",
  "fg": null,
  "can": {
   "x": 50.3,
   "y": 60.7,
   "scale": 0.689
  },
  "light": "left",
  "kb": 371
 },
 {
  "id": "flourish-bloomhead",
  "group": "Cover",
  "flavour": "flourish",
  "src": "/library/flourish-bloomhead.jpg",
  "fg": null,
  "can": {
   "x": 46.3,
   "y": 57.0,
   "scale": 0.381
  },
  "light": "left",
  "kb": 278,
  "masthead": {
   "logo": "lockup",
   "colour": "white",
   "line": "The Bloom Issue",
   "lockup_y": 6.3,
   "lockup_scale": 0.75,
   "sub_y": 12.6
  }
 },
 {
  "id": "float-balloon",
  "group": "Cover",
  "flavour": "float",
  "src": "/library/float-balloon.jpg",
  "fg": "/library/float-balloon-fg.png",
  "can": {
   "x": 53.5,
   "y": 85.6,
   "scale": 0.316
  },
  "light": "left",
  "kb": 220,
  "masthead": {
   "logo": "lockup",
   "colour": "ink",
   "line": "Sky High",
   "lockup_y": 6.3,
   "lockup_scale": 0.75,
   "sub_y": 12.6
  }
 },
 {
  "id": "focus-shell",
  "group": "Cover",
  "flavour": "focus",
  "src": "/library/focus-shell.jpg",
  "fg": null,
  "can": {
   "x": 49.5,
   "y": 70.2,
   "scale": 0.321
  },
  "light": "left",
  "kb": 192,
  "masthead": {
   "logo": "lockup",
   "colour": "ink",
   "line": "Soft Landing",
   "lockup_y": 6.3,
   "lockup_scale": 0.75,
   "sub_y": 12.6
  }
 },
 {
  "id": "focus-rays",
  "group": "Cover",
  "flavour": "focus",
  "src": "/library/focus-rays.jpg",
  "fg": null,
  "can": {
   "x": 50.0,
   "y": 60.0,
   "scale": 0.425
  },
  "light": "left",
  "kb": 269,
  "masthead": {
   "logo": "lockup",
   "colour": "white",
   "line": "Lock In",
   "lockup_y": 6.3,
   "lockup_scale": 0.75,
   "sub_y": 12.6
  }
 },
 {
  "id": "flow-parasol",
  "group": "Cover",
  "flavour": "flow",
  "src": "/library/flow-parasol.jpg",
  "fg": null,
  "can": {
   "x": 65.3,
   "y": 80.7,
   "scale": 0.316
  },
  "light": "left",
  "kb": 301,
  "masthead": {
   "logo": "lockup",
   "colour": "ink",
   "line": "Heat Wave",
   "lockup_y": 6.3,
   "lockup_scale": 0.75,
   "sub_y": 12.6
  }
 },
 {
  "id": "float-butterfly",
  "group": "Cover",
  "flavour": "float",
  "src": "/library/float-butterfly.jpg",
  "fg": null,
  "can": {
   "x": 46.3,
   "y": 63.0,
   "scale": 0.349
  },
  "light": "left",
  "kb": 353,
  "masthead": {
   "logo": "lockup",
   "colour": "ink",
   "line": "Quiet Glow",
   "lockup_y": 6.3,
   "lockup_scale": 0.75,
   "sub_y": 12.6
  }
 },
{
 "id": "il-flourish-run",
 "group": "Illustrated",
 "flavour": "flourish",
 "src": "/library/il-flourish-run.jpg",
 "fg": null,
 "can": {
  "x": 53.7,
  "y": 71.3,
  "scale": 0.441
 },
 "light": "left",
 "kb": 291,
 "copy": {
  "story": "Sunrise run, head in full bloom, butterflies chasing the pace. First light, first win.",
  "headers": [
   "Bloom Before Breakfast",
   "Run It Blue",
   "Main Character Mile"
  ],
  "sub": "Butterfly Pea & Raspberry",
  "format": "post"
 }
},
{
 "id": "il-flourish-pilates",
 "group": "Illustrated",
 "flavour": "flourish",
 "src": "/library/il-flourish-pilates.jpg",
 "fg": null,
 "can": {
  "x": 42.3,
  "y": 51.5,
  "scale": 0.397
 },
 "light": "left",
 "kb": 263,
 "copy": {
  "story": "Pilates side bend, a bloom for a head and a shadow made of butterflies. Soft strength, big joy.",
  "headers": [
   "Stretch Into Bloom",
   "Core Memory Unlocked",
   "Soft Strong Blue"
  ],
  "sub": "Butterfly Pea & Raspberry",
  "format": "carousel slot 1"
 }
},
{
 "id": "il-flourish-swim",
 "group": "Illustrated",
 "flavour": "flourish",
 "src": "/library/il-flourish-swim.jpg",
 "fg": null,
 "can": {
  "x": 49.9,
  "y": 68.5,
  "scale": 0.397
 },
 "light": "left",
 "kb": 264,
 "copy": {
  "story": "Lido morning from above, floral swim cap, lane ropes in raspberry. The can waits poolside.",
  "headers": [
   "Lap It Up",
   "Blue Hour, Every Hour",
   "Dive Into Blue"
  ],
  "sub": "Butterfly Pea & Raspberry",
  "format": "story"
 }
},
{
 "id": "il-focus-cycle",
 "group": "Illustrated",
 "flavour": "focus",
 "src": "/library/il-focus-cycle.jpg",
 "fg": null,
 "can": {
  "x": 62.2,
  "y": 45.7,
  "scale": 0.441
 },
 "light": "left",
 "kb": 305,
 "copy": {
  "story": "Saffron sprint, crocus helmet, sunburst behind. Pure lock-in energy on two wheels.",
  "headers": [
   "Lock In, Ride Out",
   "Full Send Saffron",
   "Gears On, Phone Off"
  ],
  "sub": "Saffron & Cardamom",
  "format": "post"
 }
},
{
 "id": "il-focus-study",
 "group": "Illustrated",
 "flavour": "focus",
 "src": "/library/il-focus-study.jpg",
 "fg": null,
 "can": {
  "x": 51.8,
  "y": 75.3,
  "scale": 0.353
 },
 "light": "left",
 "kb": 247,
 "copy": {
  "story": "Deep work hour: crocus head, headphones on, cardamom bookmarks, light falling diagonally.",
  "headers": [
   "Deep Work Era",
   "Do Not Disturb",
   "Brain Fully Booted"
  ],
  "sub": "Saffron & Cardamom",
  "format": "carousel slot 2"
 }
},
{
 "id": "il-focus-gym",
 "group": "Illustrated",
 "flavour": "focus",
 "src": "/library/il-focus-gym.jpg",
 "fg": null,
 "can": {
  "x": 50.3,
  "y": 73.8,
  "scale": 0.382
 },
 "light": "left",
 "kb": 270,
 "copy": {
  "story": "Kettlebell session with flower-disc weight plates. The can takes the spare plate.",
  "headers": [
   "PR Season",
   "Lift Loud",
   "Built Different, Brewed Different"
  ],
  "sub": "Saffron & Cardamom",
  "format": "post"
 }
},
{
 "id": "il-flow-rooftop",
 "group": "Illustrated",
 "flavour": "flow",
 "src": "/library/il-flow-rooftop.jpg",
 "fg": null,
 "can": {
  "x": 40.9,
  "y": 60.0,
  "scale": 0.397
 },
 "light": "left",
 "kb": 215,
 "copy": {
  "story": "Golden hour wind-down, hibiscus in her hair, magenta terrace stripes. Warmth after the work.",
  "headers": [
   "Golden Hour Unlocked",
   "Stay For The Sunset",
   "Wind Down, Glow Up"
  ],
  "sub": "Roselle & Pomegranate",
  "format": "post"
 }
},
{
 "id": "il-flow-festival",
 "group": "Illustrated",
 "flavour": "flow",
 "src": "/library/il-flow-festival.jpg",
 "fg": null,
 "can": {
  "x": 62.0,
  "y": 65.3,
  "scale": 0.412
 },
 "light": "left",
 "kb": 277,
 "copy": {
  "story": "Mid-spin dancer, skirt of hibiscus petals, ribbons of motion. Festival energy in flow.",
  "headers": [
   "Move Like Nobody's Watching",
   "Spin Cycle",
   "Vibe In Motion"
  ],
  "sub": "Roselle & Pomegranate",
  "format": "story"
 }
},
{
 "id": "il-flow-beach",
 "group": "Illustrated",
 "flavour": "flow",
 "src": "/library/il-flow-beach.jpg",
 "fg": null,
 "can": {
  "x": 47.9,
  "y": 65.3,
  "scale": 0.397
 },
 "light": "left",
 "kb": 201,
 "copy": {
  "story": "Post-surf walk-up, tilted parasol, striped sea. Salty, sunny, still moving.",
  "headers": [
   "Surf's Up, Mood's Up",
   "Heat Wave Season",
   "Catch The Next One"
  ],
  "sub": "Roselle & Pomegranate",
  "format": "carousel slot 3"
 }
},
{
 "id": "il-float-balloon",
 "group": "Illustrated",
 "flavour": "float",
 "src": "/library/il-float-balloon.jpg",
 "fg": null,
 "can": {
  "x": 52.0,
  "y": 58.4,
  "scale": 0.412
 },
 "light": "left",
 "kb": 198,
 "copy": {
  "story": "Chrysanthemum hot-air balloon drifting over a cream cloud. The can lands on the cloud.",
  "headers": [
   "Sky High, Soft Landing",
   "Lighter Than Air",
   "Float Mode: On"
  ],
  "sub": "Chrysanthemum & Honey",
  "format": "post"
 }
},
{
 "id": "il-float-yoga",
 "group": "Illustrated",
 "flavour": "float",
 "src": "/library/il-float-yoga.jpg",
 "fg": null,
 "can": {
  "x": 43.5,
  "y": 66.9,
  "scale": 0.397
 },
 "light": "left",
 "kb": 207,
 "copy": {
  "story": "Tree pose under a chrysanthemum halo, a butterfly resting on her hair. Quiet, balanced.",
  "headers": [
   "Find Your Balance",
   "Quiet Is A Flex",
   "Breathe, Then Sip"
  ],
  "sub": "Chrysanthemum & Honey",
  "format": "story"
 }
},
{
 "id": "il-float-moon",
 "group": "Illustrated",
 "flavour": "float",
 "src": "/library/il-float-moon.jpg",
 "fg": null,
 "can": {
  "x": 51.8,
  "y": 54.7,
  "scale": 0.412
 },
 "light": "left",
 "kb": 274,
 "copy": {
  "story": "Hammock evening, the moon is a chrysanthemum, butterflies drift like stars.",
  "headers": [
   "Moon Mode",
   "Do Nothing, Beautifully",
   "Slow Night Club"
  ],
  "sub": "Chrysanthemum & Honey",
  "format": "carousel slot 4"
 }
}
];
