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
