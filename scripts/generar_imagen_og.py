#!/usr/bin/env python3
"""Genera icons/og-bibliomapa.png, la imagen de vista previa al compartir (1200×630, og:image y twitter:image).

Uso:  python3 scripts/generar_imagen_og.py
Requiere Pillow (pip install --break-system-packages pillow) y la fuente Inter (si no está, usa DejaVu Sans).

Colores: tokens de docs/SISTEMA_DE_DISENO.md. Fondo --grad-acento (#5b4bd6 → #6c5ce7), texto blanco (6,1:1 en
#5b4bd6, 4,86:1 en #6c5ce7: AA en todo el degradado, y todo el texto es ≥ 40 px), raya --acento2 (#00d2d3). Logo: icons/icon-512.png.
Sin cifras ni datos: solo el nombre, el lema y el dominio, que no caducan.
Tras regenerarla, si cambian las medidas, actualizar OG_IMAGEN en scripts/generar_paginas_seo.js e index.html.
"""
import os
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(RAIZ, "icons", "og-bibliomapa.png")
ANCHO, ALTO = 1200, 630
ACENTO_A, ACENTO_B = (0x5B, 0x4B, 0xD6), (0x6C, 0x5C, 0xE7)  # --grad-acento
ACENTO2 = (0x00, 0xD2, 0xD3)  # --acento2
BLANCO = (255, 255, 255)

FUENTES = {
    "negrita": ["/usr/share/fonts/opentype/inter/Inter-Bold.otf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"],
    "media": ["/usr/share/fonts/opentype/inter/Inter-SemiBold.otf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"],
}


def fuente(peso, tam):
    for f in FUENTES[peso]:
        if os.path.exists(f):
            return ImageFont.truetype(f, tam)
    raise SystemExit("No hay fuente Inter ni DejaVu Sans instalada")


def main():
    # Degradado diagonal del token --grad-acento
    img = Image.new("RGB", (ANCHO, ALTO))
    px = img.load()
    for y in range(ALTO):
        for x in range(ANCHO):
            t = (x / ANCHO + y / ALTO) / 2
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(ACENTO_A, ACENTO_B))
    d = ImageDraw.Draw(img)

    # Logo: el icono de la app sobre una placa blanca translúcida para que no se funda con el fondo
    lado = 260
    x0, y0 = 80, (ALTO - lado) // 2
    placa = Image.new("RGBA", (ANCHO, ALTO), (0, 0, 0, 0))
    ImageDraw.Draw(placa).rounded_rectangle((x0 - 14, y0 - 14, x0 + lado + 14, y0 + lado + 14), radius=70, fill=(255, 255, 255, 60))
    img = Image.alpha_composite(img.convert("RGBA"), placa)
    icono = Image.open(os.path.join(RAIZ, "icons", "icon-512.png")).convert("RGBA").resize((lado, lado), Image.LANCZOS)
    img.alpha_composite(icono, (x0, y0))
    d = ImageDraw.Draw(img)

    # Textos
    tx = x0 + lado + 70
    d.text((tx, 150), "Bibliomapa", font=fuente("negrita", 92), fill=BLANCO)
    lema = fuente("media", 50)
    d.text((tx, 278), "Bibliotecas abiertas", font=lema, fill=BLANCO)
    d.text((tx, 340), "ahora en toda España", font=lema, fill=BLANCO)
    d.rounded_rectangle((tx, 432, tx + 90, 440), radius=4, fill=ACENTO2)
    d.text((tx, 458), "bibliomapa.es", font=fuente("media", 40), fill=BLANCO)

    img.convert("RGB").quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(SALIDA, optimize=True)
    print(f"{os.path.relpath(SALIDA, RAIZ)}: {ANCHO}×{ALTO}, {os.path.getsize(SALIDA) // 1024} KB")


if __name__ == "__main__":
    main()
