# Backlog de Bibliotime

La tarea programada «Bibliotime · mejora automática» (cada 3 horas, de 9 a 23 h) baja
primero lo nuevo de `repo3`, coge la primera tarea sin marcar, la implementa, la verifica en
el navegador, la marca como hecha y la sube a `repo3`. Si se acaban los tokens a mitad, la
siguiente ejecución lo retoma. Para cambiar prioridades basta con reordenar esta lista.

Reglas: no inventar datos, no reordenar ni borrar entradas de `BIBLIOTECAS` (se usa su
índice), SQL idempotente con RLS al final de `supabase/supabase_social.sql`. Antes de empezar una
tarea, comprobar con Grep que no la haya hecho ya una sesión en la nube.

Fuentes de las ideas: informes de investigación del 2026-10-08 (Strava, y Catholic Mass Times /
MassTimes.org / misas.org).

## Siguientes
- [ ] Objetivo 4 · Página temática `/bibliotecas/<ciudad>/abiertas-hasta-tarde/` y `abiertas-domingo/` por **localidad** (Madrid capital, Barcelona, Valencia…) cuando haya 2 o más con horario verificado, enlazada desde la página de localidad; y «abiertas en agosto / verano» usando `h.ver` + `vd`/`vh` (solo las que tienen horario de verano verificado)
- [ ] Objetivo 4 · Enlazar las páginas temáticas desde la portada (`index.html`, pie o sección «Buscar por horario», sin tocar la app) y añadir `dateModified` con la fecha de verificación más reciente a su JSON-LD; medir en Search Console «biblioteca abierta domingo <ciudad>» cuando el dominio esté conectado
- [ ] SEO · Título y descripción de la portada según la ciudad del enlace (`/bibliotecas/<prov>/` ya enlaza `#bib`); revisar que Google renderiza la portada (Search Console → Inspección de URL) cuando el dominio esté conectado
- [ ] Dopamina · Reacciones con emoji (🔥💪🧠) a las sesiones de amigos además de kudos (tabla nueva con RLS de amigos, idempotente)
- [ ] Dopamina · Liga semanal entre amigos (Bronce/Plata/Oro según puesto del ranking la semana anterior), con insignia en el perfil
- [ ] Rezos · Avisar al dueño en la Agenda («🙏 3 amigos rezan por tu examen de mañana») el día anterior al examen
Orden revisado el 2026-10-20 con el estudio de mercado (`Bibliotime - Documentacion\estudio_de_mercado.md`)
y `salida_al_mercado\`. Fecha límite clave: estar en Google Play antes del 1 de diciembre (los exámenes de la UNAV
empiezan el 1 de diciembre y los de la UPNA el 15), así que la producción debe solicitarse hacia el 17 de noviembre.
- [ ] Exámenes · Capa o chip «Temporada de exámenes»: aperturas extraordinarias y salas 24 h de diciembre-enero, SOLO con fuente oficial y fechas (usar el mecanismo de `horario_excepciones` si hace falta, o un campo con fuente y periodo en los datos). Tenerlo antes del 1 de diciembre (empiezan los exámenes de la UNAV). Si no hay fuentes publicadas todavía, dejar la estructura lista y apuntar en el backlog qué webs revisar
  - 2026-10-27 · Hecho: `temporada-examenes.js` (campos y reglas en su cabecera), chip «📚 Temporada de exámenes» (solo si hay entradas vigentes o en ≤ 30 días), nota con fuente en el popup y la ficha, y «abierta ahora» con el horario de exámenes cuando la entrada trae `semana` (solo en bibliotecas con horario). Prueba en `scripts/probar.py`. Ciudades con fuente oficial 2026-27: **Pamplona** (UNAV Central, diciembre), **Madrid** (UPM Campus Sur y ETSI Agronómica), **Sevilla** (UPO, campus de Dos Hermanas). Faltan **Barcelona** y **Valencia**
  - Revisar (sin calendario 2026-27 publicado el 27-10-2026; no reutilizar fechas de cursos pasados):
    - UPNA (Pamplona): https://www.unavarra.es/biblioteca — exámenes desde el 15 dic; suele avisar en noviembre-diciembre. Recordar que en exámenes la sala se reserva a la comunidad UPNA
    - UNAV Ciencias y enero de 2027 de la Central: https://www.unav.edu/web/biblioteca/horarios/biblioteca-ciencias y …/horarios/biblioteca-central — publican el mes siguiente a finales del anterior (enero, hacia mediados de diciembre)
    - UCM (Madrid, sala María Zambrano 24 h y bibliotecas de facultad): https://www.ucm.es/noticias y https://biblioteca.ucm.es — suele publicarse en diciembre para enero
    - UAM (Madrid, Sala Búho y Medicina): https://www.uam.es/uam/vida-universitaria/bibliotecas/noticias — el curso pasado lo publicó el 01-12-2025
    - Ayuntamiento de Madrid, salas de estudio de distrito con horario ampliado: https://diario.madrid.es — notas por distrito en diciembre-enero
    - UB (Barcelona, CRAI): https://crai.ub.edu — horaris ampliats a finals de novembre/desembre
    - UPC y UAB: https://bibliotecnica.upc.edu y https://www.uab.cat/biblioteques — mismo calendario
    - Ajuntament de Barcelona, «sales d'estudi nocturnes» / Biblioteques de Barcelona: https://ajuntament.barcelona.cat/biblioteques — se anuncian en diciembre para enero
    - Universitat de València: https://www.uv.es/uvweb/servei-biblioteques-documentacio/ca/ (novetats de cada biblioteca) — el curso pasado, a mediados de noviembre (13-11-2025)
    - UPV (València): https://www.upv.es/entidades/abdc/ — «Horario extraordinario por exámenes», diciembre-enero
    - Universidad de Sevilla: https://bib.us.es — aperturas extraordinarias en diciembre-enero
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

- [ ] Objetivo 1 · Datos: en `bibliotecas-espana.js` la entrada «Biblioteca Municipal Sant Hilari Sacalm» (índice 93) tiene la dirección de la BPE de Guadalajara (Plaza Dávalos); corregir el nombre o la dirección con fuente oficial sin mover el índice (visto el 2026-10-27)

## Datos (por lotes pequeños, siempre con fuente oficial)
- [ ] España · Horarios verificados: seguir añadiendo 10 bibliotecas por tarea (hay 64 con horario, 47/51 provincias; faltan Salamanca, Segovia, Baleares y Cádiz: sus BPE de la capital no están en el archivo o su web no daba el horario de invierno). Priorizar capitales de provincia sin ninguna. Como pista para buscar la fuente oficial puede usarse el campo `oh` de `data/bibliotecas_espana.json` (OpenStreetMap, ODbL), pero nunca publicarlo como verificado. Cada horario nuevo lleva `h.fv` con la fecha (AAAA-MM-DD) en que se comprobó la fuente
- [ ] Navarra · verificar horario/aforo/recursos de 10 bibliotecas con la web oficial; repetir hasta cubrir las 104

## Web pública
- Producción en Vercel: https://bibliotime-ten.vercel.app (proyecto `juan-f396/bibliotime`; `.vercelignore` deja fuera scripts, backlog, SQL y `.env*`). Se actualiza a mano con `npx vercel deploy` (prueba) y `npx vercel promote <url>`; todavía no está conectado a GitHub para desplegar solo. La TWA de Google Play y `assetlinks.json` deberán apuntar a este dominio (o a uno propio)

## Pendiente del usuario (no lo puede hacer la tarea automática)
- Ejecutar en Supabase (SQL Editor) el bloque «REZOS VISIBLES PARA AMIGOS» del final de `supabase/supabase_social.sql` (función `prayer_counts`). Mientras no exista, cada amigo solo ve su propio rezo (0 o 1), no el total
- Conectar **bibliomapa.es** al proyecto de Vercel, darlo de alta en Google Search Console y enviar `sitemap.xml` (pasos en `docs/SEO.md`). Sin esto las páginas de SEO no posicionan
- Ejecutar en Supabase (SQL Editor) el bloque «COMENTARIOS EN SESIONES» del final de `supabase/supabase_social.sql`
- Ejecutar en Supabase (SQL Editor) el bloque «REPORTES DE HORARIO» del final de `supabase/supabase_social.sql` (tabla `horario_reportes` y función `horario_confirmaciones`). Mientras no exista, los reportes van al buzón `feedback` y no se muestra el recuento de confirmaciones
- Ejecutar en Supabase (SQL Editor) el bloque «DENUNCIAS Y BLOQUEOS» del final de `supabase/supabase_social.sql` (tablas `content_reports` y `user_blocks`; ya añadido también al final de `Bibliotime - DocumentacionSQL_PENDIENTE_supabase.sql`). Mientras no exista, las denuncias van al buzón `feedback` (contexto `content_report`) y los bloqueos solo se guardan en el dispositivo. Después, revisar a menudo `content_reports` (columna `estado`) para cumplir la moderación que exige Google Play
- Google Play (bloqueante): rellenar en `privacidad.html` y `condiciones.html` los marcadores `[NOMBRE DEL RESPONSABLE]`, `[EMAIL DE CONTACTO]` y `[REGIÓN DEL PROYECTO SUPABASE]`, y elegir el nombre de paquete definitivo (`assetlinks.json` dice `es.bibliotecasnavarra.app` y la guía `io.github.mmedranomunhub.bibliotime`; no se puede cambiar después). Pasos completos en `Bibliotime - Documentacion\salida_al_mercado\`
- Salida al mercado (del estudio de mercado): abrir ya la prueba cerrada de Google Play (pide 14 días con testers), preparar el piloto en Pamplona para los exámenes de enero de 2027 y proponer un piloto B2B gratuito a las bibliotecas de Navarra o al Ayuntamiento de Pamplona
- Ejecutar en Supabase (SQL Editor) el bloque «PRIVACIDAD DE LA PRESENCIA» del final de `supabase/supabase_social.sql` (política select de `presence` con caducidad de 4 h, `updated_at` puesto por el servidor y borrado de la propia fila; ya añadido también al final de `Bibliotime - Documentacion\SQL_PENDIENTE_supabase.sql`). Mientras no se ejecute, la caducidad de 4 h solo la aplica la app

## Hecho
- [x] 2026-10-27 · Objetivo 1 · Arreglo: el acceso por defecto depende de si la biblioteca es de Navarra (índice < `N_NAVARRA`), no de si tiene horario. Las de fuera ya no citan la Ley Foral 32/2002: públicas, Ley 10/2007; universitarias, «consulta su web»; el resto, «Consulta las condiciones en su web ↗» (enlace si hay `web`). Prueba en `scripts/probar.py`
- [x] 2026-10-27 · Bosque · Especies de temporada gratis: 🎄 Abeto de Navidad con luces que parpadean y estrella (1 dic – 6 ene) y 🌼 Almendro en flor (1 mar – 30 abr). `enTemporada` admite periodos que cruzan el año (12-01 → 01-06) y una fecha opcional; prueba con fechas simuladas en `scripts/probar.py`
- [x] 2026-10-27 · SEO · Página propia para las bibliotecas más buscadas: 155 páginas `/bibliotecas/<prov>/<biblioteca>/` (Nacional, Regional de Madrid, grandes y universitarias de capitales y todas las de capitales con horario verificado) con horario verificado con fuente o «sin confirmar», «Ver en el mapa», cercanas, `Library` + `FAQPage` solo con horario verificado; enlazadas desde las tarjetas y en `sitemap.xml`; 146 → 301 páginas SEO
- [x] 2026-10-27 · Exámenes · Chip «📚 Temporada de exámenes», nota con fuente en ficha/popup y horario extraordinario en «abierta ahora» (`temporada-examenes.js`): 3/5 ciudades con fuente oficial 2026-27 (Pamplona UNAV, Madrid UPM, Sevilla UPO). Faltan Barcelona y Valencia
- [x] 2026-10-27 · España · Horario verificado en 10 capitales sin ninguno (Murcia, Castellón, Alicante, Sevilla, Almería, Huelva, Girona, Teruel, Palencia, Soria): 27 → 37/51 provincias
- [x] Objetivo 4 · Páginas temáticas «abiertas domingo», «fin de semana» y «hasta tarde» de España y por provincia (≥ 2), solo con horarios verificados con fuente; 125 → 144 páginas SEO (2026-10-27)
- [x] 2026-10-27 · Bienvenida diaria tipo Duolingo (racha, próximo examen, misiones, tip del día y «Estudiar ahora»), una vez al día y solo si aún no has estudiado; el lunes cede el sitio al resumen semanal
- [x] 2026-10-27 · «Tu rincón» en la ficha de la biblioteca (horas, sesiones y mini bosque allí) y barra de nivel que se llena al terminar la sesión
- [x] 2026-10-27 · Dopamina 4: modo foco a pantalla completa (tocar el árbol), chip del próximo examen con cuenta atrás y rezos, «N amigos estudiando ahora», aro del avatar según el nivel (bronce/plata/oro)
- [x] 2026-10-26 · Dopamina 3: cuenta atrás en vivo hasta que cierra o abre la biblioteca; 🎃 calabaza de Halloween gratis hasta el 2 nov; logros «Bosque perfecto», «Cazador de cofres» y «Botánico»; 24 tips de estudio en baraja vertical tipo TikTok (me sirve, guardar, enviar, doble toque)
- [x] 2026-10-26 · Dopamina 2: semillas 🌰 y tienda de 6 especies; misiones diarias con cofre; racha con llama (en peligro desde las 19 h, últimos 7 días); hitos en la sesión; historias de amigos con visor y doble toque para kudos; imágenes 1080×1920 para stories del bosque y de cada sesión; podio del ranking con «te faltan X para adelantar a…»; cuenta atrás 3-2-1 al empezar; resumen semanal tipo Wrapped el lunes
- [x] 2026-10-26 · Marca «Bibliomapa · Bibliotecas de España» (sin Navarra en títulos, legales, bienvenida; vista inicial de toda España; sin ubicación se pide en vez de recomendar Navarra)
- [x] 2026-10-26 · Rezos: error de RLS (los amigos no veían el total) → función `prayer_counts` + recuento siempre visible; rezar activado por defecto; compartir exámenes marcado por defecto
- [x] 2026-10-26 · Bosque como Forest: un árbol por sesión proporcional a los minutos, crece dentro del anillo, se marchita al salir >15 s; «Mi bosque» y bosque de amigos
- [x] 2026-10-26 · Diseño más vivo: niveles por horas, confeti en meta/nivel/árbol, rebotes, auroras, avisos animados (todo respeta «reducir movimiento»)
- [x] 2026-10-26 · SEO: 126 páginas por provincia/ciudad, sitemap, robots, JSON-LD, enlace `#bib=` (`docs/SEO.md`)
- [x] 2026-10-20 · Privacidad · Presencia de amigos revisada (RGPD/LOPDGDD). Auditoría: ya era opcional y desactivada por defecto, sin coordenadas (solo `bib_index`; la ubicación solo vive en memoria del dispositivo, sin geolocalización en segundo plano) y solo para amigos aceptados; faltaba caducidad en SQL, comprobar si la biblioteca está cerrada, apagarla al cerrar la app o la sesión, y en las salas se veía la biblioteca aunque no compartieras. Ahora: se muestra solo si es de <4 h y la biblioteca está abierta, se deja de compartir a las 4 h o al cerrar la biblioteca, se apaga al cerrar la app (keepalive) y al cerrar sesión, aviso al activarla, «Modo invisible» en Ajustes, aviso de 14 años ya estaba en el registro; `privacidad.html` actualizada; SQL «PRIVACIDAD DE LA PRESENCIA»; caché v35 (`778f200`)
- [x] 2026-10-20 · Google Play (bloqueante) · Contenido generado por usuarios: botón ⋯ en blog, comentarios, sesiones del feed y amigos con «Denunciar» (motivo + comentario ≤500; tabla `content_reports`, y si no existe va al buzón `feedback`) y «Bloquear usuario» (oculta en el cliente blog, comentarios, feed, ranking, presencia, salas y eventos; tabla `user_blocks` + caché local; lista para desbloquear en Ajustes). `condiciones.html` enlazada desde Ajustes, el registro («Al crear la cuenta aceptas…») y `privacidad.html` (`f21fc8d`). Falta ejecutar el SQL y revisar las denuncias a mano en Supabase
- [x] 2026-10-20 · Misas · Fecha de verificación del horario en la ficha (campo `h.fv` en las 44 de España, con la fecha del commit de cada lote; aviso a los 180 días; las de Navarra: «sin fecha de verificación») + botones «✓ Sigue siendo correcto» / «⚠ Reportar horario incorrecto» con sesión, recuento de confirmaciones de 90 días y SQL `horario_reportes` (`6bdf51c`). Falta ejecutar el SQL
- [x] 2026-10-20 · Limpieza · Quitado `abrirComparador` y el CSS del comparador antiguo (no se llamaba desde ningún sitio) (`58062e0`)
- [x] 2026-10-20 · Integrado el PR #4 de la nube (rendimiento, contraste AA, agenda, calendario de amigos; quita el selector de capas, así que la tarea del selector que tapaba la lista ya no aplica) con las funciones locales (`f143adb`)
- [x] 2026-10-18 · Carpeta local igualada con `repo3` (bibliotecas de toda España de Overture, rediseño del mapa, modo oscuro, buscador y filtros hechos en la nube). El trabajo local antiguo queda en la rama `respaldo-local-octubre` y en `git stash` (capa OSM descartada)
- [x] 2026-10-18 · Strava · Comentarios en sesiones del feed (`852b445`). Falta ejecutar el SQL en Supabase y probarlo con sesión real
- [x] 2026-10-18 · Strava · Retos mensuales + vitrina de trofeos (`3cd0929`)
- [x] 2026-10-18 · Misas · Chips «Abren pronto» y «Hasta tarde» + cambio de temporada en la próxima apertura (`aad3fe0`)
- [x] 2026-10-18 · Misas · Favoritas con estrella, filtro y avisos (`f2aaceb`)
