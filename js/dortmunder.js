// Hauptseite „Dortmunder“: Auswertung aller Dortmunder-Ergebnisse.
// Quellen: DT_XL (Excel 2000–2025, js/dortmunder-historie-data.js) und ab 2026 die über die Eingabe gespeicherten Abende (HIST[].blatt).
// „x“ = nicht dabei gewesen. Einträge mit 0 Punkten (angekreuzt, aber nichts eingetragen) zählen nicht als Ergebnis.
let DTY='';
const dtName=n=>/^andr[eé]$/i.test(String(n).trim())?'Trunsen':String(n).trim();
const dtN1=v=>(+v).toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1});
const dtT=(hd,rows)=>`<div class="w"><table><tr>${hd.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.join('')}</table></div>`;
function dtData(){
 const R=[];
 Object.entries(typeof DT_XL!=='undefined'?DT_XL:{}).forEach(([y,m])=>Object.entries(m).forEach(([n,a])=>a.forEach((v,i)=>{if(v>0)R.push({n,y:+y,e:i+1,v})})));
 const by={};
 HIST.filter(h=>h.date>='2026-01-01'&&h.blatt&&h.blatt.length).forEach(h=>(by[h.date.slice(0,4)]=by[h.date.slice(0,4)]||[]).push(h));
 Object.entries(by).forEach(([y,l])=>l.sort((a,b)=>a.date<b.date?-1:1).forEach((h,i)=>h.blatt.forEach(b=>{const v=+b.s;if(v>0)R.push({n:dtName(b.name),y:+y,e:i+1,v,d:h.date})})));
 return R}
const dtWhen=r=>r.d?dd(r.d):`${r.y}, Abend ${r.e}`;
const dtAvg=a=>a.length?a.reduce((s,r)=>s+r.v,0)/a.length:null;
const dtSum=a=>a.reduce((s,r)=>s+r.v,0);
function dtRank(list,desc){
 const s=list.slice().sort((a,b)=>desc?b.v-a.v:a.v-b.v||0),lim=s[Math.min(9,s.length-1)];
 if(!lim)return[];
 const top=s.filter(r=>desc?r.v>=lim.v:r.v<=lim.v);
 return top.map(r=>({...r,rang:1+s.findIndex(x=>x.v==r.v)}))}
