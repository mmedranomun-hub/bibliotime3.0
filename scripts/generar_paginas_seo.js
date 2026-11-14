#!/usr/bin/env node
/* Genera las páginas estáticas para buscadores de bibliomapa.es:
     bibliotecas/index.html                      → todas las provincias
     bibliotecas/<provincia>/index.html          → bibliotecas de la provincia, por localidad
     bibliotecas/<provincia>/<localidad>/index.html (localidades con 3 o más bibliotecas)
     bibliotecas/abiertas-hoy|abiertas-domingo|abiertas-fin-de-semana|abiertas-sabado-tarde|abiertas-domingo-tarde|abiertas-hasta-tarde|abiertas-mediodia|abiertas-temprano/index.html (España, por provincia;
       «hoy» calcula en el navegador el horario de hoy y si está abierta ahora)
       y abiertas-verano (solo con horario de verano verificado: h.ver + h.vd/h.vh)
     bibliotecas/<provincia>/<tema>/index.html   (mismos temas, solo con 2 o más bibliotecas que cumplen)
     bibliotecas/<provincia>/<localidad>/<tema>/index.html (domingo, fin de semana y hasta tarde; localidades con
       página propia y 2 o más que cumplen; temas con «min»: con ese mínimo y lista distinta de la de su provincia)
     bibliotecas/<provincia>/<biblioteca>/index.html (las más buscadas: Nacional, Regional de Madrid, grandes y
       universitarias de capitales y todas las de capitales con horario verificado)
     bibliotecas/salas-de-estudio/ y bibliotecas/<prov>/[<capital>/]salas-de-estudio/ (capitales con 5 o más universitarias,
       públicas o grandes y alguna con horario verificado: ranking por horas a la semana, exámenes, acceso y FAQ)
     bibliotecas/universidades/ y bibliotecas/universidades/<universidad>/ (3 o más bibliotecas asignadas por dominio web
       o nombre inequívoco y alguna con horario verificado: horarios con fuente, exámenes, por ciudad/campus y FAQ)
     bibliotecas/examenes/ y bibliotecas/examenes/<ciudad>/ (solo ciudades con entradas vigentes de temporada-examenes.js con
       fuente y fecha: periodo, horario, nota, fuente oficial y FAQ; enlazadas desde provincias, localidades, salas y el hub)
     bibliotecas/horarios/ (hub: todas las temáticas, salas y universidades por provincia; todas enlazan a él)
     404.html (noindex, fuera del sitemap: provincias, hub de horarios y «abiertas hoy»)
     sitemap.xml y robots.txt
   Uso (desde la raíz del proyecto):  node scripts/generar_paginas_seo.js  y después  node scripts/comprobar_paginas_seo.js
   Vuelve a ejecutarlo cada vez que cambien los datos (app.js, bibliotecas-espana.js o temporada-examenes.js).

   Reglas: solo se publican datos que ya están en la app. Los horarios solo si están verificados (campo h,
   con su fuente y fecha; en Navarra, fuenteHorario + verificadoHorario en app.js); el resto dice «horario sin confirmar». No se inventa nada para posicionar.
   El índice de cada biblioteca es el mismo que en la app (#bib=<índice>-<nombre> abre su ficha en el mapa). */
"use strict";
const fs = require("fs");
const path = require("path");
const RAIZ = path.resolve(__dirname, "..");
const DOMINIO = "https://bibliomapa.es";
const HOY = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" }); // día de España, no UTC (las h.fv son de España)

