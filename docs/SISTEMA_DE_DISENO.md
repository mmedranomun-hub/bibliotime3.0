# Sistema de diseño

Referencia única para que todas las pantallas de Bibliotime, y las futuras apps de la misma familia
(gimnasios, piscinas, salas de estudio…), se vean igual. Los valores viven en el bloque `:root` al
principio del `<style>` de `index.html`; `legal.css` copia los que necesita para las páginas legales.

**Regla de oro:** ningún componente escribe un color, un tamaño de letra o un radio a mano. Si falta un
valor, se añade un token aquí y en `:root`, nunca un número suelto en el componente.

## 1. Principios
- **Calma y concentración.** Base de azules y lilas poco saturados; el acento índigo marca acciones y
  estado activo. Los colores intensos (rojo, ámbar) solo para avisos puntuales, nunca en superficies grandes.
- **Legible siempre.** Todo texto cumple WCAG AA (≥ 4,5:1) en modo claro y oscuro. Para texto en color de
  acento se usa `--acento-tx`, no `--acento`.
- **Vidrio suave.** Tarjetas translúcidas (`--glass`, `--glass-fuerte`) con desenfoque y sombra difusa sobre
  un fondo en degradado (`--bg-grad`).
- **Lo mismo se dibuja igual.** Un botón principal, una píldora activa o un estado «abierta» tienen el mismo
  aspecto en el mapa, la agenda o el perfil.

## 2. Tokens

