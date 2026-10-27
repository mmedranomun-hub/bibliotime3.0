# SEO de bibliomapa.es

Objetivo: que bibliomapa.es salga lo más arriba posible en búsquedas como «bibliotecas abiertas en Valencia»,
«biblioteca abierta domingo Madrid», «salas de estudio Pamplona» o «bibliotecas cerca de mí».

**Nadie puede garantizar el primer puesto en Google** (no se compra ni se fuerza; quien lo prometa miente).
Lo que sí se puede hacer es tener la mejor página para cada búsqueda local y que Google la encuentre. Eso es lo que hay montado.

## Hecho (2026-10-26)
- Portada: título y descripción con «bibliotecas y salas de estudio abiertas en España», `canonical` a
  https://bibliomapa.es/, Open Graph, datos estructurados `WebSite` + `WebApplication`.
- **126 páginas estáticas** (`bibliotecas/…`): índice, 51 provincias y las localidades con 3 o más bibliotecas.
  Cada una con título propio («Bibliotecas en X: horarios y salas de estudio abiertas»), lista de bibliotecas con
  dirección, teléfono, web, horario **solo si está verificado** (con fecha y fuente), preguntas frecuentes
  calculadas con datos reales (fin de semana, cierre tardío), migas de pan y datos estructurados
  (`Library`, `ItemList`, `FAQPage`, `BreadcrumbList`). Cada biblioteca enlaza a su ficha en el mapa (`/#bib=<índice>`).
- `sitemap.xml` y `robots.txt`.
- Se regeneran con `node scripts/generar_paginas_seo.js` (hacerlo siempre que cambien datos u horarios).

## Hecho (2026-10-27) · Páginas temáticas por horario (144 páginas en total, antes 125)
- `/bibliotecas/abiertas-domingo/`, `/bibliotecas/abiertas-fin-de-semana/` y `/bibliotecas/abiertas-hasta-tarde/`
  (cierran a las 21:00 o más tarde algún día de lunes a viernes), de toda España y agrupadas por provincia.
- Por provincia, `/bibliotecas/<prov>/<tema>/` **solo si hay 2 o más bibliotecas que cumplen** (sin páginas finas):
  hoy 16 (p. ej. Madrid hasta tarde, Barcelona domingo, Las Palmas los tres temas).
- Solo entran horarios verificados con fuente y fecha (`h.inv` + `h.f` + `h.fv`). El texto dice «Según el horario de
  invierno comprobado en la web oficial … el <fecha>» y avisa de que verano, festivos y exámenes pueden cambiarlo.
  Cada tarjeta destaca el dato buscado («Domingo: 10:00–14:00», «Entre semana cierra a las 21:30»).
- Título, descripción, h1, migas, canonical, `ItemList` de `Library` y `FAQPage` propios; enlaces «Por horario»
  desde el índice y desde cada provincia que tenga alguna, y entre los temas; todas en `sitemap.xml`.
- Crecen solas: al añadir horarios verificados y regenerar, aparecen nuevas provincias.

## Hecho (2026-10-27) · Página propia de las bibliotecas más buscadas (301 páginas en total, antes 146)
- 155 páginas `/bibliotecas/<prov>/<slug-biblioteca>/`: Biblioteca Nacional, Regional de Madrid, las de tipo
  `mayor`/`universidad` de capitales de provincia (más Santiago y Mérida, capitales autonómicas) y todas las de
  capitales con horario verificado (52 de ellas lo tienen). Gijón y otras no capitales quedan fuera por ahora.
- Slug estable a partir del nombre (máx. 70 caracteres, cortado por palabra); si choca con otra biblioteca o con una
  página de localidad/tema de la provincia se añade la localidad (y `-2`, `-3` si aún choca).
