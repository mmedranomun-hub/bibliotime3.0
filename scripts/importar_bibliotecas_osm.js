#!/usr/bin/env node
/*
 * importar_bibliotecas_osm.js
 * Regenera data/bibliotecas_espana.json a partir de OpenStreetMap (Overpass API).
 *
 * Uso:   node scripts/importar_bibliotecas_osm.js
 * Req.:  Node >= 18 (fetch nativo). Sin dependencias.
 *
 * Pasos:
 *  1. Descarga todas las amenity=library (nodos, ways, relations, `out center tags`)
 *     dentro del área ISO3166-1=ES. Si falla, reintenta por comunidades autónomas
 *     (admin_level=4) con pausas entre peticiones.
 *  2. Asigna provincia (admin_level=6) y comunidad (admin_level=4) consultando en
 *     Overpass a qué límite administrativo de OSM pertenece cada elemento (`out ids`).
 *     Si un elemento no cae en ningún admin_level=6, se usa su addr:province.
 *  3. Marca como duplicados probables los que están a <=150 m de alguna de las
 *     bibliotecas del array BIBLIOTECAS de app.js, y en Navarra además los de
 *     nombre genérico a <=700 m o nombre similar a <=3,5 km (se excluyen del JSON y se
 *     listan en data/duplicados_navarra.json para revisión manual).
 *  4. Escribe data/bibliotecas_espana.json (UTF-8 sin BOM, compacto) y
 *     data/LEEME.md con estadísticas.
 *
 * Datos © colaboradores de OpenStreetMap, licencia ODbL 1.0.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const OUT_JSON = path.join(DATA_DIR, 'bibliotecas_espana.json');
const OUT_DUP = path.join(DATA_DIR, 'duplicados_navarra.json');
const OUT_LEEME = path.join(DATA_DIR, 'LEEME.md');
const APP_JS = path.join(ROOT, 'app.js');

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const UA = 'Bibliotime-import/1.0 (dataset bibliotecas Espana)';
const DUP_RADIUS_M = 150;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(query, { retries = 3 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    for (const ep of ENDPOINTS) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 15 * 60 * 1000);
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
          body: 'data=' + encodeURIComponent(query),
          signal: ctrl.signal,
        });
        clearTimeout(t);
        const txt = await res.text();
        if (!res.ok) throw new Error(`${ep} HTTP ${res.status}: ${txt.slice(0, 200)}`);
        const json = JSON.parse(txt);
        if (json.remark && /error|timed out|runtime/i.test(json.remark)) {
          throw new Error(`${ep} remark: ${json.remark}`);
        }
        return json;
      } catch (e) {
        lastErr = e;
        console.warn('  ! fallo Overpass:', e.message);
        await sleep(10000);
      }
    }
    await sleep(30000 * (attempt + 1));
  }
  throw lastErr;
}

const AREA_ES = 'area["ISO3166-1"="ES"]["admin_level"="2"]->.es;';

async function descargarBibliotecas() {
  console.log('1) Descargando bibliotecas de España (consulta nacional)...');
  const q = `[out:json][timeout:900];${AREA_ES}nwr["amenity"="library"](area.es);out center tags;`;
  try {
    const j = await overpass(q, { retries: 2 });
    return j.elements;
  } catch (e) {
    console.warn('  Consulta nacional fallida, se divide por comunidades:', e.message);
  }
  const ccaa = await overpass(
    `[out:json][timeout:300];${AREA_ES}rel(area.es)["boundary"="administrative"]["admin_level"="4"];out ids tags;`
  );
  const byId = new Map();
  for (const r of ccaa.elements) {
    await sleep(5000);
    const areaId = 3600000000 + r.id;
    console.log('  ·', r.tags && r.tags.name);
    const j = await overpass(`[out:json][timeout:600];area(${areaId})->.a;nwr["amenity"="library"](area.a);out center tags;`);
    for (const el of j.elements) byId.set(el.type + '/' + el.id, el);
  }
  return [...byId.values()];
}

// Devuelve Map "type/id" -> nombre del límite administrativo de nivel `level`.
async function asignarAreas(level, total) {
  // Overpass a veces devuelve resultados parciales sin error: se valida la cobertura.
  let mejor = new Map();
  for (let intento = 1; intento <= 4; intento++) {
    const m = await asignarAreasUnaVez(level);
    if (m.size > mejor.size) mejor = m;
    const cobertura = mejor.size / total;
    console.log(`   cobertura admin_level=${level}: ${(100 * cobertura).toFixed(1)} %`);
    if (cobertura >= 0.97) break;
    await sleep(30000);
  }
  return mejor;
}

async function asignarAreasUnaVez(level) {
  console.log(`2) Asignando límites admin_level=${level}...`);
  const q = `[out:json][timeout:900];${AREA_ES}
nwr["amenity"="library"](area.es)->.libs;
rel(area.es)["boundary"="administrative"]["admin_level"="${level}"];
map_to_area->.zonas;
foreach.zonas->.z(
  .z out tags;
  nwr.libs(area.z);
  out ids;
);`;
  const j = await overpass(q);
  const map = new Map();
  let actual = '';
  for (const el of j.elements) {
    if (el.type === 'area') {
      const t = el.tags || {};
      actual = t['name:es'] || t.name || '';
    } else if (actual) {
      const k = el.type + '/' + el.id;
      if (!map.has(k)) map.set(k, actual);
    }
  }
  return map;
}

function distM(lat1, lon1, lat2, lon2) {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLon = (lon2 - lon1) * toR;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function leerBibliotecasExistentes() {
  const html = fs.readFileSync(APP_JS, 'utf8');
  const out = [];
  const re = /nombre:"([^"]*)"[^}]*?lat:([\d.-]+),lon:([\d.-]+)/g;
  let m;
  while ((m = re.exec(html))) out.push({ nombre: m[1], lat: +m[2], lon: +m[3] });
  if (!out.length) {
    const re2 = /lat:([\d.-]+),lon:([\d.-]+)/g;
    while ((m = re2.exec(html))) out.push({ nombre: '', lat: +m[1], lon: +m[2] });
  }
  return out;
}

// Normaliza un nombre a tokens significativos (sin tildes ni palabras genéricas).
const GENERICAS = new Set(['biblioteca', 'bibliotecas', 'publica', 'municipal', 'liburutegia', 'liburutegi',
  'publikoa', 'udal', 'herri', 'libirutegia', 'casa', 'cultura', 'del', 'de', 'la', 'las', 'los', 'el', 'y', 'navarra', 'archivo', 'general']);
const tokens = (n) => (n || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !GENERICAS.has(w));
const nombreGenerico = (n) => tokens(n).length === 0;
const similares = (a, b) => {
  const ta = tokens(a), tb = tokens(b);
  return ta.some((x) => tb.some((y) => x.slice(0, 5) === y.slice(0, 5)));
};

/* Criterios de duplicado probable respecto a BIBLIOTECAS (app.js):
 *  a) a <= 150 m de cualquiera de ellas;
 *  b) solo en Navarra: nombre genérico ("Biblioteca Pública", "Casa de Cultura"...) a <= 700 m;
 *  c) solo en Navarra: nombre con un token en común (p. ej. "Burlada") a <= 3,5 km.
 * Los b) y c) se marcan con criterio distinto para poder revisarlos a mano. */
