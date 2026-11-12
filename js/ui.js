// Gemeinsame Bedienelemente: Icons, Toasts, Bestätigungsdialog, Ladezustand für Knöpfe,
// Plus/Minus-Knöpfe für Zählfelder, Kompaktansicht breiter Tabellen und Scroll-Hinweise.
// Wird vor app.js geladen; nutzt nur das DOM aus index.html.
const icon=(n,c='')=>`<svg class="ic${c?' '+c:''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;

// Toast unten am Bildschirm. typ: 'ok' | 'err' | 'info'. Fehler bleiben stehen, bis man sie schließt.
function toast(text,typ){
 const box=document.getElementById('toasts');if(!box||!text)return;
 typ=typ||(/fehlgeschlagen|Fehler|nicht möglich|nur dem|nur freigegebenen|Bitte|muss/i.test(text)?'err':'ok');
 const t=document.createElement('div');t.className='toast '+typ;t.setAttribute('role',typ=='err'?'alert':'status');
 t.innerHTML=icon(typ=='err'?'alert':'check')+'<span></span><button type="button" class="icb" aria-label="Meldung schließen">'+icon('x')+'</button>';
 t.querySelector('span').textContent=text;
 const off=()=>{t.classList.add('out');setTimeout(()=>t.remove(),200)};
 t.querySelector('button').onclick=off;
 box.append(t);while(box.children.length>3)box.firstChild.remove();
 if(typ!='err')setTimeout(off,4000)}

// Bestätigung vor Aktionen, die Daten löschen oder zurücksetzen. Liefert ein Promise<boolean>.
function confirmDlg(text,okLabel){
 const d=document.getElementById('cfm');
 if(!d||typeof d.showModal!='function')return Promise.resolve(window.confirm(text));
 document.getElementById('cfm-t').textContent=text;document.getElementById('cfm-ok').textContent=okLabel||'OK';
 return new Promise(res=>{
  const done=v=>{d.close();res(v)};
  document.getElementById('cfm-ok').onclick=()=>done(true);document.getElementById('cfm-no').onclick=()=>done(false);
  d.oncancel=e=>{e.preventDefault();done(false)};
  d.showModal();document.getElementById('cfm-no').focus()})}

// Knopf während einer Speicher-Aktion sperren und eine Ladeanzeige zeigen.
async function busy(btn,p){
 if(btn){btn.disabled=true;btn.classList.add('busy');btn.setAttribute('aria-busy','true')}
 try{return await p}finally{if(btn&&btn.isConnected){btn.disabled=false;btn.classList.remove('busy');btn.removeAttribute('aria-busy')}}}

// Zählfeld mit [−] Wert [+]. Die Knöpfe ändern das Feld und lösen ein input-Ereignis aus,
// damit die vorhandenen Handler (onIn, onEd) wie beim Tippen rechnen und speichern.
// bare: ohne sichtbare Beschriftung (Tabellenzelle), das Feld trägt dann aria-label.
const stepper=(lab,attrs,val,id,bare)=>`<div class="fld cnt">${bare?'':`<label for="${id}">${lab}</label>`}<div class="stp"><button type="button" class="sb" data-sb="-1" tabindex="-1" aria-label="${lab} minus 1">${icon('minus')}</button><input id="${id}"${bare?` aria-label="${lab}"`:''} type="number" min="0" step="1" inputmode="numeric" enterkeyhint="next" ${attrs} value="${val===0||val==null?'':val}"><button type="button" class="sb" data-sb="1" tabindex="-1" aria-label="${lab} plus 1">${icon('plus')}</button></div></div>`;
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-sb]');if(!b)return;
 const i=b.parentElement.querySelector('input');if(!i||i.disabled)return;
 i.value=Math.max(0,(parseFloat(i.value)||0)+(+b.dataset.sb))||'';
 i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));
 if(navigator.vibrate)try{navigator.vibrate(8)}catch(x){}
 i.closest('.fld').classList.remove('pop');void i.offsetWidth;i.closest('.fld').classList.add('pop')});

// Zahlenfelder: Inhalt beim Antippen markieren, damit man direkt überschreiben kann.
document.addEventListener('focusin',e=>{const t=e.target;if(t.tagName=='INPUT'&&(t.type=='number'||t.inputMode=='decimal'||t.inputMode=='numeric'))setTimeout(()=>{try{t.select()}catch(x){}},0)});

// Breite Tabellen: Auf schmalen Bildschirmen nur die wichtigsten Spalten zeigen, Umschalter „Alle Spalten“.
// h2id: Überschrift vor der Tabelle, cols: Spaltennummern (ab 0), die zuerst verborgen sind.
const CMP_OPEN=new Set();
function compact(h2id,cols){
 const h=document.getElementById(h2id);if(!h)return;
 let w=h.nextElementSibling;while(w&&w.tagName!='H2'&&!(w.classList.contains('w')&&!w.classList.contains('cw')))w=w.nextElementSibling;
 if(!w||w.tagName=='H2')return;
 const tb=w&&w.querySelector('table');if(!tb)return;
 [...tb.rows].forEach(r=>{if([...r.cells].some(c=>c.colSpan>1))return;[...r.cells].forEach((c,j)=>{if(cols.includes(j))c.classList.add('opt')})});
 w.classList.add('cmp');w.classList.toggle('all',CMP_OPEN.has(h2id));w.dataset.cmp=h2id;
 if(!w.previousElementSibling||!w.previousElementSibling.classList.contains('tglw'))
  w.insertAdjacentHTML('beforebegin',`<div class="tglw"><button type="button" class="tgl" data-cols="${h2id}" aria-pressed="${CMP_OPEN.has(h2id)}">${icon('columns')}<span>${CMP_OPEN.has(h2id)?'Weniger Spalten':'Alle Spalten'}</span></button></div>`)}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-cols]');if(!b)return;const id=b.dataset.cols,on=!CMP_OPEN.has(id);
 on?CMP_OPEN.add(id):CMP_OPEN.delete(id);
 const w=document.querySelector(`.w[data-cmp="${id}"]`);if(w)w.classList.toggle('all',on);
 b.setAttribute('aria-pressed',on);b.querySelector('span').textContent=on?'Weniger Spalten':'Alle Spalten';shadows()});

// Hinweis, dass sich eine Tabelle seitlich schieben lässt (Schatten links, Ausblenden rechts).
function shadow(w){const m=w.scrollWidth-w.clientWidth;w.classList.toggle('sl',w.scrollLeft>2);w.classList.toggle('sr',m>2&&w.scrollLeft<m-2)}
function shadows(){document.querySelectorAll('.w').forEach(shadow)}
document.addEventListener('scroll',e=>{const t=e.target;if(t&&t.classList&&t.classList.contains('w'))shadow(t)},true);
addEventListener('resize',()=>shadows());