// ---------- Datos ----------
// Navarra: se lee app.js como TEXTO y se evalúa solo el bloque de datos (desde `function h(hh,mm)` hasta el cierre del
// array BIBLIOTECAS: las funciones h()/semana(), las constantes de horario y el literal) en un contexto `vm` vacío, sin
// window ni document y con tiempo máximo. No se ejecuta la app.
const vm = require("vm");
const appJs = fs.readFileSync(path.join(RAIZ, "app.js"), "utf8");
const iDatos = appJs.indexOf("function h(hh,mm)");
const inicio = appJs.indexOf("const BIBLIOTECAS=[");
const fin = appJs.indexOf("\n];", inicio);
if (iDatos < 0 || inicio < iDatos || fin < 0) { console.error("No encuentro el bloque de datos de Navarra en app.js."); process.exit(1); }
const bloqueNavarra = appJs.slice(inicio, fin);
const BIB_APP = vm.runInNewContext(appJs.slice(iDatos, fin + 3) + "\nBIBLIOTECAS;", Object.create(null), { timeout: 2000 });
// Horario interno de la app (semana(): [D,L,M,X,J,V,S] con minutos) → formato de bibliotecas-espana.js ({"L":[["09:00","21:00"]],…}).
const hhmm = (min) => String(Math.floor(min / 60) % 24).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
const ORDEN_APP = ["D", "L", "M", "X", "J", "V", "S"];
function horarioDeApp(s) {
  if (!Array.isArray(s) || s.length !== 7) return null;
  const o = {};
  ORDEN_APP.forEach((d, k) => { o[d] = (s[k] || []).map((r) => [hhmm(r[0]), hhmm(r[1])]); });
  return o;
}
// Un horario de Navarra solo se publica si en app.js trae fuente (`fuenteHorario`, url https) y fecha de comprobación
// (`verificadoHorario`, AAAA-MM-DD): los mismos campos que la ficha de la app enseña como «Horario verificado el … · fuente».
// Sin ellos queda h: null («Horario sin confirmar»): nunca se da por verificado un horario sin fuente ni fecha.
// Verano: `horasVerano` con `veranoDesde`/`veranoHasta` («MM-DD») si los trae; si no, el periodo que usa la app para la
// red de Navarra (esVerano(): del 15 de junio al 14 de septiembre).
function horarioNavarra(b) {
  if (!/^https:\/\//.test(b.fuenteHorario || "") || !/^\d{4}-\d{2}-\d{2}$/.test(b.verificadoHorario || "")) return null;
  const inv = horarioDeApp(b.horasInvierno || b.horas);
  if (!inv) return null;
  const h = { inv, f: b.fuenteHorario, fv: b.verificadoHorario };
  const ver = b.horasInvierno && b.horasVerano ? horarioDeApp(b.horasVerano) : null;
  if (ver) { h.ver = ver; h.vd = b.veranoDesde || "06-15"; h.vh = b.veranoHasta || "09-14"; }
  if (b.notaHorario) h.nota = b.notaHorario;
  return h;
}
const navarra = BIB_APP.map((b) => ({ n: b.nombre, lat: b.lat, lon: b.lon, dir: b.dir || "", tel: b.tel || "", web: b.web || "",
  p: "Navarra", t: /Universidad|UPNA|UNED/.test(b.nombre) ? "universidad" : "publica", h: horarioNavarra(b) }));
const ventana = {};
new Function("window", fs.readFileSync(path.join(RAIZ, "bibliotecas-espana.js"), "utf8"))(ventana);
const espana = ventana.BIBLIOTECAS_ES;
const nNavarraApp = (bloqueNavarra.match(/\n  \{nombre:"/g) || []).length;
if (navarra.length !== nNavarraApp) {
  console.error(`No cuadran las bibliotecas de Navarra (${navarra.length} leídas, ${nNavarraApp} en app.js).`);
  process.exit(1);
}
const nNavarraConHorario = navarra.filter((b) => b.h).length;

// Localidad de las de Navarra: «31839 Arbizu» en la dirección; 310xx/311xx sin nombre → Pamplona; si no, del nombre.
function localidadNavarra(b) {
  const mm = b.dir.match(/\b(31\d{3})\s+([^,()]+?)\s*$/) || b.dir.match(/\b(31\d{3})\s+([^,()]+)/);
  if (mm) return mm[2].trim();
  if (/\b310\d{2}\b/.test(b.dir)) return "Pamplona";
  const mn = b.n.match(/Biblioteca Pública de (.+)$/);
  if (mn && !/^(la |San |Iturrama|Mendillorri|Etxabakoitz|Txantrea|Milagrosa)/.test(mn[1])) return mn[1];
  return "Pamplona";
}
const todas = [];
navarra.forEach((b, i) => todas.push({ ...b, i, c: localidadNavarra(b) }));
espana.forEach((b, k) => todas.push({ ...b, i: navarra.length + k }));

// Provincia que falta: la de la biblioteca con provincia más cercana.
const conP = todas.filter((b) => b.p);
todas.forEach((b) => {
  if (b.p) return;
  let mejor = null, d = 1e9;
  conP.forEach((o) => { const dd = (o.lat - b.lat) ** 2 + (o.lon - b.lon) ** 2; if (dd < d) { d = dd; mejor = o; } });
  b.p = mejor ? mejor.p : "España";
});
todas.forEach((b) => {
  if (!b.c) { const mm = (b.dir || "").match(/\b\d{5}\s+([^,]+)$/); b.c = mm ? mm[1].trim() : (b.dir && b.dir.length < 30 && !/\d/.test(b.dir) ? b.dir : b.p); }
  b.c = b.c.replace(/\s+/g, " ").trim();
  // Web sin protocolo en los datos («www.villanuevadelaserena.es»): sin él, el navegador lo lee como ruta relativa
  // (/bibliotecas/badajoz/www…, enlace roto). Se añade http:// (no se afirma https: el navegador lo sube si existe).
  if (b.web && !/^https?:\/\//i.test(b.web)) b.web = /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(b.web) ? "http://" + b.web : "";
});

// ---------- Utilidades ----------
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const DIAS = ["L", "M", "X", "J", "V", "S", "D"];
const DIAS_SCHEMA = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const quitaCero = (t) => t.replace(/^0(\d)/, "$1");
function franjas(lista) { return (lista || []).map((r) => quitaCero(r[0]) + "–" + quitaCero(r[1])).join(", "); }
// «L–V 9:00–21:00 · S 9:00–14:00 · D cerrado»
function horarioTexto(inv, vacio) { // vacio(d): texto de un día sin franjas (por defecto «cerrado»)
  const grupos = [];
  DIAS.forEach((d) => {
    const f = franjas(inv[d]) || (vacio ? vacio(d) : "cerrado");
    const ult = grupos[grupos.length - 1];
    if (ult && ult.f === f) ult.hasta = d; else grupos.push({ desde: d, hasta: d, f });
  });
  return grupos.map((g) => (g.desde === g.hasta ? g.desde : g.desde + "–" + g.hasta) + " " + g.f).join(" · ");
}
function abreFinde(b) { return b.h && b.h.inv && ((b.h.inv.S || []).length || (b.h.inv.D || []).length); }
function cierraTarde(b) { return b.h && b.h.inv && DIAS.slice(0, 5).some((d) => (b.h.inv[d] || []).some((r) => r[1] >= "21:00" || r[1] === "00:00")); }
// Las páginas temáticas solo usan horarios verificados CON fuente (h.f) y fecha (h.fv).
const verificado = (b) => !!(b.h && b.h.inv && b.h.f && b.h.fv);
const abreDomingo = (b) => verificado(b) && (b.h.inv.D || []).length > 0;
const abreSabadoTarde = (b) => verificado(b) && (b.h.inv.S || []).some((r) => r[1] >= "17:00" || r[1] === "00:00");
const abreDomingoTarde = (b) => verificado(b) && (b.h.inv.D || []).some((r) => r[1] >= "17:00" || r[1] === "00:00");
// Mediodía: los 5 días de lunes a viernes (horario de invierno verificado) con una franja que cubre de 14:00 a 16:00 sin
// cortar. Un día sin franjas (cerrado o «sin confirmar») la deja fuera: solo se afirma lo que dice la fuente.
const MEDIODIA = ["14:00", "16:00"];
const cubreMediodia = (r) => r[0] <= MEDIODIA[0] && (r[1] >= MEDIODIA[1] || r[1] === "00:00");
const abreMediodia = (b) => verificado(b) && DIAS.slice(0, 5).every((d) => (b.h.inv[d] || []).some(cubreMediodia));
// «L–J 8:30–21:00 · V 8:30–20:00» (solo lunes a viernes, días iguales agrupados).
function entreSemanaTexto(inv) {
  const g = [];
  DIAS.slice(0, 5).forEach((d) => { const f = franjas(inv[d]) || "cerrado", u = g[g.length - 1]; if (u && u.f === f) u.hasta = d; else g.push({ desde: d, hasta: d, f }); });
  return g.length === 1 ? g[0].f : g.map((x) => (x.desde === x.hasta ? x.desde : x.desde + "–" + x.hasta) + " " + x.f).join(" · ");
}
// Hora de apertura más temprana entre semana.
const aperturaMasTemprana = (b) => DIAS.slice(0, 5).flatMap((d) => (b.h.inv[d] || []).map((r) => r[0])).sort()[0] || "";
// Temprano: algún día de lunes a viernes con una franja que empieza a las 8:00 o antes (horario de invierno verificado).
const TEMPRANO = "08:00";
const empiezaTemprano = (r) => r[0] <= TEMPRANO;
const abreTemprano = (b) => verificado(b) && DIAS.slice(0, 5).some((d) => (b.h.inv[d] || []).some(empiezaTemprano));
const abre24h = (b) => aperturaMasTemprana(b) === "00:00";
// «de lunes a viernes», «L–J, V»… (los días en que abre a su hora más temprana).
function diasTemprano(b) {
  const h = aperturaMasTemprana(b), ds = DIAS.slice(0, 5).filter((d) => (b.h.inv[d] || []).some((r) => r[0] === h));
  if (ds.length === 5) return "de lunes a viernes";
  const g = []; ds.forEach((d) => { const u = g[g.length - 1]; if (u && DIAS.indexOf(d) === DIAS.indexOf(u.hasta) + 1) u.hasta = d; else g.push({ desde: d, hasta: d }); });
  return g.map((x) => (x.desde === x.hasta ? x.desde : x.desde + "–" + x.hasta)).join(", ");
}
// Verano: horario h.ver con sus fechas h.vd/h.vh («MM-DD», como en bibliotecas-espana.js) y algún día abierto.
const MMDD = /^\d{2}-\d{2}$/;
const abreVerano = (b) => verificado(b) && !!b.h.ver && MMDD.test(b.h.vd || "") && MMDD.test(b.h.vh || "") &&
  DIAS.some((d) => (b.h.ver[d] || []).length > 0);
const fechaDM = (mmdd) => mmdd.split("-").reverse().join("/");
// Hora de cierre más tardía entre semana («00:00» cuenta como medianoche).
function cierreMasTarde(b) {
  let max = "";
  DIAS.slice(0, 5).forEach((d) => (b.h.inv[d] || []).forEach((r) => { const c = r[1] === "00:00" ? "24:00" : r[1]; if (c > max) max = c; }));
  return max;
}
const fechaEs = (iso) => iso.split("-").reverse().join("/");
const TIPO = { mayor: "Gran biblioteca", universidad: "Universitaria", publica: "Pública", otra: "Biblioteca" };
const enlaceApp = (b) => `/#bib=${b.i}-${slug(b.n).slice(0, 40)}`;

function libraryLD(b, url) {
  const o = { "@type": "Library", name: b.n, url: url, geo: { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lon },
    address: { "@type": "PostalAddress", streetAddress: b.dir || undefined, addressLocality: b.c, addressRegion: b.p, addressCountry: "ES" } };
  if (b.tel) o.telephone = b.tel;
  if (b.web) o.sameAs = b.web;
  if (verificado(b)) { // solo horarios con fuente y fecha
    o.openingHoursSpecification = [];
    DIAS.forEach((d, k) => (b.h.inv[d] || []).forEach((r) => o.openingHoursSpecification.push({ "@type": "OpeningHoursSpecification", dayOfWeek: DIAS_SCHEMA[k], opens: r[0], closes: r[1] })));
  }
  return o;
}
// Biblioteca dentro de un ItemList (temáticas, localidades, salas de estudio, universidades, exámenes): si tiene ficha,
// `url` a la ficha (no a /#bib=…, un fragmento que Google lee como la portada) y el mismo `@id` que la ficha
// (<ficha>#biblioteca), para que lista y ficha describan la misma entidad. Sin ficha, sigue el enlace a la app.
function itemBib(b) {
  const f = paginaDe.get(b.i);
  return f ? { "@id": DOMINIO + f + "#biblioteca", ...libraryLD(b, DOMINIO + f) } : libraryLD(b, DOMINIO + enlaceApp(b));
}

// Referencia (isPartOf/hasPart, y el item de las provincias en el ItemList del índice) a otra página del sitio: además de name y url, el @id de su nodo (<url>#pagina, el
// CollectionPage de provincias, localidades, temáticas, hubs, salas, universidades y exámenes), para que Google una la
// referencia con el nodo de la página destino en vez de crear un CollectionPage anónimo nuevo. scripts/comprobar_paginas_seo.js
// falla si ese @id no existe como nodo en la página destino.
let nRefId = 0;
function refPagina(name, url) { nRefId++; return { "@type": "CollectionPage", "@id": url + "#pagina", name, url }; }

// ---------- Plantilla ----------
// noindex (la 404): sin canonical ni og:url (se sirve en cualquier URL inexistente), con <meta name="robots" content="noindex">
// y sin BreadcrumbList; todos los enlaces son absolutos (/…) para que funcionen desde cualquier ruta.
// trasH1: HTML opcional entre el <h1> y la intro (la 404 pone ahí su «¿Buscabas…?»).
// migasId: @id opcional del BreadcrumbList (<ruta>#migas: fichas, índice, provincias, localidades, temáticas de España,
// de provincia y de localidad, los hubs de horarios, universidades, exámenes y salas de estudio, universidades, ciudades
// de exámenes y salas de estudio de provincia y localidad), para enlazarlo desde su WebPage o CollectionPage con breadcrumb (ver idMigasDe/conMigas).
// Vista previa al compartir (WhatsApp, Telegram, X…): imagen fija ya publicada en el repo, en URL absoluta. Es la
// apaisada 1200×630 de scripts/generar_imagen_og.py (logo + lema + dominio), por eso twitter:card es
// «summary_large_image» (imagen grande) y no «summary» (miniatura). La portada (index.html) lleva las mismas etiquetas.
// Si se cambia la imagen, actualizar ancho y alto con sus dimensiones reales (el comprobador lo exige).
const OG_IMAGEN = { url: "https://bibliomapa.es/icons/og-bibliomapa.png", ancho: 1200, alto: 630, alt: "Bibliomapa: bibliotecas abiertas ahora en toda España · bibliomapa.es" };
// Por provincia: si existe icons/og/<slug>.png (scripts/generar_imagen_og.py --provincia <slug>, misma plantilla 1200×630
// con «Bibliotecas abiertas ahora en <Provincia>», sin cifras), las páginas de esa provincia (/bibliotecas/<slug>/ y todo lo
// que cuelga: localidades, temáticas, salas y fichas) la usan; el resto de páginas, la general. Solo las provincias con más
// fichas tienen imagen propia (ver `--listar-provincias` y el docstring del script de Python): vigilar el peso del repo.
const ogProvCache = new Map();
function ogImagenDe(ruta) {
  const m = /^\/bibliotecas\/([a-z0-9-]+)\//.exec(ruta || "");
  if (!m || typeof nombreProvDeSlug === "undefined" || !nombreProvDeSlug.has(m[1])) return OG_IMAGEN;
  const ps = m[1];
  if (!ogProvCache.has(ps)) {
    const rel = "icons/og/" + ps + ".png";
    ogProvCache.set(ps, fs.existsSync(path.join(RAIZ, rel))
      ? { url: DOMINIO + "/" + rel, ancho: 1200, alto: 630, alt: `Bibliomapa: bibliotecas abiertas ahora en ${nombreProvDeSlug.get(ps)} · bibliomapa.es` }
      : OG_IMAGEN);
  }
  return ogProvCache.get(ps);
}
// Versión de seo.css: 8 hex del sha1 de su contenido, en la URL (/seo.css?v=…). sw.js sirve lo propio cache-first por URL
// exacta, así que sin ella quien tuviera el seo.css anterior en caché vería una vez el HTML nuevo con estilos viejos; con
// ella, HTML nuevo → URL nueva → CSS nuevo de la red. La huella del lastmod ignora el ?v= (ver `huella`): cambiar el CSS
// no mueve ninguna fecha del sitemap. scripts/comprobar_paginas_seo.js exige que el ?v= coincida con el seo.css actual.
const SEO_CSS_V = require("crypto").createHash("sha1").update(fs.readFileSync(path.join(RAIZ, "seo.css"))).digest("hex").slice(0, 8);
const h1De = new Map(); // ruta → h1 (texto plano): de aquí salen los textos de «¿Buscabas…?» en la 404
// FAQPage en el mismo grafo que su página (provincias, localidades, temáticas, hubs, salas, universidades, exámenes):
// si la página lleva un FAQPage sin @id y un CollectionPage de su misma URL, el CollectionPage recibe @id <ruta>#pagina
// (el mismo patrón que el WebPage de las fichas) y el FAQPage @id <ruta>#faq e isPartOf {"@id": "<ruta>#pagina"}.
// Preguntas y respuestas no cambian. Las fichas ya lo traen hecho (su FAQPage lleva @id) y no se tocan.
let nFaqEnGrafo = 0;
function faqEnGrafo(ruta, ld) {
  if (!ld) return ld;
  const lista = [].concat(ld), url = DOMINIO + ruta;
  const faqs = lista.filter((x) => x && x["@type"] === "FAQPage" && !x["@id"]);
  const cp = lista.find((x) => x && x["@type"] === "CollectionPage" && x.url === url);
  if (!faqs.length || !cp) return ld;
  const idPag = cp["@id"] || url + "#pagina";
  nFaqEnGrafo++;
  const nueva = lista.map((x) => (x === cp && !cp["@id"] ? { "@context": cp["@context"], "@id": idPag, ...cp }
    : faqs.includes(x) ? { "@context": x["@context"], "@id": url + "#faq", ...x, isPartOf: { "@id": idPag } } : x));
  return Array.isArray(ld) ? nueva : nueva[0];
}
function pagina({ ruta, titulo, descripcion, h1, intro, cuerpo, migas, migasId, ld: ld0, cta, head, noindex, trasH1 }) {
  const url = DOMINIO + ruta;
  const OG = ogImagenDe(ruta);
  const ld = faqEnGrafo(ruta, ld0);
  h1De.set(ruta, h1);
  const migasLD = { "@context": "https://schema.org", ...(migasId ? { "@id": migasId } : {}), "@type": "BreadcrumbList", itemListElement: migas.map((x, k) => ({ "@type": "ListItem", position: k + 1, name: x[0], item: DOMINIO + x[1] })) };
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
${noindex ? `<meta name="robots" content="noindex">` : `<link rel="canonical" href="${url}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Bibliomapa">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
${noindex ? "" : `<meta property="og:url" content="${url}">
`}<meta property="og:locale" content="es_ES">
<meta property="og:image" content="${OG.url}">
<meta property="og:image:width" content="${OG.ancho}">
<meta property="og:image:height" content="${OG.alto}">
<meta property="og:image:alt" content="${esc(OG.alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${OG.url}">
<meta name="theme-color" content="#6c5ce7">
<link rel="icon" href="/icons/favicon-32.png" type="image/png">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="stylesheet" href="/seo.css?v=${SEO_CSS_V}">
<script src="/analitica.js" defer></script>
${noindex ? "" : `<script type="application/ld+json">${JSON.stringify(migasLD)}</script>`}
${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ""}
${head || ""}</head>
<body>
<header class="top"><a class="marca" href="/"><span>📚</span> Bibliomapa</a><nav class="nav-top"><a href="/estudiar/">Guías</a><a class="cta-top" href="/">Abrir el mapa</a></nav></header>
<main>
<nav class="migas" aria-label="Estás en"><ol>${migas.map((x, k) => `<li>${k < migas.length - 1 ? `<a href="${x[1]}">${esc(x[0])}</a>` : `<span aria-current="page">${esc(x[0])}</span>`}</li>`).join("")}</ol></nav>
<h1>${h1}</h1>
${trasH1 || ""}<p class="intro">${intro}</p>
${cta || `<a class="cta" href="/">📍 ¿Cuál está abierta ahora cerca de ti? Abrir el mapa</a>`}
${cuerpo}
<section class="app-pitch">
  <h2>Estudia con Bibliomapa</h2>
  <ul>
    <li>🗺️ Mapa de más de 2.600 bibliotecas de toda España, con las abiertas ahora.</li>
    <li>🌳 Cada sesión de estudio planta un árbol en tu bosque: si sales de la app, se marchita.</li>
    <li>📅 Agenda de exámenes compartida con tus amigos, y rezos por sus exámenes.</li>
    <li>⏱️ Cronómetro, Pomodoro, metas diarias y niveles.</li>
  </ul>
  <a class="cta" href="/">Empezar gratis, sin cuenta</a>
</section>
</main>
<footer>Datos de bibliotecas: © Overture Maps Foundation · © colaboradores de OpenStreetMap, y webs oficiales de cada biblioteca (horarios verificados con fecha y fuente).
Si ves un dato mal, avísanos desde la app. · <a href="/privacidad.html">Privacidad</a> · <a href="/condiciones.html">Condiciones</a></footer>
</body>
</html>
`;
}

function tarjeta(b, destacado, t) {
  const hoy = t && t.hoy && verificado(b);
  const horario = b.h && b.h.inv
    ? `<div class="hor ok">🕒 ${esc(horarioTexto(b.h.inv))}${b.h.fv ? ` <small>(verificado el ${esc(b.h.fv.split("-").reverse().join("/"))}${b.h.f ? `, <a href="${esc(b.h.f)}" rel="nofollow noopener" target="_blank">fuente</a>` : ""})</small>` : ""}</div>${b.h.nota ? `<div class="nota">${esc(b.h.nota)}</div>` : ""}`
    : `<div class="hor">🕒 Horario sin confirmar: consúltalo en su web o en la app</div>`;
  const propia = paginaDe.get(b.i);
  return `<article class="bib"${hoy ? ` data-h="${datosHoy(b)}"` : ""}>
  <h3>${propia ? `<a href="${propia}">${esc(b.n)}</a>` : esc(b.n)}</h3>
  <div class="meta"><span class="tipo">${TIPO[b.t] || "Biblioteca"}</span>${b.dir ? ` · ${esc(b.dir)}` : ""}</div>
  ${destacado ? `<p class="dest">${esc(destacado)}</p>` : ""}${hoy ? `<p class="dest hoy" hidden></p>` : ""}${horario}
  <div class="acc"><a href="${enlaceApp(b)}">Ver en el mapa</a>${b.tel ? ` · <a href="tel:${esc(b.tel.replace(/\s/g, ""))}">${esc(b.tel)}</a>` : ""}${b.web ? ` · <a href="${esc(b.web)}" rel="nofollow noopener" target="_blank">Web oficial</a>` : ""}</div>
</article>`;
}

// FAQ de provincia y localidad (las páginas de «bibliotecas abiertas en <lugar>»). Cada respuesta sale de los datos y
// solo de horarios verificados con fuente y fecha (h.f + h.fv): qué bibliotecas abren el domingo y el sábado (con sus
// horas), cuál cierra más tarde (con la hora y empates), cuál abre más horas y de dónde salen los horarios. Si en el lugar
// no hay ningún horario verificado no se pregunta por horarios (nada de respuestas vacías): recuento por tipo y contacto.
function faq(lugar, lista) {
  const v = lista.filter(verificado).sort((a, b) => horasSemana(b) - horasSemana(a) || a.n.localeCompare(b.n, "es"));
  const varias = (l, f) => l.slice(0, 6).map((b) => `${b.n}${f ? ` (${f(b)})` : ""}`).join(", ") + (l.length > 6 ? ` y ${l.length - 6} más` : "");
  const tipos = enumera([["universidad", "universitaria", "universitarias"], ["publica", "pública", "públicas"], ["mayor", "gran biblioteca", "grandes bibliotecas"], ["otra", "de otro tipo", "de otro tipo"]]
    .map(([t, uno, varios]) => { const n = lista.filter((b) => (b.t || "otra") === t).length; return n ? plural(n, uno, varios) : ""; }).filter(Boolean));
  const q = [[`¿Cuántas bibliotecas hay en ${lugar}?`, `Bibliomapa tiene ${plural(lista.length, "biblioteca", "bibliotecas")} en ${lugar}${tipos ? ` (${tipos})` : ""}` +
    (v.length ? `, ${v.length} con el horario comprobado en su web oficial.` : `. Ninguna tiene todavía el horario comprobado en una fuente oficial con fecha.`)]];
  if (v.length) {
    const dia = (d, nombre) => {
      const abren = v.filter((b) => (b.h.inv[d] || []).length), dudas = v.filter((b) => sinConfirmar(b, d));
      const extra = dudas.length ? ` De ${dudas.length === 1 ? "otra" : `otras ${dudas.length}`} la fuente no da horario de ${nombre}.` : "";
      if (!abren.length && dudas.length === v.length) return null;
      return [`¿Qué bibliotecas abren el ${nombre} en ${lugar}?`, abren.length
        ? `Según su horario de invierno verificado, ${abren.length === 1 ? "abre" : "abren"} el ${nombre}: ${varias(abren, (b) => franjas(b.h.inv[d]))}.${extra} Comprueba festivos en su web.`
        : (v.length - dudas.length === 1 ? `${cap(v.find((b) => !sinConfirmar(b, d)).n)}, la única de ${lugar} con horario verificado${dudas.length ? " ese día" : ""}, no abre el ${nombre}, según su horario de invierno.${extra}`
          : `Ninguna de las ${v.length - dudas.length} bibliotecas de ${lugar} con horario verificado abre el ${nombre}, según su horario de invierno.${extra}`)];
    };
    q.push(...[dia("D", "domingo"), dia("S", "sábado")].filter(Boolean));
    const cierre = (b) => cierreMasTarde(b), max = v.map(cierre).filter(Boolean).sort().pop();
    if (max) {
      const ult = v.filter((b) => cierre(b) === max), hora = quitaCero(max).replace("24:00", "00:00 (medianoche)");
      q.push([`¿Qué biblioteca cierra más tarde en ${lugar}?`, (ult.length > 6 ? `Entre semana, ${ult.length} de las ${v.length} con horario verificado cierran a las ${hora}, la hora más tardía; entre ellas, ${varias(ult)}.`
          : `Entre semana, ${ult.length === 1 ? `la que cierra más tarde es ${ult[0].n}` : `las que cierran más tarde son ${varias(ult)}`}, a las ${hora}, según su horario de invierno verificado.`) +
        (v.filter(cierraTarde).length > ult.length ? ` Cierran a las 21:00 o más tarde algún día entre semana: ${varias(v.filter(cierraTarde))}.` : "")]);
    }
    if (v.length >= 2) q.push([`¿Qué biblioteca abre más horas a la semana en ${lugar}?`, `${v[0].n}, con ${horasTexto(horasSemana(v[0]))} a la semana (${horarioTexto(v[0].h.inv)}), ${horasSemana(v[1]) === horasSemana(v[0]) ? "empatada con" : "seguida de"} ${v[1].n} (${horasTexto(horasSemana(v[1]))}). Cuenta el horario de invierno verificado; los días sin confirmar no suman.`]);
    q.push([`¿De dónde salen estos horarios?`, `Del horario publicado en la web oficial de cada biblioteca, comprobado ${textoFechas(v)}; en cada ficha está el enlace a la fuente. Verano, festivos y época de exámenes pueden cambiarlo. Del resto (${lista.length - v.length}) aún no tenemos horario confirmado.`]);
  } else {
    const tel = lista.filter((b) => b.tel).length, web = lista.filter((b) => b.web).length;
    if (tel || web) q.push([`¿Cómo sé si una biblioteca de ${lugar} está abierta?`, `Mientras no tengamos su horario verificado, consulta su web o llama antes de ir: en esta página tienes ${[web ? `la web oficial de ${web}` : "", tel ? `el teléfono de ${tel}` : ""].filter(Boolean).join(" y ")} de las ${lista.length}.`]);
  }
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: q.map(([p, r]) => ({ "@type": "Question", name: p, acceptedAnswer: { "@type": "Answer", text: r } })) };
  return { html: `<section class="faq"><h2>Preguntas frecuentes</h2>${q.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join("")}</section>`, ld };
}
// «Horarios verificados en <lugar>»: tabla (lunes a viernes, sábado, domingo) de las bibliotecas con horario verificado
// con fuente y fecha, de más a menos horas a la semana. Va arriba en provincias y localidades: es la respuesta directa a
// «bibliotecas abiertas en <lugar>» y una tabla que Google puede usar como fragmento destacado. Sin verificadas, nada.
const MAX_FILAS_HORARIO = 15;
const ESTILO_TABLA_HOR = `<style>.horarios-lugar{overflow-x:auto}.horarios-lugar table{min-width:100%}.horarios-lugar th,.horarios-lugar td{padding:7px 8px 7px 0;vertical-align:top;font-size:var(--fs-s)}
.horarios-lugar thead th{color:var(--suave);font-weight:700;width:auto}.horarios-lugar tbody th{width:38%;font-weight:600}.horarios-lugar td{font-weight:600}</style>`;
function tablaHorariosLugar(lugar, lista) {
  const v = lista.filter(verificado).sort((a, b) => horasSemana(b) - horasSemana(a) || a.n.localeCompare(b.n, "es"));
  if (!v.length) return "";
  const celda = (b, d) => franjas(b.h.inv[d]) || (sinConfirmar(b, d) ? "Sin confirmar" : "Cerrada");
  // Lunes a viernes: si todos los días igual, la franja; si no, por grupos («L–J 8:30–21:00 · V 8:30–14:00»).
  const semana = (b) => {
    const g = [];
    DIAS.slice(0, 5).forEach((d) => { const f = celda(b, d), u = g[g.length - 1]; if (u && u.f === f) u.hasta = d; else g.push({ desde: d, hasta: d, f }); });
    return g.length === 1 ? g[0].f : g.map((x) => (x.desde === x.hasta ? x.desde : x.desde + "–" + x.hasta) + " " + x.f).join(" · ");
  };
  const filas = v.slice(0, MAX_FILAS_HORARIO).map((b) => `<tr><th scope="row"><a href="${paginaDe.get(b.i) || enlaceApp(b)}">${esc(b.n)}</a></th><td>${esc(semana(b))}</td><td>${esc(celda(b, "S"))}</td><td>${esc(celda(b, "D"))}</td></tr>`).join("");
  const resto = v.length - MAX_FILAS_HORARIO;
  return `<section class="ficha horarios-lugar" id="horarios" aria-labelledby="t-horarios"><h2 id="t-horarios">Horarios verificados en ${esc(lugar)}</h2>
<table class="horario"><caption>${plural(v.length, "biblioteca", "bibliotecas")} con horario de invierno comprobado en su web oficial ${esc(textoFechas(v))}, de más a menos horas a la semana</caption>
<thead><tr><th scope="col">Biblioteca</th><th scope="col">Lunes a viernes</th><th scope="col">Sábado</th><th scope="col">Domingo</th></tr></thead><tbody>${filas}</tbody></table>
<p class="fuente">${resto > 0 ? `Y ${plural(resto, "más", "más")} con horario verificado en la lista. ` : ""}La fuente y la fecha de cada horario están en su ficha. Verano, festivos y época de exámenes pueden cambiarlo: confírmalo antes de ir.</p></section>`;
}

// ---------- Escritura ----------
const SALIDA = path.join(RAIZ, "bibliotecas");
// <lastmod> exacto por página: el día en que su HTML cambió de verdad. Antes de borrar la carpeta se guardan la huella
// (sha1) de cada página y su <lastmod> del sitemap anterior; si la página nueva sale idéntica, conserva esa fecha; si
// cambia o es nueva, lleva la de hoy. Así regenerar con los mismos datos no «refresca» 400 URL que no han cambiado (Google
// deja de fiarse del lastmod si no es exacto) y un cambio de plantilla o de datos sí lo mueve, aunque el horario
// verificado (dateModified) sea anterior.
const crypto = require("crypto");
// La etiqueta de analitica.js y las de vista previa al compartir (og:image*, twitter:card, twitter:image) no cuentan: no cambian lo que
// ve quien lee la página ni lo que indexa Google (añadirlas no debe mover el lastmod de 1000 URL). Tampoco el
// aria-current="page" de la última miga: solo lo anuncia el lector de pantalla (el texto y el aspecto no cambian). Ni las
// migas como lista (<ol><li>, con el «›» puesto por CSS): se reducen al marcado anterior (<a>…</a> › <a>…</a> › <span>)
// antes de la huella, así que el cambio de marcado no mueve ninguna fecha y un cambio de texto o destino sí.
// Ni el ?v= de seo.css (SEO_CSS_V): es la huella del CSS, no contenido de la página; se quita antes de la huella.
const migasPlanas = (t) => t.replace(/<nav class="migas"([^>]*)><ol>([\s\S]*?)<\/ol><\/nav>/g,
  (_, a, l) => `<nav class="migas"${a}>${l.replace(/<\/li><li>/g, " › ").replace(/<\/?li>/g, "")}</nav>`);
const huella = (txt) => crypto.createHash("sha1").update(migasPlanas(String(txt).replace('<script src="/analitica.js" defer></script>\n', "")
  .replace(/<link rel="stylesheet" href="\/seo\.css\?v=[0-9a-f]+">/, '<link rel="stylesheet" href="/seo.css">')
  .replace(/<meta (property="og:image[^"]*"|name="twitter:(card|image)") content="[^"]*">\n/g, ""))
  .replace(/<span aria-current="page">/g, "<span>")).digest("hex");
const lastmodAntes = new Map(), huellaAntes = new Map(), huellaNueva = new Map();
try {
  const sm = fs.readFileSync(path.join(RAIZ, "sitemap.xml"), "utf8");
  for (const m of sm.matchAll(/<loc>([^<]+)<\/loc><lastmod>(\d{4}-\d\d-\d\d)<\/lastmod>/g)) lastmodAntes.set(m[1].slice(DOMINIO.length), m[2]);
} catch (e) { /* sin sitemap anterior: todo lleva la fecha de hoy */ }
(function recorre(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) recorre(f);
    else if (e.name === "index.html") huellaAntes.set("/" + path.relative(RAIZ, dir).split(path.sep).join("/") + "/", huella(fs.readFileSync(f)));
  }
})(SALIDA);
// ---------- Verificación de Google Search Console (propiedad «prefijo de URL») ----------
// Pega aquí SOLO el valor de content="…" que da Search Console al elegir «Etiqueta HTML» (p. ej. "AbCd…123"; sin la
// etiqueta entera). Con null no se toca nada. Con un código, la meta va en la PORTADA (index.html, la URL https://bibliomapa.es/
// que Google comprueba), no en /bibliotecas/: Google solo la busca en la página de inicio de la propiedad. Se escribe una
// sola vez justo después de <meta charset> (si ya está con el mismo código, no cambia nada; con otro, lo sustituye).
// La alternativa recomendada es la propiedad de DOMINIO con un registro DNS TXT, que no toca el código (docs/SEO.md).
// scripts/comprobar_paginas_seo.js falla si la meta aparece vacía o «null», en más de una página o fuera de la portada.
const GSC_VERIFICACION = null;
if (GSC_VERIFICACION !== null) {
  if (typeof GSC_VERIFICACION !== "string" || !/^[A-Za-z0-9_-]{10,100}$/.test(GSC_VERIFICACION)) {
    console.error("GSC_VERIFICACION debe ser null o el código de Search Console (solo letras, cifras, - y _; sin comillas ni la etiqueta entera).");
    process.exit(1);
  }
  const fPortada = path.join(RAIZ, "index.html");
  const portada = fs.readFileSync(fPortada, "utf8");
  const meta = `<meta name="google-site-verification" content="${GSC_VERIFICACION}">`;
  const sinMeta = portada.replace(/[ \t]*<meta\s+name=["']google-site-verification["'][^>]*>\r?\n?/gi, "");
  const conMeta = sinMeta.replace(/(<meta\s+charset=[^>]*>\r?\n?)/i, `$1${meta}\n`);
  if (conMeta === sinMeta) { console.error("No encuentro <meta charset> en index.html para poner la verificación de Search Console."); process.exit(1); }
  if (conMeta !== portada) { fs.writeFileSync(fPortada, conMeta); console.log("Search Console: meta google-site-verification puesta en index.html (portada)."); }
}
// ---------- IndexNow (Bing, Yandex, Seznam, Naver…: avisa al momento de las URL que cambian) ----------
// Pega aquí la clave que generes tú (8 a 128 caracteres: letras, cifras y «-»; p. ej. la de
// https://www.bing.com/indexnow/getstarted o `node -e "console.log(require('crypto').randomUUID())"`). Con null no se
// toca nada. Con una clave, se escribe /<clave>.txt en la raíz con la clave exacta (sin salto de línea): así IndexNow
// comprueba que el aviso es del dueño del dominio. Los avisos los manda scripts/avisar_indexnow.js (aparte, a mano o
// tras cada despliegue). scripts/comprobar_paginas_seo.js falla si la clave está puesta y el .txt falta o no coincide.
const INDEXNOW_CLAVE = null;
if (INDEXNOW_CLAVE !== null) {
  if (typeof INDEXNOW_CLAVE !== "string" || !/^[A-Za-z0-9-]{8,128}$/.test(INDEXNOW_CLAVE)) {
    console.error("INDEXNOW_CLAVE debe ser null o una clave de 8 a 128 caracteres (solo letras, cifras y -), entre comillas.");
    process.exit(1);
  }
  const fClave = path.join(RAIZ, INDEXNOW_CLAVE + ".txt");
  if (!fs.existsSync(fClave) || fs.readFileSync(fClave, "utf8") !== INDEXNOW_CLAVE) {
    fs.writeFileSync(fClave, INDEXNOW_CLAVE);
    console.log(`IndexNow: clave escrita en /${INDEXNOW_CLAVE}.txt (súbelo con el resto).`);
  }
}
// La portada («/», la app) no la genera este script: su fecha es la del último commit que tocó index.html (hoy si tiene
// cambios sin subir o si no hay git a mano).
const lastmodPortada = (() => {
  try {
    const git = (...a) => require("child_process").execFileSync("git", a, { cwd: RAIZ, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (git("status", "--porcelain", "--", "index.html")) return HOY;
    const d = git("log", "-1", "--format=%cs", "--", "index.html");
    return /^\d{4}-\d\d-\d\d$/.test(d) && d <= HOY ? d : HOY;
  } catch (e) { return HOY; }
})();
// `mod` (la verificación más reciente, el dateModified del JSON-LD) es el suelo: el sitemap nunca dice que la página
// cambió antes que sus datos (lo comprueba scripts/comprobar_paginas_seo.js).
const lastmodDe = (ruta, mod) => {
  if (ruta === "/") return lastmodPortada;
  const nueva = huellaNueva.get(ruta);
  const d = nueva && huellaAntes.get(ruta) === nueva && lastmodAntes.has(ruta) ? lastmodAntes.get(ruta) : HOY;
  return mod && mod > d && mod <= HOY ? mod : d;
};
// `node scripts/generar_paginas_seo.js --listar-provincias`: «slug<TAB>Provincia<TAB>fichas» de más a menos fichas y sale
// antes de borrar o escribir nada. Lo usa scripts/generar_imagen_og.py para el nombre de cada provincia y el ranking por fichas.
if (process.argv.includes("--listar-provincias")) {
  const n = {};
  todas.forEach((b) => (n[b.p] = (n[b.p] || 0) + 1));
  Object.keys(n).sort((a, b) => n[b] - n[a] || a.localeCompare(b, "es")).forEach((p) => console.log(`${slug(p)}\t${p}\t${n[p]}`));
  process.exit(0);
}
fs.rmSync(SALIDA, { recursive: true, force: true });
const urls = [["/", "1.0"], ["/bibliotecas/", "0.9"]];
const escribe = (ruta, html) => { const f = path.join(RAIZ, ruta, "index.html"); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); huellaNueva.set(ruta, huella(html)); };
const porProv = {};
todas.forEach((b) => (porProv[b.p] = porProv[b.p] || []).push(b));
const provincias = Object.keys(porProv).sort((a, b) => a.localeCompare(b, "es"));
const nombreProvDeSlug = new Map(provincias.map((p) => [slug(p), p]));
const ordenBib = (a, b) => (b.h ? 1 : 0) - (a.h ? 1 : 0) || ({ mayor: 0, universidad: 1, publica: 2, otra: 3 }[a.t] - { mayor: 0, universidad: 1, publica: 2, otra: 3 }[b.t]) || a.n.localeCompare(b.n, "es");

// ---------- Páginas temáticas (solo horarios verificados con fuente) ----------
// España: siempre. Provincia: solo con 2 o más bibliotecas que cumplen (nada de páginas finas).
const MIN_TEMA_PROV = 2;
const TEMAS = [
  // «Abiertas hoy»: todas las de horario verificado; el horario de HOY y si está abierta AHORA lo calcula el navegador
  // (script pequeño, hora de España peninsular o de Canarias) a partir de los mismos datos verificados. Sin JS se ve el
  // horario de la semana. Lo estático (para buscadores) es el recuento real de cuántas abren cada día.
  { slug: "abiertas-hoy", corto: "Hoy", que: "abiertas hoy", cumple: verificado, hoy: true,
    destacado: () => "",
    pregunta: (l) => `¿Qué bibliotecas abren hoy en ${l}?`,
    intro: (lista, lugar) => `${lista.length} bibliotecas de ${esc(lugar)} con horario comprobado en su web oficial ${textoFechas(lista)}. ` +
      `<span id="hoy-resumen">Debajo de cada una tienes su horario de hoy y si está abierta ahora mismo.</span> ` +
      `Festivos, verano y época de exámenes pueden cambiarlo: confírmalo en su web antes de ir.`,
    antes: (lista) => tablaPorDia(lista),
    faq: (t, lista, lugar) => {
      const n = (d) => lista.filter((b) => (b.h.inv[d] || []).length).length;
      const tarde = lista.filter(cierreMasTarde).sort((a, b) => cierreMasTarde(b).localeCompare(cierreMasTarde(a)))[0];
      const dom = lista.filter(abreDomingo);
      return [
        [t.pregunta(lugar), `Depende del día. Con horario de invierno verificado, de lunes a viernes abren hasta ${Math.max(...DIAS.slice(0, 5).map(n))}, el sábado ${n("S")} y el domingo ${n("D")}. En esta página ves el horario de hoy de cada una y cuáles están abiertas ahora.`],
        [`¿Hay bibliotecas abiertas hoy domingo en ${lugar}?`, dom.length ? `Sí, según su horario verificado abren los domingos: ${dom.slice(0, 6).map((b) => b.n).join(", ")}${dom.length > 6 ? " y otras" : ""}.` : `Ninguna de las que tienen horario verificado en ${lugar} abre los domingos.`],
        ...(tarde ? [[`¿Qué biblioteca cierra más tarde hoy en ${lugar}?`, `Entre semana, la que cierra más tarde según su horario verificado es ${tarde.n} (a las ${quitaCero(cierreMasTarde(tarde)).replace("24:00", "00:00")}).`]] : []),
        [`¿Están actualizados estos horarios?`, `Son los publicados en la web oficial de cada biblioteca, comprobados ${textoFechas(lista)}. Festivos, verano y temporada de exámenes pueden cambiarlos; si ves uno mal, avísanos desde la app.`],
      ];
    } },
  { slug: "abiertas-domingo", corto: "Domingo", que: "abiertas el domingo", cumple: abreDomingo,
    destacado: (b) => `Domingo: ${franjas(b.h.inv.D)}`,
    pregunta: (l) => `¿Qué bibliotecas abren el domingo en ${l}?` },
  { slug: "abiertas-fin-de-semana", corto: "Fin de semana", que: "abiertas el fin de semana", cumple: (b) => verificado(b) && !!abreFinde(b),
    destacado: (b) => `Sábado: ${franjas(b.h.inv.S) || "cerrado"} · Domingo: ${franjas(b.h.inv.D) || "cerrado"}`,
    pregunta: (l) => `¿Qué bibliotecas abren el fin de semana en ${l}?` },
  // Sábado por la tarde: alguna franja del sábado (horario de invierno verificado) que acaba a las 17:00 o más tarde.
  // Solo con 3 o más que cumplan (min) y si no son exactamente las mismas que «fin de semana» del mismo sitio (distintoDe):
  // si coinciden, la página repetiría aquella y no se crea.
  { slug: "abiertas-sabado-tarde", corto: "Sábado tarde", que: "abiertas el sábado por la tarde", cumple: abreSabadoTarde,
    min: 3, distintoDe: "abiertas-fin-de-semana",
    destacado: (b) => `Sábado: ${franjas(b.h.inv.S)}`,
    pregunta: (l) => `¿Qué bibliotecas abren el sábado por la tarde en ${l}?`,
    faq: (t, lista, lugar) => {
      const nombres = lista.slice(0, 6).map((b) => b.n).join(", ") + (lista.length > 6 ? " y otras" : "");
      const cierreS = (b) => (b.h.inv.S || []).map((r) => (r[1] === "00:00" ? "24:00" : r[1])).sort().pop();
      const max = lista.map(cierreS).sort().pop(), ultimas = lista.filter((b) => cierreS(b) === max);
      const dom = lista.filter((b) => (b.h.inv.D || []).length);
      return [
        [t.pregunta(lugar), `Con horario de invierno verificado en su web oficial abren el sábado hasta las 17:00 o más tarde: ${nombres}.`],
        [`¿Qué biblioteca cierra más tarde el sábado en ${lugar}?`, `Según su horario verificado, ${ultimas.slice(0, 4).map((b) => b.n).join(", ")}${ultimas.length > 4 ? " y otras" : ""} (a las ${quitaCero(max).replace("24:00", "00:00")}).`],
        [`¿Abren también el domingo?`, dom.length
          ? `De estas, ${dom.length === 1 ? "solo 1 abre" : `${dom.length} abren`} también el domingo: ${dom.slice(0, 6).map((b) => b.n).join(", ")}${dom.length > 6 ? " y otras" : ""}.`
          : `Ninguna de estas abre el domingo según su horario verificado.`],
        [`¿Están actualizados estos horarios?`, `Son los horarios de invierno publicados en la web oficial de cada biblioteca, comprobados ${textoFechas(lista)}. Pueden cambiar en verano, festivos o temporada de exámenes; si ves uno mal, avísanos desde la app.`],
      ];
    } },
  // Domingo por la tarde: alguna franja del domingo (horario de invierno verificado) que acaba a las 17:00 o más tarde.
  // Con 3 o más y nunca si la lista es la misma que «Domingo» o «Sábado tarde» del mismo sitio (sería una página repetida).
  { slug: "abiertas-domingo-tarde", corto: "Domingo tarde", que: "abiertas el domingo por la tarde", cumple: abreDomingoTarde,
    min: 3, distintoDe: ["abiertas-domingo", "abiertas-sabado-tarde"],
    destacado: (b) => `Domingo: ${franjas(b.h.inv.D)}`,
    pregunta: (l) => `¿Qué bibliotecas abren el domingo por la tarde en ${l}?`,
    intro: (lista, lugar) => `${lista.length} ${lista.length === 1 ? "biblioteca" : "bibliotecas"} de ${esc(lugar)} abiertas el domingo hasta las 17:00 o más tarde, ` +
      `según el horario de invierno comprobado en la web oficial de cada una ${textoFechas(lista)} (en cada ficha tienes la fecha y la fuente). ` +
      `En verano, festivos y época de exámenes puede cambiar: confírmalo en su web antes de ir. Solo aparecen las que tienen horario verificado.`,
    faq: (t, lista, lugar) => {
      const nombres = lista.slice(0, 6).map((b) => b.n).join(", ") + (lista.length > 6 ? " y otras" : "");
      const pocas = (l) => l.slice(0, 4).map((b) => b.n).join(", ") + (l.length > 4 ? ` y ${l.length - 4} más` : "");
      const cierreD = (b) => (b.h.inv.D || []).map((r) => (r[1] === "00:00" ? "24:00" : r[1])).sort().pop();
      const max = lista.map(cierreD).sort().pop(), ultimas = lista.filter((b) => cierreD(b) === max);
      const sab = lista.filter(abreSabadoTarde);
      // Las que abren el domingo las 24 horas (0:00–24:00) se dicen así: «cierra a las 00:00» confundiría.
      const de24 = (b) => (b.h.inv.D || []).some((r) => r[0] === "00:00" && (r[1] === "24:00" || r[1] === "00:00"));
      const cierraTexto = ultimas.every(de24) ? `${ultimas.length === 1 ? "abre" : "abren"} las 24 horas el domingo`
        : `a las ${quitaCero(max).replace("24:00", "00:00 (medianoche)")}`;
      return [
        [t.pregunta(lugar), `Con horario de invierno verificado en su web oficial abren el domingo hasta las 17:00 o más tarde: ${nombres}.`],
        [`¿Qué biblioteca cierra más tarde el domingo en ${lugar}?`, `Según su horario verificado, ${ultimas.length === 1 ? "la que cierra más tarde es" : "las que cierran más tarde son"} ${pocas(ultimas)} (${cierraTexto}).`],
        [`¿Abren también el sábado por la tarde?`, sab.length
          ? `De estas, ${sab.length === lista.length ? "todas abren" : sab.length === 1 ? "solo 1 abre" : `${sab.length} abren`} también el sábado hasta las 17:00 o más tarde${sab.length === lista.length ? "" : `: ${pocas(sab)}`}.`
          : `Ninguna de estas abre el sábado hasta las 17:00 o más tarde según su horario verificado.`],
        [`¿Están actualizados estos horarios?`, `Son los horarios de invierno publicados en la web oficial de cada biblioteca, comprobados ${textoFechas(lista)}. Pueden cambiar en verano, festivos o temporada de exámenes; si ves uno mal, avísanos desde la app.`],
      ];
    } },
  { slug: "abiertas-hasta-tarde", corto: "Hasta tarde", que: "abiertas hasta tarde", cumple: (b) => verificado(b) && cierraTarde(b),
    destacado: (b) => `Entre semana cierra a las ${quitaCero(cierreMasTarde(b)).replace("24:00", "00:00 (medianoche)")}`,
    pregunta: (l) => `¿Qué bibliotecas cierran a las 21:00 o más tarde en ${l}?` },
  // Mediodía / horario continuo: de lunes a viernes sin cerrar entre las 14:00 y las 16:00 (abreMediodia). Con 3 o más y
  // nunca si la lista es la misma que «Hoy» (todas las verificadas del sitio) o que «Hasta tarde»: sería una página repetida.
  { slug: "abiertas-mediodia", corto: "Mediodía", que: "abiertas a mediodía", cumple: abreMediodia,
    min: 3, distintoDe: ["abiertas-hoy", "abiertas-hasta-tarde"],
    destacado: (b) => `Lunes a viernes, sin cerrar a mediodía: ${entreSemanaTexto(b.h.inv)}`,
    pregunta: (l) => `¿Qué bibliotecas abren a mediodía, sin cerrar para comer, en ${l}?`,
    intro: (lista, lugar) => `${lista.length} ${lista.length === 1 ? "biblioteca" : "bibliotecas"} de ${esc(lugar)} con horario continuo: de lunes a viernes abren sin cerrar entre las 14:00 y las 16:00, ` +
      `según el horario de invierno comprobado en la web oficial de cada una ${textoFechas(lista)} (en cada ficha tienes la fecha y la fuente). ` +
      `En verano, festivos y época de exámenes puede cambiar: confírmalo en su web antes de ir. Solo aparecen las que tienen horario verificado.`,
    faq: (t, lista, lugar) => {
      const nombres = lista.slice(0, 6).map((b) => b.n).join(", ") + (lista.length > 6 ? " y otras" : "");
      const pronto = lista.map(aperturaMasTemprana).sort()[0], tempranas = lista.filter((b) => aperturaMasTemprana(b) === pronto);
      const tarde = lista.map(cierreMasTarde).sort().pop(), tardias = lista.filter((b) => cierreMasTarde(b) === tarde);
      const pocas = (l) => l.slice(0, 4).map((b) => b.n).join(", ") + (l.length > 4 ? ` y ${l.length - 4} más` : "");
      const sab = lista.filter((b) => (b.h.inv.S || []).some(cubreMediodia));
      return [
        [t.pregunta(lugar), `Con horario de invierno verificado en su web oficial, abren de lunes a viernes sin cerrar entre las 14:00 y las 16:00: ${nombres}.`],
        [`¿Cuál abre antes y cuál cierra más tarde?`, `De estas, ${tempranas.length === 1 ? "la que abre antes es" : "las que abren antes son"} ${pocas(tempranas)} (a las ${quitaCero(pronto)}) y ` +
          `${tardias.length === 1 ? "la que cierra más tarde es" : "las que cierran más tarde son"} ${pocas(tardias)} (a las ${quitaCero(tarde).replace("24:00", "00:00 (medianoche)")}), algún día entre semana.`],
        [`¿Abren también a mediodía el sábado?`, sab.length
          ? `De estas, ${sab.length === 1 ? "solo 1 abre" : `${sab.length} abren`} también el sábado sin cerrar entre las 14:00 y las 16:00: ${pocas(sab)}.`
          : `Ninguna de estas abre el sábado entre las 14:00 y las 16:00 según su horario verificado.`],
        [`¿Están actualizados estos horarios?`, `Son los horarios de invierno publicados en la web oficial de cada biblioteca, comprobados ${textoFechas(lista)}. Pueden cambiar en verano, festivos o temporada de exámenes; si ves uno mal, avísanos desde la app.`],
      ];
    } },
  // Abren temprano: algún día de lunes a viernes (horario de invierno verificado) con una franja que empieza a las 8:00 o
  // antes (abreTemprano). Con 3 o más y nunca si la lista es la misma que «Hoy» o que «Mediodía» del mismo sitio.
  { slug: "abiertas-temprano", corto: "Abren temprano", que: "que abren temprano", cumple: abreTemprano,
    min: 3, distintoDe: ["abiertas-hoy", "abiertas-mediodia"],
    destacado: (b) => `${abre24h(b) ? "Abierta las 24 horas" : `Abre a las ${quitaCero(aperturaMasTemprana(b))}`} ${diasTemprano(b)}: ${entreSemanaTexto(b.h.inv)}`,
    pregunta: (l) => `¿Qué bibliotecas abren a las 8:00 o antes en ${l}?`,
    intro: (lista, lugar) => `${lista.length} ${lista.length === 1 ? "biblioteca" : "bibliotecas"} de ${esc(lugar)} que abren a las 8:00 o antes algún día de lunes a viernes, ` +
      `según el horario de invierno comprobado en la web oficial de cada una ${textoFechas(lista)} (en cada ficha tienes la fecha y la fuente). ` +
      `En verano, festivos y época de exámenes puede cambiar: confírmalo en su web antes de ir. Solo aparecen las que tienen horario verificado.`,
    faq: (t, lista, lugar) => {
      const nombres = lista.slice(0, 6).map((b) => b.n).join(", ") + (lista.length > 6 ? " y otras" : "");
      const pocas = (l) => l.slice(0, 4).map((b) => b.n).join(", ") + (l.length > 4 ? ` y ${l.length - 4} más` : "");
      // Las de 24 horas (franja que empieza a las 0:00) se dicen aparte: «abre a las 0:00» confundiría.
      const de24 = lista.filter(abre24h), resto = lista.filter((b) => !abre24h(b));
      const pronto = resto.map(aperturaMasTemprana).sort()[0], tempranas = resto.filter((b) => aperturaMasTemprana(b) === pronto);
      const todos = lista.filter((b) => DIAS.slice(0, 5).every((d) => (b.h.inv[d] || []).some(empiezaTemprano)));
      const n5 = todos.length;
      const medio = lista.filter(abreMediodia);
      return [
        [t.pregunta(lugar), `Con horario de invierno verificado en su web oficial, abren a las 8:00 o antes algún día de lunes a viernes: ${nombres}.`],
        [`¿Cuál abre antes en ${lugar}?`, (de24.length ? `${pocas(de24)} ${de24.length === 1 ? "abre" : "abren"} las 24 horas algún día entre semana. ${resto.length ? "Del resto, " : ""}` : "") +
          (resto.length ? `${de24.length ? "l" : "L"}${tempranas.length === 1 ? "a que abre antes es" : "as que abren antes son"} ${pocas(tempranas)}, a las ${quitaCero(pronto)}, según su horario verificado. ` : "") +
          (n5 === lista.length ? `Todas abren a las 8:00 o antes los cinco días de lunes a viernes.` : `${n5 === 0 ? "Ninguna" : n5 === 1 ? "Solo 1" : n5} de las ${lista.length} ${n5 > 1 ? "abren" : "abre"} a las 8:00 o antes los cinco días de lunes a viernes.`)],
        [`¿Abren también a mediodía, sin cerrar para comer?`, medio.length
          ? `De estas, ${medio.length === 1 ? "solo 1 abre" : `${medio.length} abren`} de lunes a viernes sin cerrar entre las 14:00 y las 16:00: ${pocas(medio)}.`
          : `Ninguna de estas abre los cinco días de lunes a viernes sin cerrar entre las 14:00 y las 16:00, según su horario verificado.`],
        [`¿Están actualizados estos horarios?`, `Son los horarios de invierno publicados en la web oficial de cada biblioteca, comprobados ${textoFechas(lista)}. Pueden cambiar en verano, festivos o temporada de exámenes; si ves uno mal, avísanos desde la app.`],
      ];
    } },
  // Verano: solo las que tienen horario de verano verificado (h.ver con sus fechas h.vd/h.vh «MM-DD») y abren algún día.
  // Va solo a nivel España y provincia (local: false); intro y FAQ propias porque no es el horario de invierno.
  { slug: "abiertas-verano", corto: "Verano", que: "abiertas en verano", cumple: abreVerano, local: false,
    destacado: (b) => `Verano (del ${fechaDM(b.h.vd)} al ${fechaDM(b.h.vh)}): ${horarioTexto(b.h.ver)}`,
    pregunta: (l) => `¿Qué bibliotecas abren en verano y en agosto en ${l}?`,
    intro: (lista, lugar) => `${lista.length} ${lista.length === 1 ? "biblioteca" : "bibliotecas"} abiertas en verano en ${esc(lugar)}. ` +
      `Solo aparecen las que publican en su web oficial un horario de verano con fechas, comprobado ${textoFechas(lista)}; en cada ficha tienes el periodo, el horario y la fuente. ` +
      `Las fechas cambian cada año y en agosto algunas cierran días sueltos: confírmalo en su web antes de ir.`,
    faq: (t, lista, lugar) => {
      const nombres = lista.slice(0, 6).map((b) => b.n).join(", ") + (lista.length > 6 ? " y otras" : "");
      const tardes = lista.filter((b) => DIAS.some((d) => (b.h.ver[d] || []).some((r) => r[1] > "15:00" || r[1] === "00:00")));
      return [
        [t.pregunta(lugar), `Con horario de verano verificado en su web oficial: ${nombres}. Cada una tiene sus fechas de verano (por ejemplo, ${lista[0].n}: del ${fechaDM(lista[0].h.vd)} al ${fechaDM(lista[0].h.vh)}).`],
        [`¿Qué bibliotecas abren por la tarde en verano en ${lugar}?`, tardes.length
          ? `Según su horario de verano verificado, abren por la tarde algún día: ${tardes.slice(0, 6).map((b) => b.n).join(", ")}${tardes.length > 6 ? " y otras" : ""}.`
          : `Ninguna de las que tienen horario de verano verificado abre por la tarde en verano: todas cierran a primera hora de la tarde.`],
        [`¿Están actualizados estos horarios de verano?`, `Son los horarios de verano publicados en la web oficial de cada biblioteca, comprobados ${textoFechas(lista)}. Las fechas exactas cambian cada año; si ves uno mal, avísanos desde la app.`],
      ];
    } },
];
const temaProv = {}; // temaProv[slug][provincia] = lista (solo si se genera página)
// ¿La lista es exactamente la del tema «distintoDe» en el mismo sitio? (entonces la página sería duplicada y no se crea)
// «distintoDe» puede ser un slug o una lista de slugs (todos de temas anteriores en TEMAS).
const igualQue = (t, l, mapa, k) => [].concat(t.distintoDe || []).some((s) => { const o = mapa[s] && mapa[s][k];
  return !!o && o.length === l.length && l.every((b) => o.includes(b)); });
TEMAS.forEach((t) => {
  temaProv[t.slug] = {};
  provincias.forEach((p) => { const l = porProv[p].filter(t.cumple); if (l.length >= (t.min || MIN_TEMA_PROV) && !igualQue(t, l, temaProv, p)) temaProv[t.slug][p] = l; });
});
// Localidad: mismos temas (salvo los «local: false»), solo con 2 o más que cumplen y solo en localidades que ya tienen
// página propia (3 o más bibliotecas y slug distinto del de la provincia). Así nunca se crea /madrid/madrid/…, que
// duplicaría la página temática de la provincia, y siempre hay una página de localidad desde la que enlazarla.
const MIN_TEMA_LOC = 2;
const TEMAS_LOC = TEMAS.filter((t) => t.local !== false);
const tieneLocPagina = (p, c, n) => n >= 3 && !!slug(c) && slug(c) !== slug(p);
// En los temas con «min» propio, la página de localidad tampoco se crea si su lista es exactamente la de la página de su
// provincia (p. ej. «abren temprano»: Pamplona y Navarra, las mismas 3): sería la misma página con otro nombre.
const igualProv = (t, l, p) => { const o = t.min && temaProv[t.slug][p]; return !!o && o.length === l.length && l.every((b) => o.includes(b)); };
const temaLoc = {}; // temaLoc[slug]["<provincia>|<localidad>"] = lista
TEMAS_LOC.forEach((t) => { temaLoc[t.slug] = {}; });
provincias.forEach((p) => {
  const porC = {};
  porProv[p].forEach((b) => (porC[b.c] = porC[b.c] || []).push(b));
  Object.keys(porC).forEach((c) => {
    if (!tieneLocPagina(p, c, porC[c].length)) return;
    TEMAS_LOC.forEach((t) => { const l = porC[c].filter(t.cumple); if (l.length >= (t.min || MIN_TEMA_LOC) && !igualQue(t, l, temaLoc, p + "|" + c) && !igualProv(t, l, p)) temaLoc[t.slug][p + "|" + c] = l; });
  });
});
// Recuento del filtro de los temas con mínimo propio o «distintoDe» (para saber cuántas se quedan fuera y por qué).
TEMAS.filter((t) => t.min || t.distintoDe).forEach((t) => {
  const min = t.min || MIN_TEMA_PROV, prov = provincias.map((p) => porProv[p].filter(t.cumple)).filter((l) => l.length);
  const locs = {}; provincias.forEach((p) => porProv[p].forEach((b) => { if (tieneLocPagina(p, b.c, porProv[p].filter((x) => x.c === b.c).length) && t.cumple(b)) (locs[p + "|" + b.c] = locs[p + "|" + b.c] || []).push(b); }));
  const nl = Object.values(locs), np = Object.keys(temaProv[t.slug]).length, nlp = temaLoc[t.slug] ? Object.keys(temaLoc[t.slug]).length : 0;
  console.log(`Tema ${t.slug}: cumplen en ${prov.length} provincias (${prov.filter((l) => l.length >= min).length} con ${min} o más, ${np} con página) ` +
    `y en ${nl.length} localidades con página (${nl.filter((l) => l.length >= min).length} con ${min} o más, ${nlp} con página; si no, por ser iguales a «${t.distintoDe}»${t.min ? " o a su provincia" : ""})`);
});
// Fecha de verificación más reciente de las listadas (dateModified del JSON-LD y lastmod del sitemap): no depende del día
// en que se genera, así que regenerar con los mismos datos da las mismas páginas.
const fechaMod = (lista) => lista.map((b) => b.h.fv).sort().pop();
// Provincia y localidad: muestran horarios solo de las verificadas; dateModified = la más reciente (nada si no hay).
const modVerif = (lista) => { const v = lista.filter(verificado); return v.length ? { dateModified: fechaMod(v) } : {}; };
// JSON-LD de una página temática: CollectionPage (admite dateModified) con la lista como entidad principal.
// partes: las temáticas de nivel inferior que la página ya enlaza (las de sus localidades en la nav «Por localidad» de la
// temática de provincia; las de provincia en las cabeceras de sección de la de España), como hasPart, igual que
// partesLugar: sin enlaces nuevos, y scripts/comprobar_paginas_seo.js falla si falta o no está enlazada.
// superior: [nombre, ruta] de la temática de nivel superior que ya enlaza su <p class="volver"> (la de localidad, la de
// su provincia si existe y si no la de España; la de provincia, la de España; la de España, el índice /bibliotecas/ con
// NOMBRE_INDICE, sin reciprocidad porque el índice solo lista provincias), como isPartOf con el mismo name que el
// CollectionPage destino. Es la otra mitad del hasPart: el comprobador falla si no existe, no está enlazada o, cuando la
// superior es de provincia o la página lo es, la superior no la lleva en su hasPart.
// migas: true para enlazar su BreadcrumbList (<ruta>#migas) con breadcrumb (temáticas de España, de provincia y de localidad).
// @id de las migas de una página y el breadcrumb que lo enlaza desde su CollectionPage (las fichas lo hacen a mano).
// En el índice (/bibliotecas/: el WebSite), provincias, localidades, temáticas de España y hubs (el índice) y universidades,
// ciudades de exámenes y salas de estudio (su hub) el penúltimo de las migas es su isPartOf; en las temáticas de provincia y de localidad no (las migas siguen el lugar, provincia › localidad
// › tema; el isPartOf, la temática superior): ahí es el primer enlace de su «volver».
let nMigasId = 0;
const idMigasDe = (ruta) => DOMINIO + ruta + "#migas";
const conMigas = (ruta) => { nMigasId++; return { breadcrumb: { "@id": idMigasDe(ruta) } }; };
let nTemaHasPart = 0, nHasPartTema = 0, nTemaIsPartOf = 0;
const ldTema = (ruta, nombre, l, partes = [], superior = null, migas = false) => {
  if (partes.length) { nTemaHasPart++; nHasPartTema += partes.length; }
  if (superior) nTemaIsPartOf++;
  return { "@context": "https://schema.org", "@id": DOMINIO + ruta + "#pagina", "@type": "CollectionPage", name: nombre, url: DOMINIO + ruta,
  inLanguage: "es-ES", dateModified: fechaMod(l), ...(superior ? { isPartOf: refPagina(superior[0], DOMINIO + superior[1]) } : {}), ...(migas ? conMigas(ruta) : {}), ...(partes.length ? { hasPart: partes.map(([name, r]) => refPagina(name, DOMINIO + r)) } : {}), mainEntity: { "@type": "ItemList", name: nombre, numberOfItems: l.length,
    itemListElement: l.map((b, k) => ({ "@type": "ListItem", position: k + 1, item: itemBib(b) })) } };
};
function textoFechas(lista) {
  const f = [...new Set(lista.map((b) => b.h.fv))].sort();
  return f.length === 1 ? `el ${fechaEs(f[0])}` : `entre el ${fechaEs(f[0])} y el ${fechaEs(f[f.length - 1])}`;
}
// «¿Cuántas abren cada día?» (horario de invierno verificado): contenido real y estable para la página «Hoy».
function tablaPorDia(lista) {
  const filas = DIAS.map((d, k) => { const n = lista.filter((b) => (b.h.inv[d] || []).length).length;
    return `<tr data-dia="${d}"><th scope="row">${cap(DIAS_LARGOS[k])}</th><td>${n} de ${lista.length}</td></tr>`; }).join("");
  return `<section class="ficha" aria-labelledby="t-dias"><h2 id="t-dias">¿Cuántas abren cada día?</h2><table class="horario"><caption>Según el horario de invierno verificado</caption><tbody>${filas}</tbody></table></section>`;
}
// Datos del horario de hoy para el script del navegador (solo verificados).
const CANARIAS = /^(Las Palmas|Santa Cruz de Tenerife)$/;
const datosHoy = (b) => esc(JSON.stringify({ i: b.h.inv, v: abreVerano(b) ? b.h.ver : undefined, vd: b.h.vd, vh: b.h.vh,
  sc: DIAS.filter((d) => sinConfirmar(b, d)), tz: CANARIAS.test(b.p) ? "Atlantic/Canary" : undefined }));
// Script de la página «Hoy»: pone el horario de hoy en cada tarjeta, su estado ahora y ordena (abiertas primero).
const ESTILO_HOY = `<style>.dest.hoy-0{color:var(--ok-tx);background:var(--ok-bg)}.dest.hoy-3,.dest.hoy-4{color:var(--suave);background:var(--linea)}
tr.es-hoy th,tr.es-hoy td{color:var(--acento-tx)}#hoy-resumen{font-weight:700;color:var(--texto)}</style>`;
const SCRIPT_HOY = `<script>(function(){
var D=["D","L","M","X","J","V","S"],N=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],W=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function ahora(tz){var p={};try{new Intl.DateTimeFormat("en-GB",{timeZone:tz,weekday:"short",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date()).forEach(function(x){p[x.type]=x.value});}catch(e){return null}
return{w:W.indexOf(p.weekday),md:p.month+"-"+p.day,hm:(p.hour==="24"?"00":p.hour)+":"+p.minute};}
function q(t){return t.replace(/^0(\\d)/,"$1")}
var cont=[],n=0,ab=0,ref=null;
document.querySelectorAll("[data-h]").forEach(function(a){var h;try{h=JSON.parse(a.getAttribute("data-h"))}catch(e){return}
var t=ahora(h.tz||"Europe/Madrid");if(!t||t.w<0)return;if(!ref||(!h.tz&&ref.c)){ref=t;ref.c=!!h.tz;}
var ver=h.v&&h.vd&&h.vh&&(h.vd<=h.vh?(t.md>=h.vd&&t.md<=h.vh):(t.md>=h.vd||t.md<=h.vh)),fr=(ver?h.v:h.i)[D[t.w]]||[],e=4,txt;
if(!fr.length){if(!ver&&h.sc.indexOf(D[t.w])>=0){e=2;txt="sin confirmar"}else txt="cerrada";}
else{txt=fr.map(function(r){return q(r[0])+"–"+q(r[1])}).join(", ");e=3;
for(var k=0;k<fr.length;k++){var c=fr[k][1]==="00:00"?"24:00":fr[k][1];if(t.hm>=fr[k][0]&&t.hm<c){e=0;txt=fr.length===1&&fr[0][0]==="00:00"&&c==="24:00"?"abierta 24 horas · Abierta ahora":txt+" · Abierta ahora, cierra a las "+q(fr[k][1]);break}
if(t.hm<fr[k][0]){e=1;txt+=" · Abre a las "+q(fr[k][0]);break}}
if(e===3)txt+=" · Ya ha cerrado";}
var el=a.querySelector(".hoy");el.textContent="Hoy, "+N[t.w]+(ver?" (horario de verano)":"")+": "+txt;el.className="dest hoy hoy-"+e;el.hidden=false;
a.setAttribute("data-e",e);n++;if(e===0)ab++;if(cont.indexOf(a.parentNode)<0)cont.push(a.parentNode);});
cont.forEach(function(c){[].slice.call(c.querySelectorAll(":scope>[data-e]")).sort(function(x,y){return x.getAttribute("data-e")-y.getAttribute("data-e")}).forEach(function(a){c.appendChild(a)})});
if(ref){var r=document.getElementById("hoy-resumen");if(r)r.textContent="Ahora ("+N[ref.w]+", "+q(ref.hm)+(ref.c?" en Canarias":" en la península")+"): "+ab+(ab===1?" abierta":" abiertas")+" de "+n+". Las abiertas salen primero.";
var f=document.querySelector('tr[data-dia="'+D[ref.w]+'"]');if(f)f.className="es-hoy";}
})();</script>`;
function introTema(t, lista, lugar) {
  if (t.intro) return t.intro(lista, lugar);
  return `${lista.length} ${lista.length === 1 ? "biblioteca" : "bibliotecas"} ${t.que} en ${esc(lugar)}. ` +
    `Según el horario de invierno comprobado en la web oficial de cada una ${textoFechas(lista)} (en cada ficha tienes la fecha y la fuente). ` +
    `En verano, festivos y época de exámenes puede cambiar: confírmalo en su web antes de ir. Solo aparecen las que tienen horario verificado.`;
}
function faqTema(t, lista, lugar) {
  const nombres = lista.slice(0, 6).map((b) => b.n).join(", ") + (lista.length > 6 ? " y otras" : "");
  const tarde = lista.filter(cierreMasTarde).sort((a, b) => cierreMasTarde(b).localeCompare(cierreMasTarde(a)))[0];
  const q = t.faq ? t.faq(t, lista, lugar) : [
    [t.pregunta(lugar), `Con horario verificado en su web oficial: ${nombres}.`],
    ...(tarde ? [[`¿Hasta qué hora abren entre semana las bibliotecas ${t.que} en ${lugar}?`, `La que cierra más tarde entre semana, según su horario verificado, es ${tarde.n} (a las ${quitaCero(cierreMasTarde(tarde)).replace("24:00", "00:00")}).`]] : []),
    [`¿Están actualizados estos horarios?`, `Son los horarios de invierno publicados en la web oficial de cada biblioteca, comprobados ${textoFechas(lista)}. Pueden cambiar en verano, festivos o temporada de exámenes; si ves uno mal, avísanos desde la app.`],
  ];
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: q.map(([p, r]) => ({ "@type": "Question", name: p, acceptedAnswer: { "@type": "Answer", text: r } })) };
  return { html: `<section class="faq"><h2>Preguntas frecuentes</h2>${q.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join("")}</section>`, ld };
}
// Página hub «Bibliotecas por horario»: enlaza todas las temáticas, salas de estudio y universidades por provincia, y
// todas ellas enlazan de vuelta a ella (enlazado interno). Ver «Página hub» más abajo.
const HUB = "/bibliotecas/horarios/";
const enlaceHub = `<a href="${HUB}">Todos los horarios por provincia</a>`;
// Enlaces a los otros temas (mismo ámbito) para que Google y la gente naveguen entre ellas, y al hub.
function navTemas(actual, prov, loc) {
  const enl = (loc ? TEMAS_LOC : TEMAS).filter((t) => t.slug !== actual && (loc ? temaLoc[t.slug][prov + "|" + loc] : prov ? temaProv[t.slug][prov] : todas.some(t.cumple)))
    .map((t) => `<a href="/bibliotecas/${prov ? slug(prov) + "/" : ""}${loc ? slug(loc) + "/" : ""}${t.slug}/">${esc(t.corto)}</a>`);
  return `<nav class="temas" aria-label="Otros horarios">${enl.join("")}<a href="${HUB}">Todos los horarios</a></nav>`;
}
// «Por horario: Domingo 3 · Hasta tarde 2…» en la página de una provincia o de una localidad.
function navPorHorario(prov, loc) {
  const base = `/bibliotecas/${slug(prov)}/${loc ? slug(loc) + "/" : ""}`;
  const enl = (loc ? TEMAS_LOC : TEMAS).map((t) => ({ t, l: loc ? temaLoc[t.slug][prov + "|" + loc] : temaProv[t.slug][prov] })).filter((x) => x.l)
    .map(({ t, l }) => `<a href="${base}${t.slug}/">${esc(t.corto)} <small>${l.length}</small></a>`);
  return enl.length ? `<nav class="temas" aria-label="Por horario"><span>Por horario:</span>${enl.join("")}<a href="${HUB}#${slug(prov)}">Más horarios</a></nav>` : "";
}

// ---------- Página propia de las bibliotecas más buscadas ----------
// Entran: Biblioteca Nacional y Regional de Madrid; las «mayor»/«universidad» de capitales de provincia
// (y de Santiago y Mérida, capitales autonómicas); todas las de horario verificado (h.f + h.fv), estén donde estén;
// y las que tienen alguna entrada con fuente y fecha en temporada-examenes.js.
// Ruta: /bibliotecas/<prov>/<slug del nombre>/ (si choca, se añade la localidad). El slug sale del nombre,
// así que no cambia al regenerar mientras no cambie el nombre.
const CAPITALES = {
  "alava": ["vitoria", "vitoria-gasteiz", "gasteiz"], "albacete": ["albacete"], "alicante": ["alicante", "alacant"], "almeria": ["almeria"],
  "asturias": ["oviedo"], "avila": ["avila"], "badajoz": ["badajoz", "merida"], "baleares": ["palma", "palma-de-mallorca"], "barcelona": ["barcelona"],
  "bizkaia": ["bilbao"], "burgos": ["burgos"], "caceres": ["caceres"], "cadiz": ["cadiz"], "cantabria": ["santander"],
  "castellon": ["castellon", "castello-de-la-plana", "castellon-de-la-plana"], "ceuta": ["ceuta"], "ciudad-real": ["ciudad-real"], "cordoba": ["cordoba"],
  "a-coruna": ["a-coruna", "la-coruna", "santiago-de-compostela"], "cuenca": ["cuenca"], "gipuzkoa": ["donostia", "san-sebastian", "donostia-san-sebastian"],
  "girona": ["girona"], "granada": ["granada"], "guadalajara": ["guadalajara"], "huelva": ["huelva"], "huesca": ["huesca"], "jaen": ["jaen"],
  "la-rioja": ["logrono"], "las-palmas": ["las-palmas-de-gran-canaria"], "leon": ["leon"], "lleida": ["lleida"], "lugo": ["lugo"], "madrid": ["madrid"],
  "malaga": ["malaga"], "melilla": ["melilla"], "murcia": ["murcia"], "navarra": ["pamplona", "iruna", "pamplona-iruna"], "ourense": ["ourense"],
  "palencia": ["palencia"], "pontevedra": ["pontevedra"], "salamanca": ["salamanca"], "santa-cruz-de-tenerife": ["santa-cruz-de-tenerife"],
  "segovia": ["segovia"], "sevilla": ["sevilla"], "soria": ["soria"], "tarragona": ["tarragona"], "teruel": ["teruel"], "toledo": ["toledo"],
  "valencia": ["valencia"], "valladolid": ["valladolid"], "zamora": ["zamora"], "zaragoza": ["zaragoza"],
};
const enCapital = (b) => (CAPITALES[slug(b.p)] || []).includes(slug(b.c));
// Criterio original (hasta 2026-10): Nacional, Regional de Madrid y, en capitales, mayores, universitarias y verificadas.
const masBuscadaCapital = (b) => /^Biblioteca Nacional de España$|^Biblioteca Regional Joaqu[ií]n Leguina/.test(b.n) ||
  (enCapital(b) && (b.t === "mayor" || b.t === "universidad" || verificado(b)));
// Desde 2026-11 también: toda biblioteca con horario verificado (h.f + h.fv), esté o no en una capital (Gijón, Vigo,
// Cartagena, Jerez, Alcalá…), y toda la que tenga alguna entrada en temporada-examenes.js con fuente y fecha (f + fv),
// vigente o pasada, para que su URL no desaparezca al acabar el periodo. La entrada casa con la biblioteca por `bib`
// (nombre exacto; si hay varias, la de su provincia), igual que en las páginas de exámenes.
const ventanaEx = {};
try { new Function("window", fs.readFileSync(path.join(RAIZ, "temporada-examenes.js"), "utf8"))(ventanaEx); } catch (e) { /* sin exámenes */ }
const EXAMENES_TODAS = (ventanaEx.TEMPORADA_EXAMENES || []).filter((e) => e.f && e.fv);
const bibsPorNombre = new Map();
todas.forEach((b) => (bibsPorNombre.get(b.n) || bibsPorNombre.set(b.n, []).get(b.n)).push(b));
const bibDeEntrada = (e) => {
  const cand = e.bib ? bibsPorNombre.get(e.bib) || [] : [], mismas = cand.filter((b) => b.p === e.provincia);
  return mismas.length === 1 ? mismas[0] : cand.length === 1 ? cand[0] : null;
};
const conEntradaEx = new Set(EXAMENES_TODAS.map(bibDeEntrada).filter(Boolean).map((b) => b.i));
const masBuscada = (b) => masBuscadaCapital(b) || verificado(b) || conEntradaEx.has(b.i);
const SALAS_SLUG = "salas-de-estudio";
const paginaDe = new Map(); // índice de la biblioteca → ruta de su página
// Orden de asignación del slug: primero las del criterio original y luego las nuevas, para que una ficha nueva nunca le
// quite el slug a una que ya existía (si chocan, la nueva lleva la localidad o un número).
const conPaginaPropia = todas.filter(masBuscada).sort((a, b) => (masBuscadaCapital(b) - masBuscadaCapital(a)) || a.i - b.i);
provincias.forEach((p) => {
  const ps = slug(p), usados = new Set(TEMAS.map((t) => t.slug).concat([SALAS_SLUG]));
  porProv[p].forEach((b) => usados.add(slug(b.c))); // no pisar las páginas de localidad
  conPaginaPropia.filter((b) => b.p === p).forEach((b) => {
    let base = slug(b.n) || "biblioteca";
    if (base.length > 70) base = base.slice(0, 71).replace(/-[^-]*$/, ""); // URLs cortas, cortando por palabra
    let s = base;
    if (usados.has(s)) s = `${base}-${slug(b.c)}`;
    for (let k = 2; usados.has(s); k++) s = `${base}-${slug(b.c)}-${k}`;
    usados.add(s);
    paginaDe.set(b.i, `/bibliotecas/${ps}/${s}/`);
  });
});

// ---------- «Salas de estudio en <capital>» ----------
// Una página por capital de provincia (y Santiago y Mérida) con 5 o más bibliotecas universitarias, públicas o grandes
// (campo t de los datos) y al menos una con horario verificado con fuente y fecha. Lo propio de la página (no está en
// la de la localidad): ranking de las de horario verificado por horas de apertura a la semana, cierre entre semana,
// sábado y domingo; listas separadas de universitarias y públicas con el acceso de cada tipo; ampliaciones de horario
// por exámenes de temporada-examenes.js (solo las vigentes, con su fuente); y FAQ calculadas con esos datos.
// Las «otra» (sin clasificar: de barrio, especializadas…) no se listan; se enlaza a la página de la ciudad.
const MIN_SALAS = 5; // con menos, la página repetiría la de la ciudad
const EXAMENES = (ventanaEx.TEMPORADA_EXAMENES || []).filter((e) => e.f && e.fv && e.desde && e.hasta && e.hasta >= HOY);
const paraEstudiar = (b) => b.t === "universidad" || b.t === "publica" || b.t === "mayor";
const aMin = (hm) => (hm === "00:00" ? 0 : +hm.slice(0, 2) * 60 + +hm.slice(3));
// Horas de apertura a la semana según el horario de invierno verificado (cierre «00:00» = medianoche).
const horasSemana = (b) => Math.round(DIAS.reduce((s, d) => s + (b.h.inv[d] || []).reduce((t, r) => t + ((r[1] === "00:00" ? 1440 : aMin(r[1])) - aMin(r[0])), 0), 0) / 6) / 10;
const horasTexto = (h) => `${String(h).replace(".", ",")} h`;
const salas = []; // { p, ciudad, ruta, lista (todas las de la ciudad), est (para estudiar), ver (verificadas) }
const salasDeLoc = new Map(); // "<provincia>|<localidad>" → entrada de salas
const salasDeProv = new Map(); // provincia → [entradas]
provincias.forEach((p) => {
  const ps = slug(p), alias = CAPITALES[ps] || [], grupos = {};
  porProv[p].filter(enCapital).forEach((b) => {
    const sc = slug(b.c), clave = sc === "santiago-de-compostela" || sc === "merida" ? sc : alias[0];
    (grupos[clave] = grupos[clave] || []).push(b);
  });
  Object.keys(grupos).forEach((clave) => {
    const lista = grupos[clave], est = lista.filter(paraEstudiar), ver = lista.filter(verificado);
    if (est.length < MIN_SALAS || !ver.length) return;
    const n = {}; lista.forEach((b) => (n[b.c] = (n[b.c] || 0) + 1));
    const ciudad = Object.keys(n).sort((a, b) => n[b] - n[a] || a.localeCompare(b, "es"))[0];
    const nLoc = porProv[p].filter((b) => b.c === ciudad).length;
    const ruta = tieneLocPagina(p, ciudad, nLoc) ? `/bibliotecas/${ps}/${slug(ciudad)}/${SALAS_SLUG}/` : `/bibliotecas/${ps}/${SALAS_SLUG}/`;
    if (salas.some((x) => x.ruta === ruta)) return;
    const s = { p, ciudad, ruta, lista, est, ver, conLoc: ruta.split("/").length > 5 };
    salas.push(s);
    Object.keys(n).forEach((c) => salasDeLoc.set(p + "|" + c, s));
    (salasDeProv[p] = salasDeProv[p] || []).push(s);
  });
});
const navSalas = (l) => (l && l.length ? `<nav class="temas" aria-label="Para estudiar"><span>Para estudiar:</span>${l.map((s) =>
  `<a href="${s.ruta}">Salas de estudio en ${esc(s.ciudad)} <small>${s.est.length}</small></a>`).join("")}</nav>` : "");

// ---------- «Bibliotecas de la <Universidad>» ----------
// Los datos no traen un campo de titularidad, así que la universidad se deduce con reglas explícitas y conservadoras:
//   1. el dominio de su web (`web`) es el de la universidad (host igual o subdominio: crai.ub.edu → ub.edu; url.edu no), o
//   2. el nombre la cita de forma inequívoca (nombre oficial o sigla con límites de palabra: «UCM», «Universidad Complutense»);
//   y además está en una de las provincias donde esa universidad tiene campus. Si una biblioteca casa con dos universidades,
//   o solo casa por la web siendo pública municipal (t: "publica"), se queda fuera: mejor no listarla que meterla en otra.
//   Los hospitales «universitarios» solo entran si su web es de la universidad. Nombres sin pista («Biblioteca de la
//   Facultad de Educación» sin web) no entran aunque estén en la ciudad de la universidad.
// Se publica solo con 3 o más bibliotecas y al menos una con horario verificado con fuente y fecha.
const UNIS_SLUG = "universidades", MIN_UNI = 3;
const UNIVERSIDADES = [
  { sigla: "UCM", nombre: "Universidad Complutense de Madrid", dom: ["ucm.es"], re: /\bUCM\b|Universidad Complutense|\bComplutense\b/, provs: ["Madrid"] },
  { sigla: "UAM", nombre: "Universidad Autónoma de Madrid", dom: ["uam.es"], re: /\bUAM\b|Universidad Aut[oó]noma de Madrid/, provs: ["Madrid"] },
  { sigla: "UC3M", nombre: "Universidad Carlos III de Madrid", dom: ["uc3m.es"], re: /\bUC3M\b|Universidad Carlos III/, provs: ["Madrid"] },
  { sigla: "UPM", nombre: "Universidad Politécnica de Madrid", dom: ["upm.es"], re: /\bUPM\b|Universidad Polit[eé]cnica de Madrid/, provs: ["Madrid"] },
  { sigla: "URJC", nombre: "Universidad Rey Juan Carlos", dom: ["urjc.es"], re: /\bURJC\b|Universidad Rey Juan Carlos/, provs: ["Madrid"] },
  { sigla: "UAH", nombre: "Universidad de Alcalá", dom: ["uah.es"], re: /\bUAH\b|Universidad de Alcal[aá]/, provs: ["Madrid", "Guadalajara"] },
  { sigla: "UB", nombre: "Universitat de Barcelona", dom: ["ub.edu"], re: /\bUB\b|Universitat de Barcelona|Universidad de Barcelona/, provs: ["Barcelona"] },
  { sigla: "UPC", nombre: "Universitat Politècnica de Catalunya", dom: ["upc.edu"], re: /\bUPC\b|Universitat Polit[eè]cnica de Catalunya/, provs: ["Barcelona"] },
  { sigla: "UAB", nombre: "Universitat Autònoma de Barcelona", dom: ["uab.cat", "uab.es"], re: /\bUAB\b|Universitat Aut[oò]noma de Barcelona/, provs: ["Barcelona"] },
  { sigla: "UV", nombre: "Universitat de València", dom: ["uv.es"], re: /Universitat de Val[eè]ncia|Universidad de Valencia/, provs: ["Valencia"] },
  { sigla: "UPV", nombre: "Universitat Politècnica de València", dom: ["upv.es"], re: /\bUPV\b(?!\s*\/\s*EHU)|Universitat Polit[eè]cnica de Val[eè]ncia|Universidad Polit[eé]cnica de Valencia/, provs: ["Valencia", "Alicante"] },
  { sigla: "UA", nombre: "Universidad de Alicante", dom: ["ua.es"], re: /Universidad de Alicante|Universitat d'Alacant/, provs: ["Alicante"] },
  { sigla: "US", nombre: "Universidad de Sevilla", dom: ["us.es"], re: /Universidad de Sevilla/, provs: ["Sevilla"] },
  { sigla: "UGR", nombre: "Universidad de Granada", dom: ["ugr.es"], re: /\bUGR\b|Universidad de Granada/, provs: ["Granada"] },
  { sigla: "UMA", nombre: "Universidad de Málaga", dom: ["uma.es"], re: /\bUMA\b|Universidad de M[aá]laga/, provs: ["Málaga"] },
  { sigla: "USAL", nombre: "Universidad de Salamanca", dom: ["usal.es"], re: /\bUSAL\b|Universidad de Salamanca/, provs: ["Salamanca", "Ávila", "Zamora"] },
  { sigla: "UNIZAR", nombre: "Universidad de Zaragoza", dom: ["unizar.es"], re: /\bUNIZAR\b|Universidad de Zaragoza/, provs: ["Zaragoza", "Huesca", "Teruel"] },
  { sigla: "UPV/EHU", nombre: "Universidad del País Vasco", dom: ["ehu.es", "ehu.eus"], re: /UPV\s*\/\s*EHU|\bEHU\b|Universidad del Pa[ií]s Vasco|Euskal Herriko Unibertsitatea/, provs: ["Bizkaia", "Gipuzkoa", "Álava"] },
  { sigla: "Uniovi", nombre: "Universidad de Oviedo", dom: ["uniovi.es"], re: /Universidad de Oviedo|\bBUO\b/, provs: ["Asturias"] },
  { sigla: "USC", nombre: "Universidade de Santiago de Compostela", dom: ["usc.es", "usc.gal"], re: /\bUSC\b|Universidade de Santiago|Universidad de Santiago de Compostela/, provs: ["A Coruña", "Lugo"] },
  { sigla: "UDC", nombre: "Universidade da Coruña", dom: ["udc.es", "udc.gal"], re: /\bUDC\b|Universidade da Coruña/, provs: ["A Coruña"] },
  { sigla: "UM", nombre: "Universidad de Murcia", dom: ["um.es"], re: /Universidad de Murcia/, provs: ["Murcia"] },
  { sigla: "UNAV", nombre: "Universidad de Navarra", dom: ["unav.edu", "unav.es"], re: /\bUNAV\b|Universidad de Navarra/, provs: ["Navarra"] },
  { sigla: "UPNA", nombre: "Universidad Pública de Navarra", dom: ["unavarra.es"], re: /\bUPNA\b|Universidad P[uú]blica de Navarra/, provs: ["Navarra"] },
];
UNIVERSIDADES.forEach((u) => { u.slug = slug(u.nombre); u.lista = []; });
const hostDe = (web) => { const m = String(web || "").match(/^(?:https?:\/\/)?([^/?#:]+)/i); return m ? m[1].toLowerCase() : ""; };
const uniDe = new Map(); // índice de la biblioteca → universidad (solo las que casan con una sola)
const uniDudosas = [];
todas.forEach((b) => {
  const host = hostDe(b.web);
  const casa = UNIVERSIDADES.filter((u) => u.provs.includes(b.p)).map((u) => {
    const porWeb = u.dom.some((d) => host === d || host.endsWith("." + d)), porNombre = u.re.test(b.n);
    if (!porWeb && !porNombre) return null;
    if (!porNombre && b.t === "publica") return null; // municipal con web de la universidad: dudosa
    if (!porWeb && /Hospital/i.test(b.n)) return null;
    return u;
  }).filter(Boolean);
  if (casa.length === 1) { uniDe.set(b.i, casa[0]); casa[0].lista.push(b); } else if (casa.length > 1) uniDudosas.push(b.n);
});
const universidades = UNIVERSIDADES.filter((u) => u.lista.length >= MIN_UNI && u.lista.some(verificado))
  .sort((a, b) => b.lista.length - a.lista.length || a.nombre.localeCompare(b.nombre, "es"));
universidades.forEach((u) => { u.ruta = `/bibliotecas/${UNIS_SLUG}/${u.slug}/`; u.ver = u.lista.filter(verificado); });
const paginaUni = (b) => { const u = uniDe.get(b.i); return u && u.ruta ? u : null; };
// «Universidades: UCM 22 · UAM 5…» en provincia y localidad (las que tienen alguna biblioteca allí).
function navUniversidades(filtro) {
  const l = universidades.map((u) => ({ u, n: u.lista.filter(filtro).length })).filter((x) => x.n);
  return l.length ? `<nav class="temas" aria-label="Por universidad"><span>Universidades:</span>${l.map(({ u, n }) =>
    `<a href="${u.ruta}" title="Bibliotecas de la ${esc(u.nombre)}">${esc(u.sigla)} <small>${n}</small></a>`).join("")}</nav>` : "";
}

// ---------- «Bibliotecas en exámenes» (datos; las páginas se escriben más abajo) ----------
// /bibliotecas/examenes/ (índice) y /bibliotecas/examenes/<ciudad>/: una por ciudad con alguna entrada VIGENTE de
// temporada-examenes.js (EXAMENES: con fuente f, fecha de comprobación fv, desde y hasta, y hasta ≥ hoy). Sin entradas
// vigentes en una ciudad no hay página; sin ninguna, tampoco índice ni enlaces. Solo se publica lo que dice la entrada
// (espacio, periodo, horario, nota, fuente y fecha); la biblioteca del mapa se enlaza si `bib` casa con UN nombre exacto.
const EX_SLUG = "examenes", EX_RUTA = `/bibliotecas/${EX_SLUG}/`;
// Curso académico de una fecha (de agosto a julio): 2026-12-01 → «2026-27».
const cursoDe = (iso) => { const y = +iso.slice(0, 4), a = +iso.slice(5, 7) >= 8 ? y : y - 1; return `${a}-${String((a + 1) % 100).padStart(2, "0")}`; };
const cursosTexto = (l) => enumeraSimple([...new Set(l.map((x) => cursoDe(x.e.desde)))].sort());
const enumeraSimple = (l) => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " y " + l[l.length - 1]);
// 24 horas: si `semana` da 00:00–24:00 todos los días o el horario de la fuente lo dice.
const es24h = (e) => (!!e.semana && DIAS.every((d) => (e.semana[d] || []).some((r) => r[0] === "00:00" && r[1] === "24:00"))) || /\b24 horas\b/i.test(e.horario || "");
const exCiudades = []; // { k, ciudad, p, slug, ruta, entradas: [{ e, b, uni, h24 }], locs, h24, curso, fv }
EXAMENES.forEach((e) => {
  const k = slug(e.provincia) + "|" + slug(e.ciudad);
  let g = exCiudades.find((x) => x.k === k);
  if (!g) exCiudades.push((g = { k, ciudad: e.ciudad, p: e.provincia, entradas: [], locs: new Set([e.provincia + "|" + e.ciudad]) }));
  const b = bibDeEntrada(e);
  if (b) g.locs.add(b.p + "|" + b.c);
  const us = b && uniDe.get(b.i) ? [uniDe.get(b.i)] : UNIVERSIDADES.filter((u) => u.provs.includes(e.provincia) && u.re.test(e.espacio));
  g.entradas.push({ e, b, uni: us.length === 1 ? us[0] : null, h24: es24h(e) });
});
exCiudades.forEach((g) => {
  const s = slug(g.ciudad), repetida = exCiudades.some((o) => o !== g && slug(o.ciudad) === s);
  g.slug = repetida ? `${s}-${slug(g.p)}` : s;
  g.ruta = `${EX_RUTA}${g.slug}/`;
  g.entradas.sort((a, b) => a.e.desde.localeCompare(b.e.desde) || a.e.espacio.localeCompare(b.e.espacio, "es"));
  g.h24 = g.entradas.some((x) => x.h24);
  g.curso = cursosTexto(g.entradas);
  g.fv = g.entradas.map((x) => x.e.fv).sort().pop();
  // Su página de salas de estudio: la de la misma ciudad o la de la localidad de alguna de sus bibliotecas.
  g.salas = salas.find((s2) => slug(s2.p) === slug(g.p) && slug(s2.ciudad) === s) ||
    g.entradas.map((x) => x.b && salasDeLoc.get(x.b.p + "|" + x.b.c)).find(Boolean) || null;
});
exCiudades.sort((a, b) => b.entradas.length - a.entradas.length || a.ciudad.localeCompare(b.ciudad, "es"));
// «Exámenes: Horario ampliado en Madrid 2 · Todas las ciudades» en provincias, localidades y salas de estudio. Si el lugar
// no tiene página de exámenes, solo el enlace al índice (que existe si hay alguna entrada vigente).
function navExamenes(l) {
  if (!exCiudades.length) return "";
  return `<nav class="temas" aria-label="Temporada de exámenes"><span>Exámenes:</span>${l.map((g) =>
    `<a href="${g.ruta}">${g.h24 ? "24 h y horario ampliado" : "Horario ampliado"} en ${esc(g.ciudad)} <small>${g.entradas.length}</small></a>`).join("")}` +
    `<a href="${EX_RUTA}">${l.length ? "Todas las ciudades" : "Bibliotecas 24 h y horario ampliado en exámenes"}</a></nav>`;
}
const exDeProv = (p) => exCiudades.filter((g) => g.p === p);
const exDeLoc = (p, c) => exCiudades.filter((g) => g.locs.has(p + "|" + c));

// ---------- Ficha: horario de verano y de exámenes (con fuente) y sus horarios especiales en JSON-LD ----------
// Entradas vigentes de exámenes de cada biblioteca del mapa (solo si `bib` casa con una): índice → [{ e, g }].
const fechasFv = (l) => { const f = [...new Set(l.map((x) => x.e.fv))].sort(); return f.length === 1 ? `el ${fechaEs(f[0])}` : `entre el ${fechaEs(f[0])} y el ${fechaEs(f[f.length - 1])}`; };
const conPunto = (s) => (/[.!?]$/.test(s) ? s : s + ".");
const exDeBib = new Map();
exCiudades.forEach((g) => g.entradas.forEach((x) => { if (x.b) (exDeBib.get(x.b.i) || exDeBib.set(x.b.i, []).get(x.b.i)).push({ e: x.e, g }); }));
// Verano verificado (con fuente y fecha del horario, y periodo h.vd/h.vh); puede estar cerrada todo el verano.
const tieneVerano = (b) => verificado(b) && !!b.h.ver && MMDD.test(b.h.vd || "") && MMDD.test(b.h.vh || "");
// Periodo de verano en curso o el siguiente, en AAAA-MM-DD (también si cruza el año: 12-20 → 01-10).
function periodoVerano(b) {
  const y = +HOY.slice(0, 4), md = HOY.slice(5), vd = b.h.vd, vh = b.h.vh;
  if (vd <= vh) { const a = md > vh ? y + 1 : y; return { desde: `${a}-${vd}`, hasta: `${a}-${vh}` }; }
  return md <= vh ? { desde: `${y - 1}-${vd}`, hasta: `${y}-${vh}` } : { desde: `${y}-${vd}`, hasta: `${y + 1}-${vh}` };
}
const ohs = (o) => ({ "@type": "OpeningHoursSpecification", ...o });
// Una semana ({"L":[[…]],…}) válida entre dos fechas. Día sin franjas = cerrado (opens = closes = 00:00, como pide Google),
// salvo los días que la fuente deja «sin confirmar» (`saltar`), que no se publican.
const semanaLD = (sem, desde, hasta, saltar) => DIAS.flatMap((d, k) => (saltar && saltar(d) && !(sem[d] || []).length ? []
  : ((sem[d] || []).length ? sem[d] : [["00:00", "00:00"]]).map((r) => ohs({ dayOfWeek: DIAS_SCHEMA[k], opens: r[0], closes: r[1] === "24:00" ? "23:59" : r[1], validFrom: desde, validThrough: hasta }))));
// Periodo de exámenes con la semana entera (`semana`), días sueltos (`dias`) y cierres (`cerrado`): se resuelve día a día
// (cierre > día suelto > semana) y se agrupan los días seguidos con el mismo horario en un tramo validFrom–validThrough,
// para que no haya tramos que se pisen (Google no dice cuál gana si se solapan).
function examenLD(e) {
  const tramos = [], dia = new Date(e.desde + "T12:00:00Z"), fin = new Date(e.hasta + "T12:00:00Z");
  const cerrado = (f) => (e.cerrado || []).some(([a, z]) => f >= a && f <= z);
  for (; dia <= fin; dia.setUTCDate(dia.getUTCDate() + 1)) {
    const f = dia.toISOString().slice(0, 10);
    const h = cerrado(f) ? [] : (e.dias && e.dias[f]) || e.semana[DIAS[(dia.getUTCDay() + 6) % 7]] || [];
    const k = JSON.stringify(h), u = tramos[tramos.length - 1];
    if (u && u.k === k) u.hasta = f; else tramos.push({ k, h, desde: f, hasta: f });
  }
  return tramos.flatMap((t) => (t.h.length ? t.h : [["00:00", "00:00"]]).map((r) =>
    ohs({ opens: r[0], closes: r[1] === "24:00" ? "23:59" : r[1], validFrom: t.desde, validThrough: t.hasta })));
}
// specialOpeningHoursSpecification de la ficha: el verano verificado y los periodos de exámenes que dan la semana entera.
// Las entradas de exámenes solo con texto (sin `semana`) no van al JSON-LD.
function horariosEspecialesLD(b) {
  const l = [];
  if (tieneVerano(b)) { const v = periodoVerano(b); l.push(...semanaLD(b.h.ver, v.desde, v.hasta, (d) => sinConfirmar(b, d))); }
  (exDeBib.get(b.i) || []).forEach(({ e }) => { if (e.semana) l.push(...examenLD(e)); });
  return l;
}

const DIAS_LARGOS = ["lunes","martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const distKm = (a, b) => { const R = 6371, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
const distTexto = (km) => (km < 1 ? `${Math.max(50, Math.round(km * 20) * 50)} m` : `${km.toFixed(1).replace(".", ",")} km`);
// Hora de cierre de un día (la de su última franja); «00:00» es medianoche.
const cierreDia = (b, d) => { const l = b.h.inv[d] || []; return l.length ? quitaCero(l[l.length - 1][1]).replace(/^0:00$/, "00:00 (medianoche)") : (sinConfirmar(b, d) ? "?" : ""); };
// Si la nota de la fuente dice «Sábados sin confirmar», ese día no se da por cerrado.
const RAIZ_DIA = ["lunes", "martes", "mi[eé]rcoles", "jueves", "viernes", "s[aá]bados?", "domingos?"];
const sinConfirmar = (b, d) => !(b.h.inv[d] || []).length && !!b.h.nota && new RegExp(`${RAIZ_DIA[DIAS.indexOf(d)]}[^.]*sin confirmar`, "i").test(b.h.nota);
const laBib = (n) => (/^Biblioteca\b/.test(n) ? "la " + n : n);
function rangoDias(desde, hasta) {
  if (desde === hasta) return `el ${DIAS_LARGOS[desde]}`;
  if (hasta === desde + 1) return `el ${DIAS_LARGOS[desde]} y el ${DIAS_LARGOS[hasta]}`;
  return `de ${DIAS_LARGOS[desde]} a ${DIAS_LARGOS[hasta]}`;
}
function textoCierre(b) {
  const g = [];
  DIAS.forEach((d, k) => { const c = cierreDia(b, d), u = g[g.length - 1]; if (u && u.c === c) u.hasta = k; else g.push({ desde: k, hasta: k, c }); });
  return g.map((x) => `${rangoDias(x.desde, x.hasta)} ${x.c === "?" ? "no está confirmado" : x.c ? `cierra a las ${x.c}` : "está cerrada"}`).join("; ");
}
function faqBiblioteca(b) {
  const q = [];
  if (verificado(b)) {
  const segun = `Según su horario verificado en la web oficial el ${fechaEs(b.h.fv)}`;
  const nota = b.h.nota ? ` Aviso de la fuente: ${b.h.nota}` : "";
  const dom = b.h.inv.D || [];
  q.push(
    [`¿Abre los domingos ${laBib(b.n)}?`, dom.length ? `Sí. ${segun}, los domingos abre de ${franjas(dom)}.${nota} Comprueba festivos y verano en su web.`
      : sinConfirmar(b, "D") ? `No está confirmado: la fuente oficial no da horario de domingo.${nota}` : `No. ${segun}, los domingos está cerrada.${nota}`],
    [`¿A qué hora cierra ${laBib(b.n)}?`, `${segun}: ${textoCierre(b)}.${nota} ${tieneVerano(b) ? "En festivos" : "En verano, festivos"} y época de exámenes puede cambiar.`]);
  if (tieneVerano(b)) {
    const abre = DIAS.filter((d) => (b.h.ver[d] || []).length);
    q.push([`¿Qué horario tiene ${laBib(b.n)} en verano?`, `${segun}, del ${fechaDM(b.h.vd)} al ${fechaDM(b.h.vh)} ${abre.length
      ? `abre así: ${horarioTexto(b.h.ver, (d) => (sinConfirmar(b, d) ? "sin confirmar" : "cerrado")).replace(/ · /g, "; ")}` : "está cerrada"}.${nota}`]);
  }
  }
  const ex = exDeBib.get(b.i) || [];
  if (ex.length) q.push([`¿Amplía su horario ${laBib(b.n)} en época de exámenes?`, ex.map(({ e }) =>
    `Del ${fechaEs(e.desde)} al ${fechaEs(e.hasta)}: ${e.horario}.${e.nota ? " " + conPunto(e.nota) : ""}`).join(" ") +
    ` Fuente oficial: ${enumera([...new Set(ex.map(({ e }) => hostDe(e.f).replace(/^www\./, "")))])}, comprobada ${fechasFv(ex)}.`]);
  if (!q.length) return null;
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: q.map(([p, r]) => ({ "@type": "Question", name: p, acceptedAnswer: { "@type": "Answer", text: r } })) };
  return { html: `<section class="faq"><h2>Preguntas frecuentes</h2>${q.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join("")}</section>`, ld };
}
function tablaHorario(b) {
  const filas = DIAS.map((d, k) => `<tr><th scope="row">${cap(DIAS_LARGOS[k])}</th><td>${franjas(b.h.inv[d]) || (sinConfirmar(b, d) ? "Sin confirmar" : "Cerrada")}</td></tr>`).join("");
  const ver = tieneVerano(b) ? `<table class="horario" style="margin-top:16px"><caption>Horario de verano (del ${fechaDM(b.h.vd)} al ${fechaDM(b.h.vh)})</caption><tbody>${DIAS.map((d, k) =>
    `<tr><th scope="row">${cap(DIAS_LARGOS[k])}</th><td>${franjas(b.h.ver[d]) || (sinConfirmar(b, d) ? "Sin confirmar" : "Cerrada")}</td></tr>`).join("")}</tbody></table>` : "";
  return `<table class="horario"><caption>Horario de invierno</caption><tbody>${filas}</tbody></table>${ver}
<p class="fuente">Verificado el ${esc(fechaEs(b.h.fv))} en la <a href="${esc(b.h.f)}" rel="nofollow noopener" target="_blank">fuente oficial</a>. ${ver ? "En festivos" : "En verano, festivos"} y época de exámenes puede cambiar: confírmalo antes de ir.</p>${b.h.nota ? `<p class="nota">⚠️ ${esc(b.h.nota)}</p>` : ""}`;
}
// «Cerca, con horario verificado» en la ficha: hasta 4 bibliotecas con horario verificado (h.f + h.fv; Navarra con
// fuenteHorario + verificadoHorario) y ficha propia a ≤ 15 km, de cualquier localidad o provincia, que no salgan ya en
// «Otras bibliotecas en <localidad>». Responde a «¿y cuál de aquí al lado sé seguro que abre?» y enlaza fichas de
// municipios vecinos (Alcorcón ↔ Móstoles, Burjassot ↔ Valencia), que antes solo se enlazaban dentro de su localidad.
const RADIO_VERIF_KM = 15, MAX_VERIF_CERCA = 4;
let conHorarioYFicha = null, nFichasVerifCerca = 0, nEnlacesVerifCerca = 0, nLocsVerifCerca = 0, nEnlacesLocVerifCerca = 0;
// `b`: una biblioteca o cualquier punto { lat, lon } (el centroide de una localidad, que no tiene `i`).
function cercanasVerificadas(b, ya) {
  conHorarioYFicha = conHorarioYFicha || todas.filter((o) => verificado(o) && paginaDe.has(o.i));
  return conHorarioYFicha.filter((o) => o.i !== b.i && !ya.has(o.i)).map((o) => ({ o, d: distKm(b, o) }))
    .filter((x) => x.d <= RADIO_VERIF_KM).sort((x, y) => x.d - y.d || x.o.i - y.o.i).slice(0, MAX_VERIF_CERCA);
}
// Marcado de la sección, común a fichas y páginas de localidad. `c`: localidad de referencia (solo se nombra la
// localidad de las que son de otra); `intro`: HTML ya escapado o "".
function seccionVerifCerca(lista, c, intro) {
  return lista.length ? `<section class="cerca" aria-labelledby="t-verif"><h2 id="t-verif">Cerca, con horario verificado</h2>${intro ? `<p class="intro">${intro}</p>` : ""}<ul>${lista.map(({ o, d }) =>
    `<li><a href="${paginaDe.get(o.i)}">${esc(o.n)}</a> <small>${distTexto(d)}${o.c !== c ? ` · ${esc(o.c)}` : ""} · ${esc(resumenVerif(o))} · verificado el ${esc(fechaEs(o.h.fv))}</small></li>`).join("")}</ul></section>` : "";
}
// «Entre semana hasta las 21:00 · sábado 9:00–14:00 · domingo cerrada» (horario de invierno; «sin confirmar» si la fuente no da el día).
function resumenVerif(o) {
  const c = cierreMasTarde(o), dia = (d) => franjas(o.h.inv[d]) || (sinConfirmar(o, d) ? "sin confirmar" : "cerrada");
  return `${!c ? "entre semana cerrada" : c === "24:00" ? "entre semana hasta medianoche" : `entre semana hasta las ${quitaCero(c)}`} · sábado ${dia("S")} · domingo ${dia("D")}`;
}
// ---------- Título (≤ 65) y descripción (≤ 160) de la ficha de biblioteca ----------
// Google corta hacia los 60-65 / 155-160 caracteres. El título empieza por lo que se busca: nombre y localidad, y
// «horario» si cabe; la marca solo si sobra sitio. Los nombres largos se abrevian con sentido (`formasNombre`) y, si
// ni así caben, se cortan por palabra con «…». La URL y el h1 no cambian: llevan el nombre completo.
const normaTexto = (s) => " " + slug(s).replace(/-/g, " ") + " ";
const nombraLoc = (n, c) => normaTexto(n).includes(normaTexto(c)); // «Biblioteca Pública de Santiago de Compostela»
const limpiaNombre = (s) => s.replace(/\s+/g, " ").replace(/^[\s\-·.,_:]+|[\s\-·.,_:]+$/g, "").trim();
const escapaRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Formas del nombre, de la más completa a la más corta; cada paso se suma al anterior.
function formasNombre(b) {
  const f = [];
  const add = (s) => { s = limpiaNombre(s); if (s && !f.includes(s)) f.push(s); return s; };
  let n = add(b.n);
  n = n.replace(/ _ /g, " - ");
  // 1. Nombres con dos rótulos («Biblioteca de Málaga. Biblioteca Pública del Estado…», «Casa de la Lectura - Biblioteca…»,
  //    «Biblioteca de la Universidad de Zaragoza Biblioteca de la Facultad de…»): el último.
  const tramos = n.split(/(?=\bBiblioteca\b)/);
  if (tramos.length > 1 && /^Biblioteca\b/.test(tramos[tramos.length - 1])) n = add(tramos[tramos.length - 1]);
  // 2. La universidad por su sigla: «Biblioteca de Filosofía - Universidad Complutense de Madrid» → «… - UCM».
  const u = uniDe.get(b.i);
  if (u) {
    const s = u.sigla, se = escapaRe(s);
    n = add(n.replace(new RegExp(`(de la |de l'|da |de )?${escapaRe(u.nombre)}`, "i"), s)
      .replace(new RegExp(u.re.source.split("|").filter((x) => !/\\b/.test(x) || !x.includes(s)).join("|") || "(?!)", "g"), s)
      .replace(new RegExp(`\\b${se}\\b\\s*\\(${se}\\)`, "g"), s).replace(new RegExp(`\\b(${se}) Madrid\\b`), "$1"));
  }
  // 3. «Biblioteca de la Facultad de X» / «Biblioteca da Facultade de X» → «Biblioteca de X»; escuelas técnicas por su sigla.
  n = add(n.replace(/^(Biblioteca(?:-Mediateca)?),? (?:de la |de les |das |da |del |de )?Faculta(?:d|de|des|t|ts) (?:de |da |do |d')?/i,
    (m, p1) => p1 + (/d'$/.test(m) ? " d'" : " de "))
    .replace(/Escuela T[eé]cnica Superior de Ingenier(?:os|[ií]a)/i, "ETSI").replace(/Escuela Polit[eé]cnica Superior/i, "EPS"));
  // 4. Sin «Pública», «Municipal» ni «Central» delante de un nombre propio: «Biblioteca Municipal Central Federico García
  //    Lorca» → «Biblioteca Federico García Lorca» (no se toca «Biblioteca Pública del Estado» ni «Biblioteca Municipal de X»).
  n = add(n.replace(/^Biblioteca P[uú]blica Municipal\b/i, "Biblioteca Municipal"));
  n = add(n.replace(/^Biblioteca (?:P[uú]blica |Municipal |Central )+(?=\p{Lu}\p{Ll})/u, "Biblioteca "));
  // 5. Sin el último añadido entre paréntesis o tras « - », «. » o « · » (sede, planta o la localidad, que el título lleva aparte).
  for (let k = 0; k < 2; k++) {
    const m = n.match(/^(.{12,}?)(?:\s+[-·_]\s+[^-·_.()]+|(?<=\p{L}{4})\.\s+[^-·_.()]+|\s*\([^()]+\))$/u);
    if (!m) break;
    n = add(m[1]);
  }
  return f;
}
// Corta por palabra a ≤ max caracteres y añade «…» (nunca a mitad de palabra).
function cortaPalabra(s, max) {
  if (s.length <= max) return s;
  const m = s.slice(0, max).match(/^(.*\S)\s+\S*$/);
  return limpiaNombre(m ? m[1] : s.slice(0, max - 1)) + "…";
}
// Forma corta y conocida de localidades largas (solo para el título, si con la completa no cabe «horario»).
// (Nunca una que sea otro municipio: «El Escorial» no es San Lorenzo de El Escorial.)
const LOC_CORTA = { "Santiago de Compostela": "Santiago", "Las Palmas de Gran Canaria": "Las Palmas", "l'Hospitalet de Llobregat": "L'Hospitalet" };
const locCorta = (c) => LOC_CORTA[c] || c.split(/\s*\/\s*/)[0];
// Dos sedes con el mismo nombre en la misma localidad: la segunda lleva la dirección en lugar de la localidad.
const sedesVistas = new Set();
function tituloBiblioteca(b) {
  const clave = b.n + "|" + b.c, calle = b.dir ? b.dir.split(",")[0].trim() : "";
  // La calle solo si dice algo más que el código postal y la localidad.
  const sede = sedesVistas.has(clave) && calle && normaTexto(calle.replace(/\d+/g, "")).trim() !== normaTexto(b.c).trim() ? calle : "";
  sedesVistas.add(clave);
  const formas = formasNombre(b), locs = [...new Set([b.c, locCorta(b.c)])];
  // «Nombre, Localidad» (o solo el nombre si ya la nombra; la sede en vez de la localidad si hace falta distinguir).
  const base = (n, c) => (sede ? `${n}, ${sede}` : nombraLoc(n, b.c) || nombraLoc(n, c) ? n : `${n}, ${c}`);
  const cand = [];
  for (const c of locs) for (const n of formas) cand.push(`${base(n, c)}: horario y dirección${MARCA}`, `${base(n, c)}: horario y dirección`, `${base(n, c)}: horario${MARCA}`, `${base(n, c)}: horario`);
  for (const c of locs) for (const n of formas) cand.push(base(n, c) + MARCA, base(n, c));
  // Último recurso: la forma más corta, cortada por palabra con «…».
  const n = formas[formas.length - 1], c = locs[locs.length - 1], resto = sede || (nombraLoc(n, b.c) || nombraLoc(n, c) ? "" : c);
  const cola = (resto ? `, ${resto}` : "") + ": horario";
  cand.push(cortaPalabra(n, MAX_TIT - cola.length) + cola, cortaPalabra(n, MAX_TIT - resto.length - 2) + (resto ? `, ${resto}` : ""));
  const t = cand.find((x) => x.length <= MAX_TIT && !titulosUsados.has(x))
    || cortaPalabra(`${n}, ${b.c}, ${b.dir || b.i}`, MAX_TIT);
  titulosUsados.add(t);
  return t;
}
const TIPO_DESC = { mayor: "gran biblioteca", universidad: "biblioteca universitaria", publica: "biblioteca pública", otra: "biblioteca" };
// Descripción: nombre, tipo y localidad; horario verificado (o «sin confirmar»), exámenes si los hay y la dirección real.
// Se prueba de la más rica a la más corta hasta caber en 160 sin repetir ninguna: primero se quitan añadidos (contacto,
// dirección) y solo después se abrevia el nombre.
function descripcionBiblioteca(b, resumenes, colaEx) {
  const formas = formasNombre(b), dir = b.dir ? `Dirección: ${b.dir.replace(/\.$/, "")}.` : "";
  const donde = `${TIPO_DESC[b.t] || "biblioteca"} en ${b.c}${b.c !== b.p && !normaTexto(b.c).includes(normaTexto(b.p)) ? ` (${b.p})` : ""}`;
  const extras = [[colaEx, dir, "Teléfono, web y bibliotecas cercanas."], [colaEx, dir, "Teléfono y web."], [colaEx, dir],
    [colaEx, "Dirección, teléfono, web y bibliotecas cercanas."], [colaEx, "Dirección, teléfono y web."], [colaEx], [dir], []];
  const cand = [];
  for (const r of resumenes) for (const n of formas) for (const e of extras) cand.push([`${n}, ${donde}.`, r, ...e].filter(Boolean).join(" "));
  const d = cand.find((x) => x.length <= MAX_DESC && !descUsadas.has(x))
    || cortaPalabra([`${formas[formas.length - 1]}, ${donde}.`, resumenes[resumenes.length - 1], dir].filter(Boolean).join(" "), MAX_DESC);
  descUsadas.add(d);
  return d;
}
function paginaBiblioteca(b) {
  const ruta = paginaDe.get(b.i), ps = slug(b.p), ok = verificado(b);
  const mismaLoc = porProv[b.p].filter((o) => o.c === b.c);
  const locConPagina = mismaLoc.length >= 3 && slug(b.c) && slug(b.c) !== ps;
  const cercanas = mismaLoc.filter((o) => o.i !== b.i).map((o) => ({ o, d: distKm(b, o) })).sort((x, y) => x.d - y.d).slice(0, 6);
  const tipo = TIPO[b.t] || "Biblioteca";
  const fq = faqBiblioteca(b); // null si no hay horario verificado ni entrada de exámenes
  const ex = exDeBib.get(b.i) || [];
  const mod = [ok ? b.h.fv : ""].concat(ex.map(({ e }) => e.fv)).filter(Boolean).sort().pop();
  const especiales = horariosEspecialesLD(b);
  // Temporada de exámenes (temporada-examenes.js): periodo, horario y nota tal cual de la fuente oficial, con fecha.
  const secEx = ex.length ? `<section class="ficha" id="examenes" aria-labelledby="t-ex"><h2 id="t-ex">Horario en época de exámenes</h2>${ex.map(({ e }) =>
    `<p class="hor"><strong>Del ${esc(fechaEs(e.desde))} al ${esc(fechaEs(e.hasta))}</strong>: ${esc(e.horario)}.</p>${e.nota ? `<p class="nota">⚠️ ${esc(e.nota)}</p>` : ""}` +
    `<p class="fuente">Comprobado el ${esc(fechaEs(e.fv))} en la <a href="${esc(e.f)}" rel="nofollow noopener" target="_blank">fuente oficial</a>.</p>`).join("")}` +
    `<p><a href="${ex[0].g.ruta}">Bibliotecas con horario ampliado en exámenes en ${esc(ex[0].g.ciudad)} →</a></p></section>` : "";
  const datos = [
    b.dir ? `<dt>Dirección</dt><dd>${esc(b.dir)}</dd>` : "",
    `<dt>Localidad</dt><dd>${locConPagina ? `<a href="/bibliotecas/${ps}/${slug(b.c)}/">${esc(b.c)}</a>` : esc(b.c)} (<a href="/bibliotecas/${ps}/">${esc(b.p)}</a>)</dd>`,
    b.tel ? `<dt>Teléfono</dt><dd><a href="tel:${esc(b.tel.replace(/\s/g, ""))}">${esc(b.tel)}</a></dd>` : "",
    b.web ? `<dt>Web</dt><dd><a href="${esc(b.web)}" rel="nofollow noopener" target="_blank">${esc(b.web.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</a></dd>` : "",
    paginaUni(b) ? `<dt>Universidad</dt><dd><a href="${paginaUni(b).ruta}">Bibliotecas de la ${esc(paginaUni(b).nombre)} (${esc(paginaUni(b).sigla)})</a></dd>` : "",
  ].join("");
  const horario = ok ? tablaHorario(b)
    : `<p class="hor">🕒 Horario sin confirmar: aún no lo tenemos comprobado en una fuente oficial con fecha. Consúltalo en su web${b.tel ? " o por teléfono" : ""} antes de ir.</p>`;
  const lisCerca = cercanas.map(({ o, d }) => { const r = paginaDe.get(o.i);
    return `<li><a href="${r || enlaceApp(o)}">${esc(o.n)}</a> <small>${distTexto(d)}${verificado(o) ? " · horario verificado" : ""}${r ? "" : " · en el mapa"}</small></li>`; }).join("");
  const verifCerca = cercanasVerificadas(b, new Set(cercanas.map(({ o }) => o.i)));
  if (verifCerca.length) { nFichasVerifCerca++; nEnlacesVerifCerca += verifCerca.length; }
  const secVerif = seccionVerifCerca(verifCerca, b.c, ok ? ""
    : `El horario de esta biblioteca aún no está comprobado; el de estas, a menos de ${RADIO_VERIF_KM} km, sí (horario de invierno, en su web oficial).`);
  const migas = [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [b.p, `/bibliotecas/${ps}/`]]
    .concat(locConPagina ? [[b.c, `/bibliotecas/${ps}/${slug(b.c)}/`]] : []).concat([[b.n, ruta]]);
  const resumen = !ok ? "Horario sin confirmar." : DIAS.some((d) => sinConfirmar(b, d)) ? `Horario verificado el ${fechaEs(b.h.fv)}.` : `Horario verificado: ${horarioTexto(b.h.inv)}.`;
  const titulo = tituloBiblioteca(b);
  // Con temporada de exámenes vigente, la descripción la anuncia con su periodo (`descripcionBiblioteca`, que también
  // distingue dos sedes con el mismo nombre por su dirección y nunca repite una descripción).
  const colaEx = ex.length ? `Exámenes: horario ampliado del ${fechaEs(ex[0].e.desde).slice(0, 5)} al ${fechaEs(ex[0].e.hasta)}.` : "";
  const descripcion = descripcionBiblioteca(b, [resumen].concat(ok && !resumen.includes(" el ") ? [`Horario verificado el ${fechaEs(b.h.fv)}.`] : []), colaEx);
  const idBib = DOMINIO + ruta + "#biblioteca", idMigas = DOMINIO + ruta + "#migas", idPag = DOMINIO + ruta + "#pagina";
  // isPartOf del WebPage: la página que ya enlaza su <p class="volver"> (su localidad si tiene página; si no, su
  // provincia), con el mismo name que su CollectionPage. Es la otra mitad de su mainEntity ItemList, donde la ficha está.
  const rutaSup = locConPagina ? `/bibliotecas/${ps}/${slug(b.c)}/` : `/bibliotecas/${ps}/`;
  const parteDe = nombreLugarDe.has(rutaSup) ? { isPartOf: refPagina(nombreLugarDe.get(rutaSup), DOMINIO + rutaSup) } : {};
  if (parteDe.isPartOf) nFichasIsPartOf++;
  escribe(ruta, pagina({
    ruta, titulo, descripcion,
    h1: esc(b.n),
    intro: `<span class="tipo">${esc(tipo)}</span> en ${esc(b.c)} (${esc(b.p)}). ${ok ? `Horario comprobado en su web oficial el ${esc(fechaEs(b.h.fv))}.` : "Aún no tenemos su horario verificado."}`,
    cta: `<a class="cta" href="${enlaceApp(b)}">📍 Ver en el mapa</a>`,
    cuerpo: `<section class="ficha" aria-labelledby="t-datos"><h2 id="t-datos">Datos de contacto</h2><dl>${datos}</dl></section>
<section class="ficha" aria-labelledby="t-hor"><h2 id="t-hor">Horario</h2>${horario}</section>${secEx ? "\n" + secEx : ""}
${fq ? fq.html : ""}
${cercanas.length ? `<section class="cerca" aria-labelledby="t-cerca"><h2 id="t-cerca">Otras bibliotecas en ${esc(b.c)}</h2><ul>${lisCerca}</ul></section>` : ""}${secVerif ? "\n" + secVerif : ""}
${seccionTemasFicha(b, locConPagina)}
<p class="volver"><a href="${rutaSup}">← Todas las bibliotecas de ${esc(locConPagina ? b.c : b.p)}</a>${locConPagina ? ` · <a href="/bibliotecas/${ps}/">${esc(b.p)}</a>` : ""}</p>`,
    // Las migas llevan @id y el WebPage las enlaza con breadcrumb: su penúltimo elemento es rutaSup, el mismo isPartOf.
    migas, migasId: idMigas,
    // Library no admite dateModified: va en el WebPage que la describe (fecha = verificación del horario).
    // Horarios especiales (verano verificado y exámenes con `semana`) en specialOpeningHoursSpecification con sus fechas.
    // WebPage (@id <ficha>#pagina) y Library (@id <ficha>#biblioteca) se apuntan entre sí: about y mainEntityOfPage.
    // El FAQPage (si hay preguntas) entra en el mismo grafo: @id <ficha>#faq e isPartOf {"@id": "<ficha>#pagina"}, para
    // que no haya dos nodos de página sueltos para la misma URL. Preguntas y respuestas, sin tocar. El WebPage lo declara
    // de vuelta con hasPart {"@id": "<ficha>#faq"} (solo en las fichas con FAQ).
    ld: [{ "@context": "https://schema.org", "@id": idBib, ...libraryLD(b, DOMINIO + ruta), ...(especiales.length ? { specialOpeningHoursSpecification: especiales } : {}), mainEntityOfPage: { "@id": idPag } },
      { "@context": "https://schema.org", "@id": idPag, "@type": "WebPage", name: titulo.replace(MARCA, ""), description: descripcion, url: DOMINIO + ruta,
        inLanguage: "es-ES", ...parteDe, breadcrumb: { "@id": idMigas }, about: { "@id": idBib }, ...(fq ? { hasPart: { "@id": DOMINIO + ruta + "#faq" } } : {}), ...(mod ? { dateModified: mod } : {}) }, ...(fq ? [{ "@context": "https://schema.org", "@id": DOMINIO + ruta + "#faq", ...fq.ld, isPartOf: { "@id": idPag } }] : [])],
  }));
  if (especiales.length) nFichasEspeciales++;
  if (tieneVerano(b)) nFichasVerano++;
  if (ex.length) nFichasEx++;
  urls.push([ruta, "0.7", mod]);
}

// ---------- Títulos y descripciones de provincia y localidad ----------
// Empiezan por «Bibliotecas abiertas en <lugar>» con el recuento real (total y con horario verificado). La redacción
// varía de forma determinista (según haya horario verificado, domingo, cierre tardío… y un hash de la ruta) para que
// no sea la misma plantilla en todas; nunca se repite un título (si chocara, se prueba la siguiente variante).
// Límites: título ≤ 65 caracteres (con « | Bibliomapa» solo si cabe) y descripción ≤ 160.
const MAX_TIT = 65, MAX_DESC = 160, MARCA = " | Bibliomapa";
const titulosUsados = new Set();
let nFichasEspeciales = 0, nFichasVerano = 0, nFichasEx = 0, nFichasIsPartOf = 0; // fichas con horarios especiales en JSON-LD, con verano y con exámenes
const descUsadas = new Set(); // fichas de biblioteca y universidades: ninguna meta description repetida
const hashTexto = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h; };
const rota = (lista, semilla) => lista.map((_, k) => lista[(k + semilla) % lista.length]);
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const enumera = (l) => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " y " + l[l.length - 1]);
function cuentas(lista) {
  return { n: lista.length, v: lista.filter(verificado).length, dom: lista.filter(abreDomingo).length,
    tarde: lista.filter((b) => verificado(b) && cierraTarde(b)).length, finde: lista.filter((b) => verificado(b) && abreFinde(b)).length };
}
// Nombres de localidad que aparecen en más de una provincia (o que son a la vez nombre de provincia): llevan la provincia.
const nombresRepetidos = (() => {
  const vistos = {};
  provincias.forEach((p) => { (vistos[slug(p)] = vistos[slug(p)] || new Set()).add("prov"); });
  provincias.forEach((p) => {
    const porC = {};
    porProv[p].forEach((b) => (porC[b.c] = (porC[b.c] || 0) + 1));
    Object.keys(porC).filter((c) => tieneLocPagina(p, c, porC[c])).forEach((c) => (vistos[slug(c)] = vistos[slug(c)] || new Set()).add(p));
  });
  return new Set(Object.keys(vistos).filter((s) => vistos[s].size > 1));
})();
function tituloLugar(ruta, lugar, k) {
  const base = `Bibliotecas abiertas en ${lugar}`, { n, v, dom, tarde } = k;
  const cand = v ? [
    `${base}: ${n}, ${v} con horario verificado`,
    `${base}: ${v} con horario verificado de ${n}`,
    `${base} (${n}): ${v} con horario comprobado`,
    ...(dom ? [`${base}: ${n}, ${v} con horario y ${dom} en domingo`] : []),
    ...(tarde ? [`${base}: ${n}, ${v} con horario y ${tarde} hasta tarde`] : []),
  ] : [
    `${base}: ${n} en el mapa, horario por confirmar`,
    `${base}: ${n}, sin horario verificado aún`,
    `${base} (${n}): horarios por confirmar`,
  ];
  // Respaldo corto para nombres muy largos: siempre lleva el total y los verificados.
  const corto = v ? [`${base}: ${n}, ${v} con horario`, `${base} (${n}, ${v} verificadas)`, `${base}: ${n} (${v} verif.)`]
    : [`${base}: ${n}, horario por confirmar`, `${base} (${n}, sin horario)`, `${base}: ${n}`];
  for (const t of rota(cand, hashTexto(ruta)).concat(corto)) {
    const opciones = [t + MARCA, t].filter((x) => x.length <= MAX_TIT && !titulosUsados.has(x));
    if (opciones.length) { titulosUsados.add(opciones[0]); return { titulo: opciones[0], nombre: t }; }
  }
  // Nombre larguísimo (L'Hospitalet de Llobregat, Las Palmas de Gran Canaria…): el más corto libre, aunque pase un poco.
  const t = corto.concat(cand).filter((x) => !titulosUsados.has(x)).sort((x, y) => x.length - y.length)[0] || `${base}: ${n} (${v} verif.) · ${ruta}`;
  titulosUsados.add(t);
  return { titulo: t, nombre: t };
}
function descripcionLugar(ruta, lugar, prov, k, nLocs) {
  const s = hashTexto(ruta + "#d"), { n, v, dom, tarde, finde } = k, donde = prov ? `${lugar} (${prov})` : lugar;
  const bibs = plural(n, "biblioteca", "bibliotecas");
  const aperturas = rota([
    `${bibs} y salas de estudio en ${donde}${nLocs > 1 ? `, en ${nLocs} localidades` : ""}`,
    `Mapa de ${n === 1 ? "la biblioteca" : `las ${n} bibliotecas`} de ${donde}${nLocs > 1 ? ` (${nLocs} localidades)` : ""}`,
    `En ${donde} hay ${bibs} en Bibliomapa${nLocs > 1 ? `, repartidas en ${nLocs} localidades` : ""}`,
  ], s)[0];
  const verif = v ? rota([`${v} con horario verificado en su web oficial`, `${v} con el horario comprobado en su web oficial`], s)[0]
    : rota([`aún sin horarios verificados`, `horarios todavía por confirmar`], s)[0];
  const extras = [dom ? `${dom} ${dom === 1 ? "abre" : "abren"} el domingo` : finde ? `${finde} ${finde === 1 ? "abre" : "abren"} el fin de semana` : "",
    tarde ? `${tarde} ${tarde === 1 ? "cierra" : "cierran"} a las 21:00 o más tarde` : ""].filter(Boolean);
  const cierres = rota(["Mira cuál está abierta ahora.", "Dirección, teléfono y cómo llegar.", "Abiertas ahora en el mapa, gratis y sin registro."], s);
  const arma = (ex, cierre) => `${aperturas}: ${enumera([verif, ...ex])}.${cierre ? " " + cierre : ""}`;
  for (let e = extras.length; e >= 0; e--) for (const c of cierres.concat([""])) {
    const d = arma(extras.slice(0, e), c);
    if (d.length <= MAX_DESC) return d;
  }
  return arma([], "").slice(0, MAX_DESC - 1).replace(/\s\S*$/, "") + "…";
}
// ---------- Títulos y descripciones de las páginas temáticas ----------
// «Bibliotecas <tema> en <lugar>» al principio (lo que se busca) y, si cabe, un dato real tras los dos puntos (cuántas
// con horario verificado, «sábado y domingo»…); título ≤ 65 y nunca repetido. La descripción (≤ 160) da el recuento y un
// dato calculado del horario verificado (cuál cierra más tarde, cuántas abren cada día…), sin coletillas vacías.
const horaTexto = (c) => (c === "24:00" || c === "00:00" ? "medianoche" : quitaCero(c));
const cierreDiaTema = (b, d) => (b.h.inv[d] || []).map((r) => (r[1] === "00:00" ? "24:00" : r[1])).sort().pop() || "";
const de24Dia = (b, d) => (b.h.inv[d] || []).some((r) => r[0] === "00:00" && (r[1] === "24:00" || r[1] === "00:00"));
function tituloTema(t, lista, lugar, espana) {
  const n = lista.length, base = `Bibliotecas ${t.que} en ${lugar}`;
  const nProv = new Set(lista.map((b) => b.p)).size;
  const extras = {
    "abiertas-hoy": ["cuáles abren ahora", "horario de hoy"],
    "abiertas-fin-de-semana": [`sábado y domingo, ${n} con horario`, "sábado y domingo"],
    "abiertas-verano": [`${n} con horario de verano`],
  }[t.slug] || [];
  const todos = extras.concat(espana ? [`${n} en ${nProv} provincias`] : [], [`${n} con horario verificado`, `${n} con horario`]);
  // «sábado y domingo» o «el finde» como respaldo corto de «el fin de semana» (Las Palmas de Gran Canaria…)
  const otra = t.slug === "abiertas-fin-de-semana" ? [`Bibliotecas abiertas sábado y domingo en ${lugar}`, `Bibliotecas abiertas el finde en ${lugar}`] : [];
  const cand = todos.flatMap((x) => [`${base}: ${x}${MARCA}`, `${base}: ${x}`]).concat([base + MARCA, base], otra.flatMap((x) => [x + MARCA, x]));
  const t1 = cand.find((x) => x.length <= MAX_TIT && !titulosUsados.has(x)) || cand.filter((x) => !titulosUsados.has(x)).sort((a, b) => a.length - b.length)[0];
  titulosUsados.add(t1);
  return t1;
}
function datoTema(t, lista) {
  const unica = (l, f) => (l.length === 1 ? f(l[0]) : null);
  const masTarde = (f, dia, frase) => { // frase(hora) para varias; con una sola, su nombre
    const max = lista.map(f).filter(Boolean).sort().pop(); if (!max) return [];
    const ult = lista.filter((b) => f(b) === max);
    if (dia && ult.every((b) => de24Dia(b, dia))) return [ult.length === 1 ? `${ult[0].n} abre las 24 horas el ${dia === "S" ? "sábado" : "domingo"}.` : `${ult.length} abren las 24 horas el ${dia === "S" ? "sábado" : "domingo"}.`];
    return [unica(ult, (b) => `La que cierra más tarde${dia ? ` el ${dia === "S" ? "sábado" : "domingo"}` : ""}: ${b.n} (${horaTexto(max)}).`), frase(horaTexto(max) === "medianoche" ? "a medianoche" : `a las ${horaTexto(max)}`, ult.length)].filter(Boolean);
  };
  const cuenta = (d) => lista.filter((b) => (b.h.inv[d] || []).length).length;
  const abre = (k) => (k === 1 ? "abre" : "abren");
  switch (t.slug) {
    case "abiertas-hoy": { const lv = Math.max(...DIAS.slice(0, 5).map(cuenta)), num = (k) => (k ? k : "ninguna");
      return [`Entre semana abren ${lv === lista.length ? "todas" : lv}; el sábado, ${num(cuenta("S"))}; el domingo, ${num(cuenta("D"))}.`]; }
    case "abiertas-domingo": case "abiertas-domingo-tarde":
      return masTarde((b) => cierreDiaTema(b, "D"), "D", (h, k) => `El domingo, ${k === 1 ? "la más tardía cierra" : `las más tardías cierran`} ${h}.`);
    case "abiertas-sabado-tarde":
      return masTarde((b) => cierreDiaTema(b, "S"), "S", (h, k) => `El sábado, ${k === 1 ? "la más tardía cierra" : `las más tardías cierran`} ${h}.`);
    case "abiertas-fin-de-semana": { const s = cuenta("S"), d = cuenta("D"), n = lista.length;
      return [s === n ? (d ? `Todas abren el sábado y ${d === n ? "también todas" : d} el domingo.` : `Todas abren el sábado; el domingo, ninguna.`)
        : `El sábado ${abre(s)} ${s} y el domingo ${d || "ninguna"}.`]; }
    case "abiertas-hasta-tarde": return masTarde(cierreMasTarde, null, (h, k) => `Entre semana, ${k === 1 ? "la más tardía cierra" : `las más tardías cierran`} ${h}.`);
    case "abiertas-mediodia": {
      const pronto = lista.map(aperturaMasTemprana).sort()[0];
      return [`Sin cerrar de 14:00 a 16:00; la primera abre a las ${quitaCero(pronto)}.`, `Sin cerrar de 14:00 a 16:00 de lunes a viernes.`];
    }
    case "abiertas-temprano": {
      const resto = lista.filter((b) => !abre24h(b)), n24 = lista.length - resto.length;
      if (!resto.length) return [`${lista.length} abren las 24 horas algún día entre semana.`];
      const pronto = resto.map(aperturaMasTemprana).sort()[0], prim = resto.filter((b) => aperturaMasTemprana(b) === pronto);
      const sufijo = n24 ? ` ${n24 === 1 ? "Otra abre" : `Otras ${n24} abren`} las 24 horas.` : "";
      return [unica(prim, (b) => `La primera abre a las ${quitaCero(pronto)}: ${b.n}.${sufijo}`), `La primera abre a las ${quitaCero(pronto)}.${sufijo}`, `La primera abre a las ${quitaCero(pronto)}.`].filter(Boolean);
    }
    case "abiertas-verano": {
      const k = lista.filter((b) => DIAS.some((d) => (b.h.ver[d] || []).some((r) => r[1] > "15:00" || r[1] === "00:00"))).length;
      return [k ? `${k === lista.length ? "Todas abren" : `${k} ${abre(k)}`} por la tarde algún día de verano.` : "En verano, ninguna cierra después de las 15:00."];
    }
    default: return [];
  }
}
function descripcionTema(t, lista, donde, espana) {
  const n = lista.length, nProv = new Set(lista.map((b) => b.p)).size;
  const inicio = t.hoy
    ? `${n} bibliotecas de ${espana ? `${nProv} provincias de España` : donde} con horario comprobado en su web oficial: el de hoy y cuáles están abiertas ahora.`
    : `${n} bibliotecas ${t.que} en ${espana ? `${nProv} provincias de España` : donde}, con horario comprobado en su web oficial.`;
  const colas = [...(t.hoy ? [] : ["Dirección, teléfono y mapa con las abiertas ahora."]), "Dirección, teléfono y mapa.", ""];
  for (const dato of datoTema(t, lista).concat([""])) for (const c of colas) {
    const d = [inicio, dato, c].filter(Boolean).join(" ");
    if (d.length <= MAX_DESC) return d;
  }
  return inicio.length <= MAX_DESC ? inicio : inicio.slice(0, MAX_DESC - 1).replace(/\s\S*$/, "") + "…";
}

// Página propia (CollectionPage) con el mismo nombre y descripción que el título y la meta description. isPartOf: el
// WebSite, salvo que extra traiga otro (provincias, localidades, hubs y sus páginas: la página que enlaza su <p class="volver">).
// Lleva siempre @id <ruta>#pagina (el nodo de la página, como el WebPage de las fichas): en las que tienen FAQ es el mismo
// que les daría faqEnGrafo, y así también lo tienen las que no (el índice, salas de estudio y universidades).
const ldLugar = (ruta, nombre, descripcion, extra) => ({ "@context": "https://schema.org", "@id": DOMINIO + ruta + "#pagina", "@type": "CollectionPage", name: nombre,
  description: descripcion, url: DOMINIO + ruta, inLanguage: "es-ES", isPartOf: { "@type": "WebSite", name: "Bibliomapa", url: DOMINIO + "/" }, ...extra });

// ---------- Vecinas: provincias y localidades cercanas ----------
// Centroide = media de las coordenadas de sus bibliotecas; distancia entre centroides (km).
const centro = (l) => ({ lat: l.reduce((a, b) => a + b.lat, 0) / l.length, lon: l.reduce((a, b) => a + b.lon, 0) / l.length });
const centroProv = {};
provincias.forEach((p) => (centroProv[p] = centro(porProv[p])));
// 3-4 provincias: las 4 más cercanas, quitando la 4.ª si está mucho más lejos que la 3.ª (islas, Ceuta, Melilla).
function provinciasCercanas(p) {
  const l = provincias.filter((o) => o !== p).map((o) => ({ p: o, d: distKm(centroProv[p], centroProv[o]) })).sort((a, b) => a.d - b.d).slice(0, 4);
  return l.length === 4 && l[3].d > l[2].d * 1.5 ? l.slice(0, 3) : l;
}
const locsConPagina = []; // { p, c, n, centro }
provincias.forEach((p) => {
  const porC = {};
  porProv[p].forEach((b) => (porC[b.c] = porC[b.c] || []).push(b));
  Object.keys(porC).filter((c) => tieneLocPagina(p, c, porC[c].length)).forEach((c) => locsConPagina.push({ p, c, n: porC[c].length, centro: centro(porC[c]) }));
});
// Hasta 4 localidades con página propia (de cualquier provincia) a menos de 60 km; si no hay ninguna, las 2 más cercanas a menos de 150 km.
function localidadesCercanas(p, c) {
  const yo = locsConPagina.find((x) => x.p === p && x.c === c);
  // Fuera los nombres dobles de la misma ciudad en los datos (Donostia / San Sebastián): centroides a menos de 2 km.
  const l = locsConPagina.filter((x) => x !== yo).map((x) => ({ ...x, d: distKm(yo.centro, x.centro) })).sort((a, b) => a.d - b.d)
    .filter((x, k, arr) => !arr.slice(0, k).some((o) => distKm(o.centro, x.centro) < 2));
  const cerca = l.filter((x) => x.d <= 60).slice(0, 4);
  return cerca.length ? cerca : l.filter((x) => x.d <= 150).slice(0, 2);
}
const kmTexto = (d) => `a ${Math.max(1, Math.round(d))} km`;
function seccionProvinciasCercanas(p) {
  const l = provinciasCercanas(p);
  return l.length ? `<section class="cerca" aria-labelledby="t-provs"><h2 id="t-provs">Provincias cercanas</h2><ul>${l.map(({ p: o, d }) =>
    `<li><a href="/bibliotecas/${slug(o)}/">Bibliotecas en ${esc(o)}</a> <small>${plural(porProv[o].length, "biblioteca", "bibliotecas")} · ${kmTexto(d)}${porProv[o].filter(verificado).length ? ` · ${porProv[o].filter(verificado).length} con horario verificado` : ""}</small></li>`).join("")}</ul></section>` : "";
}
function seccionLocalidadesCercanas(p, c) {
  const l = localidadesCercanas(p, c);
  return l.length ? `<section class="cerca" aria-labelledby="t-locs"><h2 id="t-locs">Localidades cercanas</h2><ul>${l.map((x) =>
    `<li><a href="/bibliotecas/${slug(x.p)}/${slug(x.c)}/">Bibliotecas en ${esc(x.c)}</a> <small>${plural(x.n, "biblioteca", "bibliotecas")} · ${kmTexto(x.d)}${x.p !== p ? ` · ${esc(x.p)}` : ""}</small></li>`).join("")}</ul></section>` : "";
}
// Desde la ficha de una biblioteca: las páginas temáticas de su provincia (y de su localidad, si las hay).
function seccionTemasFicha(b, locConPagina) {
  const ps = slug(b.p);
  const enl = TEMAS.filter((t) => temaProv[t.slug][b.p]).map((t) =>
    `<li><a href="/bibliotecas/${ps}/${t.slug}/">Bibliotecas ${esc(t.que)} en ${esc(b.p)}</a> <small>${plural(temaProv[t.slug][b.p].length, "biblioteca", "bibliotecas")} con horario verificado</small></li>`);
  if (locConPagina) TEMAS_LOC.filter((t) => temaLoc[t.slug][b.p + "|" + b.c]).forEach((t) =>
    enl.push(`<li><a href="/bibliotecas/${ps}/${slug(b.c)}/${t.slug}/">Bibliotecas ${esc(t.que)} en ${esc(b.c)}</a> <small>${plural(temaLoc[t.slug][b.p + "|" + b.c].length, "biblioteca", "bibliotecas")} con horario verificado</small></li>`));
  const sl = salasDeLoc.get(b.p + "|" + b.c);
  if (sl) enl.unshift(`<li><a href="${sl.ruta}">Salas de estudio en ${esc(sl.ciudad)}</a> <small>${plural(sl.est.length, "biblioteca", "bibliotecas")} para estudiar, ordenadas por horas de apertura</small></li>`);
  return enl.length ? `<section class="cerca" aria-labelledby="t-temas"><h2 id="t-temas">${sl ? "Para estudiar en" : "Por horario en"} ${esc(b.p)}</h2><ul>${enl.join("")}</ul></section>` : "";
}

// hasPart de una provincia o localidad: las páginas que su HTML ya enlaza (sus localidades con página, «Por horario»,
// salas de estudio, exámenes y universidades), con los mismos datos que navPorHorario/navSalas/navExamenes/
// navUniversidades, para que Google vea la jerarquía provincia → localidad → «abiertas …». No añade enlaces al HTML;
// scripts/comprobar_paginas_seo.js falla si un hasPart no existe o la página no lo enlaza.
function partesLugar(prov, loc, { locs = [], salasL = [], exL = [], filtroUni }) {
  const base = `/bibliotecas/${slug(prov)}/${loc ? slug(loc) + "/" : ""}`, donde = loc || prov;
  const cp = (name, ruta) => refPagina(name, DOMINIO + ruta);
  const l = [
    ...locs.map((c) => cp(`Bibliotecas en ${c}`, `${base}${slug(c)}/`)),
    ...(loc ? TEMAS_LOC : TEMAS).filter((t) => (loc ? temaLoc[t.slug][prov + "|" + loc] : temaProv[t.slug][prov])).map((t) => cp(`Bibliotecas ${t.que} en ${donde}`, `${base}${t.slug}/`)),
    ...salasL.map((s) => cp(`Salas de estudio en ${s.ciudad}`, s.ruta)),
    ...(exCiudades.length ? exL : []).map((g) => cp(`Bibliotecas en exámenes en ${g.ciudad}`, g.ruta)),
    ...universidades.filter((u) => u.lista.some(filtroUni)).map((u) => cp(`Bibliotecas de la ${u.nombre}`, u.ruta)),
  ].filter((x, k, arr) => arr.findIndex((o) => o.url === x.url) === k);
  if (l.length) { nLugarHasPart++; nHasPart += l.length; }
  return l.length ? { hasPart: l } : {};
}
let nProvItemList = 0, nItemsProv = 0, nLugarHasPart = 0, nHasPart = 0, nLugarIsPartOf = 0;
// isPartOf de una provincia o localidad: la página que ya enlaza su <p class="volver"> (la localidad, su provincia; la
// provincia, el índice /bibliotecas/), con el mismo name que el CollectionPage destino. Es la otra mitad del hasPart de
// la provincia y del ItemList del índice; scripts/comprobar_paginas_seo.js falla si no existe, no está enlazada o no es recíproca.
const NOMBRE_INDICE = "Bibliotecas de España por provincia: abiertas ahora";
const superiorLugar = (name, ruta) => { nLugarIsPartOf++; return { isPartOf: refPagina(name, DOMINIO + ruta) }; };
// isPartOf de los hubs (salas de estudio, universidades, exámenes y horarios): el índice /bibliotecas/, primer enlace de
// su <p class="volver"> («← Todas las provincias»), con NOMBRE_INDICE como name (el del CollectionPage del índice). Sin
// reciprocidad: el índice no los lleva en su ItemList (solo provincias). Las temáticas de España lo declaran con ldTema.
let nHubIndice = 0;
const parteDeIndice = () => { nHubIndice++; return { isPartOf: refPagina(NOMBRE_INDICE, DOMINIO + "/bibliotecas/") }; };
// name del CollectionPage de cada provincia y localidad (ruta → name), para el isPartOf de las fichas (se generan después).
const nombreLugarDe = new Map();
provincias.forEach((p) => {
  const lista = porProv[p], ps = slug(p);
  const porLoc = {};
  lista.forEach((b) => (porLoc[b.c] = porLoc[b.c] || []).push(b));
  const locs = Object.keys(porLoc).sort((a, b) => porLoc[b].length - porLoc[a].length || a.localeCompare(b, "es"));
  const conPagina = locs.filter((c) => tieneLocPagina(p, c, porLoc[c].length));
  // título de la provincia antes que los de sus localidades: su name es el isPartOf de cada una
  const ruta = `/bibliotecas/${ps}/`, k = cuentas(lista), tp = tituloLugar(ruta, p, k);
  nombreLugarDe.set(ruta, tp.nombre);
  // páginas de localidad
  conPagina.forEach((c) => {
    const l = porLoc[c].slice().sort(ordenBib), ruta = `/bibliotecas/${ps}/${slug(c)}/`;
    const f = faq(c, l), k = cuentas(l);
    // Ninguna con horario verificado: las verificadas con ficha más cercanas al centroide (≤ 15 km), para que
    // «bibliotecas abiertas en <pueblo>» tenga al menos un horario comprobado a mano.
    const verifCerca = k.v ? [] : cercanasVerificadas(centro(l), new Set());
    if (verifCerca.length) { nLocsVerifCerca++; nEnlacesLocVerifCerca += verifCerca.length; }
    const secVerif = seccionVerifCerca(verifCerca, c, `Las de ${esc(c)} aún no tienen el horario comprobado; estas, a menos de ${RADIO_VERIF_KM} km del centro de sus bibliotecas, sí (horario de invierno, en su web oficial).`);
    const tl = tituloLugar(ruta, nombresRepetidos.has(slug(c)) ? `${c} (${p})` : c, k);
    const dl = descripcionLugar(ruta, c, p, k, 0);
    nombreLugarDe.set(ruta, tl.nombre);
    escribe(ruta, pagina({
      ruta, titulo: tl.titulo, descripcion: dl,
      h1: `Bibliotecas en ${esc(c)}`, intro: `${l.length} bibliotecas y salas de estudio en ${esc(c)} (${esc(p)})${k.v ? `, ${k.v} con horario verificado` : ""}. En el mapa de Bibliomapa ves en tiempo real cuáles están abiertas y cuál te pilla más cerca.`,
      cuerpo: `${navPorHorario(p, c)}${navSalas(salasDeLoc.has(p + "|" + c) ? [salasDeLoc.get(p + "|" + c)] : [])}${navExamenes(exDeLoc(p, c))}${navUniversidades((b) => b.p === p && b.c === c)}${tablaHorariosLugar(c, l)}<section class="lista">${l.map((b) => tarjeta(b)).join("")}</section>${secVerif}${f.html}${seccionLocalidadesCercanas(p, c)}<p class="volver"><a href="/bibliotecas/${ps}/">← Todas las bibliotecas de ${esc(p)}</a></p>`,
      migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [p, `/bibliotecas/${ps}/`], [c, ruta]], migasId: idMigasDe(ruta), head: k.v ? ESTILO_TABLA_HOR : "",
      ld: [ldLugar(ruta, tl.nombre, dl, { ...modVerif(l), ...superiorLugar(tp.nombre, `/bibliotecas/${ps}/`), ...conMigas(ruta), ...partesLugar(p, c, { salasL: salasDeLoc.has(p + "|" + c) ? [salasDeLoc.get(p + "|" + c)] : [], exL: exDeLoc(p, c), filtroUni: (b) => b.p === p && b.c === c }), mainEntity: { "@type": "ItemList", name: `Bibliotecas en ${c}`, numberOfItems: l.length, itemListElement: l.map((b, k) => ({ "@type": "ListItem", position: k + 1, item: itemBib(b) })) } }), f.ld],
    }));
    urls.push([ruta, "0.8", modVerif(l).dateModified]);
    // páginas temáticas de la localidad (2 o más que cumplen; ver temaLoc)
    TEMAS_LOC.forEach((t) => {
      const lt = temaLoc[t.slug][p + "|" + c];
      if (!lt) return;
      const lo = lt.slice().sort(ordenBib), rutaT = `${ruta}${t.slug}/`;
      const titulo = `Bibliotecas ${t.que} en ${c}`, ft = faqTema(t, lo, c), enProv = temaProv[t.slug][p];
      escribe(rutaT, pagina({
        ruta: rutaT, titulo: tituloTema(t, lo, nombresRepetidos.has(slug(c)) ? `${c} (${p})` : c),
        descripcion: descripcionTema(t, lo, `${c} (${p})`),
        h1: esc(titulo), intro: introTema(t, lo, `${c} (${p})`),
        cuerpo: `${navTemas(t.slug, p, c)}${t.antes ? t.antes(lo) : ""}<section class="lista">${lo.map((b) => tarjeta(b, t.destacado(b), t)).join("")}</section>${ft.html}<p class="volver"><a href="${ruta}">← Todas las bibliotecas de ${esc(c)}</a> · <a href="/bibliotecas/${enProv ? `${ps}/${t.slug}` : t.slug}/">${esc(t.corto)} en ${esc(enProv ? p : "toda España")}</a></p>${t.hoy ? SCRIPT_HOY : ""}`, head: t.hoy ? ESTILO_HOY : "",
        migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [p, `/bibliotecas/${ps}/`], [c, ruta], [t.corto, rutaT]], migasId: idMigasDe(rutaT),
        ld: [ldTema(rutaT, titulo, lo, [], enProv ? [`Bibliotecas ${t.que} en ${p}`, `/bibliotecas/${ps}/${t.slug}/`] : [`Bibliotecas ${t.que} en España`, `/bibliotecas/${t.slug}/`], true), ft.ld],
      }));
      urls.push([rutaT, "0.7", fechaMod(lo)]);
    });
  });
  // páginas temáticas de la provincia (solo si hay 2 o más que cumplen)
  const temasAqui = TEMAS.filter((t) => temaProv[t.slug][p]);
  temasAqui.forEach((t) => {
    const l = temaProv[t.slug][p].slice().sort(ordenBib), rutaT = `/bibliotecas/${ps}/${t.slug}/`;
    const titulo = `Bibliotecas ${t.que} en ${p}`, ft = faqTema(t, l, p);
    const locsT = conPagina.filter((c) => temaLoc[t.slug] && temaLoc[t.slug][p + "|" + c]);
    escribe(rutaT, pagina({
      ruta: rutaT, titulo: tituloTema(t, l, p), descripcion: descripcionTema(t, l, p),
      h1: esc(titulo), intro: introTema(t, l, p),
      cuerpo: `${navTemas(t.slug, p)}${locsT.length ? `<nav class="locs" aria-label="Por localidad">${locsT.map((c) => `<a href="/bibliotecas/${ps}/${slug(c)}/${t.slug}/">${esc(c)} <small>${temaLoc[t.slug][p + "|" + c].length}</small></a>`).join("")}</nav>` : ""}${t.antes ? t.antes(l) : ""}<section class="lista">${l.map((b) => tarjeta(b, t.destacado(b), t)).join("")}</section>${ft.html}<p class="volver"><a href="/bibliotecas/${ps}/">← Todas las bibliotecas de ${esc(p)}</a> · <a href="/bibliotecas/${t.slug}/">${esc(t.corto)} en toda España</a></p>${t.hoy ? SCRIPT_HOY : ""}`, head: t.hoy ? ESTILO_HOY : "",
      migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [p, `/bibliotecas/${ps}/`], [t.corto, rutaT]], migasId: idMigasDe(rutaT),
      ld: [ldTema(rutaT, titulo, l, locsT.map((c) => [`Bibliotecas ${t.que} en ${c}`, `/bibliotecas/${ps}/${slug(c)}/${t.slug}/`]), [`Bibliotecas ${t.que} en España`, `/bibliotecas/${t.slug}/`], true), ft.ld],
    }));
    urls.push([rutaT, "0.7", fechaMod(l)]);
  });
  // página de provincia
  const f = faq(p, lista);
  const enlTemas = navPorHorario(p);
  const enPagina = []; // tarjetas visibles, en el orden del HTML (para el ItemList del JSON-LD)
  const secciones = locs.map((c) => {
    const l = porLoc[c].slice().sort(ordenBib);
    const titulo = conPagina.includes(c) ? `<a href="/bibliotecas/${ps}/${slug(c)}/">${esc(c)}</a>` : esc(c);
    const vistas = conPagina.includes(c) ? l.slice(0, 4) : l;
    enPagina.push(...vistas);
    return `<section class="loc"><h2>${titulo} <small>${l.length}</small></h2>${vistas.map((b) => tarjeta(b)).join("")}${conPagina.includes(c) && l.length > 4 ? `<p class="mas"><a href="/bibliotecas/${ps}/${slug(c)}/">Ver las ${l.length} bibliotecas de ${esc(c)} →</a></p>` : ""}</section>`;
  }).join("");
  const dp = descripcionLugar(ruta, p, "", k, locs.length);
  // mainEntity: las bibliotecas con ficha que se ven en la página, con el @id de su ficha (<ficha>#biblioteca), para que
  // Google enlace la página de provincia con cada ficha. Sin ficha no entran: su único enlace sería /#bib=… (la portada).
  const conFicha = enPagina.filter((b) => paginaDe.has(b.i));
  if (conFicha.length) { nProvItemList++; nItemsProv += conFicha.length; }
  const mainProv = conFicha.length ? { mainEntity: { "@type": "ItemList", name: `Bibliotecas en ${p}`, numberOfItems: conFicha.length,
    itemListElement: conFicha.map((b, n) => ({ "@type": "ListItem", position: n + 1, item: itemBib(b) })) } } : {};
  escribe(ruta, pagina({
    ruta, titulo: tp.titulo, descripcion: dp,
    h1: `Bibliotecas en ${esc(p)}`, intro: `${lista.length} bibliotecas en ${locs.length} ${locs.length === 1 ? "localidad" : "localidades"} de ${esc(p)}${k.v ? `, ${k.v} con horario verificado` : ""}. Elige tu localidad o abre el mapa para ver cuáles están abiertas ahora mismo.`,
    cuerpo: `${enlTemas}${navSalas(salasDeProv[p])}${navExamenes(exDeProv(p))}${navUniversidades((b) => b.p === p)}<nav class="locs">${conPagina.map((c) => `<a href="/bibliotecas/${ps}/${slug(c)}/">${esc(c)} <small>${porLoc[c].length}</small></a>`).join("")}</nav>${tablaHorariosLugar(p, lista)}${secciones}${f.html}${seccionProvinciasCercanas(p)}<p class="volver"><a href="/bibliotecas/">← Todas las provincias</a></p>`,
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [p, ruta]], migasId: idMigasDe(ruta), head: k.v ? ESTILO_TABLA_HOR : "",
    ld: [ldLugar(ruta, tp.nombre, dp, { ...modVerif(lista), ...superiorLugar(NOMBRE_INDICE, "/bibliotecas/"), ...conMigas(ruta), ...partesLugar(p, null, { locs: conPagina, salasL: salasDeProv[p] || [], exL: exDeProv(p), filtroUni: (b) => b.p === p }), ...mainProv }), f.ld],
  }));
  urls.push([ruta, "0.8", modVerif(lista).dateModified]);
});

// páginas temáticas de España, agrupadas por provincia
const temasEspana = TEMAS.map((t) => ({ t, l: todas.filter(t.cumple) })).filter((x) => x.l.length);
temasEspana.forEach(({ t, l }) => {
  const rutaT = `/bibliotecas/${t.slug}/`, titulo = `Bibliotecas ${t.que} en España`, ft = faqTema(t, l, "España");
  const porP = {};
  l.forEach((b) => (porP[b.p] = porP[b.p] || []).push(b));
  const provs = Object.keys(porP).sort((a, b) => a.localeCompare(b, "es"));
  const secciones = provs.map((p) => {
    const lp = porP[p].slice().sort(ordenBib), conPag = !!temaProv[t.slug][p];
    const cab = conPag ? `<a href="/bibliotecas/${slug(p)}/${t.slug}/">${esc(p)}</a>` : `<a href="/bibliotecas/${slug(p)}/">${esc(p)}</a>`;
    return `<section class="loc" id="${slug(p)}"><h2>${cab} <small>${lp.length}</small></h2>${lp.map((b) => tarjeta(b, t.destacado(b), t)).join("")}</section>`;
  }).join("");
  const ordenados = provs.flatMap((p) => porP[p].slice().sort(ordenBib));
  escribe(rutaT, pagina({
    ruta: rutaT, titulo: tituloTema(t, l, "España", true), descripcion: descripcionTema(t, l, "España", true),
    h1: esc(titulo), intro: introTema(t, l, "España"),
    cuerpo: `${navTemas(t.slug)}<nav class="locs" aria-label="Provincias">${provs.map((p) => `<a href="#${slug(p)}">${esc(p)} <small>${porP[p].length}</small></a>`).join("")}</nav>${t.antes ? t.antes(l) : ""}${secciones}${ft.html}<p class="volver"><a href="/bibliotecas/">← Todas las provincias</a></p>${t.hoy ? SCRIPT_HOY : ""}`, head: t.hoy ? ESTILO_HOY : "",
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [t.corto, rutaT]], migasId: idMigasDe(rutaT),
    ld: [ldTema(rutaT, titulo, ordenados, provs.filter((p) => temaProv[t.slug][p]).map((p) => [`Bibliotecas ${t.que} en ${p}`, `/bibliotecas/${slug(p)}/${t.slug}/`]), [NOMBRE_INDICE, "/bibliotecas/"], true), ft.ld],
  }));
  urls.push([rutaT, "0.8", fechaMod(ordenados)]);
});

// páginas de cada biblioteca más buscada
conPaginaPropia.forEach(paginaBiblioteca);
// fichas.json: {índice en BIBLIOTECAS: ruta de su ficha}, para que «🔗 Compartir» de la app enlace la ficha (URL indexable
// con título y vista previa) en vez de la portada con #bib=. La app lo baja en segundo plano; sin él, sigue con #bib=.
{ const fichasJson = {};
  [...paginaDe.keys()].sort((a, b) => a - b).forEach((i) => { fichasJson[i] = paginaDe.get(i); });
  fs.writeFileSync(path.join(RAIZ, "fichas.json"), JSON.stringify(fichasJson) + "\n"); }

// ---------- Páginas «Salas de estudio en <capital>» y su índice de España ----------
// «3 bibliotecas universitarias y 4 públicas» sin los tipos en cero.
const tiposTexto = (u, pub, largo) => enumera([u ? plural(u, "biblioteca universitaria", "bibliotecas universitarias") : "",
  pub ? plural(pub, largo ? "biblioteca pública o gran biblioteca" : "biblioteca pública", largo ? "bibliotecas públicas o grandes bibliotecas" : (u ? "públicas" : "bibliotecas públicas")) : ""].filter(Boolean));
const enlaceBib = (b) => `<a href="${paginaDe.get(b.i) || enlaceApp(b)}">${esc(b.n)}</a>`;
function tituloSalas(ciudad, n) {
  const cand = [`Salas de estudio en ${ciudad}: ${n} bibliotecas para estudiar`, `Salas de estudio en ${ciudad}: ${n} bibliotecas`,
    `Salas de estudio en ${ciudad} (${n})`, `Estudiar en ${ciudad}: ${n} salas de estudio`];
  for (const t of cand) for (const x of [t + MARCA, t]) if (x.length <= MAX_TIT && !titulosUsados.has(x)) { titulosUsados.add(x); return x; }
  const t = cand.filter((x) => !titulosUsados.has(x)).sort((a, b) => a.length - b.length)[0];
  titulosUsados.add(t);
  return t;
}
function ranking(ver) {
  const l = ver.slice().sort((a, b) => horasSemana(b) - horasSemana(a) || a.n.localeCompare(b.n, "es"));
  const dia = (b, d) => franjas(b.h.inv[d]) || (sinConfirmar(b, d) ? "sin confirmar" : "cerrada");
  return { l, html: `<section class="ficha" aria-labelledby="t-rank"><h2 id="t-rank">Las que más horas abren</h2>
<p class="fuente">Horas a la semana según el horario de invierno comprobado en la web oficial de cada una ${textoFechas(l)}. Solo entran las que tienen horario verificado${l.some((b) => DIAS.some((d) => sinConfirmar(b, d))) ? "; los días «sin confirmar» no suman horas" : ""}.</p>
<ol class="ranking">${l.map((b) => `<li>${enlaceBib(b)} <span class="tipo">${esc(TIPO[b.t] || "Biblioteca")}</span>
<small><b>${horasTexto(horasSemana(b))} a la semana</b>${cierreMasTarde(b) ? ` · entre semana cierra a las ${quitaCero(cierreMasTarde(b)).replace("24:00", "00:00")}` : " · cerrada entre semana"} · sábado: ${dia(b, "S")} · domingo: ${dia(b, "D")} · <a href="${esc(b.h.f)}" rel="nofollow noopener" target="_blank">fuente</a> (${esc(fechaEs(b.h.fv))})</small></li>`).join("")}</ol></section>` };
}
function faqSalas(s, rk, ex) {
  const { ciudad, est, ver } = s, u = est.filter((b) => b.t === "universidad").length, pub = est.length - u;
  const top = rk.slice(0, 3).map((b) => `${b.n} (${horasTexto(horasSemana(b))})`);
  const finde = ver.filter(abreFinde), tarde = ver.filter(cierraTarde).sort((a, b) => cierreMasTarde(b).localeCompare(cierreMasTarde(a)));
  const masTarde = ver.filter(cierreMasTarde).sort((a, b) => cierreMasTarde(b).localeCompare(cierreMasTarde(a)))[0];
  const nom = (l) => l.slice(0, 5).map((b) => b.n).join(", ") + (l.length > 5 ? " y otras" : "");
  const q = [
    [`¿Dónde estudiar en ${ciudad}?`, `Bibliomapa tiene en ${ciudad} ${tiposTexto(u, pub, true)}. Con horario verificado en su web oficial, las que más horas abren a la semana son ${enumera(top)}.`],
    [`¿Qué salas de estudio abren el fin de semana en ${ciudad}?`, finde.length
      ? `Según su horario verificado abren sábado o domingo: ${nom(finde)}. Comprueba festivos en su web.`
      : `Ninguna de las ${ver.length} con horario verificado en ${ciudad} abre el fin de semana; del resto aún no tenemos el horario confirmado.`],
    [`¿Qué biblioteca para estudiar cierra más tarde en ${ciudad}?`, tarde.length
      ? `Entre semana, según su horario verificado, la que cierra más tarde es ${tarde[0].n} (a las ${quitaCero(cierreMasTarde(tarde[0])).replace("24:00", "00:00")}).${tarde.length > 1 ? ` También abren hasta las 21:00 o más: ${nom(tarde.slice(1))}.` : ""}`
      : masTarde ? `Ninguna de las ${ver.length} con horario verificado en ${ciudad} abre hasta las 21:00 entre semana; la que cierra más tarde es ${masTarde.n} (a las ${quitaCero(cierreMasTarde(masTarde)).replace("24:00", "00:00")}).`
      : `Ninguna de las que tienen horario verificado en ${ciudad} abre entre semana.`],
    [`¿Puedo estudiar en una biblioteca universitaria de ${ciudad} sin ser alumno?`, `Depende de cada universidad: el acceso a las bibliotecas universitarias suele estar limitado a su comunidad, sobre todo en época de exámenes, así que consulta su web. Las bibliotecas públicas son de acceso libre y gratuito a sus servicios básicos (Ley 10/2007 de la lectura).`],
    ...(ex.length ? [[`¿Amplían horario en exámenes las bibliotecas de ${ciudad}?`, `Sí, según su fuente oficial: ${ex.map((e) => `${e.espacio}, del ${fechaEs(e.desde)} al ${fechaEs(e.hasta)}: ${e.horario}`).join(". ")}.`]] : []),
  ];
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: q.map(([p, r]) => ({ "@type": "Question", name: p, acceptedAnswer: { "@type": "Answer", text: r } })) };
  return { html: `<section class="faq"><h2>Preguntas frecuentes</h2>${q.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join("")}</section>`, ld };
}
// isPartOf de las páginas de salas de estudio, universidades y exámenes: su hub (el primer enlace de su <p class="volver">),
// con el mismo name que el CollectionPage del hub; por eso el título de cada hub se calcula antes que sus páginas (no
// coincide con ninguno de ellas: 0 títulos cambiados). Es la otra mitad del hasPart del hub; los hubs, el índice (parteDeIndice).
let nHubIsPartOf = 0;
const parteDeHub = (titulo, ruta) => { nHubIsPartOf++; return { isPartOf: refPagina(titulo.replace(MARCA, ""), DOMINIO + ruta) }; };
const tituloHubSalas = (() => {
  if (!salas.length) return "";
  const totE = salas.reduce((t, s) => t + s.est.length, 0);
  const tBase = `Salas de estudio en España: ${totE} bibliotecas en ${salas.length} ciudades`;
  const titulo = (tBase + MARCA).length <= MAX_TIT ? tBase + MARCA : tBase;
  titulosUsados.add(titulo);
  return titulo;
})();
salas.forEach((s) => {
  const { p, ciudad, ruta, lista, est, ver } = s, ps = slug(p);
  const uni = est.filter((b) => b.t === "universidad").sort(ordenBib), pub = est.filter((b) => b.t !== "universidad").sort(ordenBib);
  const otras = lista.length - est.length;
  const ex = EXAMENES.filter((e) => slug(e.ciudad) === slug(ciudad) && slug(e.provincia) === ps).sort((a, b) => a.desde.localeCompare(b.desde));
  const rk = ranking(ver), fq = faqSalas(s, rk.l, ex);
  const finde = ver.filter(abreFinde).length, tarde = ver.filter(cierraTarde).length;
  const rutaCiudad = s.conLoc ? `/bibliotecas/${ps}/${slug(ciudad)}/` : `/bibliotecas/${ps}/`;
  const titulo = tituloSalas(ciudad, est.length);
  const descripcion = `${cap(tiposTexto(uni.length, pub.length))} para estudiar en ${ciudad}: ${ver.length} con horario verificado${finde ? `, ${finde} en fin de semana` : ""}${tarde ? `, ${tarde} hasta las 21:00 o más` : ""}. Horas de apertura y acceso.`;
  const secExamenes = ex.length ? `<section class="ficha" aria-labelledby="t-ex"><h2 id="t-ex">Temporada de exámenes</h2><ul class="lista-ex">${ex.map((e) =>
    `<li><b>${esc(e.espacio)}</b> · del ${esc(fechaEs(e.desde))} al ${esc(fechaEs(e.hasta))}: ${esc(e.horario)}.${e.nota ? ` ${esc(e.nota)}` : ""} <small>(<a href="${esc(e.f)}" rel="nofollow noopener" target="_blank">fuente oficial</a>, comprobado el ${esc(fechaEs(e.fv))})</small></li>`).join("")}</ul></section>` : "";
  const grupo = (id, tit, l, acceso) => (l.length ? `<section class="loc" id="${id}"><h2>${tit} <small>${l.length}</small></h2><p class="nota">${acceso}</p>${l.map((b) => tarjeta(b)).join("")}</section>` : "");
  // Migas por su hub, como universidades y exámenes: Bibliotecas › Salas de estudio › <ciudad>; así el penúltimo es la
  // url de su isPartOf (/bibliotecas/salas-de-estudio/) y el BreadcrumbList lleva @id <ruta>#migas enlazado desde el
  // CollectionPage. Antes seguían el lugar (provincia › [localidad] › Salas de estudio: 15 a provincia, 6 a localidad);
  // la provincia o localidad sigue enlazada en el «volver» del cuerpo, que no cambia.
  const migas = [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], ["Salas de estudio", `/bibliotecas/${SALAS_SLUG}/`], [ciudad, ruta]];
  escribe(ruta, pagina({
    ruta, titulo, descripcion: descripcion.length <= MAX_DESC ? descripcion : descripcion.replace(/ Horas de apertura y acceso\.$/, ""),
    h1: `Bibliotecas para estudiar y salas de estudio en ${esc(ciudad)}`,
    intro: `${cap(tiposTexto(uni.length, pub.length, true))} en ${esc(ciudad)}${slug(ciudad) !== ps ? ` (${esc(p)})` : ""}. ` +
      `${ver.length} tienen el horario comprobado en su web oficial: abajo las ordenamos por horas de apertura a la semana. En el mapa ves cuál está abierta ahora y cuál te pilla más cerca.`,
    cuerpo: `${navExamenes(exCiudades.filter((g) => g.salas === s))}${rk.html}${secExamenes}
<nav class="locs" aria-label="Tipos">${uni.length ? `<a href="#universitarias">Universitarias <small>${uni.length}</small></a>` : ""}${pub.length ? `<a href="#publicas">Públicas <small>${pub.length}</small></a>` : ""}</nav>
${grupo("universitarias", "Bibliotecas universitarias", uni, "El acceso suele estar limitado a la comunidad de cada universidad, sobre todo en exámenes: consulta su web.")}
${grupo("publicas", "Bibliotecas públicas y grandes bibliotecas", pub, "Las bibliotecas públicas son de acceso libre y gratuito a sus servicios básicos (Ley 10/2007 de la lectura).")}
${fq.html}
${otras ? `<p class="mas"><a href="${rutaCiudad}">Ver las ${lista.length} bibliotecas de ${esc(ciudad)} (incluidas ${otras} de barrio, especializadas o sin clasificar) →</a></p>` : ""}
<p class="volver"><a href="/bibliotecas/${SALAS_SLUG}/">← Salas de estudio en otras ciudades</a> · <a href="${rutaCiudad}">${esc(s.conLoc ? ciudad : p)}</a> · ${enlaceHub}</p>`,
    migas, migasId: idMigasDe(ruta),
    ld: [ldLugar(ruta, titulo.replace(MARCA, ""), descripcion, { ...parteDeHub(tituloHubSalas, `/bibliotecas/${SALAS_SLUG}/`), ...conMigas(ruta), ...(ver.length ? { dateModified: fechaMod(ver) } : {}), mainEntity: { "@type": "ItemList", name: `Bibliotecas para estudiar en ${ciudad}`, numberOfItems: est.length,
      itemListElement: uni.concat(pub).map((b, k) => ({ "@type": "ListItem", position: k + 1, item: itemBib(b) })) } }), fq.ld],
  }));
  urls.push([ruta, "0.8", fechaMod(ver)]);
});
if (salas.length) {
  const ruta = `/bibliotecas/${SALAS_SLUG}/`;
  const orden = salas.slice().sort((a, b) => b.est.length - a.est.length || a.ciudad.localeCompare(b.ciudad, "es"));
  const totU = salas.reduce((t, s) => t + s.est.filter((b) => b.t === "universidad").length, 0), totE = salas.reduce((t, s) => t + s.est.length, 0);
  const totV = salas.reduce((t, s) => t + s.ver.length, 0);
  const titulo = tituloHubSalas;
  const descripcion = `Bibliotecas para estudiar en ${salas.length} capitales de España: ${totU} universitarias y ${totE - totU} públicas, ${totV} con horario verificado. Horas de apertura, fin de semana y acceso.`;
  const todasVer = salas.flatMap((s) => s.ver);
  escribe(ruta, pagina({
    ruta, titulo, descripcion,
    h1: "Salas de estudio y bibliotecas para estudiar en España",
    intro: `${totE} bibliotecas universitarias y públicas en ${salas.length} capitales de provincia, ${totV} con el horario comprobado en su web oficial. Elige tu ciudad: en cada una están ordenadas por horas de apertura a la semana.`,
    cuerpo: `<section class="cerca" aria-labelledby="t-ciud"><h2 id="t-ciud">Por ciudad</h2><ul>${orden.map((s) => {
      const top = s.ver.slice().sort((a, b) => horasSemana(b) - horasSemana(a))[0], f = s.ver.filter(abreFinde).length;
      return `<li><a href="${s.ruta}">Salas de estudio en ${esc(s.ciudad)}</a> <small>${[[s.est.filter((b) => b.t === "universidad").length, "universitaria", "universitarias"], [s.est.filter((b) => b.t !== "universidad").length, "pública", "públicas"]].filter((x) => x[0]).map((x) => plural(...x)).join(" · ")} · ${s.ver.length} con horario verificado${f ? ` (${f} en fin de semana)` : ""} · más horas: ${esc(top.n)}, ${horasTexto(horasSemana(top))}/semana</small></li>`; }).join("")}</ul></section>
<p class="volver"><a href="/bibliotecas/">← Todas las provincias</a>${exCiudades.length ? ` · <a href="${EX_RUTA}">Bibliotecas en exámenes</a>` : ""} · ${enlaceHub}</p>`,
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], ["Salas de estudio", ruta]], migasId: idMigasDe(ruta),
    ld: ldLugar(ruta, titulo.replace(MARCA, ""), descripcion, { ...parteDeIndice(), ...conMigas(ruta), dateModified: fechaMod(todasVer),
      hasPart: orden.map((s) => refPagina(`Salas de estudio en ${s.ciudad}`, DOMINIO + s.ruta)) }),
  }));
  urls.push([ruta, "0.8", fechaMod(todasVer)]);
}

// ---------- Páginas «Bibliotecas de la <Universidad>» y su índice ----------
// Título ≤ 65 y único (con la sigla y el nombre si caben), descripción ≤ 160 y única; todo calculado de los datos.
function tituloUni(u) {
  const cand = [`Bibliotecas de la ${u.nombre} (${u.sigla}): horarios y salas`, `Bibliotecas de la ${u.nombre} (${u.sigla}): horarios`,
    `Bibliotecas ${u.sigla}: horarios y salas de estudio`, `Bibliotecas de la ${u.nombre}: horarios`, `Bibliotecas ${u.sigla} (${u.nombre})`];
  for (const t of cand) for (const x of [t + MARCA, t]) if (x.length <= MAX_TIT && !titulosUsados.has(x)) { titulosUsados.add(x); return x; }
  const t = cand.filter((x) => !titulosUsados.has(x)).sort((a, b) => a.length - b.length)[0] || `Bibliotecas ${u.sigla}: ${u.lista.length}`;
  titulosUsados.add(t);
  return t;
}
function descripcionUni(u, ciudades) {
  const n = u.lista.length, v = u.ver.length, finde = u.ver.filter(abreFinde).length, tarde = u.ver.filter(cierraTarde).length;
  const donde = ciudades.length === 1 ? `en ${ciudades[0]}` : ciudades.length <= 3 ? `en ${enumera(ciudades)}` : `en ${ciudades.length} ciudades`;
  const extras = [finde ? `${finde} ${finde === 1 ? "abre" : "abren"} el fin de semana` : "", tarde ? `${tarde} hasta las 21:00 o más` : ""].filter(Boolean);
  const cand = [];
  for (let e = extras.length; e >= 0; e--) {
    const ex = extras.slice(0, e).map((x) => ", " + x).join("");
    cand.push(`${n} bibliotecas de la ${u.nombre} (${u.sigla}) ${donde}: ${v} con horario verificado en su web oficial${ex}. Mapa y salas de estudio.`,
      `${n} bibliotecas de la ${u.nombre} (${u.sigla}) ${donde}: ${v} con horario verificado${ex}.`,
      `${n} bibliotecas de la ${u.sigla} ${donde}: ${v} con horario verificado${ex}.`);
  }
  const d = cand.find((x) => x.length <= MAX_DESC && !descUsadas.has(x)) || cand[cand.length - 1].slice(0, MAX_DESC);
  descUsadas.add(d);
  return d;
}
function faqUni(u, ex) {
  const { nombre, sigla, lista, ver } = u, sin = lista.length - ver.length;
  const finde = ver.filter(abreFinde), tarde = ver.filter(cierreMasTarde).sort((a, b) => cierreMasTarde(b).localeCompare(cierreMasTarde(a)));
  const nom = (l) => l.slice(0, 5).map((b) => b.n).join(", ") + (l.length > 5 ? " y otras" : "");
  const findeSabido = ver.filter((b) => !diaDesconocido(b, "S") && !diaDesconocido(b, "D"));
  const horarios = ver.slice(0, 4).map((b) => `${b.n}: ${horarioTextoUni(b)}`).join("; ") + (ver.length > 4 ? "; y otras" : "");
  const q = [
    [`¿Cuál es el horario de las bibliotecas de la ${sigla}?`, `Depende de cada biblioteca. Con horario de invierno verificado en la web oficial ${textoFechas(ver)}: ${horarios}.${sin ? ` De ${plural(sin, "biblioteca", "bibliotecas")} aún no tenemos el horario confirmado: consúltalo en su web.` : ""} Verano, festivos y exámenes pueden cambiarlo.`],
    [`¿Qué bibliotecas de la ${nombre} abren el fin de semana?`, finde.length
      ? `Según su horario verificado abren sábado o domingo: ${nom(finde)}. Comprueba festivos en su web.`
      : findeSabido.length
        ? `${findeSabido.length === 1 ? `La única biblioteca de la ${sigla} con el fin de semana confirmado en su horario verificado (${findeSabido[0].n}) no abre ni el sábado ni el domingo.` : `Ninguna de las ${findeSabido.length} bibliotecas de la ${sigla} con el fin de semana confirmado en su horario verificado abre el sábado ni el domingo.`}${lista.length > findeSabido.length ? ` Del resto (${lista.length - findeSabido.length}) aún no tenemos confirmado el fin de semana: consúltalo en su web.` : ""}`
        : `Todavía no tenemos confirmado el horario de fin de semana de ninguna biblioteca de la ${sigla}: consúltalo en su web.`],
    ...(tarde.length ? [[`¿Qué biblioteca de la ${sigla} cierra más tarde?`, (() => {
      const max = cierreMasTarde(tarde[0]), empatadas = tarde.filter((b) => cierreMasTarde(b) === max), hora = quitaCero(max).replace("24:00", "00:00");
      return empatadas.length === 1 ? `Entre semana, según su horario verificado, la que cierra más tarde es ${tarde[0].n} (a las ${hora}).`
        : `Entre semana, según su horario verificado, las que cierran más tarde lo hacen a las ${hora}: ${nom(empatadas)}.`; })()]] : []),
    [`¿Puedo estudiar en las bibliotecas de la ${sigla} sin ser alumno?`, `Depende de la universidad y de la biblioteca: el acceso a las bibliotecas universitarias suele estar limitado a su comunidad, sobre todo en época de exámenes, así que consulta su web antes de ir.`],
    ...(ex.length ? [[`¿Amplían horario en exámenes las bibliotecas de la ${sigla}?`, `Sí, según su fuente oficial: ${ex.map((e) => `${e.espacio}, del ${fechaEs(e.desde)} al ${fechaEs(e.hasta)}: ${e.horario}`).join(". ")}.`]] : []),
  ];
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: q.map(([p, r]) => ({ "@type": "Question", name: p, acceptedAnswer: { "@type": "Answer", text: r } })) };
  return { html: `<section class="faq"><h2>Preguntas frecuentes</h2>${q.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join("")}</section>`, ld };
}
// Horario de la semana como horarioTexto, pero el día vacío que la nota de la fuente da por desconocido («sábados sin
// confirmar», «la fuente no da sábados ni domingos») sale «sin confirmar», no «cerrado».
const diaDesconocido = (b, d) => !(b.h.inv[d] || []).length && !!b.h.nota && (sinConfirmar(b, d) ||
  new RegExp(`no da[^.]*${RAIZ_DIA[DIAS.indexOf(d)]}`, "i").test(b.h.nota));
function horarioTextoUni(b) {
  const desconocido = (d) => diaDesconocido(b, d);
  const grupos = [];
  DIAS.forEach((d) => {
    const f = franjas(b.h.inv[d]) || (desconocido(d) ? "sin confirmar" : "cerrado"), ult = grupos[grupos.length - 1];
    if (ult && ult.f === f) ult.hasta = d; else grupos.push({ desde: d, hasta: d, f });
  });
  return grupos.map((g) => (g.desde === g.hasta ? g.desde : g.desde + "–" + g.hasta) + " " + g.f).join(" · ");
}
// Página de la localidad (si la tiene) o de la provincia.
const rutaLugar = (p, c) => (tieneLocPagina(p, c, porProv[p].filter((b) => b.c === c).length) ? `/bibliotecas/${slug(p)}/${slug(c)}/` : `/bibliotecas/${slug(p)}/`);
const tituloHubUnis = (() => {
  if (!universidades.length) return "";
  const tBase = `Bibliotecas universitarias: ${universidades.length} universidades, horarios`;
  const titulo = [tBase + MARCA, tBase, `Bibliotecas de ${universidades.length} universidades de España`].find((x) => x.length <= MAX_TIT && !titulosUsados.has(x));
  titulosUsados.add(titulo);
  return titulo;
})();
universidades.forEach((u) => {
  const { ruta, lista, ver } = u;
  // Ciudad o campus de cada biblioteca: «Valencia» y «València» van juntas (mismo slug, se muestra la grafía más usada);
  // si en los datos la «localidad» es en realidad una calle (Rúa…, Calle…), se agrupa con la biblioteca de la misma
  // universidad más cercana que sí tenga localidad (a menos de 20 km); si no hay ninguna, se deja como está.
  const CALLE = /^(R[úu]a|Calle|C\/|Avda\.?|Avenida|Plaza|Praza|Paseo|Camino|Carrer|Rambla)\b/i;
  const ciudadDe = new Map();
  lista.forEach((b) => {
    let c = b.c;
    if (CALLE.test(c)) {
      const o = lista.filter((x) => x !== b && x.p === b.p && !CALLE.test(x.c)).map((x) => ({ x, d: distKm(b, x) })).sort((m, n) => m.d - n.d)[0];
      if (o && o.d <= 20) c = o.x.c;
    }
    ciudadDe.set(b.i, c);
  });
  const grafia = {}; // "<prov>|<slug>" → { grafía: n }
  lista.forEach((b) => { const k = b.p + "|" + slug(ciudadDe.get(b.i)); (grafia[k] = grafia[k] || {})[ciudadDe.get(b.i)] = ((grafia[k] || {})[ciudadDe.get(b.i)] || 0) + 1; });
  const nombreC = (k) => Object.keys(grafia[k]).sort((x, y) => grafia[k][y] - grafia[k][x] || x.localeCompare(y, "es"))[0];
  const porC = {};
  lista.forEach((b) => { const k0 = b.p + "|" + slug(ciudadDe.get(b.i)), k = b.p + "|" + nombreC(k0); (porC[k] = porC[k] || []).push(b); });
  const claves = Object.keys(porC).sort((a, b) => porC[b].length - porC[a].length || a.localeCompare(b, "es"));
  const ciudades = claves.map((k) => k.split("|")[1]);
  const provs = [...new Set(lista.map((b) => b.p))];
  const nombresBib = new Set(lista.map((b) => b.n));
  const ex = EXAMENES.filter((e) => (e.bib && nombresBib.has(e.bib)) || u.re.test(e.espacio)).sort((a, b) => a.desde.localeCompare(b.desde));
  const fq = faqUni(u, ex), titulo = tituloUni(u), descripcion = descripcionUni(u, ciudades);
  const verOrden = ver.slice().sort(ordenBib);
  const secVer = `<section class="ficha" aria-labelledby="t-ver"><h2 id="t-ver">Horarios verificados</h2>
<p class="fuente">Horario de invierno comprobado en la web oficial de cada biblioteca ${textoFechas(ver)}. Verano, festivos y exámenes pueden cambiarlo.</p>
<ul class="lista-ex">${verOrden.map((b) => `<li>${enlaceBib(b)} <span class="tipo">${esc(b.c)}</span><br>${esc(horarioTextoUni(b))}${b.h.nota ? ` · ${esc(b.h.nota)}` : ""} <small>(<a href="${esc(b.h.f)}" rel="nofollow noopener" target="_blank">fuente</a>, ${esc(fechaEs(b.h.fv))})</small></li>`).join("")}</ul>
${lista.length > ver.length ? `<p class="fuente">${plural(lista.length - ver.length, "biblioteca más", "bibliotecas más")} de la ${esc(u.sigla)} sin horario confirmado todavía: están abajo, por ciudad.</p>` : ""}</section>`;
  const secEx = ex.length ? `<section class="ficha" aria-labelledby="t-ex"><h2 id="t-ex">Temporada de exámenes</h2><ul class="lista-ex">${ex.map((e) =>
    `<li><b>${esc(e.espacio)}</b> · del ${esc(fechaEs(e.desde))} al ${esc(fechaEs(e.hasta))}: ${esc(e.horario)}.${e.nota ? ` ${esc(e.nota)}` : ""} <small>(<a href="${esc(e.f)}" rel="nofollow noopener" target="_blank">fuente oficial</a>, comprobado el ${esc(fechaEs(e.fv))})</small></li>`).join("")}</ul>
${navExamenes(exCiudades.filter((g) => g.entradas.some((x) => ex.includes(x.e))))}</section>` : "";
  const secciones = claves.map((k) => {
    const [p, c] = k.split("|"), l = porC[k].slice().sort(ordenBib), sl = salasDeLoc.get(k);
    const conLoc = tieneLocPagina(p, c, porProv[p].filter((b) => b.c === c).length);
    const enl = [`<a href="${rutaLugar(p, c)}">Todas las bibliotecas de ${esc(conLoc ? c : p)}</a>`]
      .concat(sl ? [`<a href="${sl.ruta}">Salas de estudio en ${esc(sl.ciudad)}</a>`] : []);
    return `<section class="loc" id="${slug(c)}"><h2>${esc(c)}${provs.length > 1 || slug(c) !== slug(p) ? ` <small>${esc(p)} · ${l.length}</small>` : ` <small>${l.length}</small>`}</h2>${l.map((b) => tarjeta(b)).join("")}
<p class="mas">${enl.join(" · ")}</p>${navPorHorario(p, conLoc ? c : undefined)}</section>`;
  }).join("");
  const p0 = provs.length === 1 ? provs[0] : null;
  escribe(ruta, pagina({
    ruta, titulo, descripcion,
    h1: `Bibliotecas de la ${esc(u.nombre)} (${esc(u.sigla)})`,
    intro: `${plural(lista.length, "biblioteca", "bibliotecas")} de la ${esc(u.nombre)} en ${ciudades.length === 1 ? esc(ciudades[0]) : `${ciudades.length} ciudades y campus`}, ${ver.length} con el horario comprobado en su web oficial. ` +
      `El acceso suele estar limitado a la comunidad universitaria, sobre todo en exámenes: confírmalo en su web. En el mapa ves cuál está abierta ahora y cuál te pilla más cerca.`,
    cuerpo: `${claves.length > 1 ? `<nav class="locs" aria-label="Por ciudad">${claves.map((k) => `<a href="#${slug(k.split("|")[1])}">${esc(k.split("|")[1])} <small>${porC[k].length}</small></a>`).join("")}</nav>` : ""}${secVer}${secEx}${secciones}${fq.html}
<p class="volver"><a href="/bibliotecas/${UNIS_SLUG}/">← Bibliotecas de otras universidades</a>${p0 ? ` · <a href="/bibliotecas/${slug(p0)}/">${esc(p0)}</a>` : ""} · ${enlaceHub}</p>`,
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], ["Universidades", `/bibliotecas/${UNIS_SLUG}/`], [u.sigla, ruta]], migasId: idMigasDe(ruta),
    ld: [ldLugar(ruta, titulo.replace(MARCA, ""), descripcion, { ...parteDeHub(tituloHubUnis, `/bibliotecas/${UNIS_SLUG}/`), ...conMigas(ruta), dateModified: fechaMod(ver),
      about: { "@type": "CollegeOrUniversity", name: u.nombre, alternateName: u.sigla },
      mainEntity: { "@type": "ItemList", name: `Bibliotecas de la ${u.nombre}`, numberOfItems: lista.length,
        itemListElement: claves.flatMap((k) => porC[k].slice().sort(ordenBib)).map((b, k) => ({ "@type": "ListItem", position: k + 1, item: itemBib(b) })) } }), fq.ld],
  }));
  urls.push([ruta, "0.8", fechaMod(ver)]);
});
if (universidades.length) {
  const ruta = `/bibliotecas/${UNIS_SLUG}/`;
  const totB = universidades.reduce((t, u) => t + u.lista.length, 0), totV = universidades.reduce((t, u) => t + u.ver.length, 0);
  const titulo = tituloHubUnis;
  const descripcion = `Bibliotecas de ${universidades.length} universidades españolas (${universidades.slice(0, 4).map((u) => u.sigla).join(", ")}…): ${totB} bibliotecas, ${totV} con horario verificado en su web oficial, por ciudad y campus.`;
  const todasVer = universidades.flatMap((u) => u.ver);
  escribe(ruta, pagina({
    ruta, titulo, descripcion: descripcion.length <= MAX_DESC ? descripcion : descripcion.replace(/ \(.*?\)/, ""),
    h1: "Bibliotecas universitarias por universidad",
    intro: `${totB} bibliotecas de ${universidades.length} universidades, ${totV} con el horario comprobado en su web oficial. Solo salen las universidades con 3 o más bibliotecas en el mapa y alguna con horario verificado.`,
    cuerpo: `<section class="cerca" aria-labelledby="t-unis"><h2 id="t-unis">Por universidad</h2><ul>${universidades.map((u) => {
      const ciud = [...new Set(u.lista.map((b) => b.c))], f = u.ver.filter(abreFinde).length;
      return `<li><a href="${u.ruta}">Bibliotecas de la ${esc(u.nombre)} (${esc(u.sigla)})</a> <small>${plural(u.lista.length, "biblioteca", "bibliotecas")} · ${u.ver.length} con horario verificado${f ? ` (${f} en fin de semana)` : ""} · ${ciud.length <= 3 ? esc(enumera(ciud)) : `${ciud.length} ciudades`}</small></li>`; }).join("")}</ul></section>
<p class="volver"><a href="/bibliotecas/">← Todas las provincias</a>${salas.length ? ` · <a href="/bibliotecas/${SALAS_SLUG}/">Salas de estudio</a>` : ""} · ${enlaceHub}</p>`,
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], ["Universidades", ruta]], migasId: idMigasDe(ruta),
    ld: ldLugar(ruta, titulo.replace(MARCA, ""), descripcion, { ...parteDeIndice(), ...conMigas(ruta), dateModified: fechaMod(todasVer),
      hasPart: universidades.map((u) => refPagina(`Bibliotecas de la ${u.nombre}`, DOMINIO + u.ruta)) }),
  }));
  urls.push([ruta, "0.8", fechaMod(todasVer)]);
}

