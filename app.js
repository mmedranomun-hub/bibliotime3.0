/* Bibliotime · lógica de la app (antes estaba dentro de index.html).
   En un archivo aparte el navegador lo compila en segundo plano y guarda el código compilado para las
   visitas siguientes. Se carga con un <script> normal al final del <body>, en el mismo punto que antes,
   así que el orden de ejecución no cambia. Estilos y pantallas siguen en index.html. */
/* ===================== DATOS BIBLIOTECAS ===================== */
function h(hh,mm){return hh*60+mm}
const DIAS=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
function esVerano(d){const m=d.getMonth(),dia=d.getDate();
  if(m>5&&m<8)return true; if(m===5&&dia>=15)return true; if(m===8&&dia<=14)return true; return false;}
const SIN_HORARIO=[[],[],[],[],[],[],[]];
// Verano propio de la biblioteca (MM-DD a MM-DD) o, si no tiene, el de la red de Navarra.
function esVeranoDe(b,d){
  if(!b.veranoDesde||!b.veranoHasta)return esVerano(d);
  var k=String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  return b.veranoDesde<=b.veranoHasta?(k>=b.veranoDesde&&k<=b.veranoHasta):(k>=b.veranoDesde||k<=b.veranoHasta);
}
// Horario de la temporada (invierno/verano) que rige en "fecha" (por defecto, hoy).
function horarioVigente(b,fecha){if(b.sinHorario)return SIN_HORARIO;const v=esVeranoDe(b,fecha||new Date());
  if(v&&b.horasVerano)return b.horasVerano; if(!v&&b.horasInvierno)return b.horasInvierno;
  return b.horas||b.horasInvierno||b.horasVerano;}
const HM=[[h(8,30),h(14,30)]], HT=[[h(14,0),h(20,0)]];
function semana(L,M,X,J,V,S,D){return [D,L,M,X,J,V,S]}
const barrioInv=semana(HT,HT,HT,HT,HT,[],[]), barrioVer=semana(HM,HM,HM,HM,HM,[],[]);

const BIBLIOTECAS=[
  {nombre:"Biblioteca de Navarra",lat:42.8092292,lon:-1.6755605,dir:"P.º Antonio Pérez Goyena, 3, 31008",tel:"+34 848 42 77 97",web:"https://www.bibliotecaspublicas.es/navarra/",rating:4.3,reviews:343,horas:semana([[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(13,30)]],[])},
  {nombre:"Biblioteca Pública San Francisco",lat:42.8171168,lon:-1.6458386,dir:"C/ de San Francisco, s/n, 31001",tel:"+34 948 21 05 24",web:"https://www.bibliotecaspublicas.es/pamplona-sanfrancisco/",rating:4.1,reviews:132,horasInvierno:semana([[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[],[]),horasVerano:barrioVer},
  {nombre:"Biblioteca Pública Yamaguchi",lat:42.810113,lon:-1.6626248,dir:"Pl. Yamaguchi, 12, 31008",tel:"+34 948 26 40 28",web:"https://www.bibliotecaspublicas.es/yamaguchi/",rating:4.8,reviews:28,horasInvierno:barrioInv,horasVerano:barrioVer},
  {nombre:"Biblioteca Civican",lat:42.8131409,lon:-1.6551245,dir:"Av. de Pío XII, 2, 31008",tel:"+34 948 22 24 44",web:"https://civican.fundacioncajanavarra.es/",rating:4.0,reviews:119,horas:semana([[h(9,0),h(14,0)],[h(16,0),h(21,0)]],[[h(9,0),h(14,0)],[h(16,0),h(21,0)]],[[h(9,0),h(14,0)],[h(16,0),h(21,0)]],[[h(9,0),h(14,0)],[h(16,0),h(21,0)]],[[h(9,0),h(14,0)],[h(16,0),h(21,0)]],[],[])},
  {nombre:"Biblioteca Pública de la Milagrosa",lat:42.8058543,lon:-1.642032,dir:"C. Isaac Albéniz, 8, 31005",tel:"+34 948 24 54 60",web:"https://www.bibliotecaspublicas.es/pamplona-milagrosa/",rating:4.6,reviews:43,horasInvierno:barrioInv,horasVerano:barrioVer},
  {nombre:"Biblioteca Pública de Iturrama",lat:42.8055174,lon:-1.6520092,dir:"C. Esquíroz, 24, 31007",tel:"+34 948 19 89 87",web:"https://www.bibliotecaspublicas.es/pamplona-iturrama/",rating:null,reviews:null,horasInvierno:barrioInv,horasVerano:barrioVer},
  {nombre:"Biblioteca Pública de la Txantrea",lat:42.8316773,lon:-1.6322198,dir:"Plaza Arriurdiñeta, 4, 31015",tel:"+34 948 14 98 82",web:"https://www.bibliotecaspublicas.es/pamplona-txantrea/",rating:4.1,reviews:82,horasInvierno:barrioInv,horasVerano:barrioVer},
  {nombre:"Biblioteca Pública de Mendillorri",lat:42.8100837,lon:-1.6177343,dir:"C. Concejo de Sarriguren, 3, 31016",tel:"+34 948 16 28 47",web:"https://www.bibliotecaspublicas.es/pamplona-mendillorri/",rating:3.8,reviews:30,horasInvierno:barrioInv,horasVerano:barrioVer},
  {nombre:"Biblioteca Pública de San Pedro",lat:42.8271505,lon:-1.64476,dir:"Monasterio Viejo, C. Virgen del Río, s/n, 31014",tel:"+34 948 13 66 64",web:"https://www.bibliotecaspublicas.es/pamplona-sanpedro/",rating:4.2,reviews:37,horasInvierno:barrioInv,horasVerano:barrioVer},
  {nombre:"Biblioteca Pública de San Jorge",lat:42.8220621,lon:-1.6683226,dir:"Calle Dr. Gortari, 2, 31012",tel:"+34 948 12 51 08",web:"https://www.bibliotecaspublicas.es/pamplona-sanjorge/",rating:3.7,reviews:35,horasInvierno:barrioInv,horasVerano:barrioVer},
  {nombre:"Biblioteca Pública de Etxabakoitz",lat:42.7996417,lon:-1.676161,dir:"Av. Aróstegui, s/n (planta baja), 31009",tel:"+34 948 27 32 62",web:"https://www.bibliotecaspublicas.es/pamplona-etxabakoitz/",rating:null,reviews:null,horasInvierno:barrioInv,horasVerano:barrioVer},
  {nombre:"Biblioteca Universidad de Navarra · Central",lat:42.8017,lon:-1.6578,dir:"Edificio de Bibliotecas, Campus Universitario, 31009",tel:"+34 948 42 56 26",web:"https://www.unav.edu/web/biblioteca/espacios-equipamiento/biblioteca-central",rating:4.8,reviews:161,horas:semana([[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(10,0),h(14,0)]])},
  {nombre:"Biblioteca Universidad de Navarra · Ciencias",lat:42.8049,lon:-1.6641,dir:"Edificio Biblioteca de Ciencias, C. de Irunlarrea, s/n, 31008",tel:"+34 948 42 56 26",web:"https://www.unav.edu/web/biblioteca/espacios-equipamiento/biblioteca-ciencias",rating:null,reviews:null,horasInvierno:semana([[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(20,0)]]),horasVerano:semana([],[],[],[],[],[],[])},
  {nombre:"Biblioteca Universidad de Navarra · Facultades Eclesiásticas",lat:42.806,lon:-1.657,dir:"Edificio de Facultades Eclesiásticas, Campus Universitario, 31009",tel:"+34 948 42 56 26",web:"https://www.unav.edu/web/facultad-de-teologia/profesores-e-investigacion/biblioteca",rating:null,reviews:null,horas:semana([[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(10,0),h(14,0)]])},
  {nombre:"Biblioteca UPNA · Campus de Arrosadía",lat:42.7995447,lon:-1.6357744,dir:"C. Cataluña, s/n, 31006",tel:"+34 948 16 90 60",web:"https://www.unavarra.es/biblioteca",rating:3.7,reviews:96,horas:semana([[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[[h(8,0),h(21,0)]],[],[])},
  {nombre:"Biblioteca Pública de Ablitas",lat:41.9632692,lon:-1.5995123,dir:"Avda. Tudela, 27, 31523 Ablitas",tel:"948 84 30 30",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Aibar/Oibar",lat:42.5905555,lon:-1.3607667,dir:"c/ Pintor Crispín, s/n, 31460 Aibar/Oibar",tel:"948 87 75 13",web:"https://www.bibliotecaspublicas.es/aibar",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Allo",lat:42.5673713,lon:-2.0211169,dir:"Plz. de los Fueros, 7, 31262 Allo",tel:"948 52 37 02",web:"https://bibliotecadeallo.wordpress.com/",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Altsasu/Alsasua",lat:42.8949665,lon:-2.1685103,dir:"Travesía del Frontón, 5, Centro Cultural Iortia, 31800 Altsasu/Alsasua",tel:"948 56 48 34",web:"https://www.bibliotecaspublicas.es/alsasua",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Andosilla",lat:42.3776047,lon:-1.9434186,dir:"c/ Sierra de Codés, 3, 31261 Andosilla",tel:"948 69 03 32",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Ansoáin/Antsoain",lat:42.8338,lon:-1.6396906,dir:"Plz. Consistorial, 3, 31013 Ansoáin/Antsoain",tel:"948 14 89 83",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Añorbe",lat:42.6585023,lon:-1.7138474,dir:"Plz. de los Fueros, 31154 Añorbe",tel:"948 35 04 60",web:"",rating:null,reviews:null,horasInvierno:semana([[h(16,0),h(19,30)]],[[h(16,0),h(19,30)]],[[h(16,0),h(19,30)]],[[h(16,0),h(19,30)]],[[h(16,0),h(19,30)]],[],[]),horasVerano:semana([[h(11,0),h(14,0)]],[[h(11,0),h(14,0)]],[[h(11,0),h(14,0)]],[[h(11,0),h(14,0)]],[[h(11,0),h(14,0)]],[],[])},
  {nombre:"Biblioteca Pública de Aoiz",lat:42.7825786,lon:-1.3711469,dir:"Plz. José Amichi, s/n, 31430 Aoiz/Agoitz",tel:"948 33 64 53",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública del Valle de Aranguren",lat:42.7752661,lon:-1.5754567,dir:"Plz. Eguzki, s/n, 31192 Aranguren",tel:"948 29 08 81",web:"https://www.bibliotecaspublicas.es/valle-aranguren",rating:null,reviews:null,horasInvierno:semana([[h(9,0),h(13,0)],[h(14,0),h(20,0)]],[[h(9,0),h(13,0)],[h(14,0),h(20,0)]],[[h(9,0),h(13,0)],[h(14,0),h(20,0)]],[[h(9,0),h(13,0)],[h(14,0),h(20,0)]],[[h(9,0),h(13,0)],[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Arbizu",lat:42.9148731,lon:-2.0389985,dir:"c/ Mayor, 7, 2ª planta, 31839 Arbizu",tel:"948 01 77 77",web:"",rating:null,reviews:null,horasInvierno:semana([[h(16,30),h(20,0)]],[[h(16,30),h(20,0)]],[[h(16,30),h(20,0)]],[[h(16,30),h(20,0)]],[[h(16,30),h(20,0)]],[],[]),horasVerano:semana([[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[],[])},
  {nombre:"Biblioteca Pública de Arguedas",lat:42.1758188,lon:-1.5970062,dir:"Plz. del General Clemente, 2, 1º, 31513 Arguedas",tel:"948 84 46 82",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Arróniz",lat:42.5888853,lon:-2.0907566,dir:"Plz. de los Fueros, 1, 31243 Arróniz",tel:"948 53 76 35",web:"",rating:null,reviews:null,horasInvierno:semana([[h(17,0),h(20,0)]],[[h(17,0),h(20,0)]],[[h(17,0),h(20,0)]],[[h(17,0),h(20,0)]],[[h(17,0),h(20,0)]],[],[]),horasVerano:semana([[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[],[])},
  {nombre:"Biblioteca Pública de Artajona",lat:42.5889769,lon:-1.7621425,dir:"c/ Mayor, 2, 31140 Artajona",tel:"948 36 44 61",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Ayegui",lat:42.6568769,lon:-2.0384678,dir:"c/ Ayuntamiento, 1, 31240 Ayegui/Aiegi",tel:"948 11 00 70",web:"",rating:null,reviews:null,horasInvierno:semana([[h(16,30),h(19,30)]],[[h(16,30),h(19,30)]],[[h(16,30),h(19,30)]],[[h(16,30),h(19,30)]],[[h(16,30),h(19,30)]],[],[]),horasVerano:semana([[h(10,30),h(13,30)]],[[h(10,30),h(13,30)]],[[h(10,30),h(13,30)]],[[h(10,30),h(13,30)]],[[h(10,30),h(13,30)]],[],[])},
  {nombre:"Biblioteca Pública de Azagra",lat:42.309252,lon:-1.8944258,dir:"c/ Entre Ríos, 9, 31560 Azagra",tel:"948 69 25 72",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Barañain",lat:42.8052557,lon:-1.6893122,dir:"c/ Lur Gorri, 12 - 14, 31010 Barañáin/Barañain",tel:"948 28 66 28",web:"https://www.bibliotecaspublicas.es/baranain",rating:null,reviews:null,horasInvierno:semana([[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Baztan",lat:43.1628957,lon:-1.4935352,dir:"c/ Jaime Urrutia, 30, 31700 Baztan",tel:"948 58 12 04",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Bera",lat:43.2813278,lon:-1.6796472,dir:"Paseo Eztegara, 9, 31780 Bera",tel:"948 62 55 02",web:"https://bera.eus/es/biblioteca-publica/",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Beriáin",lat:42.7334799,lon:-1.6447836,dir:"Plz. Larre, 11, Casa de cultura, 31191 Beriáin",tel:"948 36 83 21",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Artica",lat:42.854508,lon:-1.6903219,dir:"Camino de la Fuente, 1, 31013 Berrioplano/Berriobeiti",tel:"948 38 26 22",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Berriozar",lat:42.8326254,lon:-1.6696894,dir:"c/ Etxaburua, s/n, 31013 Berriozar",tel:"948 30 17 65",web:"https://www.bibliotecaspublicas.es/berriozar",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Buñuel",lat:41.9802998,lon:-1.4446646,dir:"c/ San Gregorio, 9, 31540 Buñuel",tel:"948 83 20 27",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Burlada/Burlata",lat:42.8230299,lon:-1.614076,dir:"Plz. Ezkabazabal, 6, 31600 Burlada/Burlata",tel:"948 13 66 33",web:"https://www.bibliotecaspublicas.es/burlada",rating:null,reviews:null,horasInvierno:semana([[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Cabanillas",lat:42.0309013,lon:-1.5263619,dir:"c/ San Roque, s/n, 31511 Cabanillas",tel:"948 81 04 63",web:"",rating:null,reviews:null,horasInvierno:semana([[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[],[]),horasVerano:semana([[h(10,0),h(14,0)]],[[h(10,0),h(14,0)]],[[h(10,0),h(14,0)]],[[h(10,0),h(14,0)]],[[h(10,0),h(14,0)]],[],[])},
  {nombre:"Biblioteca Pública de Cadreita",lat:42.2181824,lon:-1.6930439,dir:"Plz. del Ayuntamiento, s/n, 31515 Cadreita",tel:"683 37 98 56",web:"",rating:null,reviews:null,horasInvierno:semana([[h(16,30),h(20,30)]],[[h(16,30),h(20,30)]],[[h(16,30),h(20,30)]],[[h(16,30),h(20,30)]],[[h(16,30),h(20,30)]],[],[]),horasVerano:semana([[h(10,0),h(14,0)]],[[h(10,0),h(14,0)]],[[h(10,0),h(14,0)]],[[h(10,0),h(14,0)]],[[h(10,0),h(14,0)]],[],[])},
  {nombre:"Biblioteca Pública de Caparroso",lat:42.3395614,lon:-1.6543719,dir:"Plz. de España, 1, 31380 Caparroso",tel:"948 73 07 08",web:"https://www.bibliotecaspublicas.es/caparroso",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Cárcar",lat:42.3913267,lon:-1.9747429,dir:"c/ Mayor, 1, Centro Cultural La Caja, 31579 Cárcar",tel:"687 13 80 23",web:"",rating:null,reviews:null,horasInvierno:semana([[h(17,0),h(21,0)]],[[h(17,0),h(21,0)]],[[h(17,0),h(21,0)]],[[h(17,0),h(21,0)]],[[h(17,0),h(21,0)]],[],[]),horasVerano:semana([[h(11,0),h(14,0)]],[[h(11,0),h(14,0)]],[[h(11,0),h(14,0)]],[[h(11,0),h(14,0)]],[[h(11,0),h(14,0)]],[],[])},
  {nombre:"Biblioteca Pública de Carcastillo",lat:42.3800209,lon:-1.4445327,dir:"c/ Carretera, 40, 31310 Carcastillo",tel:"948 72 58 51",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Cascante",lat:41.9985069,lon:-1.6780776,dir:"c/ San Pedro, 3, 31520 Cascante",tel:"948 84 45 24",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Cáseda",lat:42.5242929,lon:-1.3674903,dir:"Plz. del Mercado, 2, 31490 Cáseda",tel:"948 43 41 18",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Castejón",lat:42.1705562,lon:-1.6932791,dir:"c/ Julián Gayarre, s/n, 31590 Castejón",tel:"948 81 40 15",web:"https://www.bibliotecaspublicas.es/castejon",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Cintruénigo",lat:42.0767637,lon:-1.8073393,dir:"c/ Pamplona, 24, 31592 Cintruénigo",tel:"948 81 57 18",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Municipal de Zirauki",lat:42.6756793,lon:-1.890971,dir:"Plz. del Ayuntamiento, 1, 31131 Cirauqui/Zirauki",tel:"948 34 22 70",web:"",rating:null,reviews:null,horasInvierno:semana([[h(16,15),h(19,30)]],[[h(16,15),h(19,30)]],[[h(16,15),h(19,30)]],[[h(16,15),h(19,30)]],[[h(16,15),h(19,30)]],[],[]),horasVerano:semana([[h(10,15),h(13,15)]],[[h(10,15),h(13,15)]],[[h(10,15),h(13,15)]],[[h(10,15),h(13,15)]],[[h(10,15),h(13,15)]],[],[])},
  {nombre:"Biblioteca Pública de Corella",lat:42.1152097,lon:-1.7893729,dir:"Parque María Teresa, s/n, 31591 Corella",tel:"948 78 05 77",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Cortes",lat:41.9212189,lon:-1.4209311,dir:"c/ San Miguel, 12, 31530 Cortes",tel:"948 80 00 87",web:"https://www.bibliotecaspublicas.es/cortes",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública Municipal de Doneztebe/Santesteban",lat:43.1314091,lon:-1.6690844,dir:"Plz. de los Fueros, 1, 31740 Doneztebe/Santesteban",tel:"948 45 17 12",web:"",rating:null,reviews:null,horasInvierno:semana([[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[],[]),horasVerano:semana([[h(9,0),h(13,0)]],[[h(9,0),h(13,0)]],[[h(9,0),h(13,0)]],[[h(9,0),h(13,0)]],[[h(9,0),h(13,0)]],[],[])},
  {nombre:"Biblioteca Pública de Aurizberri/Espinal",lat:42.9795137,lon:-1.3710667,dir:"c/ San Bartolomé, 47, 31694 Erro",tel:"948 76 01 23",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Estella/Lizarra",lat:42.6704759,lon:-2.0277953,dir:"c/ Julio Ruiz de Alda, 34 - 36, 31200 Estella-Lizarra",tel:"948 55 64 19",web:"https://www.bibliotecaspublicas.es/estella",rating:null,reviews:null,horasInvierno:semana([[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[[h(8,30),h(20,30)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Etxarri-Aranatz",lat:42.907578,lon:-2.0648822,dir:"c/ Nagusia, 15, Bajo, 31820 Etxarri Aranatz",tel:"948 46 11 81",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Falces",lat:42.3895007,lon:-1.7954723,dir:"c/ Eustaquio Díaz, 1, 31370 Falces",tel:"948 73 47 76",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Fitero",lat:42.0557224,lon:-1.8565659,dir:"Plz. de las Malvas, s/n, 31593 Fitero",tel:"948 77 65 14",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Fontellas",lat:42.0290092,lon:-1.5768207,dir:"c/ Norte, 17, 31512 Fontellas",tel:"948 82 35 77",web:"",rating:null,reviews:null,horasInvierno:semana([[h(17,0),h(20,30)]],[[h(17,0),h(20,30)]],[[h(17,0),h(20,30)]],[[h(17,0),h(20,30)]],[[h(17,0),h(20,30)]],[],[]),horasVerano:semana([[h(10,0),h(13,30)]],[[h(10,0),h(13,30)]],[[h(10,0),h(13,30)]],[[h(10,0),h(13,30)]],[[h(10,0),h(13,30)]],[],[])},
  {nombre:"Biblioteca Pública de Funes",lat:42.3171375,lon:-1.8016673,dir:"c/ Navarro Villoslada, s/n, 31360 Funes",tel:"948 71 60 95",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Fustiñana",lat:42.0212249,lon:-1.4857389,dir:"c/ Juan Pascual Esteban Chavarría, 3, 31510 Fustiñana",tel:"948 84 03 50",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Huarte/Uharte",lat:42.8310546,lon:-1.5914701,dir:"c/ Virgen Blanca, 2, 31620 Huarte/Uharte",tel:"948 33 50 43",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Irurtzun",lat:42.9183461,lon:-1.8298964,dir:"c/ Larraun, 1, 31860 Irurtzun",tel:"948 50 07 08",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Lakuntza",lat:42.9222192,lon:-2.0227655,dir:"Plz. Herriko plaza, 1 - 3, 31830 Lakuntza",tel:"663 85 17 37",web:"",rating:null,reviews:null,horasInvierno:semana([[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[],[]),horasVerano:semana([[h(9,30),h(13,30)]],[[h(9,30),h(13,30)]],[[h(9,30),h(13,30)]],[[h(9,30),h(13,30)]],[[h(9,30),h(13,30)]],[],[])},
  {nombre:"Biblioteca Pública de Larraga",lat:42.5580517,lon:-1.8500707,dir:"Plz. de los Fueros, s/n, 31251 Larraga",tel:"948 71 10 11",web:"",rating:null,reviews:null,horasInvierno:semana([[h(15,45),h(20,0)]],[[h(15,45),h(20,0)]],[[h(15,45),h(20,0)]],[[h(15,45),h(20,0)]],[[h(15,45),h(20,0)]],[],[]),horasVerano:semana([[h(9,45),h(14,0)]],[[h(9,45),h(14,0)]],[[h(9,45),h(14,0)]],[[h(9,45),h(14,0)]],[[h(9,45),h(14,0)]],[],[])},
  {nombre:"Biblioteca Pública de Leitza",lat:43.1081614,lon:-1.8990093,dir:"c/ Amazabal, s/n, 31880 Leitza",tel:"948 51 03 79",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Lekunberri",lat:43.0051774,lon:-1.8956075,dir:"c/ Alde Zeharra, 33, 31870 Lekunberri",tel:"948 60 45 82",web:"",rating:null,reviews:null,horasInvierno:semana([[h(11,0),h(13,0)],[h(16,0),h(20,0)]],[[h(11,0),h(13,0)],[h(16,0),h(20,0)]],[[h(11,0),h(13,0)],[h(16,0),h(20,0)]],[[h(11,0),h(13,0)],[h(16,0),h(20,0)]],[[h(11,0),h(13,0)],[h(16,0),h(20,0)]],[],[]),horasVerano:semana([[h(9,0),h(15,0)]],[[h(9,0),h(15,0)]],[[h(9,0),h(15,0)]],[[h(9,0),h(15,0)]],[[h(9,0),h(15,0)]],[],[])},
  {nombre:"Biblioteca Pública de Lerín",lat:42.4825866,lon:-1.9725975,dir:"c/ Mayor, 24, 31260 Lerín",tel:"948 53 06 59",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Lesaka",lat:43.2471212,lon:-1.7043191,dir:"c/ Komentu, 1, Casa de Cultura Harriondoa/ Harriondoa Kultur Etxea, 31770 Lesaka",tel:"948 63 78 01",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Lodosa",lat:42.4230299,lon:-2.0782295,dir:"Avda. de la Ribera, 41, 31580 Lodosa",tel:"948 69 48 05",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Los Arcos",lat:42.5692166,lon:-2.1938355,dir:"c/ San Lázaro, 2, 31210 Los Arcos",tel:"948 64 08 09",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Lumbier",lat:42.6509769,lon:-1.3098868,dir:"c/ del Pilar, s/n, 31440 Lumbier",tel:"948 88 05 05",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Mañeru",lat:42.6695386,lon:-1.8620743,dir:"Plz. de los Fueros, s/n, 31130 Mañeru",tel:"948 34 82 12",web:"",rating:null,reviews:null,horas:semana([[h(17,30),h(19,45)]],[[h(17,30),h(19,45)]],[[h(17,30),h(19,45)]],[],[[h(17,30),h(19,45)]],[],[])},
  {nombre:"Biblioteca Pública de Marcilla",lat:42.3258784,lon:-1.7380991,dir:"Plz. de la Cava, 1, 31340 Marcilla",tel:"948 75 74 03",web:"https://www.bibliotecaspublicas.es/marcilla",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Mélida",lat:42.3593649,lon:-1.5475067,dir:"c/ La Oliva, 2, 31382 Mélida",tel:"948 74 68 02",web:"https://www.bibliotecaspublicas.es/melida",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Mendavia",lat:42.4443874,lon:-2.2002884,dir:"Plz. del Ayuntamiento, 1, Casa de la Cultura, 2ª planta, 31587 Mendavia",tel:"948 68 58 03",web:"https://www.bibliotecaspublicas.es/mendavia",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Mendigorría",lat:42.6262078,lon:-1.8340213,dir:"c/ de la Verdura, s/n, 31150 Mendigorria",tel:"948 34 30 63",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Milagro",lat:42.2427307,lon:-1.7733263,dir:"Avda. San Juan, 1, 31320 Milagro",tel:"948 40 92 39",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Miranda de Arga",lat:42.4829542,lon:-1.8269034,dir:"Plz. de los Fueros, 1, 31253 Miranda de Arga",tel:"948 73 73 12",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Monteagudo",lat:41.9620037,lon:-1.6939437,dir:"c/ Huerto Mayor, 7, 31522 Monteagudo",tel:"948 81 67 14",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Murchante",lat:42.0309725,lon:-1.655853,dir:"c/ Fernando Mardones y Angulo, 1, 31521 Murchante",tel:"948 83 86 84",web:"https://www.bibliotecaspublicas.es/murchante/",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Noain-Valle de Elorz",lat:42.760145,lon:-1.6335917,dir:"c/ Real, 10, 31110 Noáin (Valle de Elorz)/Noain (Elortzibar)",tel:"948 31 21 49",web:"https://www.bibliotecaspublicas.es/noain",rating:null,reviews:null,horasInvierno:semana([[h(10,0),h(13,0)],[h(16,0),h(20,0)]],[[h(10,0),h(13,0)],[h(16,0),h(20,0)]],[[h(10,0),h(13,0)],[h(16,0),h(20,0)]],[[h(10,0),h(13,0)],[h(16,0),h(20,0)]],[[h(10,0),h(13,0)],[h(16,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Obanos",lat:42.6808183,lon:-1.7851016,dir:"c/ de San Ignacio, 1, A, 31151 Obanos",tel:"948 34 45 49",web:"",rating:null,reviews:null,horasInvierno:semana([[h(16,30),h(20,0)]],[[h(16,30),h(20,0)]],[[h(16,30),h(20,0)]],[[h(16,30),h(20,0)]],[[h(16,30),h(20,0)]],[],[]),horasVerano:semana([[h(16,30),h(20,0)]],[[h(16,30),h(20,0)]],[[h(16,30),h(20,0)]],[[h(16,30),h(20,0)]],[[h(16,30),h(20,0)]],[],[])},
  {nombre:"Biblioteca Pública de Olazti/Olazagutía",lat:42.8755959,lon:-2.197637,dir:"c/ Orreaga, 3 - 5, 31809 Olazti/Olazagutía",tel:"948 56 48 58",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Olite/Erriberri",lat:42.4813623,lon:-1.6512224,dir:"c/ Rua Mayor, 37, 31390 Olite/Erriberri",tel:"948 74 07 72",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Oteiza",lat:42.6189773,lon:-1.9548197,dir:"c/ San Isidro, 10, 31250 Oteiza",tel:"948 53 62 03",web:"",rating:null,reviews:null,horasInvierno:semana([[h(16,0),h(19,0)]],[[h(16,0),h(19,0)]],[[h(16,0),h(19,0)]],[[h(16,0),h(19,0)]],[[h(16,0),h(19,0)]],[],[]),horasVerano:semana([[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[],[])},
  {nombre:"Biblioteca Pública de Peralta/Azkoien",lat:42.3375209,lon:-1.8029495,dir:"c/ Tremoya, 3, 31350 Peralta/Azkoien",tel:"948 75 32 10",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Puente la Reina",lat:42.6717107,lon:-1.8155291,dir:"Plz. Juan de Mena, s/n, 31100 Puente la Reina/Gares",tel:"948 34 12 81",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Ribaforada",lat:41.9981387,lon:-1.5126628,dir:"Plz. San Francisco, 2, 31550 Ribaforada",tel:"948 81 92 66",web:"https://www.bibliotecaspublicas.es/ribaforada",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Roncal/Erronkari",lat:42.8074494,lon:-0.9555751,dir:"c/ Julián Gayarre, 1, 31415 Roncal/Erronkari",tel:"948 47 51 73",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de San Adrián",lat:42.3327818,lon:-1.9336689,dir:"Avda. de la Paz, 4, 31570 San Adrián",tel:"948 67 20 25",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Sangüesa/Zangoza",lat:42.5769677,lon:-1.2824438,dir:"c/ San Miguel, 66, 31400 Sangüesa/Zangoza",tel:"948 87 14 17",web:"https://www.bibliotecaspublicas.es/sanguesa",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Sartaguda",lat:42.3807678,lon:-2.0588583,dir:"c/ Arriba, 2, 31589 Sartaguda",tel:"948 69 74 16",web:"",rating:null,reviews:null,horasInvierno:semana([[h(17,0),h(20,0)]],[[h(17,0),h(20,0)]],[[h(17,0),h(20,0)]],[[h(17,0),h(20,0)]],[[h(17,0),h(20,0)]],[],[]),horasVerano:semana([[h(10,30),h(13,0)]],[[h(10,30),h(13,0)]],[[h(10,30),h(13,0)]],[[h(10,30),h(13,0)]],[[h(10,30),h(13,0)]],[],[])},
  {nombre:"Biblioteca Pública de Sesma",lat:42.4771231,lon:-2.0861593,dir:"Plz. de la Diputación, 6, 31293 Sesma",tel:"948 69 80 19",web:"https://www.aytosesma.es/biblioteca.php",rating:null,reviews:null,horasInvierno:semana([[h(16,0),h(19,0)]],[[h(16,0),h(19,0)]],[[h(16,0),h(19,0)]],[[h(16,0),h(19,0)]],[[h(16,0),h(19,0)]],[],[]),horasVerano:semana([[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[],[])},
  {nombre:"Biblioteca Pública de Tafalla",lat:42.5301172,lon:-1.6748712,dir:"c/ San Juan, 1, 31300 Tafalla",tel:"948 70 39 33",web:"https://www.bibliotecaspublicas.es/tafalla",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Tudela",lat:42.0627986,lon:-1.6072787,dir:"c/ Herrerías, 14, 31500 Tudela",tel:"948 84 80 83",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Ultzama",lat:42.9794663,lon:-1.6908179,dir:"c/ San Pedro, 2A, 31797 Ultzama",tel:"610 15 93 53",web:"",rating:null,reviews:null,horasInvierno:semana([[h(16,30),h(19,30)]],[[h(16,30),h(19,30)]],[[h(16,30),h(19,30)]],[[h(16,30),h(19,30)]],[[h(16,30),h(19,30)]],[],[]),horasVerano:semana([[h(10,30),h(13,30)]],[[h(10,30),h(13,30)]],[[h(10,30),h(13,30)]],[[h(10,30),h(13,30)]],[[h(10,30),h(13,30)]],[],[])},
  {nombre:"Biblioteca Pública de Urdiain",lat:42.8868926,lon:-2.1366422,dir:"c/ Barrenkalde, 24, 31810 Urdiain",tel:"948 56 48 57",web:"",rating:null,reviews:null,horasInvierno:semana([[h(17,30),h(20,30)]],[[h(17,30),h(20,30)]],[[h(17,30),h(20,30)]],[[h(17,30),h(20,30)]],[[h(17,30),h(20,30)]],[],[]),horasVerano:semana([[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[[h(10,0),h(13,0)]],[],[])},
  {nombre:"Biblioteca Pública del Valle de Egüés (Olaz)",lat:42.8172753,lon:-1.6033938,dir:"Ctra. de Huarte, Km 5, 31620 Valle de Egüés/Eguesibar",tel:"948 33 79 74",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,0),h(15,0)]],[[h(8,0),h(15,0)]],[[h(8,0),h(15,0)]],[[h(8,0),h(15,0)]],[[h(8,0),h(15,0)]],[],[])},
  {nombre:"Biblioteca Pública del Valle de Egüés (Sarriguren)",lat:42.8083624,lon:-1.5897604,dir:"c/ Bardenas Reales, 78, 31620 Valle de Egüés/Eguesibar",tel:"948 78 89 26",web:"",rating:null,reviews:null,horasInvierno:semana([[h(15,0),h(21,0)]],[[h(15,0),h(21,0)]],[[h(15,0),h(21,0)]],[[h(15,0),h(21,0)]],[[h(15,0),h(21,0)]],[],[]),horasVerano:semana([[h(8,0),h(15,0)]],[[h(8,0),h(15,0)]],[[h(8,0),h(15,0)]],[[h(8,0),h(15,0)]],[[h(8,0),h(15,0)]],[],[])},
  {nombre:"Biblioteca Pública de Valtierra",lat:42.1934365,lon:-1.6316492,dir:"Plz. de los Derechos Humanos, 10, 31514 Valtierra",tel:"948 40 77 54",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Viana",lat:42.5148706,lon:-2.3726429,dir:"c/ Navarro Villoslada, 26, 31230 Viana",tel:"948 64 52 49",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Villafranca",lat:42.2799199,lon:-1.748845,dir:"c/ Cava, 33, 31330 Villafranca",tel:"948 84 55 12",web:"",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Villava/Atarrabia",lat:42.8318984,lon:-1.6071287,dir:"c/ Mayor, 38, Casa de Cultura, 31610 Villava/Atarrabia",tel:"948 33 50 42",web:"https://www.villava.es/ayuntamiento/servicios/cultura/",rating:null,reviews:null,horasInvierno:semana([[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[[h(14,0),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
  {nombre:"Biblioteca Pública de Ziordia",lat:42.8708362,lon:-2.2288827,dir:"c/ Santa María, 76, 31809 Ziordia",tel:"948 46 89 70",web:"",rating:null,reviews:null,horasInvierno:semana([[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[[h(16,0),h(20,0)]],[],[]),horasVerano:semana([[h(9,30),h(13,30)]],[[h(9,30),h(13,30)]],[[h(9,30),h(13,30)]],[[h(9,30),h(13,30)]],[[h(9,30),h(13,30)]],[],[])},
  {nombre:"Biblioteca Pública de Zizur Mayor/Zizur Nagusia",lat:42.786564,lon:-1.6912119,dir:"Parque Erreniega, 25, 31180 Zizur Mayor/Zizur Nagusia",tel:"948 28 66 29",web:"https://www.bibliotecaspublicas.es/zizurmayor",rating:null,reviews:null,horasInvierno:semana([[h(8,30),h(20,0)]],[[h(8,30),h(20,0)]],[[h(8,30),h(20,0)]],[[h(8,30),h(20,0)]],[[h(8,30),h(20,0)]],[],[]),horasVerano:semana([[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[[h(8,30),h(14,30)]],[],[])},
];
// Acceso y accesibilidad: datos investigados en fuentes oficiales (navarra.es, unav.edu, unavarra.es) y
// directorios de accesibilidad de terceros (Aseci, Equalitas Vitae). Donde no se encontró fuente fiable, se
// marca explícitamente "Sin confirmar" en vez de inventar el dato.
var ACCESO_INFO={
  "Biblioteca de Navarra":{acceso:{tipo:"libre",detalle:"Acceso libre y gratuito a sala, consulta y wifi. El carné (gratuito) solo hace falta para préstamo u ordenadores."},accesibilidad:{sillaRuedas:true,turistas:true,gratisDias:null,notas:"20 puestos de consulta y wifi gratis, salas de trabajo en grupo. Acceso y aparcamiento adaptados para silla de ruedas."}},
  "Biblioteca Pública San Francisco":{acceso:{tipo:"libre",detalle:"Acceso libre y gratuito, como el resto de la red pública de Navarra."},accesibilidad:{sillaRuedas:true,turistas:true,gratisDias:null,notas:"Bucle magnético en el mostrador de atención."}},
  "Biblioteca Pública Yamaguchi":{acceso:{tipo:"libre",detalle:"Acceso libre y gratuito, como el resto de la red pública de Navarra."},accesibilidad:{sillaRuedas:true,turistas:true,gratisDias:null,notas:"Sala de lectura y sala infantil. Aparcamiento adaptado."}},
  "Biblioteca Civican":{acceso:{tipo:"libre",detalle:"Acceso libre a la sala de lectura. Para préstamo puede pedirse la tarjeta CIVICÁN (sin confirmar si tiene coste)."},accesibilidad:{sillaRuedas:true,turistas:true,gratisDias:null,notas:"Entrada accesible, ascensor a la planta de adultos, aseos adaptados y ordenador adaptado para discapacidad visual. Es una fundación privada dentro de la red pública."}},
  "Biblioteca Pública de la Milagrosa":{acceso:{tipo:"libre",detalle:"Acceso libre y gratuito, como el resto de la red pública de Navarra."},accesibilidad:{sillaRuedas:true,turistas:true,gratisDias:null,notas:"Entrada accesible, en calle peatonal."}},
  "Biblioteca Pública de Iturrama":{acceso:{tipo:"libre",detalle:"Acceso libre y gratuito, como el resto de la red pública de Navarra."},accesibilidad:{sillaRuedas:null,turistas:true,gratisDias:null,notas:"Sin confirmar accesibilidad física (no se encontró fuente oficial ni de terceros)."}},
  "Biblioteca Pública de la Txantrea":{acceso:{tipo:"libre",detalle:"Acceso libre y gratuito, como el resto de la red pública de Navarra."},accesibilidad:{sillaRuedas:true,turistas:true,gratisDias:null,notas:"Acceso y aparcamiento adaptados."}},
  "Biblioteca Pública de Mendillorri":{acceso:{tipo:"libre",detalle:"Acceso libre y gratuito, como el resto de la red pública de Navarra."},accesibilidad:{sillaRuedas:true,turistas:true,gratisDias:null,notas:"Acceso y aparcamiento adaptados."}},
  "Biblioteca Pública de San Pedro":{acceso:{tipo:"libre",detalle:"Acceso libre y gratuito, como el resto de la red pública de Navarra."},accesibilidad:{sillaRuedas:true,turistas:true,gratisDias:null,notas:"Acceso, aparcamiento y aseo adaptados."}},
  "Biblioteca Pública de San Jorge":{acceso:{tipo:"libre",detalle:"Acceso libre y gratuito, como el resto de la red pública de Navarra."},accesibilidad:{sillaRuedas:null,turistas:true,gratisDias:null,notas:"Sin confirmar accesibilidad física (no se encontró fuente oficial ni de terceros)."}},
  "Biblioteca Pública de Etxabakoitz":{acceso:{tipo:"libre",detalle:"Acceso libre y gratuito, como el resto de la red pública de Navarra."},accesibilidad:{sillaRuedas:null,turistas:true,gratisDias:null,notas:"Sin confirmar accesibilidad física (no se encontró fuente oficial ni de terceros)."}},
  "Biblioteca Universidad de Navarra · Central":{acceso:{tipo:"restringido",detalle:"Reservada a comunidad universitaria (UNAV, CIMA, CUN), antiguos alumnos con carné y usuarios con convenio. Un visitante externo debe ser invitado por un departamento y tramitar tarjeta: no es de acceso libre para público general."},accesibilidad:{sillaRuedas:true,turistas:false,gratisDias:null,notas:"Servicio de \"biblioteca accesible\" con atención personalizada y señalización Navilens. Planta 0: Sala Múltiple, de libre uso sin reserva (mesas individuales, sofás-cabina, trabajo en grupo). Planta -1: aula de ordenadores (24 puestos) y zonas colaborativas. Plantas 1-5: cabinas individuales y salas de investigación. Hay salas de silencio absoluto repartidas por el edificio (sin confirmar en qué plantas exactas)."}},
  "Biblioteca Universidad de Navarra · Ciencias":{acceso:{tipo:"restringido",detalle:"Misma política que el resto de bibliotecas UNAV: comunidad universitaria, antiguos alumnos con carné y usuarios con convenio."},accesibilidad:{sillaRuedas:null,turistas:false,gratisDias:null,notas:"Cuenta con la \"Sala Azul\": zona de libre uso, sin necesidad de reserva (confirmado por la propia biblioteca en sus canales oficiales). Dos salas de estudio (451 puestos), once salas de trabajo en grupo. Horario muy variable según calendario académico (cerrada gran parte de julio-agosto) — confirma fechas exactas en unav.edu antes de ir. Sin confirmar accesibilidad física ni una \"planta -1\" diferenciada en este edificio."}},
  "Biblioteca Universidad de Navarra · Facultades Eclesiásticas":{acceso:{tipo:"restringido",detalle:"Pensada principalmente para alumnado y profesorado de Teología, Derecho Canónico y Filosofía Eclesiástica, aunque no parece haber barrera estricta de entrada para el resto de la comunidad UNAV."},accesibilidad:{sillaRuedas:null,turistas:false,gratisDias:null,notas:"Conocida coloquialmente como \"Biblioteca de Teología\". Fondo especializado (~8.300 libros, +200 revistas). Horario detallado y accesibilidad física sin confirmar; coordenadas aproximadas (sin verificar con precisión)."}},
  "Biblioteca UPNA · Campus de Arrosadía":{acceso:{tipo:"libre",detalle:"Sala de lectura abierta al público general, EXCEPTO en época de exámenes (solo comunidad universitaria). El préstamo es solo para comunidad universitaria o convenios."},accesibilidad:{sillaRuedas:true,turistas:true,gratisDias:null,notas:"Entrada y aparcamiento accesibles. En época de exámenes se restringen los puestos de estudio a la comunidad universitaria."}}
};
// Nombres repetidos en los datos (p. ej. "Biblioteca Municipal Central" en 3 ciudades): se añade la ciudad,
// porque las sesiones guardan la biblioteca por nombre.
(function(){var c={};(window.BIBLIOTECAS_ES||[]).forEach(function(r){c[r.n]=(c[r.n]||0)+1;});
  var vistos={};(window.BIBLIOTECAS_ES||[]).forEach(function(r){if(c[r.n]>1&&r.c&&r.n.indexOf(r.c)===-1)r.n=r.n+" · "+r.c;
    if(vistos[r.n]){vistos[r.n]++;r.n=r.n+" ("+vistos[r.n]+")";}else vistos[r.n]=1;});})();
// Bibliotecas del resto de España: se añaden AL FINAL para no cambiar los índices de las de Navarra
// (los reportes de afluencia y la presencia de amigos guardan el índice). Sin horario verificado.
const N_NAVARRA=BIBLIOTECAS.length;
// Horario compacto del archivo de datos: {"L":[["09:00","21:00"]],...} -> formato interno semana(...)
function horarioDeDatos(o){
  if(!o)return null;
  function tr(lst){return (lst||[]).map(function(r){var a=r[0].split(":"),b=r[1].split(":");return [h(+a[0],+a[1]),h(+b[0],+b[1])];});}
  return semana(tr(o.L),tr(o.M),tr(o.X),tr(o.J),tr(o.V),tr(o.S),tr(o.D));
}
(window.BIBLIOTECAS_ES||[]).forEach(function(r){
  var b={nombre:r.n,lat:r.lat,lon:r.lon,dir:r.dir||"",tel:r.tel||"",web:r.web||"",rating:null,reviews:null,
    sinHorario:true,ciudad:r.c||"",provincia:r.p||"",tipoBib:r.t||"otra",
    tz:(r.p==="Las Palmas"||r.p==="Santa Cruz de Tenerife"||r.lat<30)?"Atlantic/Canary":null};
  if(r.h&&r.h.inv){
    b.sinHorario=false;b.horasInvierno=horarioDeDatos(r.h.inv);b.horasVerano=horarioDeDatos(r.h.ver)||b.horasInvierno;
    b.veranoDesde=r.h.vd||null;b.veranoHasta=r.h.vh||null;b.fuenteHorario=r.h.f||"";b.notaHorario=r.h.nota||"";b.verificadoHorario=r.h.fv||null;
  }
  BIBLIOTECAS.push(b);
});
BIBLIOTECAS.forEach(function(b){
  var info=ACCESO_INFO[b.nombre];
  if(info){b.acceso=info.acceso;b.accesibilidad=info.accesibilidad;return;}
  // Red de Bibliotecas Públicas de Navarra: la Ley Foral 32/2002 establece acceso libre en toda la red.
  // Se aplica por defecto a las bibliotecas municipales sin ficha investigada individualmente; el resto de
  // datos de accesibilidad física sí quedan como "sin confirmar" al no haberse verificado edificio por edificio.
  if(b.sinHorario){
    // Ley 10/2007 de la lectura, art. 13: acceso libre y gratuito a los servicios básicos de las bibliotecas públicas.
    if(b.tipoBib==="publica")b.acceso={tipo:"libre",detalle:"Biblioteca pública: acceso libre y gratuito a los servicios básicos (Ley 10/2007 de la lectura). Sin ficha individual verificada."};
    else if(b.tipoBib==="universidad")b.acceso={tipo:"desconocido",detalle:"Biblioteca universitaria: el acceso suele estar limitado a su comunidad, sobre todo en exámenes. Consulta su web."};
    else b.acceso={tipo:"desconocido",detalle:"Sin confirmar"};
    b.accesibilidad={sillaRuedas:null,turistas:null,gratisDias:null,notas:"Sin confirmar"};
    return;
  }
  if(/^Biblioteca Pública/.test(b.nombre)){
    b.acceso={tipo:"libre",detalle:"Acceso libre y gratuito, como el resto de la red pública de Navarra (Ley Foral 32/2002). Sin ficha individual investigada para esta biblioteca."};
    b.accesibilidad={sillaRuedas:null,turistas:true,gratisDias:null,notas:"Sin confirmar accesibilidad física — dato no investigado individualmente para esta biblioteca."};
    return;
  }
  b.acceso={tipo:"desconocido",detalle:"Sin confirmar"};
  b.accesibilidad={sillaRuedas:null,turistas:null,gratisDias:null,notas:"Sin confirmar"};
});
// Aforo, coste y recursos disponibles: se investigan progresivamente. Solo se rellena lo que ya está
// respaldado por las fuentes citadas en ACCESO_INFO; lo demás queda "sin confirmar" — nunca se inventa
// un número de aforo ni una lista de recursos.
// Fuentes: pamplona.es (fichas de cada biblioteca y aviso municipal de 2018 sobre wifi y ordenadores
// gratuitos en toda la red de Pamplona), Diario de Navarra 02-03-2011 (400 puestos en la inauguración de la
// Biblioteca de Navarra), unav.edu (espacios y equipamiento), programa Civican otoño 2024.
// El aforo de la UPNA no se pone: las estadísticas del ministerio dan cifras distintas según el año.
const PAMPLONA_RED=["wifi","ordenadores"];
const EXTRA_INFO={
  "Biblioteca de Navarra":{gratuito:true,capacidad:400,recursos:["wifi","salas_grupo","ordenadores"]},
  "Biblioteca Pública San Francisco":{recursos:PAMPLONA_RED},
  "Biblioteca Pública Yamaguchi":{recursos:["wifi","ordenadores","impresora"]},
  "Biblioteca Pública de la Milagrosa":{recursos:PAMPLONA_RED},
  "Biblioteca Pública de Iturrama":{recursos:PAMPLONA_RED},
  "Biblioteca Pública de la Txantrea":{recursos:PAMPLONA_RED},
  "Biblioteca Pública de Mendillorri":{recursos:PAMPLONA_RED},
  "Biblioteca Pública de San Pedro":{recursos:PAMPLONA_RED},
  "Biblioteca Pública de San Jorge":{recursos:PAMPLONA_RED},
  "Biblioteca Pública de Etxabakoitz":{recursos:PAMPLONA_RED},
  "Biblioteca Civican":{gratuito:true,recursos:["cafeteria"]},
  "Biblioteca Universidad de Navarra · Central":{capacidad:349,recursos:["wifi","enchufes","salas_grupo","impresora","ordenadores","silencio"]},
  "Biblioteca Universidad de Navarra · Ciencias":{capacidad:451,recursos:["salas_grupo","impresora","ordenadores"]},
  "Biblioteca UPNA · Campus de Arrosadía":{gratuito:true,recursos:["wifi","ordenadores","salas_grupo"]}
};
BIBLIOTECAS.forEach(function(b){
  if(!b.tipoEspacio)b.tipoEspacio="biblioteca";
  var extra=EXTRA_INFO[b.nombre];
  b.capacidad=extra&&extra.capacidad!=null?extra.capacidad:null;
  b.gratuito=extra&&typeof extra.gratuito==="boolean"?extra.gratuito:null;
  // La ficha de acceso ya afirma "acceso libre y gratuito" (Ley Foral 32/2002 en la red pública).
  if(b.gratuito===null&&b.acceso&&b.acceso.tipo==="libre"&&/gratuit/i.test(b.acceso.detalle||""))b.gratuito=true;
  b.recursos=extra&&extra.recursos?extra.recursos:[];
});
function fmtHoras(min){const hh=Math.floor(min/60),mm=min%60;return hh+":"+String(mm).padStart(2,"0");}
// Hora "de reloj" en la biblioteca: las de Canarias van una hora por detrás de la península.
// Devuelve un Date cuyos getHours()/getDay() son la hora local de la biblioteca.
var _deltaTz={};
// Canarias: UTC+0 en invierno y UTC+1 en verano, con el cambio de hora de la UE (último domingo de marzo
// y de octubre a la 01:00 UTC). Se calcula a mano porque crear un Intl.DateTimeFormat con zona horaria
// cuesta decenas de ms en el primer uso, justo al arrancar la app.
function ultimoDomingoUTC(y,m){var d=new Date(Date.UTC(y,m+1,0,1));d.setUTCDate(d.getUTCDate()-d.getUTCDay());return d.getTime();}
function offsetCanariasMin(ms){var y=new Date(ms).getUTCFullYear();return (ms>=ultimoDomingoUTC(y,2)&&ms<ultimoDomingoUTC(y,9))?60:0;}
function deltaTz(tz){
  if(!tz)return 0;
  if(tz==="Atlantic/Canary"){
    // el desfase local se mide en el instante resultante (importa si el móvil cambia de hora con otras reglas)
    var n=Date.now(),oc=offsetCanariasMin(n),d=(oc+new Date(n).getTimezoneOffset())*60000;
    return (oc+new Date(n+d).getTimezoneOffset())*60000;}
  var k=tz+"|"+Math.floor(Date.now()/600000); if(_deltaTz[k]!=null)return _deltaTz[k];
  var v=0;
  try{var now=new Date(),p={};new Intl.DateTimeFormat("en-US",{timeZone:tz,hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).formatToParts(now).forEach(function(x){p[x.type]=x.value;});
    var wall=new Date(+p.year,+p.month-1,+p.day,+p.hour,+p.minute); v=Math.round((wall-now)/60000)*60000;}catch(e){}
  _deltaTz[k]=v; return v;
}
function ahoraEn(b){return new Date(Date.now()+deltaTz(b&&b.tz));}
function estadoBib(b){const now=ahoraEn(b),d=now.getDay(),m=now.getHours()*60+now.getMinutes();
  const tr=horarioVigente(b)[d]||[];for(var k=0;k<tr.length;k++){if(m>=tr[k][0]&&m<tr[k][1])return true;}return false;}

/* ===================== ALMACENAMIENTO ===================== */
const DB_USERS="bpna_users";
const SESSION_KEY="bpna_session";
// MVP de afluencia: en esta versión HTML estática se guarda en este navegador.
// Para verlo entre todos los usuarios, cambia estas funciones a Firebase/Supabase/API propia.
const DB_OCC="bpna_occ_reports";
const OCC_TTL_MIN=60;

// ===== CONFIGURACIÓN SUPABASE PARA AMIGOS / EVENTOS COMPARTIDOS =====
// 1) Crea un proyecto en Supabase.
// 2) Ejecuta el archivo supabase/supabase_social.sql que te paso junto a este index.
// 3) Pega aquí tu Project URL y tu anon/publishable key.
// Con estos valores de ejemplo, la app seguirá funcionando, pero la parte social no sincronizará entre dispositivos.
const SUPABASE_URL="https://jmqqfugqoeqihjgjcbhu.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_1iosUmxRfDEWl-KjHm4F1Q_aceAX01t";
let SB=null;
let SOCIAL={user:null,profile:null,friends:[],requests:[],sent:[],events:[],presence:[],friendMarkers:[],timer:null,prayerCounts:{},prayedByMe:{},room:null,roomMembers:[],friendSessions:[],kudosCounts:{},kudosByMe:{},leaderboard:[],
  comments:{},commentsOpen:{},commentDrafts:{},commentsOk:true,myCommentsAt:0,
  blocked:{},blogPosts:[],eventsAll:[],presenceAll:[]};
var feedTab="mia";
// Claves puestas (la librería puede no estar cargada todavía)
function socialKeysOk(){return SUPABASE_URL.indexOf("https://")===0 && !!SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.indexOf("PEGA_AQUI")===-1;}
// Supabase (~45 KB comprimido) se descarga solo cuando hace falta: la mayoría entra sin cuenta.
var _sbCarga=null;
function cargarSupabase(){
  if(typeof window.supabase!=="undefined")return Promise.resolve(true);
  if(!socialKeysOk())return Promise.resolve(false);
  if(_sbCarga)return _sbCarga;
  _sbCarga=new Promise(function(res){
    var s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    s.onload=function(){res(true);};s.onerror=function(){_sbCarga=null;res(false);};document.head.appendChild(s);
  });
  return _sbCarga;
}
// ¿Quedó guardada una sesión de Supabase en este navegador? (clave sb-<proyecto>-auth-token)
function haySesionNube(){try{for(var i=0;i<localStorage.length;i++){if(/^sb-.+-auth-token$/.test(localStorage.key(i)||""))return true;}}catch(e){}return false;}
function socialConfigured(){return SUPABASE_URL.indexOf("https://")===0 && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.indexOf("PEGA_AQUI")===-1 && typeof window.supabase!=="undefined";}
function socialClient(){if(!socialConfigured())return null;if(!SB)SB=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);return SB;}
function loadJSON(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def;}catch(e){return def;}}
function saveJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function hashPass(s){var hsh=5381;for(var i=0;i<s.length;i++){hsh=((hsh<<5)+hsh)+s.charCodeAt(i);hsh=hsh&hsh;}return String(hsh);}
function userKey(email){return "bpna_data_"+email.toLowerCase();}
function dataDefault(){return {sessions:[],events:{},loans:[],goalMin:240,goalPeriod:"day",fav:[],geoCheck:false,sharePresence:false,invisible:false,occ:{},acadEvents:[],offeringText:"",
  streakFreezes:0,usedFreezeDates:[],lastFreezeEarnedAtStreak:0,badges:{}};}
function genId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}

/* ===================== BRAIN: capa única de guardado local =====================
   Todo lo que la app recuerda pasa por aquí. Nada sale a internet: son solo
   claves de localStorage en este navegador, leídas/escritas via loadJSON/saveJSON. */
const Brain={
  getUsers:function(){return loadJSON(DB_USERS,{});},
  saveUsers:function(users){saveJSON(DB_USERS,users);},
  getSession:function(){return loadJSON(SESSION_KEY,null);},
  setSession:function(email){saveJSON(SESSION_KEY,email);},
  clearSession:function(){localStorage.removeItem(SESSION_KEY);},
  getUserData:function(email){return loadJSON(userKey(email),dataDefault());},
  saveUserData:function(email,data){saveJSON(userKey(email),data);},
  getOccupancy:function(){return loadJSON(DB_OCC,{});},
  saveOccupancy:function(all){saveJSON(DB_OCC,all);},
  getNotifDay:function(email){return loadJSON("bpna_notifday_"+email,null);},
  setNotifDay:function(email,dayKey){saveJSON("bpna_notifday_"+email,dayKey);},
  getLastPrayerCheck:function(email){return loadJSON("bpna_prayercheck_"+email,null);},
  setLastPrayerCheck:function(email,iso){saveJSON("bpna_prayercheck_"+email,iso);}
};

let CURRENT=null;   // email
let DATA=null;      // datos del usuario actual
function loadUserData(){DATA=Brain.getUserData(CURRENT);
  if(!DATA.events)DATA.events={}; if(!DATA.sessions)DATA.sessions=[]; if(!DATA.loans)DATA.loans=[];
  if(!DATA.goalMin)DATA.goalMin=240; if(typeof DATA.geoCheck!=="boolean")DATA.geoCheck=false; if(typeof DATA.sharePresence!=="boolean")DATA.sharePresence=false; if(typeof DATA.invisible!=="boolean")DATA.invisible=false; if(!DATA.occ)DATA.occ={}; if(!DATA.acadEvents)DATA.acadEvents=[];
  if(DATA.goalPeriod!=="day"&&DATA.goalPeriod!=="week")DATA.goalPeriod="day"; if(typeof DATA.offeringText!=="string")DATA.offeringText="";
  if(typeof DATA.streakFreezes!=="number")DATA.streakFreezes=0; if(!DATA.usedFreezeDates)DATA.usedFreezeDates=[];
  if(typeof DATA.lastFreezeEarnedAtStreak!=="number")DATA.lastFreezeEarnedAtStreak=0; if(!DATA.badges||typeof DATA.badges!=="object"||Array.isArray(DATA.badges))DATA.badges={};
  // favoritas: array de nombres de biblioteca (el nombre es único y es lo que ya guardan sesiones y préstamos)
  if(!Array.isArray(DATA.fav))DATA.fav=(typeof DATA.fav==="string"&&DATA.fav)?[DATA.fav]:[];
  DATA.fav=DATA.fav.filter(function(n,k,arr){return typeof n==="string"&&arr.indexOf(n)===k;});}
function saveUserData(){Brain.saveUserData(CURRENT,DATA);}



/* ===================== SUPABASE SOCIAL: AMIGOS, PRESENCIA Y EVENTOS ===================== */
function socialInitial(name){return escapeHTML(String(name||"?").trim().charAt(0).toUpperCase()||"?");}
function socialNameById(id){
  var f=SOCIAL.friends.filter(function(x){return x.profile&&x.profile.id===id;})[0];
  if(f&&f.profile)return f.profile.name||"Amigo";
  if(SOCIAL.profile&&SOCIAL.profile.id===id)return SOCIAL.profile.name||"Tú";
  return "Amigo";
}
async function socialEnsureProfile(user,name,email){
  var sb=socialClient(); if(!sb||!user)return;
  SOCIAL.user=user;
  var got=await sb.from("profiles").select("id,name,friend_code").eq("id",user.id).maybeSingle();
  if(got.error && got.error.code!=="PGRST116"){console.warn(got.error);return;}
  var prof=got.data;
  if(!prof){
    var ins=await sb.from("profiles").insert({id:user.id,name:name||((email||user.email||"").split("@")[0])}).select("id,name,friend_code").single();
    if(ins.error){console.warn(ins.error);return;}
    prof=ins.data;
  }else if(name && prof.name!==name){
    var upd=await sb.from("profiles").update({name:name}).eq("id",user.id).select("id,name,friend_code").single();
    if(!upd.error)prof=upd.data;
  }
  SOCIAL.profile=prof;
}
async function socialInitAfterLogin(){
  var sb=socialClient();
  if(!sb){socialRenderPanel();return;}
  try{
    var sess=await sb.auth.getSession();
    var user=sess.data.session&&sess.data.session.user;
    if(!user){socialRenderPanel();return;}
    var users=Brain.getUsers(), name=(users[CURRENT]&&users[CURRENT].name)||(user.user_metadata&&user.user_metadata.name)||user.email.split("@")[0];
    await socialEnsureProfile(user,name,user.email);
    await socialLoadBlocks();
    await socialRefreshAll();
    await socialCheckNewPrayers();
    await loadOccupancyCloud();refreshOccUI();
    if(SOCIAL.timer)clearInterval(SOCIAL.timer);
    SOCIAL.timer=setInterval(function(){
      socialHeartbeat();socialRefreshAll();socialCheckNewPrayers();
      if(SOCIAL.room){loadRoomMembers().then(renderStudyRoom);}
      if(feedTab==="amigos"){socialLoadFriendSessions().then(socialLoadKudos).then(socialLoadFriendComments).then(renderSessionFeed);}
      else{SOCIAL.myCommentsAt=0;renderSessionFeed();}
      loadOccupancyCloud().then(function(){refreshOccUI();});
    },45000);
  }catch(e){console.warn(e);socialRenderPanel("No he podido cargar Supabase: "+(e.message||e));}
}
// Avisa cuando un amigo empieza a estudiar (no en la primera carga, para no avisar de todo lo que ya había).
var PRESENCIA_VISTA=null;
function avisarAmigosQueEmpiezan(){
  var ahora={};
  (SOCIAL.presence||[]).forEach(function(p){if(p.started_at&&p.bib_index>=0)ahora[p.user_id+"|"+p.started_at]=p;});
  if(PRESENCIA_VISTA){
    Object.keys(ahora).forEach(function(k){
      if(PRESENCIA_VISTA[k])return;
      var p=ahora[k], b=BIBLIOTECAS[p.bib_index];
      if(b&&Date.now()-new Date(p.started_at).getTime()<15*60000)notificar("📚 "+socialNameById(p.user_id)+" ha empezado a estudiar en "+cortoNombre(b.nombre));
    });
  }
  PRESENCIA_VISTA=ahora;
}
async function socialRefreshAll(){
  var sb=socialClient(); if(!sb||!SOCIAL.user)return;
  await socialLoadFriends();
  await socialLoadPresence();
  avisarAmigosQueEmpiezan();
  await socialLoadFriendEvents();
  await socialLoadPrayerCounts();
  socialRenderPanel();
  socialRenderFriendEvents();
  renderStories();
  socialRenderFriendMarkers();
  if(DATA)renderCal();else renderCalFriendExams();
}
/* ===== REZAR POR UN EXAMEN ===== */
// Recuento de rezos de los exámenes de tus amigos y de los tuyos. La tabla prayers solo deja leer a quien
// rezó y al dueño del examen, así que el total para los amigos sale de la función prayer_counts (SQL
// «REZOS VISIBLES PARA AMIGOS»). Si aún no se ha ejecutado, se usa la consulta antigua (solo ves los tuyos).
function misExamenesCompartidos(){
  var ids=[];if(!DATA||!DATA.events)return ids;var hoy=ymd();
  Object.keys(DATA.events).forEach(function(k){if(k<hoy)return;(DATA.events[k]||[]).forEach(function(ev){if(ev.type==="examen"&&ev.shared&&ev.id)ids.push(ev.id);});});
  return ids;
}
async function socialLoadPrayerCounts(){
  var sb=socialClient(); if(!sb||!SOCIAL.user){SOCIAL.prayerCounts={};SOCIAL.prayedByMe={};return;}
  var examIds=SOCIAL.events.filter(function(e){return e.type==="examen";}).map(function(e){return e.local_id;}).concat(misExamenesCompartidos());
  if(!examIds.length){SOCIAL.prayerCounts={};SOCIAL.prayedByMe={};return;}
  var owners=[SOCIAL.user.id].concat(SOCIAL.friends.map(function(f){return f.profile.id;}));
  var counts={},mine={};
  var rpc=SOCIAL.prayerRpcMissing?null:await sb.rpc("prayer_counts",{p_owner_ids:owners});
  if(rpc&&!rpc.error&&rpc.data){
    rpc.data.forEach(function(r){counts[r.event_local_id]=Number(r.n)||0;if(r.prayed_by_me)mine[r.event_local_id]=true;});
  }else{
    if(rpc&&rpc.error)SOCIAL.prayerRpcMissing=true;
    var res=await sb.from("prayers").select("event_local_id,prayed_by_id").in("event_local_id",examIds);
    if(!res.error&&res.data)res.data.forEach(function(r){
      counts[r.event_local_id]=(counts[r.event_local_id]||0)+1;
      if(r.prayed_by_id===SOCIAL.user.id)mine[r.event_local_id]=true;
    });
  }
  SOCIAL.prayerCounts=counts;SOCIAL.prayedByMe=mine;
}
// Botón de rezar con el recuento a la vista (lo ven todos los amigos del dueño del examen).
function prayButtonHTML(ev,cls){
  var n=SOCIAL.prayerCounts[ev.local_id]||0, ya=!!SOCIAL.prayedByMe[ev.local_id];
  return '<button class="extra pray-btn'+(ya?' on':'')+(cls?' '+cls:'')+'" '+(ya?'disabled ':'')+'onclick="event.stopPropagation();prayForExam('+jsArg(ev.local_id)+','+jsArg(ev.owner_id)+','+jsArg(ev.title)+',this)">'+
    '<span class="pray-ic">🙏</span><span class="pray-lbl">'+(ya?'Rezaste':'Rezar')+'</span><span class="pray-n">'+n+'</span></button>';
}
// Recuento en tus propios exámenes compartidos: "3 amigos han rezado por ti".
function prayCountMine(localId){
  var n=SOCIAL.prayerCounts[localId]||0; if(!n)return "";
  return ' <span class="extra pray-mine">🙏 '+n+' '+(n===1?'rezo':'rezos')+'</span>';
}
async function prayForExam(localId,ownerId,title,btn){
  var sb=socialClient(); if(!sb||!SOCIAL.user){showToast("Necesitas amigos y Supabase configurado");return;}
  if(btn){btn.disabled=true;btn.classList.add("on","pop");var nEl=btn.querySelector(".pray-n");if(nEl)nEl.textContent=(SOCIAL.prayerCounts[localId]||0)+1;var l=btn.querySelector(".pray-lbl");if(l)l.textContent="Rezaste";
    if(typeof celebrar==="function")celebrar(btn,["🙏","✨","🕯️","💜"]);}
  var name=(SOCIAL.profile&&SOCIAL.profile.name)||"Alguien";
  var ins=await sb.from("prayers").insert({event_owner_id:ownerId,event_local_id:localId,event_title:title,prayed_by_id:SOCIAL.user.id,prayed_by_name:name});
  if(ins.error){
    if(ins.error.code==="23505"){showToast("Ya habías rezado por este examen 🙏");}
    else{showToast("No se pudo registrar: "+ins.error.message);}
    return;
  }
  showToast("🙏 Has rezado por el examen de "+title);registrarAccion("social");
  if(DATA&&!DATA.badges.first_prayer){DATA.badges.first_prayer=new Date().toISOString();saveUserData();}
  await socialLoadPrayerCounts();
  renderCalFriendExams();socialRenderFriendEvents();
  var dm=document.querySelector("#dayEvs");if(dm&&dm.dataset.k)refrescarDiaAmigos(dm.dataset.k);
}
async function socialCheckNewPrayers(){
  var sb=socialClient(); if(!sb||!SOCIAL.user||!CURRENT)return;
  var since=Brain.getLastPrayerCheck(CURRENT)||new Date(Date.now()-86400000).toISOString();
  var res=await sb.from("prayers").select("*").eq("event_owner_id",SOCIAL.user.id).gt("created_at",since).order("created_at",{ascending:true});
  if(res.error||!res.data||!res.data.length)return;
  res.data.forEach(function(p){
    showToast("🙏 "+(p.prayed_by_name||"Alguien")+" ha rezado por tu examen de "+p.event_title);
    try{ if("Notification" in window && Notification.permission==="granted") new Notification("Bibliomapa",{body:(p.prayed_by_name||"Alguien")+" ha rezado por tu examen de "+p.event_title}); }catch(e){}
  });
  Brain.setLastPrayerCheck(CURRENT,res.data[res.data.length-1].created_at);
}
// Agenda: eventos que tus amigos comparten (exámenes, tareas y otros). Siempre visible, con un aviso
// de qué falta (cuenta, amigos) cuando todavía no hay nada que enseñar.
function renderCalFriendExams(){
  var list=$("friendCalList"); if(!list)return;
  if(!SOCIAL.user){
    list.innerHTML='<div class="empty-note" style="margin-bottom:10px">Aquí verás los exámenes y entregas que compartan tus amigos.'+(socialKeysOk()?' Necesitas una cuenta (gratis y opcional) para añadir amigos.':'')+'</div>'+
      (socialKeysOk()?'<button class="btn sm" onclick="abrirLogin(\'reg\')">Crear cuenta</button>':'');
    return;
  }
  if(!SOCIAL.friends.length){
    list.innerHTML='<div class="empty-note" style="margin-bottom:10px">Todavía no tienes amigos en la app. Añádelos con su código y verás aquí su calendario.</div><button class="btn sm" onclick="goView(\'friends\')">Añadir amigos</button>';
    return;
  }
  if(!SOCIAL.events.length){
    list.innerHTML='<div class="empty-note">Tus amigos no han compartido exámenes ni tareas próximas. Al añadir un evento, marca «Compartir con mis amigos» para que ellos vean el tuyo.</div>';
    return;
  }
  var DS=["dom","lun","mar","mié","jue","vie","sáb"],TIPO={examen:"Examen",tarea:"Tarea",otro:"Otro"};
  var hoy=new Date();hoy.setHours(0,0,0,0);
  list.innerHTML=SOCIAL.events.map(function(ev){
    var t=TIPO[ev.type]?ev.type:"otro", d=new Date(ev.date+"T00:00:00"), dias=Math.round((d-hoy)/86400000);
    var cuando=dias<=0?"Hoy":dias===1?"Mañana":"En "+dias+" días";
    var pray=t==="examen"?prayButtonHTML(ev):"";
    return '<div class="prox-item ev-'+t+'-txt" onclick="calRef=new Date('+jsArg(ev.date+"T00:00:00")+');renderCal();openDayModal('+jsArg(ev.date)+')"><div class="pd"><b>'+d.getDate()+'</b><small>'+DS[d.getDay()]+'</small></div>'+
      '<div class="pt"><b>'+escapeHTML(ev.title)+'</b><small>'+escapeHTML(socialNameById(ev.owner_id))+' · '+TIPO[t]+' · '+cuando+(ev.time?' · '+escapeHTML(ev.time):'')+'</small></div>'+pray+'</div>';
  }).join("");
}
function eventosAmigosDe(key){return (SOCIAL.events||[]).filter(function(e){return e.date===key;});}
function diaAmigosHTML(key){
  return eventosAmigosDe(key).map(function(ev){
    return '<div class="ev-item"><span class="tag amigo"></span><div class="et"><b>'+escapeHTML(ev.title)+'</b><small>De '+escapeHTML(socialNameById(ev.owner_id))+' · '+escapeHTML(ev.type||"otro")+'</small></div>'+(ev.type==="examen"?prayButtonHTML(ev,"sm"):'')+'</div>';
  }).join("");
}
function refrescarDiaAmigos(key){var el=$("dayFriendEvs");if(el)el.innerHTML=diaAmigosHTML(key);}
/* ===== DENUNCIAR Y BLOQUEAR (política de contenido generado por usuarios de Google Play) =====
   Tablas content_reports y user_blocks (ver supabase/supabase_social.sql). Si content_reports aún no existe,
   la denuncia se guarda en el buzón feedback para no perderla. Los bloqueos se guardan en user_blocks
   y en caché local (bpna_blocks_<id>); si la tabla falta, se quedan en local y se reintentan al entrar. */
var REPORT_REASONS=[["spam","Spam o publicidad"],["acoso","Acoso o insultos"],["sexual","Contenido sexual"],["odio","Odio o discriminación"],["datos_personales","Datos personales de otra persona"],["otro","Otro motivo"]];
var REPORT_LABEL={book_post:"esta publicación",session_comment:"este comentario",shared_session:"esta sesión",profile:"este usuario",otro:"este contenido"};
function isBlocked(id){return !!(id&&SOCIAL.blocked&&SOCIAL.blocked[id]);}
function filterBlocked(arr,key){return (arr||[]).filter(function(x){return !isBlocked(x&&x[key]);});}
function blocksKey(){return "bpna_blocks_"+(SOCIAL.user?SOCIAL.user.id:"");}
function blocksSave(){if(SOCIAL.user)saveJSON(blocksKey(),SOCIAL.blocked);}
function tableMissing(res,name){
  var e=res&&res.error; if(!e)return false;
  return res.status===404||e.code==="42P01"||e.code==="PGRST205"||(new RegExp(name).test(e.message||"")&&/(does not exist|schema cache)/.test(e.message||""));
}
async function socialLoadBlocks(){
  SOCIAL.blocked=SOCIAL.user?(loadJSON(blocksKey(),{})||{}):{};
  var sb=socialClient(); if(!sb||!SOCIAL.user)return;
  var res=await sb.from("user_blocks").select("blocked_id").eq("blocker_id",SOCIAL.user.id);
  if(res.error)return; // tabla sin crear o sin red: nos quedamos con la caché local
  var antes=SOCIAL.blocked, nuevo={}, faltan=[];
  (res.data||[]).forEach(function(r){nuevo[r.blocked_id]={name:(antes[r.blocked_id]&&antes[r.blocked_id].name)||""};if(!nuevo[r.blocked_id].name)faltan.push(r.blocked_id);});
  // bloqueos hechos sin conexión o antes de crear la tabla: se suben ahora
  Object.keys(antes).forEach(function(id){
    if(nuevo[id]||!antes[id].pend)return;
    nuevo[id]=antes[id];
    sb.from("user_blocks").insert({blocker_id:SOCIAL.user.id,blocked_id:id}).then(function(r){if(!r.error||r.error.code==="23505"){if(SOCIAL.blocked[id]){delete SOCIAL.blocked[id].pend;blocksSave();}}});
  });
  if(faltan.length){var pr=await sb.from("profiles").select("id,name").in("id",faltan);if(!pr.error)(pr.data||[]).forEach(function(p){if(nuevo[p.id])nuevo[p.id].name=p.name||"";});}
  SOCIAL.blocked=nuevo;blocksSave();
}
// Vuelve a pintar todo lo social con el filtro de bloqueos actual (sin pedir nada a la red).
function applyBlocks(){
  SOCIAL.events=filterBlocked(SOCIAL.eventsAll,"owner_id");
  SOCIAL.presence=presenciasVisibles(SOCIAL.presenceAll);
  renderBlogList();
  try{socialRenderPanel();}catch(e){}
  socialRenderFriendEvents();socialRenderFriendMarkers();
  computeLeaderboard();renderLeaderboard();
  renderStudyRoom();
  if(DATA){renderCal();renderSessionFeed(true);}else renderCalFriendExams();
}
function ugcMoreBtn(type,id,ownerId,name){
  if(!ownerId)return "";
  return '<button class="ugc-more" title="Más opciones" aria-label="Más opciones" onclick="event.stopPropagation();ugcMenu('+jsArg(type)+','+jsArg(id)+','+jsArg(ownerId)+','+jsArg(name||"")+')">⋯</button>';
}
function ugcNeedLogin(){
  if(SOCIAL.user&&socialClient())return false;
  showToast("Inicia sesión para denunciar o bloquear");
  if(socialKeysOk()&&typeof abrirLogin==="function")abrirLogin("login");
  return true;
}
function ugcMenu(type,id,ownerId,name){
  if(ugcNeedLogin())return;
  var quien=name||"este usuario";
  var html='<h3>Opciones</h3><div class="sub">'+escapeHTML(quien)+'</div>'+
    (type!=="profile"?'<button class="btn ghost" id="ugcRep" style="margin-bottom:10px">🚩 Denunciar '+REPORT_LABEL[type]+'</button>':'')+
    '<button class="btn ghost" id="ugcRepUser" style="margin-bottom:10px">🚩 Denunciar al usuario</button>'+
    '<button class="btn danger" id="ugcBlk" style="margin-bottom:10px">🚫 Bloquear a '+escapeHTML(quien)+'</button>'+
    '<button class="linkbtn" style="display:block;margin:4px auto 0" onclick="closeModal()">Cancelar</button>';
  openModal(html,function(){
    if($("ugcRep"))$("ugcRep").addEventListener("click",function(){abrirDenuncia(type,id,ownerId,name);});
    $("ugcRepUser").addEventListener("click",function(){abrirDenuncia("profile",ownerId,ownerId,name);});
    $("ugcBlk").addEventListener("click",function(){bloquearUsuario(ownerId,name);});
  });
}
function abrirDenuncia(type,id,ownerId,name){
  if(ugcNeedLogin())return;
  var opts=REPORT_REASONS.map(function(r,i){return '<label class="rep-opt"><input type="radio" name="repReason" value="'+r[0]+'"'+(i===0?' checked':'')+'> '+r[1]+'</label>';}).join("");
  openModal('<h3>Denunciar '+REPORT_LABEL[type]+'</h3><div class="sub">Lo revisaremos y, si incumple las <a href="condiciones.html" target="_blank" rel="noopener">condiciones de uso</a>, lo retiraremos. La otra persona no sabrá quién lo ha denunciado.</div>'+
    '<div class="rep-opts">'+opts+'</div>'+
    '<div class="field"><label>Comentario (opcional)</label><textarea id="repText" rows="3" maxlength="500" style="width:100%;padding:11px 13px;border-radius:var(--r-m);border:1px solid rgba(148,163,184,.4);font:inherit;background:rgba(var(--blanco),.7);color:var(--texto)" placeholder="Cuéntanos qué pasa"></textarea><small id="repCount" style="font-size:var(--fs-xs);color:var(--suave)">0/500</small></div>'+
    '<button class="btn" id="repSend">Enviar denuncia</button>',function(){
    $("repText").addEventListener("input",function(){$("repCount").textContent=$("repText").value.length+"/500";});
    $("repSend").addEventListener("click",function(){
      var r=document.querySelector('input[name="repReason"]:checked');
      enviarDenuncia(type,id,ownerId,name,r?r.value:"otro",$("repText").value.trim().slice(0,500));
    });
  });
}
async function enviarDenuncia(type,id,ownerId,name,reason,comment){
  var sb=socialClient(); if(!sb||!SOCIAL.user){ugcNeedLogin();return;}
  var btn=$("repSend"); if(btn){btn.disabled=true;btn.textContent="Enviando…";}
  var row={reporter_id:SOCIAL.user.id,target_type:type,target_id:String(id).slice(0,200),target_owner_id:ownerId||null,reason:reason,comment:comment||null};
  var r=await sb.from("content_reports").insert(row);
  if(r.error){
    // sin la tabla (SQL pendiente) o con otro fallo: al buzón de sugerencias para no perder la denuncia
    var msg="[DENUNCIA] tipo="+type+" id="+row.target_id+" autor="+(ownerId||"")+" motivo="+reason+(comment?" comentario: "+comment:"");
    var f=await sb.from("feedback").insert({user_id:SOCIAL.user.id,message:msg.slice(0,2000),context:"content_report"});
    if(f.error){if(btn){btn.disabled=false;btn.textContent="Enviar denuncia";}showToast("No se pudo enviar la denuncia. Inténtalo de nuevo");return;}
  }
  openModal('<h3>Gracias, lo revisaremos</h3><div class="sub">Hemos recibido tu denuncia. Si no quieres seguir viendo lo que publica '+escapeHTML(name||"esta persona")+', también puedes bloquear su cuenta.</div>'+
    (isBlocked(ownerId)?'':'<button class="btn danger" id="repBlk" style="margin-bottom:10px">🚫 Bloquear a '+escapeHTML(name||"este usuario")+'</button>')+
    '<button class="btn ghost" onclick="closeModal()">Cerrar</button>',function(){
    if($("repBlk"))$("repBlk").addEventListener("click",function(){bloquearUsuario(ownerId,name);});
  });
}
async function bloquearUsuario(id,name){
  if(ugcNeedLogin()||!id)return;
  if(id===SOCIAL.user.id){showToast("No puedes bloquearte a ti");return;}
  if(!confirm("¿Bloquear a "+(name||"este usuario")+"? Dejarás de ver sus publicaciones, comentarios, sesiones, ranking y ubicación. Puedes desbloquearlo en Ajustes."))return;
  SOCIAL.blocked[id]={name:name||"",pend:true};blocksSave();
  closeModal();applyBlocks();
  showToast("Has bloqueado a "+(name||"este usuario"));
  var sb=socialClient(); if(!sb)return;
  var r=await sb.from("user_blocks").insert({blocker_id:SOCIAL.user.id,blocked_id:id});
  if((!r.error||r.error.code==="23505")&&SOCIAL.blocked[id]){delete SOCIAL.blocked[id].pend;blocksSave();}
}
async function desbloquearUsuario(id){
  if(!SOCIAL.user||!SOCIAL.blocked[id])return;
  var sb=socialClient();
  if(sb){
    var r=await sb.from("user_blocks").delete().eq("blocker_id",SOCIAL.user.id).eq("blocked_id",id);
    if(r.error&&!tableMissing(r,"user_blocks")&&!SOCIAL.blocked[id].pend){showToast("No se pudo desbloquear");return;}
  }
  var n=SOCIAL.blocked[id].name;
  delete SOCIAL.blocked[id];blocksSave();
  applyBlocks();abrirBloqueados();
  showToast("Has desbloqueado a "+(n||"este usuario"));
}
function abrirBloqueados(){
  if(!SOCIAL.user){showToast("Inicia sesión con la cuenta en la nube para gestionar bloqueos");return;}
  var ids=Object.keys(SOCIAL.blocked||{});
  var lista=ids.length?ids.map(function(id){var n=SOCIAL.blocked[id].name||"Usuario";
      return '<div class="friend-row"><div class="fav">'+socialInitial(n)+'</div><div class="fi"><b>'+escapeHTML(n)+'</b><small>Bloqueado</small></div><div class="factions"><button class="okbtn" onclick="desbloquearUsuario('+jsArg(id)+')">Desbloquear</button></div></div>';}).join("")
    :'<div class="empty-note">No has bloqueado a nadie</div>';
  openModal('<h3>Usuarios bloqueados</h3><div class="sub">No ves su contenido (blog, comentarios, sesiones, ranking ni ubicación). Para bloquear a alguien usa el botón ⋯ junto a lo que publica.</div><div id="blockedList">'+lista+'</div>'+
    '<button class="btn ghost" style="margin-top:12px" onclick="closeModal()">Cerrar</button>');
}
/* ===== BLOG DE LECTURAS (público entre usuarios de la app) ===== */
function timeAgo(iso){
  var s=Math.max(1,Math.round((Date.now()-new Date(iso).getTime())/1000));
  if(s<60)return "hace un momento";
  var m=Math.round(s/60);if(m<60)return "hace "+m+" min";
  var h=Math.round(m/60);if(h<24)return "hace "+h+" h";
  var d=Math.round(h/24);return "hace "+d+" d";
}
async function renderBlog(){
  var note=$("blogNote"),list=$("blogList"); if(!note||!list)return;
  await cargarSupabase();
  var sb=socialClient();
  if(!sb){
    note.classList.remove("hidden");
    note.innerHTML='Modo local: pega tus claves de <b>Supabase</b> en <code>SUPABASE_URL</code> y <code>SUPABASE_ANON_KEY</code> para que tu blog sea público y lo lean otros usuarios.';
    list.innerHTML='<div class="empty-note">Configura Supabase para ver y publicar en el blog</div>';
    return;
  }
  note.classList.add("hidden");
  list.innerHTML='<div class="empty-note">Cargando…</div>';
  var res=await sb.from("book_posts").select("*").order("created_at",{ascending:false}).limit(50);
  if(res.error){list.innerHTML='<div class="empty-note">No se pudo cargar el blog</div>';return;}
  SOCIAL.blogPosts=res.data||[];
  renderBlogList();
}
function renderBlogList(){
  var list=$("blogList"); if(!list)return;
  var posts=filterBlocked(SOCIAL.blogPosts,"user_id");
  if(!posts.length){list.innerHTML='<div class="empty-note">'+(SOCIAL.blogPosts.length?'No hay publicaciones que mostrar (las de usuarios bloqueados están ocultas)':'Nadie ha publicado todavía. ¡Sé el primero!')+'</div>';return;}
  var me=SOCIAL.user&&SOCIAL.user.id;
  var bookSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5c2-1.5 5-2 7-1v14c-2-1-5-.5-7 1V5z"/><path d="M22 5c-2-1.5-5-2-7-1v14c2-1 5-.5 7 1V5z"/></svg>';
  list.innerHTML=posts.map(function(p){
    return '<div class="book-post">'+
      '<div class="bp-head"><div class="avatar" style="width:34px;height:34px;font-size:var(--fs-base);flex-shrink:0">'+socialInitial(p.author_name)+'</div>'+
      '<div class="bp-who"><b>'+escapeHTML(p.author_name||"Alguien")+'</b><small>'+timeAgo(p.created_at)+'</small></div>'+
      (p.user_id!==me?ugcMoreBtn("book_post",p.id,p.user_id,p.author_name):'')+'</div>'+
      '<div class="bp-title"><span class="bp-icon">'+bookSvg+'</span>'+escapeHTML(p.book_title)+'</div>'+
      '<div class="bp-comment">'+escapeHTML(p.comment)+'</div></div>';
  }).join("");
}
async function postBlog(){
  var sb=socialClient(); if(!sb||!SOCIAL.user){showToast("Configura Supabase e inicia sesión para publicar");return;}
  var book=$("blogBook").value.trim(), comment=$("blogComment").value.trim();
  if(!book||!comment){showToast("Pon el libro y tu comentario");return;}
  var name=(SOCIAL.profile&&SOCIAL.profile.name)||CURRENT.split("@")[0];
  var ins=await sb.from("book_posts").insert({user_id:SOCIAL.user.id,author_name:name,book_title:book,comment:comment});
  if(ins.error){showToast("No se pudo publicar: "+ins.error.message);return;}
  $("blogBook").value="";$("blogComment").value="";
  if(DATA&&!DATA.badges.first_post){DATA.badges.first_post=new Date().toISOString();saveUserData();}
  showToast("Publicado");renderBlog();
}
async function socialLoadFriends(){
  var sb=socialClient(), me=SOCIAL.user.id; if(!sb)return;
  var fs=await sb.from("friendships").select("*").or("requester_id.eq."+me+",addressee_id.eq."+me).order("created_at",{ascending:false});
  if(fs.error){console.warn(fs.error);return;}
  var rows=fs.data||[];
  var ids=[]; rows.forEach(function(r){ids.push(r.requester_id===me?r.addressee_id:r.requester_id);});
  ids=[...new Set(ids)];
  var profs=[];
  if(ids.length){var pr=await sb.from("profiles").select("id,name,friend_code").in("id",ids); if(!pr.error)profs=pr.data||[];}
  function prof(id){return profs.filter(function(p){return p.id===id;})[0]||{id:id,name:"Amigo"};}
  SOCIAL.friends=rows.filter(function(r){return r.status==="accepted";}).map(function(r){var oid=r.requester_id===me?r.addressee_id:r.requester_id;return {row:r,profile:prof(oid)};});
  SOCIAL.requests=rows.filter(function(r){return r.status==="pending"&&r.addressee_id===me;}).map(function(r){return {row:r,profile:prof(r.requester_id)};});
  SOCIAL.sent=rows.filter(function(r){return r.status==="pending"&&r.requester_id===me;}).map(function(r){return {row:r,profile:prof(r.addressee_id)};});
}
async function socialAddFriendFromInput(){
  var code=$("friendCodeInput").value.trim().toUpperCase();
  if(!code){showToast("Pega el código de tu amigo");return;}
  var sb=socialClient(); if(!sb||!SOCIAL.user){showToast("Configura Supabase e inicia sesión");return;}
  if(SOCIAL.profile&&code===String(SOCIAL.profile.friend_code).toUpperCase()){showToast("Ese es tu propio código");return;}
  var pr=await sb.from("profiles").select("id,name,friend_code").eq("friend_code",code).maybeSingle();
  if(pr.error||!pr.data){showToast("No encuentro ese código");return;}
  var other=pr.data.id, me=SOCIAL.user.id;
  var a=await sb.from("friendships").select("id,status").eq("requester_id",me).eq("addressee_id",other).maybeSingle();
  var b=await sb.from("friendships").select("id,status").eq("requester_id",other).eq("addressee_id",me).maybeSingle();
  if(a.data||b.data){showToast("Ya existe una solicitud o amistad con esa persona");return;}
  var ins=await sb.from("friendships").insert({requester_id:me,addressee_id:other,status:"pending"});
  if(ins.error){showToast("No se pudo enviar: "+ins.error.message);return;}
  $("friendCodeInput").value="";showToast("Solicitud enviada a "+(pr.data.name||"tu amigo"));socialRefreshAll();
}
async function socialAcceptFriend(id){
  var sb=socialClient(); if(!sb)return;
  var r=await sb.from("friendships").update({status:"accepted"}).eq("id",id).eq("addressee_id",SOCIAL.user.id);
  if(r.error)showToast("No se pudo aceptar"); else{showToast("Amigo añadido");socialRefreshAll();}
}
async function socialRejectFriend(id){
  var sb=socialClient(); if(!sb)return;
  var r=await sb.from("friendships").delete().eq("id",id);
  if(r.error)showToast("No se pudo borrar"); else{showToast("Solicitud eliminada");socialRefreshAll();}
}
async function socialHeartbeat(){
  var sb=socialClient(); if(!sb||!SOCIAL.user||!DATA)return;
  // started_at/bib_index se envían siempre: el upsert solo toca las columnas enviadas y, si no, quedaba
  // el valor viejo y la sala seguía mostrando a alguien que ya había terminado.
  // Privacidad: solo se envía el índice de la biblioteca de la lista, nunca coordenadas.
  var payload={user_id:SOCIAL.user.id,sharing:false,room_code:SOCIAL.room?SOCIAL.room.code:null,updated_at:new Date().toISOString(),started_at:null,bib_index:null};
  var comparte=presenciaPermitida();
  if(comparte){
    payload.sharing=true;payload.bib_index=studyTimer.bibIndex;payload.started_at=new Date(studyTimer.start).toISOString();
  }
  if(SOCIAL.room&&studyTimer.running){
    payload.started_at=new Date(studyTimer.start).toISOString();
    // en la sala solo se ve tu biblioteca si compartes presencia (la sala puede tener desconocidos con el código)
    if(comparte)payload.bib_index=studyTimer.bibIndex;
  }
  await sb.from("presence").upsert(payload,{onConflict:"user_id"});
}
// Presencia de amigos: caduca a las 4 h o cuando cierra la biblioteca (también lo filtra la política RLS en SQL).
var PRESENCIA_MAX_MS=4*60*60*1000;
function bibCerradaAhora(b){return !!b&&!b.sinHorario&&!estadoBib(b);}
// ¿Puedo compartir ahora mi biblioteca? Opción activada, sin modo invisible, cronómetro en marcha
// en una biblioteca de la lista, menos de 4 h de sesión y biblioteca abierta.
function presenciaPermitida(){
  if(!DATA||!DATA.sharePresence||DATA.invisible)return false;
  if(!studyTimer.running||!(studyTimer.bibIndex>=0))return false;
  if(Date.now()-studyTimer.start>PRESENCIA_MAX_MS)return false;
  return !bibCerradaAhora(BIBLIOTECAS[studyTimer.bibIndex]);
}
// Qué presencias de amigos se muestran: solo recientes (<4 h) y en bibliotecas que no estén cerradas ahora.
function presenciaVigente(p,ahora){
  if(!p||!p.sharing||!(p.bib_index>=0))return false;
  var b=BIBLIOTECAS[p.bib_index]; if(!b)return false;
  var t=new Date(p.updated_at).getTime(); if(!(t>0))return false;
  if((ahora||Date.now())-t>PRESENCIA_MAX_MS)return false;
  return !bibCerradaAhora(b);
}
function presenciasVisibles(rows){return filterBlocked((rows||[]).filter(function(p){return presenciaVigente(p);}),"user_id");}
// Al cerrar la app: apaga la presencia con una petición keepalive (supabase-js no garantiza terminar al cerrar).
function socialClearPresenceOnExit(){
  try{
    if(!SOCIAL.user||!socialKeysOk())return;
    var ref=(SUPABASE_URL.match(/^https:\/\/([^.]+)\./)||[])[1];
    var raw=ref&&localStorage.getItem("sb-"+ref+"-auth-token"); if(!raw)return;
    var tok=(JSON.parse(raw)||{}).access_token; if(!tok)return;
    fetch(SUPABASE_URL+"/rest/v1/presence?on_conflict=user_id",{method:"POST",keepalive:true,
      headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+tok,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"},
      body:JSON.stringify({user_id:SOCIAL.user.id,sharing:false,started_at:null,bib_index:null,room_code:null,updated_at:new Date().toISOString()})});
  }catch(e){}
}
window.addEventListener("pagehide",socialClearPresenceOnExit);
async function socialClearPresence(){
  if(!socialClient()||!SOCIAL.user)return;
  await socialClient().from("presence").upsert({user_id:SOCIAL.user.id,sharing:false,started_at:null,bib_index:null,updated_at:new Date().toISOString()},{onConflict:"user_id"});
}
async function socialLoadPresence(){
  var sb=socialClient(); if(!sb||!SOCIAL.user)return;
  var ids=SOCIAL.friends.map(function(f){return f.profile.id;});
  if(!ids.length){SOCIAL.presence=[];SOCIAL.presenceAll=[];return;}
  var cutoff=new Date(Date.now()-PRESENCIA_MAX_MS).toISOString();
  var res=await sb.from("presence").select("user_id,bib_index,sharing,updated_at,started_at").in("user_id",ids).eq("sharing",true).gte("updated_at",cutoff);
  if(res.error){console.warn(res.error);SOCIAL.presence=[];SOCIAL.presenceAll=[];return;}
  SOCIAL.presenceAll=res.data||[];
  SOCIAL.presence=presenciasVisibles(SOCIAL.presenceAll);
}
/* ===== SESIONES DE ESTUDIO EN GRUPO ===== */
async function createStudyRoom(name){
  var sb=socialClient(); if(!sb||!SOCIAL.user){showToast("Necesitas Supabase configurado e iniciar sesión");return;}
  var ins=await sb.from("study_rooms").insert({owner_id:SOCIAL.user.id,name:(name||"").trim()||"Sala de estudio"}).select("*").single();
  if(ins.error){showToast("No se pudo crear la sala: "+ins.error.message);return;}
  SOCIAL.room={code:ins.data.code,name:ins.data.name};
  if(DATA&&!DATA.badges.first_room){DATA.badges.first_room=new Date().toISOString();saveUserData();}
  await socialHeartbeat();
  await loadRoomMembers();
  renderStudyRoom();
  showToast("Sala creada: "+ins.data.code);
}
async function joinStudyRoom(code){
  var sb=socialClient(); if(!sb||!SOCIAL.user){showToast("Necesitas Supabase configurado e iniciar sesión");return;}
  code=(code||"").trim().toUpperCase(); if(!code){showToast("Escribe un código de sala");return;}
  // join_study_room (SQL nuevo); si aún no existe, consulta directa como antes
  var r=await sb.rpc("join_study_room",{p_code:code});
  if(r.error){r=await sb.from("study_rooms").select("*").eq("code",code).maybeSingle();}
  else{r={data:(r.data&&r.data[0])||null};}
  if(r.error||!r.data){showToast("No encuentro esa sala");return;}
  SOCIAL.room={code:r.data.code,name:r.data.name};
  if(DATA&&!DATA.badges.first_room){DATA.badges.first_room=new Date().toISOString();saveUserData();}
  await socialHeartbeat();
  await loadRoomMembers();
  renderStudyRoom();
  showToast("Te uniste a "+r.data.name);
}
async function leaveStudyRoom(){
  SOCIAL.room=null;SOCIAL.roomMembers=[];
  await socialHeartbeat();
  renderStudyRoom();
  showToast("Has salido de la sala");
}
async function loadRoomMembers(){
  var sb=socialClient(); if(!sb||!SOCIAL.room){SOCIAL.roomMembers=[];return;}
  var cutoff=new Date(Date.now()-10*60000).toISOString();
  var res=await sb.from("presence").select("user_id,bib_index,started_at,updated_at").eq("room_code",SOCIAL.room.code).not("started_at","is",null).gte("updated_at",cutoff);
  if(res.error){SOCIAL.roomMembers=[];return;}
  var rows=res.data||[];
  var ids=rows.map(function(r){return r.user_id;});
  var names={};
  if(ids.length){var pr=await sb.from("profiles").select("id,name").in("id",ids); if(!pr.error)(pr.data||[]).forEach(function(p){names[p.id]=p.name;});}
  SOCIAL.roomMembers=rows.map(function(r){return {id:r.user_id,name:names[r.user_id]||"Alguien",bib_index:r.bib_index,started_at:r.started_at};})
    .sort(function(a,b){return new Date(a.started_at)-new Date(b.started_at);});
}
function elapsedSince(iso){
  var sec=Math.max(0,Math.floor((Date.now()-new Date(iso).getTime())/1000));
  var mm=Math.floor(sec/60),ss=sec%60;
  return String(mm).padStart(2,"0")+":"+String(ss).padStart(2,"0");
}
function renderStudyRoom(){
  var card=$("roomCard"); if(!card)return;
  var sb=socialClient();
  if(!sb||!SOCIAL.user){
    card.innerHTML='<div class="section-title" style="margin-top:0">👥 Sesión en grupo</div><div class="empty-note">'+(socialKeysOk()?'Crea una cuenta (gratis y opcional) para estudiar en grupo con tus amigos.':'Configura Supabase para estudiar en grupo con tus amigos.')+'</div>';
    return;
  }
  if(!SOCIAL.room){
    card.innerHTML='<div class="section-title" style="margin-top:0">👥 Sesión en grupo</div>'+
      '<div class="page-sub" style="margin-bottom:12px">Crea una sala y comparte el código, o únete a la de un amigo.</div>'+
      '<div class="field"><label>Nombre de la sala (opcional)</label><input type="text" id="roomNameInput" placeholder="Ej: Repaso de Cálculo"></div>'+
      '<button class="btn sm" id="btnCreateRoom" style="margin-bottom:16px">Crear sala</button>'+
      '<div class="field"><label>Unirse con código</label><input type="text" id="roomCodeInput" placeholder="Ej: A1B2C3" style="text-transform:uppercase"></div>'+
      '<button class="btn sm ghost" id="btnJoinRoom">Unirse</button>';
    $("btnCreateRoom").addEventListener("click",function(){createStudyRoom($("roomNameInput").value);});
    $("btnJoinRoom").addEventListener("click",function(){joinStudyRoom($("roomCodeInput").value);});
    return;
  }
  var miembros=filterBlocked(SOCIAL.roomMembers,"id");
  var membersHTML=miembros.length
    ? miembros.map(function(m){
        var lugar=BIBLIOTECAS[m.bib_index]?BIBLIOTECAS[m.bib_index].nombre.replace("Biblioteca ","").replace("Pública ",""):"—";
        return '<div class="pray-row"><div class="pi"><b>'+escapeHTML(m.name)+'</b><small>'+escapeHTML(lugar)+'</small></div><span class="tabular" style="font-family:var(--mono,monospace);font-weight:800;color:var(--acento-tx)">'+elapsedSince(m.started_at)+'</span></div>';
      }).join("")
    : '<div class="empty-note">Nadie está estudiando en la sala ahora mismo</div>';
  card.innerHTML='<div class="section-title" style="margin-top:0">👥 '+escapeHTML(SOCIAL.room.name)+'</div>'+
    '<div class="codebox"><span style="font-size:var(--fs-s);color:var(--suave);font-weight:800">Código</span><code>'+escapeHTML(SOCIAL.room.code)+'</code><button class="btn sm ghost" id="btnCopyRoomCode" style="width:auto">Copiar</button></div>'+
    membersHTML+
    '<button class="btn sm danger" id="btnLeaveRoom" style="margin-top:10px">Salir de la sala</button>';
  $("btnCopyRoomCode").addEventListener("click",function(){navigator.clipboard.writeText(SOCIAL.room.code);showToast("Código copiado");});
  $("btnLeaveRoom").addEventListener("click",leaveStudyRoom);
}
/* ===== SESIONES COMPARTIDAS + KUDOS (feed de amigos, estilo Strava) ===== */
// Si la BD aún no tiene las columnas subject/focus (SQL sin actualizar), dejamos de enviarlas
var SHARE_NO_SUBJECT_FOCUS=false;
async function socialShareSession(saved){
  var sb=socialClient(); if(!sb||!SOCIAL.user||!DATA||!DATA.sharePresence)return;
  var payload={owner_id:SOCIAL.user.id,local_id:saved.id,bib_name:saved.bib,minutes:saved.min,date:saved.date,note:saved.note||null,offering:extrasOn()?saved.offering||null:null,verif:!!saved.verif,prod:saved.prod||null};
  if(!SHARE_NO_SUBJECT_FOCUS){payload.subject=saved.subject||null;payload.focus=(saved.focus==="ok"||saved.focus==="withered")?saved.focus:null;}
  var res=await sb.from("shared_sessions").upsert(payload,{onConflict:"owner_id,local_id"});
  var err=res&&res.error;
  if(err&&!SHARE_NO_SUBJECT_FOCUS&&(err.code==="PGRST204"||/subject|focus|column/i.test(err.message||""))){
    SHARE_NO_SUBJECT_FOCUS=true;
    delete payload.subject;delete payload.focus;
    await sb.from("shared_sessions").upsert(payload,{onConflict:"owner_id,local_id"});
  }
}
async function socialLoadFriendSessions(){
  var sb=socialClient(); if(!sb||!SOCIAL.user)return;
  var ids=SOCIAL.friends.map(function(f){return f.profile.id;});
  if(!ids.length){SOCIAL.friendSessions=[];return;}
  var res=await sb.from("shared_sessions").select("*").in("owner_id",ids).order("created_at",{ascending:false}).limit(30);
  if(res.error){SOCIAL.friendSessions=[];return;}
  SOCIAL.friendSessions=res.data||[];
}
async function socialLoadKudos(){
  var sb=socialClient(); if(!sb)return;
  var ids=SOCIAL.friendSessions.map(function(s){return s.local_id;});
  if(!ids.length){SOCIAL.kudosCounts={};SOCIAL.kudosByMe={};return;}
  var res=await sb.from("kudos").select("session_local_id,giver_id").in("session_local_id",ids);
  var counts={},mine={};
  if(!res.error&&res.data)res.data.forEach(function(r){counts[r.session_local_id]=(counts[r.session_local_id]||0)+1;if(SOCIAL.user&&r.giver_id===SOCIAL.user.id)mine[r.session_local_id]=true;});
  SOCIAL.kudosCounts=counts;SOCIAL.kudosByMe=mine;
}
async function giveKudos(localId,ownerId){
  var sb=socialClient(); if(!sb||!SOCIAL.user){showToast("Necesitas Supabase configurado e iniciar sesión");return;}
  var name=(SOCIAL.profile&&SOCIAL.profile.name)||"Alguien";
  var ins=await sb.from("kudos").insert({session_local_id:localId,session_owner_id:ownerId,giver_id:SOCIAL.user.id,giver_name:name});
  if(ins.error&&ins.error.code!=="23505"){showToast("No se pudo dar kudos");return;}
  if(!ins.error)registrarAccion("social");
  await socialLoadKudos();
  renderSessionFeed();
}
/* ===== COMENTARIOS EN SESIONES (estilo comentarios de actividad de Strava) =====
   Tabla session_comments (ver supabase/supabase_social.sql). Si aún no existe en Supabase,
   se marca SOCIAL.commentsOk=false y la UI de comentarios se oculta en silencio. */
var COMMENT_MAX=500;
function commentsAvailable(){return !!(socialClient()&&SOCIAL.user&&SOCIAL.commentsOk);}
function commentTableMissing(res){
  var e=res&&res.error; if(!e)return false;
  return res.status===404||e.code==="42P01"||e.code==="PGRST205"||(/session_comments/.test(e.message||"")&&/(does not exist|schema cache)/.test(e.message||""));
}
async function socialLoadComments(ids){
  var sb=socialClient(); if(!sb||!SOCIAL.user||!SOCIAL.commentsOk||!ids.length)return;
  var res=await sb.from("session_comments").select("*").in("session_local_id",ids).order("created_at",{ascending:true});
  if(res.error){if(commentTableMissing(res))SOCIAL.commentsOk=false;return;}
  ids.forEach(function(id){SOCIAL.comments[id]=[];});
  (res.data||[]).forEach(function(r){(SOCIAL.comments[r.session_local_id]=SOCIAL.comments[r.session_local_id]||[]).push(r);});
}
async function socialLoadFriendComments(){
  await socialLoadComments(SOCIAL.friendSessions.map(function(s){return s.local_id;}));
}
async function socialLoadMyComments(){
  if(!DATA||!commentsAvailable())return;
  SOCIAL.myCommentsAt=Date.now();
  await socialLoadComments(DATA.sessions.slice(-20).map(function(s){return s.id;}).filter(Boolean));
}
function commentsFor(localId,ownerId){
  return (SOCIAL.comments[localId]||[]).filter(function(c){return c.session_owner_id===ownerId&&!isBlocked(c.author_id);});
}
function commentButtonHTML(localId,ownerId){
  if(!commentsAvailable())return "";
  var n=commentsFor(localId,ownerId).length, open=!!SOCIAL.commentsOpen[localId];
  return '<button class="kudos-btn cmt-btn'+(open?" on":"")+'" data-cmt-toggle="'+escapeHTML(localId)+'" aria-expanded="'+open+'">💬 '+(n?n:"Comentar")+'</button>';
}
function commentThreadHTML(localId,ownerId){
  if(!commentsAvailable()||!SOCIAL.commentsOpen[localId])return "";
  var me=SOCIAL.user.id, list=commentsFor(localId,ownerId);
  var html='<div class="cmt-thread">';
  if(!list.length)html+='<div class="cmt-empty">Aún no hay comentarios. ¡Sé el primero en animar!</div>';
  list.forEach(function(c){
    var puede=c.author_id===me||c.session_owner_id===me;
    html+='<div class="cmt"><div class="cmt-av">'+socialInitial(c.author_name)+'</div><div class="cmt-body"><b>'+escapeHTML(c.author_name||"Alguien")+'</b><small>'+escapeHTML(timeAgo(c.created_at))+'</small><p>'+escapeHTML(c.body)+'</p></div>'+
      (c.author_id!==me?ugcMoreBtn("session_comment",c.id,c.author_id,c.author_name):'')+
      (puede?'<button class="cmt-del" title="Borrar comentario" aria-label="Borrar comentario" data-cmt-del="'+escapeHTML(c.id)+'" data-cmt-sid="'+escapeHTML(localId)+'">×</button>':'')+'</div>';
  });
  html+='<div class="cmt-form"><input type="text" maxlength="'+COMMENT_MAX+'" placeholder="Escribe un comentario…" aria-label="Escribe un comentario" data-cmt-input="'+escapeHTML(localId)+'" value="'+escapeHTML(SOCIAL.commentDrafts[localId]||"")+'">'+
    '<button class="btn sm" data-cmt-send="'+escapeHTML(localId)+'" data-cmt-owner="'+escapeHTML(ownerId)+'">Enviar</button></div></div>';
  return html;
}
async function postComment(localId,ownerId){
  var sb=socialClient(); if(!sb||!SOCIAL.user){showToast("Necesitas Supabase configurado e iniciar sesión");return;}
  var body=String(SOCIAL.commentDrafts[localId]||"").trim();
  if(!body){showToast("Escribe algo antes de enviar");return;}
  if(body.length>COMMENT_MAX){showToast("Máximo "+COMMENT_MAX+" caracteres");return;}
  var name=(SOCIAL.profile&&SOCIAL.profile.name)||"Alguien";
  var ins=await sb.from("session_comments").insert({session_local_id:localId,session_owner_id:ownerId,author_id:SOCIAL.user.id,author_name:name,body:body});
  if(ins.error){
    if(commentTableMissing(ins)){SOCIAL.commentsOk=false;renderSessionFeed(true);return;}
    showToast("No se pudo enviar el comentario");return;
  }
  SOCIAL.commentDrafts[localId]="";
  await socialLoadComments([localId]);
  renderSessionFeed(true);
}
async function deleteComment(id,localId){
  var sb=socialClient(); if(!sb||!SOCIAL.user)return;
  if(!confirm("¿Borrar este comentario?"))return;
  var del=await sb.from("session_comments").delete().eq("id",id);
  if(del.error){showToast("No se pudo borrar el comentario");return;}
  await socialLoadComments([localId]);
  renderSessionFeed(true);
}
function initCommentEvents(){
  var el=$("sessionFeed"); if(!el)return;
  el.addEventListener("click",function(e){
    var t=e.target.closest("[data-cmt-toggle],[data-cmt-send],[data-cmt-del]"); if(!t)return;
    if(t.dataset.cmtToggle!=null){var id=t.dataset.cmtToggle;SOCIAL.commentsOpen[id]=!SOCIAL.commentsOpen[id];renderSessionFeed(true);
      if(SOCIAL.commentsOpen[id]){var inp=el.querySelector('[data-cmt-input="'+CSS.escape(id)+'"]');if(inp)inp.focus();}}
    else if(t.dataset.cmtSend!=null){postComment(t.dataset.cmtSend,t.dataset.cmtOwner);}
    else if(t.dataset.cmtDel!=null){deleteComment(t.dataset.cmtDel,t.dataset.cmtSid);}
  });
  el.addEventListener("input",function(e){if(e.target.dataset&&e.target.dataset.cmtInput!=null)SOCIAL.commentDrafts[e.target.dataset.cmtInput]=e.target.value;});
  el.addEventListener("keydown",function(e){
    if(e.key!=="Enter"||!e.target.dataset||e.target.dataset.cmtInput==null)return;
    e.preventDefault();var b=e.target.parentNode.querySelector("[data-cmt-send]");if(b)b.click();
  });
}
async function socialLoadLeaderboard(){
  var sb=socialClient(); if(!sb||!SOCIAL.user)return;
  var ids=SOCIAL.friends.map(function(f){return f.profile.id;}); ids.push(SOCIAL.user.id);
  var now=new Date(),day=(now.getDay()+6)%7,monday=new Date(now);monday.setDate(now.getDate()-day);monday.setHours(0,0,0,0);
  var res=await sb.from("shared_sessions").select("owner_id,minutes,date").in("owner_id",ids).gte("date",ymd(monday));
  if(res.error){SOCIAL.leaderboard=[];SOCIAL.lbRows=[];return;}
  SOCIAL.lbRows=res.data||[];
  computeLeaderboard();
}
var lbPeriod="week";
function computeLeaderboard(){
  if(!SOCIAL.user)return;
  var hoy=ymd(), totals={};
  (SOCIAL.lbRows||[]).forEach(function(r){if(lbPeriod==="day"&&r.date!==hoy)return;if(isBlocked(r.owner_id))return;totals[r.owner_id]=(totals[r.owner_id]||0)+r.minutes;});
  var arr=Object.keys(totals).map(function(id){return {id:id,min:totals[id],name:id===SOCIAL.user.id?"Tú":socialNameById(id)};});
  arr.sort(function(a,b){return b.min-a.min;});
  SOCIAL.leaderboard=arr;
}
function renderLeaderboard(){
  var el=$("leaderboardList"); if(!el)return;
  if(!socialClient()||!SOCIAL.user){el.innerHTML='<div class="empty-note">'+(socialKeysOk()?'Con una cuenta (opcional) y amigos verás aquí el ranking':'Configura Supabase para ver el ranking con amigos')+'</div>';return;}
  if(!SOCIAL.leaderboard.length){el.innerHTML='<div class="empty-note">Sin datos '+(lbPeriod==="day"?"de hoy":"de esta semana")+' todavía (necesitas amigos y sesiones compartidas)</div>';return;}
  // Podio (Duolingo/Strava): los tres primeros con medalla y columna proporcional; el resto, con barra.
  var L=SOCIAL.leaderboard, max=L[0].min||1, yo=-1;L.forEach(function(p,i){if(p.id===SOCIAL.user.id)yo=i;});
  var MED=["🥇","🥈","🥉"], orden=[1,0,2].filter(function(k){return L[k];});
  var podio='<div class="podio">'+orden.map(function(k){var p=L[k],alt=40+Math.round(p.min/max*70);
    return '<div class="pd-col'+(p.id===SOCIAL.user.id?' yo':'')+' pd-'+(k+1)+'"><div class="pd-med">'+MED[k]+'</div><div class="pd-av" style="background:'+colorDe(p.id)+'">'+escapeHTML(p.name.charAt(0).toUpperCase())+'</div>'+
      '<b>'+escapeHTML(p.name.split(" ")[0])+'</b><small>'+hMin(p.min)+'</small><div class="pd-bar" style="--h:'+alt+'px">'+(k+1)+'</div></div>';}).join("")+'</div>';
  var resto=L.slice(3).map(function(p,i){var k=i+3;
    return '<div class="lb-row'+(p.id===SOCIAL.user.id?' yo':'')+'"><div class="rank">'+(k+1)+'</div><div class="ni"><b>'+escapeHTML(p.name)+'</b><div class="lb-bar"><i style="width:'+Math.max(4,Math.round(p.min/max*100))+'%"></i></div></div><small>'+hMin(p.min)+'</small></div>';}).join("");
  var pique="";
  if(yo>0){var dif=L[yo-1].min-L[yo].min+1;pique='<div class="lb-pique">⚡ Te faltan <b>'+hMin(dif)+'</b> para adelantar a <b>'+escapeHTML(L[yo-1].name)+'</b></div>';}
  else if(yo===0&&L.length>1){pique='<div class="lb-pique top">👑 ¡Vas primero! '+escapeHTML(L[1].name)+' está a '+hMin(L[0].min-L[1].min)+'</div>';}
  else if(yo<0)pique='<div class="lb-pique">🌱 Estudia y comparte una sesión para entrar en el ranking</div>';
  el.innerHTML=podio+pique+resto;
}
async function socialShareEvent(ev){
  var sb=socialClient(); if(!sb||!SOCIAL.user)return;
  var payload={owner_id:SOCIAL.user.id,local_id:ev.id,title:ev.title,type:ev.type,date:ev.date,time:ev.time||null,place:ev.place||null,url:ev.url||null};
  var r=await sb.from("shared_events").upsert(payload,{onConflict:"owner_id,local_id"});
  if(r.error)showToast("Evento guardado localmente, pero no compartido: "+r.error.message);
}
async function socialDeleteSharedEvent(ev){
  var sb=socialClient(); if(!sb||!SOCIAL.user||!ev||!ev.id)return;
  await sb.from("shared_events").delete().eq("owner_id",SOCIAL.user.id).eq("local_id",ev.id);
}
async function socialLoadFriendEvents(){
  var sb=socialClient(); if(!sb||!SOCIAL.user)return;
  var ids=SOCIAL.friends.map(function(f){return f.profile.id;});
  if(!ids.length){SOCIAL.events=[];return;}
  var today=ymd();
  var res=await sb.from("shared_events").select("*").in("owner_id",ids).gte("date",today).order("date",{ascending:true}).limit(30);
  if(res.error){console.warn(res.error);SOCIAL.events=[];SOCIAL.eventsAll=[];return;}
  SOCIAL.eventsAll=res.data||[];
  SOCIAL.events=filterBlocked(SOCIAL.eventsAll,"owner_id");
}
function socialPresenceFor(id){return SOCIAL.presence.filter(function(p){return p.user_id===id;})[0]||null;}
function socialRenderPanel(err){
  var note=$("socialNote"); if(!note)return;
  var chk=$("chkSharePresence"); if(chk)chk.checked=!!(DATA&&DATA.sharePresence);
  if(!socialKeysOk()){
    note.innerHTML='Modo local: pega tus claves de <b>Supabase</b> en <code>SUPABASE_URL</code> y <code>SUPABASE_ANON_KEY</code> para que amigos, ubicación y eventos se sincronicen entre móviles.';
    $("friendCode").textContent="SIN CONFIG";
    return;
  }
  if(!err&&!SOCIAL.user){
    note.innerHTML='Para añadir amigos, ver su calendario y dónde estudian necesitas una cuenta (gratis y opcional). El resto de la app funciona sin ella.<br><button class="btn sm" style="margin-top:10px" onclick="abrirLogin(\'reg\')">Crear cuenta</button> <button class="btn sm ghost" style="margin-top:10px" onclick="abrirLogin(\'login\')">Iniciar sesión</button>';
    $("friendCode").textContent="—";
  }
  else if(err){note.textContent=err;}
  else{note.innerHTML='Social activo. Solo tus amigos aceptados pueden ver tu biblioteca actual y los eventos que marques como compartidos.';}
  $("friendCode").textContent=SOCIAL.profile?SOCIAL.profile.friend_code:"—";
  var req=$("friendRequests"); if(req){
    if(!SOCIAL.requests.length&&!SOCIAL.sent.length){req.innerHTML='<div class="empty-note">Sin solicitudes pendientes</div>';}
    else{
      var html="";
      SOCIAL.requests.filter(function(x){return !isBlocked(x.profile.id);}).forEach(function(x){html+='<div class="friend-row"><div class="fav">'+socialInitial(x.profile.name)+'</div><div class="fi"><b>'+escapeHTML(x.profile.name||"Amigo")+'</b><small>Quiere añadirte</small></div><div class="factions"><button class="okbtn" onclick="socialAcceptFriend('+jsArg(x.row.id)+')">Aceptar</button><button class="nobtn" onclick="socialRejectFriend('+jsArg(x.row.id)+')">Borrar</button></div></div>';});
      SOCIAL.sent.forEach(function(x){html+='<div class="friend-row"><div class="fav">'+socialInitial(x.profile.name)+'</div><div class="fi"><b>'+escapeHTML(x.profile.name||"Amigo")+'</b><small>Solicitud enviada, pendiente de aceptar</small></div><div class="factions"><button class="nobtn" onclick="socialRejectFriend('+jsArg(x.row.id)+')">Cancelar</button></div></div>';});
      req.innerHTML=html;
    }
  }
  var fl=$("friendsList"); if(fl){
    var amigosVis=SOCIAL.friends.filter(function(f){return !isBlocked(f.profile.id);});
    if(!amigosVis.length){fl.innerHTML='<div class="empty-note">'+(SOCIAL.friends.length?'Los amigos que has bloqueado no aparecen aquí (Ajustes → Usuarios bloqueados)':'Aún no has añadido amigos')+'</div>';}
    else{
      fl.innerHTML=amigosVis.map(function(f){
        var p=socialPresenceFor(f.profile.id), loc='No está compartiendo ubicación ahora';
        var mapbtn='';
        if(p&&BIBLIOTECAS[p.bib_index]){var age=Math.round((Date.now()-new Date(p.updated_at).getTime())/60000);loc='Está en '+BIBLIOTECAS[p.bib_index].nombre.replace("Biblioteca ","").replace("Pública ","")+' · hace '+Math.max(0,age)+' min';mapbtn='<button class="mapbtn" onclick="socialGoFriend('+jsArg(f.profile.id)+')">Mapa</button>';}
        return '<div class="friend-row"><div class="fav">'+socialInitial(f.profile.name)+'</div><div class="fi"><b>'+escapeHTML(f.profile.name||"Amigo")+'</b><small>'+escapeHTML(loc)+'</small></div><div class="factions"><button class="mapbtn" title="Ver su bosque" onclick="verBosqueAmigo('+jsArg(f.profile.id)+')">🌳</button>'+mapbtn+ugcMoreBtn("profile",f.profile.id,f.profile.id,f.profile.name||"Amigo")+'<button class="nobtn" title="Quitar de amigos" onclick="socialRemoveFriend('+jsArg(f.row.id)+','+jsArg(f.profile.name||"este amigo")+')">✕</button></div></div>';
      }).join("");
    }
  }
}
async function socialRemoveFriend(rowId,name){
  if(!confirm("¿Quitar a "+name+" de tus amigos? Dejaréis de ver vuestra actividad."))return;
  var sb=socialClient(); if(!sb)return;
  var r=await sb.from("friendships").delete().eq("id",rowId);
  if(r.error)showToast("No se pudo quitar"); else{showToast("Amigo eliminado");socialRefreshAll();}
}
function socialGoFriend(id){
  var p=socialPresenceFor(id); if(!p||!BIBLIOTECAS[p.bib_index]){showToast("Ese amigo no está compartiendo ubicación ahora");return;}
  goView("map");
  if(window.__selBib)window.__selBib(p.bib_index);
}
function socialRenderFriendEvents(){
  var title=$("friendEvtTitle"), card=$("friendEvtCard"), list=$("friendEvtList"); if(!title||!card||!list)return;
  if(!SOCIAL.events.length){title.classList.add("hidden");card.classList.add("hidden");return;}
  title.classList.remove("hidden");card.classList.remove("hidden");
  list.innerHTML=SOCIAL.events.map(function(ev){
    var d=new Date(ev.date+"T00:00:00"), dd=String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0");
    var who=socialNameById(ev.owner_id);
    var prayBtn=ev.type==="examen"?'<div style="margin-top:6px">'+prayButtonHTML(ev)+'</div>':"";
    return '<div class="friend-event"><span class="etag evt-'+escapeHTML(ev.type||"otro")+'"></span><div style="flex:1"><div class="who">'+escapeHTML(who)+'</div><b>'+escapeHTML(ev.title)+'</b><small>'+dd+(ev.time?' · '+escapeHTML(ev.time):'')+(ev.place?' · '+escapeHTML(ev.place):'')+'</small>'+(ev.url?'<br><a href="'+escapeHTML(ev.url)+'" target="_blank" rel="noopener" style="font-size:var(--fs-xs);color:var(--acento-tx);font-weight:700;text-decoration:none">Ver más ↗</a>':'')+prayBtn+'</div></div>';
  }).join("");
}
function socialRenderFriendMarkers(){
  if(!window.__map||typeof L==="undefined")return;
  SOCIAL.friendMarkers.forEach(function(m){try{window.__map.removeLayer(m);}catch(e){}});SOCIAL.friendMarkers=[];
  SOCIAL.presence=presenciasVisibles(SOCIAL.presenceAll);
  SOCIAL.presence.forEach(function(p){
    var b=BIBLIOTECAS[p.bib_index]; if(!b)return;
    var name=socialNameById(p.user_id), age=Math.round((Date.now()-new Date(p.updated_at).getTime())/60000);
    var icon=L.divIcon({className:"",html:'<div class="friendpin">'+socialInitial(name)+'</div>',iconSize:[38,46],iconAnchor:[19,46],popupAnchor:[0,-46]});
    var mk=L.marker([b.lat,b.lon],{icon:icon}).addTo(window.__map).bindPopup('<div class="pop"><h2>'+escapeHTML(name)+'</h2><div class="estado open">👥 Amigo estudiando aquí</div><div class="dir"><span>Está en '+escapeHTML(b.nombre)+' · actualizado hace '+Math.max(0,age)+' min</span></div></div>',{maxWidth:280});
    SOCIAL.friendMarkers.push(mk);
  });
}

/* ===================== AUTENTICACIÓN ===================== */
let authMode="login";
const $=function(id){return document.getElementById(id);};
function setAuthMode(m){
  authMode=m;
  $("tabLogin").classList.toggle("on",m==="login");
  $("tabReg").classList.toggle("on",m==="reg");
  $("fName").classList.toggle("hidden",m!=="reg");
  $("authTerms").classList.toggle("hidden",m!=="reg");
  $("authBtn").textContent = m==="login"?"Entrar":"Crear cuenta";
  $("authErr").classList.add("hidden");
}
function showAuthErr(t){var e=$("authErr");e.textContent=t;e.classList.remove("hidden");}

async function doAuth(){
  // Lo hecho como invitado (sesiones, agenda…) pasa a la cuenta nueva al registrarse.
  var datosInvitado=(esInvitado()&&DATA&&(DATA.sessions.length||Object.keys(DATA.events).length))?DATA:null;
  var email=$("inEmail").value.trim().toLowerCase();
  var pass=$("inPass").value;
  if(!email||!/.+@.+\..+/.test(email)){showAuthErr("Introduce un correo válido.");return;}
  if(pass.length<4){showAuthErr("La contraseña debe tener al menos 4 caracteres.");return;}
  var users=Brain.getUsers();
  await cargarSupabase();
  var sb=socialClient();
  if(sb){
    try{
      $("authBtn").disabled=true;$("authBtn").textContent=authMode==="login"?"Entrando…":"Creando…";
      if(authMode==="reg"){
        var name=$("inName").value.trim();
        if(!name){showAuthErr("Pon tu nombre.");return;}
        var res=await sb.auth.signUp({email:email,password:pass,options:{data:{name:name}}});
        if(res.error){showAuthErr(res.error.message);return;}
        if(!res.data.session){showAuthErr("Cuenta creada. Confirma el correo o desactiva la confirmación de email en Supabase para pruebas.");return;}
        CURRENT=res.data.user.email;
        users[CURRENT]={name:name,pass:hashPass(pass)};Brain.saveUsers(users);Brain.setSession(CURRENT);
        if(datosInvitado){Brain.saveUserData(CURRENT,datosInvitado);Brain.saveUserData(GUEST,{onboarded:true});}
        await socialEnsureProfile(res.data.user,name,CURRENT);
        await enterApp();
      }else{
        var res2=await sb.auth.signInWithPassword({email:email,password:pass});
        if(res2.error){showAuthErr(res2.error.message);return;}
        CURRENT=res2.data.user.email;
        var display=(res2.data.user.user_metadata&&res2.data.user.user_metadata.name)||CURRENT.split("@")[0];
        users[CURRENT]={name:display,pass:hashPass(pass)};Brain.saveUsers(users);Brain.setSession(CURRENT);
        await socialEnsureProfile(res2.data.user,display,CURRENT);
        await enterApp();
      }
    }catch(e){showAuthErr("Error conectando con Supabase: "+(e.message||e));}
    finally{$("authBtn").disabled=false;$("authBtn").textContent=authMode==="login"?"Entrar":"Crear cuenta";}
    return;
  }
  if(authMode==="reg"){
    var name=$("inName").value.trim();
    if(!name){showAuthErr("Pon tu nombre.");return;}
    if(users[email]){showAuthErr("Ya existe una cuenta con ese correo.");return;}
    users[email]={name:name,pass:hashPass(pass)};
    Brain.saveUsers(users);
    Brain.saveUserData(email,datosInvitado||dataDefault());
    if(datosInvitado)Brain.saveUserData(GUEST,{onboarded:true});
  }else{
    if(!users[email]){showAuthErr("No hay ninguna cuenta con ese correo.");return;}
    if(users[email].pass!==hashPass(pass)){showAuthErr("Contraseña incorrecta.");return;}
  }
  CURRENT=email;
  Brain.setSession(email);
  enterApp();
}

// Modo invitado: la app se usa sin cuenta; los datos van a este dispositivo con la clave "invitado".
const GUEST="invitado";
function esInvitado(){return CURRENT===GUEST;}
function entrarComoInvitado(){
  var users=Brain.getUsers();if(!users[GUEST]){users[GUEST]={name:"Invitado",pass:""};Brain.saveUsers(users);}
  CURRENT=GUEST;Brain.setSession(GUEST);enterApp();
}
function abrirLogin(m){setAuthMode(m||"login");$("authView").classList.remove("hidden");cargarSupabase();}
async function enterApp(){
  var users=Brain.getUsers();
  var u=users[CURRENT]||{name:CURRENT};
  loadUserData();
  $("authView").classList.add("hidden");
  $("app").classList.remove("hidden");
  // perfil
  $("profName").textContent=u.name;
  $("profEmail").textContent=esInvitado()?"Sin cuenta · datos en este dispositivo":CURRENT;
  $("profAvatar").textContent=(u.name||"?").trim().charAt(0).toUpperCase();
  $("guestCard").classList.toggle("hidden",!esInvitado());
  $("btnLogout").classList.toggle("hidden",esInvitado());
  $("btnDeleteAccount").textContent=esInvitado()?"Borrar mis datos de este dispositivo":"Eliminar mi cuenta y mis datos";
  applyExtras();actualizarBotonInstalar();
  if(!window.__listReady){buildList(); if(LIST_FILTERS.cerca&&!window.__userPos)locateMe();}
  if(!window.__mapReady) initMap();
  restaurarSesionActiva();
  renderStudy(); renderProfile(); renderRacha(); renderStories();
  if(DATA.onboarded)quizasResumenSemanal();
  socialInitAfterLogin();
  if(!DATA.onboarded){
    if(DATA.sessions.length){DATA.onboarded=true;saveUserData();}
    else setTimeout(onboarding,400);
  }
  actualizarBadge();
  setTimeout(comprobarEnlaceCompartido,500);
  if("Notification" in window && Notification.permission==="granted") lanzarNotifsDelDia();
  // limpiar campos
  $("inPass").value="";
}

// Funciones de fe (rezar / ofrecer estudio): ocultas por defecto, se activan en Ajustes.
/* ===== COMPARTIR MI SEMANA (imagen para stories / WhatsApp, estilo Strava) ===== */
function minutosSemanaPorDia(){
  var now=new Date(),monday=new Date(now);monday.setDate(now.getDate()-((now.getDay()+6)%7));monday.setHours(0,0,0,0);
  var mins=[0,0,0,0,0,0,0],subj={},n=0;
  DATA.sessions.forEach(function(s){var diff=Math.round((new Date(s.date+"T00:00:00")-monday)/86400000);
    if(diff>=0&&diff<7){mins[diff]+=s.min;n++;if(s.subject)subj[s.subject]=(subj[s.subject]||0)+s.min;}});
  if(studyTimer.running){var d=Math.round((new Date(ymd()+"T00:00:00")-monday)/86400000);if(d>=0&&d<7)mins[d]+=elapsedMin();}
  var top=null,tm=0;for(var k in subj)if(subj[k]>tm){tm=subj[k];top=k;}
  return {mins:mins,sesiones:n,top:top};
}
function compartirSemana(){
  var w=minutosSemanaPorDia(), total=w.mins.reduce(function(a,b){return a+b;},0);
  if(!total){showToast("Aún no has estudiado esta semana: ¡empieza una sesión!");return;}
  var W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;var g=c.getContext("2d");
  var grad=g.createLinearGradient(0,0,W,H);grad.addColorStop(0,"#6c5ce7");grad.addColorStop(1,"#00b4c5");g.fillStyle=grad;g.fillRect(0,0,W,H);
  g.fillStyle="rgba(255,255,255,.85)";g.font="700 40px system-ui,sans-serif";g.fillText("MI SEMANA DE ESTUDIO",80,140);
  g.fillStyle="#fff";g.font="800 190px system-ui,sans-serif";g.fillText(Math.floor(total/60)+"h "+(total%60)+"m",72,340);
  g.font="600 44px system-ui,sans-serif";g.fillStyle="rgba(255,255,255,.9)";
  var lineas=[w.sesiones+" sesiones","🔥 racha de "+streakDays()+(streakDays()===1?" día":" días")];if(w.top)lineas.push("📚 sobre todo "+w.top);
  lineas.forEach(function(t,k){g.fillText(t,80,430+k*64);});
  var max=Math.max(60,Math.max.apply(null,w.mins)),bx=80,bw=(W-160)/7,base=1130,alto=420,dias=["L","M","X","J","V","S","D"];
  w.mins.forEach(function(m,k){var h=Math.max(8,m/max*alto);g.fillStyle=m?"#fff":"rgba(255,255,255,.3)";
    var x=bx+k*bw+bw*.18,ww=bw*.64;g.beginPath();if(g.roundRect)g.roundRect(x,base-h,ww,h,18);else g.rect(x,base-h,ww,h);g.fill();
    g.fillStyle="rgba(255,255,255,.9)";g.font="700 36px system-ui,sans-serif";g.textAlign="center";g.fillText(dias[k],x+ww/2,base+56);g.textAlign="left";});
  g.fillStyle="#fff";g.font="800 40px system-ui,sans-serif";g.fillText("bibliomapa.es",80,H-80);
  c.toBlob(function(blob){
    var file=new File([blob],"mi-semana.png",{type:"image/png"});
    if(navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],title:"Mi semana de estudio"}).catch(function(){});return;}
    var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mi-semana.png";document.body.appendChild(a);a.click();a.remove();
    showToast("Imagen descargada: compártela donde quieras");
  },"image/png");
}
/* ===== INSTALAR LA APP (antes de estar en Google Play) ===== */
var INSTALL_EVT=null;
function esStandalone(){return (window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;}
function esIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent);}
window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();INSTALL_EVT=e;actualizarBotonInstalar();});
window.addEventListener("appinstalled",function(){INSTALL_EVT=null;actualizarBotonInstalar();showToast("App instalada ✓");});
function actualizarBotonInstalar(){var b=$("btnInstall");if(b)b.classList.toggle("hidden",esStandalone()||!(INSTALL_EVT||esIOS()));}
function instalarApp(){
  if(INSTALL_EVT){INSTALL_EVT.prompt();INSTALL_EVT.userChoice.finally(function(){INSTALL_EVT=null;actualizarBotonInstalar();});return;}
  if(esIOS())openModal('<h3>Instalar en iPhone</h3><div class="sub">1. Pulsa el botón Compartir (el cuadrado con la flecha) en Safari.<br>2. Elige «Añadir a pantalla de inicio».<br>3. Pulsa «Añadir».</div><button class="btn" onclick="closeModal()">Entendido</button>');
}
/* ===== BIENVENIDA (3 pasos) ===== */
function onboarding(){
  DATA.onboarded=true;saveUserData(); // si cierra la ventana, no se vuelve a mostrar
  var PERFILES=[["uni","🎓 Estudio en la universidad"],["opositor","📘 Preparo oposiciones"],["bach","📝 Bachillerato o FP"],["otro","🙂 Otra cosa"]];
  function paso1(){
    openModal('<div class="ob-step">1 de 3</div><h3>¿Qué estudias?</h3><div class="sub">Así te recomendamos mejor dónde ir.</div><div class="pick-list">'+
      PERFILES.map(function(p){return '<button data-p="'+p[0]+'"><b>'+p[1]+'</b></button>';}).join("")+'</div>',function(){
      document.querySelectorAll(".pick-list button").forEach(function(b){b.addEventListener("click",function(){
        DATA.perfil=b.dataset.p;
        if(DATA.perfil==="opositor"&&!DATA.goalCustom){DATA.goalPeriod="week";DATA.goalMin=25*60;}
        saveUserData();paso2();});});
    });
  }
  // Paso 2: bibliotecas cerca de ti (con tu ubicación) o, sin ella, un buscador para toda España.
  function paso2(){
    var up=window.__userPos;
    var cerca=up?BIBLIOTECAS.map(function(b,i){return {i:i,d:distMetros(up.lat,up.lon,b.lat,b.lon)};}).filter(function(x){return x.d<15000;})
      .sort(function(a,b){return a.d-b.d;}).slice(0,40).map(function(x){return x.i;}):[];
    var opts=cerca.map(function(i){return '<option value="'+i+'">'+escapeHTML(cortoNombre(BIBLIOTECAS[i].nombre))+'</option>';}).join("");
    var todas=BIBLIOTECAS.map(function(b,i){return cerca.indexOf(i)===-1?'<option value="'+i+'">'+escapeHTML(cortoNombre(b.nombre))+'</option>':'';}).join("");
    openModal('<div class="ob-step">2 de 3</div><h3>¿Dónde sueles estudiar?</h3><div class="sub">La tendremos en cuenta al recomendarte y al empezar a estudiar.</div>'+
      (up?'':'<button class="btn ghost sm" id="obGeo" style="margin-bottom:10px">📍 Ver las que tengo cerca</button>')+
      '<div class="field"><select id="obBib" style="width:100%;padding:11px;border-radius:var(--r-m);border:1px solid rgba(148,163,184,.4);font:inherit"><option value="-1">Aún no lo sé</option>'+
      (opts?'<optgroup label="Cerca de ti">'+opts+'</optgroup><optgroup label="Resto de España">'+todas+'</optgroup>':'<optgroup label="Toda España">'+todas+'</optgroup>')+'</select></div>'+
      '<button class="btn" id="obNext">Siguiente</button>',function(){
      var g=$("obGeo");
      if(g)g.addEventListener("click",function(){
        if(!navigator.geolocation){showToast("Tu navegador no permite la ubicación");return;}
        g.textContent="Buscando…";
        navigator.geolocation.getCurrentPosition(function(p){window.__userPos={lat:p.coords.latitude,lon:p.coords.longitude};paso2();},
          function(){g.textContent="📍 Ver las que tengo cerca";showToast("No he podido saber tu ubicación: elige en la lista");},{timeout:8000,maximumAge:300000});
      });
      $("obNext").addEventListener("click",function(){
        var v=+$("obBib").value;DATA.habitualIdx=v>=0?v:null;
        // Universitarios de la UNAV o la UPNA: se afina la recomendación como antes (acceso restringido, exámenes).
        if(DATA.perfil==="uni"&&v>=0){if(esUNAV(BIBLIOTECAS[v]))DATA.perfil="unav";else if(esUPNA(BIBLIOTECAS[v]))DATA.perfil="upna";}
        saveUserData();paso3();});
    });
  }
  function paso3(){
    openModal('<div class="ob-step">3 de 3</div><h3>Estudia con tus amigos</h3><div class="sub">Verás dónde estudian, competiréis en horas y podréis crear salas de estudio. Mándales la app con tu código.</div>'+
      '<button class="btn" id="obInvite">📨 Invitar a amigos</button><button class="linkbtn" id="obDone" style="display:block;margin:14px auto 0">Empezar a usar la app</button>',function(){
      $("obInvite").addEventListener("click",invitarAmigos);
      $("obDone").addEventListener("click",function(){closeModal();renderNowCard();renderSubjects();});
    });
  }
  paso1();
}
function invitarAmigos(){
  var code=SOCIAL.profile&&SOCIAL.profile.friend_code;
  var url=location.origin&&location.origin!=="null"?location.origin+location.pathname:"";
  var txt="Estoy usando Bibliomapa para saber qué biblioteca está abierta y con sitio, y estudiar con amigos."+(code?" Añádeme con mi código: "+code+".":"")+(url?" "+url:"");
  if(navigator.share){navigator.share({title:"Bibliomapa · Bibliotecas de España",text:txt}).catch(function(){});}
  else{try{navigator.clipboard.writeText(txt);showToast("Invitación copiada: pégala en WhatsApp");}catch(e){prompt("Copia y envía este mensaje:",txt);}}
}
function extrasOn(){return !(DATA&&DATA.extras===false);}
function applyExtras(){
  var on=extrasOn();
  document.body.classList.toggle("no-extras",!on);
  var c=$("chkExtras"); if(c)c.checked=on;
  if(!on&&$("studyOfferPanel")&&!$("studyOfferPanel").classList.contains("hidden")){var b=document.querySelector('#studyTab button[data-t="crono"]');if(b)b.click();}
}
// Borra la cuenta en la nube (función delete_my_account del SQL) y todos los datos de este dispositivo.
function enviarSugerencia(sobre){
  openModal('<h3>¿Qué mejorarías?</h3><div class="sub">Cuéntanos un error, una idea o una biblioteca con datos mal. Lo leemos todo.</div>'+
    '<div class="field"><textarea id="fbText" rows="5" maxlength="2000" style="width:100%;padding:11px 13px;border-radius:var(--r-m);border:1px solid rgba(148,163,184,.4);font:inherit" placeholder="Ej: el horario de Iturrama ha cambiado…">'+(sobre?escapeHTML("Sobre «"+sobre+"»: "):"")+'</textarea></div>'+
    '<button class="btn" id="fbSend">Enviar</button>',function(){
    $("fbSend").addEventListener("click",async function(){
      var t=$("fbText").value.trim(); if(!t){showToast("Escribe algo primero");return;}
      var sb=socialClient();
      if(!sb||!SOCIAL.user){showToast("Necesitas iniciar sesión con la cuenta en la nube para enviarla");return;}
      var r=await sb.from("feedback").insert({user_id:SOCIAL.user.id,message:t.slice(0,2000),context:navigator.userAgent.slice(0,200)});
      if(r.error){showToast("No se pudo enviar: "+r.error.message);return;}
      closeModal();showToast("¡Gracias! Sugerencia enviada");
    });
  });
}
async function cambiarNombre(){
  var users=Brain.getUsers(), actual=(users[CURRENT]&&users[CURRENT].name)||"";
  var n=(prompt("Tu nombre (lo verán tus amigos)",actual)||"").trim().slice(0,40);
  if(!n||n===actual)return;
  if(users[CURRENT]){users[CURRENT].name=n;Brain.saveUsers(users);}
  var sb=socialClient();
  if(sb&&SOCIAL.user){var r=await sb.from("profiles").update({name:n}).eq("id",SOCIAL.user.id).select("id,name,friend_code").single();
    if(r.error){showToast("No se pudo guardar en la nube");return;} SOCIAL.profile=r.data;}
  $("profName").textContent=n;$("profAvatar").textContent=n.charAt(0).toUpperCase();
  showToast("Nombre actualizado");
}
async function deleteAccount(){
  if(!confirm("Se borrarán tu cuenta, tus sesiones, amigos y todo lo que hayas compartido. No se puede deshacer. ¿Continuar?"))return;
  var email=CURRENT, sb=socialClient();
  if(sb&&SOCIAL.user){
    var r=await sb.rpc("delete_my_account");
    if(r.error){showToast("No se pudo borrar la cuenta en la nube: "+r.error.message);return;}
  }
  if(studyTimer.running)stopStudy(true);
  try{localStorage.removeItem(userKey(email));var users=Brain.getUsers();delete users[email];Brain.saveUsers(users);}catch(e){}
  logout();
  showToast("Tu cuenta y tus datos se han eliminado");
}
async function logout(){
  PRESENCIA_VISTA=null;
  // stopStudy(true): sin el diálogo de valoración, que se quedaba encima del login sin usuario.
  if(studyTimer.running){stopStudy(true);showToast("Sesión de estudio guardada");}
  pomoReset();closeModal();releaseWakeLock();
  if(socialClient()){try{await socialClearPresence();}catch(e){}try{await socialClient().auth.signOut();}catch(e){}}
  if(SOCIAL.timer)clearInterval(SOCIAL.timer);
  SOCIAL.comments={};SOCIAL.commentsOpen={};SOCIAL.commentDrafts={};SOCIAL.myCommentsAt=0;
  // limpia lo social de la cuenta anterior antes de seguir como invitado
  if(window.__map)SOCIAL.friendMarkers.forEach(function(m){try{window.__map.removeLayer(m);}catch(e){}});
  SOCIAL.user=null;SOCIAL.profile=null;SOCIAL.friends=[];SOCIAL.requests=[];SOCIAL.sent=[];SOCIAL.events=[];SOCIAL.presence=[];SOCIAL.friendMarkers=[];SOCIAL.timer=null;
  SOCIAL.friendSessions=[];SOCIAL.leaderboard=[];SOCIAL.room=null;SOCIAL.roomMembers=[];
  SOCIAL.blocked={};SOCIAL.eventsAll=[];SOCIAL.presenceAll=[];
  Brain.clearSession();
  CURRENT=null;DATA=null;
  entrarComoInvitado();
}

/* ===================== NAVEGACIÓN ===================== */
const VIEWS={map:"viewMap",study:"viewStudy",friends:"viewFriends",cal:"viewCal",events:"viewEvents",blog:"viewBlog",profile:"viewProfile"};
function goView(v){
  for(var k in VIEWS){ $(VIEWS[k]).classList.toggle("hidden",k!==v); }
  // pestañas secundarias (Agenda, Eventos, Blog) se abren desde Perfil
  var tab={events:"profile",blog:"profile"}[v]||v;
  document.querySelectorAll(".dock button").forEach(function(b){b.classList.toggle("on",b.dataset.view===tab);});
  if(v==="map"&&window.__map){setTimeout(function(){window.__map.invalidateSize();},120);}
  if(v==="study"){renderStudy();renderStudyRoom();if(SOCIAL.room)loadRoomMembers().then(renderStudyRoom);}
  if(v==="cal")renderCal();
  if(v==="events")renderEvents();
  if(v==="blog")renderBlog();
  if(v==="profile"||v==="friends")renderProfile();
  if(v==="friends")renderStories();
}


/* ===================== AFLUENCIA / OCUPACIÓN ===================== */
const OCC_LEVELS={
  libre:{score:1,label:"Libre",emoji:"🟢",className:"od-libre"},
  media:{score:2,label:"Media",emoji:"🟡",className:"od-media"},
  llena:{score:3,label:"Llena",emoji:"🔴",className:"od-llena"}
};
function occKey(i){return "bib_"+i;}
let OCC_CACHE={}; // afluencia compartida vía Supabase, refrescada periódicamente
async function loadOccupancyCloud(){
  var sb=socialClient(); if(!sb)return;
  var cutoff=new Date(Date.now()-OCC_TTL_MIN*60000).toISOString();
  var res=await sb.from("occupancy_reports").select("bib_index,level,created_at").gte("created_at",cutoff);
  if(res.error){console.warn(res.error);return;}
  var grouped={};
  (res.data||[]).forEach(function(r){
    var k=occKey(r.bib_index);
    if(!grouped[k])grouped[k]=[];
    grouped[k].push({level:r.level,ts:new Date(r.created_at).getTime()});
  });
  OCC_CACHE=grouped;
}
function occAll(){return (socialClient()&&SOCIAL.user)?OCC_CACHE:Brain.getOccupancy();}
function occPrune(all){
  if(socialClient()&&SOCIAL.user)return all; // los reportes de Supabase ya llegan filtrados por antigüedad
  var cutoff=Date.now()-OCC_TTL_MIN*60000, changed=false;
  for(var k in all){
    var oldLen=(all[k]||[]).length;
    all[k]=(all[k]||[]).filter(function(r){return r&&r.ts>=cutoff&&OCC_LEVELS[r.level];}).slice(-50);
    if(all[k].length!==oldLen)changed=true;
    if(!all[k].length){delete all[k];changed=true;}
  }
  if(changed)Brain.saveOccupancy(all);
  return all;
}
function occSummary(i){
  var all=occPrune(occAll()), arr=all[occKey(i)]||[];
  if(!arr.length)return null;
  var now=Date.now(), sum=0, wsum=0, last=0;
  arr.forEach(function(r){
    var ageMin=Math.max(0,(now-r.ts)/60000);
    var weight=Math.max(.35,1-(ageMin/OCC_TTL_MIN)*.65);
    sum+=OCC_LEVELS[r.level].score*weight; wsum+=weight;
    if(r.ts>last)last=r.ts;
  });
  var avg=sum/wsum;
  var level=avg>=2.35?"llena":(avg>=1.65?"media":"libre");
  var age=Math.max(0,Math.round((now-last)/60000));
  return {level:level,info:OCC_LEVELS[level],count:arr.length,age:age,avg:avg};
}
function occStatusHTML(i,compact){
  var o=occSummary(i);
  if(!o){return '<div class="occ-empty">⚪ Sin datos recientes de afluencia</div>';}
  return '<div class="occ-report"><span class="od '+o.info.className+'"></span><span><b>'+o.info.label+'</b> · '+o.count+' reporte'+(o.count===1?'':'s')+' · hace '+o.age+' min</span></div>'+(compact?'':'<div class="occ-source">Caduca a los '+OCC_TTL_MIN+' min. Basado en reportes de usuarios de la app.</div>');
}
function occControlsHTML(i){
  return '<div class="occ-title">Afluencia ahora</div>'+occStatusHTML(i,false)+
    '<div class="occ" aria-label="Reportar afluencia">'+
    '<button data-o="libre" onclick="reportOcc('+i+',\'libre\')">🟢 Libre</button>'+
    '<button data-o="media" onclick="reportOcc('+i+',\'media\')">🟡 Media</button>'+
    '<button data-o="llena" onclick="reportOcc('+i+',\'llena\')">🔴 Llena</button>'+
    '</div>'+
    '<div id="occHist'+i+'" class="occ-hist-wrap"><button class="linkbtn" style="font-size:var(--fs-xs)" onclick="showOccHistory('+i+')">📊 Ver ocupación habitual</button></div>';
}
async function showOccHistory(i){
  var wrap=document.getElementById("occHist"+i); if(!wrap)return;
  wrap.innerHTML='<div class="occ-empty">Cargando tendencia…</div>';
  await cargarSupabase();
  var sb=socialClient();
  if(!sb){wrap.innerHTML='<div class="occ-empty">Configura Supabase para ver la tendencia histórica</div>';return;}
  var res=await sb.from("occupancy_reports").select("level,created_at").eq("bib_index",i).limit(500);
  if(res.error||!res.data||!res.data.length){wrap.innerHTML='<div class="occ-empty">Aún no hay suficientes datos históricos</div>';return;}
  var buckets={"Mañana":[],"Tarde":[],"Noche":[]};
  res.data.forEach(function(r){
    var h=new Date(r.created_at).getHours();
    var b=h<14?"Mañana":(h<20?"Tarde":"Noche");
    var sc=OCC_LEVELS[r.level]?OCC_LEVELS[r.level].score:null;
    if(sc)buckets[b].push(sc);
  });
  var html='<div class="occ-title" style="margin-top:8px">Ocupación habitual</div><div class="occ-hist">';
  ["Mañana","Tarde","Noche"].forEach(function(k){
    var arr=buckets[k];
    if(!arr.length){html+='<div class="occ-hist-bar"><div class="ohb-track"></div><small>'+k+'</small></div>';return;}
    var avg=arr.reduce(function(a,b){return a+b;},0)/arr.length;
    var pct=Math.max(10,Math.round((avg-1)/2*100));
    var cls=avg>=2.35?"od-llena":(avg>=1.65?"od-media":"od-libre");
    html+='<div class="occ-hist-bar"><div class="ohb-track"><div class="ohb-fill '+cls+'" style="height:'+pct+'%"></div></div><small>'+k+'</small></div>';
  });
  html+='</div><div class="occ-source">Basado en '+res.data.length+' reportes históricos de todos los usuarios.</div>';
  wrap.innerHTML=html;
}
async function addOccReport(i,level,silent){
  if(!OCC_LEVELS[level])return;
  var sb=socialClient();
  if(sb&&SOCIAL.user){
    var ins=await sb.from("occupancy_reports").insert({bib_index:i,level:level,user_id:SOCIAL.user.id});
    if(ins.error){showToast("No se pudo enviar el reporte");return;}
    await loadOccupancyCloud();
    refreshOccUI(i);
    if(!silent)showToast("Afluencia actualizada: "+OCC_LEVELS[level].label.toLowerCase());
    return;
  }
  var all=occPrune(occAll()), k=occKey(i);
  if(!all[k])all[k]=[];
  all[k].push({level:level,ts:Date.now(),user:CURRENT||"anon"});
  all[k]=all[k].slice(-50);
  Brain.saveOccupancy(all);
  refreshOccUI(i);
  if(!silent)showToast("Afluencia actualizada: "+OCC_LEVELS[level].label.toLowerCase());
}
function reportOcc(i,level){addOccReport(i,level,false);}
function refreshOccUI(i){
  buildList();
  if(markers&&markers.length){
    // Los popups se generan al abrirse: solo hay que refrescar el que esté abierto.
    if(typeof i==="number"&&markers[i]){
      if(markers[i].setIcon)markers[i].setIcon(chinchetaIcon(i));
      if(window.__map&&window.__map.hasLayer(markers[i])){if(markers[i].isPopupOpen())markers[i].getPopup().update();else markers[i].openPopup();}
    }else{
      // los iconos se reutilizan por variante: solo se repinta la chincheta cuyo estado ha cambiado
      markers.forEach(function(mk,j){var ic=chinchetaIcon(j);if(mk.setIcon&&mk.options.icon!==ic)mk.setIcon(ic);if(mk.isPopupOpen())mk.getPopup().update();});
    }
  }
}

/* ===================== MAPA Y LISTA ===================== */
let markers=[];
function popIconRow(b){
  var ac=b.acceso||{tipo:"desconocido"}, ax=b.accesibilidad||{};
  var chips=[];
  chips.push(ac.tipo==="libre"?"🎫 Libre":(ac.tipo==="restringido"?"🔒 Restringido":"❔ Acceso"));
  if(b.gratuito===true)chips.push("💶 Gratis");
  else if(b.gratuito===false)chips.push("💶 De pago");
  if(b.capacidad)chips.push("🪑 "+b.capacidad);
  if(ax.sillaRuedas===true)chips.push("♿");
  if(b.recursos&&b.recursos.indexOf("wifi")!==-1)chips.push("📶");
  return '<div class="pop-chips">'+chips.map(function(c){return '<span class="pop-chip">'+c+'</span>';}).join("")+'</div>';
}
/* ===== FAVORITAS (DATA.fav = array de nombres de biblioteca; vale igual para Navarra y el resto de España) ===== */
function esFavorita(i){var b=BIBLIOTECAS[i];return !!(b&&DATA&&Array.isArray(DATA.fav)&&DATA.fav.indexOf(b.nombre)!==-1);}
function nFavoritas(){return DATA&&Array.isArray(DATA.fav)?BIBLIOTECAS.filter(function(b){return DATA.fav.indexOf(b.nombre)!==-1;}).length:0;}
function favBtnHTML(i,enFicha){
  var on=esFavorita(i);
  return '<button class="favbtn'+(on?' on':'')+(enFicha?' infic':'')+'" title="'+(on?'Quitar de favoritas':'Añadir a favoritas')+'" aria-label="'+(on?'Quitar de favoritas':'Añadir a favoritas')+'" aria-pressed="'+on+'" onclick="event.stopPropagation();toggleFav('+i+','+(enFicha?'true':'false')+')">'+(on?'★':'☆')+(enFicha?(on?' Favorita':' Añadir a favoritas'):'')+'</button>';
}
function toggleFav(i,enFicha){
  if(!DATA){showToast("Inicia sesión para guardar favoritas");return;}
  var b=BIBLIOTECAS[i]; if(!b)return;
  if(!Array.isArray(DATA.fav))DATA.fav=[];
  var k=DATA.fav.indexOf(b.nombre), ahora=k===-1;
  if(ahora)DATA.fav.push(b.nombre); else DATA.fav.splice(k,1);
  saveUserData();
  if(!nFavoritas()&&LIST_FILTERS.fav){LIST_FILTERS.fav=false;saveJSON("bpna_list_filters",LIST_FILTERS);}
  if(window.__listReady)buildList();
  // El popup se genera bajo demanda (bindPopup con función): no se sustituye por texto fijo,
  // basta con regenerarlo si está abierto; si está cerrado, se rehará al abrirse.
  if(markers&&markers[i]&&markers[i].isPopupOpen&&markers[i].isPopupOpen())markers[i].getPopup().update();
  if(enFicha)openBibDetailModal(i);
  actualizarBadge();
  showToast(ahora?"★ Añadida a favoritas":"Quitada de favoritas");
}
function popupHTML(b,i){
  var abierto=estadoBib(b);
  var cal=horarioVigente(b),hoy=new Date().getDay();
  var hoyTr=cal[hoy]||[];
  var hoyTxt=hoyTr.length?hoyTr.map(function(t){return fmtHoras(t[0])+"–"+fmtHoras(t[1]);}).join(", "):"Cerrado hoy";
  var distTxt="";
  if(window.__userPos){
    var dm=distMetros(window.__userPos.lat,window.__userPos.lon,b.lat,b.lon);
    distTxt=dm<1000?Math.round(dm)+" m":(dm/1000).toFixed(1)+" km";
  }
  var s='<div class="pop pop-compact"><h2>'+escapeHTML(b.nombre)+'</h2>';
  s+='<div class="pop-meta"><span class="estado '+(b.sinHorario?"unk":(abierto?"open":"closed"))+'">'+(b.sinHorario?"● Horario sin confirmar":(abierto?"● Abierta":"● Cerrada"))+'</span>'+(distTxt?'<span class="pop-dist">📍 '+distTxt+'</span>':'')+favBtnHTML(i)+'</div>';
  s+='<div class="pop-today">'+escapeHTML(estadoTexto(b).txt)+'</div>';
  s+=popIconRow(b);
  if(epocaExamenes()&&esUPNA(b))s+='<div class="pop-today" style="color:#b45309">⚠️ En exámenes la sala suele reservarse a la comunidad UPNA</div>';
  var o=occSummary(i);
  s+='<div style="margin-top:10px">'+(o?('<div class="occ-report" style="justify-content:center"><span class="od '+o.info.className+'"></span><span><b>'+o.info.label+'</b></span></div>'):'<div class="occ-empty">⚪ Sin datos recientes de afluencia</div>')+'</div>';
  s+='<button class="btnstudy" onclick="startStudyAt('+i+')">▶ Estudiar aquí</button>';
  s+='<button class="linkbtn" style="display:block;margin:8px auto 0" onclick="openBibDetailModal('+i+')">Horario, acceso y cómo llegar →</button>';
  s+='</div>';
  return s;
}
function recursosHTML(b){
  var RES_LABELS={wifi:"📶 Wifi",enchufes:"🔌 Enchufes",salas_grupo:"👥 Salas de grupo",impresora:"🖨️ Impresora/fotocopias",cafeteria:"☕ Cafetería",silencio:"🤫 Zona de silencio",ordenadores:"💻 Ordenadores"};
  var s='<div class="hours"><h4>Aforo y recursos</h4>';
  s+='<div style="font-size:var(--fs-s);color:var(--suave)">🪑 Aforo: '+(b.capacidad?(b.capacidad+" puestos"):"sin confirmar")+'</div>';
  s+='<div style="font-size:var(--fs-s);color:var(--suave);margin-top:4px">💶 '+(b.gratuito===true?"Gratuito":(b.gratuito===false?"De pago":"Coste sin confirmar"))+'</div>';
  if(b.recursos&&b.recursos.length){
    var txt=b.recursos.map(function(r){return RES_LABELS[r]||r;}).join(" · ");
    s+='<div style="font-size:var(--fs-s);color:var(--suave);margin-top:4px">'+txt+'</div>';
  }else{
    s+='<div style="font-size:var(--fs-xs);color:var(--suave);margin-top:4px;font-style:italic">Recursos disponibles sin confirmar todavía.</div>';
  }
  s+='</div>';
  return s;
}
function openBibDetailModal(i){
  var b=BIBLIOTECAS[i], verano=esVeranoDe(b,new Date()), abierto=estadoBib(b);
  var s='<div class="pop" style="padding:0"><h2>'+escapeHTML(b.nombre)+'</h2>';
  s+='<div class="estado '+(b.sinHorario?"unk":(abierto?"open":"closed"))+'">'+(b.sinHorario?"● Horario sin confirmar":(abierto?"● Abierto ahora":"● Cerrado ahora"))+'</div>'+favBtnHTML(i,true);
  if(b.rating!=null)s+='<div class="rate-line"><b>★ '+b.rating.toFixed(1)+'</b> · '+b.reviews+' reseñas</div>';
  s+='<div class="dir"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6c5ce7" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>'+escapeHTML(b.dir)+'</span></div>';
  s+='<div class="bib-actions"><a class="btn sm" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+b.lat+','+b.lon+'">🧭 Cómo llegar</a>'+
    (b.tel?'<a class="btn sm ghost" href="tel:'+escapeHTML(b.tel.replace(/\s/g,""))+'">📞 Llamar</a>':'')+
    (b.web&&/^https?:\/\//.test(b.web)?'<a class="btn sm ghost" target="_blank" rel="noopener" href="'+escapeHTML(b.web)+'">🌐 Web</a>':'')+'</div>';
  var cal=horarioVigente(b),hoy=new Date().getDay();
  if(b.sinHorario){
    s+='<div class="hours"><h4>Horario</h4><div style="font-size:var(--fs-s);color:var(--suave)">Sin confirmar todavía'+(b.web?': consúltalo en su web.':'.')+
      ' <button class="linkbtn" onclick="closeModal();enviarSugerencia('+jsArg("Horario de "+b.nombre)+')">¿Lo sabes? Cuéntanoslo</button></div></div>';
  }else{
  s+='<div class="hours"><h4>'+(verano?"Horario de verano":"Horario de invierno")+'</h4><table>';
  for(var d=1;d<=7;d++){var di=d%7,tr=cal[di]||[];
    var txt=tr.length?tr.map(function(t){return fmtHoras(t[0])+"–"+fmtHoras(t[1]);}).join(", "):'<span class="closed-day">Cerrado</span>';
    s+='<tr class="'+(di===hoy?"today":"")+'"><td>'+DIAS[di]+'</td><td>'+txt+'</td></tr>';}
  s+='</table>'+(b.notaHorario?'<div style="font-size:var(--fs-xs);color:var(--suave);margin-top:6px">'+escapeHTML(b.notaHorario)+'</div>':'')+
    verificacionHorarioHTML(b)+
    '<div class="hr-acciones"><button class="btn sm ghost" onclick="confirmarHorario('+i+')">✓ Sigue siendo correcto</button>'+
    '<button class="btn sm ghost" onclick="reportarHorario('+i+')">⚠ Reportar horario incorrecto</button></div>'+
    '<div class="hr-conf" id="hrConf"></div></div>';
  }
  s+=accesoAccesibilidadHTML(b);
  s+=recursosHTML(b);
  s+=occControlsHTML(i);
  s+='<button class="btnstudy" onclick="closeModal();startStudyAt('+i+')">▶ Estudiar aquí</button>';
  s+='<button class="linkbtn" style="display:block;margin:10px auto 0;font-size:var(--fs-s)" onclick="closeModal();enviarSugerencia('+jsArg(b.nombre)+')">Avisar de un error en esta ficha</button>';
  s+='</div>';
  openModal(s,function(){if(!b.sinHorario)pintarConfirmaciones(b.nombre);});
}
/* ===== Verificación del horario y reportes (idea de MassTimes.org) =====
   La fecha oficial sale solo de los datos (h.fv en bibliotecas-espana.js); nunca se inventa.
   Las confirmaciones de usuarios se muestran aparte y no sustituyen a esa verificación. */
const HR_DIAS_VIEJO=180;
const HR_DIAS_LARGOS=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
function fmtFechaLarga(iso){var p=String(iso).split("-");return (+p[2])+" de "+MESES[+p[1]-1]+" de "+p[0];}
function verificacionHorarioHTML(b){
  var fuente=b.fuenteHorario&&/^https?:\/\//.test(b.fuenteHorario)?'<a target="_blank" rel="noopener" href="'+escapeHTML(b.fuenteHorario)+'">fuente</a>':'';
  var s='<div class="hr-verif">', aviso='';
  if(b.verificadoHorario&&/^\d{4}-\d{2}-\d{2}$/.test(b.verificadoHorario)){
    var dias=Math.floor((Date.now()-new Date(b.verificadoHorario+"T00:00:00").getTime())/86400000);
    s+='Horario verificado el '+fmtFechaLarga(b.verificadoHorario)+(fuente?' · '+fuente:'');
    if(dias>HR_DIAS_VIEJO)aviso='<span class="hr-viejo">⚠ Hace más de '+HR_DIAS_VIEJO+' días: puede estar desactualizado</span>';
  }else{
    s+='Horario sin fecha de verificación'+(fuente?' · '+fuente:'');
  }
  return s+' · puede cambiar en festivos'+aviso+'</div>';
}
// Recuento agregado (función horario_confirmaciones del SQL: no expone user_id). Sin la librería de
// Supabase cargada se usa fetch directo para no descargarla solo por abrir una ficha. Si la función
// aún no existe en Supabase, no se muestra nada y no se vuelve a pedir en esta visita.
var HR_RPC_OFF=false;
function pedirConfirmaciones(nombre){
  if(HR_RPC_OFF||!socialKeysOk())return Promise.resolve(null);
  var sb=socialClient();
  var p=sb?sb.rpc("horario_confirmaciones",{p_bib:nombre}).then(function(r){if(r.error)throw r.error;return r.data;})
    :fetch(SUPABASE_URL+"/rest/v1/rpc/horario_confirmaciones",{method:"POST",
      headers:{apikey:SUPABASE_ANON_KEY,"Content-Type":"application/json"},body:JSON.stringify({p_bib:nombre})})
      .then(function(r){if(!r.ok)throw new Error(r.status);return r.json();});
  return p.then(function(d){return (d&&d[0])||null;}).catch(function(){HR_RPC_OFF=true;return null;});
}
function pintarConfirmaciones(nombre){
  pedirConfirmaciones(nombre).then(function(d){
    var el=$("hrConf"); if(!el||!d)return;
    var n=+d.confirmaciones||0; if(!n){el.textContent="";return;}
    el.textContent="👍 "+(n===1?"1 persona lo confirmó":n+" personas lo confirmaron")+" en los últimos 90 días (no sustituye a la verificación oficial)";
  });
}
function invitarSesionHorario(){
  openModal('<h3>Inicia sesión para avisar</h3><div class="sub">Para confirmar o reportar un horario necesitas una cuenta (gratis y opcional). Así evitamos avisos falsos.</div>'+
    '<div style="display:flex;gap:8px"><button class="btn sm" style="flex:1" onclick="closeModal();abrirLogin(\'login\')">Iniciar sesión</button>'+
    '<button class="btn sm ghost" style="flex:1" onclick="closeModal();abrirLogin(\'reg\')">Crear cuenta</button></div>');
}
// ¿La tabla aún no existe en Supabase? (SQL sin ejecutar). Entonces el aviso va al buzón feedback.
function hrSinTabla(err){var m=String((err&&(err.message||err.code))||"");return /horario_reportes|42P01|PGRST205|does not exist|schema cache/i.test(m);}
const HR_TIPOS={horario_distinto:"El horario es distinto",cerrado_temporal:"Cerrada temporalmente",festivo:"Festivo (cierra o cambia ese día)",otro:"Otro"};
async function guardarReporteHorario(b,tipo,dia,comentario){
  var sb=socialClient(); if(!sb||!SOCIAL.user)return {error:{message:"Sin sesión"}};
  var row={bib_nombre:b.nombre.slice(0,200),tipo:tipo,user_id:SOCIAL.user.id};
  if(dia!=null)row.dia=dia; if(comentario)row.comentario=comentario.slice(0,500);
  var r=await sb.from("horario_reportes").insert(row);
  if(r.error&&hrSinTabla(r.error)){
    var msg="[Horario] "+b.nombre+" · "+(tipo==="correcto"?"Sigue siendo correcto":HR_TIPOS[tipo]||tipo)+
      (dia!=null?" · "+HR_DIAS_LARGOS[dia]:"")+(comentario?" · "+comentario.slice(0,500):"");
    r=await sb.from("feedback").insert({user_id:SOCIAL.user.id,message:msg.slice(0,2000),context:"horario_reportes"});
  }
  return r;
}
async function confirmarHorario(i){
  var b=BIBLIOTECAS[i]; if(!SOCIAL.user||!socialClient()){invitarSesionHorario();return;}
  var hechas=loadJSON("bpna_hr_conf",{}), ya=hechas[b.nombre];
  if(ya&&Date.now()-ya<90*86400000){showToast("Ya lo confirmaste hace poco. ¡Gracias!");return;}
  var r=await guardarReporteHorario(b,"correcto",null,"");
  if(r.error){showToast("No se pudo guardar: "+r.error.message);return;}
  hechas[b.nombre]=Date.now();saveJSON("bpna_hr_conf",hechas);
  showToast("¡Gracias! Confirmación guardada");pintarConfirmaciones(b.nombre);
}
function reportarHorario(i){
  var b=BIBLIOTECAS[i]; if(!SOCIAL.user||!socialClient()){invitarSesionHorario();return;}
  var tipos=Object.keys(HR_TIPOS).map(function(k){return '<option value="'+k+'">'+escapeHTML(HR_TIPOS[k])+'</option>';}).join("");
  var dias='<option value="">Cualquier día / no aplica</option>'+[1,2,3,4,5,6,0].map(function(d){return '<option value="'+d+'">'+HR_DIAS_LARGOS[d]+'</option>';}).join("");
  openModal('<h3>Reportar horario incorrecto</h3><div class="sub">'+escapeHTML(b.nombre)+'</div>'+
    '<div class="field"><label for="hrTipo">¿Qué pasa?</label><select id="hrTipo">'+tipos+'</select></div>'+
    '<div class="field"><label for="hrDia">Día (opcional)</label><select id="hrDia">'+dias+'</select></div>'+
    '<div class="field"><label for="hrCom">Comentario (opcional)</label><textarea id="hrCom" rows="3" maxlength="500" style="width:100%;padding:11px 13px;border-radius:var(--r-m);border:1px solid rgba(148,163,184,.4);font:inherit;background:rgba(var(--blanco),.7);color:var(--texto)" placeholder="Ej: los sábados ya abre de 10:00 a 14:00"></textarea>'+
    '<div style="font-size:var(--fs-xs);color:var(--suave);text-align:right" id="hrCnt">0/500</div></div>'+
    '<button class="btn" id="hrSend">Enviar reporte</button>',function(){
    $("hrCom").addEventListener("input",function(){$("hrCnt").textContent=this.value.length+"/500";});
    $("hrSend").addEventListener("click",async function(){
      var btn=this; btn.disabled=true;
      var dv=$("hrDia").value, r=await guardarReporteHorario(b,$("hrTipo").value,dv===""?null:+dv,$("hrCom").value.trim());
      btn.disabled=false;
      if(r.error){showToast("No se pudo enviar: "+r.error.message);return;}
      closeModal();showToast("¡Gracias! Lo revisaremos");
    });
  });
}
function accesoAccesibilidadHTML(b){
  var ac=b.acceso||{tipo:"desconocido"}, ax=b.accesibilidad||{};
  var tipoTxt = ac.tipo==="libre" ? "🔓 Entrada libre y gratuita"
    : ac.tipo==="restringido" ? "🔒 Acceso restringido / requiere carnet"
    : "❔ Tipo de acceso: sin confirmar";
  var s='<div class="hours"><h4>Acceso</h4><div style="font-size:var(--fs-s);color:var(--suave)">'+escapeHTML(tipoTxt)+(ac.detalle?' · '+escapeHTML(ac.detalle):'')+'</div>';
  var badges=[];
  if(ax.sillaRuedas===true)badges.push("♿ Accesible en silla de ruedas");
  if(ax.sillaRuedas===false)badges.push("♿ No adaptada");
  if(ax.turistas===true)badges.push("🧳 Admite visitantes ocasionales");
  if(ax.gratisDias)badges.push("🎟️ "+escapeHTML(ax.gratisDias));
  if(badges.length)s+='<div style="font-size:var(--fs-s);color:var(--suave);margin-top:5px">'+badges.join(" · ")+'</div>';
  if(ax.notas&&ax.notas!=="Sin confirmar")s+='<div style="font-size:var(--fs-xs);color:var(--suave);margin-top:5px">'+escapeHTML(ax.notas)+'</div>';
  s+='</div>';
  return s;
}
function actualizarAcciones(b){
  var elName=$("selName"),actRuta=$("actRuta"),actTel=$("actTel"),actWeb=$("actWeb");
  if(!elName)return;
  if(!b){elName.textContent="Pincha una chincheta";elName.classList.add("empty");
    [actRuta,actTel,actWeb].forEach(function(a){a.classList.add("disabled");});return;}
  elName.textContent=b.nombre;elName.classList.remove("empty");
  actRuta.href="https://www.google.com/maps/dir/?api=1&destination="+b.lat+","+b.lon;actRuta.classList.remove("disabled");
  if(b.tel){actTel.href="tel:"+b.tel.replace(/\s/g,"");actTel.classList.remove("disabled");}else{actTel.classList.add("disabled");}
  if(b.web){actWeb.href=b.web;actWeb.classList.remove("disabled");}else{actWeb.classList.add("disabled");}
}
window.__selBib=function(i){
  var b=BIBLIOTECAS[i];actualizarAcciones(b);
  markers.forEach(function(mk,j){var el=mk&&mk.getElement&&mk.getElement();
    if(el){var ch=el.querySelector(".chincheta");if(ch)ch.classList.toggle("sel",j===i);}});
  document.querySelectorAll("#list .card").forEach(function(c){c.classList.toggle("active",+c.dataset.i===i);});
  if(window.__map&&markers[i]){
    var mk=markers[i], cap=window.__capaBibs;
    if(cap&&cap.zoomToShowLayer){window.__map.setView([b.lat,b.lon],16,{animate:false});cap.zoomToShowLayer(mk,function(){
      var el=mk.getElement&&mk.getElement();if(el){var ch=el.querySelector(".chincheta");if(ch)ch.classList.add("sel");}mk.openPopup();});}
    else{window.__map.flyTo([b.lat,b.lon],16,{duration:.6});mk.openPopup();}
  }
};
// La lista lateral se construye SIEMPRE (no depende de Leaflet)
function buildList(){
  window.__listReady=true;
  // Con el panel cerrado no se ve la lista: solo hace falta la tarjeta "Te recomiendo". Las 120 fichas
  // se construyen al abrirlo (abrirLista llama otra vez a buildList), no al arrancar ni en cada refresco.
  if($("libPanel").classList.contains("hidden")){renderNowCard();return;}
  var verano=esVerano(new Date());
  $("seasonTag").textContent=verano?"Horario de verano":"Horario de invierno";
  var list=$("list");list.innerHTML="";
  if(LIST_FILTERS.fav&&!nFavoritas())LIST_FILTERS.fav=false;
  syncListFilterButtons();
  var F=LIST_FILTERS, idx=[], q=normTxt(($("listSearch")||{}).value||"").trim();
  BIBLIOTECAS.forEach(function(b,i){
    if(F.fav&&!esFavorita(i))return;
    if(F.abiertas&&!estadoBib(b))return;
    if(F.pronto&&!abrePronto(b))return;
    if(F.tarde&&!abiertaHastaTarde(b))return;
    if(F.libre&&!(b.acceso&&b.acceso.tipo==="libre"))return;
    if(F.wifi&&!(b.recursos&&b.recursos.indexOf("wifi")!==-1))return;
    if(F.horario&&b.sinHorario)return;
    if(F.uni&&!(b.tipoBib==="universidad"||/universi|UPNA|campus|CRAI/i.test(b.nombre)))return;
    // texto de búsqueda normalizado una sola vez por biblioteca (antes se recalculaba en cada tecla)
    if(q&&(b._q||(b._q=normTxt(b.nombre+" "+(b.ciudad||"")+" "+(b.provincia||"")+" "+(b.dir||"")))).indexOf(q)===-1)return;
    idx.push(i);
  });
  if(F.cerca&&window.__userPos){
    var up=window.__userPos;
    idx.sort(function(a,c){return distMetros(up.lat,up.lon,BIBLIOTECAS[a].lat,BIBLIOTECAS[a].lon)-distMetros(up.lat,up.lon,BIBLIOTECAS[c].lat,BIBLIOTECAS[c].lon);});
  }else if(F.pronto){
    idx.sort(function(a,c){return abrePronto(BIBLIOTECAS[a]).enMin-abrePronto(BIBLIOTECAS[c]).enMin;});
  }else if(F.tarde){
    idx.sort(function(a,c){return horaCierre(BIBLIOTECAS[c])-horaCierre(BIBLIOTECAS[a]);});
  }
  if(!idx.length)list.innerHTML='<div class="empty-note">Ninguna biblioteca cumple estos filtros'+(F.wifi?' (el wifi solo figura donde está confirmado)':'')+(F.pronto?' (ninguna cerrada abre en los próximos '+PRONTO_MIN+' min)':'')+(F.tarde?' (ninguna abierta cierra a las 21:00 o más tarde)':'')+'.</div>';
  var total=idx.length, LIM=120;
  if(total>LIM){idx=idx.slice(0,LIM);}
  idx.forEach(function(i){
    var b=BIBLIOTECAS[i];
    var abierto=estadoBib(b), pr=F.pronto?abrePronto(b):null;
    var distTxt="";
    if(window.__userPos){
      var dm=distMetros(window.__userPos.lat,window.__userPos.lon,b.lat,b.lon);
      distTxt=" · 📍"+(dm<1000?Math.round(dm)+"m":(dm/1000).toFixed(1)+"km");
    }
    var card=document.createElement("div");card.className="card";card.dataset.i=i;
    card.innerHTML='<h3>'+(esFavorita(i)?'<span class="favmark" title="Favorita">★</span> ':'')+escapeHTML(cortoNombre(b.nombre))+'</h3><div class="row"><span class="dot '+(b.sinHorario?"unk":(abierto?"open":"closed"))+'"></span>'+escapeHTML(estadoTexto(b).txt+(pr?" (en "+(pr.enMin<60?pr.enMin+" min":Math.floor(pr.enMin/60)+" h "+(pr.enMin%60)+" min")+")":"")+(b.ciudad?" · "+b.ciudad:""))+escapeHTML(distTxt)+(b.rating!=null?'<span class="rate">★ '+b.rating.toFixed(1)+'</span>':'')+'</div>'+occStatusHTML(i,true);
    card.addEventListener("click",function(){window.__selBib(i);});
    list.appendChild(card);
  });
  var activos=Object.keys(F).some(function(k){return F[k];});
  if(total>LIM){var more=document.createElement("div");more.className="empty-note";more.textContent="Mostrando "+LIM+" de "+total+". Busca por nombre o ciudad, o usa «Más cercanas».";list.appendChild(more);}
  renderNowCard();
  activos=activos||!!q;
  $("panelCount").textContent=activos?(total+" de "+BIBLIOTECAS.length+" bibliotecas"):(BIBLIOTECAS.length+" bibliotecas en España");
}
function normTxt(t){return String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
// Filtros de la lista (se recuerdan en este navegador). "Más cercanas" pide la ubicación si aún no la hay.
// "Abiertas ahora" depende de la hora: se recalcula cada minuto aunque no lleguen datos nuevos.
setInterval(function(){if(!window.__listReady)return; if(LIST_FILTERS.abiertas||LIST_FILTERS.pronto||LIST_FILTERS.tarde)buildList(); else renderNowCard();},60000);
(function(){var ls=$("listSearch");if(!ls)return;var tmo;ls.addEventListener("input",function(){clearTimeout(tmo);tmo=setTimeout(buildList,200);});})();
var LIST_FILTERS=Object.assign({fav:false,abiertas:false,pronto:false,tarde:false,cerca:false,libre:false,wifi:false,horario:false,uni:false},loadJSON("bpna_list_filters",{}));
function syncListFilterButtons(){
  document.querySelectorAll("#listFilters button").forEach(function(btn){btn.classList.toggle("on",!!LIST_FILTERS[btn.dataset.f]);});
  var fb=document.querySelector('#listFilters [data-f="fav"]'),nf=nFavoritas(); if(fb)fb.textContent="★ Favoritas"+(nf?" ("+nf+")":"");
}
document.querySelectorAll("#listFilters button").forEach(function(btn){
  btn.addEventListener("click",function(e){
    e.stopPropagation();
    var f=btn.dataset.f;
    if(f==="fav"&&!LIST_FILTERS.fav&&!nFavoritas()){showToast("Pulsa ☆ en una biblioteca para añadirla a favoritas");return;}
    LIST_FILTERS[f]=!LIST_FILTERS[f];
    // "Abren pronto" (cerradas) no se puede combinar con "Abiertas ahora" ni con "Hasta tarde"
    if(LIST_FILTERS[f]){if(f==="pronto"){LIST_FILTERS.abiertas=false;LIST_FILTERS.tarde=false;}else if(f==="abiertas"||f==="tarde")LIST_FILTERS.pronto=false;}
    saveJSON("bpna_list_filters",LIST_FILTERS);
    if(f==="cerca"&&LIST_FILTERS.cerca&&!window.__userPos){locateMe();}
    buildList();
  });
});
// Color de la chincheta según la afluencia reportada (sin números): verde/ámbar/rojo, gris si está cerrada, morado si no hay datos.
// Solo hay unas pocas variantes de chincheta: se reutiliza un L.divIcon por variante en vez de crear 2616.
// Las de horario sin confirmar nunca cuentan como abiertas, así que no se calcula su estado.
var _iconosChincheta={};
function chinchetaIcon(i){
  var b=BIBLIOTECAS[i], abierto=!b.sinHorario&&estadoBib(b);
  var occClass="";
  if(abierto){var o=occSummary(i); if(o)occClass=" occ-"+o.level;}
  var cls="chincheta"+(b.sinHorario?" unk":(abierto?"":" closed"))+occClass;
  return _iconosChincheta[cls]||(_iconosChincheta[cls]=L.divIcon({className:"",html:'<div class="'+cls+'"><div class="cuerpo"></div><div class="punta"></div></div>',iconSize:[34,44],iconAnchor:[17,44],popupAnchor:[0,-44]}));
}
// "Mi ubicación": la pinta en el propio mapa, nunca abre Google Maps ni ninguna app externa.
window.__userPos=null;
window.__userMarker=null;
function locateMe(){
  if(!navigator.geolocation){showToast("Tu navegador no admite geolocalización");return;}
  var btn=$("btnLocate"); if(btn)btn.classList.add("active");
  navigator.geolocation.getCurrentPosition(function(pos){
    window.__userPos={lat:pos.coords.latitude,lon:pos.coords.longitude};
    if(window.__map){
      var icon=L.divIcon({className:"",html:'<div class="user-dot-wrap"><div class="user-dot"></div></div>',iconSize:[20,20],iconAnchor:[10,10]});
      if(window.__userMarker){window.__userMarker.setLatLng([window.__userPos.lat,window.__userPos.lon]);}
      else{window.__userMarker=L.marker([window.__userPos.lat,window.__userPos.lon],{icon:icon,zIndexOffset:1000}).addTo(window.__map).bindPopup('<div class="pop" style="text-align:center"><b>📍 Estás aquí</b></div>');}
      window.__map.flyTo([window.__userPos.lat,window.__userPos.lon],15,{duration:.6});
    }
    buildList();renderNowCard();
    if(markers&&markers.length)markers.forEach(function(mk,j){if(mk.getPopup()&&mk.isPopupOpen())mk.getPopup().update();});
    showToast("Ubicación encontrada");
  },function(err){
    if(btn)btn.classList.remove("active");
    showToast(err.code===1?"Permiso de ubicación denegado":"No se pudo obtener tu ubicación");
    if(LIST_FILTERS.cerca&&!window.__userPos){LIST_FILTERS.cerca=false;saveJSON("bpna_list_filters",LIST_FILTERS);buildList();}
  },{timeout:8000,enableHighAccuracy:true});
}
// El mapa con chinchetas se monta cuando Leaflet está disponible
function initMap(){
  if(typeof L==="undefined"){if((initMap._n=(initMap._n||0)+1)<40)setTimeout(initMap,250);return;}
  window.__mapReady=true;
  var map=L.map("map",{zoomControl:false,scrollWheelZoom:true,minZoom:5,maxZoom:18}).setView([42.812,-1.652],13.5);
  window.__map=map;
  L.control.zoom({position:"bottomright"}).addTo(map);
  document.getElementById("map").style.background="#eef2f7";

  // ====== PLANO VECTORIAL DE NAVARRA (respaldo sin servidores) ======
  var PLANO={"navarra":{"type":"MultiPolygon","coordinates":[[[[-1.6523,43.3102],[-1.6245,43.3058],[-1.63,43.285],[-1.6087,43.252],[-1.5757,43.2499],[-1.5564,43.2794],[-1.5641,43.2888],[-1.5355,43.2949],[-1.4378,43.2669],[-1.4137,43.2737],[-1.3843,43.2537],[-1.3814,43.1897],[-1.4022,43.1779],[-1.4141,43.1283],[-1.4734,43.0866],[-1.4412,43.0464],[-1.3542,43.0281],[-1.3326,43.1076],[-1.27,43.1183],[-1.309,43.0712],[-1.2627,43.044],[-1.2126,43.0517],[-1.1456,43.0258],[-1.1419,43.0074],[-1.1147,43.0239],[-1.0813,43.0006],[-1.0121,42.9926],[-0.9451,42.9534],[-0.9085,42.9645],[-0.8096,42.9514],[-0.7559,42.9681],[-0.7239,42.9224],[-0.7832,42.9217],[-0.8191,42.9007],[-0.8185,42.8694],[-0.8568,42.8469],[-0.86,42.7986],[-0.8475,42.7859],[-0.8656,42.7629],[-0.9005,42.7605],[-0.9005,42.7431],[-0.923,42.744],[-0.9487,42.7115],[-1.028,42.7001],[-1.0368,42.6516],[-1.0519,42.6426],[-1.152,42.6479],[-1.1571,42.6109],[-1.1798,42.6106],[-1.158,42.5992],[-1.2019,42.5782],[-1.2028,42.5497],[-1.2707,42.5489],[-1.2935,42.511],[-1.2728,42.4819],[-1.3415,42.4239],[-1.3599,42.378],[-1.3291,42.3554],[-1.3991,42.2913],[-1.3914,42.2721],[-1.4175,42.2124],[-1.3919,42.1814],[-1.3989,42.1262],[-1.3668,42.107],[-1.3523,42.0731],[-1.3106,42.0723],[-1.3048,42.0429],[-1.4182,41.9136],[-1.4776,41.9249],[-1.5593,41.9139],[-1.6541,41.9654],[-1.7152,41.957],[-1.7669,41.9958],[-1.8337,41.9951],[-1.9016,42.0297],[-1.9023,42.0739],[-1.8324,42.1482],[-1.779,42.1377],[-1.7397,42.1497],[-1.7199,42.1334],[-1.6797,42.1517],[-1.7009,42.1731],[-1.6795,42.1911],[-1.7042,42.192],[-1.7253,42.2145],[-1.8023,42.2234],[-1.8498,42.2593],[-1.8723,42.2527],[-1.8707,42.289],[-1.9138,42.3001],[-1.9185,42.327],[-1.9645,42.3338],[-1.9955,42.3636],[-2.09,42.347],[-2.0786,42.3681],[-2.1155,42.3991],[-2.1119,42.42],[-2.175,42.4078],[-2.2745,42.4455],[-2.288,42.4674],[-2.2987,42.4574],[-2.33,42.4688],[-2.345,42.4513],[-2.3522,42.4656],[-2.4002,42.4718],[-2.4238,42.5096],[-2.3922,42.517],[-2.3968,42.5991],[-2.4211,42.6071],[-2.4532,42.5671],[-2.4622,42.5874],[-2.4906,42.5854],[-2.4993,42.6105],[-2.4158,42.6627],[-2.3763,42.6507],[-2.3819,42.6343],[-2.2885,42.6551],[-2.2936,42.6779],[-2.3169,42.6825],[-2.324,42.7238],[-2.3169,42.7393],[-2.2622,42.7485],[-2.281,42.7851],[-2.2337,42.8405],[-2.2531,42.8928],[-2.2378,42.896],[-2.2356,42.9266],[-2.2103,42.9499],[-2.181,42.9351],[-2.1176,42.9422],[-2.0952,42.9726],[-2.0383,42.981],[-2.0283,42.9988],[-2.0414,43.0297],[-2.0204,43.0467],[-2.0228,43.0652],[-1.9475,43.0975],[-1.902,43.1359],[-1.9207,43.1506],[-1.9142,43.2252],[-1.8819,43.2068],[-1.8809,43.2288],[-1.8677,43.2305],[-1.8606,43.2121],[-1.795,43.2469],[-1.7832,43.2868],[-1.6523,43.3102]]],[[[-1.0962,42.4857],[-1.0544,42.4488],[-1.0564,42.4343],[-1.1294,42.4467],[-1.0962,42.4857]]],[[[-1.1486,42.441],[-1.1584,42.41],[-1.1878,42.403],[-1.1828,42.4246],[-1.1486,42.441]]]]},"vecinas":[{"type":"MultiPolygon","coordinates":[[[[-2.9972,42.6421],[-2.853,42.6362],[-2.8188,42.6127],[-2.823,42.5547],[-2.7408,42.6226],[-2.6805,42.5945],[-2.7057,42.5172],[-2.6758,42.5257],[-2.6477,42.4833],[-2.6054,42.5035],[-2.597,42.4729],[-2.5305,42.4836],[-2.5097,42.5201],[-2.5147,42.4901],[-2.4156,42.4906],[-2.3458,42.4514],[-2.288,42.4674],[-2.175,42.4078],[-2.1119,42.42],[-2.09,42.347],[-1.9711,42.3535],[-1.8707,42.289],[-1.8723,42.2527],[-1.6801,42.1916],[-1.7009,42.1731],[-1.6797,42.1517],[-1.8324,42.1482],[-1.9092,42.0591],[-1.8472,42.008],[-1.8565,41.9664],[-1.9703,41.9191],[-2.1144,41.9611],[-2.1076,42.0028],[-2.1619,42.0667],[-2.1334,42.1011],[-2.2696,42.0886],[-2.3182,42.1452],[-2.5147,42.1145],[-2.5149,42.0689],[-2.5799,41.9963],[-2.747,42.0093],[-2.7059,42.1036],[-2.7347,42.125],[-2.7916,42.1088],[-2.798,42.0468],[-2.8895,42.0104],[-2.9312,42.0868],[-3.0344,42.086],[-3.1295,42.199],[-3.0886,42.2457],[-3.1097,42.3514],[-3.0635,42.3567],[-3.1013,42.4168],[-3.0569,42.3703],[-3.046,42.4452],[-3.0947,42.4881],[-3.0726,42.5289],[-3.1343,42.5421],[-3.0598,42.5892],[-3.0842,42.6407],[-2.9972,42.6421]],[[-2.9452,42.6039],[-2.9226,42.6008],[-2.9452,42.6039]],[[-2.999,42.6018],[-2.999,42.6018]]]]},{"type":"MultiPolygon","coordinates":[[[[-2.7515,43.4566],[-2.6957,43.4068],[-2.5097,43.3774],[-2.3529,43.2987],[-2.2024,43.3117],[-2.1305,43.2875],[-1.9238,43.332],[-1.7913,43.3959],[-1.7892,43.353],[-1.7374,43.3302],[-1.7294,43.2938],[-1.7832,43.2868],[-1.795,43.2469],[-1.8606,43.2121],[-1.9142,43.2252],[-1.902,43.1359],[-2.0228,43.0652],[-2.0383,42.981],[-2.2322,42.9318],[-2.2354,42.8353],[-2.281,42.7851],[-2.2622,42.7485],[-2.324,42.7238],[-2.2885,42.6551],[-2.3819,42.6343],[-2.4158,42.6627],[-2.5001,42.6165],[-2.4532,42.5671],[-2.3968,42.5991],[-2.3922,42.517],[-2.4206,42.4892],[-2.5147,42.4901],[-2.5106,42.52],[-2.5298,42.4839],[-2.5946,42.4724],[-2.605,42.5034],[-2.6463,42.483],[-2.6758,42.5257],[-2.7055,42.5168],[-2.6818,42.5954],[-2.7637,42.6228],[-2.825,42.5549],[-2.8188,42.6127],[-2.8957,42.6546],[-2.9025,42.6936],[-2.9806,42.7038],[-3.0497,42.7656],[-3.1479,42.7567],[-3.1233,42.7893],[-3.1592,42.8046],[-3.1149,42.8892],[-3.1907,42.8695],[-3.2055,42.8274],[-3.2791,42.8724],[-3.2247,42.9497],[-3.0921,42.8988],[-2.9812,42.9394],[-3.0603,43.0035],[-3.1778,43.022],[-3.1419,43.0298],[-3.1582,43.074],[-3.1339,43.0972],[-3.1818,43.1209],[-3.1483,43.174],[-3.2241,43.1701],[-3.2534,43.1986],[-3.4176,43.1334],[-3.4493,43.2331],[-3.3324,43.3019],[-3.1573,43.3013],[-3.1533,43.3533],[-3.0852,43.3777],[-3.1045,43.3647],[-3.0207,43.3255],[-3.0396,43.3733],[-2.9469,43.436],[-2.807,43.4305],[-2.7515,43.4566]],[[-2.8355,42.7963],[-2.8685,42.7399],[-2.7679,42.666],[-2.5174,42.6463],[-2.522,42.684],[-2.5778,42.6682],[-2.609,42.696],[-2.5583,42.7627],[-2.8355,42.7963]],[[-3.2748,43.2645],[-3.3058,43.2535],[-3.285,43.1977],[-3.2511,43.2487],[-3.2748,43.2645]],[[-2.2688,43.3006],[-2.2688,43.3006]],[[-1.799,43.392],[-1.799,43.392]],[[-1.8096,43.3885],[-1.8096,43.3885]]],[[[-2.6842,43.4261],[-2.6842,43.4261]]],[[[-2.4937,43.3683],[-2.4937,43.3683]]],[[[-1.998,43.3224],[-1.998,43.3224]]],[[[-2.7743,43.4505],[-2.7743,43.4505]]],[[[-2.9348,43.4411],[-2.9348,43.4411]]],[[[-3.0785,43.3541],[-3.0785,43.3541]]],[[[-2.1497,43.2962],[-2.1497,43.2962]]],[[[-2.8153,43.4332],[-2.8153,43.4332]]],[[[-2.5716,43.3911],[-2.5716,43.3911]]],[[[-2.4084,43.3237],[-2.4084,43.3237]]],[[[-2.4185,43.3267],[-2.4185,43.3267]]],[[[-2.79,43.4436],[-2.79,43.4436]]],[[[-2.4192,43.3277],[-2.4192,43.3277]]],[[[-2.8446,43.4326],[-2.8446,43.4326]]],[[[-2.422,43.3295],[-2.422,43.3295]]],[[[-2.4452,43.3337],[-2.4452,43.3337]]],[[[-2.7531,43.4569],[-2.7531,43.4569]]],[[[-2.4396,43.3334],[-2.4396,43.3334]]],[[[-2.7899,43.4426],[-2.7899,43.4426]]],[[[-2.4008,43.3222],[-2.4008,43.3222]]],[[[-2.3577,43.3042],[-2.3577,43.3042]]],[[[-2.4093,43.3232],[-2.4093,43.3232]]],[[[-2.4516,43.3357],[-2.4516,43.3357]]],[[[-2.4074,43.3231],[-2.4074,43.3231]]],[[[-2.4493,43.335],[-2.4493,43.335]]],[[[-2.4499,43.3351],[-2.4499,43.3351]]],[[[-2.4396,43.333],[-2.4396,43.333]]],[[[-2.419,43.3275],[-2.419,43.3275]]],[[[-2.4396,43.3332],[-2.4396,43.3332]]],[[[-2.4524,43.3359],[-2.4524,43.3359]]]]},{"type":"MultiPolygon","coordinates":[[[[-0.7473,42.9224],[-0.5676,42.7806],[-0.5053,42.8274],[-0.3947,42.799],[-0.3133,42.8494],[-0.16,42.798],[-0.1064,42.7206],[-0.0167,42.6851],[0.1758,42.737],[0.26,42.716],[0.2953,42.6732],[0.3602,42.7243],[0.4221,42.6905],[0.6601,42.6909],[0.7036,42.6238],[0.7675,42.6112],[0.7495,42.5349],[0.7212,42.5245],[0.7398,42.5052],[0.6905,42.4876],[0.7461,42.3848],[0.7233,42.3656],[0.7713,42.3506],[0.7404,42.3369],[0.7646,42.3225],[0.6629,42.0122],[0.5619,41.9382],[0.6075,41.9193],[0.6072,41.8718],[0.4686,41.765],[0.3987,41.7578],[0.327,41.6782],[0.3496,41.5995],[0.4285,41.6024],[0.4469,41.5422],[0.3967,41.4903],[0.342,41.484],[0.3553,41.4518],[0.32,41.3942],[0.374,41.3515],[0.3484,41.3289],[0.3813,41.2364],[0.3224,41.2252],[0.292,41.1564],[0.2009,41.1261],[0.2177,41.0437],[0.2797,41.0202],[0.2586,41.0146],[0.2935,40.9706],[0.2389,40.8847],[0.2782,40.8209],[0.23,40.7674],[0.1592,40.7506],[0.1638,40.7236],[0.0422,40.691],[0.0157,40.7284],[-0.0647,40.7274],[-0.165,40.7886],[-0.224,40.7542],[-0.236,40.6911],[-0.378,40.6675],[-0.3705,40.6136],[-0.2933,40.611],[-0.3018,40.5154],[-0.2726,40.4738],[-0.3474,40.4439],[-0.2818,40.3657],[-0.3886,40.3069],[-0.3836,40.2648],[-0.4281,40.2438],[-0.5442,40.2517],[-0.5786,40.1373],[-0.6285,40.1026],[-0.6136,40.07],[-0.7536,40.0466],[-0.7776,39.9984],[-0.8378,39.9768],[-0.8404,39.925],[-0.7977,39.8811],[-0.8674,39.8468],[-0.9126,39.8724],[-0.9205,39.9644],[-1.1424,39.9718],[-1.1652,40.0101],[-1.0721,40.0605],[-1.148,40.1145],[-1.2446,40.1158],[-1.2978,40.2115],[-1.3197,40.1464],[-1.4333,40.1395],[-1.4392,40.197],[-1.5405,40.1908],[-1.6903,40.3097],[-1.7212,40.2787],[-1.6977,40.3213],[-1.802,40.4113],[-1.6925,40.4868],[-1.6781,40.591],[-1.5987,40.5621],[-1.5455,40.5952],[-1.5423,40.8112],[-1.6214,40.8804],[-1.6174,40.9437],[-1.8033,41.0899],[-1.959,41.1725],[-2.0517,41.1468],[-2.1462,41.1844],[-2.1737,41.2881],[-2.1015,41.4458],[-2.0356,41.4269],[-2.0293,41.3842],[-1.9373,41.4079],[-1.9811,41.4864],[-1.9673,41.5461],[-1.9932,41.6005],[-1.9231,41.5983],[-1.7869,41.6994],[-1.7754,41.7248],[-1.8529,41.7896],[-1.8176,41.8534],[-1.8573,41.9095],[-1.8472,42.008],[-1.5593,41.9139],[-1.4108,41.919],[-1.3048,42.0429],[-1.3989,42.1262],[-1.4175,42.2124],[-1.3991,42.2913],[-1.3291,42.3554],[-1.3599,42.378],[-1.3415,42.4239],[-1.2728,42.4819],[-1.2881,42.5228],[-1.2648,42.5568],[-1.2028,42.5497],[-1.152,42.6479],[-1.0519,42.6426],[-1.028,42.7001],[-0.8648,42.7634],[-0.8191,42.9007],[-0.7473,42.9224]],[[-1.1256,42.4559],[-1.051,42.4415],[-1.0917,42.4857],[-1.1256,42.4559]],[[-1.149,42.4328],[-1.1878,42.403],[-1.149,42.4328]]]]},{"type":"MultiPolygon","coordinates":[[[[-4.8936,43.2385],[-4.8392,43.1898],[-4.8514,43.1259],[-4.744,43.0564],[-4.7393,43.0223],[-4.5584,43.0195],[-4.4476,43.0585],[-4.3485,42.9726],[-4.2402,42.9565],[-4.2247,42.8568],[-4.1443,42.8686],[-4.1285,42.8463],[-4.1827,42.8103],[-4.0717,42.7605],[-4.0074,42.8311],[-3.9789,42.7581],[-3.911,42.7684],[-3.8944,42.8045],[-3.8222,42.7996],[-3.8267,42.8709],[-3.8637,42.8898],[-3.8802,42.8514],[-3.9243,42.8892],[-3.8335,42.918],[-3.8395,42.9398],[-3.8874,42.9488],[-3.9335,42.8996],[-3.9872,42.9405],[-3.9455,43.0058],[-3.8508,43.0392],[-3.847,43.0844],[-3.7646,43.081],[-3.6518,43.1808],[-3.4448,43.1315],[-3.2534,43.1986],[-3.2241,43.1701],[-3.1483,43.174],[-3.1818,43.1209],[-3.1339,43.0972],[-3.1582,43.074],[-3.1419,43.0298],[-3.1778,43.022],[-3.0603,43.0035],[-2.9813,42.9391],[-3.0921,42.8988],[-3.2247,42.9497],[-3.2826,42.8755],[-3.2055,42.8274],[-3.1907,42.8695],[-3.1149,42.8892],[-3.1592,42.8046],[-3.1233,42.7893],[-3.1479,42.7567],[-3.0497,42.7656],[-2.9806,42.7038],[-2.9025,42.6936],[-2.8581,42.6382],[-3.0842,42.6407],[-3.0598,42.5892],[-3.1343,42.5421],[-3.0726,42.5289],[-3.0947,42.4881],[-3.046,42.4452],[-3.0569,42.3703],[-3.1013,42.4168],[-3.0635,42.3567],[-3.1097,42.3514],[-3.0886,42.2457],[-3.1294,42.1985],[-3.0344,42.086],[-2.9353,42.0894],[-2.8838,42.0095],[-2.798,42.0468],[-2.7749,42.1235],[-2.7347,42.125],[-2.7059,42.1036],[-2.747,42.0093],[-2.5799,41.9963],[-2.5149,42.0689],[-2.5147,42.1145],[-2.3182,42.1452],[-2.2696,42.0886],[-2.1273,42.0972],[-2.1619,42.0667],[-2.1076,42.0028],[-2.11,41.9579],[-1.9703,41.9191],[-1.8559,41.9663],[-1.8176,41.8534],[-1.8529,41.7896],[-1.7754,41.7248],[-1.7869,41.6994],[-1.9231,41.5983],[-1.9932,41.6005],[-1.9673,41.5461],[-1.9811,41.4864],[-1.9373,41.4079],[-2.0293,41.3842],[-2.0356,41.4269],[-2.1015,41.4458],[-2.116,41.382],[-2.1631,41.3554],[-2.1462,41.1844],[-2.0517,41.1468],[-2.0482,41.0784],[-2.1319,41.1181],[-2.1753,41.0838],[-2.2321,41.097],[-2.3234,41.0565],[-2.3553,41.0865],[-2.4189,41.0577],[-2.5365,41.1625],[-2.5953,41.1503],[-2.5775,41.1787],[-2.6221,41.188],[-2.5895,41.2245],[-2.6292,41.2152],[-2.7168,41.2757],[-2.8222,41.2566],[-2.8884,41.3252],[-3.0619,41.2734],[-3.1998,41.3044],[-3.2543,41.2584],[-3.4151,41.2732],[-3.4025,41.2136],[-3.6137,41.1491],[-3.7814,41.0003],[-3.9072,40.9553],[-3.9797,40.7846],[-4.0767,40.7889],[-4.1716,40.6806],[-4.1612,40.6235],[-4.2454,40.6024],[-4.2907,40.6278],[-4.2893,40.5642],[-4.3282,40.5338],[-4.3211,40.4103],[-4.4217,40.4062],[-4.4558,40.3194],[-4.5462,40.3418],[-4.5294,40.2931],[-4.5695,40.2573],[-4.5657,40.2182],[-4.6542,40.1981],[-4.6873,40.212],[-4.6981,40.2822],[-4.8043,40.2751],[-4.8077,40.2353],[-4.9247,40.17],[-4.9255,40.136],[-5.0058,40.1097],[-5.0185,40.1591],[-5.1716,40.0848],[-5.3188,40.1075],[-5.3679,40.163],[-5.3437,40.2644],[-5.5411,40.1959],[-5.6145,40.2183],[-5.6927,40.2921],[-5.7931,40.2867],[-5.7991,40.3537],[-5.885,40.3261],[-5.9172,40.2777],[-5.9685,40.2896],[-6.016,40.3403],[-6.1057,40.3568],[-6.065,40.3966],[-6.1295,40.4208],[-6.1161,40.4416],[-6.2305,40.4866],[-6.5363,40.3472],[-6.587,40.2707],[-6.6901,40.2427],[-6.7182,40.2692],[-6.7556,40.2389],[-6.8468,40.2544],[-6.8629,40.2974],[-6.781,40.3647],[-6.8497,40.4526],[-6.795,40.5119],[-6.8008,40.5506],[-6.8448,40.5659],[-6.7939,40.6617],[-6.8312,40.7526],[-6.8261,40.8432],[-6.8003,40.8483],[-6.9301,41.0301],[-6.8084,41.0365],[-6.754,41.1028],[-6.7674,41.1352],[-6.6478,41.2476],[-6.497,41.2656],[-6.3796,41.3572],[-6.3899,41.3854],[-6.3183,41.3861],[-6.3328,41.4115],[-6.1894,41.575],[-6.3022,41.6627],[-6.4445,41.6848],[-6.4985,41.6571],[-6.5482,41.6856],[-6.569,41.7435],[-6.5158,41.8707],[-6.5712,41.8836],[-6.5458,41.9359],[-6.5738,41.9607],[-6.6993,41.9333],[-6.7856,41.9889],[-6.8444,41.9423],[-6.9845,41.9736],[-6.9611,42.0279],[-7.0336,42.0742],[-6.8782,42.2195],[-6.7871,42.2157],[-6.8032,42.2387],[-6.7411,42.2987],[-6.734,42.3591],[-6.8423,42.4036],[-6.8143,42.4274],[-6.8267,42.493],[-6.9322,42.5205],[-6.9785,42.4933],[-7.0771,42.5082],[-7.0336,42.5841],[-7.047,42.6327],[-7.0044,42.6429],[-7.0452,42.6948],[-6.8674,42.7872],[-6.8403,42.8234],[-6.8713,42.8738],[-6.8149,42.8708],[-6.848,42.9143],[-6.7715,42.8826],[-6.6899,42.9225],[-6.4898,42.9202],[-6.4331,42.9398],[-6.4781,42.9912],[-6.4241,42.9879],[-6.3591,43.0596],[-6.2268,43.0089],[-6.2156,43.0472],[-6.1367,43.021],[-6.096,43.0313],[-6.0819,43.0757],[-5.975,43.0654],[-5.9146,42.9927],[-5.804,42.9626],[-5.7639,42.9701],[-5.6933,43.0565],[-5.4938,43.0214],[-5.4785,43.0549],[-5.3905,43.0493],[-5.3691,43.0946],[-5.1017,43.1018],[-5.0759,43.1815],[-4.9969,43.1731],[-4.8936,43.2385]],[[-4.3222,40.6511],[-4.2539,40.6619],[-4.29,40.6806],[-4.3222,40.6511]]],[[[-2.8277,42.788],[-2.5583,42.7627],[-2.609,42.696],[-2.5778,42.6682],[-2.522,42.684],[-2.5174,42.6463],[-2.7679,42.666],[-2.8685,42.7399],[-2.8277,42.788]]],[[[-4.098,42.8237],[-4.101,42.794],[-4.098,42.8237]]],[[[-2.9349,42.5944],[-2.9349,42.5944]]],[[[-4.1686,42.8115],[-4.1686,42.8115]]],[[[-2.9919,42.6046],[-2.9919,42.6046]]]]}]};
  function geomToLatLngs(geom){
    function ring(r){return r.map(function(c){return [c[1],c[0]];});}
    if(geom.type==="Polygon") return geom.coordinates.map(ring);
    return geom.coordinates.map(function(poly){return poly.map(ring);});
  }
  var capaPlano=L.layerGroup();
  PLANO.vecinas.forEach(function(g){
    L.polygon(geomToLatLngs(g),{stroke:true,color:"#dbe1ea",weight:1,fill:true,fillColor:"#e4e9f0",fillOpacity:1,interactive:false}).addTo(capaPlano);
  });
  L.polygon(geomToLatLngs(PLANO.navarra),{stroke:true,color:"#8b7bef",weight:2,fill:true,fillColor:"#fbfaff",fillOpacity:1,interactive:false}).addTo(capaPlano);

  // ====== MAPA BASE: calles; si el servidor de teselas falla, plano vectorial sin servidores ======
  var capaCalles=L.tileLayer("https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    {attribution:"&copy; OpenStreetMap contributors",maxZoom:18}).addTo(map);
  var fallos=0;
  capaCalles.on("tileerror",function(){
    if(++fallos===8&&map.hasLayer(capaCalles)){map.removeLayer(capaCalles);capaPlano.addTo(map);}
  });
  markers=[];
  // Vista inicial fijada ANTES de añadir las chinchetas: si se encuadra después, el cambio de
  // zoom hace que markercluster reagrupe con animación las chinchetas ya puestas (_forceLayout).
  // Vista inicial: tu biblioteca habitual si la tienes; si no, toda España (península y Baleares).
  var hab0=-1;try{hab0=bibHabitual();}catch(e){}
  if(hab0>=0)map.setView([BIBLIOTECAS[hab0].lat,BIBLIOTECAS[hab0].lon],12,{animate:false});
  else map.fitBounds(L.latLngBounds([[36.0,-9.3],[43.8,4.3]]),{animate:false});
  // Con miles de bibliotecas, las muy próximas se agrupan, pero el grupo también es una chincheta
  // (con el número encima) y a partir del zoom 11 cada biblioteca tiene la suya.
  var capaBibs=(L.markerClusterGroup?L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:28,disableClusteringAtZoom:11,spiderfyOnMaxZoom:false,
    iconCreateFunction:function(c){var n=c.getChildCount();
      return L.divIcon({className:"",html:'<div class="chincheta grupo"><div class="cuerpo"></div><div class="punta"></div><b class="cnt">'+(n>999?"999+":n)+'</b></div>',iconSize:[34,44],iconAnchor:[17,44]});}
  }):L.layerGroup()).addTo(map);
  window.__capaBibs=capaBibs;
  map.attributionControl.addAttribution("Bibliotecas: &copy; Overture Maps Foundation");
  // El contenido del popup se genera al abrirlo (función), no para las 2616 de golpe,
  // y las chinchetas se añaden al grupo en un solo lote (addLayers) en vez de una a una.
  BIBLIOTECAS.forEach(function(b,i){
    var mk=L.marker([b.lat,b.lon],{icon:chinchetaIcon(i)}).bindPopup(function(){return popupHTML(BIBLIOTECAS[i],i);},{maxWidth:280,offset:[0,4]});
    mk.on("click",function(){window.__selBib(i);});
    markers.push(mk);
  });
  if(capaBibs.addLayers)capaBibs.addLayers(markers);else markers.forEach(function(mk){capaBibs.addLayer(mk);});
  socialRenderFriendMarkers();
}

/* ===================== MODO ESTUDIO ===================== */
var studyTimer={running:false,start:0,bibIndex:null,tick:null};
function distMetros(la1,lo1,la2,lo2){
  var R=6371000,toR=Math.PI/180;
  var dLa=(la2-la1)*toR,dLo=(lo2-lo1)*toR;
  var a=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(la1*toR)*Math.cos(la2*toR)*Math.sin(dLo/2)*Math.sin(dLo/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function startStudyAt(i){
  if(pomo.running){showToast("Tienes un Pomodoro en marcha: páusalo antes de usar el cronómetro");return;}
  if(studyTimer.running){ if(!confirm("Ya hay una sesión en curso. ¿Terminarla y empezar otra?"))return; stopStudy(true); }
  if(i<0){arrancarSesion(-1,false);return;}
  // check-in con ubicación si está activado
  if(DATA&&DATA.geoCheck&&navigator.geolocation){
    showToast("Comprobando que estás en la biblioteca…");
    navigator.geolocation.getCurrentPosition(function(pos){
      var d=distMetros(pos.coords.latitude,pos.coords.longitude,BIBLIOTECAS[i].lat,BIBLIOTECAS[i].lon);
      if(d>400){
        if(!confirm("Parece que estás a "+Math.round(d)+" m de "+BIBLIOTECAS[i].nombre+". ¿Empezar la sesión igualmente? (no se marcará como verificada)")){return;}
        arrancarSesion(i,false);
      }else{
        arrancarSesion(i,true);
        showToast("✓ Check-in verificado");
      }
    },function(){ // error/permiso denegado
      if(confirm("No se pudo obtener tu ubicación. ¿Empezar la sesión sin verificar?"))arrancarSesion(i,false);
    },{timeout:8000,enableHighAccuracy:true});
  }else{
    arrancarSesion(i,false);
  }
}
// Cuenta atrás de arranque (no retrasa el cronómetro: es solo el ritual de empezar).
function cuentaAtras(){
  if(sinMovimiento())return;
  var o=document.createElement("div");o.className="cuenta";document.body.appendChild(o);
  var pasos=["3","2","1","🌱"],k=0;
  (function paso(){if(k>=pasos.length){o.innerHTML='<span class="ct-txt">¡A por ello!</span>';setTimeout(function(){o.classList.add("out");setTimeout(function(){o.remove();},400);},650);return;}
    o.innerHTML='<span class="ct-n">'+pasos[k]+'</span>';k++;setTimeout(paso,520);})();
  o.addEventListener("click",function(){o.remove();});
}
function arrancarSesion(i,verificada){
  cuentaAtras();
  studyTimer.running=true;studyTimer.start=Date.now();studyTimer.bibIndex=i;studyTimer.verificada=!!verificada;
  studyTimer.subject=DATA.currentSubject||null;
  // Se guarda para no perderla si el móvil cierra la app en segundo plano.
  DATA.active={start:studyTimer.start,bibIndex:i,verificada:!!verificada,subject:studyTimer.subject};saveUserData();
  focusStart();
  startTick();
  $("miniStudy").classList.remove("hidden");renderNowCard();
  $("miniPlace").textContent=i>=0?cortoNombre(BIBLIOTECAS[i].nombre):"Estudiando";
  studyTimer.avisoCierre=false;
  renderStudy();
  socialHeartbeat();
}
// "Empezar" con un toque: si estás a menos de 400 m de una biblioteca, empieza ahí;
// si no, pregunta dónde estás con las opciones más probables arriba.
function startStudyCurrent(){
  function conPos(pos){
    if(pos){
      var best=-1,bd=1e9;
      BIBLIOTECAS.forEach(function(b,i){var d=distMetros(pos.lat,pos.lon,b.lat,b.lon);if(d<bd){bd=d;best=i;}});
      if(best>=0&&bd<=400&&(minutosHastaCierre(BIBLIOTECAS[best])>0||BIBLIOTECAS[best].sinHorario)){showToast("📍 Estás en "+cortoNombre(BIBLIOTECAS[best].nombre));startStudyAt(best);return;}
    }
    elegirLugarEstudio();
  }
  if(window.__userPos){conPos(window.__userPos);return;}
  if(!navigator.geolocation){conPos(null);return;}
  navigator.geolocation.getCurrentPosition(function(p){window.__userPos={lat:p.coords.latitude,lon:p.coords.longitude};conPos(window.__userPos);},function(){conPos(null);},{timeout:6000,maximumAge:120000});
}
function elegirLugarEstudio(){
  var ops=[],vistos={};
  function add(i,etq){if(i==null||i<0||vistos[i])return;vistos[i]=1;ops.push({i:i,etq:etq});}
  var hab=bibHabitual(); if(hab>=0)add(hab,"⭐ Tu habitual");
  recomendarBiblioteca().slice(0,4).forEach(function(c){if(c.dist==null||c.dist<25000)add(c.i,c.dist!=null?"📍 "+fmtDist(c.dist):"Abierta");});
  if(window.__userPos){var up=window.__userPos;
    BIBLIOTECAS.map(function(b,i){return {i:i,d:distMetros(up.lat,up.lon,b.lat,b.lon)};}).filter(function(o){return BIBLIOTECAS[o.i].sinHorario&&o.d<25000;})
      .sort(function(a,b){return a.d-b.d;}).slice(0,4).forEach(function(o){add(o.i,"📍 "+fmtDist(o.d)+" · horario sin confirmar");});}
  var html='<h3>¿Dónde estudias?</h3><div class="sub">No estás junto a ninguna biblioteca. Elige dónde, o estudia en casa.</div><div class="pick-list">'+
    ops.map(function(o){return '<button data-i="'+o.i+'"><b>'+escapeHTML(cortoNombre(BIBLIOTECAS[o.i].nombre))+'</b><small>'+escapeHTML(o.etq)+'</small></button>';}).join("")+
    '<button data-i="-1"><b>🏠 En casa u otro sitio</b><small>Cuenta para tus horas, sin biblioteca</small></button></div>';
  openModal(html,function(){
    document.querySelectorAll(".pick-list button").forEach(function(b){b.addEventListener("click",function(){closeModal();startStudyAt(+b.dataset.i);});});
  });
}
function bibHabitual(){
  if(DATA&&DATA.sessions.length){var c={};DATA.sessions.forEach(function(s){if(s.bib!==NO_BIB)c[s.bib]=(c[s.bib]||0)+s.min;});
    var best=null,m=0;for(var k in c){if(c[k]>m){m=c[k];best=k;}}
    if(best){for(var j=0;j<BIBLIOTECAS.length;j++)if(BIBLIOTECAS[j].nombre===best)return j;}}
  return DATA&&typeof DATA.habitualIdx==="number"?DATA.habitualIdx:-1;
}
function startTick(){
  if(studyTimer.tick)clearInterval(studyTimer.tick);
  studyTimer.tick=setInterval(updateTimers,1000);updateTimers();
}
function elapsedMin(){return studyTimer.running?Math.floor((Date.now()-studyTimer.start)/60000):0;}
function elapsedSec(){return studyTimer.running?Math.floor((Date.now()-studyTimer.start)/1000):0;}
function fmtClock(sec){var hh=Math.floor(sec/3600),mm=Math.floor((sec%3600)/60),ss=sec%60;
  return String(hh).padStart(2,"0")+":"+String(mm).padStart(2,"0")+":"+String(ss).padStart(2,"0");}
// Hora (ms) en que cerró la biblioteca por primera vez después de empezar la sesión.
function cierreTrasInicio(b,startTs){
  if(es24h(b))return null; // nunca cierra: no hay "olvido" que detectar por horario
  var dl=deltaTz(b.tz), st=startTs+dl, cal=horarioVigente(b), d0=new Date(st); d0.setHours(0,0,0,0);
  for(var off=0;off<8;off++){
    var dia=new Date(d0); dia.setDate(d0.getDate()+off);
    var tr=cal[dia.getDay()]||[];
    for(var k=0;k<tr.length;k++){
      if(tr[k][1]>=1440){var sig=cal[(dia.getDay()+1)%7]||[];if(sig.length&&sig[0][0]===0)continue;} // sigue abierta tras medianoche
      var fin=dia.getTime()+tr[k][1]*60000; if(fin>st)return fin-dl;}
  }
  return null;
}
// Si la biblioteca cerró hace más de 15 min y el cronómetro sigue, se te olvidó pararlo: se guarda hasta el cierre.
function revisarCronoOlvidado(){
  if(!studyTimer.running)return false;
  var ahora=Date.now();
  if(studyTimer.bibIndex>=0&&!BIBLIOTECAS[studyTimer.bibIndex].sinHorario){
    var b=BIBLIOTECAS[studyTimer.bibIndex], fin=cierreTrasInicio(b,studyTimer.start);
    if(fin&&ahora-fin>15*60000){
      stopStudy(true,fin);
      notificar("⏹ Tu sesión en "+cortoNombre(b.nombre)+" se guardó hasta la hora de cierre ("+fmtHoras(new Date(fin).getHours()*60+new Date(fin).getMinutes())+")");
      return true;
    }
  }else if(ahora-studyTimer.start>12*3600000&&!revisarCronoOlvidado.preguntado&&(studyTimer.bibIndex<0||BIBLIOTECAS[studyTimer.bibIndex].sinHorario)){
    revisarCronoOlvidado.preguntado=true;
    var h=parseFloat((prompt("Llevas más de 12 h con el cronómetro en marcha. ¿Cuántas horas estudiaste de verdad?","2")||"").replace(",","."));
    if(h>0&&h<16){stopStudy(true,studyTimer.start+h*3600000);showToast("Sesión guardada: "+h+" h");return true;}
  }
  return false;
}
function restaurarSesionActiva(){
  var a=DATA&&DATA.active; if(!a||studyTimer.running)return;
  studyTimer.running=true;studyTimer.start=a.start;studyTimer.bibIndex=a.bibIndex;studyTimer.verificada=!!a.verificada;studyTimer.subject=a.subject||null;
  studyTimer.avisoCierre=false;
  // la app se cerró: si estaba en modo foco, la planta no sobrevive
  if(plantarOn()){FOCUS.withered=true;FOCUS.hiddenAt=0;}
  if(revisarCronoOlvidado())return;
  startTick();
  $("miniStudy").classList.remove("hidden");renderNowCard();
  $("miniPlace").textContent=a.bibIndex>=0?cortoNombre(BIBLIOTECAS[a.bibIndex].nombre):"Estudiando";
  showToast("▶ Tu sesión sigue en marcha");
}
function notificar(txt){
  showToast(txt);
  try{if("Notification" in window&&Notification.permission==="granted"&&document.visibilityState==="hidden")new Notification("Bibliomapa",{body:txt,icon:"icons/icon-192.png"});}catch(e){}
}
function updateTimers(){
  if(studyTimer.running&&(updateTimers._n=(updateTimers._n||0)+1)%30===0&&revisarCronoOlvidado())return;
  var sec=elapsedSec();
  if(studyTimer.running&&studyTimer.bibIndex>=0&&!studyTimer.avisoCierre&&!es24h(BIBLIOTECAS[studyTimer.bibIndex])){
    var mc=minutosHastaCierre(BIBLIOTECAS[studyTimer.bibIndex]);
    if(mc>0&&mc<=30){studyTimer.avisoCierre=true;notificar("⏰ "+cortoNombre(BIBLIOTECAS[studyTimer.bibIndex].nombre)+" cierra en "+mc+" min");}
  }
  var t=$("studyTimer");if(t)t.textContent=fmtClock(sec);
  // Hoy / Esta semana siguen al cronómetro (antes se quedaban en lo de antes de empezar)
  if(studyTimer.running&&sec%30===0){var st=$("stToday");if(st)st.textContent=hMin(todayMinutes());var sw=$("stWeek");if(sw)sw.textContent=hMin(weekMinutes());comprobarMisiones();renderRacha();}
  comprobarHitos();
  renderFocusPlant();
  var mt=$("miniTime");if(mt){var mm=Math.floor(sec/60),ss=sec%60;mt.textContent=String(mm).padStart(2,"0")+":"+String(ss).padStart(2,"0");}
  updateGoalRing();
}
function todayMinutes(){
  var today=ymd();
  var sum=0;DATA.sessions.forEach(function(s){if(s.date===today)sum+=s.min;});
  if(studyTimer.running&&ymd(new Date(studyTimer.start))===today)sum+=elapsedMin();
  return sum;
}
function updateGoalRing(){
  var period=DATA?(DATA.goalPeriod||"day"):"day";
  var goal=DATA?DATA.goalMin:240;
  var done=DATA?(period==="week"?weekMinutes():todayMinutes()):0;
  var pct=Math.min(100,Math.round(done/goal*100));
  var ring=$("ringFill");
  if(ring){var c=502.6;ring.style.strokeDashoffset=String(c-(c*pct/100));}
  var gp=$("goalPct");if(gp)gp.textContent=pct+"%";
  var gl=$("goalLbl");if(gl)gl.textContent="de "+(goal/60).toFixed(goal%60?1:0)+"h/"+(period==="week"?"sem":"día");
  var rw=document.querySelector(".ring-wrap");if(rw)rw.classList.toggle("goal-hecha",pct>=100);
  // Meta cumplida: una celebración por día (o por semana si la meta es semanal), solo mientras estudias o al terminar.
  if(DATA&&pct>=100&&done>0){
    var clave=period==="week"?"s"+ymd(new Date(Date.now()-((new Date().getDay()+6)%7)*864e5)):ymd();
    if(DATA.metaCelebrada!==clave){DATA.metaCelebrada=clave;saveUserData();
      setTimeout(function(){confeti(120);showToast("🏆 ¡Meta "+(period==="week"?"semanal":"de hoy")+" cumplida! Eres una máquina");},300);}
  }
  document.body.classList.toggle("estudiando",!!studyTimer.running);
}
/* ===== NIVELES (por horas totales de estudio) ===== */
var NIVELES=[[0,"Semilla","🌱"],[1,"Brote","🌿"],[3,"Lector","📖"],[6,"Estudiante","✏️"],[10,"Constante","💪"],[16,"Ratón de biblioteca","🐭"],
  [25,"Concentrado","🎯"],[40,"Erudito","🦉"],[60,"Sabio","🧠"],[90,"Maestro","🏅"],[130,"Leyenda","🏆"],[180,"Leyenda II","👑"],[250,"Leyenda III","🌟"],[350,"Inmortal","🔥"]];
function horasTotales(){var t=0;(DATA?DATA.sessions:[]).forEach(function(s){t+=s.min;});if(studyTimer.running)t+=elapsedMin();return t/60;}
function nivelDe(h){var n=0;for(var i=0;i<NIVELES.length;i++)if(h>=NIVELES[i][0])n=i;return n;}
function nivelHTML(mini){
  var h=horasTotales(), n=nivelDe(h), cur=NIVELES[n], sig=NIVELES[n+1];
  var pct=sig?Math.round((h-cur[0])/(sig[0]-cur[0])*100):100;
  var falta=sig?Math.max(0,sig[0]-h):0, faltaTxt=falta>=1?Math.ceil(falta)+" h":Math.ceil(falta*60)+" min";
  return '<div class="lv-badge">'+cur[2]+'<small>Nv '+(n+1)+'</small></div><div class="lv-main"><div class="lv-name">'+cur[1]+'</div>'+
    '<div class="lv-next">'+(sig?(mini?'':Math.floor(h)+' h estudiadas · ')+'faltan '+faltaTxt+' para <b>'+sig[1]+'</b> '+sig[2]:'¡Nivel máximo! '+Math.floor(h)+' h estudiadas')+'</div>'+
    '<div class="lv-bar"><i style="width:'+pct+'%"></i></div></div>';
}
function renderNivel(){var a=$("levelCard");if(a)a.innerHTML=nivelHTML(false);var b=$("levelCardStudy");if(b)b.innerHTML=nivelHTML(true);}
// Subida de nivel tras guardar una sesión
function comprobarSubidaNivel(antes){
  var n0=nivelDe(antes), n1=nivelDe(horasTotales()); if(n1<=n0)return;
  var nv=NIVELES[n1];
  setTimeout(function(){
    openModal('<div class="levelup"><div class="lv-big">'+nv[2]+'</div><h3>¡Subes al nivel '+(n1+1)+'!</h3><div class="sub">Ahora eres <b>'+nv[1]+'</b>. Sigue así: tu bosque lo nota 🌳</div><button class="btn" onclick="closeModal()">¡Vamos!</button></div>',
      function(){confeti(140);});
  },250);
}
function stopStudy(silent,endTs){
  if(!studyTimer.running)return;
  var sec=endTs?Math.max(0,Math.floor((endTs-studyTimer.start)/1000)):elapsedSec();
  if(DATA){DATA.active=null;saveUserData();}
  var min=Math.round(sec/60);
  var horasAntes=horasTotales()-elapsedMin()/60;
  var bibIdx=studyTimer.bibIndex, ts=studyTimer.start, verif=studyTimer.verificada;
  if(studyTimer.tick)clearInterval(studyTimer.tick);
  var saved=null;
  if(sec>=20){
    saved={id:genId(),date:ymd(new Date(ts)),min:Math.max(1,min),sec:sec,bib:bibIdx>=0?BIBLIOTECAS[bibIdx].nombre:NO_BIB,ts:ts,verif:verif,prod:null,note:"",offering:(extrasOn()&&DATA.offeringText)||"",subject:studyTimer.subject||null,focus:focusResult(),esp:plantarOn()?especieActual():null};
    DATA.sessions.push(saved);
    saveUserData();
    socialShareSession(saved);
  }
  studyTimer.running=false;studyTimer.bibIndex=null;studyTimer.verificada=false;studyTimer.subject=null;
  releaseWakeLock();
  $("miniStudy").classList.add("hidden");renderNowCard();
  socialClearPresence();
  renderStudy();renderProfile();
  if(saved){renderNivel();trasGuardarSesion(saved);}
  if(saved&&!silent){
    pedirValoracion(saved,horasAntes);
  }else if(!silent&&sec>=20){
    showToast("Sesión guardada: "+fmtHoras(Math.max(1,min))+" h");
  }
}
function bibIdxDe(sesion){if(!sesion||sesion.bib===NO_BIB)return -1;for(var k=0;k<BIBLIOTECAS.length;k++){if(BIBLIOTECAS[k].nombre===sesion.bib)return k;}return -1;}
function editarSesion(idx){
  var s=DATA.sessions[idx]; if(!s)return;
  openModal('<h3>Editar sesión</h3><div class="sub">'+escapeHTML(fmtFeedDate(s.date))+' · '+escapeHTML(cortoNombre(s.bib))+'</div>'+
    '<div class="field"><label>Minutos estudiados</label><input type="number" id="edMin" min="1" max="960" value="'+s.min+'"></div>'+
    '<button class="btn" id="edSave">Guardar</button>'+
    '<button class="linkbtn" id="edDel" style="display:block;margin:14px auto 0;color:var(--peligro-tx)">Borrar esta sesión</button>',function(){
    $("edSave").addEventListener("click",function(){
      var m=parseInt($("edMin").value,10); if(!(m>=1&&m<=960)){showToast("Pon entre 1 y 960 minutos");return;}
      s.min=m;s.sec=m*60;saveUserData();socialShareSession(s);closeModal();renderStudy();renderProfile();showToast("Sesión actualizada");
    });
    $("edDel").addEventListener("click",function(){
      if(!confirm("¿Borrar esta sesión? Se descontará de tus horas y rachas."))return;
      DATA.sessions.splice(idx,1);saveUserData();
      var sb=socialClient(); if(sb&&SOCIAL.user)sb.from("shared_sessions").delete().eq("owner_id",SOCIAL.user.id).eq("local_id",s.id);
      closeModal();renderStudy();renderProfile();showToast("Sesión borrada");
    });
  });
}
function pedirValoracion(sesion,horasAntes){
  var sel={v:0};
  var plantado=sesion.focus?'<div class="planted'+(sesion.focus==="withered"?' seco':'')+'"><div class="planted-tree">'+arbolSVG(sesion.min,sesion.focus==="withered",sesion.subject||sesion.id,110,sesion.esp)+'</div>'+
    '<div class="planted-txt">'+(sesion.focus==="withered"?'🥀 Tu árbol se marchitó porque saliste de la app. ¡El próximo crecerá!':'🎉 ¡Has plantado un '+ETAPAS_ARBOL[etapaArbol(sesion.min)][1].toLowerCase()+' en tu bosque!'+(Math.floor(sesion.min/5)?'<span class="planted-seeds">🌰 +'+Math.floor(sesion.min/5)+' semillas</span>':''))+'</div></div>':'';
  openModal(plantado+'<h3>Sesión terminada</h3><div class="sub">'+fmtHoras(sesion.min)+' h en '+escapeHTML(sesion.bib.replace("Biblioteca ","").replace("Pública ",""))+(sesion.verif?' · <span class="badge-ok">✓ verificada</span>':'')+'</div>'+
    '<label style="font-size:var(--fs-s);font-weight:700;color:var(--suave);text-transform:uppercase;letter-spacing:.05em">¿Qué tal ha ido?</label>'+
    '<div class="prodstars" id="prodStars">'+[1,2,3,4,5].map(function(n){return '<button data-v="'+n+'">★</button>';}).join("")+'</div>'+
    (bibIdxDe(sesion)>=0?'<label style="display:block;margin-top:12px;font-size:var(--fs-s);font-weight:700;color:var(--suave);text-transform:uppercase;letter-spacing:.05em">¿Cómo estaba de llena?</label>'+
      '<div class="occ-quick" id="sessOcc"><button data-l="libre">🟢 Con sitio</button><button data-l="media">🟡 Media</button><button data-l="llena">🔴 Llena</button></div>':'')+
    '<div class="field" style="margin-top:10px"><input type="text" id="sessNote" placeholder="Nota opcional (ej: terminé el tema 4)"></div>'+
    '<button class="btn" id="sessSave">Guardar</button>'+
    (sesion.focus==="ok"?'<button class="btn ghost" style="margin-top:10px" onclick="compartirSesionStory(\''+sesion.id+'\')">📸 Compartir en stories</button>':'')+
    '<button class="linkbtn" id="sessSkip" style="display:block;margin:12px auto 0">Omitir</button>',
    function(){
      if(sesion.focus==="ok"){confeti(sesion.min>=25?90:45);celebrar(document.querySelector(".planted-tree"),["🌱","🍃","✨","🌟"],12);}
      document.querySelectorAll("#prodStars button").forEach(function(b){
        b.addEventListener("click",function(){
          sel.v=parseInt(b.dataset.v);
          document.querySelectorAll("#prodStars button").forEach(function(x,idx){x.classList.toggle("on",idx<sel.v);if(idx<sel.v){x.classList.remove("pop");void x.offsetWidth;x.classList.add("pop");}});
        });
      });
      var occSel=null;
      document.querySelectorAll("#sessOcc button").forEach(function(b){
        b.addEventListener("click",function(){occSel=b.dataset.l;document.querySelectorAll("#sessOcc button").forEach(function(x){x.classList.toggle("on",x===b);});});
      });
      $("sessSave").addEventListener("click",function(){
        // la afluencia solo vale si la sesión acaba de terminar (no se reporta para una sesión antigua)
        if(occSel&&bibIdxDe(sesion)>=0)addOccReport(bibIdxDe(sesion),occSel,true);
        sesion.prod=sel.v||null; sesion.note=$("sessNote").value.trim();
        saveUserData();socialShareSession(sesion);closeModal();renderProfile();renderStudy();showToast("Sesión guardada");
        if(horasAntes!=null)comprobarSubidaNivel(horasAntes);
      });
      $("sessSkip").addEventListener("click",function(){closeModal();if(horasAntes!=null)comprobarSubidaNivel(horasAntes);});
    });
}
function renderStudy(){
  if(!DATA)return;
  checkStreakFreezes();
  var sec=elapsedSec();
  $("studyTimer").textContent=fmtClock(sec);
  if(studyTimer.running){
    $("studyPlace").textContent=(studyTimer.bibIndex>=0?"En "+BIBLIOTECAS[studyTimer.bibIndex].nombre:"Estudiando fuera de una biblioteca")+(DATA.offeringText&&extrasOn()?" · 🙏 ofrecido por "+DATA.offeringText:"");
    $("btnStart").classList.add("hidden");$("btnStop").classList.remove("hidden");
    if(!studyTimer.tick)startTick();
  }else{
    $("studyPlace").textContent="Sin sesión activa";
    $("btnStart").classList.remove("hidden");$("btnStop").classList.add("hidden");
  }
  // estadísticas
  $("stToday").textContent=hMin(todayMinutes());
  $("stWeek").textContent=hMin(weekMinutes());
  $("stSessions").textContent=DATA.sessions.length;
  $("stStreak").textContent=streakDays()+(DATA.streakFreezes>0?" 🧊"+DATA.streakFreezes:"");
  updateGoalRing();
  renderSessionFeed();
  renderBookshelf();
  renderSubjects();
  renderSubjectStats();
  renderFocusPlant();
  renderForest();
  renderNivel();
  renderMisiones();renderSemillas();renderRacha();
}
/* ===== ASIGNATURAS (como YPT: el tiempo se apunta a una asignatura) ===== */
function renderSubjects(){
  var el=$("subjectChips"); if(!el||!DATA)return;
  var subs=DATA.subjects||[], cur=DATA.currentSubject||null;
  var html='<button data-s="" class="'+(cur?"":"on")+'">Sin asignatura</button>';
  subs.forEach(function(n,k){html+='<button data-k="'+k+'" class="'+(cur===n?"on":"")+'">'+escapeHTML(n)+'<span class="x" data-del="'+k+'" title="Quitar">×</span></button>';});
  html+='<button data-add="1">+ Añadir</button>';
  el.innerHTML=html;
  var ft=$("focusToggle"); if(ft)ft.checked=plantarOn();
  var sl=$("subjLabel"); if(sl)sl.textContent=DATA.perfil==="opositor"?"Tema":"Asignatura";
}
function initSubjectUI(){
  $("subjectChips").addEventListener("click",function(e){
    var t=e.target, btn=t.closest("button"); if(!btn||!DATA)return;
    if(studyTimer.running||pomo.running){showToast("Termina o pausa la sesión para cambiar de asignatura");return;}
    var subs=DATA.subjects=DATA.subjects||[];
    if(t.dataset.del!=null){
      var name=subs[+t.dataset.del];
      if(!confirm("¿Quitar \""+name+"\" de tus asignaturas? Las sesiones ya guardadas la conservan."))return;
      subs.splice(+t.dataset.del,1); if(DATA.currentSubject===name)DATA.currentSubject=null;
    }else if(btn.dataset.add){
      var n=(prompt("Nombre de la asignatura (ej: Cálculo, Temario oposición…)")||"").trim().slice(0,40);
      if(!n)return;
      if(subs.indexOf(n)===-1)subs.push(n);
      DATA.currentSubject=n;
    }else{
      DATA.currentSubject=btn.dataset.k!=null?subs[+btn.dataset.k]:null;
    }
    saveUserData();renderSubjects();
  });
  $("focusToggle").addEventListener("change",function(){
    DATA.focusMode=this.checked;saveUserData();
    if(this.checked){showToast("🌱 Cada sesión planta un árbol. Si sales de la app más de "+FOCUS_GRACE_SEC+" s, se marchita");if(focusActive())focusStart();}
    else{releaseWakeLock();}
    renderFocusPlant();renderForest();
  });
}
function renderSubjectStats(){
  var el=$("subjectStats"); if(!el||!DATA)return;
  var hoy=ymd(), mins={};
  DATA.sessions.forEach(function(s){if(s.date===hoy){var k=s.subject||"Sin asignatura";mins[k]=(mins[k]||0)+s.min;}});
  if(studyTimer.running){var k=studyTimer.subject||"Sin asignatura";mins[k]=(mins[k]||0)+elapsedMin();}
  var keys=Object.keys(mins).filter(function(k){return mins[k]>0;}).sort(function(a,b){return mins[b]-mins[a];});
  var max=keys.length?mins[keys[0]]:0;
  var html='<div class="section-title" style="margin-top:0">📚 Hoy por asignatura</div>';
  html+=keys.length?keys.map(function(k){return '<div class="subj-row"><span class="nm">'+escapeHTML(k)+'</span><span class="bar"><i style="width:'+Math.round(mins[k]/max*100)+'%"></i></span><span class="tm">'+hMin(mins[k])+'</span></div>';}).join("")
    :'<div class="empty-note">Elige una asignatura arriba y empieza: aquí verás cuánto le dedicas cada día.</div>';
  el.innerHTML=html;
}
/* ===== BOSQUE (como Forest): cada sesión planta un árbol; si sales de la app, se marchita =====
   Plantar está activado por defecto (DATA.focusMode===false lo apaga). El árbol crece con los minutos:
   brote → arbusto → árbol → árbol grande → pino → roble en flor. Cada usuario tiene su bosque (sus sesiones)
   y puede ver el de sus amigos con las sesiones que comparten. */
const FOCUS_GRACE_SEC=15;
var FOCUS={hiddenAt:0,withered:false,lock:null};
function plantarOn(){return !(DATA&&DATA.focusMode===false);}
function especieActual(){var e=especieDe(DATA&&DATA.especie);return enTemporada(e)?e.id:"roble";}
function focusActive(){return plantarOn()&&(studyTimer.running||(pomo.running&&pomo.phase==="focus"));}
function focusStart(){FOCUS.withered=false;FOCUS.hiddenAt=0;if(plantarOn())requestWakeLock();renderFocusPlant();}
function focusResult(){return plantarOn()?(FOCUS.withered?"withered":"ok"):null;}
// Mantiene la pantalla encendida durante el foco: así bloquear el móvil no cuenta como "salir".
async function requestWakeLock(){
  try{if(navigator.wakeLock&&document.visibilityState==="visible"&&!FOCUS.lock){FOCUS.lock=await navigator.wakeLock.request("screen");FOCUS.lock.addEventListener("release",function(){FOCUS.lock=null;});}}catch(e){}
}
function releaseWakeLock(){try{if(FOCUS.lock){FOCUS.lock.release();FOCUS.lock=null;}}catch(e){}}
document.addEventListener("visibilitychange",function(){
  if(!focusActive())return;
  if(document.visibilityState==="hidden"){
    FOCUS.hiddenAt=Date.now();
    // Aviso al salir (si hay permiso): todavía estás a tiempo de volver.
    try{if(!FOCUS.withered&&"Notification" in window&&Notification.permission==="granted")new Notification("🌱 ¡Tu árbol te necesita!",{body:"Vuelve en "+FOCUS_GRACE_SEC+" s o se marchitará",icon:"icons/icon-192.png",tag:"bosque"});}catch(e){}
    return;
  }
  requestWakeLock();
  if(FOCUS.hiddenAt){
    var away=Math.round((Date.now()-FOCUS.hiddenAt)/1000);FOCUS.hiddenAt=0;
    if(away>=FOCUS_GRACE_SEC&&!FOCUS.withered){FOCUS.withered=true;showToast("🥀 Tu árbol se ha marchitado: saliste "+away+" s de la app");}
    renderFocusPlant();
  }
});
// Etapas del árbol según los minutos estudiados.
var ETAPAS_ARBOL=[[0,"Brote"],[10,"Arbusto"],[25,"Árbol joven"],[50,"Árbol"],[90,"Gran árbol"],[180,"Árbol legendario"]];
function etapaArbol(min){var e=0;for(var i=0;i<ETAPAS_ARBOL.length;i++)if(min>=ETAPAS_ARBOL[i][0])e=i;return e;}
function hashStr(s){var h=0;s=String(s||"");for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);}
// Altura proporcional al estudio (raíz cuadrada: 15 min ≈ 53 px, 1 h ≈ 80 px, 3 h ≈ 120 px).
function alturaArbol(min){return Math.round(Math.min(124,26+Math.sqrt(Math.max(1,min))*7.2));}
// Dibujo del árbol en SVG (colores del sistema de diseño: --arbol-*, --tronco, --marchito).
// Especies (se desbloquean con semillas en la tienda del bosque). Las dos primeras etapas son iguales para todas.
var ESPECIES=[
  {id:"roble",nombre:"Roble",icon:"🌳",precio:0},
  {id:"cerezo",nombre:"Cerezo",icon:"🌸",precio:60},
  {id:"abeto",nombre:"Abeto nevado",icon:"🌲",precio:90},
  {id:"arce",nombre:"Arce de otoño",icon:"🍁",precio:120},
  {id:"palmera",nombre:"Palmera",icon:"🌴",precio:160},
  {id:"cactus",nombre:"Cactus",icon:"🌵",precio:200},
  {id:"calabaza",nombre:"Calabaza de Halloween",icon:"🎃",precio:0,desde:"10-20",hasta:"11-02"}
];
// Especies de temporada: gratis, pero solo se pueden elegir dentro de sus fechas (MM-DD).
function enTemporada(e){if(!e.desde)return true;var md=ymd().slice(5);return md>=e.desde&&md<=e.hasta;}
function especieDe(id){for(var i=0;i<ESPECIES.length;i++)if(ESPECIES[i].id===id)return ESPECIES[i];return ESPECIES[0];}
// Dibujo del árbol en SVG (colores del sistema de diseño: --arbol-*, --tronco, --marchito, --cerezo…).
function arbolSVG(min,marchito,semilla,alto,esp){
  var e=etapaArbol(min), h=alto||alturaArbol(min), w=Math.round(h*0.66);
  esp=esp||"roble";
  var verdes=["var(--arbol-a)","var(--arbol-b)","var(--arbol-c)","var(--arbol-d)"], v=verdes[hashStr(semilla)%verdes.length];
  if(esp==="calabaza"&&e>=1){
    var r=[0,9,12,15,18,21][e], cy=96-r*0.85, cara=e>=4&&!marchito;
    var cal=marchito?"var(--marchito)":"var(--calabaza)", cal2=marchito?"var(--marchito-osc)":"var(--calabaza-osc)";
    var hojas='<path d="M30 '+(cy-r*0.85)+' C38 '+(cy-r*1.6)+' 46 '+(cy-r*1.2)+' 44 '+(cy-r*0.7)+'" stroke="'+(marchito?cal2:"var(--arbol-osc)")+'" stroke-width="2.5" fill="none" stroke-linecap="round"/>'+
      '<path d="M30 '+(cy-r*0.9)+' C24 '+(cy-r*1.5)+' 16 '+(cy-r*1.4)+' 14 '+(cy-r*1.05)+' C20 '+(cy-r*0.95)+' 26 '+(cy-r*0.95)+' 30 '+(cy-r*0.9)+'Z" fill="'+(marchito?cal2:"var(--arbol-b)")+'"/>';
    g=hojas+'<ellipse cx="'+(30-r*0.45)+'" cy="'+cy+'" rx="'+(r*0.62)+'" ry="'+(r*0.85)+'" fill="'+cal2+'"/><ellipse cx="'+(30+r*0.45)+'" cy="'+cy+'" rx="'+(r*0.62)+'" ry="'+(r*0.85)+'" fill="'+cal2+'"/>'+
      '<ellipse cx="30" cy="'+cy+'" rx="'+(r*0.7)+'" ry="'+(r*0.9)+'" fill="'+cal+'"/><rect x="28" y="'+(cy-r*0.9-6)+'" width="4" height="8" rx="1.5" fill="var(--tronco)"/>'+
      (cara?'<path d="M'+(30-r*0.45)+' '+(cy-r*0.2)+' l'+(r*0.18)+' -'+(r*0.28)+' l'+(r*0.18)+' '+(r*0.28)+'Z M'+(30+r*0.09)+' '+(cy-r*0.2)+' l'+(r*0.18)+' -'+(r*0.28)+' l'+(r*0.18)+' '+(r*0.28)+'Z" fill="var(--aviso)"/>'+
        '<path d="M'+(30-r*0.5)+' '+(cy+r*0.2)+' Q30 '+(cy+r*0.65)+' '+(30+r*0.5)+' '+(cy+r*0.2)+' Q30 '+(cy+r*0.4)+' '+(30-r*0.5)+' '+(cy+r*0.2)+'Z" fill="var(--aviso)"/>':'');
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 60 100" aria-hidden="true"'+(marchito?' class="seco"':'')+'><ellipse cx="30" cy="97" rx="18" ry="3" fill="rgba(0,0,0,.12)"/>'+g+'</svg>';
  }
  var C={roble:[v,"var(--arbol-osc)","var(--flor)"],cerezo:["var(--cerezo)","var(--cerezo-osc)","#fff"],arce:["var(--arce)","var(--arce-osc)","var(--aviso)"],
    abeto:["var(--pino)","var(--pino-osc)","var(--nieve)"],palmera:["var(--palma)","var(--palma-osc)","var(--aviso)"],cactus:["var(--cactus)","var(--cactus-osc)","var(--flor)"]}[esp]||[v,"var(--arbol-osc)","var(--flor)"];
  var copa=marchito?"var(--marchito)":C[0], copa2=marchito?"var(--marchito-osc)":C[1], deco=C[2], tronco=marchito?"var(--marchito-osc)":"var(--tronco)";
  var g="";
  if(e===0){ // brote
    g='<path d="M30 96 C30 84 30 78 30 70" stroke="'+(marchito?tronco:"var(--arbol-osc)")+'" stroke-width="3" fill="none" stroke-linecap="round"/>'+
      (marchito?'<path d="M30 74 C22 80 16 84 14 92 C22 90 28 84 30 76Z" fill="'+copa+'"/><path d="M30 76 C38 82 42 88 44 94 C38 92 32 86 30 78Z" fill="'+copa2+'"/>'
               :'<path d="M30 74 C22 64 14 64 10 68 C16 76 24 78 30 76Z" fill="var(--arbol-a)"/><path d="M30 72 C36 60 46 58 50 62 C46 72 38 76 30 74Z" fill="var(--arbol-osc)"/>');
  }else if(e===1&&esp!=="cactus"){ // arbusto
    g='<rect x="27.5" y="78" width="5" height="18" rx="2" fill="'+tronco+'"/><circle cx="22" cy="74" r="13" fill="'+copa2+'"/><circle cx="38" cy="74" r="13" fill="'+copa2+'"/><circle cx="30" cy="64" r="15" fill="'+copa+'"/>';
  }else if(esp==="abeto"||(esp==="roble"&&e===4)){ // conífera (el roble es pino en la etapa 4)
    var k=esp==="abeto"?Math.max(0,5-e)*6:0, nieve=esp==="abeto"&&!marchito&&e>=3;
    var p=marchito?copa:"var(--pino)", p2=marchito?copa2:"var(--pino-osc)";
    g='<rect x="27" y="80" width="6" height="16" rx="2" fill="'+tronco+'"/><path d="M30 '+(46+k)+' L52 84 L8 84Z" fill="'+p2+'"/><path d="M30 '+(26+k)+' L48 62 L12 62Z" fill="'+p+'"/><path d="M30 '+(6+k)+' L43 38 L17 38Z" fill="'+p2+'"/>'+
      (nieve?'<path d="M30 '+(6+k)+' L36 '+(21+k/2)+' L30 '+(18+k/2)+' L24 '+(21+k/2)+'Z" fill="'+deco+'"/><path d="M19 62 L26 57 L30 61 L34 57 L41 62Z" fill="'+deco+'" opacity=".9"/><path d="M14 84 L24 78 L30 82 L36 78 L46 84Z" fill="'+deco+'" opacity=".9"/>':'');
  }else if(esp==="palmera"){
    var alt=e>=4?8:e>=3?16:26;
    g='<path d="M31 96 C29 80 33 60 30 '+(alt+14)+'" stroke="'+tronco+'" stroke-width="6" fill="none" stroke-linecap="round"/>'+
      '<path d="M30 '+(alt+14)+' C18 '+(alt+6)+' 8 '+(alt+14)+' 4 '+(alt+26)+' C14 '+(alt+18)+' 22 '+(alt+18)+' 30 '+(alt+16)+'Z" fill="'+copa2+'"/>'+
      '<path d="M30 '+(alt+14)+' C42 '+(alt+6)+' 52 '+(alt+14)+' 56 '+(alt+26)+' C46 '+(alt+18)+' 38 '+(alt+18)+' 30 '+(alt+16)+'Z" fill="'+copa2+'"/>'+
      '<path d="M30 '+(alt+14)+' C22 '+(alt)+' 14 '+(alt-4)+' 8 '+(alt+2)+' C18 '+(alt+4)+' 24 '+(alt+8)+' 30 '+(alt+15)+'Z" fill="'+copa+'"/>'+
      '<path d="M30 '+(alt+14)+' C38 '+(alt)+' 46 '+(alt-4)+' 52 '+(alt+2)+' C42 '+(alt+4)+' 36 '+(alt+8)+' 30 '+(alt+15)+'Z" fill="'+copa+'"/>'+
      (e>=4&&!marchito?'<circle cx="27" cy="'+(alt+19)+'" r="3" fill="'+deco+'"/><circle cx="33" cy="'+(alt+19)+'" r="3" fill="'+deco+'"/>':'');
  }else if(esp==="cactus"){
    var top=[70,58,40,26,14,8][e];
    g='<rect x="23" y="'+top+'" width="14" height="'+(96-top)+'" rx="7" fill="'+copa+'"/><path d="M30 '+(top+6)+' V94" stroke="'+copa2+'" stroke-width="1.5" opacity=".6"/>'+
      (e>=2?'<path d="M23 '+(top+30)+' H14 a5 5 0 0 1 -5 -5 V'+(top+14)+'" stroke="'+copa+'" stroke-width="9" fill="none" stroke-linecap="round"/>':'')+
      (e>=3?'<path d="M37 '+(top+40)+' H46 a5 5 0 0 0 5 -5 V'+(top+22)+'" stroke="'+copa+'" stroke-width="9" fill="none" stroke-linecap="round"/>':'')+
      (e>=5&&!marchito?'<circle cx="30" cy="'+(top+1)+'" r="5" fill="'+deco+'"/><circle cx="30" cy="'+(top+1)+'" r="2" fill="var(--aviso)"/>':'');
  }else if(e===2){ // árbol joven
    g='<rect x="27" y="62" width="6" height="34" rx="2.5" fill="'+tronco+'"/><circle cx="30" cy="44" r="22" fill="'+copa+'"/><circle cx="22" cy="38" r="7" fill="'+copa2+'" opacity=".35"/>';
  }else if(e===3||e===4){ // árbol (cerezo y arce también en la etapa 4)
    g='<rect x="26.5" y="58" width="7" height="38" rx="3" fill="'+tronco+'"/><path d="M30 70 L20 60" stroke="'+tronco+'" stroke-width="3" stroke-linecap="round"/>'+
      '<circle cx="18" cy="46" r="15" fill="'+copa2+'"/><circle cx="42" cy="46" r="15" fill="'+copa2+'"/><circle cx="30" cy="32" r="20" fill="'+copa+'"/><circle cx="24" cy="26" r="6" fill="#fff" opacity=".18"/>'+
      (e===4&&!marchito?'<circle cx="22" cy="36" r="2.6" fill="'+deco+'"/><circle cx="38" cy="30" r="2.6" fill="'+deco+'"/>':'');
  }else{ // gran árbol en flor
    g='<rect x="26" y="56" width="8" height="40" rx="3" fill="'+tronco+'"/><path d="M30 66 L18 54 M30 62 L42 50" stroke="'+tronco+'" stroke-width="3.5" stroke-linecap="round"/>'+
      '<circle cx="15" cy="42" r="15" fill="'+copa2+'"/><circle cx="45" cy="42" r="15" fill="'+copa2+'"/><circle cx="30" cy="26" r="22" fill="'+copa+'"/>'+
      (marchito?'':'<circle cx="20" cy="22" r="3" fill="'+deco+'"/><circle cx="38" cy="18" r="3" fill="'+deco+'"/><circle cx="32" cy="34" r="3" fill="'+deco+'"/><circle cx="12" cy="44" r="2.6" fill="'+deco+'"/><circle cx="48" cy="40" r="2.6" fill="'+deco+'"/>');
  }
  return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 60 100" aria-hidden="true"'+(marchito?' class="seco"':'')+'><ellipse cx="30" cy="97" rx="16" ry="3" fill="rgba(0,0,0,.12)"/>'+g+'</svg>';
}
// Árbol de la sesión en marcha: crece con los minutos; si sales de la app, se marchita.
function renderFocusPlant(){
  ["focusPlant","pomoPlant"].forEach(function(id){
    var el=$(id); if(!el)return;
    var mio=id==="focusPlant"?studyTimer.running:(pomo.running&&pomo.phase==="focus");
    if(!focusActive()||!mio){el.classList.add("hidden");el._etapa=null;return;}
    var min=studyTimer.running?elapsedMin():Math.floor((POMO_FOCUS_MIN*60-pomo.secondsLeft)/60);
    var e=etapaArbol(min), sig=ETAPAS_ARBOL[e+1];
    var txt=FOCUS.withered?"🥀 Se ha marchitado. Termina la sesión y planta otro."
      :ETAPAS_ARBOL[e][1]+(sig?" · "+sig[1].toLowerCase()+" en "+(sig[0]-min)+" min":" · ¡el árbol más grande!")+" · no salgas de la app";
    var clave=e+"|"+FOCUS.withered;
    el.classList.remove("hidden");
    if(el._etapa===clave){var t=el.querySelector(".fp-txt");if(t)t.textContent=txt;return;}
    var subio=el._etapa!=null&&!FOCUS.withered&&el._etapa.split("|")[1]==="false";
    el._etapa=clave;
    el.innerHTML='<div class="fp-tree'+(subio?' grow':'')+'">'+arbolSVG(Math.max(min,1),FOCUS.withered,(DATA&&DATA.currentSubject)||"",96,especieActual())+'</div><div class="fp-txt">'+escapeHTML(txt)+'</div>';
    if(subio){celebrar(el.querySelector(".fp-tree"),["🌱","🍃","✨"],8);}
  });
}
// ----- Mi bosque -----
var FOREST_PERIOD=loadJSON("bpna_forest_period","week");
function sesionesPeriodo(lista,periodo){
  var desde=null,hoy=new Date();hoy.setHours(0,0,0,0);
  if(periodo==="day")desde=ymd(hoy);
  else if(periodo==="week"){var l=new Date(hoy);l.setDate(hoy.getDate()-((hoy.getDay()+6)%7));desde=ymd(l);}
  else if(periodo==="month"){desde=ymd(new Date(hoy.getFullYear(),hoy.getMonth(),1));}
  else if(periodo==="lastweek"){var l2=new Date(hoy);l2.setDate(hoy.getDate()-((hoy.getDay()+6)%7)-7);var fin=new Date(l2);fin.setDate(l2.getDate()+6);
    var d1=ymd(l2),d2=ymd(fin);return lista.filter(function(s){return s.date>=d1&&s.date<=d2;});}
  return lista.filter(function(s){return !desde||s.date>=desde;});
}
// HTML del bosque para una lista de sesiones {min, date, focus, subject, id}.
function bosqueHTML(ses,vacio){
  if(!ses.length)return '<div class="forest-ground empty"><div class="forest-empty">'+vacio+'</div></div>';
  var orden=ses.slice().sort(function(a,b){return (a.ts||0)-(b.ts||0)||(a.date<b.date?-1:1);});
  var max=160, extra=orden.length>max?orden.length-max:0; if(extra)orden=orden.slice(-max);
  return '<div class="forest-ground">'+orden.map(function(s,i){
    var m=s.focus==="withered", t=(m?"🥀 Marchito":"🌳 "+ETAPAS_ARBOL[etapaArbol(s.min)][1])+" · "+hMin(s.min)+" · "+fmtFeedDate(s.date)+(s.subject?" · "+s.subject:"");
    return '<span class="arbol" style="--d:'+Math.min(i*28,1400)+'ms" title="'+escapeHTML(t)+'" onclick="showToast(this.title)">'+arbolSVG(s.min,m,s.subject||s.id||i,null,s.esp)+'</span>';
  }).join("")+(extra?'<span class="forest-more">+'+extra+'</span>':'')+'</div>';
}
function resumenBosque(ses){
  var vivos=0,secos=0,min=0;ses.forEach(function(s){if(s.focus==="withered")secos++;else vivos++;min+=s.min;});
  return '<b>'+vivos+'</b> '+(vivos===1?"árbol":"árboles")+(secos?' · <b>'+secos+'</b> '+(secos===1?"marchito":"marchitos"):'')+' · '+hMin(min);
}
function renderForest(){
  var el=$("forestCard"); if(!el||!DATA)return;
  var P={day:"Hoy",week:"Semana",month:"Mes",all:"Todo"};
  var ses=sesionesPeriodo(DATA.sessions,FOREST_PERIOD);
  var vacio=DATA.sessions.length?"Sin árboles en este periodo. ¡Empieza una sesión y planta uno!":"Tu bosque está vacío. Empieza a estudiar y planta tu primer árbol 🌱";
  var racha=0;try{racha=streakDays();}catch(e){}
  el.innerHTML='<div class="forest-head"><div class="section-title" style="margin:0">🌳 Mi bosque</div>'+
    '<div class="seg mini" id="forestSeg">'+Object.keys(P).map(function(k){return '<button data-p="'+k+'" class="'+(k===FOREST_PERIOD?"on":"")+'">'+P[k]+'</button>';}).join("")+'</div></div>'+
    '<div class="forest-sum">'+resumenBosque(ses)+(racha>1?' · 🔥 '+racha+' días':'')+'</div>'+
    bosqueHTML(ses,vacio)+
    '<div class="forest-acts"><button class="btn sm" onclick="abrirTienda()">'+especieDe(DATA.especie).icon+' Especies · 🌰 <span class="seeds-n">'+semillas()+'</span></button>'+(ses.length?'<button class="btn sm ghost" onclick="compartirBosque()">📸 Compartir</button>':'')+'</div>'+
    '<div class="forest-foot">'+(plantarOn()?'Cada sesión planta un árbol: cuanto más estudias, más crece. Si sales de la app más de '+FOCUS_GRACE_SEC+' s, se marchita.':'Plantar árboles está desactivado (actívalo arriba, en «🌳 Plantar árbol»).')+
    (SOCIAL.user&&SOCIAL.friends&&SOCIAL.friends.length?' <button class="linkbtn" onclick="abrirBosquesAmigos()">Ver el bosque de tus amigos →</button>':'')+'</div>';
  el.querySelectorAll("#forestSeg button").forEach(function(b){b.addEventListener("click",function(){FOREST_PERIOD=b.dataset.p;saveJSON("bpna_forest_period",FOREST_PERIOD);renderForest();});});
}
function abrirBosquesAmigos(){
  var am=(SOCIAL.friends||[]).filter(function(f){return !isBlocked(f.profile.id);});
  openModal('<h3>🌳 Bosques de tus amigos</h3><div class="sub">Solo cuenta lo que cada uno comparte (últimos 30 días).</div>'+
    '<div class="pick-list">'+am.map(function(f){return '<button onclick="verBosqueAmigo('+jsArg(f.profile.id)+')"><b>'+escapeHTML(f.profile.name||"Amigo")+'</b></button>';}).join("")+'</div>');
}
async function verBosqueAmigo(id){
  var sb=socialClient(); if(!sb||!SOCIAL.user)return;
  var nombre=socialNameById(id), desde=new Date();desde.setDate(desde.getDate()-30);
  openModal('<h3>🌳 El bosque de '+escapeHTML(nombre)+'</h3><div class="sub">Cargando…</div>');
  var res=await sb.from("shared_sessions").select("local_id,minutes,date,focus,subject,created_at").eq("owner_id",id).gte("date",ymd(desde)).order("created_at",{ascending:true}).limit(300);
  var ses=(res.data||[]).map(function(s){return {id:s.local_id,min:s.minutes||0,date:s.date,focus:s.focus,subject:s.subject,ts:Date.parse(s.created_at)||0};});
  openModal('<h3>🌳 El bosque de '+escapeHTML(nombre)+'</h3><div class="sub">'+resumenBosque(ses)+' · últimos 30 días</div>'+
    bosqueHTML(ses,escapeHTML(nombre)+" aún no ha compartido sesiones.")+
    '<button class="btn ghost" style="margin-top:14px" onclick="abrirBosquesAmigos()">← Otros amigos</button>');
}
/* ===== MODO POMODORO ===== */
// Los pomodoros no van ligados a una biblioteca: no cuentan para "favorita" ni sugerencias.
const NO_BIB="Sin biblioteca";
const POMO_FOCUS_MIN=25, POMO_BREAK_MIN=5;
var pomo={running:false,phase:"focus",secondsLeft:POMO_FOCUS_MIN*60,cycles:0,tick:null};
function pomoToggle(){
  if(pomo.running){
    pomo.running=false; if(pomo.tick){clearInterval(pomo.tick);pomo.tick=null;}
    renderPomodoro();return;
  }
  if(studyTimer.running){showToast("Ya tienes el cronómetro en marcha: termínalo antes de usar el Pomodoro");return;}
  pomo.running=true;
  // Cuenta por hora de fin, no por ticks: con la pestaña en segundo plano los intervalos se ralentizan.
  pomo.endAt=Date.now()+pomo.secondsLeft*1000;
  if(pomo.phase==="focus"&&pomo.secondsLeft===POMO_FOCUS_MIN*60)focusStart();
  if(pomo.tick)clearInterval(pomo.tick);
  pomo.tick=setInterval(pomoTick,1000);
  renderPomodoro();
}
function pomoReset(){
  if(pomo.tick){clearInterval(pomo.tick);pomo.tick=null;}
  pomo.running=false;pomo.phase="focus";pomo.secondsLeft=POMO_FOCUS_MIN*60;
  renderPomodoro();
}
function pomoTick(){
  pomo.secondsLeft=Math.max(0,Math.ceil((pomo.endAt-Date.now())/1000));
  if(pomo.secondsLeft<=0){
    if(pomo.phase==="focus"){
      pomo.cycles++;
      // Si el pomodoro termina con la app oculta, el modo foco no llegó a ver la vuelta: se marchita aquí.
      if(plantarOn()&&(document.visibilityState==="hidden"||(FOCUS.hiddenAt&&Date.now()-FOCUS.hiddenAt>=FOCUS_GRACE_SEC*1000)))FOCUS.withered=true;
      FOCUS.hiddenAt=0;
      var saved={id:genId(),date:ymd(),min:POMO_FOCUS_MIN,sec:POMO_FOCUS_MIN*60,
        bib:NO_BIB,ts:Date.now()-POMO_FOCUS_MIN*60000,verif:false,prod:null,note:"Pomodoro",offering:(extrasOn()&&DATA.offeringText)||"",subject:DATA.currentSubject||null,focus:focusResult(),esp:plantarOn()?especieActual():null};
      var hAntes=horasTotales();DATA.sessions.push(saved);saveUserData();socialShareSession(saved);comprobarSubidaNivel(hAntes);renderNivel();trasGuardarSesion(saved);
      showToast(saved.focus==="withered"?"🍅 Pomodoro completado, pero tu árbol se marchitó 🥀":"🍅 ¡Pomodoro completado! 🌳 Árbol plantado en tu bosque");
      if(saved.focus==="ok")confeti(50);
      pomo.phase="break";pomo.secondsLeft=POMO_BREAK_MIN*60;pomo.endAt=Date.now()+pomo.secondsLeft*1000;
      releaseWakeLock();
      renderProfile();renderForest();
    }else{
      showToast("⏰ Descanso terminado. ¿Otro pomodoro?");
      pomo.running=false; if(pomo.tick){clearInterval(pomo.tick);pomo.tick=null;}
      pomo.phase="focus";pomo.secondsLeft=POMO_FOCUS_MIN*60;
    }
  }
  renderPomodoro();
}
function renderPomodoro(){
  var t=$("pomoTime"); if(!t)return;
  var mm=Math.floor(pomo.secondsLeft/60),ss=pomo.secondsLeft%60;
  t.textContent=String(mm).padStart(2,"0")+":"+String(ss).padStart(2,"0");
  var lbl=$("pomoPhase"); if(lbl)lbl.textContent=pomo.phase==="focus"?"Concéntrate":"Descanso";
  var cyc=$("pomoCycles"); if(cyc)cyc.textContent=pomo.cycles;
  renderFocusPlant();
  var btn=$("btnPomoToggle"); if(btn)btn.textContent=pomo.running?"⏸ Pausar":"▶ Empezar";
}
const SHELF_COLORS=["#6c5ce7","#00d2d3","#f59e0b","#22c55e","#e17055","#0984e3","#e84393","#00b894"];
function renderBookshelf(){
  var el=$("bookshelfRow"),lab=$("bookshelfLabel"); if(!el||!DATA)return;
  var totalMin=0;DATA.sessions.forEach(function(s){totalMin+=s.min;});
  if(studyTimer.running)totalMin+=elapsedMin();
  var hours=Math.floor(totalMin/60);
  if(lab)lab.textContent=hours>0?(hours+"h de estudio acumuladas · un libro por cada hora"):"0h de estudio acumuladas";
  if(!hours){el.innerHTML='<div class="empty-note">Aún no hay libros en tu estantería. Completa tu primera hora de estudio.</div>';return;}
  var n=Math.min(hours,80),html="";
  for(var i=0;i<n;i++){
    var color=SHELF_COLORS[i%SHELF_COLORS.length];
    var h=34+((i*37)%18);
    html+='<div class="book-spine" style="background:'+color+';height:'+h+'px" title="Hora '+(i+1)+' de estudio"></div>';
  }
  if(hours>80)html+='<div class="book-more">+'+(hours-80)+'</div>';
  el.innerHTML=html;
}
function fmtFeedDate(dateStr){
  var d=new Date(dateStr+"T00:00:00"),hoy=new Date(),ayer=new Date();ayer.setDate(hoy.getDate()-1);
  var same=function(a,b){return a.toDateString()===b.toDateString();};
  if(same(d,hoy))return "Hoy";
  if(same(d,ayer))return "Ayer";
  return String(d.getDate()).padStart(2,"0")+" "+MESES[d.getMonth()].slice(0,3);
}
function renderSessionFeed(force){
  var el=$("sessionFeed"); if(!el||!DATA)return;
  // no repintar mientras el usuario escribe un comentario (salvo que se fuerce tras enviar/abrir)
  var act=document.activeElement;
  if(force!==true&&act&&act.dataset&&act.dataset.cmtInput!=null&&el.contains(act))return;
  if(feedTab==="amigos"){
    if(!socialClient()||!SOCIAL.user){el.innerHTML='<div class="empty-note">'+(socialKeysOk()?'Con una cuenta (opcional) y amigos verás aquí su actividad':'Configura Supabase para ver la actividad de tus amigos')+'</div>';return;}
    var fses=filterBlocked(SOCIAL.friendSessions,"owner_id");
    if(!fses.length){el.innerHTML='<div class="empty-note">Tus amigos no tienen sesiones compartidas todavía</div>';return;}
    el.innerHTML=fses.map(function(s){
      var lugar=(s.bib_name||"").replace("Biblioteca ","").replace("Pública ","");
      var who=socialNameById(s.owner_id);
      var stars=s.prod?'<span class="fstars">'+"★".repeat(s.prod)+"☆".repeat(5-s.prod)+'</span>':'';
      var n=SOCIAL.kudosCounts[s.local_id]||0, ya=!!SOCIAL.kudosByMe[s.local_id];
      var extra=(s.subject?' · '+escapeHTML(s.subject):'')+(s.focus==="ok"?' <span title="Sesión de foco completada">🌳</span>':(s.focus==="withered"?' <span title="Salió de la app durante el modo foco">🥀</span>':''));
      return '<div class="feed-item" ondblclick="kudosDoble(event,'+jsArg(s.local_id)+','+jsArg(s.owner_id)+')"><div class="fhead"><div class="fplace">'+escapeHTML(who)+' · '+escapeHTML(lugar)+extra+(s.verif?' <span class="fverif" title="Check-in verificado">✓</span>':'')+'</div><div style="display:flex;align-items:center;gap:2px"><div class="fdate">'+fmtFeedDate(s.date)+'</div>'+ugcMoreBtn("shared_session",s.owner_id+":"+s.local_id,s.owner_id,who)+'</div></div>'+
        '<div class="fdur">'+hMin(s.minutes)+'</div>'+
        '<div class="fmeta">'+stars+'</div>'+
        (s.note?'<div class="fnote">"'+escapeHTML(s.note)+'"</div>':'')+
        (s.offering?'<div class="foffer">🙏 Ofrecido por '+escapeHTML(s.offering)+'</div>':'')+
        '<div class="feed-actions"><button class="kudos-btn'+(ya?" on":"")+'" '+(ya?"disabled":"")+' onclick="giveKudos('+jsArg(s.local_id)+','+jsArg(s.owner_id)+')">👏 '+(n?n:"Dar kudos")+'</button>'+
        commentButtonHTML(s.local_id,s.owner_id)+'</div>'+
        commentThreadHTML(s.local_id,s.owner_id)+
        '</div>';
    }).join("");
    return;
  }
  if(!DATA.sessions.length){el.innerHTML='<div class="empty-note">Todavía no tienes sesiones registradas. Empieza a estudiar arriba ↑</div>';return;}
  // marca qué sesiones fueron récord personal EN SU MOMENTO (recorriendo en orden cronológico)
  var runningMax=0,prAt={};
  DATA.sessions.forEach(function(s,idx){
    if(s.min>runningMax){prAt[idx]=runningMax>0?(s.min-runningMax):null;runningMax=s.min;}
  });
  var lista=DATA.sessions.map(function(s,idx){return {s:s,idx:idx};}).reverse().slice(0,20);
  // comentarios que tus amigos han dejado en tus sesiones (solo con Supabase y la tabla creada)
  var myId=commentsAvailable()?SOCIAL.user.id:null;
  if(myId&&Date.now()-SOCIAL.myCommentsAt>45000){socialLoadMyComments().then(function(){renderSessionFeed();});}
  function ownCmt(s){
    if(!myId||!s.id)return "";
    if(!DATA.sharePresence&&!commentsFor(s.id,myId).length)return "";
    return '<div class="feed-actions">'+commentButtonHTML(s.id,myId)+'</div>'+commentThreadHTML(s.id,myId);
  }
  el.innerHTML=lista.map(function(item){
    var s=item.s,idx=item.idx;
    var lugar=s.bib.replace("Biblioteca ","").replace("Pública ","");
    var valoracion=s.prod?("★".repeat(s.prod)+"☆".repeat(5-s.prod)):"—";
    var prBanner=(idx in prAt)?('<div class="pr-banner"><span class="pr-badge">RP</span>¡Tu sesión más larga hasta ahora!'+(prAt[idx]?'<span class="pr-delta">▲ +'+hMin(prAt[idx])+'</span>':'')+'</div>'):'';
    var extra=(s.subject?' · '+escapeHTML(s.subject):'')+(s.focus==="ok"?' <span title="Sesión de foco completada">🌳</span>':(s.focus==="withered"?' <span title="Saliste de la app durante el modo foco">🥀</span>':''));
    return '<div class="feed-item"><div class="fhead"><div class="fplace">'+escapeHTML(lugar)+extra+(s.verif?' <span class="fverif" title="Check-in verificado">✓</span>':'')+'</div><div class="fdate">'+fmtFeedDate(s.date)+'</div></div>'+
      '<div class="fstats"><div class="fstat"><small>Duración</small><b>'+hMin(s.min)+'</b></div><div class="fstat"><small>Valoración</small><b class="fstars">'+valoracion+'</b></div></div>'+
      prBanner+
      '<button class="linkbtn feed-edit" onclick="editarSesion('+idx+')">Editar</button>'+
      (s.note?'<div class="fnote">"'+escapeHTML(s.note)+'"</div>':'')+
      (s.offering?'<div class="foffer">🙏 Ofrecido por '+escapeHTML(s.offering)+'</div>':'')+
      ownCmt(s)+
      '</div>';
  }).join("");
}
// Fecha local AAAA-MM-DD. toISOString() da la fecha UTC: entre las 0:00 y las 2:00 en España
// contaba lo estudiado como del día anterior (y podía romper rachas).
function ymd(d){d=d||new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function hMin(min){var hh=Math.floor(min/60),mm=min%60;return hh+"h "+mm+"m";}
function weekMinutes(){
  var now=new Date();var monday=new Date(now);var day=(now.getDay()+6)%7;monday.setDate(now.getDate()-day);monday.setHours(0,0,0,0);
  var sum=0;DATA.sessions.forEach(function(s){if(s.date>=ymd(monday))sum+=s.min;});
  if(studyTimer.running&&studyTimer.start>=monday.getTime())sum+=elapsedMin();
  return sum;
}
function streakDays(){
  if(!DATA.sessions.length&&!(DATA.usedFreezeDates&&DATA.usedFreezeDates.length))return studyTimer.running?1:0;
  var days={};DATA.sessions.forEach(function(s){days[s.date]=true;});
  (DATA.usedFreezeDates||[]).forEach(function(dt){days[dt]=true;});
  if(studyTimer.running)days[ymd()]=true;
  var streak=0;var d=new Date();
  for(;;){var k=ymd(d);if(days[k]){streak++;d.setDate(d.getDate()-1);}else{
    // permitir que hoy aún no tenga sesión sin romper la racha
    if(streak===0&&k===ymd()){d.setDate(d.getDate()-1);continue;}
    break;}}
  return streak;
}
function checkStreakFreezes(){
  if(!DATA||!DATA.sessions.length)return;
  var realDays={};DATA.sessions.forEach(function(s){realDays[s.date]=true;});
  var realStreak=0;var d=new Date();
  for(;;){var k=ymd(d);if(realDays[k]){realStreak++;d.setDate(d.getDate()-1);}else{
    if(realStreak===0&&k===ymd()){d.setDate(d.getDate()-1);continue;}
    break;}}
  // Si la racha se rompió, el contador de "congelador ganado" vuelve a empezar con ella.
  if(realStreak<(DATA.lastFreezeEarnedAtStreak||0))DATA.lastFreezeEarnedAtStreak=Math.floor(realStreak/7)*7;
  var earnedAt=Math.floor(realStreak/7)*7;
  if(earnedAt>0&&earnedAt>DATA.lastFreezeEarnedAtStreak&&DATA.streakFreezes<3){
    DATA.streakFreezes=Math.min(3,DATA.streakFreezes+1);
    DATA.lastFreezeEarnedAtStreak=earnedAt;
    saveUserData();
    showToast("🧊 Has ganado un congelador de racha (racha de "+earnedAt+" días)");
  }
  // Hueco de uno o más días sin estudiar justo antes de hoy: se cubre si hay congeladores para todos.
  var used=DATA.usedFreezeDates=DATA.usedFreezeDates||[];
  var cubierto=function(k){return realDays[k]||used.indexOf(k)!==-1;};
  var gap=[],dd=new Date();dd.setDate(dd.getDate()-1);
  while(!cubierto(ymd(dd))&&gap.length<=DATA.streakFreezes){gap.push(ymd(dd));dd.setDate(dd.getDate()-1);}
  if(gap.length>0&&gap.length<=DATA.streakFreezes&&cubierto(ymd(dd))){
    DATA.streakFreezes-=gap.length; gap.forEach(function(k){used.push(k);});
    saveUserData();
    showToast("🧊 Se "+(gap.length===1?"usó un congelador":"usaron "+gap.length+" congeladores")+" para no perder tu racha");
  }
}
function openGoalModal(){
  var cur=DATA.goalMin, period=DATA.goalPeriod||"day";
  openModal('<h3>Meta de estudio</h3><div class="sub">¿Cuántas horas quieres estudiar?</div>'+
    '<div class="seg" id="goalPeriodSeg"><button data-p="day" class="'+(period==="day"?"on":"")+'">Al día</button><button data-p="week" class="'+(period==="week"?"on":"")+'">A la semana</button></div>'+
    '<div class="field"><label>Horas</label><input type="number" id="goalH" min="0" max="80" step="0.5" value="'+(cur/60)+'"></div>'+
    '<button class="btn" id="goalSave">Guardar meta</button>',
    function(){
      var selPeriod=period;
      document.querySelectorAll("#goalPeriodSeg button").forEach(function(b){b.addEventListener("click",function(){
        document.querySelectorAll("#goalPeriodSeg button").forEach(function(x){x.classList.remove("on");});
        b.classList.add("on");selPeriod=b.dataset.p;});});
      $("goalSave").addEventListener("click",function(){
        var v=parseFloat($("goalH").value)||0;DATA.goalMin=Math.max(30,Math.round(v*60));DATA.goalPeriod=selPeriod;DATA.goalCustom=true;saveUserData();closeModal();renderStudy();
      });
    });
}

/* ===================== CALENDARIO ===================== */
var calRef=new Date();
const MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DOW=["L","M","X","J","V","S","D"];
function renderCal(){
  if(!DATA)return;
  var y=calRef.getFullYear(),m=calRef.getMonth();
  $("calMonth").textContent=MESES[m]+" "+y;
  var grid=$("calGrid");grid.innerHTML="";
  DOW.forEach(function(d){var e=document.createElement("div");e.className="cal-dow";e.textContent=d;grid.appendChild(e);});
  var first=new Date(y,m,1);var startDow=(first.getDay()+6)%7;
  var daysInMonth=new Date(y,m+1,0).getDate();
  var todayStr=ymd();
  for(var i=0;i<startDow;i++){var c=document.createElement("div");c.className="cal-cell empty";grid.appendChild(c);}
  for(var dn=1;dn<=daysInMonth;dn++){
    var key=y+"-"+String(m+1).padStart(2,"0")+"-"+String(dn).padStart(2,"0");
    var cell=document.createElement("div");cell.className="cal-cell"+(key===todayStr?" today":(key<todayStr?" pasado":""));
    var evs=DATA.events[key]||[], fevs=eventosAmigosDe(key);
    var shown=evs.slice(0,2);
    var txts=shown.map(function(ev){return '<div class="evtxt ev-'+ev.type+'-txt" title="'+escapeHTML(ev.title)+'">'+escapeHTML(ev.title)+'</div>';}).join("")+
      (fevs.length&&shown.length<2?'<div class="evtxt amigo-txt" title="De tus amigos">👥 '+escapeHTML(fevs[0].title)+'</div>':'');
    var dots=evs.slice(0,4).map(function(ev){return '<i class="ev-'+ev.type+'"></i>';}).join("")+(fevs.length?'<i class="amigo"></i>':'');
    if(fevs.length)evs=evs.concat(fevs);
    cell.innerHTML='<div class="dnum">'+dn+'</div><div class="evlist">'+txts+'</div>'+(evs.length>2?'<span class="more">+'+(evs.length-2)+'</span>':'')+
      (evs.length?'<div class="evdots" aria-label="'+evs.length+' evento'+(evs.length>1?'s':'')+'">'+dots+'</div>':'');
    (function(k){cell.addEventListener("click",function(){openDayModal(k);});})(key);
    grid.appendChild(cell);
  }
  if(typeof actualizarBadge==="function")actualizarBadge();
  renderCalProx();
  renderCalFriendExams();
}
// Lista de los eventos de las próximas dos semanas, con el título completo (en la cuadrícula del móvil solo caben puntos)
function renderCalProx(){
  var el=$("calProx");if(!el)return;
  var hoy=new Date();hoy.setHours(0,0,0,0);var items=[];
  for(var d=0;d<14&&items.length<6;d++){
    var f=new Date(hoy);f.setDate(hoy.getDate()+d);var k=ymd(f);
    (DATA.events[k]||[]).forEach(function(ev){items.push({k:k,f:new Date(f),d:d,ev:ev});});
  }
  if(!items.length){el.innerHTML='<div class="empty-note">Nada en las próximas dos semanas. Pincha un día para añadir un examen o una tarea.</div>';return;}
  var DS=["dom","lun","mar","mié","jue","vie","sáb"],TIPO={examen:"Examen",tarea:"Tarea",otro:"Otro"};
  el.innerHTML=items.slice(0,6).map(function(it){
    var cuando=it.d===0?"Hoy":it.d===1?"Mañana":"En "+it.d+" días";
    return '<div class="prox-item ev-'+it.ev.type+'-txt" data-k="'+it.k+'"><div class="pd"><b>'+it.f.getDate()+'</b><small>'+DS[it.f.getDay()]+'</small></div>'+
      '<div class="pt"><b>'+escapeHTML(it.ev.title)+'</b><small>'+(TIPO[it.ev.type]||"")+' · '+cuando+(it.ev.shared?' · 👥':'')+'</small></div>'+(it.ev.type==="examen"&&it.ev.shared?prayCountMine(it.ev.id):'')+'</div>';
  }).join("");
  el.querySelectorAll(".prox-item").forEach(function(x){x.addEventListener("click",function(){openDayModal(x.dataset.k);});});
}
function openDayModal(key){
  var parts=key.split("-");
  var titulo=parts[2]+" de "+MESES[parseInt(parts[1])-1];
  var evs=DATA.events[key]||[];
  var listHTML="";
  if(evs.length){evs.forEach(function(ev,idx){
    listHTML+='<div class="ev-item"><span class="tag ev-'+ev.type+'"></span><div class="et"><b>'+escapeHTML(ev.title)+'</b><small>'+ev.type+(ev.shared?' · 👥 compartido con amigos':'')+(ev.type==="examen"&&ev.shared?prayCountMine(ev.id):'')+'</small></div><button class="del" data-i="'+idx+'">×</button></div>';
  });}else{listHTML='<div class="empty-note">Sin eventos este día</div>';}
  listHTML+='<div id="dayFriendEvs">'+diaAmigosHTML(key)+'</div>';
  openModal('<h3>'+titulo+'</h3><div class="sub">Exámenes, tareas y otros eventos</div>'+
    '<div id="dayEvs" data-k="'+key+'">'+listHTML+'</div>'+
    '<div style="border-top:1px solid rgba(148,163,184,.3);margin:16px 0 14px"></div>'+
    '<div class="seg" id="evType"><button data-t="examen" class="on">Examen</button><button data-t="tarea">Tarea</button><button data-t="otro">Otro</button></div>'+
    '<div class="field"><input type="text" id="evTitle" placeholder="Ej: Examen de Cálculo II"></div>'+
    '<label id="evShareWrap" style="display:flex;align-items:center;gap:9px;margin:-2px 0 14px;font-size:var(--fs-m);color:var(--suave);font-weight:700"><input type="checkbox" id="evShareExam" checked> Compartir con mis amigos (lo verán en su Agenda)</label>'+
    '<button class="btn" id="evAdd">Añadir</button>',
    function(){
      var selType="examen";
      $("evShareWrap").style.display=SOCIAL.user?"flex":"none";
      document.querySelectorAll("#evType button").forEach(function(b){b.addEventListener("click",function(){
        document.querySelectorAll("#evType button").forEach(function(x){x.classList.remove("on");});
        b.classList.add("on");selType=b.dataset.t;});});
      $("evAdd").addEventListener("click",function(){
        var t=$("evTitle").value.trim();if(!t)return;
        if(!DATA.events[key])DATA.events[key]=[];
        var compartir=!!SOCIAL.user&&$("evShareExam").checked;
        var evObj={id:genId(),title:t,type:selType,shared:compartir};
        DATA.events[key].push(evObj);saveUserData();closeModal();renderCal();registrarAccion("agenda");
        if(compartir)socialShareEvent({id:evObj.id,title:evObj.title,type:selType,date:key});
      });
      document.querySelectorAll("#dayEvs .del").forEach(function(btn){btn.addEventListener("click",function(){
        var idx=parseInt(btn.dataset.i);var removed=DATA.events[key][idx];
        DATA.events[key].splice(idx,1);
        if(!DATA.events[key].length)delete DATA.events[key];
        saveUserData();closeModal();renderCal();openDayModal(key);
        if(removed&&removed.shared)socialDeleteSharedEvent({id:removed.id});
      });});
    });
}

/* ===================== PERFIL ===================== */
function renderProfile(){
  if(!DATA)return;
  renderNivel();
  var totalMin=0;DATA.sessions.forEach(function(s){totalMin+=s.min;});
  if(studyTimer.running)totalMin+=elapsedMin();
  $("pTotalH").textContent=Math.floor(totalMin/60)+"h";
  $("pSessions").textContent=DATA.sessions.length;
  $("pLoans").textContent=DATA.loans.filter(function(l){return !l.returned;}).length;
  // favorita
  var counts={};DATA.sessions.forEach(function(s){if(s.bib!==NO_BIB)counts[s.bib]=(counts[s.bib]||0)+s.min;});
  var fav="—",best=0;for(var k in counts){if(counts[k]>best){best=counts[k];fav=k;}}
  // mismo nombre corto que en el resto de la app ("Biblioteca de Navarra" no se queda en "de Navarra")
  $("pFav").textContent=fav==="—"?"—":cortoNombre(fav.split("·")[0].trim());
  $("pFav").style.fontSize=fav==="—"?"var(--fs-4xl)":"var(--fs-l)";
  // semana
  renderWeekBars();
  renderRecords();
  renderChallenges();
  renderBadges();
  if(socialClient()&&SOCIAL.user){socialLoadLeaderboard().then(renderLeaderboard);}else{renderLeaderboard();}
  renderLoans();
  renderSugerencia();
  var chk=$("chkGeo"); if(chk)chk.checked=!!DATA.geoCheck;
  var sh=$("chkSharePresence"); if(sh)sh.checked=!!DATA.sharePresence;
  var inv=$("chkInvisible"); if(inv)inv.checked=!!DATA.invisible;
  socialRenderPanel();
  var pb=$("btnNotifPerm");
  if(pb){ if("Notification" in window && Notification.permission==="granted"){pb.textContent="Activadas ✓";pb.disabled=true;} else {pb.textContent="Activar";pb.disabled=false;} }
  actualizarBadge();
}
function renderWeekBars(){
  var wb=$("weekBars");wb.innerHTML="";
  var now=new Date();var day=(now.getDay()+6)%7;
  var monday=new Date(now);monday.setDate(now.getDate()-day);monday.setHours(0,0,0,0);
  var labels=["L","M","X","J","V","S","D"];var mins=[0,0,0,0,0,0,0];
  DATA.sessions.forEach(function(s){var d=new Date(s.date+"T00:00:00");var diff=Math.round((d-monday)/86400000);if(diff>=0&&diff<7)mins[diff]+=s.min;});
  if(studyTimer.running){var diff=Math.round((new Date(ymd()+"T00:00:00")-monday)/86400000);if(diff>=0&&diff<7)mins[diff]+=elapsedMin();}
  var max=Math.max(60,Math.max.apply(null,mins));
  for(var i=0;i<7;i++){
    var pct=Math.round(mins[i]/max*100);
    var div=document.createElement("div");div.className="wb";
    div.innerHTML='<div class="bar" style="height:'+pct+'%" title="'+hMin(mins[i])+'"></div><div class="d">'+labels[i]+'</div>';
    wb.appendChild(div);
  }
}
function computeBestStreak(){
  if(!DATA.sessions.length)return 0;
  var days={};DATA.sessions.forEach(function(s){days[s.date]=true;});
  (DATA.usedFreezeDates||[]).forEach(function(k){days[k]=true;});
  var dates=Object.keys(days).sort();
  var best=1,cur=1;
  for(var i=1;i<dates.length;i++){
    var diff=Math.round((new Date(dates[i])-new Date(dates[i-1]))/86400000);
    cur=diff===1?cur+1:1;
    if(cur>best)best=cur;
  }
  return best;
}
function renderRecords(){
  var el=$("recordsGrid"); if(!el)return;
  if(!DATA.sessions.length){el.innerHTML='<div class="empty-note" style="grid-column:1/-1">Termina tu primera sesión para empezar a ganar récords</div>';return;}
  var maxMin=0,bestBib="—",totalMin=0;
  DATA.sessions.forEach(function(s){totalMin+=s.min;if(s.min>maxMin){maxMin=s.min;bestBib=s.bib.replace("Biblioteca ","").replace("Pública ","");}});
  el.innerHTML=
    '<div class="stat"><div class="num">'+hMin(maxMin)+'</div><div class="lab">Sesión más larga · '+escapeHTML(bestBib)+'</div></div>'+
    '<div class="stat"><div class="num">'+computeBestStreak()+'</div><div class="lab">Mejor racha (días)</div></div>'+
    '<div class="stat"><div class="num">'+Math.floor(totalMin/60)+'h</div><div class="lab">Total histórico</div></div>';
}
const BADGE_DEFS=[
  {id:"first_session",icon:"🎯",label:"Primer paso",desc:"Completa tu primera sesión de estudio"},
  {id:"ten_hours",icon:"📚",label:"10 horas",desc:"Acumula 10 horas de estudio en total"},
  {id:"streak7",icon:"🔥",label:"Racha de 7",desc:"Consigue una racha de 7 días seguidos"},
  {id:"night_owl",icon:"🌙",label:"Búho nocturno",desc:"Estudia entre las 22:00 y las 6:00"},
  {id:"first_friend",icon:"🤝",label:"Primer amigo",desc:"Añade a tu primer amigo en la app"},
  {id:"first_prayer",icon:"🙏",label:"Buena fe",desc:"Reza por el examen de un amigo"},
  {id:"first_post",icon:"📖",label:"Crítico literario",desc:"Publica tu primera reseña en el blog"},
  {id:"first_room",icon:"👥",label:"Trabajo en equipo",desc:"Estudia en una sala de grupo"},
  {id:"bosque7",icon:"🌲",label:"Bosque perfecto",desc:"7 días seguidos plantando árboles sin que se marchite ninguno"},
  {id:"cofre1",icon:"🎁",label:"Cazador de cofres",desc:"Completa las 3 misiones de un día y abre el cofre"},
  {id:"botanico",icon:"🌸",label:"Botánico",desc:"Desbloquea una especie nueva en la tienda del bosque"}
];
function bosquePerfecto(){
  var por={};DATA.sessions.forEach(function(s){var p=por[s.date]=por[s.date]||{ok:0,seco:0};if(s.focus==="withered")p.seco++;else p.ok++;});
  var mejor=0,racha=0,d=new Date();d.setDate(d.getDate()-400);
  for(var k=0;k<=400;k++){var x=por[ymd(d)];if(x&&x.ok&&!x.seco){racha++;mejor=Math.max(mejor,racha);}else racha=0;d.setDate(d.getDate()+1);}
  return mejor;
}
function renderBadges(){
  var el=$("badgesGrid"); if(!el||!DATA)return;
  var changed=false;
  function grant(id){if(!DATA.badges[id]){DATA.badges[id]=new Date().toISOString();changed=true;}}
  var totalMin=0;DATA.sessions.forEach(function(s){totalMin+=s.min;});
  if(DATA.sessions.length>=1)grant("first_session");
  if(totalMin>=600)grant("ten_hours");
  if(computeBestStreak()>=7)grant("streak7");
  if(DATA.sessions.some(function(s){var h=new Date(s.ts).getHours();return h>=22||h<6;}))grant("night_owl");
  if(socialClient()&&SOCIAL.friends&&SOCIAL.friends.length>=1)grant("first_friend");
  if(bosquePerfecto()>=7)grant("bosque7");
  if(DATA.cofresAbiertos)grant("cofre1");
  if((DATA.especiesCompradas||[]).length)grant("botanico");
  if(changed)saveUserData();
  el.innerHTML=BADGE_DEFS.map(function(b){
    var on=!!DATA.badges[b.id], cuando=badgeDateISO(DATA.badges[b.id]);
    var tip=b.desc+(cuando?" · Lograda el "+fmtTrophyDate(cuando):"");
    return '<div class="badge-tile'+(on?" on":"")+'" title="'+escapeHTML(tip)+'"><div class="bt-icon">'+b.icon+'</div><div class="bt-label">'+escapeHTML(b.label)+'</div></div>';
  }).join("");
}
/* ===== RETOS MENSUALES + VITRINA DE TROFEOS (estilo Strava Challenges / Trophy Case) =====
   Cada mes hay dos retos calculados desde DATA.sessions (date, min). Al completarlos se guarda
   DATA.badges["ch_YYYY-MM_hours"|"ch_YYYY-MM_days"] con la fecha ISO del logro.
   Compatibilidad: un valor true (formato antiguo) significa "logrado, fecha desconocida". */
const CHALLENGE_DEFS=[
  {kind:"hours",icon:"⏱️",target:1800,title:function(mes){return "30 h en "+mes;},short:"30 h"},
  {kind:"days",icon:"📅",target:15,title:function(mes){return "15 días activos en "+mes;},short:"15 días"}
];
function badgeDateISO(v){return (typeof v==="string"&&!isNaN(Date.parse(v)))?v:null;}
function fmtTrophyDate(iso){var d=new Date(iso);return d.getDate()+" "+MESES[d.getMonth()].slice(0,3)+" "+d.getFullYear();}
function challengeKey(ym,kind){return "ch_"+ym+"_"+kind;}
function currentYM(){var n=new Date();return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0");}
function ymLabel(ym){return MESES[parseInt(ym.slice(5,7),10)-1];}
// progreso de un mes y momento (ISO) en que se cruzó cada objetivo, recorriendo las sesiones en orden
function monthChallengeStats(ym){
  var ses=DATA.sessions.filter(function(s){return typeof s.date==="string"&&s.date.slice(0,7)===ym;})
    .slice().sort(function(a,b){return (a.ts||Date.parse(a.date))-(b.ts||Date.parse(b.date));});
  var min=0,days={},nDays=0,at={hours:null,days:null};
  ses.forEach(function(s){
    min+=(s.min||0);
    if(!days[s.date]){days[s.date]=true;nDays++;}
    var when=s.ts?new Date(s.ts+(s.min||0)*60000).toISOString():new Date(s.date+"T00:00:00").toISOString();
    if(!at.hours&&min>=CHALLENGE_DEFS[0].target)at.hours=when;
    if(!at.days&&nDays>=CHALLENGE_DEFS[1].target)at.days=when;
  });
  return {hours:min,days:nDays,at:at};
}
// concede (sin sobrescribir) los retos de cualquier mes con sesiones; devuelve los recién logrados
function checkChallenges(){
  var meses={},nuevos=[];
  DATA.sessions.forEach(function(s){if(typeof s.date==="string"&&/^\d{4}-\d{2}/.test(s.date))meses[s.date.slice(0,7)]=true;});
  Object.keys(meses).forEach(function(ym){
    var st=monthChallengeStats(ym);
    CHALLENGE_DEFS.forEach(function(c){
      var k=challengeKey(ym,c.kind);
      if(st.at[c.kind]&&!DATA.badges[k]){DATA.badges[k]=st.at[c.kind];nuevos.push({ym:ym,c:c});}
    });
  });
  if(nuevos.length)saveUserData();
  return nuevos;
}
function renderChallenges(){
  var el=$("challengesList"), tc=$("trophyCase"); if(!el||!tc||!DATA)return;
  var nuevos=checkChallenges();
  var ym=currentYM(), mes=ymLabel(ym), st=monthChallengeStats(ym);
  var now=new Date(), finMes=new Date(now.getFullYear(),now.getMonth()+1,0).getDate(), quedan=finMes-now.getDate();
  el.innerHTML=CHALLENGE_DEFS.map(function(c){
    var val=c.kind==="hours"?st.hours:st.days, pct=Math.min(100,Math.floor(val*100/c.target));
    var logro=DATA.badges[challengeKey(ym,c.kind)], done=!!logro, cuando=badgeDateISO(logro);
    var prog=c.kind==="hours"?(hMin(val)+" de 30 h"):(val+" de 15 días");
    var sub=done?("✓ Conseguido"+(cuando?" el "+fmtTrophyDate(cuando):"")):(prog+" · "+(quedan===0?"último día":"quedan "+quedan+" día"+(quedan===1?"":"s")));
    return '<div class="challenge'+(done?" done":"")+'"><div class="ch-top"><div class="ch-icon">'+c.icon+'</div><div class="ch-txt"><b>'+escapeHTML(c.title(mes))+'</b><small>'+escapeHTML(sub)+'</small></div><div class="ch-pct">'+pct+'%</div></div>'+
      '<div class="ch-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'" aria-label="'+escapeHTML(c.title(mes))+'"><div class="ch-fill" style="width:'+pct+'%"></div></div></div>';
  }).join("");
  // vitrina: trofeos de retos, del más reciente al más antiguo; los de fecha desconocida al final
  var trofeos=[];
  Object.keys(DATA.badges).forEach(function(k){
    var m=/^ch_(\d{4}-\d{2})_(hours|days)$/.exec(k); if(!m||!DATA.badges[k])return;
    var def=CHALLENGE_DEFS.filter(function(c){return c.kind===m[2];})[0];
    trofeos.push({ym:m[1],def:def,iso:badgeDateISO(DATA.badges[k])});
  });
  trofeos.sort(function(a,b){
    if(a.iso&&b.iso)return Date.parse(b.iso)-Date.parse(a.iso);
    if(a.iso!==b.iso)return a.iso?-1:1;
    return a.ym<b.ym?1:(a.ym>b.ym?-1:0);
  });
  tc.innerHTML=trofeos.length?trofeos.map(function(t){
    return '<div class="trophy" title="'+escapeHTML(t.def.title(ymLabel(t.ym)+" "+t.ym.slice(0,4)))+'"><div class="tr-icon">🏆</div><div class="tr-label">'+t.def.icon+' '+escapeHTML(t.def.short)+'</div>'+
      '<div class="tr-date">'+escapeHTML(ymLabel(t.ym)+" "+t.ym.slice(0,4))+'</div><div class="tr-date">'+(t.iso?escapeHTML(fmtTrophyDate(t.iso)):"Fecha desconocida")+'</div></div>';
  }).join(""):'<div class="empty-note">Completa un reto mensual para ganar tu primer trofeo</div>';
  nuevos.filter(function(n){return n.ym===ym;}).forEach(function(n){showToast("🏆 ¡Reto conseguido: "+n.c.title(mes)+"!");});
}
function renderLoans(){
  var el=$("loanList");el.innerHTML="";
  if(!DATA.loans.length){el.innerHTML='<div class="empty-note">No tienes préstamos registrados</div>';return;}
  DATA.loans.forEach(function(l,idx){
    var due=new Date(l.due);var now=new Date();now.setHours(0,0,0,0);
    var days=Math.ceil((due-now)/86400000);
    var cls="ok",txt="Quedan "+days+" días";
    if(l.returned){cls="ok";txt="Devuelto";}
    else if(days<0){cls="late";txt="Vencido hace "+(-days)+" d";}
    else if(days<=3){cls="soon";txt=days===0?"Vence hoy":"Quedan "+days+" d";}
    var row=document.createElement("div");row.className="loan-row";
    row.innerHTML='<div class="li"><b>'+escapeHTML(l.title)+'</b><small>'+escapeHTML(l.bib)+'</small></div>'+
      '<span class="due '+cls+'">'+txt+'</span>'+
      '<button class="del" data-i="'+idx+'" style="border:none;background:none;color:#94a3b8;cursor:pointer;font-size:var(--fs-xl)">×</button>';
    el.appendChild(row);
  });
  el.querySelectorAll(".del").forEach(function(b){b.addEventListener("click",function(){
    DATA.loans.splice(parseInt(b.dataset.i),1);saveUserData();renderProfile();
  });});
}
function openLoanModal(){
  var opts=BIBLIOTECAS.map(function(b){return '<option value="'+escapeHTML(b.nombre)+'">'+escapeHTML(b.nombre)+'</option>';}).join("");
  var defDue=new Date();defDue.setDate(defDue.getDate()+21);
  openModal('<h3>Nuevo préstamo</h3><div class="sub">Registra un libro que has cogido prestado</div>'+
    '<div class="field"><label>Título del libro</label><input type="text" id="lnTitle" placeholder="Ej: Cien años de soledad"></div>'+
    '<div class="field"><label>Biblioteca</label><select id="lnBib">'+opts+'</select></div>'+
    '<div class="field"><label>Fecha de devolución</label><input type="date" id="lnDue" value="'+ymd(defDue)+'"></div>'+
    '<button class="btn" id="lnAdd">Guardar préstamo</button>',
    function(){ $("lnAdd").addEventListener("click",function(){
      var t=$("lnTitle").value.trim();if(!t)return;
      DATA.loans.push({title:t,bib:$("lnBib").value,due:$("lnDue").value,returned:false});
      saveUserData();closeModal();renderProfile();
    });});
}

/* ===================== MODAL + TOAST ===================== */
function openModal(html,after){
  var root=$("modalRoot");
  root.innerHTML='<div class="modal-bg" id="modalBg"><div class="modal">'+html+'</div></div>';
  $("modalBg").addEventListener("click",function(e){if(e.target.id==="modalBg")closeModal();});
  if(after)after();
}
function closeModal(){$("modalRoot").innerHTML="";}
function showToast(msg){
  var t=document.createElement("div");
  t.className="toast";t.setAttribute("role","status");t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(function(){t.classList.add("out");setTimeout(function(){t.remove();},400);},2400);
}
// Recompensa visual (dopamina sin trampas): estallido de emojis desde un elemento y, si se pide, confeti.
// No hace nada con «reducir movimiento» activado en el sistema.
function sinMovimiento(){try{return matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){return false;}}
function celebrar(el,emojis,n){
  if(sinMovimiento())return;
  var r=el&&el.getBoundingClientRect?el.getBoundingClientRect():{left:innerWidth/2,top:innerHeight/2,width:0,height:0};
  var cx=r.left+r.width/2, cy=r.top+r.height/2; emojis=emojis||["✨","⭐","💜"]; n=n||12;
  for(var i=0;i<n;i++){
    var p=document.createElement("span");p.className="burst";p.textContent=emojis[i%emojis.length];
    var ang=(Math.PI*2*i/n)+(Math.random()-.5)*.6, dist=50+Math.random()*60;
    p.style.left=cx+"px";p.style.top=cy+"px";
    p.style.setProperty("--dx",Math.cos(ang)*dist+"px");p.style.setProperty("--dy",(Math.sin(ang)*dist-30)+"px");
    p.style.setProperty("--rot",(Math.random()*120-60)+"deg");
    document.body.appendChild(p);(function(q){setTimeout(function(){q.remove();},950);})(p);
  }
  if(navigator.vibrate)try{navigator.vibrate(18);}catch(e){}
}
function confeti(n){
  if(sinMovimiento())return;
  var cols=["#6c5ce7","#00d2d3","#f59e0b","#22c55e","#e84393","#fd79a8","#ffeaa7"];n=n||80;
  for(var i=0;i<n;i++){
    var c=document.createElement("i");c.className="confeti";
    c.style.left=(Math.random()*100)+"vw";c.style.background=cols[i%cols.length];
    c.style.setProperty("--dx",(Math.random()*160-80)+"px");c.style.setProperty("--rot",(Math.random()*720-360)+"deg");
    c.style.animationDelay=(Math.random()*.35)+"s";c.style.animationDuration=(1.4+Math.random()*1.1)+"s";
    document.body.appendChild(c);(function(q){setTimeout(function(){q.remove();},3000);})(c);
  }
}
// Argumento seguro para un onclick="...": literal JS (JSON) escapado para atributo HTML.
// escapeHTML solo no basta: el navegador decodifica &#39; antes de ejecutar el handler.
function jsArg(s){return escapeHTML(JSON.stringify(String(s==null?"":s)));}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

/* ===================== EVENTOS ACADÉMICOS ===================== */
// Fuentes oficiales reales (verificadas). La app NO inventa eventos: enlaza a estas agendas.
var FUENTES=[
  {icon:"🎓",nombre:"Universidad de Navarra",desc:"Calendario de eventos y conferencias",url:"https://www.unav.edu/eventos"},
  {icon:"🏛️",nombre:"UPNA · Agenda",desc:"Charlas, seminarios, congresos y tesis",url:"https://agenda.unavarra.es/cal/"},
  {icon:"🎭",nombre:"Pamplona es Cultura",desc:"Agenda cultural del Ayuntamiento (conferencias, talleres…)",url:"https://www.pamplonaescultura.es/agenda/"},
  {icon:"📅",nombre:"Ayuntamiento de Pamplona",desc:"Agenda oficial de eventos de la ciudad",url:"https://www.pamplona.es/actualidad/eventos"},
  {icon:"🖼️",nombre:"Cultura · Gobierno de Navarra",desc:"Agenda de la Institución Príncipe de Viana",url:"https://www.culturanavarra.es/es/agenda"}
];
var TIPOS_EVT=[
  {v:"charla",l:"Charla"},{v:"ponencia",l:"Ponencia"},{v:"debate",l:"Debate"},{v:"jornada",l:"Jornada/Congreso"},{v:"otro",l:"Otro"}
];
function renderEvents(){
  if(!DATA)return;
  if(!DATA.acadEvents)DATA.acadEvents=[];
  socialRenderFriendEvents();
  // lista de eventos guardados (ordenados por fecha, futuros primero)
  var el=$("evtList");el.innerHTML="";
  var hoy=new Date();hoy.setHours(0,0,0,0);
  var evs=DATA.acadEvents.slice().sort(function(a,b){return a.date.localeCompare(b.date);});
  if(!evs.length){
    el.innerHTML='<div class="empty-note">Aún no has guardado ningún evento. Mira las agendas oficiales de abajo y añade los que te interesen.</div>';
  }else{
    evs.forEach(function(ev,idx){
      var d=new Date(ev.date+"T00:00:00");
      var dd=String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0");
      var pasado=d<hoy;
      var row=document.createElement("div");row.className="evt-row";row.style.opacity=pasado?".5":"1";
      var tipoL=(TIPOS_EVT.filter(function(t){return t.v===ev.type;})[0]||{l:ev.type}).l;
      row.innerHTML='<span class="etag evt-'+ev.type+'"></span>'+
        '<div class="ei"><b>'+escapeHTML(ev.title)+'</b><small>'+tipoL+(ev.place?' · '+escapeHTML(ev.place):'')+(ev.time?' · '+ev.time:'')+'</small>'+
        (ev.url?'<br><a href="'+escapeHTML(ev.url)+'" target="_blank" rel="noopener">Ver más ↗</a>':'')+'</div>'+
        '<span class="edate">'+dd+'</span>'+
        '<button class="del" data-i="'+idx+'">×</button>';
      el.appendChild(row);
    });
    el.querySelectorAll(".del").forEach(function(b){b.addEventListener("click",function(){
      var ev=evs[parseInt(b.dataset.i)];
      // borrar del array original y del calendario
      DATA.acadEvents=DATA.acadEvents.filter(function(x){return x.id!==ev.id;});
      quitarEventoCalendario(ev);
      socialDeleteSharedEvent(ev);
      saveUserData();renderEvents();renderCal();actualizarBadge();
    });});
  }
  // fuentes oficiales
  var src=$("sourceList");src.innerHTML="";
  FUENTES.forEach(function(f){
    var a=document.createElement("a");a.className="source-row";a.href=f.url;a.target="_blank";a.rel="noopener";
    a.innerHTML='<div class="sicon">'+f.icon+'</div><div class="si"><b>'+f.nombre+'</b><small>'+f.desc+'</small></div>'+
      '<svg class="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>';
    src.appendChild(a);
  });
}
function openEventModal(){
  var tipos=TIPOS_EVT.map(function(t,i){return '<button data-t="'+t.v+'"'+(i===0?' class="on"':'')+'>'+t.l+'</button>';}).join("");
  var hoy=ymd();
  openModal('<h3>Añadir evento</h3><div class="sub">Guárdalo en tu agenda. Aparecerá también en tu calendario y tus avisos.</div>'+
    '<div class="seg" id="evtType" style="flex-wrap:wrap">'+tipos+'</div>'+
    '<div class="field"><label>Título</label><input type="text" id="evtTitle" placeholder="Ej: Conferencia sobre IA y sociedad"></div>'+
    '<div class="field"><label>Fecha</label><input type="date" id="evtDate" value="'+hoy+'"></div>'+
    '<div class="field"><label>Hora (opcional)</label><input type="time" id="evtTime"></div>'+
    '<div class="field"><label>Lugar (opcional)</label><input type="text" id="evtPlace" placeholder="Ej: Aula Magna UPNA"></div>'+
    '<div class="field"><label>Enlace (opcional)</label><input type="url" id="evtUrl" placeholder="https://…"></div>'+
    '<label style="display:flex;align-items:center;gap:9px;margin:-2px 0 14px;font-size:var(--fs-m);color:var(--suave);font-weight:700"><input type="checkbox" id="evtShare"> Compartir con mis amigos aceptados</label>'+
    '<button class="btn" id="evtSave">Guardar evento</button>',
    function(){
      var selType="charla";
      document.querySelectorAll("#evtType button").forEach(function(b){b.addEventListener("click",function(){
        document.querySelectorAll("#evtType button").forEach(function(x){x.classList.remove("on");});
        b.classList.add("on");selType=b.dataset.t;
        // pintar el botón activo con color del tipo
      });});
      $("evtSave").addEventListener("click",function(){
        var t=$("evtTitle").value.trim();if(!t){showToast("Pon un título");return;}
        var fecha=$("evtDate").value;if(!fecha){showToast("Pon una fecha");return;}
        var ev={id:"e"+Date.now()+Math.floor(Math.random()*1000),title:t,type:selType,date:fecha,
          time:$("evtTime").value,place:$("evtPlace").value.trim(),url:$("evtUrl").value.trim()};
        if(!DATA.acadEvents)DATA.acadEvents=[];
        DATA.acadEvents.push(ev);
        anadirEventoCalendario(ev);
        if($("evtShare")&&$("evtShare").checked)socialShareEvent(ev);
        saveUserData();closeModal();renderEvents();renderCal();actualizarBadge();
        showToast("Evento guardado");
      });
    });
}
// Sincronizar con el calendario (vista cal) y avisos
function anadirEventoCalendario(ev){
  if(!DATA.events[ev.date])DATA.events[ev.date]=[];
  DATA.events[ev.date].push({title:ev.title,type:"otro",fromEvent:ev.id});
}
function quitarEventoCalendario(ev){
  if(DATA.events[ev.date]){
    DATA.events[ev.date]=DATA.events[ev.date].filter(function(x){return x.fromEvent!==ev.id;});
    if(!DATA.events[ev.date].length)delete DATA.events[ev.date];
  }
}


function minutosHastaCierre(b){
  var now=ahoraEn(b),d=now.getDay(),m=now.getHours()*60+now.getMinutes(),cal=horarioVigente(b);
  var tr=cal[d]||[];
  for(var k=0;k<tr.length;k++){ if(m>=tr[k][0]&&m<tr[k][1]){
    var c=tr[k][1]-m;
    // abierta a medianoche: suma los días siguientes que empiezan a las 00:00 (bibliotecas 24 h)
    for(var dd=1;dd<=7&&tr[k][1]>=1440;dd++){var t2=cal[(d+dd)%7]||[];if(t2.length&&t2[0][0]===0){c+=Math.min(t2[0][1],1440);if(t2[0][1]<1440)break;}else break;}
    return c; } }
  return -1; // cerrada
}
function es24h(b){var cal=horarioVigente(b);return cal.every(function(tr){return tr&&tr.length===1&&tr[0][0]===0&&tr[0][1]>=1440;});}
// "Abierta · cierra a las 21:00" / "Cerrada · abre mañana a las 8:30"
// Siguiente apertura (hora local de la biblioteca) mirando hoy y los 7 días siguientes. Cada día usa
// el horario de la temporada que le toca, así que acierta también en el cambio invierno/verano.
// Devuelve {dias:0 hoy/1 mañana/..., min:minuto del día en que abre, day:día de la semana, enMin:minutos que faltan} o null.
function proximaApertura(b){
  if(b.sinHorario)return null;
  var now=ahoraEn(b),m=now.getHours()*60+now.getMinutes();
  for(var dd=0;dd<=7;dd++){
    var dia=new Date(now.getFullYear(),now.getMonth(),now.getDate()+dd);
    var tr=(horarioVigente(b,dia)[dia.getDay()]||[]).slice().sort(function(a,c){return a[0]-c[0];});
    for(var k=0;k<tr.length;k++){if(dd>0||tr[k][0]>m)return {dias:dd,min:tr[k][0],day:dia.getDay(),enMin:dd*1440+tr[k][0]-m};}
  }
  return null;
}
// Filtros de la lista que dependen de la hora: "Abren pronto" (cerradas que abren en ≤90 min)
// y "Hasta tarde" (abiertas que cierran a las 21:00 o más tarde, incluidas las 24 h).
const PRONTO_MIN=90, TARDE_MIN=h(21,0);
function abrePronto(b){if(b.sinHorario||estadoBib(b))return null;var p=proximaApertura(b);return p&&p.enMin<=PRONTO_MIN?p:null;}
function horaCierre(b){var c=minutosHastaCierre(b);if(c<=0)return -1;var now=ahoraEn(b);return now.getHours()*60+now.getMinutes()+c;}
function abiertaHastaTarde(b){return !b.sinHorario&&horaCierre(b)>=TARDE_MIN;}
function estadoTexto(b){
  if(b.sinHorario)return {abierta:false,desconocido:true,txt:"Horario sin confirmar"};
  var c=minutosHastaCierre(b);
  if(c>0){var now=ahoraEn(b),fin=now.getHours()*60+now.getMinutes()+c;
    if(es24h(b))return {abierta:true,txt:"Abierta 24 h",cierre:c};
    if(fin>=1440)return {abierta:true,txt:"Abierta · cierra "+(fin>=2880?"en "+Math.round(c/60)+" h":"mañana a las "+fmtHoras(fin-1440)),cierre:c};
    return {abierta:true,txt:"Abierta · cierra a las "+fmtHoras(fin),cierre:c};}
  var p=proximaApertura(b);
  if(!p)return {abierta:false,txt:"Cerrada"};
  var cuando=p.dias===0?"hoy":(p.dias===1?"mañana":"el "+["domingo","lunes","martes","miércoles","jueves","viernes","sábado"][p.day]);
  return {abierta:false,txt:"Cerrada · abre "+cuando+" a las "+fmtHoras(p.min),prox:p};
}
function fmtDist(dm){return dm<1000?Math.round(dm)+" m":(dm/1000).toFixed(1)+" km";}
// Recomendación: abierta con margen, cerca, con hueco, de acceso libre; tu biblioteca habitual suma.
// Época de exámenes (aprox.): 15 dic – 10 feb y 10 may – 5 jul. La UPNA cierra su sala al público general.
function epocaExamenes(d){d=d||new Date();var m=d.getMonth(),dd=d.getDate();
  return (m===11&&dd>=15)||m===0||(m===1&&dd<=10)||(m===4&&dd>=10)||m===5||(m===6&&dd<=5);}
function esUNAV(b){return b.nombre.indexOf("Universidad de Navarra")!==-1;}
function esUPNA(b){return b.nombre.indexOf("UPNA")!==-1;}
// Zona del usuario: a menos de 50 km de su ubicación; sin ubicación, de su biblioteca habitual;
// sin ninguna de las dos, Navarra. Evita recomendar Gran Canaria a alguien de Pamplona.
function enMiZona(i){
  var b=BIBLIOTECAS[i], up=window.__userPos;
  if(up)return distMetros(up.lat,up.lon,b.lat,b.lon)<50000;
  var hi=bibHabitual(); if(hi>=0){var h0=BIBLIOTECAS[hi];return distMetros(h0.lat,h0.lon,b.lat,b.lon)<50000;}
  return i<N_NAVARRA;
}
function recomendarBiblioteca(){
  var up=window.__userPos, hi=bibHabitual(), habitual=hi>=0?BIBLIOTECAS[hi].nombre:null;
  var perfil=DATA&&DATA.perfil, examenes=epocaExamenes();
  var cands=[];
  BIBLIOTECAS.forEach(function(b,i){
    if(!enMiZona(i))return;
    var c=minutosHastaCierre(b); if(c<30)return;
    var o=occSummary(i), dist=up?distMetros(up.lat,up.lon,b.lat,b.lon):null;
    var score=(dist!=null?dist/1000:0);
    if(o&&o.level==="llena")score+=3; else if(o&&o.level==="media")score+=1; else if(o&&o.level==="libre")score-=.5;
    if(b.acceso&&b.acceso.tipo==="restringido"&&!(perfil==="unav"&&esUNAV(b)))score+=2.5;
    if(examenes&&esUPNA(b)&&perfil!=="upna")score+=4;
    if(c<75)score+=1.5;
    if(b.nombre===habitual)score-=1;
    if(dist==null)score-=Math.min(c,600)/300; // sin ubicación: mejor la que cierra más tarde
    cands.push({i:i,b:b,score:score,dist:dist,occ:o,cierre:c,habitual:b.nombre===habitual});
  });
  cands.sort(function(a,b){return a.score-b.score;});
  return cands;
}
function cortoNombre(n){
  n=n.replace(/^Biblioteca Pública (de la |del |de )?/,"");
  if(n.indexOf("Biblioteca ")===0&&n!=="Biblioteca de Navarra"&&n!=="Biblioteca Nacional de España"){
    n=n.slice(11).replace(/^(de la |del |de |d'|da |do )/i,"");
    n=n.charAt(0).toUpperCase()+n.slice(1);
  }
  return n;
}
function renderNowCard(){
  var el=$("nowCard"); if(!el)return;
  // Con la lista abierta, o con una sesión en marcha (el minicronómetro ocupa ese hueco y ya dice dónde
  // estudias), la recomendación no se muestra.
  if(!$("libPanel").classList.contains("hidden")||studyTimer.running){el.classList.add("hidden");return;}
  el.classList.remove("hidden");
  var cands, html, up=window.__userPos;
  // Sin ubicación ni biblioteca habitual no sabemos tu ciudad: en vez de recomendar de una zona cualquiera, se pide.
  if(!up&&bibHabitual()<0){
    el.innerHTML='<div class="nc-kicker">Ahora mismo</div><div class="nc-title">¿Qué biblioteca está abierta cerca de ti?</div>'+
      '<div class="nc-why">Más de 2.600 bibliotecas de toda España. Activa tu ubicación y te digo cuál te conviene.</div>'+
      '<div class="nc-actions"><button class="btn sm" onclick="locateMe()">📍 Usar mi ubicación</button><button class="btn sm ghost" onclick="abrirLista(false)">Buscar ciudad</button></div>';
    return;
  }
  cands=recomendarBiblioteca();
  // Lejos de Navarra (sin horarios verificados cerca): recomendar la más cercana, avisando del horario.
  // Solo si en tu zona no hay bibliotecas con horario conocido (fuera de las zonas con datos):
  var hayHorarioEnZona=BIBLIOTECAS.some(function(b,i){return !b.sinHorario&&enMiZona(i);});
  if(up&&!hayHorarioEnZona){
    var cerca=-1,cd=1e12;
    BIBLIOTECAS.forEach(function(b,i){if(!b.sinHorario)return;var d=distMetros(up.lat,up.lon,b.lat,b.lon);if(d<cd){cd=d;cerca=i;}});
    if(cerca>=0&&cd<50000){
      var bc=BIBLIOTECAS[cerca];
      el.innerHTML='<div class="nc-kicker">La más cercana</div><div class="nc-title" onclick="window.__selBib('+cerca+')">'+escapeHTML(cortoNombre(bc.nombre))+'</div>'+
        '<div class="nc-why">📍 '+fmtDist(cd)+' · horario sin confirmar'+(bc.web?', míralo en su web':'')+'</div>'+
        '<div class="nc-actions"><button class="btn sm" onclick="startStudyAt('+cerca+')">▶ Estudiar aquí</button><button class="btn sm ghost" onclick="window.__selBib('+cerca+')">Ver</button><button class="btn sm ghost" onclick="abrirLista(false)">Otras</button></div>';
      return;
    }
  }
  if(!cands.length){
    // abiertas pero cerrando en menos de 30 min: avisar, no decir "todas cerradas"
    var pronto=[];BIBLIOTECAS.forEach(function(b,i){if(!enMiZona(i))return;var c=minutosHastaCierre(b);if(c>0)pronto.push({i:i,c:c});});
    if(pronto.length){
      pronto.sort(function(a,b){return b.c-a.c;});var u=BIBLIOTECAS[pronto[0].i];
      el.innerHTML='<div class="nc-kicker">Ahora mismo</div><div class="nc-title">En tu zona todas cierran en menos de 30 min</div>'+
        '<div class="nc-why">La que más tarde cierra: <b>'+escapeHTML(cortoNombre(u.nombre))+'</b> · '+escapeHTML(estadoTexto(u).txt.replace("Abierta · ",""))+'</div>'+
        '<div class="nc-actions"><button class="btn sm ghost" onclick="window.__selBib('+pronto[0].i+')">Ver en el mapa</button><button class="btn sm ghost" onclick="abrirLista(false)">Ver todas</button></div>';
      return;
    }
    var prox=null;BIBLIOTECAS.forEach(function(b,i){if(!enMiZona(i))return;var p=proximaApertura(b);if(p&&(!prox||p.dias*1440+p.min<prox.p.dias*1440+prox.p.min))prox={i:i,p:p};});
    html='<div class="nc-kicker">Ahora mismo</div><div class="nc-title">Todas las bibliotecas de tu zona están cerradas</div>';
    if(prox){var t=estadoTexto(BIBLIOTECAS[prox.i]);html+='<div class="nc-why">La primera en abrir: <b>'+escapeHTML(cortoNombre(BIBLIOTECAS[prox.i].nombre))+'</b> · '+escapeHTML(t.txt.replace("Cerrada · ",""))+'</div>'+
      (prox.p.enMin<=24*60?cuentaAtrasHTML(prox.p.enMin,"Abre en"):'')+
      '<div class="nc-actions"><button class="btn sm ghost" onclick="window.__selBib('+prox.i+')">Ver en el mapa</button><button class="btn sm ghost" onclick="abrirLista(false)">Ver todas</button></div>';}
    el.innerHTML=html;return;
  }
  var r=cands[0], t=estadoTexto(r.b), why=[];
  if(r.dist!=null)why.push("📍 "+fmtDist(r.dist));
  why.push(t.txt.replace("Abierta · ",""));
  why.push(r.occ?(r.occ.info.emoji+" "+r.occ.info.label.toLowerCase()):"⚪ sin datos de afluencia");
  if(r.habitual)why.push("⭐ tu habitual");
  html='<div class="nc-kicker">Te recomiendo ahora'+(epocaExamenes()?' · <span class="nc-exam">época de exámenes</span>':'')+'</div>'+
    '<div class="nc-title" onclick="window.__selBib('+r.i+')">'+escapeHTML(cortoNombre(r.b.nombre))+'</div>'+
    '<div class="nc-why">'+why.map(escapeHTML).join(" · ")+'</div>'+
    (!es24h(r.b)&&minutosHastaCierre(r.b)>0?cuentaAtrasHTML(minutosHastaCierre(r.b),"Cierra en"):'')+
    '<div class="nc-actions"><button class="btn sm" onclick="startStudyAt('+r.i+')">▶ Estudiar aquí</button>'+
    '<button class="btn sm ghost" onclick="window.__selBib('+r.i+')">Ver</button>'+
    '<button class="btn sm ghost" onclick="abrirLista()">'+(cands.length>1?"Otras "+(cands.length-1):"Ver todas")+'</button></div>';
  if(!window.__userPos)html+='<button class="linkbtn nc-loc" onclick="locateMe()">📍 Usa tu ubicación para recomendarte la más cercana</button>';
  el.innerHTML=html;
}
function abrirLista(soloAbiertas){
  // "Otras" abre la lista ya filtrada; con todo cerrado (soloAbiertas=false) se ven todas
  LIST_FILTERS.abiertas=soloAbiertas!==false;
  if(LIST_FILTERS.abiertas)LIST_FILTERS.pronto=false;
  if(window.__userPos)LIST_FILTERS.cerca=true;
  saveJSON("bpna_list_filters",LIST_FILTERS);
  $("libPanel").classList.remove("hidden");$("libPanel").classList.remove("collapsed");
  buildList();
}
function cerrarLista(){$("libPanel").classList.add("hidden");renderNowCard();}

/* ===================== AVISOS ===================== */
function calcularAvisos(){
  if(!DATA)return [];
  var avisos=[], hoy=new Date(); hoy.setHours(0,0,0,0);
  // exámenes y tareas próximos (<=5 días)
  for(var key in DATA.events){
    var d=new Date(key+"T00:00:00"); var dias=Math.round((d-hoy)/86400000);
    if(dias>=0&&dias<=5){
      DATA.events[key].forEach(function(ev){
        var esAcad=!!ev.fromEvent;
        avisos.push({type:esAcad?"close":ev.type,
          icon:esAcad?"🎓":(ev.type==="examen"?"📕":ev.type==="tarea"?"📘":"📌"),
          title:(esAcad?"Evento: ":"")+ev.title, sub: dias===0?"Es hoy":(dias===1?"Mañana":"En "+dias+" días"), dias:dias});
      });
    }
  }
  // préstamos próximos a vencer (<=3 días) o vencidos
  DATA.loans.forEach(function(l){
    if(l.returned)return;
    var due=new Date(l.due+"T00:00:00"); var dias=Math.round((due-hoy)/86400000);
    if(dias<=3){
      var bib=BIBLIOTECAS.filter(function(b){return b.nombre===l.bib;})[0];
      var abierta=bib?estadoBib(bib):false;
      avisos.push({type:"loan",icon:"📚",title:"Devolver: "+l.title,
        sub:(dias<0?"Vencido hace "+(-dias)+" d":(dias===0?"Vence hoy":"Vence en "+dias+" d"))+" · "+l.bib.replace("Biblioteca ","")+(bib&&bib.sinHorario?" (horario sin confirmar)":(abierta?" (abierta)":" (cerrada)")),dias:dias});
    }
  });
  // solicitudes de amistad pendientes
  if(SOCIAL.requests&&SOCIAL.requests.length){
    SOCIAL.requests.forEach(function(r){
      avisos.push({type:"friend",icon:"👥",title:"Solicitud de amistad de "+(r.profile.name||"alguien"),sub:"Pendiente de aceptar",dias:-1});
    });
  }
  // bibliotecas que cierran pronto (solo si tienes sesión activa)
  if(studyTimer.running&&studyTimer.bibIndex>=0&&!es24h(BIBLIOTECAS[studyTimer.bibIndex])){
    var cierre=minutosHastaCierre(BIBLIOTECAS[studyTimer.bibIndex]);
    if(cierre>0&&cierre<=30){
      avisos.push({type:"close",icon:"⏰",title:BIBLIOTECAS[studyTimer.bibIndex].nombre.replace("Biblioteca ","")+" cierra pronto",sub:"En "+cierre+" min",dias:0});
    }
  }
  // tus favoritas que abren o cierran en <=30 min (aunque no tengas sesión activa)
  if(Array.isArray(DATA.fav)&&DATA.fav.length){
    var FAV_AVISO_MIN=30;
    BIBLIOTECAS.forEach(function(b,i){
      if(b.sinHorario||DATA.fav.indexOf(b.nombre)===-1)return;
      var nom=cortoNombre(b.nombre), cierreF=minutosHastaCierre(b);
      if(cierreF>0){
        // el aviso de la sesión activa ya cubre el cierre de esa biblioteca
        if(cierreF<=FAV_AVISO_MIN&&!es24h(b)&&!(studyTimer.running&&studyTimer.bibIndex===i))
          avisos.push({type:"close",icon:"⭐",title:"Tu favorita "+nom+" cierra en "+cierreF+" min",sub:"Cierra a las "+fmtHoras(horaCierre(b)%1440),dias:0});
      }else{
        var p=proximaApertura(b);
        if(p&&p.enMin<=FAV_AVISO_MIN)
          avisos.push({type:"close",icon:"⭐",title:"Tu favorita "+nom+" abre en "+p.enMin+" min",sub:"Abre a las "+fmtHoras(p.min),dias:0});
      }
    });
  }
  avisos.sort(function(a,b){return a.dias-b.dias;});
  return avisos;
}
function actualizarBadge(){
  var n=calcularAvisos().length;
  var badge=$("bellBadge");
  if(n>0){badge.textContent=n;badge.classList.remove("hidden");}else{badge.classList.add("hidden");}
}
function abrirAvisos(){
  var avisos=calcularAvisos();
  var inner="";
  if(!avisos.length){inner='<div class="empty-note">No tienes avisos pendientes. ¡Todo al día!</div>';}
  else{avisos.forEach(function(a,idx){
    inner+='<div class="notif-item '+a.type+'"'+(a.type==="friend"?' style="cursor:pointer" data-friend="1"':'')+'><div class="nicon">'+a.icon+'</div><div class="ntxt"><b>'+escapeHTML(a.title)+'</b><small>'+escapeHTML(a.sub)+'</small></div></div>';
  });}
  var permTxt = ("Notification" in window && Notification.permission==="granted")?
    '<div style="font-size:var(--fs-xs);color:var(--suave);text-align:center;margin-top:6px">Las notificaciones del navegador están activas ✓</div>':
    '<button class="btn sm ghost" id="avisoPerm" style="margin-top:10px">Activar notificaciones del navegador</button>';
  openModal('<h3>Avisos</h3><div class="sub">Exámenes, tareas, préstamos, solicitudes de amistad y cierres próximos</div>'+inner+permTxt,
    function(){
      var p=$("avisoPerm"); if(p)p.addEventListener("click",pedirPermisoNotif);
      document.querySelectorAll('[data-friend="1"]').forEach(function(el){
        el.addEventListener("click",function(){closeModal();goView("profile");});
      });
    });
}
function pedirPermisoNotif(){
  if(!("Notification" in window)){showToast("Tu navegador no admite notificaciones");return;}
  Notification.requestPermission().then(function(perm){
    if(perm==="granted"){showToast("Notificaciones activadas ✓");lanzarNotifsDelDia();}
    else{showToast("Permiso no concedido");}
  });
}
function lanzarNotifsDelDia(){
  if(!("Notification" in window)||Notification.permission!=="granted")return;
  var hoyKey=ymd();
  if(Brain.getNotifDay(CURRENT)===hoyKey)return; // una vez al día
  var avisos=calcularAvisos().filter(function(a){return a.dias<=1;});
  if(avisos.length){
    try{ new Notification("Bibliomapa",{body:avisos.length===1?avisos[0].title+" · "+avisos[0].sub:"Tienes "+avisos.length+" avisos para hoy y mañana"}); }catch(e){}
  }
  Brain.setNotifDay(CURRENT,hoyKey);
}

/* ===================== COMPARTIR ESTADO ===================== */
function compartirEstado(){
  if(!studyTimer.running||studyTimer.bibIndex<0){showToast("Empieza una sesión en una biblioteca para compartir dónde estudias");return;}
  var b=BIBLIOTECAS[studyTimer.bibIndex];
  var users=Brain.getUsers(); var nombre=(users[CURRENT]&&users[CURRENT].name)||"Alguien";
  var cierre=minutosHastaCierre(b);
  var hasta=""; if(cierre>0){var fin=new Date(Date.now()+cierre*60000);hasta=String(fin.getHours()).padStart(2,"0")+":"+String(fin.getMinutes()).padStart(2,"0");}
  var payload={n:nombre,b:studyTimer.bibIndex,t:Date.now(),h:hasta};
  var code=btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  var base=location.href.split("#")[0];
  var link=base+"#study="+code;
  var msg=nombre+" está estudiando en "+b.nombre+(hasta?" (hasta ~"+hasta+")":"")+". Ábrelo aquí: "+link;
  openModal('<h3>Compartir dónde estudias</h3><div class="sub">Manda este enlace a tu grupo. Quien lo abra verá tu sitio en el mapa. Es un dato real que envías tú, no rastreo automático.</div>'+
    '<div class="sharelink"><input type="text" id="shareInput" readonly value="'+escapeHTML(link)+'"><button class="btn sm" id="shareCopy">Copiar</button></div>'+
    '<button class="btn" id="shareWa" style="margin-top:12px;background:linear-gradient(135deg,#25d366,#1da851)">Compartir por WhatsApp</button>',
    function(){
      $("shareCopy").addEventListener("click",function(){
        var inp=$("shareInput");inp.select();
        try{navigator.clipboard.writeText(inp.value);showToast("Enlace copiado");}catch(e){document.execCommand("copy");showToast("Enlace copiado");}
      });
      $("shareWa").addEventListener("click",function(){window.open("https://wa.me/?text="+encodeURIComponent(msg),"_blank");});
    });
}
function comprobarEnlaceCompartido(){
  var hash=location.hash;
  // Enlace a una biblioteca (páginas de bibliomapa.es/bibliotecas/… y compartir): #bib=<índice>-<nombre>
  if(hash.indexOf("#bib=")===0){
    var bi=parseInt(hash.slice(5),10);
    if(BIBLIOTECAS[bi]){(function intenta(n){if(window.__map&&window.__selBib){goView("map");window.__selBib(bi);}else if(n<40)setTimeout(function(){intenta(n+1);},250);})(0);}
    return;
  }
  if(hash.indexOf("#study=")!==0)return;
  try{
    var code=hash.slice(7);
    var payload=JSON.parse(decodeURIComponent(escape(atob(code))));
    var b=BIBLIOTECAS[payload.b]; if(!b)return;
    var mins=Math.round((Date.now()-Number(payload.t))/60000); if(!isFinite(mins))return;
    var hace = mins<1?"hace un momento":(mins<60?"hace "+mins+" min":"hace "+Math.floor(mins/60)+" h");
    var banner=$("friendBanner");
    banner.innerHTML='<div class="fav">'+escapeHTML((payload.n||"?").charAt(0).toUpperCase())+'</div>'+
      '<div class="ft"><b>'+escapeHTML(payload.n||"Alguien")+' está estudiando</b><small>en '+escapeHTML(b.nombre.replace("Biblioteca ",""))+' · '+hace+(/^\d{1,2}:\d{2}$/.test(String(payload.h||""))?" · hasta ~"+payload.h:"")+'</small></div>'+
      '<button class="nowclose" id="friendClose" style="margin-left:auto">×</button>';
    banner.classList.remove("hidden");
    setTimeout(function(){
      var fc=$("friendClose"); if(fc)fc.addEventListener("click",function(){banner.classList.add("hidden");});
      if(window.__selBib)window.__selBib(payload.b);
    },300);
    // si es muy antiguo (>3h) avisar de que el dato puede no valer
    if(mins>180){ banner.querySelector(".ft small").innerHTML+=' <span class="badge-warn">(dato antiguo)</span>'; }
  }catch(e){}
}

/* ===================== SUGERENCIA POR HISTORIAL ===================== */
function renderSugerencia(){
  var card=$("suggestCard"); if(!card||!DATA)return;
  var ses=DATA.sessions;
  if(ses.length<3){
    card.innerHTML='<div class="empty-note">Estudia algunas sesiones y aquí verás recomendaciones basadas en tu propio historial.</div>';
    return;
  }
  // franja horaria más frecuente
  var franjas={manana:0,tarde:0,noche:0};
  var porBib={};
  ses.forEach(function(s){
    var hh=new Date(s.ts).getHours();
    if(hh<14)franjas.manana+=s.min; else if(hh<20)franjas.tarde+=s.min; else franjas.noche+=s.min;
    if(s.bib!==NO_BIB)porBib[s.bib]=(porBib[s.bib]||0)+s.min;
  });
  var mejorFranja=Object.keys(franjas).sort(function(a,b){return franjas[b]-franjas[a];})[0];
  var franjaTxt={manana:"por la mañana",tarde:"por la tarde",noche:"por la noche"}[mejorFranja];
  var mejorBib=Object.keys(porBib).sort(function(a,b){return porBib[b]-porBib[a];})[0];
  // productividad media por biblioteca (solo sesiones valoradas)
  var prodBib={};
  ses.forEach(function(s){ if(s.prod&&s.bib!==NO_BIB){ if(!prodBib[s.bib])prodBib[s.bib]={sum:0,n:0}; prodBib[s.bib].sum+=s.prod; prodBib[s.bib].n++; } });
  var mejorProd=null,mejorMedia=0;
  for(var k in prodBib){ var media=prodBib[k].sum/prodBib[k].n; if(media>mejorMedia){mejorMedia=media;mejorProd=k;} }
  var html='<div style="font-size:var(--fs-base);line-height:1.6">';
  html+='Sueles rendir más cuando estudias <b>'+franjaTxt+'</b>'+(mejorBib?', y donde más horas acumulas es en <b>'+escapeHTML(mejorBib.replace("Biblioteca ",""))+'</b>':'')+'.';
  if(mejorProd){ html+='<br>Según tus propias valoraciones, donde mejor te concentras es en <b>'+escapeHTML(mejorProd.replace("Biblioteca ",""))+'</b> ('+mejorMedia.toFixed(1)+'★ de media).'; }
  html+='</div><div style="font-size:var(--fs-xs);color:var(--suave);margin-top:10px;font-style:italic">Basado solo en tus '+ses.length+' sesiones registradas.</div>';
  card.innerHTML=html;
}


window.addEventListener("DOMContentLoaded",function(){
  setAuthMode("login");
  $("authPrivacyNote").textContent=socialKeysOk()
    ?"Tu cuenta se guarda de forma segura en la nube (Supabase), para que puedas entrar desde cualquier dispositivo."
    :"Tu cuenta y tus datos se guardan en este dispositivo. No se envía nada a internet.";
  $("tabLogin").addEventListener("click",function(){setAuthMode("login");});
  $("tabReg").addEventListener("click",function(){setAuthMode("reg");});
  $("authSkip").addEventListener("click",function(){$("authView").classList.add("hidden");if(!CURRENT)entrarComoInvitado();});
  $("authBtn").addEventListener("click",doAuth);
  $("inPass").addEventListener("keydown",function(e){if(e.key==="Enter")doAuth();});

  document.querySelectorAll(".dock button").forEach(function(b){b.addEventListener("click",function(){goView(b.dataset.view);});});
  $("btnStart").addEventListener("click",startStudyCurrent);
  initSubjectUI();
  $("chkExtras").addEventListener("change",function(){DATA.extras=this.checked;saveUserData();applyExtras();});
  document.querySelectorAll("#lbPeriodSeg button").forEach(function(b){b.addEventListener("click",function(){
    lbPeriod=b.dataset.p;
    document.querySelectorAll("#lbPeriodSeg button").forEach(function(x){x.classList.toggle("on",x===b);});
    computeLeaderboard();renderLeaderboard();
  });});
  $("btnStop").addEventListener("click",function(){stopStudy(false);});
  $("btnGoal").addEventListener("click",openGoalModal);
  $("miniStop").addEventListener("click",function(){stopStudy(false);});
  document.querySelectorAll("#studyTab button").forEach(function(b){b.addEventListener("click",function(){
    document.querySelectorAll("#studyTab button").forEach(function(x){x.classList.remove("on");});
    b.classList.add("on");
    var t=b.dataset.t;
    $("studyOfferPanel").classList.toggle("hidden",t!=="ofrecer");
    $("pomodoroPanel").classList.toggle("hidden",t!=="pomo");
    $("studyCronoPanel").classList.toggle("hidden",t==="ofrecer"||t==="pomo");
    $("studyStats").classList.toggle("hidden",t==="ofrecer");
    if(t==="ofrecer")$("offerText").value=DATA.offeringText||"";
    if(t==="pomo")renderPomodoro();
  });});
  $("btnSaveOffer").addEventListener("click",function(){
    DATA.offeringText=$("offerText").value.trim();saveUserData();renderStudy();showToast("Guardado");
  });
  $("btnPomoToggle").addEventListener("click",pomoToggle);
  $("btnPomoReset").addEventListener("click",pomoReset);
  initCommentEvents();
  document.querySelectorAll("#feedTabSeg button").forEach(function(b){b.addEventListener("click",function(){
    document.querySelectorAll("#feedTabSeg button").forEach(function(x){x.classList.remove("on");});
    b.classList.add("on");
    feedTab=b.dataset.t;
    if(feedTab==="amigos"){socialLoadFriendSessions().then(socialLoadKudos).then(socialLoadFriendComments).then(renderSessionFeed);}
    else renderSessionFeed();
  });});
  $("calPrev").addEventListener("click",function(){calRef.setMonth(calRef.getMonth()-1);renderCal();});
  $("calNext").addEventListener("click",function(){calRef.setMonth(calRef.getMonth()+1);renderCal();});
  $("calToday").addEventListener("click",function(){calRef=new Date();renderCal();});
  $("btnAddLoan").addEventListener("click",openLoanModal);
  $("btnAddEvent").addEventListener("click",openEventModal);
  $("btnPostBlog").addEventListener("click",postBlog);
  $("btnLogout").addEventListener("click",logout);
  $("btnDeleteAccount").addEventListener("click",deleteAccount);
  $("btnRename").addEventListener("click",cambiarNombre);
  (function(){var sel=$("selTheme");try{sel.value=localStorage.getItem("bpna_theme")||"auto";}catch(e){}
    sel.addEventListener("change",function(){var v=sel.value;try{localStorage.setItem("bpna_theme",v);}catch(e){}
      aplicarTema();});})();
  $("btnFeedback").addEventListener("click",function(){enviarSugerencia();});
  $("btnBlocked").addEventListener("click",abrirBloqueados);
  $("btnShareWeek").addEventListener("click",compartirSemana);

  // nuevas funciones
  $("panelClose").addEventListener("click",function(e){e.stopPropagation();cerrarLista();});
  $("btnLocate").addEventListener("click",locateMe);
  $("bellBtn").addEventListener("click",abrirAvisos);
  $("miniShare").addEventListener("click",compartirEstado);
  $("btnNotifPerm").addEventListener("click",pedirPermisoNotif);
  $("chkGeo").addEventListener("change",function(){DATA.geoCheck=this.checked;saveUserData();showToast(this.checked?"Check-in con ubicación activado":"Check-in desactivado");});
  $("btnAddFriend").addEventListener("click",socialAddFriendFromInput);
  $("btnCopyFriendCode").addEventListener("click",function(){var c=$("friendCode").textContent;if(c&&c!=="—"&&c!=="SIN CONFIG"){navigator.clipboard.writeText(c);showToast("Código copiado");}});
  $("chkSharePresence").addEventListener("change",function(){
    if(this.checked&&!confirm("Tus amigos verán en qué biblioteca estás, nunca tu ubicación exacta. Se apaga sola a las 4 horas o cuando cierre la biblioteca.\n\nTambién verán tus sesiones terminadas. ¿Activar?")){this.checked=false;return;}
    DATA.sharePresence=this.checked;saveUserData();socialHeartbeat();
    showToast(this.checked?(DATA.invisible?"Activado, pero tienes el modo invisible puesto":"Tus amigos verán la biblioteca donde estudias"):"Has dejado de compartir tu biblioteca");});
  $("chkInvisible").addEventListener("change",function(){
    DATA.invisible=this.checked;saveUserData();
    // corta al momento: no espera al siguiente latido de 45 s
    if(this.checked)socialClearPresence(); else socialHeartbeat();
    showToast(this.checked?"Modo invisible: nadie ve dónde estudias":"Modo invisible desactivado");});
  window.addEventListener("hashchange",comprobarEnlaceCompartido);

  // sesión recordada
  (async function(){
    if(haySesionNube())await cargarSupabase();
    var sb=socialClient();
    if(sb){
      try{
        var res=await sb.auth.getSession();
        if(res.data.session&&res.data.session.user){
          var u=res.data.session.user;CURRENT=u.email;
          var users=Brain.getUsers();if(!users[CURRENT])users[CURRENT]={name:(u.user_metadata&&u.user_metadata.name)||CURRENT.split("@")[0],pass:""};Brain.saveUsers(users);
          await socialEnsureProfile(u,users[CURRENT].name,CURRENT);
          await enterApp();return;
        }
      }catch(e){console.warn(e);}
    }
    var sess=Brain.getSession();
    if(sess&&Brain.getUsers()[sess]){CURRENT=sess;enterApp();}
    else entrarComoInvitado();
  })();
});

// Registro del service worker: hace que la app se pueda instalar y funcione algo offline.
if("serviceWorker" in navigator){
  window.addEventListener("load",function(){
    navigator.serviceWorker.register("sw.js").catch(function(e){console.warn("No se pudo registrar el service worker:",e);});
  });
}


/* =====================================================================================
   DOPAMINA SANA (2026-10-26): semillas y tienda del bosque (Forest), misiones diarias con cofre
   (Duolingo), racha con llama (Duolingo/Snapchat), hitos durante la sesión, historias de amigos
   (Instagram), doble toque para dar kudos (Instagram/TikTok) y tarjetas para stories (Strava).
   Todo se calcula en el dispositivo con DATA; las animaciones respetan «reducir movimiento».
   ===================================================================================== */

/* ----- Semillas 🌰: 1 por cada 5 min de un árbol que no se marchitó + premios. Lo gastado se guarda. ----- */
function semillasGanadasSesiones(){var t=0;((DATA&&DATA.sessions)||[]).forEach(function(s){if(s.focus!=="withered")t+=Math.floor((s.min||0)/5);});return t;}
function semillas(){if(!DATA)return 0;return Math.max(0,semillasGanadasSesiones()+(DATA.semillasPremio||0)-(DATA.semillasGastadas||0));}
function darSemillas(n,motivo,el){
  DATA.semillasPremio=(DATA.semillasPremio||0)+n;saveUserData();
  showToast("🌰 +"+n+" semillas"+(motivo?" · "+motivo:""));
  celebrar(el||$("seedsPill")||null,["🌰","✨"],8);renderSemillas();
}
function renderSemillas(){
  var n=semillas();
  document.querySelectorAll(".seeds-n").forEach(function(x){if(x.textContent!==String(n)){x.textContent=n;x.classList.remove("pop");void x.offsetWidth;x.classList.add("pop");}});
}
function especieComprada(id){return especieDe(id).precio===0||((DATA.especiesCompradas||[]).indexOf(id)!==-1);}
function abrirTienda(){
  var n=semillas(), actual=DATA.especie||"roble";
  openModal('<h3>🌱 Especies para tu bosque</h3><div class="sub">Ganas 🌰 1 semilla por cada 5 min de árbol sano y más con las misiones. Tienes <b class="seeds-n">'+n+'</b> 🌰</div>'+
    '<div class="shop">'+ESPECIES.filter(function(e){return enTemporada(e)||actual===e.id;}).sort(function(x,y){return (y.desde?1:0)-(x.desde?1:0);}).map(function(e){
      var mia=especieComprada(e.id), usando=actual===e.id, puede=n>=e.precio;
      var btn=usando?'<button class="btn sm" disabled>✓ Plantando</button>'
        :mia?'<button class="btn sm ghost" onclick="usarEspecie(\''+e.id+'\')">Usar</button>'
        :'<button class="btn sm'+(puede?'':' ghost')+'" '+(puede?'':'disabled ')+'onclick="comprarEspecie(\''+e.id+'\',this)">'+(puede?'Comprar · 🌰 '+e.precio:'🔒 🌰 '+e.precio)+'</button>';
      var temp=e.desde?'<span class="shop-temp">⏰ Solo hasta el '+(+e.hasta.slice(3))+' de '+MESES[+e.hasta.slice(0,2)-1]+'</span>':'';
      return '<div class="shop-item'+(usando?' on':'')+(mia?'':' locked')+(e.desde?' temporada':'')+'">'+temp+'<div class="shop-tree">'+arbolSVG(200,false,e.id,96,e.id)+'</div><b>'+e.icon+' '+escapeHTML(e.nombre)+'</b>'+btn+'</div>';
    }).join("")+'</div>');
}
function comprarEspecie(id,btn){
  var e=especieDe(id); if(especieComprada(id)){usarEspecie(id);return;}
  if(semillas()<e.precio){showToast("Te faltan "+(e.precio-semillas())+" semillas 🌰");return;}
  DATA.semillasGastadas=(DATA.semillasGastadas||0)+e.precio;
  DATA.especiesCompradas=(DATA.especiesCompradas||[]).concat([id]);DATA.especie=id;saveUserData();
  celebrar(btn,[e.icon,"✨","🌰"],14);confeti(70);showToast("🎉 ¡"+e.nombre+" desbloqueado! Tus próximos árboles serán "+e.icon);
  setTimeout(abrirTienda,500);renderForest();renderSemillas();
}
function usarEspecie(id){DATA.especie=id;saveUserData();showToast(especieDe(id).icon+" Ahora plantas: "+especieDe(id).nombre);abrirTienda();renderFocusPlant();}

/* ----- Misiones diarias (3 al día, una siempre fácil) con cofre al completarlas ----- */
var MISIONES_POOL=[
  {id:"m25",icon:"⏱️",txt:"Estudia 25 min hoy",meta:25,min:true,val:function(h){return h.min;}},
  {id:"arboles2",icon:"🌳",txt:"Planta 2 árboles sanos",meta:2,val:function(h){return h.vivos;}},
  {id:"pomo",icon:"🍅",txt:"Completa un Pomodoro",meta:1,val:function(h){return h.pomos;}},
  {id:"biblio",icon:"📚",txt:"Estudia en una biblioteca",meta:1,val:function(h){return h.enBib;}},
  {id:"madruga",icon:"🌅",txt:"Empieza antes de las 10:00",meta:1,val:function(h){return h.temprano;}},
  {id:"largo",icon:"💪",txt:"Una sesión de 45 min seguidos",meta:45,min:true,val:function(h){return h.maxSes;}},
  {id:"m90",icon:"🔥",txt:"Estudia 1 h 30 min hoy",meta:90,min:true,val:function(h){return h.min;}},
  {id:"social",icon:"👏",txt:"Da kudos o reza por un amigo",meta:1,cuenta:true,val:function(h){return h.social;}},
  {id:"agenda",icon:"📅",txt:"Apunta un examen o tarea",meta:1,val:function(h){return h.agenda;}}
];
function registrarAccion(tipo){
  if(!DATA)return; var hoy=ymd();
  if(!DATA.acciones||DATA.acciones.fecha!==hoy)DATA.acciones={fecha:hoy};
  DATA.acciones[tipo]=(DATA.acciones[tipo]||0)+1;saveUserData();comprobarMisiones();
}
function statsHoy(){
  var hoy=ymd(),h={min:0,vivos:0,pomos:0,enBib:0,temprano:0,maxSes:0,social:0,agenda:0};
  DATA.sessions.forEach(function(s){if(s.date!==hoy)return;h.min+=s.min;if(s.focus!=="withered")h.vivos++;if(s.note==="Pomodoro")h.pomos++;
    if(s.bib&&s.bib!==NO_BIB)h.enBib++;if(s.ts&&new Date(s.ts).getHours()<10)h.temprano++;h.maxSes=Math.max(h.maxSes,s.min);});
  if(studyTimer.running){var m=elapsedMin();h.min+=m;h.maxSes=Math.max(h.maxSes,m);if(new Date(studyTimer.start).getHours()<10&&ymd(new Date(studyTimer.start))===hoy)h.temprano=Math.max(h.temprano,1);
    if(studyTimer.bibIndex>=0)h.enBib=Math.max(h.enBib,1);}
  var a=DATA.acciones&&DATA.acciones.fecha===hoy?DATA.acciones:{};h.social=a.social||0;h.agenda=a.agenda||0;
  return h;
}
function misionesDeHoy(){
  var hoy=ymd();
  if(DATA.misiones&&DATA.misiones.fecha===hoy)return DATA.misiones;
  var hora=new Date().getHours();
  // sin misiones imposibles: madrugar solo si aún es temprano; de noche, misiones cortas
  var pool=MISIONES_POOL.filter(function(m){return m.id!=="m25"&&(!m.cuenta||SOCIAL.user)&&!(m.id==="madruga"&&hora>=9)&&!(hora>=21&&(m.id==="m90"||m.id==="largo"));});
  var semilla=hashStr(hoy+(CURRENT||"")), ids=["m25"];
  while(ids.length<3&&pool.length){var k=semilla%pool.length;ids.push(pool[k].id);pool.splice(k,1);semilla=Math.floor(semilla/7)+13;}
  DATA.misiones={fecha:hoy,ids:ids,hechas:{},cofre:false};saveUserData();
  return DATA.misiones;
}
function misionDef(id){return MISIONES_POOL.filter(function(m){return m.id===id;})[0];}
function comprobarMisiones(){
  if(!DATA)return; var M=misionesDeHoy(), h=statsHoy(), nuevas=[];
  M.ids.forEach(function(id){var d=misionDef(id);if(d&&!M.hechas[id]&&d.val(h)>=d.meta){M.hechas[id]=new Date().toISOString();nuevas.push(d);}});
  if(nuevas.length){
    DATA.semillasPremio=(DATA.semillasPremio||0)+10*nuevas.length;saveUserData();
    nuevas.forEach(function(d,k){setTimeout(function(){showToast("✅ Misión cumplida: "+d.txt+" · +10 🌰");celebrar($("missionsCard"),[d.icon,"✨","🌰"],10);},k*1400);});
    renderSemillas();
  }
  renderMisiones();
}
function renderMisiones(){
  var el=$("missionsCard"); if(!el||!DATA)return;
  var M=misionesDeHoy(), h=statsHoy(), hechas=M.ids.filter(function(id){return M.hechas[id];}).length;
  var finDia=new Date();finDia.setHours(24,0,0,0);var qm=Math.max(0,Math.round((finDia-Date.now())/60000)), quedan=qm>=60?Math.floor(qm/60)+" h":qm+" min";
  el.innerHTML='<div class="mis-head"><div class="section-title" style="margin:0">🎯 Misiones de hoy</div><span class="mis-time">⏳ '+quedan+'</span></div>'+
    M.ids.map(function(id){
      var d=misionDef(id); if(!d)return "";
      var v=Math.min(d.meta,d.val(h)), pct=Math.round(v/d.meta*100), ok=!!M.hechas[id];
      return '<div class="mis'+(ok?' ok':'')+'"><div class="mis-ic">'+(ok?'✅':d.icon)+'</div><div class="mis-main"><div class="mis-txt">'+escapeHTML(d.txt)+'</div>'+
        '<div class="mis-bar"><i style="width:'+pct+'%"></i></div></div><div class="mis-val">'+(d.min?hMin(v).replace("0h ",""):v)+'/'+(d.min?hMin(d.meta).replace("0h ",""):d.meta)+'</div></div>';
    }).join("")+
    '<button class="cofre'+(hechas===3&&!M.cofre?' listo':'')+(M.cofre?' abierto':'')+'" onclick="abrirCofre(this)" '+(hechas===3&&!M.cofre?'':'disabled')+'>'+
      '<span class="cofre-ic">'+(M.cofre?'🎁':'🎁')+'</span><span>'+(M.cofre?'Cofre de hoy abierto · vuelve mañana':hechas===3?'¡Abre tu cofre!':'Cofre: completa las 3 misiones ('+hechas+'/3)')+'</span></button>';
}
function abrirCofre(btn){
  var M=misionesDeHoy(); if(M.cofre)return;
  if(M.ids.some(function(id){return !M.hechas[id];}))return;
  M.cofre=true;DATA.cofresAbiertos=(DATA.cofresAbiertos||0)+1;var premio=20+(hashStr(ymd()+"cofre")%4)*10; // 20-50 semillas
  var hielo=(DATA.streakFreezes||0)<3&&hashStr(ymd())%3===0;
  DATA.semillasPremio=(DATA.semillasPremio||0)+premio;if(hielo)DATA.streakFreezes=(DATA.streakFreezes||0)+1;saveUserData();
  openModal('<div class="cofre-modal"><div class="cofre-big">🎁</div><h3>¡Misiones completadas!</h3><div class="sub">Has ganado <b>🌰 '+premio+' semillas</b>'+(hielo?' y <b>🧊 un congelador de racha</b>':'')+'.</div>'+
    '<button class="btn" onclick="closeModal();abrirTienda()">Ver especies</button><button class="linkbtn" onclick="closeModal()" style="display:block;margin:12px auto 0">Seguir</button></div>',function(){
    var c=document.querySelector(".cofre-big");setTimeout(function(){if(c){c.textContent="✨";c.classList.add("abre");}confeti(140);celebrar(c,["🌰","✨","💎","⭐"],18);},700);
  });
  renderMisiones();renderSemillas();
}

/* ----- Racha con llama (Duolingo): pastilla arriba, ventana con la semana, «en peligro» por la tarde ----- */
function estudiadoHoy(){var hoy=ymd();return studyTimer.running||DATA.sessions.some(function(s){return s.date===hoy;});}
function renderRacha(){
  var el=$("streakPill"); if(!el||!DATA)return;
  var n=streakDays(), hoy=estudiadoHoy(), peligro=!hoy&&n>0&&new Date().getHours()>=19;
  el.className="streak-pill"+(hoy?" on":"")+(peligro?" peligro":"");
  el.innerHTML='<span class="fl">🔥</span><b>'+n+'</b>';
  el.title=hoy?"Racha de "+n+" días":(peligro?"¡Tu racha está en peligro! Estudia hoy":"Aún no has estudiado hoy");
}
function abrirRacha(){
  var n=streakDays(), mejor=0;try{mejor=computeBestStreak();}catch(e){}
  var dias={};DATA.sessions.forEach(function(s){dias[s.date]=(dias[s.date]||0)+s.min;});(DATA.usedFreezeDates||[]).forEach(function(d){if(!dias[d])dias[d]=-1;});
  // los últimos 7 días acabando hoy (como Duolingo)
  var hoy=new Date(),LET=["D","L","M","X","J","V","S"];
  var sem=[6,5,4,3,2,1,0].map(function(atras){var d=new Date(hoy);d.setDate(hoy.getDate()-atras);var key=ymd(d),v=dias[key],l=atras===0?"Hoy":LET[d.getDay()];
    var cls=v>0?"ok":v===-1?"hielo":(key===ymd()?"hoy":key<ymd()?"falta":"");
    return '<div class="sd '+cls+'"><span>'+(v>0?"🔥":v===-1?"🧊":"")+'</span><small>'+l+'</small></div>';}).join("");
  var hoyOk=estudiadoHoy();
  openModal('<div class="racha-modal"><div class="racha-fuego'+(hoyOk?'':' apagado')+'">🔥</div><div class="racha-n">'+n+'</div><div class="racha-lbl">'+(n===1?"día seguido":"días seguidos")+'</div>'+
    '<div class="semana-racha">'+sem+'</div>'+
    '<div class="sub" style="margin-top:12px">'+(hoyOk?"¡Hoy ya cuenta! Vuelve mañana para mantenerla.":n?"Estudia hoy para no perder tu racha de "+n+" días.":"Estudia hoy y empieza una racha.")+'</div>'+
    '<div class="racha-stats"><div><b>'+mejor+'</b><small>Mejor racha</small></div><div><b>🧊 '+(DATA.streakFreezes||0)+'</b><small>Congeladores</small></div><div><b>🌰 '+semillas()+'</b><small>Semillas</small></div></div>'+
    (hoyOk?'':'<button class="btn" onclick="closeModal();goView(\'study\')">▶ Estudiar ahora</button>')+'</div>');
}
// Primera sesión del día: la llama se enciende (estilo Duolingo)
function celebrarRacha(){
  if(sinMovimiento()){showToast("🔥 ¡Racha de "+streakDays()+" días!");return;}
  var n=streakDays(), o=document.createElement("div");o.className="racha-overlay";
  o.innerHTML='<div class="ro-fuego">🔥</div><div class="ro-n">'+n+'</div><div class="ro-t">'+(n===1?"¡Empieza tu racha!":"¡Racha de "+n+" días!")+'</div>';
  o.addEventListener("click",function(){o.remove();});document.body.appendChild(o);
  setTimeout(function(){o.classList.add("out");setTimeout(function(){o.remove();},500);},2300);
}
function trasGuardarSesion(sesion){
  var hoy=ymd(), deHoy=DATA.sessions.filter(function(s){return s.date===hoy;}).length;
  if(sesion&&sesion.date===hoy&&deHoy===1)setTimeout(celebrarRacha,350);
  comprobarMisiones();renderRacha();renderSemillas();
}

/* ----- Hitos durante la sesión ----- */
var HITOS=[25,50,90,120,180,240];
function comprobarHitos(){
  if(!studyTimer.running)return; var m=elapsedMin();
  studyTimer.hitos=studyTimer.hitos||{start:studyTimer.start};
  if(studyTimer.hitos.start!==studyTimer.start)studyTimer.hitos={start:studyTimer.start};
  HITOS.forEach(function(x){
    if(m>=x&&m<x+2&&!studyTimer.hitos[x]){studyTimer.hitos[x]=1;
      var frases={25:"¡25 min! Calentando motores",50:"¡50 min seguidos! Imparable",90:"¡1 h 30! Modo bestia",120:"¡2 horas! Leyenda de la biblioteca",180:"¡3 horas! Tu árbol florece",240:"¡4 horas! Respeto"};
      showToast("🔥 "+frases[x]+(FOCUS.withered?"":" · tu árbol crece"));celebrar(document.querySelector(".ring-wrap"),["🔥","⚡","✨"],12);
    }else if(m>=x+2)studyTimer.hitos[x]=1; // al restaurar una sesión no se celebran hitos viejos
  });
}

/* ----- Doble toque para dar kudos (Instagram) ----- */
function kudosDoble(ev,localId,ownerId){
  if(ev&&ev.target&&ev.target.closest&&ev.target.closest("button,a,input,textarea"))return;
  var x=ev.clientX,y=ev.clientY;
  if(!sinMovimiento()){var c=document.createElement("span");c.className="corazon";c.textContent="👏";c.style.left=x+"px";c.style.top=y+"px";document.body.appendChild(c);setTimeout(function(){c.remove();},900);}
  if(SOCIAL.kudosByMe[localId])return;
  giveKudos(localId,ownerId);
}

/* ----- Historias (Instagram): quién ha estudiado hoy ----- */
var STORIES={lista:[],idx:0,slide:0,timer:null};
function storiesVistas(){return loadJSON("bpna_stories_vistas",{});}
function storiesAmigos(){
  var ayer=new Date();ayer.setDate(ayer.getDate()-1);var desde=ymd(ayer), grupos={};
  filterBlocked(SOCIAL.friendSessions||[],"owner_id").forEach(function(s){if(s.date<desde)return;(grupos[s.owner_id]=grupos[s.owner_id]||[]).push(s);});
  (SOCIAL.presence||[]).forEach(function(p){if(!grupos[p.user_id])grupos[p.user_id]=[];});
  var vistas=storiesVistas();
  return Object.keys(grupos).map(function(id){
    var ses=grupos[id].slice().sort(function(a,b){return Date.parse(a.created_at||a.date)-Date.parse(b.created_at||b.date);});
    var ultima=ses.length?ses[ses.length-1].local_id:"";var ahora=socialPresenceFor(id);
    return {id:id,nombre:socialNameById(id),ses:ses,ahora:ahora,nueva:!!(ahora||(ultima&&vistas[id]!==ultima)),ultima:ultima};
  }).sort(function(a,b){return (b.ahora?1:0)-(a.ahora?1:0)||(b.nueva?1:0)-(a.nueva?1:0);});
}
function colorDe(id){var cs=["#6c5ce7","#ec4899","#f59e0b","#10b981","#0ea5e9","#a21caf","#ef4444","#14b8a6"];return cs[hashStr(id)%cs.length];}
function renderStories(){
  var el=$("storiesBar"); if(!el||!DATA)return;
  var lista=SOCIAL.user?storiesAmigos():[], hoyMin=statsHoy().min;
  STORIES.lista=lista;
  var html='<button class="story me'+(hoyMin?' nueva':'')+'" onclick="abrirStoryMia()"><span class="st-ring"><span class="st-av">'+(hoyMin?arbolSVG(Math.max(hoyMin,1),false,"yo",40,DATA.especie):'＋')+'</span></span><small>Tu día</small></button>';
  html+='<button class="story tips" onclick="abrirTips()"><span class="st-ring"><span class="st-av">💡</span></span><small>Tips</small></button>';
  html+=lista.map(function(s,k){
    return '<button class="story'+(s.nueva?' nueva':'')+(s.ahora?' ahora':'')+'" onclick="abrirStory('+k+')"><span class="st-ring"><span class="st-av" style="background:'+colorDe(s.id)+'">'+escapeHTML((s.nombre||"?").charAt(0).toUpperCase())+'</span></span>'+
      (s.ahora?'<em class="st-live">ESTUDIANDO</em>':'')+'<small>'+escapeHTML((s.nombre||"Amigo").split(" ")[0])+'</small></button>';
  }).join("");
  if(!lista.length)html+='<button class="story invita" onclick="'+(SOCIAL.user?'invitarAmigos()':'abrirLogin(\'reg\')')+'"><span class="st-ring"><span class="st-av">＋</span></span><small>'+(SOCIAL.user?'Invitar':'Amigos')+'</small></button>';
  el.innerHTML=html;
}
function slideHTML(s,nombre){
  var m=s.minutes!=null?s.minutes:s.min, lugar=(s.bib_name||s.bib||"").replace("Biblioteca ","").replace("Pública ","");
  var hace=s.created_at?(function(){var x=Math.round((Date.now()-Date.parse(s.created_at))/60000);return x<60?"hace "+x+" min":x<1440?"hace "+Math.round(x/60)+" h":"ayer";})():fmtFeedDate(s.date);
  return '<div class="sv-tree">'+arbolSVG(Math.max(m,1),s.focus==="withered",s.subject||s.local_id||s.id,190,s.esp)+'</div>'+
    '<div class="sv-min">'+hMin(m)+'</div><div class="sv-where">'+(lugar&&lugar!==NO_BIB?'📍 '+escapeHTML(lugar):'🏠 Fuera de la biblioteca')+(s.subject?' · 📚 '+escapeHTML(s.subject):'')+'</div>'+
    (s.focus==="withered"?'<div class="sv-tag">🥀 Se le marchitó el árbol</div>':s.focus==="ok"?'<div class="sv-tag">🌳 Árbol plantado</div>':'')+
    (s.note&&s.note!=="Pomodoro"?'<div class="sv-note">“'+escapeHTML(s.note)+'”</div>':'')+'<div class="sv-hace">'+escapeHTML(hace)+'</div>';
}
function abrirStory(k){
  var s=STORIES.lista[k]; if(!s)return; STORIES.idx=k;STORIES.slide=0;
  var slides=s.ses.map(function(x){return {html:slideHTML(x,s.nombre),ses:x};});
  if(s.ahora){var b=BIBLIOTECAS[s.ahora.bib_index];slides.push({html:'<div class="sv-live">🔴 EN DIRECTO</div><div class="sv-min">Estudiando ahora</div><div class="sv-where">'+(b?'📍 '+escapeHTML(cortoNombre(b.nombre)):'')+'</div>'+(s.ahora.started_at?'<div class="sv-hace">empezó hace '+(function(){var x=Math.max(1,Math.round((Date.now()-Date.parse(s.ahora.started_at))/60000));return x<60?x+' min':Math.floor(x/60)+' h '+(x%60)+' min';})()+'</div>':'')+(b?'<button class="btn sm" style="margin-top:16px" onclick="cerrarStory();socialGoFriend(\''+s.id+'\')">Ver en el mapa</button>':''),ses:null});}
  if(!slides.length)return;
  if(s.ultima){var v=storiesVistas();v[s.id]=s.ultima;saveJSON("bpna_stories_vistas",v);}
  mostrarStory(s.nombre,colorDe(s.id),slides,s.id);
}
function abrirStoryMia(){
  var hoy=ymd(), mias=DATA.sessions.filter(function(s){return s.date===hoy;});
  var slides=mias.map(function(x){return {html:slideHTML(x,"Tú"),ses:null};});
  var h=statsHoy();
  slides.push({html:'<div class="sv-min">'+(h.min?hMin(h.min)+' hoy':'Tu día está por empezar')+'</div><div class="sv-where">🔥 Racha de '+streakDays()+' días · 🌰 '+semillas()+' semillas</div>'+
    '<button class="btn sm" style="margin-top:18px" onclick="compartirStoryDia()">📸 Compartir en stories</button>'+
    (h.min?'':'<button class="btn sm ghost" style="margin-top:10px;background:#fff" onclick="cerrarStory();goView(\'study\')">▶ Empezar a estudiar</button>'),ses:null});
  mostrarStory("Tu día",null,slides,"yo");
}
function mostrarStory(nombre,color,slides,id){
  cerrarStory();
  var o=document.createElement("div");o.className="story-viewer";o.id="storyViewer";
  if(color)o.style.setProperty("--sv",color);
  o.innerHTML='<div class="sv-bars">'+slides.map(function(){return '<span><i></i></span>';}).join("")+'</div>'+
    '<div class="sv-head"><span class="sv-av">'+escapeHTML(nombre.charAt(0).toUpperCase())+'</span><b>'+escapeHTML(nombre)+'</b><button class="sv-x" onclick="cerrarStory()" aria-label="Cerrar">×</button></div>'+
    '<div class="sv-body"></div><div class="sv-foot"></div><div class="sv-tap izq"></div><div class="sv-tap der"></div>';
  document.body.appendChild(o);
  STORIES.slides=slides;STORIES.owner=id;STORIES.slide=0;
  o.querySelector(".sv-tap.izq").addEventListener("click",function(){irSlide(STORIES.slide-1);});
  o.querySelector(".sv-tap.der").addEventListener("click",function(){irSlide(STORIES.slide+1);});
  o.querySelector(".sv-body").addEventListener("dblclick",function(e){var sl=STORIES.slides[STORIES.slide];if(sl&&sl.ses)kudosDoble(e,sl.ses.local_id,sl.ses.owner_id);});
  document.addEventListener("keydown",teclaStory);
  irSlide(0);
}
function irSlide(n){
  var o=$("storyViewer"); if(!o)return;
  if(n<0)n=0;
  if(n>=STORIES.slides.length){
    // siguiente amigo con historia, como en Instagram
    if(STORIES.owner!=="yo"&&STORIES.idx+1<STORIES.lista.length){abrirStory(STORIES.idx+1);return;}
    cerrarStory();return;
  }
  STORIES.slide=n;var sl=STORIES.slides[n];
  o.querySelectorAll(".sv-bars span").forEach(function(b,k){b.className=k<n?"vista":k===n?"activa":"";});
  var body=o.querySelector(".sv-body");body.innerHTML=sl.html;body.classList.remove("entra");void body.offsetWidth;body.classList.add("entra");
  var foot=o.querySelector(".sv-foot");
  if(sl.ses&&STORIES.owner!=="yo"){
    var ya=!!SOCIAL.kudosByMe[sl.ses.local_id],nk=SOCIAL.kudosCounts[sl.ses.local_id]||0;
    foot.innerHTML='<button class="sv-kudos'+(ya?' on':'')+'" onclick="event.stopPropagation();kudosDoble({clientX:innerWidth/2,clientY:innerHeight-120},\''+sl.ses.local_id+'\',\''+sl.ses.owner_id+'\');this.classList.add(\'on\',\'pop\')">👏 '+(ya?'Kudos dados':'Dar kudos')+(nk?' · '+nk:'')+'</button><small>o toca dos veces</small>';
  }else foot.innerHTML="";
  clearTimeout(STORIES.timer);
  var dur=sl.ses?5200:7000;
  var bar=o.querySelector(".sv-bars span.activa i");if(bar){bar.style.animationDuration=dur+"ms";}
  STORIES.timer=setTimeout(function(){irSlide(STORIES.slide+1);},dur);
}
function teclaStory(e){if(e.key==="Escape")cerrarStory();else if(e.key==="ArrowRight")irSlide(STORIES.slide+1);else if(e.key==="ArrowLeft")irSlide(STORIES.slide-1);}
function cerrarStory(){clearTimeout(STORIES.timer);var o=$("storyViewer");if(o)o.remove();document.removeEventListener("keydown",teclaStory);renderStories();}

/* ----- Tarjetas para stories (Strava/Instagram): imagen 1080×1920 del bosque o de la sesión ----- */
function svgLiteral(svg){
  var cs=getComputedStyle(document.documentElement);
  return svg.replace("<svg ",'<svg xmlns="http://www.w3.org/2000/svg" ').replace(/var\((--[\w-]+)\)/g,function(m,v){return cs.getPropertyValue(v).trim()||"#22c55e";});
}
function cargarSVG(svg){return new Promise(function(res){var im=new Image();im.onload=function(){res(im);};im.onerror=function(){res(null);};im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svgLiteral(svg));});}
function lienzoStory(){
  var W=1080,H=1920,c=document.createElement("canvas");c.width=W;c.height=H;var g=c.getContext("2d");
  var gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,"#5b4bd6");gr.addColorStop(.55,"#a21caf");gr.addColorStop(1,"#f59e0b");g.fillStyle=gr;g.fillRect(0,0,W,H);
  return {c:c,g:g,W:W,H:H};
}
function textoC(g,t,x,y,font,color){g.font=font;g.fillStyle=color||"#fff";g.textAlign="center";g.fillText(t,x,y);g.textAlign="left";}
async function compartirLienzo(c,nombre,texto){
  var blob=await new Promise(function(r){c.toBlob(r,"image/png");});
  var file=new File([blob],nombre,{type:"image/png"});
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"Bibliomapa",text:texto});return;}}catch(e){if(e&&e.name==="AbortError")return;}
  var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=nombre;document.body.appendChild(a);a.click();a.remove();
  showToast("Imagen descargada: súbela a tus stories 📸");
}
async function dibujarBosque(g,ses,x0,y0,ancho,alto){
  // suelo
  g.fillStyle="rgba(255,255,255,.16)";g.beginPath();g.roundRect?g.roundRect(x0,y0,ancho,alto,40):g.rect(x0,y0,ancho,alto);g.fill();
  g.fillStyle="#4ade80";g.fillRect(x0,y0+alto-36,ancho,36);
  var lista=ses.slice(-40), filas=lista.length>14?3:lista.length>4?2:1, porFila=Math.ceil(lista.length/filas)||1, altoFila=(alto-60)/filas;
  for(var f=0;f<filas;f++){
    var trozo=lista.slice(f*porFila,(f+1)*porFila), base=y0+alto-36-(filas-1-f)*altoFila;
    var imgs=await Promise.all(trozo.map(function(s){return cargarSVG(arbolSVG(s.min,s.focus==="withered",s.subject||s.id,null,s.esp));}));
    // escala para llenar la fila sin salirse: por alto (el árbol más alto) y por ancho (la suma)
    var maxH=Math.max.apply(null,trozo.map(function(s){return alturaArbol(s.min);})), sumW=trozo.reduce(function(a,s){return a+alturaArbol(s.min)*0.66;},0);
    var esc=Math.min((altoFila-30)/maxH,(ancho-60)/sumW,6);
    var anchos=imgs.map(function(im,k){return im?alturaArbol(trozo[k].min)*0.66*esc:0;}), total=anchos.reduce(function(a,b){return a+b;},0);
    var x=x0+(ancho-total)/2;
    imgs.forEach(function(im,k){if(!im)return;var h=alturaArbol(trozo[k].min)*esc,w=anchos[k];g.drawImage(im,x,base-h,w,h);x+=w;});
  }
}
async function compartirBosque(){
  var ses=sesionesPeriodo(DATA.sessions,FOREST_PERIOD==="all"?"month":FOREST_PERIOD);
  if(!ses.length){showToast("Planta algún árbol primero 🌱");return;}
  showToast("Preparando tu imagen…");
  var L=lienzoStory(),g=L.g,W=L.W,vivos=ses.filter(function(s){return s.focus!=="withered";}).length,min=ses.reduce(function(a,s){return a+s.min;},0);
  var P={day:"HOY",week:"ESTA SEMANA",month:"ESTE MES",all:"ESTE MES",lastweek:"MI SEMANA"}[FOREST_PERIOD];
  textoC(g,"MI BOSQUE · "+P,W/2,190,"800 44px system-ui,sans-serif","rgba(255,255,255,.85)");
  textoC(g,hMin(min),W/2,370,"800 190px system-ui,sans-serif");
  var rd=streakDays();textoC(g,"🌳 "+vivos+(vivos===1?" árbol":" árboles")+"   🔥 "+rd+(rd===1?" día":" días"),W/2,470,"700 56px system-ui,sans-serif");
  await dibujarBosque(g,ses,70,560,W-140,1000);
  textoC(g,"Planta tu bosque estudiando",W/2,1700,"600 48px system-ui,sans-serif","rgba(255,255,255,.9)");
  textoC(g,"bibliomapa.es",W/2,1790,"800 64px system-ui,sans-serif");
  compartirLienzo(L.c,"mi-bosque.png","Mi bosque de estudio 🌳 "+hMin(min)+" · bibliomapa.es");
}
async function compartirSesionStory(id){
  var s=DATA.sessions.filter(function(x){return x.id===id;})[0]; if(!s)return;
  showToast("Preparando tu imagen…");
  var L=lienzoStory(),g=L.g,W=L.W;
  textoC(g,"SESIÓN DE ESTUDIO",W/2,200,"800 44px system-ui,sans-serif","rgba(255,255,255,.85)");
  var im=await cargarSVG(arbolSVG(s.min,s.focus==="withered",s.subject||s.id,null,s.esp));
  if(im)g.drawImage(im,W/2-260,330,520,788);
  textoC(g,hMin(s.min),W/2,1290,"800 200px system-ui,sans-serif");
  var lugar=s.bib&&s.bib!==NO_BIB?cortoNombre(s.bib):"";
  textoC(g,(lugar?"📍 "+lugar:"")+(s.subject?(lugar?"  ·  ":"")+"📚 "+s.subject:""),W/2,1390,"700 50px system-ui,sans-serif");
  textoC(g,"🔥 Racha de "+streakDays()+(streakDays()===1?" día":" días"),W/2,1480,"700 56px system-ui,sans-serif");
  textoC(g,"bibliomapa.es",W/2,1790,"800 64px system-ui,sans-serif");
  compartirLienzo(L.c,"mi-sesion.png","He estudiado "+hMin(s.min)+" 🌳 bibliomapa.es");
}
async function compartirStoryDia(){
  var hoy=ymd(),ses=DATA.sessions.filter(function(s){return s.date===hoy;});
  if(!ses.length){showToast("Estudia un poco y comparte tu día 🌱");return;}
  var prev=FOREST_PERIOD;FOREST_PERIOD="day";await compartirBosque();FOREST_PERIOD=prev;
}

/* ----- Resumen semanal tipo «Wrapped» (Strava/Spotify): el lunes, la semana pasada en historias ----- */
function semanaClave(d){d=new Date(d||Date.now());d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return ymd(d);}
function datosSemana(offset){
  var lun=new Date();lun.setHours(0,0,0,0);lun.setDate(lun.getDate()-((lun.getDay()+6)%7)-7*offset);
  var fin=new Date(lun);fin.setDate(lun.getDate()+6);var d1=ymd(lun),d2=ymd(fin);
  var ses=DATA.sessions.filter(function(s){return s.date>=d1&&s.date<=d2;}),porDia={},subj={},min=0,vivos=0,secos=0,larga=0;
  ses.forEach(function(s){min+=s.min;porDia[s.date]=(porDia[s.date]||0)+s.min;if(s.subject)subj[s.subject]=(subj[s.subject]||0)+s.min;if(s.focus==="withered")secos++;else vivos++;larga=Math.max(larga,s.min);});
  var mejor=null;Object.keys(porDia).forEach(function(k){if(!mejor||porDia[k]>porDia[mejor])mejor=k;});
  var top=null;Object.keys(subj).forEach(function(k){if(!top||subj[k]>subj[top])top=k;});
  return {ses:ses,min:min,dias:Object.keys(porDia).length,mejor:mejor,mejorMin:mejor?porDia[mejor]:0,top:top,topMin:top?subj[top]:0,vivos:vivos,secos:secos,larga:larga,desde:lun};
}
function abrirResumenSemanal(auto){
  var S=datosSemana(1), P=datosSemana(2);
  if(!S.ses.length){if(!auto)showToast("La semana pasada no hubo sesiones: ¡esta semana sí! 💪");return;}
  DATA.resumenVisto=semanaClave();saveUserData();
  var DIAS=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  var dif=P.min?Math.round((S.min-P.min)/P.min*100):null;
  var slides=[
    {html:'<div class="sv-kicker">TU SEMANA</div><div class="sv-min">'+hMin(S.min)+'</div><div class="sv-where">estudiadas en '+S.dias+(S.dias===1?' día':' días')+'</div>'+
      (dif!==null?'<div class="sv-tag">'+(dif>=0?'📈 +'+dif+'% que la semana anterior':'Semana más tranquila ('+dif+'%) · ¡esta a por más! 💪')+'</div>':'<div class="sv-tag">✨ Tu primera semana con datos</div>'),ses:null},
    {html:'<div class="sv-tree">'+arbolSVG(Math.max(S.larga,1),false,"semana",170,DATA.especie)+'</div><div class="sv-min">'+S.vivos+(S.vivos===1?' árbol':' árboles')+'</div><div class="sv-where">'+(S.secos?'y '+S.secos+' marchito'+(S.secos===1?'':'s')+' 🥀':'¡ni uno marchito! 🏆')+'</div><div class="sv-hace">Tu sesión más larga: '+hMin(S.larga)+'</div>',ses:null}
  ];
  if(S.mejor)slides.push({html:'<div class="sv-kicker">TU MEJOR DÍA</div><div class="sv-min">'+DIAS[new Date(S.mejor+"T00:00:00").getDay()]+'</div><div class="sv-where">'+hMin(S.mejorMin)+' de estudio 🔥</div>',ses:null});
  if(S.top)slides.push({html:'<div class="sv-kicker">LO QUE MÁS ESTUDIASTE</div><div class="sv-min">📚 '+escapeHTML(S.top)+'</div><div class="sv-where">'+hMin(S.topMin)+' ('+Math.round(S.topMin/S.min*100)+'% de tu semana)</div>',ses:null});
  slides.push({html:'<div class="sv-kicker">NIVEL '+(nivelDe(horasTotales())+1)+' · '+escapeHTML(NIVELES[nivelDe(horasTotales())][1].toUpperCase())+'</div><div class="sv-min">🔥 '+streakDays()+'</div><div class="sv-where">'+(streakDays()===1?'día':'días')+' de racha · 🌰 '+semillas()+' semillas</div>'+
    '<button class="btn sm" style="margin-top:18px" onclick="compartirSemanaPasada()">📸 Compartir mi semana</button>',ses:null});
  mostrarStory("Tu semana",null,slides,"yo");
  if(auto)setTimeout(function(){confeti(60);},400);
}
async function compartirSemanaPasada(){var prev=FOREST_PERIOD;FOREST_PERIOD="lastweek";try{await compartirBosque();}finally{FOREST_PERIOD=prev;}}
function quizasResumenSemanal(){
  if(!DATA||DATA.resumenVisto===semanaClave())return;
  if(!datosSemana(1).ses.length)return;
  setTimeout(function(){if(!document.querySelector(".modal-bg")&&!$("storyViewer"))abrirResumenSemanal(true);},1500);
}

/* ----- Cuenta atrás en vivo hasta que cierra o abre (como las apps de horarios de misas) ----- */
function cuentaAtrasHTML(minFaltan,txt){
  var fin=Date.now()+(minFaltan*60-new Date().getSeconds())*1000;
  return '<div class="nc-cd" data-fin="'+fin+'" data-txt="'+escapeHTML(txt)+'"><span class="cd-t">⏳ '+escapeHTML(txt)+'</span><b class="cd-v">'+fmtCuenta(fin-Date.now())+'</b></div>';
}
function fmtCuenta(ms){var s=Math.max(0,Math.round(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;
  return (h?h+":"+String(m).padStart(2,"0"):m)+":"+String(x).padStart(2,"0");}
setInterval(function(){
  document.querySelectorAll(".nc-cd[data-fin]").forEach(function(el){
    var ms=+el.dataset.fin-Date.now(), v=el.querySelector(".cd-v"); if(!v)return;
    if(ms<=0){renderNowCard();return;}
    v.textContent=fmtCuenta(ms);el.classList.toggle("pronto",ms<30*60000);
  });
},1000);

/* ----- Tips para estudiar mejor, en baraja vertical (como TikTok) ----- */
// Técnicas con respaldo en la investigación sobre aprendizaje, explicadas con palabras propias.
var TIPS=[
  {e:"🧠",t:"Recuerda, no releas",x:"Cierra el libro y escribe lo que recuerdas. Sacar la información de la memoria (recuerdo activo) fija mucho más que volver a leerla."},
  {e:"📅",t:"Repaso espaciado",x:"Repasa un tema al día siguiente, a los 3 días y a la semana. Espaciar los repasos vence a la curva del olvido mejor que darte un atracón."},
  {e:"📝",t:"Hazte exámenes",x:"Practicar con preguntas tipo test o de desarrollo es de lo más eficaz que existe. Equivocarte en casa es gratis: en el examen no."},
  {e:"🔀",t:"Intercala temas",x:"Mezcla tipos de problemas o asignaturas en la misma sesión. Cuesta más, pero aprendes a distinguir cuándo usar cada cosa."},
  {e:"🧒",t:"Técnica Feynman",x:"Explica el tema como si se lo contaras a un niño de 12 años. Donde te atasques, ahí está lo que todavía no entiendes."},
  {e:"❓",t:"Pregúntate por qué",x:"Para cada idea, pregúntate «¿por qué es así?» y «¿cómo se relaciona con lo que ya sé?». Conectar ideas las hace durar."},
  {e:"🖼️",t:"Palabras + dibujos",x:"Acompaña lo que lees con un esquema, un dibujo o un diagrama. Dos vías de entrada a la memoria mejor que una."},
  {e:"🍅",t:"Bloques con descanso",x:"Trabaja 25-50 min concentrado y descansa 5-10. Los descansos cortos mantienen la atención y el cronómetro te ayuda a no engañarte."},
  {e:"📵",t:"El móvil, en otra habitación",x:"Solo tenerlo a la vista, aunque esté boca abajo, roba atención. Lejos y en silencio. Aquí, tu árbol te lo agradece 🌳"},
  {e:"😴",t:"Dormir también es estudiar",x:"Mientras duermes, el cerebro consolida lo aprendido. Una noche en vela antes del examen suele restar más de lo que suma."},
  {e:"🏃",t:"Muévete",x:"Un paseo o un poco de ejercicio entre bloques despeja la cabeza y ayuda a concentrarte en el siguiente."},
  {e:"🎯",t:"Objetivo concreto",x:"«Estudiar Bioquímica» es vago. «Hacer los 20 problemas del tema 4» es un plan. Empieza cada sesión sabiendo qué vas a terminar."},
  {e:"📍",t:"Si… entonces…",x:"Decide cuándo y dónde: «Si son las 16:00, entonces me siento en la biblioteca con Anatomía». Las intenciones concretas se cumplen más."},
  {e:"⏱️",t:"Regla de los 2 minutos",x:"¿Te cuesta arrancar? Comprométete solo a 2 minutos. Lo difícil es empezar; seguir suele salir solo."},
  {e:"🖍️",t:"Subrayar no es estudiar",x:"Subrayar y releer dan sensación de dominio, pero enseñan poco. Úsalos solo como paso previo a preguntarte y resumir."},
  {e:"🧩",t:"Ejemplos concretos",x:"Para cada concepto abstracto, busca o inventa dos ejemplos distintos. Así lo reconocerás aunque te lo pregunten de otra forma."},
  {e:"👥",t:"Enséñaselo a alguien",x:"Explicar un tema a un compañero es una de las mejores formas de aprenderlo. Una sala de estudio con amigos sirve para eso."},
  {e:"🗂️",t:"Lo importante primero",x:"Ordena por importancia y urgencia. Lo que más pesa en el examen y peor llevas, al principio del día, cuando tienes más energía."},
  {e:"🔁",t:"Mismo sitio, misma hora",x:"Estudiar en el mismo lugar y a la misma hora crea un hábito: el cerebro entra antes «en modo estudio». Tu biblioteca habitual ayuda."},
  {e:"🎧",t:"Ruido, con cuidado",x:"Música con letra compite con la lectura. Si necesitas sonido, mejor algo instrumental o ruido de fondo suave."},
  {e:"💧",t:"Cuida lo básico",x:"Agua, algo de comer y luz natural. Con hambre o cansancio la concentración cae aunque tengas toda la fuerza de voluntad."},
  {e:"📈",t:"Mide tu progreso",x:"Ver cuánto has estudiado motiva y te muestra la verdad. Por eso cada sesión planta un árbol: tu bosque es tu historial."},
  {e:"🙌",t:"Celebra lo pequeño",x:"Cada tema terminado cuenta. Reconocer avances pequeños mantiene la motivación a lo largo de un curso largo."},
  {e:"🧘",t:"Antes del examen, respira",x:"Unas respiraciones lentas antes de empezar bajan los nervios. Lee todas las preguntas y empieza por las que sabes."}
];
function abrirTips(inicio){
  var gustos=loadJSON("bpna_tips_gustos",{}), guardados=loadJSON("bpna_tips_guardados",{});
  // orden diario distinto, como un «Para ti»
  var orden=TIPS.map(function(t,i){return i;}).sort(function(a,b){return hashStr(ymd()+a)-hashStr(ymd()+b);});
  if(inicio!=null){orden=orden.filter(function(i){return i!==inicio;});orden.unshift(inicio);}
  var cols=["#5b4bd6","#a21caf","#0e7490","#c2410c","#047857","#be185d","#4338ca","#b45309"];
  var o=document.createElement("div");o.className="tips-viewer";o.id="tipsViewer";
  o.innerHTML='<button class="sv-x tips-x" onclick="cerrarTips()" aria-label="Cerrar">×</button><div class="tips-feed">'+orden.map(function(i,k){var t=TIPS[i];
    return '<section class="tip" data-i="'+i+'" style="--c:'+cols[i%cols.length]+'"><div class="tip-body"><div class="tip-e">'+t.e+'</div><h2>'+escapeHTML(t.t)+'</h2><p>'+escapeHTML(t.x)+'</p>'+(k===0?'<div class="tip-hint">Desliza hacia arriba ↑</div>':'')+'</div>'+
      '<div class="tip-acts"><button class="tip-like'+(gustos[i]?' on':'')+'" onclick="tipLike('+i+',this)"><span>'+(gustos[i]?'❤️':'🤍')+'</span><small>Me sirve</small></button>'+
      '<button class="tip-save'+(guardados[i]?' on':'')+'" onclick="tipGuardar('+i+',this)"><span>'+(guardados[i]?'🔖':'📑')+'</span><small>'+(guardados[i]?'Guardado':'Guardar')+'</small></button>'+
      '<button onclick="tipCompartir('+i+')"><span>↗️</span><small>Enviar</small></button></div></section>';}).join("")+'</div>';
  document.body.appendChild(o);
  o.querySelectorAll(".tip").forEach(function(sec){sec.addEventListener("dblclick",function(e){var i=+sec.dataset.i;var b=sec.querySelector(".tip-like");if(!loadJSON("bpna_tips_gustos",{})[i])tipLike(i,b);
    if(!sinMovimiento()){var c=document.createElement("span");c.className="corazon";c.textContent="❤️";c.style.left=e.clientX+"px";c.style.top=e.clientY+"px";document.body.appendChild(c);setTimeout(function(){c.remove();},900);}});});
  document.addEventListener("keydown",teclaTips);
}
function teclaTips(e){if(e.key==="Escape")cerrarTips();}
function cerrarTips(){var o=$("tipsViewer");if(o)o.remove();document.removeEventListener("keydown",teclaTips);}
function tipLike(i,b){var g=loadJSON("bpna_tips_gustos",{});g[i]=!g[i];saveJSON("bpna_tips_gustos",g);
  if(b){b.classList.toggle("on",!!g[i]);b.querySelector("span").textContent=g[i]?"❤️":"🤍";if(g[i]){b.classList.remove("pop");void b.offsetWidth;b.classList.add("pop");celebrar(b,["❤️","✨"],8);}}}
function tipGuardar(i,b){var g=loadJSON("bpna_tips_guardados",{});g[i]=!g[i];saveJSON("bpna_tips_guardados",g);
  if(b){b.classList.toggle("on",!!g[i]);b.querySelector("span").textContent=g[i]?"🔖":"📑";b.querySelector("small").textContent=g[i]?"Guardado":"Guardar";if(g[i])showToast("🔖 Tip guardado");}}
function tipCompartir(i){var t=TIPS[i],txt=t.e+" "+t.t+": "+t.x+" — bibliomapa.es";
  if(navigator.share)navigator.share({title:t.t,text:txt}).catch(function(){});else{try{navigator.clipboard.writeText(txt);showToast("Tip copiado");}catch(e){}}}
