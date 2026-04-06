"""Capture 7 screenshots for the ficha técnica PDF.

Target aspect ratio for grid thumbnails: ~1.6:1 (width:height)
so they fill the PDF grid boxes properly.
"""
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).parent / "screenshots_ficha"
OUT.mkdir(exist_ok=True)
URL = "http://localhost:5175/perfil-sociodemocratico/"


def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # ── 1. MAIN OVERVIEW: País mode, 3 countries, full dashboard ──
        page = browser.new_page(viewport={"width": 1600, "height": 1800}, device_scale_factor=2)
        page.goto(URL, wait_until="networkidle")
        time.sleep(2)
        page.click('button:has-text("Paraguay")')
        page.click('button:has-text("Uruguay")')
        time.sleep(0.5)
        page.select_option('select >> nth=1', label='Satisfacción con la democracia')
        time.sleep(1)
        page.screenshot(path=str(OUT / "01_main_overview.png"), full_page=False)
        print("1/7 main overview")

        # ── 2. SOCIOECONOMIC PROFILE: Ficha cards + sparklines ──
        # Capture wider section including header and sparklines
        page.screenshot(path=str(OUT / "02_socioeconomic.png"),
                        full_page=False,
                        clip={"x": 0, "y": 55, "width": 1600, "height": 900})
        print("2/7 socioeconomic profile")

        # ── 3. DISTRIBUTION CHARTS: bar charts for 3 countries ──
        page.screenshot(path=str(OUT / "03_distribution.png"),
                        full_page=False,
                        clip={"x": 0, "y": 370, "width": 1600, "height": 900})
        print("3/7 distribution charts")

        # ── 4. TIME SERIES + compare map ──
        page.screenshot(path=str(OUT / "04_timeseries.png"),
                        full_page=False,
                        clip={"x": 0, "y": 850, "width": 1600, "height": 950})
        print("4/7 time series + map")

        # ── 5. REGION MODE: full view ──
        page2 = browser.new_page(viewport={"width": 1600, "height": 1200}, device_scale_factor=2)
        page2.goto(URL, wait_until="networkidle")
        time.sleep(2)
        page2.click('button:has-text("Paraguay")')
        page2.click('button:has-text("Uruguay")')
        time.sleep(0.5)
        page2.click('button:has-text("Región")')
        time.sleep(2)
        page2.screenshot(path=str(OUT / "05_region_maps.png"), full_page=False)
        print("5/7 region maps")

        # ── 6. REGION DETAIL: maps section ──
        page2.screenshot(path=str(OUT / "06_region_detail.png"),
                         full_page=False,
                         clip={"x": 0, "y": 60, "width": 1600, "height": 900})
        print("6/7 region detail")

        # ── 7. EXPLORER MODE ──
        page3 = browser.new_page(viewport={"width": 1600, "height": 1000}, device_scale_factor=2)
        page3.goto(URL, wait_until="networkidle")
        time.sleep(2)
        page3.click('button:has-text("Explorador")')
        time.sleep(1)
        page3.screenshot(path=str(OUT / "07_explorer.png"), full_page=False)
        print("7/7 explorer")

        browser.close()
        print(f"\nAll screenshots saved to {OUT}")


if __name__ == "__main__":
    capture()
