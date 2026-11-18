/* ===== تصدير تعيينات الحكام إلى PDF بأنماط متعددة + معاينة قبل التصدير =====
   وحدة مستقلة: تقرأ بيانات التعيينات الحالية فقط ولا تعدّل أي مقابلة. المُصدَّر الوحيد هو window.RPX.
   آخر تصميم مختار يُحفظ في S.set.rpx (إعدادات فقط). تعتمد على: S, sv, flt, sorted, nm, gn, by, fd, ft, tl, esc, toast, save. */
(function(){
const X=window.RPX={};
const HEX=/^#[0-9a-f]{6}$/i;
/* لوحات ألوان جاهزة: o=الخلفية (الخارجية في النمط الاحترافي)، f=الإطار/التمييز، h=الترويسة، t=عناوين الجداول */
const PAL={
league:{n:'أخضر الرابطة',o:'#0b6e4f',f:'#1aa876',h:'#0b6e4f',t:'#0b6e4f'},
navyred:{n:'أحمر وأزرق داكن',o:'#14213d',f:'#c8102e',h:'#14213d',t:'#14213d'},
sky:{n:'أزرق سماوي',o:'#1d9bd8',f:'#0b5fa5',h:'#14213d',t:'#bfe3f6'},
ocean:{n:'تركوازي',o:'#0e7490',f:'#22b8cf',h:'#0f2a43',t:'#0e7490'},
mono:{n:'رمادي أنيق',o:'#3b3f46',f:'#2b2b2b',h:'#222222',t:'#e4e6ea'},
wine:{n:'بوردو وذهبي',o:'#7a1f2b',f:'#c9a227',h:'#7a1f2b',t:'#7a1f2b'}};
/* الأنماط: lay=هندسة الخلفية، tbl=شكل الجدول */
const STY={
official:{n:'الرسمي',lay:'corners',tbl:'grid',pal:'league'},
modern:{n:'العصري',lay:'diag',tbl:'grid',pal:'ocean'},
classic:{n:'الكلاسيكي',lay:'frame',tbl:'grid',pal:'mono'},
pro:{n:'الاحترافي',lay:'card',tbl:'pill',pal:'navyred'},
custom:{n:'المخصص',lay:'card',tbl:'pill',pal:'sky'}};
const LAYN={corners:'زوايا هندسية',diag:'أشرطة مائلة',frame:'إطار مزدوج',card:'بطاقة بيضاء بإطار ملون'};
const palCol=(p,lay)=>({bg:lay=='card'?p.o:'#ffffff',frame:p.f,head:p.h,th:p.t,tx:'#111111'});
const dflt=s=>{const d=STY[s],p=PAL[d.pal];return{style:s,lay:d.lay,tbl:d.tbl,col:palCol(p,d.lay),orient:'auto'}};
let ST=null,PG=[],CUR=0,TMR=0,SV=0,UI=null,PW0=794,PH0=1123;
const O={wr:true,cat:'',grp:'',date:'',title:''};

/* ----- ألوان ----- */
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),
 hex=a=>'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''),
 mix=(a,b,t)=>{const x=rgb(a),y=rgb(b);return hex(x.map((v,i)=>v+(y[i]-v)*t))},
 ink=h=>{const[r,g,b]=rgb(h);return(.299*r+.587*g+.114*b)>150?'#111111':'#ffffff'};
const okc=(v,d)=>HEX.test(v||'')?v:d;
function load(){const s=(S.set&&S.set.rpx)||{},b=dflt(STY[s.style]?s.style:'official');ST={style:b.style,lay:LAYN[s.lay]?s.lay:b.lay,tbl:s.tbl=='grid'||s.tbl=='pill'?s.tbl:b.tbl,orient:['auto','p','l'].includes(s.orient)?s.orient:'auto',col:{}};
['bg','frame','head','th','tx'].forEach(k=>ST.col[k]=okc(s.col&&s.col[k],b.col[k]))}
let svT=0;const persist=()=>{clearTimeout(svT);svT=setTimeout(()=>{S.set.rpx=JSON.parse(JSON.stringify(ST));save()},500)};

/* ----- خلفيات الصفحات (Canvas مرة لكل تصميم) ----- */
const BGC={};
function bgImg(lay,c,W,H){const key=[lay,c.bg,c.frame,c.head,W].join('|');if(BGC[key])return BGC[key];
const cv=document.createElement('canvas');cv.width=W*2;cv.height=H*2;const x=cv.getContext('2d');x.scale(2,2);
const M=c.head,A=c.frame,D=mix(c.head,'#000000',.55),A2=mix(c.frame,'#ffffff',.25);
const poly=(col,p)=>{x.fillStyle=col;x.beginPath();p.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));x.closePath();x.fill()};
x.fillStyle=c.bg;x.fillRect(0,0,W,H);
if(lay=='corners'){
poly(D,[[0,0],[W*.55,0],[W*.55-14,22],[0,22]]);poly(A,[[0,26],[W*.47,26],[W*.47-8,31],[0,31]]);
poly(M,[[W-118,0],[W,0],[W,70]]);poly(D,[[W-190,0],[W-118,0],[W,70],[W,82]]);poly(A,[[W-62,0],[W,0],[W,28]]);
poly(M,[[0,H-60],[48,H],[0,H]]);poly(D,[[0,H-76],[0,H-60],[48,H],[96,H]]);
poly(D,[[W,H-24],[W*.42,H-24],[W*.4,H-14],[W,H-14]]);poly(A,[[W,H-9],[W*.46,H-9],[W*.445,H-4],[W,H-4]]);poly(M,[[W,H-72],[W,H],[W-96,H]]);
x.fillStyle=M;x.fillRect(0,H*.14,6,H*.72);x.fillRect(W-6,H*.16,6,H*.7)}
else if(lay=='diag'){
poly(D,[[0,0],[W,0],[W,14],[0,14]]);poly(A,[[W*.6,0],[W*.6+130,0],[W*.6+110,14],[W*.6-20,14]]);poly(M,[[0,14],[W*.3,14],[W*.3-14,25],[0,25]]);
poly(D,[[0,H-14],[W,H-14],[W,H],[0,H]]);poly(A,[[W*.4-130,H-14],[W*.4,H-14],[W*.4+20,H],[W*.4-110,H]]);poly(M,[[W,H-25],[W*.7,H-25],[W*.7+14,H-14],[W,H-14]]);
x.strokeStyle=hex(rgb(M).map(v=>v+(255-v)*.88));x.lineWidth=2;[[0,40,170],[W,H-40,170],[W,50,90],[0,H-50,90]].forEach(p=>{x.beginPath();x.arc(p[0],p[1],p[2],0,7);x.stroke()});
x.fillStyle=A;x.fillRect(0,H*.2,4,H*.6);x.fillRect(W-4,H*.2,4,H*.6)}
else if(lay=='frame'){
x.strokeStyle=A;x.lineWidth=3;x.strokeRect(20,20,W-40,H-40);x.lineWidth=1;x.strokeRect(28,28,W-56,H-56);
x.fillStyle=A;[[20,20],[W-20,20],[20,H-20],[W-20,H-20]].forEach(p=>{x.save();x.translate(p[0],p[1]);x.rotate(Math.PI/4);x.fillRect(-6,-6,12,12);x.restore()});
x.fillStyle=M;[[W/2,20],[W/2,H-20]].forEach(p=>{x.beginPath();x.arc(p[0],p[1],5,0,7);x.fill()})}
else{/* card */
poly(D,[[0,0],[W*.5,0],[W*.5-26,26],[0,26]]);poly(A,[[W*.82,0],[W,0],[W,62]]);poly(D,[[W,H],[W*.5,H],[W*.5+26,H-26],[W,H-26]]);poly(A,[[0,H-62],[0,H],[W*.18,H]]);
poly(A2,[[W*.5-26,0],[W*.5+30,0],[W*.5+4,26],[W*.5-26,26]]);
const m=24,tp=36,r=18;x.fillStyle='#fff';x.beginPath();x.moveTo(m+r,tp);x.arcTo(W-m,tp,W-m,H-tp,r);x.arcTo(W-m,H-tp,m,H-tp,r);x.arcTo(m,H-tp,m,tp,r);x.arcTo(m,tp,W-m,tp,r);x.closePath();x.fill();
x.strokeStyle=A;x.lineWidth=2;x.stroke()}
return BGC[key]=cv.toDataURL('image/jpeg',.92)}
const PAD={corners:[62,72,38],diag:[74,72,36],frame:[58,66,54],card:[62,62,52]};