- Contenido: h1, tipo, dirección, teléfono, web, tabla de horario con fuente y fecha (o «Horario sin confirmar»),
  aviso de la fuente (si la nota dice «Sábados sin confirmar», ese día sale «Sin confirmar», no «Cerrada»),
  botón «Ver en el mapa» (`/#bib=<índice>`), 6 bibliotecas más cercanas de la misma localidad con distancia, migas,
  canonical, JSON-LD `Library` (con `openingHoursSpecification` solo si está verificado) y `FAQPage`
  («¿Abre los domingos…?», «¿A qué hora cierra…?») solo cuando hay horario verificado.
- Las tarjetas de provincia, localidad y temáticas enlazan el nombre de la biblioteca a su página. Todas en `sitemap.xml`.
- Crecen solas: cada horario verificado nuevo en una capital genera su página al regenerar.

## Hecho (2026-10-27) · «Bibliotecas abiertas hoy en <lugar>» (360 páginas en total, antes 339)
- `/bibliotecas/abiertas-hoy/` (España), `/bibliotecas/<prov>/abiertas-hoy/` y `/bibliotecas/<prov>/<localidad>/abiertas-hoy/`
  con 2 o más bibliotecas con horario verificado (fuente + fecha): hoy 21 páginas (13 provincias, 7 localidades y España).
- Lo estático (lo que lee Google): título «Bibliotecas abiertas hoy en X», tabla «¿Cuántas abren cada día?» con el recuento
  real del horario de invierno verificado, tarjetas con el horario semanal y la fuente, `CollectionPage` + `FAQPage`
  («¿Qué bibliotecas abren hoy…?», «¿…hoy domingo…?», «¿Cuál cierra más tarde…?»).
- En el navegador, un script pequeño (en línea, sin dependencias) calcula con la hora de España peninsular o de Canarias
  (`Intl`, zona `Atlantic/Canary` en Las Palmas y Tenerife) el horario de hoy de cada una, si está abierta ahora, abre
  más tarde o ya cerró, ordena las abiertas primero y resalta el día en la tabla. Usa el horario de verano solo si está
  verificado con fechas (`h.ver` + `h.vd`/`h.vh`); los días «sin confirmar» de la nota salen como tales. Sin JS se ve el
  horario semanal. Es una entrada más de `TEMAS` (`hoy: true`), así que sale en «Por horario» y crece sola.

## Hecho (2026-10-27) · Títulos de provincia y localidad y enlazado entre vecinas (372 páginas)
- Título y meta description de las 51 provincias y 73 localidades: empiezan por «Bibliotecas abiertas en <lugar>» con el
  recuento real (total y con horario verificado con fuente y fecha), p. ej. «Bibliotecas abiertas en Madrid: 208, 9 con
  horario verificado | Bibliomapa» o «Bibliotecas abiertas en Getafe: 4, sin horario verificado aún». La redacción cambia
  de forma determinista (`tituloLugar` y `descripcionLugar`: según haya verificadas, domingo o cierre a las 21:00 y un hash
  de la ruta), así que regenerar con los mismos datos da lo mismo. Título ≤ 65 caracteres (« | Bibliomapa» solo si cabe;
  los nombres larguísimos usan una forma corta) y descripción ≤ 160. Si una localidad se llama igual que otra o que una
  provincia, lleva la provincia. Ningún título se repite en todo el sitio (`titulosUsados`; también las fichas de biblioteca
  con el mismo nombre). og:title/og:description salen de los mismos textos y el JSON-LD `CollectionPage` repite nombre y descripción.
- «Provincias cercanas» en cada provincia (las 4 más cercanas por distancia entre centroides de sus bibliotecas; 3 si la
  4.ª está mucho más lejos), «Localidades cercanas» en cada localidad (las que tienen página propia, de cualquier provincia:
  hasta 4 a ≤ 60 km o 2 a ≤ 150 km; se descartan nombres dobles de la misma ciudad, como Donostia / San Sebastián) y
  «Por horario en <provincia>» en cada ficha de biblioteca (temáticas de su provincia y, si las hay, de su localidad).

