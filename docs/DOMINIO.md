# bibliomapa.es: vigilancia, tráfico y rentabilidad

Dominio comprado por Marcos (octubre 2026). Lo lee la tarea «Bibliomapa · vigía del dominio» dos veces al día.
Objetivos 7 y 8 de `docs/OBJETIVOS.md`.

## 1. Comprobaciones de cada vuelta (desde fuera, como un visitante)
Desde la nube el `curl` a webs externas suele estar bloqueado: usa WebFetch (y WebSearch para Google).
1. `https://bibliomapa.es` y `https://www.bibliomapa.es` responden (si www no redirige a la raíz, apúntalo).
2. Título, cabecera («Bibliotecas de España») y metas: deben coincidir con `index.html` de `origin/main`.
3. `https://bibliomapa.es/robots.txt` y `/sitemap.xml` existen y apuntan a bibliomapa.es; una ficha y una página de
   ciudad de `bibliotecas/` cargan (si 404: esas páginas solo existen en la rama del bucle y no están publicadas).
4. Google: `site:bibliomapa.es` (cuántas páginas salen) y 3 búsquedas objetivo, p. ej. «bibliotecas abiertas Pamplona»,
   «biblioteca abierta domingo Madrid», «salas de estudio 24 horas Valencia»: ¿aparece bibliomapa.es? ¿en qué puesto?
5. Desfase: `git log --oneline origin/main..<rama del bucle> | wc -l` y fecha del commit más antiguo sin publicar.
6. Velocidad de la web publicada: si hay herramienta, PageSpeed Insights de la portada (móvil).
Si algo de 1-3 falla, es lo primero del informe y se avisa a Marcos al momento.

## 2. Tráfico (lo que se puede medir y lo que no)
- Hoy **no hay analítica**: no se sabe cuánta gente entra. Sin eso no hay forma honesta de hablar de rentabilidad.
- Recomendado, en este orden (todo sin cookies → sin banner de consentimiento, compatible con la política de privacidad
  actual si se añade una línea):
  1. **Vercel Web Analytics** (si la web está en Vercel): se activa en el panel del proyecto; luego el bucle añade
     `<script defer src="/_vercel/insights/script.js"></script>`. Gratis en el plan básico con límite de eventos.
  2. **Google Search Console**: verificar el dominio por DNS y enviar `sitemap.xml`. Da clics e impresiones de Google
     por búsqueda y por página: es la métrica clave del SEO.
  3. Alternativas si no es Vercel: GoatCounter, Plausible o Umami (sin cookies).
- El bucle puede preparar el código y el texto de privacidad, pero **activar cuentas lo hace Marcos**.
- Cuando haya datos: visitas/semana, % móvil, páginas de entrada (¿las de ciudad funcionan?), retención (vuelven al
  día siguiente), y la estrella polar (minutos de estudio por usuario activo).

## 3. Rentabilidad: opciones y umbrales (para decidir con datos, no antes)
| Opción | Cuándo tiene sentido | Riesgo |
|---|---|---|
| Anuncios (AdSense u otra red) | Solo en las páginas de ciudad y fichas (tráfico de Google), nunca dentro del modo estudio. Con pocos miles de visitas al mes da muy poco dinero | Banner de cookies, peor velocidad y SEO, choca con «app para concentrarse» |
| Afiliación (libros de oposiciones, MIR, material) | Con usuarios que estudian oposiciones/MIR: enlaces útiles en una sección propia | Poco ingreso hasta tener volumen; hay que declararlo |
| Patrocinio local (academias, residencias, cafeterías de estudio) | En una ciudad con usuarios reales (Pamplona primero) | Requiere vender a mano |
| Premium (bosques/especies, estadísticas avanzadas, salas privadas) | Con usuarios que vuelven cada día | Pocos pagan; hay que mantener lo gratis útil |
| Universidades / colegios mayores (licencia o versión propia) | Con datos de uso que enseñar | Ciclos de venta largos |
| Vender la web | Se vende por ingresos o tráfico demostrables; sin ellos vale poco más que el dominio y el código | Pierdes el proyecto |

## 4. Informe del vigía
`docs/informes/dominio-AAAA-MM-DD.md` (uno por día; la vuelta de la tarde añade al de la mañana): estado de las
comprobaciones, desfase main/rama, presencia en Google, tráfico si lo hay, 1-3 recomendaciones concretas y qué
necesita de Marcos. Línea en el registro de `docs/BUCLE.md`.
