// Umfrage vor dem Abend (über „Anwesenheit“ in der Eingabe) und Freigabeliste für Bearbeiter.
// Umfrage: Dokument state/umfrage = {votes:{<Name>:'dabei'|'rein'|'nein'}}. Schreiben dürfen Bearbeiter (EDT).
// Freigabe: Dokumente editors/<google-mail>; nur der Besitzer pflegt sie (Mitglieder-Tab), siehe firestore.rules.
const UMF_COLS=[['dabei','Dabei'],['rein','Schmeisse einen rein'],['nein','Kann leider nicht']];
let UMF={};
const umfCount=()=>{const c={dabei:0,rein:0,nein:0};MEM.liste.forEach(n=>{if(c[UMF[n]]!=null)c[UMF[n]]++});return c};
function umfInner(){
 const c=umfCount();
 return `<div class="w"><table class="stack"><tr class="hd"><th>Name</th>${UMF_COLS.map(([k,l])=>`<th>${l}</th>`).join('')}</tr>`
 +MEM.liste.map((n,i)=>`<tr><td>${esc(n)}</td>${UMF_COLS.map(([k,l])=>`<td data-l="${l}" class="umc">${EDT?`<button type="button" class="umb${UMF[n]==k?' on':''}" data-um="${i}" data-v="${k}" aria-pressed="${UMF[n]==k}" aria-label="${esc(n)}: ${l}">${UMF[n]==k?'✓':''}</button>`:(UMF[n]==k?'<span class="umk">✓</span>':'')}</td>`).join('')}</tr>`).join('')
 +`<tr class="sum"><td>Anzahl</td>${UMF_COLS.map(([k])=>`<td>${c[k]}</td>`).join('')}</tr></table></div>`
 +(EDT?`<div class="top"><button type="button" class="pri" id="um-an">Alle „Dabei“ als anwesend markieren</button><button type="button" id="um-rs">Umfrage zurücksetzen</button><span class="mu" id="um-ms"></span></div>`:'<p class="mu">Die Umfrage kann nur von freigegebenen Mitgliedern geändert werden.</p>')}
const umfHtml=()=>`<h2 id="s-umf">Umfrage <span class="mu">Pro Mitglied einen Haken setzen (nochmal tippen entfernt ihn).</span></h2><div id="umf">${umfInner()}</div>`;
const umfDraw=()=>{const e=$('#umf');if(e)e.innerHTML=umfInner()};
const umfMsg=t=>{const e=$('#um-ms');if(e)e.textContent=t};
async function umfSet(n,v){
 if(!EDT||!db)return;
 const was=UMF[n];UMF[n]=v;umfDraw();
 try{await db.doc('state/umfrage').set({votes:{[n]:v}},{merge:true})}
 catch(e){UMF[n]=was;umfDraw();umfMsg('Speichern fehlgeschlagen: '+(e.message||e.code))}}
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-um]');
 if(b){const n=MEM.liste[+b.dataset.um],v=b.dataset.v;if(n)umfSet(n,UMF[n]==v?null:v);return}
 if(e.target.id=='um-an'){
  let k=0;MEM.liste.forEach(n=>{if(UMF[n]!='dabei')return;const r=S.rows.find(x=>x.name==n&&!x.gast);if(r&&!r.c){r.c=1;r.ord=S.seq=(S.seq||0)+1;k++}});
  autoKoenige();render();draft();umfMsg(k?k+' Mitglied(er) als anwesend markiert.':'Alle „Dabei“ waren schon als anwesend markiert.');return}
 if(e.target.id=='um-rs'){
  if(!EDT||!db)return;
  try{await db.doc('state/umfrage').set({votes:{}});UMF={};umfDraw()}catch(x){umfMsg('Zurücksetzen fehlgeschlagen: '+(x.message||x.code))}}});
// Live-Aktualisierung, damit mehrere Mitglieder gleichzeitig abstimmen können.
function umfWatch(){
 try{db.doc('state/umfrage').onSnapshot(s=>{UMF=s.exists?clean((s.data()||{}).votes||{}):{};umfDraw()},()=>{})}catch(e){}}

// Freigabe: Besitzer trägt die Google-Adressen der Mitglieder ein, die Abende speichern dürfen.
const frgHtml=l=>`<h2 id="m-frg">Freigabe zum Speichern <span class="mu">Diese Google-Adressen dürfen Abende, Umfrage und Entwurf speichern. Rekorde, Mitglieder, Bearbeiten und Fotos bleiben beim Besitzer.</span></h2>`
 +`<div class="w"><table class="stack"><tr class="hd"><th>Google-Adresse</th><th></th></tr>${l.length?l.map(m=>`<tr><td>${esc(m)}</td><td><button type="button" data-fr="${esc(m)}">Entfernen</button></td></tr>`).join(''):'<tr><td colspan="2" class="mu">Noch niemand freigegeben.</td></tr>'}</table></div>`
 +`<div class="top"><input type="email" id="fr-in" placeholder="name@gmail.com"><button class="pri" id="fr-add">Freigeben</button><span class="mu" id="fr-ms"></span></div>`;
async function frgLoad(){
 const e=$('#frg');if(!e||!OWN||!db)return;
 try{const s=await db.collection('editors').get();e.innerHTML=frgHtml(s.docs.map(d=>d.id).sort())}
 catch(x){e.innerHTML='<p class="mu">Freigabeliste konnte nicht geladen werden: '+esc(x.message||x.code)+'</p>'}}
document.addEventListener('click',async e=>{
 if(!OWN||!db)return;
 const m=t=>{const x=$('#fr-ms');if(x)x.textContent=t};
 if(e.target.id=='fr-add'){
  const v=$('#fr-in').value.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return m('Bitte eine gültige Google-Adresse eingeben.');
  try{await db.doc('editors/'+v).set({added:new Date().toISOString()});await frgLoad()}catch(x){m('Fehler: '+(x.message||x.code))}return}
 const r=e.target.closest('[data-fr]');
 if(r){try{await db.doc('editors/'+r.dataset.fr).delete();await frgLoad()}catch(x){m('Fehler: '+(x.message||x.code))}}});
