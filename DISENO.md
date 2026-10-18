# Diseño de Bibliotime

Criterios que sigue la rutina diaria de diseño (una mejora pequeña por día).

## Paleta y teoría del color
- **Base calmada:** azules y verdes suaves para la concentración; fondos con poca saturación.
- **Acento:** índigo/violeta moderado (`--acento: #6c5ce7`) para acciones y estado activo.
- **Evitar:** rojos grandes y colores muy saturados (activan alerta y fatigan); el rojo queda para avisos puntuales.
- **Contraste:** texto WCAG AA (≥ 4.5:1) en modo claro y oscuro. Los colores se definen como variables en `:root` y se redefinen en el bloque de modo oscuro.

## Registro
- 2026-10-17 · Agenda: los eventos pasan de etiquetas saturadas con texto blanco (ámbar con contraste ~2:1) a tonos tenues con texto oscuro del mismo matiz y borde izquierdo; "Otro" pasa de ámbar a verde azulado (calma); el día de hoy lleva un fondo índigo muy suave. Variables `--ev-*` con versión para modo oscuro.
- 2026-10-17 · Agenda en el móvil: la cuadrícula ya no corta los títulos ("E…"); cada día muestra puntos de color por evento y debajo hay una lista "Próximos" (dos semanas, hasta 6) con fecha, título completo, tipo y "en N días", en los mismos tonos suaves (contraste 6-8.8:1). Celdas algo más bajas para que se vea más calendario sin hacer scroll.
- 2026-10-18 · Tarjeta "Te recomiendo ahora" (#nowCard): nuevo token `--acento-tx` para texto en color de acento (claro #5b4bd6, 6.1:1; oscuro #b4abff, 7.1:1, antes #6c5ce7 a 3.0:1 sobre la tarjeta oscura, por debajo de AA) en el titular, botones secundarios y enlace de ubicación; `--aviso-tx` para "época de exámenes" en oscuro. "▶ Estudiar aquí" ya no se parte en dos líneas: el botón principal es algo más ancho que los secundarios.
