# Publicar Bibliotime en Google Play (TWA)

Guía práctica para subir la PWA a Google Play como **Trusted Web Activity (TWA)**: una app Android mínima que abre tu web a pantalla completa. No hace falta saber programar en Android.

---

## 1. Alojamiento (HTTPS)

- La web debe estar publicada en **HTTPS** (GitHub Pages sirve). Ahora mismo: `https://mmedranomun-hub.github.io/bibliotime3.0/`.
- `start_url` y `scope` del manifest son `./`, así que apuntan a `/bibliotime3.0/`. Bien: no los cambies a `/` mientras la app viva en esa subcarpeta.
- **Problema importante con GitHub Pages:** el fichero `assetlinks.json` tiene que estar en la **raíz del dominio**: `https://mmedranomun-hub.github.io/.well-known/assetlinks.json`, *no* dentro de `/bibliotime3.0/`. Opciones:
  1. Crear (o usar) el repo `mmedranomun-hub.github.io` y poner allí `.well-known/assetlinks.json`, o
  2. Usar un **dominio propio** para este repo (Settings → Pages → Custom domain) y poner el fichero en este repo.
- En el repo que sirva `.well-known/`, añade un fichero vacío llamado `.nojekyll` en la raíz (si no, GitHub Pages ignora las carpetas que empiezan por punto).
- Publica también `privacidad.html` y comprueba que abre: esa URL será la **política de privacidad** en Play.

## 2. Revisar `manifest.json`

Estado actual: tiene `name`, `short_name`, `description`, `start_url`, `scope`, `display: "standalone"`, `background_color`, `theme_color`, `lang` e iconos 192, 512 y **512 maskable**. Correcto.

Arreglos recomendados (PWABuilder los marca como avisos):

- **Falta `id`.** Añade `"id": "./"` (identidad estable de la app aunque cambie `start_url`).
- **Faltan `screenshots`.** Añade 2–4 capturas (p. ej. 1080×1920, `"form_factor": "narrow"`) en `icons/` o una carpeta `screenshots/`.
- **Falta `categories`.** Añade `"categories": ["education", "productivity"]`.
- Opcional: `"dir": "ltr"` y `shortcuts` (p. ej. «Empezar a estudiar»).
- Si cambias el manifest o los iconos, sube `CACHE_NAME` en `sw.js` para que los móviles cojan la versión nueva.

## 3. Generar el paquete Android

### Opción A: PWABuilder (la más sencilla, recomendada)

1. Entra en https://www.pwabuilder.com y pega la URL de la app.
2. Revisa la puntuación y corrige los avisos del manifest (sección 2).
3. **Package for stores → Android → Google Play**.
4. Rellena: *Package ID* (p. ej. `io.github.mmedranomunhub.bibliotime`; **no se puede cambiar nunca**), nombre, versión `1` / `1.0.0`, color de barra `#6c5ce7`, splash `#dbeafe`.
5. Signing key: **Create new**. Descarga el ZIP. Contiene:
   - `app-release-bundle.aab` → lo que se sube a Play.
   - `signing.keystore` + `signing-key-info.txt` → **la llave de tu app**.
   - `assetlinks.json` → para el paso 5.

### Opción B: Bubblewrap (línea de comandos)

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://mmedranomun-hub.github.io/bibliotime3.0/manifest.json
bubblewrap build        # genera app-release-bundle.aab y te pide crear el keystore
bubblewrap fingerprint generateAssetLinks
```

## 4. Guardar la llave (keystore)

- Guarda `signing.keystore` y sus contraseñas en **dos sitios seguros** (p. ej. gestor de contraseñas + disco/nube privada). **Nunca** lo subas a GitHub.
- Si la pierdes no podrás publicar actualizaciones con la misma llave. Activa **Play App Signing** (viene por defecto): Google guarda la llave de firma final y la tuya pasa a ser la «de subida», que sí se puede restablecer pidiéndolo a soporte.

## 5. Digital Asset Links (quita la barra del navegador)

1. Sube `assetlinks.json` a `/.well-known/assetlinks.json` en la raíz del dominio (ver sección 1).
2. Cuando subas la app a Play Console, ve a **Configuración → Integridad de la app → Firma de apps** y copia la huella **SHA-256 de la clave de firma de apps** de Google.
3. Añádela al array `sha256_cert_fingerprints` de `assetlinks.json` (junto a la tuya) y vuelve a publicarlo. Si no lo haces, la app instalada desde Play mostrará la barra de URL arriba.
4. Comprueba: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://TU-DOMINIO&relation=delegate_permission/common.handle_all_urls`

## 6. Cuenta de Google Play Console

