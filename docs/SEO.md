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
  Un solo grafo: `WebPage` `<ficha>#pagina` (about → `Library` `<ficha>#biblioteca`, que vuelve con `mainEntityOfPage`)
  y `FAQPage` `<ficha>#faq` con `isPartOf: {"@id": "<ficha>#pagina"}`, que el `WebPage` declara de vuelta con
  `hasPart: {"@id": "<ficha>#faq"}` (el comprobador falla si falta alguno o no es recíproco).
- Lo mismo en todas las demás páginas con FAQ (provincias, localidades, temáticas, hubs, salas, universidades,
  exámenes): `faqEnGrafo()` en `pagina()` da a su `CollectionPage` (el de su misma URL) `@id` `<ruta>#pagina` y al
  `FAQPage` `@id` `<ruta>#faq` + `isPartOf: {"@id": "<ruta>#pagina"}`. El comprobador lo exige en toda página con `FAQPage`.
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
  **Cambiado el 2026-11-01:** el `lastmod` del sitemap ya no es la fecha de verificación ni «hoy», sino el día en que el
  HTML de la página cambió de verdad. El generador guarda, antes de borrar `bibliotecas/`, la huella sha1 de cada página y
  su `lastmod` del sitemap anterior: si la página nueva sale idéntica conserva la fecha; si cambia (datos o plantilla) o
  es nueva, lleva la de hoy; nunca es anterior a su `dateModified`. La portada `/` lleva la fecha del último commit de
  `index.html`. Antes, cada regeneración ponía la fecha del día a las ~435 páginas sin horario verificado aunque no
  cambiaran (Google ignora el `lastmod` de un sitio si no es exacto) y no movía las verificadas cuando cambiaba la
  plantilla. Probado regenerando con el reloj 3 días adelantado: sitemap idéntico; tocando una página, solo esa pasa a la
  fecha nueva. El comprobador falla si algún `lastmod` falta, no es AAAA-MM-DD, es posterior a hoy o anterior al
  `dateModified` del JSON-LD de su página. Ojo: si se regenera en una copia sin el `sitemap.xml` o sin `bibliotecas/`
  anteriores, todo sale con la fecha del día (no hay con qué comparar).
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

## Hecho (2026-11-01) · Fichas con horario de verano y de exámenes, y sus horarios especiales en JSON-LD (552 páginas, sin cambio)
- Para «horario de verano <biblioteca>» y «<biblioteca> horario exámenes»: la ficha solo enseñaba el horario de invierno,
  aunque 75 tenían el de verano verificado (`h.ver` + `h.vd`/`h.vh`, la misma fuente y fecha que `h.f`/`h.fv`) y 4 tenían
  una entrada vigente de `temporada-examenes.js`. El JSON-LD daba el horario de invierno como si valiera todo el año.
- **Verano**: tabla «Horario de verano (del 30/06 al 31/08)» bajo la de invierno y pregunta «¿Qué horario tiene … en
  verano?» en la FAQ. Un día que la fuente deja «sin confirmar» sigue saliendo así (ni en la tabla ni en el JSON-LD se da
  por cerrado).
- **Exámenes**: sección «Horario en época de exámenes» (`#examenes`) con periodo, horario y nota tal cual de la entrada,
  fuente oficial y fecha de comprobación, y enlace a `/bibliotecas/examenes/<ciudad>/`; pregunta «¿Amplía su horario … en
  época de exámenes?»; la meta description cambia la coletilla de contacto por «Exámenes: horario ampliado del 01/12 al
  31/12/2026.»; `dateModified` y `lastmod` = la fecha más reciente entre la del horario y la de la entrada. Hoy: UNAV Central,
  UPM Campus Sur, ETSI Agronómica (UPM) y Educación (UAH, Guadalajara). Las otras 7 bibliotecas del mapa con entrada vigente
  (Valencia ×5, Medicina UAH, UPO) no tienen ficha propia (tarea en el backlog).
- **JSON-LD**: la `Library` de la ficha lleva `specialOpeningHoursSpecification` (76 fichas, 551 tramos): el verano como
  semana con `validFrom`/`validThrough` del periodo en curso o el siguiente (un día cerrado = `opens` y `closes` 00:00, como
  pide Google), y los exámenes **solo si la entrada trae `semana`** (si no, el horario es texto y no se estructura), resueltos
  día a día (cierre > día suelto de `dias` > `semana`) y agrupados en tramos de fechas que no se solapan. UNAV Central:
  1-2 dic 8–21, 3 dic 8–20, …, 23-31 dic cerrada.
- `comprobar_paginas_seo.js` también comprueba esos horarios (horas HH:MM, fechas AAAA-MM-DD en orden y tramos por fecha sin
  solapes) y falla si hay alguno mal.

## Hecho (2026-11-01) · «Cerca, con horario verificado» en las fichas (634 páginas, sin cambio)
- La ficha solo enlazaba a las 6 bibliotecas más cercanas **de su misma localidad**, tuvieran o no horario: las fichas de
  municipios vecinos (Alcorcón ↔ Móstoles, Alfara del Patriarca ↔ Valencia) no se enlazaban entre sí, y quien llegaba a una
  ficha «Horario sin confirmar» no tenía a mano una alternativa segura.