/* ----- مكونات المحتوى ----- */
const unsetTxt=()=>S.set.unset||'غير معين';
function hdrLines(){const s=S.set;let L=[s.mh1,s.mh2,s.mh3].filter(Boolean);if(!L.length)L=[s.l1].filter(Boolean);return L}
function footParts(){const s=S.set;return[['ph','phS','phL'],['em','emS','emL'],['web','webS','webL'],['ad','adS','adL']].filter(x=>s[x[0]]).map(x=>(s[x[1]]&&s[x[2]]?`<b>${esc(s[x[2]])}:</b> `:'')+`<bdi>${esc(s[x[0]])}</bdi>`)}
const RL=['الحكم الرئيسي','الحكم المساعد الأول','الحكم المساعد الثاني'];
function cols(wr,land){return wr?(land?[11,13,26,9,8,11,11,11]:[11,12,25,9,8,11.7,11.7,11.6]):[15,20,36,14,15]}
function thead(wr,land){const w=cols(wr,land),h=['التاريخ','الملعب','المقابلة','الصنف','التوقيت',...(wr?RL:[])];return `<colgroup>${w.map(a=>`<col style="width:${a}%">`).join('')}</colgroup><thead><tr>${h.map(t=>`<th>${t}</th>`).join('')}</tr></thead>`}
function rowH(m,wr){const lt=m.status=='moved'||m.status=='postponed';
return `<tr><td>${esc(fd(m.date))}</td><td>${esc(nm('stad',m.stad))}</td><td><span class="rp-m">${tl(m.t1)}<b>${esc(nm('teams',m.t1))}</b><i>×</i><b>${esc(nm('teams',m.t2))}</b>${tl(m.t2)}</span>${lt?' <span class="rp-lb">مقابلة متأخرة</span>':''}${m.done?' <span class="rp-lb" style="background:#e6f4ea;color:#2e7d32;border-color:#2e7d32">✔ لُعبت</span>':''}</td><td>${esc(nm('cats',m.cat))}</td><td>${esc(ft(m.time))}</td>${wr?m.refs.map(r=>r?`<td class="rp-rf">${esc(nm('ref',r))}</td>`:`<td class="rp-nr">${esc(unsetTxt())}</td>`).join(''):''}</tr>`}
function groups(list){const gs={};sorted(list).forEach(m=>(gs[m.round+'|'+m.cat+'|'+m.grp]??=[]).push(m));return Object.values(gs)}

