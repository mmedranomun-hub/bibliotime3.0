# El bucle de mejora continua de Bibliomapa

Pedido por Marcos el 27-10-2026: «cuando yo no te mande nada, tú trabajas con lo que saques de este bucle», y que
el bucle «lance agentes para crear mejores bucles». Este archivo es la memoria del sistema: cada ejecución lo lee y
añade una línea al registro de abajo.

## Las piezas
```
          ┌──────── cada hora, día y noche (:18) ───────┐
          │  DIRECTOR (tarea «Bibliomapa · director»)     │
          │  1. sincroniza y pasa scripts/probar.py        │
          │  2. lee OBJETIVOS.md + metricas.json          │
          │  3. elige 2-3 trabajos que no choquen          │
          │  4. lanza 1 agente por trabajo (en paralelo,   │
          │     cada uno en su worktree)                   │
          │  5. integra solo lo que pasa las pruebas       │
          │  6. mide, sube, apunta aquí, avisa a Marcos    │
          └───────────────────────┬──────────────────────┘
                                  │ registro de ejecuciones
          ┌───────────────────────▼──────────────────────┐
          │  OPTIMIZADOR (miércoles y domingo, 20:54)     │
          │  lanza 2 agentes que auditan el registro:     │
          │   · rendimiento: qué tareas salen bien/mal,   │
          │     cuánto avanzan las métricas por ejecución │
          │   · diseño: cómo mejorar prompts, cadencia y  │
          │     reparto entre tareas programadas          │
          │  aplica los cambios (con límites) y lo anota  │
          └──────────────────────────────────────────────┘
```
Además siguen las rutinas diarias que ya existían (diseño 6:50, rendimiento 7:45, arreglo de fallos 12:37) y la
tarea del ordenador de Marcos que hace el backlog cada 3 h. El director no toca sus tareas; el optimizador puede
ajustarlas dentro de los límites de abajo.

Tareas programadas: «Bibliomapa · director» (cada hora, :18), «Bibliomapa · guardián del bucle» (cada hora, :48) y
«Bibliomapa · optimizador de bucles» (miércoles y domingo, 20:54), en la cuenta de Marcos.

**Guardián:** media hora después de cada director comprueba que el bucle sigue vivo. Si el sistema desactivó el director
(fallos, cuota) lo reactiva; si la última vuelta falló o lleva más de 2 h sin ejecutarse —lo normal cuando se acaba
la cuota y luego se regenera— lo relanza en ese momento. Si Marcos lo pausó a mano, lo respeta.

## Límites del optimizador (para que el sistema mejore sin descontrolarse)
- Solo puede tocar tareas programadas cuyo nombre empiece por «Bibliomapa» o «Bibliotime».
- Puede cambiar prompt, horario o activar/desactivar. **Nunca borra** ninguna (desactivar es reversible).
- Como mucho 6 tareas «Bibliomapa/Bibliotime» activas a la vez; como mucho crea 1 nueva por revisión, y solo si el
  registro demuestra un hueco que ninguna cubre.
- Nunca más de una ejecución por hora en ninguna tarea (el director ya va cada hora: no se acelera más); nunca tocar tareas de otros temas (correo, La Guardia…).
- Un cambio del optimizador se evalúa en la revisión siguiente: si las métricas empeoran, se deshace.
- Todo cambio queda anotado abajo con el porqué.

## Si se acaba el uso del plan
Las ejecuciones que caigan sin cuota fallan. En cuanto se regenera, la primera que entra (director o guardián) lo
retoma desde el registro y el backlog; el guardián además reactiva lo que el sistema haya apagado y relanza el director
sin esperar a su hora. Una línea «⏳ en curso» de hace más de 90 min es de una vuelta cortada: se marca ⚠️ y se sigue. El trabajo a medias nunca se sube (solo lo que pasa `scripts/probar.py`).

## Registro de ejecuciones
Formato: `AAAA-MM-DD HH:MM · quién · objetivo(s) · resultado (✅ subido / ⚠️ a medias / ❌ falló) · commit · métrica que movió`