## Hecho (2026-10-27) · «Salas de estudio en <capital>» (405 páginas en total, antes 384)
- 20 páginas `/bibliotecas/<prov>/salas-de-estudio/` (o `/bibliotecas/<prov>/<capital>/salas-de-estudio/` si la capital tiene
  página de localidad) y el índice `/bibliotecas/salas-de-estudio/`. Para búsquedas como «salas de estudio Madrid» o
  «bibliotecas para estudiar en Bilbao». Entran las capitales de provincia (y Santiago y Mérida) con 5 o más bibliotecas
  universitarias, públicas o grandes (campo `t`) y al menos una con horario verificado con fuente y fecha; con menos
  repetiría la página de la ciudad. Hoy: Madrid, Valencia, Barcelona, Palma, Granada, Sevilla, Málaga, Santiago, A Coruña,
  Las Palmas, Valladolid, Zaragoza, Badajoz, Murcia, Salamanca, Bilbao, Albacete, Burgos, Oviedo y Santa Cruz de Tenerife.
- Lo propio (no está en la página de la ciudad): «Las que más horas abren», ranking de las de horario verificado por horas
  de apertura a la semana (horario de invierno; los días «sin confirmar» no suman), con cierre entre semana, sábado,
  domingo, fuente y fecha; «Temporada de exámenes» con las entradas vigentes de `temporada-examenes.js` (fuente oficial);
  universitarias y públicas por separado con el acceso de cada tipo (universitarias: suele limitarse a su comunidad;
  públicas: libre y gratuito, Ley 10/2007); FAQ calculadas («¿Dónde estudiar en X?», fin de semana, cierra más tarde,
  acceso sin ser alumno y, si hay, ampliaciones por exámenes). Las «otra» no se listan: se enlaza a la ciudad.
- `CollectionPage` con `dateModified` (verificación más reciente) e `ItemList` de `Library`, `FAQPage`, migas; título único
  ≤ 65 («Salas de estudio en <ciudad>: N bibliotecas para estudiar»). Enlazadas desde el índice, la provincia, la localidad
  («Para estudiar: …») y las fichas de biblioteca de esa ciudad. Crecen solas al verificar horarios o clasificar bibliotecas.
- Pamplona no sale todavía: ver la sección siguiente.

## Hecho (2026-10-27) · El generador lee los horarios de Navarra de `app.js` (412 páginas, sin cambios aún)
- Ya no usa una expresión regular: lee `app.js` como texto y evalúa en un contexto `vm` vacío (sin `window` ni `document`,
  con tiempo máximo) solo el bloque de datos, desde `function h(hh,mm)` hasta el cierre de `const BIBLIOTECAS=[…]`. No se
  ejecuta la app. Convierte `horas`/`horasInvierno`/`horasVerano` (formato `semana()`, minutos) al formato de
  `bibliotecas-espana.js` (`{"L":[["08:30","20:30"]],…}`) y comprueba que el número de bibliotecas cuadra con `app.js`.
- **Decisión: un horario de Navarra solo se publica si trae fuente y fecha en `app.js`**: `fuenteHorario` (url https) y
  `verificadoHorario` (AAAA-MM-DD), los mismos campos que la ficha de la app ya enseña como «Horario verificado el … · fuente»
  (opcionales: `notaHorario`, `veranoDesde`/`veranoHasta` en «MM-DD»; sin ellos el verano es el de la app para la red de
  Navarra, del 15-06 al 14-09). Hoy **ninguna de las 104 los tiene**: las 15 de Pamplona se metieron a mano en junio sin fuente
  y las 89 del resto salen del conjunto de datos abiertos del Gobierno de Navarra (commit 216a48c, 2026-09-13) sin url ni fecha
  de comprobación; el commit 6bdf51c ya dejó escrito que «las de Navarra no tienen fecha registrada» y la app dice «Horario sin
  fecha de verificación». No se pudo comprobar en la web oficial desde aquí (unav.edu y bibliotecaspublicas.es bloqueadas),
  así que se quedan en «Horario sin confirmar»: no se usa la fecha de un commit sin fuente ni se inventa una.
