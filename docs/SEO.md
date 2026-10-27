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
- Pamplona no sale: el generador no lee aún los horarios de Navarra de `app.js` (`h: null`), así que no tiene ninguna verificada.

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

## Siguientes mejoras (en el backlog)
- Más horarios verificados (las páginas con horario rinden mucho mejor: es lo que la gente busca).
- Ampliar las páginas por biblioteca a grandes ciudades que no son capital (Gijón, Vigo, Cartagena, Jerez…).
- Páginas «temporada de exámenes / salas 24 h» por ciudad cuando haya fuentes oficiales.
- Medir en Search Console qué búsquedas traen visitas y reforzar esas páginas.
