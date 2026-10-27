# Objetivos de Bibliomapa (los lee el bucle director)

El bucle director (`docs/BUCLE.md`) elige cada vez el trabajo que más acerca la app a estos objetivos.
Las cifras actuales salen de `python3 scripts/probar.py --guardar` (historial en `docs/METRICAS.md`).
Marcos puede reordenar o cambiar cualquier objetivo: el bucle obedece este archivo.

**Estrella polar** (cuando haya analítica sin cookies, tarea «Analítica» del backlog): minutos de estudio a la
semana por usuario activo, con árbol sano. Todo lo demás existe para mover esta cifra.

## Puerta de calidad (se comprueba SIEMPRE, antes y después de cada cambio)
| Métrica | Hoy (27-10-2026) | Exigencia |
|---|---|---|
| Pruebas de `scripts/probar.py` | 16/16 | todas en verde; si una falla, arreglarla es la prioridad 1 |
| Errores de JavaScript | 0 | 0 |

## Objetivos (en orden de prioridad; peso entre paréntesis)
| # | Objetivo | Métrica | Hoy | Meta | Fecha |
|---|---|---|---|---|---|
| 1 | **Útil en toda España** (×3): que cualquier estudiante encuentre su biblioteca con horario fiable | provincias con horario verificado | 51/51 ✅ | 51/51 (al menos la capital) | 30-11-2026 |
| | | bibliotecas con horario verificado | 214 | 300 | 31-12-2026 |
| 2 | **Temporada de exámenes** (×3): aperturas extraordinarias y salas 24 h (UNAV 1-dic, UPNA 15-dic) | ciudades con calendario de exámenes cargado (solo fuente oficial) | 3 (Pamplona, Madrid, Sevilla) | Pamplona, Madrid, Barcelona, Valencia, Sevilla | 30-11-2026 |
| 3 | **Hábito y dopamina sana** (×2): volver cada día a estudiar | tareas «Dopamina ·» hechas · pruebas de recompensas en verde | 9 tandas (+ liga semanal Bronce/Plata/Oro) | 1 mejora por día | continuo |
| 4 | **SEO bibliomapa.es** (×2): salir arriba en «bibliotecas abiertas en <ciudad>» | páginas generadas · páginas con horario verificado | 412 | +1 página por biblioteca con horario | continuo |
| 5 | **Rápida en móvil** (×1) | carga con CPU 4× (ms) · app.js gzip (KB) | 1786 (nube, ±300) · 91,9 ✅ | ≤ 1500 · ≤ 95 | 30-11-2026 |
| 6 | **Lista para Google Play** (×1) | bloqueantes del backlog resueltos | ver «Pendiente del usuario» | 0 que dependan del código | 17-11-2026 |

## Cómo elige el director
1. Si la puerta de calidad falla → arreglar eso y nada más.
2. Para cada objetivo: hueco = (meta − hoy) / meta × peso × urgencia (urgencia = 2 si faltan ≤ 21 días para su fecha).
3. Toma los 2-3 objetivos con más hueco **que no choquen entre sí** (archivos distintos) y lanza un agente por cada uno.
4. Nunca dos ejecuciones seguidas solo de «dopamina»: alterna producto (3) con crecimiento (1, 2, 4).
5. Si un objetivo no tiene tareas en el backlog, el agente crea 1-3 tareas concretas con «Objetivo N ·» y hace la primera.

## Lo que el bucle NO hace nunca
- Inventar datos (horarios, aforos, cifras de usuarios), fusionar en `main`, tocar Supabase en producción,
  publicar en Google Play o en redes, gastar dinero, ni borrar tareas programadas.
