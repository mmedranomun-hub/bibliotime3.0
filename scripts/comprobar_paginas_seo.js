#!/usr/bin/env node
/* Comprueba las páginas generadas por scripts/generar_paginas_seo.js (bibliotecas/…):
     - enlaces internos rotos (href="/…" que no llevan a un archivo o a una carpeta con index.html; también los #ancla
       de la misma página o de otra página generada),
     - títulos y meta descriptions repetidos,
     - páginas sin enlace entrante desde otra página (huérfanas) y URL del sitemap que no existen o que faltan en él,
     - JSON-LD que no se puede leer, y horarios especiales (specialOpeningHoursSpecification: verano y exámenes de las
       fichas) mal formados o con tramos por fecha que se solapan.
   Uso (desde la raíz del proyecto):  node scripts/comprobar_paginas_seo.js
   Sale con código 1 si hay enlaces rotos, títulos o descripciones repetidos, JSON-LD roto o horarios especiales mal. */
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

const rotos = [], entrantes = new Map(), titulos = new Map(), descs = new Map(), ldMal = [], horEspMal = [];
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
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j = null;
    try { j = JSON.parse(m[1]); } catch (e) { ldMal.push(ruta); }
    if (j) [].concat(j).forEach((x) => compruebaEspeciales(ruta, x));
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
const huerfanas = [...html.keys()].filter((r) => r !== "/bibliotecas/" && !entrantes.has(r));
const dupT = [...titulos].filter(([, l]) => l.length > 1), dupD = [...descs].filter(([, l]) => l.length > 1);
const sitemap = fs.existsSync(path.join(RAIZ, "sitemap.xml")) ? fs.readFileSync(path.join(RAIZ, "sitemap.xml"), "utf8") : "";
const enSitemap = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].slice(DOMINIO.length)));
const sitemapRoto = [...enSitemap].filter((r) => r !== "/" && !existe(r));
const faltanSitemap = [...html.keys()].filter((r) => !enSitemap.has(r));

const muestra = (l, f) => l.slice(0, 15).map(f).join("\n") + (l.length > 15 ? `\n  … y ${l.length - 15} más` : "");
console.log(`Páginas: ${html.size} · enlaces internos: ${nEnlaces}`);
console.log(`Enlaces rotos: ${rotos.length}${rotos.length ? "\n" + muestra(rotos, ([r, u]) => `  ${r} → ${u}`) : ""}`);
console.log(`Títulos repetidos: ${dupT.length}${dupT.length ? "\n" + muestra(dupT, ([t, l]) => `  «${t}»: ${l.join(", ")}`) : ""}`);
console.log(`Descripciones repetidas: ${dupD.length}${dupD.length ? "\n" + muestra(dupD, ([t, l]) => `  «${t.slice(0, 70)}…»: ${l.join(", ")}`) : ""}`);
console.log(`JSON-LD ilegible: ${ldMal.length}${ldMal.length ? " (" + ldMal.slice(0, 10).join(", ") + ")" : ""}`);
console.log(`Horarios especiales (verano y exámenes): ${nHorEsp} tramos en ${nPagHorEsp} fichas · mal formados o solapados: ${horEspMal.length}${horEspMal.length ? "\n" + muestra(horEspMal, (r) => "  " + r) : ""}`);
console.log(`Huérfanas (sin enlace desde otra página generada): ${huerfanas.length}${huerfanas.length ? "\n" + muestra(huerfanas, (r) => "  " + r) : ""}`);
console.log(`Sitemap: ${enSitemap.size} URL · no existen: ${sitemapRoto.length} · faltan en el sitemap: ${faltanSitemap.length}` +
  (sitemapRoto.length + faltanSitemap.length ? "\n" + muestra(sitemapRoto.concat(faltanSitemap), (r) => "  " + r) : ""));
if (rotos.length || dupT.length || dupD.length || ldMal.length || horEspMal.length || sitemapRoto.length || faltanSitemap.length) process.exit(1);
