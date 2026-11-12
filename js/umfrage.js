// Umfrage vor dem Abend (über „Anwesenheit“ in der Eingabe), Handynummern der Mitglieder und Freigabeliste für Bearbeiter.
// Umfrage: je Mitglied ein Dokument umfrage/<Name> = {antwort:'dabei'|'rein'|'nein', zeit}.
// Abstimmen dürfen Besitzer und Freigegebene (EDT) alle Mitglieder, ein Mitglied, das sich per Handynummer
// angemeldet hat (VOTER), nur die eigene Antwort. Siehe firestore.rules.
// Handynummern: telefon/<+49…> = {name}; nur der Besitzer pflegt sie (Mitglieder-Tab). Die Anmeldung läuft in backend.js.
// Freigabe: Dokumente editors/<google-mail>; nur der Besitzer pflegt sie (Mitglieder-Tab), siehe firestore.rules.
const UMF_COLS=[['dabei','Dabei'],['rein','Schmeisse einen rein'],['nein','Kann leider nicht']];
let UMF={},TEL={};
// Darf die Person diese Antwort ändern?
const canVote=n=>!!db&&(EDT||(VOTER&&!!ME&&ME.member===n));
const umfCount=()=>{const c={dabei:0,rein:0,nein:0};MEM.liste.forEach(n=>{if(c[UMF[n]]!=null)c[UMF[n]]++});return c};
const UMF_SH={dabei:'Dabei',rein:'Rein',nein:'Nein'};
function umfInner(){
 const c=umfCount(),open=MEM.liste.length-c.dabei-c.rein-c.nein;
 return `<p class="pills"><span class="tag ok">Dabei ${c.dabei}</span><span class="tag">Schmeisse einen rein ${c.rein}</span><span class="tag">Kann leider nicht ${c.nein}</span>${open>0?`<span class="tag mu">noch offen ${open}</span>`:''}</p>`
 +`<ul class="umf-l">${MEM.liste.map((n,i)=>`<li><span class="umn">${esc(n)}</span>${canVote(n)?`<span class="seg" role="group" aria-label="${esc(n)}">${UMF_COLS.map(([k,l])=>`<button type="button" class="${k}${UMF[n]==k?' on':''}" data-um="${i}" data-v="${k}" aria-pressed="${UMF[n]==k}" title="${l}">${UMF[n]==k?icon('check'):''}<span class="lf">${l}</span><span class="ls">${UMF_SH[k]}</span></button>`).join('')}</span>`:`<span class="tag${UMF[n]=='dabei'?' ok':''}">${UMF[n]?UMF_COLS.find(x=>x[0]==UMF[n])[1]:'keine Antwort'}</span>`}</li>`).join('')}</ul>`
 +(VOTER&&!EDT&&ME&&ME.member?`<p class="mu">Du bist als <b>${esc(ME.member)}</b> angemeldet. Deine Antwort setzt du hier; nochmal tippen entfernt sie.</p>`:'')
 +(EDT?`<div class="top"><button type="button" class="pri" id="um-an">${icon('check')}Alle „Dabei“ als anwesend markieren</button><button type="button" id="um-rs">Umfrage zurücksetzen</button><span class="mu" id="um-ms"></span></div>`:'')}
const umfHtml=()=>`<h2 id="s-umf">Umfrage</h2><div id="umf">${umfInner()}</div>`;
const umfDraw=()=>{const e=$('#umf');if(e)e.innerHTML=umfInner();if(typeof CUR!='undefined'&&CUR=='#b0'&&typeof startView=='function')startView()};
const umfMsg=t=>toast(t);
// Antwort eines Mitglieds setzen; v = null entfernt sie (dann wird das Dokument gelöscht).
async function umfSet(n,v){
 if(!canVote(n))return;
 const was=UMF[n];
 if(v)UMF[n]=v;else delete UMF[n];
 umfDraw();
 try{
  const ref=db.collection('umfrage').doc(n);
  if(v)await ref.set({antwort:v,zeit:new Date().toISOString()});
  else await ref.delete();
 }
 catch(e){if(was)UMF[n]=was;else delete UMF[n];umfDraw();umfMsg('Speichern fehlgeschlagen: '+(e.message||e.code))}}
