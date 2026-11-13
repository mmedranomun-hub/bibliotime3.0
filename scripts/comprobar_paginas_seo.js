#!/usr/bin/env node
/* Comprueba las páginas generadas por scripts/generar_paginas_seo.js (bibliotecas/…):
     - enlaces internos rotos (href="/…" que no llevan a un archivo o a una carpeta con index.html; también los #ancla
       de la misma página o de otra página generada),
     - títulos y meta descriptions repetidos o de más de 65 / 160 caracteres,
     - páginas sin enlace entrante desde otra página (huérfanas) y URL del sitemap que no existen o que faltan en él,
     - <lastmod> del sitemap que falta, no es AAAA-MM-DD, es posterior a hoy o anterior al dateModified del JSON-LD de su
       página (la página diría que cambió después de lo que dice el sitemap),
     - elementos de los ItemList del JSON-LD (temáticas, localidades…) que apuntan a /#bib=… aunque la biblioteca tiene
       ficha, o cuyo @id no es el de su ficha (<ficha>#biblioteca): lista y ficha deben ser la misma entidad,
     - páginas de provincia o de localidad que enlazan a fichas pero cuyo CollectionPage no lleva mainEntity ItemList,
     - el índice /bibliotecas/ sin CollectionPage (con dateModified y mainEntity ItemList de las provincias, cada una una
       página que existe y que el índice enlaza),
     - hasPart de los CollectionPage que apunta a una página que no existe o que la página no enlaza en su HTML, y
       temáticas de provincia o de España que enlazan las de sus localidades («Por localidad») o provincias (cabeceras
       de sección) sin declararlas en su hasPart,
     - temáticas de localidad (/bibliotecas/<prov>/<loc>/<tema>/) y de provincia (/bibliotecas/<prov>/<tema>/) sin isPartOf,
       o con un isPartOf que no es la temática superior (la de su provincia si existe, si no la de España; la de provincia,
       la de España), no existe, no tiene el mismo name que el CollectionPage destino, no está enlazado en su
       <p class="volver"> o, si la página o la superior son de provincia, no es recíproco con el hasPart de la superior;
       y temáticas de España (/bibliotecas/<tema>/) sin isPartOf CollectionPage al índice /bibliotecas/ enlazado en su
       «volver» y con su mismo name (sin reciprocidad: el índice solo lista provincias),
     - provincias (/bibliotecas/<prov>/) y localidades (/bibliotecas/<prov>/<loc>/) sin isPartOf CollectionPage a la página
       que enlaza su <p class="volver"> (la localidad, su provincia; la provincia, el índice), con el mismo name que el
       CollectionPage destino y recíproco con el hasPart de la provincia (localidades) o el ItemList del índice (provincias);
       y el índice, con isPartOf WebSite,
     - fichas (/bibliotecas/<prov>/<ficha>/) cuyo WebPage no lleva isPartOf CollectionPage a la página que enlaza primero
       su <p class="volver"> (su localidad si tiene página; si no, su provincia), con el mismo name que su CollectionPage;
       y al revés, cada ficha del mainEntity ItemList de una localidad la declara como isPartOf, y cada una del de una
       provincia declara la provincia o una localidad suya (la reciprocidad solo se exige a las fichas que están en el
       ItemList: la provincia lista solo las 4 primeras de cada localidad con página),
     - salas de estudio (/bibliotecas/<prov>/[<loc>/]salas-de-estudio/), universidades (/bibliotecas/universidades/<uni>/)
       y exámenes (/bibliotecas/examenes/<ciudad>/) sin isPartOf CollectionPage a su hub (/bibliotecas/salas-de-estudio/,
       /bibliotecas/universidades/, /bibliotecas/examenes/), que debe ser el primer enlace de su <p class="volver">, con
       el mismo name que el CollectionPage del hub y estar en su hasPart; al revés, cada parte del hasPart del hub la
       declara como isPartOf; y los hubs (esos tres y /bibliotecas/horarios/), con isPartOf CollectionPage al índice
       /bibliotecas/, primer enlace de su «volver» y con el mismo name que el CollectionPage del índice,
     - la 404 (/404.html, que Vercel sirve en cualquier URL inexistente): que exista, lleve noindex y no canonical, no
       esté en el sitemap, sus enlaces sean absolutos y no estén rotos, y enlace a las provincias, al hub y a «abiertas hoy»;
       y que su «¿Buscabas…?» (#buscabas + <script id="buscabas-js">) exista y sugiera bien (se ejecuta con un DOM mínimo),
     - fichas cuyo WebPage no lleva breadcrumb {"@id": "<ficha>#migas"}, sin BreadcrumbList con ese @id en la misma
       página, o cuyo penúltimo elemento de las migas no es la url de su isPartOf (o el último no es la ficha); y lo
       mismo en el índice /bibliotecas/, provincias, localidades y temáticas de España, de provincia y de localidad
       (breadcrumb en su CollectionPage), con el penúltimo igual al isPartOf en el índice (el WebSite), provincias,
       localidades y temáticas de España (el índice) y al primer enlace de su «volver» en las de provincia y localidad;
       y en los hubs (horarios, universidades, exámenes y salas de estudio), las universidades y las ciudades de
       exámenes y las salas de estudio de provincia y localidad, con el penúltimo igual a la url de su isPartOf (el
       índice; su hub). Falla con cualquier BreadcrumbList suelto (sin @id <ruta>#migas o sin breadcrumb que lo enlace).
     - migas visibles distintas de las del JSON-LD en cualquier página indexable: los <a href>/<span> de <nav class="migas">
       frente a los name/item del BreadcrumbList <ruta>#migas (mismo orden y position, mismo texto decodificado, mismo
       destino; el <span> final es la propia página), y cada item que no sea / ni una página generada con index.html, sin
       noindex y en el sitemap. Y la última miga sin <span aria-current="page"> (o aria-current más de una vez).
     - cualquier CollectionPage cuya url sea la propia página (también en @graph) sin @id <url>#pagina.
     - fichas cuyo WebPage no lleva @id <ficha>#pagina y about {"@id": "<ficha>#biblioteca"}, sin Library con ese @id
       en la misma página, o cuya Library no lo devuelve con mainEntityOfPage {"@id": "<ficha>#pagina"} (recíprocos).
     - cualquier página con FAQPage (fichas, provincias, localidades, temáticas, hubs, salas, universidades, exámenes)
       cuyo FAQPage no lleva @id <ruta>#faq e isPartOf {"@id": "<ruta>#pagina"} (en la misma página, un WebPage con ese
       @id en las fichas, un CollectionPage en las demás, con url = la página), o con más de un FAQPage: un solo grafo,
       no dos nodos de página sueltos para la misma URL. Y fichas cuyo WebPage #pagina no declara hasPart
       {"@id": "<ficha>#faq"} teniendo FAQPage, o lo declara sin tenerlo (recíproco).

     - la vista previa al compartir: la portada (index.html) y las páginas indexables (bibliotecas/… y las guías de
       /estudiar/) sin og:site_name, og:image absoluta (https://bibliomapa.es/… de un archivo del repo) con
       og:image:width/height iguales a sus dimensiones reales y og:image:alt, o sin twitter:card (summary o
       summary_large_image), o con alguna repetida; con summary_large_image, twitter:image igual a og:image y la imagen
       apaisada (ancho ≥ 1,5 × alto; si no, X la recorta).
     - la verificación de Google Search Console: una <meta name="google-site-verification"> vacía, «null»/«undefined» o
       que no parece un código, más de una (en varias páginas o repetida), fuera de la portada (index.html, la única
       que Google mira para la propiedad de prefijo de URL) o distinta de GSC_VERIFICACION de generar_paginas_seo.js
       cuando esta no es null (sin meta en ninguna página y GSC_VERIFICACION = null es lo normal: propiedad por DNS),
     - la clave de IndexNow: si INDEXNOW_CLAVE de generar_paginas_seo.js no es null, que tenga formato válido y que
       /<clave>.txt exista en la raíz con exactamente la clave (con null no se exige nada), y que avisar_indexnow.js
       siga abortando («despliega primero»): copia temporal con clave ficticia contra servidores en 127.0.0.1, sin red
       real; salida 0 con el .txt bien servido y 1 con 404 o con otro texto,
     - JSON-LD que no se puede leer, y horarios especiales (specialOpeningHoursSpecification: verano y exámenes de las
       fichas) mal formados o con tramos por fecha que se solapan.
   Uso (desde la raíz del proyecto):  node scripts/comprobar_paginas_seo.js
   Sale con código 1 si hay enlaces rotos, títulos o descripciones repetidos, JSON-LD roto, horarios especiales mal o
   lastmod mal, la meta de Search Console mal o repetida, una provincia o localidad con fichas sin ItemList, el índice sin su CollectionPage, un hasPart roto, una
   temática, provincia, localidad, ficha, hub, sala de estudio, universidad o ciudad de exámenes sin su isPartOf o la 404 mal, o una página con
   las migas sin enlazar, sueltas, con el penúltimo distinto de su isPartOf, distintas de las visibles o hacia una página no indexable. */
"use strict";
const fs = require("fs");
const path = require("path");
const RAIZ = path.resolve(__dirname, "..");
const DOMINIO = "https://bibliomapa.es";

const paginas = [];
(function recorre(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) recorre(f); else if (e.name === "index.html") paginas.push(f);
  }
})(path.join(RAIZ, "bibliotecas"));
const rutaDe = (f) => "/" + path.relative(RAIZ, path.dirname(f)).split(path.sep).join("/") + "/";
const html = new Map(paginas.map((f) => [rutaDe(f), fs.readFileSync(f, "utf8")]));
const decodifica = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const ids = (h) => new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

