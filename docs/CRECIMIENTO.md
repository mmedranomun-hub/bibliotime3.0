# Crecimiento de Bibliomapa: SEO, GEO y dinero (estrategia de Marcos, 15-11-2026)

La leen el bucle director (para elegir trabajo), la rutina semanal de datos (`docs/seo/`) y Marcos.
Regla de oro de siempre: **ningún dato inventado**. Si una cifra (volumen de búsqueda, precio, tráfico) no tiene
fuente, se escribe «sin confirmar» y se mide con Search Console o la analítica antes de decidir.

## 1. Posicionamiento
- Promesa: **«¿Qué biblioteca o sala de estudio está abierta AHORA cerca de mí?»**, con horario verificado en
  fuente oficial y fecha. Nadie más lo da para toda España: hoy esas búsquedas las ganan noticias de temporada que
  se quedan viejas (Time Out, okdiario, diario.madrid.es) y PDF oficiales difíciles de leer.
- Ventaja que hay que explotar: **frescura + fuente + fecha** en cada página. Google la premia en búsquedas
  «abierto hoy» y las IAs (ChatGPT, Perplexity, Gemini) citan páginas con datos fechados y fuente.
- Públicos: universitarios, opositores, bachillerato/EBAU. Cada uno busca distinto (ver §2).

## 2. Mapa de búsquedas → página que las gana
| Intención (ejemplos) | Página | Estado 15-11 |
|---|---|---|
| «biblioteca abierta hoy/ahora <ciudad>» | `/bibliotecas/<prov>/abiertas-hoy/` | ✅ hecho |
| «biblioteca abierta sábado/domingo <ciudad>» | temáticas de fin de semana | ✅ hecho |
| «biblioteca <nombre> horario» | fichas `/bibliotecas/<prov>/<slug>/` | ✅ solo las verificadas (~1000) |
| «bibliotecas abiertas en época de exámenes <ciudad> 2027» | **página perenne por ciudad, se actualiza cada temporada** (mismo URL todos los años) | ❌ PRIORIDAD 1 (enero es el pico) |
| «biblioteca 24 horas <ciudad>» / «sala de estudio 24h» | página por ciudad con las 24 h y nocturnas (solo con fuente) | ✅ 16-11: `/bibliotecas/24-horas/<ciudad>/` en 12 ciudades (bucle) |
| «bibliotecas abiertas en Navidad/festivos <ciudad>» | temática de festivos (necesita festivos por comunidad, fuente BOE/boletines) | ❌ PRIORIDAD 2 (diciembre) |
| «dónde estudiar en <ciudad>» / «sitios para estudiar <ciudad>» | guía por ciudad universitaria (15 primeras) | ❌ PRIORIDAD 2 |
| «dónde estudiar oposiciones <ciudad>» / «biblioteca para opositores» | guía para opositores (horario largo, silencio, fines de semana) | ❌ PRIORIDAD 3 |
| «salas de estudio <ciudad>» | `/bibliotecas/salas-de-estudio/` y por provincia | ✅ parcial |
| «EBAU/selectividad <comunidad> fechas» + dónde estudiar | página de temporada EBAU (abril-junio) | ❌ PRIORIDAD 3 |
Orden de ciudades: Madrid, Barcelona, Valencia, Sevilla, Granada, Málaga, Zaragoza, Salamanca, Santiago, Bilbao,
Valladolid, Murcia, Pamplona, Oviedo, Alicante (por universitarios; reordenar con datos de Search Console).

## 3. Calendario (adelantarse 4-6 semanas: Google tarda en posicionar)
- **15-nov → 20-dic**: páginas «época de exámenes enero 2027» y «24 h» de las 15 ciudades; festivos de diciembre.
- **Diciembre**: «abiertas en Navidad», «abiertas 24 h en enero». Aviso a prensa local (ver §5).
- **Enero-febrero**: pico. Revisión diaria de aperturas extraordinarias (Objetivo 2).
- **Marzo-abril**: preparar EBAU y exámenes de mayo-junio. **Julio-agosto**: «abiertas en verano» (✅ existe).

