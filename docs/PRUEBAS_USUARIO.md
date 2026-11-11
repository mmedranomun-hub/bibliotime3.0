# Probador como usuario (bucle de automejora)

Pedido por Marcos el 10-11-2026: «prueba como si fueras un usuario a hacer distintas cosas, a compartir con amigos los
exámenes, las sesiones de estudio… y hazme reportes de cómo se puede mejorar». Lo lee la tarea
«Bibliomapa · probador como usuario» dos veces al día.

## Cómo se prueba
- Navegador real (Playwright, Chromium), móvil 390×844, claro y oscuro, como **dos usuarios a la vez**: Lucía
  (1.º de Medicina en Pamplona, nueva) y Javi (opositor en Madrid, lleva un mes). Dos contextos de navegador con
  un **Supabase simulado compartido** (mismo objeto en memoria con las reglas RLS de `supabase/supabase_social.sql`:
  amistad aceptada para ver, rezos solo de amigos…), porque desde la nube no se toca Supabase de producción.
- Se juega **una historia distinta cada vuelta** (rota por la lista) y se cronometra cada paso. Se anotan:
  errores de JS, pasos que no se entienden, botones que no hacen nada, textos cortados, cosas que tardan > 1 s,
  momentos sin recompensa donde debería haberla, y lo que un amigo NO ve aunque debería.
- Una vez por semana, además, se prueba la **web publicada** (bibliomapa.es con WebFetch o, si se puede, el
  navegador) para ver qué ve un visitante de verdad.

## Historias (rotan; añade nuevas cuando se te ocurran)
1. **Primera vez**: Lucía entra sin cuenta, bienvenida, elige biblioteca, estudia 25 min, planta su primer árbol.
2. **Examen compartido**: Lucía apunta «Anatomía II» y lo comparte; Javi (amigo) lo ve en su agenda, reza; Lucía ve
   el recuento de rezos. ¿Cuántos toques? ¿Se entiende «compartir con amigos»?
3. **Hacerse amigos**: código de amigo, solicitud, aceptar, ver bosque del otro y sus historias.
4. **Sesión y redes**: Javi estudia 2 h, comparte la sesión en stories (imagen 1080×1920: ¿se lee bien?), Lucía da
  kudos con doble toque.
5. **Racha y misiones**: tres días seguidos (reloj simulado), la racha sube, cofre, especies de la tienda.
6. **Se le marchita**: sale de la app a mitad de sesión; ¿entiende por qué y qué hacer?
7. **Buscar biblioteca abierta ahora** en otra ciudad (Valencia, Sevilla): ¿la encuentra?, ¿el horario es claro?
8. **Temporada de exámenes**: aperturas extraordinarias y salas 24 h de su ciudad.
9. **Instalar la app** (manifest, iconos, atajos) y usarla sin conexión.
10. **Accesibilidad**: solo teclado, lector de pantalla (roles/etiquetas), «reducir movimiento», textos al 200 %.

## Informe de cada vuelta
`docs/informes/usuario-AAAA-MM-DD.md` (la segunda vuelta del día añade al mismo archivo):
- Historia probada, usuarios, pasos y tiempos.
- **Hallazgos** ordenados por gravedad (🔴 roto · 🟠 confuso · 🟡 mejorable · 💡 idea), cada uno con captura
  (en `docs/informes/capturas/`, máximo 4 por vuelta, PNG ≤ 200 KB) y propuesta concreta.
- Lo que ha mejorado desde el informe anterior (si un hallazgo ya está arreglado, márcalo ✅).
Cada 🔴 y 🟠 se convierte en una tarea «Usuario · …» en `## Siguientes` de BACKLOG.md (las hace el director);
cada 🔴 detectable automáticamente se añade como prueba a `scripts/probar.py`.