- En cuanto alguien añada en `app.js` esos dos campos a una biblioteca de Navarra comprobada en su web oficial, al regenerar
  entra sola. Simulación con las 15 de Pamplona: 412 → 433 páginas (Salas de estudio en Pamplona; Navarra y Pamplona
  abiertas hoy, domingo, fin de semana y hasta tarde; Navarra verano; 11 fichas nuevas), sin títulos repetidos.
- 2026-10-27 (después) · Ya hay **13 de 104** con `fuenteHorario` + `verificadoHorario` (comprobadas ese día en pamplona.es,
  bibliotecaspublicas.es, unav.edu y unavarra.es; la Biblioteca de Navarra, corregida con su verano de julio y agosto).
  Simulado: 412 → 431 páginas. Faltan UNAV Ciencias (verano sin fuente) y Facultades Eclesiásticas (sin horario publicado);
  ver BACKLOG. Las páginas se publican cuando el director regenere.

## Hecho (2026-10-27) · «Bibliotecas de la <Universidad>: horarios y salas» (422 páginas en total, antes 412)
- 9 páginas `/bibliotecas/universidades/<slug-universidad>/` y el índice `/bibliotecas/universidades/`, para búsquedas como
  «horario biblioteca UCM» o «bibliotecas Universidad de Zaragoza». Hoy: UCM (16 bibliotecas, 11 con horario verificado),
  USC (10/1), UB (10/4), USAL (8/1), UV (7/1), UPV (6/5), UM (5/1), UPV/EHU (4/4) y UNIZAR (3/1).
- **Cómo se asigna la universidad** (los datos no traen titularidad): lista explícita `UNIVERSIDADES` en el generador con
  sigla, nombre oficial, dominios web y una expresión para el nombre. Entra una biblioteca si (1) el host de su `web` es el de
  la universidad o un subdominio (crai.ub.edu → ub.edu; blanquerna.url.edu no) o (2) su nombre la cita sin ambigüedad (nombre
  oficial o sigla con límites de palabra; «UPV» no casa con «UPV/EHU»), **y** está en una provincia donde esa universidad
  tiene campus. Fuera: las que casan con dos universidades, las públicas municipales que solo casan por la web, los
  hospitales «universitarios» sin web de la universidad y las que no dan ninguna pista («Biblioteca de la Facultad de
  Educación» sin web, aunque esté en Salamanca). El generador imprime las que no llegan al mínimo y las dudosas.
- Se publica solo con **3 o más bibliotecas y al menos 1 con horario verificado** (fuente + fecha). Sin página por ahora
  (les falta un horario verificado): UPM 6, UAB 7, UPC 6, UDC 8, UAM 4, US 4, UAH 3, UNAV 3; con menos de 3 en los datos:
  UGR, UMA, Uniovi, UC3M, URJC, UA, UPNA. Crecen solas al verificar horarios y regenerar.
- Contenido: «Horarios verificados» (horario de invierno, nota de la fuente, enlace a la fuente y fecha; si la nota dice que
  la fuente no da un día, sale «sin confirmar», no «cerrado»), «Temporada de exámenes» si `temporada-examenes.js` tiene
  entradas vigentes para sus bibliotecas (por `bib` exacto o por el nombre de la universidad en `espacio`; hoy ninguna de las
  9), sus bibliotecas por ciudad o campus (tarjeta con horario verificado o «sin confirmar», enlace a su ficha si existe y
  «Ver en el mapa»), y en cada ciudad enlaces a la página de la ciudad, a sus «Salas de estudio» y a «Por horario».
  Localidades que en los datos son una calle (Rúa…) se agrupan con la biblioteca más cercana de la misma universidad
  (≤ 20 km); «Valencia» y «València» van juntas.
