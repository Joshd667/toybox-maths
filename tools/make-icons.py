"""Rebuild the app icons from the drawing below.  Run:  python3 tools/make-icons.py
Needs Playwright with Chromium (pip install playwright; playwright install chromium)."""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent / "icons"
THREE = "M11 19C22 4 51 6 50 28 49 43 36 48 25 48 40 48 53 56 52 71 50 95 19 97 9 81"  # same "3" as js/draw.js

def art(scale=1.0):
    # A big white 3 with a gold star. Deliberately not a brick: this is not a toy maker's app.
    return f'''<g transform="translate(256 256) scale({scale}) translate(-256 -256)">
  <path transform="translate(146 96) scale(3.2)" d="{THREE}" fill="none" stroke="#ffffff" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
  <path transform="translate(318 66) scale(5.2)" d="M12 1.8l3.1 6.5 7.1.9-5.2 4.9 1.3 7.1L12 17.8 5.7 21.2 7 14.1 1.8 9.2l7.1-.9z" fill="#F2B01E" stroke="#211D3D" stroke-width="1.6" stroke-linejoin="round"/>
</g>'''

def svg(maskable=False):
    bg = '<rect width="512" height="512" fill="#5746E0"/>' if maskable else '<rect width="512" height="512" rx="112" fill="#5746E0"/>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">{bg}{art(0.8 if maskable else 1.0)}</svg>'

ROOT.mkdir(exist_ok=True)
(ROOT / "icon.svg").write_text(svg())
jobs = [("icon-192.png", 192, False, True), ("icon-512.png", 512, False, True), ("icon-maskable-512.png", 512, True, False), ("apple-touch-icon.png", 180, True, False)]
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, size, maskable, transparent in jobs:
        s = svg(maskable).replace("scale(0.8)", "scale(0.92)") if name.startswith("apple") else svg(maskable)
        pg = b.new_page(viewport={"width": size, "height": size})
        pg.set_content(f'<body style="margin:0;background:transparent">{s.replace("<svg ", f"<svg width={size} height={size} ")}</body>')
        pg.screenshot(path=str(ROOT / name), omit_background=transparent)
        pg.close()
    b.close()
print("icons written to", ROOT)