/* ----- بناء الصفحات (ترقيم الصفحات بقياس الارتفاع الفعلي: لا قص ولا تداخل) ----- */
function build(list,wr,land,host){
const W=land?1123:794,H=land?794:1123,c=ST.col,lay=ST.lay,[pt,pb,px]=PAD[lay];
const hd=c.head,vars=`--bg:${c.bg};--tx:${c.tx};--hd:${hd};--hdx:${ink(hd)};--th:${c.th};--thx:${ink(c.th)};--bd:${mix(hd,'#000000',.1)};--zb:${mix(c.th,'#ffffff',.86)};--rr:8px;`;
const bgU=bgImg(lay,c,W,H),pages=[];
const sm=!land&&wr,title=O.title.trim()||(wr?'تعيينات الحكام':'برنامج المقابلات');
const cup=typeof cupOf=='function'?cupOf(list):'';const L=hdrLines(),logo=S.set.logo?`<img src="${S.set.logo}" alt="">`:'';
const sub=[O.cat&&nm('cats',O.cat),O.grp&&gn(O.cat||(by('cats',list[0]?.cat)||{}).id,O.grp),O.date&&fd(O.date)].filter(Boolean).join(' — ');
const first=()=>`<div class="rp-hd"><div class="rp-lg">${logo}<div class="rp-ll">${L.map((t,i)=>`<b${i==L.length-1?' class="rp-gg"':''}>${esc(t)}</b>`).join('')}</div></div><div class="rp-ti"><h1>${esc(title)}</h1>${S.set.rtitle?`<div class="rp-pt">${esc(S.set.rtitle)}</div>`:''}${sub?`<div class="rp-sb">${esc(sub)}</div>`:''}</div></div>${cup?`<div class="rp-cup">${esc(cup)}</div>`:''}`;
const mini=()=>`<div class="rp-mh"><span>${esc(title)}</span><span>${esc(L[L.length-1]||'')}</span></div>`;
const newPage=()=>{const el=document.createElement('div');el.className='rp-pg'+(sm?' sm':'');el.style.cssText=`width:${W}px;height:${H}px;${vars}`;
el.innerHTML=`<img class="rp-bg" src="${bgU}" alt=""><div class="rp-in" style="padding:${pt}px ${px}px ${pb}px"><div class="rp-top">${pages.length?mini():first()}</div><div class="rp-body"></div><div class="rp-ft"><div class="rp-fc"></div><span class="rp-pn"></span></div></div>`;
host.appendChild(el);el._b=el.querySelector('.rp-body');pages.push(el);return el};
let pg=newPage();
for(const g of groups(list)){const m0=g[0];let i=0,cont=false;
 while(i<g.length){const body=pg._b,wrap=document.createElement('div');
  wrap.innerHTML=`<div class="rp-g"><span class="rp-c1">${esc(nm('rounds',m0.round))}</span><span class="rp-c2">${esc(nm('cats',m0.cat))}</span><span class="rp-c3">${esc(gn(m0.cat,m0.grp))}</span>${cont?'<small>(تابع)</small>':''}</div><table class="rp-t ${ST.tbl}">${thead(wr,land)}<tbody></tbody></table>`;
  body.appendChild(wrap);const tb=wrap.querySelector('tbody');let added=0;
  while(i<g.length){tb.insertAdjacentHTML('beforeend',rowH(g[i],wr));if(body.scrollHeight>body.clientHeight+.5&&(added||body.children.length>1)){tb.lastElementChild.remove();break}i++;added++}
  if(!added){body.removeChild(wrap);pg=newPage();continue}
  cont=true;if(i<g.length)pg=newPage()}}
/* التذييل: بيانات الرابطة كما في الملفات السابقة + ترقيم الصفحات */
const fp=footParts(),n=pages.length;
pages.forEach((el,k)=>{const ct=el.querySelector('.rp-fc');ct.innerHTML=(S.set.footer?`<div class="rp-nt">${esc(S.set.footer)}</div>`:'')+(fp.length?`<span>${fp.join(' &nbsp;|&nbsp; ')}</span>`:'');
el.querySelector('.rp-pn').textContent=`صفحة ${k+1} من ${n}`;const sp=ct.querySelector('span');if(sp&&sp.offsetWidth>ct.clientWidth-4&&sp.offsetWidth)sp.style.fontSize=(12*(ct.clientWidth-4)/sp.offsetWidth)+'px'});
return{pages,W,H}}

