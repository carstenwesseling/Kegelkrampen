// Einmaliger Import der Dortmunder-Werte 2013–2025 (Daten: js/dortmunder-import-data.js).
// Nur der Besitzer sieht den Knopf (Historie). Schon vorhandene Dortmunder-Blätter werden nie überschrieben;
// der Import lässt sich daher gefahrlos wiederholen. Der Dortmunder-König richtet sich nach den Excel-Werten (leer oder abweichend wird angepasst).
const dmBlatt=d=>DM_IMPORT[d].map(([name,s])=>({name,v:[s,0,0,0,0,0,0],s}));
const dmSet=n=>(n||'').split('/').map(x=>x.trim()).filter(Boolean).sort().join('/');
function dmKoenige(D,blatt){
 const mx=Math.max(0,...blatt.map(b=>b.s)),ko=(D.koenige||[]).map(k=>({...k}));
 if(mx<=0)return ko;
 while(ko.length<KL.length)ko.push({name:'',pt:null,t:KL[ko.length]});
 const k=ko[DK],nm=blatt.filter(b=>b.s===mx).map(b=>b.name);
 // Die Excel-Werte gelten: leerer oder abweichender Dortmunder-König wird angepasst (gleiche Namen in anderer Reihenfolge bleiben).
 if(dmSet(k.name)!==dmSet(nm.join('/'))||+k.pt!==mx){k.name=nm.join(' / ');k.pt=mx}
 return ko}
const dmPending=()=>HIST.filter(h=>DM_IMPORT[h.date]&&(!(h.blatt&&h.blatt.length)||JSON.stringify(dmKoenige(h,dmBlatt(h.date)))!==JSON.stringify(h.koenige||[])));
function dmImportBox(){
 if(!OWN||typeof DM_IMPORT==='undefined')return'';
 const n=dmPending().length;
 return n?`<div class="note" id="dm-imp"><b>Dortmunder-Import 2013–2025:</b> Für ${n} Abende liegen Dortmunder-Werte aus der Excel-Datei vor. <button class="pri" id="dm-go">Jetzt importieren</button> <span class="mu" id="dm-msg"></span></div>`:''}
async function dmImport(){
 const todo=dmPending(),m=$('#dm-msg'),b=$('#dm-go');
 if(!OWN||!db||!todo.length)return;
 b.disabled=true;let ok=0;
 for(const D of todo){
  const blatt=D.blatt&&D.blatt.length?D.blatt:dmBlatt(D.date);
  const koenige=dmKoenige(D,blatt);
  try{await db.doc('sessions/'+D.date).update(clean({blatt,koenige}));D.blatt=blatt;D.koenige=koenige;ok++;m.textContent=ok+' von '+todo.length+' Abenden importiert …'}
  catch(e){m.textContent='Fehler bei '+dd(D.date)+': '+(e.message||e.code)+' ('+ok+' von '+todo.length+' importiert).';b.disabled=false;return}}
 hist(HSEL);const r=$('#hist');r.insertAdjacentHTML('afterbegin','<div class="note">Import fertig: '+ok+' Abende mit Dortmunder-Werten ergänzt.</div>')}
document.addEventListener('click',e=>{if(e.target.id=='dm-go')dmImport()});
