//TOUR-START
let TO=null,TYR='',TUY='',TUP=false,TNOTE='',TCT=0,TMV=null,TNY=false,AS;const TEY=new Set(),TSEL=new Set();
const tT=(p,ms=10000)=>Promise.race([p,new Promise(r=>setTimeout(()=>r(null),ms))]);
const tsrc=id=>window.kkBlobUrl(id);
const tSort=(a,b)=>(a.taken||0)-(b.taken||0)||String(a.name||'').localeCompare(String(b.name||''),'de',{numeric:true});
const tYears=()=>[...new Set(TO.map(t=>+t.year))].sort((a,b)=>b-a);
const tList=y=>TO.filter(t=>t.aid&&+t.year==+y).sort(tSort);
const tImgN=()=>TO.filter(t=>t.aid).length;
const tMB=b=>b>=1073741824?(b/1073741824).toLocaleString('de-DE',{maximumFractionDigits:1})+' GB':(b/1048576).toLocaleString('de-DE',{maximumFractionDigits:1})+' MB';
async function tour(){
 const el=$('#tour');
 if(TO===null){
  el.innerHTML='<h2 id="t-tab">Kegeltouren</h2><p class="mu">Bilder werden geladen …</p>';
  let list=null;
  if(db){try{const s=await tT(db.collection('touren').get());if(s)list=s.docs.map(x=>({...clean(x.data()),id:x.id}))}catch(e){}}
  if(list===null){el.innerHTML='<h2 id="t-tab">Kegeltouren</h2><p class="note">'+(db?'Die Bilder konnten nicht geladen werden. Bitte den Menüpunkt später noch einmal öffnen.':'Keine Datenbank verbunden. Bitte später noch einmal versuchen.')+'</p>';return}
  TO=list}
 if(OWN&&AS===undefined){try{AS=window.claude?await tT(window.claude.use('assets')):null}catch(e){AS=null}}
 tourView()}
