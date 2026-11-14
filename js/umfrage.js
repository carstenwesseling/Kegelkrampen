// Umfrage vor dem Abend (über „Anwesenheit“ in der Eingabe) und Freigabeliste für Bearbeiter.
// Umfrage: Dokument state/umfrage = {votes:{<Name>:'dabei'|'rein'|'nein'}}. Lesen darf jeder (Stand auf der Startseite, auch ausgeloggt).
// Schreiben: jedes angemeldete Mitglied die eigene Antwort, Bearbeiter (EDT) die Antworten aller – bis der Abend gespeichert wird
// (dann wird die Umfrage zurückgesetzt). Siehe firestore.rules.
// Freigabe: Dokumente editors/<google-mail>; nur der Besitzer pflegt sie (Mitglieder-Tab), siehe firestore.rules.
const UMF_COLS=[['dabei','Dabei'],['rein','Schmeisse einen rein'],['nein','Kann leider nicht']];
let UMF={},UMF_OK=false,UMF_HINT=false; // UMF_OK: Umfrage wurde gelesen; UMF_HINT: Hinweis „noch nicht ausgefüllt“ wurde schon als Meldung gezeigt
// Eigener Eintrag des angemeldeten Mitglieds in der Mitgliederliste (null: nicht angemeldet oder Name nicht in der Liste).
const umfMe=()=>{if(!VIEW||!ME||!ME.name)return null;return MEM.liste.find(n=>norm(n)==norm(ME.name))||null};
const umfOpenMe=()=>{const n=umfMe();return !!n&&UMF_OK&&!UMF[n]};
const umfCan=n=>!!db&&!!n&&(EDT||n===umfMe());
const umfCount=()=>{const c={dabei:0,rein:0,nein:0};MEM.liste.forEach(n=>{if(c[UMF[n]]!=null)c[UMF[n]]++});return c};
const UMF_SH={dabei:'Dabei',rein:'Rein',nein:'Nein'};
function umfInner(){
 const c=umfCount(),open=MEM.liste.length-c.dabei-c.rein-c.nein;
 return `<p class="pills"><span class="tag ok">Dabei ${c.dabei}</span><span class="tag">Schmeisse einen rein ${c.rein}</span><span class="tag">Kann leider nicht ${c.nein}</span>${open>0?`<span class="tag mu">noch offen ${open}</span>`:''}</p>`
 +`<ul class="umf-l">${MEM.liste.map((n,i)=>`<li><span class="umn">${esc(n)}${n===umfMe()?' <span class="tag">du</span>':''}</span>${umfCan(n)?`<span class="seg" role="group" aria-label="${esc(n)}">${UMF_COLS.map(([k,l])=>`<button type="button" class="${k}${UMF[n]==k?' on':''}" data-um="${i}" data-v="${k}" aria-pressed="${UMF[n]==k}" title="${l}">${UMF[n]==k?icon('check'):''}<span class="lf">${l}</span><span class="ls">${UMF_SH[k]}</span></button>`).join('')}</span>`:`<span class="tag${UMF[n]=='dabei'?' ok':''}">${UMF[n]?UMF_COLS.find(x=>x[0]==UMF[n])[1]:'keine Antwort'}</span>`}</li>`).join('')}</ul>`
 +(EDT?`<div class="top"><button type="button" class="pri" id="um-an">${icon('check')}Alle „Dabei“ als anwesend markieren</button><button type="button" id="um-rs">Umfrage zurücksetzen</button><span class="mu" id="um-ms"></span></div>`:'')}
// Stand der Umfrage als Kurzzeilen (Startseite, auch ausgeloggt). Leer, solange die Umfrage nicht gelesen werden konnte.
function umfPills(){
 if(!UMF_OK)return'';
 const c=umfCount(),open=MEM.liste.length-c.dabei-c.rein-c.nein;
 return`<p class="pills" aria-label="Stand der Umfrage"><span class="tag ok">Dabei ${c.dabei}</span><span class="tag">Rein ${c.rein}</span><span class="tag">Nein ${c.nein}</span>${open>0?`<span class="tag mu">offen ${open}</span>`:''}</p>`}
// Eigene Antwort des angemeldeten Mitglieds (Startseite, Karte „Nächster Abend“); ohne Antwort mit Hinweis.
function umfMeHtml(){
 const n=umfMe();if(!n||!UMF_OK)return'';
 const i=MEM.liste.indexOf(n),v=UMF[n],o=!v;
 return`<div class="umf-me${o?' open':''}" role="group" aria-label="Deine Antwort zur Umfrage">`
  +`<p>${o?`${icon('alert')}<span><b>Du hast die Umfrage noch nicht ausgefüllt.</b> Bist du beim nächsten Kegeln dabei?</span>`:'<span>Deine Antwort:</span>'}</p>`
  +`<span class="seg">${UMF_COLS.map(([k,l])=>`<button type="button" class="${k}${v==k?' on':''}" data-um="${i}" data-v="${k}" aria-pressed="${v==k}" title="${l}">${v==k?icon('check'):''}<span class="lf">${l}</span><span class="ls">${UMF_SH[k]}</span></button>`).join('')}</span></div>`}
const umfHtml=()=>`<h2 id="s-umf">Umfrage</h2><div id="umf">${umfInner()}</div>`;
const umfDraw=()=>{const e=$('#umf');if(e)e.innerHTML=umfInner();if(typeof CUR!='undefined'&&CUR=='#b0'&&!(typeof TERMINE_EDIT!='undefined'&&TERMINE_EDIT)&&typeof startView=='function')startView()};
const umfMsg=t=>toast(t);
async function umfSet(n,v){
 if(!umfCan(n))return;
 const was=UMF[n];UMF[n]=v;umfDraw();
 try{await db.doc('state/umfrage').set({votes:{[n]:v}},{merge:true})}
 catch(e){UMF[n]=was;umfDraw();umfMsg('Speichern fehlgeschlagen: '+(e.message||e.code))}}
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
  try{await db.doc('state/umfrage').set({votes:{}});UMF={};umfDraw();umfMsg('Umfrage wurde zurückgesetzt.')}catch(x){umfMsg('Zurücksetzen fehlgeschlagen: '+(x.message||x.code))}}});
// Live-Aktualisierung, damit mehrere Mitglieder gleichzeitig abstimmen können.
// Bei jeder Änderung der Umfrage wird „Runde bezahlt“ aus „Runden (+Trinkgeld)“ neu verteilt (das Feld ist nicht editierbar).
function umfWatch(){
 try{db.doc('state/umfrage').onSnapshot(s=>{UMF=s.exists?clean((s.data()||{}).votes||{}):{};UMF_OK=true;umfDraw();
  // Nach der Anmeldung einmal auf die offene Umfrage hinweisen (zusätzlich zum Hinweis in der Karte „Nächster Abend“).
  if(!UMF_HINT&&umfOpenMe()){UMF_HINT=true;toast('Du hast die Umfrage für das nächste Kegeln noch nicht ausgefüllt. Du findest sie auf der Startseite.','info')}
  if(EDT&&typeof rundeTeilen==='function'&&rundeTeilen()){if($('#kg'))upd();draft()}},()=>{})}catch(e){}}

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