const modPagina = new Map(); // ruta → dateModified más reciente de su JSON-LD
const rotos = [], entrantes = new Map(), titulos = new Map(), descs = new Map(), ldMal = [], horEspMal = [];
// Más largos que esto, Google los corta en los resultados (los mismos límites que usa el generador). Desde el
// 2026-11-01 todo el sitio cumple (fichas de biblioteca incluidas), así que uno solo hace fallar la comprobación.
const MAX_TIT = 65, MAX_DESC = 160, largos = [];
let nHorEsp = 0, nPagHorEsp = 0;
// Horas HH:MM, fechas AAAA-MM-DD en orden y, en los tramos por fecha (sin dayOfWeek: los de exámenes), ningún solape
// (si dos tramos se pisan, Google no dice cuál vale).
function compruebaEspeciales(ruta, nodo) {
  const l = (nodo && nodo.specialOpeningHoursSpecification) || [];
  if (!l.length) return;
  nHorEsp += l.length; nPagHorEsp++;
  const HM = /^\d\d:\d\d$/, F = /^\d{4}-\d\d-\d\d$/;
  l.forEach((x) => { if (!HM.test(x.opens) || !HM.test(x.closes) || !F.test(x.validFrom) || !F.test(x.validThrough) || x.validThrough < x.validFrom) horEspMal.push(`${ruta} ${JSON.stringify(x)}`); });
  const rangos = [...new Map(l.filter((x) => !x.dayOfWeek).map((x) => [x.validFrom + "|" + x.validThrough, x])).values()].sort((a, b) => a.validFrom.localeCompare(b.validFrom));
  rangos.forEach((x, k) => { if (k && x.validFrom <= rangos[k - 1].validThrough) horEspMal.push(`${ruta} solape ${rangos[k - 1].validFrom}–${rangos[k - 1].validThrough} y ${x.validFrom}–${x.validThrough}`); });
}
// Library de cada ficha (con @id) por nombre + coordenadas, para reconocerla en los ItemList de otras páginas.
const claveLib = (x) => `${x.name}|${x.geo && x.geo.latitude}|${x.geo && x.geo.longitude}`;
const fichaDe = new Map(), itemsLista = [];
// Páginas de lugar (provincia: /bibliotecas/<prov>/ con secciones por localidad; localidad: la que «vuelve» a su
// provincia sin ser temática) → ¿lleva su CollectionPage mainEntity ItemList? y los href que contiene.
const lugares = new Map();
const indiceMal = [], hasPartMal = [];
const partesDe = new Map(), temasConPartes = new Map(); // ruta → URL de su hasPart · temática → enlaces a sus partes
let nIndiceProvs = 0, nHasPart = 0, nPagHasPart = 0, indiceCP = false;
let nEnlaces = 0;
// Temáticas: los slug de TEMAS en el generador (la misma lista que crea sus páginas). Por cada página, el name y el
// isPartOf de su CollectionPage y los enlaces de su <p class="volver">.
const TEMAS_SLUG = new Set([...fs.readFileSync(path.join(__dirname, "generar_paginas_seo.js"), "utf8").split(/\nconst TEMAS = \[/)[1].split(/\n\];/)[0]
  .matchAll(/^  \{ slug: "([^"]+)", corto:/gm)].map((m) => m[1]));
const cpDe = new Map(), volverDe = new Map(), isPartOfMal = [];
const provsIndice = new Set(); // URL (sin dominio) de las provincias del ItemList del índice
const wpDe = new Map(), idsListaDe = new Map(); // ruta → WebPage de la ficha · ruta → @id del mainEntity ItemList de su CollectionPage
const migasDe = new Map(); // ruta → BreadcrumbList del JSON-LD de esa página (las migas)
const libDe = new Map(); // ruta de la ficha → su Library de nivel superior (@id <ficha>#biblioteca)
const faqDe = new Map(); // ruta → FAQPage del JSON-LD de esa página
const nodosPagDe = new Map(); // ruta → (@id → nodo) de sus WebPage/CollectionPage con url = la página (destino del isPartOf del FAQPage)
function existe(ruta) {
  const limpia = decodeURIComponent(ruta);
  const f = path.join(RAIZ, limpia);
  if (limpia.endsWith("/")) return fs.existsSync(path.join(f, "index.html"));
  return fs.existsSync(f) && fs.statSync(f).isFile();
}
for (const [ruta, h] of html) {
  const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
  const d = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (t) (titulos.get(t) || titulos.set(t, []).get(t)).push(ruta);
  if (d) (descs.get(d) || descs.set(d, []).get(d)).push(ruta);
  if (t && decodifica(t).length > MAX_TIT) largos.push(`${ruta} título (${decodifica(t).length}): ${decodifica(t)}`);
  if (d && decodifica(d).length > MAX_DESC) largos.push(`${ruta} descripción (${decodifica(d).length})`);
  const prov = /^\/bibliotecas\/[^/]+\/$/.test(ruta) && /<section class="loc">/.test(h);
  const loc = /^\/bibliotecas\/[^/]+\/[^/]+\/$/.test(ruta) && /<section class="lista">/.test(h) && /<p class="volver"><a href="\/bibliotecas\/[^/]+\/">← Todas las bibliotecas de [^<]*<\/a><\/p>/.test(h);
  if (prov || loc) lugares.set(ruta, { tipo: prov ? "provincia" : "localidad", lista: false, hrefs: [...h.matchAll(/\shref="([^"]+)"/g)].map((m) => decodifica(m[1])) });
  // Temáticas que enlazan sus partes: la de provincia, sus localidades en la nav «Por localidad»; la de España
  // (/bibliotecas/<tema>/), las temáticas de provincia en las cabeceras de sección. Cada una debe estar en su hasPart.
  partesDe.set(ruta, new Set());
  const enlPartes = [];
  for (const nav of h.matchAll(/<nav class="locs" aria-label="Por localidad">([\s\S]*?)<\/nav>/g)) enlPartes.push(...[...nav[1].matchAll(/\shref="([^"]+)"/g)].map((m2) => decodifica(m2[1])));
  const tema = (ruta.match(/^\/bibliotecas\/([^/]+)\/$/) || [])[1];
  if (tema) for (const m2 of h.matchAll(/<section class="loc"[^>]*><h2><a href="([^"]+)">/g)) { const u = decodifica(m2[1]), pr = (u.match(new RegExp(`^/bibliotecas/([^/]+)/${tema}/$`)) || [])[1]; if (pr && pr !== tema) enlPartes.push(u); }
  if (enlPartes.length) temasConPartes.set(ruta, enlPartes);
  volverDe.set(ruta, new Set([...h.matchAll(/<p class="volver">([\s\S]*?)<\/p>/g)].flatMap((v) => [...v[1].matchAll(/\shref="([^"]+)"/g)].map((m2) => decodifica(m2[1])))));
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j = null;
    try { j = JSON.parse(m[1]); } catch (e) { ldMal.push(ruta); }
    if (j) [].concat(j).forEach((x) => {
      compruebaEspeciales(ruta, x);
      if (x && x["@type"] === "CollectionPage" && !cpDe.has(ruta)) cpDe.set(ruta, x);
      if (x && x["@type"] === "WebPage" && x.about && !wpDe.has(ruta)) wpDe.set(ruta, x);
      if (x && x["@type"] === "FAQPage") (faqDe.get(ruta) || faqDe.set(ruta, []).get(ruta)).push(x);
      if (x && (x["@type"] === "WebPage" || x["@type"] === "CollectionPage") && x["@id"] && x.url === DOMINIO + ruta)
        (nodosPagDe.get(ruta) || nodosPagDe.set(ruta, new Map()).get(ruta)).set(x["@id"], x);
      if (x && x["@type"] === "BreadcrumbList") (migasDe.get(ruta) || migasDe.set(ruta, []).get(ruta)).push(x);
      if (x && x["@type"] === "CollectionPage" && x.mainEntity && x.mainEntity["@type"] === "ItemList")
        idsListaDe.set(ruta, new Set((x.mainEntity.itemListElement || []).map((el) => el && el.item && el.item["@id"]).filter(Boolean)));
      if (x && x["@type"] === "Library" && x["@id"]) fichaDe.set(claveLib(x), x["@id"]);
      if (x && x["@type"] === "Library" && x["@id"] === DOMINIO + ruta + "#biblioteca" && !libDe.has(ruta)) libDe.set(ruta, x);
      const lista = x && (x["@type"] === "ItemList" ? x : x.mainEntity && x.mainEntity["@type"] === "ItemList" ? x.mainEntity : null);
      if (x && x["@type"] === "CollectionPage" && lugares.has(ruta) && x.mainEntity && x.mainEntity["@type"] === "ItemList" && (x.mainEntity.itemListElement || []).length) lugares.get(ruta).lista = true;
      if (lista) (lista.itemListElement || []).forEach((el) => el && el.item && el.item["@type"] === "Library" && itemsLista.push([ruta, el.item]));
      if (x && x["@type"] === "CollectionPage" && Array.isArray(x.hasPart)) {
        nPagHasPart++;
        x.hasPart.forEach((hp) => partesDe.get(ruta).add(((hp && hp.url) || "").replace(DOMINIO, "")));
        const enlaza = new Set([...h.matchAll(/\shref="([^"]+)"/g)].map((m2) => decodifica(m2[1]).split("#")[0]));
        x.hasPart.forEach((hp) => {
          nHasPart++;
          const u = ((hp && hp.url) || "").replace(DOMINIO, "");
          if (!u.startsWith("/") || !existe(u)) hasPartMal.push(`${ruta} hasPart roto ${hp && hp.url}`);
          else if (!enlaza.has(u)) hasPartMal.push(`${ruta} hasPart ${u} no enlazado en el HTML`);
        });
      }
      if (ruta === "/bibliotecas/" && x && x["@type"] === "CollectionPage") {
        indiceCP = true;
        const el = (x.mainEntity && x.mainEntity["@type"] === "ItemList" && x.mainEntity.itemListElement) || [];
        if (!x.dateModified) indiceMal.push("CollectionPage sin dateModified");
        if (el.length < 50) indiceMal.push(`mainEntity ItemList con ${el.length} provincias`);
        const enlaza = new Set([...h.matchAll(/\shref="([^"]+)"/g)].map((m2) => decodifica(m2[1])));
        el.forEach((it) => {
          const u = ((it && it.item && it.item.url) || "").replace(DOMINIO, "");
          if (!/^\/bibliotecas\/[^/]+\/$/.test(u) || !existe(u) || !enlaza.has(u)) indiceMal.push(`provincia mal: ${it && it.item && it.item.url}`); else nIndiceProvs++;
          provsIndice.add(u);
        });
      }
      if (x && typeof x.dateModified === "string" && !(modPagina.get(ruta) >= x.dateModified)) modPagina.set(ruta, x.dateModified);
    });
  }
  const misIds = ids(h);
  for (const m of h.matchAll(/\shref="([^"]+)"/g)) {
    let u = decodifica(m[1]);
    if (u.startsWith(DOMINIO)) u = u.slice(DOMINIO.length) || "/";
    if (/^(https?:|mailto:|tel:)/.test(u)) continue;
    nEnlaces++;
    if (u.startsWith("#")) { if (u.length > 1 && !u.startsWith("#bib=") && !misIds.has(u.slice(1))) rotos.push([ruta, u]); continue; }
    if (!u.startsWith("/")) { rotos.push([ruta, u + " (relativo)"]); continue; }
    const [sinAncla, ancla] = u.split("#");
    const destino = sinAncla.split("?")[0];
    if (destino === "/") continue; // la app (/#bib=… abre la ficha)
    if (!existe(destino)) { rotos.push([ruta, u]); continue; }
    if (ancla && html.has(destino) && !ids(html.get(destino)).has(ancla)) rotos.push([ruta, u]);
    if (html.has(destino) && destino !== ruta) (entrantes.get(destino) || entrantes.set(destino, new Set()).get(destino)).add(ruta);
  }
}
const bibConFicha = [], idMal = [];
let nItemsBib = 0, nItemsFicha = 0;
for (const [ruta, it] of itemsLista) {
  const ficha = fichaDe.get(claveLib(it));
  if (/#bib=/.test(it.url || "")) { nItemsBib++; if (ficha) bibConFicha.push(`${ruta} → ${it.name} (ficha ${ficha.slice(DOMINIO.length)})`); }
  else if (ficha) { nItemsFicha++; if (it["@id"] !== ficha || it.url + "#biblioteca" !== ficha) idMal.push(`${ruta} → ${it.name} (@id ${it["@id"] || "falta"})`); }
}
const fichas = new Set([...fichaDe.values()].map((id) => id.slice(DOMINIO.length).replace(/#biblioteca$/, "")));
const sinLista = [], nLugarLista = { provincia: [0, 0], localidad: [0, 0] };
for (const [ruta, x] of lugares) {
  if (!x.hrefs.some((u) => fichas.has(u.replace(DOMINIO, "")))) continue;
  nLugarLista[x.tipo][1]++;
  if (x.lista) nLugarLista[x.tipo][0]++; else sinLista.push(`${ruta} (${x.tipo})`);
}
// Temáticas que enlazan sus partes y no las declaran en hasPart (la otra mitad —hasPart sin enlace— ya la mira arriba).
let nTemasPartes = 0;
for (const [ruta, l] of temasConPartes) {
  nTemasPartes++;
  const faltan = l.filter((u) => !partesDe.get(ruta).has(u));
  if (faltan.length) hasPartMal.push(`${ruta} temática sin hasPart de ${faltan.length} partes que enlaza (p. ej. ${faltan[0]})`);
}
// isPartOf de las temáticas de localidad y de provincia: la superior que enlaza su «volver», con su mismo name y, si
// la superior o la página son de provincia, recíproco con su hasPart. Y al revés: cada temática que la superior pone
// en su hasPart la declara como isPartOf.
const nivelTema = (r) => { const m = r.match(/^\/bibliotecas\/(?:([^/]+)\/(?:([^/]+)\/)?)?([^/]+)\/$/); return m && TEMAS_SLUG.has(m[3]) && (!m[1] || html.has(`/bibliotecas/${m[1]}/`)) ? { prov: m[1], loc: m[2], tema: m[3], nivel: m[2] ? "localidad" : m[1] ? "provincia" : "España" } : null; };
const nIsPartOf = { localidad: 0, provincia: 0, España: 0 }, nTemas = { localidad: 0, provincia: 0, España: 0 };
// isPartOf al índice /bibliotecas/ (temáticas de España y hubs): CollectionPage con el mismo name que el del índice y
// enlazado en su «volver» (en los hubs, como primer enlace). Sin reciprocidad: el ItemList del índice solo lista provincias.
const parteDelIndiceMal = (ruta, que, primero) => {
  const ip = (cpDe.get(ruta) || {}).isPartOf, u = ((ip && ip.url) || "").replace(DOMINIO, ""), mal = [];
  if (!ip || ip["@type"] !== "CollectionPage") return [`${ruta} (${que}) sin isPartOf CollectionPage al índice${ip ? ` (lleva ${ip["@type"]})` : ""}`];
  if (u !== "/bibliotecas/") return [`${ruta} (${que}) isPartOf ${u} (esperado /bibliotecas/)`];
  const volver = [...(volverDe.get(ruta) || [])];
  if (primero ? volver[0] !== u : !volver.includes(u)) mal.push(`${ruta} isPartOf ${u} no es ${primero ? "el primer enlace" : "un enlace"} de su <p class="volver">`);
  if (!cpDe.get(u) || cpDe.get(u).name !== ip.name) mal.push(`${ruta} isPartOf «${ip.name}» distinto del name de ${u} («${cpDe.get(u) && cpDe.get(u).name}»)`);
  return mal;
};
if (TEMAS_SLUG.size < 9) isPartOfMal.push(`solo ${TEMAS_SLUG.size} temáticas leídas de TEMAS en generar_paginas_seo.js`);
for (const ruta of html.keys()) {
  const n = nivelTema(ruta), cp = cpDe.get(ruta);
  if (!n || !cp) continue;
  nTemas[n.nivel]++;
  if (n.nivel === "España") { const mal = parteDelIndiceMal(ruta, "temática de España", false); isPartOfMal.push(...mal); if (!mal.length) nIsPartOf.España++; continue; }
  const ip = cp.isPartOf, u = ((ip && ip.url) || "").replace(DOMINIO, "");
  const deProv = `/bibliotecas/${n.prov}/${n.tema}/`, deEspana = `/bibliotecas/${n.tema}/`;
  const esperada = n.nivel === "localidad" && html.has(deProv) ? deProv : deEspana;
  if (!ip || ip["@type"] !== "CollectionPage") { isPartOfMal.push(`${ruta} (${n.nivel}) sin isPartOf CollectionPage`); continue; }
  if (!html.has(u)) { isPartOfMal.push(`${ruta} isPartOf a una página que no existe: ${ip.url}`); continue; }
  if (u !== esperada) isPartOfMal.push(`${ruta} isPartOf ${u} (esperado ${esperada})`);
  if (!volverDe.get(ruta).has(u)) isPartOfMal.push(`${ruta} isPartOf ${u} no enlazado en su <p class="volver">`);
  if (!cpDe.get(u) || cpDe.get(u).name !== ip.name) isPartOfMal.push(`${ruta} isPartOf «${ip.name}» distinto del name de ${u} («${cpDe.get(u) && cpDe.get(u).name}»)`);
  if ((n.nivel === "provincia" || u === deProv) && !partesDe.get(u).has(ruta)) isPartOfMal.push(`${ruta} isPartOf ${u}, que no la lleva en su hasPart`);
  nIsPartOf[n.nivel]++;
}
for (const [ruta, partes] of partesDe) {
  if (!nivelTema(ruta)) continue;
  for (const u of partes) if (nivelTema(u) && ((cpDe.get(u) && cpDe.get(u).isPartOf) || {}).url !== DOMINIO + ruta) isPartOfMal.push(`${ruta} hasPart ${u}, cuyo isPartOf no es esta página`);
}
// isPartOf de provincias y localidades: la página de su «volver» (la localidad, su provincia; la provincia, el índice),
// con su mismo name y recíproco con el hasPart de la provincia o el ItemList del índice. Y al revés: cada localidad del
// hasPart de una provincia y cada provincia del ItemList del índice la declaran como isPartOf. El índice, el WebSite.
const nLugarIsPartOf = { provincia: 0, localidad: 0 };
const lugarDe = (r) => lugares.has(r) && !nivelTema(r) ? lugares.get(r).tipo : null;
for (const [ruta] of lugares) {
  const tipo = lugarDe(ruta), cp = cpDe.get(ruta);
  if (!tipo) continue;
  const esperada = tipo === "localidad" ? ruta.replace(/[^/]+\/$/, "") : "/bibliotecas/";
  const ip = cp && cp.isPartOf, u = ((ip && ip.url) || "").replace(DOMINIO, "");
  if (!ip || ip["@type"] !== "CollectionPage") { isPartOfMal.push(`${ruta} (${tipo}) sin isPartOf CollectionPage${ip ? ` (lleva ${ip["@type"]})` : ""}`); continue; }
  if (!html.has(u)) { isPartOfMal.push(`${ruta} isPartOf a una página que no existe: ${ip.url}`); continue; }
  if (u !== esperada) isPartOfMal.push(`${ruta} isPartOf ${u} (esperado ${esperada})`);
  if (!volverDe.get(ruta).has(u)) isPartOfMal.push(`${ruta} isPartOf ${u} no enlazado en su <p class="volver">`);
  if (!cpDe.get(u) || cpDe.get(u).name !== ip.name) isPartOfMal.push(`${ruta} isPartOf «${ip.name}» distinto del name de ${u} («${cpDe.get(u) && cpDe.get(u).name}»)`);
  if (tipo === "localidad" ? !partesDe.get(u).has(ruta) : !provsIndice.has(ruta)) isPartOfMal.push(`${ruta} isPartOf ${u}, que no la lleva en su ${tipo === "localidad" ? "hasPart" : "ItemList"}`);
  nLugarIsPartOf[tipo]++;
}
for (const [ruta, partes] of partesDe) {
  if (lugarDe(ruta) !== "provincia") continue;
  for (const u of partes) if (lugarDe(u) === "localidad" && ((cpDe.get(u) && cpDe.get(u).isPartOf) || {}).url !== DOMINIO + ruta) isPartOfMal.push(`${ruta} hasPart ${u}, cuyo isPartOf no es esta provincia`);
}
for (const u of provsIndice) if (((cpDe.get(u) && cpDe.get(u).isPartOf) || {}).url !== DOMINIO + "/bibliotecas/") isPartOfMal.push(`/bibliotecas/ ItemList ${u}, cuyo isPartOf no es el índice`);
if (((cpDe.get("/bibliotecas/") || {}).isPartOf || {})["@type"] !== "WebSite") isPartOfMal.push("/bibliotecas/ sin isPartOf WebSite");
// isPartOf de las fichas: su WebPage, a la página que enlaza primero su «volver» (localidad con página o provincia), con
// su mismo name. Las que no están en el ItemList de esa página solo se cuentan; al revés, cada ficha de un ItemList de
// localidad la declara como isPartOf, y cada una del de una provincia, la provincia o una localidad de esa provincia.
const nFichaIsPartOf = { localidad: 0, provincia: 0 };
let nFichasFueraLista = 0;
const supFicha = (r) => (((wpDe.get(r) || {}).isPartOf || {}).url || "").replace(DOMINIO, "");
for (const ruta of fichas) {
  const wp = wpDe.get(ruta), ip = wp && wp.isPartOf, u = supFicha(ruta);
  const esperada = [...(volverDe.get(ruta) || [])][0];
  if (!wp) { isPartOfMal.push(`${ruta} (ficha) sin WebPage con about`); continue; }
  if (!ip || ip["@type"] !== "CollectionPage") { isPartOfMal.push(`${ruta} (ficha) sin isPartOf CollectionPage`); continue; }
  if (!html.has(u) || !lugarDe(u)) { isPartOfMal.push(`${ruta} (ficha) isPartOf a una página que no es provincia ni localidad: ${ip.url}`); continue; }
  if (u !== esperada) isPartOfMal.push(`${ruta} (ficha) isPartOf ${u} (esperado ${esperada}, primer enlace de su <p class="volver">)`);
  if (!cpDe.get(u) || cpDe.get(u).name !== ip.name) isPartOfMal.push(`${ruta} (ficha) isPartOf «${ip.name}» distinto del name de ${u} («${cpDe.get(u) && cpDe.get(u).name}»)`);
  if (!(idsListaDe.get(u) || new Set()).has(DOMINIO + ruta + "#biblioteca")) nFichasFueraLista++;
  nFichaIsPartOf[lugarDe(u)]++;
}
// breadcrumb de las fichas: su WebPage lo enlaza por @id (<ficha>#migas) a un BreadcrumbList de la misma página cuyo
// penúltimo elemento es la url de su isPartOf (localidad con página o provincia) y el último, la propia ficha.
const migasMal = [];
let nFichaMigas = 0;
for (const ruta of fichas) {
  const wp = wpDe.get(ruta), id = DOMINIO + ruta + "#migas";
  if (!wp) continue; // ya cuenta en isPartOfMal
  const bc = wp.breadcrumb, idWp = bc && bc["@id"];
  if (idWp !== id) { migasMal.push(`${ruta} WebPage sin breadcrumb {"@id": "${id}"}${idWp ? ` (lleva ${idWp})` : ""}`); continue; }
  const lista = (migasDe.get(ruta) || []).find((x) => x["@id"] === id);
  if (!lista) { migasMal.push(`${ruta} breadcrumb ${id} sin BreadcrumbList con ese @id en la página`); continue; }
  const el = lista.itemListElement || [], pen = el.length >= 2 && el[el.length - 2].item, ult = el.length && el[el.length - 1].item;
  const sup = (wp.isPartOf || {}).url;
  if (!sup || pen !== sup) { migasMal.push(`${ruta} penúltimo de las migas ${pen || "falta"} distinto del isPartOf ${sup || "falta"}`); continue; }
  if (ult !== DOMINIO + ruta) { migasMal.push(`${ruta} último de las migas ${ult || "falta"} no es la ficha`); continue; }
  nFichaMigas++;
}
// mainEntityOfPage de las fichas: su WebPage lleva @id <ficha>#pagina y about {"@id": "<ficha>#biblioteca"}, y la
// Library con ese @id, en la misma página, lo devuelve con mainEntityOfPage {"@id": "<ficha>#pagina"}: se apuntan entre sí.
const mainEntityMal = [];
let nFichaMainEntity = 0;
for (const ruta of fichas) {
  const wp = wpDe.get(ruta), idPag = DOMINIO + ruta + "#pagina", idBib = DOMINIO + ruta + "#biblioteca";
  if (!wp) continue; // ya cuenta en isPartOfMal
  if (wp["@id"] !== idPag) { mainEntityMal.push(`${ruta} WebPage sin @id ${idPag}${wp["@id"] ? ` (lleva ${wp["@id"]})` : ""}`); continue; }
  if ((wp.about || {})["@id"] !== idBib) { mainEntityMal.push(`${ruta} about del WebPage ${(wp.about || {})["@id"] || "falta"} (esperado ${idBib})`); continue; }
  const lib = libDe.get(ruta);
  if (!lib) { mainEntityMal.push(`${ruta} sin Library con @id ${idBib} en la página`); continue; }
  const me = lib.mainEntityOfPage && lib.mainEntityOfPage["@id"];
  if (me !== idPag) { mainEntityMal.push(`${ruta} Library sin mainEntityOfPage {"@id": "${idPag}"}${me ? ` (lleva ${me})` : ""}`); continue; }
  nFichaMainEntity++;
}
// FAQPage en el mismo grafo que su página, en TODAS las páginas con FAQPage: lleva @id <ruta>#faq e isPartOf
// {"@id": "<ruta>#pagina"}, y ese #pagina es un nodo de la misma página con url = la página: el WebPage en las fichas,
// el CollectionPage en las demás (provincias, localidades, temáticas, hubs, salas, universidades, exámenes). No dos
// nodos de página sueltos para una URL. En las fichas, además, el WebPage #pagina lo declara con hasPart
// {"@id": "<ficha>#faq"} si y solo si la página tiene ese FAQPage (recíproco).
const faqMal = [];
let nFichaFaq = 0, nFichaFaqBien = 0, nOtraFaq = 0, nOtraFaqBien = 0, nFichaHasPart = 0;
for (const [ruta, lfaq] of faqDe) {
  const esFicha = fichas.has(ruta), tipo = esFicha ? "WebPage" : "CollectionPage";
  if (esFicha) nFichaFaq++; else nOtraFaq++;
  const idFaq = DOMINIO + ruta + "#faq", idPag = DOMINIO + ruta + "#pagina";
  let bien = true;
  for (const f of lfaq) {
    if (f["@id"] !== idFaq) { faqMal.push(`${ruta} FAQPage sin @id ${idFaq}${f["@id"] ? ` (lleva ${f["@id"]})` : ""}`); bien = false; continue; }
    const ip = (f.isPartOf || {})["@id"];
    if (ip !== idPag) { faqMal.push(`${ruta} FAQPage sin isPartOf {"@id": "${idPag}"}${ip ? ` (lleva ${ip})` : ""}`); bien = false; continue; }
    const nodo = (nodosPagDe.get(ruta) || new Map()).get(idPag);
    if (!nodo || nodo["@type"] !== tipo) { faqMal.push(`${ruta} FAQPage apunta a ${idPag}, sin ${tipo} con ese @id y url ${DOMINIO + ruta} en la página`); bien = false; }
  }
  if (lfaq.length > 1) { faqMal.push(`${ruta} ${lfaq.length} FAQPage en la misma página`); bien = false; }
  if (bien) { if (esFicha) nFichaFaqBien++; else nOtraFaqBien++; }
}
for (const ruta of fichas) {
  const wp = (nodosPagDe.get(ruta) || new Map()).get(DOMINIO + ruta + "#pagina");
  if (!wp) continue; // sin WebPage #pagina: ya lo cuenta el bloque de fichas (about/mainEntityOfPage)
  const idFaq = DOMINIO + ruta + "#faq", tieneFaq = (faqDe.get(ruta) || []).some((f) => f["@id"] === idFaq);
  const hp = [].concat(wp.hasPart || []).map((p) => p && p["@id"]);
  if (tieneFaq && !hp.includes(idFaq)) faqMal.push(`${ruta} WebPage #pagina sin hasPart {"@id": "${idFaq}"} (su FAQPage apunta a él con isPartOf)`);
  else if (!tieneFaq && hp.includes(idFaq)) faqMal.push(`${ruta} WebPage #pagina con hasPart ${idFaq} pero sin FAQPage con ese @id en la página`);
  else if (tieneFaq) nFichaHasPart++;
}
// breadcrumb de provincias, localidades y temáticas de provincia y de localidad: su CollectionPage lo enlaza por @id
// (<ruta>#migas) a un BreadcrumbList de la misma página cuyo último elemento es la propia página. Penúltimo: en
// provincias, localidades, temáticas de España (/bibliotecas/<tema>/: el índice) y el propio índice (/bibliotecas/:
// el WebSite, «/»), la url de su isPartOf; en las temáticas de provincia y de localidad, el primer enlace de su
// «volver» (su localidad o provincia: las migas siguen el lugar y el isPartOf la temática superior, así que ahí no
// coinciden y solo se cuentan).
const nLugarMigas = { índice: 0, provincia: 0, localidad: 0, "temática de España": 0, "temática de provincia": 0, "temática de localidad": 0 };
let nTemaMigasDistintoIsPartOf = 0;
for (const ruta of html.keys()) {
  const n0 = nivelTema(ruta), n = n0 && n0.nivel !== "España" ? n0 : null;
  const tipo = ruta === "/bibliotecas/" ? "índice" : n0 ? `temática de ${n0.nivel}` : lugarDe(ruta), cp = cpDe.get(ruta);
  if (!tipo) continue;
  if (!cp) { if (tipo === "índice" || tipo === "temática de España") migasMal.push(`${ruta} (${tipo}) sin CollectionPage`); continue; }
  const id = DOMINIO + ruta + "#migas", idCp = cp.breadcrumb && cp.breadcrumb["@id"];
  if (idCp !== id) { migasMal.push(`${ruta} (${tipo}) CollectionPage sin breadcrumb {"@id": "${id}"}${idCp ? ` (lleva ${idCp})` : ""}`); continue; }
  const lista = (migasDe.get(ruta) || []).find((x) => x["@id"] === id);
  if (!lista) { migasMal.push(`${ruta} (${tipo}) breadcrumb ${id} sin BreadcrumbList con ese @id en la página`); continue; }
  const el = lista.itemListElement || [], pen = el.length >= 2 && el[el.length - 2].item, ult = el.length && el[el.length - 1].item;
  const sup = (cp.isPartOf || {}).url, volver = [...(volverDe.get(ruta) || [])][0];
  const esperado = n ? volver && DOMINIO + volver : sup;
  if (n && pen !== sup) nTemaMigasDistintoIsPartOf++;
  if (!esperado || pen !== esperado) { migasMal.push(`${ruta} (${tipo}) penúltimo de las migas ${pen || "falta"} distinto ${n ? "del primer enlace de su «volver»" : "del isPartOf"} ${esperado || "falta"}`); continue; }
  if (ult !== DOMINIO + ruta) { migasMal.push(`${ruta} (${tipo}) último de las migas ${ult || "falta"} no es la página`); continue; }
  nLugarMigas[tipo]++;
}
// breadcrumb de los hubs (/bibliotecas/horarios/, universidades, exámenes y salas de estudio: isPartOf el índice) y de
// las universidades y ciudades de exámenes (isPartOf su hub): su CollectionPage lo enlaza por @id (<ruta>#migas) a un
// BreadcrumbList de la misma página cuyo penúltimo elemento es la url de su isPartOf y el último, la propia página.
// Lo mismo en las salas de estudio de provincia y localidad (isPartOf su hub, /bibliotecas/salas-de-estudio/): las tres
// familias (sala de estudio, universidad, exámenes) con el penúltimo de las migas igual a su hub.
const nHubMigas = { hub: 0, "sala de estudio": 0, universidad: 0, exámenes: 0 };
const familiaMigasHub = (r) => ["/bibliotecas/horarios/", "/bibliotecas/universidades/", "/bibliotecas/examenes/", "/bibliotecas/salas-de-estudio/"].includes(r) ? "hub"
  : /^\/bibliotecas\/universidades\/[^/]+\/$/.test(r) ? "universidad" : /^\/bibliotecas\/examenes\/[^/]+\/$/.test(r) ? "exámenes"
  : /^\/bibliotecas\/[^/]+\/(?:[^/]+\/)?salas-de-estudio\/$/.test(r) ? "sala de estudio" : null;
for (const ruta of html.keys()) {
  const tipo = familiaMigasHub(ruta);
  if (!tipo) continue;
  const cp = cpDe.get(ruta);
  if (!cp) { migasMal.push(`${ruta} (${tipo}) sin CollectionPage`); continue; }
  const id = DOMINIO + ruta + "#migas", idCp = cp.breadcrumb && cp.breadcrumb["@id"];
  if (idCp !== id) { migasMal.push(`${ruta} (${tipo}) CollectionPage sin breadcrumb {"@id": "${id}"}${idCp ? ` (lleva ${idCp})` : ""}`); continue; }
  const lista = (migasDe.get(ruta) || []).find((x) => x["@id"] === id);
  if (!lista) { migasMal.push(`${ruta} (${tipo}) breadcrumb ${id} sin BreadcrumbList con ese @id en la página`); continue; }
  const el = lista.itemListElement || [], pen = el.length >= 2 && el[el.length - 2].item, ult = el.length && el[el.length - 1].item;
  const sup = (cp.isPartOf || {}).url;
  if (!sup || pen !== sup) { migasMal.push(`${ruta} (${tipo}) penúltimo de las migas ${pen || "falta"} distinto del isPartOf ${sup || "falta"}`); continue; }
  if (ult !== DOMINIO + ruta) { migasMal.push(`${ruta} (${tipo}) último de las migas ${ult || "falta"} no es la página`); continue; }
  nHubMigas[tipo]++;
}
// BreadcrumbList sueltas (sin @id, o con un @id que no enlaza el breadcrumb de ninguna página de la misma ruta), por
// familia. En páginas indexables (todas menos la 404, que no lleva JSON-LD de migas) son fallo: cada BreadcrumbList debe
// tener @id <ruta>#migas y estar enlazado por el breadcrumb del WebPage o CollectionPage de su página.
const familiaMigas = (r) => familiaMigasHub(r) || (r === "/bibliotecas/" ? "índice" : fichas.has(r) ? "ficha" : nivelTema(r) ? "temática" : lugarDe(r) || "otra");
const migasSueltas = {};
let nMigasSueltas = 0;
for (const [ruta, ls] of migasDe) {
  const enlazado = ((wpDe.get(ruta) || cpDe.get(ruta) || {}).breadcrumb || {})["@id"];
  for (const x of ls) if (!x["@id"] || x["@id"] !== enlazado || x["@id"] !== DOMINIO + ruta + "#migas") {
    const f = familiaMigas(ruta); migasSueltas[f] = (migasSueltas[f] || 0) + 1; nMigasSueltas++;
    migasMal.push(`${ruta} (${f}) BreadcrumbList suelto: @id ${x["@id"] || "falta"}, breadcrumb ${enlazado || "falta"} (se espera ${DOMINIO + ruta}#migas en los dos)`);
  }
}
for (const [ruta, ids] of idsListaDe) {
  const tipo = lugarDe(ruta);
  if (!tipo) continue;
  for (const id of ids) {
    const f = id.replace(DOMINIO, "").replace(/#biblioteca$/, "");
    if (!fichas.has(f)) continue;
    const u = supFicha(f), ok = u === ruta || (tipo === "provincia" && lugarDe(u) === "localidad" && ((cpDe.get(u) || {}).isPartOf || {}).url === DOMINIO + ruta);
    if (!ok) isPartOfMal.push(`${ruta} ItemList ${f}, cuyo isPartOf (${u || "falta"}) no es ${tipo === "provincia" ? "esta provincia ni una localidad suya" : "esta localidad"}`);
  }
}
// isPartOf de salas de estudio, universidades y exámenes: su hub, primer enlace de su «volver», con el mismo name que el
// CollectionPage del hub y recíproco con su hasPart. Se miran las páginas de cada tipo por su ruta y las del hasPart del
// hub (así falla tanto la página que falta en el hasPart como la parte del hasPart que no declara el hub).
const HUBS = [["/bibliotecas/salas-de-estudio/", /^\/bibliotecas\/[^/]+\/(?:[^/]+\/)?salas-de-estudio\/$/, "sala de estudio"],
  ["/bibliotecas/universidades/", /^\/bibliotecas\/universidades\/[^/]+\/$/, "universidad"],
  ["/bibliotecas/examenes/", /^\/bibliotecas\/examenes\/[^/]+\/$/, "exámenes"]];
const nHubIsPartOf = {};
for (const [hub, re, tipo] of HUBS) {
  nHubIsPartOf[tipo] = 0;
  if (!html.has(hub)) { isPartOfMal.push(`${hub} (hub de ${tipo}) no existe`); continue; }
  const partes = partesDe.get(hub) || new Set();
  const paginas = new Set([...html.keys()].filter((r) => r !== hub && re.test(r)).concat([...partes]));
  if (!paginas.size) isPartOfMal.push(`${hub} sin páginas de ${tipo}`);
  for (const ruta of paginas) {
    if (!html.has(ruta)) continue; // hasPart roto: ya lo cuenta hasPartMal
    const ip = (cpDe.get(ruta) || {}).isPartOf, u = ((ip && ip.url) || "").replace(DOMINIO, "");
    if (!ip || ip["@type"] !== "CollectionPage") { isPartOfMal.push(`${ruta} (${tipo}) sin isPartOf CollectionPage${ip ? ` (lleva ${ip["@type"]})` : ""}`); continue; }
    if (!html.has(u)) { isPartOfMal.push(`${ruta} isPartOf a una página que no existe: ${ip.url}`); continue; }
    if (u !== hub) isPartOfMal.push(`${ruta} isPartOf ${u} (esperado ${hub})`);
    if ([...(volverDe.get(ruta) || [])][0] !== u) isPartOfMal.push(`${ruta} isPartOf ${u} no es el primer enlace de su <p class="volver">`);
    if (!cpDe.get(u) || cpDe.get(u).name !== ip.name) isPartOfMal.push(`${ruta} isPartOf «${ip.name}» distinto del name de ${u} («${cpDe.get(u) && cpDe.get(u).name}»)`);
    if (!partes.has(ruta)) isPartOfMal.push(`${ruta} isPartOf ${hub}, que no la lleva en su hasPart`);
    else if (u === hub) nHubIsPartOf[tipo]++;
  }
}
// isPartOf de los hubs: el índice, primer enlace de su «volver» (antes, WebSite).
let nHubsIndice = 0;
for (const hub of HUBS.map(([h]) => h).concat("/bibliotecas/horarios/")) {
  if (!html.has(hub)) { if (hub === "/bibliotecas/horarios/") isPartOfMal.push(`${hub} (hub de horarios) no existe`); continue; }
  const mal = parteDelIndiceMal(hub, "hub", true);
  isPartOfMal.push(...mal);
  if (!mal.length) nHubsIndice++;
}
if (!indiceCP) indiceMal.push("/bibliotecas/ sin CollectionPage en su JSON-LD");
const huerfanas = [...html.keys()].filter((r) => r !== "/bibliotecas/" && !entrantes.has(r));
const dupT = [...titulos].filter(([, l]) => l.length > 1), dupD = [...descs].filter(([, l]) => l.length > 1);
const sitemap = fs.existsSync(path.join(RAIZ, "sitemap.xml")) ? fs.readFileSync(path.join(RAIZ, "sitemap.xml"), "utf8") : "";
const enSitemap = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].slice(DOMINIO.length)));
const sitemapRoto = [...enSitemap].filter((r) => r !== "/" && !existe(r));
const faltanSitemap = [...html.keys()].filter((r) => !enSitemap.has(r));
const HOY = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" }), lastmodMal = [], lastmodN = new Map();
for (const m of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const loc = ((m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1] || "").slice(DOMINIO.length), lm = (m[1].match(/<lastmod>([^<]*)<\/lastmod>/) || [])[1];
  if (!lm || !/^\d{4}-\d\d-\d\d$/.test(lm)) { lastmodMal.push(`${loc} sin lastmod válido (${lm || "falta"})`); continue; }
  lastmodN.set(lm, (lastmodN.get(lm) || 0) + 1);
  if (lm > HOY) lastmodMal.push(`${loc} lastmod ${lm} posterior a hoy`);
  if (modPagina.has(loc) && lm < modPagina.get(loc)) lastmodMal.push(`${loc} lastmod ${lm} anterior a su dateModified ${modPagina.get(loc)}`);
}
// Migas visibles = migas del JSON-LD, en todas las páginas generadas indexables: los <a href>/<span> de
// <nav class="migas"> y los ListItem del BreadcrumbList <ruta>#migas, en el mismo orden (position 1, 2, …), con el mismo
// texto (entidades HTML decodificadas) y el mismo destino (href = item; el <span> final, sin enlace, = la propia página).
// Y cada item es / o una página generada con index.html, sin noindex y en el sitemap. Por familia; fallo si hay alguna.
const decodificaTexto = (s) => decodifica(s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&nbsp;/g, " "));
const noindex = (h) => /<meta name="robots" content="[^"]*noindex/i.test(h);
const migasVisMal = [], nMigasVis = {}, migasVisMalFam = {}, itemMigasMal = [], itemMigasMalFam = {}, ariaActualMal = [], nAriaActual = {};
let nMigasVisPag = 0, nItemsMigas = 0;
for (const [ruta, h] of html) {
  if (noindex(h)) continue;
  const f = familiaMigas(ruta), mal = (m) => { migasVisMal.push(`${ruta} (${f}) ${m}`); migasVisMalFam[f] = (migasVisMalFam[f] || 0) + 1; };
  const navs = [...h.matchAll(/<nav class="migas"[^>]*>([\s\S]*?)<\/nav>/g)];
  const bc = (migasDe.get(ruta) || []).find((x) => x["@id"] === DOMINIO + ruta + "#migas");
  if (navs.length !== 1) { mal(`${navs.length} <nav class="migas"> (se espera 1)`); continue; }
  if (!bc) { mal(`sin BreadcrumbList ${DOMINIO + ruta}#migas`); continue; }
  // <span> con o sin atributos (el final lleva aria-current="page"); m[3] = atributos del <span>, m[4] = su texto.
  const vis = [...navs[0][1].matchAll(/<a href="([^"]*)">([\s\S]*?)<\/a>|<span(\s[^>]*)?>([\s\S]*?)<\/span>/g)]
    .map((m) => m[4] === undefined ? { href: decodifica(m[1]), txt: decodificaTexto(m[2]) } : { href: null, txt: decodificaTexto(m[4]), actual: /\saria-current="page"/.test(m[3] || "") });
  // aria-current="page" solo en la última miga (el <span> de la propia página): los lectores de pantalla anuncian
  // «página actual». Falla si falta o si aparece en otra miga.
  const nActual = (navs[0][1].match(/aria-current=/g) || []).length;
  if (!vis.length || !vis[vis.length - 1].actual || nActual !== 1) ariaActualMal.push(`${ruta} (${f}) ${!vis.length || !vis[vis.length - 1].actual ? "última miga sin <span aria-current=\"page\">" : `aria-current ×${nActual} en <nav class="migas">`}`);
  else nAriaActual[f] = (nAriaActual[f] || 0) + 1;
  const ld = bc.itemListElement || [];
  let dif = vis.length !== ld.length ? `${vis.length} migas visibles y ${ld.length} en el JSON-LD` : "";
  for (let i = 0; !dif && i < ld.length; i++) {
    const v = vis[i], x = ld[i] || {}, item = typeof x.item === "string" ? x.item : (x.item || {})["@id"];
    const destino = v.href === null ? (i === ld.length - 1 ? DOMINIO + ruta : "(span sin enlace antes del final)") : v.href.startsWith("/") ? DOMINIO + v.href : v.href;
    if (x.position !== i + 1) dif = `posición ${i + 1}: position ${x.position}`;
    else if (v.txt !== x.name) dif = `posición ${i + 1}: texto «${v.txt}» y name «${x.name}»`;
    else if (destino !== item) dif = `posición ${i + 1}: destino ${destino} e item ${item}`;
  }
  if (dif) { mal(dif); continue; }
  nMigasVis[f] = (nMigasVis[f] || 0) + 1; nMigasVisPag++;
  for (const x of ld) {
    const item = typeof x.item === "string" ? x.item : (x.item || {})["@id"] || "", u = item.startsWith(DOMINIO) ? item.slice(DOMINIO.length) : null;
    nItemsMigas++;
    const por = u === null ? "fuera de " + DOMINIO : u === "/" ? "" : !html.has(u) ? "sin index.html generado" : noindex(html.get(u)) ? "con noindex" : !enSitemap.has(u) ? "fuera del sitemap" : "";
    if (por) { itemMigasMal.push(`${ruta} (${f}) item ${item || "falta"} ${por}`); itemMigasMalFam[f] = (itemMigasMalFam[f] || 0) + 1; }
  }
}

// @id del CollectionPage de la propia página: todo CollectionPage cuya url sea la página (índice, provincias, localidades,
// temáticas, hubs, salas de estudio, universidades y exámenes; también dentro de un @graph) lleva @id <ruta>#pagina, el
// mismo patrón que el WebPage de las fichas, para que isPartOf/hasPart de otras páginas puedan apuntar a él. Por familia.
const cpIdMal = [], nCpId = {};
for (const [ruta, h] of html) {
  const url = DOMINIO + ruta, f = familiaMigas(ruta);
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j; try { j = JSON.parse(m[1]); } catch (e) { continue; } // ya cuenta en «JSON-LD ilegible»
    for (const x of [].concat(j).flatMap((y) => (y && Array.isArray(y["@graph"]) ? y["@graph"] : [y]))) {
      if (!x || x["@type"] !== "CollectionPage" || x.url !== url) continue;
      if (x["@id"] === url + "#pagina") nCpId[f] = (nCpId[f] || 0) + 1;
      else cpIdMal.push(`${ruta} (${f}) CollectionPage sin @id ${url}#pagina${x["@id"] ? ` (lleva ${x["@id"]})` : ""}`);
    }
  }
}

// 404: no cuenta como enlace entrante (no quita huérfanas) ni entra en el resto de comprobaciones (no se indexa).
const f404 = path.join(RAIZ, "404.html"), mal404 = [];
let n404 = 0, n404Prov = 0, n404Busca = 0, n404Slugs = 0;
if (!fs.existsSync(f404)) mal404.push("falta 404.html");
else {
  const h = fs.readFileSync(f404, "utf8");
  if (!/<meta name="robots" content="noindex">/.test(h)) mal404.push("sin <meta name=\"robots\" content=\"noindex\">");
  if (/rel="canonical"/.test(h)) mal404.push("lleva canonical");
  if (enSitemap.has("/404.html") || enSitemap.has("/404")) mal404.push("está en el sitemap");
  const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (t && titulos.has(t)) mal404.push(`título repetido con ${titulos.get(t).join(", ")}`);
  const hrefs = [...h.matchAll(/\shref="([^"]+)"/g)].map((m) => decodifica(m[1]));
  for (const u of hrefs) {
    if (/^(https?:|mailto:|tel:)/.test(u)) continue;
    n404++;
    if (!u.startsWith("/")) { mal404.push(`enlace no absoluto ${u}`); continue; }
    const d = u.split("#")[0].split("?")[0];
    if (d !== "/" && !existe(d)) mal404.push(`enlace roto ${u}`);
  }
  const provs = [...html.keys()].filter((r) => /^\/bibliotecas\/[^/]+\/$/.test(r) && /<section class="loc">/.test(html.get(r)) && r !== "/bibliotecas/horarios/");
  if (provs.length < 50) mal404.push(`solo ${provs.length} provincias reconocidas`);
  const faltan = provs.filter((r) => !hrefs.includes(r)); n404Prov = provs.length - faltan.length;
  if (faltan.length) mal404.push(`no enlaza ${faltan.length} provincias (${faltan.slice(0, 5).join(", ")})`);
  for (const r of ["/bibliotecas/horarios/", "/bibliotecas/abiertas-hoy/"]) if (html.has(r) && !hrefs.includes(r)) mal404.push(`no enlaza ${r}`);
  // «¿Buscabas…?»: contenedor oculto + script inline que lee las provincias de #prov-404. Se ejecuta con un DOM mínimo
  // (vm, sin dependencias) para varias rutas: si se pierde el script, el contenedor o el nav, o sugiere mal, falla.
  if (!/<p id="buscabas" class="buscabas" hidden><\/p>/.test(h)) mal404.push("falta el contenedor <p id=\"buscabas\" hidden>");
  const js = (h.match(/<script id="buscabas-js">([\s\S]*?)<\/script>/) || [])[1];
  const navProv = (h.match(/<nav [^>]*id="prov-404"[^>]*>([\s\S]*?)<\/nav>/) || [])[1];
  if (!js) mal404.push("falta el script «¿Buscabas…?» (<script id=\"buscabas-js\">)");
  else if (/href="/.test(js)) mal404.push("el script «¿Buscabas…?» escribe href= en el HTML");
  if (!navProv) mal404.push("falta el nav de provincias #prov-404 que usa «¿Buscabas…?»");
  // Slugs del segundo tramo (<script type="application/json" id="slugs-404">): sin enlaces, y cada ruta que
  // describen (página de España, localidad = slug del nombre, temática de provincia) tiene que existir.
  const jsonTxt = (h.match(/<script type="application\/json" id="slugs-404">([\s\S]*?)<\/script>/) || [])[1];
  let S = null;
  try { S = JSON.parse(jsonTxt); } catch (e) { mal404.push("falta o no es JSON válido <script type=\"application/json\" id=\"slugs-404\">"); }
  if (S) {
    const slug = (x) => String(x).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const rutas = [...(S.e || []).map(([x]) => `/bibliotecas/${x}/`)];
    for (const [ps, [locs, temas]] of Object.entries(S.p || {})) {
      if (!existe(`/bibliotecas/${ps}/`)) mal404.push(`slugs-404: provincia ${ps} sin página`);
      for (const l of locs) rutas.push(`/bibliotecas/${ps}/${slug(l)}/`);
      for (const k of temas) if (!(S.t || [])[k]) mal404.push(`slugs-404: índice de temática ${k} sin entrada (${ps})`); else rutas.push(`/bibliotecas/${ps}/${S.t[k][0]}/`);
    }
    for (const r of rutas) if (!existe(r)) mal404.push(`slugs-404: ${r} no existe`); else n404Slugs++;
    if (/href|<a\b/.test(jsonTxt)) mal404.push("slugs-404 lleva enlaces");
    if ((S.e || []).length < 5 || Object.keys(S.p || {}).length < 40) mal404.push(`slugs-404 incompleto (${(S.e || []).length} de España, ${Object.keys(S.p || {}).length} provincias)`);
  }
  if (js && navProv) {
    const enlaces = [...navProv.matchAll(/<a href="([^"]+)">([^<]*)</g)].map((m) => ({ getAttribute: () => m[1], firstChild: { textContent: m[2] } }));
    const sugiere = (ruta) => {
      const caja = { textContent: "", hidden: true, hijos: [], appendChild(n) { this.hijos.push(n); } };
      const document = { getElementById: (id) => (id === "buscabas" ? caja : id === "slugs-404" && jsonTxt ? { textContent: jsonTxt } : null), querySelectorAll: () => enlaces,
        createElement: () => ({ href: "", textContent: "" }), createTextNode: (t) => ({ textContent: t }) };
      try { require("vm").runInNewContext(js, { location: { pathname: ruta }, document }, { timeout: 1000 }); }
      catch (e) { return `ERROR ${e.message}`; }
      return caja.hidden ? "" : caja.textContent + caja.hijos.map((n) => n.textContent + (n.href ? `[${n.href}]` : "")).join("");
    };
    const casos = [["/bibliotecas/navara/", "¿Buscabas Navarra[/bibliotecas/navarra/]?"], ["/bibliotecas/Sevila/x/", "¿Buscabas Sevilla[/bibliotecas/sevilla/]?"],
      ["/bibliotecas/santa-cruz/", "¿Buscabas Santa Cruz de Tenerife[/bibliotecas/santa-cruz-de-tenerife/]?"],
      ["/bibliotecas/xqzw/", ""], ["/no-existe", ""], ["/bibliotecas/", ""],
      // Alias (ALIAS_404 en generar_paginas_seo.js): nombres que la distancia de edición no alcanza.
      ["/bibliotecas/vizcaya/", "¿Buscabas Bizkaia[/bibliotecas/bizkaia/]?"], ["/bibliotecas/Guip%C3%BAzcoa/x/", "¿Buscabas Gipuzkoa[/bibliotecas/gipuzkoa/]?"],
      ["/bibliotecas/palma-de-mallorca/", "¿Buscabas Baleares[/bibliotecas/baleares/]?"], ["/bibliotecas/tenerife/", "¿Buscabas Santa Cruz de Tenerife[/bibliotecas/santa-cruz-de-tenerife/]?"],
      ["/bibliotecas/la-palma/", "¿Buscabas Santa Cruz de Tenerife[/bibliotecas/santa-cruz-de-tenerife/]?"], ["/bibliotecas/gran-canaria/", "¿Buscabas Las Palmas[/bibliotecas/las-palmas/]?"],
      // Fuera de /bibliotecas/: primer tramo de la ruta, solo igual (sin tildes/guiones/.html) o alias; nunca parecido ni prefijo.
      ["/navarra/", "¿Buscabas Navarra[/bibliotecas/navarra/]?"], ["/bizkaia", "¿Buscabas Bizkaia[/bibliotecas/bizkaia/]?"],
      ["/A%20Coru%C3%B1a/horarios", "¿Buscabas A Coruña[/bibliotecas/a-coruna/]?"], ["/Vizcaya.html", "¿Buscabas Bizkaia[/bibliotecas/bizkaia/]?"],
      ["/sevila/", ""], ["/santa-cruz/", ""], ["/leonx/", ""], ["/404.html", ""], ["/", ""],
      // Segundo tramo (slugs-404): provincia exacta (o alias) + localidad o temática mal escrita; si nada encaja, la provincia.
      ["/bibliotecas/navarra/pamplna/", "¿Buscabas Pamplona[/bibliotecas/navarra/pamplona/]?"],
      ["/bibliotecas/navarra/abiertas-domingos/", "¿Buscabas bibliotecas abiertas el domingo en Navarra[/bibliotecas/navarra/abiertas-domingo/]?"],
      ["/bibliotecas/madrid/alcala-henares/", "¿Buscabas Alcalá de Henares[/bibliotecas/madrid/alcala-de-henares/]?"],
      ["/bibliotecas/madrid/Getafe/no-existe/", "¿Buscabas Getafe[/bibliotecas/madrid/getafe/]?"],
      ["/bibliotecas/vizcaya/bilbo/", "¿Buscabas Bilbao[/bibliotecas/bizkaia/bilbao/]?"],
      ["/bibliotecas/burgos/salas-estudio/", "¿Buscabas bibliotecas para estudiar y salas de estudio en Burgos[/bibliotecas/burgos/salas-de-estudio/]?"],
      ["/bibliotecas/navarra/xqzw/", "¿Buscabas Navarra[/bibliotecas/navarra/]?"], ["/bibliotecas/navarra/abiertas/", "¿Buscabas Navarra[/bibliotecas/navarra/]?"],
      ["/bibliotecas/navara/pamplna/", "¿Buscabas Navarra[/bibliotecas/navarra/]?"],
      // Páginas de toda España en /bibliotecas/<algo>/ (y, fuera de /bibliotecas/, solo iguales).
      ["/bibliotecas/abiertas-domingos/", "¿Buscabas bibliotecas abiertas el domingo en España[/bibliotecas/abiertas-domingo/]?"],
      ["/bibliotecas/horario/", "¿Buscabas bibliotecas por horario en España[/bibliotecas/horarios/]?"],
      ["/abiertas-hoy/", "¿Buscabas bibliotecas abiertas hoy en España[/bibliotecas/abiertas-hoy/]?"], ["/abiertas-domingos/", ""],
      ["/navarra/pamplna/", "¿Buscabas Navarra[/bibliotecas/navarra/]?"]];
    // Casos sacados de los datos (no de la lista fija): cada provincia que la 404 enlaza (`provs`, páginas con
    // <section class="loc">; nombre = texto de su enlace en #prov-404) por `/<slug>/` y `/bibliotecas/<slug sin guiones>/`,
    // y cada clave de ALIAS_404 (leída del código de generar_paginas_seo.js) por `/bibliotecas/<clave>/`. Así un cambio
    // de slug, de normalización o de la tabla de alias no deja ninguna provincia sin sugerencia en silencio.
    const nombreProv = new Map(enlaces.map((a) => [a.getAttribute(), a.firstChild.textContent.trim()]));
    const esperaProv = (r) => `¿Buscabas ${nombreProv.get(r) || "?"}[${r}]?`;
    for (const r of provs) {
      const s = r.split("/")[2];
      casos.push([`/${s}/`, esperaProv(r)], [`/bibliotecas/${s.replace(/-/g, "")}/`, esperaProv(r)]);
    }
    const genSrc = fs.readFileSync(path.join(RAIZ, "scripts", "generar_paginas_seo.js"), "utf8");
    const aliasSrc = (genSrc.match(/\nconst ALIAS_404 = (\{[\s\S]*?\n\});/) || [])[1];
    let alias = null;
    try { alias = require("vm").runInNewContext(`(${aliasSrc})`, {}, { timeout: 1000 }); } catch (e) { /* abajo */ }
    if (!alias || !Object.keys(alias).length) mal404.push("no se puede leer ALIAS_404 de generar_paginas_seo.js");
    else for (const [k, s] of Object.entries(alias)) casos.push([`/bibliotecas/${k}/`, esperaProv(`/bibliotecas/${s}/`)]);
    for (const [ruta, esperado] of casos) { const r = sugiere(ruta); if (r !== esperado) mal404.push(`«¿Buscabas…?» en ${ruta}: «${r}» (esperado «${esperado}»)`); else n404Busca++; }
  }
}

// ---------- Verificación de Google Search Console ----------
const gscMal = [], gscEn = [];
{
  const todas = [path.join(RAIZ, "404.html"), ...paginas];
  for (const e of fs.readdirSync(RAIZ, { withFileTypes: true })) if (e.isFile() && /\.html?$/i.test(e.name) && e.name !== "404.html") todas.push(path.join(RAIZ, e.name));
  for (const f of todas) {
    if (!fs.existsSync(f)) continue;
    const rel = "/" + path.relative(RAIZ, f).split(path.sep).join("/");
    for (const m of fs.readFileSync(f, "utf8").matchAll(/<meta\b[^>]*\bname\s*=\s*["']?google-site-verification\b[^>]*>/gi)) {
      const c = (m[0].match(/\bcontent\s*=\s*["']([^"']*)["']/i) || [, ""])[1].trim();
      gscEn.push([rel, c]);
      if (!c || /^(null|undefined|none|false)$/i.test(c) || !/^[A-Za-z0-9_-]{10,100}$/.test(c)) gscMal.push(`${rel}: content «${c}» no es un código de verificación`);
      if (rel !== "/index.html") gscMal.push(`${rel}: la meta solo sirve en la portada (/index.html); Google no la mira aquí`);
    }
  }
  if (gscEn.length > 1) gscMal.push(`aparece ${gscEn.length} veces (${gscEn.map(([r]) => r).join(", ")}); debe estar como mucho una vez, en la portada`);
  const src = fs.readFileSync(path.join(RAIZ, "scripts", "generar_paginas_seo.js"), "utf8");
  const mc = src.match(/\nconst GSC_VERIFICACION = (null|"[^"\n]*"|'[^'\n]*');/);
  if (!mc) gscMal.push("no encuentro `const GSC_VERIFICACION = null;` (o con un código entre comillas) en generar_paginas_seo.js");
  else if (mc[1] !== "null") {
    const cod = mc[1].slice(1, -1);
    if (!gscEn.some(([r, c]) => r === "/index.html" && c === cod)) gscMal.push(`GSC_VERIFICACION = ${mc[1]} pero index.html no lleva esa meta: ejecuta node scripts/generar_paginas_seo.js`);
  }
}

// ---------- Clave de IndexNow ----------
// Con INDEXNOW_CLAVE = null no se exige nada. Con una clave: formato válido (8-128 de [A-Za-z0-9-]) y /<clave>.txt en la
// raíz con exactamente la clave (como mucho un salto de línea final); IndexNow lo descarga para comprobar que el aviso
// es del dueño del dominio.
const indexNowMal = [];
let indexNowClave = null;
{
  const src = fs.readFileSync(path.join(RAIZ, "scripts", "generar_paginas_seo.js"), "utf8");
  const mk = src.match(/\nconst INDEXNOW_CLAVE = (null|"[^"\n]*"|'[^'\n]*');/);
  if (!mk) indexNowMal.push("no encuentro `const INDEXNOW_CLAVE = null;` (o con una clave entre comillas) en generar_paginas_seo.js");
  else if (mk[1] !== "null") {
    indexNowClave = mk[1].slice(1, -1);
    const f = path.join(RAIZ, indexNowClave + ".txt");
    if (!/^[A-Za-z0-9-]{8,128}$/.test(indexNowClave)) indexNowMal.push(`INDEXNOW_CLAVE = ${mk[1]} no es válida (8 a 128 caracteres, solo letras, cifras y -)`);
    else if (!fs.existsSync(f)) indexNowMal.push(`falta /${indexNowClave}.txt en la raíz: ejecuta node scripts/generar_paginas_seo.js`);
    else if (fs.readFileSync(f, "utf8").replace(/\r?\n$/, "") !== indexNowClave) indexNowMal.push(`/${indexNowClave}.txt no contiene exactamente la clave: ejecuta node scripts/generar_paginas_seo.js`);
  }
}

const muestra = (l, f) => l.slice(0, 15).map(f).join("\n") + (l.length > 15 ? `\n  … y ${l.length - 15} más` : "");
console.log(`Páginas: ${html.size} · enlaces internos: ${nEnlaces}`);
console.log(`Enlaces rotos: ${rotos.length}${rotos.length ? "\n" + muestra(rotos, ([r, u]) => `  ${r} → ${u}`) : ""}`);
console.log(`Títulos repetidos: ${dupT.length}${dupT.length ? "\n" + muestra(dupT, ([t, l]) => `  «${t}»: ${l.join(", ")}`) : ""}`);
console.log(`Descripciones repetidas: ${dupD.length}${dupD.length ? "\n" + muestra(dupD, ([t, l]) => `  «${t.slice(0, 70)}…»: ${l.join(", ")}`) : ""}`);
console.log(`Títulos > ${MAX_TIT} o descripciones > ${MAX_DESC} caracteres: ${largos.length}${largos.length ? "\n" + muestra(largos, (r) => "  " + r) : ""}`);
console.log(`JSON-LD ilegible: ${ldMal.length}${ldMal.length ? " (" + ldMal.slice(0, 10).join(", ") + ")" : ""}`);
console.log(`Horarios especiales (verano y exámenes): ${nHorEsp} tramos en ${nPagHorEsp} fichas · mal formados o solapados: ${horEspMal.length}${horEspMal.length ? "\n" + muestra(horEspMal, (r) => "  " + r) : ""}`);
console.log(`ItemList: ${itemsLista.length} bibliotecas · a su ficha: ${nItemsFicha} · a /#bib=: ${nItemsBib} · /#bib= con ficha: ${bibConFicha.length} · @id distinto del de la ficha: ${idMal.length}` +
  (bibConFicha.length + idMal.length ? "\n" + muestra(bibConFicha.concat(idMal), (r) => "  " + r) : ""));
console.log(`Lugares con fichas y mainEntity ItemList: provincias ${nLugarLista.provincia.join(" de ")} · localidades ${nLugarLista.localidad.join(" de ")} · sin ItemList: ${sinLista.length}` +
  (sinLista.length ? "\n" + muestra(sinLista, (r) => "  " + r) : ""));
console.log(`Índice /bibliotecas/: CollectionPage ${indiceCP ? "sí" : "NO"} · provincias en su ItemList: ${nIndiceProvs} · mal: ${indiceMal.length}${indiceMal.length ? "\n" + muestra(indiceMal, (r) => "  " + r) : ""}`);
console.log(`hasPart: ${nHasPart} en ${nPagHasPart} páginas (temáticas que enlazan sus partes: ${nTemasPartes}) · rotos o sin enlace en el HTML: ${hasPartMal.length}${hasPartMal.length ? "\n" + muestra(hasPartMal, (r) => "  " + r) : ""}`);
console.log(`Temáticas: España ${nTemas.España} · provincia ${nTemas.provincia} · localidad ${nTemas.localidad} · con isPartOf bien: España ${nIsPartOf.España} · provincia ${nIsPartOf.provincia} · localidad ${nIsPartOf.localidad} · lugares con isPartOf bien: provincias ${nLugarIsPartOf.provincia} · localidades ${nLugarIsPartOf.localidad} · fichas con isPartOf bien: a su localidad ${nFichaIsPartOf.localidad} · a su provincia ${nFichaIsPartOf.provincia} (fuera del ItemList de esa página: ${nFichasFueraLista}) · con isPartOf a su hub bien: ${Object.entries(nHubIsPartOf).map(([t, n]) => `${t} ${n}`).join(" · ")} · hubs con isPartOf al índice bien: ${nHubsIndice} · mal: ${isPartOfMal.length}${isPartOfMal.length ? "\n" + muestra(isPartOfMal, (r) => "  " + r) : ""}`);
console.log(`Migas de las fichas (breadcrumb del WebPage → BreadcrumbList #migas, penúltimo = isPartOf): ${nFichaMigas} de ${fichas.size} bien · índice, provincias, localidades y temáticas (breadcrumb del CollectionPage → #migas): ${Object.entries(nLugarMigas).map(([t, n]) => `${t} ${n}`).join(" · ")} (temáticas con penúltimo ≠ isPartOf, solo contadas: ${nTemaMigasDistintoIsPartOf}) · hubs, salas de estudio, universidades y exámenes (penúltimo = isPartOf): ${Object.entries(nHubMigas).map(([t, n]) => `${t} ${n}`).join(" · ")} · BreadcrumbList sueltas (sin @id <ruta>#migas enlazado: fallo): ${nMigasSueltas}${nMigasSueltas ? ` (${Object.entries(migasSueltas).map(([t, n]) => `${t} ${n}`).join(" · ")})` : ""} · mal: ${migasMal.length}${migasMal.length ? "\n" + muestra(migasMal, (r) => "  " + r) : ""}`);
const porFam = (o) => Object.entries(o).map(([t, n]) => `${t} ${n}`).join(" · ") || "0";
console.log(`Migas visibles = JSON-LD (<nav class="migas"> ↔ BreadcrumbList #migas: orden, texto y destino) en las indexables: ${nMigasVisPag} de ${[...html.values()].filter((h) => !noindex(h)).length} bien (${porFam(nMigasVis)}) · discordancias: ${migasVisMal.length}${migasVisMal.length ? ` (${porFam(migasVisMalFam)})` : ""} · items de las migas (${nItemsMigas}) que no son / ni página indexable del sitemap: ${itemMigasMal.length}${itemMigasMal.length ? ` (${porFam(itemMigasMalFam)})` : ""}` +
  (migasVisMal.length + itemMigasMal.length ? "\n" + muestra(migasVisMal.concat(itemMigasMal), (r) => "  " + r) : ""));
console.log(`Última miga con aria-current="page" (<span> de la propia página, una sola vez por <nav class="migas">) en las indexables: ${Object.values(nAriaActual).reduce((a, b) => a + b, 0)} (${porFam(nAriaActual)}) · mal: ${ariaActualMal.length}${ariaActualMal.length ? "\n" + muestra(ariaActualMal, (r) => "  " + r) : ""}`);
console.log(`CollectionPage de la propia página con @id <ruta>#pagina: ${Object.values(nCpId).reduce((a, b) => a + b, 0)} (${porFam(nCpId)}) · sin él: ${cpIdMal.length}${cpIdMal.length ? "\n" + muestra(cpIdMal, (r) => "  " + r) : ""}`);
console.log(`mainEntityOfPage de las fichas (WebPage #pagina about Library #biblioteca y Library mainEntityOfPage → #pagina): ${nFichaMainEntity} de ${fichas.size} bien · mal: ${mainEntityMal.length}${mainEntityMal.length ? "\n" + muestra(mainEntityMal, (r) => "  " + r) : ""}`);
console.log(`FAQPage en el grafo de su página (@id #faq, isPartOf → #pagina de la misma URL): fichas (WebPage) ${nFichaFaqBien} de ${nFichaFaq} bien, con hasPart #faq recíproco ${nFichaHasPart} · demás páginas (CollectionPage) ${nOtraFaqBien} de ${nOtraFaq} bien · mal: ${faqMal.length}${faqMal.length ? "\n" + muestra(faqMal, (r) => "  " + r) : ""}`);
console.log(`Huérfanas (sin enlace desde otra página generada): ${huerfanas.length}${huerfanas.length ? "\n" + muestra(huerfanas, (r) => "  " + r) : ""}`);
console.log(`Sitemap: ${enSitemap.size} URL · no existen: ${sitemapRoto.length} · faltan en el sitemap: ${faltanSitemap.length}` +
  (sitemapRoto.length + faltanSitemap.length ? "\n" + muestra(sitemapRoto.concat(faltanSitemap), (r) => "  " + r) : ""));
console.log(`Lastmod: ${[...lastmodN].sort().map(([d, n]) => `${d} ×${n}`).join(", ")} · mal (falta, formato, futuro o < dateModified): ${lastmodMal.length}` +
  (lastmodMal.length ? "\n" + muestra(lastmodMal, (r) => "  " + r) : ""));
console.log(`404: ${n404} enlaces internos · provincias enlazadas: ${n404Prov} · «¿Buscabas…?» ${n404Busca} casos ok · slugs-404: ${n404Slugs} rutas ok · mal: ${mal404.length}${mal404.length ? "\n" + muestra(mal404, (r) => "  " + r) : ""}`);
// Analítica (docs/ANALITICA.md): todas las páginas generadas y la 404 cargan /analitica.js (una sola vez, defer, en el
// <head>) y ninguna lleva a mano un script de proveedor: encenderla es cambiar la línea de analitica.js, no las páginas.
const analiticaMal = [];
for (const [r, h] of [...html, ["/404.html", fs.existsSync(f404) ? fs.readFileSync(f404, "utf8") : ""]]) {
  const cab = h.split("</head>")[0], n = (h.match(/<script src="\/analitica\.js" defer><\/script>/g) || []).length;
  if (n !== 1 || !cab.includes('<script src="/analitica.js" defer></script>')) analiticaMal.push(`${r}: analitica.js ×${n}${n === 1 ? " fuera del <head>" : ""}`);
  if (/_vercel\/insights|gc\.zgo\.at|goatcounter|googletagmanager|google-analytics/.test(h)) analiticaMal.push(`${r}: script de analítica puesto a mano`);
}
console.log(`Analítica (/analitica.js en el <head>, apagada): ${html.size + 1 - new Set(analiticaMal.map((x) => x.split(":")[0])).size} de ${html.size + 1} páginas (con la 404) · mal: ${analiticaMal.length}${analiticaMal.length ? "\n" + muestra(analiticaMal, (r) => "  " + r) : ""}`);
// Vista previa al compartir (Objetivo 8): cada página indexable (bibliotecas/… y las guías de /estudiar/) lleva, en el
// <head> y una sola vez, og:site_name, og:image absoluta a https://bibliomapa.es/… de un archivo que existe en el repo,
// og:image:width/height iguales a las dimensiones reales del PNG/JPEG, og:image:alt no vacío y twitter:card
// (summary o summary_large_image). Sin og:image, WhatsApp o Telegram enseñan solo texto al compartir una ficha.
const vistaMal = [], dimsCache = new Map();
function dimsImagen(f) {
  if (dimsCache.has(f)) return dimsCache.get(f);
  let d = null;
  try {
    const b = fs.readFileSync(f);
    if (b.slice(1, 4).toString() === "PNG") d = [b.readUInt32BE(16), b.readUInt32BE(20)];
    else if (b[0] === 0xff && b[1] === 0xd8) for (let i = 2; i < b.length - 9;) {
      if (b[i] !== 0xff) break;
      const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) { d = [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; break; }
      i += 2 + len;
    }
  } catch (e) { d = null; }
  dimsCache.set(f, d);
  return d;
}
const metaCab = (cab, attr, nombre) => [...cab.matchAll(new RegExp(`<meta ${attr}="${nombre.replace(/[.:]/g, "\\$&")}" content="([^"]*)">`, "g"))].map((m) => decodifica(m[1]));
const guias = [];
if (fs.existsSync(path.join(RAIZ, "estudiar"))) (function recorreG(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) recorreG(f); else if (e.name === "index.html") guias.push([rutaDe(f), fs.readFileSync(f, "utf8")]);
  }
})(path.join(RAIZ, "estudiar"));
const fPortada = path.join(RAIZ, "index.html");
const conVista = [["/index.html", fs.existsSync(fPortada) ? fs.readFileSync(fPortada, "utf8") : ""], ...html, ...guias];
for (const [r, h] of conVista) {
  const cab = h.split("</head>")[0];
  const uno = (attr, n) => { const l = metaCab(cab, attr, n); if (l.length !== 1) vistaMal.push(`${r}: ${n} ×${l.length}`); return l[0]; };
  const sn = uno("property", "og:site_name");
  if (sn !== undefined && !sn.trim()) vistaMal.push(`${r}: og:site_name vacío`);
  const img = uno("property", "og:image"), an = uno("property", "og:image:width"), al = uno("property", "og:image:height"), alt = uno("property", "og:image:alt");
  const tc = uno("name", "twitter:card");
  if (tc !== undefined && !["summary", "summary_large_image"].includes(tc)) vistaMal.push(`${r}: twitter:card «${tc}»`);
  if (alt !== undefined && !alt.trim()) vistaMal.push(`${r}: og:image:alt vacío`);
  if (img === undefined) continue;
  const ti = metaCab(cab, "name", "twitter:image");
  if (ti.length > 1) vistaMal.push(`${r}: twitter:image ×${ti.length}`);
  if (tc === "summary_large_image" && ti[0] !== img) vistaMal.push(`${r}: twitter:image (${ti[0]}) ≠ og:image con summary_large_image`);
  if (!img.startsWith(DOMINIO + "/")) { vistaMal.push(`${r}: og:image no absoluta a ${DOMINIO}/ (${img})`); continue; }
  const fImg = path.join(RAIZ, img.slice(DOMINIO.length + 1).split(/[?#]/)[0]);
  const d = fs.existsSync(fImg) ? dimsImagen(fImg) : null;
  if (!fs.existsSync(fImg)) vistaMal.push(`${r}: og:image ${img} no existe en el repo`);
  else if (!d) vistaMal.push(`${r}: og:image ${img} no es un PNG/JPEG legible`);
  else if (String(d[0]) !== an || String(d[1]) !== al) vistaMal.push(`${r}: og:image:width/height ${an}×${al} ≠ real ${d[0]}×${d[1]}`);
  else if (tc === "summary_large_image" && d[0] < 1.5 * d[1]) vistaMal.push(`${r}: summary_large_image con imagen no apaisada ${d[0]}×${d[1]}`);
}
console.log(`Vista previa al compartir (og:site_name, og:image absoluta con width/height reales y alt, twitter:card): ${conVista.length - new Set(vistaMal.map((x) => x.split(":")[0])).size} de ${conVista.length} páginas (portada, ${html.size} de bibliotecas/ y ${guias.length} guías de /estudiar/; imagen grande: ${conVista.filter(([, h]) => metaCab(h.split("</head>")[0], "name", "twitter:card")[0] === "summary_large_image").length}) · mal: ${vistaMal.length}${vistaMal.length ? "\n" + muestra(vistaMal, (r) => "  " + r) : ""}`);
console.log(`Search Console (meta google-site-verification):${gscEn.length ? gscEn.map(([r]) => r).join(", ") : "ninguna (verificación por DNS o pendiente)"} · mal: ${gscMal.length}${gscMal.length ? "\n" + muestra(gscMal, (r) => "  " + r) : ""}`);
console.log(`IndexNow: ${indexNowClave ? `clave puesta, /${indexNowClave}.txt` : "sin clave (INDEXNOW_CLAVE = null)"} · mal: ${indexNowMal.length}${indexNowMal.length ? "\n" + muestra(indexNowMal, (r) => "  " + r) : ""}`);
// ---------- Prueba de «despliega primero» de avisar_indexnow.js ----------
// Copia avisar_indexnow.js a una carpeta temporal con un generar_paginas_seo.js mínimo (solo una INDEXNOW_CLAVE
// ficticia), su .txt y un sitemap.xml de una URL; por cada caso levanta un servidor http propio en 127.0.0.1 (puerto
// libre) que sirve /<clave>.txt y exige: salida 0 si responde 200 con la clave (con y sin salto final) y 1 si da 404 o
// un texto distinto. Usa --base http://127.0.0.1:<puerto> sin --simular (--simular no comprueba nada): con una base que
// no es bibliomapa.es el script nunca hace el POST, y además el hijo arranca con un fetch que rechaza todo lo que no sea
// 127.0.0.1. Los casos van en paralelo (≈ 0,2 s) y la carpeta temporal se borra siempre.
async function probarAvisoIndexNow() {
  const os = require("os"), http = require("http"), { spawn } = require("child_process");
  const mal = [], CLAVE = "clave-ficticia-de-prueba-1234", FECHA = "2026-01-01";
  // nombre: [estado HTTP, texto servido, salida esperada de avisar_indexnow.js]
  const casos = { bien: [200, CLAVE, 0], "bien-con-salto": [200, CLAVE + "\n", 0], "404": [404, "Not found", 1], "otro-texto": [200, "otra-clave-distinta", 1] };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "indexnow-prueba-"));
  const servidores = [];
  try {
    fs.mkdirSync(path.join(tmp, "scripts"));
    fs.copyFileSync(path.join(RAIZ, "scripts", "avisar_indexnow.js"), path.join(tmp, "scripts", "avisar_indexnow.js"));
    fs.writeFileSync(path.join(tmp, "scripts", "generar_paginas_seo.js"), `"use strict";\nconst INDEXNOW_CLAVE = "${CLAVE}";\n`);
    fs.writeFileSync(path.join(tmp, CLAVE + ".txt"), CLAVE + "\n");
    fs.writeFileSync(path.join(tmp, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset><url><loc>https://bibliomapa.es/</loc><lastmod>${FECHA}</lastmod></url></urlset>\n`);
    fs.writeFileSync(path.join(tmp, "sin-red.js"), `const f = globalThis.fetch; globalThis.fetch = (u, o) => /^http:\\/\\/127\\.0\\.0\\.1:\\d+\\//.test(String(u)) ? f(u, o) : Promise.reject(new Error("red real bloqueada en la prueba: " + u));\n`);
    const res = await Promise.all(Object.entries(casos).map(async ([nombre, [st, txt]]) => {
      const s = http.createServer((req, r) => {
        const [e, t] = req.url === `/${CLAVE}.txt` ? [st, txt] : [404, "Not found"];
        r.writeHead(e, { "Content-Type": "text/plain; charset=utf-8" }); r.end(t);
      });
      servidores.push(s);
      await new Promise((ok, ko) => s.once("error", ko).listen(0, "127.0.0.1", ok));
      const h = spawn(process.execPath, ["-r", path.join(tmp, "sin-red.js"), path.join(tmp, "scripts", "avisar_indexnow.js"), "--fecha", FECHA, "--base", `http://127.0.0.1:${s.address().port}`],
        { cwd: tmp, env: { ...process.env, NODE_OPTIONS: "" }, stdio: ["ignore", "pipe", "pipe"] });
      let out = ""; h.stdout.on("data", (d) => (out += d)); h.stderr.on("data", (d) => (out += d));
      const reloj = setTimeout(() => h.kill("SIGKILL"), 4000);
      const code = await new Promise((ok) => h.on("close", (c) => { clearTimeout(reloj); ok(c); }));
      return [nombre, code, out];
    }));
    for (const [nombre, code, out] of res) {
      const [st, txt, quiere] = casos[nombre];
      if (/red real bloqueada/.test(out)) mal.push(`${nombre}: intentó salir a la red real`);
      else if (code !== quiere) mal.push(`${nombre} (HTTP ${st} «${txt.trim()}»): salida ${code}, se esperaba ${quiere} · ${out.trim().split("\n").pop().slice(0, 140)}`);
      else if (quiere === 0 && !/Clave publicada: .* → 200 con la clave exacta\./.test(out)) mal.push(`${nombre}: salida 0 sin «Clave publicada… 200 con la clave exacta» (¿no comprobó nada?)`);
    }
  } catch (e) {
    mal.push(`prueba: no se pudo hacer (${e.message})`);
  } finally {
    for (const s of servidores) s.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return [mal, Object.keys(casos).length];
}

(async () => {
  const t0 = Date.now();
  const [avisoMal, nCasos] = await probarAvisoIndexNow();
  console.log(`IndexNow «despliega primero» (avisar_indexnow.js --base contra servidor local, sin red real): ${nCasos - new Set(avisoMal.map((x) => x.split(" ")[0])).size} de ${nCasos} casos bien (200 con la clave → 0; 404 u otro texto → 1) en ${Date.now() - t0} ms · mal: ${avisoMal.length}${avisoMal.length ? "\n" + muestra(avisoMal, (r) => "  " + r) : ""}`);
  if (ariaActualMal.length || cpIdMal.length || migasVisMal.length || itemMigasMal.length || avisoMal.length || vistaMal.length || analiticaMal.length || gscMal.length || indexNowMal.length || migasMal.length || mainEntityMal.length || faqMal.length || indiceMal.length || hasPartMal.length || isPartOfMal.length || mal404.length || lastmodMal.length || rotos.length || dupT.length || dupD.length || largos.length || ldMal.length || bibConFicha.length || idMal.length || sinLista.length || horEspMal.length || sitemapRoto.length || faltanSitemap.length) process.exit(1);
})();
