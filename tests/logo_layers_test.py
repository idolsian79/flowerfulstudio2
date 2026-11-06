# Logo elements: add icon + wordmark as independent layers with lockup-rule sizes and free-spot placement.
import json, sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3123"
ICON_W, WORD_W = 0.3, 0.44

def flush(pg):
    pg.wait_for_timeout(500)  # autosave debounce is 400ms

def doc(pg):
    flush(pg)
    return pg.evaluate("""() => {
      for (const k of Object.keys(localStorage)) {
        try { const d = JSON.parse(localStorage[k]); if (d && d.layers && d.t) return d; } catch (e) {}
      }
      return null;
    }""")

def click_logo(pg, label):
    pg.evaluate("""(label) => {
      const card = [...document.querySelectorAll('aside.right .pane .card')].find(c => (c.querySelector('.card-h b')?.textContent || '') === 'Logo elements');
      if (!card) throw new Error('Logo elements card missing');
      const btn = [...card.querySelectorAll('button')].find(b => b.textContent.trim() === label);
      if (!btn) throw new Error('button missing: ' + label);
      btn.click();
    }""", label)
    flush(pg)

def ratio(d):
    if not (d["layers"].get("icon") and d["layers"].get("wordmark")): return None
    return (ICON_W * d["t"]["icon"]["scale"]) / (WORD_W * d["t"]["wordmark"]["scale"])

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.goto(URL, wait_until="networkidle")
    pg.evaluate("localStorage.clear()"); pg.reload(wait_until="networkidle"); pg.wait_for_timeout(1200)
    pg.locator("aside.right .tabs button", has_text="Words").click(force=True); pg.wait_for_timeout(400)

    assert pg.evaluate("""() => [...document.querySelectorAll('aside.right .pane .card .card-h b')].some(b => b.textContent === 'Logo elements')""")

    d0 = doc(pg)
    if d0["layers"].get("wordmark"): click_logo(pg, "Wordmark")
    if doc(pg)["layers"].get("icon"): click_logo(pg, "Icon")
    if doc(pg)["layers"].get("tagline"): click_logo(pg, "drink brighter")
    if doc(pg)["layers"].get("lockup"): click_logo(pg, "Lockup")

    click_logo(pg, "Icon")
    d1 = doc(pg)
    assert d1["layers"]["icon"] and not d1["layers"]["wordmark"], d1["layers"]
    assert d1["t"]["icon"]["y"] < 40, d1["t"]["icon"]
    assert abs(d1["t"]["icon"]["scale"] - WORD_W * 0.55) < 0.02, d1["t"]["icon"]["scale"]

    click_logo(pg, "Wordmark")
    d2 = doc(pg)
    assert d2["layers"]["icon"] and d2["layers"]["wordmark"], d2["layers"]
    r = ratio(d2)
    assert r is not None and abs(r - 0.30) < 0.02, f"ratio {r}"
    assert d2["t"]["icon"]["y"] < 40 and d2["t"]["wordmark"]["y"] > 60, (d2["t"]["icon"]["y"], d2["t"]["wordmark"]["y"])
    print("icon+wordmark PASS", {"ratio": round(r, 3), "icon": d2["t"]["icon"], "word": d2["t"]["wordmark"]})

    click_logo(pg, "drink brighter")
    d3 = doc(pg)
    assert d3["layers"]["icon"] and d3["layers"]["wordmark"] and d3["layers"]["tagline"], d3["layers"]
    print("tagline additive PASS")

    click_logo(pg, "Lockup")
    d4 = doc(pg)
    assert d4["layers"]["lockup"] and d4["layers"]["icon"] and d4["layers"]["wordmark"], d4["layers"]
    print("lockup additive PASS", {k: d4["layers"][k] for k in ("icon","wordmark","lockup","tagline")})

    scales = pg.evaluate("""() => [...document.querySelectorAll('.ov.o-mark')].map(el => el.style.transform)""")
    assert scales and all("scale(" in s for s in scales), scales
    print("aspect via scale PASS", len(scales), "marks")
    b.close()
    print("ALL PASS")
