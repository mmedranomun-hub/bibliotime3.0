#!/usr/bin/env node
/* Genera las páginas estáticas para buscadores de bibliomapa.es:
     bibliotecas/index.html                      → todas las provincias
     bibliotecas/<provincia>/index.html          → bibliotecas de la provincia, por localidad
     bibliotecas/<provincia>/<localidad>/index.html (localidades con 3 o más bibliotecas)
     bibliotecas/abiertas-hoy|abiertas-domingo|abiertas-fin-de-semana|abiertas-hasta-tarde/index.html (España, por provincia;
       «hoy» calcula en el navegador el horario de hoy y si está abierta ahora)
       y abiertas-verano (solo con horario de verano verificado: h.ver + h.vd/h.vh)
     bibliotecas/<provincia>/<tema>/index.html   (mismos temas, solo con 2 o más bibliotecas que cumplen)
     bibliotecas/<provincia>/<localidad>/<tema>/index.html (domingo, fin de semana y hasta tarde; localidades con
       página propia y 2 o más que cumplen)
     bibliotecas/<provincia>/<biblioteca>/index.html (las más buscadas: Nacional, Regional de Madrid, grandes y
       universitarias de capitales y todas las de capitales con horario verificado)
     bibliotecas/salas-de-estudio/ y bibliotecas/<prov>/[<capital>/]salas-de-estudio/ (capitales con 5 o más universitarias,
       públicas o grandes y alguna con horario verificado: ranking por horas a la semana, exámenes, acceso y FAQ)
     bibliotecas/universidades/ y bibliotecas/universidades/<universidad>/ (3 o más bibliotecas asignadas por dominio web
       o nombre inequívoco y alguna con horario verificado: horarios con fuente, exámenes, por ciudad/campus y FAQ)
     bibliotecas/examenes/ y bibliotecas/examenes/<ciudad>/ (solo ciudades con entradas vigentes de temporada-examenes.js con
       fuente y fecha: periodo, horario, nota, fuente oficial y FAQ; enlazadas desde provincias, localidades, salas y el hub)
     bibliotecas/horarios/ (hub: todas las temáticas, salas y universidades por provincia; todas enlazan a él)
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
const HOY = new Date().toISOString().slice(0, 10);

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
// Las páginas temáticas solo usan horarios verificados CON fuente (h.f) y fecha (h.fv).
const verificado = (b) => !!(b.h && b.h.inv && b.h.f && b.h.fv);
const abreDomingo = (b) => verificado(b) && (b.h.inv.D || []).length > 0;
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

// ---------- Plantilla ----------
function pagina({ ruta, titulo, descripcion, h1, intro, cuerpo, migas, ld, cta, head }) {
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
${head || ""}</head>
<body>
<header class="top"><a class="marca" href="/"><span>📚</span> Bibliomapa</a><a class="cta-top" href="/">Abrir el mapa</a></header>
<main>
<nav class="migas" aria-label="Estás en">${migas.map((x, k) => (k < migas.length - 1 ? `<a href="${x[1]}">${esc(x[0])}</a> › ` : `<span>${esc(x[0])}</span>`)).join("")}</nav>
<h1>${h1}</h1>
<p class="intro">${intro}</p>
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
fs.rmSync(SALIDA, { recursive: true, force: true });
const urls = [["/", "1.0"], ["/bibliotecas/", "0.9"]];
const escribe = (ruta, html) => { const f = path.join(RAIZ, ruta, "index.html"); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const porProv = {};
todas.forEach((b) => (porProv[b.p] = porProv[b.p] || []).push(b));
const provincias = Object.keys(porProv).sort((a, b) => a.localeCompare(b, "es"));
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
  { slug: "abiertas-hasta-tarde", corto: "Hasta tarde", que: "abiertas hasta tarde", cumple: (b) => verificado(b) && cierraTarde(b),
    destacado: (b) => `Entre semana cierra a las ${quitaCero(cierreMasTarde(b)).replace("24:00", "00:00 (medianoche)")}`,
    pregunta: (l) => `¿Qué bibliotecas cierran a las 21:00 o más tarde en ${l}?` },
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
TEMAS.forEach((t) => {
  temaProv[t.slug] = {};
  provincias.forEach((p) => { const l = porProv[p].filter(t.cumple); if (l.length >= MIN_TEMA_PROV) temaProv[t.slug][p] = l; });
});
// Localidad: mismos temas (salvo los «local: false»), solo con 2 o más que cumplen y solo en localidades que ya tienen
// página propia (3 o más bibliotecas y slug distinto del de la provincia). Así nunca se crea /madrid/madrid/…, que
// duplicaría la página temática de la provincia, y siempre hay una página de localidad desde la que enlazarla.
const MIN_TEMA_LOC = 2;
const TEMAS_LOC = TEMAS.filter((t) => t.local !== false);
const tieneLocPagina = (p, c, n) => n >= 3 && !!slug(c) && slug(c) !== slug(p);
const temaLoc = {}; // temaLoc[slug]["<provincia>|<localidad>"] = lista
TEMAS_LOC.forEach((t) => { temaLoc[t.slug] = {}; });
provincias.forEach((p) => {
  const porC = {};
  porProv[p].forEach((b) => (porC[b.c] = porC[b.c] || []).push(b));
  Object.keys(porC).forEach((c) => {
    if (!tieneLocPagina(p, c, porC[c].length)) return;
    TEMAS_LOC.forEach((t) => { const l = porC[c].filter(t.cumple); if (l.length >= MIN_TEMA_LOC) temaLoc[t.slug][p + "|" + c] = l; });
  });
});
// Fecha de verificación más reciente de las listadas (dateModified del JSON-LD y lastmod del sitemap): no depende del día
// en que se genera, así que regenerar con los mismos datos da las mismas páginas.
const fechaMod = (lista) => lista.map((b) => b.h.fv).sort().pop();
// Provincia y localidad: muestran horarios solo de las verificadas; dateModified = la más reciente (nada si no hay).
const modVerif = (lista) => { const v = lista.filter(verificado); return v.length ? { dateModified: fechaMod(v) } : {}; };
// JSON-LD de una página temática: CollectionPage (admite dateModified) con la lista como entidad principal.
const ldTema = (ruta, nombre, l) => ({ "@context": "https://schema.org", "@type": "CollectionPage", name: nombre, url: DOMINIO + ruta,
  inLanguage: "es-ES", dateModified: fechaMod(l), mainEntity: { "@type": "ItemList", name: nombre, numberOfItems: l.length,
    itemListElement: l.map((b, k) => ({ "@type": "ListItem", position: k + 1, item: libraryLD(b, DOMINIO + enlaceApp(b)) })) } });
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
// (y de Santiago y Mérida, capitales autonómicas); y todas las de capitales con horario verificado (h.f + h.fv).
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
const masBuscada = (b) => /^Biblioteca Nacional de España$|^Biblioteca Regional Joaqu[ií]n Leguina/.test(b.n) ||
  (enCapital(b) && (b.t === "mayor" || b.t === "universidad" || verificado(b)));
const SALAS_SLUG = "salas-de-estudio";
const paginaDe = new Map(); // índice de la biblioteca → ruta de su página
const conPaginaPropia = todas.filter(masBuscada).sort((a, b) => a.i - b.i);
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
const ventanaEx = {};
try { new Function("window", fs.readFileSync(path.join(RAIZ, "temporada-examenes.js"), "utf8"))(ventanaEx); } catch (e) { /* sin exámenes */ }
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
const bibsPorNombre = new Map();
todas.forEach((b) => (bibsPorNombre.get(b.n) || bibsPorNombre.set(b.n, []).get(b.n)).push(b));
const exCiudades = []; // { k, ciudad, p, slug, ruta, entradas: [{ e, b, uni, h24 }], locs, h24, curso, fv }
EXAMENES.forEach((e) => {
  const k = slug(e.provincia) + "|" + slug(e.ciudad);
  let g = exCiudades.find((x) => x.k === k);
  if (!g) exCiudades.push((g = { k, ciudad: e.ciudad, p: e.provincia, entradas: [], locs: new Set([e.provincia + "|" + e.ciudad]) }));
  const cand = e.bib ? bibsPorNombre.get(e.bib) || [] : [], mismas = cand.filter((b) => b.p === e.provincia);
  const b = mismas.length === 1 ? mismas[0] : cand.length === 1 ? cand[0] : null;
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
  const segun = `Según su horario verificado en la web oficial el ${fechaEs(b.h.fv)}`;
  const nota = b.h.nota ? ` Aviso de la fuente: ${b.h.nota}` : "";
  const dom = b.h.inv.D || [];
  const q = [
    [`¿Abre los domingos ${laBib(b.n)}?`, dom.length ? `Sí. ${segun}, los domingos abre de ${franjas(dom)}.${nota} Comprueba festivos y verano en su web.`
      : sinConfirmar(b, "D") ? `No está confirmado: la fuente oficial no da horario de domingo.${nota}` : `No. ${segun}, los domingos está cerrada.${nota}`],
    [`¿A qué hora cierra ${laBib(b.n)}?`, `${segun}: ${textoCierre(b)}.${nota} En verano, festivos y época de exámenes puede cambiar.`],
  ];
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: q.map(([p, r]) => ({ "@type": "Question", name: p, acceptedAnswer: { "@type": "Answer", text: r } })) };
  return { html: `<section class="faq"><h2>Preguntas frecuentes</h2>${q.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join("")}</section>`, ld };
}
function tablaHorario(b) {
  const filas = DIAS.map((d, k) => `<tr><th scope="row">${cap(DIAS_LARGOS[k])}</th><td>${franjas(b.h.inv[d]) || (sinConfirmar(b, d) ? "Sin confirmar" : "Cerrada")}</td></tr>`).join("");
  return `<table class="horario"><caption>Horario de invierno</caption><tbody>${filas}</tbody></table>
<p class="fuente">Verificado el ${esc(fechaEs(b.h.fv))} en la <a href="${esc(b.h.f)}" rel="nofollow noopener" target="_blank">fuente oficial</a>. En verano, festivos y época de exámenes puede cambiar: confírmalo antes de ir.</p>${b.h.nota ? `<p class="nota">⚠️ ${esc(b.h.nota)}</p>` : ""}`;
}
// Dos bibliotecas con el mismo nombre en la misma localidad (p. ej. dos sedes): la segunda cambia el orden del título.
function tituloBiblioteca(b) {
  const t = [`${b.n} (${b.c}): horario, dirección y teléfono | Bibliomapa`, `${b.n} en ${b.c}: dirección, teléfono y horario | Bibliomapa`]
    .find((x) => !titulosUsados.has(x)) || `${b.n} (${b.c}, ${b.dir}) | Bibliomapa`;
  titulosUsados.add(t);
  return t;
}
function paginaBiblioteca(b) {
  const ruta = paginaDe.get(b.i), ps = slug(b.p), ok = verificado(b);
  const mismaLoc = porProv[b.p].filter((o) => o.c === b.c);
  const locConPagina = mismaLoc.length >= 3 && slug(b.c) && slug(b.c) !== ps;
  const cercanas = mismaLoc.filter((o) => o.i !== b.i).map((o) => ({ o, d: distKm(b, o) })).sort((x, y) => x.d - y.d).slice(0, 6);
  const tipo = TIPO[b.t] || "Biblioteca";
  const fq = ok ? faqBiblioteca(b) : null;
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
  const migas = [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [b.p, `/bibliotecas/${ps}/`]]
    .concat(locConPagina ? [[b.c, `/bibliotecas/${ps}/${slug(b.c)}/`]] : []).concat([[b.n, ruta]]);
  const resumen = !ok ? "Horario sin confirmar." : DIAS.some((d) => sinConfirmar(b, d)) ? `Horario verificado el ${fechaEs(b.h.fv)}.` : `Horario verificado: ${horarioTexto(b.h.inv)}.`;
  const titulo = tituloBiblioteca(b);
  // Dos sedes con el mismo nombre en la misma ciudad (p. ej. «Biblioteca Universidad de Murcia») daban la misma
  // descripción: la segunda lleva la dirección.
  let descripcion = `${b.n}, ${tipo.toLowerCase()} en ${b.c} (${b.p}). ${resumen} Dirección, teléfono, web y bibliotecas cercanas.`;
  if (descUsadas.has(descripcion)) descripcion = `${b.n}, ${tipo.toLowerCase()} en ${b.dir || b.c} (${b.p}). ${resumen} Teléfono, web y bibliotecas cercanas.`;
  descUsadas.add(descripcion);
  const idBib = DOMINIO + ruta + "#biblioteca";
  escribe(ruta, pagina({
    ruta, titulo, descripcion,
    h1: esc(b.n),
    intro: `<span class="tipo">${esc(tipo)}</span> en ${esc(b.c)} (${esc(b.p)}). ${ok ? `Horario comprobado en su web oficial el ${esc(fechaEs(b.h.fv))}.` : "Aún no tenemos su horario verificado."}`,
    cta: `<a class="cta" href="${enlaceApp(b)}">📍 Ver en el mapa</a>`,
    cuerpo: `<section class="ficha" aria-labelledby="t-datos"><h2 id="t-datos">Datos de contacto</h2><dl>${datos}</dl></section>
<section class="ficha" aria-labelledby="t-hor"><h2 id="t-hor">Horario</h2>${horario}</section>
${fq ? fq.html : ""}
${cercanas.length ? `<section class="cerca" aria-labelledby="t-cerca"><h2 id="t-cerca">Otras bibliotecas en ${esc(b.c)}</h2><ul>${lisCerca}</ul></section>` : ""}
${seccionTemasFicha(b, locConPagina)}
<p class="volver"><a href="${locConPagina ? `/bibliotecas/${ps}/${slug(b.c)}/` : `/bibliotecas/${ps}/`}">← Todas las bibliotecas de ${esc(locConPagina ? b.c : b.p)}</a>${locConPagina ? ` · <a href="/bibliotecas/${ps}/">${esc(b.p)}</a>` : ""}</p>`,
    migas,
    // Library no admite dateModified: va en el WebPage que la describe (fecha = verificación del horario).
    ld: [{ "@context": "https://schema.org", "@id": idBib, ...libraryLD(b, DOMINIO + ruta) },
      { "@context": "https://schema.org", "@type": "WebPage", name: titulo.replace(MARCA, ""), description: descripcion, url: DOMINIO + ruta,
        inLanguage: "es-ES", about: { "@id": idBib }, ...(ok ? { dateModified: b.h.fv } : {}) }, ...(fq ? [fq.ld] : [])],
  }));
  urls.push([ruta, "0.7", ok ? b.h.fv : undefined]);
}

