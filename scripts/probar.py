#!/usr/bin/env python3
"""Pruebas de regresión y métricas de Bibliomapa (las usa el bucle de objetivos, ver docs/OBJETIVOS.md).

Uso (desde la raíz del proyecto):
    python3 scripts/probar.py              # pruebas + métricas, resumen en pantalla
    python3 scripts/probar.py --guardar    # además actualiza docs/metricas.json y añade una fila a docs/METRICAS.md
    python3 scripts/probar.py --capturas carpeta/   # guarda capturas 390x844 claro y oscuro de cada vista

Sale con código 1 si alguna prueba falla: entonces NO se sube nada.
Necesita Playwright para Python con Chromium (PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers en la nube).
Las CDN suelen estar bloqueadas en el entorno de pruebas: Leaflet se sirve en local (se descarga de la
release de GitHub a /tmp la primera vez) y Supabase no se carga (la app entra en modo local).
"""
import asyncio, gzip, http.server, json, os, statistics, sys, threading, time, urllib.request, zipfile, functools

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", "/opt/pw-browsers")
LEAFLET_DIR = os.environ.get("LEAFLET_DIR", "/tmp/leaflet-1.9.4")
PUERTO = int(os.environ.get("PUERTO", "8765"))


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
      DATA.semillasPremio=(DATA.semillasPremio||0)+100;abrirTienda();var n=document.querySelectorAll('.shop-item').length;closeModal();
      return n>=6||('solo '+n+' especies');"""),
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
      var o=ymd;ymd=f=>f?o(f):'2026-12-15';abrirTienda();var t=$('modalRoot').innerText,l=document.querySelectorAll('#modalRoot .luz').length;closeModal();
      ymd=f=>f?o(f):'2026-07-15';abrirTienda();var t2=$('modalRoot').innerText;closeModal();ymd=o;
      return t.indexOf('Abeto de Navidad')>=0&&l>0&&t2.indexOf('Abeto de Navidad')<0||'tienda: navidad fuera de fecha o sin luces';"""),
    ("historias y tips", """
      goView('friends');renderStories();var ok=!!document.querySelector('#storiesBar .story.me');
      abrirTips();ok=ok&&document.querySelectorAll('.tip').length>=20;cerrarTips();return ok;"""),
    ("agenda: añadir examen", """
      goView('cal');var k=ymd(new Date(Date.now()+3*864e5));openDayModal(k);await new Promise(r=>setTimeout(r,200));
      $('evTitle').value='Examen prueba';$('evAdd').click();await new Promise(r=>setTimeout(r,200));
      var ok=(DATA.events[k]||[]).some(e=>e.title==='Examen prueba');renderStudy();
      return ok && $('examChip').innerText.indexOf('Examen prueba')>=0 || 'no aparece el examen';"""),
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
    ("enlace #bib abre la ficha", """
      location.hash='#bib=104-x';comprobarEnlaceCompartido();await new Promise(r=>setTimeout(r,900));
      return !!document.querySelector('.leaflet-popup-content') || 'no abre la ficha';"""),
]


async def main():
    from playwright.async_api import async_playwright
    guardar = "--guardar" in sys.argv
    capt = sys.argv[sys.argv.index("--capturas") + 1] if "--capturas" in sys.argv else None
    preparar_leaflet()
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
                return await r.abort()
            await pg.route("**/*", ruta)
            return ctx, pg

        # --- velocidad: mediana de 3 cargas con la CPU 4 veces más lenta (como un móvil medio) ---
        tiempos = []
        for _ in range(3):
            ctx, pg = await nueva_pagina()
            cdp = await ctx.new_cdp_session(pg)
            await cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
            t0 = time.time()
            await pg.goto(url)
            await pg.wait_for_function("document.getElementById('nowCard') && document.getElementById('nowCard').innerText.length>10", timeout=30000)
            tiempos.append(round((time.time() - t0) * 1000))
            await ctx.close()
        res["carga_ms_cpu4x"] = statistics.median(tiempos)

        # --- pruebas funcionales ---
        ctx, pg = await nueva_pagina()
        errores = []
        pg.on("pageerror", lambda e: errores.append(str(e)[:200]))
        await pg.goto(url)
        await pg.wait_for_timeout(2000)
        await pg.evaluate("async()=>{" + SALTAR_BIENVENIDA + "}")
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
