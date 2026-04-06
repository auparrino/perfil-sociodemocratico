"""Generate Perfil Socio-Democrático 2-page A4 ficha técnica PDF."""
import os
import qrcode
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader, simpleSplit
from PIL import Image

# Paths
BASE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(os.path.dirname(BASE), '..', 'PoliticDash', 'fonts')
# Normalize path
FONTS = os.path.normpath(FONTS)
SHOTS = os.path.join(BASE, 'screenshots_ficha')
OUT = os.path.join(BASE, 'PerfilSocioDemocratico_Ficha.pdf')

DEPLOY_URL = 'https://auparrino.github.io/perfil-sociodemocratico'

# Register fonts
pdfmetrics.registerFont(TTFont('Mont', os.path.join(FONTS, 'Montserrat-Regular.ttf')))
pdfmetrics.registerFont(TTFont('MontBold', os.path.join(FONTS, 'Montserrat-Bold.ttf')))
pdfmetrics.registerFont(TTFont('MontSemi', os.path.join(FONTS, 'Montserrat-SemiBold.ttf')))
pdfmetrics.registerFont(TTFont('MontLight', os.path.join(FONTS, 'Montserrat-Light.ttf')))

# Colors
NAVY = HexColor('#003049')
CREAM = HexColor('#FDF0D5')
CRIMSON = HexColor('#C1121F')
STEEL = HexColor('#669BBC')
WHITE = HexColor('#FFFFFF')
LIGHT_CREAM = HexColor('#FAF3E6')

W, H = A4  # 595.28 x 841.89 points


def make_qr(url, size=80):
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L,
                        box_size=10, border=1)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color='#003049', back_color='#FDF0D5')
    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return ImageReader(buf), size


def draw_image_fit(c, path, x, y, max_w, max_h):
    """Draw image fitting within max_w x max_h, centered at (x, y) being bottom-left."""
    img = Image.open(path)
    iw, ih = img.size
    ratio = min(max_w / iw, max_h / ih)
    dw, dh = iw * ratio, ih * ratio
    cx = x + (max_w - dw) / 2
    cy = y + (max_h - dh) / 2
    c.drawImage(ImageReader(img), cx, cy, dw, dh, preserveAspectRatio=True, mask='auto')
    return dw, dh


def page1(c):
    # Background
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Navy header bar
    header_h = 70
    c.setFillColor(NAVY)
    c.rect(0, H - header_h, W, header_h, fill=1, stroke=0)

    # Title
    c.setFillColor(WHITE)
    c.setFont('MontBold', 26)
    c.drawString(25, H - 40, 'Perfil Socio-Democrático')
    c.setFillColor(CREAM)
    c.setFont('MontLight', 11)
    c.drawString(25, H - 58, 'Comparative Public Opinion Dashboard · Argentina · Paraguay · Uruguay')

    # QR in header
    qr_img, qr_size = make_qr(DEPLOY_URL)
    c.drawImage(qr_img, W - qr_size - 15, H - header_h + 5, qr_size - 10, qr_size - 10)

    # Main screenshot
    y_shot = H - header_h - 310
    shot_path = os.path.join(SHOTS, '01_main_overview.png')
    # Subtle border
    c.setStrokeColor(NAVY)
    c.setLineWidth(0.5)
    margin = 25
    c.rect(margin - 2, y_shot - 2, W - 2 * margin + 4, 304, fill=0, stroke=1)
    draw_image_fit(c, shot_path, margin, y_shot, W - 2 * margin, 300)

    # Description
    y_desc = y_shot - 50
    c.setFillColor(NAVY)
    c.setFont('Mont', 10)
    desc = (
        "An interactive dashboard comparing public opinion across Argentina, Paraguay and Uruguay "
        "using Latinobarómetro survey data (2017–2024). Explore 46 key topics, 3,700+ variables, "
        "regional choropleths and socioeconomic profiles powered by World Bank indicators."
    )
    lines = simpleSplit(desc, 'Mont', 10, W - 2 * margin)
    for i, line in enumerate(lines):
        c.drawString(margin, y_desc - i * 14, line)

    # Stats grid 3x2
    y_stats = y_desc - len(lines) * 14 - 25
    stats = [
        ('3', 'Countries Compared'),
        ('3,741', 'Survey Variables'),
        ('46', 'Key Topics'),
        ('40', 'Sub-regions Mapped'),
        ('8', 'Socioeconomic Indicators'),
        ('5', 'Survey Years (2017–2024)'),
    ]

    col_w = (W - 2 * margin) / 3
    row_h = 55
    for idx, (num, label) in enumerate(stats):
        col = idx % 3
        row = idx // 3
        cx = margin + col * col_w + col_w / 2
        cy = y_stats - row * row_h

        # Number
        c.setFillColor(CRIMSON)
        c.setFont('MontBold', 30)
        c.drawCentredString(cx, cy, num)

        # Label
        c.setFillColor(NAVY)
        c.setFont('Mont', 8.5)
        c.drawCentredString(cx, cy - 16, label)

    # Divider
    y_div = y_stats - 2 * row_h - 10
    c.setStrokeColor(NAVY)
    c.setLineWidth(0.3)
    c.line(margin, y_div, W - margin, y_div)

    # Sources footer
    c.setFillColor(NAVY)
    c.setFont('MontLight', 7.5)
    c.drawCentredString(W / 2, y_div - 15,
                        'Sources: Corporación Latinobarómetro  ·  World Bank Open Data')

    # Bottom accent bar
    c.setFillColor(CRIMSON)
    c.rect(0, 0, W, 4, fill=1, stroke=0)