// ---------- Páginas «Bibliotecas en exámenes» (índice y una por ciudad; datos en exCiudades, más arriba) ----------
// Todo sale de la entrada de temporada-examenes.js: periodo, horario y nota tal cual, con su fuente oficial y la fecha en que
// se comprobó. Si la biblioteca está en el mapa, su ficha, «Ver en el mapa» y su horario habitual solo si está verificado.
// FAQ solo con esos datos. dateModified y lastmod = la comprobación (fv) más reciente.
const periodoEx = (e) => `del ${fechaEs(e.desde)} al ${fechaEs(e.hasta)}`;
const fuentesEx = (l) => enumera([...new Set(l.map((x) => hostDe(x.e.f).replace(/^www\./, "")))]);
const faqDe = (q) => ({ html: `<section class="faq"><h2>Preguntas frecuentes</h2>${q.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join("")}</section>`,
  ld: { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: q.map(([p, r]) => ({ "@type": "Question", name: p, acceptedAnswer: { "@type": "Answer", text: r } })) } });
function tarjetaEx(x) {
  const { e, b, uni, h24 } = x, ficha = b ? paginaDe.get(b.i) : null;
  const habitual = b && verificado(b) ? `<div class="hor">Fuera de exámenes (horario de invierno): ${esc(horarioTexto(b.h.inv))} <small>(verificado el ${esc(fechaEs(b.h.fv))}, <a href="${esc(b.h.f)}" rel="nofollow noopener" target="_blank">fuente</a>)</small></div>` : "";
  const acc = [b ? `<a href="${enlaceApp(b)}">Ver en el mapa</a>` : "Aún no está en el mapa de Bibliomapa",
    ficha ? `<a href="${ficha}">Ficha de la biblioteca</a>` : "",
    uni && uni.ruta ? `<a href="${uni.ruta}">Bibliotecas de la ${esc(uni.sigla)}</a>` : "",
    `<a href="${esc(e.f)}" rel="nofollow noopener" target="_blank">Fuente oficial</a>`].filter(Boolean).join(" · ");
  return `<article class="bib">
  <h3>${ficha ? `<a href="${ficha}">${esc(e.espacio)}</a>` : esc(e.espacio)}</h3>
  <div class="meta"><span class="tipo">${h24 ? "Abierta 24 h" : "Horario de exámenes"}</span>${b && b.dir ? ` · ${esc(b.dir)}` : ` · ${esc(e.ciudad)} (${esc(e.provincia)})`}</div>
  <p class="dest">${esc(cap(periodoEx(e)))}</p>
  <div class="hor ok">🕒 ${esc(conPunto(cap(e.horario)))} <small>(comprobado el ${esc(fechaEs(e.fv))} en la <a href="${esc(e.f)}" rel="nofollow noopener" target="_blank">fuente oficial</a>)</small></div>
  ${e.nota ? `<div class="nota">⚠️ ${esc(e.nota)}</div>` : ""}${habitual}
  <div class="acc">${acc}</div>
</article>`;
}
function tituloEx(g) {
  const c = g.ciudad, cur = g.curso;
  const cand = g.h24 ? [`Biblioteca 24 horas en ${c}: exámenes ${cur}`, `Bibliotecas 24 h en exámenes en ${c} (${cur})`, `Biblioteca 24 h en ${c}: horario de exámenes`]
    : [`Bibliotecas abiertas en exámenes en ${c} ${cur}`, `Horario ampliado en exámenes en ${c} (${cur})`, `Bibliotecas en exámenes en ${c}: horario ${cur}`];
  for (const t of cand) for (const x of [t + MARCA, t]) if (x.length <= MAX_TIT && !titulosUsados.has(x)) { titulosUsados.add(x); return x; }
  const t = cand.concat([`${cand[0]} (${g.p})`]).filter((x) => !titulosUsados.has(x)).sort((a, b) => a.length - b.length)[0];
  titulosUsados.add(t);
  return t;
}
function descripcionEx(g) {
  const l = g.entradas, n = l.length, siglas = [...new Set(l.filter((x) => x.uni).map((x) => x.uni.sigla))];
  const ini = l.map((x) => x.e.desde).sort()[0], finP = l.map((x) => x.e.hasta).sort().pop();
  const que = `${n === 1 ? "Una biblioteca" : `${n} bibliotecas`} de ${g.ciudad}${siglas.length ? ` (${siglas.join(", ")})` : ""} con horario de exámenes ${g.curso}`;
  const n24 = l.filter((x) => x.h24).length;
  const cand = [`${que}${n24 ? `, ${n24 === 1 && n === 1 ? "abierta" : `${n24} abierta${n24 === 1 ? "" : "s"}`} 24 h` : ""}: del ${fechaEs(ini)} al ${fechaEs(finP)}. Horario, fuente oficial y fecha de comprobación.`,
    `${que}: del ${fechaEs(ini)} al ${fechaEs(finP)}, con fuente oficial.`, `${que}.`];
  const d = cand.find((x) => x.length <= MAX_DESC && !descUsadas.has(x)) || cand[cand.length - 1].slice(0, MAX_DESC);
  descUsadas.add(d);
  return d;
}
function faqEx(g) {
  const c = g.ciudad, l = g.entradas, q = [];
  q.push([`¿Qué bibliotecas amplían horario en exámenes en ${c}?`, `Con calendario oficial publicado para el curso ${g.curso}: ${l.map((x) => `${x.e.espacio}, ${periodoEx(x.e)}`).join("; ")}.`]);
  const h24 = l.filter((x) => x.h24);
  if (h24.length) q.push([`¿Hay alguna biblioteca abierta 24 horas en ${c}?`, `Sí, según su fuente oficial: ${h24.map((x) => `${x.e.espacio}, ${periodoEx(x.e)}: ${x.e.horario}`).join(". ")}.`]);
  l.forEach((x) => q.push([`¿Cuál es el horario de ${laBib(x.e.espacio)} en exámenes?`, `${cap(periodoEx(x.e))}: ${conPunto(x.e.horario)}${x.e.nota ? ` ${conPunto(x.e.nota)}` : ""}`]));
  q.push([`¿De dónde salen estas fechas?`, `De la web oficial de cada biblioteca o universidad (${fuentesEx(l)}), comprobada ${fechasFv(l)}. Solo publicamos calendarios oficiales de este curso: si otra biblioteca de ${c} amplía horario y aún no lo ha publicado, no sale aquí. Confírmalo en su web antes de ir.`]);
  return faqDe(q);
}
const tituloHubEx = (() => {
  if (!exCiudades.length) return "";
  const todasEx = exCiudades.flatMap((g) => g.entradas), curso = cursosTexto(todasEx);
  const tBase = `${todasEx.some((x) => x.h24) ? "Bibliotecas 24 horas y horario ampliado" : "Bibliotecas con horario ampliado"} en exámenes ${curso}`;
  const titulo = [tBase + MARCA, tBase].find((x) => x.length <= MAX_TIT && !titulosUsados.has(x)) || tBase;
  titulosUsados.add(titulo);
  return titulo;
})();
exCiudades.forEach((g) => {
  const { ciudad, p, ruta, entradas } = g, ps = slug(p);
  // Página de la ciudad: la de su localidad si la tiene (mismo nombre, por slug) o la de la provincia.
  const cReal = porProv[p] ? (porProv[p].find((b) => slug(b.c) === slug(ciudad)) || {}).c : null;
  const rutaCiudad = porProv[p] ? (cReal ? rutaLugar(p, cReal) : `/bibliotecas/${ps}/`) : null;
  const nombreLugar = rutaCiudad && rutaCiudad !== `/bibliotecas/${ps}/` ? cReal : p;
  const unis = [...new Set(entradas.filter((x) => x.uni && x.uni.ruta).map((x) => x.uni))];
  const titulo = tituloEx(g), descripcion = descripcionEx(g), fq = faqEx(g);
  const ini = entradas.map((x) => x.e.desde).sort()[0], finP = entradas.map((x) => x.e.hasta).sort().pop();
  const mas = [rutaCiudad ? `<li><a href="${rutaCiudad}">Bibliotecas en ${esc(nombreLugar)}</a> <small>todas las del mapa, con su horario habitual si está verificado</small></li>` : "",
    g.salas ? `<li><a href="${g.salas.ruta}">Salas de estudio en ${esc(g.salas.ciudad)}</a> <small>ordenadas por horas de apertura a la semana</small></li>` : "",
    ...unis.map((u) => `<li><a href="${u.ruta}">Bibliotecas de la ${esc(u.nombre)} (${esc(u.sigla)})</a> <small>horarios verificados por campus</small></li>`),
    `<li><a href="${HUB}">Todos los horarios por provincia</a></li>`].filter(Boolean).join("");
  escribe(ruta, pagina({
    ruta, titulo, descripcion,
    h1: `${g.h24 ? "Bibliotecas 24 horas y horario ampliado" : "Bibliotecas con horario ampliado"} en ${esc(ciudad)}: exámenes ${esc(g.curso)}`,
    intro: `${entradas.length === 1 ? "Una biblioteca" : `${entradas.length} bibliotecas`} de ${esc(ciudad)}${slug(ciudad) !== ps ? ` (${esc(p)})` : ""} con horario especial de exámenes publicado en su web oficial, ${esc(periodoEx({ desde: ini, hasta: finP }))}. ` +
      `Copiamos el periodo y el horario tal como los da la fuente (comprobada ${esc(fechasFv(entradas))}); festivos y cierres van en cada una. Pueden cambiar: confírmalo antes de ir.`,
    cuerpo: `<section class="lista" aria-label="Horario de exámenes">${entradas.map(tarjetaEx).join("")}</section>
${fq.html}
<section class="cerca" aria-labelledby="t-mas"><h2 id="t-mas">Más para estudiar en ${esc(ciudad)}</h2><ul>${mas}</ul></section>
<p class="volver"><a href="${EX_RUTA}">← Exámenes en otras ciudades</a>${rutaCiudad ? ` · <a href="${rutaCiudad}">${esc(nombreLugar)}</a>` : ""} · ${enlaceHub}</p>`,
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], ["Exámenes", EX_RUTA], [ciudad, ruta]], migasId: idMigasDe(ruta),
    ld: [ldLugar(ruta, titulo.replace(MARCA, ""), descripcion, { ...parteDeHub(tituloHubEx, EX_RUTA), ...conMigas(ruta), dateModified: g.fv,
      mainEntity: { "@type": "ItemList", name: `Bibliotecas con horario de exámenes en ${ciudad}`, numberOfItems: entradas.length,
        itemListElement: entradas.map((x, k) => ({ "@type": "ListItem", position: k + 1, item: x.b ? itemBib(x.b)
          : { "@type": "Library", name: x.e.espacio, address: { "@type": "PostalAddress", addressLocality: ciudad, addressRegion: p, addressCountry: "ES" } } })) } }), fq.ld],
  }));
  urls.push([ruta, "0.8", g.fv]);
});
if (exCiudades.length) {
  const ruta = EX_RUTA, todasEx = exCiudades.flatMap((g) => g.entradas), curso = cursosTexto(todasEx), fv = todasEx.map((x) => x.e.fv).sort().pop();
  const h24 = todasEx.filter((x) => x.h24), nC = exCiudades.length;
  const tBase = `${h24.length ? "Bibliotecas 24 horas y horario ampliado" : "Bibliotecas con horario ampliado"} en exámenes ${curso}`;
  const titulo = tituloHubEx;
  const ciudadesTxt = enumera(exCiudades.map((g) => g.ciudad));
  const dCand = [`${plural(todasEx.length, "biblioteca", "bibliotecas")} con horario ampliado${h24.length ? " o abiertas 24 h" : ""} en exámenes ${curso} en ${ciudadesTxt}: fechas, horario y fuente oficial.`,
    `${plural(todasEx.length, "biblioteca", "bibliotecas")} con horario ampliado${h24.length ? " o abiertas 24 h" : ""} en exámenes ${curso} en ${plural(nC, "ciudad", "ciudades")}: fechas, horario y fuente oficial.`];
  const descripcion = dCand.find((x) => x.length <= MAX_DESC && !descUsadas.has(x)) || dCand[1].slice(0, MAX_DESC);
  descUsadas.add(descripcion);
  const porInicio = todasEx.slice().sort((a, b) => a.e.desde.localeCompare(b.e.desde)), porFin = todasEx.slice().sort((a, b) => b.e.hasta.localeCompare(a.e.hasta));
  const q = [
    ...(h24.length ? [[`¿Qué bibliotecas abren 24 horas en exámenes ${curso}?`, `Según su fuente oficial: ${h24.map((x) => `${x.e.espacio} (${x.e.ciudad}), ${periodoEx(x.e)}: ${x.e.horario}`).join(". ")}.`]] : []),
    [`¿En qué ciudades amplían horario las bibliotecas en exámenes ${curso}?`, `Con calendario oficial publicado: ${enumera(exCiudades.map((g) => `${g.ciudad} (${plural(g.entradas.length, "biblioteca", "bibliotecas")})`))}. Si tu ciudad no sale, aún no tenemos un calendario oficial de este curso para ella.`],
    [`¿Cuándo empieza y acaba el horario de exámenes?`, `Depende de cada biblioteca. El primero en empezar es el de ${porInicio[0].e.espacio} (${porInicio[0].e.ciudad}), el ${fechaEs(porInicio[0].e.desde)}; el último en acabar, el de ${porFin[0].e.espacio} (${porFin[0].e.ciudad}), el ${fechaEs(porFin[0].e.hasta)}. Las fechas de cada una están en su ciudad.`],
    [`¿De dónde salen estos horarios?`, `De la web oficial de cada biblioteca o universidad (${fuentesEx(todasEx)}), comprobada ${fechasFv(todasEx)}. Solo entran calendarios oficiales de este curso con fechas; no reutilizamos fechas de cursos pasados.`],
  ];
  const fq = faqDe(q);
  const filas = exCiudades.flatMap((g) => g.entradas.map((x) => `<tr><th scope="row">${x.b && paginaDe.get(x.b.i) ? `<a href="${paginaDe.get(x.b.i)}">${esc(x.e.espacio)}</a>` : esc(x.e.espacio)}${x.h24 ? " <small>(24 h)</small>" : ""}</th><td><a href="${g.ruta}">${esc(g.ciudad)}</a></td><td>${esc(fechaEs(x.e.desde))}</td><td>${esc(fechaEs(x.e.hasta))}</td></tr>`)).join("");
  escribe(ruta, pagina({
    ruta, titulo, descripcion,
    h1: esc(tBase),
    intro: `${plural(todasEx.length, "biblioteca", "bibliotecas")} de ${plural(nC, "ciudad", "ciudades")} con horario especial de exámenes del curso ${esc(curso)} publicado en su web oficial${h24.length ? `, ${h24.length === 1 ? "una" : h24.length} abierta${h24.length === 1 ? "" : "s"} 24 horas` : ""}. ` +
      `Solo salen calendarios oficiales con fechas, comprobados ${esc(fechasFv(todasEx))}; en cada ciudad tienes el horario, los cierres y la fuente.`,
    cuerpo: `<nav class="locs" aria-label="Por ciudad">${exCiudades.map((g) => `<a href="${g.ruta}">${esc(g.ciudad)} <small>${g.entradas.length}</small></a>`).join("")}</nav>
<section class="ficha horarios-lugar" aria-labelledby="t-cal"><h2 id="t-cal">Calendario de exámenes ${esc(curso)}</h2>
<table class="horario"><caption>Periodo con horario especial según la fuente oficial de cada biblioteca, por ciudad</caption>
<thead><tr><th scope="col">Biblioteca</th><th scope="col">Ciudad</th><th scope="col">Desde</th><th scope="col">Hasta</th></tr></thead><tbody>${filas}</tbody></table></section>
<section class="cerca" aria-labelledby="t-ciud"><h2 id="t-ciud">Por ciudad</h2><ul>${exCiudades.map((g) => `<li><a href="${g.ruta}">${g.h24 ? "Bibliotecas 24 h y horario ampliado" : "Horario ampliado en exámenes"} en ${esc(g.ciudad)}</a> <small>${plural(g.entradas.length, "biblioteca", "bibliotecas")}${[...new Set(g.entradas.filter((x) => x.uni).map((x) => x.uni.sigla))].map((s) => ` · ${esc(s)}`).join("")} · ${esc(periodoEx({ desde: g.entradas.map((x) => x.e.desde).sort()[0], hasta: g.entradas.map((x) => x.e.hasta).sort().pop() }))}</small></li>`).join("")}</ul></section>
${fq.html}
<p class="volver"><a href="/bibliotecas/">← Todas las provincias</a>${salas.length ? ` · <a href="/bibliotecas/${SALAS_SLUG}/">Salas de estudio</a>` : ""}${universidades.length ? ` · <a href="/bibliotecas/${UNIS_SLUG}/">Universidades</a>` : ""} · ${enlaceHub}</p>`,
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], ["Exámenes", ruta]], migasId: idMigasDe(ruta), head: ESTILO_TABLA_HOR,
    ld: [ldLugar(ruta, titulo.replace(MARCA, ""), descripcion, { ...parteDeIndice(), ...conMigas(ruta), dateModified: fv,
      hasPart: exCiudades.map((g) => refPagina(`Bibliotecas en exámenes en ${g.ciudad}`, DOMINIO + g.ruta)) }), fq.ld],
  }));
  urls.push([ruta, "0.8", fv]);
}

