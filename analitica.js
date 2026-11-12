/* Analítica sin cookies de Bibliomapa (ver docs/ANALITICA.md).
   APAGADA: con proveedor:null este archivo no hace NADA (ni red, ni cookies, ni almacenamiento).
   Para encenderla se cambia SOLO la línea de ANALITICA de abajo:
     {proveedor:"vercel"}                          → Vercel Web Analytics (la web tiene que estar en Vercel)
     {proveedor:"goatcounter", codigo:"bibliomapa"} → GoatCounter (https://bibliomapa.goatcounter.com)
   Solo cuenta páginas vistas (ruta sin ?consulta ni #ancla): ningún evento propio, nada del modo estudio,
   ningún dato personal. No carga nada con «No rastrear» (DNT) o Global Privacy Control, ni en local. */
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

(function () {
  var n = navigator, w = window;
  var d = analiticaDecidir(ANALITICA, {
    dnt: n.doNotTrack || w.doNotTrack || n.msDoNotTrack,
    gpc: n.globalPrivacyControl,
    protocolo: location.protocol,
    host: location.hostname
  });
  if (!d) return;
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
  if (d.goatcounter) { s.async = true; s.setAttribute("data-goatcounter", d.goatcounter); }
  document.head.appendChild(s);
})();