function tourView(msg){
 const el=$('#tour'),can=!!(OWN&&AS&&db),yrs=tYears().filter(y=>can||tList(y).length);
 if(TYR&&!yrs.includes(+TYR))TYR='';
 [...TEY].forEach(y=>{if(!yrs.includes(y))TEY.delete(y)});[...TSEL].forEach(i=>{if(!TO.some(t=>t.id==i))TSEL.delete(i)});
 const vis=TYR?yrs.filter(y=>y==TYR):yrs;
 let h='<h2 id="t-tab">Kegeltouren</h2>';
 if(!yrs.length)h+='<p class="note">Noch keine Bilder vorhanden.'+''+'</p>';
 {const cy=new Date().getFullYear();
  if(yrs.length||can)h+=`<div class="top">${yrs.length?`<label>Jahr <select id="tyr"><option value="">Alle (${tImgN()} Bilder)</option>${yrs.map(y=>`<option value="${y}"${y==TYR?' selected':''}>${y} (${tList(y).length})</option>`).join('')}</select></label>`:''}${can?'<button type="button" data-ny>＋ Neues Jahr</button>':''}</div>`;
  if(can&&TNY)h+=`<div class="top te"><label>Neues Jahr <input type="number" id="te-new" min="1990" max="2100" step="1" inputmode="numeric" value="${yrs.includes(cy)?Math.max(...yrs)+1:cy}"></label><button type="button" class="pri" data-nygo>Jahr anlegen</button><button type="button" data-nyc>Abbrechen</button><span class="mu">Das leere Jahr erscheint hier; Bilder lassen sich danach hinzufügen.</span></div>`}
 vis.forEach(y=>{const l=tList(y),ed=can&&TEY.has(+y),n=l.filter(t=>TSEL.has(t.id)).length;
  h+=`<section class="ty${ed?' ed':''}" data-yr="${y}"><h2 id="t-y${y}">${y} <span class="mu">${l.length} ${l.length==1?'Bild':'Bilder'}</span></h2><div class="top">${l.length?`<button type="button" class="pri" data-show="${y}">▶ Diashow ${y}</button>`:''}${can?`<button type="button" data-edit="${y}" aria-pressed="${ed}">${ed?'✓ Fertig':'✎ Jahr bearbeiten'}</button>`:''}</div>`
  +(ed?`<div class="top te"><button type="button" data-add="${y}">＋ Bilder hinzufügen</button><button type="button" data-all="${y}"${l.length?'':' disabled'}>${l.length&&n==l.length?'Auswahl aufheben':'Alle auswählen'}</button><button type="button" class="dng" data-del="${y}"${n?'':' disabled'}>Auswahl löschen (${n})</button></div><div class="top te"><button type="button" data-yr-edit="${y}">✎ Jahreszahl ändern</button><button type="button" data-mvsel="${y}"${n?'':' disabled'}>Auswahl verschieben (${n})</button>${l.length?'':`<button type="button" class="dng" data-rmy="${y}">Jahr entfernen</button>`}</div>`+(TMV&&TMV.y==+y?`<div class="top te mv"><label>${TMV.mode=='year'?'Neue Jahreszahl':'Verschieben nach Jahr'} <input type="number" id="te-ny" min="1990" max="2100" step="1" inputmode="numeric" value="${TMV.v==null?'':TMV.v}"></label><button type="button" class="pri" data-go>${tGoLbl()}</button><button type="button" data-cancel>Abbrechen</button><span class="mu" id="te-nh">${esc(tMvHint(y,l.length,n))}</span></div>`:'')+`<p class="mu te-h">Bilder antippen zum Auswählen, Dateien hierher ziehen zum Hinzufügen.</p>`:'')
  +`<div class="tg">${l.map((t,i)=>ed?`<button type="button" class="tt${TSEL.has(t.id)?' sel':''}" data-sel="${esc(t.id)}" aria-pressed="${TSEL.has(t.id)}" aria-label="${y}, Bild ${i+1} von ${l.length} auswählen"><img src="${tsrc(t.tid||t.aid)}" alt="" loading="lazy" decoding="async"><span class="ck" aria-hidden="true">✓</span></button>`:`<button type="button" class="tt" data-open="${esc(t.id)}" aria-label="${y}, Bild ${i+1} von ${l.length} einzeln anzeigen"><img src="${tsrc(t.tid||t.aid)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div></section>`})
 if(can)h+=`<h2 id="t-up">Bilder hinzufügen</h2><div class="dz" id="tu-dz"><p class="dzh"><b>Bilder hierher ziehen</b></p><div class="top"><label>Jahr <input type="number" id="tu-y" min="1990" max="2100" step="1" inputmode="numeric" value="${TUY||TYR||yrs[0]||new Date().getFullYear()}"></label><button type="button" class="pri" id="tu-b">Bilder auswählen und hochladen</button><input type="file" id="tu-f" accept="image/*" multiple hidden></div></div><p class="mu" id="tu-m" role="status" aria-live="polite">${msg||''}</p><p class="mu" id="tu-u"></p>`;
 if(can)h+='<input type="file" id="te-f" accept="image/*" multiple hidden>';;
 el.innerHTML=h;
 SUB['#b7']=[['t-tab','Übersicht'],...vis.map(y=>[`t-y${y}`,String(y)]),...(can?[['t-up','Hochladen']]:[])];
 if(CUR=='#b7')sub();
 if(can)tUsage()}
async function tUsage(){
 try{const r=await tT(AS.list());const e=$('#tu-u');if(r&&r.usage&&e)e.textContent=`Speicher: ${tMB(r.usage.bytes)} von ${tMB(r.usage.maxBytes)} belegt (${r.usage.files} von ${r.usage.maxFiles} Dateien; pro Bild werden Original und Miniatur gespeichert).`}catch(e){}}
async function tScale(file,max,q){
 let bm;try{bm=await createImageBitmap(file,{imageOrientation:'from-image'})}catch(e){bm=await createImageBitmap(file)}
 const r=Math.min(1,max/Math.max(bm.width,bm.height)),w=Math.max(1,Math.round(bm.width*r)),h=Math.max(1,Math.round(bm.height*r)),c=document.createElement('canvas');
 c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(bm,0,0,w,h);if(bm.close)bm.close();
 return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('Umwandlung fehlgeschlagen')),'image/jpeg',q))}