// Alle Antworten löschen: nach „Abend speichern“ und mit „Umfrage zurücksetzen“ (Besitzer und Freigegebene).
async function umfReset(){
 const s=await db.collection('umfrage').get();
 if(s.empty)return;
 const b=db.batch();s.docs.forEach(d=>b.delete(d.ref));await b.commit()}
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-um]');
 if(b){const n=MEM.liste[+b.dataset.um],v=b.dataset.v;if(n)umfSet(n,UMF[n]==v?null:v);return}
 const ub=e.target.closest('#um-an,#um-rs');const uid=ub&&ub.id;
 if(uid=='um-an'){
  let k=0;MEM.liste.forEach(n=>{if(UMF[n]!='dabei')return;const r=S.rows.find(x=>x.name==n&&!x.gast);if(r&&!r.c){r.c=1;r.ord=S.seq=(S.seq||0)+1;k++}});
  autoKoenige();render();draft();umfMsg(k?k+' Mitglied(er) als anwesend markiert.':'Alle „Dabei“ waren schon als anwesend markiert.');return}
 if(uid=='um-rs'){
  if(!EDT||!db)return;
  if(!await confirmDlg('Umfrage zurücksetzen? Alle Antworten werden gelöscht.','Zurücksetzen'))return;
  try{await umfReset();UMF={};umfDraw();umfMsg('Umfrage wurde zurückgesetzt.')}catch(x){umfMsg('Zurücksetzen fehlgeschlagen: '+(x.message||x.code))}}});
// Live-Aktualisierung, damit mehrere Mitglieder gleichzeitig abstimmen können.
function umfWatch(){
 try{db.collection('umfrage').onSnapshot(s=>{const u={};s.forEach(d=>{const a=(d.data()||{}).antwort;if(a)u[d.id]=a});UMF=u;umfDraw()},()=>{})}catch(e){}}

// Handynummern der Mitglieder (nur Besitzer): telefon/<+49…> = {name}. Ohne Nummer kann ein Mitglied nicht abstimmen.
const telHtml=()=>`<h2 id="m-tel">Handynummern</h2>`
 +`<p class="mu">Mit der Handynummer melden sich Mitglieder per SMS-Code an und setzen ihre Antwort in der Umfrage. Eingabe mit Vorwahl, z. B. 0171 1234567 (wird als +49 gespeichert) oder +49 171 1234567.</p>`
 +`<div class="w"><table class="stack"><tr class="hd"><th>Name</th><th>Handynummer</th></tr>${MEM.liste.length?MEM.liste.map((n,i)=>`<tr><td>${esc(n)}</td><td data-l="Handynummer"><input type="tel" inputmode="tel" autocomplete="off" aria-label="Handynummer von ${esc(n)}" data-tel="${i}" value="${esc(TEL[n]||'')}"></td></tr>`).join(''):'<tr><td colspan="2" class="mu">Noch keine Mitglieder in der Liste.</td></tr>'}</table></div>`
 +`<div class="top"><button type="button" class="pri" id="tel-save">${icon('save')}Handynummern speichern</button><span class="mu" id="tel-ms" aria-live="polite"></span></div>`;
async function telLoad(){
 const e=$('#tel');if(!e||!OWN||!db)return;
 try{const s=await db.collection('telefon').get();TEL={};s.docs.forEach(d=>{const n=(d.data()||{}).name;if(n)TEL[n]=d.id});e.innerHTML=telHtml()}
 catch(x){e.innerHTML='<p class="mu">Handynummern konnten nicht geladen werden: '+esc(x.message||x.code)+'</p>'}}
document.addEventListener('click',async e=>{
 if(!e.target.closest('#tel-save')||!OWN||!db)return;
 const m=t=>{const x=$('#tel-ms');if(x)x.textContent=t};
 const want={},seen={};   // want: Name → Nummer, seen: Nummer → Name (Doppelte abfangen)
 for(const inp of document.querySelectorAll('[data-tel]')){
  const n=MEM.liste[+inp.dataset.tel],nr=normTel(inp.value);
  if(nr===null)return m(`Die Handynummer von ${n} sieht nicht richtig aus.`);
  if(!nr)continue;
  if(seen[nr])return m(`${seen[nr]} und ${n} haben dieselbe Handynummer.`);
  seen[nr]=n;want[n]=nr}
 try{
  // Alles neu schreiben: nicht mehr gebrauchte Nummern löschen, die übrigen setzen.
  const keep=new Set(Object.keys(seen)),now=await db.collection('telefon').get(),b=db.batch();
  now.docs.forEach(d=>{if(!keep.has(d.id))b.delete(d.ref)});
  Object.entries(seen).forEach(([nr,n])=>b.set(db.doc('telefon/'+nr),{name:n,angelegt:new Date().toISOString()}));
  await b.commit();
  TEL=want;m('Handynummern gespeichert.');toast('Handynummern gespeichert.')}
 catch(x){m('Speichern fehlgeschlagen: '+(x.message||x.code))}});

