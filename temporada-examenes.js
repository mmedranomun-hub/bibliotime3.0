// Temporada de exámenes: aperturas extraordinarias y horarios ampliados del curso 2026-27.
// SOLO con fuente oficial (web de la universidad, ayuntamiento o biblioteca) y fechas de ESTE curso:
// nunca se reutilizan fechas de cursos pasados. Si una ciudad no lo ha publicado todavía, no entra aquí
// (la lista de webs a revisar y cuándo suelen publicarlo está en BACKLOG.md, tarea «Exámenes ·»).
// La app funciona igual si este archivo no carga (window.TEMPORADA_EXAMENES vacío).
//
// Campos de cada entrada:
//   ciudad, provincia  ciudad del espacio (para la métrica «ciudades con calendario de exámenes»)
//   espacio            nombre del espacio tal como lo llama la fuente
//   bib                nombre EXACTO de la biblioteca en la app (BIBLIOTECAS[i].nombre); null si no está en el mapa
//   desde, hasta       periodo AAAA-MM-DD (ambos incluidos)
//   horario            texto breve del horario extraordinario, sacado de la fuente
//   nota               (opcional) matiz de la fuente (acceso, servicios…)
//   f, fv              url de la fuente oficial y fecha (AAAA-MM-DD) en que se comprobó
//   semana             (opcional) horario completo del periodo en el formato de bibliotecas-espana.js
//                      ({"L":[["08:00","21:00"]],…}); solo si la fuente da TODOS los días. Con él, «abierta
//                      ahora» usa este horario dentro del periodo (y solo en bibliotecas que ya tienen horario).
//   dias               (opcional) excepciones por fecha: {"AAAA-MM-DD":[["08:00","20:00"]]}
//   cerrado            (opcional) intervalos de cierre: [["AAAA-MM-DD","AAAA-MM-DD"]]
window.TEMPORADA_EXAMENES = [
  {
    ciudad: "Pamplona", provincia: "Navarra",
    espacio: "Biblioteca Central · Universidad de Navarra",
    bib: "Biblioteca Universidad de Navarra · Central",
    desde: "2026-12-01", hasta: "2026-12-31",
    horario: "lunes a sábado de 8:00 a 21:00 y domingos de 8:00 a 20:00 (3 y 8 dic, de 8:00 a 20:00); cerrada del 23 al 31 dic",
    f: "https://www.unav.edu/web/biblioteca/horarios/biblioteca-central", fv: "2026-10-27",
    semana: {"L":[["08:00","21:00"]],"M":[["08:00","21:00"]],"X":[["08:00","21:00"]],"J":[["08:00","21:00"]],
             "V":[["08:00","21:00"]],"S":[["08:00","21:00"]],"D":[["08:00","20:00"]]},
    dias: {"2026-12-03":[["08:00","20:00"]],"2026-12-08":[["08:00","20:00"]]},
    cerrado: [["2026-12-23","2026-12-31"]]
  },
  {
    ciudad: "Madrid", provincia: "Madrid",
    espacio: "Biblioteca Campus Sur · UPM",
    bib: "Biblioteca Universitaria Campus Sur - UPM",
    desde: "2026-12-05", hasta: "2027-01-24",
    horario: "abre también, de 9:00 a 21:30, el 5-8, 12-13, 19-20, 23 y 26-30 dic y el 2-5, 9-10, 16-17 y 23-24 ene; cerrada 24, 25 y 31 dic y 1 y 6 ene",
    f: "https://www.upm.es/UPM/Biblioteca/ServiciosUsuario/HorarioAmpliado/ArticulosRelacionados", fv: "2026-10-27"
  },
  {
    ciudad: "Madrid", provincia: "Madrid",
    espacio: "Biblioteca de la ETSI Agronómica, Alimentaria y de Biosistemas · UPM",
    bib: "Biblioteca de la ETSI Agronómica, Alimentaria y de Biosistemas UPM",
    desde: "2026-12-05", hasta: "2027-01-24",
    horario: "abre también, de 9:00 a 21:30, el 5-8, 12-13, 19-20, 23 y 26-30 dic y el 2-5, 9-10, 16-17 y 23-24 ene (9, 10, 16 y 17 ene, hasta la 1:00); cerrada 24, 25 y 31 dic y 1 y 6 ene",
    f: "https://www.upm.es/UPM/Biblioteca/ServiciosUsuario/HorarioAmpliado/ArticulosRelacionados", fv: "2026-10-27"
  },
  {
    ciudad: "Sevilla", provincia: "Sevilla",
    espacio: "Biblioteca-CRAI · Universidad Pablo de Olavide (campus de Dos Hermanas)",
    bib: "Biblioteca de la Universidad Pablo de Olavide",
    desde: "2026-11-16", hasta: "2027-01-22",
    horario: "todos los días, festivos incluidos, de 8:30 a 21:00 (23 dic, hasta las 15:00); cerrada 24-27 dic y 31 dic-1 ene; el 5 y 6 ene no figuran en el calendario",
    nota: "Fines de semana, festivos, 28-30 dic y 2-4 ene: sin personal de biblioteca, solo autopréstamo.",
    f: "https://www.upo.es/biblioteca/sobre_bib/horario/Horario-extraordinario-examenes/index.html", fv: "2026-10-27"
  }
];
