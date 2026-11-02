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
  },
  // Universidad de Alcalá: tabla «Curso Académico 2026-2027» de su página de horarios (sin año en cada fila;
  // el curso va del 1 oct 2026 al 31 ago 2027, así que dic = 2026 y ene = 2027).
  {
    ciudad: "Alcalá de Henares", provincia: "Madrid",
    espacio: "CRAI-Biblioteca · Universidad de Alcalá (campus histórico)",
    bib: null,
    desde: "2026-11-03", hasta: "2027-01-24",
    horario: "abierta 24 horas todos los días (laborables, a partir de las 20:45 solo la sala de lectura); cerrada 24-25 dic y 31 dic-1 ene",
    nota: "La UAH avisa de que puede restringir el acceso a las salas a quien no sea de la universidad, sobre todo en exámenes.",
    f: "https://biblioteca.uah.es/conoce-la-biblioteca/la-biblioteca/horarios/", fv: "2026-10-27",
    semana: {"L":[["00:00","24:00"]],"M":[["00:00","24:00"]],"X":[["00:00","24:00"]],"J":[["00:00","24:00"]],
             "V":[["00:00","24:00"]],"S":[["00:00","24:00"]],"D":[["00:00","24:00"]]},
    cerrado: [["2026-12-24","2026-12-25"],["2026-12-31","2027-01-01"]]
  },
  {
    ciudad: "Alcalá de Henares", provincia: "Madrid",
    espacio: "Biblioteca de Medicina y Ciencias de la Salud · Universidad de Alcalá (campus científico-tecnológico)",
    bib: "Biblioteca de Medicina, UAH",
    desde: "2026-10-19", hasta: "2027-01-24",
    horario: "laborables de 8:30 a 23:00 (desde las 20:45 solo sala de lectura); fines de semana y festivos, de 8:30 a 22:00 solo sala de lectura; cerrada 24-25 dic, 31 dic-1 ene y 6 ene",
    nota: "La UAH avisa de que puede restringir el acceso a las salas a quien no sea de la universidad, sobre todo en exámenes.",
    f: "https://biblioteca.uah.es/conoce-la-biblioteca/la-biblioteca/horarios/", fv: "2026-10-27",
    cerrado: [["2026-12-24","2026-12-25"],["2026-12-31","2027-01-01"],["2027-01-06","2027-01-06"]]
  },
  {
    ciudad: "Guadalajara", provincia: "Guadalajara",
    espacio: "Biblioteca de Educación · Universidad de Alcalá (campus de Guadalajara)",
    bib: "Biblioteca de Educación _ Universidad de Alcalá (UAH)",
    desde: "2026-10-19", hasta: "2027-01-24",
    horario: "laborables de 8:30 a 23:00 (desde las 20:45 solo sala de lectura); fines de semana y festivos, de 8:30 a 22:00 solo sala de lectura; cerrada 24-25 dic, 31 dic-1 ene y 6 ene",
    nota: "La UAH avisa de que puede restringir el acceso a las salas a quien no sea de la universidad, sobre todo en exámenes.",
    f: "https://biblioteca.uah.es/conoce-la-biblioteca/la-biblioteca/horarios/", fv: "2026-10-27",
    cerrado: [["2026-12-24","2026-12-25"],["2026-12-31","2027-01-01"],["2027-01-06","2027-01-06"]]
  },
  // Ayuntamiento de València: cinco bibliotecas municipales abiertas 24 h en exámenes, «del 10 de diciembre de 2026
  // al 10 de enero de 2027» (nota del 11-02-2026, contrato de vigilancia; bibliotecas elegidas para 2026-2027).
  // La nota no menciona festivos (24-25 y 31 dic, 1 y 6 ene): por eso no lleva `semana`.
  {
    ciudad: "Valencia", provincia: "Valencia",
    espacio: "Biblioteca municipal Carola Reig (Benimaclet) · Ayuntamiento de València",
    bib: "Biblioteca Municipal Carola Reig Salvà",
    desde: "2026-12-10", hasta: "2027-01-10",
    horario: "abierta las 24 horas, también los fines de semana",
    nota: "El Ayuntamiento no detalla qué pasa los festivos (24, 25 y 31 dic, 1 y 6 ene).",
    f: "https://www.valencia.es/cas/actualidad/-/content/el-ayuntamiento-de-val%C3%A8ncia-abrir%C3%A1-cinco-bibliotecas-24-horas-durante-las-%C3%A9pocas-de-ex%C3%A1menes", fv: "2026-11-01"
  },
  {
    ciudad: "Valencia", provincia: "Valencia",
    espacio: "Biblioteca municipal Azorín (Patraix) · Ayuntamiento de València",
    bib: "Biblioteca Municipal Azorín",
    desde: "2026-12-10", hasta: "2027-01-10",
    horario: "abierta las 24 horas, también los fines de semana",
    nota: "El Ayuntamiento no detalla qué pasa los festivos (24, 25 y 31 dic, 1 y 6 ene).",
    f: "https://www.valencia.es/cas/actualidad/-/content/el-ayuntamiento-de-val%C3%A8ncia-abrir%C3%A1-cinco-bibliotecas-24-horas-durante-las-%C3%A9pocas-de-ex%C3%A1menes", fv: "2026-11-01"
  },
  {
    ciudad: "Valencia", provincia: "Valencia",
    espacio: "Biblioteca municipal Eduard Escalante (Arrancapins) · Ayuntamiento de València",
    bib: "Biblioteca d'Arrancapins - Eduard Escalante",
    desde: "2026-12-10", hasta: "2027-01-10",
    horario: "abierta las 24 horas, también los fines de semana",
    nota: "El Ayuntamiento no detalla qué pasa los festivos (24, 25 y 31 dic, 1 y 6 ene).",
    f: "https://www.valencia.es/cas/actualidad/-/content/el-ayuntamiento-de-val%C3%A8ncia-abrir%C3%A1-cinco-bibliotecas-24-horas-durante-las-%C3%A9pocas-de-ex%C3%A1menes", fv: "2026-11-01"
  },
  {
    ciudad: "Valencia", provincia: "Valencia",
    espacio: "Biblioteca municipal Joan de Timoneda (Beniferri) · Ayuntamiento de València",
    bib: "Biblioteca Municipal Joan De Timoneda",
    desde: "2026-12-10", hasta: "2027-01-10",
    horario: "abierta las 24 horas, también los fines de semana",
    nota: "El Ayuntamiento no detalla qué pasa los festivos (24, 25 y 31 dic, 1 y 6 ene).",
    f: "https://www.valencia.es/cas/actualidad/-/content/el-ayuntamiento-de-val%C3%A8ncia-abrir%C3%A1-cinco-bibliotecas-24-horas-durante-las-%C3%A9pocas-de-ex%C3%A1menes", fv: "2026-11-01"
  },
  {
    ciudad: "Valencia", provincia: "Valencia",
    espacio: "Biblioteca municipal Clara Santiró i Font (Sant Marcel·lí - Camí Real) · Ayuntamiento de València",
    bib: "Biblioteca Clara Santiró I Font",
    desde: "2026-12-10", hasta: "2027-01-10",
    horario: "abierta las 24 horas, también los fines de semana",
    nota: "El Ayuntamiento no detalla qué pasa los festivos (24, 25 y 31 dic, 1 y 6 ene).",
    f: "https://www.valencia.es/cas/actualidad/-/content/el-ayuntamiento-de-val%C3%A8ncia-abrir%C3%A1-cinco-bibliotecas-24-horas-durante-las-%C3%A9pocas-de-ex%C3%A1menes", fv: "2026-11-01"
  },
  // UAM: noticia del 19-10-2026 «La Sala Búho también abre los fines de semana». No da fecha de inicio (ya está
  // en marcha al publicarse), así que `desde` es el día de la comprobación; tampoco da el fin del horario hasta la 1:00.
  {
    ciudad: "Madrid", provincia: "Madrid",
    espacio: "Sala Búho · Biblioteca de Ciencias, Universidad Autónoma de Madrid (Cantoblanco)",
    bib: null,
    desde: "2026-11-01", hasta: "2027-01-08",
    horario: "todos los días, también sábados, domingos y festivos, de 9:00 a 20:30; desde el 8 ene amplía hasta la 1:00 (la UAM aún no dice hasta cuándo)",
    nota: "Fines de semana y festivos se entra desde el exterior por la rampa. Entrada libre, con prioridad para quien tenga carné UAM en exámenes y horas punta.",
    f: "https://www.uam.es/uam/vida-uam/bibliotecas/noticias/biblioteca-ciencias/sala-buho-otono-examenes", fv: "2026-11-01"
  },
  // Esade: página «Horaris» de la biblioteca, apartado «Biblioteques Sant Cugat i Barcelona» (el mismo horario para
  // las dos). Da el «període d'exàmens del primer trimestre del curs 2026-2027: del 16 de novembre al 6 de febrer»,
  // pero el horario ampliado (lunes a viernes hasta las 0:00) solo «del 16 de novembre al 22 de desembre»: ese es el
  // periodo de la entrada. Ninguna de las dos está en el mapa (`bib: null`); sin `semana` por eso.
  {
    ciudad: "Barcelona", provincia: "Barcelona",
    espacio: "Biblioteca d'Esade · campus de Barcelona (Universitat Ramon Llull)",
    bib: null,
    desde: "2026-11-16", hasta: "2026-12-22",
    horario: "lunes a viernes de 8:00 a 0:00; sábados, domingos y festivos 6 y 8 dic, de 9:00 a 21:00",
    nota: "En exámenes (16 nov-6 feb) el acceso queda restringido a estudiantes de Esade y de la Universitat Ramon Llull.",
    f: "https://esade.edu/ca/biblioteca/coneix-nos/horaris", fv: "2026-11-02"
  },
  {
    ciudad: "Sant Cugat del Vallès", provincia: "Barcelona",
    espacio: "Biblioteca d'Esade · campus de Sant Cugat (Universitat Ramon Llull)",
    bib: null,
    desde: "2026-11-16", hasta: "2026-12-22",
    horario: "lunes a viernes de 8:00 a 0:00; sábados, domingos y festivos 6 y 8 dic, de 9:00 a 21:00",
    nota: "En exámenes (16 nov-6 feb) el acceso queda restringido a estudiantes de Esade y de la Universitat Ramon Llull.",
    f: "https://esade.edu/ca/biblioteca/coneix-nos/horaris", fv: "2026-11-02"
  }
];
