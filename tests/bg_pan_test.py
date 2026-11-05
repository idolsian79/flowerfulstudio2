# Plate position regression test: load a library scene, drag empty canvas, check the plate transform changed.
import json, sys
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3123"
def bgT(pg): return pg.evaluate("""() => { for (const k of Object.keys(localStorage)) { try { const d = JSON.parse(localStorage[k]); if (d && 'image' in d) return { image: d.image, bgT: d.bgT ?? null }; } catch (e) {} } return null; }""")
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1500, "height": 950}); pg.goto(URL); pg.wait_for_timeout(1500)
    pg.get_by_role("button", name="Background", exact=True).first.click()
    pg.get_by_role("button", name="Library", exact=True).first.click(); pg.wait_for_timeout(300)
    pg.locator("button[title^='il-'], button[title^='fdv-']").first.click(); pg.wait_for_timeout(1500)
    before = bgT(pg); print("after scene:", before and before["image"], before and before["bgT"])
    assert pg.get_by_text("Plate position").count() > 0, "Plate position card missing"
    box = pg.locator("canvas.base").bounding_box()
    x, y = box["x"] + box["width"] * 0.04, box["y"] + box["height"] * 0.6
    print("element under pointer:", pg.evaluate(f"document.elementFromPoint({x},{y}).className"))
    pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + 80, y + 40, steps=8); pg.mouse.up(); pg.wait_for_timeout(1200)
    after = bgT(pg); print("after drag:", after["bgT"])
    assert after["bgT"] and (after["bgT"]["x"] != 0 or after["bgT"]["y"] != 0), "drag did not move the plate"
    # double-click enters move mode, Done leaves it
    pg.mouse.dblclick(x, y); pg.wait_for_timeout(300)
    assert pg.get_by_role("button", name="Done moving background").count() == 1, "double-click did not enter move mode"
    pg.get_by_role("button", name="Done moving background").click()
    pg.screenshot(path="/tmp/bgpan.png"); print("PASS"); b.close()