### Color de marca
| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--acento` | #6c5ce7 | igual | bordes, anillos, rellenos pequeños |
| `--acento-tx` | #5b4bd6 (6,1:1) | #b4abff (7,1:1) | **texto** en color de acento, enlaces |
| `--grad-acento` | #5b4bd6 → #6c5ce7 | igual | fondo de botones principales y elementos activos (texto blanco ≥ 4,9:1) |
| `--acento2` | #00d2d3 | igual | segundo color de marca (progreso, selección en el mapa) |
| `--acento-tenue` | índigo al 6 % | igual | tinte de fondo muy suave (fines de semana en la agenda) |
| `--marca-a` / `--marca-b` | #5b4bd6 → #0e7490 | #b4abff → #5eead4 | degradado del nombre de la app |

### Estados
Cada estado tiene tres variantes: color base (puntos, rellenos, chinchetas), `-osc` (degradados y bordes)
y `-tx` (texto sobre fondo tenue, con contraste AA en ambos temas).

| Estado | Base | `-osc` | `-tx` claro / oscuro | Significado |
|---|---|---|---|---|
| `--ok` | #22c55e | #16a34a | #166534 / #86efac | abierta, libre, conseguido |
| `--aviso` | #f59e0b | #d97706 | #b45309 / #fcd34d | casi llena, cierra pronto, favorita |
| `--peligro` | #ef4444 | #dc2626 | #b91c1c / #fca5a5 | llena, error (solo puntual) |
| `--info` | #3b82f6 | — | — | tu ubicación |

Alias: `--abierto` = `--ok` (punto de «abierta»). Un local **cerrado** se pinta en azul calmado (punto `--ev-ta`,
chincheta `--pin-cerrada`, etiqueta `--ev-ta-*`), no en rojo: cerrado no es una alarma. Para texto rojo (errores,
borrar) se usa siempre `--peligro-tx`; para contadores con número blanco, `--peligro-osc` (4,8:1).

### Superficies y texto
| Token | Claro | Oscuro |
|---|---|---|
| `--texto` | #0f172a | #e5e7eb |
| `--suave` (texto secundario) | #475569 | #a3b0c2 |
| `--bg` / `--bg-grad` | #dbeafe / azul → lila | #0b1220 / azul noche → índigo |
| `--glass` / `--glass-fuerte` | blanco 62 % / 85 % | pizarra 72 % / 94 % |
| `--borde` | blanco 55 % | gris 22 % |
| `--sombra` | 0 8px 32px negro 18 % | 0 8px 32px negro 45 % |
| `--blanco` | `255,255,255` (para `rgba(var(--blanco),.5)`) | `30,41,59` |
| `--neutro` / `--neutro-claro` | #94a3b8 / #cbd5e1 | igual |

### Categorías (agenda)
Fondo tenue + texto oscuro del mismo matiz + punto de color: `--ev-ex-*` (examen, rosa), `--ev-ta-*`
(tarea, azul), `--ev-ot-*` (otro, verde azulado). Cada una tiene `--ev-xx` (punto), `-bg` (fondo) y `-tx` (texto).
Para otra app se renombran las categorías (p. ej. *clase*, *entreno*, *otro*) y se mantienen los tonos.

### Chinchetas del mapa
`--pin-abierta`, `--pin-cerrada`, `--pin-sin-horario`, `--pin-grupo`, `--pin-sel` y sus `-punta`.
La afluencia recolorea la chincheta con `--ok`, `--aviso` y `--peligro`.

### Tipografía
Fuente: Inter (con las del sistema de respaldo). Pesos: 600 normal destacado, 700 etiquetas y botones,
800 títulos y cifras.

| Token | px | Uso típico |
|---|---|---|
| `--fs-2xs` | 10 | etiquetas en mayúsculas, insignias |
| `--fs-xs` | 11 | metadatos, chips de filtro |
| `--fs-s` | 12 | texto secundario |
| `--fs-m` | 13 | botones pequeños, texto de tarjeta |
| `--fs-base` | 14 | texto normal, botones |
| `--fs-l` | 16 | títulos de tarjeta |
| `--fs-xl` | 18 | títulos de sección, cifras medianas |
| `--fs-2xl` | 20 | títulos de ventana y de la marca |
| `--fs-3xl` | 24 | iconos grandes |
| `--fs-4xl` | 28 | título de página, cifras de estadísticas |
| `--fs-5xl` | 32 | logo de acceso, duración en el feed |

Excepciones permitidas: las cifras gigantes del cronómetro (64 px) y la planta del modo foco (44 px).

### Radios
| Token | px | Uso |
|---|---|---|
| `--r-xs` | 6 | insignias, código |
| `--r-s` | 8 | filas resaltadas |
| `--r-m` | 12 | botones, campos, celdas, tarjetas pequeñas |
| `--r-l` | 16 | tarjetas, ventanas emergentes |
| `--r-xl` | 20 | tarjetas grandes, paneles, barra inferior |
| `--r-pill` | 999 | píldoras, chips, contadores |
| `50%` | — | círculos (puntos, avatares, chinchetas) |

### Espaciado
Múltiplos de 2 px con estos valores habituales: 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 22. Tarjetas: 16–22 px de
relleno. Separación entre tarjetas: 10–14 px. Márgenes de pantalla: 16 px en móvil, 22 px en escritorio.

## 3. Componentes (clases de `index.html`)
| Componente | Clase | Notas |
|---|---|---|
| Botón principal | `.btn` | `--grad-acento`, texto blanco, `--r-m`; `.sm` compacto |
| Botón secundario | `.btn.ghost` | transparente, borde índigo, texto `--acento-tx` |
| Botón de parar / salir | `.btn.danger` | rosa tenue (`--ev-ex-*`), nunca rojo saturado |
| Enlace de acción | `.linkbtn` | texto `--acento-tx` subrayado |
| Tarjeta | `.glasscard` | `--glass-fuerte`, `--r-xl`, `--sombra` |
| Selector segmentado | `.seg` + `button.on` | activo con `--grad-acento`; tipos de evento con tonos `--ev-*` |
| Chip / filtro | `.list-filters button`, `.subj-chips button` | píldora; activo con `--grad-acento` |
| Etiqueta de estado | `.pop .estado.open/.closed` | fondo tenue + `-tx` |
| Lista de próximos | `.prox-item.ev-*-txt` | fecha grande + título + «en N días» |
| Ventana | `.modal` | título `--fs-2xl`; acciones al final |
| Aviso breve | `showToast(texto)` | — |
| Barra inferior | `.dock` | 5 destinos; el central (`.dock-record`) es la acción principal |
| Tarjeta flotante | `.nowcard` | recomendación del momento sobre el mapa |
| Chincheta | `.chincheta` (+ `.closed`, `.unk`, `.grupo`, `.occ-*`, `.sel`) | icono en CSS, no SVG en línea |

## 4. Tema claro / oscuro
- El script del `<head>` resuelve el tema (el elegido en Ajustes o, en «Automático», el del sistema) y lo
  pone en `<html data-theme="light|dark">`; sigue los cambios del sistema.
- Los valores oscuros se definen **una sola vez** en `:root[data-theme="dark"]`. Un token nuevo que cambie
  con el tema se añade en los dos bloques.
- Lo que el JS dibuja en `<canvas>` (imagen para compartir la semana) no puede usar `var()`: ahí van colores
  literales, que deben coincidir con los tokens.

## 5. Cómo comprobar un cambio
1. Capturas a 390×844 en claro y oscuro de la pantalla tocada.
2. Contraste de cada texto nuevo (≥ 4,5:1; ≥ 3:1 si es ≥ 18,66 px en negrita).
3. Buscar valores sueltos: `font-size:\d`, `border-radius:\d` o `#xxxxxx` nuevos fuera del bloque de tokens.
4. Subir `CACHE_NAME` en `sw.js` y apuntar el cambio en `docs/DISENO.md`.