// ---------- Página hub «Bibliotecas por horario» (/bibliotecas/horarios/) ----------
// Reúne en una sola página todas las búsquedas por horario: las temáticas de España (hoy, domingo, fin de semana, hasta
// tarde, verano), salas de estudio y universidades, y por provincia sus temáticas, las de sus localidades, sus salas de
// estudio y sus universidades. Todas esas páginas enlazan aquí («Todos los horarios»). Solo cuenta horarios verificados
// (fuente + fecha); dateModified = la verificación más reciente.
const verifTodas = todas.filter(verificado);
if (temasEspana.length) {
  const ruta = HUB;
  const locsTema = {}; // provincia → [localidad con alguna temática]
  TEMAS_LOC.forEach((t) => Object.keys(temaLoc[t.slug]).forEach((k) => { const [p, c] = k.split("|"); (locsTema[p] = locsTema[p] || new Set()).add(c); }));
  const uniEn = (p) => universidades.filter((u) => u.lista.some((b) => b.p === p));
  const provsHub = provincias.filter((p) => TEMAS.some((t) => temaProv[t.slug][p]) || locsTema[p] || salasDeProv[p] || uniEn(p).length);
  const sinPagina = provincias.filter((p) => !provsHub.includes(p) && porProv[p].some(verificado));
  const provsVerif = new Set(verifTodas.map((b) => b.p)).size;
  const seccionProv = (p) => {
    const ps = slug(p), v = porProv[p].filter(verificado).length;
    const chips = TEMAS.filter((t) => temaProv[t.slug][p]).map((t) =>
      `<a href="/bibliotecas/${ps}/${t.slug}/" title="Bibliotecas ${esc(t.que)} en ${esc(p)}">${esc(t.corto)} <small>${temaProv[t.slug][p].length}</small></a>`).join("");
    const locs = [...(locsTema[p] || [])].sort((a, b) => a.localeCompare(b, "es")).map((c) => `<nav class="temas" aria-label="Por horario en ${esc(c)}"><span>${esc(c)}:</span><a href="/bibliotecas/${ps}/${slug(c)}/" title="Todas las bibliotecas de ${esc(c)}">Todas <small>${porProv[p].filter((b) => b.c === c).length}</small></a>${TEMAS_LOC.filter((t) => temaLoc[t.slug][p + "|" + c]).map((t) =>
      `<a href="/bibliotecas/${ps}/${slug(c)}/${t.slug}/" title="Bibliotecas ${esc(t.que)} en ${esc(c)}">${esc(t.corto)} <small>${temaLoc[t.slug][p + "|" + c].length}</small></a>`).join("")}</nav>`).join("");
    return `<section class="loc" id="${ps}"><h2><a href="/bibliotecas/${ps}/">${esc(p)}</a> <small>${plural(v, "con horario verificado", "con horario verificado")}</small></h2>` +
      `${chips ? `<nav class="temas" aria-label="Por horario en ${esc(p)}"><span>Toda la provincia:</span>${chips}</nav>` : ""}${locs}${navSalas(salasDeProv[p])}${exDeProv(p).length ? navExamenes(exDeProv(p)) : ""}${navUniversidades((b) => b.p === p)}</section>`;
  };
  const listaEspana = temasEspana.map(({ t, l }) => `<li><a href="/bibliotecas/${t.slug}/">Bibliotecas ${esc(t.que)} en España</a> <small>${plural(l.length, "biblioteca", "bibliotecas")} en ${plural(new Set(l.map((b) => b.p)).size, "provincia", "provincias")}</small></li>`)
    .concat(salas.length ? [`<li><a href="/bibliotecas/${SALAS_SLUG}/">Salas de estudio en España</a> <small>${plural(salas.length, "ciudad", "ciudades")}, ordenadas por horas de apertura</small></li>`] : [])
    .concat(exCiudades.length ? [`<li><a href="${EX_RUTA}">Bibliotecas 24 horas y horario ampliado en exámenes</a> <small>${plural(exCiudades.reduce((t, g) => t + g.entradas.length, 0), "biblioteca", "bibliotecas")} en ${plural(exCiudades.length, "ciudad", "ciudades")}, con fuente oficial</small></li>`] : [])
    .concat(universidades.length ? [`<li><a href="/bibliotecas/${UNIS_SLUG}/">Bibliotecas universitarias por universidad</a> <small>${plural(universidades.length, "universidad", "universidades")}</small></li>`] : []);
  // FAQ con datos verificados: dónde abren el domingo, hasta tarde y en verano (provincias), y de dónde salen los horarios.
  const provsDe = (f) => { const n = {}; verifTodas.filter(f).forEach((b) => (n[b.p] = (n[b.p] || 0) + 1));
    return Object.keys(n).sort((a, b) => n[b] - n[a] || a.localeCompare(b, "es")).map((p) => `${p} (${n[p]})`); };
  const lista6 = (l) => l.slice(0, 8).join(", ") + (l.length > 8 ? ` y ${l.length - 8} más` : "");
  const q = [
    ...[["domingo", abreDomingo, "abiertas el domingo"], ["hasta tarde", (b) => cierraTarde(b), "que cierran a las 21:00 o más tarde entre semana"], ["verano", abreVerano, "abiertas en verano"]]
      .map(([, f, que]) => [provsDe(f), que]).filter(([l]) => l.length)
      .map(([l, que]) => [`¿En qué provincias hay bibliotecas ${que}?`, `Con horario verificado en su web oficial, hay bibliotecas ${que} en ${plural(l.length, "provincia", "provincias")}: ${lista6(l)}.`]),
    [`¿De dónde salen estos horarios?`, `De la web oficial de cada biblioteca: cada horario lleva su fuente y la fecha en que se comprobó (${textoFechas(verifTodas)}). Las bibliotecas sin horario verificado no salen en estas páginas; en el mapa tienen su ficha y su web.`],
  ];
  const fq = { html: `<section class="faq"><h2>Preguntas frecuentes</h2>${q.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join("")}</section>`,
    ld: { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: q.map(([p, r]) => ({ "@type": "Question", name: p, acceptedAnswer: { "@type": "Answer", text: r } })) } };
  const titulo = ["Bibliotecas por horario: domingo, tarde y verano", "Bibliotecas por horario en España", "Horarios de bibliotecas por provincia"]
    .flatMap((t) => [t + MARCA, t]).find((x) => x.length <= MAX_TIT && !titulosUsados.has(x));
  titulosUsados.add(titulo);
  const dBase = `Bibliotecas abiertas hoy, el domingo, el fin de semana, hasta tarde y en verano en ${provsHub.length} provincias, con salas de estudio y universidades.`;
  const descripcion = [`${dBase} ${verifTodas.length} horarios verificados.`, dBase].find((x) => x.length <= MAX_DESC) || dBase.slice(0, MAX_DESC - 1) + "…";
  const hasPart = temasEspana.map(({ t }) => refPagina(`Bibliotecas ${t.que} en España`, `${DOMINIO}/bibliotecas/${t.slug}/`))
    .concat(provsHub.flatMap((p) => TEMAS.filter((t) => temaProv[t.slug][p]).map((t) => refPagina(`Bibliotecas ${t.que} en ${p}`, `${DOMINIO}/bibliotecas/${slug(p)}/${t.slug}/`))));
  escribe(ruta, pagina({
    ruta, titulo, descripcion,
    h1: "Bibliotecas por horario en España",
    intro: `${verifTodas.length} bibliotecas de ${provsVerif} provincias tienen el horario comprobado en su web oficial ${esc(textoFechas(verifTodas))}. Aquí están todas las búsquedas por horario: abiertas hoy, el domingo, el fin de semana, hasta tarde y en verano, y las salas de estudio, por provincia y localidad.`,
    cuerpo: `<section class="cerca" aria-labelledby="t-esp"><h2 id="t-esp">En toda España</h2><ul>${listaEspana.join("")}</ul></section>
<h2 id="t-prov">Por provincia</h2>
<nav class="locs" aria-labelledby="t-prov">${provsHub.map((p) => `<a href="#${slug(p)}">${esc(p)}</a>`).join("")}</nav>
${provsHub.map(seccionProv).join("")}
${sinPagina.length ? `<p class="nota">Con horario verificado pero aún sin páginas por horario (hacen falta 2 bibliotecas que cumplan): ${sinPagina.map((p) => `<a href="/bibliotecas/${slug(p)}/">${esc(p)}</a> <small>(${porProv[p].filter(verificado).length})</small>`).join(", ")}.</p>` : ""}
${fq.html}
<p class="volver"><a href="/bibliotecas/">← Todas las provincias</a></p>`,
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], ["Por horario", ruta]], migasId: idMigasDe(ruta),
    ld: [ldLugar(ruta, titulo.replace(MARCA, ""), descripcion, { ...parteDeIndice(), ...conMigas(ruta), dateModified: fechaMod(verifTodas), hasPart }), fq.ld],
  }));
  urls.push([ruta, "0.9", fechaMod(verifTodas)]);
}

