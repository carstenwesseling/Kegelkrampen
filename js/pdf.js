// PDF-Download der Eingabe: Eingabe- und Statistik-Tabelle in einer einfachen schwarz-weißen Tabelle,
// DIN A4 quer, Aufbau nach dem Tabellenblatt „Vorlage Notizen“ (Spalten, darunter die Könige).
// Nutzt jsPDF und jsPDF-AutoTable (js/vendor, MIT-Lizenz). Werte kommen aus dem aktuellen Entwurf.
function kkPdf(){
 const J=window.jspdf&&window.jspdf.jsPDF;
 if(!J||!window.jspdf||typeof new J().autoTable!=='function')return ms('PDF-Bibliothek nicht geladen.');
 const W=V(),C=calc(W),num=v=>v?fx(v):'',cnt=v=>v?iv(v):'';
 const rows=byOrd(W.rows).filter(([r])=>!r.gast||r.c);
 const mem=rows.filter(([r])=>!r.gast),gst=rows.filter(([r])=>r.gast);
 const head=[dd(S.date)||'Datum: ______','da','Pumpen','verl. Spiele','Alle Neune','Kranz Hand','Kugel Tisch','Klingel','Lotterie Extra-Spiel','Runde','Restzahlung','gezahlt'];
 const line=([r,i])=>[r.name+(r.gast?' (Gast)':''),r.c?'x':'',cnt(r.e),cnt(r.d),cnt(r.h),cnt(r.i),cnt(r.g),cnt(r.f),num(r.j),num(r.l),r.gast?'':fx(r.n),num(r.p)];
 const body=[...mem,...gst].map(line);
 const sumRest=mem.reduce((s,[r])=>s+(+r.n||0),0);
 body.push(['Summe',String(C.t.c||''),'','','','','','','','',fx(sumRest),'']);
 // Spaltenbreiten wie im Tabellenblatt (Zeichen), auf die Seitenbreite skaliert.
 const ch=[16.5,4.8,20.5,16.5,11.8,12.5,11.8,12.5,16.5,9.5,13.2,10],M=28,pw=842-2*M,sc=pw/ch.reduce((a,b)=>a+b,0),w=ch.map(x=>x*sc);
 const doc=new J({orientation:'landscape',unit:'pt',format:'a4'});
 const base={theme:'grid',styles:{font:'helvetica',fontSize:10,textColor:0,lineColor:0,lineWidth:.6,fillColor:255,cellPadding:3,valign:'middle',minCellHeight:24},
  headStyles:{fillColor:255,textColor:0,fontStyle:'bold',minCellHeight:18},margin:{left:M,right:M}};
 doc.autoTable({...base,head:[head],body,startY:M,tableWidth:pw,
  columnStyles:Object.fromEntries(w.map((x,i)=>[i,{cellWidth:x,halign:i>1?'right':i==1?'center':'left'}])),
  didParseCell:d=>{if(d.section=='body'&&d.row.index==body.length-1)d.cell.styles.fontStyle='bold'}});
 const ko=[['König',0],['Kleinkönig',1],['Pumpenkönig',2],['Dortmunder',3],['TBTBBTB',4]].map(([l,i])=>{const k=(S.koenige||[])[i]||{};return[l,k.name||'',k.pt!=null&&k.pt!==''?String(k.pt):'']});
 doc.autoTable({...base,head:[['Könige','Name','Punkte']],body:ko,startY:doc.lastAutoTable.finalY+14,tableWidth:w[2]+w[3]+w[4],margin:{left:M+w[0]+w[1],right:M},
  styles:{...base.styles,minCellHeight:20},columnStyles:{0:{cellWidth:w[2]},1:{cellWidth:w[3]},2:{cellWidth:w[4],halign:'right'}}});
 doc.save('Kegeln'+(S.date?'_'+S.date:'')+'.pdf');ms('PDF wurde heruntergeladen.')}
document.addEventListener('click',e=>{if(e.target.id=='pdf-dl')kkPdf()});
