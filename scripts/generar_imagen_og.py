#!/usr/bin/env python3
"""Genera icons/og-bibliomapa.png, la imagen de vista previa al compartir (1200×630, og:image y twitter:image),
y las de provincia icons/og/<slug>.png (misma plantilla, «Bibliotecas abiertas / ahora en <Provincia>»).

Uso:  python3 scripts/generar_imagen_og.py                       → la general
      python3 scripts/generar_imagen_og.py --provincia <slug>     → icons/og/<slug>.png (p. ej. --provincia a-coruna)
      python3 scripts/generar_imagen_og.py --top 10               → las 10 provincias con más fichas (las publicadas hoy)
El nombre de la provincia y el ranking salen de `node scripts/generar_paginas_seo.js --listar-provincias` (los mismos
datos que las páginas), así que no se escribe ningún nombre a mano. Tras generar, regenerar las páginas: las de la
provincia (/bibliotecas/<slug>/…) usan su imagen si existe y el resto la general.
Peso: cada PNG de provincia ronda los 20 KB (paleta de 128 colores; las 10 suman ~208 KB); solo las 10 con más fichas para no engordar el
repo con imágenes de provincias que casi nadie comparte. El service worker (sw.js) no las precachea.
Requiere Pillow (pip install --break-system-packages pillow) y la fuente Inter (si no está, usa DejaVu Sans).

Colores: tokens de docs/SISTEMA_DE_DISENO.md. Fondo --grad-acento (#5b4bd6 → #6c5ce7), texto blanco (6,1:1 en
#5b4bd6, 4,86:1 en #6c5ce7: AA en todo el degradado, y todo el texto es ≥ 40 px), raya --acento2 (#00d2d3). Logo: icons/icon-512.png.
Sin cifras ni datos: solo el nombre, el lema y el dominio, que no caducan.
Tras regenerarla, si cambian las medidas, actualizar OG_IMAGEN en scripts/generar_paginas_seo.js e index.html.
"""
import argparse
import os
import subprocess
import sys
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


def dibujar(linea2, salida):
    """Plantilla común: logo + «Bibliomapa» + «Bibliotecas abiertas» / linea2 + raya + dominio. Sin cifras."""
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
    # Nombres largos («Santa Cruz de Tenerife»): se reduce el cuerpo de la segunda línea hasta que quepa (mínimo 40 px).
    tam = 50
    while tam > 40 and d.textlength(linea2, font=fuente("media", tam)) > ANCHO - tx - 50:
        tam -= 2
    d.text((tx, 340 + (50 - tam) // 2), linea2, font=fuente("media", tam), fill=BLANCO)
    d.rounded_rectangle((tx, 432, tx + 90, 440), radius=4, fill=ACENTO2)
    d.text((tx, 458), "bibliomapa.es", font=fuente("media", 40), fill=BLANCO)

    os.makedirs(os.path.dirname(salida), exist_ok=True)
    img.convert("RGB").quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(salida, optimize=True)
    print(f"{os.path.relpath(salida, RAIZ)}: {ANCHO}×{ALTO}, {os.path.getsize(salida) // 1024} KB")
    return os.path.getsize(salida)


def provincias():
    """[(slug, nombre, fichas)] de más a menos fichas, de los mismos datos que las páginas."""
    r = subprocess.run(["node", os.path.join(RAIZ, "scripts", "generar_paginas_seo.js"), "--listar-provincias"],
                       cwd=RAIZ, capture_output=True, text=True, check=True)
    return [tuple(l.split("\t")) for l in r.stdout.splitlines() if l.count("\t") == 2]


def main():
    ap = argparse.ArgumentParser(description="Imagen de vista previa (1200×630) general o de provincia")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--provincia", help="slug de la provincia (el de /bibliotecas/<slug>/)")
    g.add_argument("--top", type=int, help="genera las N provincias con más fichas")
    a = ap.parse_args()
    if not a.provincia and not a.top:
        dibujar("ahora en toda España", SALIDA)
        return
    lista = provincias()
    if a.provincia:
        elegidas = [p for p in lista if p[0] == a.provincia]
        if not elegidas:
            sys.exit(f"No hay provincia con slug «{a.provincia}». Slugs: {', '.join(p[0] for p in lista)}")
    else:
        elegidas = lista[:a.top]
    total = sum(dibujar(f"ahora en {nombre}", os.path.join(RAIZ, "icons", "og", f"{ps}.png")) for ps, nombre, _ in elegidas)
    print(f"{len(elegidas)} imágenes de provincia, {total // 1024} KB en total")


if __name__ == "__main__":
    main()