// ---------- Títulos y descripciones de provincia y localidad ----------
// Empiezan por «Bibliotecas abiertas en <lugar>» con el recuento real (total y con horario verificado). La redacción
// varía de forma determinista (según haya horario verificado, domingo, cierre tardío… y un hash de la ruta) para que
// no sea la misma plantilla en todas; nunca se repite un título (si chocara, se prueba la siguiente variante).
// Límites: título ≤ 65 caracteres (con « | Bibliomapa» solo si cabe) y descripción ≤ 160.
const MAX_TIT = 65, MAX_DESC = 160, MARCA = " | Bibliomapa";
const titulosUsados = new Set();
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
// Página propia (CollectionPage) con el mismo nombre y descripción que el título y la meta description.
const ldLugar = (ruta, nombre, descripcion, extra) => ({ "@context": "https://schema.org", "@type": "CollectionPage", name: nombre,
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

provincias.forEach((p) => {
  const lista = porProv[p], ps = slug(p);
  const porLoc = {};
  lista.forEach((b) => (porLoc[b.c] = porLoc[b.c] || []).push(b));
  const locs = Object.keys(porLoc).sort((a, b) => porLoc[b].length - porLoc[a].length || a.localeCompare(b, "es"));
  const conPagina = locs.filter((c) => tieneLocPagina(p, c, porLoc[c].length));
  // páginas de localidad
  conPagina.forEach((c) => {
    const l = porLoc[c].slice().sort(ordenBib), ruta = `/bibliotecas/${ps}/${slug(c)}/`;
    const f = faq(c, l), k = cuentas(l);
    const tl = tituloLugar(ruta, nombresRepetidos.has(slug(c)) ? `${c} (${p})` : c, k);
    const dl = descripcionLugar(ruta, c, p, k, 0);
    escribe(ruta, pagina({
      ruta, titulo: tl.titulo, descripcion: dl,
      h1: `Bibliotecas en ${esc(c)}`, intro: `${l.length} bibliotecas y salas de estudio en ${esc(c)} (${esc(p)})${k.v ? `, ${k.v} con horario verificado` : ""}. En el mapa de Bibliomapa ves en tiempo real cuáles están abiertas y cuál te pilla más cerca.`,
      cuerpo: `${navPorHorario(p, c)}${navSalas(salasDeLoc.has(p + "|" + c) ? [salasDeLoc.get(p + "|" + c)] : [])}${navExamenes(exDeLoc(p, c))}${navUniversidades((b) => b.p === p && b.c === c)}${tablaHorariosLugar(c, l)}<section class="lista">${l.map((b) => tarjeta(b)).join("")}</section>${f.html}${seccionLocalidadesCercanas(p, c)}<p class="volver"><a href="/bibliotecas/${ps}/">← Todas las bibliotecas de ${esc(p)}</a></p>`,
      migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [p, `/bibliotecas/${ps}/`], [c, ruta]], head: k.v ? ESTILO_TABLA_HOR : "",
      ld: [ldLugar(ruta, tl.nombre, dl, { ...modVerif(l), mainEntity: { "@type": "ItemList", name: `Bibliotecas en ${c}`, numberOfItems: l.length, itemListElement: l.map((b, k) => ({ "@type": "ListItem", position: k + 1, item: libraryLD(b, DOMINIO + enlaceApp(b)) })) } }), f.ld],
    }));
    urls.push([ruta, "0.8", modVerif(l).dateModified]);
    // páginas temáticas de la localidad (2 o más que cumplen; ver temaLoc)
    TEMAS_LOC.forEach((t) => {
      const lt = temaLoc[t.slug][p + "|" + c];
      if (!lt) return;
      const lo = lt.slice().sort(ordenBib), rutaT = `${ruta}${t.slug}/`;
      const titulo = `Bibliotecas ${t.que} en ${c}`, ft = faqTema(t, lo, c), enProv = temaProv[t.slug][p];
      escribe(rutaT, pagina({
        ruta: rutaT, titulo: `${titulo}: horarios verificados | Bibliomapa`,
        descripcion: `${lo.length} bibliotecas ${t.que} en ${c} (${p}) con horario comprobado en su web oficial: ${t.corto.toLowerCase()}, dirección, teléfono y cómo llegar. Mira en el mapa cuál está abierta ahora.`,
        h1: esc(titulo), intro: introTema(t, lo, `${c} (${p})`),
        cuerpo: `${navTemas(t.slug, p, c)}${t.antes ? t.antes(lo) : ""}<section class="lista">${lo.map((b) => tarjeta(b, t.destacado(b), t)).join("")}</section>${ft.html}<p class="volver"><a href="${ruta}">← Todas las bibliotecas de ${esc(c)}</a> · <a href="/bibliotecas/${enProv ? `${ps}/${t.slug}` : t.slug}/">${esc(t.corto)} en ${esc(enProv ? p : "toda España")}</a></p>${t.hoy ? SCRIPT_HOY : ""}`, head: t.hoy ? ESTILO_HOY : "",
        migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [p, `/bibliotecas/${ps}/`], [c, ruta], [t.corto, rutaT]],
        ld: [ldTema(rutaT, titulo, lo), ft.ld],
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
      ruta: rutaT, titulo: `${titulo}: horarios verificados | Bibliomapa`,
      descripcion: `${l.length} bibliotecas ${t.que} en ${p} con horario comprobado en su web oficial: ${t.corto.toLowerCase()}, dirección, teléfono y cómo llegar. Mira en el mapa cuál está abierta ahora.`,
      h1: esc(titulo), intro: introTema(t, l, p),
      cuerpo: `${navTemas(t.slug, p)}${locsT.length ? `<nav class="locs" aria-label="Por localidad">${locsT.map((c) => `<a href="/bibliotecas/${ps}/${slug(c)}/${t.slug}/">${esc(c)} <small>${temaLoc[t.slug][p + "|" + c].length}</small></a>`).join("")}</nav>` : ""}${t.antes ? t.antes(l) : ""}<section class="lista">${l.map((b) => tarjeta(b, t.destacado(b), t)).join("")}</section>${ft.html}<p class="volver"><a href="/bibliotecas/${ps}/">← Todas las bibliotecas de ${esc(p)}</a> · <a href="/bibliotecas/${t.slug}/">${esc(t.corto)} en toda España</a></p>${t.hoy ? SCRIPT_HOY : ""}`, head: t.hoy ? ESTILO_HOY : "",
      migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [p, `/bibliotecas/${ps}/`], [t.corto, rutaT]],
      ld: [ldTema(rutaT, titulo, l), ft.ld],
    }));
    urls.push([rutaT, "0.7", fechaMod(l)]);
  });
  // página de provincia
  const ruta = `/bibliotecas/${ps}/`, f = faq(p, lista);
  const enlTemas = navPorHorario(p);
  const secciones = locs.map((c) => {
    const l = porLoc[c].slice().sort(ordenBib);
    const titulo = conPagina.includes(c) ? `<a href="/bibliotecas/${ps}/${slug(c)}/">${esc(c)}</a>` : esc(c);
    return `<section class="loc"><h2>${titulo} <small>${l.length}</small></h2>${(conPagina.includes(c) ? l.slice(0, 4) : l).map((b) => tarjeta(b)).join("")}${conPagina.includes(c) && l.length > 4 ? `<p class="mas"><a href="/bibliotecas/${ps}/${slug(c)}/">Ver las ${l.length} bibliotecas de ${esc(c)} →</a></p>` : ""}</section>`;
  }).join("");
  const k = cuentas(lista), tp = tituloLugar(ruta, p, k), dp = descripcionLugar(ruta, p, "", k, locs.length);
  escribe(ruta, pagina({
    ruta, titulo: tp.titulo, descripcion: dp,
    h1: `Bibliotecas en ${esc(p)}`, intro: `${lista.length} bibliotecas en ${locs.length} ${locs.length === 1 ? "localidad" : "localidades"} de ${esc(p)}${k.v ? `, ${k.v} con horario verificado` : ""}. Elige tu localidad o abre el mapa para ver cuáles están abiertas ahora mismo.`,
    cuerpo: `${enlTemas}${navSalas(salasDeProv[p])}${navExamenes(exDeProv(p))}${navUniversidades((b) => b.p === p)}<nav class="locs">${conPagina.map((c) => `<a href="/bibliotecas/${ps}/${slug(c)}/">${esc(c)} <small>${porLoc[c].length}</small></a>`).join("")}</nav>${tablaHorariosLugar(p, lista)}${secciones}${f.html}${seccionProvinciasCercanas(p)}<p class="volver"><a href="/bibliotecas/">← Todas las provincias</a></p>`,
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [p, ruta]], head: k.v ? ESTILO_TABLA_HOR : "",
    ld: [ldLugar(ruta, tp.nombre, dp, modVerif(lista)), f.ld],
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
    ruta: rutaT, titulo: `${titulo}: horarios verificados por provincia | Bibliomapa`,
    descripcion: `${l.length} bibliotecas ${t.que} en ${provs.length} provincias de España, con el horario comprobado en su web oficial. Dirección, teléfono y mapa con las abiertas ahora.`,
    h1: esc(titulo), intro: introTema(t, l, "España"),
    cuerpo: `${navTemas(t.slug)}<nav class="locs" aria-label="Provincias">${provs.map((p) => `<a href="#${slug(p)}">${esc(p)} <small>${porP[p].length}</small></a>`).join("")}</nav>${t.antes ? t.antes(l) : ""}${secciones}${ft.html}<p class="volver"><a href="/bibliotecas/">← Todas las provincias</a></p>${t.hoy ? SCRIPT_HOY : ""}`, head: t.hoy ? ESTILO_HOY : "",
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [t.corto, rutaT]],
    ld: [ldTema(rutaT, titulo, ordenados), ft.ld],
  }));
  urls.push([rutaT, "0.8", fechaMod(ordenados)]);
});

