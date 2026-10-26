# Bibliotime

App web instalable (PWA) para encontrar bibliotecas abiertas en España, estudiar con cronómetro o
Pomodoro, organizar exámenes en una agenda y estudiar con amigos.
Web pública: https://bibliomapa.es (dominio comprado; hasta conectarlo, https://bibliotime-ten.vercel.app)

## Mapa del proyecto

| Ruta | Qué es | ¿Se publica? |
|---|---|---|
| `index.html` | Estilos (con los tokens del sistema de diseño) y pantallas de la app | Sí |
| `app.js` | Toda la lógica de la app (mapa, estudio, agenda, amigos…) | Sí |
| `bibliotecas-espana.js` | Datos de las bibliotecas de fuera de Navarra (Overture Maps) | Sí |
| `bibliotecas/`, `seo.css`, `sitemap.xml`, `robots.txt` | Páginas para Google por provincia y ciudad. **Generadas**: no editarlas a mano, ejecutar `node scripts/generar_paginas_seo.js` tras cambiar datos | Sí |
| `sw.js` | Service worker: caché y uso sin conexión. Sube `CACHE_NAME` en cada cambio publicado | Sí |
| `manifest.json` | Nombre, iconos y capturas de la app instalable | Sí |
| `privacidad.html`, `condiciones.html`, `legal.css` | Textos legales (Google Play) y su estilo común | Sí |
| `icons/` | Iconos de la app | Sí |
| `screenshots/` | Capturas que muestra la instalación y la ficha de Google Play | Sí |
| `docs/` | Documentación: sistema de diseño, plantilla para nuevas apps, registros, Google Play | No |
| `supabase/` | Esquema SQL de la nube (cuentas, amigos, afluencia…). Los bloques nuevos van al final | No |
| `play/` | Archivos para publicar en Google Play (`assetlinks.json`) | No |
| `scripts/` | Utilidades de Windows y Node (ver abajo) | No |
| `BACKLOG.md` | Lista de tareas que sigue la tarea automática del ordenador | No |

Qué se publica lo decide `.vercelignore`.

## Documentación (`docs/`)
- `SISTEMA_DE_DISENO.md`: colores, tipografía, espaciado y componentes. Es la referencia para que todas las
  pantallas, y las futuras apps de la misma familia, se vean igual.
- `PLANTILLA_NUEVA_APP.md`: cómo crear otra app del mismo estilo (por ejemplo, de gimnasios) a partir de esta.
- `DISENO.md` y `RENDIMIENTO.md`: registro diario de mejoras de diseño y de velocidad, con cifras.
- `PUBLICAR_EN_GOOGLE_PLAY.md`: pasos para subir la app a Google Play.
- `SEO.md`: cómo posicionar bibliomapa.es en Google (qué está hecho y qué falta).
- `TRASLADAR_A_OTRO_ORDENADOR.md`: cómo empezar de cero o pasar el proyecto a otro ordenador sin perder nada.

## Scripts (`scripts/`)
- `servir_local.ps1`: sirve la app en http://localhost:8080 para probarla en el ordenador.
- `subir_a_github.ps1` / `descargar_de_github.ps1`: sincronizan la carpeta del ordenador con GitHub
  (los usan las tareas programadas de Windows; no cambiar su nombre ni su ruta).
- `retomar_sesion_wifi.ps1`: abre la sesión de Claude Code al conectarse a una wifi (`-Instalar` una vez).
- `generar_paginas_seo.js`: regenera `bibliotecas/`, `sitemap.xml` y `robots.txt` (ver `docs/SEO.md`).
- `importar_bibliotecas_osm.js`: regenera `data/bibliotecas_espana.json` desde OpenStreetMap.

## Reglas que no se pueden romper
- No reordenar ni borrar bibliotecas: la afluencia y la presencia de amigos guardan su índice
  (las 104 de Navarra van primero en `app.js`; las de España, después, en `bibliotecas-espana.js`).
- No inventar datos: horarios y accesos solo con fuente oficial (o «sin confirmar»).
- Colores, tamaños y radios solo con los tokens de `docs/SISTEMA_DE_DISENO.md`.
