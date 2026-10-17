# Registro de rendimiento

Cambios pequeños y medidos para reducir el tiempo de carga. Medición: Playwright (Chromium), mediana de 7 cargas, CDN simulado con 400 ms de latencia y librerías reales servidas localmente.

- 2026-10-17 · CSS de Leaflet/MarkerCluster cargado sin bloquear el render (`media="print"` + `onload`), `defer` en Leaflet y Supabase, `preconnect` a unpkg y jsdelivr. Primer pintado (FCP) 456 → 56 ms; DOMContentLoaded 835 → 454 ms. Regresión OK, 2616 bibliotecas.