function detectarDuplicado(rec, existentes) {
  let cercana = null;
  for (const b of existentes) {
    const d = distM(rec.lat, rec.lon, b.lat, b.lon);
    if (!cercana || d < cercana.d) cercana = { d, b };
  }
  if (!cercana) return null;
  const out = (criterio, b, d) => ({ dup_de: b.nombre, dist_m: Math.round(d), criterio });
  if (cercana.d <= DUP_RADIUS_M) return out('<=150m', cercana.b, cercana.d);
  if (rec.ccaa !== 'Navarra') return null;
  if (nombreGenerico(rec.nombre) && cercana.d <= 700) return out('nombre_generico<=700m', cercana.b, cercana.d);
  for (const b of existentes) {
    const d = distM(rec.lat, rec.lon, b.lat, b.lon);
    if (d <= 3500 && similares(rec.nombre, b.nombre)) return out('nombre_similar<=3.5km', b, d);
  }
  return null;
}

const r5 = (x) => Math.round(x * 1e5) / 1e5;
const s = (v) => (v == null ? '' : String(v).trim());

function construirDir(t) {
  const calle = [s(t['addr:street']) || s(t['addr:place']), s(t['addr:housenumber'])].filter(Boolean).join(' ');
  const loc = [s(t['addr:postcode']), s(t['addr:city'])].filter(Boolean).join(' ');
  return [calle, loc].filter(Boolean).join(', ');
}

