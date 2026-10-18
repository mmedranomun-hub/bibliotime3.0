# Registro de rendimiento

Cambios pequeños y medidos para reducir el tiempo de carga. Medición: Playwright (Chromium), mediana de 7 cargas, CDN simulado con 400 ms de latencia y librerías reales servidas localmente.

- 2026-10-17 · CSS de Leaflet/MarkerCluster cargado sin bloquear el render (`media="print"` + `onload`), `defer` en Leaflet y Supabase, `preconnect` a unpkg y jsdelivr. Primer pintado (FCP) 456 → 56 ms; DOMContentLoaded 835 → 454 ms. Regresión OK, 2616 bibliotecas.
- 2026-10-18 · Búsqueda de la lista: el texto normalizado de cada biblioteca (nombre, ciudad, provincia, dirección, sin tildes) se calcula una vez y se reutiliza, en vez de rehacer `normalize("NFD")` sobre las 2616 en cada tecla. Tiempo por tecla (CPU 4× más lenta, 10 búsquedas, mediana de 5): ~28 → ~13 ms. Mismos resultados en las 10 búsquedas; enterApp 95-99 ms y buildList 16-17 ms sin cambios; regresión OK, 2616 bibliotecas.
