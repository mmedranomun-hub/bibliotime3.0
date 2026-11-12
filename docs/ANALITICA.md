# Analítica sin cookies de Bibliomapa

Objetivo 8 de `docs/OBJETIVOS.md` («Tráfico y rentabilidad»): saber cuánta gente entra sin cookies, sin banner de
consentimiento y sin datos personales. **Hoy está APAGADA**: el código está listo y no hace nada hasta que Marcos
elija proveedor. Mientras siga apagada, `privacidad.html` dice la verdad («no usamos analítica») y no se toca.

## Qué hace `analitica.js`

- Lee una sola línea de configuración al principio del archivo: `var ANALITICA = {proveedor: null};`
- Con `proveedor: null` (como está hoy) **no hace nada**: ni peticiones de red, ni cookies, ni `localStorage`.
- Con `"vercel"` añade `<script defer src="/_vercel/insights/script.js">` (Vercel Web Analytics).
- Con `"goatcounter"` y `codigo` añade el script de GoatCounter (`https://gc.zgo.at/count.js` con
  `data-goatcounter="https://<codigo>.goatcounter.com/count"`).
- **No carga nada** si el navegador pide «No rastrear» (`navigator.doNotTrack === "1"`) o Global Privacy Control
  (`navigator.globalPrivacyControl`), ni en `localhost`/`127.0.0.1`, ni abriendo el archivo (`file:`).
- Solo cuenta **páginas vistas**: envía la ruta (`/`, `/bibliotecas/madrid/`…) sin `?consulta` ni `#ancla` (así el
  `#bib=…` de una ficha no sale del móvil). No hay eventos propios: nada del modo estudio (sesiones, minutos,
  bibliotecas elegidas, amigos) se manda al proveedor. Ni Vercel ni GoatCounter usan cookies ni guardan la IP.
- La decisión está en una función pura, `analiticaDecidir(conf, entorno)`, que prueba `scripts/probar.py`
  (prueba «analítica apagada por defecto…»): con la configuración por defecto no se pide ninguna URL de analítica.

## Integración (hecha)

- `index.html`, justo antes de `<script src="app.js"></script>`: `<script src="analitica.js" defer></script>`
- **Ya va en las páginas SEO** (2026-11-12): la plantilla de `scripts/generar_paginas_seo.js` pone
  `<script src="/analitica.js" defer></script>` en el `<head>` de las 1082 páginas de `/bibliotecas/` y de `404.html`
  (no depende de `app.js`; la etiqueta no cuenta para el `lastmod` del sitemap). `scripts/comprobar_paginas_seo.js`
  falla si a alguna le falta o si alguien pone a mano un script de proveedor, y la prueba de `probar.py` carga
  `index.html` y `/bibliotecas/madrid/` y exige que se descargue sin pedir nada de analítica ni poner cookies.
- `sw.js`: `"./analitica.js"` está en la lista de precarga.

Con la integración hecha y `proveedor: null`, sigue sin medirse nada: solo se descarga un archivo de ~2 KB.

## Cómo encenderla (pasos para Marcos)

Elige **una** opción. En ambas, el último paso es cambiar **una línea** de `analitica.js` y publicar.

### Opción A · Vercel Web Analytics (recomendada: la web ya está en Vercel)
1. Entra en vercel.com → proyecto `bibliotime` → pestaña **Analytics** → **Enable** (plan Hobby: gratis con límite
   mensual de eventos; de sobra para empezar).
2. Dile al bucle «enciende la analítica con Vercel», o cambia tú la línea de `analitica.js` a:
   `var ANALITICA = {proveedor: "vercel"};`
3. Publica (`npx vercel deploy` y `npx vercel promote <url>`). A los pocos minutos aparecen visitas en la pestaña.
   Ojo: `/_vercel/insights/script.js` solo existe en webs servidas por Vercel; en GitHub Pages daría 404 (inofensivo,
   pero no mide).

### Opción B · GoatCounter (gratis, sirve en cualquier alojamiento)
1. Crea una cuenta en goatcounter.com eligiendo un código, p. ej. `bibliomapa` (el panel quedará en
   `https://bibliomapa.goatcounter.com`). Es gratis para uso no comercial con tráfico moderado.
2. Dile al bucle el código, o cambia la línea a:
   `var ANALITICA = {proveedor: "goatcounter", codigo: "bibliomapa"};`
3. Publica. En la configuración de GoatCounter conviene marcar «no guardar el tamaño de pantalla» solo si se quiere
   aún menos dato (pero entonces no hay % móvil).

**El mismo día que se encienda**, hay que cambiar `privacidad.html` (abajo, texto exacto) y la fecha de «Última
actualización». Sin ese cambio la política mentiría.

## Texto EXACTO para `privacidad.html` (solo el día que se encienda)

1. En «Resumen en 30 segundos», sustituir
   `<li><b>Sin publicidad, sin analítica, sin rastreadores</b> y no vendemos tus datos.</li>` por:

   ```html
   <li><b>Sin publicidad ni rastreadores</b>: solo contamos visitas de forma anónima y agregada, sin cookies. No vendemos tus datos.</li>
   ```