function tipoDe(t) {
  return s(t.library) || s(t['library:type']) || s(t['operator:type']) || '';
}

async function main() {
  const elementos = await descargarBibliotecas();
  console.log(`   ${elementos.length} elementos descargados`);
  await sleep(5000);
  const provMap = await asignarAreas(6, elementos.length);
  await sleep(5000);
  const ccaaMap = await asignarAreas(4, elementos.length);

  const existentes = leerBibliotecasExistentes();
  console.log(`3) ${existentes.length} bibliotecas existentes leídas de app.js`);

  const registros = [], duplicados = [];
  let sinNombre = 0, sinCoord = 0;
  for (const el of elementos) {
    const t = el.tags || {};
    const nombre = s(t.name) || s(t['name:es']) || s(t.official_name);
    if (!nombre) { sinNombre++; continue; }
    const lat = el.lat != null ? el.lat : el.center && el.center.lat;
    const lon = el.lon != null ? el.lon : el.center && el.center.lon;
    if (lat == null || lon == null) { sinCoord++; continue; }
    const key = el.type + '/' + el.id;
    const rec = {
      id: 'osm:' + key,
      nombre,
      lat: r5(lat),
      lon: r5(lon),
      dir: construirDir(t),
      municipio: s(t['addr:city']) || s(t['addr:municipality']),
      // Preferimos el límite OSM (nombres homogéneos); addr:province como respaldo.
      // Ceuta y Melilla no tienen admin_level=6: se usa su admin_level=4.
      provincia: provMap.get(key) || s(t['addr:province']) || (/^(Ceuta|Melilla)$/.test(ccaaMap.get(key) || '') ? ccaaMap.get(key) : ''),
      ccaa: ccaaMap.get(key) || '',
      tel: s(t.phone) || s(t['contact:phone']),
      web: s(t.website) || s(t['contact:website']) || s(t.url),
      oh: s(t.opening_hours),
      tipo: tipoDe(t),
    };
    const dup = detectarDuplicado(rec, existentes);
    if (dup) {
      duplicados.push({ ...rec, ...dup });
    } else {
      registros.push(rec);
    }
  }
  registros.sort((a, b) => (a.ccaa + a.provincia + a.nombre).localeCompare(b.ccaa + b.provincia + b.nombre, 'es'));

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const json = JSON.stringify(registros);
  fs.writeFileSync(OUT_JSON, json, { encoding: 'utf8' });
  fs.writeFileSync(OUT_DUP, JSON.stringify(duplicados, null, 1), { encoding: 'utf8' });

  // Estadísticas
  const pct = (n) => ((100 * n) / registros.length).toFixed(1) + ' %';
  const cuenta = (campo) => {
    const m = new Map();
    for (const r of registros) m.set(r[campo] || '(sin asignar)', (m.get(r[campo] || '(sin asignar)') || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const porProv = cuenta('provincia'), porCcaa = cuenta('ccaa');
  const conOh = registros.filter((r) => r.oh).length;
  const conWeb = registros.filter((r) => r.web).length;
  const conTel = registros.filter((r) => r.tel).length;
  const gz = zlib.gzipSync(Buffer.from(json, 'utf8'), { level: 9 }).length;
  const fecha = new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD hora local

  const tabla = (filas) => ['| Zona | Registros |', '|---|---:|', ...filas.map(([k, v]) => `| ${k} | ${v} |`)].join('\n');
  const leeme = `# Dataset de bibliotecas de España (OpenStreetMap)

**Fuente:** [OpenStreetMap](https://www.openstreetmap.org), vía Overpass API (\`amenity=library\`, nodos, ways y relations dentro del área \`ISO3166-1=ES\`).
**Licencia:** Open Database License (ODbL 1.0). **Atribución obligatoria** allí donde se muestren los datos: **"© colaboradores de OpenStreetMap"** (enlazando a https://www.openstreetmap.org/copyright).
**Fecha de extracción:** ${fecha}
**Regenerar:** \`node scripts/importar_bibliotecas_osm.js\`

## Archivos

- \`bibliotecas_espana.json\`: ${registros.length} registros (JSON compacto, UTF-8 sin BOM, ${(Buffer.byteLength(json, "utf8") / 1024).toFixed(0)} KB; ~${(gz / 1024).toFixed(0)} KB con gzip).
- \`duplicados_navarra.json\`: ${duplicados.length} elementos de OSM que probablemente duplican bibliotecas ya incluidas en \`BIBLIOTECAS\` (app.js). Criterios: a ≤${DUP_RADIUS_M} m (${duplicados.filter((d) => d.criterio === '<=150m').length}); en Navarra, nombre genérico a ≤700 m (${duplicados.filter((d) => d.criterio === 'nombre_generico<=700m').length}) o nombre similar a ≤3,5 km (${duplicados.filter((d) => d.criterio === 'nombre_similar<=3.5km').length}). **No se incluyen** en el JSON principal; revisar a mano (campos \`dup_de\`, \`dist_m\`, \`criterio\`).

Este dataset es independiente del array \`BIBLIOTECAS\`: no altera los \`bib_index\` usados en Supabase.

## Campos

\`id\` (osm:tipo/id), \`nombre\`, \`lat\`, \`lon\` (5 decimales; centro geométrico en ways/relations), \`dir\` (addr:street + housenumber, postcode + city), \`municipio\` (addr:city), \`provincia\` (límite administrativo OSM admin_level=6; si no, addr:province; Ceuta/Melilla: su admin_level=4), \`ccaa\` (límite OSM admin_level=4), \`tel\`, \`web\`, \`oh\` (opening_hours de OSM tal cual), \`tipo\` (library=*, o operator:type).

Solo contiene datos presentes en OSM; los campos vacíos significan que OSM no tiene ese dato. Se descartaron ${sinNombre} elementos sin nombre${sinCoord ? ` y ${sinCoord} sin coordenadas` : ''}.

## Cobertura

- Con horario (\`oh\`): ${conOh} (${pct(conOh)})
- Con web: ${conWeb} (${pct(conWeb)})
- Con teléfono: ${conTel} (${pct(conTel)})

> **Advertencia:** el campo \`oh\` procede de OSM sin verificar; puede estar desactualizado, ser incompleto o usar la sintaxis \`opening_hours\` de forma irregular. No debe mostrarse como horario oficial sin aviso.

## Registros por comunidad autónoma

${tabla(porCcaa)}

## Registros por provincia

${tabla(porProv)}
`;
  fs.writeFileSync(OUT_LEEME, leeme, { encoding: 'utf8' });

  console.log('\n=== RESUMEN ===');
  console.log('Registros:', registros.length, '| duplicados excluidos:', duplicados.length, '| sin nombre:', sinNombre, '| sin coord:', sinCoord);
  console.log("JSON:", Buffer.byteLength(json, "utf8"), 'bytes | gzip:', gz, 'bytes');
  console.log('Con oh:', pct(conOh), '| con web:', pct(conWeb), '| con tel:', pct(conTel));
  console.log('Top 10 provincias:', porProv.slice(0, 10).map(([k, v]) => `${k}=${v}`).join(', '));
  console.log('CCAA:', porCcaa.map(([k, v]) => `${k}=${v}`).join(', '));
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1); });