// índice: CollectionPage (mismo nombre y descripción que el título y la meta description; dateModified = verificación
// más reciente de toda España) con mainEntity ItemList de las provincias, en el orden del HTML (<nav class="locs grande">).
{
const tituloIndice = `${NOMBRE_INDICE} | Bibliomapa`;
const descIndice = `Más de ${Math.floor(todas.length / 100) * 100} bibliotecas de toda España por provincia y localidad: horarios verificados, salas de estudio y cuáles están abiertas ahora.`;
const modIndice = verifTodas.length ? { dateModified: fechaMod(verifTodas) } : {};
urls.find(([u]) => u === "/bibliotecas/")[2] = modIndice.dateModified;
escribe("/bibliotecas/", pagina({
  ruta: "/bibliotecas/", titulo: tituloIndice, descripcion: descIndice,
  h1: "Bibliotecas de España por provincia", intro: `${todas.length} bibliotecas en ${provincias.length} provincias. Encuentra la tuya y mira en el mapa cuál está abierta ahora.`,
  cuerpo: `${temasEspana.length ? `<nav class="temas" aria-label="Por horario"><span>Por horario:</span>${temasEspana.map(({ t, l }) => `<a href="/bibliotecas/${t.slug}/">${esc(t.corto)} <small>${l.length}</small></a>`).join("")}<a href="${HUB}">Por provincia</a></nav>` : ""}${salas.length || exCiudades.length ? `<nav class="temas" aria-label="Para estudiar"><span>Para estudiar:</span>${salas.length ? `<a href="/bibliotecas/${SALAS_SLUG}/">Salas de estudio <small>${salas.length} ciudades</small></a>` : ""}${exCiudades.length ? `<a href="${EX_RUTA}">Exámenes: 24 h y horario ampliado <small>${plural(exCiudades.length, "ciudad", "ciudades")}</small></a>` : ""}</nav>` : ""}${universidades.length ? `<nav class="temas" aria-label="Por universidad"><span>Por universidad:</span><a href="/bibliotecas/${UNIS_SLUG}/">Todas <small>${universidades.length}</small></a>${universidades.map((u) => `<a href="${u.ruta}" title="Bibliotecas de la ${esc(u.nombre)}">${esc(u.sigla)} <small>${u.lista.length}</small></a>`).join("")}</nav>` : ""}<nav class="locs grande">${provincias.map((p) => `<a href="/bibliotecas/${slug(p)}/">${esc(p)} <small>${porProv[p].length}</small></a>`).join("")}</nav>`,
  migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"]], migasId: idMigasDe("/bibliotecas/"),
  ld: ldLugar("/bibliotecas/", tituloIndice.replace(MARCA, ""), descIndice, { ...modIndice, ...conMigas("/bibliotecas/"),
    mainEntity: { "@type": "ItemList", name: "Bibliotecas de España por provincia", numberOfItems: provincias.length,
      itemListElement: provincias.map((p, k) => ({ "@type": "ListItem", position: k + 1, item: refPagina(`Bibliotecas en ${p}`, `${DOMINIO}/bibliotecas/${slug(p)}/`) })) } }),
}));
}