/* ----- بيانات النطاق ----- */
const baseList=()=>sv.one?S.matches.filter(m=>m.id==sv.one):S.matches.filter(flt);
const scoped=()=>baseList().filter(m=>(!O.cat||m.cat==O.cat)&&(!O.grp||m.grp==O.grp)&&(!O.date||m.date==O.date));
const isLand=()=>ST.orient=='l'||(ST.orient=='auto'&&O.wr);
const tmpHost=()=>{const h=document.createElement('div');h.style.cssText='position:fixed;left:-30000px;top:0;visibility:hidden';document.body.appendChild(h);return h};

/* ----- المعاينة ----- */
function render(){if(!UI)return;const list=scoped(),st=UI.querySelector('.rpx-stage');
UI.querySelectorAll('.rpx-act .btn.x').forEach(b=>b.disabled=!list.length);
if(!list.length){st.innerHTML='<div class="rpx-msg">لا توجد مقابلات ضمن هذا النطاق.</div>';UI.querySelector('.rpx-pn').textContent='';PG=[];return}
const host=tmpHost();try{const r=build(list,O.wr,isLand(),host);PG=r.pages.map(p=>p.cloneNode(true));PW0=r.W;PH0=r.H}finally{host.remove()}
if(CUR>=PG.length)CUR=PG.length-1;if(CUR<0)CUR=0;show()}
function show(){const st=UI.querySelector('.rpx-stage');if(!PG.length)return;const avail=Math.max(200,st.clientWidth-(innerWidth<=820?16:28)),s=Math.min(1,avail/PW0),el=PG[CUR];
st.innerHTML='';const sc=document.createElement('div');sc.className='rpx-sc';sc.style.cssText=`width:${PW0*s}px;height:${PH0*s}px`;el.style.transform=`scale(${s})`;sc.appendChild(el);st.appendChild(sc);
UI.querySelector('.rpx-pn').textContent=`صفحة ${CUR+1} من ${PG.length}`;UI.querySelector('.rpx-pv .pv-p').disabled=CUR<=0;UI.querySelector('.rpx-pv .pv-n').disabled=CUR>=PG.length-1}
const rr=()=>{clearTimeout(TMR);TMR=setTimeout(()=>{CUR=Math.min(CUR,99);render()},120)};