def page2(c):
    # Background
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Navy header bar (thin)
    header_h = 40
    c.setFillColor(NAVY)
    c.rect(0, H - header_h, W, header_h, fill=1, stroke=0)

    c.setFillColor(WHITE)
    c.setFont('MontBold', 18)
    c.drawString(18, H - 28, 'Key Features')

    margin = 18
    y_grid = H - header_h - 8

    # 3x2 grid of screenshots — maximized for print
    screenshots = [
        ('02_socioeconomic.png', 'Comparative socioeconomic profiles'),
        ('03_distribution.png', 'Response distribution by country'),
        ('04_timeseries.png', 'Multi-country temporal trends'),
        ('05_region_maps.png', 'Regional choropleth analysis'),
        ('06_region_detail.png', 'Sub-regional drill-down maps'),
        ('07_explorer.png', 'Full variable explorer (3,700+)'),
    ]

    cols, rows = 3, 2
    gap = 6
    img_w = (W - 2 * margin - (cols - 1) * gap) / cols
    img_h = 230
    caption_h = 12

    for idx, (fname, caption) in enumerate(screenshots):
        col = idx % cols
        row = idx // cols
        x = margin + col * (img_w + gap)
        y = y_grid - row * (img_h + caption_h + gap) - img_h

        # Image border
        c.setStrokeColor(NAVY)
        c.setLineWidth(0.4)
        c.rect(x - 1, y - 1, img_w + 2, img_h + 2, fill=0, stroke=1)

        path = os.path.join(SHOTS, fname)
        if os.path.exists(path):
            draw_image_fit(c, path, x, y, img_w, img_h)

        # Caption
        c.setFillColor(NAVY)
        c.setFont('Mont', 7)
        c.drawCentredString(x + img_w / 2, y - 10, caption)

    # Bullet points — compact, 2 columns
    y_bullets = y_grid - 2 * (img_h + caption_h + gap) - 12
    bullets = [
        ('Cross-country comparison:', '3 countries side-by-side'),
        ('46 key research topics:', 'democracy, economy, trust, ideology'),
        ('Regional choropleth maps:', '40 sub-regions mapped'),
        ('Socioeconomic context:', '8 World Bank indicators'),
        ('Ordinal scale detection:', 'automatic response ordering'),
        ('Full variable explorer:', '3,741 survey variables'),
    ]

    col_mid = W / 2
    for i, (bold_part, rest) in enumerate(bullets):
        col = i // 3
        row_i = i % 3
        bx = margin if col == 0 else col_mid + 4
        y = y_bullets - row_i * 14
        # Bullet dot
        c.setFillColor(CRIMSON)
        c.circle(bx + 4, y + 3, 1.8, fill=1, stroke=0)
        # Bold part
        c.setFillColor(NAVY)
        c.setFont('MontSemi', 8)
        c.drawString(bx + 12, y, bold_part)
        bw = pdfmetrics.stringWidth(bold_part, 'MontSemi', 8)
        # Rest
        c.setFont('Mont', 8)
        c.drawString(bx + 12 + bw + 3, y, rest)

    # QR bottom right + footer left
    qr_draw_size = 55
    qr_img, _ = make_qr(DEPLOY_URL)
    c.drawImage(qr_img, W - margin - qr_draw_size, 16, qr_draw_size, qr_draw_size)
    c.setFillColor(NAVY)
    c.setFont('MontSemi', 7)
    c.drawString(W - margin - qr_draw_size - 2, 8, 'Scan to open live demo')

    # Footer left
    c.setFillColor(NAVY)
    c.setFont('MontLight', 7)
    c.drawString(margin, 18,
                 'Augusto Parrino  ·  github.com/auparrino  ·  March 2026')

    # Bottom accent bar
    c.setFillColor(CRIMSON)
    c.rect(0, 0, W, 4, fill=1, stroke=0)


# Generate
c = canvas.Canvas(OUT, pagesize=A4)
c.setTitle('Perfil Socio-Democrático — Ficha Técnica')
c.setAuthor('Augusto Parrino')
page1(c)
c.showPage()
page2(c)
c.showPage()
c.save()
print(f'PDF generated: {OUT}')
