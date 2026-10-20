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
Orden revisado el 2026-10-20 con el estudio de mercado (`Bibliotime - Documentacion\estudio_de_mercado.md`).
- [ ] Privacidad · Revisar la presencia de amigos en el mapa: desactivada por defecto, solo a nivel de biblioteca (nunca coordenadas), caducidad automática (p. ej. a las 4 h o al cerrar la biblioteca) y aviso de edad mínima de 14 años (RGPD/LOPDGDD). Comprobar primero qué hace ya el código y las políticas RLS de `presence`
- [ ] Exámenes · Capa o chip «Temporada de exámenes»: aperturas extraordinarias y salas 24 h de diciembre-enero, SOLO con fuente oficial y fechas (usar el mecanismo de `horario_excepciones` si hace falta, o un campo con fuente y periodo en los datos). Tenerlo antes del 15 de diciembre. Si no hay fuentes publicadas todavía, dejar la estructura lista y apuntar en el backlog qué webs revisar
- [ ] Misas · Selector "¿qué estará abierta el sábado a las 17:00?" en la lista (`estadoBib(b, fecha)`) + chip «Fin de semana», complementando los chips ya existentes
- [ ] Strava · Clubs persistentes de clase o carrera con ranking semanal (tablas `clubs`, `club_members`). Antes de los exámenes de enero
- [ ] Afluencia · Semáforo (verde/ámbar/rojo, como la ULL), caducidad visible de los reportes («hace 20 min») y horas punta propias a partir de los reportes históricos
- [ ] Ficha · Enchufes y wifi como recursos de la ficha (comprobar qué recursos existen ya); solo con fuente o «sin confirmar»
- [ ] Compartir · Tarjeta de sesión para stories (imagen con `<canvas>`; reutilizar la imagen semanal que ya existe)
- [ ] Strava · "Tu año en Bibliotime" (resumen anual exportable como imagen). Tenerlo listo antes del 15 de diciembre
- [ ] Opositores · Ranking de horas por oposición (entre quienes lo compartan), usando el perfil opositor que ya existe
- [ ] Analítica · Medir usuarios activos y retención sin cookies de terceros ni datos personales (contadores agregados en Supabase o una herramienta sin cookies); actualizar la política de privacidad
- [ ] Strava · "Leyenda de la biblioteca" (Local Legends: más días distintos en 90 días, según sesiones compartidas entre amigos) en el popup. Respetar la privacidad actual de `shared_sessions` (solo amigos)
- [ ] Strava · Mapa de calor personal (capa de círculos por horas estudiadas en cada biblioteca) + calendario de 12 semanas en el perfil
- [ ] Misas · Cierres excepcionales y festivos (tabla `horario_excepciones`, solo con fuente oficial; sin política de escritura pública)
- [ ] Misas · Compartir una biblioteca con enlace `#bib=<slug>` y `navigator.share`
- [ ] Misas · Atajos de PWA en `manifest.json` ("Te recomiendo ahora", "Abren pronto")

## Datos (por lotes pequeños, siempre con fuente oficial)
- [ ] España · Horarios verificados: seguir añadiendo 10 bibliotecas por tarea (hay 44 con horario). Priorizar capitales de provincia sin ninguna. Como pista para buscar la fuente oficial puede usarse el campo `oh` de `data/bibliotecas_espana.json` (OpenStreetMap, ODbL), pero nunca publicarlo como verificado. Cada horario nuevo lleva `h.fv` con la fecha (AAAA-MM-DD) en que se comprobó la fuente
- [ ] Navarra · verificar horario/aforo/recursos de 10 bibliotecas con la web oficial; repetir hasta cubrir las 104

## Pendiente del usuario (no lo puede hacer la tarea automática)
- Ejecutar en Supabase (SQL Editor) el bloque «COMENTARIOS EN SESIONES» del final de `supabase_social.sql`
- Ejecutar en Supabase (SQL Editor) el bloque «REPORTES DE HORARIO» del final de `supabase_social.sql` (tabla `horario_reportes` y función `horario_confirmaciones`). Mientras no exista, los reportes van al buzón `feedback` y no se muestra el recuento de confirmaciones

- Salida al mercado (del estudio de mercado): abrir ya la prueba cerrada de Google Play (pide 14 días con testers), preparar el piloto en Pamplona para los exámenes de enero de 2027 y proponer un piloto B2B gratuito a las bibliotecas de Navarra o al Ayuntamiento de Pamplona

## Hecho
- [x] 2026-10-20 · Misas · Fecha de verificación del horario en la ficha (campo `h.fv` en las 44 de España, con la fecha del commit de cada lote; aviso a los 180 días; las de Navarra: «sin fecha de verificación») + botones «✓ Sigue siendo correcto» / «⚠ Reportar horario incorrecto» con sesión, recuento de confirmaciones de 90 días y SQL `horario_reportes` (`6bdf51c`). Falta ejecutar el SQL
- [x] 2026-10-20 · Limpieza · Quitado `abrirComparador` y el CSS del comparador antiguo (no se llamaba desde ningún sitio) (`58062e0`)
- [x] 2026-10-20 · Integrado el PR #4 de la nube (rendimiento, contraste AA, agenda, calendario de amigos; quita el selector de capas, así que la tarea del selector que tapaba la lista ya no aplica) con las funciones locales (`f143adb`)
- [x] 2026-10-18 · Carpeta local igualada con `repo3` (bibliotecas de toda España de Overture, rediseño del mapa, modo oscuro, buscador y filtros hechos en la nube). El trabajo local antiguo queda en la rama `respaldo-local-octubre` y en `git stash` (capa OSM descartada)
- [x] 2026-10-18 · Strava · Comentarios en sesiones del feed (`852b445`). Falta ejecutar el SQL en Supabase y probarlo con sesión real
- [x] 2026-10-18 · Strava · Retos mensuales + vitrina de trofeos (`3cd0929`)
- [x] 2026-10-18 · Misas · Chips «Abren pronto» y «Hasta tarde» + cambio de temporada en la próxima apertura (`aad3fe0`)
- [x] 2026-10-18 · Misas · Favoritas con estrella, filtro y avisos (`f2aaceb`)
