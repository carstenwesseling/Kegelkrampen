// Start der App: Navigation (Tab-Leiste unten, Leiste oben am Desktop, „Mehr“), Adressen je Ansicht,
// Schritte der Eingabe, Sprungmarken, Anmeldung und Laden der Daten.
const TABS=[['#b0','#start'],['#b1','#edit'],['#b2','#hist'],['#b3','#aus'],['#b4','#mem'],['#b7','#tour'],['#b8','#dort']];
// Adresse je Ansicht: #/eingabe/<schritt>, #/historie/<datum> usw. Damit funktionieren Zurück-Knopf, Neu laden und Links.
const RT={'#b0':'start','#b1':'eingabe','#b2':'historie','#b3':'auswertung','#b4':'mitglieder','#b7':'touren','#b8':'dortmunder'};
const TTL={'#b0':'Kegelkrampen','#b1':'Eingabe','#b2':'Historie','#b3':'Auswertung','#b4':'Mitglieder','#b7':'Kegeltouren','#b8':'Dortmunder'};
// Schritte der Eingabe; „dm“ und „bt“ zeigen die Bereiche #blatt und #bt.
const STEPS=[['vor','Vorbereitung'],['spiel','Spiel'],['dm','Dortmunder'],['bt','Berg & Tal'],['ab','Abschluss']];
let CUR='#b0',USR=null,ME=null,STEP='vor',LOADED=false;
const SUB={
 '#b2':[['h-rek','Rekorde'],['h-tage','Spieltage'],['h-tab','Tabelle'],['h-dm','Dortmunder'],['h-bt','Berg und Tal'],['hk-kasse','Kasse'],['hk-koenige','Könige']],
 '#b3':[['a-kon','Könige'],['a-ein','Einzelergebnisse'],['a-anw','Anwesenheit'],['a-ver','Verlauf'],['a-jahr','Jahre']],
 '#b8':[['dt-tab','Tabelle'],['dt-jahr','Schnitt pro Jahr'],['dt-ges','Schnitt gesamt'],['dt-mm','Max / Min'],['dt-club','Club'],['dt-rek','Rekorde'],['dt-min','Minusrekorde']],
 '#b4':[['m-liste','Mitglieder'],['m-neu','Neues Mitglied'],['m-reihe','Reihenfolge'],['m-lg','Angemeldet'],['m-frg','Freigabe']]};
const SUBSTEP={vor:[['s-umf','Umfrage'],['s-anw','Anwesenheit']],ab:[['s-stat','Zahlungen'],['ek-kasse','Kasse'],['ek-koenige','Könige'],['s-rek','Rekorde']]};
const navh=()=>document.documentElement.style.setProperty('--navh',($('#navs').offsetHeight||64)+'px');
const stepDone=k=>{const R=S.rows||[];
 if(k=='vor')return R.some(r=>r.c);
 if(k=='spiel')return R.some(r=>r.c&&'defghi'.split('').some(x=>+r[x]));
 if(k=='dm')return Object.values(S.blatt||{}).some(a=>(a||[]).some(Boolean));
 if(k=='bt')return(S.bt||[]).some(q=>(q.v||[]).some(Boolean));
 return R.some(r=>+r.p)};
function sub(){
 const n=$('#sub');if(!n)return;
 if(CUR=='#b1'){
  n.classList.add('steps');n.setAttribute('aria-label','Schritte der Eingabe');
  n.innerHTML=STEPS.map(([k,l],i)=>`<button type="button" data-step="${k}"${k==STEP?' class="on" aria-current="step"':''}><span class="sn">${stepDone(k)&&k!=STEP?icon('check'):i+1}</span>${l}</button>`).join('');
 }else{
  n.classList.remove('steps');n.setAttribute('aria-label','Abschnitte dieser Seite');
  n.replaceChildren(...(SUB[CUR]||[]).filter(([id])=>document.getElementById(id)).map(([id,l])=>{const b=document.createElement('button');b.type='button';b.textContent=l;b.dataset.j=id;return b}))}
 n.hidden=!n.children.length;n.classList.toggle('ovf',n.scrollWidth>n.clientWidth+2);
 const on=n.querySelector('.on');if(on)n.scrollLeft=on.offsetLeft-n.clientWidth/2+on.offsetWidth/2;
 navh();spyUpd();shadows()}
