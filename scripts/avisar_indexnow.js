/* Avisa a IndexNow (api.indexnow.org: lo comparten Bing, Yandex, Seznam, Naver…) de las URL de bibliomapa.es que
   cambiaron de verdad: las del sitemap.xml cuyo <lastmod> es de hoy (día de España), o de la fecha que se pida.
   El generador (scripts/generar_paginas_seo.js) solo pone la fecha de hoy en el lastmod de una página cuando su
   contenido cambia, así que «lastmod = hoy» es exactamente «lo que hay que volver a rastrear».

   La clave sale de `const INDEXNOW_CLAVE = …;` en scripts/generar_paginas_seo.js, y /<clave>.txt tiene que estar
   PUBLICADO en https://bibliomapa.es/<clave>.txt antes de avisar (si no, IndexNow rechaza el aviso con 403).

   Uso (desde la raíz del proyecto, DESPUÉS de desplegar):
     node scripts/avisar_indexnow.js                         avisa de las URL con lastmod de hoy
     node scripts/avisar_indexnow.js --fecha 2026-11-12      avisa de las URL con lastmod de ese día
     node scripts/avisar_indexnow.js --simular [--fecha …]   solo imprime lo que enviaría (sin red)
   Con INDEXNOW_CLAVE = null siempre simula (no hay clave que enviar). Máximo 10000 URL por aviso (límite de IndexNow).
   Sale con código 1 si la fecha o la clave están mal, falta el .txt local o IndexNow responde con error. */
"use strict";
const fs = require("fs");
const path = require("path");
const RAIZ = path.resolve(__dirname, "..");
const HOST = "bibliomapa.es";
const DOMINIO = "https://" + HOST;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URL = 10000;

const args = process.argv.slice(2);
const simularPedido = args.includes("--simular");
const iFecha = args.indexOf("--fecha");
const HOY = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" }); // como el generador
const fecha = iFecha >= 0 ? args[iFecha + 1] : HOY;
const sal = (msg) => { console.error(msg); process.exit(1); };
if (!/^\d{4}-\d\d-\d\d$/.test(fecha || "") || isNaN(Date.parse(fecha + "T00:00:00Z"))) sal("--fecha debe ser AAAA-MM-DD (p. ej. --fecha 2026-11-12).");
if (fecha > HOY) sal(`--fecha ${fecha} es futura (hoy es ${HOY}).`);
const desconocidos = args.filter((a, i) => a !== "--simular" && a !== "--fecha" && (iFecha < 0 || i !== iFecha + 1));
if (desconocidos.length) sal(`Opción desconocida: ${desconocidos.join(" ")}. Uso: node scripts/avisar_indexnow.js [--simular] [--fecha AAAA-MM-DD]`);

// Clave: la misma constante que usa el generador (una sola fuente de verdad).
const src = fs.readFileSync(path.join(RAIZ, "scripts", "generar_paginas_seo.js"), "utf8");
const mk = src.match(/\nconst INDEXNOW_CLAVE = (null|"[^"\n]*"|'[^'\n]*');/);
if (!mk) sal("No encuentro `const INDEXNOW_CLAVE = null;` (o con una clave entre comillas) en scripts/generar_paginas_seo.js.");
const clave = mk[1] === "null" ? null : mk[1].slice(1, -1);
if (clave !== null) {
  if (!/^[A-Za-z0-9-]{8,128}$/.test(clave)) sal("INDEXNOW_CLAVE no es válida: 8 a 128 caracteres, solo letras, cifras y -.");
  const f = path.join(RAIZ, clave + ".txt");
  if (!fs.existsSync(f) || fs.readFileSync(f, "utf8").replace(/\r?\n$/, "") !== clave) sal(`Falta /${clave}.txt con la clave: ejecuta node scripts/generar_paginas_seo.js, súbelo y despliega antes de avisar.`);
}
const simular = simularPedido || clave === null;

// URL del sitemap con ese lastmod.
const sm = fs.readFileSync(path.join(RAIZ, "sitemap.xml"), "utf8");
const todas = [...sm.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>(\d{4}-\d\d-\d\d)<\/lastmod>/g)];
const urlList = [...new Set(todas.filter((m) => m[2] === fecha).map((m) => m[1].trim()))].filter((u) => u === DOMINIO || u.startsWith(DOMINIO + "/"));
console.log(`Sitemap: ${todas.length} URL · con lastmod ${fecha}: ${urlList.length}${urlList.length > MAX_URL ? ` (se envían las ${MAX_URL} primeras)` : ""}`);
if (!urlList.length) { console.log("Nada que avisar."); process.exit(0); }
const cuerpo = {
  host: HOST,
  key: clave || "<INDEXNOW_CLAVE>",
  keyLocation: `${DOMINIO}/${clave || "<INDEXNOW_CLAVE>"}.txt`,
  urlList: urlList.slice(0, MAX_URL),
};

if (simular) {
  console.log(clave === null
    ? "Simulación (INDEXNOW_CLAVE = null: no se envía nada). Esto es lo que se mandaría:"
    : "Simulación (--simular: no se envía nada). Esto es lo que se mandaría:");
  console.log(`POST ${ENDPOINT}`);
  console.log(JSON.stringify({ ...cuerpo, urlList: cuerpo.urlList.length > 20 ? [...cuerpo.urlList.slice(0, 20), `… y ${cuerpo.urlList.length - 20} más`] : cuerpo.urlList }, null, 2));
  process.exit(0);
}

(async () => {
  if (typeof fetch !== "function") sal("Hace falta Node 18 o más nuevo (fetch).");
  const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(cuerpo) });
  const txt = await r.text().catch(() => "");
  // 200 = recibido; 202 = recibido, la clave se validará después. 400/403/422/429 = error (formato, clave, URL ajenas, demasiados avisos).
  const motivo = { 400: "petición mal formada", 403: "clave no válida o /<clave>.txt no publicado", 422: "URL que no son de bibliomapa.es o clave que no coincide", 429: "demasiados avisos: espera y reinténtalo" }[r.status] || "";
  console.log(`IndexNow: HTTP ${r.status}${motivo ? ` (${motivo})` : ""} · ${cuerpo.urlList.length} URL${txt ? "\n" + txt.slice(0, 500) : ""}`);
  if (r.status !== 200 && r.status !== 202) process.exit(1);
})().catch((e) => sal(`No se pudo avisar a IndexNow: ${e.message}`));
