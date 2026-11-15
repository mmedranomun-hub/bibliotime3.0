/* Analítica sin cookies de Bibliomapa (ver docs/ANALITICA.md).
   APAGADA: con proveedor:null este archivo no hace NADA (ni red, ni cookies, ni almacenamiento).
   Para encenderla se cambia SOLO la línea de ANALITICA de abajo:
     {proveedor:"vercel"}                          → Vercel Web Analytics (la web tiene que estar en Vercel)
     {proveedor:"goatcounter", codigo:"bibliomapa"} → GoatCounter (https://bibliomapa.goatcounter.com)
   Solo cuenta páginas vistas (ruta sin ?consulta ni #ancla) y UN evento agregado sin parámetros (EVENTOS, abajo):
   nada del modo estudio, ningún id de biblioteca, ningún dato personal. No carga nada con «No rastrear» (DNT) o
   Global Privacy Control, ni en local. Apagada, analiticaEvento() no hace nada y devuelve false. */
var ANALITICA = {proveedor: null};

/* Decide qué script cargar (o null). Pura y sin efectos: la usan las pruebas. */
function analiticaDecidir(conf, ent) {
  if (!conf || !conf.proveedor) return null;
  if (ent.dnt === "1" || ent.dnt === "yes" || ent.gpc === true) return null;
  if (ent.protocolo !== "https:" && ent.protocolo !== "http:") return null;
  if (/^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|0\.0\.0\.0|)$/.test(ent.host)) return null;
  if (conf.proveedor === "vercel") return {src: "/_vercel/insights/script.js"};
  if (conf.proveedor === "goatcounter" && /^[a-z0-9-]+$/.test(conf.codigo || ""))
    return {src: "https://gc.zgo.at/count.js", goatcounter: "https://" + conf.codigo + ".goatcounter.com/count"};
  return null;
}

/* Únicos eventos permitidos: nombre → título legible (GoatCounter). Ninguno lleva datos: solo se cuentan.
   «enlace-compartido-bib»: alguien abrió /#bib=…&o=c, el enlace del «🔗 Compartir» de una biblioteca (app.js). */
var EVENTOS = {"enlace-compartido-bib": "Llegó por enlace compartido de biblioteca"};
var ANALITICA_D = null, ANALITICA_COLA = [];

/* Envía `nombre` con la decisión `d` (de analiticaDecidir) por la ventana `w`. Sin d o con un nombre fuera de
   EVENTOS no hace nada y devuelve false. Separada del estado para que las pruebas la usen con una w de mentira. */
function analiticaEnviar(d, nombre, w, cola) {
  if (!d || !Object.prototype.hasOwnProperty.call(EVENTOS, nombre)) return false;
  if (d.goatcounter) {
    var ev = {path: nombre, title: EVENTOS[nombre], event: true};
    if (w.goatcounter && typeof w.goatcounter.count === "function") w.goatcounter.count(ev);
    else if (cola) cola.push(ev); // count.js aún no ha llegado: se manda al cargar
    else return false;
  } else {
    if (typeof w.va !== "function") return false;
    w.va("event", {name: nombre}); // misma forma que track() del paquete oficial de Vercel
  }
  return true;
}
function analiticaEvento(nombre) { return analiticaEnviar(ANALITICA_D, nombre, window, ANALITICA_COLA); }

(function () {
  var n = navigator, w = window;
  var d = analiticaDecidir(ANALITICA, {
    dnt: n.doNotTrack || w.doNotTrack || n.msDoNotTrack,
    gpc: n.globalPrivacyControl,
    protocolo: location.protocol,
    host: location.hostname
  });
  if (!d) return;
  ANALITICA_D = d;
  if (d.goatcounter) {
    // Solo la ruta: ni ?consulta ni #ancla (el #bib=… de una ficha no sale del móvil)
    w.goatcounter = {path: function () { return location.pathname; }};
  } else {
    // Vercel: misma cola que usa su paquete oficial; beforeSend quita la consulta y el ancla
    w.va = w.va || function () { (w.vaq = w.vaq || []).push(arguments); };
    w.va("beforeSend", function (e) { try { var u = new URL(e.url); e.url = u.origin + u.pathname; } catch (x) {} return e; });
  }
  var s = document.createElement("script");
  s.defer = true;
  s.src = d.src;
  if (d.goatcounter) {
    s.async = true; s.setAttribute("data-goatcounter", d.goatcounter);
    s.onload = function () { var c = ANALITICA_COLA.splice(0); for (var k = 0; k < c.length; k++) analiticaEnviar(d, c[k].path, w, null); };
  }
  document.head.appendChild(s);
})();
