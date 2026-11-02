#!/usr/bin/env python3
"""Pruebas de regresión y métricas de Bibliomapa (las usa el bucle de objetivos, ver docs/OBJETIVOS.md).

Uso (desde la raíz del proyecto):
    python3 scripts/probar.py              # pruebas + métricas, resumen en pantalla
    python3 scripts/probar.py --guardar    # además actualiza docs/metricas.json y añade una fila a docs/METRICAS.md
    python3 scripts/probar.py --capturas carpeta/   # guarda capturas 390x844 claro y oscuro de cada vista

Sale con código 1 si alguna prueba falla: entonces NO se sube nada.
Necesita Playwright para Python con Chromium (PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers en la nube).
Las CDN suelen estar bloqueadas en el entorno de pruebas: Leaflet y leaflet.markercluster se sirven en
local (se descargan a /tmp la primera vez: Leaflet de la release de GitHub, markercluster del paquete de
npm o del zip de su etiqueta en GitHub; si markercluster no se puede bajar, avisa y sigue con las
chinchetas sueltas, y `markercluster.servido_en_local` sale false) y Supabase no se carga (modo local).
"""
import asyncio, gzip, http.server, json, os, statistics, sys, threading, time, urllib.request, zipfile, functools

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", "/opt/pw-browsers")
LEAFLET_DIR = os.environ.get("LEAFLET_DIR", "/tmp/leaflet-1.9.4")
PUERTO = int(os.environ.get("PUERTO", "8765"))
MC_VERSION = "1.5.3"  # la que pide index.html (unpkg/jsdelivr leaflet.markercluster@1.5.3)
MC_DIR = os.environ.get("MC_DIR", f"/tmp/leaflet.markercluster-{MC_VERSION}")
MC_ARCHIVOS = ("leaflet.markercluster.js", "MarkerCluster.css", "MarkerCluster.Default.css")
CARGAS = int(os.environ.get("CARGAS", "5"))  # repeticiones de la medición de carga con CPU 4×
# Zona horaria del navegador: una en la que ahora sean ~las 12 del mediodía. Así ninguna prueba cruza la medianoche
# (la sesión de 31 min empezaba «ayer» entre las 0:00 y las 0:31 y fallaba «bosque, misiones, racha y nivel»)
# ni cae en la franja de «racha en peligro» (≥ 19 h). Se puede fijar con ZONA_PRUEBAS=Europe/Madrid.
def _zona_mediodia():
    import datetime
    x = 12 - datetime.datetime.now(datetime.timezone.utc).hour  # desfase en horas: UTC+x
    return "Etc/GMT" if x == 0 else f"Etc/GMT{'-' if x > 0 else '+'}{abs(x)}"
ZONA_PRUEBAS = os.environ.get("ZONA_PRUEBAS") or _zona_mediodia()


def preparar_leaflet():
    js = os.path.join(LEAFLET_DIR, "leaflet.js")
    if os.path.exists(js):
        return
    os.makedirs(LEAFLET_DIR, exist_ok=True)
    zp = os.path.join(LEAFLET_DIR, "leaflet.zip")
    urllib.request.urlretrieve("https://github.com/Leaflet/Leaflet/releases/download/v1.9.4/leaflet.zip", zp)
    with zipfile.ZipFile(zp) as z:
        for n in ("dist/leaflet.js", "dist/leaflet.css"):
            with z.open(n) as src, open(os.path.join(LEAFLET_DIR, os.path.basename(n)), "wb") as dst:
                dst.write(src.read())


def preparar_markercluster():
    """Deja en MC_DIR leaflet.markercluster.js y sus dos CSS, la misma versión que pide index.html.

    Sin markercluster la app pinta las 2616 chinchetas sueltas y la carga CPU 4× mide ~1,3 s de
    Leaflet que en producción no existen (allí se agrupan). Se prueba el paquete de npm (trae dist/)
    y el zip de la etiqueta en GitHub; se guarda en disco y no se vuelve a bajar. Si no hay red,
    avisa y devuelve False: la prueba sigue (con chinchetas sueltas) y lo apunta en el resultado.
    """
    js = os.path.join(MC_DIR, "leaflet.markercluster.js")
    if all(os.path.exists(os.path.join(MC_DIR, n)) for n in MC_ARCHIVOS):
        return True
    os.makedirs(MC_DIR, exist_ok=True)
    fuentes = [  # (url, prefijo de dist/ dentro del archivo)
        (f"https://registry.npmjs.org/leaflet.markercluster/-/leaflet.markercluster-{MC_VERSION}.tgz", "package/dist/"),
        (f"https://github.com/Leaflet/Leaflet.markercluster/archive/refs/tags/v{MC_VERSION}.zip", f"Leaflet.markercluster-{MC_VERSION}/dist/"),
    ]
    fallos = []
    for url, pref in fuentes:
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                datos = r.read()
            if url.endswith(".tgz"):
                import io, tarfile
                with tarfile.open(fileobj=io.BytesIO(datos), mode="r:gz") as t:
                    sacar = {n: t.extractfile(pref + n).read() for n in MC_ARCHIVOS}
            else:
                import io
                with zipfile.ZipFile(io.BytesIO(datos)) as z:
                    sacar = {n: z.read(pref + n) for n in MC_ARCHIVOS}
            for n, b in sacar.items():
                with open(os.path.join(MC_DIR, n), "wb") as f:
                    f.write(b)
            return os.path.exists(js)
        except Exception as e:  # noqa: sin red, 403 del proxy, archivo sin dist/...
            fallos.append(f"{url.split('/')[2]}: {str(e)[:80]}")
    print(f"AVISO: no se pudo descargar leaflet.markercluster {MC_VERSION} ({'; '.join(fallos)}). "
          f"La prueba sigue con las chinchetas sueltas y la carga CPU 4× NO es comparable con producción. "
          f"Para arreglarlo, deja {', '.join(MC_ARCHIVOS)} (de dist/) en {MC_DIR}.", file=sys.stderr)
    return False


def servir():
    class Silencioso(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k):
            pass
    h = functools.partial(Silencioso, directory=RAIZ)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PUERTO), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def peso(ruta):
    with open(os.path.join(RAIZ, ruta), "rb") as f:
        d = f.read()
    return {"kb": round(len(d) / 1024, 1), "kb_gzip": round(len(gzip.compress(d)) / 1024, 1)}


SALTAR_BIENVENIDA = """
var b=document.querySelector('.pick-list button');
if(b){b.click();await new Promise(r=>setTimeout(r,250));var n=document.querySelector('#obNext');if(n)n.click();
  await new Promise(r=>setTimeout(r,250));var d=document.querySelector('#obDone');if(d)d.click();}
if(typeof closeModal==='function')closeModal();
"""

