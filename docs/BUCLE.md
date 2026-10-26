# El bucle de mejora continua de Bibliomapa

Pedido por Marcos el 27-10-2026: «cuando yo no te mande nada, tú trabajas con lo que saques de este bucle», y que
el bucle «lance agentes para crear mejores bucles». Este archivo es la memoria del sistema: cada ejecución lo lee y
añade una línea al registro de abajo.

## Las piezas
```
          ┌──────── cada hora, día y noche (:18) ───────┐
          │  DIRECTOR (tarea «Bibliomapa · director»)     │
          │  1. sincroniza y pasa scripts/probar.py        │
          │  2. lee OBJETIVOS.md + metricas.json          │
          │  3. elige 2-3 trabajos que no choquen          │
          │  4. lanza 1 agente por trabajo (en paralelo,   │
          │     cada uno en su worktree)                   │
          │  5. integra solo lo que pasa las pruebas       │
          │  6. mide, sube, apunta aquí, avisa a Marcos    │
          └───────────────────────┬──────────────────────┘
                                  │ registro de ejecuciones
          ┌───────────────────────▼──────────────────────┐
          │  OPTIMIZADOR (miércoles y domingo, 20:54)     │
          │  lanza 2 agentes que auditan el registro:     │
          │   · rendimiento: qué tareas salen bien/mal,   │
          │     cuánto avanzan las métricas por ejecución │
          │   · diseño: cómo mejorar prompts, cadencia y  │
          │     reparto entre tareas programadas          │
          │  aplica los cambios (con límites) y lo anota  │
          └──────────────────────────────────────────────┘
```
Además siguen las rutinas diarias que ya existían (diseño 6:50, rendimiento 7:45, arreglo de fallos 12:37) y la
tarea del ordenador de Marcos que hace el backlog cada 3 h. El director no toca sus tareas; el optimizador puede
ajustarlas dentro de los límites de abajo.

Tareas programadas: «Bibliomapa · director» y «Bibliomapa · optimizador de bucles» (en la cuenta de Marcos).

## Límites del optimizador (para que el sistema mejore sin descontrolarse)
- Solo puede tocar tareas programadas cuyo nombre empiece por «Bibliomapa» o «Bibliotime».
- Puede cambiar prompt, horario o activar/desactivar. **Nunca borra** ninguna (desactivar es reversible).
- Como mucho 6 tareas «Bibliomapa/Bibliotime» activas a la vez; como mucho crea 1 nueva por revisión, y solo si el
  registro demuestra un hueco que ninguna cubre.
- Nunca más de una ejecución por hora en ninguna tarea (el director ya va cada hora: no se acelera más); nunca tocar tareas de otros temas (correo, La Guardia…).
- Un cambio del optimizador se evalúa en la revisión siguiente: si las métricas empeoran, se deshace.
- Todo cambio queda anotado abajo con el porqué.

## Si se acaba el uso del plan
Las ejecuciones que caigan sin cuota fallan y la siguiente lo retoma desde el registro y el backlog: no hace falta
ningún mensaje para «volver a empezar». El trabajo a medias nunca se sube (solo lo que pasa `scripts/probar.py`).

## Registro de ejecuciones
Formato: `AAAA-MM-DD HH:MM · quién · objetivo(s) · resultado (✅ subido / ⚠️ a medias / ❌ falló) · commit · métrica que movió`

- 2026-10-27 00:15 · sesión con Marcos · montaje del bucle: `scripts/probar.py` (11 pruebas), OBJETIVOS.md, este archivo · ✅ · línea base: 11/11, 0 errores, 1995 ms, 148 horarios, 27/51 provincias, 125 páginas