- FAQ solo con datos verificados: horario de las verificadas, fin de semana (distingue «cerrada» de «sin confirmar»), cuál
  cierra más tarde (con empates), acceso sin ser alumno y, si las hay, ampliaciones por exámenes.
- `CollectionPage` (con `about` `CollegeOrUniversity`, `dateModified` = verificación más reciente, `ItemList` de `Library`),
  `FAQPage`, migas. Título ≤ 65 y descripción ≤ 160 únicos (con nombre y sigla si caben). Enlazadas desde el índice general
  («Por universidad»), la provincia y la localidad («Universidades: UCM 16…») y el dato «Universidad» de cada ficha.

## Hecho (2026-10-27) · Hub «Bibliotecas por horario», fechas de verificación y comprobador (453 páginas, antes 452)
- **`/bibliotecas/horarios/`**: reúne todas las búsquedas por horario. «En toda España» (hoy, domingo, fin de semana, hasta
  tarde, verano, salas de estudio, universidades, con recuentos) y «Por provincia» (27 hoy): en cada una sus temáticas, las de
  sus localidades («Pozuelo de Alarcón: Todas 5 · Hoy 2 · Hasta tarde 2»), sus salas de estudio y sus universidades. Al final,
  las provincias con horario verificado pero sin páginas por horario (menos de 2 que cumplan) y una FAQ con datos verificados
  (en qué provincias abren en domingo, hasta tarde y en verano; de dónde salen los horarios). `CollectionPage` con
  `dateModified` y `hasPart`, `FAQPage`, migas; en `sitemap.xml` con prioridad 0.9.
- Enlazado interno: todas las páginas temáticas (España, provincia, localidad) llevan «Todos los horarios» en su barra de temas;
  las de salas de estudio y universidades (y sus índices), «Todos los horarios por provincia»; «Por horario» de provincias y
  localidades, «Más horarios» (a su provincia en el hub); el índice `/bibliotecas/`, «Por provincia».
- `dateModified` (y `lastmod` del sitemap) = fecha de verificación (`h.fv`) más reciente de las bibliotecas con horario
  verificado que muestra la página. Ya lo tenían las temáticas, salas y universidades; ahora también provincias y localidades
  (`CollectionPage`) y las fichas de biblioteca (un `WebPage` con `about` → la `Library`, que no admite `dateModified`). Las
  páginas sin ningún horario verificado siguen con la fecha del día en que se genera.
- Arreglos: una web sin `http(s)://` en los datos (Villanueva de la Serena) salía como enlace relativo roto en 2 páginas: el
  generador le añade `http://`; dos sedes «Biblioteca Universidad de Murcia» tenían la misma meta description: la segunda
  lleva la dirección.
- **`node scripts/comprobar_paginas_seo.js`** (ejecutarlo tras regenerar): enlaces internos rotos (incluidas anclas `#…`),
  títulos y descripciones repetidos, JSON-LD ilegible, páginas sin enlaces entrantes y URL del sitemap que no existen o
  faltan. Sale con código 1 si algo falla. Hoy: 453 páginas, 15.950 enlaces internos, 0 rotos, 0 títulos y 0 descripciones
  repetidos, 0 huérfanas, sitemap completo.
- Pendiente (fuera del generador): un enlace desde la portada (`index.html`) a `/bibliotecas/horarios/`.

## Hecho (2026-10-27) · Tabla de horarios y FAQ con datos en provincias y localidades (461 páginas, sin cambio)
- Las 51 provincias y 73 localidades son las que compiten por «bibliotecas abiertas en <lugar>». Ahora llevan arriba, si hay
  alguna con horario verificado (fuente `h.f` + fecha `h.fv`; Navarra solo con `fuenteHorario` + `verificadoHorario`), la
  sección **«Horarios verificados en <lugar>»** (`#horarios`): tabla Biblioteca · Lunes a viernes · Sábado · Domingo (horario de
  invierno; si los días laborables difieren, por grupos «L–J … · V …»; «Sin confirmar» si la nota de la fuente lo dice), de más
  a menos horas a la semana, máximo 15 filas, con enlace a la ficha o al mapa y las fechas de verificación en el `caption`.
  Responde a la búsqueda en la propia página y es una tabla que Google puede usar como fragmento destacado. Hoy, 65 páginas.
  Estilo en línea (`ESTILO_TABLA_HOR`, mismas variables de color: claro y oscuro) porque `seo.css` no lo genera el script.