# Cada prueba devuelve true/false (o un texto con el fallo). Se ejecutan en orden sobre la misma página.
PRUEBAS = [
    ("arranca: datos y vistas", """
      return BIBLIOTECAS.length>2500 && !!$('viewMap') && !!$('viewStudy') && !!$('viewCal') && !!$('viewFriends') && !!$('viewProfile');"""),
    ("marca España (sin «Navarra» en la cabecera)", """
      return document.title.indexOf('Navarra')<0 && document.querySelector('.brand h1').textContent.indexOf('España')>=0;"""),
    ("tarjeta Ahora se pinta", """return !!$('nowCard') && $('nowCard').innerText.length>10;"""),
    ("todas las vistas sin errores", """
      for(const v of ['study','cal','friends','profile','map']){goView(v);await new Promise(r=>setTimeout(r,250));} return true;"""),
    ("sesión: empieza, crece el árbol, se guarda", """
      goView('study');$('btnStart').click();await new Promise(r=>setTimeout(r,400));
      var o=document.querySelector('#modalRoot button');if(o&&!studyTimer.running)o.click();await new Promise(r=>setTimeout(r,300));
      if(!studyTimer.running)return 'no arranca';
      studyTimer.start=Date.now()-31*60000;updateTimers();
      if(!$('focusPlant')||$('focusPlant').classList.contains('hidden'))return 'sin árbol en marcha';
      var n=DATA.sessions.length;$('btnStop').click();await new Promise(r=>setTimeout(r,500));
      var s=DATA.sessions[DATA.sessions.length-1];
      if(DATA.sessions.length!==n+1)return 'no guarda la sesión';
      if(s.focus!=='ok'||!s.esp)return 'la sesión no plantó árbol';
      if(!document.querySelector('.planted'))return 'no muestra el árbol plantado';
      closeModal();return true;"""),
    ("bosque, misiones, racha y nivel", """
      renderStudy();
      return !!document.querySelector('#forestCard .arbol') && !!document.querySelector('#missionsCard .mis') &&
        $('streakPill').innerText.indexOf('1')>=0 && !!document.querySelector('#levelCardStudy .lv-name');"""),
    ("marchitar si se sale de la app", """
      $('btnStart').click();await new Promise(r=>setTimeout(r,300));var o=document.querySelector('#modalRoot button');if(o&&!studyTimer.running)o.click();
      await new Promise(r=>setTimeout(r,200));studyTimer.start=Date.now()-5*60000;
      FOCUS.hiddenAt=Date.now()-20000;document.dispatchEvent(new Event('visibilitychange'));
      var ok=FOCUS.withered===true;stopStudy(true);return ok||'no se marchita';"""),
    ("tienda y semillas", """
      DATA.semillasPremio=(DATA.semillasPremio||0)+100;await abrirTienda();var n=document.querySelectorAll('.shop-item').length;closeModal();
      return n>=6||('solo '+n+' especies');"""),
    ("hitos del bosque: al plantar el 10.º árbol, tarjeta y semillas (una sola vez)", """
      var o={s:DATA.sessions,h:DATA.hitosBosque,p:DATA.semillasPremio,m:DATA.misiones,a:DATA.acciones};
      try{
        closeModal();DATA.hitosBosque=[];DATA.hitoBosquePend=0;
        var hoy=ymd(),mk=(i,f)=>({id:'hb'+i,date:hoy,min:30,ts:Date.now()-(100-i)*1000,bib:NO_BIB,focus:f||'ok',esp:'roble'});
        DATA.sessions=[];for(var i=0;i<9;i++)DATA.sessions.push(mk(i));DATA.sessions.push(mk(50,'withered'));
        goView('study');renderForest();var t=($('forestCard').querySelector('.hito-prox')||{}).innerText||'';
        if(!/1 árbol más/.test(t)||!/Arboleda/.test(t)||!/9\\/10/.test(t))return 'próximo hito mal: '+t;
        var p0=DATA.semillasPremio||0,s=mk(60);DATA.sessions.push(s);trasGuardarSesion(s);
        if(DATA.hitoBosquePend!==10||(DATA.semillasPremio||0)-p0<20)return 'no da el hito ni las semillas';
        await mostrarHitoBosque();var m=$('modalRoot').innerText;
        if(!document.querySelector('#modalRoot .hito-bosque')||!/10 árboles/.test(m)||!/\\+20/.test(m)||!/Bosquecillo/.test(m))return 'tarjeta mal: '+m.slice(0,120);
        if(document.querySelectorAll('#modalRoot .hb-escena .arbol').length!==5)return 'escena sin los 5 últimos árboles';
        closeModal();if(DATA.hitoBosquePend)return 'no se da por visto al cerrar';
        s=mk(61);DATA.sessions.push(s);trasGuardarSesion(s);
        DATA.sessions=DATA.sessions.filter(x=>x!==s);DATA.sessions.pop();s=mk(62);DATA.sessions.push(s);trasGuardarSesion(s);
        if(DATA.hitoBosquePend||DATA.hitosBosque.length!==1)return 'repite el hito';
        return true;
      }finally{
        DATA.sessions=o.s;DATA.hitosBosque=o.h;DATA.semillasPremio=o.p;DATA.misiones=o.m;DATA.acciones=o.a;DATA.hitoBosquePend=0;closeModal();renderForest();renderMisiones();
      }"""),
    ("próxima especie: barra en «Mi bosque» y aviso «ya puedes» una sola vez", """
      var k=['sessions','semillasPremio','semillasGastadas','especiesCompradas','especiesAvisadas','especieAvisoPend','misiones','acciones','hitosBosque','hitoBosquePend','bibNuevaPend'],o={};
      k.forEach(x=>o[x]=DATA[x]);
      var toasts=[],st=window.showToast,cm=window.comprobarMisiones;window.showToast=m=>toasts.push(m);window.comprobarMisiones=()=>{};
      try{
        CELEB_DIA=null;closeModal();document.querySelectorAll('.racha-overlay').forEach(x=>x.remove()); // sin la celebración del día de la prueba de sesión
        var hoy=ymd(),mk=i=>({id:'pe'+i,date:hoy,min:30,ts:Date.now()-(100-i)*1000,bib:NO_BIB,focus:'ok',esp:'roble'});
        DATA.sessions=[mk(0),mk(1)];DATA.semillasPremio=0;DATA.semillasGastadas=0;DATA.especiesCompradas=[];DATA.especiesAvisadas=[];DATA.especieAvisoPend=0;DATA.bibNuevaPend=0;AVISO_T=0;DATA.hitosBosque=[1e9];
        goView('study');renderForest();var b=$('forestCard').querySelector('.prox-esp'),t=(b||{}).innerText||'';
        if(!/Cerezo/.test(t)||!/te faltan 48/.test(t)||!/12\\/60/.test(t))return 'barra mal: '+t;
        if(b.querySelector('.hp-bar i').style.width!=='20%')return 'ancho mal: '+b.querySelector('.hp-bar i').style.width;
        DATA.especiesCompradas=['cerezo'];renderForest();t=$('forestCard').querySelector('.prox-esp').innerText;
        if(!/Abeto nevado/.test(t))return 'no pasa a la siguiente: '+t;
        DATA.especiesCompradas=[];
        openModal('<h3>Sesión terminada</h3>');var s=mk(2);s.min=245;DATA.sessions.push(s);trasGuardarSesion(s);
        if(DATA.especieAvisoPend!=='cerezo'||DATA.especiesAvisadas.indexOf('cerezo')<0)return 'no prepara el aviso: '+DATA.especieAvisoPend;
        await new Promise(r=>setTimeout(r,3400));
        if(toasts.some(m=>/cerezos/.test(m)))return 'el aviso tapa la ventana abierta';
        closeModal();await new Promise(r=>setTimeout(r,900));
        if(toasts.filter(m=>/Ya puedes plantar cerezos/.test(m)).length!==1)return 'sin aviso al cerrar: '+JSON.stringify(toasts);
        renderForest();if(!/Ya puedes plantar cerezos/.test($('forestCard').querySelector('.prox-esp').innerText))return 'la barra no dice que ya puede';
        s=mk(3);DATA.sessions.push(s);trasGuardarSesion(s);await new Promise(r=>setTimeout(r,3400));
        if(toasts.filter(m=>/cerezos/.test(m)).length!==1||DATA.especieAvisoPend)return 'repite el aviso';
        DATA.especiesCompradas=ESPECIES.filter(e=>e.precio>0).map(e=>e.id);renderForest();
        if($('forestCard').querySelector('.prox-esp'))return 'barra con todo comprado';
        return true;
      }finally{
        window.showToast=st;window.comprobarMisiones=cm;k.forEach(x=>DATA[x]=o[x]);closeModal();renderForest();renderMisiones();
      }"""),
    ("primer árbol del día: saludo y +5 🌰 una sola vez, sin tapar «Sesión terminada»", """
      var k=['sessions','semillasPremio','primerArbol','misiones','acciones','hitosBosque','hitoBosquePend','especiesAvisadas','especieAvisoPend'],o={};
      k.forEach(x=>o[x]=DATA[x]);var lk='bpna_primer_arbol_'+CURRENT,lv=localStorage.getItem(lk);
      var cm=window.comprobarMisiones;window.comprobarMisiones=()=>{};
      var espera=ms=>new Promise(r=>setTimeout(r,ms)),hoy=ymd(),mk=(i,f)=>({id:'pa'+i,date:hoy,min:30,ts:Date.now()-(100-i)*1000,bib:NO_BIB,focus:f||'ok',esp:'roble'});
      var limpia=()=>document.querySelectorAll('.racha-overlay').forEach(x=>x.remove());
      try{
        closeModal();limpia();DATA.sessions=[];DATA.semillasPremio=0;DATA.primerArbol=0;localStorage.removeItem(lk);
        DATA.hitosBosque=[1e9];DATA.hitoBosquePend=0;DATA.especiesAvisadas=ESPECIES.map(e=>e.id);DATA.especieAvisoPend=0;
        openModal('<h3>Sesión terminada</h3>');var s=mk(0);DATA.sessions.push(s);trasGuardarSesion(s);
        if(DATA.semillasPremio!==5)return 'la primera sesión no da +5: '+DATA.semillasPremio;
        if(DATA.primerArbol!==hoy||JSON.parse(localStorage.getItem(lk))!==hoy)return 'no guarda la marca del día';
        await espera(900);
        if(document.querySelector('.racha-overlay'))return 'la celebración tapa «Sesión terminada»';
        closeModal();await espera(1000);
        var c=document.querySelectorAll('.racha-overlay');
        if(c.length!==1||!c[0].classList.contains('primer-arbol'))return 'no sale una sola tarjeta: '+c.length;
        var t=c[0].innerText;
        if(!/¡Buen(os días|as tardes|as noches)/.test(t)||!/Primer árbol del día/.test(t)||!/\\+5 🌰/.test(t)||!/racha/.test(t))return 'texto mal: '+t;
        limpia();s=mk(1);DATA.sessions.push(s);trasGuardarSesion(s);
        if(DATA.semillasPremio!==5||CELEB_DIA)return 'la segunda sesión vuelve a dar +5';
        DATA.primerArbol=0;s=mk(2);DATA.sessions.push(s);trasGuardarSesion(s);   // como al recargar con DATA sin la marca
        if(DATA.semillasPremio!==5)return 'se duplica al recargar';
        DATA.sessions=[];DATA.semillasPremio=0;DATA.primerArbol=0;localStorage.removeItem(lk);
        s=mk(3,'withered');DATA.sessions.push(s);trasGuardarSesion(s);
        if(DATA.semillasPremio!==0)return 'da +5 por un árbol marchito';
        CELEB_DIA=null;s=mk(4);DATA.sessions.push(s);trasGuardarSesion(s);
        if(DATA.semillasPremio!==5||!CELEB_DIA||CELEB_DIA.racha)return 'el primer árbol sano tras uno marchito no da +5 sin repetir la llama';
        return true;
      }finally{
        window.comprobarMisiones=cm;CELEB_DIA=null;limpia();k.forEach(x=>DATA[x]=o[x]);
        if(lv==null)localStorage.removeItem(lk);else localStorage.setItem(lk,lv);
        closeModal();renderForest();renderMisiones();renderRacha();renderSemillas();
      }"""),
    ("récord personal en «Sesión terminada» (solo si supera la más larga, sin negativos)", """
      await cargarExtra();
      var o=DATA.sessions,hoy=ymd(),mk=(i,m,f)=>({id:'rp'+i,date:hoy,min:m,ts:Date.now()-(100-i)*1000,bib:NO_BIB,focus:f||'ok',esp:'roble'});
      var txt=s=>{DATA.sessions=DATA.sessions.concat([s]);var h=recordSesionHTML(s);DATA.sessions.pop();return h;};
      try{
        DATA.sessions=[mk(0,30),mk(1,50),mk(2,20)];
        var t=txt(mk(3,65));
        if(!/Nuevo récord personal/.test(t)||!/1h 5m seguidos/.test(t)||!/antes 50m/.test(t))return 'no celebra el récord: '+t;
        if(txt(mk(4,50)))return 'celebra un empate';
        if(txt(mk(5,40)))return 'sale algo sin récord';
        if(txt(mk(6,70,'withered')))return 'celebra un árbol marchito';
        DATA.sessions=[mk(0,5),mk(1,8)];
        if(txt(mk(7,60)))return 'celebra con menos de 3 sesiones previas';
        DATA.sessions=[mk(0,5),mk(1,8),mk(2,9)];
        if(txt(mk(8,12)))return 'celebra una sesión de menos de 15 min';
        DATA.sessions=[mk(0,30),mk(1,50),mk(2,20)];var s=mk(9,90);DATA.sessions.push(s);
        pedirValoracion(s,null);var c=document.querySelector('#modalRoot .record-ses');
        if(!c||!/1h 30m seguidos/.test(c.innerText))return 'no sale en «Sesión terminada»';
        if(!/liga-oro/.test(($('recordCss')||{}).textContent||''))return 'sin estilos con tokens';
        closeModal();DATA.sessions=[mk(0,30),mk(1,50),mk(2,20),mk(3,10)];s=DATA.sessions[3];
        pedirValoracion(s,null);if(document.querySelector('#modalRoot .record-ses'))return 'sale sin récord';
        return true;
      }finally{DATA.sessions=o;closeModal();}"""),
    ("contador de minutos en «Sesión terminada» (sube hasta los minutos reales; «Hoy llevas» solo con más sesiones hoy)", """
      await cargarExtra();
      var o=DATA.sessions,hoy=ymd(),mk=(i,m,d)=>({id:'cm'+i,date:d||hoy,min:m,ts:Date.now()-(100-i)*1000,bib:NO_BIB,focus:'ok',esp:'roble'});
      var ver=()=>{var c=document.querySelector('#modalRoot .ses-cuenta');return c?{n:c.querySelector('.sc-num'),t:c.innerText,a:c.getAttribute('aria-label')}:null;};
      try{
        DATA.sessions=[mk(0,40,'2026-01-01')];var s=mk(1,45);DATA.sessions.push(s);
        pedirValoracion(s,null);var c=ver();
        if(!c||c.n.dataset.to!=='45'||!/minutos de estudio/i.test(c.t))return 'no sale el contador: '+(c&&c.t);
        if(/Hoy llevas/.test(c.t))return '«Hoy llevas» con una sola sesión hoy';
        await new Promise(r=>setTimeout(r,2200));
        if(c.n.textContent!=='45')return 'no termina en 45: '+c.n.textContent;
        closeModal();DATA.sessions=[mk(2,85)];s=mk(3,45);DATA.sessions.push(s);
        pedirValoracion(s,null);c=ver();
        if(!c||!/Hoy llevas 2h 10m/.test(c.t)||!/hoy llevas 2h 10m/.test(c.a))return 'no suma lo de hoy: '+(c&&c.t);
        if(!/marca-a/.test(($('cuentaCss')||{}).textContent||'')||!/prefers-reduced-motion/.test($('cuentaCss').textContent))return 'sin estilos con tokens o sin reducir movimiento';
        closeModal();s=mk(4,0);DATA.sessions=[s];pedirValoracion(s,null);if(ver())return 'sale con 0 minutos';
        return true;
      }finally{DATA.sessions=o;closeModal();}"""),
    ("semillas que vuelan al marcador (con 🌰 vuelan y el contador acaba en la cifra; sin 🌰 no; con reducir movimiento, cifra directa)", """
      await cargarExtra();
      var o=DATA.sessions,sm=window.sinMovimiento,hoy=ymd(),mk=(i,m,f)=>({id:'sv'+i,date:hoy,min:m,ts:Date.now()-(100-i)*1000,bib:NO_BIB,focus:f||'ok',esp:'roble'});
      var limpia=()=>document.querySelectorAll('.saco-semillas,.semilla-vuela').forEach(x=>x.remove());
      var cierra=async s=>{limpia();DATA.sessions=[s];pedirValoracion(s,null);await new Promise(r=>setTimeout(r,200));$('sessSkip').click();};
      try{
        goView('map');await new Promise(r=>setTimeout(r,200));
        await cierra(mk(0,30));
        if(!document.querySelectorAll('.semilla-vuela').length)return 'no vuelan las semillas';
        var n=document.querySelector('.saco-semillas .seeds-n');if(!n)return 'sin marcador de semillas';
        if(n.textContent!==String(semillas()-6))return 'no empieza en la cifra de antes: '+n.textContent;
        await new Promise(r=>setTimeout(r,2000));
        if(n.textContent!==String(semillas())||semillas()<6)return 'no acaba en '+semillas()+': '+n.textContent;
        if(document.querySelectorAll('.semilla-vuela').length)return 'quedan semillas volando';
        if(!/aviso-tx/.test(($('vueloCss')||{}).textContent||'')||!/prefers-reduced-motion/.test($('vueloCss').textContent))return 'sin estilos con tokens o sin reducir movimiento';
        await cierra(mk(1,4));if(document.querySelector('.semilla-vuela,.saco-semillas'))return 'vuela sin semillas ganadas';
        await cierra(mk(2,30,'withered'));if(document.querySelector('.semilla-vuela,.saco-semillas'))return 'vuela con el árbol marchito';
        window.sinMovimiento=()=>true;
        await cierra(mk(3,30));
        if(document.querySelector('.semilla-vuela'))return 'vuela con reducir movimiento';
        n=document.querySelector('.saco-semillas .seeds-n');
        if(!n||n.textContent!==String(semillas()))return 'con reducir movimiento no da la cifra final: '+(n&&n.textContent);
        return true;
      }finally{window.sinMovimiento=sm;DATA.sessions=o;closeModal();limpia();}"""),
    ("pista bajo el saco de semillas: «¡A N 🌰 de plantar <especie>!» solo a 1-10 🌰, en positivo, y se repinta al gastar", """
      await cargarExtra();
      var k=['sessions','semillasPremio','semillasGastadas','especiesCompradas','especiesAvisadas','especieAvisoPend','especie'],o={};k.forEach(x=>o[x]=DATA[x]);
      var sm=window.sinMovimiento,st=window.showToast,at=window.abrirTienda,hoy=ymd(),mk=i=>({id:'ps'+i,date:hoy,min:30,ts:Date.now()-(100-i)*1000,bib:NO_BIB,focus:'ok',esp:'roble'});
      var limpia=()=>document.querySelectorAll('.saco-semillas,.semilla-vuela').forEach(x=>x.remove());
      var pista=()=>{var p=document.querySelector('.saco-semillas .saco-pista');return p?p.innerText:'';};
      var cierra=async(i,premio)=>{limpia();DATA.semillasPremio=premio;DATA.especieAvisoPend=0;var s=mk(i);DATA.sessions=[s];pedirValoracion(s,null);await new Promise(r=>setTimeout(r,200));$('sessSkip').click();await new Promise(r=>setTimeout(r,50));};
      try{
        window.sinMovimiento=()=>true;window.showToast=()=>{};window.abrirTienda=()=>{};
        DATA.semillasGastadas=0;DATA.especiesCompradas=[];DATA.especiesAvisadas=['cerezo','abeto','arce','palmera','cactus'];
        goView('map');await new Promise(r=>setTimeout(r,200));
        await cierra(0,50); // 50 + 6 = 56 → faltan 4 para el cerezo (60)
        var t=pista();if(!/🌸/.test(t)||!/A 4 🌰 de plantar cerezos/.test(t))return 'sin la pista a 4: '+t;
        if(/te faltan/i.test(t))return 'redacción en negativo: '+t;
        if(!/4 🌰 de plantar cerezos/.test(document.querySelector('.saco-semillas').getAttribute('aria-label')||''))return 'el lector de pantalla no la oye';
        var css=($('vueloCss')||{}).textContent||'';if(!/\\.saco-pista\\{[^}]*var\\(--suave\\)/.test(css)||/saco-pista[^}]*(red|#[0-9a-f]{3,6}|--peligro|--error)/i.test(css))return 'la pista no usa tokens neutros';
        await cierra(1,40);if(pista())return 'sale a 14 🌰: '+pista();
        await cierra(2,54);if(pista())return 'sale con la especie ya alcanzable: '+pista();
        DATA.especiesCompradas=ESPECIES.filter(e=>e.precio>0).map(e=>e.id);await cierra(3,50);if(pista())return 'sale con todas compradas';
        DATA.especiesCompradas=[];await cierra(4,138); // 144: nada que mostrar; al comprar el cerezo quedan 84 → a 6 del abeto (90)
        if(pista())return 'sale sin estar a ≤ 10';
        comprarEspecie('cerezo',document.querySelector('.saco-semillas'));
        if(!/🌲/.test(pista())||!/A 6 🌰 de plantar abetos nevados/.test(pista()))return 'no se repinta al gastar: '+pista();
        return true;
      }finally{window.sinMovimiento=sm;window.showToast=st;window.abrirTienda=at;k.forEach(x=>DATA[x]=o[x]);closeModal();limpia();renderForest();renderSemillas();saveUserData();}"""),
    ("«¡Qué alegría verte!» al volver tras ≥ 3 días (horas y árbol más grande, sin hablar de la racha perdida)", """
      await cargarExtra();
      var o=DATA.sessions,uf=DATA.usedFreezeDates,dia=n=>{var d=new Date();d.setDate(d.getDate()-n);return ymd(d);};
      var mk=(i,n,m,f)=>({id:'qa'+i,date:dia(n),min:m,ts:Date.now()-n*864e5,bib:NO_BIB,focus:f||'ok',esp:'roble'});
      var ver=()=>{closeModal();pintarBienvenidaDiaria();var m=document.querySelector('#modalRoot .bienvenida');return m?m.innerText:'';};
      try{
        DATA.usedFreezeDates=[];
        DATA.sessions=[mk(0,9,40),mk(1,6,95),mk(2,4,120,'withered')];
        var t=ver();
        if(!/¡Qué alegría verte/.test(t))return 'no saluda: '+t;
        if(!/4h 15m/.test(t))return 'sin el total de horas: '+t;
        if(!/gran árbol/.test(t)||!/1h 35m/.test(t)||!/bosque te espera/.test(t))return 'sin el árbol más grande: '+t;
        var cab=[...document.querySelectorAll('#modalRoot .bienvenida > h3, #modalRoot .bienvenida > .sub, #modalRoot .bv-bosque')].map(x=>x.innerText).join(' ');
        if(/racha|días sin|perdi|apag/i.test(cab))return 'habla de la racha o de los días sin estudiar: '+cab;
        if(document.querySelector('#modalRoot .bv-fuego'))return 'sale la llama';
        if(!document.querySelector('#modalRoot .bv-arbol svg'))return 'sin el dibujo del árbol';
        if(!/ev-ot-bg/.test(($('bvVueltaCss')||{}).textContent||'')||!/prefers-reduced-motion/.test($('bvVueltaCss').textContent))return 'sin estilos con tokens o sin reduced-motion';
        DATA.sessions=[mk(0,5,50,'withered')];t=ver();
        if(!/¡Qué alegría verte/.test(t)||!/sesión más larga/.test(t)||!/50m/.test(t))return 'sin árbol sano no cita la sesión más larga: '+t;
        DATA.sessions=[mk(0,9,40),mk(1,2,30)];t=ver();
        if(/Qué alegría/.test(t)||!/racha/.test(t))return 'saluda con solo 2 días sin estudiar: '+t;
        DATA.sessions=[];t=ver();
        if(/Qué alegría/.test(t)||!/racha/.test(t))return 'cambia la bienvenida sin sesiones: '+t;
        return true;
      }finally{DATA.sessions=o;DATA.usedFreezeDates=uf;closeModal();}"""),
    ("biblioteca nueva en tu mapa: aviso suave al cerrar y «📍 bibliotecas exploradas» en el Perfil", """
      var k=['sessions','misiones','acciones','hitosBosque','hitoBosquePend','especiesAvisadas','especieAvisoPend','bibNuevaPend','primerArbol','semillasPremio'],o={};
      k.forEach(x=>o[x]=DATA[x]);
      var toasts=[],st=window.showToast,cm=window.comprobarMisiones;window.showToast=m=>toasts.push([m,Date.now()]);window.comprobarMisiones=()=>{};
      var espera=ms=>new Promise(r=>setTimeout(r,ms)),hoy=ymd(),A=BIBLIOTECAS[0].nombre,B=BIBLIOTECAS[1].nombre,C=BIBLIOTECAS[2].nombre;
      var mk=(i,b,f)=>({id:'bn'+i,date:hoy,min:30,ts:Date.now()-(100-i)*1000,bib:b,focus:f||'ok',esp:'roble'});
      var nuevo=s=>{DATA.sessions.push(s);trasGuardarSesion(s);return DATA.bibNuevaPend;};
      try{
        CELEB_DIA=null;closeModal();document.querySelectorAll('.racha-overlay').forEach(x=>x.remove());
        DATA.hitosBosque=[1e9];DATA.hitoBosquePend=0;DATA.especiesAvisadas=ESPECIES.map(e=>e.id);DATA.especieAvisoPend=0;DATA.bibNuevaPend=0;
        DATA.sessions=[mk(0,A),mk(1,NO_BIB),mk(2,B,'withered')];
        openModal('<h3>Sesión terminada</h3>');
        if(nuevo(mk(3,A)))return 'avisa en una biblioteca ya conocida';
        if(nuevo(mk(4,NO_BIB)))return 'avisa sin biblioteca';
        if(nuevo(mk(5,C,'withered')))return 'avisa con un árbol marchito';
        if(nuevo(mk(6,B))!==3)return 'no prepara el aviso con 3 bibliotecas: '+DATA.bibNuevaPend;
        await espera(3400);
        if(toasts.length)return 'el aviso tapa la ventana abierta';
        closeModal();await espera(900);
        var t=toasts.map(x=>x[0]);
        if(t.length!==1||t[0]!=='📍 Biblioteca nueva en tu mapa · ya has estudiado en 3')return 'aviso mal: '+JSON.stringify(t);
        if(/falta|-\d/.test(t[0])||DATA.bibNuevaPend)return 'texto negativo o no se da por visto';
        if(nuevo(mk(7,B)))return 'repite el aviso';
        DATA.especieAvisoPend='cerezo';toasts=[];DATA.sessions.push(mk(8,BIBLIOTECAS[3].nombre));trasGuardarSesion(DATA.sessions[DATA.sessions.length-1]);
        await espera(7000);
        if(toasts.length!==2||!/ya has estudiado en 4/.test(toasts[0][0])||!/cerezos/.test(toasts[1][0])||toasts[1][1]-toasts[0][1]<2500)return 'los avisos se pisan: '+JSON.stringify(toasts);
        DATA.sessions=[mk(0,NO_BIB)];toasts=[];
        if(nuevo(mk(9,A))!==1)return 'la primera biblioteca no avisa';
        await espera(3400);if(!toasts.length||toasts[0][0]!=='📍 Biblioteca nueva en tu mapa · ¡la primera!')return 'primera mal: '+JSON.stringify(toasts);
        DATA.sessions=[mk(0,A),mk(1,B,'withered'),mk(2,NO_BIB),mk(3,A)];goView('profile');renderRecords();
        var r=$('recordsGrid').innerText;
        if(!/2\s*📍 Bibliotecas exploradas/.test(r))return 'perfil mal: '+r;
        DATA.sessions=[mk(0,NO_BIB)];renderRecords();if(/explorada/.test($('recordsGrid').innerText))return 'sale con 0 bibliotecas';
        return true;
      }finally{
        window.showToast=st;window.comprobarMisiones=cm;k.forEach(x=>DATA[x]=o[x]);CELEB_DIA=null;closeModal();
        document.querySelectorAll('.racha-overlay').forEach(x=>x.remove());renderRecords();renderForest();renderMisiones();
      }"""),
    ("sello del día: al abrir el cofre se estampa 🏵️ y el Perfil cuenta solo los días logrados", """
      var k=['misiones','sellosMisiones','cofresAbiertos','semillasPremio','streakFreezes'],o={};k.forEach(x=>o[x]=DATA[x]);
      var espera=ms=>new Promise(r=>setTimeout(r,ms)),hoy=ymd();
      try{
        await cargarExtra();goView('study');closeModal();
        DATA.sellosMisiones=['2026-10-20','2026-10-25'];
        var M=misionesDeHoy();M.cofre=false;M.ids.forEach(id=>M.hechas[id]=new Date().toISOString());renderMisiones();
        if(document.querySelector('#missionsCard .sello-dia'))return 'sale el sello sin abrir el cofre';
        abrirCofre();
        var s=DATA.sellosMisiones;
        if(s.length!==3||s[2]!==hoy)return 'no guarda la fecha: '+JSON.stringify(s);
        if(!/Sello del día · ya llevas 3 días con todas las misiones/.test($('modalRoot').innerText))return 'la ventana no cita el sello: '+$('modalRoot').innerText;
        var sd=document.querySelector('#missionsCard .sello-dia');
        if(!sd||!/Sello del día conseguido/.test($('missionsCard').innerText))return 'la tarjeta del cofre no lleva el sello';
        if(sd.classList.contains('estampa'))return 'se estampa debajo de la ventana';
        closeModal();await espera(50);
        if(!document.querySelector('#missionsCard .sello-dia.estampa'))return 'no se estampa al cerrar la ventana';
        abrirCofre();M.cofre=false;abrirCofre();closeModal();
        if(DATA.sellosMisiones.length!==3)return 'repite el sello del mismo día: '+DATA.sellosMisiones.length;
        goView('profile');await renderSellos();
        var t=$('sellosCard').innerText,n=document.querySelectorAll('#sellosCard .sello').length;
        if($('sellosWrap').classList.contains('hidden')||!/3\\s*días con todas las misiones/.test(t)||n!==3)return 'perfil mal: '+t+' ('+n+')';
        if(document.querySelectorAll('#sellosCard .sello')[0].innerText.indexOf(+hoy.slice(8)+'')<0)return 'el más reciente no va primero';
        if(/0 días|falta|perdi/i.test(t))return 'texto negativo';
        DATA.sellosMisiones=[hoy];await renderSellos();
        if(!/^1\\s*día con todas/.test($('sellosCard').innerText.trim()))return 'singular mal: '+$('sellosCard').innerText;
        DATA.sellosMisiones=[];await renderSellos();
        if(!$('sellosWrap').classList.contains('hidden'))return 'sale sin sellos';
        return true;
      }finally{k.forEach(x=>DATA[x]=o[x]);closeModal();renderMisiones();renderSellos();}"""),
    ("pista en el cofre del día: «¡A N 🌰 de plantar <especie>!» bajo el premio solo si quedas a 1-10 🌰 (y nada si el cofre ya te da para ella)", """
      var k=['misiones','sellosMisiones','cofresAbiertos','semillasPremio','semillasGastadas','especiesCompradas','streakFreezes','sessions'],o={};k.forEach(x=>o[x]=DATA[x]);
      var premio=20+(hashStr(ymd()+'cofre')%4)*10;
      var abre=total=>{closeModal();DATA.sessions=[];DATA.semillasGastadas=0;DATA.semillasPremio=total-premio;var M=misionesDeHoy();M.cofre=false;M.ids.forEach(id=>M.hechas[id]=new Date().toISOString());abrirCofre();var p=document.querySelector('#modalRoot .cofre-pista');return p?p.innerText:'';};
      try{
        await cargarExtra();goView('study');DATA.especiesCompradas=[];
        var t=abre(56); // con el premio, 56 → a 4 del cerezo (60)
        if(!/🌸/.test(t)||!/A 4 🌰 de plantar cerezos/.test(t))return 'sin la pista a 4: '+t;
        if(/te faltan/i.test(t))return 'redacción en negativo: '+t;
        var m=$('modalRoot').innerHTML;if(m.indexOf('cofre-pista')<m.indexOf('semillas</b>')||m.indexOf('cofre-pista')>m.indexOf('cofre-sello'))return 'la pista no va bajo el premio';
        var c=getComputedStyle(document.querySelector('.cofre-pista'));if(c.animationName!=='none'||/rgb\\(2[0-5]\\d, [0-9]{1,2}, [0-9]{1,2}\\)/.test(c.color))return 'la pista anima o es roja: '+c.color;
        if(abre(60))return 'sale con la especie ya alcanzada gracias al cofre';
        if(abre(45))return 'sale a 15 🌰';
        DATA.especiesCompradas=ESPECIES.filter(e=>e.precio>0).map(e=>e.id);if(abre(56))return 'sale con todas compradas';
        return true;
      }finally{k.forEach(x=>DATA[x]=o[x]);closeModal();renderMisiones();renderSemillas();saveUserData();}"""),
    ("🧊 dice cuántos tienes: el toast de la racha añade «· ya tienes el máximo (3)» al llegar a 3 y el cofre con 🧊 dice «Ya tienes N de 3» en --suave", """
      var k=['sessions','streakFreezes','lastFreezeEarnedAtStreak','usedFreezeDates','misiones','sellosMisiones','cofresAbiertos','semillasPremio'],o={};k.forEach(x=>o[x]=DATA[x]);
      var espera=ms=>new Promise(r=>setTimeout(r,ms)),toasts=[],st=window.showToast,hs=window.hashStr,sm=window.sinMovimiento;
      var dia=a=>{var d=new Date();d.setDate(d.getDate()-a);return ymd(d);};
      var racha=(f)=>{toasts=[];DATA.sessions=[0,1,2,3,4,5,6].map(a=>({id:'hz'+a,date:dia(a),min:30,ts:Date.now()-a*86400000,bib:NO_BIB,focus:'ok',esp:'roble'}));
        DATA.streakFreezes=f;DATA.lastFreezeEarnedAtStreak=0;DATA.usedFreezeDates=[];checkStreakFreezes();return toasts.join('|');};
      var abre=(conHielo,f)=>{closeModal();DATA.streakFreezes=f;window.hashStr=x=>x===ymd()?(conHielo?3:1):hs(x);
        var M=misionesDeHoy();M.cofre=false;M.ids.forEach(id=>M.hechas[id]=new Date().toISOString());abrirCofre();window.hashStr=hs;
        return document.querySelector('#modalRoot .cofre-hielo-n');};
      try{
        await cargarExtra();window.sinMovimiento=()=>true;window.showToast=m=>toasts.push(m);goView('study');
        var t=racha(2);
        if(t!=='🧊 Has ganado un congelador de racha (racha de 7 días) · ya tienes el máximo (3)'||DATA.streakFreezes!==3)return 'toast al llegar a 3: '+t;
        t=racha(1);
        if(t!=='🧊 Has ganado un congelador de racha (racha de 7 días)'||DATA.streakFreezes!==2)return 'toast con < 3 cambia: '+t;
        var l=abre(true,1);
        if(DATA.streakFreezes!==2||!l||l.innerText.trim()!=='Ya tienes 2 de 3')return 'cofre con 🧊: '+(l&&l.innerText)+' ('+DATA.streakFreezes+')';
        var m=$('modalRoot').innerHTML;if(m.indexOf('cofre-hielo-n')<m.indexOf('cofre-hielo"')||m.indexOf('cofre-hielo-n')>m.indexOf('cofre-sello'))return 'la línea no va bajo «🧊 un congelador de racha»';
        var c=document.createElement('i');c.style.color='var(--suave)';document.body.appendChild(c);var suave=getComputedStyle(c).color;c.remove();
        if(getComputedStyle(l).color!==suave)return 'no es --suave: '+getComputedStyle(l).color;
        if(document.documentElement.scrollWidth>innerWidth)return 'desborda en horizontal';
        l=abre(true,2);if(!l||!/^Ya tienes 3 de 3/.test(l.innerText.trim()))return 'cofre con 🧊 hasta 3: '+(l&&l.innerText);
        if(abre(false,1)||DATA.streakFreezes!==1)return 'sale la línea sin 🧊 en el cofre';
        if(/falta|pierdes|perder/i.test(t+l.innerText))return 'mete presión';
        return true;
      }finally{window.showToast=st;window.hashStr=hs;closeModal();while(VUELO.t||VUELO.n||VUELO.h)await espera(250);window.sinMovimiento=sm;
        k.forEach(x=>DATA[x]=o[x]);renderMisiones();renderSemillas();renderRacha();saveUserData();}"""),
    ("las 🌰 de las misiones y del cofre vuelan al marcador (una vez; con reducir movimiento, solo la cifra)", """
      await cargarExtra();
      var k=['misiones','acciones','sellosMisiones','cofresAbiertos','semillasPremio','streakFreezes'],o={};k.forEach(x=>o[x]=DATA[x]);
      var espera=ms=>new Promise(r=>setTimeout(r,ms)),st=window.showToast,sm=window.sinMovimiento,vs=window.volarSemillas,vuelos=[];
      var limpia=()=>document.querySelectorAll('.saco-semillas,.semilla-vuela').forEach(x=>x.remove());
      var calma=async()=>{for(var i=0;i<40&&(VUELO.n||VUELO.t);i++)await espera(250);await espera(2600);limpia();};
      window.showToast=()=>{};window.volarSemillas=function(r,n){vuelos.push([r,n]);return vs.apply(this,arguments);};
      try{
        closeModal();goView('study');await calma();vuelos=[];
        DATA.misiones={fecha:ymd(),ids:['agenda','largo','m90'],hechas:{},cofre:false};DATA.acciones={fecha:ymd()};renderMisiones();
        registrarAccion('agenda');await espera(500);
        if(!document.querySelectorAll('.semilla-vuela').length)return 'no vuelan las semillas de la misión';
        if(vuelos.length!==1||vuelos[0][1]!==10||!vuelos[0][0]||!vuelos[0][0].width)return 'vuelo mal: '+JSON.stringify(vuelos.map(v=>v[1]));
        await calma();comprobarMisiones();registrarAccion('agenda');renderMisiones();await espera(900);
        if(vuelos.length!==1)return 'vuela dos veces por la misma misión: '+vuelos.length;
        window.sinMovimiento=()=>true;DATA.misiones.hechas={};vuelos=[];
        comprobarMisiones();await espera(500);
        if(document.querySelector('.semilla-vuela'))return 'vuela con reducir movimiento';
        var n=document.querySelector('.seeds-n.sv-rebote,.saco-semillas .seeds-n');
        if(vuelos.length!==1||!document.querySelector('.saco-semillas .seeds-n')&&!n)return 'con reducir movimiento no da la cifra';
        if(document.querySelector('.saco-semillas .seeds-n')&&document.querySelector('.saco-semillas .seeds-n').textContent!==String(semillas()))return 'cifra final mal';
        window.sinMovimiento=sm;await calma();vuelos=[];
        var M=misionesDeHoy();M.ids.forEach(id=>M.hechas[id]=M.hechas[id]||new Date().toISOString());M.cofre=false;renderMisiones();
        abrirCofre();await espera(900);
        if(vuelos.length)return 'vuela debajo de la ventana del cofre';
        closeModal();await espera(1200);
        if(vuelos.length!==1||vuelos[0][1]<20)return 'el cofre no vuela al cerrar: '+vuelos.length;
        await calma();abrirCofre();closeModal();await espera(1200);
        if(vuelos.length!==1)return 'el cofre vuela dos veces';
        return true;
      }finally{window.showToast=st;window.sinMovimiento=sm;window.volarSemillas=vs;k.forEach(x=>DATA[x]=o[x]);closeModal();limpia();renderMisiones();renderSemillas();}"""),
    ("el 🧊 del cofre vuela a la pastilla de la racha al cerrar la ventana (una vez, tras las 🌰; con reducir movimiento, solo la cifra)", """
      await cargarExtra();
      var k=['misiones','acciones','sellosMisiones','cofresAbiertos','semillasPremio','streakFreezes'],o={};k.forEach(x=>o[x]=DATA[x]);
      var espera=ms=>new Promise(r=>setTimeout(r,ms)),st=window.showToast,sm=window.sinMovimiento,hs=window.hashStr,vh=window.volarHielo,vuelos=[];
      var limpia=()=>document.querySelectorAll('.saco-semillas,.semilla-vuela,.pill-hielo').forEach(x=>x.remove());
      var calma=async()=>{for(var i=0;i<40&&(VUELO.n||VUELO.h||VUELO.t);i++)await espera(250);await espera(2600);limpia();};
      var cofre=hielo=>{window.hashStr=x=>x===ymd()?(hielo?0:1):hs(x);var M=misionesDeHoy();M.ids.forEach(id=>M.hechas[id]=M.hechas[id]||new Date().toISOString());M.cofre=false;renderMisiones();abrirCofre();window.hashStr=hs;};
      window.showToast=()=>{};window.volarHielo=function(r,e){vuelos.push([r,e]);return vh.apply(this,arguments);};
      try{
        closeModal();goView('study');await calma();vuelos=[];DATA.streakFreezes=0;renderRacha();
        cofre(true);await espera(700);
        if(DATA.streakFreezes!==1||!/🧊 un congelador/.test($('modalRoot').innerText))return 'el cofre no regala el congelador';
        if(vuelos.length||document.querySelector('.hielo-vuela'))return 'vuela debajo de la ventana del cofre';
        closeModal();await espera(700);
        if(vuelos.length!==1||!vuelos[0][0]||!vuelos[0][0].width||!(vuelos[0][1]>0))return 'no vuela al cerrar o no va tras las 🌰: '+JSON.stringify(vuelos.map(v=>v[1]));
        if(!document.querySelector('.hielo-vuela'))return 'no se ve el 🧊 volando';
        await espera(1300);
        var c=document.querySelector('.pill-hielo');
        if(!c||c.textContent.trim()!=='🧊 1')return 'la pastilla no enseña 🧊 1: '+(c&&c.textContent);
        if(document.querySelector('.hielo-vuela'))return 'queda un 🧊 volando';
        if(!/1 congelador/.test($('streakPill').getAttribute('aria-label')||''))return 'el lector de pantalla no lo oye';
        var css=($('hieloCss')||{}).textContent||'';
        if(!/ev-ta-bg/.test(css)||!/prefers-reduced-motion/.test(css)||/(\\bred\\b|#[0-9a-f]{3,6}|--peligro|--fuego)/i.test(css))return 'sin tokens calmados o sin reducir movimiento';
        await calma();vuelos=[];abrirCofre();closeModal();await espera(1200);
        if(vuelos.length)return 'el congelador vuela dos veces';
        await calma();cofre(false);closeModal();await espera(1200);
        if(vuelos.length||document.querySelector('.hielo-vuela'))return 'vuela sin congelador';
        await calma();window.sinMovimiento=()=>true;DATA.streakFreezes=2;volarHielo(null,0);
        if(document.querySelector('.hielo-vuela'))return 'vuela con reducir movimiento';
        c=document.querySelector('.pill-hielo');if(!c||c.textContent.trim()!=='🧊 2'||c.classList.contains('ph-rebote'))return 'con reducir movimiento no da solo la cifra';
        return true;
      }finally{window.showToast=st;window.sinMovimiento=sm;window.hashStr=hs;window.volarHielo=vh;k.forEach(x=>DATA[x]=o[x]);closeModal();limpia();renderMisiones();renderSemillas();renderRacha();}"""),
    ("cuando un 🧊 salva la racha, la pastilla enseña «🧊 ✓» un instante en azul calmado (sin hablar del día perdido; con reducir movimiento, quieta)", """
      await cargarExtra();
      var k=['sessions','streakFreezes','usedFreezeDates','lastFreezeEarnedAtStreak'],o={};k.forEach(x=>o[x]=DATA[x]);
      var espera=ms=>new Promise(r=>setTimeout(r,ms)),st=window.showToast,sm=window.sinMovimiento,avisos=[];
      var limpia=()=>document.querySelectorAll('.pill-hielo').forEach(x=>x.remove());
      var hace=n=>{var d=new Date();d.setDate(d.getDate()-n);return ymd(d);};
      var salva=()=>{DATA.sessions=[{id:'zh1',date:hace(2),min:40,ts:Date.now()-2*864e5,bib:NO_BIB}];DATA.usedFreezeDates=[];DATA.streakFreezes=1;DATA.lastFreezeEarnedAtStreak=0;renderRacha();checkStreakFreezes();};
      window.showToast=t=>avisos.push(t);
      try{
        closeModal();goView('study');while(VUELO.t||VUELO.n||VUELO.h)await espera(250);await espera(1500);limpia();
        salva();
        if(DATA.streakFreezes!==0||DATA.usedFreezeDates.indexOf(hace(1))<0)return 'el congelador no cubre el hueco';
        await espera(800);
        var c=document.querySelector('.pill-hielo');
        if(!c||c.textContent.trim()!=='🧊 ✓')return 'la pastilla no enseña 🧊 ✓: '+(c&&c.textContent);
        if(!/a salvo/.test($('streakPill').getAttribute('aria-label')||''))return 'el lector de pantalla no lo oye';
        if(/perd|falt|ayer/i.test(c.textContent+$('streakPill').getAttribute('aria-label')))return 'habla del día perdido';
        var cs=getComputedStyle(c),rojo=/rgb\\(2[0-5]\\d, [0-9]{1,2}, [0-9]{1,2}\\)/;
        if(rojo.test(cs.color)||rojo.test(cs.backgroundColor))return 'la insignia es roja';
        await espera(4200);
        if(document.querySelector('.pill-hielo'))return 'la insignia no se va';
        window.sinMovimiento=()=>true;salva();await espera(800);
        c=document.querySelector('.pill-hielo');
        if(!c||c.textContent.trim()!=='🧊 ✓'||c.classList.contains('ph-rebote'))return 'con reducir movimiento no queda quieta';
        return true;
      }finally{window.showToast=st;window.sinMovimiento=sm;k.forEach(x=>DATA[x]=o[x]);closeModal();limpia();renderRacha();}"""),
    ("tocar la insignia «🧊 N» abre la racha con «🧊 Congeladores» resaltada 1 s con borde --acento (botón accesible de 44 px; con reducir movimiento, sin transición)", """
      await cargarExtra();
      var k=['streakFreezes'],o={};k.forEach(x=>o[x]=DATA[x]);
      var espera=ms=>new Promise(r=>setTimeout(r,ms)),sm=window.sinMovimiento;
      var limpia=()=>document.querySelectorAll('.pill-hielo').forEach(x=>x.remove());
      try{
        closeModal();goView('study');while(VUELO.t||VUELO.n||VUELO.h)await espera(250);limpia();
        window.sinMovimiento=()=>true;DATA.streakFreezes=2;renderRacha();volarHielo(null,0);
        var b=document.querySelector('.pill-hielo'),p=$('streakPill');
        if(!b||b.tagName!=='BUTTON'||p.contains(b))return 'la insignia no es un botón propio (fuera de #streakPill)';
        if(!/^Tienes 2 congeladores: ver racha$/.test(b.getAttribute('aria-label')||''))return 'aria-label: '+b.getAttribute('aria-label');
        var r=b.getBoundingClientRect(),q=p.getBoundingClientRect(),c=getComputedStyle(b,'::before');
        if(Math.min(parseFloat(c.width)||0,parseFloat(c.height)||0)<44)return 'área táctil < 44 px';
        if(r.height>30||Math.abs(r.right-(q.right+8))>1.5||Math.abs(r.top-(q.top-9))>1.5)return 'cambia de aspecto o de sitio: '+[r.height,r.right-q.right,r.top-q.top];
        if(getComputedStyle(b).pointerEvents==='none')return 'no se puede tocar';
        b.click();await espera(50);
        var f=document.querySelector('#modalRoot .racha-modal .rs-hielo');
        if(!f||!/Congeladores/.test(f.innerText)||!/🧊 2/.test(f.innerText))return 'no abre la racha con la fila de congeladores';
        if(!f.classList.contains('rs-foco'))return 'la fila no está resaltada';
        if(!/108, 92, 231/.test(getComputedStyle(f).outlineColor))return 'el borde no es --acento: '+getComputedStyle(f).outlineColor;
        var rm=[].some.call(document.styleSheets,sh=>{try{return [].some.call(sh.cssRules,x=>x.media&&/reduced-motion/.test(x.media.mediaText)&&/rs-hielo[^}]*transition:\\s*none/.test(x.cssText));}catch(e){return false;}});
        if(!rm)return 'sin regla de reducir movimiento para el resaltado';
        var rojo=/rgb\\(2[0-5]\\d, [0-9]{1,2}, [0-9]{1,2}\\)/;if(rojo.test(getComputedStyle(f).backgroundColor))return 'es roja';
        await espera(RACHA_FOCO_MS+150);
        if(f.classList.contains('rs-foco'))return 'el resaltado no se va';
        closeModal();abrirRacha();
        if(document.querySelector('#modalRoot .rs-foco'))return 'se resalta al abrir la racha desde la pastilla';
        closeModal();await espera(3600);
        if(document.querySelector('.pill-hielo'))return 'la insignia no se va';
        return true;
      }finally{window.sinMovimiento=sm;clearTimeout(abrirRacha.t);k.forEach(x=>DATA[x]=o[x]);closeModal();limpia();renderRacha();}"""),
    ("la ventana de la racha dice bajo «🧊 Congeladores» cómo se gana uno (cada 7 días seguidos y a veces en el cofre, máx. 3) en --suave; con 3, «Tienes el máximo (3)»", """
      await cargarExtra();
      var k=['streakFreezes'],o={};k.forEach(x=>o[x]=DATA[x]);
      try{
        closeModal();DATA.streakFreezes=1;abrirRacha("hielo");
        var l=document.querySelector('#modalRoot .racha-stats .rs-hielo-como'),h=document.querySelector('#modalRoot .rs-hielo');
        if(!l)return 'no hay línea bajo las cifras';
        if(l.innerText.trim()!=='Ganas uno cada 7 días seguidos y, a veces, en el cofre del día (máx. 3).')return 'texto: '+l.innerText;
        if(!h||!h.classList.contains('rs-foco')||h.contains(l))return 'rompe el resaltado de la casilla 🧊';
        var hr=h.getBoundingClientRect(),lr=l.getBoundingClientRect();if(lr.top<hr.bottom-1)return 'no va debajo de las cifras';
        var c=document.createElement('i');c.style.color='var(--suave)';document.body.appendChild(c);var suave=getComputedStyle(c).color;c.remove();
        if(getComputedStyle(l).color!==suave)return 'no es --suave: '+getComputedStyle(l).color;
        if(document.documentElement.scrollWidth>innerWidth)return 'desborda en horizontal';
        closeModal();DATA.streakFreezes=3;abrirRacha();
        l=document.querySelector('#modalRoot .rs-hielo-como');
        if(!l||!/^Tienes el máximo \(3\)/.test(l.innerText.trim()))return 'con 3: '+(l&&l.innerText);
        if(/falta|pierdes|perder/i.test(l.innerText))return 'mete presión';
        return true;
      }finally{clearTimeout(abrirRacha.t);k.forEach(x=>DATA[x]=o[x]);closeModal();}"""),
    ("barrita de misiones bajo el cronómetro: «🎯 2/3 misiones · la siguiente en 7 min» solo si falta ≤ 15 min de una misión de minutos", """
      var k=['misiones','sessions','acciones'],o={};k.forEach(x=>o[x]=DATA[x]);
      var t0={running:studyTimer.running,start:studyTimer.start,bibIndex:studyTimer.bibIndex,tick:studyTimer.tick},sh=window.statsHoy,el=$('misCerca');
      var viejo=new Date(Date.now()-5*3600000).toISOString();
      var pinta=(min,ids,hechas)=>{studyTimer.running=true;studyTimer.tick=t0.tick||1;studyTimer.bibIndex=-1;studyTimer.start=Date.now()-min*60000-500;
        DATA.misiones={fecha:ymd(),ids:ids,hechas:hechas,cofre:false};el._clave=null;renderMisCerca();
        return el.classList.contains('hidden')?'':el.innerText.trim();};
      try{
        closeModal();goView('study');DATA.sessions=[];DATA.acciones={fecha:ymd()};
        if(!el||el.previousElementSibling!==$('studyTimer'))return 'la barrita no va bajo el tiempo';
        var t=pinta(18,['m25','agenda','social'],{agenda:viejo,social:viejo});
        if(!/🎯 2\\/3 misiones · la siguiente en 7 min/.test(t))return 'texto mal: '+t;
        if(el.getAttribute('aria-live')||el.closest('[aria-live]'))return 'anuncia cada minuto con aria-live';
        var sr=el.querySelector('.sr-solo');if(!sr||!el.querySelector('[aria-hidden="true"]')||/min/.test(sr.textContent))return 'falta el resumen estable para lectores';
        var c=getComputedStyle(el),rojo=/rgb\\(2[0-5]\\d, [0-9]{1,2}, [0-9]{1,2}\\)/;
        if(rojo.test(c.color)||rojo.test(getComputedStyle(el.querySelector('b')).color))return 'la barrita es roja';
        if(!/px/.test(c.borderTopLeftRadius)||parseFloat(c.borderTopLeftRadius)<100)return 'no es una píldora --r-pill';
        // solo recalcula al cambiar el minuto (va con el tick, sin trabajo extra cada segundo)
        var n=0;window.statsHoy=function(){n++;return sh.apply(this,arguments);};renderMisCerca();renderMisCerca();window.statsHoy=sh;
        if(n)return 'recalcula sin cambiar el minuto';
        if(pinta(11,['m25','agenda','social'],{}).indexOf('0/3')<0)return 'no cuenta 0/3';
        if(pinta(5,['m25','agenda','social'],{}))return 'sale a 20 min';
        if(pinta(30,['agenda','social','pomo'],{}))return 'sale sin misión de minutos';
        if(!/la siguiente en 3 min/.test(pinta(42,['largo','m25','agenda'],{m25:viejo})))return 'no ve la sesión larga a 3 min';
        // al cumplir una misión durante la sesión lo refleja (3 min) y luego desaparece
        var hecha=()=>new Date(Date.now()-60000).toISOString();
        t=pinta(26,['m25','agenda','pomo'],{m25:hecha(),agenda:viejo});
        if(!/✅ 2\\/3 misiones · ¡una más hecha!/.test(t)||!el.classList.contains('hecha'))return 'no refleja la misión cumplida: '+t;
        t=pinta(26,['m25','agenda','social'],{m25:hecha(),agenda:viejo,social:viejo});
        if(!/3\\/3 misiones · tu cofre te espera/.test(t))return 'no avisa del cofre: '+t;
        if(pinta(30,['m25','agenda','pomo'],{m25:new Date(Date.now()-4*60000).toISOString(),agenda:viejo}))return 'no desaparece tras cumplirla';
        if(!/la siguiente en 15 min/.test(pinta(75,['m90','m25','agenda'],{m25:viejo})))return 'no sale justo a 15 min';
        if(/cuenta atrás|pierdes|corre|rápido/i.test(el.innerText))return 'mete presión';
        studyTimer.running=false;el._clave=null;renderMisCerca();
        if(!el.classList.contains('hidden'))return 'sigue sin sesión';
        // el propio tick del cronómetro la pinta
        studyTimer.running=true;studyTimer.start=Date.now()-18*60000;DATA.misiones={fecha:ymd(),ids:['m25','agenda','social'],hechas:{agenda:viejo,social:viejo},cofre:false};el._clave=null;
        var si=window.setInterval,nuevos=0;window.setInterval=function(){nuevos++;return si.apply(this,arguments);};
        try{updateTimers();}finally{window.setInterval=si;}
        if(nuevos)return 'crea intervalos nuevos';
        if(!/2\\/3 misiones · la siguiente en 7 min/.test(el.innerText))return 'el tick no la actualiza';
        return true;
      }finally{window.statsHoy=sh;studyTimer.running=t0.running;studyTimer.start=t0.start;studyTimer.bibIndex=t0.bibIndex;studyTimer.tick=t0.tick;
        k.forEach(x=>DATA[x]=o[x]);el&&(el._clave=null);renderStudy();}"""),
    ("minicronómetro: «🎯 7 min» junto al tiempo con el mismo dato que la barrita, y nada si no aplica", """
      var k=['misiones','sessions','acciones'],o={};k.forEach(x=>o[x]=DATA[x]);
      var t0={running:studyTimer.running,start:studyTimer.start,bibIndex:studyTimer.bibIndex,tick:studyTimer.tick},el=$('misCerca'),mi=$('miniMis'),ms=$('miniStudy');
      var viejo=new Date(Date.now()-5*3600000).toISOString(),oculto0=ms.classList.contains('hidden');
      var pinta=(min,ids,hechas)=>{studyTimer.running=true;studyTimer.tick=t0.tick||1;studyTimer.bibIndex=-1;studyTimer.start=Date.now()-min*60000-500;
        DATA.misiones={fecha:ymd(),ids:ids,hechas:hechas,cofre:false};el._clave=null;
        var si=window.setInterval,n=0;window.setInterval=function(){n++;return si.apply(this,arguments);};
        try{updateTimers();}finally{window.setInterval=si;}
        if(n)throw new Error('crea intervalos nuevos');
        var v=mi.querySelector('[aria-hidden="true"]');return mi.classList.contains('hidden')||!v?'':v.textContent.trim();};
      try{
        closeModal();goView('map');DATA.sessions=[];DATA.acciones={fecha:ymd()};ms.classList.remove('hidden');
        if(!mi||mi.parentElement.querySelector('#miniTime')!==$('miniTime'))return 'no va junto al tiempo';
        var t=pinta(18,['m25','agenda','social'],{agenda:viejo,social:viejo});
        if(t!=='🎯 7 min')return 'texto mal: '+t;
        if(mi.getAttribute('aria-live')||mi.closest('[aria-live]'))return 'anuncia cada minuto con aria-live';
        if(!mi.querySelector('[aria-hidden="true"]')||/\d/.test(mi.querySelector('.sr-solo').textContent))return 'falta el texto estable para lectores';
        var c=getComputedStyle(mi),rojo=/rgb\(2[0-5]\d, [0-9]{1,2}, [0-9]{1,2}\)/;
        if(rojo.test(c.color)||rojo.test(c.backgroundColor))return 'es roja';
        if(parseFloat(c.borderTopLeftRadius)<100)return 'no es una píldora --r-pill';
        var r=ms.getBoundingClientRect();if(r.left<0||r.right>innerWidth||document.documentElement.scrollWidth>innerWidth)return 'rompe el ancho: '+Math.round(r.left)+'–'+Math.round(r.right);
        if(!/2\/3 misiones · la siguiente en 7 min/.test(el.innerText))return 'no cuadra con la barrita';
        if(!/✅ 2\/3/.test(pinta(26,['m25','agenda','pomo'],{m25:new Date(Date.now()-60000).toISOString(),agenda:viejo}))||!mi.classList.contains('hecha'))return 'no refleja la misión cumplida';
        if(pinta(5,['m25','agenda','social'],{}))return 'sale a 20 min';
        if(pinta(30,['agenda','social','pomo'],{}))return 'sale sin misión de minutos';
        if(/cuenta atrás|pierdes|corre|rápido/i.test(mi.innerText))return 'mete presión';
        studyTimer.running=false;el._clave=null;renderMisCerca();
        if(!mi.classList.contains('hidden')||mi.innerText.trim())return 'sigue sin sesión';
        return true;
      }finally{await new Promise(r=>setTimeout(r,300)); // deja que el mapa haga su invalidateSize (120 ms) mientras se ve
        studyTimer.running=t0.running;studyTimer.start=t0.start;studyTimer.bibIndex=t0.bibIndex;studyTimer.tick=t0.tick;
        k.forEach(x=>DATA[x]=o[x]);el&&(el._clave=null);ms.classList.toggle('hidden',oculto0);renderMisCerca();renderStudy();}"""),
    ("tocar «🎯 7 min» o la barrita abre Estudio con la fila de la misión cerca resaltada un momento y a la vista", """
      var k=['misiones','sessions','acciones'],o={};k.forEach(x=>o[x]=DATA[x]);
      var t0={running:studyTimer.running,start:studyTimer.start,bibIndex:studyTimer.bibIndex,tick:studyTimer.tick},el=$('misCerca'),mi=$('miniMis'),ms=$('miniStudy');
      var viejo=new Date(Date.now()-5*3600000).toISOString(),oculto0=ms.classList.contains('hidden'),espera=n=>new Promise(r=>setTimeout(r,n));
      var prepara=(min,hechas)=>{studyTimer.running=true;studyTimer.tick=t0.tick||1;studyTimer.bibIndex=-1;studyTimer.start=Date.now()-min*60000-500;
        DATA.misiones={fecha:ymd(),ids:['m25','agenda','social'],hechas:hechas,cofre:false};el._clave=null;renderMisCerca();};
      var visible=f=>{var r=f.getBoundingClientRect(),v=$('viewStudy').getBoundingClientRect();return r.height>0&&r.top>=v.top-1&&r.bottom<=v.bottom+1;};
      var comprueba=async(b,quien)=>{
        if(b.tagName!=='BUTTON'||!/misiones de hoy/i.test(b.getAttribute('aria-label')||''))return quien+' no es un botón con etiqueta clara';
        var r=b.getBoundingClientRect(),c=getComputedStyle(b,'::before');if(Math.max(r.height,parseFloat(c.height)||0)<44)return quien+' área táctil < 44 px';
        $('viewStudy').scrollTop=9999;b.click();
        if($('viewStudy').classList.contains('hidden'))return quien+' no abre Estudio';
        var f=document.querySelector('#missionsCard [data-m="m25"]');
        if(!f||!f.classList.contains('mis-foco'))return quien+' no resalta la fila';
        if(!/108, 92, 231/.test(getComputedStyle(f).outlineColor))return quien+" el borde no es --acento";
        if(document.querySelectorAll('#missionsCard .mis-foco').length!==1)return quien+' resalta más de una fila';
        await espera(800);if(!visible(f))return quien+' la fila no queda a la vista';
        await espera(MIS_FOCO_MS-600);if(f.isConnected&&f.classList.contains('mis-foco')||document.querySelector('#missionsCard .mis-foco'))return quien+' el resaltado no se va';
        return '';};
      try{
        closeModal();goView('map');DATA.sessions=[];DATA.acciones={fecha:ymd()};ms.classList.remove('hidden');
        prepara(18,{agenda:viejo,social:viejo});
        if(mi.classList.contains('hidden'))return 'no sale «🎯 7 min»';
        var e=await comprueba(mi,'#miniMis');if(e)return e;
        goView('study');prepara(18,{agenda:viejo,social:viejo});
        if(el.classList.contains('hidden'))return 'no sale la barrita';
        e=await comprueba(el,'#misCerca');if(e)return e;
        // sin misión cerca («✅ 2/3»): solo lleva a la tarjeta, sin resaltar nada
        goView('map');prepara(26,{m25:new Date(Date.now()-60000).toISOString(),agenda:viejo});
        if(!/✅ 2\\/3/.test(mi.innerText))return 'no sale «✅ 2/3»';
        $('viewStudy').scrollTop=9999;mi.click();await espera(800);
        if($('viewStudy').classList.contains('hidden'))return '«✅ 2/3» no abre Estudio';
        if(document.querySelector('#missionsCard .mis-foco'))return 'resalta sin misión cerca';
        if(!visible($('missionsCard').querySelector('.mis-head')))return 'no lleva a «Misiones de hoy»';
        return true;
      }finally{studyTimer.running=t0.running;studyTimer.start=t0.start;studyTimer.bibIndex=t0.bibIndex;studyTimer.tick=t0.tick;MIS_FOCO={id:'',hasta:0};
        k.forEach(x=>DATA[x]=o[x]);el&&(el._clave=null);ms.classList.toggle('hidden',oculto0);goView('map');await espera(300);renderMisCerca();renderStudy();}"""),
    ("junto a la fila resaltada, «⏱️ N min más y es tuya · +10 🌰» con cifras reales, que se va con el resaltado", """
      var k=['misiones','sessions','acciones'],o={};k.forEach(x=>o[x]=DATA[x]);
      var t0={running:studyTimer.running,start:studyTimer.start,bibIndex:studyTimer.bibIndex,tick:studyTimer.tick},el=$('misCerca'),mi=$('miniMis'),ms=$('miniStudy');
      var viejo=new Date(Date.now()-5*3600000).toISOString(),oculto0=ms.classList.contains('hidden'),espera=n=>new Promise(r=>setTimeout(r,n));
      var prepara=(min,ids,hechas)=>{studyTimer.running=true;studyTimer.tick=t0.tick||1;studyTimer.bibIndex=-1;studyTimer.start=Date.now()-min*60000-500;
        DATA.misiones={fecha:ymd(),ids:ids,hechas:hechas,cofre:false};el._clave=null;renderMisCerca();};
      var rgb=v=>{var d=document.createElement('i');d.style.color='var('+v+')';document.body.appendChild(d);var c=getComputedStyle(d).color;d.remove();return c;};
      try{
        closeModal();goView('map');DATA.sessions=[];DATA.acciones={fecha:ymd()};ms.classList.remove('hidden');
        prepara(18,['m25','agenda','social'],{agenda:viejo,social:viejo});
        var c=misionCerca();if(!c||c.id!=='m25')return 'no hay misión cerca';
        if(document.querySelector('#missionsCard .mis-pista'))return 'la pista sale sin tocar nada';
        mi.click();
        var f=document.querySelector('#missionsCard [data-m="m25"]'),p=f&&f.querySelector('.mis-pista');
        if(!p)return 'no sale la pista en la fila resaltada';
        if(document.querySelectorAll('#missionsCard .mis-pista').length!==1)return 'más de una pista';
        var t=p.textContent.replace(/\\s+/g,' ').trim(),esp='⏱️ '+c.falta+' min más y es tuya · +'+MIS_PREMIO+' 🌰';
        if(t!==esp)return 'texto: «'+t+'» en vez de «'+esp+'»';
        var cs=getComputedStyle(p),b=p.querySelectorAll('b');
        if(cs.color!==rgb('--suave'))return 'la línea no va en --suave';
        if(b.length!==2||[].some.call(b,x=>getComputedStyle(x).color!==rgb('--ok-tx')))return 'las cifras no van en --ok-tx';
        var rojo=/rgb\\(2[0-5]\\d, [0-9]{1,2}, [0-9]{1,2}\\)/;if(rojo.test(cs.color))return 'es roja';
        if(p.getAttribute('aria-live')||p.closest('[aria-live]'))return 'aria-live ruidoso';
        if(/\\d+:\\d\\d|seg|corre|rápido|pierdes|antes de/i.test(t))return 'cuenta atrás o presión';
        var r=p.getBoundingClientRect();if(r.right>innerWidth||document.documentElement.scrollWidth>innerWidth)return 'rompe el ancho a '+innerWidth+' px';
        renderMisiones();if(!document.querySelector('#missionsCard [data-m="m25"] .mis-pista'))return 'se pierde al repintar';
        await espera(MIS_FOCO_MS+200);
        if(document.querySelector('#missionsCard .mis-pista'))return 'no se va con el resaltado';
        renderMisiones();if(document.querySelector('#missionsCard .mis-pista'))return 'vuelve al repintar';
        // «✅ 2/3» (sin misión cerca): ni resaltado ni pista
        goView('map');prepara(26,['m25','agenda','pomo'],{m25:new Date(Date.now()-60000).toISOString(),agenda:viejo});
        mi.click();if(document.querySelector('#missionsCard .mis-pista'))return 'pista sin misión cerca';
        return true;
      }finally{clearTimeout(irAMision.t);studyTimer.running=t0.running;studyTimer.start=t0.start;studyTimer.bibIndex=t0.bibIndex;studyTimer.tick=t0.tick;MIS_FOCO={id:'',hasta:0};
        k.forEach(x=>DATA[x]=o[x]);el&&(el._clave=null);ms.classList.toggle('hidden',oculto0);goView('map');await espera(300);renderMisCerca();renderStudy();}"""),
    ("acceso: la ley foral solo en Navarra", """
      for(var i=N_NAVARRA;i<BIBLIOTECAS.length;i++)if(/Ley Foral/.test(accesoAccesibilidadHTML(BIBLIOTECAS[i])))return 'ley foral fuera de Navarra: '+BIBLIOTECAS[i].nombre;
      var nav=BIBLIOTECAS.slice(0,N_NAVARRA).some(b=>/Ley Foral 32\\/2002/.test(accesoAccesibilidadHTML(b)));
      var sev=BIBLIOTECAS.findIndex(b=>b.nombre==='Biblioteca Pública Infanta Elena'&&b.ciudad==='Sevilla');
      if(sev<0)return 'no está la Infanta Elena de Sevilla';
      openBibDetailModal(sev);var t=$('modalRoot').innerText;closeModal();
      return nav&&!/Ley Foral/.test(t)||'ficha de Sevilla: '+t.slice(0,80);"""),
    ("especies de temporada (cruzan el año)", """
      var nav=especieDe('navidad'),alm=especieDe('almendro'),d=s=>new Date(s+'T12:00:00');
      if(nav.id!=='navidad'||alm.id!=='almendro')return 'faltan especies';
      var c=[[nav,'2026-12-01',1],[nav,'2026-12-15',1],[nav,'2027-01-06',1],[nav,'2027-01-07',0],[nav,'2026-11-30',0],[nav,'2026-06-15',0],
        [alm,'2027-03-01',1],[alm,'2027-04-30',1],[alm,'2027-05-01',0],[especieDe('calabaza'),'2026-11-03',0]];
      for(const x of c)if(enTemporada(x[0],d(x[1]))!==!!x[2])return x[0].id+' mal el '+x[1];
      var o=ymd;ymd=f=>f?o(f):'2026-12-15';await abrirTienda();var t=$('modalRoot').innerText,l=document.querySelectorAll('#modalRoot .luz').length;closeModal();
      ymd=f=>f?o(f):'2026-07-15';await abrirTienda();var t2=$('modalRoot').innerText;closeModal();ymd=o;
      return t.indexOf('Abeto de Navidad')>=0&&l>0&&t2.indexOf('Abeto de Navidad')<0||'tienda: navidad fuera de fecha o sin luces';"""),
    ("historias y tips", """
      goView('friends');renderStories();var ok=!!document.querySelector('#storiesBar .story.me');
      await abrirTips();ok=ok&&document.querySelectorAll('.tip').length>=20;cerrarTips();return ok;"""),
    ("app-extra.js define todas las funciones de EXTRA_FUNCS", """
      await cargarExtra();
      var f=EXTRA_FUNCS.filter(n=>typeof window[n]!=='function'||/cargarExtra\\(\\)\\.then/.test(String(window[n])));
      return !f.length||'siguen siendo stub: '+f.join(', ');"""),
    ("agenda: añadir examen", """
      goView('cal');var k=ymd(new Date(Date.now()+3*864e5));await openDayModal(k);await new Promise(r=>setTimeout(r,200));
      $('evTitle').value='Examen prueba';$('evAdd').click();await new Promise(r=>setTimeout(r,200));
      var ok=(DATA.events[k]||[]).some(e=>e.title==='Examen prueba');renderStudy();
      return ok && $('examChip').innerText.indexOf('Examen prueba')>=0 || 'no aparece el examen';"""),
    ("agenda: aviso «🙏 N amigos rezan por tu examen de mañana» solo con rezos reales", """
      goView('cal');var m=new Date();m.setDate(m.getDate()+1);var k=ymd(m),el=$('calRezos'),t=()=>el.innerText;
      var oc=socialClient,ou=SOCIAL.user,opc=SOCIAL.prayerCounts,opm=SOCIAL.prayedByMe,filas=[],fallo=false;
      var ev={id:'prueba-ex1',type:'examen',title:'Cálculo II',shared:true};
      var otra=async()=>{await cargarExtra();REZOS_AVISO.t=0;await renderCalRezos();}, ox=DATA.extras;
      try{
        await renderCalRezos();if(t())return 'se ve sin sesión';
        socialClient=()=>({from:()=>({select:()=>({eq:()=>({in:async()=>fallo?{data:null,error:{message:'x'}}:{data:filas,error:null}})})})});
        SOCIAL.user={id:'prueba-yo'};SOCIAL.prayerCounts={};SOCIAL.prayedByMe={};
        (DATA.events[k]=DATA.events[k]||[]).push(ev);
        await otra();if(t())return 'se ve sin rezos';
        filas=[{event_local_id:'prueba-ex1',prayed_by_id:'prueba-yo',prayed_by_name:'Yo'}];
        await otra();if(t())return 'cuenta mi propio rezo';
        filas=[{event_local_id:'prueba-ex1',prayed_by_id:'a',prayed_by_name:'Ana López'}];
        await otra();if(!/1 amigo reza por tu examen de mañana/.test(t())||!/Ana/.test(t()))return 'singular mal: '+t();
        filas=filas.concat([{event_local_id:'prueba-ex1',prayed_by_id:'b',prayed_by_name:'Luis'},{event_local_id:'prueba-ex1',prayed_by_id:'c',prayed_by_name:'Marta'},{event_local_id:'otro',prayed_by_id:'d',prayed_by_name:'Eva'}]);
        await otra();if(!/3 amigos rezan por tu examen de mañana/.test(t())||!/Ana, Luis y Marta/.test(t()))return 'plural mal: '+t();
        if(!document.querySelector('#calRezos .rezos-aviso'))return 'sin tarjeta';
        fallo=true;await otra();if(t())return 'sin datos muestra algo';
        SOCIAL.prayerCounts={'prueba-ex1':2};await otra();
        if(!/Tus amigos rezan por tu examen de mañana/.test(t())||/\\d/.test(t().split('\\n')[0]))return 'sin recuento inventa cifra: '+t();
        DATA.extras=false;await otra();var off=t();DATA.extras=ox;if(off)return 'se ve con la fe desactivada';
        return true;
      }finally{
        DATA.events[k]=(DATA.events[k]||[]).filter(e=>e!==ev);if(!DATA.events[k].length)delete DATA.events[k];
        socialClient=oc;SOCIAL.user=ou;SOCIAL.prayerCounts=opc;SOCIAL.prayedByMe=opm;await renderCalRezos();
      }"""),
    ("temporada de exámenes: fuentes, chip y nota", """
      var raw=window.TEMPORADA_EXAMENES||[], re=/^\\d{4}-\\d{2}-\\d{2}$/, hoy=ymd(new Date(Date.now()+864e5)); // +1 día: el navegador de pruebas va en UTC
      for(const e of raw){
        if(!/^https:\\/\\/[^\\s]+\\.[a-z]{2,}\\//.test(e.f||''))return 'fuente no válida: '+e.espacio;
        if(!re.test(e.fv||'')||e.fv>hoy)return 'fv no válida: '+e.espacio;
        if(!re.test(e.desde)||!re.test(e.hasta)||e.desde>e.hasta)return 'periodo no válido: '+e.espacio;
        if(e.bib&&!BIBLIOTECAS.some(b=>b.nombre===e.bib))return 'no enlaza con la app: '+e.bib;}
      if(EXAMENES.length!==raw.length)return 'entradas descartadas al cargar';
      for(const e of EXAMENES){var b=BIBLIOTECAS[e.i];if(!b||!e.sem)continue;
        for(const c of e.cerrado){var d=new Date(c[0]+'T12:00:00');if((horarioVigente(b,d)[d.getDay()]||[]).length)return 'abierta en día de cierre: '+e.espacio;}}
      abrirLista(false);var chip=document.querySelector('#listFilters [data-f="examenes"]');
      if(!chip)return 'sin chip';
      if(chip.hidden===hayTemporadaExamenes())return 'chip visible sin temporada (o al revés)';
      var con=BIBLIOTECAS.map((b,i)=>i).filter(i=>examenDeBib(BIBLIOTECAS[i]));
      if(!chip.hidden){chip.click();var n=document.querySelectorAll('#list .card').length;chip.click();
        if(n!==con.length)return 'el filtro muestra '+n+' de '+con.length;}
      cerrarLista();
      if(con.length){openBibDetailModal(con[0]);var a=document.querySelector('#modalRoot .ex-nota a');closeModal();
        if(!a||a.getAttribute('href')!==examenDeBib(BIBLIOTECAS[con[0]]).f)return 'la ficha no enlaza la fuente';}
      return true;"""),
    ("reacciones 🔥💪🧠: ocultas sin sesión, alternan en local sin tabla", """
      if(reaccionesHTML('x','y')!=='')return 'se ven sin sesión';
      var oc=socialClient,ou=SOCIAL.user,of=SOCIAL.friendSessions,ok0=SOCIAL.reactsOk,ot=feedTab,ofr=SOCIAL.friends;
      try{
        socialClient=()=>({});SOCIAL.user={id:'prueba-yo'};SOCIAL.reactsOk=false;SOCIAL.friends=[];
        SOCIAL.friendSessions=[{local_id:'s1',owner_id:'prueba-amigo',bib_name:'Biblioteca Prueba',minutes:90,date:ymd()}];
        reacCargarLocal();feedTab='amigos';renderSessionFeed(true);
        var b=()=>document.querySelector('#sessionFeed [data-reac="🔥"]');
        if(document.querySelectorAll('#sessionFeed .reac').length!==3)return 'no hay 3 reacciones';
        b().click();await new Promise(r=>setTimeout(r,50));
        if(!b().classList.contains('on')||b().innerText.indexOf('1')<0)return 'no se marca la reacción';
        if(!(loadJSON(reacLocalKey(),{})['prueba-amigo:s1']||{})['🔥'])return 'no se guarda en local';
        b().click();await new Promise(r=>setTimeout(r,50));
        if(b().classList.contains('on')||/\\d/.test(b().innerText))return 'no se quita (o deja un contador)';
        return true;
      }finally{
        try{localStorage.removeItem(reacLocalKey());}catch(e){}
        socialClient=oc;SOCIAL.user=ou;SOCIAL.friendSessions=of;SOCIAL.reactsOk=ok0;SOCIAL.friends=ofr;SOCIAL.reacts={};SOCIAL.reactsMine={};feedTab=ot;renderSessionFeed(true);
      }"""),
    ("liga semanal: Oro/Plata por la semana pasada, mínimo de estudio y sin amigos nada", """
      goView('friends');await new Promise(r=>setTimeout(r,300));
      var oc=socialClient,ou=SOCIAL.user,ofr=SOCIAL.friends,orw=SOCIAL.lbRows,op=lbPeriod,ol=SOCIAL.liga;
      var d=n=>{var x=lunesDe(1);x.setDate(x.getDate()+n);return ymd(x);}, k='bpna_liga_prueba-yo';
      try{
        try{localStorage.removeItem(k);}catch(e){}
        socialClient=()=>({});SOCIAL.user={id:'prueba-yo'};lbPeriod='week';
        SOCIAL.friends=[{profile:{id:'prueba-a',name:'Ana'}},{profile:{id:'prueba-b',name:'Bea'}}];
        SOCIAL.lbRows=[{owner_id:'prueba-yo',minutes:200,date:d(0)},{owner_id:'prueba-yo',minutes:100,date:d(6)},
          {owner_id:'prueba-a',minutes:120,date:d(2)},{owner_id:'prueba-b',minutes:30,date:d(3)},
          {owner_id:'prueba-a',minutes:500,date:d(-1)},{owner_id:'prueba-b',minutes:45,date:ymd()}];
        computeLeaderboard();renderLeaderboard();
        var L=SOCIAL.liga;
        if(L.por['prueba-yo']!=='oro'||L.por['prueba-a']!=='plata')return 'puestos mal: '+JSON.stringify(L.por);
        if(L.por['prueba-b'])return 'entra sin el mínimo de estudio';
        if(SOCIAL.leaderboard.length!==1||SOCIAL.leaderboard[0].min!==45)return 'el ranking de esta semana mezcla la pasada';
        if(!/Liga Oro/.test($('profLiga').innerText))return 'sin insignia en el perfil';
        if(!document.querySelector('#leaderboardList .liga-nota .liga-oro'))return 'sin nota de liga en el ranking';
        if(loadJSON(k,{}).sem!==ymd(lunesDe(0)))return 'no recuerda que ya celebró';
        SOCIAL.lbRows=[{owner_id:'prueba-a',minutes:500,date:d(1)},{owner_id:'prueba-yo',minutes:20,date:d(1)}];
        computeLeaderboard();renderLeaderboard();
        if($('profLiga').innerHTML!==''||!/entras en la liga/.test($('leaderboardList').innerText))return 'sin el mínimo no invita con amabilidad';
        SOCIAL.lbRows=[{owner_id:'prueba-a',minutes:120,date:d(1)},{owner_id:'prueba-b',minutes:90,date:d(2)},{owner_id:'prueba-a',minutes:60,date:ymd()}];
        computeLeaderboard();renderLeaderboard();
        if(!document.querySelector('#leaderboardList .pd-col .liga-oro'))return 'sin insignia en la fila del ranking';
        SOCIAL.friends=[];SOCIAL.lbRows=[{owner_id:'prueba-yo',minutes:300,date:d(1)}];
        computeLeaderboard();renderLeaderboard();
        if(document.querySelector('#leaderboardList .liga,#leaderboardList .liga-nota')||$('profLiga').innerHTML!=='')return 'se ve liga sin amigos';
        return true;
      }finally{
        try{localStorage.removeItem(k);}catch(e){}
        socialClient=oc;SOCIAL.user=ou;SOCIAL.friends=ofr;SOCIAL.lbRows=orw;lbPeriod=op;SOCIAL.liga=ol;SOCIAL.leaderboard=[];renderLeaderboard();
      }"""),
    ("enlace #bib abre la ficha", """
      location.hash='#bib=104-x';comprobarEnlaceCompartido();await new Promise(r=>setTimeout(r,900));
      return !!document.querySelector('.leaflet-popup-content') || 'no abre la ficha';"""),
    ("perfil: récord con el nombre bien recortado", """
      var bad=DATA.sessions.length;DATA.sessions.push({id:'t-rec',date:'2026-01-01',min:9999,bib:'Biblioteca de Navarra'});
      try{goView('profile');await new Promise(r=>setTimeout(r,300));
        var lab=[...document.querySelectorAll('.stat .lab')].map(x=>x.textContent).find(t=>/larga/.test(t))||'';
        return /· Biblioteca de Navarra$/.test(lab) || ('récord: «'+lab+'»');
      }finally{DATA.sessions.splice(bad,1);goView('map');}"""),
]