/* ----- واجهة الإعدادات داخل النافذة ----- */
const optS=(arr,v,all)=>`<option value="">${all}</option>`+arr.map(a=>`<option value="${esc(a[0])}"${a[0]==v?' selected':''}>${esc(a[1])}</option>`).join('');
const swH=p=>`<span class="sw"><i style="background:${p.o}"></i><i style="background:${p.h}"></i><i style="background:${p.f}"></i><i style="background:${p.t}"></i></span>`;
function styThumb(id){const d=STY[id],p=PAL[d.pal],cc=id=='custom'?ST.col:palCol(p,d.lay),cv=document.createElement('canvas');cv.width=120;cv.height=170;const x=cv.getContext('2d'),u=bgImg(d.lay=='card'||id!='custom'?d.lay:ST.lay,cc,794,1123),im=new Image();im.onload=()=>{x.drawImage(im,0,0,120,170);x.fillStyle=cc.th;x.fillRect(18,70,84,10);x.fillStyle='#e9ecef';for(let i=0;i<6;i++)x.fillRect(18,84+i*11,84,8);x.fillStyle=cc.head;x.fillRect(46,30,56,8)};im.src=u;return cv}
function side(){const L=baseList(),cats=[...new Set(L.map(m=>m.cat))].map(id=>[id,nm('cats',id)]),gr=[...new Set(L.filter(m=>!O.cat||m.cat==O.cat).map(m=>m.grp))].map(id=>[id,gn(L.find(m=>m.grp==id).cat,id)]),ds=[...new Set(L.map(m=>m.date))].sort().map(d=>[d,fd(d)]);
return `<details open><summary>المحتوى والنطاق</summary>
<label>نوع البرنامج<select data-k="wr"><option value="1"${O.wr?' selected':''}>مع تعيينات الحكام</option><option value="0"${O.wr?'':' selected'}>بدون الحكام</option></select></label>
<label>الصنف<select data-k="cat">${optS(cats,O.cat,'كل الأصناف')}</select></label>
<label>المجموعة / الفئة<select data-k="grp">${optS(gr,O.grp,'كل المجموعات')}</select></label>
<label>اليوم<select data-k="date">${optS(ds,O.date,'كل الأيام')}</select></label>
<label>عنوان الوثيقة<input type="text" data-k="title" value="${esc(O.title)}" placeholder="${O.wr?'تعيينات الحكام':'برنامج المقابلات'}"></label>
<label>الورق والاتجاه<select data-k="orient"><option value="auto"${ST.orient=='auto'?' selected':''}>A4 — تلقائي (أفقي مع الحكام، عمودي بدونهم)</option><option value="p"${ST.orient=='p'?' selected':''}>A4 — عمودي</option><option value="l"${ST.orient=='l'?' selected':''}>A4 — أفقي</option></select></label></details>
<details open><summary>نمط التصميم</summary><div class="rpx-sty">${Object.keys(STY).map(id=>`<button type="button" data-sty="${id}" class="${ST.style==id?'on':''}"><span class="th"></span>${STY[id].n}</button>`).join('')}</div></details>
<details open><summary>الألوان والتخصيص</summary><div class="rpx-pal">${Object.keys(PAL).map(id=>`<button type="button" data-pal="${id}" title="${PAL[id].n}">${swH(PAL[id])}<span style="font-size:11px">${PAL[id].n}</span></button>`).join('')}</div>
<div class="rpx-col">${[['bg','لون الخلفية'],['frame','لون الإطار الخارجي'],['head','لون الترويسة'],['th','لون عناوين الجداول'],['tx','لون النصوص']].map(a=>`<label>${a[1]}<input type="color" data-c="${a[0]}" value="${ST.col[a[0]]}"></label>`).join('')}</div>
<label>هندسة الخلفية<select data-k="lay">${Object.keys(LAYN).map(k=>`<option value="${k}"${ST.lay==k?' selected':''}>${LAYN[k]}</option>`).join('')}</select></label>
<label>شكل الجدول<select data-k="tbl"><option value="grid"${ST.tbl=='grid'?' selected':''}>شبكة بإطار مستدير</option><option value="pill"${ST.tbl=='pill'?' selected':''}>خلايا مستديرة منفصلة</option></select></label>
<p style="font-size:12px;color:#555;margin:8px 0 0">حواف الجداول مستديرة قليلًا في كل الأنماط. يُحفظ آخر تصميم تلقائيًا.</p></details>`}
function drawSide(){const s=UI.querySelector('.rpx-side');s.innerHTML=side();s.querySelectorAll('[data-sty] .th').forEach(sp=>{sp.replaceWith(styThumb(sp.parentNode.dataset.sty))})}
function onSide(e){const t=e.target;const k=t.dataset&&t.dataset.k,c=t.dataset&&t.dataset.c;
if(c){ST.col[c]=t.value;ST.style=ST.style=='custom'?'custom':ST.style;persist();rr();return}
if(!k)return;
if(k=='wr'){O.wr=t.value=='1'}else if(k=='cat'){O.cat=t.value;O.grp=''}else if(k=='grp')O.grp=t.value;else if(k=='date')O.date=t.value;else if(k=='title'){O.title=t.value;rr();return}
else if(k=='orient'){ST.orient=t.value;persist()}else if(k=='lay'){ST.lay=t.value;persist()}else if(k=='tbl'){ST.tbl=t.value;persist()}
CUR=0;drawSide();rr()}
function onClick(e){const b=e.target.closest('button');if(!b||!UI.contains(b))return;
if(b.dataset.sty){const id=b.dataset.sty,d=STY[id];ST.style=id;if(id!='custom'){ST.lay=d.lay;ST.tbl=d.tbl;ST.col=palCol(PAL[d.pal],d.lay)}persist();drawSide();rr()}
else if(b.dataset.pal){const p=PAL[b.dataset.pal];ST.col=palCol(p,ST.lay);persist();drawSide();rr()}}

