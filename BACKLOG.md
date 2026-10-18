# Backlog de Bibliotime

La tarea programada «Bibliotime · mejora automática» (cada 3 horas, de 9 a 23 h) baja
primero lo nuevo de `repo3`, coge la primera tarea sin marcar, la implementa, la verifica en
el navegador, la marca como hecha y la sube a `repo3`. Si se acaban los tokens a mitad, la
siguiente ejecución lo retoma. Para cambiar prioridades basta con reordenar esta lista.

Reglas: no inventar datos, no reordenar ni borrar entradas de `BIBLIOTECAS` (se usa su
índice), SQL idempotente con RLS al final de `supabase_social.sql`. Antes de empezar una
tarea, comprobar con Grep que no la haya hecho ya una sesión en la nube.

Fuentes de las ideas: informes de investigación del 2026-10-08 (Strava, y Catholic Mass Times /
MassTimes.org / misas.org).

## Siguientes
- [ ] Arreglo · A 375 px, el selector de capas del mapa (Calles/Relieve/Plano/Satélite) desplegado tapa la lista de bibliotecas
- [ ] Limpieza · Quitar `abrirComparador` y el código muerto del comparador antiguo (comprobar antes que no se llama desde ningún sitio)
- [ ] Misas · Fecha de última verificación del horario en la ficha ("Horario sin fecha de verificación" / aviso si tiene más de 180 días) + botones "✓ Sigue siendo correcto" y "⚠ Reportar horario incorrecto" (tabla `horario_reportes`, con una vista o función agregada que NO exponga `user_id`). Revisar antes cómo funciona hoy el enlace "avisar de errores" de la ficha y el buzón `feedback`, y reutilizarlos
- [ ] Misas · Selector "¿qué estará abierta el sábado a las 17:00?" en la lista (`estadoBib(b, fecha)`), complementando los chips ya existentes
- [ ] Strava · "Leyenda de la biblioteca" (Local Legends: más días distintos en 90 días, según sesiones compartidas entre amigos) en el popup. Respetar la privacidad actual de `shared_sessions` (solo amigos)
- [ ] Strava · Mapa de calor personal (capa de círculos por horas estudiadas en cada biblioteca) + calendario de 12 semanas en el perfil
- [ ] Misas · Cierres excepcionales y festivos (tabla `horario_excepciones`, solo con fuente oficial; sin política de escritura pública)
- [ ] Misas · Compartir una biblioteca con enlace `#bib=<slug>` y `navigator.share`
- [ ] Misas · Atajos de PWA en `manifest.json` ("Te recomiendo ahora", "Abren pronto")
- [ ] Strava · "Tu año en Bibliotime" (resumen anual exportable como imagen). Tenerlo listo antes del 15 de diciembre
- [ ] Strava · Clubs persistentes de clase o carrera con ranking semanal (tablas `clubs`, `club_members`)

## Datos (por lotes pequeños, siempre con fuente oficial)
- [ ] España · Horarios verificados: seguir añadiendo 10 bibliotecas por tarea (hay 44 con horario). Priorizar capitales de provincia sin ninguna. Como pista para buscar la fuente oficial puede usarse el campo `oh` de `data/bibliotecas_espana.json` (OpenStreetMap, ODbL), pero nunca publicarlo como verificado
- [ ] Navarra · verificar horario/aforo/recursos de 10 bibliotecas con la web oficial; repetir hasta cubrir las 104

## Pendiente del usuario (no lo puede hacer la tarea automática)
- Ejecutar en Supabase (SQL Editor) el bloque «COMENTARIOS EN SESIONES» del final de `supabase_social.sql`

## Hecho
- [x] 2026-10-18 · Carpeta local igualada con `repo3` (bibliotecas de toda España de Overture, rediseño del mapa, modo oscuro, buscador y filtros hechos en la nube). El trabajo local antiguo queda en la rama `respaldo-local-octubre` y en `git stash` (capa OSM descartada)
- [x] 2026-10-18 · Strava · Comentarios en sesiones del feed (`852b445`). Falta ejecutar el SQL en Supabase y probarlo con sesión real
- [x] 2026-10-18 · Strava · Retos mensuales + vitrina de trofeos (`3cd0929`)
- [x] 2026-10-18 · Misas · Chips «Abren pronto» y «Hasta tarde» + cambio de temporada en la próxima apertura (`aad3fe0`)
- [x] 2026-10-18 · Misas · Favoritas con estrella, filtro y avisos (`f2aaceb`)