function dortmunder(){
 const el=$('#dort'),R=dtData();
 if(!R.length){el.innerHTML='<h2 id="dt-tab">Dortmunder</h2><p class="mu">Keine Dortmunder-Daten vorhanden.</p>';sub();return}
 const years=[...new Set(R.map(r=>r.y))].sort((a,b)=>a-b),names=[...new Set(R.map(r=>r.n))].sort((a,b)=>a.localeCompare(b,'de'));
 if(!years.includes(+DTY))DTY=String(years[years.length-1]);
 const Y=+DTY,RY=R.filter(r=>r.y==Y),nE=Y<=2025?13:Math.max(...RY.map(r=>r.e));
 // 1. Tabelle eines Jahres: Abende 1–13, Summe, Schnitt
 const nm=[...new Set(RY.map(r=>r.n))].sort((a,b)=>a.localeCompare(b,'de'));
 const e=Array.from({length:nE},(_,i)=>i+1);
 const t1=dtT(['Name',...e,'Summe','Schnitt'],[...nm.map(n=>{const a=RY.filter(r=>r.n==n);
  return`<tr><td>${esc(n)}</td>${e.map(i=>{const r=a.find(x=>x.e==i);return`<td>${r?r.v:'x'}</td>`}).join('')}<td><b>${dtSum(a)}</b></td><td class="cv"><b>${dtN1(dtAvg(a))}</b></td></tr>`}),
  `<tr class="sum"><td><b>Schnitt Club</b></td>${e.map(i=>{const a=RY.filter(r=>r.e==i);return`<td><b>${a.length?dtN1(dtAvg(a)):''}</b></td>`}).join('')}<td><b>${dtSum(RY)}</b></td><td class="cv"><b>${dtN1(dtAvg(RY))}</b></td></tr>`]);
 // 2. Schnitt pro Jahr pro Kegler
 const t2=dtT(['Name',...years],[...names.map(n=>`<tr><td>${esc(n)}</td>${years.map(y=>{const a=R.filter(r=>r.n==n&&r.y==y);return`<td>${a.length?dtN1(dtAvg(a)):''}</td>`}).join('')}</tr>`),
  `<tr class="sum"><td><b>Schnitt Club</b></td>${years.map(y=>`<td><b>${dtN1(dtAvg(R.filter(r=>r.y==y)))}</b></td>`).join('')}</tr>`]);
 // 3. Schnitt gesamt pro Kegler
 const g=names.map(n=>{const a=R.filter(r=>r.n==n);return{n,a:a.length,s:dtSum(a),avg:dtAvg(a),y0:Math.min(...a.map(r=>r.y)),y1:Math.max(...a.map(r=>r.y))}}).sort((a,b)=>b.avg-a.avg||b.a-a.a);
 const t3=dtT(['Rang','Name','Teilnahmen','Summe','Schnitt gesamt','Jahre'],[...g.map((x,i)=>`<tr><td>${i+1}.</td><td>${esc(x.n)}</td><td>${x.a}</td><td>${x.s}</td><td class="cv"><b>${dtN1(x.avg)}</b></td><td>${x.y0==x.y1?x.y0:x.y0+'–'+x.y1}</td></tr>`),
  `<tr class="sum"><td></td><td><b>Club</b></td><td><b>${R.length}</b></td><td><b>${dtSum(R)}</b></td><td class="cv"><b>${dtN1(dtAvg(R))}</b></td><td></td></tr>`]);
 // 4. Maximum / Minimum pro Kegler
 const mm=names.map(n=>{const a=R.filter(r=>r.n==n),mx=a.reduce((p,r)=>r.v>p.v?r:p),mi=a.reduce((p,r)=>r.v<p.v?r:p);return{n,mx,mi}}).sort((a,b)=>b.mx.v-a.mx.v||a.n.localeCompare(b.n,'de'));
 const t4=dtT(['Name','Maximum','erreicht','Minimum','erreicht'],mm.map(x=>`<tr><td>${esc(x.n)}</td><td class="cv"><b>${x.mx.v}</b></td><td>${dtWhen(x.mx)}</td><td class="cv"><b>${x.mi.v}</b></td><td>${dtWhen(x.mi)}</td></tr>`));
 // 5. Schnitt des Clubs pro Jahr
 const t5=dtT(['Jahr','Abende','Teilnahmen','Ø Teilnehmer pro Abend','Summe','Schnitt Club'],[...years.map(y=>{const a=R.filter(r=>r.y==y),ab=new Set(a.map(r=>r.e)).size;return`<tr><td>${y}</td><td>${ab}</td><td>${a.length}</td><td>${dtN1(a.length/ab)}</td><td>${dtSum(a)}</td><td class="cv"><b>${dtN1(dtAvg(a))}</b></td></tr>`}),
  `<tr class="sum"><td><b>Gesamt</b></td><td><b>${new Set(R.map(r=>r.y+'-'+r.e)).size}</b></td><td><b>${R.length}</b></td><td></td><td><b>${dtSum(R)}</b></td><td class="cv"><b>${dtN1(dtAvg(R))}</b></td></tr>`]);
 // 6./7. Rekorde und Minusrekorde (Top/Flop 10 Einzelwerte, Gleichstände am Ende der Liste zählen mit)
 const rk=l=>dtT(['Rang','Name','Punkte','Jahr / Abend'],l.map(r=>`<tr><td>${r.rang}.</td><td>${esc(r.n)}</td><td class="cv"><b>${r.v}</b></td><td>${dtWhen(r)}</td></tr>`));
 el.innerHTML=`<h2 id="dt-tab">Dortmunder <span class="mu">Alle Ergebnisse ${years[0]}–${years[years.length-1]}: ${R.length} Einzelergebnisse an ${new Set(R.map(r=>r.y+'-'+r.e)).size} Abenden. „x“ = nicht dabei. Bis 2025 aus der Excel-Datei, ab 2026 aus den gespeicherten Abenden.</span></h2>`
 +`<div class="top"><label>Jahr <select id="dty">${[...years].reverse().map(y=>`<option${y==Y?' selected':''}>${y}</option>`).join('')}</select></label></div>${t1}`
 +`<h2 id="dt-jahr">Schnitt pro Jahr pro Kegler <span class="mu">Summe ÷ Teilnahmen des Jahres.</span></h2>${t2}`
 +`<h2 id="dt-ges">Schnitt gesamt pro Kegler <span class="mu">Über alle Jahre. Bei wenigen Teilnahmen ist der Schnitt wenig aussagekräftig.</span></h2>${t3}`
 +`<h2 id="dt-mm">Maximum und Minimum pro Kegler</h2>${t4}`
 +`<h2 id="dt-club">Schnitt des Clubs pro Jahr <span class="mu">Durchschnitt aller Einzelergebnisse des Jahres.</span></h2>${t5}`
 +`<h2 id="dt-rek">Rekorde <span class="mu">Die höchsten Einzelergebnisse aller Zeiten.</span></h2>${rk(dtRank(R,true))}`
 +`<h2 id="dt-min">Minusrekorde <span class="mu">Die niedrigsten Einzelergebnisse aller Zeiten.</span></h2>${rk(dtRank(R,false))}`;
 sub()}
document.addEventListener('change',e=>{if(e.target.id=='dty'){DTY=e.target.value;dortmunder();const s=$('#dty');if(s)s.focus({preventScroll:true})}});