// ---------- 404 (/404.html) ----------
// «¿Buscabas…?»: si la URL es /bibliotecas/<algo>/…, el script compara <algo> (sin tildes, en minúsculas) con los slugs de
// las provincias que la propia página enlaza en #prov-404 (no lleva lista aparte: si cambia el nav, cambia la sugerencia).
// Vale el slug igual, una distancia de edición ≤ 2 (≤ 1 en los de 4 letras o menos; también sin guiones) o un prefijo
// de 3 letras o más que solo encaja en una provincia; con dos igual de cerca, o ninguna, no muestra nada. El enlace se crea
// con el DOM (sin href="…" en el código: el HTML no gana enlaces) y el texto va con textContent. Sin librerías ni datos.
// comprobar_paginas_seo.js lo ejecuta con /bibliotecas/navara/ → «Navarra» y falla si falta el script o #buscabas.
// Antes de la distancia de edición mira ALIAS_404: nombres castellanos o antiguos, islas y capitales que la distancia no
// alcanza (vizcaya → bizkaia). Fuera de /bibliotecas/ (/navarra/, /bizkaia, /Vizcaya.html) prueba el primer tramo de la
// ruta, pero solo igual (sin tildes ni guiones) o alias: sin distancia ni prefijo, para no sugerir provincias en rutas que
// no lo son (/sevila/, /leon-x/, /no-existe → nada). Clave = slug sin guiones; valor = slug de una provincia que la página enlaza (se comprueba
// aquí abajo al generar: si una provincia cambia de slug, el script falla en vez de sugerir un enlace roto).
const ALIAS_404 = {
  vizcaya: "bizkaia", bilbao: "bizkaia",
  guipuzcoa: "gipuzkoa", donostia: "gipuzkoa", sansebastian: "gipuzkoa",
  araba: "alava", vitoria: "alava", gasteiz: "alava", vitoriagasteiz: "alava",
  mallorca: "baleares", palma: "baleares", palmademallorca: "baleares", menorca: "baleares", ibiza: "baleares",
  eivissa: "baleares", formentera: "baleares", illesbalears: "baleares", islasbaleares: "baleares",
  tenerife: "santa-cruz-de-tenerife", lapalma: "santa-cruz-de-tenerife", lagomera: "santa-cruz-de-tenerife", elhierro: "santa-cruz-de-tenerife",
  grancanaria: "las-palmas", lanzarote: "las-palmas", fuerteventura: "las-palmas",
  pamplona: "navarra", iruna: "navarra", nafarroa: "navarra",
  rioja: "la-rioja", logrono: "la-rioja", oviedo: "asturias", santander: "cantabria",
};
const ESTILO_BUSCABAS = `<style>.buscabas{font-size:var(--fs-l);font-weight:700;color:var(--texto);background:var(--acento-tenue);
border:1px solid var(--linea);border-radius:var(--r-m);padding:10px 14px;margin:6px 0 12px}.buscabas a{color:var(--acento-tx)}</style>`;
// Segundo tramo (2026-11-02): si /bibliotecas/<provincia>/<algo>/ (provincia igual o por alias) y <algo> no existe,
// compara <algo> con las localidades y temáticas de esa provincia (mismas reglas: distancia ≤ 2, prefijo único);
// si nada encaja, sugiere la provincia como antes. Y /bibliotecas/<algo>/ compara también con las páginas de toda
// España (/bibliotecas/abiertas-domingos/ → abiertas el domingo). Los slugs van en <script type="application/json"
// id="slugs-404"> (sin enlaces): e = [slug, texto] de España, t = [slug, texto] de temáticas, p = {provincia: [nombres de
// localidad, índices en t]}. Los textos salen del h1 de cada página (el de provincia sin « en <provincia>»). El slug de una localidad es norm(nombre) (igual que slug() aquí).
const SCRIPT_BUSCABAS = `<script id="buscabas-js">(function(){
var r=location.pathname.split("/"),fuera=r[1]!=="bibliotecas",i=fuera?1:2,caja=document.getElementById("buscabas"),D={},P=[],m;if(!r[i]||!caja)return;
try{D=JSON.parse(document.getElementById("slugs-404").textContent)}catch(e){}
function norm(s){try{s=decodeURIComponent(s)}catch(e){}return s.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function dist(a,b){var f=[],i,j,p,t;for(j=0;j<=b.length;j++)f[j]=j;for(i=1;i<=a.length;i++){p=f[0];f[0]=i;for(j=1;j<=b.length;j++){t=f[j];f[j]=Math.min(f[j]+1,f[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return f[b.length]}
function busca(g,C,ex){var x=norm(g.replace(/\\.html?$/i,"")),xs=x.replace(/-/g,""),mejor=null,dm=9,emp=0,pre=null;if(x.length<2)return null;
C.forEach(function(c){var s=c[0],ss=s.replace(/-/g,"");if(ex){if(xs===ss)mejor=c;return}
var d=Math.min(dist(x,s),dist(xs,ss)),lim=s.length<=4?1:2;
if(d<=lim){if(d<dm){dm=d;mejor=c;emp=0}else if(d===dm)emp=1}
if(x.length>=3&&(s.indexOf(x)===0||x.indexOf(s+"-")===0))pre=pre?-1:c});
if(ex)return mejor;if(!mejor&&pre&&pre!==-1)return pre;return emp?null:mejor}
[].forEach.call(document.querySelectorAll("#prov-404 a"),function(a){var s=(a.getAttribute("href")||"").split("/")[2];if(s)P.push([s,a.getAttribute("href"),(a.firstChild&&a.firstChild.textContent||"").trim(),1])});
var al=${JSON.stringify(ALIAS_404)}[norm(r[i].replace(/\\.html?$/i,"")).replace(/-/g,"")];
if(al)P.forEach(function(c){if(c[0]===al)m=c});else m=busca(r[i],P.concat((D.e||[]).map(function(e){return[e[0],"/bibliotecas/"+e[0]+"/",e[1]]})),fuera);
if(!m)return;
if(m[3]&&!fuera&&r[3]&&(al||busca(r[2],[m],1))){var L=(D.p||{})[m[0]]||[[],[]],h="/bibliotecas/"+m[0]+"/",n=busca(r[3],L[0].map(function(l){return[norm(l),h+norm(l)+"/",l]}).concat(L[1].map(function(k){var t=D.t[k];return[t[0],h+t[0]+"/",t[1]+" en "+m[2]]})));if(n)m=n}
var l=document.createElement("a");l.href=m[1];l.textContent=m[2];
caja.textContent="¿Buscabas ";caja.appendChild(l);caja.appendChild(document.createTextNode("?"));caja.hidden=false;
})();</script>`;
// Vercel sirve /404.html (con estado 404) en cualquier URL que no existe de un sitio estático. noindex y fuera del
// sitemap; enlaza a las provincias, al hub de horarios y a «abiertas hoy» (si existe) para no perder la visita.
// node scripts/comprobar_paginas_seo.js revisa sus enlaces, el noindex y que no esté en el sitemap.
{
  const hoyT = temasEspana.find(({ t }) => t.slug === "abiertas-hoy");
  const slugsProv = new Set(provincias.map(slug));
  for (const [a, s] of Object.entries(ALIAS_404)) {
    if (!slugsProv.has(s)) throw new Error(`ALIAS_404: «${a}» apunta a «${s}», que no es el slug de ninguna provincia`);
    if (slugsProv.has(a) || /[^a-z0-9]/.test(a)) throw new Error(`ALIAS_404: «${a}» no vale como alias (es un slug o lleva guiones)`);
  }
  // Datos de «¿Buscabas…?» para el segundo tramo, sacados de las páginas generadas (urls + h1De): nada inventado.
  const fichas = new Set(paginaDe.values()), minus = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const S404 = { e: [], t: [], p: {} }, temaN = {};
  for (const [u] of urls) {
    const x = (u.match(/^\/bibliotecas\/([^/]+)\/$/) || [])[1];
    if (x && !slugsProv.has(x)) S404.e.push([x, minus(h1De.get(u) || "")]);
  }
  for (const p of provincias) {
    const ps = slug(p), locs = [], temas = [];
    for (const [u] of urls) {
      const x = (u.match(new RegExp(`^/bibliotecas/${ps}/([^/]+)/$`)) || [])[1];
      if (!x || fichas.has(u)) continue;
      const c = porProv[p].find((b) => slug(b.c) === x && tieneLocPagina(p, b.c, porProv[p].filter((o) => o.c === b.c).length));
      if (c) { locs.push(c.c); continue; }
      const h = h1De.get(u), suf = ` en ${p}`;
      if (!h || !h.endsWith(suf)) throw new Error(`404: el h1 de ${u} («${h}») no acaba en «${suf}»`);
      const et = minus(h.slice(0, -suf.length));
      if (!(x in temaN)) { temaN[x] = S404.t.length; S404.t.push([x, et]); }
      else if (S404.t[temaN[x]][1] !== et) throw new Error(`404: ${x} tiene dos textos («${S404.t[temaN[x]][1]}» y «${et}»)`);
      temas.push(temaN[x]);
    }
    if (locs.length || temas.length) S404.p[ps] = [locs, temas];
  }
  for (const [x, t] of [...S404.e, ...S404.t]) if (!t || /[<>&"]/.test(t)) throw new Error(`404: texto de ${x} vacío o con HTML («${t}»)`);
  fs.writeFileSync(path.join(RAIZ, "404.html"), pagina({
    ruta: "/404.html", noindex: true,
    titulo: "Página no encontrada | Bibliomapa",
    descripcion: "Esa página no existe. Busca tu biblioteca por provincia, por horario o mira cuáles están abiertas hoy en el mapa de Bibliomapa.",
    h1: "Esa página no existe",
    intro: `Puede que el enlace esté mal escrito o que la página se haya movido. Desde aquí puedes buscar entre las ${todas.length} bibliotecas de ${provincias.length} provincias o abrir el mapa.`,
    cuerpo: `<nav class="temas" aria-label="Por horario"><span>Por horario:</span>${hoyT ? `<a href="/bibliotecas/abiertas-hoy/">Abiertas hoy <small>${hoyT.l.length}</small></a>` : ""}${temasEspana.length ? `<a href="${HUB}">Todos los horarios por provincia</a>` : ""}<a href="/bibliotecas/">Todas las provincias</a></nav>
<h2 id="t-prov">Bibliotecas por provincia</h2>
<nav class="locs grande" id="prov-404" aria-labelledby="t-prov">${provincias.map((p) => `<a href="/bibliotecas/${slug(p)}/">${esc(p)} <small>${porProv[p].length}</small></a>`).join("")}</nav>
<script type="application/json" id="slugs-404">${JSON.stringify(S404).replace(/</g, "\\u003c")}</script>
${SCRIPT_BUSCABAS}`,
    head: ESTILO_BUSCABAS,
    trasH1: `<p id="buscabas" class="buscabas" hidden></p>\n`,
    migas: [["Bibliomapa", "/"], ["Página no encontrada", "/404.html"]],
  }));
}

// ---------- Guías (/estudiar/): una página por problema que resuelve la app, para buscadores y asistentes de IA ----------
// Contenido en scripts/guias_seo.js (sin cifras inventadas: {N}, {V} y {P} salen de los datos). Cada guía responde en la
// primera frase (lo que citan los buscadores y las IA), con pasos (HowTo), preguntas (FAQPage) y enlaces a las páginas de datos.
const GUIAS = require("./guias_seo.js");
const nVerifTodas = todas.filter(verificado).length;
const cifras = (t) => String(t).replace(/\{N\}/g, todas.length.toLocaleString("es-ES")).replace(/\{V\}/g, nVerifTodas).replace(/\{P\}/g, provincias.length);
const ORG = { "@type": "Organization", "@id": DOMINIO + "/#org", name: "Bibliomapa", url: DOMINIO + "/", logo: DOMINIO + "/icons/icon-512.png" };
const APP_LD = { "@type": "WebApplication", "@id": DOMINIO + "/#app", name: "Bibliomapa", url: DOMINIO + "/", applicationCategory: "EducationalApplication", operatingSystem: "Web, Android", offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" } };
{
  const hub = "/estudiar/";
  GUIAS.forEach((g) => {
    const ruta = `${hub}${g.slug}/`, url = DOMINIO + ruta;
    const pasos = g.pasos.map(([n, t]) => [cifras(n), cifras(t)]), faqG = g.faq.map(([q, r]) => [cifras(q), cifras(r)]);
    const ld = { "@context": "https://schema.org", "@graph": [
      { "@type": "WebPage", "@id": url + "#pagina", url, name: cifras(g.titulo), description: cifras(g.descripcion), inLanguage: "es-ES",
        isPartOf: { "@id": DOMINIO + "/#web" }, breadcrumb: { "@id": url + "#migas" }, about: { "@id": DOMINIO + "/#app" }, publisher: { "@id": DOMINIO + "/#org" },
        dateModified: HOY, abstract: cifras(g.respuesta) },
      { "@type": "HowTo", "@id": url + "#pasos", name: cifras(g.h1), step: pasos.map(([n, t], k) => ({ "@type": "HowToStep", position: k + 1, name: n, text: t })), tool: { "@id": DOMINIO + "/#app" } },
      { "@type": "FAQPage", "@id": url + "#faq", mainEntity: faqG.map(([q, r]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: r } })) },
      ORG, APP_LD] };
    escribe(ruta, pagina({
      ruta, titulo: cifras(g.titulo), descripcion: cifras(g.descripcion), h1: esc(cifras(g.h1)), migasId: url + "#migas",
      intro: `<strong>${esc(cifras(g.respuesta))}</strong>`,
      cta: `<a class="cta" href="${g.cta[0]}">${esc(g.cta[1])}</a>`,
      cuerpo: g.secciones.map(([t, x]) => `<section class="ficha"><h2>${esc(t)}</h2><p>${esc(cifras(x))}</p></section>`).join("\n") +
        `\n<section class="ficha"><h2>Cómo hacerlo con Bibliomapa</h2><ol class="pasos">${pasos.map(([n, t]) => `<li><strong>${esc(n)}.</strong> ${esc(t)}</li>`).join("")}</ol></section>` +
        `\n<section class="faq"><h2>Preguntas frecuentes</h2>${faqG.map(([q, r]) => `<details open><summary>${esc(q)}</summary><p>${esc(r)}</p></details>`).join("")}</section>` +
        `\n<nav class="temas" aria-label="Relacionado"><span>Relacionado:</span>${g.enlaces.map(([u, t]) => `<a href="${u}">${esc(t)}</a>`).join("")}<a href="${hub}">Todas las guías</a></nav>` +
        `\n<p class="fuente">Actualizado el ${HOY.split("-").reverse().join("/")}. Bibliomapa es gratuito y funciona sin cuenta.</p>`,
      ld, migas: [["Bibliomapa", "/"], ["Guías para estudiar", hub], [g.corto, ruta]],
    }));
    urls.push([ruta, "0.8", HOY]);
  });
  const urlHub = DOMINIO + hub;
  escribe(hub, pagina({
    ruta: hub, titulo: "Guías para estudiar mejor: dónde, cómo y con quién | Bibliomapa",
    descripcion: cifras("Dónde estudiar hoy, Pomodoro, concentrarse sin el móvil, estudiar con amigos, organizar exámenes y bibliotecas 24 horas: guías prácticas y gratis."),
    h1: "Guías para estudiar mejor", migasId: urlHub + "#migas",
    intro: cifras("Respuestas cortas a los problemas de cada día al estudiar, y cómo resolverlos gratis con Bibliomapa: un mapa de {N} bibliotecas de España, cronómetro, Pomodoro, bosque de árboles, agenda de exámenes y amigos."),
    cuerpo: `<nav class="locs grande" aria-label="Guías">${GUIAS.map((g) => `<a href="${hub}${g.slug}/">${esc(g.corto)}</a>`).join("")}</nav>\n` +
      GUIAS.map((g) => `<section class="ficha"><h2><a href="${hub}${g.slug}/">${esc(cifras(g.h1))}</a></h2><p>${esc(cifras(g.respuesta))}</p></section>`).join("\n"),
    ld: { "@context": "https://schema.org", "@graph": [{ "@type": "CollectionPage", "@id": urlHub + "#pagina", url: urlHub, name: "Guías para estudiar mejor", inLanguage: "es-ES",
      isPartOf: { "@id": DOMINIO + "/#web" }, breadcrumb: { "@id": urlHub + "#migas" }, publisher: { "@id": DOMINIO + "/#org" },
      hasPart: GUIAS.map((g) => ({ "@type": "WebPage", url: `${urlHub}${g.slug}/`, name: cifras(g.h1) })) }, ORG] },
    migas: [["Bibliomapa", "/"], ["Guías para estudiar", hub]],
  }));
  urls.push([hub, "0.8", HOY]);

  // llms.txt (https://llmstxt.org): resumen en Markdown para asistentes de IA. Hechos verificables y enlaces a las páginas clave.
  fs.writeFileSync(path.join(RAIZ, "llms.txt"), `# Bibliomapa

> Bibliomapa (bibliomapa.es) es una app web gratuita para estudiantes y opositores de España: mapa de ${todas.length.toLocaleString("es-ES")} bibliotecas y salas de estudio de ${provincias.length} provincias con las abiertas ahora, horarios (${nVerifTodas} comprobados en la web oficial de cada biblioteca, con fecha y fuente), afluencia indicada por los usuarios, cronómetro y Pomodoro que plantan un árbol por sesión, agenda de exámenes y estudio con amigos. Se usa sin cuenta.

Datos de bibliotecas: Overture Maps Foundation y colaboradores de OpenStreetMap; horarios solo de fuentes oficiales, nunca estimados. Si una biblioteca no tiene horario verificado, la página lo dice.

## Para responder a «¿qué biblioteca está abierta…?»
- [Bibliotecas de España por provincia](${DOMINIO}/bibliotecas/): índice de provincias y localidades
- [Bibliotecas abiertas hoy](${DOMINIO}/bibliotecas/abiertas-hoy/)
- [Bibliotecas abiertas el domingo](${DOMINIO}/bibliotecas/abiertas-domingo/)
- [Bibliotecas abiertas hasta tarde](${DOMINIO}/bibliotecas/abiertas-hasta-tarde/)
- [Todos los horarios por provincia](${DOMINIO}${HUB})
- [Salas de estudio por ciudad](${DOMINIO}/bibliotecas/salas-de-estudio/)
- [Bibliotecas por universidad](${DOMINIO}/bibliotecas/universidades/)
- [Bibliotecas 24 horas y horario de exámenes](${DOMINIO}/bibliotecas/examenes/)

## Guías (problemas que resuelve la app)
${GUIAS.map((g) => `- [${cifras(g.h1)}](${DOMINIO}${hub}${g.slug}/): ${cifras(g.respuesta).split(". ")[0]}.`).join("\n")}

## La app
- [Abrir Bibliomapa](${DOMINIO}/): gratis, en el navegador, instalable en Android
- [Privacidad](${DOMINIO}/privacidad.html)
`);
}

fs.writeFileSync(path.join(RAIZ, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, pr, mod]) => `  <url><loc>${DOMINIO}${u}</loc><lastmod>${lastmodDe(u, mod)}</lastmod><priority>${pr}</priority></url>`).join("\n")}
</urlset>
`);
// Buscadores y asistentes de IA (búsqueda y respuestas en vivo): todos bienvenidos; se nombran para dejarlo explícito.
const BOTS_IA = ["Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User", "GPTBot", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot", "Applebot-Extended", "DuckAssistBot", "meta-externalagent", "MistralAI-User", "CCBot"];
fs.writeFileSync(path.join(RAIZ, "robots.txt"), `User-agent: *
Allow: /