// páginas de cada biblioteca más buscada
conPaginaPropia.forEach(paginaBiblioteca);

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
  const migas = [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], [p, `/bibliotecas/${ps}/`]]
    .concat(s.conLoc ? [[ciudad, rutaCiudad]] : []).concat([["Salas de estudio", ruta]]);
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
    migas,
    ld: [ldLugar(ruta, titulo.replace(MARCA, ""), descripcion, { ...(ver.length ? { dateModified: fechaMod(ver) } : {}), mainEntity: { "@type": "ItemList", name: `Bibliotecas para estudiar en ${ciudad}`, numberOfItems: est.length,
      itemListElement: uni.concat(pub).map((b, k) => ({ "@type": "ListItem", position: k + 1, item: libraryLD(b, DOMINIO + (paginaDe.get(b.i) || enlaceApp(b))) })) } }), fq.ld],
  }));
  urls.push([ruta, "0.8", fechaMod(ver)]);
});
if (salas.length) {
  const ruta = `/bibliotecas/${SALAS_SLUG}/`;
  const orden = salas.slice().sort((a, b) => b.est.length - a.est.length || a.ciudad.localeCompare(b.ciudad, "es"));
  const totU = salas.reduce((t, s) => t + s.est.filter((b) => b.t === "universidad").length, 0), totE = salas.reduce((t, s) => t + s.est.length, 0);
  const totV = salas.reduce((t, s) => t + s.ver.length, 0);
  const tBase = `Salas de estudio en España: ${totE} bibliotecas en ${salas.length} ciudades`;
  const titulo = (tBase + MARCA).length <= MAX_TIT ? tBase + MARCA : tBase;
  titulosUsados.add(titulo);
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
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], ["Salas de estudio", ruta]],
    ld: ldLugar(ruta, titulo.replace(MARCA, ""), descripcion, { dateModified: fechaMod(todasVer),
      hasPart: orden.map((s) => ({ "@type": "CollectionPage", name: `Salas de estudio en ${s.ciudad}`, url: DOMINIO + s.ruta })) }),
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
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], ["Universidades", `/bibliotecas/${UNIS_SLUG}/`], [u.sigla, ruta]],
    ld: [ldLugar(ruta, titulo.replace(MARCA, ""), descripcion, { dateModified: fechaMod(ver),
      about: { "@type": "CollegeOrUniversity", name: u.nombre, alternateName: u.sigla },
      mainEntity: { "@type": "ItemList", name: `Bibliotecas de la ${u.nombre}`, numberOfItems: lista.length,
        itemListElement: claves.flatMap((k) => porC[k].slice().sort(ordenBib)).map((b, k) => ({ "@type": "ListItem", position: k + 1, item: libraryLD(b, DOMINIO + (paginaDe.get(b.i) || enlaceApp(b))) })) } }), fq.ld],
  }));
  urls.push([ruta, "0.8", fechaMod(ver)]);
});
if (universidades.length) {
  const ruta = `/bibliotecas/${UNIS_SLUG}/`;
  const totB = universidades.reduce((t, u) => t + u.lista.length, 0), totV = universidades.reduce((t, u) => t + u.ver.length, 0);
  const tBase = `Bibliotecas universitarias: ${universidades.length} universidades, horarios`;
  const titulo = [tBase + MARCA, tBase, `Bibliotecas de ${universidades.length} universidades de España`].find((x) => x.length <= MAX_TIT && !titulosUsados.has(x));
  titulosUsados.add(titulo);
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
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], ["Universidades", ruta]],
    ld: ldLugar(ruta, titulo.replace(MARCA, ""), descripcion, { dateModified: fechaMod(todasVer),
      hasPart: universidades.map((u) => ({ "@type": "CollectionPage", name: `Bibliotecas de la ${u.nombre}`, url: DOMINIO + u.ruta })) }),
  }));
  urls.push([ruta, "0.8", fechaMod(todasVer)]);
}

