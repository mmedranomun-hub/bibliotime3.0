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


# --- Coherencia analitica.js ↔ privacidad.html (docs/ANALITICA.md), solo lectura de archivos, sin navegador ---
def analitica_proveedor(fuente):
    """Valor de `proveedor` en la línea `var ANALITICA = {...}` de analitica.js: None (null), un texto, o False si no se lee."""
    import re
    m = re.search(r"var ANALITICA\s*=\s*\{\s*proveedor\s*:\s*(null|\"([^\"]*)\"|'([^']*)')", fuente)
    if not m:
        return False
    return None if m.group(1) == "null" else (m.group(2) if m.group(2) is not None else m.group(3))


def privacidad_coherente(proveedor, html):
    """Lista de incoherencias entre el proveedor de analítica y lo que dice la política (vacía = coherente)."""
    f = []
    dice_sin = "sin analítica" in html or "No usamos herramientas de analítica" in html
    describe = "Estadística de visitas" in html
    if proveedor is False:
        return ["no encuentro `var ANALITICA = {proveedor: …}` en analitica.js"]
    if proveedor is None:
        if not dice_sin:
            f.append("analítica apagada pero privacidad.html ya no dice «sin analítica»")
        if describe:
            f.append("analítica apagada pero privacidad.html describe «Estadística de visitas»")
        return f
    if dice_sin:
        f.append(f"proveedor {proveedor!r} pero privacidad.html sigue diciendo «sin analítica» (aplica el diff de docs/ANALITICA.md)")
    if not describe:
        f.append(f"proveedor {proveedor!r} pero privacidad.html no tiene el punto «Estadística de visitas»")
    nombre = {"vercel": "Vercel Web Analytics", "goatcounter": "GoatCounter"}.get(proveedor)
    if not nombre:
        f.append(f"proveedor {proveedor!r} desconocido: no hay texto de política para él")
    elif nombre not in html:
        f.append(f"proveedor {proveedor!r} pero privacidad.html no nombra a {nombre}")
    if "[FECHA DEL DÍA QUE SE ENCIENDA]" in html:
        f.append("privacidad.html conserva el marcador [FECHA DEL DÍA QUE SE ENCIENDA]")
    return f


