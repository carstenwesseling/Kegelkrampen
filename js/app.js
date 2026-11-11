const $=s=>document.querySelector(s);
const KL=['Gross - König','Klein - König','Pumpen - König','Dortmunder','TBTBBTB'];
const COLS=[['c','Anwesend'],['d','verl. Spiele'],['e','Pumpen'],['f','Klingel'],['g','Kugel Tisch'],['h','Alle Neune'],['i','Kranz Hand'],['j','Lotterie'],['k','Beitrag'],['l','Runde bezahlt'],['m','Summe'],['n','Rest letztes Kegeln'],['o','soll zahlen'],['p','Hat gezahlt'],['q','Noch zu zahlen']];
const fx=v=>v==null||v===''||isNaN(v)?'':(+v).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});
const dd=i=>i?i.split('-').reverse().join('.'):'';
const iv=v=>v==null||v===''||isNaN(v)?'':Math.round(+v).toLocaleString('de-DE'),eu=v=>fx(v)?fx(v)+' €':'';
const clean=x=>JSON.parse(JSON.stringify(x));
const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
let S={},CFG={rekorde:[]},RK=[],HSEL,HIST=[],MEM={liste:[],gaeste:[],weitere:[]},db=null,OWN=false,tm,YR='',HYR='',MODE='sum';
//CALC-START
const isG=r=>r.gast||r.name==='Gast';
function calc(S){
 const P=S.preise,R=S.rows,pl=R.filter(r=>!isG(r)),G=R.filter(isG),g=(r,k)=>+r[k]||0,sum=(a,f)=>a.reduce((x,r)=>x+f(r),0);
 const sH=sum(pl,r=>g(r,'h'))+sum(G,r=>g(r,'h')),sI=sum(pl,r=>g(r,'i'))+sum(G,r=>g(r,'i')),A=pl.filter(r=>r.c),cnt=A.length,t={c:cnt};
 for(const k of 'defg')t[k]=sum(pl,r=>g(r,k))*P[k];
 t.h=sum(A,r=>(sH-g(r,'h'))*P.h);t.i=sum(A,r=>(sI-g(r,'i'))*P.i);
 t.j=sum(pl,r=>g(r,'j'))+sum(G,r=>g(r,'j'));t.k=cnt*P.k;
 const share=cnt?sum('defghijk'.split(''),k=>t[k])/cnt:0;
 const out=R.map(r=>{if(isG(r))return{};const m=(r.c?g(r,'d')*P.d+g(r,'e')*P.e+g(r,'f')*P.f+g(r,'g')*P.g+(sH-g(r,'h'))*P.h+(sI-g(r,'i'))*P.i+g(r,'j')+P.k:share)+g(r,'l'),o=g(r,'n')+m;return{k:r.c?P.k:null,m,o,q:o-g(r,'p')}});
 const po=out.filter(o=>o.m!=null);
 for(const k of 'lnp')t[k]=sum(pl,r=>g(r,k));
 t.m=sum(po,o=>o.m);t.o=sum(po,o=>o.o);t.q=sum(po,o=>o.q);
 const K=S.kasse||{},gz=t.p,aufs=gz-g(K,'bahn')-g(K,'sonder'),neu=g(K,'alt')+aufs-g(K,'abgang');
 return{out,t,gz,aufs,neu};
}
//CALC-END
const ordKey=(r,i)=>r.c?(r.ord??1e9+i):2e9+i,byOrd=rows=>rows.map((r,i)=>[r,i]).sort((a,b)=>ordKey(...a)-ordKey(...b));
const blank=(name,gs)=>({name,...(gs?{gast:1}:{}),c:gs?1:0,d:0,e:0,f:0,g:0,h:0,i:0,j:0,l:0,p:0});
function sync(){
 S.preise=S.preise||{...(HIST[0]?HIST[0].preise:{d:.5,e:.25,f:.5,g:.5,h:1.25,i:2.5,k:30})};
 const old=S.rows||[];
 S.rows=[...MEM.liste.map(n=>old.find(r=>r.name==n&&!r.gast)||blank(n)),...old.filter(r=>r.gast&&r.name&&r.name!='Gast')];
 S.kasse=S.kasse||{};S.date=S.date||'';S.blatt=S.blatt||{};S.bt=S.bt||[];
 S.rows.forEach(r=>{if(r.c&&r.ord==null)r.ord=S.seq=(S.seq||0)+1});
 S.koenige=KL.map((t,i)=>(S.koenige||[])[i]||{t,name:'',pt:null})}
function V(){const L=HIST[0],q={};L&&L.rows.forEach(r=>q[r.name]=r.q);
 return{...S,rows:S.rows.map(r=>({...r,n:r.gast?0:+q[r.name]||0})),kasse:{...S.kasse,alt:L?+L.kasse.neu||0:0}}}