$('#sub').addEventListener('click',e=>{const b=e.target.closest('[data-j]');if(!b)return;const t=document.getElementById(b.dataset.j);if(t)t.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})});
// Sprungmarken: Den Abschnitt markieren, der gerade oben sichtbar ist.
function spyUpd(){
 const n=$('#sub'),b=[...n.querySelectorAll('[data-j]')];if(!b.length)return;
 const lim=n.getBoundingClientRect().bottom+32;let act=b[0];
 b.forEach(x=>{const t=document.getElementById(x.dataset.j);if(t&&t.getBoundingClientRect().top<=lim)act=x});
 if(innerHeight+scrollY>=document.documentElement.scrollHeight-4)act=b[b.length-1];
 b.forEach(x=>{const on=x==act;if(x.classList.contains('on')==on)return;x.classList.toggle('on',on);if(on){x.setAttribute('aria-current','location');n.scrollTo({left:x.offsetLeft-n.clientWidth/2+x.offsetWidth/2,behavior:'smooth'})}else x.removeAttribute('aria-current')})}
let spyQ=0;addEventListener('scroll',()=>{if(spyQ)return;spyQ=requestAnimationFrame(()=>{spyQ=0;spyUpd()})},{passive:true});
addEventListener('resize',navh);
// Eingabe: nur den Abschnitt des gewählten Schritts zeigen.
function stepShow(){
 if(CUR!='#b1')return;
 document.querySelectorAll('#edit [data-st]').forEach(s=>s.hidden=s.dataset.st!=STEP);
 $('#blatt').hidden=STEP!='dm';$('#bt').hidden=STEP!='bt';
 document.body.dataset.step=STEP;sub()}
async function who(){
 const e=$('#who');if(!e)return;let w=null;
 try{w=USR?await USR.can('data.write'):null}catch(x){}
 const ok=!!(USR&&(OWN||(ME&&(ME.id||ME.name))));
 e.classList.toggle('off',!ok);e.replaceChildren();
 const av=$('#acav');av.innerHTML=icon('user');
 if(ok&&ME&&ME.avatarUrl){const im=document.createElement('img');im.src=ME.avatarUrl;im.alt='';e.append(im);const im2=im.cloneNode();av.replaceChildren(im2)}
 $('#acdot').classList.toggle('ok',ok);
 const d=document.createElement('span');d.className='dot';e.append(d);
 const t=document.createElement('span');
 if(ok){t.append('Angemeldet als ');const b=document.createElement('b');b.textContent=(ME&&ME.name)||'Mitglied';t.append(b,OWN?' · Besitzer':(EDT?' · Mitglied (darf speichern)':' · nur Lesen'))}
 else t.textContent='Nicht angemeldet';
 e.append(t);
 $('#acct').setAttribute('aria-label',(ok?'Angemeldet als '+((ME&&ME.name)||'Mitglied'):'Nicht angemeldet')+' – Konto und weitere Seiten');
 const g=$('#gate');
 if(!db){g.hidden=false;g.textContent='Keine Datenbank verbunden. Die Seite kann nicht geladen werden; bitte später noch einmal versuchen.'}
 else if(ok&&!EDT&&w===false){g.hidden=false;g.innerHTML='';g.append('Du bist angemeldet, hast aber nur Leserechte. Abende speichern dürfen nur freigegebene Mitglieder; bitte den Besitzer um Freigabe deiner E-Mail-Adresse. Abmelden kannst du unter „Mehr“ → Konto.')}
 else g.hidden=true}