- 2026-10-27 00:15 · sesión con Marcos · montaje del bucle: `scripts/probar.py` (11 pruebas), OBJETIVOS.md, este archivo · ✅ · línea base: 11/11, 0 errores, 1995 ms, 148 horarios, 27/51 provincias, 125 páginas
- 2026-10-27 00:20 · director/agente exámenes · Objetivo 2 · ✅ · 2228443 · ciudades con calendario oficial 0 → 3/5 (Pamplona, Madrid, Sevilla); app.js gzip 100,6 → 102,3 KB
- 2026-10-27 00:20 · director/agente horarios · Objetivo 1 · ✅ · f173bd8 · provincias 27 → 37/51, bibliotecas con horario 148 → 158
- 2026-10-27 00:20 · director/agente SEO · Objetivo 4 · ✅ · 9e8e0bf · páginas SEO 125 → 146 (temáticas domingo/finde/hasta tarde); pruebas 12/12, 0 errores, carga 1372 ms
- 2026-10-27 00:45 · director/agente horarios · Objetivo 1 · ✅ · 29a53e0 · provincias 37 → 47/51, bibliotecas con horario 158 → 168
- 2026-10-27 00:45 · director/agente producto · Objetivo 1 (arreglo ACCESO) + 3 (abeto de Navidad y almendro) · ✅ · fbb0368 · pruebas 12 → 14; app.js gzip 102,3 → 102,8 KB
- 2026-10-27 00:45 · director/agente SEO · Objetivo 4 · ✅ · 6c2a290 · páginas SEO 146 → 308 (162 fichas propias, 62 con horario); carga 1423 ms
- 2026-10-27 01:19 · director/agente horarios · Objetivo 1 · ✅ · 543977e→cherry-pick · provincias 47 → 51/51, bibliotecas con horario 168 → 181; índice 93 corregido (era la BPE de Guadalajara)
- 2026-10-27 01:19 · director/agente SEO · Objetivo 4 · ✅ · 9b9bcfe→cherry-pick · páginas SEO 308 → 339 (temáticas por localidad, «abiertas en verano», dateModified/lastmod); caché v60
- 2026-10-27 01:19 · director/agente exámenes · Objetivo 2 · ⚠️ sin datos nuevos · b25b8f5→cherry-pick · ciudades 3 → 3: Barcelona y Valencia aún no publican (revisar UV ~13-11, UB ~mediados dic); notas en BACKLOG. Carga CPU 4× 3378 ms, pero la base sin cambios da 3487 ms en esta máquina (2 CPU): ruido del entorno, no regresión
- 2026-10-27 02:19 · director/agente horarios · Objetivo 1 · ✅ · 1c2b965→cherry-pick · bibliotecas con horario 181 → 192 (Oviedo, USC, ULPGC, UMA, UBU, Ágora, UM, Unizar ×2, UV, Ánxel Casal); Segovia con fuente municipal
- 2026-10-27 02:19 · director/agente producto · Objetivo 3 (Dopamina · reacciones 🔥💪🧠) · ✅ · 56aaccc→cherry-pick · pruebas 14 → 15; app.js gzip 102,8 → 104,2 KB; falta SQL «REACCIONES EN SESIONES» (sin él, solo en local)
- 2026-10-27 02:19 · director/agente SEO · Objetivo 4 · ✅ · 7bad57b→cherry-pick · páginas SEO 339 → 372 («abiertas hoy» por lugar + regeneración con los horarios nuevos); caché v61; carga CPU 4× 2178 ms (nube)
- 2026-10-27 03:18 · director · ⚠️ cortada (sin commits; a las 05:18 llevaba 2 h en curso) · Objetivo 1, 5, 4 · — · ninguna
- 2026-10-27 05:18 · director/agente horarios · Objetivo 1 · ✅ · 210e2e9→cherry-pick · bibliotecas con horario 192 → 204 (7 de la red de la Comunidad de Madrid, 4 CRAI UB, Deusto; ciudad de la #536 corregida); pendientes UC3M, UAM, UPM Sur, Extremadura, Unirioja, UMH
- 2026-10-27 05:18 · director/agente producto · Objetivo 5 (app.js más ligero) · ✅ · 942d4e9→cherry-pick · app.js gzip 104,2 → 90,7 KB ✅ meta ≤ 95 (19 funciones a `app-extra.js` bajo demanda + `plano-navarra.js`); caché v62; carga CPU 4× 3721 ms (máquina cargada con agentes en paralelo; el agente midió 4352 → 3792-4072)
- 2026-10-27 05:18 · director/agente SEO · Objetivo 4 · ✅ · 6eecfc7→cherry-pick · títulos «Bibliotecas abiertas en <lugar>» con recuento real (13 variantes) y enlaces a provincias/localidades cercanas; tras regenerar con los horarios nuevos, páginas SEO 372 → 384, 0 títulos repetidos; pruebas 15/15, 0 errores
- 2026-10-27 06:19 · director · ⏳ en curso · Objetivo 1 (horarios), 3 (Dopamina · liga semanal), 4 (SEO generador)
