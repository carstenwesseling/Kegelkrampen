// Anmeldung der Mitglieder per Name und 4-stelliger PIN (Stufen „Lesen“ und „Speichern“) und PIN-Verwaltung des Besitzers.
// Daten: pins/<Name> = {pin:"1234", level:"lesen"|"speichern"} (nur Besitzer); access/<uid> schreibt der Browser beim Anmelden
// (siehe js/backend.js und firestore.rules). Besitzer und per E-Mail Freigegebene melden sich weiter über Google / E-Mail-Link an.

// ---- Anmeldung (Dialog „Mehr“ → Konto) ----
function zugangDraw(){
 const e=$('#zg');if(!e)return;
 const out=LOADED&&!VIEW&&!(USR&&ME);
 if(!out){e.replaceChildren();e.hidden=true;return}
 e.hidden=false;
 e.innerHTML=`<div class="mh">Als Mitglied anmelden</div><form class="zg-f" id="zg-f" autocomplete="off">`
  +`<label for="zg-n">Name</label><select id="zg-n">${(MEM.liste||[]).map(n=>`<option>${esc(n)}</option>`).join('')}</select>`
  +`<label for="zg-p">PIN (4 Ziffern)</label><input id="zg-p" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" enterkeyhint="go" placeholder="••••">`
  +`<button type="submit" class="pri" id="zg-go">Anmelden</button><p class="mu" id="zg-m" role="status" aria-live="polite"></p></form>`}
document.addEventListener('submit',async e=>{
 if(e.target.id!='zg-f')return;e.preventDefault();
 const m=t=>{const x=$('#zg-m');if(x)x.textContent=t},n=$('#zg-n').value,p=$('#zg-p').value.trim();
 if(!n)return m('Bitte einen Namen wählen.');
 if(!/^\d{4}$/.test(p))return m('Bitte die 4-stellige PIN eingeben.');
 if(!USR||!USR.memberLogin)return m('Anmeldung ist nicht verfügbar.');
 const b=$('#zg-go');b.disabled=true;m('Anmeldung läuft …');
 try{await USR.memberLogin(n,p);location.reload()}
 catch(x){m(x.message||'Anmeldung fehlgeschlagen.');b.disabled=false}});

// ---- PIN-Verwaltung (nur Besitzer, Mitglieder-Tab) ----
let PINS={};
const pinValid=v=>/^\d{4}$/.test(v);
const pinRnd=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return String(a[0]%10000).padStart(4,'0')};
const pinHtml=()=>`<h2 id="m-pin">Zugang per PIN</h2><p class="mu">Je Mitglied eine 4-stellige PIN und die Stufe: „Lesen“ = alle Seiten nur ansehen, „Speichern“ = darf zusätzlich Abende speichern. Die PIN bitte dem Mitglied persönlich mitteilen. Ohne PIN ist keine Anmeldung möglich; wird die PIN geändert oder gelöscht, wird das Mitglied beim nächsten Laden abgemeldet.</p>`
 +`<div class="w"><table class="stack"><tr class="hd"><th>Name</th><th>PIN</th><th>Stufe</th><th></th></tr>${(MEM.liste||[]).map(n=>{const d=PINS[n]||{};return`<tr><td>${esc(n)}</td><td data-l="PIN"><input type="text" inputmode="numeric" maxlength="4" autocomplete="off" data-pin="${esc(n)}" value="${esc(d.pin||'')}" placeholder="–" aria-label="PIN von ${esc(n)}"></td><td data-l="Stufe"><select data-lvl="${esc(n)}" aria-label="Stufe von ${esc(n)}"><option value="lesen"${d.level!='speichern'?' selected':''}>Lesen</option><option value="speichern"${d.level=='speichern'?' selected':''}>Speichern</option></select></td><td><button type="button" data-rnd="${esc(n)}">Zufällige PIN</button></td></tr>`}).join('')}</table></div><p class="mu" id="pin-ms" role="status" aria-live="polite"></p>`;
async function pinLoad(){
 const e=$('#pin');if(!e||!OWN||!db)return;
 try{const s=await db.collection('pins').get();PINS={};s.docs.forEach(d=>{PINS[d.id]=d.data()});e.innerHTML=pinHtml()}
 catch(x){e.innerHTML='<p class="mu">PINs konnten nicht geladen werden: '+esc(x.message||x.code)+'</p>'}}
async function pinSave(n,pin,level){
 const m=t=>{const x=$('#pin-ms');if(x)x.textContent=t};
 if(!OWN||!db)return;
 try{
  if(!pin){await db.doc('pins/'+n).delete();delete PINS[n];m(`PIN von ${n} gelöscht.`);return}
  if(!pinValid(pin))return m('Die PIN muss aus genau 4 Ziffern bestehen.');
  await db.doc('pins/'+n).set({pin,level});PINS[n]={pin,level};m(`${n}: PIN gespeichert, Stufe ${level=='speichern'?'Speichern':'Lesen'}.`)}
 catch(x){m('Speichern fehlgeschlagen: '+(x.message||x.code))}}
document.addEventListener('change',e=>{
 if(!OWN)return;
 const i=e.target.closest('[data-pin]');
 if(i){const n=i.dataset.pin,v=i.value.trim(),l=document.querySelector(`[data-lvl="${CSS.escape(n)}"]`);pinSave(n,v,l?l.value:'lesen');return}
 const l=e.target.closest('[data-lvl]');
 if(l){const n=l.dataset.lvl,p=document.querySelector(`[data-pin="${CSS.escape(n)}"]`),v=p?p.value.trim():'';
  if(!v){const m=$('#pin-ms');if(m)m.textContent='Bitte zuerst eine PIN eintragen.';return}pinSave(n,v,l.value)}});
document.addEventListener('click',e=>{
 if(!OWN)return;
 const b=e.target.closest('[data-rnd]');if(!b)return;
 const n=b.dataset.rnd,p=document.querySelector(`[data-pin="${CSS.escape(n)}"]`),l=document.querySelector(`[data-lvl="${CSS.escape(n)}"]`);
 if(!p)return;p.value=pinRnd();pinSave(n,p.value,l?l.value:'lesen')});