/* ----- التصدير ----- */
async function pdf(){const list=scoped();if(!list.length)return toast('لا توجد مقابلات للتصدير');
if(!window.jspdf||!window.html2canvas)return toast('تعذر تحميل مكتبة PDF، تحقق من الاتصال');
const host=tmpHost();let dl=null;try{dl=window.claude?await window.claude.use('downloads'):null}catch(e){}
if(!dl)dl={save:async o=>{const a=document.createElement('a');a.href=URL.createObjectURL(o.data);a.download=o.filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}};
try{toast('جارٍ إنشاء الملف…');await document.fonts.ready;if(window.iconsReady)await iconsReady;
const land=isLand(),r=build(list,O.wr,land,host),A4=land?[297,210]:[210,297],doc=new jspdf.jsPDF({orientation:land?'l':'p',unit:'mm',format:'a4'});
for(let i=0;i<r.pages.length;i++){const cv=await html2canvas(r.pages[i],{scale:2,backgroundColor:'#ffffff',width:r.W,height:r.H,windowWidth:r.W});if(i)doc.addPage();doc.addImage(cv.toDataURL('image/jpeg',.95),'JPEG',0,0,A4[0],A4[1])}
const nmx=[O.wr?'تعيينات-الحكام':'برنامج-المقابلات',O.cat&&nm('cats',O.cat),O.date&&O.date].filter(Boolean).join('-').replace(/\s+/g,'-');
host.remove();await dl.save({filename:nmx+'.pdf',data:doc.output('blob')});toast('تم حفظ الملف')}
catch(e){console.error(e);if(!e||e.code!='declined')toast('تعذر إنشاء الملف')}finally{host.remove()}}
function print(){const list=scoped();if(!list.length)return toast('لا توجد مقابلات للطباعة');
let box=document.getElementById('rpxPrint');if(box)box.remove();box=document.createElement('div');box.id='rpxPrint';document.body.appendChild(box);
const land=isLand(),r=build(list,O.wr,land,box),st=document.createElement('style');st.id='rpxPg';st.textContent=`@page{size:A4 ${land?'landscape':'portrait'};margin:0}`;document.head.appendChild(st);
r.pages.forEach(p=>{p.style.height=(r.H-1)+'px'});
document.body.classList.add('rp-printing');
const done=()=>{document.body.classList.remove('rp-printing');box.remove();st.remove();removeEventListener('afterprint',done)};addEventListener('afterprint',done);setTimeout(()=>window.print(),150)}