- Nueva sección `#t-verif` «Cerca, con horario verificado» bajo «Otras bibliotecas en <localidad>»: hasta 4 bibliotecas con
  horario verificado (`h.f` + `h.fv`; Navarra con `fuenteHorario` + `verificadoHorario`) y ficha propia a ≤ 15 km, de
  cualquier localidad o provincia, sin repetir las que ya salen arriba. Cada una con distancia, localidad (si es otra), cierre
  más tardío entre semana, sábado y domingo del horario de invierno («sin confirmar» si la fuente no da el día) y fecha de
  verificación. En las fichas sin horario verificado, una línea explica por qué se ofrecen. Sin CSS nuevo (`.cerca`).
- Hoy: 234 de 323 fichas, 804 enlaces internos nuevos entre fichas (todas a fichas con horario). Constantes
  `RADIO_VERIF_KM` y `MAX_VERIF_CERCA` en el generador.

## Hecho (2026-11-01) · «Cerca, con horario verificado» también en localidades sin ninguna verificada (645 páginas, sin cambio)
- Las páginas de localidad sin ninguna biblioteca con horario verificado («bibliotecas abiertas en Fuenlabrada») no daban
  ningún horario comprobado. Ahora llevan la misma sección `#t-verif`, tras la lista y antes de las preguntas frecuentes:
  hasta 4 verificadas con ficha a ≤ 15 km del centroide de la localidad (media de las coordenadas de sus bibliotecas), con la
  misma línea (`resumenVerif`) y el mismo marcado que en las fichas (`seccionVerifCerca()`, compartida). Si no hay ninguna a
  ≤ 15 km, no sale nada. Las localidades con alguna verificada no cambian.
- Hoy: 18 de las 41 localidades sin verificadas (de 73 con página), 50 enlaces nuevos a fichas. Sin CSS nuevo.

## Hecho (2026-11-01) · «Bibliotecas abiertas el sábado por la tarde en <lugar>» (658 páginas, antes 655)
- Para «biblioteca abierta sábado tarde <ciudad>»: `/bibliotecas/abiertas-sabado-tarde/` (España) y
  `/bibliotecas/<prov>/[<loc>/]abiertas-sabado-tarde/`. Entra una biblioteca si tiene horario de invierno verificado (`h.f` +
  `h.fv`; Navarra con `fuenteHorario` + `verificadoHorario`) con alguna franja del sábado que acaba a las 17:00 o más tarde
  (`abreSabadoTarde`). Un día «sin confirmar» no tiene franjas, así que no entra.
- Es una entrada más de `TEMAS` con dos campos nuevos que valen para cualquier tema: `min` (aquí 3, en lugar de 2) y
  `distintoDe` (aquí `abiertas-fin-de-semana`): si en una provincia o localidad la lista es exactamente la de ese otro tema, la
  página no se crea porque lo duplicaría (`igualQue`). Sale sola en el hub, «Por horario», la barra de temas, «Por horario en
  <provincia>» de las fichas y el sitemap. Tarjeta con «Sábado: 10:00–20:00» y FAQ propia (cuáles, cuál cierra más tarde el
  sábado con empates, cuántas abren también el domingo, de dónde salen los horarios). Sin CSS nuevo.
- Recuento (el generador lo imprime en «Tema abiertas-sabado-tarde: …»): cumplen en 14 provincias, 2 con 3 o más (Madrid 6,
  Barcelona 11) y en 13 localidades con página, ninguna con 3 o más; en España, 34. Crece sola al verificar horarios.

## Hecho (2026-11-01) · «Bibliotecas abiertas a mediodía en <lugar>» (682 páginas, antes 669)
- Para «biblioteca abierta a mediodía / horario continuo <ciudad>»: `/bibliotecas/abiertas-mediodia/` (España) y
  `/bibliotecas/<prov>/[<loc>/]abiertas-mediodia/`. Entra una biblioteca si su horario de invierno verificado (`h.f` + `h.fv`;
  Navarra con `fuenteHorario` + `verificadoHorario`) tiene, los 5 días de lunes a viernes, una franja que cubre de 14:00 a
  16:00 sin cortar (`abreMediodia`). Un día cerrado o «sin confirmar» la deja fuera.
- Entrada de `TEMAS` con `min: 3` y `distintoDe: ["abiertas-hoy", "abiertas-hasta-tarde"]`: `distintoDe` admite ahora una
  lista; si la lista del sitio es exactamente la de «Hoy» (todas las verificadas) o la de «Hasta tarde», no se crea. Tarjeta con
  «Lunes a viernes, sin cerrar a mediodía: 8:00–21:00» (`entreSemanaTexto`), intro y FAQ propias (cuáles, cuál abre antes y
  cuál cierra más tarde con empates, cuántas abren también el sábado a mediodía, de dónde salen los horarios). Sin CSS nuevo.
- Recuento (el generador lo imprime en «Tema abiertas-mediodia: …»): cumplen en 47 provincias, 14 con 3 o más, 10 con página
  (Madrid 44, Navarra 23, Barcelona 13, Alicante 8, A Coruña 7, Sevilla 7, Murcia 6, Asturias 5, Málaga 4, Zaragoza 3; las
  otras 4 coinciden con «Hoy» o «Hasta tarde»); 2 localidades (Pamplona 13, Alcalá de Henares 3); España 186.

