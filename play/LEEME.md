# Archivos para Google Play

- `assetlinks.json`: plantilla. Cuando tengas el paquete:
  1. Copia la huella SHA-256 de Play Console → Configuración → Integridad de la app → Firma de apps.
  2. Cambia `package_name` si en PWABuilder elegiste otro identificador.
  3. Súbelo a la **raíz del dominio**: `https://TU-DOMINIO/.well-known/assetlinks.json`
     (con GitHub Pages: repositorio `mmedranomun-hub.github.io`, carpeta `.well-known/`, y un archivo vacío `.nojekyll` en la raíz).
- Capturas para la ficha: carpeta `../screenshots/` (1080×1919). Añade tú una del mapa hecha en el móvil: aquí no se pudo capturar porque el mapa no carga en el entorno de pruebas.
