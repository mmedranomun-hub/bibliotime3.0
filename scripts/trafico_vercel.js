// Informe de tráfico de bibliomapa.es con la API oficial de Vercel Web Analytics (mayo 2026).
// Uso: node scripts/trafico_vercel.js [días]      (por defecto 7; Hobby solo guarda 1 mes)
// Token: variable de entorno VERCEL_TOKEN o archivo .env.local con VERCEL_TOKEN=... (ignorado por git).
// Proyecto y equipo: .vercel/project.json. Salida: docs/trafico/AAAA-MM-DD.md y docs/trafico/historico.json
// Requisito: Analytics activado en el proyecto y analitica.js con proveedor "vercel" (ver docs/ANALITICA.md).
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const dias = Number(process.argv[2]) || 7;

function leerToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN.trim();
  const env = path.join(RAIZ, ".env.local");
  if (fs.existsSync(env)) {
    const m = fs.readFileSync(env, "utf8").match(/^VERCEL_TOKEN=(.+)$/m);
    if (m) return m[1].trim();
  }
  return null;
}

const token = leerToken();
if (!token) {
  console.log("Falta el token. Crea uno en https://vercel.com/account/tokens (con acceso al equipo del proyecto)");
  console.log("y guárdalo en C:\\Users\\pc\\Bibliotime\\.env.local con una línea: VERCEL_TOKEN=xxxxx");
  process.exit(2);
}
const proyecto = JSON.parse(fs.readFileSync(path.join(RAIZ, ".vercel", "project.json"), "utf8"));
const hasta = new Date();
const desde = new Date(hasta - dias * 864e5);

async function consulta(ruta, params) {
  const q = new URLSearchParams({
    projectId: proyecto.projectId, teamId: proyecto.orgId,
    since: desde.toISOString(), until: hasta.toISOString(), ...params,
  });
  const r = await fetch(`https://api.vercel.com/v1/query/web-analytics/${ruta}?${q}`, {
    headers: { Authorization: "Bearer " + token },
  });
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${ruta} → HTTP ${r.status}: ${JSON.stringify(cuerpo).slice(0, 300)}`);
  return cuerpo.data;
}

const fila = (d, clave) => `| ${d[clave] ?? "—"} | ${d.visitors ?? "—"} | ${d.pageviews ?? "—"} |`;
const tabla = (titulo, clave, datos) => [
  `## ${titulo}`, `| ${clave} | visitantes | páginas vistas |`, "|---|---|---|",
  ...(datos || []).map((d) => fila(d, clave)), "",
];

(async () => {
  try {
    const total = await consulta("visits/count", {});
    const [porDia, rutas, origenes, paises, dispositivos] = await Promise.all([
      consulta("visits/aggregate", { by: "day", limit: 100 }),
      consulta("visits/aggregate", { by: "requestPath", limit: 15 }),
      consulta("visits/aggregate", { by: "referrerHostname", limit: 10 }),
      consulta("visits/aggregate", { by: "country", limit: 10 }),
      consulta("visits/aggregate", { by: "deviceType", limit: 5 }),
    ]);
    const hoy = hasta.toISOString().slice(0, 10);
    const md = [
      `# Tráfico bibliomapa.es — ${hoy} (últimos ${dias} días)`,
      `**${total.visitors} visitantes · ${total.pageviews} páginas vistas**`, "",
      ...tabla("Por día", "timestamp", porDia),
      ...tabla("Páginas más vistas", "requestPath", rutas),
      ...tabla("De dónde llegan", "referrerHostname", origenes),
      ...tabla("Países", "country", paises),
      ...tabla("Dispositivo", "deviceType", dispositivos),
    ].join("\n");
    const dir = path.join(RAIZ, "docs", "trafico");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, hoy + ".md"), md);
    // Histórico compacto para que el bucle compare semana a semana.
    const rutaHist = path.join(dir, "historico.json");
    const hist = fs.existsSync(rutaHist) ? JSON.parse(fs.readFileSync(rutaHist, "utf8")) : [];
    hist.push({ fecha: hoy, dias, visitantes: total.visitors, paginas: total.pageviews, top: (rutas || []).slice(0, 5) });
    fs.writeFileSync(rutaHist, JSON.stringify(hist, null, 1));
    console.log(md);
  } catch (e) {
    console.error("Error: " + e.message);
    if (/40[13]/.test(e.message)) console.error("El token no tiene acceso al equipo del proyecto (equipo moscar, cuenta de Marcos).");
    process.exit(1);
  }
})();
