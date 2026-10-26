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
- Página por biblioteca para las más buscadas (Biblioteca Nacional, Regional de Madrid, grandes universitarias).
- Páginas «temporada de exámenes / salas 24 h» por ciudad cuando haya fuentes oficiales.
- Medir en Search Console qué búsquedas traen visitas y reforzar esas páginas.
