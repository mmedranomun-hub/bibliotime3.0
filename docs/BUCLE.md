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
- 2026-10-27 15:40 · director/agente horarios · Objetivo 1 · ✅ · be5ce98→cherry-pick · bibliotecas con horario 277 → 289 (Cartagena ×4, primera de la ciudad; municipales de Alicante ×4 con verano; UAH Trinitarios y Ciencias; USAL Zacut y Educación); pendientes UAH Medicina #296 y Guadalajara #83 (horario por periodos), UCO y Alcalá (robots.txt), València municipales (PDF ambiguo)
- 2026-10-27 15:40 · director/agente exámenes · Objetivo 2 · ✅ · ddd91ec→cherry-pick · ciudades con calendario de exámenes 3 → 5 (UAH: CRAI de Alcalá 24 h 3 nov–24 ene, Medicina y Educación-Guadalajara con horario ampliado); Barcelona y Valencia siguen sin publicar; lista «Revisar» +8 universidades
- 2026-10-27 15:40 · director/agente SEO · Objetivo 4 · ✅ (ya estaba hecho) · 410a53f→cherry-pick · el generador ya leía los horarios de Navarra (a1f0515/313acc0): solo se marca como hecha en BACKLOG; tras regenerar con los horarios nuevos, páginas SEO 490 → 501; caché v72; carga CPU 4× 3418 ms (sin clústeres, máquina cargada); pruebas 21/21, 0 errores
- 2026-10-27 16:30 · director/agente horarios · Objetivo 1 · ✅ · af3e296→cherry-pick · bibliotecas con horario 289 → 303 ✅ meta 300 (Sabadell ×6 y Terrassa ×4, primeras de esas ciudades; A Coruña municipales ×2; BPE Vigo; ULPGC Obelisco); pendientes BPE Mérida/Cáceres (horario de servicio ambiguo), UCLM Albacete, municipales de Burgos/Oviedo/Vigo ilegibles
- 2026-10-27 16:30 · director/agente producto · Objetivo 3 (Dopamina · primer árbol del día: saludo + 5 🌰 una vez al día, fusionado con la racha; las celebraciones ya no tapan «Sesión terminada») · ✅ · 9f87310→cherry-pick · pruebas 21 → 22; app.js gzip 82,5 → 82,9 KB; sin SQL
- 2026-10-27 16:30 · director/agente SEO · Objetivo 4 + 2 · ✅ · 0686875→cherry-pick · páginas «Bibliotecas en exámenes» (/bibliotecas/examenes/ + 5 ciudades, solo entradas vigentes con fuente; enlazadas desde provincias, localidades, salas, universidades y hubs); tras regenerar con los horarios nuevos, páginas SEO 501 → 516, 0 rotos/huérfanas; caché v73; carga CPU 4× 2522 ms (sin clústeres); pruebas 22/22, 0 errores
- 2026-10-27 17:19 · director · ❌ abandonado · no cerró su turno ni subió commits (más de 90 min sin noticias); lo retoma el turno de las 19:18
- 2026-10-27 19:18 · director · ⚠️ cortada (sin commits; el 01-11 00:19 seguía «en curso», 5 días sin vueltas) · Objetivo 2, 1, 5 · — · ninguna
- 2026-11-01 00:19 · director/agente horarios · Objetivo 1 · ✅ · 543dab7→cherry-pick · bibliotecas con horario 303 → 313 (10 municipales del área de Madrid desde comunidad.madrid); pendientes Pablo Picasso #835 (otra dirección), UC3M (JS), UGR FyL (ambiguo), UAB
- 2026-11-01 00:19 · director/agente exámenes · Objetivo 2 · ✅ · 16c4252→cherry-pick · ciudades con calendario 5 → 6 (Valencia: 5 municipales 24 h del 10-12 al 10-01; + Sala Búho UAM); Barcelona sigue sin publicar
- 2026-11-01 00:19 · director/agente rendimiento · Objetivo 5 · ✅ · 0548c74→cherry-pick · carga CPU 4× 2522 → 1699 ms (chinchetas por lotes tras la primera pintura; todas a ~4 s, antes ~2,9); app.js gzip 82,9 → 83,5 KB. Tras regenerar, páginas SEO 516 → 523; caché v74; pruebas 22/22, 0 errores. Ojo: dos turnos seguidos cortados (17:19 y 19:18 del 27-10) y 5 días sin vueltas hasta hoy
- 2026-11-01 01:18 · director/agente horarios · Objetivo 1 · ✅ · 1253fc7→cherry-pick · bibliotecas con horario 313 → 323 (10 municipales de Las Rozas, Pozuelo, Majadahonda, Móstoles, Coslada, Valdemoro y Rivas desde comunidad.madrid); BACKLOG «España» condensado; pendientes Torrejón #437/#561 (sábados ambiguos), Fuenlabrada #1600 (obras), SS Reyes #567; revisar nombre de #425 y posible duplicado #1070
- 2026-11-01 01:18 · director/agente producto · Objetivo 3 (Dopamina · récord personal en «Sesión terminada», solo si supera la más larga, sin negativos) · ✅ · 57cc3fe→cherry-pick · pruebas 22 → 23; app.js gzip 83,5 → 83,5 KB (código en app-extra.js); sin SQL; +2 tareas «Dopamina ·» en el backlog
- 2026-11-01 01:18 · director/agente rendimiento · Objetivo 5 · ✅ · b2681eb→cherry-pick · sombra de chinchetas filter → box-shadow: ráster 589 → 460 ms, pero la carga no cambia de verdad (el coste son ~2900 Paint, uno por icono-capa: tarea nueva para app.js). Tras regenerar, páginas SEO 523 → 528, 0 rotos/huérfanas; caché v75; carga CPU 4× 1545 ms (mediana, rango 1300-1751; ruido frente a 1699); pruebas 23/23, 0 errores
- 2026-11-01 03:18 · director/agente horarios · Objetivo 1 · ✅ · 369b12d→cherry-pick · bibliotecas con horario 323 → 333 (USC Lugo, UAL, Loyola Sevilla, Unizar Teruel y Huesca, UEx Derecho, municipales de Lugo, Córdoba, Huesca y Salburua); 6 sin fin de semana en la fuente (salen cerradas S-D, con nota)
- 2026-11-01 03:18 · director/agente exámenes · Objetivo 2 · ⚠️ sin datos nuevos · 09e1338→cherry-pick · ciudades 6 → 6: nada del curso 2026-27 publicado en Barcelona ni en otras 9 ciudades; próxima revisión útil 20-30 nov (UB/UJA finales de nov, UMA/Unizar dic), apuntado en el backlog
- 2026-11-01 03:18 · director/agente rendimiento · Objetivo 5 · ✅ · 72c3097→cherry-pick · sin markercluster, chinchetas lejanas en un canvas (DOM solo desde zoom 11 en la vista): carga CPU 4× 1545 → 1217 ms (meta ≤ 1500 ✅), todas las chinchetas ~3,4 → 1,2 s, Paint 2793 → 21; app.js gzip 83,5 → 85,7 KB. Tras regenerar, páginas SEO 528 → 552 (0 rotos/huérfanas); caché v76; pruebas 23/23, 0 errores. Riesgo: por debajo del zoom 11 las del canvas no se alcanzan con el tabulador
- 2026-11-01 04:18 · director/agente horarios · Objetivo 1 · ✅ · d7f6194→cherry-pick · bibliotecas con horario 333 → 343 (10 municipales de la provincia de Barcelona: Badalona ×3, Mataró ×2, Sant Cugat, Igualada, Santa Coloma, Sant Boi y Rubí, fichas de bibliotecavirtual.diba.cat, domingos cerrados según la fuente); pendientes nuevos Lloreda, Pomar, Tecla Sala, Marta Mata, Roca Umbert, Popular de Mataró, Pilarín Bayés, Fondo, Casino de Manresa, USC Psicoloxía. Cambio de plan: el turno anunció Navarra en app.js, pero chocaba con el agente de producto en app.js
- 2026-11-01 04:18 · director/agente producto · Objetivo 3 (Dopamina · «📍 Biblioteca nueva en tu mapa» tras el primer árbol sano en una biblioteca nueva + «📍 N bibliotecas exploradas» en los récords del Perfil) · ✅ · 457be9e→cherry-pick · pruebas 23 → 24; app.js gzip 85,7 → 86,1 KB; sin SQL; caché v77
- 2026-11-01 04:18 · director/agente SEO · Objetivo 4 · ✅ · 0debf51→cherry-pick · fichas con horario de verano y de exámenes visibles y en JSON-LD (specialOpeningHoursSpecification): 0 → 76 fichas (551 tramos, 0 solapes); +2 tareas «Objetivo 4 ·» solo del generador. Tras regenerar con los horarios nuevos, páginas SEO 552 → 556 (0 rotos/huérfanas); carga CPU 4× 1004 ms (sin clústeres); pruebas 24/24, 0 errores
- 2026-11-01 05:19 · director/agente Navarra · Objetivo 1 · ✅ · 44e3875→cherry-pick · Navarra con fuente oficial 13 → 24 de 104 (UNAV Ciencias + Barañáin, Burlada, Estella, Berriozar, Cortes, Huarte, Tafalla —corregida: invierno 8:30-20:30—, Zizur, Alsasua y Sangüesa con su verano); pendientes UNAV Eclesiásticas (sin horario en unav.edu), Tudela, Villava, Ansoáin, Egüés; verano de UNAV Ciencias sin fuente (revisar en enero)
- 2026-11-01 05:19 · director/agente SEO · Objetivo 4 · ✅ · 90c7f10→cherry-pick (conflicto en BACKLOG resuelto) · ficha propia para todas las verificadas y las de exámenes: fichas 247 → 313 sin perder ninguna URL (con exámenes 4 → 11); con Navarra, páginas SEO 556 → 634, 0 rotos/repetidos/huérfanas, sitemap 635
- 2026-11-01 05:19 · director/agente producto · Objetivo 3 (Dopamina · «¡Qué alegría verte!» en la bienvenida tras ≥ 3 días sin estudiar: horas totales y árbol más grande, sin racha ni días perdidos) · ✅ · 9c8e78a→cherry-pick · pruebas 24 → 25; app-extra.js gzip 26,2 → 26,9 KB; sin SQL; caché v78; carga CPU 4× 1057 ms (sin clústeres); app.js gzip 86,6 KB; 0 errores
- 2026-11-01 06:18 · director/agente horarios · Objetivo 1 · ✅ · add6d07→cherry-pick · bibliotecas con horario 343 → 354 (11 municipales de la provincia de Barcelona: Castelldefels, Gavà, Viladecans, Granollers, Sitges, Martorell, El Masnou, Berga, Cardedeu, Vilassar de Mar y Calella, con verano, desde datos abiertos y fichas de la Diputació); 9 descartadas por fechas viejas o ambiguas (apuntadas); Berga cita la URL de la API de do.diba.cat
- 2026-11-01 06:18 · director/agente atajos · Objetivo 6/3 · ✅ · 3e49fe5→cherry-pick (conflicto en BACKLOG resuelto) · `shortcuts` en manifest.json («Empezar a estudiar», «Te recomiendo ahora», «Abren pronto») con `#accion=` en app.js: pruebas 25 → 26; app.js gzip 86,6 → 87,1 KB; la bienvenida diaria puede quedar encima de la vista del atajo
- 2026-11-01 06:18 · director/agente SEO · Objetivo 4 · ✅ · a77bdf3→cherry-pick (conflicto en BACKLOG resuelto) · fichas con «Cerca, con horario verificado» (≤ 15 km): 0 → 245 de 334 fichas, +843 enlaces internos; con los horarios nuevos, páginas SEO 634 → 645, 0 rotos/repetidos/huérfanas, sitemap 646; caché v79; carga CPU 4× 1060 ms (sin clústeres); pruebas 26/26, 0 errores