const TOK=['image/jpeg','image/png','image/gif','image/webp'];
const tSay=(t,keep)=>{const e=$('#tu-m');if(e)e.textContent=t;TDH.textContent=t;TDH.hidden=false;clearTimeout(TDH.t);if(!keep)TDH.t=setTimeout(()=>{if(!TUP)TDH.hidden=true},7000)};
async function tUpload(files,year){
 if(TUP){TNOTE=' · Weitere Bilder erst nach Abschluss des Uploads hinzufügen.';tSay('Es läuft noch ein Upload – bitte kurz warten.',true);return}
 const fld=$('#tu-y'),y=Math.round(year!=null?+year:+(fld&&fld.value));
 if(!(y>=1990&&y<=2100)){tSay('Bitte ein Jahr zwischen 1990 und 2100 eingeben.');return}
 const L=[...files].filter(f=>/^image\//.test(f.type)||/\.(jpe?g|png|gif|webp|avif|heic|heif)$/i.test(f.name));
 if(!L.length){tSay('Es wurden keine Bilddateien ausgewählt.');return}
 if(!AS||!db){tSay('Hochladen ist hier nicht möglich.');return}
 TUP=true;TUY=String(y);const b0=$('#tu-b');if(b0)b0.disabled=true;
 const fail=[];let ok=0;
 try{for(let i=0;i<L.length;i++){
  const f=L[i];tSay(`Bild ${i+1} von ${L.length} wird hochgeladen … (${f.name})${TNOTE}`,true);
  let a=null;
  try{
   let full=f;
   if(!TOK.includes(f.type)||f.size>19.5*1048576)full=await tScale(f,f.size>19.5*1048576?4096:100000,.92);
   let th=null;try{th=await tScale(f,480,.82)}catch(e){}
   a=await AS.upload(full);
   let t=null;if(th){try{t=await AS.upload(th)}catch(e){}}
   const id='t'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),doc={year:y,aid:a.id,...(t?{tid:t.id}:{}),name:f.name,taken:f.lastModified||Date.now(),ts:Date.now()};
   try{await db.doc('touren/'+id).set(doc)}catch(e){try{await AS.delete(a.id);if(t)await AS.delete(t.id)}catch(x){}throw e}
   TO.push({...doc,id});ok++
  }catch(e){fail.push(`${f.name} (${e&&e.code==='too_large'?'zu groß':e&&e.code==='unsupported_type'?'Format nicht unterstützt':e&&e.code==='quota_or_state'?'Speicher voll':(e&&(e.message||e.code))||'Fehler'})`)}}
  if(ok)await tUnmark(y)}
 finally{TUP=false;TNOTE=''}
 if(ok&&TYR&&+TYR!==y)TYR='';
 const msg=(ok?`${ok} ${ok==1?'Bild':'Bilder'} für ${y} hochgeladen.`:'Es wurde nichts hochgeladen.')+(fail.length?` Nicht hochgeladen: ${fail.join('; ')}.`:'');
 tourView(msg);tSay(msg)}
function tSelUpdate(y){
 const s=document.querySelector(`.ty[data-yr="${y}"]`);if(!s)return;
 const l=tList(y),n=l.filter(t=>TSEL.has(t.id)).length;
 s.querySelectorAll('[data-sel]').forEach(b=>{const on=TSEL.has(b.dataset.sel);b.classList.toggle('sel',on);b.setAttribute('aria-pressed',on)});
 const d=s.querySelector('[data-del]');if(d){d.disabled=!n;d.dataset.c='';d.classList.remove('conf');d.textContent=`Auswahl löschen (${n})`}
 const a=s.querySelector('[data-all]');if(a)a.textContent=l.length&&n==l.length?'Auswahl aufheben':'Alle auswählen';
 const m=s.querySelector('[data-mvsel]');if(m){m.disabled=!n;m.textContent=`Auswahl verschieben (${n})`}
 const hh=s.querySelector('#te-nh');if(hh&&TMV&&TMV.y==+y)hh.textContent=tMvHint(y,l.length,n)}
async function tDelSel(y){
 if(TUP){tSay('Es läuft noch ein Vorgang – bitte kurz warten.');return}
 const L=tList(y).filter(t=>TSEL.has(t.id));if(!L.length||!db||!AS)return;
 TUP=true;let ok=0;const fail=[];
 try{for(let i=0;i<L.length;i++){
  const t=L[i];tSay(`Bild ${i+1} von ${L.length} wird gelöscht …`,true);
  try{await db.doc('touren/'+t.id).delete();TO=TO.filter(x=>x.id!==t.id);TSEL.delete(t.id);ok++;
   for(const a of [t.aid,t.tid].filter(Boolean)){try{await AS.delete(a)}catch(e){}}
  }catch(e){fail.push(`${t.name||t.id} (${(e&&(e.message||e.code))||'Fehler'})`)}}}
 finally{TUP=false}
 const msg=(ok?`${ok} ${ok==1?'Bild':'Bilder'} aus ${y} gelöscht.`:'Es wurde nichts gelöscht.')+(fail.length?` Nicht gelöscht: ${fail.join('; ')}.`:'');
 tourView(msg);tSay(msg)}