def aplicar_diff(texto, diff):
    """Aplica un diff unificado de un solo archivo; cada trozo tiene que encajar exactamente una vez. Lanza ValueError si no."""
    trozos, act = [], None
    for l in diff.splitlines():
        if l.startswith("@@"):
            act = ([], []); trozos.append(act)
        elif act is None or l.startswith("\\"):
            continue
        elif l[:1] in (" ", ""):
            act[0].append(l[1:]); act[1].append(l[1:])
        elif l[0] == "-":
            act[0].append(l[1:])
        elif l[0] == "+":
            act[1].append(l[1:])
    if not trozos:
        raise ValueError("el diff no tiene trozos @@")
    for viejo, nuevo in trozos:
        v, n = "\n".join(viejo) + "\n", "\n".join(nuevo) + "\n"
        if texto.count(v) != 1:
            raise ValueError("un trozo no encaja en privacidad.html: " + (viejo[len(viejo) // 2] if viejo else "")[:80])
        texto = texto.replace(v, n)
    return texto


def comprobar_privacidad_analitica():
    """True o el texto del fallo. Comprueba los archivos reales y, con el diff de docs/ANALITICA.md aplicado a una copia
    en memoria, que encender sin cambiar la política (o cambiarla sin encender) se detecta."""
    leer = lambda r: open(os.path.join(RAIZ, r), encoding="utf-8").read()
    try:
        fuente, html, doc = leer("analitica.js"), leer("privacidad.html"), leer(os.path.join("docs", "ANALITICA.md"))
    except OSError as e:
        return f"no se puede leer: {e}"
    prov = analitica_proveedor(fuente)
    f = privacidad_coherente(prov, html)
    import re
    m = re.search(r"## Diff COMPLETO de `privacidad\.html`.*?```diff\n(.*?)```", doc, re.S)
    if not m:
        return "; ".join(f + ["docs/ANALITICA.md no tiene el bloque ```diff de privacidad.html"])
    if prov is None:  # hoy: el diff tiene que seguir aplicándose sobre la política vigente
        try:
            enc = aplicar_diff(html, m.group(1)).replace("[FECHA DEL DÍA QUE SE ENCIENDA]", "1 de enero de 2030")
        except ValueError as e:
            return "; ".join(f + [f"el diff de docs/ANALITICA.md ya no se aplica: {e}"])
        casos = [  # (proveedor, política, ¿debe ser coherente?)
            ("vercel", enc, True), ("vercel", html, False), (None, enc, False), ("goatcounter", html, False),
            ("vercel", enc.replace("1 de enero de 2030", "[FECHA DEL DÍA QUE SE ENCIENDA]"), False)]
        for p_, h_, bien in casos:
            if (not privacidad_coherente(p_, h_)) != bien:
                f.append(f"la comprobación no detecta el caso proveedor={p_!r} ({'diff aplicado' if h_ is not html else 'política actual'})")
    return True if not f else "; ".join(f)


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
    ("«🌳 Dos días seguidos plantando y compartiendo»: sale una vez al terminar la sesión empezada desde «📸 Ayer compartiste…»", """
      await cargarExtra();
      var copia=JSON.stringify(DATA),bs=$('btnStart'),vc=VUELTA_COMP;   // stopStudy toca semillas, misiones, racha…: se deja DATA como estaba
      var dia=n=>{var d=new Date();d.setDate(d.getDate()-n);return ymd(d);};
      var sesion=async()=>{arrancarSesion(-1,false);studyTimer.start-=31*60000;stopStudy(false);await new Promise(r=>setTimeout(r,150));
        document.querySelectorAll('.cuenta').forEach(x=>x.remove());if(window.cerrarFoco)cerrarFoco();
        var m=document.querySelector('#modalRoot');return m?m.innerText:'';};
      try{
        bs.disabled=true;   // que el clic del botón de la bienvenida no abra «¿Dónde estudias?»: la sesión se simula abajo
        DATA.sessions=[{id:'vc0',date:dia(1),min:52,ts:Date.now()-864e5,bib:NO_BIB,focus:'ok',esp:'roble'}];DATA.ultimaCompartida={fecha:dia(1),min:52};VUELTA_COMP=null;
        closeModal();pintarBienvenidaDiaria();var b=$('bvEstudiar');
        if(!b||!/Empezar a estudiar/.test(b.innerText))return 'sin «Empezar a estudiar»';
        b.click();await new Promise(r=>setTimeout(r,350));
        if(VUELTA_COMP!==dia(1)||studyTimer.running)return 'el botón no apunta la vuelta: '+VUELTA_COMP;
        bs.disabled=false;
        var t=await sesion();
        if(!/Sesión terminada/.test(t))return 'no abre «Sesión terminada»: '+t.slice(0,80);
        if(!/🌳 Dos días seguidos plantando y compartiendo/.test(t))return 'no sale el premio: '+t.slice(0,200);
        if(/apague|perder|peligro|racha/i.test(document.querySelector('.ses-vuelta').innerText))return 'mete presión';
        if(DATA.ultimaCompartida.vuelta!==ymd())return 'no marca .vuelta: '+JSON.stringify(DATA.ultimaCompartida);
        if(getComputedStyle(document.querySelector('.ses-vuelta')).color==='rgba(0, 0, 0, 0)')return 'sin estilos';
        closeModal();if(/Dos días seguidos/.test(await sesion()))return 'sale una segunda vez';
        // sin pasar por el botón: misma marca de ayer, pero se cierra la bienvenida con «Más tarde»
        closeModal();DATA.sessions=DATA.sessions.slice(0,1);DATA.ultimaCompartida={fecha:dia(1),min:52};VUELTA_COMP=null;
        pintarBienvenidaDiaria();closeModal();
        if(/Dos días seguidos/.test(await sesion()))return 'sale sin haber pulsado el botón';
        // árbol marchito: no sale ni gasta la vuelta
        closeModal();DATA.sessions=DATA.sessions.slice(0,1);DATA.ultimaCompartida={fecha:dia(1),min:52};VUELTA_COMP=dia(1);
        var s={id:'vcw',date:ymd(),min:30,ts:Date.now()-60000,bib:NO_BIB,focus:'withered',esp:'roble',prod:null,note:''};pedirValoracion(s,null);
        if(document.querySelector('#modalRoot .ses-vuelta')||DATA.ultimaCompartida.vuelta)return 'sale con árbol marchito';
        return true;
      }finally{bs.disabled=false;VUELTA_COMP=vc;var c=JSON.parse(copia);Object.keys(DATA).forEach(k=>{if(!(k in c))delete DATA[k];});Object.assign(DATA,c);saveUserData();document.querySelectorAll('.racha-overlay,.cuenta').forEach(x=>x.remove());closeModal();renderStudy();renderProfile();}"""),
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
    ("«📸 Ayer compartiste…» en la bienvenida: una vez, solo si ayer compartiste y hoy no has estudiado", """
      await cargarExtra();
      var o=DATA.sessions,uc=DATA.ultimaCompartida,cl=window.compartirLienzo,ds=window.dibujarSesionStory,st=window.showToast;
      var dia=n=>{var d=new Date();d.setDate(d.getDate()-n);return ymd(d);};
      var mk=(i,n,m)=>({id:'uc'+i,date:dia(n),min:m,ts:Date.now()-n*864e5,bib:NO_BIB,focus:'ok',esp:'roble'});
      var ver=()=>{closeModal();pintarBienvenidaDiaria();var m=document.querySelector('#modalRoot .bienvenida');return m?m.innerText:'';};
      try{
        window.showToast=()=>{};window.dibujarSesionStory=async()=>document.createElement('canvas');
        DATA.sessions=[mk(0,1,52)];DATA.ultimaCompartida=null;
        window.compartirLienzo=async()=>false;await compartirSesionStory('uc0',null,null);
        if(DATA.ultimaCompartida)return 'guarda la marca al cancelar la hoja';
        window.compartirLienzo=async()=>true;await compartirSesionStory('uc0',null,null);
        var M=DATA.ultimaCompartida;if(!M||M.fecha!==ymd()||M.min!==52)return 'no guarda {fecha,min} al compartir: '+JSON.stringify(M);
        DATA.ultimaCompartida={fecha:dia(1),min:52};
        var t=ver();
        if(!/📸 Ayer compartiste 0h 52m · ¿plantamos otro árbol hoy\?/.test(t))return 'no sale el mensaje: '+t;
        if(/apague|perder|peligro/i.test(t))return 'mete presión: '+t;
        var b=$('bvEstudiar');if(!b||!/Empezar a estudiar/.test(b.innerText))return 'sin botón «Empezar a estudiar»';
        if(b.getBoundingClientRect().height<44)return 'botón de menos de 44 px';
        if(document.activeElement!==b)return 'el foco no va al botón';
        if(getComputedStyle(document.querySelector('.bv-comp')).backgroundColor==='rgba(0, 0, 0, 0)')return 'tarjeta sin estilos (fondo con token)';
        if(/Ayer compartiste/.test(ver()))return 'sale una segunda vez';
        DATA.ultimaCompartida={fecha:dia(1),min:52};DATA.sessions=[mk(0,1,52),mk(1,0,25)];
        if(/Ayer compartiste/.test(ver()))return 'sale habiendo estudiado hoy';
        DATA.ultimaCompartida={fecha:dia(2),min:52};DATA.sessions=[mk(0,2,52)];
        if(/Ayer compartiste/.test(ver()))return 'sale con una marca de anteayer';
        if(!/Estudiar ahora/.test(ver()))return 'cambia la bienvenida normal';
        return true;
      }finally{DATA.sessions=o;DATA.ultimaCompartida=uc;window.compartirLienzo=cl;window.dibujarSesionStory=ds;window.showToast=st;compartiendoImagen=false;closeModal();}"""),
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
        registrarAccion('agenda');for(var i=0;i<30&&!document.querySelector('.semilla-vuela');i++)await espera(50); // sondea: con la máquina cargada el vuelo (300 ms + cargarExtra) puede pasar de 500 ms
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
    ("la misión de minutos cumplida con «Misiones de hoy» a la vista termina de llenar su barra (~90 % → 100 %, .8 s) antes del ✅; fuera de la vista o con reducir movimiento, salto directo", """
      var k=['misiones','sessions','acciones','semillasPremio'],o={};k.forEach(x=>o[x]=DATA[x]);
      var t0={running:studyTimer.running,start:studyTimer.start,bibIndex:studyTimer.bibIndex,tick:studyTimer.tick};
      var espera=ms=>new Promise(r=>setTimeout(r,ms)),st=window.showToast,sm=window.sinMovimiento,ev=window.encolarVuelo,ce=window.celebrar,si=window.setInterval,nuevos=0;
      var fila=()=>document.querySelector('#missionsCard [data-m="m25"]'),barra=()=>fila().querySelector('.mis-bar i');
      var prepara=min=>{studyTimer.running=true;studyTimer.tick=t0.tick||1;studyTimer.bibIndex=-1;studyTimer.start=Date.now()-min*60000-500;
        MIS_LLENA={};DATA.misiones={fecha:ymd(),ids:['m25','agenda','pomo'],hechas:{},cofre:false};renderMisiones();};
      window.showToast=()=>{};window.encolarVuelo=()=>{};window.celebrar=()=>{};window.setInterval=function(){nuevos++;return si.apply(this,arguments);};
      try{
        closeModal();goView('study');DATA.sessions=[];DATA.acciones={fecha:ymd()};window.sinMovimiento=()=>false;
        prepara(22);$('missionsCard').scrollIntoView({block:'center'});await espera(80);
        if(fila().classList.contains('ok')||barra().style.width!=='88%')return 'antes: '+barra().style.width;
        if(!/width/.test(getComputedStyle(barra()).transitionProperty)||Math.abs(parseFloat(getComputedStyle(barra()).transitionDuration)-.8)>.01)return 'sin la transición de .8 s';
        studyTimer.start=Date.now()-25*60000-500;comprobarMisiones();
        if(!DATA.misiones.hechas.m25)return 'no cumple la misión';
        if(fila().classList.contains('ok')||/✅/.test(fila().querySelector('.mis-ic').textContent))return 'salta a ✅ sin llenar la barra';
        if(barra().style.width!=='100%')return 'la barra no va al 100 %: '+barra().style.width;
        var w0=barra().getBoundingClientRect().width,wt=barra().parentNode.getBoundingClientRect().width;
        if(w0>=wt-1)return 'la barra llega de golpe';
        await espera(300);renderMisiones();
        if(fila().classList.contains('ok'))return 'un repintado a mitad corta el llenado';
        await espera(900);
        if(!fila().classList.contains('ok')||!/✅/.test(fila().querySelector('.mis-ic').textContent))return 'no pasa a ✅ tras llenarse';
        if(barra().style.width!=='100%')return 'la barra cumplida no está llena';
        renderMisiones();if(!fila().classList.contains('ok'))return 'se vuelve a llenar al repintar';
        // con reducir movimiento: ✅ al instante
        window.sinMovimiento=()=>true;prepara(22);studyTimer.start=Date.now()-25*60000-500;comprobarMisiones();
        if(!fila().classList.contains('ok'))return 'con reducir movimiento no salta a ✅';
        var rm=[].some.call(document.styleSheets,sh=>{try{return [].some.call(sh.cssRules,x=>x.media&&/reduced-motion/.test(x.media.mediaText)&&/mis-bar i[^}]*transition:\\s*none/.test(x.cssText));}catch(e){return false;}});
        if(!rm)return 'sin regla CSS de reducir movimiento';
        // fuera de la vista (otra pestaña): ✅ al instante
        window.sinMovimiento=()=>false;prepara(22);goView('map');studyTimer.start=Date.now()-25*60000-500;comprobarMisiones();
        if(!fila().classList.contains('ok'))return 'fuera de la vista no salta a ✅';
        // al cargar con la misión ya cumplida, nada se llena
        MIS_LLENA={};goView('study');renderMisiones();if(!fila().classList.contains('ok')||document.querySelector('.mis-llena'))return 'se llena al cargar';
        await espera(60);if(nuevos)return 'crea intervalos nuevos';
        return true;
      }finally{window.showToast=st;window.sinMovimiento=sm;window.encolarVuelo=ev;window.celebrar=ce;window.setInterval=si;
        studyTimer.running=t0.running;studyTimer.start=t0.start;studyTimer.bibIndex=t0.bibIndex;studyTimer.tick=t0.tick;
        k.forEach(x=>DATA[x]=o[x]);renderStudy();renderMisiones();renderSemillas();}"""),
    ("mientras la barra de la misión de minutos termina de llenarse, su contador sube con ella (22m → 25m, cifras tabulares, sin intervalos) y el toast «Misión cumplida» espera al ✅; con reducir movimiento, cifra final y toast al momento", """
      var k=['misiones','sessions','acciones','semillasPremio'],o={};k.forEach(x=>o[x]=DATA[x]);
      var t0={running:studyTimer.running,start:studyTimer.start,bibIndex:studyTimer.bibIndex,tick:studyTimer.tick};
      var espera=ms=>new Promise(r=>setTimeout(r,ms)),st=window.showToast,sm=window.sinMovimiento,ev=window.encolarVuelo,ce=window.celebrar,si=window.setInterval,nuevos=0,toasts=[];
      var fila=()=>document.querySelector('#missionsCard [data-m="m25"]'),cifra=()=>fila().querySelector('.mis-val').textContent;
      var prepara=min=>{studyTimer.running=true;studyTimer.tick=t0.tick||1;studyTimer.bibIndex=-1;studyTimer.start=Date.now()-min*60000-500;
        MIS_LLENA={};DATA.misiones={fecha:ymd(),ids:['m25','agenda','pomo'],hechas:{},cofre:false};renderMisiones();};
      window.showToast=t=>{if(/Misión cumplida/.test(t))toasts.push(fila().classList.contains('ok'));};window.encolarVuelo=()=>{};window.celebrar=()=>{};
      window.setInterval=function(){nuevos++;return si.apply(this,arguments);};
      try{
        closeModal();goView('study');DATA.sessions=[];DATA.acciones={fecha:ymd()};window.sinMovimiento=()=>false;
        prepara(22);$('missionsCard').scrollIntoView({block:'center'});await espera(80);
        if(cifra()!=='22m/25m')return 'antes: '+cifra();
        if(getComputedStyle(fila().querySelector('.mis-val')).fontVariantNumeric!=='tabular-nums')return 'cifras sin tabular';
        studyTimer.start=Date.now()-25*60000-500;comprobarMisiones();
        if(cifra()!=='22m/25m')return 'la cifra salta antes de subir: '+cifra();
        var vistos=[];
        for(var i=0;i<45&&!fila().classList.contains('ok');i++){var c=cifra();if(vistos[vistos.length-1]!==c)vistos.push(c);await espera(20);}
        var n=vistos.map(x=>parseInt(x));
        if(n.some((x,j)=>j&&x<n[j-1]))return 'la cifra baja: '+vistos.join(' ');
        if(vistos.length<3)return 'no sube poco a poco: '+vistos.join(' ');
        if(vistos[vistos.length-1]!=='25m/25m')return 'no llega a 25m antes del ✅: '+vistos.join(' ');
        if(!fila().classList.contains('ok'))return 'no pasa a ✅';
        if(toasts.length)return 'el toast sale antes del ✅';
        await espera(200);
        if(toasts.length!==1||!toasts[0])return 'el toast no sale tras el ✅: '+JSON.stringify(toasts);
        if(cifra()!=='25m/25m')return 'cifra final mal: '+cifra();
        // con reducir movimiento: cifra final y toast al momento
        toasts=[];window.sinMovimiento=()=>true;prepara(22);studyTimer.start=Date.now()-25*60000-500;comprobarMisiones();
        if(cifra()!=='25m/25m')return 'con reducir movimiento no da la cifra final: '+cifra();
        await espera(60);if(toasts.length!==1||!toasts[0])return 'con reducir movimiento el toast se retrasa';
        // fuera de la vista: igual
        toasts=[];window.sinMovimiento=()=>false;prepara(22);goView('map');studyTimer.start=Date.now()-25*60000-500;comprobarMisiones();
        if(cifra()!=='25m/25m')return 'fuera de la vista no da la cifra final: '+cifra();
        await espera(60);if(toasts.length!==1)return 'fuera de la vista el toast se retrasa';
        if(nuevos)return 'crea intervalos nuevos';
        return true;
      }finally{window.showToast=st;window.sinMovimiento=sm;window.encolarVuelo=ev;window.celebrar=ce;window.setInterval=si;
        studyTimer.running=t0.running;studyTimer.start=t0.start;studyTimer.bibIndex=t0.bibIndex;studyTimer.tick=t0.tick;
        k.forEach(x=>DATA[x]=o[x]);renderStudy();renderMisiones();renderSemillas();}"""),
    ("al pasar a ✅ tras llenarse, la misión de minutos brilla una vez (.mis-brilla: barrido --destello de .6 s) y su contador funde a --ok-tx en .3 s; nunca al cargar ni al repintar, quieto con reducir movimiento", """
      var k=['misiones','sessions','acciones','semillasPremio'],o={};k.forEach(x=>o[x]=DATA[x]);
      var t0={running:studyTimer.running,start:studyTimer.start,bibIndex:studyTimer.bibIndex,tick:studyTimer.tick};
      var espera=ms=>new Promise(r=>setTimeout(r,ms)),st=window.showToast,sm=window.sinMovimiento,ev=window.encolarVuelo,ce=window.celebrar,si=window.setInterval,nuevos=0;
      var fila=()=>document.querySelector('#missionsCard [data-m="m25"]'),val=()=>fila().querySelector('.mis-val');
      var okTx=()=>{var p=document.createElement('span');p.style.color='var(--ok-tx)';document.body.appendChild(p);var c=getComputedStyle(p).color;p.remove();return c;};
      var prepara=min=>{studyTimer.running=true;studyTimer.tick=t0.tick||1;studyTimer.bibIndex=-1;studyTimer.start=Date.now()-min*60000-500;
        MIS_LLENA={};DATA.misiones={fecha:ymd(),ids:['m25','agenda','pomo'],hechas:{},cofre:false};renderMisiones();};
      window.showToast=()=>{};window.encolarVuelo=()=>{};window.celebrar=()=>{};window.setInterval=function(){nuevos++;return si.apply(this,arguments);};
      try{
        closeModal();goView('study');DATA.sessions=[];DATA.acciones={fecha:ymd()};window.sinMovimiento=()=>false;
        prepara(22);$('missionsCard').scrollIntoView({block:'center'});
        if(document.querySelector('.mis-brilla'))return 'brilla sin cumplir';
        studyTimer.start=Date.now()-25*60000-500;comprobarMisiones();
        if(!fila().classList.contains('mis-llena'))return 'no se llena (la prueba necesita la tarjeta a la vista)';
        if(fila().classList.contains('mis-brilla'))return 'brilla mientras se llena';
        // espera al ✅ sondeando (sin depender de un tiempo exacto)
        for(var i=0;i<100&&!fila().classList.contains('ok');i++)await espera(30);
        if(!fila().classList.contains('ok'))return 'no pasa a ✅';
        if(!fila().classList.contains('mis-brilla'))return 'no brilla al pasar a ✅';
        if(document.querySelectorAll('.mis-brilla').length!==1)return 'brilla más de una fila';
        var af=getComputedStyle(fila().querySelector('.mis-bar i'),'::after');
        if(af.animationName!=='misBrilla'||Math.abs(parseFloat(af.animationDuration)-.6)>.01||af.animationIterationCount!=='1')return 'brillo mal: '+af.animationName+' '+af.animationDuration;
        if(!/linear-gradient/.test(af.backgroundImage))return 'el brillo no es un barrido';
        var cv=getComputedStyle(val());
        if(cv.animationName!=='misValOk'||Math.abs(parseFloat(cv.animationDuration)-.3)>.01)return 'el contador no funde: '+cv.animationName;
        var css=[].map.call(document.styleSheets,sh=>{try{return [].map.call(sh.cssRules,x=>x.cssText).join(' ');}catch(e){return '';}}).join(' ');
        if(!/\\.mis-bar i::after[^}]*var\\(--destello\\)/.test(css))return 'el brillo no usa --destello';
        if(!/\\.mis\\.ok \\.mis-val\\s*\\{[^}]*var\\(--ok-tx\\)/.test(css))return 'el contador cumplido no va en --ok-tx';
        // al repintar ya no brilla, pero la cifra sigue verde
        renderMisiones();
        if(document.querySelector('.mis-brilla'))return 'vuelve a brillar al repintar';
        await espera(350);
        if(getComputedStyle(val()).color!==okTx())return 'el contador cumplido no queda en --ok-tx: '+getComputedStyle(val()).color;
        // al cargar con la misión ya cumplida: verde quieto, sin brillo ni fundido
        MIS_LLENA={};renderMisiones();
        if(document.querySelector('.mis-brilla')||getComputedStyle(val()).animationName!=='none')return 'brilla al cargar';
        // con reducir movimiento: ✅ directo, sin brillo, y regla @media que lo apaga
        window.sinMovimiento=()=>true;prepara(22);studyTimer.start=Date.now()-25*60000-500;comprobarMisiones();
        if(!fila().classList.contains('ok')||document.querySelector('.mis-brilla'))return 'con reducir movimiento brilla';
        var rm=[].some.call(document.styleSheets,sh=>{try{return [].some.call(sh.cssRules,x=>x.media&&/reduced-motion/.test(x.media.mediaText)&&/mis-brilla \\.mis-bar i::after[^}]*display:\\s*none/.test(x.cssText)&&/mis-brilla \\.mis-val[^}]*animation[^;}]*none/.test(x.cssText));}catch(e){return false;}});
        if(!rm)return 'sin regla CSS de reducir movimiento para el brillo';
        if(nuevos)return 'crea intervalos nuevos';
        return true;
      }finally{window.showToast=st;window.sinMovimiento=sm;window.encolarVuelo=ev;window.celebrar=ce;window.setInterval=si;
        studyTimer.running=t0.running;studyTimer.start=t0.start;studyTimer.bibIndex=t0.bibIndex;studyTimer.tick=t0.tick;
        k.forEach(x=>DATA[x]=o[x]);renderStudy();renderMisiones();renderSemillas();}"""),
    ("el barrido de .mis-brilla es luz en claro y en oscuro (--destello blanco, nunca la pizarra de --glass-fuerte)", """
      var h=document.documentElement,t0=h.getAttribute('data-theme');
      var f=document.createElement('div');f.className='mis mis-brilla';f.innerHTML='<div class="mis-bar"><i style="width:50%"></i></div>';
      document.body.appendChild(f);
      var lee=tema=>{h.setAttribute('data-theme',tema);var bg=getComputedStyle(f.querySelector('i'),'::after').backgroundImage;
        var m=bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/g)||[];
        var c=m.map(x=>x.match(/[\\d.]+/g).map(Number)).filter(v=>(v[3]===undefined?1:v[3])>0);
        return {bg:bg,c:c};};
      try{
        for(var [tema,amin,amax] of [['light',.45,.65],['dark',.25,.45]]){
          var r=lee(tema);
          if(r.c.length!==1)return tema+': el barrido no tiene un solo color visible: '+r.bg;
          var v=r.c[0];
          if(v[0]<240||v[1]<240||v[2]<240)return tema+': el barrido no es blanco: '+r.bg;
          if(v[3]<amin||v[3]>amax)return tema+': opacidad del barrido fuera de rango: '+v[3];
        }
        return true;
      }finally{f.remove();if(t0===null)h.removeAttribute('data-theme');else h.setAttribute('data-theme',t0);}"""),
    ("al abrir el cofre, la tarjeta en oro recibe una vez el barrido --destello de .mis-brilla (.cofre-brilla, .6 s, en pausa bajo la ventana); nunca al recargar con el cofre abierto, quieta con reducir movimiento", """
      await cargarExtra();
      var k=['misiones','sellosMisiones','cofresAbiertos','semillasPremio','streakFreezes'],o={};k.forEach(x=>o[x]=DATA[x]);
      var sm=window.sinMovimiento,ev=window.encolarVuelo,ce=window.celebrar,cf=window.confeti,st=window.showToast;
      var cof=()=>document.querySelector('#missionsCard .cofre'),af=()=>getComputedStyle(cof(),'::after');
      var lista=()=>{var M=misionesDeHoy();M.cofre=false;M.ids.forEach(id=>M.hechas[id]=M.hechas[id]||new Date().toISOString());renderMisiones();return M;};
      window.encolarVuelo=()=>{};window.celebrar=()=>{};window.confeti=()=>{};window.showToast=()=>{};
      try{
        closeModal();goView('study');window.sinMovimiento=()=>false;
        lista();
        if(!cof().classList.contains('listo')||document.querySelector('.cofre-brilla'))return 'brilla antes de abrir';
        abrirCofre(cof());
        if(!cof().classList.contains('abierto')||!cof().classList.contains('cofre-brilla'))return 'no brilla al abrir';
        var a=af();
        if(a.animationName!=='cofreBrilla'||Math.abs(parseFloat(a.animationDuration)-.6)>.01||a.animationIterationCount!=='1')return 'brillo mal: '+a.animationName+' '+a.animationDuration;
        if(!/linear-gradient/.test(a.backgroundImage))return 'el brillo no es un barrido';
        if(CSS.supports('selector(:has(a))')&&a.animationPlayState!=='paused')return 'barre debajo de la ventana: '+a.animationPlayState;
        closeModal();
        if(af().animationPlayState!=='running')return 'no barre al cerrar la ventana';
        if(getComputedStyle(cof()).overflow!=='visible')return 'recorta el sello';
        var css=[].map.call(document.styleSheets,sh=>{try{return [].map.call(sh.cssRules,x=>x.cssText).join(' ');}catch(e){return '';}}).join(' ');
        if(!/\\.cofre-brilla::after[^}]*var\\(--destello\\)/.test(css))return 'el brillo no usa --destello';
        // tras barrer (.6 s), el repintado siguiente (cada 30 s con el cronómetro) y la recarga con el cofre ya abierto: oro quieto
        await new Promise(r=>setTimeout(r,900));
        if(document.querySelector('.cofre-brilla'))return 'no se quita al acabar el barrido';
        renderMisiones();
        if(document.querySelector('.cofre-brilla'))return 'vuelve a brillar al repintar';
        $('missionsCard').innerHTML='';renderMisiones();
        if(!cof().classList.contains('abierto')||document.querySelector('.cofre-brilla')||af().animationName!=='none')return 'brilla al recargar con el cofre abierto';
        // con reducir movimiento: ni clase, y regla @media que lo apaga
        window.sinMovimiento=()=>true;lista();abrirCofre(cof());closeModal();
        if(!cof().classList.contains('abierto')||document.querySelector('.cofre-brilla'))return 'con reducir movimiento brilla';
        var rm=[].some.call(document.styleSheets,sh=>{try{return [].some.call(sh.cssRules,x=>x.media&&/reduced-motion/.test(x.media.mediaText)&&/cofre-brilla::after[^}]*display:\\s*none/.test(x.cssText));}catch(e){return false;}});
        if(!rm)return 'sin regla CSS de reducir movimiento para el brillo del cofre';
        return true;
      }finally{window.sinMovimiento=sm;window.encolarVuelo=ev;window.celebrar=ce;window.confeti=cf;window.showToast=st;closeModal();
        k.forEach(x=>DATA[x]=o[x]);renderMisiones();renderSemillas();}"""),
    ("el barrido del cofre sigue pendiente si la tarjeta se repinta con la ventana abierta (p. ej. el tick de 30 s) y se ve una sola vez al cerrarla", """
      await cargarExtra();
      var k=['misiones','sellosMisiones','cofresAbiertos','semillasPremio','streakFreezes'],o={};k.forEach(x=>o[x]=DATA[x]);
      var sm=window.sinMovimiento,ev=window.encolarVuelo,ce=window.celebrar,cf=window.confeti,st=window.showToast,espera=ms=>new Promise(r=>setTimeout(r,ms));
      var cof=()=>document.querySelector('#missionsCard .cofre'),af=()=>getComputedStyle(cof(),'::after');
      var lista=()=>{var M=misionesDeHoy();M.cofre=false;M.ids.forEach(id=>M.hechas[id]=M.hechas[id]||new Date().toISOString());renderMisiones();return M;};
      window.encolarVuelo=()=>{};window.celebrar=()=>{};window.confeti=()=>{};window.showToast=()=>{};
      try{
        closeModal();goView('study');window.sinMovimiento=()=>false;COFRE_BRILLA=0;
        lista();abrirCofre(cof());
        if(!document.querySelector('#modalRoot .modal-bg'))return 'no se abre la ventana del cofre';
        // repintados con la ventana abierta (como el de cada 30 s con el cronómetro): la clase sigue
        renderMisiones();await espera(800);renderMisiones();
        if(!cof().classList.contains('cofre-brilla'))return 'el repintado con la ventana abierta quita el barrido';
        if(CSS.supports('selector(:has(a))')&&af().animationPlayState!=='paused')return 'barre debajo de la ventana tras repintar';
        var fin=0,cuenta=e=>{if(e.animationName==='cofreBrilla')fin++;};$('missionsCard').addEventListener('animationend',cuenta);
        closeModal();
        if(!cof().classList.contains('cofre-brilla')||af().animationPlayState!=='running')return 'no barre al cerrar la ventana';
        await espera(900);$('missionsCard').removeEventListener('animationend',cuenta);
        if(fin!==1)return 'el barrido no se ve una vez al cerrar: '+fin;
        if(cof().classList.contains('cofre-brilla'))return 'la clase sigue tras barrer';
        renderMisiones();
        if(document.querySelector('.cofre-brilla'))return 'se repite al repintar tras verlo';
        $('missionsCard').innerHTML='';renderMisiones();
        if(document.querySelector('.cofre-brilla'))return 'se repite al recargar';
        // con reducir movimiento: ni con repintados bajo la ventana
        window.sinMovimiento=()=>true;lista();abrirCofre(cof());renderMisiones();closeModal();renderMisiones();
        if(document.querySelector('.cofre-brilla'))return 'con reducir movimiento brilla';
        return true;
      }finally{window.sinMovimiento=sm;window.encolarVuelo=ev;window.celebrar=ce;window.confeti=cf;window.showToast=st;closeModal();COFRE_BRILLA=0;
        k.forEach(x=>DATA[x]=o[x]);renderMisiones();renderSemillas();}"""),
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
    ("el 🧊 ganado por 7 días seguidos vuela del aviso a la pastilla de la racha y la racha dice «🧊 +1 por 7 días seguidos» (no «del cofre»); con reducir movimiento, solo la cifra", """
      await cargarExtra();
      var k=['sessions','streakFreezes','usedFreezeDates','lastFreezeEarnedAtStreak'],o={};k.forEach(x=>o[x]=DATA[x]);
      var espera=ms=>new Promise(r=>setTimeout(r,ms)),sm=window.sinMovimiento,vh=window.volarHielo,vuelos=[];
      var limpia=()=>document.querySelectorAll('.pill-hielo,.hielo-vuela,.toast').forEach(x=>x.remove());
      var hace=n=>{var d=new Date();d.setDate(d.getDate()-n);return ymd(d);};
      var gana=()=>{var ss=[];for(var i=0;i<7;i++)ss.push({id:'zr'+i,date:hace(i),min:30,ts:Date.now()-i*864e5,bib:NO_BIB});
        DATA.sessions=ss;DATA.usedFreezeDates=[];DATA.streakFreezes=0;DATA.lastFreezeEarnedAtStreak=0;renderRacha();checkStreakFreezes();};
      window.volarHielo=function(r,e,ho){vuelos.push([r,e,ho]);return vh.apply(this,arguments);};
      try{
        closeModal();goView('study');while(VUELO.t||VUELO.n||VUELO.h)await espera(250);await espera(1500);limpia();
        gana();
        if(DATA.streakFreezes!==1)return 'no se gana el congelador';
        var t=$('toastHielo');if(!t)return 'sin aviso';var tr=t.getBoundingClientRect();
        await espera(700);
        if(vuelos.length!==1||vuelos[0][2]!=='racha')return 'no vuela o sin origen racha: '+JSON.stringify(vuelos.map(v=>v[2]));
        var r=vuelos[0][0];if(!r||Math.abs(r.top-tr.top)>40)return 'no sale del aviso';
        if(!document.querySelector('.hielo-vuela'))return 'no se ve el 🧊 volando';
        await espera(1300);
        var c=document.querySelector('.pill-hielo');
        if(!c||c.textContent.trim()!=='🧊 1')return 'la pastilla no enseña 🧊 1: '+(c&&c.textContent);
        c.click();await espera(50);
        var de=document.querySelector('#modalRoot .rs-hielo-de');
        if(!de||!/por 7 días seguidos/.test(de.textContent)||/cofre/.test(de.textContent))return 'atribuye mal el 🧊: '+(de&&de.textContent);
        closeModal();renderStudy();await espera(700);
        if(vuelos.length!==1)return 'vuela dos veces';
        limpia();window.sinMovimiento=()=>true;vuelos=[];gana();await espera(700);
        if(document.querySelector('.hielo-vuela'))return 'vuela con reducir movimiento';
        c=document.querySelector('.pill-hielo');if(!c||c.textContent.trim()!=='🧊 1'||c.classList.contains('ph-rebote')||c._nuevo!=='racha')return 'con reducir movimiento no da solo la cifra';
        return true;
      }finally{window.sinMovimiento=sm;window.volarHielo=vh;k.forEach(x=>DATA[x]=o[x]);closeModal();limpia();renderRacha();}"""),
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
    ("la casilla «🧊 Congeladores» enseña los 3 huecos (con 2: dos 🧊 y un círculo libre en --borde, sin rojo; aria-label «2 de 3 congeladores») sin romper la cifra ni el resaltado", """
      await cargarExtra();
      var k=['streakFreezes'],o={};k.forEach(x=>o[x]=DATA[x]);
      try{
        closeModal();DATA.streakFreezes=2;abrirRacha("hielo");
        var h=document.querySelector('#modalRoot .racha-stats .rs-hielo'),z=h&&h.querySelector('.rs-huecos');
        if(!z)return 'no hay huecos en la casilla';
        if(!h.classList.contains('rs-foco')||!/🧊 2/.test(h.querySelector('b').innerText))return 'rompe la cifra o el resaltado';
        if(z.getAttribute('role')!=='img'||z.getAttribute('aria-label')!=='2 de 3 congeladores')return 'aria: '+z.getAttribute('aria-label');
        var ll=z.querySelectorAll('i.lleno'),li=z.querySelectorAll('i.libre');
        if(z.children.length!==3||ll.length!==2||li.length!==1)return 'huecos: '+ll.length+' llenos, '+li.length+' libres';
        if([].some.call(ll,x=>x.textContent!=='🧊')||li[0].textContent!=='')return 'contenido de los huecos';
        var c=document.createElement('i');c.style.borderColor='var(--borde)';document.body.appendChild(c);var borde=getComputedStyle(c).borderTopColor;c.remove();
        var e=getComputedStyle(li[0]);if(e.borderTopColor!==borde||parseFloat(e.borderTopWidth)<1)return 'el libre no lleva borde --borde: '+e.borderTopColor;
        if(e.borderTopLeftRadius!=='50%'&&parseFloat(e.borderTopLeftRadius)<8)return 'el libre no es un círculo';
        var rojo=/rgb\\(2[0-5]\\d, [0-9]{1,2}, [0-9]{1,2}/;if(rojo.test(e.borderTopColor)||rojo.test(e.backgroundColor))return 'es roja';
        if(/falta/i.test(h.innerText))return 'mete presión';
        if(e.animationName!=='none'||getComputedStyle(ll[0]).animationName!=='none')return 'lleva animación';
        var r=z.getBoundingClientRect(),b=h.querySelector('b').getBoundingClientRect();if(r.top<b.bottom-1||r.right>h.getBoundingClientRect().right+1)return 'no va bajo la cifra dentro de la casilla';
        if(document.documentElement.scrollWidth>innerWidth)return 'desborda en horizontal';
        closeModal();DATA.streakFreezes=0;abrirRacha();
        z=document.querySelector('#modalRoot .rs-huecos');
        if(!z||z.querySelectorAll('i.libre').length!==3||z.getAttribute('aria-label')!=='0 de 3 congeladores')return 'con 0';
        closeModal();DATA.streakFreezes=3;abrirRacha();
        z=document.querySelector('#modalRoot .rs-huecos');
        if(!z||z.querySelectorAll('i.lleno').length!==3||z.getAttribute('aria-label')!=='3 de 3 congeladores, completo')return 'con 3';
        return true;
      }finally{clearTimeout(abrirRacha.t);k.forEach(x=>DATA[x]=o[x]);closeModal();}"""),
    ("con 3 de 3 congeladores la casilla «🧊 Congeladores» celebra con «¡Completo!» en --ok-tx bajo los huecos (aria-label «3 de 3 congeladores, completo»); con 2, nada", """
      await cargarExtra();
      var k=['streakFreezes'],o={};k.forEach(x=>o[x]=DATA[x]);
      try{
        closeModal();DATA.streakFreezes=3;abrirRacha("hielo");
        var h=document.querySelector('#modalRoot .racha-stats .rs-hielo'),z=h&&h.querySelector('.rs-huecos'),c=h&&h.querySelector('.rs-completo');
        if(!z||!c)return 'con 3 no hay «¡Completo!»';
        if(c.textContent!=='¡Completo!')return 'texto: '+c.textContent;
        if(z.getAttribute('aria-label')!=='3 de 3 congeladores, completo')return 'aria: '+z.getAttribute('aria-label');
        if(!/🧊 3/.test(h.querySelector('b').innerText)||!h.classList.contains('rs-foco'))return 'cambia la cifra o el resaltado';
        var t=document.createElement('i');t.style.color='var(--ok-tx)';t.style.fontSize='var(--fs-2xs)';document.body.appendChild(t);var ct=getComputedStyle(t),col=ct.color,fs=ct.fontSize;t.remove();
        var e=getComputedStyle(c);
        if(e.color!==col)return 'no va en --ok-tx: '+e.color;
        if(e.fontSize!==fs||e.fontWeight!=='700')return 'tamaño/peso: '+e.fontSize+' '+e.fontWeight;
        if(e.animationName!=='none')return 'lleva animación';
        var rc=c.getBoundingClientRect(),rz=z.getBoundingClientRect(),rh=h.getBoundingClientRect();
        if(rc.top<rz.bottom-1||rc.left<rh.left-1||rc.right>rh.right+1)return 'no va bajo los huecos dentro de la casilla';
        if(document.documentElement.scrollWidth>innerWidth)return 'desborda en horizontal';
        closeModal();DATA.streakFreezes=2;abrirRacha();
        if(document.querySelector('#modalRoot .rs-completo'))return 'con 2 también sale';
        if(document.querySelector('#modalRoot .rs-huecos').getAttribute('aria-label')!=='2 de 3 congeladores')return 'con 2 cambia el aria-label';
        return true;
      }finally{clearTimeout(abrirRacha.t);k.forEach(x=>DATA[x]=o[x]);closeModal();}"""),
    ("tras el 🧊 del cofre, tocar su insignia «🧊 N» abre la racha y el hueco recién llenado (el último i.lleno) rebota una vez con svRebote; desde «🧊 ✓» o la pastilla, quieto; con reducir movimiento, sin animación", """
      await cargarExtra();
      var k=['streakFreezes'],o={};k.forEach(x=>o[x]=DATA[x]);
      var espera=ms=>new Promise(r=>setTimeout(r,ms)),sm=window.sinMovimiento;
      var limpia=()=>document.querySelectorAll('.pill-hielo,.hielo-vuela').forEach(x=>x.remove());
      try{
        closeModal();goView('study');while(VUELO.t||VUELO.n||VUELO.h)await espera(250);limpia();
        window.sinMovimiento=()=>false;DATA.streakFreezes=2;renderRacha();volarHielo(null,0);
        var b=null;for(var i=0;i<30&&!b;i++){await espera(100);b=document.querySelector('.pill-hielo');}
        if(!b)return 'el 🧊 no llega a la pastilla';
        b.click();await espera(50);
        var z=document.querySelector('#modalRoot .rs-huecos'),ll=z&&z.querySelectorAll('i.lleno'),nv=z&&z.querySelectorAll('.rs-nuevo');
        if(!z||ll.length!==2||nv.length!==1||nv[0]!==ll[1])return 'no rebota el último hueco lleno';
        var e=getComputedStyle(nv[0]);
        if(e.animationName!=='svRebote'||e.animationIterationCount!=='1')return 'animación: '+e.animationName+' × '+e.animationIterationCount;
        var rm=[].some.call(document.styleSheets,sh=>{try{return [].some.call(sh.cssRules,x=>x.media&&/reduced-motion/.test(x.media.mediaText)&&/rs-nuevo[^}]*animation[^;}]*none/.test(x.cssText));}catch(e){return false;}});
        if(!rm)return 'sin regla de reducir movimiento para el rebote';
        if(!document.querySelector('#modalRoot .rs-hielo.rs-foco'))return 'rompe el resaltado de la casilla';
        closeModal();abrirRacha();
        if(document.querySelector('#modalRoot .rs-nuevo'))return 'rebota al abrir la racha desde la pastilla';
        closeModal();limpia();hieloSalva();b=document.querySelector('.pill-hielo');
        if(!b)return 'sin insignia «🧊 ✓»';
        b.click();await espera(50);
        if(document.querySelector('#modalRoot .rs-nuevo'))return 'rebota desde «🧊 ✓» (no se ha ganado ninguno)';
        return true;
      }finally{window.sinMovimiento=sm;clearTimeout(abrirRacha.t);k.forEach(x=>DATA[x]=o[x]);closeModal();limpia();renderRacha();}"""),
    ("desde la insignia del 🧊 recién ganado en el cofre, la línea bajo las cifras dice antes «🧊 +1 del cofre de hoy · » en --ok-tx (700, sin animación); desde la pastilla o «🧊 ✓», la línea de siempre", """
      await cargarExtra();
      var k=['streakFreezes'],o={};k.forEach(x=>o[x]=DATA[x]);
      var espera=ms=>new Promise(r=>setTimeout(r,ms)),sm=window.sinMovimiento;
      var limpia=()=>document.querySelectorAll('.pill-hielo,.hielo-vuela').forEach(x=>x.remove());
      var siempre='Ganas uno cada 7 días seguidos y, a veces, en el cofre del día (máx. 3).';
      try{
        closeModal();goView('study');while(VUELO.t||VUELO.n||VUELO.h)await espera(250);limpia();
        window.sinMovimiento=()=>true;DATA.streakFreezes=2;renderRacha();volarHielo(null,0);
        var b=document.querySelector('.pill-hielo');if(!b)return 'sin insignia del 🧊 del cofre';
        b.click();await espera(50);
        var l=document.querySelector('#modalRoot .racha-stats .rs-hielo-como'),d=l&&l.querySelector('.rs-hielo-de');
        if(!l||l.innerText.trim()!=='🧊 +1 del cofre de hoy · '+siempre)return 'texto: '+(l&&l.innerText);
        if(!d||d.textContent!=='🧊 +1 del cofre de hoy')return 'sin el tramo del cofre';
        var c=document.createElement('i');c.style.color='var(--ok-tx)';document.body.appendChild(c);var ok=getComputedStyle(c).color;c.remove();
        var e=getComputedStyle(d);
        if(e.color!==ok||e.fontWeight!=='700')return 'no va en --ok-tx 700: '+e.color+' '+e.fontWeight;
        if(e.animationName!=='none')return 'lleva animación';
        if(/falta|pierdes|perder/i.test(l.innerText))return 'mete presión';
        if(document.documentElement.scrollWidth>innerWidth)return 'desborda en horizontal';
        closeModal();abrirRacha();
        l=document.querySelector('#modalRoot .rs-hielo-como');
        if(!l||l.querySelector('.rs-hielo-de')||l.innerText.trim()!==siempre)return 'desde la pastilla: '+(l&&l.innerText);
        closeModal();limpia();hieloSalva();b=document.querySelector('.pill-hielo');
        if(!b)return 'sin insignia «🧊 ✓»';
        b.click();await espera(50);
        l=document.querySelector('#modalRoot .rs-hielo-como');
        if(!l||/cofre de hoy/.test(l.innerText))return 'desde «🧊 ✓» habla del cofre';
        return true;
      }finally{window.sinMovimiento=sm;clearTimeout(abrirRacha.t);k.forEach(x=>DATA[x]=o[x]);closeModal();limpia();renderRacha();}"""),
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
    ("minicronómetro: «✅ 2/3» rebota una sola vez al cumplir una misión fuera de Estudio; no al repintar, recargar, en Estudio ni con «reducir movimiento»", """
      var k=['misiones','sessions','acciones'],o={};k.forEach(x=>o[x]=DATA[x]);
      var t0={running:studyTimer.running,start:studyTimer.start,bibIndex:studyTimer.bibIndex,tick:studyTimer.tick},el=$('misCerca'),mi=$('miniMis'),ms=$('miniStudy');
      var viejo=new Date(Date.now()-5*3600000).toISOString(),oculto0=ms.classList.contains('hidden'),sm=window.sinMovimiento,espera=n=>new Promise(r=>setTimeout(r,n));
      var inicios=0,cuenta=e=>{if(e.animationName==='svRebote')inicios++;};
      var pinta=hechas=>{DATA.misiones={fecha:ymd(),ids:['m25','agenda','pomo'],hechas:hechas,cofre:false};el._clave=null;renderMisCerca();};
      var ciclo=async()=>{delete mi._nh;mi.classList.remove('mm-rebote');pinta({agenda:viejo});
        if(mi.classList.contains('mm-rebote'))return 'rebota sin cumplir nada';
        pinta({agenda:viejo,m25:new Date(Date.now()-60000).toISOString()});await espera(80);return '';};
      try{
        closeModal();goView('map');DATA.sessions=[];DATA.acciones={fecha:ymd()};ms.classList.remove('hidden');mi.addEventListener('animationstart',cuenta);
        studyTimer.running=true;studyTimer.tick=t0.tick||1;studyTimer.bibIndex=-1;studyTimer.start=Date.now()-26*60000-500;
        var e=await ciclo();if(e)return e;
        if(!mi.classList.contains('mm-rebote')||!/✅ 2.3/.test(mi.innerText))return 'no rebota al cumplir';
        if(inicios!==1)return 'la animación svRebote no arranca una vez: '+inicios;
        await espera(600);pinta(DATA.misiones.hechas);el._clave=null;renderMisCerca();await espera(80);
        if(inicios!==1)return 'vuelve a rebotar al repintar';
        // recarga con la misión ya hecha: sin cuenta anterior, quieto
        delete mi._nh;mi.classList.remove('mm-rebote');pinta(DATA.misiones.hechas);
        if(mi.classList.contains('mm-rebote'))return 'rebota al cargar con misiones ya hechas';
        // pasa a «🎯»/se oculta: la clase se va para no repetirse al volver a salir
        studyTimer.running=false;el._clave=null;renderMisCerca();studyTimer.running=true;
        if(mi.classList.contains('mm-rebote'))return 'la clase se queda al ocultarse';
        goView('study');e=await ciclo();if(e)return e;
        if(mi.classList.contains('mm-rebote'))return 'rebota estando en Estudio';
        goView('map');window.sinMovimiento=()=>true;e=await ciclo();window.sinMovimiento=sm;if(e)return e;
        if(mi.classList.contains('mm-rebote'))return 'rebota con «reducir movimiento»';
        var rm=[].some.call(document.styleSheets,sh=>{try{return [].some.call(sh.cssRules,x=>x.media&&/reduced-motion/.test(x.media.mediaText)&&/mm-rebote[^}]*animation[^};]*none/.test(x.cssText));}catch(err){return false;}});
        if(!rm)return 'el CSS no lo para con prefers-reduced-motion';
        return true;
      }finally{window.sinMovimiento=sm;mi.removeEventListener('animationstart',cuenta);mi.classList.remove('mm-rebote');goView('map');await espera(300);
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
    ("con las 3 misiones hechas y el cofre sin abrir, la píldora dice «🎁 3/3», lleva al cofre y vuelve a «✅ 3/3» al abrirlo", """
      var k=['misiones','sessions','acciones','semillasPremio','streakFreezes','cofresAbiertos','sellosMisiones'],o={};k.forEach(x=>o[x]=DATA[x]);
      var t0={running:studyTimer.running,start:studyTimer.start,bibIndex:studyTimer.bibIndex,tick:studyTimer.tick},el=$('misCerca'),mi=$('miniMis'),ms=$('miniStudy');
      var viejo=new Date(Date.now()-5*3600000).toISOString(),ya=new Date(Date.now()-60000).toISOString(),oculto0=ms.classList.contains('hidden'),espera=n=>new Promise(r=>setTimeout(r,n));
      var vis=()=>{var v=mi.querySelector('[aria-hidden="true"]');return mi.classList.contains('hidden')||!v?'':v.textContent.trim();};
      try{
        await cargarExtra();closeModal();goView('map');DATA.sessions=[];DATA.acciones={fecha:ymd()};ms.classList.remove('hidden');
        studyTimer.running=true;studyTimer.tick=t0.tick||1;studyTimer.bibIndex=-1;studyTimer.start=Date.now()-26*60000-500;
        DATA.misiones={fecha:ymd(),ids:['m25','agenda','pomo'],hechas:{agenda:viejo,pomo:viejo,m25:ya},cofre:false};el._clave=null;renderMisCerca();renderMisiones();
        if(vis()!=='🎁 3/3')return 'con el cofre cerrado dice «'+vis()+'»';
        if(!/cofre/i.test(mi.getAttribute('aria-label')||'')||!/cofre/i.test(mi.querySelector('.sr-solo').textContent))return 'la etiqueta no habla del cofre';
        if(!/tu cofre te espera/.test(el.innerText))return 'no cuadra con la barrita';
        var c=getComputedStyle(mi),rojo=/rgb\\(2[0-5]\\d, [0-9]{1,2}, [0-9]{1,2}\\)/;if(rojo.test(c.color)||rojo.test(c.backgroundColor))return 'es roja';
        $('viewStudy').scrollTop=0;mi.click();await espera(800);
        if($('viewStudy').classList.contains('hidden'))return 'no abre Estudio';
        if(document.querySelector('#missionsCard .mis-foco'))return 'resalta una fila en vez del cofre';
        var b=document.querySelector('#missionsCard .cofre.listo'),r=b&&b.getBoundingClientRect(),v=$('viewStudy').getBoundingClientRect();
        if(!b||!(r.top>=v.top-1&&r.bottom<=v.bottom+1))return 'el cofre no queda a la vista';
        goView('map');abrirCofre(b);closeModal();await espera(50);
        if(vis()!=='✅ 3/3')return 'tras abrir el cofre dice «'+vis()+'»';
        if(mi.dataset.m==='cofre'||/cofre/i.test(mi.getAttribute('aria-label')))return 'sigue llevando al cofre ya abierto';
        if(/cuenta atrás|pierdes|corre|rápido/i.test(mi.innerText))return 'mete presión';
        return true;
      }finally{clearTimeout(irAMision.t);studyTimer.running=t0.running;studyTimer.start=t0.start;studyTimer.bibIndex=t0.bibIndex;studyTimer.tick=t0.tick;MIS_FOCO={id:'',hasta:0};
        clearTimeout(VUELO.t);VUELO.t=0;VUELO.n=VUELO.h=VUELO.z=0;VUELO.hr=null;
        k.forEach(x=>DATA[x]=o[x]);saveUserData();closeModal();el&&(el._clave=null);ms.classList.toggle('hidden',oculto0);goView('map');await espera(300);renderMisCerca();renderStudy();renderSemillas();}"""),
    ("la barrita «· tu cofre te espera 🎁» lleva al cofre y, ya abierto, vuelve a llevar a las misiones", """
      var k=['misiones','sessions','acciones','semillasPremio','streakFreezes','cofresAbiertos','sellosMisiones'],o={};k.forEach(x=>o[x]=DATA[x]);
      var t0={running:studyTimer.running,start:studyTimer.start,bibIndex:studyTimer.bibIndex,tick:studyTimer.tick},el=$('misCerca');
      var viejo=new Date(Date.now()-5*3600000).toISOString(),ya=new Date(Date.now()-60000).toISOString(),espera=n=>new Promise(r=>setTimeout(r,n));
      try{
        await cargarExtra();closeModal();goView('study');DATA.sessions=[];DATA.acciones={fecha:ymd()};
        studyTimer.running=true;studyTimer.tick=t0.tick||1;studyTimer.bibIndex=-1;studyTimer.start=Date.now()-26*60000-500;
        DATA.misiones={fecha:ymd(),ids:['m25','agenda','pomo'],hechas:{agenda:viejo,pomo:viejo,m25:ya},cofre:false};el._clave=null;renderMisCerca();renderMisiones();
        if(el.classList.contains('hidden')||!/tu cofre te espera/.test(el.innerText))return 'la barrita no dice que el cofre espera';
        if(el.tagName!=='BUTTON'||el.dataset.m!=='cofre')return 'no lleva data-m="cofre" ('+el.dataset.m+')';
        if(el.getAttribute('aria-label')!=='Cofre listo: ir a abrir tu cofre de misiones')return 'etiqueta: '+el.getAttribute('aria-label');
        if(el.getAttribute('aria-label')!==$('miniMis').getAttribute('aria-label'))return 'no cuadra con la píldora';
        $('viewStudy').scrollTop=0;el.click();await espera(800);
        if(document.querySelector('#missionsCard .mis-foco'))return 'resalta una fila en vez del cofre';
        var b=document.querySelector('#missionsCard .cofre.listo'),r=b&&b.getBoundingClientRect(),v=$('viewStudy').getBoundingClientRect();
        if(!b||!(r.top>=v.top-1&&r.bottom<=v.bottom+1))return 'el cofre no queda a la vista';
        abrirCofre(b);closeModal();await espera(50);
        if(el.dataset.m==='cofre'||/cofre/i.test(el.getAttribute('aria-label')||''))return 'sigue llevando al cofre ya abierto';
        if(!/Ver misiones de hoy/.test(el.getAttribute('aria-label')||''))return 'sin cofre, la etiqueta cambió: '+el.getAttribute('aria-label');
        return true;
      }finally{clearTimeout(irAMision.t);studyTimer.running=t0.running;studyTimer.start=t0.start;studyTimer.bibIndex=t0.bibIndex;studyTimer.tick=t0.tick;MIS_FOCO={id:'',hasta:0};
        clearTimeout(VUELO.t);VUELO.t=0;VUELO.n=VUELO.h=VUELO.z=0;VUELO.hr=null;
        k.forEach(x=>DATA[x]=o[x]);saveUserData();closeModal();el&&(el._clave=null);goView('map');await espera(300);renderMisCerca();renderStudy();renderSemillas();}"""),
    ("«Sesión terminada» con las 3 misiones y el cofre sin abrir: «🎁 Tu cofre de misiones te espera» en --suave y «Abrirlo» guarda y lleva al cofre (nada con 2/3 ni con el cofre abierto)", """
      var k=['misiones','sessions','acciones','semillasPremio','streakFreezes','cofresAbiertos','sellosMisiones'],o={};k.forEach(x=>o[x]=DATA[x]);
      var viejo=new Date(Date.now()-5*3600000).toISOString(),espera=n=>new Promise(r=>setTimeout(r,n)),hoy=ymd();
      var mk=i=>({id:'ce'+i,date:hoy,min:30,ts:Date.now()-60000,bib:NO_BIB,focus:'ok',esp:'roble',prod:null,note:''});
      var abre=(hechas,cofre)=>{closeModal();DATA.misiones={fecha:hoy,ids:['m25','agenda','pomo'],hechas:hechas,cofre:cofre};var s=mk(Math.random());DATA.sessions=[s];pedirValoracion(s,null);return s;};
      var tres={m25:viejo,agenda:viejo,pomo:viejo};
      try{
        await cargarExtra();closeModal();goView('map');DATA.acciones={fecha:hoy};
        abre({m25:viejo,agenda:viejo},false);if(document.querySelector('#modalRoot .ses-cofre'))return 'sale con 2/3';
        abre(tres,true);if(document.querySelector('#modalRoot .ses-cofre'))return 'sale con el cofre ya abierto';
        var s=abre(tres,false),l=document.querySelector('#modalRoot .ses-cofre'),b=$('sessCofre');
        if(!l||!/🎁 Tu cofre de misiones te espera/.test(l.innerText))return 'no sale la línea';
        var m=$('modalRoot').innerHTML;if(m.indexOf('ses-cofre')<m.indexOf('Sesión terminada</h3>')||m.indexOf('ses-cofre')>m.indexOf('prodStars'))return 'no va bajo «Sesión terminada»';
        var c=getComputedStyle(l),rojo=/rgb\\(2[0-5]\\d, [0-9]{1,2}, [0-9]{1,2}\\)/;
        var t=document.createElement('i');t.style.color='var(--suave)';document.body.appendChild(t);var su=getComputedStyle(t).color;t.remove();if(c.color!==su)return 'no va en --suave: '+c.color;
        if(rojo.test(c.color)||rojo.test(getComputedStyle(b).color)||rojo.test(getComputedStyle(b).backgroundColor)||c.animationName!=='none')return 'roja o animada';
        if(!b||b.tagName!=='BUTTON'||b.innerText.trim()!=='Abrirlo'||!/cofre/i.test(b.getAttribute('aria-label')||''))return 'botón «Abrirlo» sin etiqueta';
        if(b.getBoundingClientRect().height<44)return 'el botón mide menos de 44 px: '+b.getBoundingClientRect().height;
        if(/prisa|corre|pierdes|caduca|rápido/i.test(l.innerText))return 'mete presión';
        document.querySelector('#prodStars button[data-v="4"]').click();$('viewStudy').scrollTop=0;b.click();await espera(800);
        if(document.querySelector('#modalRoot .ses-cofre'))return 'no cierra «Sesión terminada»';
        if(s.prod!==4)return 'no guarda las estrellas marcadas: '+s.prod;
        if($('viewStudy').classList.contains('hidden'))return 'no abre Estudio';
        var cb=document.querySelector('#missionsCard .cofre.listo'),r=cb&&cb.getBoundingClientRect(),v=$('viewStudy').getBoundingClientRect();
        if(!cb||!(r.top>=v.top-1&&r.bottom<=v.bottom+1))return 'el cofre no queda a la vista';
        if(document.querySelector('#missionsCard .mis-foco'))return 'resalta una fila en vez del cofre';
        return true;
      }finally{clearTimeout(irAMision.t);MIS_FOCO={id:'',hasta:0};
        clearTimeout(VUELO.t);VUELO.t=0;VUELO.n=VUELO.h=VUELO.z=0;VUELO.hr=null;document.querySelectorAll('.saco-semillas,.semilla-vuela').forEach(x=>x.remove());
        k.forEach(x=>DATA[x]=o[x]);saveUserData();closeModal();goView('map');await espera(300);renderStudy();renderSemillas();}"""),
    ("«Sesión terminada» une la sesión con sus misiones: una línea .ses-mis «✅ <misión> · +10 🌰» por cada misión cumplida desde sesion.ts (--suave, premio en --ok-tx); nada si no cumplió ninguna; si cerró la 3.ª, «¡Misiones completadas!» en .ses-cofre", """
      var k=['misiones','sessions','acciones'],o={};k.forEach(x=>o[x]=DATA[x]);
      var hoy=ymd(),ts=Date.now()-30*60000,antes=new Date(ts-3600000).toISOString(),ahora=new Date().toISOString();
      var abre=hechas=>{closeModal();DATA.misiones={fecha:hoy,ids:['m25','agenda','pomo'],hechas:hechas,cofre:false};var s={id:'sm'+Math.random(),date:hoy,min:30,ts:ts,bib:NO_BIB,focus:'ok',esp:'roble',prod:null,note:''};DATA.sessions=[s];pedirValoracion(s,null);return [].map.call(document.querySelectorAll('#modalRoot .ses-mis'),x=>x.innerText.trim());};
      var col=v=>{var t=document.createElement('i');t.style.color=v;document.body.appendChild(t);var c=getComputedStyle(t).color;t.remove();return c;};
      try{
        await cargarExtra();closeModal();
        var l=abre({m25:antes});if(l.length)return 'sale con una misión de antes de la sesión: '+l;
        l=abre({agenda:ahora});if(l.length)return 'atribuye a la sesión «Apunta un examen»: '+l;
        l=abre({m25:ahora});if(l.length!==1||l[0]!=='✅ Estudia 25 min hoy · +'+MIS_PREMIO+' 🌰')return 'línea mal: '+JSON.stringify(l);
        var m=$('modalRoot').innerHTML;if(m.indexOf('ses-mis')<m.indexOf('Sesión terminada</h3>')||m.indexOf('ses-mis')>m.indexOf('prodStars'))return 'no va bajo «Sesión terminada»';
        var e=document.querySelector('#modalRoot .ses-mis'),c=getComputedStyle(e),b=getComputedStyle(e.querySelector('b'));
        if(c.color!==col('var(--suave)')||b.color!==col('var(--ok-tx)'))return 'colores: '+c.color+' / '+b.color;
        if(c.fontWeight!=='600'||c.animationName!=='none')return 'peso o animación: '+c.fontWeight+' '+c.animationName;
        if(/#[0-9a-f]{3,6}|rgb\\(/i.test($('sesMisCss').textContent))return 'colores sueltos en el CSS';
        if(/Misiones completadas/.test($('modalRoot').innerText))return 'dice «completadas» con 1/3';
        l=abre({m25:ahora,pomo:ahora,agenda:antes});if(l.length!==2||!/Completa un Pomodoro/.test(l[1]))return 'dos misiones: '+JSON.stringify(l);
        var cf=document.querySelector('#modalRoot .ses-cofre');if(!cf||!/🎁 ¡Misiones completadas! Tu cofre te espera/.test(cf.innerText))return 'el cofre no lo atribuye a la sesión: '+(cf&&cf.innerText);
        abre({m25:antes,pomo:antes,agenda:antes});cf=document.querySelector('#modalRoot .ses-cofre');
        if(!cf||/completadas/.test(cf.innerText)||document.querySelector('#modalRoot .ses-mis'))return 'con las 3 de antes cambia el texto';
        return true;
      }finally{k.forEach(x=>DATA[x]=o[x]);saveUserData();closeModal();renderStudy();}"""),
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
    ("historial: «✅ N misiones · +N 🌰» bajo la sesión que las cumplió, nada en las demás", r"""
      goView('study');await new Promise(r=>setTimeout(r,200));
      var os=DATA.sessions,om=DATA.misiones,ot=feedTab;
      try{
        feedTab='mia';var t0=Date.now()-30*60000,hoy=ymd();
        DATA.misiones={fecha:hoy,ids:['m25','agenda','largo'],hechas:{m25:new Date(t0+60000).toISOString(),agenda:new Date(t0+120000).toISOString(),largo:new Date(t0-60000).toISOString()},cofre:true};
        var m=idsMisionesSesion({ts:t0,date:hoy});
        if(JSON.stringify(m)!=='["m25"]')return 'idsMisionesSesion mal: '+JSON.stringify(m);
        DATA.sessions=[{id:'p1',date:hoy,min:30,bib:NO_BIB,ts:t0},{id:'p2',date:hoy,min:50,bib:NO_BIB,ts:t0,mis:['m25','largo']},{id:'p3',date:hoy,min:26,bib:NO_BIB,ts:t0,mis:['m25']}];
        renderSessionFeed();
        var f=[...document.querySelectorAll('#sessionFeed .feed-item')];
        if(f.length!==3)return 'filas: '+f.length;
        var tx=f.map(x=>{var e=x.querySelector('.feed-mis');return e?e.innerText.trim():'';});
        if(tx[0]!=='✅ 1 misión · +'+MIS_PREMIO+' 🌰')return 'singular: '+tx[0];
        if(tx[1]!=='✅ 2 misiones · +'+(2*MIS_PREMIO)+' 🌰')return 'plural: '+tx[1];
        if(tx[2]!=='')return 'sesión sin misiones enseña algo';
        var b=f[1].querySelector('.feed-mis b');if(!b||b.innerText.indexOf('+'+(2*MIS_PREMIO))<0)return 'premio sin resaltar';
        return true;
      }finally{DATA.sessions=os;DATA.misiones=om;feedTab=ot;renderSessionFeed();}"""),
    ("chip «📅 Fin de semana» + «¿Abierta el sábado a las 17:00?»: filtra con estadoBib(b, fecha) y nunca saca las de horario sin confirmar", """
      var oF=Object.assign({},LIST_FILTERS),oD=Object.assign({},FINDE),ls=$('listSearch');
      try{
        goView('map');abrirLista(false);Object.keys(LIST_FILTERS).forEach(k=>LIST_FILTERS[k]=false);FINDE={d:6,h:17};ls.value='';buildList();
        var chip=document.querySelector('#listFilters [data-f="finde"]'),sel=$('findeSel');
        if(!chip||!sel)return 'sin chip o sin selector';
        if(!sel.hidden)return 'el selector se ve sin el chip';
        chip.click();
        if(!chip.classList.contains('on')||sel.hidden)return 'el chip no activa el selector';
        if($('findeDia').value!=='6'||$('findeHora').value!=='17')return 'por defecto no es sábado 17:00';
        for(const s of sel.querySelectorAll('select'))if(s.getBoundingClientRect().height<44||!(s.labels.length||s.getAttribute('aria-label')))return 'desplegable < 44 px o sin etiqueta';
        var f=fechaFinde(6,17);if(f.getDay()!==6||f.getHours()!==17||f-Date.now()>8*864e5||f-Date.now()<-2*864e5)return 'fecha mal: '+f;
        var esp=BIBLIOTECAS.filter(b=>!b.sinHorario&&estadoBib(b,f)).length;
        var tot=()=>{var m=/^(\\d+) de/.exec($('panelCount').textContent);return m?+m[1]:-1;};
        if(!esp||tot()!==esp)return 'muestra '+tot()+' y deberían ser '+esp;
        for(const c of document.querySelectorAll('#list .card')){var b=BIBLIOTECAS[+c.dataset.i];
          if(b.sinHorario||!estadoBib(b,f))return 'sale una que no abre: '+b.nombre;
          if(!/📅 Sáb \\d/.test(c.innerText))return 'la tarjeta no dice el horario del sábado';}
        $('findeDia').value='0';$('findeHora').value='-1';$('findeDia').dispatchEvent(new Event('change'));
        var dom=BIBLIOTECAS.filter(b=>!b.sinHorario&&(horarioVigente(b,fechaFinde(0,12))[0]||[]).length).length;
        if(tot()!==dom)return 'domingo a cualquier hora: '+tot()+' de '+dom;
        var sh=BIBLIOTECAS.find(b=>b.sinHorario);if(!sh)return 'no hay bibliotecas sin horario';
        $('findeDia').value='-1';$('findeDia').dispatchEvent(new Event('change'));ls.value=sh.nombre;buildList();
        if([...document.querySelectorAll('#list .card')].some(c=>BIBLIOTECAS[+c.dataset.i]===sh))return 'sale una sin horario: '+sh.nombre;
        if(!document.querySelectorAll('#list .card').length&&!/horario confirmado/.test($('list').innerText))return 'sin texto claro al no haber resultados';
        document.querySelector('#listFilters [data-f="abiertas"]').click();
        if(LIST_FILTERS.finde||!sel.hidden)return 'no se desactiva con «Abiertas ahora»';
        return true;
      }finally{
        ls.value='';Object.assign(LIST_FILTERS,oF);FINDE=oD;saveJSON('bpna_list_filters',LIST_FILTERS);saveJSON('bpna_finde',FINDE);buildList();cerrarLista();
      }"""),
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
    ("«🔗 Compartir» en el popup: aria-label, navigator.share con el enlace #bib, «Enlace copiado» si falla, y el enlace reabre la misma biblioteca", """
      var espera=n=>new Promise(r=>setTimeout(r,n)),propio=Object.prototype.hasOwnProperty.call(navigator,'share'),o=propio?navigator.share:null,dato=null;
      try{
        var i=Math.min(500,BIBLIOTECAS.length-1);while(i>0&&rutaFicha(i))i--;var b=BIBLIOTECAS[i];
        window.__map.closePopup();location.hash='';window.__selBib(i);await espera(900);
        var bt=document.querySelector('.leaflet-popup-content .bib-share');
        if(!bt)return 'sin botón en el popup';
        if(bt.getAttribute('aria-label')!=='Compartir '+b.nombre)return 'aria-label mal: '+bt.getAttribute('aria-label');
        if(bt.getBoundingClientRect().height<44)return 'botón de menos de 44 px';
        Object.defineProperty(navigator,'share',{configurable:true,writable:true,value:d=>{dato=d;return Promise.resolve();}});
        bt.click();await espera(50);
        if(!dato||dato.url.indexOf('https://bibliomapa.es/#bib='+i+'-')!==0)return 'navigator.share sin el enlace: '+JSON.stringify(dato);
        if(dato.text.indexOf(b.nombre)<0)return 'texto sin el nombre';
        if(/abierta hoy/.test(dato.text)&&!(b.verificadoHorario&&b.fuenteHorario))return 'dice «abierta hoy» sin horario verificado';
        document.querySelectorAll('.toast').forEach(x=>x.remove());
        navigator.share=()=>Promise.reject(Object.assign(new Error('x'),{name:'AbortError'}));bt.click();await espera(150);
        if(document.querySelector('.toast'))return 'copia el enlace aunque el usuario cancele';
        navigator.share=()=>Promise.reject(new Error('no se puede'));bt.click();await espera(300);
        if(!/Enlace copiado/.test([...document.querySelectorAll('.toast')].map(x=>x.textContent).join()))return 'sin «Enlace copiado» al fallar share';
        window.__map.closePopup();window.__map.setView([40,-3.7],6,{animate:false});await espera(200);
        location.hash=dato.url.slice(dato.url.indexOf('#'));comprobarEnlaceCompartido();await espera(1500);
        var h=document.querySelector('.leaflet-popup-content h2');
        return (h&&h.textContent===b.nombre)||('el enlace abre otra: '+(h&&h.textContent));
      }finally{if(propio)navigator.share=o;else delete navigator.share;document.querySelectorAll('.toast').forEach(x=>x.remove());}"""),
    ("«🔗 Compartir» con fichas.json: una biblioteca con ficha comparte https://bibliomapa.es/bibliotecas/…/ (que existe), una sin ficha sigue con #bib=, y sin fichas.json vuelve a #bib=", """
      var espera=n=>new Promise(r=>setTimeout(r,n)),propio=Object.prototype.hasOwnProperty.call(navigator,'share'),o=propio?navigator.share:null,dato=null,F0=FICHAS;
      try{
        await cargarFichas();if(!FICHAS)return 'no carga fichas.json';
        var ks=Object.keys(FICHAS),buenas=ks.filter(k=>rutaFicha(+k));
        if(ks.length<100||buenas.length!==ks.length)return 'rutas que no casan con el nombre: '+(ks.length-buenas.length)+' de '+ks.length;
        var i=+ks.filter(k=>+k>=N_NAVARRA)[0],j=0;while(rutaFicha(j))j++;
        var r=await fetch(FICHAS[i]);if(!r.ok)return 'la ficha no existe: '+FICHAS[i];
        Object.defineProperty(navigator,'share',{configurable:true,writable:true,value:d=>{dato=d;return Promise.resolve();}});
        window.__map.closePopup();location.hash='';window.__selBib(i);await espera(900);
        var bt=document.querySelector('.leaflet-popup-content .bib-share');if(!bt)return 'sin botón en el popup';
        bt.click();await espera(50);
        if(!dato||dato.url!=='https://bibliomapa.es'+FICHAS[i])return 'con ficha no comparte la ficha: '+JSON.stringify(dato);
        dato=null;compartirBib(j);await espera(50);
        if(!dato||dato.url.indexOf('https://bibliomapa.es/#bib='+j+'-')!==0)return 'sin ficha no usa #bib=: '+JSON.stringify(dato);
        FICHAS=null;dato=null;compartirBib(i);await espera(50);
        if(!dato||dato.url.indexOf('https://bibliomapa.es/#bib='+i+'-')!==0)return 'sin fichas.json no vuelve a #bib=: '+JSON.stringify(dato);
        return true;
      }finally{FICHAS=F0;if(propio)navigator.share=o;else delete navigator.share;window.__map.closePopup();document.querySelectorAll('.toast').forEach(x=>x.remove());}"""),
    ("al llegar al cofre desde la barrita o la píldora, «¡Abre tu cofre!» recibe el foco (Intro basta) y no lo pierde al repintarse; nada si el cofre no está listo", """
      var k=['misiones','sessions','acciones','semillasPremio','streakFreezes','cofresAbiertos','sellosMisiones'],o={};k.forEach(x=>o[x]=DATA[x]);
      var t0={running:studyTimer.running,start:studyTimer.start,bibIndex:studyTimer.bibIndex,tick:studyTimer.tick},el=$('misCerca'),mi=$('miniMis'),ms=$('miniStudy');
      var viejo=new Date(Date.now()-5*3600000).toISOString(),ya=new Date(Date.now()-60000).toISOString(),oculto0=ms.classList.contains('hidden'),espera=n=>new Promise(r=>setTimeout(r,n));
      var listo=()=>{DATA.misiones={fecha:ymd(),ids:['m25','agenda','pomo'],hechas:{agenda:viejo,pomo:viejo,m25:ya},cofre:false};el._clave=null;renderMisCerca();renderMisiones();};
      var foco=()=>{var a=document.activeElement;return !!(a&&a.matches&&a.matches('#missionsCard .cofre.listo'));};
      try{
        await cargarExtra();closeModal();DATA.sessions=[];DATA.acciones={fecha:ymd()};
        studyTimer.running=true;studyTimer.tick=t0.tick||1;studyTimer.bibIndex=-1;studyTimer.start=Date.now()-26*60000-500;
        goView('study');listo();document.body.focus();el.click();await espera(100);
        if(!foco())return 'desde la barrita el foco cae en '+(document.activeElement&&document.activeElement.outerHTML.slice(0,60));
        renderMisiones();if(!foco())return 'el repintado le quita el foco';
        var b=document.querySelector('#missionsCard .cofre.listo');if(getComputedStyle(b).animationName!=='tiembla'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)return 'cambió la animación: '+getComputedStyle(b).animationName;
        goView('map');ms.classList.remove('hidden');listo();mi.focus();mi.click();await espera(100);
        if(!foco())return 'desde la píldora el foco no cae en el cofre';
        var n0=DATA.cofresAbiertos||0;document.activeElement.click();await espera(50);
        if(!$('modalRoot').innerHTML||(DATA.cofresAbiertos||0)<=n0&&!misionesDeHoy().cofre)return 'activar el botón enfocado no abre el cofre';
        closeModal();await espera(50);
        DATA.misiones={fecha:ymd(),ids:['m25','agenda','pomo'],hechas:{agenda:viejo},cofre:false};renderMisiones();mi.focus();irAMision('cofre');await espera(50);
        if(document.activeElement&&document.activeElement.classList.contains('cofre'))return 'enfoca un cofre que no está listo';
        return true;
      }finally{clearTimeout(irAMision.t);studyTimer.running=t0.running;studyTimer.start=t0.start;studyTimer.bibIndex=t0.bibIndex;studyTimer.tick=t0.tick;MIS_FOCO={id:'',hasta:0};
        clearTimeout(VUELO.t);VUELO.t=0;VUELO.n=VUELO.h=VUELO.z=0;VUELO.hr=null;document.querySelectorAll('.saco-semillas,.semilla-vuela').forEach(x=>x.remove());
        k.forEach(x=>DATA[x]=o[x]);saveUserData();closeModal();el&&(el._clave=null);ms.classList.toggle('hidden',oculto0);goView('map');await espera(300);renderMisCerca();renderStudy();renderSemillas();}"""),
    ("nombres recortados con gramática: «Sesión terminada» dice «h en Biblioteca de Navarra», nunca «en de Navarra»", """
      var casos={'Biblioteca de Navarra':'Biblioteca de Navarra','Biblioteca Pública de Pamplona Yamaguchi':'Pamplona Yamaguchi','Biblioteca de la Universidad de Navarra':'Universidad de Navarra','Biblioteca Nacional de España':'Biblioteca Nacional de España','Sala de estudio X':'Sala de estudio X'};
      for(var n in casos){if(cortoNombre(n)!==casos[n])return n+' → '+cortoNombre(n);}
      var s0=DATA.sessions;
      try{
        await cargarExtra();closeModal();var s={id:'nb1',date:ymd(),min:30,ts:Date.now()-60000,bib:'Biblioteca de Navarra',focus:'ok',esp:'roble',prod:null,note:''};DATA.sessions=[s];pedirValoracion(s,null);
        var t=$('modalRoot').innerText;if(/\\ben de\\b/.test(t)||!/h en Biblioteca de Navarra/.test(t))return 'dice: '+(t.match(/h en [^·\\n]*/)||[t.slice(0,80)])[0];
        var src=[...document.scripts].map(x=>x.textContent).join('')+String(pedirValoracion);
        if(/replace\\("Biblioteca ",""\\)/.test(src))return 'queda un recorte a pelo de «Biblioteca »';
        return true;
      }finally{DATA.sessions=s0;clearTimeout(VUELO.t);VUELO.t=0;VUELO.n=VUELO.h=VUELO.z=0;VUELO.hr=null;closeModal();goView('map');}"""),
    ("«Sesión terminada» lleva «📸 Compartir» (44 px, con etiqueta) y la tarjeta de la sesión se dibuja en 1080×1920 sin red, también sin árbol ni biblioteca", """
      var s0=DATA.sessions,pide=0,fetch0=window.fetch;
      try{
        await cargarExtra();closeModal();window.fetch=function(){pide++;return fetch0.apply(this,arguments);};
        var s={id:'cs1',date:ymd(),min:52,ts:Date.now()-60000,bib:'Biblioteca de Navarra',focus:'ok',esp:'cerezo',subject:'Mates',prod:null,note:''};DATA.sessions=[s];pedirValoracion(s,null);
        var b=$('sessShare');if(!b||b.tagName!=='BUTTON'||!/📸 Compartir/.test(b.innerText))return 'no sale el botón';
        if(!/compartir/i.test(b.getAttribute('aria-label')||''))return 'sin aria-label';
        if(b.getBoundingClientRect().height<44)return 'mide menos de 44 px: '+b.getBoundingClientRect().height;
        var c=await dibujarSesionStory(s);if(c.width!==1080||c.height!==1920)return 'tamaño '+c.width+'×'+c.height;
        var px=c.getContext('2d').getImageData(540,700,1,1).data;if(px[3]!==255)return 'lienzo vacío';
        closeModal();var m={id:'cs2',date:ymd(),min:20,ts:Date.now()-60000,bib:NO_BIB,focus:null,esp:null,prod:null,note:''};DATA.sessions=[m];pedirValoracion(m,null);
        if(!$('sessShare'))return 'sin árbol no sale el botón';
        c=await dibujarSesionStory(m);if(c.width!==1080||c.height!==1920)return 'sin árbol: '+c.width+'×'+c.height;
        if(pide)return 'pide a la red';
        window.__cartaSesion=(await dibujarSesionStory(s)).toDataURL('image/png');
        return true;
      }finally{window.fetch=fetch0;DATA.sessions=s0;clearTimeout(VUELO.t);VUELO.t=0;VUELO.n=VUELO.h=VUELO.z=0;VUELO.hr=null;closeModal();goView('map');}"""),
    ("historial de Estudio: cada fila lleva 📸 (44×44, «Compartir sesión de <fecha>») y comparte ESA sesión en 1080×1920, con la racha de ese día y sin red", """
      var s0=DATA.sessions,f0=DATA.usedFreezeDates,tab0=feedTab,cl0=window.compartirLienzo,pide=0,fetch0=window.fetch,lienzos=[];
      var dia=n=>{var d=new Date();d.setDate(d.getDate()-n);return ymd(d);};
      try{
        await cargarExtra();closeModal();window.fetch=function(){pide++;return fetch0.apply(this,arguments);};
        window.compartirLienzo=async function(c,nombre){lienzos.push(c);};
        DATA.usedFreezeDates=[];feedTab='mia';
        DATA.sessions=[{id:'hs1',date:dia(9),min:40,bib:'Biblioteca de Navarra',focus:'ok',esp:'roble',subject:'Historia'},
          {date:dia(8),min:25,bib:NO_BIB,focus:'withered'},{id:'hs3',date:dia(7),min:70,bib:'Biblioteca de Navarra',focus:'ok',esp:'cerezo'}];
        goView('study');renderSessionFeed(true);await new Promise(r=>setTimeout(r,200));
        var filas=document.querySelectorAll('#sessionFeed .feed-item'),bs=document.querySelectorAll('#sessionFeed .feed-share');
        if(filas.length!==3||bs.length!==3)return filas.length+' filas y '+bs.length+' botones';
        for(var b of bs){var r=b.getBoundingClientRect();if(r.width<44||r.height<44)return 'mide '+r.width+'×'+r.height;
          if(!/^Compartir sesión de \d{1,2} de \w+ de \d{4}$/.test(b.getAttribute('aria-label')||''))return 'etiqueta: '+b.getAttribute('aria-label');}
        if(rachaHasta(dia(9))!==1||rachaHasta(dia(8))!==2||rachaHasta(dia(7))!==3||rachaHasta(dia(30))!==0)return 'racha de ese día mal: '+[9,8,7,30].map(n=>rachaHasta(dia(n)));
        bs[1].click();await new Promise(r=>setTimeout(r,800));bs[2].click();await new Promise(r=>setTimeout(r,800));
        if(lienzos.length!==2)return 'se generaron '+lienzos.length+' lienzos';
        for(var c of lienzos){if(c.width!==1080||c.height!==1920)return 'tamaño '+c.width+'×'+c.height;if(c.getContext('2d').getImageData(540,700,1,1).data[3]!==255)return 'lienzo vacío';}
        if(pide)return 'pide a la red';
        window.__cartaHist=lienzos[1].toDataURL('image/png');
        return true;
      }finally{window.fetch=fetch0;window.compartirLienzo=cl0;DATA.sessions=s0;DATA.usedFreezeDates=f0;feedTab=tab0;renderSessionFeed(true);closeModal();goView('map');}"""),
    ("perfil: récord con el nombre bien recortado", """
      var bad=DATA.sessions.length;DATA.sessions.push({id:'t-rec',date:'2026-01-01',min:9999,bib:'Biblioteca de Navarra'});
      try{goView('profile');await new Promise(r=>setTimeout(r,300));
        var lab=[...document.querySelectorAll('.stat .lab')].map(x=>x.textContent).find(t=>/larga/.test(t))||'';
        return /· Biblioteca de Navarra$/.test(lab) || ('récord: «'+lab+'»');
      }finally{DATA.sessions.splice(bad,1);goView('map');}"""),
    ("perfil: «📸 Compartir mi mejor sesión de la semana» sale con sesiones de los últimos 7 días y comparte la más larga; sin sesiones no sale", """
      var s0=DATA.sessions,cs=window.compartirSesionStory,pedida=null,dia=n=>{var d=new Date();d.setDate(d.getDate()-n);return ymd(d);};
      try{
        window.compartirSesionStory=id=>{pedida=id;};
        DATA.sessions=[{id:'mb-vieja',date:dia(9),min:300,bib:NO_BIB,focus:'ok'},{id:'mb-a',date:dia(1),min:40,bib:NO_BIB,focus:'ok'},
          {id:'mb-larga',date:dia(5),min:95,bib:NO_BIB,focus:'ok'},{id:'mb-seca',date:dia(2),min:200,bib:NO_BIB,focus:'withered'},{id:'mb-b',date:ymd(),min:25,bib:NO_BIB,focus:null}];
        goView('profile');await new Promise(r=>setTimeout(r,200));var b=$('btnShareBest');
        if(!b||b.classList.contains('hidden')||!b.offsetHeight)return 'no sale con sesiones';
        if(b.offsetHeight<44)return 'mide menos de 44 px ('+b.offsetHeight+')';
        if(!/1h 35m|1 h 35|95/.test(b.getAttribute('aria-label')||''))return 'aria-label: '+b.getAttribute('aria-label');
        b.click();if(pedida!=='mb-larga')return 'comparte '+pedida+' en vez de la más larga';
        DATA.sessions=[];renderProfile();
        if(!b.classList.contains('hidden'))return 'sale sin sesiones';
        return true;
      }finally{window.compartirSesionStory=cs;DATA.sessions=s0;renderProfile();goView('map');}"""),
    ("wrapped: «📸 Mi mejor sesión» comparte la más larga de la semana pasada con «⭐ Mi mejor sesión de la semana»; sin sesiones sanas no sale", """
      await cargarExtra();
      var s0=DATA.sessions,rv=DATA.resumenVisto,cs=window.compartirSesionStory,cl0=window.compartirLienzo,tc0=window.textoC,pedida=null,tit=null,textos=[],txt=null;
      var lun=datosSemana(1).desde,dia=n=>{var d=new Date(lun);d.setDate(d.getDate()+n);return ymd(d);},ultima=()=>{irSlide(STORIES.slides.length-1);return $('svBest');};
      try{
        DATA.sessions=[{id:'wb-a',date:dia(0),min:40,bib:NO_BIB,focus:'ok'},{id:'wb-larga',date:dia(3),min:80,bib:NO_BIB,focus:'ok'},
          {id:'wb-seca',date:dia(2),min:200,bib:NO_BIB,focus:'withered'},{id:'wb-hoy',date:ymd(),min:300,bib:NO_BIB,focus:'ok'}];
        abrirResumenSemanal(false);var b=ultima();
        if(!b||!b.offsetHeight)return 'no sale el botón';
        if(b.offsetHeight<44)return 'mide menos de 44 px ('+b.offsetHeight+')';
        if(!/1h 20m|1 h 20|80/.test(b.getAttribute('aria-label')||''))return 'aria-label: '+b.getAttribute('aria-label');
        if(!/Compartir mi semana/.test(b.parentNode.textContent))return 'no está junto a «Compartir mi semana»';
        window.compartirSesionStory=(id,t)=>{pedida=id;tit=t;};b.click();
        if(pedida!=='wb-larga')return 'comparte '+pedida+' en vez de la más larga';
        if(tit!==TIT_MEJOR)return 'título '+tit;
        window.compartirSesionStory=cs;window.compartirLienzo=(c,n,t)=>{txt=t;};window.textoC=function(g,t){textos.push(t);return tc0.apply(this,arguments);};
        await compartirSesionStory('wb-larga',TIT_MEJOR);
        if(textos.indexOf(TIT_MEJOR)<0||textos.indexOf('SESIÓN DE ESTUDIO')>=0)return 'la imagen no lleva el título: '+textos[0];
        if(!txt||txt.indexOf(TIT_MEJOR)!==0)return 'texto de compartir: '+txt;
        textos=[];await compartirSesionStory('wb-a');
        if(textos.indexOf('SESIÓN DE ESTUDIO')<0||/^He estudiado/.test(txt)===false)return 'sin título cambia la imagen normal: '+textos[0]+' / '+txt;
        cerrarStory();DATA.sessions=[{id:'wb-seca',date:dia(2),min:200,bib:NO_BIB,focus:'withered'}];
        abrirResumenSemanal(false);if(ultima())return 'sale solo con árboles secos';
        return true;
      }finally{window.compartirSesionStory=cs;window.compartirLienzo=cl0;window.textoC=tc0;cerrarStory();DATA.sessions=s0;DATA.resumenVisto=rv;goView('map');}"""),
    ("📸 doble toque: el botón queda desactivado con aria-busy mientras se prepara la imagen y solo se genera y comparte UNA; luego vuelve, también si se cancela la hoja", """
      await cargarExtra();
      var s0=DATA.sessions,tab0=feedTab,sh0=navigator.share,cs0=navigator.canShare,ds0=window.dibujarSesionStory,dibujos=0,shares=0,soltar=null;
      try{
        closeModal();feedTab='mia';
        window.dibujarSesionStory=async function(){dibujos++;return ds0.apply(this,arguments);};
        navigator.canShare=()=>true;navigator.share=function(){shares++;return new Promise((ok,ko)=>{soltar=()=>ko(Object.assign(new Error('cancelada'),{name:'AbortError'}));});};
        DATA.sessions=[{id:'dt1',date:ymd(),min:45,bib:NO_BIB,focus:'ok',esp:'roble'}];
        goView('study');renderSessionFeed(true);await new Promise(r=>setTimeout(r,200));
        var b=document.querySelector('#sessionFeed .feed-share');if(!b)return 'sin botón 📸';
        b.click();b.click();b.dispatchEvent(new MouseEvent('click',{bubbles:true}));
        if(!b.disabled||b.getAttribute('aria-busy')!=='true')return 'no se desactiva al tocar';
        await compartirSesionStory('dt1');
        for(var i=0;i<40&&!shares;i++)await new Promise(r=>setTimeout(r,50));
        if(dibujos!==1)return 'se dibujaron '+dibujos+' imágenes';
        if(shares!==1)return 'se abrió la hoja '+shares+' veces';
        if(!b.disabled)return 'se reactiva con la hoja abierta';
        soltar();await new Promise(r=>setTimeout(r,50));
        if(b.disabled||b.hasAttribute('aria-busy'))return 'no vuelve tras cancelar la hoja';
        b.click();for(var i=0;i<40&&shares<2;i++)await new Promise(r=>setTimeout(r,50));
        if(shares!==2)return 'tras cancelar no deja volver a compartir';
        soltar();await new Promise(r=>setTimeout(r,50));
        window.dibujarSesionStory=async function(){throw new Error('falla');};b.click();await new Promise(r=>setTimeout(r,50));
        if(b.disabled||b.hasAttribute('aria-busy'))return 'se queda bloqueado si falla el dibujo';
        return true;
      }finally{navigator.share=sh0;navigator.canShare=cs0;window.dibujarSesionStory=ds0;compartiendoImagen=false;DATA.sessions=s0;feedTab=tab0;renderSessionFeed(true);closeModal();goView('map');}"""),
    ("📸 bosque: varios toques en «Compartir» del bosque → 1 dibujo y 1 hoja, botón con aria-busy; al compartir devuelve true y la bienvenida dice «Ayer compartiste tu bosque de…»", """
      await cargarExtra();
      var s0=DATA.sessions,uc0=DATA.ultimaCompartida,fp0=FOREST_PERIOD,sh0=navigator.share,cs0=navigator.canShare,db0=window.dibujarBosque,dibujos=0,shares=0,ok=null,ko=null;
      try{
        closeModal();FOREST_PERIOD='week';DATA.ultimaCompartida=null;
        window.dibujarBosque=async function(){dibujos++;return db0.apply(this,arguments);};
        navigator.canShare=()=>true;navigator.share=function(){shares++;return new Promise((a,r)=>{ok=a;ko=()=>r(Object.assign(new Error('cancelada'),{name:'AbortError'}));});};
        DATA.sessions=[{id:'bq1',date:ymd(),min:70,bib:NO_BIB,focus:'ok',esp:'roble'},{id:'bq2',date:ymd(),min:60,bib:NO_BIB,focus:'ok',esp:'roble'}];
        goView('study');renderForest();
        var b=[...document.querySelectorAll('#forestCard .forest-acts button')].find(x=>/Compartir/.test(x.innerText));if(!b)return 'sin botón 📸 del bosque';
        b.click();b.click();b.dispatchEvent(new MouseEvent('click',{bubbles:true}));
        if(!b.disabled||b.getAttribute('aria-busy')!=='true')return 'no se desactiva al tocar';
        if(await compartirSemanaPasada()!==false||await compartirStoryDia()!==false)return 'otro 📸 de bosque no respeta el candado';
        for(var i=0;i<40&&!shares;i++)await new Promise(r=>setTimeout(r,50));
        if(dibujos!==1)return 'se dibujaron '+dibujos+' bosques';
        if(shares!==1)return 'se abrió la hoja '+shares+' veces';
        if(!b.disabled)return 'se reactiva con la hoja abierta';
        ko();await new Promise(r=>setTimeout(r,50));
        if(b.disabled||b.hasAttribute('aria-busy'))return 'no vuelve tras cancelar la hoja';
        if(DATA.ultimaCompartida)return 'guarda la marca al cancelar';
        var p=compartirBosque(null,'day');for(var i=0;i<40&&shares<2;i++)await new Promise(r=>setTimeout(r,50));
        ok();if(await p!==true)return 'compartirBosque no devuelve true al compartir';
        var M=DATA.ultimaCompartida;if(!M||M.tipo!=='bosque'||M.min!==130||M.fecha!==ymd())return 'marca mal guardada: '+JSON.stringify(M);
        var d=new Date();d.setDate(d.getDate()-1);DATA.ultimaCompartida={fecha:ymd(d),min:130,tipo:'bosque'};DATA.sessions=[];
        pintarBienvenidaDiaria();var t=(document.querySelector('#modalRoot .bienvenida')||{}).innerText||'';
        if(!/📸 Ayer compartiste tu bosque de 2h 10m · ¿plantamos otro árbol hoy\?/.test(t))return 'no sale el texto del bosque: '+t;
        return true;
      }finally{navigator.share=sh0;navigator.canShare=cs0;window.dibujarBosque=db0;compartiendoImagen=false;DATA.sessions=s0;DATA.ultimaCompartida=uc0;FOREST_PERIOD=fp0;closeModal();renderForest();goView('map');}"""),
    ("📸 ✓ Compartida: al compartir (true) el botón dice «✓ Compartida» en --ok-tx y lo anuncia aria-live; a los 2 s vuelve a «📸 Compartir»; si se cancela no cambia", """
      await cargarExtra();
      var s0=DATA.sessions,uc0=DATA.ultimaCompartida,fp0=FOREST_PERIOD,sh0=navigator.share,cs0=navigator.canShare,ms0=COMPARTIDA_MS,ok=null,ko=null;
      try{
        if(COMPARTIDA_MS!==2000)return 'no dura 2 s: '+COMPARTIDA_MS;
        closeModal();FOREST_PERIOD='week';COMPARTIDA_MS=900;
        navigator.canShare=()=>true;navigator.share=function(){return new Promise((a,r)=>{ok=a;ko=()=>r(Object.assign(new Error('cancelada'),{name:'AbortError'}));});};
        DATA.sessions=[{id:'ck1',date:ymd(),min:50,bib:NO_BIB,focus:'ok',esp:'roble'}];
        goView('study');renderForest();
        var b=[...document.querySelectorAll('#forestCard .forest-acts button')].find(x=>/Compartir/.test(x.innerText));if(!b)return 'sin botón 📸 del bosque';
        var html0=b.innerHTML,espera=async f=>{for(var i=0;i<60&&!f();i++)await new Promise(r=>setTimeout(r,50));};
        ok=null;b.click();await espera(()=>ko);ko();ko=null;await espera(()=>!b.disabled);await new Promise(r=>setTimeout(r,60));
        if(b.innerHTML!==html0||b.classList.contains('compartida'))return 'cambia al cancelar: '+b.innerText;
        ok=null;b.click();await espera(()=>ok);ok();await espera(()=>b.classList.contains('compartida'));
        if(b.innerText.trim()!=='✓ Compartida')return 'no dice ✓ Compartida: '+b.innerText;
        if(b.disabled||b.hasAttribute('aria-busy'))return 'el candado no se restaura';
        await new Promise(r=>setTimeout(r,320)); // tras la transición de color (.2s)
        var ok_tx=getComputedStyle(document.documentElement).getPropertyValue('--ok-tx').trim(),tmp=document.createElement('i');tmp.style.color=ok_tx;document.body.appendChild(tmp);
        var esperado=getComputedStyle(tmp).color;tmp.remove();if(getComputedStyle(b).color!==esperado)return 'color '+getComputedStyle(b).color+' ≠ --ok-tx '+esperado;
        var v=document.getElementById('avisoCompartida');
        if(!v||v.getAttribute('aria-live')!=='polite'||!/compartida/i.test(v.textContent))return 'sin aviso aria-live polite';
        await new Promise(r=>setTimeout(r,800));
        if(b.innerHTML!==html0||b.classList.contains('compartida'))return 'no vuelve al texto original: '+b.innerHTML;
        return true;
      }finally{navigator.share=sh0;navigator.canShare=cs0;COMPARTIDA_MS=ms0;compartiendoImagen=false;DATA.sessions=s0;DATA.ultimaCompartida=uc0;FOREST_PERIOD=fp0;closeModal();renderForest();goView('map');}"""),
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
        # --- analítica sin cookies (docs/ANALITICA.md): preparada pero APAGADA ---
        # index.html y las páginas SEO (/bibliotecas/…) cargan analitica.js por su cuenta; se comprueba en las dos que el
        # archivo se descarga, define ANALITICA/analiticaDecidir y no pide ninguna URL de proveedor ni pone cookies.
        fallo_an = []
        fuente_an = open(os.path.join(RAIZ, "analitica.js"), encoding="utf-8").read() if os.path.exists(os.path.join(RAIZ, "analitica.js")) else ""
        if not fuente_an:
            fallo_an.append("no existe analitica.js")
        elif not __import__("re").search(r"var ANALITICA\s*=\s*\{\s*proveedor\s*:\s*null\s*\}", fuente_an):
            fallo_an.append("analitica.js no tiene {proveedor:null} por defecto")
        if fuente_an:
            c4, p4 = await nueva_pagina()
            pedidas = []
            p4.on("request", lambda r: pedidas.append(r.url) if ("_vercel/insights" in r.url or "goatcounter" in r.url or "gc.zgo.at" in r.url) else None)
            p4.on("pageerror", lambda e: errores.append("analítica: " + str(e)[:200]))
            cargado = []
            p4.on("response", lambda r: cargado.append(r.status) if r.url.split("?")[0].endswith("/analitica.js") else None)
            for ruta_an in ["/index.html", "/bibliotecas/madrid/"]:
                cargado.clear()
                await p4.goto(f"http://127.0.0.1:{PUERTO}{ruta_an}")
                await p4.wait_for_timeout(1500)
                est = await p4.evaluate("""()=>({tag:document.querySelectorAll('script[src$="analitica.js"]').length,
                  fn:typeof analiticaDecidir==='function'&&typeof ANALITICA==='object'&&ANALITICA.proveedor===null,
                  cookie:document.cookie,va:!!(window.va||window.goatcounter)})""")
                if est["tag"] != 1 or cargado != [200]:
                    fallo_an.append(f"{ruta_an} no carga analitica.js (etiquetas {est['tag']}, respuestas {cargado})")
                elif not est["fn"]:
                    fallo_an.append(f"{ruta_an}: analitica.js no se ejecuta o no está apagada")
                if est["cookie"]:
                    fallo_an.append(f"{ruta_an} pone cookies: {est['cookie'][:60]}")
                if est["va"]:
                    fallo_an.append(f"{ruta_an} ha tocado window.va/goatcounter")
            casos = await p4.evaluate("""()=>{
              var web={protocolo:'https:',host:'bibliomapa.es'},m=Object.assign,D=analiticaDecidir,f=[];
              if(D(ANALITICA,web)!==null)f.push('por defecto no es null');
              var v=D({proveedor:'vercel'},web);if(!v||v.src!=='/_vercel/insights/script.js')f.push('vercel: '+JSON.stringify(v));
              var g=D({proveedor:'goatcounter',codigo:'bibliomapa'},web);if(!g||g.goatcounter!=='https://bibliomapa.goatcounter.com/count')f.push('goatcounter: '+JSON.stringify(g));
              if(D({proveedor:'goatcounter'},web))f.push('goatcounter sin código carga');
              if(D({proveedor:'vercel'},m({},web,{dnt:'1'})))f.push('no respeta DNT');
              if(D({proveedor:'vercel'},m({},web,{gpc:true})))f.push('no respeta GPC');
              if(D({proveedor:'vercel'},{protocolo:'http:',host:'localhost'})||D({proveedor:'vercel'},{protocolo:'http:',host:'127.0.0.1'}))f.push('carga en local');
              if(D({proveedor:'vercel'},{protocolo:'file:',host:''}))f.push('carga en file:');
              if(document.querySelector('script[src*="_vercel/insights"],script[data-goatcounter]'))f.push('ha insertado un script');
              if(window.va||window.goatcounter)f.push('ha tocado window.va/goatcounter');
              return f;}""")
            fallo_an += casos
            if pedidas:
                fallo_an.append("pide: " + ", ".join(pedidas))
            await c4.close()
        res["pruebas"]["analítica apagada por defecto (index.html y /bibliotecas/ cargan analitica.js con proveedor:null y no piden _vercel/insights ni goatcounter ni ponen cookies; respeta DNT/GPC y local)"] = True if not fallo_an else "; ".join(fallo_an)
        # Sin navegador: encender la analítica sin cambiar privacidad.html (o al revés) hace fallar esta prueba.
        res["pruebas"]["política de privacidad coherente con analitica.js (proveedor null ⇔ «sin analítica»; el diff de docs/ANALITICA.md se aplica y se detecta encender sin él)"] = comprobar_privacidad_analitica()
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
