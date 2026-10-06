"""Rebuild the app icons from the drawing below.  Run:  python3 tools/make-icons.py
Needs Playwright with Chromium (pip install playwright; playwright install chromium)."""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent / "icons"
THREE = "M11 19C22 4 51 6 50 28 49 43 36 48 25 48 40 48 53 56 52 71 50 95 19 97 9 81"  # same "3" as js/draw.js

def art(scale=1.0):
    # A yellow toy brick with a 3 on it.
    return f'''<g transform="translate(256 256) scale({scale}) translate(-256 -256)">
  <rect x="140" y="112" width="96" height="80" rx="22" fill="#F5BE1B" stroke="#C9940A" stroke-width="8"/>
  <rect x="276" y="112" width="96" height="80" rx="22" fill="#F5BE1B" stroke="#C9940A" stroke-width="8"/>
  <rect x="96" y="164" width="320" height="252" rx="40" fill="#F5BE1B" stroke="#C9940A" stroke-width="8"/>
  <rect x="124" y="188" width="264" height="18" rx="9" fill="#fff" opacity=".38"/>
  <path transform="translate(193 196) scale(2.1)" d="{THREE}" fill="none" stroke="#1E2A4A" stroke-width="14.5" stroke-linecap="round" stroke-linejoin="round"/>
</g>'''

def svg(maskable=False):
    bg = '<rect width="512" height="512" fill="#1F6FD0"/>' if maskable else '<rect width="512" height="512" rx="112" fill="#1F6FD0"/>'
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