const tGo=y=>{const e=document.getElementById('t-y'+y);if(e)e.scrollIntoView({block:'start'})};
const tGoLbl=()=>TMV.conf?`Ja, mit ${TMV.t} zusammenführen`:TMV.mode=='year'?'Jahreszahl ändern':'Verschieben';
function tMvHint(y,total,n){
 if(TMV&&TMV.msg)return TMV.msg;
 if(TMV&&TMV.conf)return `${TMV.t} hat schon Bilder. Mit „Ja“ kommen alle ${total} Bilder von ${y} dazu.`;
 return TMV&&TMV.mode=='year'?`Alle ${total} ${total==1?'Bild':'Bilder'} von ${y} kommen in die neue Jahreszahl. Gibt es das Jahr schon, werden die Bilder zusammengeführt.`:`Die ${n} ausgewählten ${n==1?'Bild wird':'Bilder werden'} in dieses Jahr verschoben. Gibt es das Jahr noch nicht, wird es angelegt.`}
async function tUnmark(y){for(const t of TO.filter(x=>!x.aid&&+x.year==+y)){try{await db.doc('touren/'+t.id).delete();TO=TO.filter(x=>x.id!==t.id)}catch(e){}}}
function tFocus(sel){const e=$(sel);if(e){e.focus({preventScroll:true});if(e.select)e.select()}}
async function tNewYear(){
 const inp=$('#te-new'),y=Math.round(+(inp&&inp.value));
 if(!(y>=1990&&y<=2100)){tSay('Bitte ein Jahr zwischen 1990 und 2100 eingeben.');return}
 if(tYears().includes(y)){TNY=false;if(TYR&&+TYR!==y)TYR='';TEY.add(y);tourView(`${y} gibt es schon.`);tSay(`${y} gibt es schon.`);tGo(y);return}
 const id='y'+y,d={year:y,marker:1,ts:Date.now()};
 try{await db.doc('touren/'+id).set(d)}catch(e){tSay('Anlegen fehlgeschlagen: '+((e&&(e.message||e.code))||'Fehler'));return}
 TO.push({...d,id});TNY=false;if(TYR&&+TYR!==y)TYR='';TEY.add(y);
 const msg=`${y} wurde angelegt – jetzt Bilder hinzufügen.`;tourView(msg);tSay(msg);tGo(y)}
async function tMvGo(){
 if(!TMV)return;if(TUP){tSay('Es läuft noch ein Vorgang – bitte kurz warten.');return}
 const y=TMV.y,inp=$('#te-ny'),ny=Math.round(+(inp&&inp.value));
 const bad=m=>{TMV.msg=m;TMV.conf=false;TMV.v=inp?inp.value:'';tourView();tFocus('#te-ny')};
 if(!(ny>=1990&&ny<=2100))return bad('Bitte ein Jahr zwischen 1990 und 2100 eingeben.');
 if(ny==y)return bad('Das ist schon dieses Jahr – bitte eine andere Jahreszahl eingeben.');
 const src=TMV.mode=='year'?tList(y):tList(y).filter(t=>TSEL.has(t.id));
 if(TMV.mode=='year'&&!src.length){
  if(tYears().includes(ny))return bad(`${ny} gibt es schon.`);
  if(!db)return;TUP=true;
  try{const d={year:ny,marker:1,ts:Date.now()};await db.doc('touren/y'+ny).set(d);TO.push({...d,id:'y'+ny});await tUnmark(y)}
  catch(e){TUP=false;return bad('Ändern fehlgeschlagen: '+((e&&(e.message||e.code))||'Fehler'))}
  TUP=false;TMV=null;TEY.delete(y);TEY.add(ny);if(TYR&&+TYR==y)TYR=String(ny);
  const msg=`Jahr ${y} heißt jetzt ${ny}.`;tourView(msg);tSay(msg);tGo(ny);return}
 if(!src.length)return bad('Es sind keine Bilder zum Verschieben vorhanden.');
 if(TMV.mode=='year'&&tList(ny).length&&!(TMV.conf&&TMV.t==ny)){TMV.conf=true;TMV.t=ny;TMV.v=ny;TMV.msg='';tourView();tFocus('[data-go]');return}
 if(!db||!AS)return;
 TUP=true;const mode=TMV.mode;let ok=0;const fail=[];
 try{for(let i=0;i<src.length;i++){
  const t=src[i];tSay(`Bild ${i+1} von ${src.length} wird nach ${ny} verschoben …`,true);
  try{const{id,...d}=t;await db.doc('touren/'+id).set({...d,year:ny});t.year=ny;TSEL.delete(id);ok++}catch(e){fail.push(`${t.name||t.id} (${(e&&(e.message||e.code))||'Fehler'})`)}}
  if(ok){await tUnmark(ny);if(mode=='year')await tUnmark(y)}}
 finally{TUP=false}
 TMV=null;
 if(mode=='year'&&!fail.length){TEY.delete(y);TEY.add(ny);if(TYR&&+TYR==y)TYR=String(ny);if(TUY==String(y))TUY=String(ny)}
 else if(ok&&TYR&&+TYR!==ny&&+TYR!==y)TYR='';
 const msg=(ok?(mode=='year'?`Jahr ${y} heißt jetzt ${ny} (${ok} ${ok==1?'Bild':'Bilder'}).`:`${ok} ${ok==1?'Bild':'Bilder'} nach ${ny} verschoben.`):'Es wurde nichts verschoben.')+(fail.length?` Nicht verschoben: ${fail.join('; ')}.`:'');
 tourView(msg);tSay(msg);if(ok)tGo(mode=='year'&&!fail.length?ny:y)}