// Freigabe: Besitzer trägt die E-Mail-Adressen der Mitglieder (Google oder andere, z. B. aol.com) ein, die Abende speichern dürfen.
const frgHtml=l=>`<h2 id="m-frg">Freigabe zum Speichern</h2>`
 +`<div class="w"><table class="stack"><tr class="hd"><th>E-Mail-Adresse</th><th></th></tr>${l.length?l.map(m=>`<tr><td>${esc(m)}</td><td><button type="button" data-fr="${esc(m)}">Entfernen</button></td></tr>`).join(''):'<tr><td colspan="2" class="mu">Noch niemand freigegeben.</td></tr>'}</table></div>`
 +`<div class="gadd"><label for="fr-in">E-Mail-Adresse freigeben</label><div class="row"><input type="email" id="fr-in" placeholder="name@aol.com" autocomplete="off" inputmode="email"><button class="pri" id="fr-add">Freigeben</button></div><p class="mu" id="fr-ms" aria-live="polite"></p></div>`;
const frgTime=s=>{const d=new Date(s);return isNaN(d)?'':d.toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})};
// Adressen, die sich angemeldet haben (noch ohne Freigabe zuerst); „Übernehmen“ gibt sie zum Speichern frei.
const lgHtml=(L,E)=>`<h2 id="m-lg">Angemeldete Adressen</h2>`
 +`<div class="w"><table class="stack"><tr class="hd"><th>E-Mail-Adresse</th><th>Name</th><th>Zuletzt angemeldet</th><th></th></tr>${L.length?L.map(l=>`<tr><td>${esc(l.email)}</td><td data-l="Name">${esc(l.name)}</td><td data-l="Zuletzt angemeldet">${frgTime(l.last)}</td><td>${E.includes(l.email)?'<span class="mu">freigegeben</span>':`<button type="button" class="pri" data-lg="${esc(l.email)}">Übernehmen</button>`} <button type="button" data-lgx="${esc(l.email)}" aria-label="${esc(l.email)} aus der Liste entfernen">Aus Liste entfernen</button></td></tr>`).join(''):'<tr><td colspan="4" class="mu">Noch niemand angemeldet. Adressen erscheinen hier, sobald sich jemand anmeldet.</td></tr>'}</table></div>`;
async function frgLoad(){
 const e=$('#frg');if(!e||!OWN||!db)return;
 try{
  const [s,g]=await Promise.all([db.collection('editors').get(),db.collection('logins').get().catch(()=>null)]);
  const E=s.docs.map(d=>d.id).sort(),L=g?g.docs.map(d=>({email:d.id,...d.data()})).sort((a,b)=>(E.includes(a.email)-E.includes(b.email))||String(b.last||'').localeCompare(String(a.last||''))):[];
  e.innerHTML=lgHtml(L,E)+frgHtml(E)}
 catch(x){e.innerHTML='<p class="mu">Freigabeliste konnte nicht geladen werden: '+esc(x.message||x.code)+'</p>'}}
document.addEventListener('click',async e=>{
 if(!OWN||!db)return;
 const m=t=>{const x=$('#fr-ms');if(x)x.textContent=t};
 if(e.target.id=='fr-add'){
  const v=$('#fr-in').value.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return m('Bitte eine gültige E-Mail-Adresse eingeben.');
  try{await db.doc('editors/'+v).set({added:new Date().toISOString()});await frgLoad()}catch(x){m('Fehler: '+(x.message||x.code))}return}
 const lg=e.target.closest('[data-lg]');
 if(lg){try{await db.doc('editors/'+lg.dataset.lg).set({added:new Date().toISOString()});await frgLoad();sub()}catch(x){m('Fehler: '+(x.message||x.code))}return}
 const lx=e.target.closest('[data-lgx]');
 if(lx){try{await db.doc('logins/'+lx.dataset.lgx).delete();await frgLoad();sub()}catch(x){m('Fehler: '+(x.message||x.code))}return}
 const r=e.target.closest('[data-fr]');
 if(r){try{await db.doc('editors/'+r.dataset.fr).delete();await frgLoad()}catch(x){m('Fehler: '+(x.message||x.code))}}});