// ---------- Páginas «Bibliotecas en exámenes» (índice y una por ciudad; datos en exCiudades, más arriba) ----------
// Todo sale de la entrada de temporada-examenes.js: periodo, horario y nota tal cual, con su fuente oficial y la fecha en que
// se comprobó. Si la biblioteca está en el mapa, su ficha, «Ver en el mapa» y su horario habitual solo si está verificado.
// FAQ solo con esos datos. dateModified y lastmod = la comprobación (fv) más reciente.
const periodoEx = (e) => `del ${fechaEs(e.desde)} al ${fechaEs(e.hasta)}`;
const fechasFv = (l) => { const f = [...new Set(l.map((x) => x.e.fv))].sort(); return f.length === 1 ? `el ${fechaEs(f[0])}` : `entre el ${fechaEs(f[0])} y el ${fechaEs(f[f.length - 1])}`; };
const fuentesEx = (l) => enumera([...new Set(l.map((x) => hostDe(x.e.f).replace(/^www\./, "")))]);
const faqDe = (q) => ({ html: `<section class="faq"><h2>Preguntas frecuentes</h2>${q.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join("")}</section>`,
  ld: { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: q.map(([p, r]) => ({ "@type": "Question", name: p, acceptedAnswer: { "@type": "Answer", text: r } })) } });
