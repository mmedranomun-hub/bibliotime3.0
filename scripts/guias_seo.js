// Guías de bibliomapa.es/estudiar/: una página por cada problema que resuelve la app («dónde estudiar hoy»,
// «temporizador Pomodoro», «concentrarse sin mirar el móvil»…). Pensadas para buscadores y para asistentes de IA (GEO):
// la primera frase responde a la pregunta, luego pasos concretos (HowTo) y preguntas frecuentes (FAQPage).
// Reglas: solo funciones que la app tiene de verdad y ninguna cifra inventada (las cifras de bibliotecas las pone
// generar_paginas_seo.js desde los datos: {N} total, {V} con horario verificado, {P} provincias).
// Las usa scripts/generar_paginas_seo.js, que las escribe en /estudiar/<slug>/ y las añade al sitemap y a llms.txt.

module.exports = [
  {
    slug: "donde-estudiar-hoy",
    corto: "Dónde estudiar hoy",
    titulo: "¿Dónde estudiar hoy? Bibliotecas abiertas cerca de ti | Bibliomapa",
    descripcion: "Encuentra en segundos una biblioteca o sala de estudio abierta ahora cerca de ti: {N} bibliotecas de toda España en un mapa, con horarios verificados.",
    h1: "¿Dónde estudiar hoy? Bibliotecas y salas de estudio abiertas cerca de ti",
    respuesta: "Abre bibliomapa.es, permite tu ubicación y la tarjeta «Te recomiendo ahora» te dice qué biblioteca abierta tienes más cerca y a qué hora cierra. El mapa reúne {N} bibliotecas de {P} provincias de España; {V} tienen el horario comprobado en su web oficial, con fecha y fuente.",
    secciones: [
      ["Qué mirar antes de salir de casa", "Que esté abierta ahora y hasta cuándo, que no esté llena y que admita a cualquiera (algunas bibliotecas universitarias piden carné). En la ficha de cada biblioteca tienes el horario, la dirección, el teléfono, la web oficial y, si otros usuarios lo han indicado, cuánta gente hay."],
      ["Si es domingo, tarde o época de exámenes", "Hay páginas que responden justo a eso: bibliotecas abiertas el domingo, hasta tarde o en horario ampliado de exámenes, por provincia. Solo aparecen las que tienen el horario verificado en su web oficial."],
    ],
    pasos: [
      ["Abre el mapa", "Entra en bibliomapa.es desde el móvil o el ordenador. No hace falta cuenta ni instalar nada."],
      ["Activa tu ubicación", "Pulsa «Usar mi ubicación»: la tarjeta «Te recomiendo ahora» elige la biblioteca abierta más cercana."],
      ["Filtra si lo necesitas", "En la lista puedes quedarte con las abiertas ahora, las que abren pronto, las que cierran tarde, las de acceso libre o las universitarias."],
      ["Pulsa «Estudiar aquí»", "Al llegar, empieza el cronómetro: cada sesión planta un árbol en tu bosque."],
    ],
    faq: [
      ["¿Cómo sé qué biblioteca está abierta ahora cerca de mí?", "En bibliomapa.es las bibliotecas abiertas aparecen destacadas en el mapa y la tarjeta «Te recomiendo ahora» propone la más cercana que está abierta, con su hora de cierre. Si la biblioteca tiene el horario verificado, se indica la fuente y la fecha de comprobación."],
      ["¿Es gratis?", "Sí. Bibliomapa es gratuito y se puede usar sin crear cuenta. La cuenta (también gratis) solo hace falta para las funciones con amigos."],
      ["¿Funciona en toda España?", "Sí: incluye {N} bibliotecas públicas, universitarias y salas de estudio de {P} provincias, también Canarias, Baleares y Ceuta."],
    ],
    enlaces: [["/bibliotecas/abiertas-hoy/", "Bibliotecas abiertas hoy"], ["/bibliotecas/abiertas-domingo/", "Abiertas el domingo"], ["/bibliotecas/abiertas-hasta-tarde/", "Abiertas hasta tarde"], ["/bibliotecas/salas-de-estudio/", "Salas de estudio por ciudad"]],
    cta: ["/#accion=ahora", "📍 Ver la biblioteca abierta más cercana"],
  },
  {
    slug: "temporizador-pomodoro",
    corto: "Temporizador Pomodoro",
    titulo: "Temporizador Pomodoro online gratis para estudiar | Bibliomapa",
    descripcion: "Pomodoro gratis en el navegador: 25 minutos de foco y 5 de descanso, cada pomodoro se guarda como sesión de estudio y planta un árbol. Sin registro.",
    h1: "Temporizador Pomodoro online y gratis para estudiar",
    respuesta: "Bibliomapa tiene un temporizador Pomodoro gratuito que funciona en el navegador y sin registro: 25 minutos de concentración y 5 de descanso, y cada pomodoro completado se guarda como sesión de estudio. Lo encuentras en la pestaña «Estudio», junto al cronómetro.",
    secciones: [
      ["Qué es la técnica Pomodoro", "Consiste en estudiar en bloques cortos y cerrados (normalmente 25 minutos) separados por descansos breves. El bloque tiene un final claro, así que cuesta menos empezar y es más fácil no interrumpirse."],
      ["Por qué usarlo en Bibliomapa", "Además del temporizador, cuenta tus minutos del día y de la semana, lleva tu racha de días seguidos y convierte cada sesión en un árbol de tu bosque. Puedes asociar cada sesión a una asignatura para ver a qué dedicas el tiempo."],
    ],
    pasos: [
      ["Abre «Estudio»", "En bibliomapa.es pulsa el botón central «Estudio» de la barra inferior."],
      ["Elige «Pomodoro»", "Cambia de «Cronómetro» a «Pomodoro»: verás la cuenta atrás de 25:00."],
      ["Elige asignatura (opcional)", "Así sabrás después cuánto has dedicado a cada una."],
      ["Pulsa «Empezar» y no salgas", "Cuando acaba el bloque, descansa 5 minutos. Cada pomodoro completado queda guardado."],
    ],
    faq: [
      ["¿Cuánto dura un pomodoro en Bibliomapa?", "25 minutos de foco seguidos de 5 minutos de descanso. Cada pomodoro completado se guarda como una sesión de estudio."],
      ["¿Necesito instalar algo?", "No. Funciona en el navegador del móvil o del ordenador. Si quieres, puedes instalarla como app desde el navegador."],
      ["¿Hay un cronómetro normal además del Pomodoro?", "Sí: el modo «Cronómetro» cuenta el tiempo sin bloques fijos, con una meta diaria de horas."],
    ],
    enlaces: [["/estudiar/concentrarse-al-estudiar/", "Cómo concentrarte sin mirar el móvil"], ["/estudiar/donde-estudiar-hoy/", "Dónde estudiar hoy"]],
    cta: ["/#accion=estudiar", "⏱️ Empezar a estudiar ahora"],
  },
  {
    slug: "concentrarse-al-estudiar",
    corto: "Concentrarse sin el móvil",
    titulo: "Cómo concentrarte al estudiar y no mirar el móvil | Bibliomapa",
    descripcion: "Una forma sencilla de no distraerte: cada sesión de estudio planta un árbol que se marchita si sales de la app. Gratis, en el navegador, como Forest.",
    h1: "Cómo concentrarte al estudiar y dejar de mirar el móvil",
    respuesta: "En Bibliomapa cada sesión de estudio planta un árbol que crece mientras estudias y se marchita si sales de la app más de unos segundos. Así, mirar el móvil tiene un coste visible. Es una idea parecida a la de Forest, pero gratuita, en el navegador y unida a un mapa de bibliotecas.",
    secciones: [
      ["Por qué funciona", "La distracción gana cuando no cuesta nada. Si salir de la app marchita el árbol que llevas cultivando media hora, la tentación tiene un precio y lo ves. Con el tiempo tu bosque muestra cuánto has estudiado de verdad."],
      ["Otras ayudas dentro de la app", "Modo foco a pantalla completa, metas diarias, misiones del día, racha de días seguidos y niveles. Todo premia estudiar; no hay castigos ni presión por perder la racha."],
    ],
    pasos: [
      ["Ve a «Estudio»", "Deja marcada la casilla «Plantar árbol»."],
      ["Empieza la sesión", "Con el cronómetro o con un Pomodoro de 25 minutos."],
      ["No salgas de la app", "Si cambias de app más de unos segundos, el árbol se marchita."],
      ["Termina y mira tu bosque", "El árbol se planta con una altura proporcional a lo que has estudiado."],
    ],
    faq: [
      ["¿Es una alternativa gratis a Forest?", "Bibliomapa usa la misma idea de plantar un árbol mientras estudias, es gratis y funciona en el navegador sin instalar nada. Además te dice qué biblioteca está abierta cerca."],
      ["¿Qué pasa si salgo de la app?", "Si sales más de unos segundos durante una sesión, el árbol se marchita. La sesión de estudio sigue contando."],
      ["¿Puedo usarlo sin cuenta?", "Sí. Tus sesiones y tu bosque se guardan en tu dispositivo. Con una cuenta gratuita no los pierdes al cambiar de móvil."],
    ],
    enlaces: [["/estudiar/temporizador-pomodoro/", "Temporizador Pomodoro"], ["/estudiar/estudiar-con-amigos/", "Estudiar con amigos"]],
    cta: ["/#accion=estudiar", "🌳 Plantar mi primer árbol"],
  },
  {
    slug: "estudiar-con-amigos",
    corto: "Estudiar con amigos",
    titulo: "App para estudiar con amigos: ranking, salas y agenda | Bibliomapa",
    descripcion: "Estudia con tus amigos aunque no estéis juntos: ranking de horas, salas de estudio en grupo, historias y agenda de exámenes compartida. Gratis.",
    h1: "App para estudiar con amigos (aunque no estéis en la misma biblioteca)",
    respuesta: "Con una cuenta gratuita de Bibliomapa puedes añadir amigos con un código y ver un ranking de horas de estudio del día y de la semana, crear salas de estudio en grupo, compartir tu agenda de exámenes y animaros con reacciones. Compartir dónde estudias es opcional y está desactivado por defecto.",
    secciones: [
      ["Qué puedes hacer con amigos", "Ranking de horas (hoy y esta semana), salas para estudiar a la vez, ver los exámenes y entregas que comparten, historias del día, reacciones y kudos a sus sesiones, y ver el bosque de cada uno."],
      ["Privacidad", "Compartir tu actividad está desactivado por defecto. Si lo activas, tus amigos aceptados ven en qué biblioteca estás, nunca tu ubicación exacta, y se apaga solo a las 4 horas o cuando cierra la biblioteca. Hay modo invisible."],
    ],
    pasos: [
      ["Crea una cuenta gratis", "Desde «Perfil» o «Amigos». El resto de la app funciona sin ella."],
      ["Comparte tu código", "En «Amigos» tienes tu código; tus amigos lo añaden y aceptas la solicitud."],
      ["Estudiad", "Las horas de cada uno suben al ranking de hoy y de la semana."],
      ["Comparte tus exámenes", "Al añadir un examen en la agenda, marca «Compartir con mis amigos»."],
    ],
    faq: [
      ["¿Mis amigos ven dónde estoy?", "Solo si lo activas: es opcional y está desactivado por defecto. Ven la biblioteca, nunca tu ubicación exacta, y se apaga sola a las 4 horas."],
      ["¿Hace falta estar en la misma biblioteca?", "No. El ranking, las salas y la agenda compartida funcionan estéis donde estéis."],
      ["¿Cuesta algo?", "No. Bibliomapa y su cuenta son gratuitos."],
    ],
    enlaces: [["/estudiar/organizar-examenes/", "Organizar los exámenes"], ["/estudiar/concentrarse-al-estudiar/", "Concentrarse sin el móvil"]],
    cta: ["/", "👥 Invitar a mis amigos"],
  },
  {
    slug: "organizar-examenes",
    corto: "Organizar los exámenes",
    titulo: "Agenda de exámenes gratis: organiza tus exámenes y entregas | Bibliomapa",
    descripcion: "Apunta exámenes, tareas y entregas en un calendario, mira lo próximo de un vistazo y compártelo con tus amigos. Gratis y sin registro para empezar.",
    h1: "Cómo organizar tus exámenes con una agenda (gratis)",
    respuesta: "En la Agenda de Bibliomapa apuntas cada examen, tarea o entrega en su día y la lista «Próximos» te muestra lo que viene en las próximas semanas con los días que faltan. Puedes compartir tus exámenes con tus amigos y ver los suyos.",
    secciones: [
      ["Planifica hacia atrás", "Apunta primero las fechas fijas (exámenes y entregas). Después reparte el temario en los días que quedan y deja uno o dos días de repaso antes de cada examen. Ver los días que faltan ayuda a no dejarlo todo para el final."],
      ["Mide lo que estudias", "Con el cronómetro o el Pomodoro sabrás cuántas horas llevas cada día y cada semana, y por asignatura. Es la forma más fiable de ajustar el plan."],
    ],
    pasos: [
      ["Abre «Agenda»", "Verás el calendario del mes."],
      ["Pincha un día", "Elige «Examen», «Tarea» u «Otro» y escribe el título."],
      ["Mira «Próximos»", "Lo de las próximas semanas, ordenado y con los días que faltan."],
      ["Compártelo (opcional)", "Con cuenta, tus amigos ven tus exámenes y tú los suyos."],
    ],
    faq: [
      ["¿Se guarda mi agenda si no tengo cuenta?", "Sí, en tu dispositivo. Con una cuenta gratuita se guarda en la nube y no la pierdes al cambiar de móvil."],
      ["¿Puedo ver los exámenes de mis amigos?", "Sí, los que ellos decidan compartir, en «Calendario de tus amigos»."],
      ["¿Me avisa antes de un examen?", "Puedes activar los avisos del navegador en Ajustes para recibir recordatorios de exámenes y cierres próximos."],
    ],
    enlaces: [["/estudiar/epoca-de-examenes/", "Bibliotecas en época de exámenes"], ["/estudiar/estudiar-con-amigos/", "Estudiar con amigos"]],
    cta: ["/", "📅 Abrir mi agenda"],
  },
  {
    slug: "epoca-de-examenes",
    corto: "Época de exámenes",
    titulo: "Bibliotecas 24 horas y horario ampliado en exámenes | Bibliomapa",
    descripcion: "Qué bibliotecas y salas de estudio amplían horario o abren 24 horas en época de exámenes, por ciudad, solo con fuentes oficiales y fechas.",
    h1: "Bibliotecas abiertas 24 horas y con horario ampliado en época de exámenes",
    respuesta: "En época de exámenes muchas universidades y ayuntamientos amplían el horario de sus bibliotecas o abren salas 24 horas. Bibliomapa recoge solo las aperturas extraordinarias publicadas por fuentes oficiales, con sus fechas, y las marca en el mapa con el chip «Temporada de exámenes».",
    secciones: [
      ["Cómo encontrarlas", "En la página de exámenes tienes las aperturas por ciudad. En la app, el chip «Temporada de exámenes» de la lista filtra las que tienen horario extraordinario vigente o en los próximos 30 días, y la ficha muestra la nota con el horario especial."],
      ["Ojo con las fechas", "Los horarios ampliados cambian cada convocatoria. Si una universidad aún no ha publicado su calendario, no lo inventamos: aparece cuando lo publica."],
    ],
    pasos: [
      ["Abre la lista del mapa", "Pulsa «Ver» u «Otras» en la tarjeta de la portada."],
      ["Pulsa «Temporada de exámenes»", "Se quedan las bibliotecas con apertura extraordinaria."],
      ["Mira la ficha", "Verás el horario especial, las fechas y la fuente oficial."],
    ],
    faq: [
      ["¿Qué bibliotecas abren 24 horas en exámenes?", "Depende de la ciudad y de la convocatoria. Bibliomapa las muestra en su página de exámenes solo cuando la universidad o el ayuntamiento lo ha publicado, con fechas y enlace a la fuente."],
      ["¿Están todas las universidades?", "Las que han publicado su calendario de aperturas extraordinarias. Se añaden a medida que lo publican."],
    ],
    enlaces: [["/bibliotecas/examenes/", "Bibliotecas en época de exámenes por ciudad"], ["/bibliotecas/abiertas-hasta-tarde/", "Abiertas hasta tarde"], ["/bibliotecas/universidades/", "Bibliotecas por universidad"]],
    cta: ["/", "📚 Ver el mapa de exámenes"],
  },
  {
    slug: "biblioteca-llena",
    corto: "¿Estará llena?",
    titulo: "¿Estará llena la biblioteca? Cómo saber cuánta gente hay | Bibliomapa",
    descripcion: "Antes de ir, mira cuánta gente hay en la biblioteca según lo que indican otros estudiantes: libre, media o llena. Gratis en Bibliomapa.",
    h1: "¿Estará llena la biblioteca? Cómo saber cuánta gente hay antes de ir",
    respuesta: "En Bibliomapa los estudiantes que están en una biblioteca pueden indicar cuánta gente hay (libre, media o llena) y esa información aparece en la ficha y en el color de la chincheta, con la hora del aviso. Así puedes elegir otra cercana antes de hacer el viaje en balde.",
    secciones: [
      ["De dónde sale el dato", "De los propios usuarios: cuando estás en una biblioteca, puedes avisar de cuánta gente hay. Los avisos caducan a la hora, para que no veas información vieja. Si no hay avisos recientes, la ficha lo dice."],
      ["Si está llena", "Mira las bibliotecas cercanas abiertas en la lista o en la página de tu ciudad, y las que tienen más horas de apertura."],
    ],
    pasos: [
      ["Abre la ficha de la biblioteca", "Toca su chincheta en el mapa."],
      ["Mira la afluencia", "Verás el último aviso o «Sin datos recientes de afluencia»."],
      ["Ayuda a los demás", "Cuando estés allí, indica tú cuánta gente hay."],
    ],
    faq: [
      ["¿La afluencia es en tiempo real?", "Es la que indican los usuarios en ese momento, con la hora del aviso. Sin avisos recientes no se muestra nada para no confundir."],
      ["¿Necesito cuenta para avisar?", "Puedes ver la afluencia sin cuenta. Los avisos se comparten con todos cuando hay conexión con la nube."],
    ],
    enlaces: [["/estudiar/donde-estudiar-hoy/", "Dónde estudiar hoy"], ["/bibliotecas/salas-de-estudio/", "Salas de estudio por ciudad"]],
    cta: ["/#accion=ahora", "📍 Ver bibliotecas abiertas cerca"],
  },
  {
    slug: "estudiar-oposiciones",
    corto: "Oposiciones y MIR",
    titulo: "Dónde y cómo estudiar oposiciones o el MIR cada día | Bibliomapa",
    descripcion: "Rutina para opositores y MIR: biblioteca abierta cada día, horas medidas, metas diarias y racha. Gratis, con más de {N} bibliotecas de España.",
    h1: "Dónde y cómo estudiar oposiciones o el MIR todos los días",
    respuesta: "Para preparar oposiciones o el MIR lo que más ayuda es un sitio fijo y una rutina medible. Bibliomapa te dice qué biblioteca está abierta cada día (también fines de semana y hasta tarde), mide tus horas con cronómetro o Pomodoro, fija una meta diaria y lleva tu racha de días seguidos.",
    secciones: [
      ["Un sitio fijo, también en fin de semana", "Las páginas de bibliotecas abiertas el domingo, el sábado por la tarde o hasta tarde, por provincia, te ayudan a no perder días. Solo listan horarios verificados en la web oficial."],
      ["Medir para mejorar", "Apuntar las horas reales (no las que crees) es la base de cualquier planificación. En «Estudio» ves las horas de hoy, de la semana y tus récords; en «Perfil», tu evolución."],
    ],
    pasos: [
      ["Elige tu biblioteca", "Márcala como favorita para tenerla siempre a mano."],
      ["Fija una meta diaria", "En «Estudio», «Meta de estudio»."],
      ["Mide cada sesión", "Cronómetro o Pomodoro, con la asignatura o el tema."],
      ["Revisa la semana", "Horas por día, racha y récords en tu perfil."],
    ],
    faq: [
      ["¿Qué bibliotecas abren los domingos?", "Depende de la ciudad. Bibliomapa tiene páginas de bibliotecas abiertas el domingo por provincia, solo con horarios verificados en su web oficial."],
      ["¿Puedo ver cuántas horas estudio?", "Sí: horas de hoy, de la semana, totales, récords y racha de días seguidos, con metas diarias."],
    ],
    enlaces: [["/bibliotecas/abiertas-domingo/", "Bibliotecas abiertas el domingo"], ["/bibliotecas/abiertas-fin-de-semana/", "Abiertas el fin de semana"], ["/bibliotecas/abiertas-hasta-tarde/", "Abiertas hasta tarde"]],
    cta: ["/#accion=estudiar", "⏱️ Empezar mi rutina"],
  },
];