//TOUR-VIEWER
const VW={list:[],i:0,mode:'single',play:false,timer:null,idle:null,tok:0,fs:false,fsAuto:false,del:false,delT:null,from:null};
const TV=document.createElement('div');TV.id='tv';TV.className='tv';TV.hidden=true;TV.setAttribute('role','dialog');TV.setAttribute('aria-modal','true');TV.setAttribute('aria-label','Bildansicht');
TV.innerHTML='<div class="tvs" id="tvs"><img id="tvi" alt=""></div><div class="tvb" id="tvb"><span class="tvc" id="tvc" aria-live="polite"></span><span class="sp"></span><button type="button" id="tvp"></button><select id="tvt" aria-label="Sekunden pro Bild" hidden><option value="3">3 s pro Bild</option><option value="5" selected>5 s pro Bild</option><option value="8">8 s pro Bild</option><option value="12">12 s pro Bild</option></select><button type="button" id="tvf" hidden>Vollbild</button><a class="ab" id="tvo" target="_blank" rel="noopener">Original öffnen</a><button type="button" id="tvd" hidden>Löschen</button><button type="button" id="tvx" aria-label="Schließen">✕ Schließen</button></div><button type="button" class="tvn l" id="tvl" aria-label="Vorheriges Bild">‹</button><button type="button" class="tvn r" id="tvr" aria-label="Nächstes Bild">›</button><div class="tvm" id="tvm" role="status"></div><div class="tvg" id="tvg"></div>';
document.body.append(TV);
const tv=id=>TV.querySelector('#'+id);
try{const s=localStorage.getItem('kc-tour-sek');if(s&&[...tv('tvt').options].some(o=>o.value==s))tv('tvt').value=s}catch(e){}
const tvMs=()=>(+tv('tvt').value||5)*1000;
function tvLbl(){
 const p=tv('tvp');p.textContent=VW.mode=='show'?(VW.play?'⏸ Pause':'▶ Weiter'):'▶ Diashow';
 tv('tvt').hidden=VW.mode!='show';
 tv('tvf').hidden=!(document.fullscreenEnabled||document.webkitFullscreenEnabled);tv('tvf').textContent=(document.fullscreenElement||document.webkitFullscreenElement)?'Vollbild beenden':'Vollbild';
 const can=!!(OWN&&AS&&db)&&VW.mode=='single';tv('tvd').hidden=!can;tv('tvd').textContent=VW.del?'Endgültig löschen':'Löschen';tv('tvd').classList.toggle('dn',VW.del);
 const many=VW.list.length>1;tv('tvl').hidden=tv('tvr').hidden=!many}
function tvBar(on){
 const g=tv('tvg');g.style.transition='none';g.style.width='0';
 if(on){void g.offsetWidth;g.style.transition=`width ${tvMs()}ms linear`;g.style.width='100%'}}
function tvIdle(){
 clearTimeout(VW.idle);TV.classList.remove('idle');
 if(VW.mode=='show'&&VW.play)VW.idle=setTimeout(()=>TV.classList.add('idle'),3000)}
function tvSched(tok){
 clearTimeout(VW.timer);tvBar(false);
 if(tok!==VW.tok||VW.mode!='show'||!VW.play||VW.list.length<2)return;
 tvBar(true);VW.timer=setTimeout(()=>tvStep(1,true),tvMs())}
function tvShow(){
 const t=VW.list[VW.i],img=tv('tvi'),tok=++VW.tok;
 clearTimeout(VW.timer);tvBar(false);VW.del=false;clearTimeout(VW.delT);
 tv('tvc').textContent=`${VW.i+1} / ${VW.list.length} · ${t.year}`;
 tv('tvo').href=tsrc(t.aid);tv('tvm').textContent='';
 if(VW.mode=='single'&&t.tid){img.src=tsrc(t.tid);img.classList.remove('ld')}else img.classList.add('ld');
 const full=new Image();
 full.onload=()=>{if(tok!==VW.tok)return;img.src=full.src;img.alt=`Kegeltour ${t.year}, Bild ${VW.i+1} von ${VW.list.length}`;img.classList.remove('ld');tvSched(tok)};
 full.onerror=()=>{if(tok!==VW.tok)return;img.classList.remove('ld');tv('tvm').textContent='Dieses Bild konnte nicht geladen werden.';tvSched(tok)};
 full.src=tsrc(t.aid);
 if(VW.list.length>1){const n=VW.list[(VW.i+1)%VW.list.length];(new Image()).src=tsrc(n.aid)}
 tvLbl()}