const conPunto = (s) => (/[.!?]$/.test(s) ? s : s + ".");
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
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], ["Exámenes", EX_RUTA], [ciudad, ruta]],
    ld: [ldLugar(ruta, titulo.replace(MARCA, ""), descripcion, { dateModified: g.fv,
      mainEntity: { "@type": "ItemList", name: `Bibliotecas con horario de exámenes en ${ciudad}`, numberOfItems: entradas.length,
        itemListElement: entradas.map((x, k) => ({ "@type": "ListItem", position: k + 1, item: x.b ? libraryLD(x.b, DOMINIO + (paginaDe.get(x.b.i) || enlaceApp(x.b)))
          : { "@type": "Library", name: x.e.espacio, address: { "@type": "PostalAddress", addressLocality: ciudad, addressRegion: p, addressCountry: "ES" } } })) } }), fq.ld],
  }));
  urls.push([ruta, "0.8", g.fv]);
});
if (exCiudades.length) {
  const ruta = EX_RUTA, todasEx = exCiudades.flatMap((g) => g.entradas), curso = cursosTexto(todasEx), fv = todasEx.map((x) => x.e.fv).sort().pop();
  const h24 = todasEx.filter((x) => x.h24), nC = exCiudades.length;
  const tBase = `${h24.length ? "Bibliotecas 24 horas y horario ampliado" : "Bibliotecas con horario ampliado"} en exámenes ${curso}`;
  const titulo = [tBase + MARCA, tBase].find((x) => x.length <= MAX_TIT && !titulosUsados.has(x)) || tBase;
  titulosUsados.add(titulo);
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
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], ["Exámenes", ruta]], head: ESTILO_TABLA_HOR,
    ld: [ldLugar(ruta, titulo.replace(MARCA, ""), descripcion, { dateModified: fv,
      hasPart: exCiudades.map((g) => ({ "@type": "CollectionPage", name: `Bibliotecas en exámenes en ${g.ciudad}`, url: DOMINIO + g.ruta })) }), fq.ld],
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
  const hasPart = temasEspana.map(({ t }) => ({ "@type": "CollectionPage", name: `Bibliotecas ${t.que} en España`, url: `${DOMINIO}/bibliotecas/${t.slug}/` }))
    .concat(provsHub.flatMap((p) => TEMAS.filter((t) => temaProv[t.slug][p]).map((t) => ({ "@type": "CollectionPage", name: `Bibliotecas ${t.que} en ${p}`, url: `${DOMINIO}/bibliotecas/${slug(p)}/${t.slug}/` }))));
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
    migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"], ["Por horario", ruta]],
    ld: [ldLugar(ruta, titulo.replace(MARCA, ""), descripcion, { dateModified: fechaMod(verifTodas), hasPart }), fq.ld],
  }));
  urls.push([ruta, "0.9", fechaMod(verifTodas)]);
}