/* ----- فتح / إغلاق النافذة ----- */
X.open=()=>{if(UI)return;load();const L=baseList();if(!L.length)return toast('لا توجد مقابلات للتصدير');
O.wr=sv.pm!='without';O.cat='';O.grp='';O.date='';O.title='';CUR=0;
UI=document.createElement('div');UI.className='rpx';UI.setAttribute('role','dialog');UI.setAttribute('aria-modal','true');UI.setAttribute('aria-label','تصدير تعيينات الحكام');
UI.innerHTML=`<div class="rpx-top"><b>تصدير تعيينات الحكام — معاينة وتصميم</b><button type="button" class="btn" data-x="close">✕ إغلاق</button></div><div class="rpx-main"><aside class="rpx-side"></aside><section class="rpx-pv"><div class="rpx-nav"><button type="button" class="btn pv-n" aria-label="الصفحة التالية">‹ التالية</button><span class="rpx-pn"></span><button type="button" class="btn pv-p" aria-label="الصفحة السابقة">السابقة ›</button></div><div class="rpx-stage"></div></section></div><div class="rpx-act"><button type="button" class="btn pr x" data-x="pdf">⬇ تحميل PDF</button><button type="button" class="btn x" data-x="print">طباعة</button><button type="button" class="btn" data-x="close">إغلاق</button></div>`;
document.body.appendChild(UI);document.body.style.overflow='hidden';
UI.addEventListener('change',onSide);UI.addEventListener('input',e=>{if(e.target.dataset&&(e.target.dataset.k=='title'))onSide(e)});UI.addEventListener('click',e=>{onClick(e);const x=e.target.closest('[data-x]');if(x){const a=x.dataset.x;if(a=='close')X.close();else if(a=='pdf')pdf();else if(a=='print')print()}if(e.target.closest('.pv-n')&&CUR<PG.length-1){CUR++;show()}if(e.target.closest('.pv-p')&&CUR>0){CUR--;show()}});
document.addEventListener('keydown',kd);addEventListener('resize',rs);
(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>{if(!UI)return;drawSide();render()})};
const kd=e=>{if(!UI)return;if(e.key=='Escape')X.close();else if(e.key=='ArrowLeft'&&CUR<PG.length-1){CUR++;show()}else if(e.key=='ArrowRight'&&CUR>0){CUR--;show()}};
const rs=()=>{if(UI&&PG.length)show()};
X.close=()=>{if(!UI)return;clearTimeout(TMR);UI.remove();UI=null;PG=[];document.body.style.overflow='';document.removeEventListener('keydown',kd);removeEventListener('resize',rs)};
})();
