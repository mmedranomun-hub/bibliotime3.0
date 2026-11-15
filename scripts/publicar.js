// Publicación automática de Bibliomapa (la lanza cada mañana la rutina local «bibliomapa-publicar» de Marcos).
// Junta lo nuevo de repo3 (main + rama del bucle), lo prueba, lo publica en Vercel (cuenta de Marcos, equipo moscar),
// comprueba la web real y, si algo falla después de publicar, vuelve a la versión anterior. Luego sube main a GitHub y
// avisa a IndexNow de las URL de hoy. Nunca fuerza nada: ante un conflicto o una prueba en rojo, para y lo dice.
//
// Uso: node scripts/publicar.js [--simular]   (--simular: junta y prueba, pero no publica ni sube)
// Requisitos (solo en el PC de Marcos): sesión de Vercel en C:/Users/pc/.vercel-marcos (`npx vercel login -Q …`) y
// playwright-core en C:/Users/pc/bibliomapa-herramientas (pruebas con Edge).
const { execSync } = require("child_process");
const fs = require("fs"), path = require("path"), http = require("http");

const RAIZ = path.join(__dirname, "..");
const VERCEL = "npx --yes vercel -Q C:/Users/pc/.vercel-marcos";
const WEB = "https://bibliomapa.es";
const RAMAS = ["repo3/main", "repo3/claude/bucle-director"];
const SIMULAR = process.argv.includes("--simular");
const informe = [];
const apunta = (s) => { informe.push(s); console.log(s); };
const sh = (c, op = {}) => execSync(c, { cwd: RAIZ, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...op }).trim();
function termina(codigo, motivo) {
  apunta((codigo ? "PARADO: " : "OK: ") + motivo);
  try {
    // Fuera del repo: si el registro estuviera dentro, la siguiente vuelta vería cambios sin guardar y pararía.
    const dir = "C:/Users/pc/bibliomapa-herramientas";
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, "registro-publicaciones.md"), `\n## ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC\n` + informe.map((l) => "- " + l).join("\n") + "\n");
  } catch (e) {}
  process.exit(codigo);
}

function cargarEdge() {
  try { return require("C:/Users/pc/bibliomapa-herramientas/node_modules/playwright-core").chromium; }
  catch (e) { return null; }
}

// Sirve la carpeta del proyecto en local para probar el mapa antes de publicar.
function servidor() {
  const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".txt": "text/plain" };
  const s = http.createServer((q, r) => {
    let u = decodeURIComponent(q.url.split(/[?#]/)[0]); if (u.endsWith("/")) u += "index.html";
    const f = path.join(RAIZ, u);
    if (!f.startsWith(RAIZ)) { r.writeHead(403); return r.end(); }
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { "Content-Type": TIPOS[path.extname(f)] || "application/octet-stream" }); r.end(d); });
  });
  return new Promise((ok) => s.listen(0, "127.0.0.1", () => ok(s)));
}

// Abre la web con Edge y espera a que estén todas las chinchetas. bloquear: expresión de URL que se corta (simula un CDN caído).
async function probarMapa(nav, url, bloquear) {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const pg = await ctx.newPage(); const errores = [];
  pg.on("pageerror", (e) => errores.push(String(e).slice(0, 160)));
  if (bloquear) await pg.route("**/*", (r) => (bloquear.test(r.request().url()) ? r.abort() : r.continue()));
  let estado = 0, listo = false;
  try {
    const resp = await pg.goto(url, { timeout: 45000 }); estado = resp ? resp.status() : 0;
    await pg.waitForFunction(() => window.__marcadoresListos === true, null, { timeout: 45000 }); listo = true;
  } catch (e) {}
  const agrupa = await pg.evaluate(() => !!(window.L && L.MarkerClusterGroup && window.__capaBibs instanceof L.MarkerClusterGroup)).catch(() => false);
  await ctx.close();
  return { estado, listo, agrupa, errores };
}