// índice
escribe("/bibliotecas/", pagina({
  ruta: "/bibliotecas/", titulo: "Bibliotecas de España por provincia: abiertas ahora y horarios | Bibliomapa",
  descripcion: `Más de ${Math.floor(todas.length / 100) * 100} bibliotecas de toda España por provincia y localidad: horarios verificados, salas de estudio y cuáles están abiertas ahora.`,
  h1: "Bibliotecas de España por provincia", intro: `${todas.length} bibliotecas en ${provincias.length} provincias. Encuentra la tuya y mira en el mapa cuál está abierta ahora.`,
  cuerpo: `${temasEspana.length ? `<nav class="temas" aria-label="Por horario"><span>Por horario:</span>${temasEspana.map(({ t, l }) => `<a href="/bibliotecas/${t.slug}/">${esc(t.corto)} <small>${l.length}</small></a>`).join("")}<a href="${HUB}">Por provincia</a></nav>` : ""}${salas.length || exCiudades.length ? `<nav class="temas" aria-label="Para estudiar"><span>Para estudiar:</span>${salas.length ? `<a href="/bibliotecas/${SALAS_SLUG}/">Salas de estudio <small>${salas.length} ciudades</small></a>` : ""}${exCiudades.length ? `<a href="${EX_RUTA}">Exámenes: 24 h y horario ampliado <small>${plural(exCiudades.length, "ciudad", "ciudades")}</small></a>` : ""}</nav>` : ""}${universidades.length ? `<nav class="temas" aria-label="Por universidad"><span>Por universidad:</span><a href="/bibliotecas/${UNIS_SLUG}/">Todas <small>${universidades.length}</small></a>${universidades.map((u) => `<a href="${u.ruta}" title="Bibliotecas de la ${esc(u.nombre)}">${esc(u.sigla)} <small>${u.lista.length}</small></a>`).join("")}</nav>` : ""}<nav class="locs grande">${provincias.map((p) => `<a href="/bibliotecas/${slug(p)}/">${esc(p)} <small>${porProv[p].length}</small></a>`).join("")}</nav>`,
  migas: [["Bibliomapa", "/"], ["Bibliotecas", "/bibliotecas/"]],
}));

