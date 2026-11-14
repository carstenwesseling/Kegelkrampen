// Termine für die Startseite („Nächster Abend“ und „Nächste Kegelabende“).
// Der Besitzer trägt bis zu drei Termine (Datum und Uhrzeit) selbst ein.
// Gespeichert in state/termine = {liste:[{datum:"YYYY-MM-DD", zeit:"HH:MM"}, …]} (siehe firestore.rules).
let TERMINE=null,TERMINE_ROH=[],TERMINE_ERR=false,TERMINE_LAD=false,TERMINE_EDIT=false;

// Aus der gespeicherten Liste die Anzeige-Objekte machen.
function terminAusListe(liste){
 return liste.map(e=>{
  const ganz=!e.zeit;
  const d=new Date(ganz?e.datum+'T00:00:00':e.datum+'T'+e.zeit+':00');
  return{d,ganz};
 });
}

async function termineLaden(){
 if(TERMINE_LAD||TERMINE!==null||TERMINE_ERR)return;
 if(!db)return; // Datenbank noch nicht bereit; startView() ruft erneut auf
 TERMINE_LAD=true;
 try{
  const s=await db.doc('state/termine').get();
  TERMINE_ROH=s.exists&&Array.isArray((s.data()||{}).liste)?(s.data().liste):[];
  TERMINE=terminAusListe(TERMINE_ROH);
 }catch(err){
  TERMINE_ERR=true;
 }finally{
  TERMINE_LAD=false;
 }
 if(typeof CUR!=='undefined'&&CUR=='#b0'&&typeof startView==='function')startView();
}

// Hinweistext, falls keine Termine angezeigt werden können (Laden, Fehler, leer). Sonst null.
function terminHinweis(){
 if(TERMINE_ERR)return'<p class="mu">Termine konnten nicht geladen werden.</p>';
 if(TERMINE===null)return'<p class="mu">Termine werden geladen …</p>';
 if(!TERMINE.length)return'<p class="mu">Kein Termin eingetragen.</p>';
 return null;
}

// Karte „Nächster Abend“: nur Datum und Uhrzeit des ersten Termins.
function naechsterHTML(){
 const h=terminHinweis();
 if(h)return h;
 const t=TERMINE[0];
 const datum=t.d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
 const zeit=t.ganz?'':' · '+t.d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+' Uhr';
 return`<p class="big">${esc(datum+zeit)}</p>`;
}

// Karte „Nächste Kegelabende“: Liste der drei Termine, nur Datum und Uhrzeit.
// Für den Besitzer zusätzlich der Knopf „Termine bearbeiten“ bzw. das Formular.
function kegelabendeHTML(){
 if(TERMINE_EDIT&&OWN)return terminFormHTML();
 const h=terminHinweis();
 const liste=h?h:`<ul class="lst termine">${TERMINE.slice(0,3).map(t=>{
  const datum=t.d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
  const zeit=t.ganz?'':' · '+t.d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+' Uhr';
  return`<li><b>${esc(datum+zeit)}</b></li>`;
 }).join('')}</ul>`;
 return liste+(OWN?`<div class="acts"><button type="button" id="termine-bearbeiten">${icon('edit')}Termine bearbeiten</button></div>`:'');
}

// Formular für drei Termine: Datum mit Kalenderauswahl, Uhrzeit optional.
function terminFormHTML(){
 const zeilen=[0,1,2].map(i=>{
  const e=TERMINE_ROH[i]||{};
  return`<div class="tf-row"><input type="date" name="d${i}" aria-label="Datum ${i+1}" value="${esc(e.datum||'')}"><input type="time" name="t${i}" aria-label="Uhrzeit ${i+1}" value="${esc(e.zeit||'')}"></div>`;
 }).join('');
 return`<form id="termine-form" class="termine-form">${zeilen}<p class="mu" id="termine-msg" role="status"></p><div class="acts"><button type="submit" class="pri">Speichern</button><button type="button" id="termine-abbrechen">Abbrechen</button></div></form>`;
}

// Speichern: leere Zeilen fallen weg, Liste nach Datum sortiert, höchstens drei Termine.
async function termineSpeichern(form){
 const msg=$('#termine-msg');
 const liste=[0,1,2].map(i=>({datum:form['d'+i].value,zeit:form['t'+i].value}))
  .filter(x=>x.datum)
  .sort((a,b)=>(a.datum+(a.zeit||'00:00')).localeCompare(b.datum+(b.zeit||'00:00')));
 try{
  await db.doc('state/termine').set({liste});
  TERMINE_ROH=liste;
  TERMINE=terminAusListe(liste);
  TERMINE_EDIT=false;
  startView();
 }catch(err){
  if(msg)msg.textContent='Speichern fehlgeschlagen: '+(err.message||err.code);
 }
}

// Zweiter Freitag eines Monats (Monat 0–11) als „YYYY-MM-DD“.
function zweiterFreitag(jahr,monat){
 const erster=new Date(Date.UTC(jahr,monat,1)).getUTCDay(); // 0 = Sonntag
 const tag=1+(5-erster+7)%7+7;
 return new Date(Date.UTC(jahr,monat,tag)).toISOString().slice(0,10);
}

// Nach dem Speichern eines Abends (nur Besitzer, siehe firestore.rules): alle Termine bis einschließlich dieses Spieltags
// entfernen und die Liste wieder auf drei Termine auffüllen. Neuer Termin = zweiter Freitag des Monats nach dem letzten
// Termin der Liste (ohne Termin: nach dem Spieltag), 19:00 Uhr. Der erste Termin der Liste ist dann „Nächster Abend“.
async function termineNachSpeichern(spieltag){
 if(!OWN||!db)return;
 let liste;
 if(TERMINE===null){
  const s=await db.doc('state/termine').get();
  liste=s.exists&&Array.isArray((s.data()||{}).liste)?s.data().liste:[];
 }else liste=TERMINE_ROH;
 liste=liste.filter(e=>e.datum&&e.datum>spieltag);
 while(liste.length<3){
  const [j,m]=(liste.length?liste[liste.length-1].datum:spieltag).split('-').map(Number);
  liste.push({datum:zweiterFreitag(m==12?j+1:j,m%12),zeit:'19:00'}); // m ist 1-basiert, also m = Folgemonat (0-basiert)
 }
 await db.doc('state/termine').set({liste});
 TERMINE_ROH=liste;TERMINE=terminAusListe(liste);TERMINE_EDIT=false;
}

// Klicks und Absenden für Bearbeiten, Abbrechen und Speichern.
document.addEventListener('click',e=>{
 if(e.target.closest('#termine-bearbeiten')){TERMINE_EDIT=true;startView();return}
 if(e.target.closest('#termine-abbrechen')){TERMINE_EDIT=false;startView();return}
});
document.addEventListener('submit',e=>{
 if(e.target.id!=='termine-form')return;
 e.preventDefault();
 const btn=e.target.querySelector('button[type=submit]');
 busy(btn,termineSpeichern(e.target));
});
