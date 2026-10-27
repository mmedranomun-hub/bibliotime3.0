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
      var k=['sessions','semillasPremio','semillasGastadas','especiesCompradas','especiesAvisadas','especieAvisoPend','misiones','acciones','hitosBosque','hitoBosquePend'],o={};
      k.forEach(x=>o[x]=DATA[x]);
      var toasts=[],st=window.showToast,cm=window.comprobarMisiones;window.showToast=m=>toasts.push(m);window.comprobarMisiones=()=>{};
      try{
        closeModal();var hoy=ymd(),mk=i=>({id:'pe'+i,date:hoy,min:30,ts:Date.now()-(100-i)*1000,bib:NO_BIB,focus:'ok',esp:'roble'});
        DATA.sessions=[mk(0),mk(1)];DATA.semillasPremio=0;DATA.semillasGastadas=0;DATA.especiesCompradas=[];DATA.especiesAvisadas=[];DATA.especieAvisoPend=0;DATA.hitosBosque=[1e9];
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
            ctx = await nav.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, color_scheme=tema, service_workers="block")
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
        tiempos = []
        for _ in range(CARGAS):
            ctx, pg = await nueva_pagina()
            cdp = await ctx.new_cdp_session(pg)
            await cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
            t0 = time.time()
            await pg.goto(url)
            await pg.wait_for_function("document.getElementById('nowCard') && document.getElementById('nowCard').innerText.length>10", timeout=30000)
            tiempos.append(round((time.time() - t0) * 1000))
            await ctx.close()
        res["carga_ms_cpu4x"] = round(statistics.median(tiempos))
        res["carga_ms_cpu4x_min_max"] = [min(tiempos), max(tiempos)]

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
