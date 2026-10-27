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
- 2026-10-27 06:19 · director/agente horarios · Objetivo 1 · ✅ · 9311fbe→cherry-pick · bibliotecas con horario 204 → 214 (UPV ×5, UPV/EHU ×3, Oviedo ×2); UC3M, UAM, UPM Sur, Extremadura, Unirioja y UMH siguen sin poder leerse
- 2026-10-27 06:19 · director/agente producto · Objetivo 3 (Dopamina · liga semanal Bronce/Plata/Oro) · ✅ · 5586649→cherry-pick · pruebas 15 → 16; app.js gzip 90,7 → 91,9 KB; sin SQL
- 2026-10-27 06:19 · director/agente SEO · Objetivo 4 · ✅ · 6a19687→cherry-pick · páginas «Salas de estudio en <capital>» (20 + índice); tras regenerar con los horarios nuevos, páginas SEO 384 → 412; caché v63; carga CPU 4× 1786 ms; pruebas 16/16, 0 errores
- 2026-10-27 06:55 · diseño diario · Agenda (calendario de amigos) · ✅ · ver commit «Agenda: botón del calendario de amigos centrado» · aviso y botón alineados; pruebas en verde, 0 errores; caché v64
- 2026-10-27 07:19 · director/agente horarios · Objetivo 1 · ✅ · f201975→cherry-pick · bibliotecas con horario 214 → 224 (10 facultades UCM, tabla oficial de ucm.es; sin fines de semana); biblioteca.ucm.es no se pudo leer
- 2026-10-27 07:19 · director/agente producto · Objetivo 5 · ✅ · 11ac0d0→cherry-pick · app.js gzip 92,0 → 89,6 KB (bienvenida, sala en grupo y comentarios a app-extra.js); carga CPU 4× ahora mediana de 5: 2489 ms en esta máquina (base comparable ~2560); caché v65
- 2026-10-27 07:19 · director/agente SEO · Objetivo 4 · ✅ · b3c9f28→cherry-pick · generador lee Navarra de app.js con vm, solo con fuente+fecha: 0/104 entran hoy (en simulación, Pamplona daría 412 → 433); páginas regeneradas con los horarios UCM: 412; pruebas 16/16, 0 errores
- 2026-10-27 08:20 · director/agente horarios · Objetivo 1 · ✅ · e17515d→cherry-pick · bibliotecas con horario 224 → 234 (UCM ×4, Biblioteques de Barcelona ×2, Zaragoza municipales ×4 con verano); municipales de Madrid y Valencia sin fuente clara; Barcelona avisa de huelga desde 26-05-2026 (revisar)
- 2026-10-27 08:20 · director/agente Navarra · Objetivo 1 + 4 · ✅ · 9160843→cherry-pick · Navarra con fuente+fecha 0 → 13/104 (Pamplona; Biblioteca de Navarra corregida con verano jul-ago); app.js gzip 89,6 → 90,1 KB; pendientes UNAV Ciencias y Eclesiásticas
- 2026-10-27 08:20 · director/agente SEO · Objetivo 4 · ✅ · a816cfc→cherry-pick · páginas «Bibliotecas de la <Universidad>» (10 + índice); tras regenerar con todo, páginas SEO 412 → 452; caché v66; carga CPU 4× 1619 ms; pruebas 16/16, 0 errores
- 2026-10-27 10:20 · director/agente horarios · Objetivo 1 · ✅ · 8064c1b→cherry-pick · bibliotecas con horario 234 → 244 (US ×3, UM ×2, UA ×2, municipales de Granada ×3); pendientes USAL, UNICAN, UM Psicología, Granada #317/#327
- 2026-10-27 10:20 · director/agente producto · Objetivo 3 (Rezos · aviso en la Agenda) · ✅ · 95dbdd7→cherry-pick · pruebas 16 → 17; app.js gzip 90,1 → 90,3 KB; sin SQL (lee `prayers` con la política existente)
- 2026-10-27 10:20 · director/agente SEO · Objetivo 4 · ✅ · 5e00860→cherry-pick · hub /bibliotecas/horarios/, dateModified en todas, comprobador de enlaces (rotos 2 → 0, descripciones repetidas 1 → 0); tras regenerar, páginas SEO 452 → 461; caché v67; carga CPU 4× 2327 ms (máquina cargada); pruebas 17/17, 0 errores
- 2026-10-27 11:19 · director/agente horarios · Objetivo 1 · ✅ · c8cef77→cherry-pick · bibliotecas con horario 244 → 254 (CRAI UB ×6, USC ×3, UMH Elche); pendientes USC Medicina (obras), Filoloxía, UPF #204, municipales de Valladolid
- 2026-10-27 11:19 · director/agente producto · Objetivo 5 · ✅ · b34715f→cherry-pick · app.js gzip 90,3 → 81,2 KB (tienda, cofre, racha, historias, tips, foco, valoración, editar sesión, día de agenda a app-extra.js); pruebas 17 → 18; carga CPU 4× sin cambio medible (~3300 ms antes y después en máquina compartida): en la prueba markercluster no carga y Leaflet pinta 2616 chinchetas sueltas (~1,3 s de CPU), siguiente paso servirlo en local
- 2026-10-27 11:19 · director/agente SEO · Objetivo 4 · ✅ · 53cd274→cherry-pick · tabla «Horarios verificados» en 65 páginas de lugar y FAQ solo con datos verificados (preguntas 372 → 467); tras regenerar, páginas SEO 461 → 464; caché v68; pruebas 18/18, 0 errores
- 2026-10-27 12:25 · director/agente horarios · Objetivo 1 · ✅ · f634d9e→cherry-pick · bibliotecas con horario 254 → 266 (municipales de Málaga ×5 con verano, de Sevilla ×5, UJA #632, UHU Ibn Hazm #57); pendientes Esqueleto/Alberto Lista, UPC, UVigo, UPM sin días; Palma y Murcia RMBM ilegibles
- 2026-10-27 12:25 · director/agente producto · Objetivo 3 (Bosque · hitos del bosque 10/25/50/100/250/500 con tarjeta, confeti y +20–200 🌰; barra «N árboles más» en Mi bosque) · ✅ · ba0ee5c→cherry-pick · pruebas 18 → 19; app.js gzip 81,2 → 81,9 KB; sin SQL
- 2026-10-27 12:25 · director/agente rendimiento · Objetivo 5 · ⚠️ a medias · f815af9→cherry-pick · probar.py ya sabe servir markercluster 1.5.3 en local y comprobar clústeres, pero desde la nube npm/GitHub/unpkg dan 403: la carga sigue sin clústeres (3762 ms, no comparable); perfil: ~2600 Paint de chinchetas ~2,1 s. Tras regenerar, páginas SEO 464 → 479; caché v70 (v69 la usó también el arreglo diario); pruebas, 0 errores
- 2026-10-27 12:50 · arreglo diario · Perfil (récords) · ✅ · ver commit «Perfil: el récord de sesión más larga…» · «Sesión más larga · de Navarra» → «· Biblioteca de Navarra» (usa cortoNombre, como la favorita); prueba nueva en scripts/probar.py, que fallaba antes; caché v69
- 2026-10-27 14:40 · director/agente horarios · Objetivo 1 · ✅ · 1a1e824→cherry-pick · bibliotecas con horario 266 → 277 (Biblioteques de Barcelona ×10 con su ficha, aviso de huelga indefinida en la nota; Pérez Galdós de Madrid #187 con verano); pendientes El Carmel #278 y Vilapicina #270 (cerradas por lluvia), #368 duplica #288, bibliotecas.madrid.es bloqueada por el proxy
- 2026-10-27 14:40 · director/agente producto · Objetivo 3 (Dopamina · próxima especie en «Mi bosque» + aviso «¡Ya puedes plantar…!» una vez por especie) · ✅ · 37b215b→cherry-pick · pruebas 20 → 21; app.js gzip 81,9 → 82,5 KB; sin SQL
- 2026-10-27 14:40 · director/agente SEO · Objetivo 4 · ✅ · 8401f26→cherry-pick · enlaces rastreables de la portada a /bibliotecas/ 1 → 13 (nav al final del Perfil + «Por horario» en la lista); tras regenerar con los horarios nuevos, páginas SEO 479 → 490, 0 rotos/huérfanas; caché v71; carga CPU 4× 2589 ms (sin clústeres); pruebas 21/21, 0 errores