function tvStep(d,auto){const n=VW.list.length;if(!n)return;VW.i=(VW.i+d+n)%n;tvShow();if(!auto)tvIdle()}
function tvFS(on){
 const d=document;
 if(on){const r=TV.requestFullscreen||TV.webkitRequestFullscreen;if(r&&(d.fullscreenEnabled||d.webkitFullscreenEnabled)){try{const p=r.call(TV);if(p&&p.catch)p.catch(()=>{})}catch(e){}}}
 else if(d.fullscreenElement||d.webkitFullscreenElement){try{(d.exitFullscreen||d.webkitExitFullscreen).call(d)}catch(e){}}}
function tvOpen(list,i,mode,opener){
 Object.assign(VW,{list,i,mode,play:mode=='show',del:false,from:opener||null,fsAuto:mode=='show'});
 TV.hidden=false;document.body.style.overflow='hidden';
 if(mode=='show')tvFS(true);
 tvShow();tvIdle();tv(mode=='show'?'tvp':'tvx').focus({preventScroll:true})}
function tvClose(){
 if(TV.hidden)return;
 VW.tok++;clearTimeout(VW.timer);clearTimeout(VW.idle);clearTimeout(VW.delT);VW.fsAuto=false;
 tvFS(false);TV.hidden=true;document.body.style.overflow='';TV.classList.remove('idle');tvBar(false);
 const im=tv('tvi');im.removeAttribute('src');
 const t=VW.list[VW.i],f=VW.from&&document.contains(VW.from)?VW.from:(t?document.querySelector(`[data-open="${t.id}"]`):null);
 if(f)f.focus({preventScroll:true})}
function tvPlay(){
 if(VW.mode!='show'){VW.mode='show';VW.play=true;VW.fsAuto=true;tvFS(true);tvShow()}
 else{VW.play=!VW.play;if(VW.play)tvShow();else{clearTimeout(VW.timer);tvBar(false);tvLbl()}}
 tvIdle()}
async function tvDel(){
 const t=VW.list[VW.i];if(!t||!db)return;const b=tv('tvd');b.disabled=true;
 try{await db.doc('touren/'+t.id).delete()}catch(e){b.disabled=false;VW.del=false;tv('tvm').textContent='Löschen fehlgeschlagen: '+((e&&(e.message||e.code))||'Fehler');tvLbl();return}
 for(const id of [t.aid,t.tid].filter(Boolean)){try{await AS.delete(id)}catch(e){}}
 TO=TO.filter(x=>x.id!==t.id);TSEL.delete(t.id);VW.list.splice(VW.i,1);b.disabled=false;
 tourView();
 if(!VW.list.length){tvClose();return}
 VW.i=Math.min(VW.i,VW.list.length-1);VW.from=null;tvShow()}