const eur=s=>{s=String(s).replace(/[€\s]/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');const n=parseFloat(s);return isNaN(n)?0:n};
const A=(a,i,k,v,ed,t)=>{if(!ed)return t=='text'?(v??''):fx(v);const d=`data-a="${a}" data-i="${i}" data-k="${k}"`;
 return(a=='r'&&'jlnp'.includes(k))||a=='k'?`<span class="eu"><input type="text" inputmode="decimal" data-e="1" ${d} placeholder="0,00" value="${v?fx(v):''}"> €</span>`:`<input type="${t||'number'}" step="any" ${d} value="${v??''}">`};
function grid(D,C){
 let h='<table><tr><th>Name</th>'+COLS.map(c=>`<th>${c[1]}</th>`).join('')+'</tr><tr><td>Preis</td>'+COLS.map(([k])=>`<td>${'defghik'.includes(k)?eu(D.preise[k]):''}</td>`).join('')+'</tr>';
 D.rows.forEach((r,i)=>{const o=C.out[i],gs=isG(r);
  h+=`<tr><td>${r.name}${r.gast?' <span class="mu">(Gast)</span>':''}</td>`+COLS.map(([k])=>{
   if(k=='c')return`<td>${gs?'':r.c?'x':''}</td>`;
   if(gs&&!'hij'.includes(k))return'<td></td>';
   const v='kmoq'.includes(k)?o[k]:r[k];return`<td${'kmoq'.includes(k)?` class="cv${v<0?' neg':''}"`:''}>${k=='k'&&!r.c?'x':k=='m'||k=='j'?eu(v):'defghi'.includes(k)?iv(v):fx(v)}</td>`}).join('')+'</tr>'});
 h+='<tr class="sum"><td>Summe</td>'+COLS.map(([k])=>`<td>${k=='c'?C.t.c:eu(C.t[k])}</td>`).join('')+'</tr></table>';
 return`<div class="w">${h}</div>`}
function side(D,ed,C,px='',altEd=0){
 const pf=ed&&!px?'ek':'hk',K=D.kasse||{},row=(l,v)=>`<tr><td>${l}</td><td class="cv" data-l="Betrag"${v[0]?` id="${px}${v[0]}"`:''}>${fx(v[1])}</td><td></td></tr>`,ki=(l,k,t)=>`<tr><td>${l}</td><td data-l="Betrag">${A('k',0,k,K[k]??'',ed)}</td><td style="text-align:left" data-l="Text / Grund">${t?(ed?`<input type="text" class="wide" data-a="k" data-i="0" data-k="${t}" value="${esc(K[t])}" placeholder="Text / Grund">`:esc(K[t])):''}</td></tr>`;
 return`<h2 id="${pf}-kasse">Kasse</h2><div class="w"><table class="stack"><tr class="hd"><th>Position</th><th>Betrag</th><th>Text / Grund</th></tr>${row('Gezahlt',['kg',C.gz])}${ki('Abzug Bahn','bahn')}${ki('Sonderausgabe','sonder','sonderText')}${row('Aufs Konto',['ka',C.aufs])}${ki('Abgang Konto','abgang','abgangText')}${altEd?`<tr><td>Alter Konto</td><td data-l="Betrag">${A('k',0,'alt',K.alt??'',1)}</td><td></td></tr>`:row('Alter Konto',['',K.alt])}${row('Neuer Konto',['kn',C.neu])}</table></div>${D.notiz?`<p class="mu">${D.notiz}</p>`:''}
 <h2 id="${pf}-koenige">Könige${ed&&!px?' <span class="mu">Pumpen-, Dortmunder- und TBTBBTB-König werden automatisch eingetragen.</span>':''}</h2><div class="w"><table class="stack"><tr class="hd"><th>Kategorie</th><th>Name</th><th>Punkte</th></tr>${(D.koenige||[]).map((k,i)=>`<tr><td>${k.t}</td><td data-l="Name">${A('kn',i,'',k.name,ed,'text')}</td><td data-l="Punkte">${A('kp',i,'',k.pt,ed)}</td></tr>`).join('')}</table></div>`}
const chips=()=>`<h2 id="s-anw">Anwesenheit <span class="mu">${S.rows.filter(r=>r.c&&!r.gast).length} von ${S.rows.filter(r=>!r.gast).length} Mitgliedern sind heute dabei. Namen antippen zum Auswählen.</span></h2><div class="chips">${S.rows.map((r,i)=>r.gast?'':`<button type="button" class="chip${r.c?' on':''}" data-chip="${i}">${r.name}</button>`).join('')}</div>
<div class="top"><input type="text" id="gn" placeholder="Name des Gastes"><button type="button" id="gadd">Gast hinzufügen</button><span class="mu" id="gm"></span></div><h2 id="s-ein">Eingabe</h2>`;
function eingabe(){
 const P=S.preise,K='defghij'.split(''),L=k=>COLS.find(c=>c[0]==k)[1];
 let h='<table class="stack"><tr class="hd"><th>Name</th>'+K.map(k=>`<th>${L(k)}</th>`).join('')+'<th></th></tr><tr><td>Preis</td>'+'defghi'.split('').map(k=>`<td data-l="${L(k)}">${A('p',0,k,P[k],OWN)}</td>`).join('')+'<td></td><td></td></tr>';
 byOrd(S.rows).forEach(([r,i])=>{if(!r.c)return;h+=`<tr><td>${r.name}${r.gast?' <span class="mu">(Gast)</span>':''}</td>`+K.map(k=>r.gast&&!'hij'.includes(k)?'<td></td>':`<td data-l="${L(k)}">${A('r',i,k,r[k]||'',1)}</td>`).join('')+`<td>${r.gast?`<button type="button" data-rm="${i}" aria-label="Gast entfernen">✕ Gast entfernen</button>`:''}</td></tr>`});
 return(S.rows.some(r=>r.c)?'':'<p class="mu">Noch niemand ausgewählt – bitte oben die Anwesenden antippen.</p>')+`<div class="w">${h}</table></div>`}
function stat(W,C){
 const L=k=>COLN(k);
 let h='<table class="stack t"><tr class="hd"><th>Name</th><th>Anwesend</th><th>Beitrag</th><th>Runde bezahlt</th><th>Summe</th><th>Rest letztes Kegeln</th><th>soll zahlen</th><th>Hat gezahlt</th><th>Noch zu zahlen</th></tr><tr><td>Preis</td><td></td><td data-l="Beitrag">'+A('p',0,'k',S.preise.k,OWN)+'</td><td colspan="6"></td></tr>';
 byOrd(W.rows).forEach(([r,i])=>{if(r.gast)return;const o=C.out[i],cv=k=>`<td class="cv${o[k]<0?' neg':''}" data-l="${L(k)}" id="v${i}${k}">${k=='k'&&!r.c?'x':fx(o[k])}</td>`;
  h+=`<tr><td>${r.name}</td><td data-l="Anwesend">${r.c?'x':''}</td>${cv('k')}<td data-l="Runde bezahlt">${A('r',i,'l',r.l||'',1)}</td>${cv('m')}<td class="cv" data-l="Rest letztes Kegeln">${fx(r.n)}</td>${cv('o')}<td data-l="Hat gezahlt">${A('r',i,'p',r.p||'',1)}</td>${cv('q')}</tr>`});
 h+=`<tr class="sum"><td>Summe</td><td id="tc" data-l="Anwesend">${C.t.c}</td>`+'klmnopq'.split('').map(k=>`<td id="t${k}" data-l="${L(k)}">${fx(C.t[k])}</td>`).join('')+'</tr></table>';
 return`<h2 id="s-stat">Statistik <span class="mu">Alle Mitglieder. Nicht Anwesende zahlen den Durchschnittsanteil. „Rest letztes Kegeln“ kommt automatisch vom letzten gespeicherten Abend.</span></h2><div class="w">${h}</div>`}
function render(){
 const W=V(),C=calc(W),L=HIST[0];
 $('#edit').innerHTML=`<div class="top"><label>Datum <input type="date" id="dat" data-a="d" value="${S.date}"></label>${OWN?'<button class="pri" id="sv">Abend speichern</button>':''}<span class="mu" id="ms"></span></div><p class="mu">Letzter gespeicherter Spieltag: ${L?dd(L.date):'–'}. ${OWN?'':'Speichern kann nur der Besitzer; Deine Eingaben bleiben als Entwurf erhalten.'}</p>`
 +chips()+eingabe()+stat(W,C)+side(W,1,C)
 +rekEdit();
 if(OWN){$('#sv').onclick=save;$('#rsv').onclick=saveRk}blatt();BTC=false;bergTal();sub()}
function upd(){
 const W=V(),C=calc(W);
 W.rows.forEach((r,i)=>{if(r.gast)return;for(const k of 'kmoq'){const e=$('#v'+i+k),v=C.out[i][k];if(!e)continue;e.textContent=k=='k'&&!r.c?'x':fx(v);e.classList.toggle('neg',v<0)}});
 COLS.forEach(([k])=>{const e=$('#t'+k);if(e)e.textContent=k=='c'?C.t.c:fx(C.t[k])});
 $('#kg').textContent=fx(C.gz);$('#ka').textContent=fx(C.aufs);$('#kn').textContent=fx(C.neu)}
const st=t=>$('#st').textContent=t,ms=t=>{const e=$('#ms');if(e)e.textContent=t};
function draft(){clearTimeout(tm);tm=setTimeout(()=>db&&db.doc('state/entwurf').set(clean(S)).then(()=>st('Entwurf gespeichert')).catch(e=>st('Entwurf konnte nicht gespeichert werden: '+(e.message||e.code))),800)}
$('#edit').addEventListener('click',e=>{
 const b=e.target.closest('[data-chip]');if(b){const r=S.rows[b.dataset.chip];r.c=r.c?0:1;if(r.c)r.ord=S.seq=(S.seq||0)+1;else delete r.ord;autoKoenige();render();draft();return}
 const x=e.target.closest('[data-rm]');if(x){S.rows.splice(x.dataset.rm,1);autoKoenige();render();draft();return}
 if(e.target.id=='gadd'){const n=$('#gn').value.trim(),m=t=>$('#gm').textContent=t;
  if(!n)return m('Bitte einen Namen eingeben.');
  if(MEM.liste.some(x=>norm(x)==norm(n)))return m('Das ist ein Mitglied – bitte oben auswählen.');
  if((MEM.weitere||[]).some(x=>norm(x)==norm(n)))return m('Das ist ein Mitglied, das hier nicht mehr ausgewählt wird.');
  if(S.rows.some(r=>r.gast&&norm(r.name)==norm(n)))return m('Dieser Gast ist schon eingetragen.');
  const gr=blank(MEM.gaeste.find(x=>norm(x)==norm(n))||n,1);gr.ord=S.seq=(S.seq||0)+1;S.rows.push(gr);render();draft()}});
const onIn=e=>{
 const t=e.target,a=t.dataset.a,i=t.dataset.i,k=t.dataset.k;if(!a)return;
 if(a=='rk'){RK[i][k]=k=='pt'?(t.value===''?null:+t.value):t.value;return}
 const v=t.dataset.e?eur(t.value):t.type=='number'?(t.value===''?0:+t.value):t.value;
 if(t.dataset.e&&e.type=='change')t.value=v?fx(v):'';
 if(a=='r')S.rows[i][k]=v;else if(a=='p'){if(!OWN)return;S.preise[k]=v}else if(a=='k')S.kasse[k]=v;else if(a=='d')S.date=v;
 else if(a=='kn')S.koenige[i].name=v;else if(a=='kp')S.koenige[i].pt=t.value===''?null:+t.value;
 if(a=='r'&&k=='e')autoKoenige();
 upd();draft()};
$('#edit').addEventListener('input',onIn);$('#edit').addEventListener('change',onIn);
$('#blatt').addEventListener('input',e=>{const t=e.target;if(!t.dataset.bl)return;const r=S.rows[t.dataset.i];if(!r)return;
 const a=S.blatt[r.name]=S.blatt[r.name]||Array(7).fill(0);a[+t.dataset.k]=t.value===''?0:Math.max(0,+t.value||0);
 $('#bs'+t.dataset.i).textContent=n0(bsum(a));autoKoenige();draft()});
const colNav=e=>{
 const t=e.target;if(!t.dataset||!(t.dataset.bl||t.dataset.bt)||(e.key!=='Tab'&&e.key!=='Enter')||e.ctrlKey||e.altKey||e.metaKey)return;
 const all=[...t.closest('table').querySelectorAll('input[data-bl],input[data-bt]')].sort((a,b)=>(+a.dataset.k)-(+b.dataset.k)||(+a.dataset.i)-(+b.dataset.i));
 const n=all[all.indexOf(t)+(e.shiftKey?-1:1)];
 if(!n)return;e.preventDefault();n.focus();if(n.select)n.select()};
$('#blatt').addEventListener('keydown',colNav);$('#bt').addEventListener('keydown',colNav);$('#hist').addEventListener('keydown',colNav);
async function save(){
 const L=HIST[0],W=V(),C=calc(W);
 if(!OWN||!db)return ms('Speichern ist nur dem Besitzer möglich.');
 if(!S.date)return ms('Bitte zuerst ein Datum wählen.');
 if(L&&S.date<=L.date)return ms('Das Datum muss nach dem letzten gespeicherten Spieltag ('+dd(L.date)+') liegen.');
 if(!C.t.c)return ms('Bitte mindestens ein anwesendes Mitglied auswählen.');
 const doc=clean({date:S.date,preise:S.preise,notiz:'',koenige:S.koenige,blatt:S.rows.filter(r=>r.c).map(r=>{const a=Array.from({length:7},(_,k)=>+((S.blatt[r.name]||[])[k])||0);return{name:r.name,...(r.gast?{gast:1}:{}),v:a,s:bsum(a)}}),
  ...(btShow().length?{bt:btSave()}:{}),
  kasse:{alt:W.kasse.alt,bahn:S.kasse.bahn||0,sonder:S.kasse.sonder||0,abgang:S.kasse.abgang||0,sonderText:(S.kasse.sonderText||'').trim(),abgangText:(S.kasse.abgangText||'').trim(),gezahlt:C.gz,aufs:C.aufs,neu:C.neu},
  rows:W.rows.filter(r=>r.c||!r.gast).map(r=>{const i=W.rows.indexOf(r),o=C.out[i];return r.gast?{name:r.name,gast:1,c:1,h:r.h,i:r.i,j:r.j}:{...r,ord:undefined,k:o.k,m:o.m,o:o.o,q:o.q}})});
 const neu=S.rows.filter(r=>r.gast&&!MEM.gaeste.some(x=>norm(x)==norm(r.name))).map(r=>r.name);
 try{await db.doc('sessions/'+S.date).set(doc);if(neu.length){MEM.gaeste=[...MEM.gaeste,...neu];await db.doc('state/mitglieder').set(clean(MEM))}}
 catch(e){return ms('Speichern fehlgeschlagen: '+(e.message||e.code))}
 HIST=[doc,...HIST];S={};sync();draft();render();hist(doc.date);ms('Abend gespeichert – Reste und Konto sind für den nächsten Abend übernommen.')}
const inHY=h=>!HYR||h.date.startsWith(HYR);
const hyrSel=()=>`<div class="top"><label>Jahr <select id="hyr"><option value="">Alle (${HIST.length} Spieltage)</option>${[...new Set(HIST.map(h=>h.date.slice(0,4)))].sort().reverse().map(y=>`<option value="${y}"${y==HYR?' selected':''}>${y} (${HIST.filter(h=>h.date.startsWith(y)).length})</option>`).join('')}</select></label></div>`;
function hist(sel){
 if(EDIT&&EDIT.date!=sel)EDIT=null;
 if(sel&&HYR&&sel.slice(0,4)!=HYR)HYR=sel.slice(0,4);
 HSEL=sel;$('#hist').innerHTML=(typeof dmImportBox==='function'?dmImportBox():'')+rekView('h-rek')+'<h2 id="h-tage">Gespeicherte Spieltage <span class="mu">'+(OWN?'Zum Ändern einen Abend wählen und „Bearbeiten“ antippen.':'Schreibgeschützt.')+'</span></h2>'+hyrSel()+'<div class="top days">'+HIST.filter(inHY).map(h=>`<button data-d="${h.date}"${h.date==sel?' class="on"':''}>${dd(h.date)}</button>`).join('')+'</div><div id="hd"></div>';
 const D=HIST.find(h=>h.date==sel);if(!D){sub();return}
 if(EDIT){$('#hd').innerHTML=editHtml();sub();return}
 const C=calc(D);D.rows.forEach((r,i)=>{if(r.m!=null)C.out[i]={k:r.k,m:r.m,o:r.o,q:r.q}});
 {const po=C.out.filter(o=>o.m!=null),has=k=>D.rows.some(r=>!isG(r)&&r[k]!=null);C.t.m=po.reduce((s,o)=>s+o.m,0);C.t.o=po.reduce((s,o)=>s+(+o.o||0),0);C.t.q=has('q')?po.reduce((s,o)=>s+(+o.q||0),0):null;if(!has('p'))C.t.p=null}
 const KN=D.kasse.alt==null;
 $('#hd').innerHTML=`<h2 id="h-tab">Spieltag ${dd(D.date)}</h2>`+(OWN?'<div class="top"><button class="pri" id="ebtn">Bearbeiten</button><span class="mu" id="em"></span></div>':'')+grid(D,C)+blattView(D)+btView(D)+side(D,0,{gz:D.kasse.gezahlt??(KN?null:C.gz),aufs:D.kasse.aufs??(KN?null:C.aufs),neu:D.kasse.neu??(KN?null:C.neu)});sub()}
$('#hist').onclick=e=>{const t=e.target.closest('button');if(!t)return;
 if(t.dataset.d){hist(t.dataset.d);return}
 if(t.dataset.ec!=null&&EDIT){const r=EDIT.doc.rows[t.dataset.ec];r.c=r.c?0:1;hist(HSEL);return}
 if(t.id=='ebtn')startEdit();else if(t.id=='esv')saveEdit();else if(t.id=='ecx'){EDIT=null;hist(HSEL)}};
$('#hist').addEventListener('change',e=>{if(e.target.id!='hyr')return;HYR=e.target.value;const cur=HIST.find(h=>h.date==HSEL),first=HIST.find(inHY);hist((cur&&inHY(cur)?cur:first||cur||{}).date);const s=$('#hyr');if(s)s.focus({preventScroll:true})});
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const rekView=id=>`<h2 id="${id||'h-rek'}">Rekorde</h2><div class="w"><table class="stack"><tr class="hd"><th>Kategorie</th><th>Name</th><th>Punkte</th><th>Datum</th></tr>${(CFG.rekorde||[]).map(r=>`<tr><td>${esc(r.t)}</td><td data-l="Name">${esc(r.name)}</td><td data-l="Punkte">${r.pt??''}</td><td data-l="Datum">${dd(r.datum)}</td></tr>`).join('')}</table></div>`;
function rekEdit(){
 if(!OWN)return rekView('s-rek')+'<p class="mu">Rekorde kann nur der Besitzer ändern.</p>';
 return`<h2 id="s-rek">Rekorde <span class="mu">Hier ändern und speichern. Die Rekorde gelten dann auch in der Historie.</span></h2><div class="w"><table class="stack"><tr class="hd"><th>Kategorie</th><th>Name</th><th>Punkte</th><th>Datum</th></tr>${RK.map((r,i)=>`<tr><td>${esc(r.t)}</td><td data-l="Name"><input type="text" data-a="rk" data-i="${i}" data-k="name" value="${esc(r.name)}"></td><td data-l="Punkte"><input type="number" step="any" inputmode="decimal" data-a="rk" data-i="${i}" data-k="pt" value="${r.pt??''}"></td><td data-l="Datum"><input type="date" data-a="rk" data-i="${i}" data-k="datum" value="${esc(r.datum)}"></td></tr>`).join('')}</table></div><div class="top"><button class="pri" id="rsv">Rekorde speichern</button><span class="mu" id="rm"></span></div>`}
async function saveRk(){
 const m=t=>{const e=$('#rm');if(e)e.textContent=t};
 if(!OWN||!db)return m('Speichern ist nur dem Besitzer möglich.');
 try{await db.doc('state/config').set(clean({...CFG,rekorde:RK}))}catch(e){return m('Speichern fehlgeschlagen: '+(e.message||e.code))}
 CFG={...CFG,rekorde:clean(RK)};hist(HSEL);m('Rekorde gespeichert – sie stehen jetzt auch in der Historie.')}
const bsum=a=>(a||[]).reduce((s,v,i)=>s+(+v||0)*(i+1),0),n0=v=>(+v).toLocaleString('de-DE',{maximumFractionDigits:2});
const bhead=()=>'<tr class="hd"><th>Name</th>'+[1,2,3,4,5,6,7].map(i=>`<th>${i} <span class="mu">(×${i})</span></th>`).join('')+'<th>Summe</th></tr>';
function blatt(){
 const rows=byOrd(S.rows).filter(([r])=>r.c);
 $('#blatt').innerHTML='<h2 id="d-tab">Dortmunder <span class="mu">Werte von links nach rechts eingeben. Jeder Wert wird mit seinem Multiplikator ×1 bis ×7 multipliziert und zur Summe addiert.</span></h2>'
 +(rows.length?`<div class="w"><table class="stack">${bhead()}${rows.map(([r,i])=>{const a=S.blatt[r.name]||[];return`<tr><td>${esc(r.name)}${r.gast?' <span class="mu">(Gast)</span>':''}</td>${[0,1,2,3,4,5,6].map(k=>`<td data-l="${k+1} (×${k+1})"><input type="number" min="0" step="any" inputmode="decimal" enterkeyhint="next" data-bl="1" data-i="${i}" data-k="${k}" value="${a[k]||''}"></td>`).join('')}<td class="cv" data-l="Summe"><b id="bs${i}">${n0(bsum(a))}</b></td></tr>`}).join('')}</table></div>`:'<p class="mu">Noch niemand ausgewählt – bitte in der Eingabe oben die Anwesenden antippen.</p>')
 +'<p class="note" id="d-kon"><span id="dkm">'+dkText()+'</span></p><p class="mu">Die Werte werden mit „Abend speichern“ (Tab Eingabe) zusammen mit dem Abend abgelegt und erscheinen dann in der Historie.</p>'}
const DK=KL.indexOf('Dortmunder'),PK=KL.indexOf('Pumpen - König'),TK=KL.indexOf('TBTBBTB');
const dkText=()=>S.auto&&S.auto[DK]?`Dortmunder-König (automatisch in der Eingabe unter Könige eingetragen): ${esc(S.auto[DK])} – ${n0(S.koenige[DK].pt)} Punkte`:'Der Teilnehmer mit der höchsten Summe wird automatisch als Dortmunder-König in der Eingabe unter Könige eingetragen (bei Gleichstand alle, mit „ / “ getrennt).';
function autoK(i,sc){
 let mx=0,best=[];
 S.rows.forEach(r=>{if(!r.c)return;const s=sc(r);if(s>mx+1e-9){mx=s;best=[r.name]}else if(s>0&&Math.abs(s-mx)<1e-9)best.push(r.name)});
 const k=S.koenige[i],nm=best.join(' / ');S.auto=S.auto||{};
 if(mx>0){k.name=nm;k.pt=+mx.toFixed(2)}else if(S.auto[i]&&k.name===S.auto[i]){k.name='';k.pt=null}
 S.auto[i]=mx>0?nm:'';
 const en=$('#edit input[data-a="kn"][data-i="'+i+'"]'),ep=$('#edit input[data-a="kp"][data-i="'+i+'"]');
 if(en)en.value=k.name||'';if(ep)ep.value=k.pt??''}
function autoKoenige(){
 autoK(DK,r=>bsum(S.blatt[r.name]));autoK(PK,r=>+r.e||0);autoK(TK,r=>btPS(r.name));
 const m=$('#dkm');if(m)m.textContent=dkText();const t=$('#btk');if(t)t.textContent=btkText()}
const btPS=n=>{const x=btShow().find(x=>x.p.some(y=>y.name==n));return x?btsum(btV(x.q)):0};
const btkText=()=>S.auto&&S.auto[TK]?`König „TBTBBTB“ (automatisch in der Eingabe unter Könige eingetragen): ${esc(S.auto[TK])} – ${n0(S.koenige[TK].pt)} Punkte`:'Das Paar mit der höchsten Summe wird automatisch als König „TBTBBTB“ in der Eingabe unter Könige eingetragen (bei Gleichstand alle, mit „ / “ getrennt; beide Spieler eines Paares).';
const blattView=D=>D.blatt&&D.blatt.length?`<h2 id="h-dm">Dortmunder</h2><div class="w"><table>${bhead()}${D.blatt.map(b=>`<tr><td>${esc(b.name)}${b.gast?' <span class="mu">(Gast)</span>':''}</td>${b.v.map(v=>`<td>${v?n0(v):''}</td>`).join('')}<td class="cv"><b>${n0(b.s)}</b></td></tr>`).join('')}</table></div>`:'';
const BTH=['Tal','Berg','Tal','Berg','Berg','Tal','Berg'],btsum=a=>(a||[]).reduce((s,v)=>s+(+v||0),0);
const btHead=()=>'<tr class="hd"><th>Paar</th>'+BTH.map(x=>`<th>${x}</th>`).join('')+'<th>Summe</th></tr>';
const btName=p=>p.map(x=>esc(x.name)+(x.gast?' <span class="mu">(Gast)</span>':'')).join(' &amp; ');
const btV=q=>Array.from({length:7},(_,k)=>+((q.v||[])[k])||0);
const rnd=n=>{if(window.crypto&&crypto.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return Math.floor(a[0]/4294967296*n)}return Math.floor(Math.random()*n)};
function btShow(){
 const pres=new Set(S.rows.filter(r=>r.c).map(r=>r.name));
 return (S.bt||[]).map((q,i)=>({i,q,p:q.p.filter(x=>pres.has(x.name))})).filter(x=>x.p.length)}
const btSave=()=>btShow().map(({q,p})=>{const v=btV(q);return{p:p.map(x=>({name:x.name,...(x.gast?{gast:1}:{})})),v,s:btsum(v)}});
let BTC=false;
function btDraw(){
 const w=S.rows.filter(r=>r.c).map(r=>({name:r.name,...(r.gast?{gast:1}:{})}));
 for(let i=w.length-1;i>0;i--){const j=rnd(i+1);[w[i],w[j]]=[w[j],w[i]]}
 S.bt=[];for(let i=0;i<w.length;i+=2)S.bt.push({p:w.slice(i,i+2),v:Array(7).fill(0)})}
function bergTal(){
 const sh=btShow(),pres=S.rows.filter(r=>r.c),inP=new Set(sh.flatMap(x=>x.p.map(y=>y.name))),open=pres.filter(r=>!inP.has(r.name));
 const two=sh.filter(x=>x.p.length==2).length,one=sh.length-two;
 let msg='';if(!sh.length)BTC=false;
 if(!pres.length)msg='Noch niemand ausgewählt – bitte in der Eingabe oben die Anwesenden antippen.';
 else if(BTC)msg='Es sind schon Werte eingetragen. Nochmal auf „Neu auslosen“ tippen, um die Paare zu ändern – die Werte werden dann gelöscht.';
 else if(!sh.length)msg=`${pres.length} Anwesende. Noch keine Paare – bitte „Paare auslosen“ tippen.`;
 else msg=`${pres.length} Anwesende: ${two} ${two==1?'Paar':'Paare'}${one?` und ${one} Einzelspieler`:''}.`+(open.length?` Noch nicht eingeteilt: ${open.map(r=>esc(r.name)).join(', ')} – bitte neu auslosen.`:'');
 $('#bt').innerHTML='<h2 id="bt-tab">Berg und Tal <span class="mu">Die Anwesenden aus der Eingabe werden zufällig zu Paaren gelost (bei ungerader Zahl spielt einer allein). In die Spalten Tal und Berg kommen die Werte; die Summe ist die Summe aller sieben Werte.</span></h2>'
 +`<div class="top" id="bt-paare"><button type="button" class="pri" id="btd"${pres.length?'':' disabled'}>${sh.length?'Neu auslosen':'Paare auslosen'}</button><span class="mu" id="btm">${msg}</span></div>`
 +(sh.length?`<div class="w" id="bt-werte"><table class="stack">${btHead()}${sh.map(({i,q,p})=>{const a=btV(q);return`<tr><td>${btName(p)}</td>${a.map((v,k)=>`<td data-l="${k+1}. ${BTH[k]}"><input type="number" step="any" inputmode="decimal" enterkeyhint="next" data-bt="1" data-i="${i}" data-k="${k}" value="${v||''}" aria-label="${BTH[k]} ${k+1}"></td>`).join('')}<td class="cv" data-l="Summe"><b id="bts${i}">${n0(btsum(a))}</b></td></tr>`}).join('')}</table></div>`:'')
 +'<p class="note" id="bt-kon"><span id="btk">'+btkText()+'</span></p><p class="mu">Paare und Werte werden mit „Abend speichern“ (Tab Eingabe) zusammen mit dem Abend abgelegt und erscheinen dann in der Historie.</p>';
}
$('#bt').addEventListener('click',e=>{
 if(e.target.id!='btd')return;
 const hasV=btShow().some(x=>btV(x.q).some(Boolean));
 if(hasV&&!BTC){BTC=true;bergTal();return}
 BTC=false;btDraw();autoKoenige();bergTal();sub();draft()});
$('#bt').addEventListener('input',e=>{const t=e.target;if(!t.dataset.bt)return;const q=(S.bt||[])[t.dataset.i];if(!q)return;
 q.v=btV(q);q.v[+t.dataset.k]=t.value===''?0:(+t.value||0);
 const el=$('#bts'+t.dataset.i);if(el)el.textContent=n0(btsum(q.v));autoKoenige();draft()});
const btView=D=>D.bt&&D.bt.length?`<h2 id="h-bt">Berg und Tal</h2><div class="w"><table class="stack">${btHead()}${D.bt.map(q=>`<tr><td>${btName(q.p)}</td>${btV(q).map((v,k)=>`<td data-l="${k+1}. ${BTH[k]}">${v?n0(v):''}</td>`).join('')}<td class="cv" data-l="Summe"><b>${n0(q.s)}</b></td></tr>`).join('')}</table></div>`:'';
//EDIT-START
let EDIT=null;
const linkedWith=(P,D)=>{if(!P||!P.kasse||!D.kasse)return false;if(Math.abs((+D.kasse.alt||0)-(+P.kasse.neu||0))>.005)return false;
 const q={};P.rows.forEach(r=>q[r.name]=+r.q||0);return D.rows.every(r=>isG(r)||Math.abs((+r.n||0)-(q[r.name]||0))<.005)};
function mk(D,P,base){
 const q={};P&&P.rows.forEach(r=>q[r.name]=+r.q||0);
 const rows=D.rows.map(r=>isG(r)?r:{...r,n:base?(+r.n||0):(q[r.name]||0)});
 const alt=base?(+D.kasse.alt||0):(P?+P.kasse.neu||0:0);
 const W={...D,rows,kasse:{...D.kasse,alt},preise:{d:0,e:0,f:0,g:0,h:0,i:0,k:0,...D.preise}};
 return{W,C:calc(W)}}
function fin(D,P,base){const{W,C}=mk(D,P,base);
 return{...D,rows:W.rows.map((r,i)=>isG(r)?r:{...r,k:C.out[i].k,m:C.out[i].m,o:C.out[i].o,q:C.out[i].q}),kasse:{...W.kasse,gezahlt:C.gz,aufs:C.aufs,neu:C.neu}}}
const inDiff=(a,b)=>Math.abs((+a.kasse.alt||0)-(+b.kasse.alt||0))>.005||b.rows.some((r,i)=>!isG(r)&&Math.abs((+r.n||0)-(+(a.rows[i]||{}).n||0))>.005);
const outDiff=(a,b)=>{const q={};a.rows.forEach(r=>q[r.name]=+r.q||0);return Math.abs((+a.kasse.neu||0)-(+b.kasse.neu||0))>.005||b.rows.some(r=>!isG(r)&&Math.abs((+r.q||0)-(q[r.name]||0))>.005)};
function startEdit(){
 if(!OWN)return;const asc=[...HIST].reverse(),idx=asc.findIndex(h=>h.date==HSEL);if(idx<0)return;
 const D=clean(asc[idx]),P=asc[idx-1]||null,lk={};
 asc.forEach((h,j)=>{lk[h.date]=j>0&&linkedWith(asc[j-1],h)});
 D.preise=D.preise||{};D.kasse=D.kasse||{};if(!(D.koenige&&D.koenige.length))D.koenige=KL.map(t=>({t,name:'',pt:null}));
 const bl={};(D.blatt||[]).forEach(b=>bl[b.name]=b.v.slice());
 EDIT={date:D.date,doc:D,bl,bt:clean(D.bt||[]),prev:P,base:!P||!lk[D.date],lk};hist(HSEL)}
function editHtml(){
 const X=EDIT,{W,C}=mk(X.doc,X.prev,X.base),b=X.base,L=k=>COLN(k);
 let h='<table class="stack t"><tr class="hd"><th>Name</th>'+COLS.map(c=>`<th>${c[1]}</th>`).join('')+'</tr><tr><td>Preis</td>'+COLS.map(([k])=>`<td${'defghik'.includes(k)?` data-l="${L(k)}"`:''}>${'defghik'.includes(k)?A('p',0,k,W.preise[k],1):''}</td>`).join('')+'</tr>';
 W.rows.forEach((r,i)=>{const o=C.out[i],gs=isG(r);
  h+=`<tr><td>${esc(r.name)}${r.gast?' <span class="mu">(Gast)</span>':''}</td>`+COLS.map(([k])=>{
   const d=`data-l="${L(k)}"`;
   if(k=='c')return`<td ${d}>${gs?'':`<button type="button" class="tg${r.c?' on':''}" data-ec="${i}" aria-label="Anwesenheit umschalten">${r.c?'✓ anwesend':'– fehlt'}</button>`}</td>`;
   if(gs&&!'hij'.includes(k))return'<td></td>';
   if('defghij'.includes(k))return`<td ${d}>${r.c||gs?A('r',i,k,r[k]||'',1):''}</td>`;
   if(k=='l'||k=='p')return`<td ${d}>${A('r',i,k,r[k]||'',1)}</td>`;
   if(k=='n'&&b)return`<td ${d}>${A('r',i,'n',r.n||'',1)}</td>`;
   const v=k=='n'?r.n:o[k];return`<td class="cv${v<0?' neg':''}" ${d} id="ev${i}${k}">${k=='k'&&!r.c?'x':fx(v)}</td>`}).join('')+'</tr>'});
 h+='<tr class="sum"><td>Summe</td>'+COLS.map(([k])=>`<td id="et${k}" data-l="${L(k)}">${k=='c'?C.t.c:eu(C.t[k])}</td>`).join('')+'</tr></table>';
 const pr=W.rows.map((r,i)=>[r,i]).filter(([r])=>r.c);
 const bt=pr.length?`<h2 id="h-dm">Dortmunder</h2><div class="w"><table class="stack">${bhead()}${pr.map(([r,i])=>{const a=X.bl[r.name]||[];return`<tr><td>${esc(r.name)}${r.gast?' <span class="mu">(Gast)</span>':''}</td>${[0,1,2,3,4,5,6].map(k=>`<td data-l="${k+1} (×${k+1})"><input type="number" min="0" step="any" inputmode="decimal" enterkeyhint="next" data-bl="1" data-i="${i}" data-k="${k}" value="${a[k]||''}"></td>`).join('')}<td class="cv" data-l="Summe"><b id="ebs${i}">${n0(bsum(a))}</b></td></tr>`}).join('')}</table></div>`:'';
 const pn=new Set(pr.map(([r])=>r.name)),tq=(X.bt||[]).map((q,i)=>({q,i,p:q.p.filter(x=>pn.has(x.name))})).filter(x=>x.p.length);
 const tb=tq.length?`<h2 id="h-bt">Berg und Tal <span class="mu">Die Paare bleiben wie gespeichert; hier lassen sich nur die Werte ändern.</span></h2><div class="w"><table class="stack">${btHead()}${tq.map(({q,i,p})=>{const a=btV(q);return`<tr><td>${btName(p)}</td>${a.map((v,k)=>`<td data-l="${k+1}. ${BTH[k]}"><input type="number" step="any" inputmode="decimal" enterkeyhint="next" data-bt="1" data-i="${i}" data-k="${k}" value="${v||''}" aria-label="${BTH[k]} ${k+1}"></td>`).join('')}<td class="cv" data-l="Summe"><b id="ebts${i}">${n0(btsum(a))}</b></td></tr>`}).join('')}</table></div>`:'';
 const info=b?'Dieser Abend steht am Anfang einer Kette: „Rest letztes Kegeln“ und „Alter Konto“ sind hier direkt änderbar.':'„Rest letztes Kegeln“ und „Alter Konto“ kommen automatisch vom Vorabend ('+dd(X.prev.date)+').';
 return`<h2 id="h-tab">Spieltag ${dd(X.date)} bearbeiten</h2><div class="top"><button class="pri" id="esv">Änderungen speichern</button><button id="ecx">Abbrechen</button><span class="mu" id="em"></span></div>
 <p class="note">Das Datum bleibt fest. ${info} Beim Speichern werden die Folgeabende neu berechnet, solange ihre Reste und ihr Kontostand vom Vorabend stammen.</p>
 <div class="w">${h}</div>${bt}${tb}${side(W,1,C,'e',b)}`}
function eupd(){
 const X=EDIT;if(!X)return;const{W,C}=mk(X.doc,X.prev,X.base);
 W.rows.forEach((r,i)=>{if(isG(r))return;for(const k of 'kmoq'){const e=$('#ev'+i+k),v=C.out[i][k];if(!e)continue;e.textContent=k=='k'&&!r.c?'x':fx(v);e.classList.toggle('neg',v<0)}});
 COLS.forEach(([k])=>{const e=$('#et'+k);if(e)e.textContent=k=='c'?C.t.c:eu(C.t[k])});
 $('#ekg').textContent=fx(C.gz);$('#eka').textContent=fx(C.aufs);$('#ekn').textContent=fx(C.neu)}
const onEd=e=>{const X=EDIT;if(!X)return;const t=e.target,a=t.dataset.a,i=t.dataset.i,k=t.dataset.k,D=X.doc;
 if(t.dataset.bt){const q=(X.bt||[])[i];if(!q)return;q.v=btV(q);q.v[+k]=t.value===''?0:(+t.value||0);const el=$('#ebts'+i);if(el)el.textContent=n0(btsum(q.v));return}
 if(t.dataset.bl){const r=D.rows[i];if(!r)return;const v=X.bl[r.name]=X.bl[r.name]||Array(7).fill(0);v[+k]=t.value===''?0:Math.max(0,+t.value||0);const el=$('#ebs'+i);if(el)el.textContent=n0(bsum(v));return}
 if(!a)return;
 const v=t.dataset.e?eur(t.value):t.type=='number'?(t.value===''?0:+t.value):t.value;
 if(t.dataset.e&&e.type=='change')t.value=v?fx(v):'';
 if(a=='r')D.rows[i][k]=v;else if(a=='p')D.preise[k]=v;else if(a=='k')D.kasse[k]=v;
 else if(a=='kn')D.koenige[i].name=v;else if(a=='kp')D.koenige[i].pt=t.value===''?null:+t.value;
 eupd()};
$('#hist').addEventListener('input',onEd);$('#hist').addEventListener('change',onEd);
async function saveEdit(){
 const X=EDIT,m=t=>{const e=$('#em');if(e)e.textContent=t};
 if(!OWN||!db||!X)return m('Speichern ist nur dem Besitzer möglich.');
 const asc=[...HIST].reverse(),idx=asc.findIndex(h=>h.date==X.date);if(idx<0)return m('Abend nicht gefunden.');
 const E=clean(X.doc);
 const blatt=E.rows.filter(r=>r.c).map(r=>{const a=Array.from({length:7},(_,k)=>+((X.bl[r.name]||[])[k])||0);return{name:r.name,...(r.gast?{gast:1}:{}),v:a,s:bsum(a)}});
 if(E.blatt||blatt.some(b=>b.s||b.v.some(Boolean)))E.blatt=blatt;else delete E.blatt;
 const pn=new Set(E.rows.filter(r=>r.c).map(r=>r.name)),tq=clean(X.bt||[]).map(q=>{const v=btV(q);return{p:q.p.filter(x=>pn.has(x.name)),v,s:btsum(v)}}).filter(q=>q.p.length);
 if(tq.length)E.bt=tq;else delete E.bt;
 if(!mk(E,X.prev,X.base).C.t.c)return m('Bitte mindestens ein anwesendes Mitglied auswählen.');
 const list=asc.slice(),ch=[idx];list[idx]=clean(fin(E,X.prev,X.base));let brk=null;
 for(let j=idx+1;j<list.length;j++){
  if(!X.lk[list[j].date]){brk=j;break}
  const nx=clean(fin(list[j],list[j-1],false));if(!inDiff(list[j],nx))break;
  list[j]=nx;ch.push(j)}
 const done=[];
 try{for(const j of ch){await db.doc('sessions/'+list[j].date).set(list[j]);done.push(j);const hi=HIST.findIndex(x=>x.date==list[j].date);if(hi>=0)HIST[hi]=list[j]}}
 catch(err){render();return m('Speichern fehlgeschlagen'+(done.length?' (bereits gespeichert: '+done.map(j=>dd(list[j].date)).join(', ')+')':'')+': '+(err.message||err.code))}
 const fl=ch.slice(1).map(j=>dd(list[j].date));
 let msg='Gespeichert.'+(fl.length?' Folgeabende neu berechnet: '+fl.join(', ')+'.':'');
 if(brk!=null&&outDiff(asc[brk-1],list[brk-1]))msg+=' Ab '+dd(list[brk].date)+' ist die Kette unterbrochen (dort stammen die Reste nicht vom Vorabend); dieser Abend und alle folgenden blieben unverändert.';
 EDIT=null;render();hist(HSEL);m(msg)}
//EDIT-END
const present=r=>r.c||isG(r);
const names=()=>[...MEM.liste,...(MEM.weitere||[]),...MEM.gaeste];
const ST={kt:'none',kc:'s',et:'none',ec:'d',vc:'m',vw:'',dt:'none'};
const COLN=k=>COLS.find(c=>c[0]==k)[1];
const fmtC=(k,v,avg)=>v==null||isNaN(v)?'':k=='j'||k=='m'?eu(v):'defghi'.includes(k)?(avg?fx(v):iv(v)):fx(v);
const sel=(key,opts,val)=>`<select data-s="${key}">${opts.map(([v,l])=>`<option value="${esc(v)}"${String(v)==String(val)?' selected':''}>${esc(l)}</option>`).join('')}</select>`;
const TYPES=[['none','Kein Diagramm'],['bar','Balken'],['pie','Torte']];
function ticks(lo,hi,n){if(hi<=lo)hi=lo+1;const raw=(hi-lo)/n,p=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/p,st=(f<=1?1:f<=2?2:f<=5?5:10)*p,a=Math.floor(lo/st+1e-9)*st,b=Math.ceil(hi/st-1e-9)*st,r=[];for(let v=a;v<=b+st/2;v+=st)r.push(+v.toFixed(8));return r}
function barSvg(it,fmt,aria){
 const W=560,L=130,R=80,rh=28,bh=18,H=it.length*rh+8,mx=Math.max(...it.map(x=>x.v)),aw=W-L-R;
 const rows=it.map((x,i)=>{const y=4+i*rh+(rh-bh)/2,w=Math.max(2,x.v/mx*aw),r=Math.min(4,w/2,bh/2),t=fmt(x.v);
  return`<g data-tip="${esc(x.n+': '+t)}"><rect x="0" y="${4+i*rh}" width="${W}" height="${rh}" fill="transparent"/><text class="tx" x="${L-8}" y="${y+bh/2+4}" text-anchor="end">${esc(x.n)}</text><path class="b1" d="M${L},${y}h${(w-r).toFixed(1)}a${r},${r} 0 0 1 ${r},${r}v${bh-2*r}a${r},${r} 0 0 1 -${r},${r}h-${(w-r).toFixed(1)}z"/><text class="tv" x="${(L+w+6).toFixed(1)}" y="${y+bh/2+4}">${esc(t)}</text></g>`}).join('');
 return`<svg viewBox="0 0 ${W} ${H}" class="ch" role="img" aria-label="${esc(aria)}"><line class="ax" x1="${L}" y1="2" x2="${L}" y2="${H-2}"/>${rows}</svg>`}
function pieHtml(it,fmt,aria){
 const tot=it.reduce((a,x)=>a+x.v,0),R=100,c=104,P=a=>[c+R*Math.cos(a),c+R*Math.sin(a)];let a0=-Math.PI/2;
 const colr=(x,i)=>x.o?'var(--sx)':`var(--s${i+1})`;
 const sl=it.map((x,i)=>{const a1=a0+x.v/tot*2*Math.PI,tip=esc(`${x.n}: ${fmt(x.v)} (${Math.round(x.v/tot*100)} %)`);let s;
  if(it.length==1)s=`<circle class="sl" cx="${c}" cy="${c}" r="${R}" fill="${colr(x,i)}" data-tip="${tip}"/>`;
  else{const[p0,q0]=P(a0),[p1,q1]=P(a1);s=`<path class="sl" fill="${colr(x,i)}" data-tip="${tip}" d="M${c},${c}L${p0.toFixed(2)},${q0.toFixed(2)}A${R},${R} 0 ${a1-a0>Math.PI?1:0} 1 ${p1.toFixed(2)},${q1.toFixed(2)}Z"/>`}
  a0=a1;return s}).join('');
 const lg=it.map((x,i)=>`<div class="lg"><i class="sw" style="background:${colr(x,i)}"></i><span>${esc(x.n)}</span><b>${esc(fmt(x.v))}</b><span class="mu">${Math.round(x.v/tot*100)} %</span></div>`).join('');
 return`<div class="pie"><svg viewBox="0 0 ${2*c} ${2*c}" class="ch" role="img" aria-label="${esc(aria)}">${sl}</svg><div class="lgs">${lg}</div></div>`}
function lineSvg(pts,fmt,aria){
 const W=620,H=270,L=56,R=18,T=14,B=46,pw=W-L-R,ph=H-T-B,vs=pts.map(p=>p.y).filter(v=>v!=null);
 const tk=ticks(Math.min(0,...vs),Math.max(0,...vs),4),lo=tk[0],hi=tk[tk.length-1],n=pts.length,X=i=>n==1?L+pw/2:L+i*pw/(n-1),Y=v=>T+ph-(v-lo)/(hi-lo)*ph,half=n==1?pw/2:pw/(n-1)/2,step=Math.ceil(n*56/pw);
 const grid=tk.map(v=>`<line class="gr" x1="${L}" x2="${W-R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="ty" x="${L-8}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end">${(+v).toLocaleString('de-DE',{maximumFractionDigits:2})}</text>`).join('');
 let d='',pv=false;pts.forEach((p,i)=>{if(p.y==null){pv=false;return}d+=(pv?'L':'M')+X(i).toFixed(1)+','+Y(p.y).toFixed(1);pv=true});
 const xl=pts.map((p,i)=>i%step?'':`<text class="ty" x="${X(i).toFixed(1)}" y="${H-B+18}" text-anchor="middle">${dd(p.x).slice(0,6)+dd(p.x).slice(8)}</text>`).join('');
 const hits=pts.map((p,i)=>`<g class="pt" data-tip="${esc(dd(p.x)+': '+(p.y==null?'keine Daten':fmt(p.y)))}"><rect x="${(X(i)-half).toFixed(1)}" y="${T}" width="${(2*half).toFixed(1)}" height="${ph}" fill="transparent"/><line class="xl" x1="${X(i).toFixed(1)}" x2="${X(i).toFixed(1)}" y1="${T}" y2="${T+ph}"/>${p.y==null?'':`<circle class="mk" cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="4"/>`}</g>`).join('');
 return`<svg viewBox="0 0 ${W} ${H}" class="ch" role="img" aria-label="${esc(aria)}">${grid}<path class="ln" d="${d}"/>${hits}${xl}</svg>`}
function chart(type,items,fmt,title){
 const it=items.filter(x=>x.v>0).sort((a,b)=>b.v-a.v||a.n.localeCompare(b.n));
 if(!it.length)return'<p class="mu">Keine Werte größer 0 für diese Auswahl.</p>';
 const aria=title+': '+it.map(x=>x.n+' '+fmt(x.v)).join(', ');
 const pie=it.length>8?[...it.slice(0,7),{n:'Übrige',v:it.slice(7).reduce((a,x)=>a+x.v,0),o:1}]:it;
 return`<div class="cap">${esc(title)}</div><div class="w cw">${type=='pie'?pieHtml(pie,fmt,aria):barSvg(it,fmt,aria)}</div>`}
function aus(){
 const yrs=[...new Set(HIST.map(h=>h.date.slice(0,4)))].sort().reverse(),H=HIST.filter(h=>!YR||h.date.startsWith(YR)),N=names(),canon=n=>N.find(x=>norm(x)==norm(n))||n.trim();
 const rk=(rows,key)=>{let p=0;return rows.map((r,i)=>{if(!i||r[key]!=rows[i-1][key])p=i+1;return{...r,rang:p}})};
 const kt={};H.forEach(h=>(h.koenige||[]).forEach(k=>{const j=KL.indexOf(k.t);if(j<0)return;(k.name||'').split('/').map(canon).filter(Boolean).forEach(n=>(kt[n]=kt[n]||{n,v:[0,0,0,0,0],s:0}).v[j]++)}));
 Object.values(kt).forEach(x=>x.s=x.v.reduce((a,b)=>a+b,0));
 const K=rk(Object.values(kt).sort((a,b)=>b.s-a.s||a.n.localeCompare(b.n)),'s');
 const at={},ek={};H.forEach(h=>h.rows.forEach(r=>{if(!present(r))return;const a=at[r.name]=at[r.name]||{n:r.name,a:0,l:''};a.a++;if(h.date>a.l)a.l=h.date;
  const e=ek[r.name]=ek[r.name]||{n:r.name,a:0,d:0,e:0,f:0,g:0,h:0,i:0,j:0};e.a++;for(const k of 'defghij')e[k]+=+r[k]||0}));
 const A2=rk(Object.values(at).sort((a,b)=>b.a-a.a||a.n.localeCompare(b.n)),'a'),typ=n=>MEM.gaeste.includes(n)?'Gast':'Mitglied',T=(hd,rows)=>`<div class="w"><table><tr>${hd.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.join('')}</table></div>`;
 const num=(v,a)=>MODE=='avg'?(v/a).toLocaleString('de-DE',{maximumFractionDigits:2}):k=>v;
 const E=Object.values(ek).sort((a,b)=>b.a-a.a||a.n.localeCompare(b.n));
 const kcol=ST.kc=='s'?'Gesamt':KL[+ST.kc].replace(' - König',''),eAvg=MODE=='avg',efmt=v=>fmtC(ST.ec,v,eAvg);
 const kCtl=`<div class="top"><label>Diagramm ${sel('kt',TYPES,ST.kt)}</label>${ST.kt!='none'?`<label>Spalte ${sel('kc',[['s','Gesamt'],...KL.map((k,i)=>[i,k.replace(' - König','')])],ST.kc)}</label>`:''}</div>`+(ST.kt!='none'?chart(ST.kt,Object.values(kt).map(x=>({n:x.n,v:ST.kc=='s'?x.s:x.v[+ST.kc]})),v=>iv(v),'Könige – '+kcol):'');
 const eCtl=`<div class="top"><label>Diagramm ${sel('et',TYPES,ST.et)}</label>${ST.et!='none'?`<label>Spalte ${sel('ec',[...'defghij'].map(k=>[k,COLN(k)]),ST.ec)}</label>`:''}</div>`+(ST.et!='none'?chart(ST.et,E.map(x=>({n:x.n,v:eAvg?x[ST.ec]/x.a:x[ST.ec]})),efmt,COLN(ST.ec)+(eAvg?' (Ø pro anwesendem Abend)':' (Summe)')):'');
 const dm={};let dmN=0;
 H.forEach(h=>{if(!h.blatt||!h.blatt.length)return;dmN++;h.blatt.forEach(b=>{const n=canon(b.name),o=dm[n]=dm[n]||{n,a:0,v:[0,0,0,0,0,0,0],s:0};o.a++;(b.v||[]).forEach((x,i)=>{if(i<7)o.v[i]+=+x||0});o.s+=typeof b.s=='number'?b.s:bsum(b.v)})});
 const DMr=rk(Object.values(dm).map(o=>({...o,avg:o.s/o.a})).sort((a,b)=>b.avg-a.avg||b.s-a.s||a.n.localeCompare(b.n)),'avg'),dmT=DMr.reduce((t,o)=>{t.a+=o.a;t.s+=o.s;o.v.forEach((x,i)=>t.v[i]+=x);return t},{a:0,s:0,v:[0,0,0,0,0,0,0]});
 const dmSec=`<h2 id="a-dm">Dortmunder <span class="mu">${YR?'Zeitraum '+YR:'Alle Jahre'}. Summen aus allen Dortmunder-Blättern; Ø pro Teilnahme = Summe ÷ Teilnahmen. Als Teilnahme zählt jeder Eintrag in einem Dortmunder-Blatt, auch ohne Punkte.</span></h2>`
  +(DMr.length?`<p class="note">Ø aller Teilnahmen: <b>${fx(dmT.s/dmT.a)}</b> Punkte (${dmT.a} Teilnahmen von ${DMr.length} Beteiligten an ${dmN} ${dmN==1?'Abend':'Abenden'}${YR?' in '+YR:''})</p><div class="top"><label>Diagramm ${sel('dt',TYPES,ST.dt)}</label></div>`+(ST.dt!='none'?chart(ST.dt,DMr.map(x=>({n:x.n,v:x.avg})),fx,'Dortmunder – Ø pro Teilnahme'+(YR?' '+YR:'')):'')
   +T(['Name','Teilnahmen',...[1,2,3,4,5,6,7].map(i=>`${i} <span class="mu">(×${i})</span>`),'Summe','Ø pro Teilnahme'],[...DMr.map(x=>`<tr><td>${x.rang}. ${esc(x.n)}${typ(x.n)=='Gast'?' <span class="mu">(Gast)</span>':''}</td><td>${x.a}</td>${x.v.map(v=>`<td>${v?n0(v):''}</td>`).join('')}<td>${n0(x.s)}</td><td class="cv"><b>${fx(x.avg)}</b></td></tr>`),`<tr class="sum"><td><b>Alle Beteiligten</b></td><td><b>${dmT.a}</b></td>${dmT.v.map(v=>`<td><b>${v?n0(v):''}</b></td>`).join('')}<td><b>${n0(dmT.s)}</b></td><td class="cv"><b>${fx(dmT.s/dmT.a)}</b></td></tr>`])
  :`<p class="mu">${YR?`Für ${YR} gibt es keine Abende mit Dortmunder-Werten. Mit „Zeitraum: Alle“ siehst du alle Jahre.`:'Es gibt noch keine Abende mit Dortmunder-Werten. Sie werden in der Eingabe unter „Dortmunder“ erfasst und mit dem Abend gespeichert.'}</p>`);
 const Hs=H.slice().sort((a,b)=>a.date<b.date?-1:1),who=[...new Set(H.flatMap(h=>h.rows.map(r=>r.name)))].sort((a,b)=>a.localeCompare(b));
 if(ST.vw&&!who.includes(ST.vw))ST.vw='';
 const vlab=ST.vc=='@neu'?'Kontostand (Neuer Konto)':ST.vc=='@anw'?'Anwesende (Anzahl)':COLN(ST.vc);
 const pts=Hs.map(h=>{
  if(ST.vc=='@neu')return{x:h.date,y:typeof h.kasse.neu=='number'?h.kasse.neu:null};
  if(ST.vc=='@anw')return{x:h.date,y:h.rows.filter(r=>present(r)&&(!ST.vw||r.name==ST.vw)).length};
  let s=0,c=0;h.rows.forEach(r=>{if(ST.vw&&r.name!=ST.vw)return;const v=r[ST.vc];if(typeof v!='number'||('defghij'.includes(ST.vc)&&!present(r)))return;s+=v;c++});return{x:h.date,y:c?s:null}}),vfmt=v=>ST.vc=='@neu'?eu(v):ST.vc=='@anw'?iv(v):fmtC(ST.vc,v,false),vt=vlab+(ST.vc=='@neu'?'':' – '+(ST.vw||'alle zusammen'));
 const vSec=`<h2 id="a-ver">Verlauf <span class="mu">Alle Spieltage im gewählten Zeitraum, gleichmäßig verteilt.</span></h2><div class="top"><label>Spalte ${sel('vc',[...COLS.filter(c=>c[0]!='c').map(c=>[c[0],c[1]]),['@anw','Anwesende (Anzahl)'],['@neu','Kontostand (Neuer Konto)']],ST.vc)}</label>${ST.vc=='@neu'?'':`<label>Auswahl ${sel('vw',[['','Alle zusammen (Summe)'],...who.map(n=>[n,n])],ST.vw)}</label>`}</div>`+(pts.some(p=>p.y!=null)?`<div class="cap">${esc(vt)}</div><div class="w cw">${lineSvg(pts,vfmt,vt+': '+pts.filter(p=>p.y!=null).length+' Werte von '+dd(pts[0].x)+' bis '+dd(pts[pts.length-1].x))}</div><details><summary class="mu">Werte als Tabelle</summary>${T(['Spieltag',vlab],pts.map(p=>`<tr><td>${dd(p.x)}</td><td>${p.y==null?'':vfmt(p.y)}</td></tr>`))}</details>`:'<p class="mu">Für diese Auswahl liegen keine Werte vor.</p>');
 const JY={};HIST.forEach(h=>{const y=h.date.slice(0,4),o=JY[y]=JY[y]||{y,n:0,m:0,g:0,z:0,last:'',neu:null},pr=h.rows.filter(present);o.n++;o.m+=pr.filter(r=>!isG(r)).length;o.g+=pr.filter(isG).length;o.z+=+h.kasse.gezahlt||0;if(h.date>o.last){o.last=h.date;o.neu=h.kasse.neu}});
 const jSec=`<h2 id="a-jahr">Jahresübersicht <span class="mu">Alle Jahre, unabhängig vom gewählten Zeitraum.</span></h2>${T(['Jahr','Abende','Ø Mitglieder pro Abend','Gäste (Teilnahmen)','Eingezahlt','Kontostand Jahresende'],Object.values(JY).sort((a,b)=>b.y.localeCompare(a.y)).map(o=>`<tr><td>${o.y}</td><td>${o.n}</td><td>${(o.m/o.n).toLocaleString('de-DE',{maximumFractionDigits:1})}</td><td>${o.g||''}</td><td>${eu(o.z)}</td><td>${typeof o.neu=='number'?eu(o.neu):''}</td></tr>`))}`;
 const aTop=`<div class="top"><label>Zeitraum <select id="yr"><option value="">Alle (${HIST.length} Abende)</option>${yrs.map(y=>`<option${y==YR?' selected':''}>${y}</option>`).join('')}</select></label><label>Einzelergebnisse <select id="md"><option value="sum">Summe</option><option value="avg"${MODE=='avg'?' selected':''}>Ø pro anwesendem Abend</option></select></label></div>`;
 const kSec=`<h2 id="a-kon">Könige-Rangliste <span class="mu">Sortiert nach Gesamtzahl der Titel. Geteilte Titel zählen für jeden.</span></h2>${kCtl}${T(['Rang',...KL.map(k=>k.replace(' - König',''))],K.map(x=>`<tr><td>${x.rang}. ${x.n}</td>${x.v.map(v=>`<td>${v||''}</td>`).join('')}</tr>`))}`;
 const aSec=`<h2 id="a-anw">Anwesenheit</h2>${T(['Name','Typ','Abende','Quote','','zuletzt dabei'],A2.map(x=>{const q=H.length?x.a/H.length:0;return`<tr><td>${x.rang}. ${x.n}</td><td>${typ(x.n)}</td><td>${x.a}</td><td>${Math.round(q*100)} %</td><td style="text-align:left"><span class="bar" style="width:${Math.round(q*100)}px"></span></td><td>${dd(x.l)}</td></tr>`}))}`;
 const eSec=`<h2 id="a-ein">Einzelergebnisse <span class="mu">${MODE=='avg'?'Ø pro anwesendem Abend':'Summe über alle anwesenden Abende'}; Lotterie in €.</span></h2>${eCtl}${T(['Name','Abende',...'defghij'.split('').map(k=>COLS.find(c=>c[0]==k)[1])],E.map(x=>`<tr><td>${x.n}</td><td>${x.a}</td>${'defghij'.split('').map(k=>{const v=MODE=='avg'?x[k]/x.a:x[k];return`<td>${k=='j'?eu(v):MODE=='avg'?fx(v):iv(v)}</td>`}).join('')}</tr>`))}`;
 $('#aus').innerHTML=aTop+`${dmSec}${kSec}${eSec}${aSec}${vSec}${jSec}`;sortTables();sub()}
$('#aus').addEventListener('change',e=>{const t=e.target;if(t.id=='yr')YR=t.value;if(t.id=='md')MODE=t.value;if(t.dataset.s)ST[t.dataset.s]=t.value;aus()});
// Auswertung: Spalten per Klick auf die Überschrift absteigend sortieren (große Werte zuerst).
// Summenzeilen (tr.sum, z. B. „Alle Beteiligten“) werden nicht mitsortiert und bleiben am Tabellenende.
const SRT={};
const sortVal=(c,rank)=>{const t=(c?c.textContent:'').trim();if(!t)return{e:1};
 if(rank){const m=t.match(/^(\d+)\./);if(m)return{n:+m[1]}}
 const d=t.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);if(d)return{n:+(d[3]+d[2]+d[1])};
 const u=t.replace(/[€%\s ]/g,'').replace(/^[×x]/,'');
 if(/^-?\d[\d.]*(,\d+)?$/.test(u)||/^-?\d+(\.\d+)?$/.test(u)&&!/\./.test(u))return{n:parseFloat(u.replace(/\./g,'').replace(',','.'))};
 return{s:t.replace(/^\d+\.\s*/,'').toLowerCase()}};
function sortTables(){
 document.querySelectorAll('#aus table').forEach(tb=>{
  let el=tb.closest('.w'),id='';while(el&&!id){el=el.previousElementSibling;if(el&&el.tagName=='H2')id=el.id}
  const ths=[...tb.rows[0].cells];
  ths.forEach((th,j)=>{
   if(!th.textContent.trim())return;
   th.tabIndex=0;th.setAttribute('role','button');th.classList.add('srt');
   th.setAttribute('aria-sort',SRT[id]===j?'descending':'none');
   const go=()=>{SRT[id]=j;sortTables()};
   th.onclick=go;th.onkeydown=e=>{if(e.key=='Enter'||e.key==' '){e.preventDefault();go()}}});
  const j=SRT[id];if(j==null||j>=ths.length)return;
  const rank=/^Rang/.test(ths[j].textContent.trim()),all=[...tb.rows].slice(1),body=all.filter(r=>!r.classList.contains('sum')),sums=all.filter(r=>r.classList.contains('sum'));
  const key=body.map((r,i)=>({r,i,v:sortVal(r.cells[j],rank)}));
  key.sort((x,y)=>{if(x.v.e||y.v.e)return(x.v.e||0)-(y.v.e||0)||x.i-y.i;
   if(x.v.n!=null&&y.v.n!=null)return y.v.n-x.v.n||x.i-y.i;
   if(x.v.n!=null)return-1;if(y.v.n!=null)return 1;
   return y.v.s.localeCompare(x.v.s,'de')||x.i-y.i});
  key.forEach(k=>tb.tBodies[0].appendChild(k.r));sums.forEach(r=>tb.tBodies[0].appendChild(r))})}
function members(){
 const JY=HIST.length?HIST[0].date.slice(0,4):'';
 const rows=names().map(n=>{const a=HIST.filter(h=>h.rows.some(r=>r.name==n&&present(r))).map(h=>h.date).sort().reverse();return{n,t:MEM.gaeste.includes(n)?'Gast':'Mitglied',a:a.length,y:a.filter(d=>d.startsWith(JY)).length,l:a[0]}}).sort((a,b)=>(a.t=='Gast')-(b.t=='Gast')||b.a-a.a);
 $('#mem').innerHTML=`<h2 id="m-liste">Mitgliederliste (${MEM.liste.length+(MEM.weitere||[]).length} Mitglieder, ${MEM.gaeste.length} Gäste)</h2><div class="w"><table><tr><th>Name</th><th>Typ</th><th>Abende anwesend</th><th>davon ${JY}</th><th>zuletzt dabei</th></tr>${rows.map(r=>`<tr><td>${r.n}</td><td>${r.t}</td><td>${r.a}</td><td>${r.y}</td><td>${dd(r.l)}</td></tr>`).join('')}</table></div>`
 +(OWN?`<div class="top" id="m-neu"><input type="text" id="nm" placeholder="Neues Mitglied"><button class="pri" id="add">Hinzufügen</button><span class="mu" id="mm"></span></div>`:'<p class="mu">Neue Mitglieder und die Reihenfolge der Liste kann nur der Besitzer ändern. Gäste werden bei der Eingabe angelegt.</p>')+(OWN?reihe():'');
 if(OWN)$('#add').onclick=addMember;sub()}
const reihe=()=>`<h2 id="m-reihe">Reihenfolge der Liste <span class="mu">Bestimmt die Reihenfolge der Anwesenheits-Knöpfe in der Eingabe. Das kann nur der Besitzer ändern.</span></h2><div class="w"><table><tr><th>Name</th><th>Verschieben</th></tr>${MEM.liste.map((n,i)=>`<tr><td>${i+1}. ${esc(n)}</td><td class="mvc"><button type="button" class="mv" data-mv="${i}" data-dir="-1" aria-label="${esc(n)} nach oben"${i?'':' disabled'}>↑</button><button type="button" class="mv" data-mv="${i}" data-dir="1" aria-label="${esc(n)} nach unten"${i<MEM.liste.length-1?'':' disabled'}>↓</button></td></tr>`).join('')}</table></div><p class="mu" id="m-rm" aria-live="polite"></p>`;
let MVB=false;
$('#mem').addEventListener('click',async e=>{
 const b=e.target.closest('[data-mv]');if(!b||!OWN||!db||MVB)return;
 const i=+b.dataset.mv,d=+b.dataset.dir,j=i+d,L=MEM.liste.slice(),m=t=>{const x=$('#m-rm');if(x)x.textContent=t};
 if(j<0||j>=L.length)return;[L[i],L[j]]=[L[j],L[i]];MVB=true;
 try{await db.doc('state/mitglieder').set(clean({...MEM,liste:L}))}catch(err){MVB=false;return m('Speichern fehlgeschlagen: '+(err.message||err.code))}
 MVB=false;MEM.liste=L;sync();draft();render();members();
 const f=document.querySelector(`#mem [data-mv="${j}"][data-dir="${d}"]:not(:disabled)`)||document.querySelector(`#mem [data-mv="${j}"]:not(:disabled)`);if(f)f.focus({preventScroll:true});
 m(`${L[j]} steht jetzt an Position ${j+1}.`)});
async function addMember(){
 const n=$('#nm').value.trim(),m=t=>$('#mm').textContent=t;
 if(!n)return m('Bitte einen Namen eingeben.');if(names().some(x=>norm(x)==norm(n)))return m('Diesen Namen gibt es schon.');
 try{await db.doc('state/mitglieder').set(clean({...MEM,liste:[...MEM.liste,n]}))}catch(e){return m('Speichern fehlgeschlagen: '+(e.message||e.code))}
 MEM.liste.push(n);sync();draft();render();members()}
const TIP=document.createElement('div');TIP.id='tip';document.body.appendChild(TIP);
document.addEventListener('mousemove',e=>{const t=e.target.closest?e.target.closest('[data-tip]'):null;if(!t){TIP.style.display='none';return}TIP.textContent=t.getAttribute('data-tip');TIP.style.display='block';TIP.style.left=Math.max(4,Math.min(e.clientX+12,innerWidth-TIP.offsetWidth-6))+'px';TIP.style.top=(e.clientY+16)+'px'});
document.addEventListener('mouseleave',()=>{TIP.style.display='none'});
window.addEventListener('error',e=>st('Fehler: '+e.message));