- Regístrate en https://play.google.com/console como **cuenta personal**. Pago único de **25 USD**.
- Verificación de identidad (DNI) y de un dispositivo Android con la app de Play Console.
- **Cuentas personales nuevas:** antes de publicar en producción hay que hacer una **prueba cerrada con al menos 12 testers durante 14 días seguidos**. Comprueba el requisito actual en la ayuda de Google («App testing requirements for new personal developer accounts»), porque cambia de vez en cuando.
  - Crea una lista de correos (compañeros de clase), sube el `.aab` a **Prueba cerrada**, comparte el enlace de inscripción y pide que **no desinstalen** la app en 14 días.
  - Después, solicita acceso a producción desde el Panel.

## 7. Formulario «Seguridad de los datos»

Basado en `privacidad.html`. Respuestas propuestas:

- ¿Recoge o comparte datos? **Sí**. ¿Cifrados en tránsito? **Sí** (HTTPS). ¿Se puede pedir su eliminación? **Sí**.
- **Información personal → Correo electrónico, Nombre, ID de usuario:** recogidos; obligatorios; finalidad *Funcionalidad de la app* y *Gestión de la cuenta*; no compartidos con terceros.
- **Ubicación aproximada:** recomendado declararla como **recogida, opcional**, finalidad *Funcionalidad de la app* (la biblioteca donde estudias se comparte con amigos si lo activas). La ubicación GPS precisa se usa solo en el dispositivo y no se envía, así que **no** se declara como «Ubicación precisa».
- **Actividad en la app → Otras acciones / Otro contenido generado por el usuario:** sesiones de estudio, reseñas de libros, reportes de afluencia, kudos; opcional; *Funcionalidad de la app*.
- **Calendario → Eventos del calendario:** exámenes/eventos compartidos; opcional; *Funcionalidad de la app*.
- **Creencias religiosas** (en «Información personal»): «Ofrecer estudio» y «Rezar» lo pueden revelar; declararlo como **opcional**.
- Compartido con terceros: **No** (Supabase es proveedor de servicios y no cuenta como «compartir»).
- Publicidad / analítica: **No**.
- **Eliminación de cuenta:** Google exige una URL donde se pueda pedir. Usa la sección 7 de `privacidad.html` (`.../privacidad.html`). Ideal a medio plazo: un botón «Eliminar cuenta» dentro de la app.

## 8. Ficha de la tienda

Checklist:

- [ ] Icono 512×512 PNG (`icons/icon-512.png`).
- [ ] Gráfico de funciones 1024×500 PNG/JPG (crea uno con Canva).
- [ ] 2–8 capturas de móvil (mín. 320 px, proporción 9:16 recomendada): mapa, ficha de biblioteca, cronómetro, perfil/rachas, amigos.
- [ ] Categoría: **Educación**. Correo de contacto. URL de privacidad.
- [ ] Clasificación de contenido (cuestionario IARC) y **público objetivo**: marca **13 años o más** o superior; no la dirijas a niños.
- [ ] Declaraciones: sin anuncios, acceso a la app (si piden credenciales de prueba, crea una cuenta demo y pásala).

**Descripción breve (≤ 80 caracteres):**

> Bibliotecas de Navarra: horarios, afluencia y modo estudio con amigos.

(70 caracteres)

**Descripción completa (borrador):**

> ¿Dónde estudio hoy? Bibliotime reúne en un mapa las bibliotecas públicas y universitarias de Navarra para que encuentres sitio sin dar vueltas.
>
> 📍 Mapa y horarios: ve qué bibliotecas están abiertas ahora, cuánto falta para que cierren y cuáles tienes más cerca.
> 👥 Afluencia compartida: los estudiantes indican si la biblioteca está libre, media o llena.
> ⏱️ Modo estudio: cronómetro, Pomodoro y modo foco, con objetivos diarios o semanales, rachas e insignias.
> 📅 Calendario: apunta exámenes, tareas y préstamos de libros y recibe recordatorios.
> 🤝 Amigos: añade amigos con un código, crea salas de estudio en grupo, comparte tus sesiones y da kudos.
> 📚 Blog de lecturas: recomienda libros a otros estudiantes.
>
> Privacidad primero: tus datos de estudio se guardan en tu móvil, tu ubicación GPS nunca sale del dispositivo y solo compartes con tus amigos lo que tú activas. Sin anuncios y sin rastreadores.
>
> Hecha por y para estudiantes de Navarra.

## 9. Actualizaciones

- Cambios en la web (HTML/JS): **no hace falta** subir nada a Play; la app carga la web. Sube `CACHE_NAME` en `sw.js`.
- Cambios en nombre, icono, colores o `start_url`: regenera el `.aab` con **la misma llave** y un `versionCode` mayor.
