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
  },
  // UPM, misma página que Campus Sur y Agronómica («diciembre de 2026» y «enero de 2027», act. 03-09-2026): otras tres
  // bibliotecas con apertura extraordinaria. No están en el mapa (`bib: null`). Solo sala de lectura, con reserva
  // previa en #AccedeUPM y solo para estudiantes UPM; todas cerradas 24, 25 y 31 dic y 1, 6 y 28 ene.
  {
    ciudad: "Madrid", provincia: "Madrid",
    espacio: "Biblioteca de la ETSI Industriales · UPM (Paseo de la Castellana)",
    bib: null,
    desde: "2026-12-05", hasta: "2027-01-24",
    horario: "abre también, de 9:00 a 21:30, el 5-8, 12-13, 19-20, 23 y 26-30 dic y el 2-5, 9-10, 16-17 y 23-24 ene; cerrada 24, 25 y 31 dic y 1 y 6 ene",
    nota: "Solo sala de lectura, con reserva previa de puesto en #AccedeUPM; solo estudiantes de la UPM.",
    f: "https://www.upm.es/UPM/Biblioteca/ServiciosUsuario/HorarioAmpliado/ArticulosRelacionados", fv: "2026-11-08"
  },
  {
    ciudad: "Madrid", provincia: "Madrid",
    espacio: "Biblioteca de la ETSI Aeronáutica y del Espacio · UPM (Ciudad Universitaria)",
    bib: null,
    desde: "2026-12-05", hasta: "2027-01-24",
    horario: "abre también, de 9:00 a 21:30, el 5-8, 12-13 y 19-20 dic y el 9-10, 16-17 y 23-24 ene",
    nota: "Solo sala de lectura, con reserva previa de puesto en #AccedeUPM; solo estudiantes de la UPM.",
    f: "https://www.upm.es/UPM/Biblioteca/ServiciosUsuario/HorarioAmpliado/ArticulosRelacionados", fv: "2026-11-08"
  },
  {
    ciudad: "Madrid", provincia: "Madrid",
    espacio: "Biblioteca de la ETSI de Telecomunicación · UPM (Ciudad Universitaria)",
    bib: null,
    desde: "2026-12-05", hasta: "2027-01-31",
    horario: "abre también, de 9:00 a 21:30, el 5-8, 12-13 y 19-20 dic y el 9-10, 16-17, 23-24 y 30-31 ene (fines de semana, todos los servicios de 9:00 a 15:00 y solo sala de lectura de 15:00 a 21:30)",
    nota: "Reserva previa de puesto en #AccedeUPM; solo estudiantes de la UPM.",
    f: "https://www.upm.es/UPM/Biblioteca/ServiciosUsuario/HorarioAmpliado/ArticulosRelacionados", fv: "2026-11-08"
  },
  // UIB: página «Horaris» de la biblioteca, ya con el curso 2026-27 («23, 28, 29 i 30 de desembre de 2026, i els dies
  // 4 i 5 de gener de 2027»; Pasqua 30 mar-2 abr). Los fines de semana de exámenes de enero («9-10, 16-17, 23-24 i
  // 30-31 de gener») no llevan año, pero son sábado-domingo en 2027 (en 2026 caían en viernes-sábado). Edificio
  // Ramon Llull, campus de la carretera de Valldemossa (Palma). En el mapa solo hay «Biblioteca de la UIB» con un punto
  // en el centro de Palma, no en el campus: `bib: null`.
  {
    ciudad: "Palma", provincia: "Baleares",
    espacio: "Biblioteca de l'edifici Ramon Llull · Universitat de les Illes Balears (campus de Palma)",
    bib: null,
    desde: "2027-01-09", hasta: "2027-01-31",
    horario: "abre también los fines de semana 9-10, 16-17, 23-24 y 30-31 ene, de 8:30 a 20:30",
    nota: "Esos fines de semana hay préstamo de portátiles, pero no de libros ni devoluciones. En Navidad (23 y 28-30 dic, 4-5 ene) abre solo de 8:30 a 14:30.",
    f: "https://biblioteca.uib.cat/ca/espais-i-horaris/horaris", fv: "2026-11-08"
  },
  // UNAV: entrada del blog de la Biblioteca del 09-11-2026, «La Biblioteca en exámenes»: «Del 14 de noviembre al 20 de
  // diciembre» (sin año en la frase; publicada en 2026 y los días citados caen en domingo/festivo en 2026), «Las
  // bibliotecas de Ciencias y Central y la Sala de estudio Ismael Sánchez Bella permanecerán abiertas: de 8 – 21 h, de
  // lunes a sábado; de 8 – 20 h, los siguientes festivos y domingos: 15, 23, 29 y 30 de noviembre; 3, 6, 8, 13 y 20 de
  // diciembre». No dice nada del domingo 22 nov: por eso no lleva `semana`. La Central ya tiene entrada desde el 1 dic
  // (página de horarios); aquí solo el tramo de noviembre, para no repetirla. La Sala Ismael Sánchez Bella no está en el mapa.
  {
    ciudad: "Pamplona", provincia: "Navarra",
    espacio: "Biblioteca de Ciencias · Universidad de Navarra",
    bib: "Biblioteca Universidad de Navarra · Ciencias",
    desde: "2026-11-14", hasta: "2026-12-20",
    horario: "lunes a sábado de 8:00 a 21:00; domingos y festivos 15, 23, 29 y 30 nov y 3, 6, 8, 13 y 20 dic, de 8:00 a 20:00",
    nota: "Hay que reservar antes el puesto de estudio. Sin reserva: la Sala azul de la Biblioteca de Ciencias.",
    f: "https://noticias-biblioteca.unav.edu/2026/11/09/la-biblioteca-en-examenes-3/", fv: "2026-11-14"
  },
  {
    ciudad: "Pamplona", provincia: "Navarra",
    espacio: "Biblioteca Central · Universidad de Navarra (campaña de exámenes, noviembre)",
    bib: "Biblioteca Universidad de Navarra · Central",
    desde: "2026-11-14", hasta: "2026-11-30",
    horario: "lunes a sábado de 8:00 a 21:00; domingos y festivos 15, 23, 29 y 30 nov, de 8:00 a 20:00",
    nota: "Hay que reservar antes el puesto de estudio. Sin reserva: la sala polivalente de la planta baja.",
    f: "https://noticias-biblioteca.unav.edu/2026/11/09/la-biblioteca-en-examenes-3/", fv: "2026-11-14"
  },
  {
    ciudad: "Pamplona", provincia: "Navarra",
    espacio: "Sala de estudio Ismael Sánchez Bella · Universidad de Navarra",
    bib: null,
    desde: "2026-11-14", hasta: "2026-12-20",
    horario: "lunes a sábado de 8:00 a 21:00; domingos y festivos 15, 23, 29 y 30 nov y 3, 6, 8, 13 y 20 dic, de 8:00 a 20:00",
    nota: "Uso libre, sin reserva de puesto.",
    f: "https://noticias-biblioteca.unav.edu/2026/11/09/la-biblioteca-en-examenes-3/", fv: "2026-11-14"
  }
];
