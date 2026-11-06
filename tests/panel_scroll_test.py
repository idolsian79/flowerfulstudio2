# Right-panel scroll regression: every side tab must scroll to its last control
# at common laptop viewports. Background drag/zoom on the canvas must stay intact.
import sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3123"
VIEWPORTS = [(1280, 800), (1440, 900), (1920, 1080)]

def pane_metrics(pg):
    return pg.evaluate("""() => {
      const right = document.querySelector('aside.right');
      const pane = document.querySelector('aside.right .pane');
      const rr = right.getBoundingClientRect();
      const pr = pane.getBoundingClientRect();
      return {
        rightBottom: rr.bottom, vh: innerHeight,
        clipped: Math.max(0, rr.bottom - innerHeight),
        paneClientH: pane.clientHeight, paneScrollH: pane.scrollHeight,
        paneScrollTop: pane.scrollTop,
        paneCanScroll: pane.scrollHeight > pane.clientHeight + 1,
      };
    }""")

def scroll_pane_to_end(pg):
    pg.locator("aside.right .pane").hover(position={"x": 40, "y": 40})
    for _ in range(30):
        pg.mouse.wheel(0, 500)
    pg.wait_for_timeout(150)
    # also force in case wheel hit a nested scroller
    pg.evaluate("document.querySelector('aside.right .pane').scrollTop = 1e9")
    pg.wait_for_timeout(100)

def last_control_visible(pg):
    return pg.evaluate("""() => {
      const pane = document.querySelector('aside.right .pane');
      const pr = pane.getBoundingClientRect();
      const nodes = [...pane.querySelectorAll('button, .card, .st-grid button, .hint, .range, textarea, input')];
      const last = nodes.at(-1);
      if (!last) return { ok: false, reason: 'no controls' };
      const r = last.getBoundingClientRect();
      const inPane = r.top < pr.bottom - 2 && r.bottom > pr.top + 2;
      const inView = r.bottom <= innerHeight + 1;
      return { ok: inPane && inView, tag: last.tagName, text: (last.textContent||'').trim().slice(0,40),
               top: r.top, bottom: r.bottom, paneBottom: pr.bottom, vh: innerHeight };
    }""")

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in VIEWPORTS:
        pg = b.new_page(viewport={"width": w, "height": h})
        pg.goto(URL, wait_until="networkidle")
        pg.wait_for_timeout(1000)

        # Stickers / icon pack: open Badges, add one so the editor card lengthens the pane
        pg.locator("aside.right .tabs button", has_text="Stickers").click(force=True)
        pg.wait_for_timeout(250)
        pg.locator("aside.right .seg button", has_text="Badges").click()
        pg.wait_for_timeout(200)
        icons = pg.locator("aside.right .st-grid button")
        assert icons.count() > 0, f"{w}x{h}: no sticker icons"
        icons.last.click()
        pg.wait_for_timeout(400)
        m0 = pane_metrics(pg)
        assert m0["clipped"] < 1, f"{w}x{h}: right panel clipped by {m0['clipped']}px (should sit inside the viewport)"
        assert m0["paneCanScroll"] or last_control_visible(pg)["ok"], f"{w}x{h}: stickers pane neither scrolls nor fits: {m0}"
        scroll_pane_to_end(pg)
        vis = last_control_visible(pg)
        assert vis["ok"], f"{w}x{h}: cannot reach last stickers control after scroll: {vis}"
        print(f"{w}x{h} stickers PASS", vis)

        # Library backgrounds: long list
        pg.locator("aside.right .tabs button", has_text="Background").click(force=True)
        pg.wait_for_timeout(250)
        pg.get_by_role("button", name="Library", exact=True).first.click()
        pg.wait_for_timeout(400)
        m1 = pane_metrics(pg)
        assert m1["clipped"] < 1, f"{w}x{h}: background panel clipped by {m1['clipped']}px"
        assert m1["paneCanScroll"], f"{w}x{h}: library pane should scroll: {m1}"
        scroll_pane_to_end(pg)
        vis2 = last_control_visible(pg)
        assert vis2["ok"], f"{w}x{h}: cannot reach last library control: {vis2}"
        m2 = pane_metrics(pg)
        assert m2["paneScrollTop"] > 50, f"{w}x{h}: library did not scroll far enough: {m2}"
        print(f"{w}x{h} library PASS scrollTop={m2['paneScrollTop']}")

        # Words & logo (merged tab, tall)
        pg.locator("aside.right .tabs button", has_text="Words").click(force=True)
        pg.wait_for_timeout(300)
        m3 = pane_metrics(pg)
        assert m3["clipped"] < 1, f"{w}x{h}: words panel clipped"
        scroll_pane_to_end(pg)
        vis3 = last_control_visible(pg)
        assert vis3["ok"], f"{w}x{h}: cannot reach last words control: {vis3}"
        print(f"{w}x{h} words PASS")

        # Canvas bg drag still works (do not break 53e3a3f)
        pg.locator("aside.right .tabs button", has_text="Background").click(force=True)
        pg.wait_for_timeout(200)
        pg.get_by_role("button", name="Library", exact=True).first.click()
        pg.wait_for_timeout(200)
        pg.locator("button[title^='il-'], button[title^='fdv-']").first.click()
        pg.wait_for_timeout(1200)
        box = pg.locator("canvas.base").bounding_box()
        x, y = box["x"] + box["width"] * 0.04, box["y"] + box["height"] * 0.6
        before = pg.evaluate("""() => { for (const k of Object.keys(localStorage)) { try { const d = JSON.parse(localStorage[k]); if (d && 'image' in d) return d.bgT ?? null; } catch (e) {} } return null; }""")
        pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + 70, y + 35, steps=6); pg.mouse.up()
        pg.wait_for_timeout(900)
        after = pg.evaluate("""() => { for (const k of Object.keys(localStorage)) { try { const d = JSON.parse(localStorage[k]); if (d && 'image' in d) return d.bgT ?? null; } catch (e) {} } return null; }""")
        assert after and (after.get("x", 0) != 0 or after.get("y", 0) != 0), f"{w}x{h}: bg drag broken after panel fix before={before} after={after}"
        print(f"{w}x{h} bg-drag PASS", after)
        pg.close()
    b.close()
    print("ALL PASS")
