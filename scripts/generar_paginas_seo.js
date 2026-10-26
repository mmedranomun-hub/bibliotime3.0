#!/usr/bin/env node
/* Genera las páginas estáticas para buscadores de bibliomapa.es:
     bibliotecas/index.html                      → todas las provincias
     bibliotecas/<provincia>/index.html          → bibliotecas de la provincia, por localidad
     bibliotecas/<provincia>/<localidad>/index.html (localidades con 3 o más bibliotecas)
     sitemap.xml y robots.txt
   Uso (desde la raíz del proyecto):  node scripts/generar_paginas_seo.js
   Vuelve a ejecutarlo cada vez que cambien los datos (app.js o bibliotecas-espana.js).

   Reglas: solo se publican datos que ya están en la app. Los horarios solo si están verificados (campo h,
   con su fuente y fecha); el resto dice «horario sin confirmar». No se inventa nada para posicionar.
   El índice de cada biblioteca es el mismo que en la app (#bib=<índice>-<nombre> abre su ficha en el mapa). */
"use strict";
const fs = require("fs");
const path = require("path");
const RAIZ = path.resolve(__dirname, "..");
const DOMINIO = "https://bibliomapa.es";
const HOY = new Date().toISOString().slice(0, 10);

// ---------- Datos ----------
const appJs = fs.readFileSync(path.join(RAIZ, "app.js"), "utf8");
const inicio = appJs.indexOf("const BIBLIOTECAS=[");
const fin = appJs.indexOf("];", inicio);
const bloqueNavarra = appJs.slice(inicio, fin);
const re = /\{nombre:"((?:[^"\\]|\\.)*)",lat:(-?[\d.]+),lon:(-?[\d.]+),dir:"((?:[^"\\]|\\.)*)",tel:"((?:[^"\\]|\\.)*)",web:"((?:[^"\\]|\\.)*)"/g;
const navarra = [];
let m;
while ((m = re.exec(bloqueNavarra))) {
  const [, n, lat, lon, dir, tel, web] = m;
  navarra.push({ n: n.replace(/\\"/g, '"'), lat: +lat, lon: +lon, dir, tel, web, p: "Navarra", t: /Universidad|UPNA|UNED/.test(n) ? "universidad" : "publica" });
}
const ventana = {};
new Function("window", fs.readFileSync(path.join(RAIZ, "bibliotecas-espana.js"), "utf8"))(ventana);
const espana = ventana.BIBLIOTECAS_ES;
const nNavarraApp = (bloqueNavarra.match(/\n  \{nombre:"/g) || []).length;
if (navarra.length !== nNavarraApp) {
  console.error(`No cuadran las bibliotecas de Navarra (${navarra.length} leídas, ${nNavarraApp} en app.js). Revisa la expresión regular.`);
  process.exit(1);
}

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
navarra.forEach((b, i) => todas.push({ ...b, i, c: localidadNavarra(b), h: null }));
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
});

// ---------- Utilidades ----------
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const DIAS = ["L", "M", "X", "J", "V", "S", "D"];
const DIAS_SCHEMA = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const quitaCero = (t) => t.replace(/^0(\d)/, "$1");
function franjas(lista) { return (lista || []).map((r) => quitaCero(r[0]) + "–" + quitaCero(r[1])).join(", "); }
// «L–V 9:00–21:00 · S 9:00–14:00 · D cerrado»
function horarioTexto(inv) {
  const grupos = [];
  DIAS.forEach((d) => {
    const f = franjas(inv[d]) || "cerrado";
    const ult = grupos[grupos.length - 1];
    if (ult && ult.f === f) ult.hasta = d; else grupos.push({ desde: d, hasta: d, f });
  });
  return grupos.map((g) => (g.desde === g.hasta ? g.desde : g.desde + "–" + g.hasta) + " " + g.f).join(" · ");
}
function abreFinde(b) { return b.h && b.h.inv && ((b.h.inv.S || []).length || (b.h.inv.D || []).length); }
function cierraTarde(b) { return b.h && b.h.inv && DIAS.slice(0, 5).some((d) => (b.h.inv[d] || []).some((r) => r[1] >= "21:00" || r[1] === "00:00")); }
const TIPO = { mayor: "Gran biblioteca", universidad: "Universitaria", publica: "Pública", otra: "Biblioteca" };
const enlaceApp = (b) => `/#bib=${b.i}-${slug(b.n).slice(0, 40)}`;

function libraryLD(b, url) {
  const o = { "@type": "Library", name: b.n, url: url, geo: { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lon },
    address: { "@type": "PostalAddress", streetAddress: b.dir || undefined, addressLocality: b.c, addressRegion: b.p, addressCountry: "ES" } };
  if (b.tel) o.telephone = b.tel;
  if (b.web) o.sameAs = b.web;
  if (b.h && b.h.inv) {
    o.openingHoursSpecification = [];
    DIAS.forEach((d, k) => (b.h.inv[d] || []).forEach((r) => o.openingHoursSpecification.push({ "@type": "OpeningHoursSpecification", dayOfWeek: DIAS_SCHEMA[k], opens: r[0], closes: r[1] })));
  }
  return o;
}

// ---------- Plantilla ----------
function pagina({ ruta, titulo, descripcion, h1, intro, cuerpo, migas, ld }) {
  const url = DOMINIO + ruta;
  const migasLD = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: migas.map((x, k) => ({ "@type": "ListItem", position: k + 1, name: x[0], item: DOMINIO + x[1] })) };
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Bibliomapa">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="es_ES">
<meta name="theme-color" content="#6c5ce7">
<link rel="icon" href="/icons/favicon-32.png" type="image/png">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="stylesheet" href="/seo.css">
<script type="application/ld+json">${JSON.stringify(migasLD)}</script>
${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ""}
</head>
<body>
<header class="top"><a class="marca" href="/"><span>📚</span> Bibliomapa</a><a class="cta-top" href="/">Abrir el mapa</a></header>
<main>
<nav class="migas" aria-label="Estás en">${migas.map((x, k) => (k < migas.length - 1 ? `<a href="${x[1]}">${esc(x[0])}</a> › ` : `<span>${esc(x[0])}</span>`)).join("")}</nav>
<h1>${h1}</h1>
<p class="intro">${intro}</p>
<a class="cta" href="/">📍 ¿Cuál está abierta ahora cerca de ti? Abrir el mapa</a>
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

function tarjeta(b) {
  const horario = b.h && b.h.inv
    ? `<div class="hor ok">🕒 ${esc(horarioTexto(b.h.inv))}${b.h.fv ? ` <small>(verificado el ${esc(b.h.fv.split("-").reverse().join("/"))}${b.h.f ? `, <a href="${esc(b.h.f)}" rel="nofollow noopener" target="_blank">fuente</a>` : ""})</small>` : ""}</div>${b.h.nota ? `<div class="nota">${esc(b.h.nota)}</div>` : ""}`
    : `<div class="hor">🕒 Horario sin confirmar: consúltalo en su web o en la app</div>`;
  return `<article class="bib">
  <h3>${esc(b.n)}</h3>
  <div class="meta"><span class="tipo">${TIPO[b.t] || "Biblioteca"}</span>${b.dir ? ` · ${esc(b.dir)}` : ""}</div>
  ${horario}
  <div class="acc"><a href="${enlaceApp(b)}">Ver en el mapa</a>${b.tel ? ` · <a href="tel:${esc(b.tel.replace(/\s/g, ""))}">${esc(b.tel)}</a>` : ""}${b.web ? ` · <a href="${esc(b.web)}" rel="nofollow noopener" target="_blank">Web oficial</a>` : ""}</div>
</article>`;
}

function faq(lugar, lista) {
  const finde = lista.filter(abreFinde), tarde = lista.filter(cierraTarde), verif = lista.filter((b) => b.h);
  const nombres = (l) => l.slice(0, 6).map((b) => esc(b.n)).join(", ") + (l.length > 6 ? " y otras" : "");
  const q = [
    [`¿Cuántas bibliotecas hay en ${lugar}?`, `Bibliomapa tiene ${lista.length} ${lista.length === 1 ? "biblioteca" : "bibliotecas"} en ${esc(lugar)}${verif.length ? `, ${verif.length} con horario verificado en su web oficial` : ""}.`],
    [`¿Qué bibliotecas abren el fin de semana en ${lugar}?`, finde.length ? `Según sus horarios verificados: ${nombres(finde)}. Comprueba siempre los festivos en su web.` : `No tenemos todavía horarios verificados de fin de semana en ${esc(lugar)}. En el mapa puedes ver la ficha de cada una y su web.`],
    [`¿Qué biblioteca cierra más tarde en ${lugar}?`, tarde.length ? `Con horario verificado, abren hasta las 21:00 o más tarde entre semana: ${nombres(tarde)}.` : `No tenemos horarios verificados que cierren a partir de las 21:00 en ${esc(lugar)}.`],
  ];
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: q.map(([p, r]) => ({ "@type": "Question", name: p.replace(/<[^>]+>/g, ""), acceptedAnswer: { "@type": "Answer", text: r.replace(/<[^>]+>/g, "") } })) };
  return { html: `<section class="faq"><h2>Preguntas frecuentes</h2>${q.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${r}</p></details>`).join("")}</section>`, ld };
}

// ---------- Escritura ----------
const SALIDA = path.join(RAIZ, "bibliotecas");
fs.rmSync(SALIDA, { recursive: true, force: true });
const urls = [["/", "1.0"], ["/bibliotecas/", "0.9"]];
const escribe = (ruta, html) => { const f = path.join(RAIZ, ruta, "index.html"); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const porProv = {};
todas.forEach((b) => (porProv[b.p] = porProv[b.p] || []).push(b));
const provincias = Object.keys(porProv).sort((a, b) => a.localeCompare(b, "es"));
const ordenBib = (a, b) => (b.h ? 1 : 0) - (a.h ? 1 : 0) || ({ mayor: 0, universidad: 1, publica: 2, otra: 3 }[a.t] - { mayor: 0, universidad: 1, publica: 2, otra: 3 }[b.t]) || a.n.localeCompare(b.n, "es");

provincias.forEach((p) => {
  const lista = porProv[p], ps = slug(p);
  const porLoc = {};
  lista.forEach((b) => (porLoc[b.c] = porLoc[b.c] || []).push(b));
  const locs = Object.keys(porLoc).sort((a, b) => porLoc[b].length - porLoc[a].length || a.localeCompare(b, "es"));
  const conPagina = locs.filter((c) => porLoc[c].length >= 3 && slug(c) && slug(c) !== ps);
  // páginas de localidad
  conPagina.forEach((c) => {
    const l = porLoc[c].slice().sort(ordenBib), ruta = `/bibliotecas/${ps}/${slug(c)}/`;
    const f = faq(c, l);
    escribe(ruta, pagina({
      ruta, titulo: `Bibliotecas en ${c}: horarios y salas de estudio abiertas | Bibliomapa`,
      descripcion: `Las ${l.length} bibliotecas de ${c} (${p}) en un mapa: cuáles están abiertas ahora, horarios verificados, dirección y cómo llegar. Estudia con cronómetro y planta tu bosque.`,
      h1: `Bibliotecas en ${esc(c)}`, intro: `${l.length} bibliotecas y salas de estudio en ${esc(c)} (${esc(p)})${l.filter((b) => b.h).length ? `, ${l.filter((b) => b.h).length} con horario verificado` : ""}. En el mapa de Bibliomapa ves en tiempo real cuáles están abiertas y cuál te pilla más cerca.`,
      cuerpo: `<section class="lista">${l.map(tarjeta).join("")}</section>${f.html}<p class="volver"><a href="/bibliotecas/${ps}/">← Todas las bibliotecas de ${esc(p)}</a></p>`,
      migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [p, `/bibliotecas/${ps}/`], [c, ruta]],
      ld: [ { "@context": "https://schema.org", "@type": "ItemList", name: `Bibliotecas en ${c}`, itemListElement: l.map((b, k) => ({ "@type": "ListItem", position: k + 1, item: libraryLD(b, DOMINIO + enlaceApp(b)) })) }, f.ld ],
    }));
    urls.push([ruta, "0.8"]);
  });
  // página de provincia
  const ruta = `/bibliotecas/${ps}/`, f = faq(p, lista);
  const secciones = locs.map((c) => {
    const l = porLoc[c].slice().sort(ordenBib);
    const titulo = conPagina.includes(c) ? `<a href="/bibliotecas/${ps}/${slug(c)}/">${esc(c)}</a>` : esc(c);
    return `<section class="loc"><h2>${titulo} <small>${l.length}</small></h2>${(conPagina.includes(c) ? l.slice(0, 4) : l).map(tarjeta).join("")}${conPagina.includes(c) && l.length > 4 ? `<p class="mas"><a href="/bibliotecas/${ps}/${slug(c)}/">Ver las ${l.length} bibliotecas de ${esc(c)} →</a></p>` : ""}</section>`;
  }).join("");
  escribe(ruta, pagina({
    ruta, titulo: `Bibliotecas en ${p}: abiertas ahora, horarios y salas de estudio | Bibliomapa`,
    descripcion: `Mapa de las ${lista.length} bibliotecas de ${p}: cuáles están abiertas ahora, horarios verificados, salas de estudio y cómo llegar. Gratis y sin registro.`,
    h1: `Bibliotecas en ${esc(p)}`, intro: `${lista.length} bibliotecas en ${locs.length} ${locs.length === 1 ? "localidad" : "localidades"} de ${esc(p)}. Elige tu localidad o abre el mapa para ver cuáles están abiertas ahora mismo.`,
    cuerpo: `<nav class="locs">${conPagina.map((c) => `<a href="/bibliotecas/${ps}/${slug(c)}/">${esc(c)} <small>${porLoc[c].length}</small></a>`).join("")}</nav>${secciones}${f.html}<p class="volver"><a href="/bibliotecas/">← Todas las provincias</a></p>`,
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [p, ruta]],
    ld: f.ld,
  }));
  urls.push([ruta, "0.8"]);
});

// índice
escribe("/bibliotecas/", pagina({
  ruta: "/bibliotecas/", titulo: "Bibliotecas de España por provincia: abiertas ahora y horarios | Bibliomapa",
  descripcion: `Más de ${Math.floor(todas.length / 100) * 100} bibliotecas de toda España por provincia y localidad: horarios verificados, salas de estudio y cuáles están abiertas ahora.`,
  h1: "Bibliotecas de España por provincia", intro: `${todas.length} bibliotecas en ${provincias.length} provincias. Encuentra la tuya y mira en el mapa cuál está abierta ahora.`,
  cuerpo: `<nav class="locs grande">${provincias.map((p) => `<a href="/bibliotecas/${slug(p)}/">${esc(p)} <small>${porProv[p].length}</small></a>`).join("")}</nav>`,
  migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"]],
}));

fs.writeFileSync(path.join(RAIZ, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, pr]) => `  <url><loc>${DOMINIO}${u}</loc><lastmod>${HOY}</lastmod><priority>${pr}</priority></url>`).join("\n")}
</urlset>
`);
fs.writeFileSync(path.join(RAIZ, "robots.txt"), `User-agent: *
Allow: /

Sitemap: ${DOMINIO}/sitemap.xml
`);
console.log(`Páginas: ${urls.length - 1} (+ portada) · provincias: ${provincias.length} · bibliotecas: ${todas.length}`);