## Hecho (2026-11-01) · «Bibliotecas que abren temprano en <lugar>» (698 páginas, antes 693)
- Para «biblioteca abierta a las 8 / que abre temprano <ciudad>»: `/bibliotecas/abiertas-temprano/` (España) y
  `/bibliotecas/<prov>/[<loc>/]abiertas-temprano/`. Entra una biblioteca si su horario de invierno verificado (`h.f` + `h.fv`;
  Navarra con `fuenteHorario` + `verificadoHorario`) tiene algún día de lunes a viernes una franja que empieza a las 8:00 o
  antes (`abreTemprano`). Un día «sin confirmar» no tiene franjas, así que no cuenta.
- Entrada de `TEMAS` con `min: 3` y `distintoDe: ["abiertas-hoy", "abiertas-mediodia"]`. Tarjeta «Abre a las 7:30 de lunes a
  viernes: 7:30–20:45» (días en que abre a su hora más temprana, `diasTemprano`; las de 24 h, «Abierta las 24 horas…»), intro y
  FAQ propias (cuáles, cuál abre antes con empates y las de 24 h aparte, cuántas abren a las 8:00 o antes los cinco días,
  cuántas abren también a mediodía sin cerrar, de dónde salen los horarios). Sin CSS nuevo.
- Recuento (el generador lo imprime en «Tema abiertas-temprano: …»): cumplen en 12 provincias, 4 con 3 o más, 3 con página
  (Sevilla 4, Valencia 3, Navarra 3; Las Palmas 4 coincide con «Hoy»), 1 localidad (Pamplona 3, la misma lista que Navarra);
  España 25.

## Hecho (2026-11-01) · «Bibliotecas abiertas el domingo por la tarde en <lugar>» (721 páginas, antes 720)
- Para «biblioteca abierta domingo tarde <ciudad>»: `/bibliotecas/abiertas-domingo-tarde/` (España) y
  `/bibliotecas/<prov>/[<loc>/]abiertas-domingo-tarde/`. Entra una biblioteca si su horario de invierno verificado (`h.f` +
  `h.fv`; Navarra con `fuenteHorario` + `verificadoHorario`) tiene alguna franja del domingo que acaba a las 17:00 o más tarde
  (`abreDomingoTarde`). Un día «sin confirmar» no tiene franjas, así que no entra.
- Entrada de `TEMAS` con `min: 3` y `distintoDe: ["abiertas-domingo", "abiertas-sabado-tarde"]`. Tarjeta «Domingo:
  10:00–19:00», intro y FAQ propias (cuáles, cuál cierra más tarde el domingo con empates —las de 24 h se dicen así—, cuántas
  abren también el sábado por la tarde, de dónde salen los horarios). Sin CSS nuevo.
- Recuento (el generador lo imprime en «Tema abiertas-domingo-tarde: …»): cumplen en 12 provincias, 1 con 3 o más (Madrid 8;
  Barcelona 2) y en 9 localidades con página, 1 con 3 o más (Pozuelo de Alarcón, igual que su «Domingo»: no se crea); España 20.
- Temas con `min`: la página de localidad tampoco se crea si su lista es exactamente la de su provincia (`igualProv`). Hoy solo
  cae `/navarra/pamplona/abiertas-temprano/` (las mismas 3 que Navarra). Con todos los temas caerían 16 (Hoy, Domingo, Fin de
  semana y Hasta tarde en Bilbao, Logroño, Las Palmas, Pamplona…); no se aplica a esos porque se buscan con el nombre de la ciudad.

## Hecho (2026-11-01) · Títulos y descripciones de las páginas temáticas (746 páginas, sin cambio)
- Las 183 temáticas (España, provincias y localidades) tenían títulos de 67-93 caracteres («Bibliotecas abiertas hoy en X:
  horarios verificados | Bibliomapa») y descripciones de hasta 202 con una coletilla vacía («…: hoy, dirección, teléfono…»).
  Google corta el título hacia los 60-65 caracteres y la descripción hacia los 155-160: se perdía justo lo que distingue la página.
- `tituloTema`: «Bibliotecas <tema> en <lugar>» (lo que se busca) y, si cabe, un dato real tras los dos puntos: «15 con
  horario», «34 en 13 provincias» (España), «sábado y domingo» (fin de semana, que también responde a «abiertas sábado»: en
  todas las provincias la lista del sábado es la del fin de semana), «cuáles abren ahora» (Hoy; nunca «9 abiertas hoy», que
  sería falso en domingo). ≤ 65, sin repetir (`titulosUsados`); localidades con nombre repetido llevan la provincia; respaldo
  «Bibliotecas abiertas sábado y domingo / el finde en <lugar>» para nombres largos (Las Palmas de Gran Canaria).
- `descripcionTema` + `datoTema`: recuento, «con horario comprobado en su web oficial» y un dato calculado del horario de
  invierno verificado: cuál cierra más tarde (el domingo, el sábado o entre semana; con su nombre si es una sola, «a
  medianoche» y «abre las 24 horas» dichos así), cuántas abren el sábado y el domingo, cuántas abren cada día (Hoy), la primera
  que abre (temprano y mediodía) o cuántas abren por la tarde en verano. Se prueba de la frase más rica a la más corta hasta
  caber en 160.
- Resultado: títulos > 65 de 183 → 0, descripciones > 160 de 160 → 0. h1, intro, cuerpo y JSON-LD iguales.
- `comprobar_paginas_seo.js` avisaba (sin fallar) de títulos > 65 y descripciones > 160 en todo el sitio: quedaban las fichas
  de biblioteca (hechas abajo).