- **FAQ (y `FAQPage`) rehecha** (`faq()`): «¿Cuántas bibliotecas hay en X?» con el reparto por tipo; y, solo si hay horarios
  verificados, «¿Qué bibliotecas abren el domingo / el sábado en X?» con sus horas (o «ninguna de las N con horario verificado»,
  separando las que la fuente no confirma), «¿Qué biblioteca cierra más tarde?» con la hora y los empates, «¿Cuál abre más horas
  a la semana?» (≥ 2 verificadas) y «¿De dónde salen estos horarios?» con las fechas. Sin horarios verificados no se pregunta
  por horarios: solo el recuento y cómo comprobarlo (cuántas tienen web y teléfono). Antes eran 3 preguntas fijas con respuestas
  vacías («No tenemos todavía…») y el filtro usaba `b.h` sin exigir fuente y fecha. Preguntas en estas páginas: 372 → 467.

## Hecho (2026-10-27) · «Bibliotecas 24 horas y horario ampliado en exámenes» (507 páginas, antes 501)
- Para «biblioteca 24 horas <ciudad>», «bibliotecas abiertas en exámenes <ciudad>» y «horario ampliado exámenes biblioteca
  <universidad>» (noviembre-enero). Antes las ampliaciones solo salían dentro de «Salas de estudio en <capital>» (y de la
  página de la universidad), así que Alcalá de Henares, Guadalajara o Sevilla-UPO no tenían página propia.
- **`/bibliotecas/examenes/`** (índice, «Bibliotecas 24 horas y horario ampliado en exámenes 2026-27»; «24 horas» solo si
  alguna entrada lo es) y **`/bibliotecas/examenes/<ciudad>/`**, una por ciudad con entradas de `temporada-examenes.js`
  **vigentes** (las mismas de `EXAMENES`: `f`, `fv`, `desde`, `hasta` y `hasta` ≥ hoy). Hoy 5: Alcalá de Henares (2, CRAI
  24 h), Madrid (2, UPM), Guadalajara, Pamplona y Sevilla (1). Sin entradas vigentes en una ciudad no hay página; sin
  ninguna, no hay índice ni enlaces. Al pasar `hasta`, la entrada sale sola al regenerar (y la página si era la única).
- Contenido, todo de la entrada: espacio, periodo («Del 03/11/2026 al 24/01/2027»), horario y nota tal cual, «Abierta 24 h»
  (si `semana` da 00:00–24:00 todos los días o el horario dice «24 horas»), fuente oficial enlazada y fecha de comprobación.
  Si `bib` casa con un único nombre exacto del mapa: dirección, «Ver en el mapa», su ficha (si tiene página propia) y su
  horario habitual de invierno solo si está verificado; si no (`bib: null`, CRAI de la UAH), «Aún no está en el mapa». La
  universidad sale por la de la biblioteca o por su nombre en `espacio` (lista `UNIVERSIDADES`) y enlaza a su página si existe.
  Más abajo, la página de la ciudad (localidad o provincia), sus salas de estudio, la universidad y el hub.
- FAQ (y `FAQPage`) solo con esos datos: qué bibliotecas amplían horario y cuándo, si hay alguna 24 h (solo si la hay), el
  horario de cada una y de dónde salen las fechas (dominios de las fuentes y fechas de comprobación). El índice: cuáles abren
  24 h, en qué ciudades, cuál empieza antes y cuál acaba más tarde, y la fuente; además, tabla «Calendario de exámenes»
  (biblioteca, ciudad, desde, hasta). `CollectionPage` con `dateModified` = `fv` más reciente (también `lastmod`), `ItemList`
  (`Library` del mapa, o solo nombre y localidad si no está), migas. Títulos y descripciones únicos (≤ 65 / ≤ 160).