2. En «3. Lo que NO hacemos», sustituir
   `<li>No usamos herramientas de analítica, estadísticas de uso, cookies de seguimiento ni identificadores publicitarios.</li>` por:

   ```html
   <li>No usamos cookies de seguimiento, identificadores publicitarios ni analítica que te identifique (ver «Estadística de visitas» en el apartado 4).</li>
   ```

3. En «4. Proveedores y terceros», añadir este punto a la lista (elegir la variante del proveedor activo):

   ```html
   <li><b>Estadística de visitas</b> (Vercel Web Analytics, de Vercel Inc.): para saber cuánta gente usa Bibliomapa contamos las páginas vistas de forma <b>agregada y anónima, sin cookies</b> y sin guardar nada en tu dispositivo. Se envía la dirección de la página (sin lo que va tras «?» o «#»), la web de la que vienes, el tipo de dispositivo, navegador, sistema y país aproximado. Tu IP no se guarda: el proveedor la usa solo para calcular un identificador diario anónimo que se descarta a las 24 h. No medimos nada de lo que haces dentro de la app (sesiones de estudio, bibliotecas, amigos). Si tu navegador tiene activado «No rastrear» (Do Not Track) o Global Privacy Control, no se carga en absoluto. Base jurídica: interés legítimo en conocer el uso agregado del servicio (art. 6.1.f RGPD).</li>
   ```

   Variante GoatCounter: cambiar `(Vercel Web Analytics, de Vercel Inc.)` por `(GoatCounter, servicio de
   estadísticas de código abierto)` (comprobar entonces en goatcounter.com dónde aloja los datos y añadirlo) y la frase de la IP por `Tu IP no se guarda: se usa solo para
   distinguir visitas únicas mediante un identificador anónimo que se descarta en pocas horas.`

## Diff COMPLETO de `privacidad.html` (Vercel; aplicar solo el día que se encienda)

Es el mismo cambio que los tres fragmentos de arriba más la fecha, como parche listo para aplicar. `scripts/probar.py`
(prueba «política de privacidad coherente con analitica.js») lo aplica cada vez a una copia temporal de
`privacidad.html` y falla si ya no encaja (por ejemplo, si alguien retoca esas líneas sin actualizar este diff).
El día de encender:

1. Copia el bloque de abajo (sin las líneas ```) a un archivo, p. ej. `/tmp/privacidad.diff`, y desde la raíz:
   `patch -p1 < /tmp/privacidad.diff` (o `git apply /tmp/privacidad.diff`).
2. Sustituye `[FECHA DEL DÍA QUE SE ENCIENDA]` por la fecha real (p. ej. `3 de diciembre de 2026`). La prueba
   falla mientras quede el marcador.
3. Si el proveedor es GoatCounter, aplica también la «Variante GoatCounter» de arriba al punto añadido.
4. Cambia la línea de `analitica.js`, actualiza en `scripts/probar.py` la prueba «analítica apagada por defecto»
   (hoy exige `proveedor:null`) y ejecuta `python3 scripts/probar.py`: la prueba de coherencia tiene que salir en verde.

```diff
--- a/privacidad.html
+++ b/privacidad.html
@@ -18,7 +18,7 @@
 <header>
   <h1>Política de privacidad</h1>
   <p class="sub">App «Bibliomapa · Bibliotecas de España» (Bibliotime)</p>
-  <span class="date">Última actualización: 12 de noviembre de 2026</span>
+  <span class="date">Última actualización: [FECHA DEL DÍA QUE SE ENCIENDA]</span>
   <p class="sub" style="margin-top:8px">Consulta también las <a href="condiciones.html">condiciones de uso</a>.</p>
 </header>
 
@@ -29,7 +29,7 @@
     <li>Si creas una cuenta, guardamos tu <b>correo (en el sistema de inicio de sesión), nombre y un código de amigo</b> para que puedas iniciar sesión y añadir amigos.</li>
     <li>Tu <b>ubicación GPS nunca sale de tu móvil</b>: se usa solo en el dispositivo para calcular distancias, mostrar «Mi ubicación» y verificar el check-in.</li>
     <li>Solo compartimos con tus amigos la <b>biblioteca</b> donde estudias, tus sesiones o tus eventos <b>si tú lo activas</b>.</li>
-    <li><b>Sin publicidad, sin analítica, sin rastreadores</b> y no vendemos tus datos.</li>
+    <li><b>Sin publicidad ni rastreadores</b>: solo contamos visitas de forma anónima y agregada, sin cookies. No vendemos tus datos.</li>
   </ul>
 </section>
 
@@ -99,7 +99,7 @@
   <h2>3. Lo que NO hacemos</h2>
   <ul>
     <li>No mostramos publicidad.</li>
-    <li>No usamos herramientas de analítica, estadísticas de uso, cookies de seguimiento ni identificadores publicitarios.</li>
+    <li>No usamos cookies de seguimiento, identificadores publicitarios ni analítica que te identifique (ver «Estadística de visitas» en el apartado 4).</li>
     <li>No vendemos ni alquilamos tus datos, ni los usamos para crear perfiles comerciales.</li>
     <li>No enviamos tus coordenadas GPS a ningún servidor.</li>
     <li>No tomamos decisiones automatizadas con efectos legales sobre ti.</li>
@@ -114,6 +114,7 @@
     <li><b>Teselas del mapa</b>: las imágenes del mapa se descargan de <b>tile.openstreetmap.de</b> (OpenStreetMap Alemania / FOSSGIS e.V.) y, si eliges la capa de relieve, de <b>OpenTopoMap</b> (opentopomap.org). Si se habilita la capa satélite, de <b>MapTiler</b>. Estos servidores reciben tu IP y la zona del mapa que estás viendo, no tu ubicación GPS.</li>
     <li><b>CDN de librerías</b>: la librería de mapas Leaflet se carga desde <b>unpkg.com</b> (o, de respaldo, <b>cdn.jsdelivr.net</b>), y la librería de Supabase desde <b>cdn.jsdelivr.net</b>. Reciben tu IP al descargar esos archivos.</li>
     <li><b>Alojamiento de la web</b>: la web y la app están publicadas en <b>Vercel</b> (Vercel Inc., Estados Unidos). Como cualquier servidor web, registra datos técnicos de cada petición (tu dirección IP, la fecha y hora, la página pedida y el tipo de navegador) por seguridad y para que el servicio funcione. Por eso puede haber una transferencia internacional de datos a EE. UU., que se ampara en las garantías adecuadas previstas en el RGPD ofrecidas por el proveedor. Más información en la <a href="https://vercel.com/legal/privacy-policy" rel="noopener">política de privacidad de Vercel</a>.</li>
+    <li><b>Estadística de visitas</b> (Vercel Web Analytics, de Vercel Inc.): para saber cuánta gente usa Bibliomapa contamos las páginas vistas de forma <b>agregada y anónima, sin cookies</b> y sin guardar nada en tu dispositivo. Se envía la dirección de la página (sin lo que va tras «?» o «#»), la web de la que vienes, el tipo de dispositivo, navegador, sistema y país aproximado. Tu IP no se guarda: el proveedor la usa solo para calcular un identificador diario anónimo que se descarta a las 24 h. No medimos nada de lo que haces dentro de la app (sesiones de estudio, bibliotecas, amigos). Si tu navegador tiene activado «No rastrear» (Do Not Track) o Global Privacy Control, no se carga en absoluto. Base jurídica: interés legítimo en conocer el uso agregado del servicio (art. 6.1.f RGPD).</li>
     <li><b>Enlaces externos</b>: si pulsas «Cómo llegar» se abre Google Maps con la ubicación de la biblioteca de destino (no la tuya); si compartes por WhatsApp, se abre WhatsApp con el mensaje que tú envías; las webs de las bibliotecas se abren en tu navegador. Desde ese momento se aplican las políticas de privacidad de esos servicios.</li>
   </ul>
   <p>No cedemos tus datos a nadie más, salvo obligación legal.</p>
```

**Por qué no se puede encender sin cambiar la política:** la prueba «política de privacidad coherente con analitica.js»
de `scripts/probar.py` lee los dos archivos (sin navegador) y falla si `proveedor` no es `null` y `privacidad.html`
sigue diciendo «sin analítica» / «No usamos herramientas de analítica», no tiene el punto «Estadística de visitas»
con el nombre del proveedor activo (Vercel Web Analytics o GoatCounter) o conserva el marcador de fecha; y, al revés,
falla si `proveedor` es `null` y la política ya habla de «Estadística de visitas» o ha dejado de decir «sin analítica».

## Cómo se medirán las métricas del objetivo 8

| Métrica | Vercel Web Analytics | GoatCounter | Dónde se apunta |
|---|---|---|---|
| **Visitas/semana** | «Visitors» con el rango «Last 7 days» (visitantes únicos por día, sumados) | Panel → rango de 7 días → «Visits» | `docs/METRICAS.md` (a mano, una vez por semana, mismo día) |
| **Páginas de entrada** (¿funcionan las de ciudad?) | Tarjeta «Pages» filtrando por «Referrer» externo (Google), o mirando qué rutas `/bibliotecas/…` tienen visitas | Lista de rutas con «Referrers»: las `/bibliotecas/…` con referrer de Google son entradas | Top 10 rutas `/bibliotecas/…` y % del total |
| **% móvil** | Tarjeta «Devices» (Mobile/Desktop/Tablet) | «Sizes» (tamaños de pantalla: móvil < 600 px) | % sobre el total de la semana |
| Clics e impresiones de Google, páginas indexadas | No lo da: **Google Search Console** (pendiente de Marcos, ver `docs/SEO.md`) | Igual | `docs/METRICAS.md` |

Límites honestos: sin cookies **no** se mide retención (si la misma persona vuelve mañana) ni la estrella polar
(minutos de estudio por usuario activo). Para eso hará falta un contador agregado propio en Supabase (por ejemplo,
sesiones terminadas por día, sin usuario), que sería otro cambio de la política de privacidad.
