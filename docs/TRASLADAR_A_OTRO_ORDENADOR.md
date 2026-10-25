# Empezar de cero o pasar Bibliotime a otro ordenador

Todo el código y la documentación de la app están en GitHub (`mmedranomun-hub/bibliotime3.0`, rama
`main`). Una carpeta descargada de cero desde ahí tiene **todo el progreso de la app**. Lo que no está
en GitHub, y por tanto hay que copiar a mano, es lo de la tabla de abajo.

## 1. Cómo queda ordenado el ordenador
```
C:\Users\pc\Bibliotime\                    ← copia de GitHub (la app). Solo esto; se sincroniza sola
C:\Users\pc\Bibliotime - Documentacion\    ← lo que NO va a GitHub (estudios, Google Play, claves)
    estudio_de_mercado.md, salida_al_mercado\ …
    claves\                                ← clave de firma de Google Play (.jks / .keystore) y sus contraseñas
```
- Las tareas programadas de Windows y los scripts usan la ruta `C:\Users\pc\Bibliotime` y el remoto
  de git llamado `repo3`: no cambiar ninguno de los dos.
- En la carpeta de la app solo se crean archivos que git ignora (registros `scripts\*.log`, `data\`,
  `.vercel\`, `.tarea.lock`).

## 2. Lo que no está en GitHub (copiar aparte)
| Qué | Dónde suele estar | Por qué importa |
|---|---|---|
| Clave de firma de Google Play (`*.jks`, `*.keystore`) y sus contraseñas | carpeta de Google Play / documentación | **Sin ella no se pueden publicar actualizaciones** de la app en Play |
| `.vercel\` | dentro de la carpeta de la app | une la carpeta con el proyecto de Vercel (se puede rehacer con `vercel link`) |
| Documentación privada (estudio de mercado, salida al mercado…) | `Bibliotime - Documentacion\` | no se publica |
| Contraseñas: GitHub, Vercel, Supabase | gestor de contraseñas | para volver a iniciar sesión |

`data\` no hace falta: `scripts\importar_bibliotecas_osm.js` la regenera.

## 3. Empezar de cero en un ordenador (el actual o uno nuevo)
1. **Subir lo pendiente:** en el ordenador antiguo, ejecutar `scripts\subir_a_github.ps1` y comprobar
   en el registro `scripts\subir_a_github.log` que pone «Push a repo3 OK».
2. **Apartar, no borrar:** renombrar la carpeta antigua a `Bibliotime_antigua_AAAA-MM-DD`. Se borra
   solo cuando la nueva funcione (punto 6).
3. **Descargar de cero:**
   ```powershell
   git clone -o repo3 https://github.com/mmedranomun-hub/bibliotime3.0 C:\Users\pc\Bibliotime
   ```
4. **Recuperar lo local:** copiar `.vercel\` de la carpeta antigua a la nueva y mover a
   `C:\Users\pc\Bibliotime - Documentacion\` cualquier archivo de la antigua que no esté en GitHub
   (`git status --ignored` en la antigua los enseña), sobre todo la clave de firma.
5. **Tareas programadas de Windows** (en un ordenador nuevo hay que crearlas otra vez):
   - «Bibliotime · mejora automática»: Claude Code cada 3 horas, de 9 a 23 h, sigue `BACKLOG.md`.
   - Descargar de GitHub: `scripts\descargar_de_github.ps1` cada hora.
   - Subir a GitHub: `scripts\subir_a_github.ps1` al cerrar la sesión de Claude Code (hook `SessionEnd`).
   - Retomar la sesión al conectar la wifi: `scripts\retomar_sesion_wifi.ps1 -Instalar` (una vez).
6. **Comprobar:** `scripts\servir_local.ps1` y abrir http://localhost:8080; `git log -1` igual que en
   GitHub. Si todo va bien, borrar la carpeta `Bibliotime_antigua_…`.

## 4. Programas necesarios en un ordenador nuevo
Git, Node.js (solo para `importar_bibliotecas_osm.js`), Claude (escritorio o Claude Code) y, si se
publica desde el ordenador, la CLI de Vercel (`npm i -g vercel`). Lo mejor es conectar Vercel con
GitHub para que cada cambio en `main` se publique solo.