## 4. GEO: que las IAs nos citen
- ✅ `llms.txt`, rastreadores de IA permitidos en robots, IndexNow (Bing → ChatGPT) con clave publicada.
- Cada página con **frases citables con fecha y fuente**: «A 15 de noviembre de 2026, N bibliotecas de Madrid abren
  el domingo (fuente: …)». Las cifras salen de los datos, nunca a mano.
- Página **«Datos y metodología»** (`/datos/`): cuántas bibliotecas, cuántas verificadas, de qué fuentes, cada cuánto
  se revisan; y descarga **CSV abierto (CC BY 4.0)** de las verificadas. Atrae enlaces de periodistas y la citan las IAs.
- **Informe trimestral con datos propios** («Ciudades con más bibliotecas abiertas el fin de semana», «¿Dónde
  estudiar un domingo?»): una página con tablas sacadas de los datos. Es lo que la prensa enlaza.
- Medir: visitas desde chatgpt.com, perplexity.ai, gemini, copilot (informe semanal de `docs/seo/`).

## 5. Enlaces desde otras webs (lo que más pesa y lo que menos se hace)
El bucle **prepara**; Marcos **envía** (el bucle nunca publica ni escribe a nadie).
- `docs/ENLACES.md`: lista de destinos con URL pública de contacto y el texto listo para cada uno:
  delegaciones y consejos de estudiantes, asociaciones de opositores, bibliotecas municipales y universitarias
  (su página de «otros recursos»), prensa local en época de exámenes (Time Out, diarios locales), foros
  (r/spain, r/oposiciones, grupos de Telegram de opositores: solo aportando, sin spam).
- **Widget «¿Está abierta?»** embebible (un `<iframe>` o script pequeño con el estado de una biblioteca o ciudad,
  enlazando a su ficha): cada biblioteca, ayuntamiento o asociación que lo ponga es un enlace permanente.
- Kit de prensa (`/prensa/`): qué es, cifras con fecha, capturas, contacto.

## 6. Ganar dinero y reinvertirlo (escalera; cada peldaño solo cuando el anterior funcione)
Antes de cobrar nada: **Vercel Pro** (el plan Hobby es solo para uso no comercial; precio actual en vercel.com/pricing,
sin confirmar aquí) y revisar `condiciones.html` y `privacidad.html` (Marcos decide la forma jurídica).
1. **Afiliación de material de estudio** (Amazon Afiliados u otros): solo en guías («dónde estudiar», opositores),
   nunca en el mapa. Bajo esfuerzo; ingresos pequeños. Marcos tiene que darse de alta.
2. **«Destacado» para salas de estudio privadas y academias de oposiciones** (lo más rentable para este nicho: son
   negocios locales que viven de estudiantes y opositores). Ficha destacada en su ciudad, marcada «Patrocinado».
   Precio por mes y ciudad a decidir por Marcos (sin confirmar). Empezar con 3 ciudades y página `/anunciate/`.
3. **Publicidad display** (AdSense u otra) solo en páginas SEO, nunca en el mapa ni el modo estudio, y solo cuando
   haya tráfico suficiente para que compense la peor experiencia (decidir con datos).
4. **Bibliomapa Pro** (estadísticas avanzadas, temas, sin anuncios) y **B2B** (widget o datos para ayuntamientos y
   universidades).
**Reinversión**: al menos el 50 % de lo que entre vuelve a crecimiento, en este orden: Vercel Pro → anuncios de
búsqueda en las 4 semanas de pico de exámenes sobre consultas con intención clara («biblioteca abierta 24 horas
<ciudad>») → diseño y contenido de temporada → patrocinio pequeño de asociaciones de estudiantes (enlace + difusión).

## 7. Qué mide el éxito (informe semanal `docs/seo/`)
Páginas indexadas · impresiones y clics de Google · consultas en el top 10 · visitas desde IAs · visitas/semana
(Vercel) · enlaces nuevos · ingresos. Metas a fijar por Marcos tras el primer mes de datos.

## 8. Lo que el bucle NO hace (sigue igual)
No inventa datos, no publica en redes ni escribe a nadie, no gasta dinero, no pone anuncios ni enlaces de
afiliado sin que Marcos lo haya decidido en este archivo, no marca nada como patrocinado sin contrato.