$('#tour').addEventListener('click',e=>{
 const q=sel=>e.target.closest(sel);
 if(q('[data-ny]')){TNY=true;tourView();tFocus('#te-new');return}
 if(q('[data-nyc]')){TNY=false;tourView();return}
 if(q('[data-nygo]')){tNewYear();return}
 const ye=q('[data-yr-edit]');if(ye){const y=+ye.dataset.yrEdit;TMV={y,mode:'year',v:y};tourView();tFocus('#te-ny');return}
 const ms=q('[data-mvsel]');if(ms){const y=+ms.dataset.mvsel;if(!tList(y).some(t=>TSEL.has(t.id)))return;TMV={y,mode:'sel',v:''};tourView();tFocus('#te-ny');return}
 if(q('[data-go]')){tMvGo();return}
 if(q('[data-cancel]')){TMV=null;tourView();return}
 const rm=q('[data-rmy]');if(rm){const y=+rm.dataset.rmy;tUnmark(y).then(()=>{TEY.delete(y);const msg=`${y} wurde entfernt.`;tourView(msg);tSay(msg)});return}
 const eb=e.target.closest('[data-edit]');
 if(eb){const y=+eb.dataset.edit;if(TEY.has(y)){TEY.delete(y);if(TMV&&TMV.y==y)TMV=null;tList(y).forEach(t=>TSEL.delete(t.id))}else TEY.add(y);tourView();const nb=document.querySelector(`[data-edit="${y}"]`);if(nb)nb.focus({preventScroll:true});return}
 const ab=e.target.closest('[data-add]');
 if(ab){const f=$('#te-f');if(f){f.dataset.y=ab.dataset.add;f.click()}return}
 const sb=e.target.closest('[data-sel]');
 if(sb){const id=sb.dataset.sel,t=TO.find(x=>x.id==id);if(!t)return;if(TSEL.has(id))TSEL.delete(id);else TSEL.add(id);tSelUpdate(t.year);return}
 const lb=e.target.closest('[data-all]');
 if(lb){const y=+lb.dataset.all,l=tList(y),all=l.every(t=>TSEL.has(t.id));l.forEach(t=>all?TSEL.delete(t.id):TSEL.add(t.id));tSelUpdate(y);return}
 const db2=e.target.closest('[data-del]');
 if(db2){const y=+db2.dataset.del,n=tList(y).filter(t=>TSEL.has(t.id)).length;if(!n)return;
  if(db2.dataset.c!=='1'){db2.dataset.c='1';db2.classList.add('conf');db2.textContent=`Endgültig löschen (${n})`;clearTimeout(TCT);TCT=setTimeout(()=>tSelUpdate(y),5000)}
  else{clearTimeout(TCT);tDelSel(y)}
  return}
 const o=e.target.closest('[data-open]');
 if(o){const t=TO.find(x=>x.id==o.dataset.open);if(!t)return;const l=tList(t.year);tvOpen(l,Math.max(0,l.findIndex(x=>x.id==t.id)),'single',o);return}
 const s=e.target.closest('[data-show]');
 if(s){const l=tList(s.dataset.show);if(l.length)tvOpen(l,0,'show',s);return}
 const u=e.target.closest('#tu-b');if(u){$('#tu-f').click()}});
$('#tour').addEventListener('keydown',e=>{
 if(e.target.id=='te-ny'){if(e.key=='Enter'){e.preventDefault();tMvGo()}else if(e.key=='Escape'){TMV=null;tourView()}}
 else if(e.target.id=='te-new'){if(e.key=='Enter'){e.preventDefault();tNewYear()}else if(e.key=='Escape'){TNY=false;tourView()}}});
$('#tour').addEventListener('input',e=>{
 if(e.target.id=='te-ny'&&TMV){TMV.v=e.target.value;TMV.msg='';if(TMV.conf){TMV.conf=false;const g=$('[data-go]');if(g)g.textContent=tGoLbl()}const hh=$('#te-nh');if(hh)hh.textContent=tMvHint(TMV.y,tList(TMV.y).length,tList(TMV.y).filter(t=>TSEL.has(t.id)).length)}});
$('#tour').addEventListener('change',e=>{
 if(e.target.id=='tyr'){TYR=e.target.value;TUY='';tourView();const s=$('#tyr');if(s)s.focus({preventScroll:true});return}
 if(e.target.id=='tu-y')TUY=e.target.value;
 if(e.target.id=='te-f'){const f=[...e.target.files],y=+e.target.dataset.y;e.target.value='';if(f.length&&y)tUpload(f,y);return}
 if(e.target.id=='tu-f'){const f=[...e.target.files];e.target.value='';if(f.length)tUpload(f)}});
//TOUR-DROP
const TDH=document.createElement('div');TDH.className='tdh';TDH.hidden=true;TDH.setAttribute('role','status');TDH.setAttribute('aria-live','polite');document.body.append(TDH);
const tFiles=e=>{const t=e.dataTransfer&&e.dataTransfer.types;return !!t&&[...t].includes('Files')};
const tCan=()=>!!(OWN&&AS&&db);
const tIn=e=>!!(e.target&&e.target.closest&&e.target.closest('#tour'));
let TDE=null;
function tDragOff(){if(TDE){TDE.classList.remove('dz-on');TDE=null}if(!TUP)TDH.hidden=true}
function tDragOn(el,y){
 if(TDE!==el){if(TDE)TDE.classList.remove('dz-on');TDE=el;if(el)el.classList.add('dz-on')}
 if(TUP)return;
 const f=$('#tu-y');TDH.textContent='Loslassen zum Hochladen in '+(y||(f&&f.value)||'das gewählte Jahr');TDH.hidden=false;clearTimeout(TDH.t)}
