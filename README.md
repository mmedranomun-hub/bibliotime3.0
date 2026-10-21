# Bibliotime

App web instalable (PWA) para encontrar bibliotecas abiertas en España, estudiar con cronómetro o
Pomodoro, organizar exámenes en una agenda y estudiar con amigos.
Web pública: https://bibliotime-ten.vercel.app

## Mapa del proyecto

| Ruta | Qué es | ¿Se publica? |
|---|---|---|
| `index.html` | Toda la app: estilos, pantallas y lógica en un solo archivo | Sí |
| `bibliotecas-espana.js` | Datos de las bibliotecas de fuera de Navarra (Overture Maps) | Sí |
| `sw.js` | Service worker: caché y uso sin conexión. Sube `CACHE_NAME` en cada cambio publicado | Sí |
| `manifest.json` | Nombre, iconos y capturas de la app instalable | Sí |
| `privacidad.html`, `condiciones.html` | Textos legales (Google Play) | Sí |
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

## Scripts (`scripts/`)
- `servir_local.ps1`: sirve la app en http://localhost:8080 para probarla en el ordenador.
- `subir_a_github.ps1` / `descargar_de_github.ps1`: sincronizan la carpeta del ordenador con GitHub
  (los usan las tareas programadas de Windows; no cambiar su nombre ni su ruta).
- `retomar_sesion_wifi.ps1`: abre la sesión de Claude Code al conectarse a una wifi (`-Instalar` una vez).
- `importar_bibliotecas_osm.js`: regenera `data/bibliotecas_espana.json` desde OpenStreetMap.

## Reglas que no se pueden romper
- No reordenar ni borrar bibliotecas: la afluencia y la presencia de amigos guardan su índice
  (las 104 de Navarra van primero en `index.html`; las de España, después, en `bibliotecas-espana.js`).
- No inventar datos: horarios y accesos solo con fuente oficial (o «sin confirmar»).
- Colores, tamaños y radios solo con los tokens de `docs/SISTEMA_DE_DISENO.md`.
