# Plantilla: crear otra app de la familia Bibliotime

Bibliotime es, en el fondo, una app genérica de **«lugares con horario + registrar tiempo + agenda + amigos»**.
Cambiando los datos y los textos sirve para gimnasios, piscinas, salas de estudio, coworkings, rocódromos…
Esta guía dice qué se reutiliza tal cual, qué se adapta y en qué orden. Ejemplo: **Gymtime** (gimnasios).

## 1. Qué es genérico y qué es de bibliotecas

| Módulo (sección en `app.js`) | ¿Se reutiliza? | En Gymtime |
|---|---|---|
| Sistema de diseño (bloque `:root`, ver `SISTEMA_DE_DISENO.md`) | Sí, cambiando colores de marca | Acento propio (p. ej. verde), misma estructura |
| Mapa, chinchetas, agrupación, lista y búsqueda (`MAPA Y LISTA`) | Sí | Gimnasios en lugar de bibliotecas |
| Horarios y estado abierto/cerrado (`h()`, `semana()`, `estadoTexto`, verano/invierno) | Sí | Igual |
| Tarjeta «Te recomiendo ahora» (`renderNowCard`) | Sí | «El gimnasio más cercano abierto» |
| Afluencia compartida (`AFLUENCIA / OCUPACIÓN`, `OCC_LEVELS`) | Sí | «¿Cuánta gente hay?», muy útil en gimnasios |
| Favoritas, filtros (abiertas, cercanas, hasta tarde…) | Sí | Añadir filtros propios (24 h, piscina…) |
| Modo estudio: cronómetro, Pomodoro, meta diaria, rachas (`MODO ESTUDIO`) | Sí, renombrado | «Entreno»: cronómetro, intervalos, meta semanal |
| Asignaturas (`ASIGNATURAS`) | Sí, renombrado | Tipo de entreno (pierna, cardio…) |
| Modo foco (`MODO FOCO`) | Opcional | Menos sentido en un gimnasio |
| Agenda con próximos y calendario de amigos (`CALENDARIO`) | Sí | Clases reservadas, competiciones |
| Amigos, ranking, feed, salas en grupo, kudos (`SUPABASE SOCIAL`) | Sí | Igual |
| Modo invitado y cuentas (`AUTENTICACIÓN`, `entrarComoInvitado`) | Sí | Igual |
| Retos y trofeos | Sí, con otras metas | Kilómetros, sesiones por semana |
| Avisos, compartir la semana (imagen) | Sí | Igual |
| Rezar por un examen, ofrecer estudio | **No** (propio de Bibliotime) | Quitar |
| Blog de lecturas, estantería de libros, préstamos | **No** | Quitar o cambiar por «rutinas» |
| Acceso/accesibilidad por ley (Ley Foral 32/2002, Ley 10/2007) | **No** | Precio, cuota, pase de día |
| `bibliotecas-espana.js`, `BIBLIOTECAS`, `ACCESO_INFO`, `EXTRA_INFO` | **No**: son los datos | Datos de gimnasios |

## 2. Formato de los datos de un lugar
Cada lugar es un objeto del array `BIBLIOTECAS` (en Gymtime conviene llamarlo `LUGARES`):

```js
{nombre:"Gimnasio Ejemplo", lat:42.81, lon:-1.65, dir:"Calle Mayor 1, 31001", tel:"+34 948 00 00 00",
 web:"https://…", rating:null, reviews:null,
 horasInvierno: semana(L, M, X, J, V, S, D),   // cada día: [[h(7,0), h(23,0)]] o [] si cierra
 horasVerano:   semana(…),                      // opcional; si falta, se usa el de invierno
 sinHorario:false, ciudad:"Pamplona", provincia:"Navarra", tipoBib:"publica"}
```
- `h(hh, mm)` pasa una hora a minutos. Un día puede tener varios tramos: `[[h(9,0),h(14,0)],[h(16,0),h(21,0)]]`.
- Los datos en bloque van en un archivo aparte, como `bibliotecas-espana.js`, en forma compacta
  (`n`, `lat`, `lon`, `t`, `dir`, `c`, `p`, `web`, `tel`, `h`), y se añaden **al final** del array.
- **El orden no se cambia nunca:** la afluencia y la presencia de amigos guardan el índice del lugar.
- Información extra por nombre (`EXTRA_INFO`: aforo, recursos como wifi o enchufes; `ACCESO_INFO`: quién puede
  entrar). En un gimnasio: cuota, pase de día, piscina, clases dirigidas.
- Solo datos con fuente: lo no verificado se muestra como «sin confirmar».

## 3. Pasos para crear Gymtime
1. **Copiar el repositorio** a uno nuevo (p. ej. `gymtime`) y crear un proyecto nuevo de Supabase.
2. **Marca:** cambiar en `:root` solo `--acento`, `--acento-tx` (claro y oscuro), `--grad-acento`,
   `--marca-a/-b` y `--acento2`. Comprobar contraste AA de `--acento-tx` en ambos temas y del texto
   blanco sobre `--grad-acento`. Todo lo demás (estados, tipografía, radios) se queda igual: es lo que hace
   que las apps se sientan de la misma familia.
3. **Nombre e iconos:** `manifest.json` (`name`, `short_name`, `description`, `theme_color`), `<title>` y
   metaetiquetas de `index.html`, `icons/`, y la marca de la barra superior y de la pantalla de acceso.
4. **Datos:** sustituir `BIBLIOTECAS` y `bibliotecas-espana.js` por los lugares nuevos (mismo formato);
   vaciar `ACCESO_INFO` y `EXTRA_INFO` o rellenarlos con información con fuente.
5. **Textos:** buscar «biblioteca», «estudio», «estudiar», «asignatura» y «examen» y cambiarlos
   («gimnasio», «entreno», «entrenar», «tipo de entreno», «competición»). Las categorías de la agenda se
   renombran manteniendo sus tonos `--ev-*`.
6. **Quitar lo propio de Bibliotime:** rezar y ofrecer estudio (interruptor «extras»), blog de lecturas,
   préstamos, estantería, las referencias legales de acceso a bibliotecas y la capa del plano de Navarra.
7. **Supabase:** ejecutar `supabase/supabase_social.sql` en el proyecto nuevo, quitar las tablas que no se
   usen (`prayers`, `book_posts`…) y poner la URL y la clave pública en `SUPABASE_URL` / `SUPABASE_ANON_KEY`.
8. **Textos legales:** `privacidad.html` y `condiciones.html` con el nombre y el responsable nuevos.
9. **Caché:** cambiar el prefijo de `CACHE_NAME` en `sw.js` (p. ej. `gymtime-v1`), para que nunca
   comparta caché con Bibliotime.
10. **Comprobar:** capturas de todas las pantallas en claro y oscuro (`SISTEMA_DE_DISENO.md`, apartado 5).

## 4. Lo que haría reutilizable el código sin copiarlo (cuando haya 2 o más apps)
Mientras solo exista Bibliotime, copiar la plantilla es lo más simple. Con una segunda app conviene:
- Sacar los tokens a un `tokens.css` compartido y dejar en cada app solo un pequeño bloque de marca.
- Reunir en un objeto `CONFIG` (nombre de la app, palabra para «lugar», para «sesión» y para «tema»,
  categorías de la agenda, filtros) los textos que hoy están escritos en el código.
- Separar los datos de Navarra de `app.js` a su propio archivo, como ya se hizo con los de España.