function tTarget(e){const n=e.target,s=n.closest('.ty');if(s)return[s,+s.dataset.yr];const z=n.closest('#tu-dz');return z?[z,null]:[null,null]}
function tCollect(dt){
 const files=[...(dt.files||[])],ents=[...(dt.items||[])].filter(i=>i.kind==='file').map(i=>i.webkitGetAsEntry?i.webkitGetAsEntry():null);
 if(!ents.length||!ents.every(Boolean)||!ents.some(en=>en.isDirectory))return Promise.resolve(files);
 return(async()=>{const out=[];
  const walk=async(en,d)=>{
   if(en.isFile){await new Promise(r=>en.file(f=>{out.push(f);r()},()=>r()))}
   else if(en.isDirectory&&d<4){const rd=en.createReader();for(;;){const part=await new Promise(r=>rd.readEntries(r,()=>r([])));if(!part.length)break;for(const c of part)await walk(c,d+1)}}};
  for(const en of ents)await walk(en,0);
  return out})()}
document.addEventListener('dragover',e=>{
 if(!tFiles(e))return;e.preventDefault();
 if(tIn(e)&&tCan()){e.dataTransfer.dropEffect='copy';const[el,y]=tTarget(e);tDragOn(el,y)}
 else{e.dataTransfer.dropEffect='none';tDragOff()}});
document.addEventListener('dragleave',e=>{if(!tFiles(e))return;const r=e.relatedTarget;if(!r||!r.closest||!r.closest('#tour'))tDragOff()});
document.addEventListener('dragend',tDragOff);
document.addEventListener('drop',e=>{
 if(!tFiles(e))return;e.preventDefault();tDragOff();
 if(!(tIn(e)&&tCan()))return;
 const y=tTarget(e)[1];
 tCollect(e.dataTransfer).then(fl=>{if(fl.length)tUpload(fl,y);else tSay('Es wurden keine Bilddateien gefunden.')})});
//TOUR-DROP-END
TV.addEventListener('click',e=>{
 const id=e.target.closest('button,a')?.id;
 if(id=='tvx')tvClose();else if(id=='tvl')tvStep(-1);else if(id=='tvr')tvStep(1);else if(id=='tvp')tvPlay();
 else if(id=='tvf'){tvFS(!(document.fullscreenElement||document.webkitFullscreenElement));VW.fsAuto=false;setTimeout(tvLbl,300)}
 else if(id=='tvd'){if(!VW.del){VW.del=true;tvLbl();clearTimeout(VW.delT);VW.delT=setTimeout(()=>{VW.del=false;tvLbl()},5000)}else tvDel()}
 else if(!id&&VW.mode=='single'&&(e.target===TV||e.target.id=='tvs'))tvClose();
 tvIdle()});
TV.addEventListener('change',e=>{if(e.target.id=='tvt'){try{localStorage.setItem('kc-tour-sek',e.target.value)}catch(x){}if(VW.mode=='show'&&VW.play)tvSched(VW.tok);tvIdle()}});
TV.addEventListener('pointermove',tvIdle);
let TVX=null;
TV.addEventListener('pointerdown',e=>{TVX=e.target.closest('button,a,select')?null:[e.clientX,e.clientY];tvIdle()});
TV.addEventListener('pointerup',e=>{if(!TVX)return;const dx=e.clientX-TVX[0],dy=e.clientY-TVX[1];TVX=null;if(Math.abs(dx)>50&&Math.abs(dy)<80)tvStep(dx>0?-1:1)});
document.addEventListener('keydown',e=>{
 if(TV.hidden)return;
 if(e.key=='Escape'){if(VW.del){VW.del=false;tvLbl()}else tvClose();e.preventDefault();return}
 if(e.key=='ArrowRight'){tvStep(1);e.preventDefault();return}
 if(e.key=='ArrowLeft'){tvStep(-1);e.preventDefault();return}
 if(e.key==' '&&!e.target.closest('button,select,a')){if(VW.mode=='show')tvPlay();e.preventDefault();return}
 if(e.key=='f'||e.key=='F'){if(!e.target.closest('select')){tvFS(!(document.fullscreenElement||document.webkitFullscreenElement));VW.fsAuto=false;e.preventDefault()}return}
 if(e.key=='Tab'){const f=[...TV.querySelectorAll('button,a,select')].filter(x=>!x.hidden&&!x.disabled&&x.offsetParent!==null);if(!f.length)return;const a=document.activeElement,i=f.indexOf(a);
  if(e.shiftKey&&(i<=0)){f[f.length-1].focus();e.preventDefault()}else if(!e.shiftKey&&(i==f.length-1||i<0)){f[0].focus();e.preventDefault()}}});
['fullscreenchange','webkitfullscreenchange'].forEach(n=>document.addEventListener(n,()=>{
 if(!(document.fullscreenElement||document.webkitFullscreenElement)&&VW.fsAuto&&!TV.hidden){tvClose();return}
 if(!TV.hidden)tvLbl()}));
//TOUR-END
