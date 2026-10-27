/* Bibliomapa · código bajo demanda (lo carga cargarExtra() de app.js).
   Ventanas y acciones que solo hacen falta al pulsar un botón: así app.js pesa menos y el primer
   pintado en móvil es más rápido. app.js deja un «stub» con el mismo nombre para cada función de aquí:
   al llamarla carga este archivo (desde la caché del service worker si ya se visitó) y la ejecuta.
   Las variables y funciones de app.js son globales y se usan aquí tal cual.
   OJO: al añadir una función nueva aquí, añade su nombre a EXTRA_FUNCS en app.js. */
/* ----- Denunciar y bloquear: ventanas de denuncia, menú «⋯» y lista de bloqueados ----- */
var REPORT_REASONS=[["spam","Spam o publicidad"],["acoso","Acoso o insultos"],["sexual","Contenido sexual"],["odio","Odio o discriminación"],["datos_personales","Datos personales de otra persona"],["otro","Otro motivo"]];
var REPORT_LABEL={book_post:"esta publicación",session_comment:"este comentario",shared_session:"esta sesión",profile:"este usuario",otro:"este contenido"};
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
/* ----- Blog de lecturas: publicar ----- */
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
/* ----- Sugerencias, nombre y borrar cuenta ----- */
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
// Borra la cuenta en la nube (función delete_my_account del SQL) y todos los datos de este dispositivo.
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
/* ----- Compartir mi semana (imagen 1080×1350) ----- */
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
/* ----- Reportar o confirmar un horario ----- */
var HR_DIAS_LARGOS=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
function invitarSesionHorario(){
  openModal('<h3>Inicia sesión para avisar</h3><div class="sub">Para confirmar o reportar un horario necesitas una cuenta (gratis y opcional). Así evitamos avisos falsos.</div>'+
    '<div style="display:flex;gap:8px"><button class="btn sm" style="flex:1" onclick="closeModal();abrirLogin(\'login\')">Iniciar sesión</button>'+
    '<button class="btn sm ghost" style="flex:1" onclick="closeModal();abrirLogin(\'reg\')">Crear cuenta</button></div>');
}
// ¿La tabla aún no existe en Supabase? (SQL sin ejecutar). Entonces el aviso va al buzón feedback.
function hrSinTabla(err){var m=String((err&&(err.message||err.code))||"");return /horario_reportes|42P01|PGRST205|does not exist|schema cache/i.test(m);}
var HR_TIPOS={horario_distinto:"El horario es distinto",cerrado_temporal:"Cerrada temporalmente",festivo:"Festivo (cierra o cambia ese día)",otro:"Otro"};
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
/* ----- Meta semanal ----- */
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
/* ----- Préstamos y eventos: ventanas de añadir ----- */
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
/* ----- Avisos: la ventana de la campana ----- */
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
/* ----- Tarjetas para stories con canvas (1080×1920) ----- */
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
/* ----- Resumen semanal tipo «Wrapped» ----- */
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
/* ----- Bienvenida de la primera visita (3 pasos) ----- */
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
/* ----- Sala de estudio en grupo: crear, unirse, salir y la sala activa ----- */
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
function pintarSalaActiva(card){
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
/* ----- Comentarios en sesiones: el hilo, enviar y borrar ----- */
function hiloComentariosHTML(localId,ownerId){
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
/* ----- Agenda: «🙏 N amigos rezan por tu examen de mañana» (lo llama renderCalRezos de app.js) ----- */
// Solo cifras reales: el dueño de un examen puede leer todas las filas de prayers de sus exámenes (política
// «prayers select involved»), así que no depende de la función prayer_counts. Si esa lectura falla, se avisa
// SIN número y solo si ya consta al menos un rezo de otra persona; si no, no se pinta nada.
var REZOS_AVISO={k:"",t:0,filas:null};
async function pintarAvisoRezos(el,exs){
  var sb=socialClient();if(!sb||!SOCIAL.user||!el)return;
  var yo=SOCIAL.user.id,ids=exs.map(function(e){return e.id;}),k=yo+":"+ids.join("|");
  if(REZOS_AVISO.k!==k||Date.now()-REZOS_AVISO.t>60000){
    REZOS_AVISO={k:k,t:Date.now(),filas:null};
    try{var r=await sb.from("prayers").select("event_local_id,prayed_by_id,prayed_by_name").eq("event_owner_id",yo).in("event_local_id",ids);
      if(r&&!r.error&&r.data)REZOS_AVISO.filas=r.data;}catch(e){}
  }
  var filas=REZOS_AVISO.filas;
  var html=exs.map(function(ex){
    var cuando=ex.d?"mañana":"hoy",tit,quien="";
    if(filas){
      var vistos={},nombres=[];
      filas.forEach(function(f){var id=f.prayed_by_id;
        if(f.event_local_id!==ex.id||!id||id===yo||vistos[id]||isBlocked(id))return;
        vistos[id]=1;nombres.push(String(f.prayed_by_name||socialNameById(id)).trim().split(/\s+/)[0]||"Alguien");});
      var n=nombres.length;if(!n)return "";
      tit=n+(n===1?" amigo reza":" amigos rezan")+" por tu examen de "+cuando;
      var v=nombres.slice(0,3),mas=n-v.length;
      quien=" · "+(mas?v.join(", ")+" y "+mas+" más":v.length>1?v.slice(0,-1).join(", ")+" y "+v[v.length-1]:v[0]);
    }else{
      var c=(SOCIAL.prayerCounts&&SOCIAL.prayerCounts[ex.id])||0;
      if(c<=(SOCIAL.prayedByMe&&SOCIAL.prayedByMe[ex.id]?1:0))return "";
      tit="Tus amigos rezan por tu examen de "+cuando;
    }
    return '<div class="rezos-aviso extra"><span class="ra-ic" aria-hidden="true">🙏</span><div class="ra-t"><b>'+escapeHTML(tit)+'</b>'+
      '<small>'+escapeHTML(ex.title||"Examen")+escapeHTML(quien)+'</small><small class="ra-animo">'+(ex.d?"Descansa bien esta noche. ¡Mucho ánimo!":"Respira hondo y a por ello. ¡Mucho ánimo!")+'</small></div></div>';
  }).join("");
  if(el.dataset.html!==html){el.dataset.html=html;el.innerHTML=html;}
}

/* ----- Tienda de especies (se abre desde el bosque o el cofre) ----- */
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

/* ----- Cofre de las misiones y ventana de la racha ----- */
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

/* ----- Visor de historias (Instagram): las de los amigos y «Tu día» ----- */
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

/* ----- Tips para estudiar mejor, en baraja vertical (como TikTok). TIPS también lo usa la bienvenida diaria ----- */
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

/* ----- Pantalla de foco (Forest): el árbol a pantalla completa mientras estudias ----- */
var FRASES_FOCO=["Un tema más y te tomas un descanso 💪","Tu árbol crece con cada minuto 🌱","Lo difícil era empezar. Ya lo has hecho.","Concéntrate en esta página, no en todo el temario.","Tu yo del examen te lo va a agradecer 🙌","No salgas de la app: tu árbol te necesita 🌳"];
function abrirFoco(){
  if(!studyTimer.running&&!(pomo.running&&pomo.phase==="focus")){showToast("Empieza una sesión para entrar en modo foco");return;}
  var o=document.createElement("div");o.className="foco";o.id="focoView";
  o.innerHTML='<button class="sv-x foco-x" onclick="cerrarFoco()" aria-label="Salir del modo foco">×</button><div class="foco-tree"></div><div class="foco-time"></div><div class="foco-etapa"></div><div class="foco-frase"></div>'+
    '<div class="foco-acts"><button class="btn ghost" onclick="cerrarFoco()">Salir del modo foco</button></div>';
  document.body.appendChild(o);
  try{if(o.requestFullscreen)o.requestFullscreen().catch(function(){});}catch(e){}
  FOCO_ETAPA=null;pintarFoco();FOCO_T=setInterval(pintarFoco,1000);
}
var FOCO_T=null,FOCO_ETAPA=null;
function pintarFoco(){
  var o=$("focoView"); if(!o)return;
  if(!studyTimer.running&&!(pomo.running&&pomo.phase==="focus")){cerrarFoco();return;}
  var sec=studyTimer.running?elapsedSec():(POMO_FOCUS_MIN*60-pomo.secondsLeft), min=Math.floor(sec/60), e=etapaArbol(min), clave=e+"|"+FOCUS.withered;
  o.querySelector(".foco-time").textContent=studyTimer.running?fmtClock(sec):String(Math.floor(pomo.secondsLeft/60)).padStart(2,"0")+":"+String(pomo.secondsLeft%60).padStart(2,"0");
  if(clave!==FOCO_ETAPA){
    var subio=FOCO_ETAPA!=null&&!FOCUS.withered;FOCO_ETAPA=clave;
    o.querySelector(".foco-tree").innerHTML='<div class="fp-tree'+(subio?' grow':'')+'">'+arbolSVG(Math.max(min,1),FOCUS.withered,(DATA&&DATA.currentSubject)||"",240,especieActual())+'</div>';
    var sig=ETAPAS_ARBOL[e+1];
    o.querySelector(".foco-etapa").textContent=FOCUS.withered?"🥀 Se ha marchitado":ETAPAS_ARBOL[e][1]+(sig?" · "+sig[1].toLowerCase()+" en "+(sig[0]-min)+" min":"");
    if(subio)celebrar(o.querySelector(".foco-tree"),["🌱","🍃","✨"],10);
  }else if(!FOCUS.withered){var sg=ETAPAS_ARBOL[e+1];o.querySelector(".foco-etapa").textContent=ETAPAS_ARBOL[e][1]+(sg?" · "+sg[1].toLowerCase()+" en "+(sg[0]-min)+" min":"");}
  if(sec%20===0||!o.querySelector(".foco-frase").textContent){var f=o.querySelector(".foco-frase");f.textContent=FRASES_FOCO[Math.floor(sec/20)%FRASES_FOCO.length];f.classList.remove("entra");void f.offsetWidth;f.classList.add("entra");}
}
function cerrarFoco(){clearInterval(FOCO_T);var o=$("focoView");if(o)o.remove();try{if(document.fullscreenElement)document.exitFullscreen();}catch(e){}}

/* ----- Sesión terminada (valorar, afluencia, nota) y editar una sesión ----- */
function pedirValoracion(sesion,horasAntes){
  var sel={v:0};
  var plantado=sesion.focus?'<div class="planted'+(sesion.focus==="withered"?' seco':'')+'"><div class="planted-tree">'+arbolSVG(sesion.min,sesion.focus==="withered",sesion.subject||sesion.id,110,sesion.esp)+'</div>'+
    '<div class="planted-txt">'+(sesion.focus==="withered"?'🥀 Tu árbol se marchitó porque saliste de la app. ¡El próximo crecerá!':'🎉 ¡Has plantado un '+ETAPAS_ARBOL[etapaArbol(sesion.min)][1].toLowerCase()+' en tu bosque!'+(Math.floor(sesion.min/5)?'<span class="planted-seeds">🌰 +'+Math.floor(sesion.min/5)+' semillas</span>':''))+'</div></div>':'';
  var barraNivel=horasAntes!=null?nivelProgresoHTML(horasAntes):'';
  openModal(plantado+barraNivel+'<h3>Sesión terminada</h3><div class="sub">'+fmtHoras(sesion.min)+' h en '+escapeHTML(sesion.bib.replace("Biblioteca ","").replace("Pública ",""))+(sesion.verif?' · <span class="badge-ok">✓ verificada</span>':'')+'</div>'+
    '<label style="font-size:var(--fs-s);font-weight:700;color:var(--suave);text-transform:uppercase;letter-spacing:.05em">¿Qué tal ha ido?</label>'+
    '<div class="prodstars" id="prodStars">'+[1,2,3,4,5].map(function(n){return '<button data-v="'+n+'">★</button>';}).join("")+'</div>'+
    (bibIdxDe(sesion)>=0?'<label style="display:block;margin-top:12px;font-size:var(--fs-s);font-weight:700;color:var(--suave);text-transform:uppercase;letter-spacing:.05em">¿Cómo estaba de llena?</label>'+
      '<div class="occ-quick" id="sessOcc"><button data-l="libre">🟢 Con sitio</button><button data-l="media">🟡 Media</button><button data-l="llena">🔴 Llena</button></div>':'')+
    '<div class="field" style="margin-top:10px"><input type="text" id="sessNote" placeholder="Nota opcional (ej: terminé el tema 4)"></div>'+
    '<button class="btn" id="sessSave">Guardar</button>'+
    (sesion.focus==="ok"?'<button class="btn ghost" style="margin-top:10px" onclick="compartirSesionStory(\''+sesion.id+'\')">📸 Compartir en stories</button>':'')+
    '<button class="linkbtn" id="sessSkip" style="display:block;margin:12px auto 0">Omitir</button>',
    function(){
      var bn=document.querySelector(".np-bar i");if(bn)setTimeout(function(){bn.style.width=bn.dataset.to+"%";},350);
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

/* ----- Agenda: ventana de un día (añadir y borrar eventos) ----- */
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

/* ----- Ocupación habitual de una biblioteca (tendencia de Supabase) ----- */
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

/* ----- Bienvenida diaria (Duolingo): la ventana; bienvenidaDiaria() de app.js decide si toca y la pide a los 900 ms ----- */
function pintarBienvenidaDiaria(){
  if(document.querySelector(".modal-bg")||$("storyViewer"))return;
  var h=new Date().getHours(), saludo=h<6?"Buenas noches":h<14?"Buenos días":h<21?"Buenas tardes":"Buenas noches";
  var u=(Brain.getUsers()[CURRENT]||{}).name, nombre=u&&!esInvitado()?", "+u.split(" ")[0]:"";
  var n=streakDays(), M=misionesDeHoy(), tip=TIPS[hashStr(ymd())%TIPS.length], ex=proximoExamen();
  var dEx=ex?Math.round((new Date(ex.k+"T00:00:00")-new Date(ymd()+"T00:00:00"))/864e5):null;
  openModal('<div class="bienvenida"><div class="bv-fuego'+(n?'':' apagado')+'">🔥</div><h3>'+saludo+nombre+'</h3>'+
    '<div class="sub">'+(n?'Llevas <b>'+n+(n===1?' día':' días')+'</b> de racha. ¡Que no se apague hoy!':'Hoy es un buen día para empezar una racha.')+'</div>'+
    (ex&&dEx<=14?'<div class="bv-ex">📅 <b>'+escapeHTML(ex.ev.title)+'</b> · '+(dEx===0?'¡es hoy!':dEx===1?'mañana':'en '+dEx+' días')+'</div>':'')+
    '<div class="bv-mis">🎯 Misiones de hoy: '+M.ids.map(function(id){var d=misionDef(id);return d?d.icon:'';}).join(" ")+' · cofre al completarlas</div>'+
    '<div class="bv-tip">'+tip.e+' <b>'+escapeHTML(tip.t)+'</b>: '+escapeHTML(tip.x)+'</div>'+
    '<button class="btn" onclick="closeModal();goView(\'study\');setTimeout(function(){var b=$(\'btnStart\');if(b)b.click();},250)">▶ Estudiar ahora</button>'+
    '<button class="linkbtn" onclick="closeModal()" style="display:block;margin:12px auto 0">Más tarde</button></div>');
}