// Navigation
const hashFor=(tab,arg)=>'#/'+RT[tab]+(arg?'/'+arg:'');
const parseHash=()=>{const p=location.hash.replace(/^#\/?/,'').split('/'),tab=Object.keys(RT).find(k=>RT[k]==p[0])||'#b0';return[tab,decodeURIComponent(p[1]||'')]};
const SCR={};let FOCUS=false;
function go(tab,arg){FOCUS=true;const h=hashFor(tab,arg);if(location.hash!=h)location.hash=h;else route()}
function route(){
 const[tab,arg]=parseHash(),prev=CUR,same=prev==tab;
 SCR[prev]=scrollY;CUR=tab;
 if(tab=='#b1'&&STEPS.some(s=>s[0]==arg))STEP=arg;
 TABS.forEach(([b,v])=>$(v).hidden=b!=tab);
 if(tab!='#b1'){$('#blatt').hidden=true;$('#bt').hidden=true}
 document.querySelectorAll('[data-tab]').forEach(x=>{const on=x.dataset.tab==tab;x.classList.toggle('on',on);on?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current')});
 $('#tb-more').classList.toggle('on',['#b4','#b7'].includes(tab));
 $('#ptitle').textContent=TTL[tab];document.title=(tab=='#b0'?'':TTL[tab]+' – ')+'Kegelclub – Kegelkrampen';
 document.body.dataset.page=RT[tab];delete document.body.dataset.step;
 if(tab=='#b0')startView();
 if(tab=='#b1')stepShow();
 if(tab=='#b2')hist(arg&&HIST.some(h=>h.date==arg)?arg:(same&&HSEL?HSEL:(HIST.find(inHY)||{}).date));
 if(tab=='#b3')aus();if(tab=='#b4')members();if(tab=='#b7')tour();if(tab=='#b8')dortmunder();
 sub();
 window.scrollTo(0,same?0:(SCR[tab]||0));
 if(FOCUS){FOCUS=false;$('#ptitle').focus({preventScroll:true})}}
addEventListener('hashchange',route);
const more=$('#more');
const moreOpen=()=>{if(more.showModal)more.showModal();else more.setAttribute('open','')};
$('#acct').onclick=moreOpen;$('#tb-more').onclick=moreOpen;
more.addEventListener('click',e=>{if(e.target==more||e.target.closest('[data-close]'))more.close()});
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-tab]');if(t){if(more.open)more.close();go(t.dataset.tab);return}
 const s=e.target.closest('button[data-step]');if(s){go('#b1',s.dataset.step);return} // nicht am body (trägt data-step im Eingabe-Schritt)
 const n=e.target.closest('[data-nav]');if(n){const[a,b]=n.dataset.nav.split('/');go(a,b)}});
$('#home').onclick=()=>go('#b0');
route();
(async()=>{
 const T=p=>Promise.race([p,new Promise(r=>setTimeout(()=>r(null),10000))]);
 try{const c=window.claude;db=c&&await T(c.use('db'));USR=c&&await T(c.use('user'));OWN=USR?await USR.isOwner():false;EDT=OWN||(USR&&USR.isEditor?await T(USR.isEditor())===true:false)}catch(e){db=null}
 try{ME=USR&&USR.me?await T(USR.me()):null}catch(e){ME=null}
 // Angemeldete Adresse merken (logins/<mail>), damit der Besitzer sie im Tab „Mitglieder“ freigeben kann.
 if(db&&ME&&ME.email&&!OWN)db.doc('logins/'+ME.email).set({email:ME.email,name:ME.name||ME.email,last:new Date().toISOString()},{merge:true}).catch(()=>{});
 if(db){try{
  const [s,d,c,m]=await Promise.all([db.collection('sessions').get(),db.doc('state/entwurf').get(),db.doc('state/config').get(),db.doc('state/mitglieder').get()]);
  HIST=s.docs.map(x=>clean(x.data())).sort((a,b)=>a.date<b.date?1:-1);
  if(c.exists)CFG=clean(c.data());RK=clean(CFG.rekorde||[]);
  if(m.exists)MEM={liste:[],gaeste:[],weitere:[],...clean(m.data())};
  S=d.exists?clean(d.data()):{};sync();if(typeof umfWatch==='function')umfWatch();
  st(HIST.length+' Spieltage in der Datenbank'+(OWN?' – angemeldet als Besitzer':EDT?' – angemeldet als Mitglied':''))}catch(e){st('Datenbank-Fehler: '+(e.message||e.code));toast('Datenbank-Fehler: '+(e.message||e.code),'err')}}
 else st('Keine Datenbank verbunden – Eingaben werden nicht gespeichert.');
 LOADED=true;render();who();route();if(db)dstat('ok','Entwurf geladen')})();