(async () => {
  // 1. Juntar
  try { sh("git fetch repo3 --prune", { timeout: 120000 }); } catch (e) { termina(1, "git fetch falló: " + e.message.slice(0, 120)); }
  const sucio = sh("git status --porcelain --untracked-files=no");
  if (sucio) termina(1, "hay cambios sin guardar en " + RAIZ + " (no toco nada):\n" + sucio.slice(0, 300));
  const antes = sh("git rev-parse HEAD");
  for (const rama of RAMAS) {
    try { sh(`git merge --no-edit ${rama}`, { timeout: 120000 }); }
    catch (e) { try { sh("git merge --abort"); } catch (_) {} termina(1, `conflicto al juntar ${rama}: hace falta una persona`); }
  }
  const ahora = sh("git rev-parse HEAD");
  const publicado = sh("git rev-parse repo3/main");
  const nuevos = sh(`git rev-list --count ${publicado}..HEAD`);
  apunta(`Juntado: ${antes.slice(0, 8)} → ${ahora.slice(0, 8)} · ${nuevos} commits que aún no están en main`);
  if (nuevos === "0" && !process.argv.includes("--forzar")) termina(0, "nada nuevo que publicar");

  // 2. Probar antes de publicar
  for (const f of ["app.js", "app-extra.js", "sw.js", "analitica.js"]) {
    if (!fs.existsSync(path.join(RAIZ, f))) continue;
    try { new Function(fs.readFileSync(path.join(RAIZ, f), "utf8")); } catch (e) { termina(1, `${f} no compila: ${e.message}`); }
  }
  try { sh("node scripts/comprobar_paginas_seo.js", { timeout: 600000 }); apunta("Comprobador SEO: sin fallos"); }
  catch (e) { termina(1, "el comprobador SEO falla:\n" + String(e.stdout || "").split("\n").filter((l) => /mal: [1-9]|falt|roto/i.test(l)).slice(0, 6).join("\n")); }
  const chromium = cargarEdge();
  if (!chromium) termina(1, "falta playwright-core en C:/Users/pc/bibliomapa-herramientas (npm i playwright-core@1.48.2)");
  const nav = await chromium.launch({ channel: "msedge", headless: true });
  const srv = await servidor(); const local = `http://127.0.0.1:${srv.address().port}/`;
  const normal = await probarMapa(nav, local);
  const sinUnpkg = await probarMapa(nav, local, /unpkg\.com/);
  srv.close();
  apunta(`Mapa en local: normal ${normal.listo ? "ok" : "MAL"}${normal.agrupa ? " (agrupa)" : ""} · con unpkg caído ${sinUnpkg.listo ? "ok" : "MAL"} · errores ${normal.errores.length + sinUnpkg.errores.length}`);
  if (!normal.listo || !sinUnpkg.listo || normal.errores.length || sinUnpkg.errores.length) {
    await nav.close(); termina(1, "el mapa falla en local: " + JSON.stringify([normal.errores, sinUnpkg.errores]).slice(0, 300));
  }
  if (SIMULAR) { await nav.close(); termina(0, "simulación: todo en verde, no publico"); }

  // 3. Publicar y comprobar la web real; si falla, volver atrás
  let url;
  try {
    const out = sh(`${VERCEL} deploy --prod --yes`, { timeout: 900000 });
    url = (out.match(/https:\/\/[a-z0-9-]+-moscar\.vercel\.app/g) || []).pop();
  } catch (e) { await nav.close(); termina(1, "vercel deploy falló (¿sesión caducada? `npx vercel login -Q C:/Users/pc/.vercel-marcos`): " + String(e.stderr || e.message).slice(0, 200)); }
  apunta("Publicado: " + (url || "(sin URL en la salida)"));
  await new Promise((r) => setTimeout(r, 15000));
  const real = await probarMapa(nav, WEB + "/?v=" + Date.now());
  const ctx = await nav.newContext();
  const swWeb = ((await (await ctx.request.get(WEB + "/sw.js?v=" + Date.now())).text()).match(/CACHE_NAME = "([^"]+)"/) || [])[1];
  const swLocal = (fs.readFileSync(path.join(RAIZ, "sw.js"), "utf8").match(/CACHE_NAME = "([^"]+)"/) || [])[1];
  await nav.close();
  apunta(`Web real: ${real.estado} · mapa ${real.listo ? "ok" : "MAL"} · caché ${swWeb} (local ${swLocal}) · errores ${real.errores.length}`);
  if (real.estado !== 200 || !real.listo || real.errores.length || swWeb !== swLocal) {
    let vuelta = "";
    try { sh(`${VERCEL} rollback --yes`, { timeout: 300000 }); vuelta = "vuelta a la versión anterior hecha"; } catch (e) { vuelta = "NO se pudo volver atrás: " + String(e.stderr || e.message).slice(0, 120); }
    termina(1, "la web publicada falla → " + vuelta + " · " + JSON.stringify(real.errores).slice(0, 200));
  }

  // 4. GitHub (solo avance directo) e IndexNow
  try { sh("git push repo3 HEAD:main", { timeout: 180000 }); apunta("GitHub: main = lo publicado"); }
  catch (e) { apunta("GitHub: no se pudo subir main (" + String(e.stderr || e.message).split("\n")[0].slice(0, 120) + ")"); }
  try { const r = sh("node scripts/avisar_indexnow.js", { timeout: 120000 }); apunta("IndexNow: " + (r.split("\n").filter((l) => /respuesta|URL|200|202/i.test(l)).slice(-2).join(" · ") || "avisado")); }
  catch (e) { apunta("IndexNow: falló (" + String(e.stdout || e.message).split("\n").slice(-2).join(" ").slice(0, 150) + ")"); }
  termina(0, `bibliomapa.es al día (${ahora.slice(0, 8)})`);
})().catch((e) => termina(1, "error inesperado: " + e.message));