fs.writeFileSync(path.join(RAIZ, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, pr, mod]) => `  <url><loc>${DOMINIO}${u}</loc><lastmod>${mod || HOY}</lastmod><priority>${pr}</priority></url>`).join("\n")}
</urlset>
`);
fs.writeFileSync(path.join(RAIZ, "robots.txt"), `User-agent: *
Allow: /

Sitemap: ${DOMINIO}/sitemap.xml
`);
console.log(`Vecinas: ${locsConPagina.filter((x) => !localidadesCercanas(x.p, x.c).length).length} de ${locsConPagina.length} localidades sin «Localidades cercanas» (ninguna con página a menos de 150 km)`);
console.log(`Páginas: ${urls.length - 1} (+ portada) · provincias: ${provincias.length} · bibliotecas: ${todas.length} · con página propia: ${paginaDe.size} (${conPaginaPropia.filter(verificado).length} con horario verificado)`);
console.log(`Universidades: ${universidades.length} con página (${universidades.map((u) => `${u.sigla} ${u.lista.length}/${u.ver.length}`).join(", ")}) · sin página: ${UNIVERSIDADES.filter((u) => !u.ruta).map((u) => `${u.sigla} ${u.lista.length}/${u.lista.filter(verificado).length}`).join(", ")} · dudosas (casan con 2): ${uniDudosas.length}`);
console.log(`Exámenes: ${exCiudades.length} ciudades con página (${exCiudades.map((g) => `${g.ciudad} ${g.entradas.length}`).join(", ")}) de ${EXAMENES.length} entradas vigentes`);
console.log(`Navarra: ${nNavarraConHorario} de ${navarra.length} con horario publicable (fuenteHorario + verificadoHorario en app.js)`);
