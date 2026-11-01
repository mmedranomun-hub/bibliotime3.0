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
     - JSON-LD que no se puede leer, y horarios especiales (specialOpeningHoursSpecification: verano y exámenes de las
       fichas) mal formados o con tramos por fecha que se solapan.
   Uso (desde la raíz del proyecto):  node scripts/comprobar_paginas_seo.js
   Sale con código 1 si hay enlaces rotos, títulos o descripciones repetidos, JSON-LD roto, horarios especiales mal o
   lastmod mal, o una provincia o localidad con fichas sin ItemList. */
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
let nEnlaces = 0;
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
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j = null;
    try { j = JSON.parse(m[1]); } catch (e) { ldMal.push(ruta); }
    if (j) [].concat(j).forEach((x) => {
      compruebaEspeciales(ruta, x);
      if (x && x["@type"] === "Library" && x["@id"]) fichaDe.set(claveLib(x), x["@id"]);
      const lista = x && (x["@type"] === "ItemList" ? x : x.mainEntity && x.mainEntity["@type"] === "ItemList" ? x.mainEntity : null);
      if (x && x["@type"] === "CollectionPage" && lugares.has(ruta) && x.mainEntity && x.mainEntity["@type"] === "ItemList" && (x.mainEntity.itemListElement || []).length) lugares.get(ruta).lista = true;
      if (lista) (lista.itemListElement || []).forEach((el) => el && el.item && el.item["@type"] === "Library" && itemsLista.push([ruta, el.item]));
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
const huerfanas = [...html.keys()].filter((r) => r !== "/bibliotecas/" && !entrantes.has(r));
const dupT = [...titulos].filter(([, l]) => l.length > 1), dupD = [...descs].filter(([, l]) => l.length > 1);
const sitemap = fs.existsSync(path.join(RAIZ, "sitemap.xml")) ? fs.readFileSync(path.join(RAIZ, "sitemap.xml"), "utf8") : "";
const enSitemap = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].slice(DOMINIO.length)));
const sitemapRoto = [...enSitemap].filter((r) => r !== "/" && !existe(r));
const faltanSitemap = [...html.keys()].filter((r) => !enSitemap.has(r));
const HOY = new Date().toISOString().slice(0, 10), lastmodMal = [], lastmodN = new Map();
for (const m of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const loc = ((m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1] || "").slice(DOMINIO.length), lm = (m[1].match(/<lastmod>([^<]*)<\/lastmod>/) || [])[1];
  if (!lm || !/^\d{4}-\d\d-\d\d$/.test(lm)) { lastmodMal.push(`${loc} sin lastmod válido (${lm || "falta"})`); continue; }
  lastmodN.set(lm, (lastmodN.get(lm) || 0) + 1);
  if (lm > HOY) lastmodMal.push(`${loc} lastmod ${lm} posterior a hoy`);
  if (modPagina.has(loc) && lm < modPagina.get(loc)) lastmodMal.push(`${loc} lastmod ${lm} anterior a su dateModified ${modPagina.get(loc)}`);
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
console.log(`Huérfanas (sin enlace desde otra página generada): ${huerfanas.length}${huerfanas.length ? "\n" + muestra(huerfanas, (r) => "  " + r) : ""}`);
console.log(`Sitemap: ${enSitemap.size} URL · no existen: ${sitemapRoto.length} · faltan en el sitemap: ${faltanSitemap.length}` +
  (sitemapRoto.length + faltanSitemap.length ? "\n" + muestra(sitemapRoto.concat(faltanSitemap), (r) => "  " + r) : ""));
console.log(`Lastmod: ${[...lastmodN].sort().map(([d, n]) => `${d} ×${n}`).join(", ")} · mal (falta, formato, futuro o < dateModified): ${lastmodMal.length}` +
  (lastmodMal.length ? "\n" + muestra(lastmodMal, (r) => "  " + r) : ""));
if (lastmodMal.length || rotos.length || dupT.length || dupD.length || largos.length || ldMal.length || bibConFicha.length || idMal.length || sinLista.length || horEspMal.length || sitemapRoto.length || faltanSitemap.length) process.exit(1);