${BOTS_IA.map((b) => `User-agent: ${b}\nAllow: /`).join("\n\n")}

Sitemap: ${DOMINIO}/sitemap.xml
`);
console.log(`Vecinas: ${locsConPagina.filter((x) => !localidadesCercanas(x.p, x.c).length).length} de ${locsConPagina.length} localidades sin «Localidades cercanas» (ninguna con página a menos de 150 km)`);
{ const sinCambio = urls.filter(([u]) => u !== "/" && huellaNueva.get(u) === huellaAntes.get(u)).length;
  console.log(`Lastmod: ${sinCambio} páginas iguales que antes (conservan su fecha) · ${urls.length - 1 - sinCambio} nuevas o cambiadas (${HOY})`); }
console.log(`Páginas: ${urls.length - 1} (+ portada) · provincias: ${provincias.length} · bibliotecas: ${todas.length} · con página propia: ${paginaDe.size} (${conPaginaPropia.filter(verificado).length} con horario verificado)`);
console.log(`Universidades: ${universidades.length} con página (${universidades.map((u) => `${u.sigla} ${u.lista.length}/${u.ver.length}`).join(", ")}) · sin página: ${UNIVERSIDADES.filter((u) => !u.ruta).map((u) => `${u.sigla} ${u.lista.length}/${u.lista.filter(verificado).length}`).join(", ")} · dudosas (casan con 2): ${uniDudosas.length}`);
console.log(`Exámenes: ${exCiudades.length} ciudades con página (${exCiudades.map((g) => `${g.ciudad} ${g.entradas.length}`).join(", ")}) de ${EXAMENES.length} entradas vigentes`);
console.log(`Fichas con horario especial en JSON-LD (specialOpeningHoursSpecification): ${nFichasEspeciales} · con horario de verano verificado: ${nFichasVerano} · con horario de exámenes: ${nFichasEx} de ${[...exDeBib.keys()].length} bibliotecas del mapa con entrada vigente`);
console.log(`hasPart en provincias y localidades: ${nLugarHasPart} páginas · ${nHasPart} partes`);
console.log(`hasPart en temáticas de provincia y de España: ${nTemaHasPart} páginas · ${nHasPartTema} partes`);
console.log(`isPartOf en temáticas de localidad y de provincia: ${nTemaIsPartOf} páginas`);
console.log(`isPartOf en provincias y localidades: ${nLugarIsPartOf} páginas`);
console.log(`isPartOf en salas de estudio, universidades y exámenes (su hub): ${nHubIsPartOf} páginas`);
console.log(`isPartOf al índice en los hubs (salas, universidades, exámenes y horarios): ${nHubIndice} páginas`);
console.log(`isPartOf en fichas (su localidad o provincia): ${nFichasIsPartOf} de ${paginaDe.size}`);
console.log(`breadcrumb {"@id": "<ruta>#migas"} en el índice, provincias, localidades, temáticas de España, de provincia y de localidad, hubs, salas de estudio, universidades y ciudades de exámenes: ${nMigasId} páginas`);
console.log(`FAQPage en el grafo de su CollectionPage (@id <ruta>#faq, isPartOf → <ruta>#pagina) en páginas que no son ficha: ${nFaqEnGrafo}`);
console.log(`Provincias con ItemList de sus fichas en el JSON-LD: ${nProvItemList} de ${provincias.length} · elementos: ${nItemsProv}`);
console.log(`Localidades sin ninguna verificada con «Cerca, con horario verificado» (≤ ${RADIO_VERIF_KM} km del centroide): ${nLocsVerifCerca} · enlaces: ${nEnlacesLocVerifCerca}`);
console.log(`Fichas con «Cerca, con horario verificado» (≤ ${RADIO_VERIF_KM} km, otra ficha): ${nFichasVerifCerca} de ${paginaDe.size} · enlaces: ${nEnlacesVerifCerca}`);
console.log(`Navarra: ${nNavarraConHorario} de ${navarra.length} con horario publicable (fuenteHorario + verificadoHorario en app.js)`);
console.log(`isPartOf/hasPart/item a otra página con el @id de su nodo (<url>#pagina): ${nRefId}`);
