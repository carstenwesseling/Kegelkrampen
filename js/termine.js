// Google-Kalender für die Startseite: die nächsten Termine.
// Abruf über die Google Calendar API (öffentlicher Kalender, Schlüssel und ID in js/config.js).
// Fehler oder fehlende Konfiguration führen nicht zu einer Exception, die Karten zeigen dann einen Hinweis.
let TERMINE=null,TERMINE_ERR=false,TERMINE_LAD=false;

function termin(e){
 const ganz=!!e.start.date;
 const d=ganz?new Date(e.start.date+'T00:00:00'):new Date(e.start.dateTime);
 return{titel:e.summary||'(ohne Titel)',ort:e.location||'',d,ganz};
}

async function termineLaden(){
 if(TERMINE_LAD||TERMINE!==null||TERMINE_ERR)return;
 if(!GCAL_ID||!GCAL_KEY){TERMINE_ERR=true;return}
 TERMINE_LAD=true;
 try{
  const u=new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GCAL_ID)}/events`);
  u.search=new URLSearchParams({key:GCAL_KEY,timeMin:new Date().toISOString(),maxResults:'5',singleEvents:'true',orderBy:'startTime'});
  const r=await fetch(u);
  if(!r.ok)throw new Error('HTTP '+r.status);
  const j=await r.json();
  TERMINE=(j.items||[]).filter(e=>e.status!=='cancelled'&&e.start).map(termin);
 }catch(err){
  TERMINE_ERR=true;
 }finally{
  TERMINE_LAD=false;
 }
 if(typeof CUR!=='undefined'&&CUR=='#b0'&&typeof startView==='function')startView();
}

// Hinweistext, falls keine Termine vorliegen (Laden, Fehler, leer). Sonst null.
function terminHinweis(){
 if(TERMINE_ERR)return'<p class="mu">Termine konnten nicht geladen werden.</p>';
 if(TERMINE===null)return'<p class="mu">Termine werden geladen …</p>';
 if(!TERMINE.length)return'<p class="mu">Keine Termine im Kalender.</p>';
 return null;
}

// Karte „Nächster Abend“: nur Datum und Uhrzeit des nächsten Termins.
function naechsterHTML(){
 const h=terminHinweis();
 if(h)return h;
 const t=TERMINE[0];
 const datum=t.d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
 const zeit=t.ganz?'':' · '+t.d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+' Uhr';
 return`<p class="big">${esc(datum+zeit)}</p>`;
}

// Karte „Nächste Kegelabende“: die nächsten drei Termine, nur Wochentag, Datum und Uhrzeit.
function kegelabendeHTML(){
 const h=terminHinweis();
 if(h)return h;
 return`<ul class="lst termine">${TERMINE.slice(0,3).map(t=>{
  const datum=t.d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
  const zeit=t.ganz?'':' · '+t.d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+' Uhr';
  return`<li><b>${esc(datum+zeit)}</b></li>`;
 }).join('')}</ul>`;
}