## Hecho (2026-11-01) · Títulos y descripciones de las fichas de biblioteca (772 páginas, sin cambio)
- Las 416 fichas tenían títulos de 66-151 caracteres («Biblioteca da Facultade de Farmacia (Santiago de Compostela): horario,
  dirección y teléfono | Bibliomapa») y 351 descripciones de más de 160: Google cortaba justo la localidad o el horario.
- `tituloBiblioteca`: «Nombre, Localidad: horario y dirección», o «…: horario», con « | Bibliomapa» solo si cabe; si el nombre
  ya lleva la localidad («Biblioteca Pública de Santiago de Compostela»), no se repite. Se prueba primero el nombre completo y
  después las formas de `formasNombre`, cada una más corta y con sentido: el último rótulo si el nombre tiene dos («Casa de la
  Lectura - Biblioteca Municipal Segovia»), la universidad por su sigla («… - Universidad Complutense de Madrid» → «… - UCM»,
  de `UNIVERSIDADES`), «Biblioteca de la Facultad de X» / «Biblioteca da Facultade de X» → «Biblioteca de X», ETSI y EPS,
  «Biblioteca Municipal Central Federico García Lorca» → «Biblioteca Federico García Lorca» (solo delante de un nombre propio)
  y sin la sede o planta del final («- Edificio Moncloa», «(Central)»). Luego la forma corta y conocida de 3 localidades
  (`LOC_CORTA`: Santiago, Las Palmas, L'Hospitalet; nunca una que sea otro municipio) y, si con «horario» no cabe, sin él.
  Último recurso: cortar por palabra con «…» (hoy solo 1: «Biblioteca de la ETSI Agronómica, Alimentaria y…, Madrid: horario»).
- Dos sedes con el mismo nombre en la misma localidad: la segunda lleva la calle si la dirección dice algo más que el código
  postal y la localidad; si no, la siguiente variante del título (nunca se repite: `titulosUsados`).
- `descripcionBiblioteca`: «Nombre, biblioteca universitaria/pública en Localidad (Provincia). Horario verificado: L–V …
  (o sin confirmar). Exámenes: horario ampliado del … al …. Dirección: <la real>. Teléfono y web.»; se prueba de la más rica
  a la más corta (primero se quitan contacto y dirección, después se abrevia el nombre) hasta caber en 160 sin repetir.
  La provincia no se repite si coincide con la localidad.
- No cambian URL, h1, cuerpo ni el `Library` del JSON-LD (el nombre completo sigue ahí); el `WebPage` toma el título nuevo.
  Índice `/bibliotecas/`: «Bibliotecas de España por provincia: abiertas ahora | Bibliomapa» (antes 75 caracteres).
- Resultado: títulos > 65 de 417 → 0, descripciones > 160 de 351 → 0 en las 772 páginas. `comprobar_paginas_seo.js` ya
  falla (código 1) con cualquier título > 65 o descripción > 160.

## Hecho (2026-11-01) · `ItemList` de fichas en el JSON-LD de las provincias (827 páginas, sin cambio)
- El `CollectionPage` de `/bibliotecas/<prov>/` no llevaba `mainEntity` (las localidades sí). Ahora lleva un `ItemList`
  «Bibliotecas en <provincia>» con las bibliotecas **que tienen ficha y se ven en la página**, en el orden del HTML (en
  las localidades con página propia solo salen las 4 primeras; el resto está en la lista de su localidad). Cada elemento
  es `itemBib(b)`: `url` a la ficha y `@id` `<ficha>#biblioteca`, la misma entidad que la ficha. Las que no tienen ficha
  no entran (su único enlace sería `/#bib=…`, un fragmento de la portada).
- Medido: provincias con `ItemList` 0 → 51 de 51 (420 elementos); las 56 localidades con fichas ya lo llevaban.
  Solo cambian las 51 provincias (4 `lastmod` del sitemap movidos a 2026-11-01; las demás ya tenían esa fecha).
- `comprobar_paginas_seo.js` falla si una página de provincia (`/bibliotecas/<prov>/` con secciones por localidad) o de
  localidad que enlaza a alguna ficha no lleva `mainEntity` `ItemList` en su `CollectionPage`.

## Hecho (2026-11-02) · Casos de «¿Buscabas…?» sacados de los datos (solo cambia el comprobador)
- Además de la lista fija, `comprobar_paginas_seo.js` genera casos: para cada provincia que la 404 enlaza (páginas
  `/bibliotecas/<slug>/` con `<section class="loc">`; nombre = texto de su enlace en `#prov-404`), `/<slug>/` y
  `/bibliotecas/<slug sin guiones>/` deben sugerir esa provincia; y cada clave de `ALIAS_404` (leída del código de
  `generar_paginas_seo.js` y evaluada con `vm`) por `/bibliotecas/<clave>/`, su provincia. Si no puede leer la tabla, falla.
- 35 → 169 casos (51 × 2 + 32 nuevos), todos en verde con la 404 actual: no hubo que tocar el script. Probado rompiendo
  la 404: si el script deja de quitar guiones a la clave del alias, fallan 3; si además deja de compararlos sin guiones
  en los slugs, 13 (todas las provincias de varias palabras por `/<slug>/`).

## Hecho (2026-11-02) · «¿Buscabas…?» fuera de `/bibliotecas/` (solo cambia `/404.html`)
- Si el primer tramo de la ruta no es `bibliotecas`, el script prueba ese tramo (`/navarra/`, `/bizkaia`, `/Vizcaya.html`,
  `/A%20Coru%C3%B1a/horarios`): quita un `.html`/`.htm` final, normaliza igual y solo sugiere si es igual a un slug de
  `#prov-404` sin guiones o está en `ALIAS_404`. Sin distancia de edición ni prefijo fuera de `/bibliotecas/`, para no
  sugerir provincias en rutas que no lo son (`/sevila/`, `/santa-cruz/`, `/leonx/`, `/404.html`, `/` → nada).
- Script inline 2.121 → 2.231 bytes. `comprobar_paginas_seo.js` pasa de 12 a 21 casos; con el script anterior fallan 4.

## Hecho (2026-11-01) · «¿Buscabas…?» en la 404 (solo cambia `/404.html`)
- La 404 lleva bajo el h1 `<p id="buscabas" class="buscabas" hidden>` y, tras el nav de provincias (`id="prov-404"`), un
  `<script id="buscabas-js">` inline sin librerías (`SCRIPT_BUSCABAS` en el generador). Si la ruta es `/bibliotecas/<algo>/…`,
  normaliza `<algo>` igual que `slug()` (decodifica `%…`, quita tildes, minúsculas, guiones) y lo compara con los slugs que
  enlaza `#prov-404`: igual, distancia de edición ≤ 2 (≤ 1 si el slug tiene 4 letras o menos; se mira también sin guiones)
  o prefijo único de 3 letras o más (`sevilla-capital` → Sevilla, `santa-cruz` → Santa Cruz de Tenerife). Si hay empate o
  ninguna, el párrafo sigue oculto. La provincia sale de la propia página: no hay lista duplicada que mantener.
- Accesible: texto normal «¿Buscabas <a>Navarra</a>?» con enlace real (creado con el DOM y `textContent`; el código no
  contiene `href="`, así que el HTML no gana enlaces). Estilos en un `<style>` del `<head>` con tokens de `seo.css`.
- No hay CSP (ni `vercel.json` ni `<meta http-equiv>`), igual que el script inline de «Abiertas hoy».
- `comprobar_paginas_seo.js` falla si falta el contenedor, el script o `#prov-404`, si el script lleva `href="`, o si al
  ejecutarlo en `vm` con un DOM mínimo no da: `navara` → Navarra, `Sevila/x` → Sevilla, `santa-cruz` → Santa Cruz de
  Tenerife, y nada para `xqzw`, `/no-existe` y `/bibliotecas/`.
- Sin alcance hoy: nombres en castellano lejanos del slug (`vizcaya`, `guipuzcoa`) y localidades/temáticas (ver BACKLOG).

## Hecho (2026-11-01) · 404 útil generada por el script (842 páginas, sin cambio; + `/404.html`)
- `generar_paginas_seo.js` escribe `/404.html` en la raíz con la misma plantilla (`pagina({ …, noindex: true })`), `seo.css`
  y tokens que el resto: h1 «Esa página no existe», CTA al mapa, «Por horario» (Abiertas hoy, hub `/bibliotecas/horarios/`,
  todas las provincias) y las 51 provincias con su número de bibliotecas. Con `noindex`: `<meta name="robots"
  content="noindex">`, sin `canonical`, sin `og:url` y sin `BreadcrumbList` (se sirve en cualquier URL inexistente).
  Todos los enlaces son absolutos (`/…`), también `/seo.css`, para que funcione desde `/bibliotecas/x/y/z`.
- Fuera del sitemap (no pasa por `urls`); no cambia ninguna otra página (lastmod intactos; 842 páginas, 843 URL).
- Vercel, en un despliegue estático sin `vercel.json`, sirve `/404.html` con estado 404 en las URL que no existen; el
  `.vercelignore` no lo excluye (solo carpetas de trabajo y docs), así que no hace falta tocar nada. `sw.js` solo guarda
  en caché respuestas 200: la 404 nunca queda cacheada.
- `comprobar_paginas_seo.js` falla si falta `404.html`, si no lleva `noindex` o lleva `canonical`, si está en el sitemap,
  si su título coincide con el de otra página, si algún enlace interno no es absoluto o está roto, o si no enlaza a todas
  las provincias, al hub y a «abiertas hoy». No cuenta como enlace entrante (no tapa huérfanas). Hoy: 64 enlaces, 51 provincias, 0 mal.
- Pendiente: tras el despliegue, `curl -I https://bibliomapa.es/no-existe` → `HTTP/2 404` con este HTML.

## Hecho (2026-11-01) · `CollectionPage` del índice y `hasPart` de provincias y localidades (856 páginas, sin cambio)
- `/bibliotecas/` solo llevaba `BreadcrumbList`. Ahora lleva también un `CollectionPage` (`ldLugar`: mismo nombre y
  descripción que el título sin « | Bibliomapa» y la meta description; `dateModified` = la verificación más reciente de
  toda España) con `mainEntity` `ItemList` «Bibliotecas de España por provincia»: las 51 provincias como `WebPage`
  («Bibliotecas en <provincia>», `url` `/bibliotecas/<prov>/`), en el mismo orden que su lista de provincias. La entrada
  del sitemap del índice usa ese `dateModified` como suelo de su `lastmod`.
- `partesLugar()`: el `CollectionPage` de cada provincia y localidad lleva `hasPart` con las páginas que su HTML ya
  enlaza: localidades con página (solo provincias), temáticas «Por horario», salas de estudio, exámenes y universidades
  (mismos datos que `navPorHorario`/`navSalas`/`navExamenes`/`navUniversidades`). No se enlaza nada nuevo. 77 páginas
  y 349 partes (las que no enlazan a ninguna no lo llevan).
- `comprobar_paginas_seo.js` falla si el índice no lleva `CollectionPage` con `dateModified` y un `ItemList` de 50 o más
  provincias que existan y estén enlazadas en su HTML, o si un `hasPart` de cualquier página (también hub, salas,
  universidades y exámenes) no existe o la página no lo enlaza. Hoy: 51 provincias; 547 `hasPart` en 81 páginas, 0 mal.

## Hecho (2026-11-02) · `hasPart` en las temáticas de provincia y de España (946 páginas, sin cambio)
- `ldTema(ruta, nombre, lista, partes)`: el `CollectionPage` de `/bibliotecas/<prov>/<tema>/` lleva como `hasPart` las
  temáticas de sus localidades que ya enlaza su nav «Por localidad», y el de `/bibliotecas/<tema>/` las temáticas de
  provincia que enlazan las cabeceras de sus secciones (las provincias sin temática propia enlazan a su provincia y no
  entran). Mismo patrón que `partesLugar()`: sin enlaces nuevos. 44 temáticas, 242 partes (35 de provincia con 66; 9 de
  España con 176).
- `comprobar_paginas_seo.js` falla también si una temática enlaza sus partes (nav «Por localidad» o cabecera de sección
  hacia `/bibliotecas/<prov>/<tema>/`) sin declararlas en su `hasPart`. Hoy: 849 `hasPart` en 130 páginas, 0 mal.

## Hecho (2026-11-13) · Migas visibles = migas del JSON-LD (solo cambia el comprobador)
- `comprobar_paginas_seo.js` (línea «Migas visibles = JSON-LD…») compara en todas las páginas generadas sin `noindex` los
  `<a href>`/`<span>` de su único `<nav class="migas">` con el `BreadcrumbList` `<ruta>#migas`: mismo número, `position`
  1, 2, …, mismo texto (entidades HTML decodificadas, también `&#NN;`) y mismo destino (`href` = `item`; el `<span>`
  final, sin enlace, = la propia página). Además cada `item` debe ser `/` o una página generada con `index.html`, sin
  `noindex` y en `sitemap.xml`. Por familia; cualquier discordancia es fallo. Hoy: 1187 de 1187 bien, 4899 `item`, 0 mal
  (salen de la misma lista `migas` en `pagina()`); probado a romper texto, destino, número, `position`, `noindex` y
  sitemap del destino → salida 1 en los 6.

## Lo que tienes que hacer tú (sin esto no sirve de nada)
1. **Conectar el dominio** en Vercel: proyecto `bibliotime` → Settings → Domains → añadir `bibliomapa.es` y
   `www.bibliomapa.es` (redirigir www → sin www) y poner en tu registrador los DNS que te indique Vercel.
2. **Google Search Console** (search.google.com/search-console): añadir la propiedad de dominio `bibliomapa.es`
   (verificación por DNS) y enviar `https://bibliomapa.es/sitemap.xml`. Lo mismo en Bing Webmaster Tools. Paso a paso,
   con la alternativa de la etiqueta HTML, en «Verificar bibliomapa.es en Google Search Console» (abajo).
3. Redirigir 301 la web antigua (`bibliotime-ten.vercel.app`) a bibliomapa.es para no partir la autoridad.
4. Enlaces de calidad: web de la universidad, delegaciones de alumnos, colegios mayores, blogs de oposiciones,
   la newsletter, notas de prensa locales («una app de un estudiante de Pamplona…»). En SEO local es lo que más pesa
   después del contenido.
5. Google Play: la ficha enlazando a bibliomapa.es también ayuda.

## Verificar bibliomapa.es en Google Search Console (paso a paso)
Hace falta que el dominio ya abra la web (paso 1 de arriba). Hay dos caminos; **elige solo uno**.

### Camino A (recomendado): propiedad de dominio con un registro DNS TXT — no toca el código
Cubre `bibliomapa.es`, `www.bibliomapa.es`, `http` y `https` de una vez, y no se rompe si un día cambia la portada.
1. Entra en https://search.google.com/search-console con tu cuenta de Google → «Añadir propiedad».
2. Elige la caja de la izquierda, **«Dominio»**, escribe `bibliomapa.es` (sin `https://` ni `www`) → «Continuar».
3. Google te enseña un texto como `google-site-verification=AbCd…`. Cópialo entero (botón «Copiar»).
4. En el panel de tu registrador del dominio (donde compraste bibliomapa.es; o en Vercel → Domains si los DNS están en
   Vercel) → DNS → «Añadir registro»: **tipo** `TXT`, **nombre/host** `@` (o vacío, según el panel), **valor** el texto
   copiado, TTL el que venga por defecto. Guarda. No borres los registros que puso Vercel.
5. Vuelve a Search Console → «Verificar». Si dice que aún no lo encuentra, espera de 10 minutos a unas horas y vuelve a
   pulsar «Verificar» (los DNS tardan en propagarse). No quites nunca ese TXT: si desaparece, se pierde la verificación.
6. En `scripts/generar_paginas_seo.js` deja `const GSC_VERIFICACION = null;` (no hace falta nada en el código).

### Camino B: propiedad de prefijo de URL con la etiqueta HTML
Solo si no puedes tocar los DNS. Cubre únicamente `https://bibliomapa.es/…` (sin www ni http).
1. Search Console → «Añadir propiedad» → caja de la derecha, **«Prefijo de URL»**: `https://bibliomapa.es/` → «Continuar».
2. En «Otros métodos de verificación» elige **«Etiqueta HTML»**. Te da algo como
   `<meta name="google-site-verification" content="AbCd…123" />`. Copia **solo lo de dentro de `content="…"`**.
3. En `scripts/generar_paginas_seo.js` cambia `const GSC_VERIFICACION = null;` por
   `const GSC_VERIFICACION = "AbCd…123";` (tu código, entre comillas).
4. Ejecuta `node scripts/generar_paginas_seo.js` y luego `node scripts/comprobar_paginas_seo.js`. El generador pone la
   meta una sola vez en la **portada** (`index.html`, justo después de `<meta charset>`), que es la única página donde
   Google la busca para esta propiedad: en `/bibliotecas/` no serviría. Sin generador, es lo mismo que pegar esa línea
   tú a mano en `index.html` debajo de `<meta charset="UTF-8">`.
5. Sube el cambio (commit + despliegue en Vercel), comprueba que https://bibliomapa.es/ ya lo lleva (Ver código fuente)
   y pulsa «Verificar» en Search Console. No quites la meta después: Google la vuelve a comprobar de vez en cuando.

El comprobador (`scripts/comprobar_paginas_seo.js`) falla si la meta `google-site-verification` aparece vacía, con
«null»/«undefined» o algo que no parece un código, en más de una página (o dos veces), fuera de la portada, o si
`GSC_VERIFICACION` tiene un código y `index.html` no lo lleva (falta ejecutar el generador). Con `null` y sin meta,
pasa: es lo normal con el camino A. Con `null` el generador no toca `index.html` y no cambia ninguna página ni `lastmod`.

### Después de verificar (con cualquiera de los dos caminos)
1. Search Console → menú «Sitemaps» → en «Añadir un sitemap nuevo» escribe `sitemap.xml` (la URL completa es
   **https://bibliomapa.es/sitemap.xml**) → «Enviar». Debe salir «Correcto» con las URL del sitemap (1071 el 2026-11-12).
2. «Inspección de URL» → pega `https://bibliomapa.es/` y `https://bibliomapa.es/bibliotecas/` → «Solicitar indexación».
3. Bing Webmaster Tools (https://www.bing.com/webmasters) → «Importar desde Google Search Console»: copia la
   verificación y el sitemap en un clic.
4. A las 2-4 semanas: «Páginas» (cuántas indexadas) y «Rendimiento» (búsquedas, clics, impresiones). Son las métricas del
   Objetivo 8 (`docs/OBJETIVOS.md`).

## Bing e IndexNow (sin cuenta extra)
**Bing Webmaster Tools** no necesita verificación propia: en https://www.bing.com/webmasters entra con la cuenta de
Google (o Microsoft) → «Importar» desde Google Search Console → elige `bibliomapa.es`. Copia la propiedad y el sitemap.
Hazlo después de verificar en Search Console (arriba).

**IndexNow** avisa al momento a Bing (y a Yandex, Seznam, Naver…, que lo comparten) de las páginas que cambian, en vez
de esperar a que las rastreen. Google no lo usa (para Google basta el sitemap). Es gratis y no pide cuenta: solo una
clave que demuestre que el dominio es tuyo. Con `INDEXNOW_CLAVE = null` (lo que hay ahora) no cambia nada: el generador
no escribe ningún archivo y el script de avisos solo simula.

### Ponerlo en marcha (una vez)
1. Genera una clave: en https://www.bing.com/indexnow/getstarted pulsa «Generate API key», o en una terminal
   `node -e "console.log(require('crypto').randomUUID())"`. Debe tener de 8 a 128 caracteres, solo letras, cifras y `-`.
   No es secreta (cualquiera puede leer el .txt publicado), pero no la cambies sin motivo.
2. En `scripts/generar_paginas_seo.js` cambia `const INDEXNOW_CLAVE = null;` por `const INDEXNOW_CLAVE = "tu-clave";`.
3. Ejecuta `node scripts/generar_paginas_seo.js`: escribe `/<tu-clave>.txt` en la raíz con la clave exacta. Luego
   `node scripts/comprobar_paginas_seo.js` (falla si la clave está puesta y el .txt falta o no coincide; con `null` no
   exige nada).
4. Sube el cambio (commit con el .txt incluido + despliegue en Vercel) y comprueba que https://bibliomapa.es/<tu-clave>.txt
   abre y muestra la clave.

### Avisar (tras cada despliegue, o cuando el bucle cambie páginas)
- `node scripts/avisar_indexnow.js --simular` → enseña qué enviaría, sin red. Hazlo primero.
- `node scripts/avisar_indexnow.js` → envía a `https://api.indexnow.org/indexnow` (POST JSON con `host`, `key`,
  `keyLocation` y `urlList`) las URL del `sitemap.xml` cuyo `lastmod` es de **hoy** (día de España). El generador solo
  pone la fecha de hoy cuando una página cambia de verdad, así que no se avisa de lo que no ha cambiado (avisar de más
  hace que IndexNow ignore los avisos). Máximo 10000 URL por aviso.
- `node scripts/avisar_indexnow.js --fecha 2026-11-12` → las de un día pasado (si se te olvidó avisar ese día).
- Antes de enviar, el script abre `https://bibliomapa.es/<clave>.txt` y **aborta sin enviar nada** (salida 1,
  «despliega primero») si no responde 200 con exactamente la clave (se tolera un salto de línea final), o si no se
  puede abrir. Así un aviso hecho antes de que el despliegue termine no se gasta en un 403. Si pasa, verás
  «Clave publicada: … → 200 con la clave exacta.» y después la respuesta de IndexNow.
- `node scripts/avisar_indexnow.js --base http://localhost:8000` → para probar esa comprobación sin red real: la hace
  contra un servidor local (p. ej. `python3 -m http.server 8000` en una carpeta con el .txt) y, con una base distinta
  de `https://bibliomapa.es`, **nunca** envía nada a IndexNow (solo dice cuántas URL estaban listas). Con `--simular`
  no se comprueba nada (ni red).
  `node scripts/comprobar_paginas_seo.js` lo prueba solo en cada pasada (línea «IndexNow «despliega primero»…»): copia temporal con clave ficticia y servidores en 127.0.0.1, exige 0 con el .txt bien servido y 1 con 404 u otro texto; nunca toca la red real.
- Respuesta 200 o 202 = recibido. 403 = el .txt aún no está publicado (espera al despliegue). 422 = clave o URL que no
  coinciden. 429 = demasiados avisos: espera. Con `INDEXNOW_CLAVE = null` el script siempre simula.
- Solo tiene sentido **después** de desplegar: si avisas antes, Bing rastrea la versión vieja.
- Métrica: en Bing Webmaster Tools → «IndexNow» se ven las URL recibidas; en «Rendimiento de búsqueda», clics e
  impresiones de Bing.

### En el informe del bucle (para que Marcos sepa cuándo le toca avisar)
La tarea automática nunca envía avisos a IndexNow. Cada vez que una sesión del bucle regenere las páginas
(`node scripts/generar_paginas_seo.js`), al terminar ejecuta `node scripts/avisar_indexnow.js --simular` (sin red) y
anota en el informe de la sesión una línea con el número de URL que imprime:
- con `INDEXNOW_CLAVE = null`: «IndexNow: N URL con lastmod de hoy (no enviado: clave null)»;
- con la clave puesta: «IndexNow: N URL con lastmod de hoy (pendiente de que Marcos lo envíe tras desplegar)».

Si N es 0, no hay nada que avisar. Así Marcos sabe si le toca ejecutar `node scripts/avisar_indexnow.js` tras el
despliegue sin tener que mirar el `sitemap.xml`.

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

## Hecho (2026-11-13) · GEO (asistentes de IA) y guías por problema (1080 páginas, antes 1071)
- **Guías `/estudiar/`** (`scripts/guias_seo.js`, las escribe `generar_paginas_seo.js`): hub + 8 páginas, una por problema que
  resuelve la app y no por lugar: dónde estudiar hoy, temporizador Pomodoro, concentrarse sin el móvil (alternativa gratis a
  Forest), estudiar con amigos, organizar exámenes, época de exámenes, ¿estará llena la biblioteca? y oposiciones/MIR.
- Formato pensado para que buscadores y asistentes de IA citen la página: **la primera frase responde** a la pregunta (en
  negrita), luego secciones cortas, pasos (`HowTo`), preguntas frecuentes abiertas (`FAQPage`), `WebPage` con `abstract`,
  `dateModified`, `about` → `WebApplication` (gratis, `Offer` 0 €) y `publisher` → `Organization`. Solo funciones que la app
  tiene; las cifras ({N} bibliotecas, {V} verificadas, {P} provincias) salen de los datos al regenerar.
- **`/llms.txt`** (estándar llmstxt.org): resumen para IA con las cifras reales, la procedencia de los datos y enlaces a los hubs
  y a las guías. Se regenera con el resto.
- **`robots.txt`** nombra y permite los rastreadores de buscadores y de IA (OAI-SearchBot, ChatGPT-User, GPTBot, ClaudeBot,
  Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended, Bingbot…).
- Enlace «Guías» en la cabecera de todas las páginas generadas (cambia la huella y el lastmod de todas una vez).

### Lo que falta y solo puede hacer Marcos (sin esto, nada de lo anterior posiciona)
1. Publicar en **bibliomapa.es** (Vercel) y que la portada y `/bibliotecas/` respondan 200.
2. **Google Search Console** y **Bing Webmaster Tools** (Bing alimenta a ChatGPT y Copilot): verificar el dominio y enviar
   `https://bibliomapa.es/sitemap.xml`. En Search Console, «Inspeccionar URL» → «Solicitar indexación» de la portada,
   `/bibliotecas/` y `/estudiar/`.
3. **Perfil de Google Business**: no aplica (no hay local físico); sí crear perfiles de marca con el mismo nombre y enlace
   (Instagram, TikTok, X, LinkedIn) para que buscadores e IA reconozcan «Bibliomapa» como entidad, y añadirlos a `sameAs`.
4. **Enlaces desde fuera** (lo que más pesa): delegaciones de estudiantes, consejos de estudiantes, academias de MIR y
   oposiciones, blogs universitarios, foros (Reddit r/spain, r/oposiciones, Forocoches) y prensa local en época de exámenes.