async def main():
    from playwright.async_api import async_playwright
    guardar = "--guardar" in sys.argv
    capt = sys.argv[sys.argv.index("--capturas") + 1] if "--capturas" in sys.argv else None
    preparar_leaflet()
    hay_mc = preparar_markercluster()
    srv = servir()
    url = f"http://127.0.0.1:{PUERTO}/index.html"
    res = {"fecha": time.strftime("%Y-%m-%d %H:%M"), "pruebas": {}, "errores_js": []}
    async with async_playwright() as p:
        nav = await p.chromium.launch()

        async def nueva_pagina(tema="light"):
            ctx = await nav.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, color_scheme=tema, service_workers="block", timezone_id=ZONA_PRUEBAS)
            pg = await ctx.new_page()

            async def ruta(r):
                u = r.request.url
                if u.startswith(f"http://127.0.0.1:{PUERTO}"):
                    return await r.continue_()
                if u.endswith("leaflet.js") and "markercluster" not in u:
                    return await r.fulfill(path=os.path.join(LEAFLET_DIR, "leaflet.js"), content_type="application/javascript")
                if u.endswith("leaflet.css") and "markercluster" not in u:
                    return await r.fulfill(path=os.path.join(LEAFLET_DIR, "leaflet.css"), content_type="text/css")
                if hay_mc and f"leaflet.markercluster@{MC_VERSION}/dist/" in u:
                    n = u.split("?")[0].rsplit("/", 1)[-1]
                    if n in MC_ARCHIVOS:
                        tipo = "text/css" if n.endswith(".css") else "application/javascript"
                        return await r.fulfill(path=os.path.join(MC_DIR, n), content_type=tipo)
                return await r.abort()
            await pg.route("**/*", ruta)
            return ctx, pg

        # --- velocidad: mediana de 5 cargas con la CPU 4 veces más lenta (como un móvil medio) ---
        # Entre cargas sueltas hay ±300 ms de ruido: con 5 la mediana deja comparar cambios pequeños,
        # y el mínimo/máximo dicen cuánto ruido hubo en esa ejecución (cada carga tarda ~2 s).
        tiempos, fcp, chinchetas = [], [], []
        for _ in range(CARGAS):
            ctx, pg = await nueva_pagina()
            cdp = await ctx.new_cdp_session(pg)
            await cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
            t0 = time.time()
            await pg.goto(url)
            await pg.wait_for_function("document.getElementById('nowCard') && document.getElementById('nowCard').innerText.length>10", timeout=30000)
            tiempos.append(round((time.time() - t0) * 1000))
            # Primera pintura con contenido y momento en que están todas las chinchetas en el mapa
            # (app.js las añade por lotes tras la primera pintura): que bajar la carga no esconda
            # el trabajo, solo lo reordene.
            fcp.append(await pg.evaluate("()=>{var e=performance.getEntriesByName('first-contentful-paint')[0];return e?Math.round(e.startTime):null}"))
            try:
                await pg.wait_for_function("window.__marcadoresListos===true || (window.__mapReady===true && window.__marcadoresListos===undefined)", timeout=30000)
                chinchetas.append(round((time.time() - t0) * 1000))
            except Exception:
                pass
            await ctx.close()
        res["carga_ms_cpu4x"] = round(statistics.median(tiempos))
        res["carga_ms_cpu4x_min_max"] = [min(tiempos), max(tiempos)]
        fcp = [x for x in fcp if x is not None]
        if fcp:
            res["primera_pintura_ms_cpu4x"] = round(statistics.median(fcp))
        if chinchetas:
            res["todas_las_chinchetas_ms_cpu4x"] = round(statistics.median(chinchetas))

        # --- pruebas funcionales ---
        ctx, pg = await nueva_pagina()
        errores = []
        pg.on("pageerror", lambda e: errores.append(str(e)[:200]))
        await pg.goto(url)
        await pg.wait_for_timeout(2000)
        await pg.evaluate("async()=>{" + SALTAR_BIENVENIDA + "}")
        # ¿Se midió como en producción? Con markercluster el mapa agrupa y pinta pocos iconos.
        mc = await pg.evaluate("""()=>({cargado:typeof L.markerClusterGroup==='function',
          agrupa:!!(L.MarkerClusterGroup&&window.__capaBibs instanceof L.MarkerClusterGroup),
          grupos:document.querySelectorAll('.leaflet-marker-icon .chincheta.grupo').length,
          iconos:document.querySelectorAll('.leaflet-marker-pane .leaflet-marker-icon').length})""")
        res["markercluster"] = dict(mc, servido_en_local=hay_mc)
        if hay_mc:  # si se pudo servir, que de verdad agrupe; si no, solo se avisa (arriba) y se apunta
            res["pruebas"]["mapa con clústeres (markercluster cargado)"] = (
                True if mc["cargado"] and mc["agrupa"] and mc["grupos"] > 0 else "sin clústeres: " + json.dumps(mc))
        for nombre, js in PRUEBAS:
            try:
                r = await pg.evaluate("async()=>{" + js + "}")
            except Exception as e:  # noqa
                r = "excepción: " + str(e)[:160]
            res["pruebas"][nombre] = True if r is True else (r or False)
        # --- atajos de la app instalada (manifest.json → shortcuts): cargar /#accion=… en limpio ---
        COMPROBAR_ATAJO = {
            "estudiar": "!$('viewStudy').classList.contains('hidden') && $('viewMap').classList.contains('hidden')",
            "ahora": "!$('viewMap').classList.contains('hidden') && !$('nowCard').classList.contains('hidden') && $('nowCard').innerText.length>10",
            "pronto": "!$('viewMap').classList.contains('hidden') && !$('libPanel').classList.contains('hidden') && LIST_FILTERS.pronto===true && !LIST_FILTERS.abiertas",
        }
        fallo_atajo = []
        manif = json.load(open(os.path.join(RAIZ, "manifest.json"), encoding="utf-8"))
        urls_manif = sorted(s["url"] for s in manif.get("shortcuts", []))
        if urls_manif != sorted("./#accion=" + a for a in COMPROBAR_ATAJO):
            fallo_atajo.append("manifest: " + ",".join(urls_manif))
        for acc, cond in COMPROBAR_ATAJO.items():
            c3, p3 = await nueva_pagina()
            p3.on("pageerror", lambda e: errores.append(str(e)[:200]))
            await p3.goto(f"http://127.0.0.1:{PUERTO}/#accion={acc}")
            await p3.wait_for_timeout(2500)
            ok = await p3.evaluate(f"()=>({cond}) && location.hash===''")
            if not ok:
                fallo_atajo.append(acc)
            await c3.close()
        res["pruebas"]["atajos de la app instalada (#accion=estudiar|ahora|pronto)"] = True if not fallo_atajo else "fallan: " + ", ".join(fallo_atajo)
        # --- datos y SEO (desde la propia app) ---
        res["datos"] = await pg.evaluate("""()=>{
          var conH=BIBLIOTECAS.filter(b=>!b.sinHorario), prov={}, provH={};
          BIBLIOTECAS.forEach((b,i)=>{var p=i<N_NAVARRA?'Navarra':(b.provincia||'');if(!p)return;prov[p]=1;if(!b.sinHorario)provH[p]=1;});
          return {bibliotecas:BIBLIOTECAS.length,con_horario_verificado:conH.length,
            provincias_con_horario:Object.keys(provH).length,provincias_total:Object.keys(prov).length};}""")
        res["errores_js"] = errores
        if capt:
            os.makedirs(capt, exist_ok=True)
            for tema in ("light", "dark"):
                c2, p2 = await nueva_pagina(tema)
                await p2.goto(url); await p2.wait_for_timeout(2000)
                await p2.evaluate("async()=>{" + SALTAR_BIENVENIDA + "}")
                for v in ("map", "study", "cal", "friends", "profile"):
                    await p2.evaluate(f"()=>goView('{v}')"); await p2.wait_for_timeout(600)
                    await p2.screenshot(path=os.path.join(capt, f"{v}-{tema}.png"))
                await c2.close()
        await ctx.close()
        await nav.close()
    srv.shutdown()

    paginas = sum(1 for r, d, f in os.walk(os.path.join(RAIZ, "bibliotecas")) if "index.html" in f)
    res["seo"] = {"paginas": paginas, "sitemap": os.path.exists(os.path.join(RAIZ, "sitemap.xml"))}
    res["peso"] = {f: peso(f) for f in ("index.html", "app.js", "bibliotecas-espana.js")}
    fallos = [k for k, v in res["pruebas"].items() if v is not True] + (["errores de JavaScript"] if errores else [])
    res["ok"] = not fallos

    print(json.dumps(res, ensure_ascii=False, indent=2))
    if guardar:
        with open(os.path.join(RAIZ, "docs", "metricas.json"), "w", encoding="utf-8") as f:
            json.dump(res, f, ensure_ascii=False, indent=2)
        hist = os.path.join(RAIZ, "docs", "METRICAS.md")
        nuevo = not os.path.exists(hist)
        with open(hist, "a", encoding="utf-8") as f:
            if nuevo:
                f.write("# Métricas de Bibliomapa\n\nUna fila por ejecución de `python3 scripts/probar.py --guardar` (ver docs/OBJETIVOS.md).\n\n"
                        "| Fecha | Pruebas | Errores JS | Carga (ms, CPU 4×) | app.js gzip (KB) | Horarios verificados | Provincias con horario | Páginas SEO |\n|---|---|---|---|---|---|---|---|\n")
            pas = sum(1 for v in res["pruebas"].values() if v is True)
            f.write(f"| {res['fecha']} | {pas}/{len(res['pruebas'])} | {len(errores)} | {res['carga_ms_cpu4x']} | {res['peso']['app.js']['kb_gzip']} | "
                    f"{res['datos']['con_horario_verificado']} | {res['datos']['provincias_con_horario']}/{res['datos']['provincias_total']} | {paginas} |\n")
    if fallos:
        print("\nFALLAN:", "; ".join(fallos), file=sys.stderr)
        sys.exit(1)


asyncio.run(main())