- Enlazado: las 51 provincias y 73 localidades, las salas de estudio y su índice, el hub `/bibliotecas/horarios/` y el
  índice `/bibliotecas/` enlazan al índice de exámenes; la provincia, la localidad (también la de la biblioteca: Dos Hermanas
  → Sevilla) y las salas de la ciudad, a su página de exámenes («Exámenes: 24 h y horario ampliado en Alcalá de Henares 2 ·
  Horario ampliado en Madrid 2 · Todas las ciudades»), igual que la «Temporada de exámenes» de las universidades.

## Lo que tienes que hacer tú (sin esto no sirve de nada)
1. **Conectar el dominio** en Vercel: proyecto `bibliotime` → Settings → Domains → añadir `bibliomapa.es` y
   `www.bibliomapa.es` (redirigir www → sin www) y poner en tu registrador los DNS que te indique Vercel.
2. **Google Search Console** (search.google.com/search-console): añadir la propiedad de dominio `bibliomapa.es`
   (verificación por DNS) y enviar `https://bibliomapa.es/sitemap.xml`. Lo mismo en Bing Webmaster Tools.
3. Redirigir 301 la web antigua (`bibliotime-ten.vercel.app`) a bibliomapa.es para no partir la autoridad.
4. Enlaces de calidad: web de la universidad, delegaciones de alumnos, colegios mayores, blogs de oposiciones,
   la newsletter, notas de prensa locales («una app de un estudiante de Pamplona…»). En SEO local es lo que más pesa
   después del contenido.
5. Google Play: la ficha enlazando a bibliomapa.es también ayuda.

## Hecho (2026-10-27) · La portada enlaza las páginas por ciudad y horario
- Antes, desde `index.html` solo había un `<a href>` a `bibliotecas/` (en la lista del mapa). Ahora hay 13 enlaces
  rastreables en HTML real (no en `<noscript>` ni creados por JS): al final de la pestaña Perfil, un `<nav class="seo-nav">`
  «🔎 Bibliotecas por ciudad y horario» con el índice, `horarios/`, `abiertas-hoy/`, `salas-de-estudio/`, `universidades/` y
  las 8 provincias con más población (Madrid, Barcelona, Valencia, Sevilla, Alicante, Málaga, Murcia, Cádiz); y en la lista del
  mapa, «🕐 Por horario →» junto a «📍 Por provincia y ciudad →».
- Rutas relativas (`bibliotecas/…`), como el enlace que ya existía: desde la portada en `/` equivalen a `/bibliotecas/…`.
- Solo HTML y CSS en `index.html` (la app no los usa). Píldoras con `--acento-tx` sobre `--glass-fuerte` (AA en claro y oscuro), sin animación.
- Las páginas generadas ya enlazaban la portada (marca y «Abrir el mapa» de la cabecera, CTA y «Empezar gratis»): sin cambios en el generador.
- Pendiente: medir en Search Console cuando el dominio esté conectado.

## Siguientes mejoras (en el backlog)
- Más horarios verificados (las páginas con horario rinden mucho mejor: es lo que la gente busca).
- Ampliar las páginas por biblioteca a grandes ciudades que no son capital (Gijón, Vigo, Cartagena, Jerez…).
- Más ciudades en `/bibliotecas/examenes/` en cuanto publiquen su calendario 2026-27 (Barcelona, Valencia…; lista de webs en
  BACKLOG, tarea «Exámenes ·»): basta con añadir la entrada con fuente y fecha a `temporada-examenes.js` y regenerar.
- Medir en Search Console qué búsquedas traen visitas y reforzar esas páginas.
