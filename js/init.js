const TABS=[['#b1','#edit'],['#b5','#blatt'],['#b6','#bt'],['#b2','#hist'],['#b3','#aus'],['#b4','#mem'],['#b7','#tour']];
let CUR='#b1',USR=null,ME=null;
const SUB={'#b1':[['s-umf','Umfrage'],['s-anw','Anwesenheit'],['s-ein','Eingabe'],['s-stat','Statistik'],['ek-kasse','Kasse'],['ek-koenige','Könige'],['s-rek','Rekorde']],
 '#b5':[['d-tab','Dortmunder'],['d-kon','König']],
 '#b6':[['bt-tab','Berg und Tal'],['bt-paare','Auslosen'],['bt-werte','Tabelle'],['bt-kon','König']],
 '#b2':[['h-rek','Rekorde'],['h-tage','Spieltage'],['h-tab','Tabelle'],['h-dm','Dortmunder'],['h-bt','Berg und Tal'],['hk-kasse','Kasse'],['hk-koenige','Könige']],
 '#b3':[['a-dm','Dortmunder'],['a-kon','Könige'],['a-ein','Einzelergebnisse'],['a-anw','Anwesenheit'],['a-ver','Verlauf'],['a-jahr','Jahre']],
 '#b4':[['m-liste','Mitglieder'],['m-neu','Neues Mitglied'],['m-reihe','Reihenfolge'],['m-frg','Freigabe']]};
const navh=()=>document.documentElement.style.setProperty('--navh',($('#navs').offsetHeight||96)+'px');
function sub(){
 const n=$('#sub');if(!n)return;
 n.replaceChildren(...(SUB[CUR]||[]).filter(([id])=>document.getElementById(id)).map(([id,l])=>{const b=document.createElement('button');b.type='button';b.textContent=l;b.dataset.j=id;return b}));
 navh()}
$('#sub').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const t=document.getElementById(b.dataset.j);if(t)t.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})});
addEventListener('resize',navh);
async function who(){
 const e=$('#who');if(!e)return;let w=null;
 try{w=USR?await USR.can('data.write'):null}catch(x){}
 const ok=!!(USR&&(OWN||(ME&&(ME.id||ME.name))));
 e.classList.toggle('off',!ok);e.replaceChildren();
 if(ok&&ME&&ME.avatarUrl){const im=document.createElement('img');im.src=ME.avatarUrl;im.alt='';e.append(im)}
 const d=document.createElement('span');d.className='dot';e.append(d);
 const t=document.createElement('span');
 if(ok){t.append('Angemeldet als ');const b=document.createElement('b');b.textContent=(ME&&ME.name)||'Mitglied';t.append(b,OWN?' · Besitzer':(EDT?' · Mitglied (darf speichern)':' · nur Lesen'))}
 else t.textContent='Nicht angemeldet';
 e.append(t);
 const g=$('#gate');
 if(!db){g.hidden=false;g.textContent='Keine Datenbank verbunden. Die Seite kann nicht geladen werden; bitte später noch einmal versuchen.'}
 else if(!EDT&&w===false){g.hidden=false;g.textContent='Du bist mit Google angemeldet, hast aber nur Leserechte. Abende speichern dürfen nur freigegebene Mitglieder; bitte den Besitzer um Freigabe deiner Google-Adresse. Mit dem Knopf oben kannst du dich wieder abmelden.'}
 else g.hidden=true}
const GRP=['#b1','#b5','#b6'];
function grp(){const g=GRP.includes(CUR);$('#eg').hidden=!g;if(g){$('#b1').classList.add('on');$('#b1').setAttribute('aria-current',CUR=='#b1'?'page':'true')}$('#b1a').classList.toggle('on',CUR=='#b1');$('#b1a').setAttribute('aria-current',CUR=='#b1'?'page':'false')}
$('#b1a').onclick=()=>$('#b1').click();
TABS.forEach(([b,v])=>$(b).onclick=()=>{CUR=b;TABS.forEach(([b2,v2])=>{$(v2).hidden=v2!=v;$(b2).classList.toggle('on',b2==b);$(b2).setAttribute('aria-current',b2==b?'page':'false')});if(b=='#b2')hist((HIST.find(inHY)||HIST[0]||{}).date);if(b=='#b3')aus();if(b=='#b4')members();if(b=='#b7')tour();grp();sub();window.scrollTo(0,0)});
(async()=>{
 const T=p=>Promise.race([p,new Promise(r=>setTimeout(()=>r(null),10000))]);
 try{const c=window.claude;db=c&&await T(c.use('db'));USR=c&&await T(c.use('user'));OWN=USR?await USR.isOwner():false;EDT=OWN||(USR&&USR.isEditor?await T(USR.isEditor())===true:false)}catch(e){db=null}
 try{ME=USR&&USR.me?await T(USR.me()):null}catch(e){ME=null}
 if(db){try{
  const [s,d,c,m]=await Promise.all([db.collection('sessions').get(),db.doc('state/entwurf').get(),db.doc('state/config').get(),db.doc('state/mitglieder').get()]);
  HIST=s.docs.map(x=>clean(x.data())).sort((a,b)=>a.date<b.date?1:-1);
  if(c.exists)CFG=clean(c.data());RK=clean(CFG.rekorde||[]);
  if(m.exists)MEM={liste:[],gaeste:[],weitere:[],...clean(m.data())};
  S=d.exists?clean(d.data()):{};sync();if(typeof umfWatch==='function')umfWatch();
  st(HIST.length+' Spieltage in der Datenbank'+(OWN?' – angemeldet als Besitzer':EDT?' – angemeldet als Mitglied':''))}catch(e){st('Datenbank-Fehler: '+(e.message||e.code))}}
 else st('Keine Datenbank verbunden – Eingaben werden nicht gespeichert.');
 render();who()})();
