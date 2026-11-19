/* ===== لجنة الانضباط + لجنة التنظيم والمنافسة =====
   وحدة مستقلة تعتمد على المتغيرات العامة للواجهة (S, go, save, ask, openM, setM, closeM, gform, toast, esc, uid, pfoot, nzm, ft, today, SID, page).
   بيانات كل لجنة تُحفظ داخل وثيقة الموسم نفسها (S.disc / S.org) فتبقى منفصلة تمامًا حسب الموسم، ولا تمسّ أي بيانات أخرى.
   كل المعرّفات داخل IIFE، والمُصدَّر الوحيد هو window.CMX لتفادي أي تعارض مع الكود الأصلي. */
(function(){
const CM={disc:{n:'لجنة الانضباط',P:true},org:{n:'لجنة التنظيم والمنافسة',P:false}},CMK=['disc','org'];
const LSTN=[['jd','قرارات الحكم'],['rs','الأسباب'],['cd','قرارات اللجنة'],['ar','المواد']];
const ROLES0=['لاعب','مدرب','مدرب مساعد','رئيس النادي','مسير','مناصر'];
const FONTS=['Cairo','Tajawal','Amiri'];
/* نسب أعمدة جدول الأشخاص في PDF (المجموع 100%): رقم الرخصة 17% ليتسع لـ10 رموز في سطر واحد */
const PCOL=[['lic','رقم الرخصة',17],['name','الاسم واللقب',15],['role','الصفة',9],['team','الفريق',12],['jd','قرار الحكم',11],['rs','السبب',11],['cd','قرار اللجنة',17],['ar','المادة',8]];
const X=window.CMX={};
const p2=n=>String(n).padStart(2,'0'),
 dmy=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')?d.split('-').reverse().join(' / '):String(d||''),
 bdi=t=>t?`<span class="ltr">${String(t).split(/(\d+)/).map(x=>/^\d+$/.test(x)?`<span>${x}</span>`:esc(x)).join('')}</span>`:'',
 ck=s=>nzm(s).n.replace(/\s+/g,' ').trim(),
 cl=o=>JSON.parse(JSON.stringify(o)),
 rtEmpty=h=>!/\S/.test(String(h||'').replace(/<[^>]*>|&nbsp;/g,' ')),
 PGE=document.getElementById('pg');
let ED=null,CTAB='m',LQ='',BT=0,RS=null;const MBGS={};
const VW={disc:'',org:''};
const mById=(k,id)=>S[k].minutes.find(x=>x.id==id),
 mIdx=(k,id)=>id?S[k].minutes.findIndex(x=>x.id==id):S[k].minutes.length,
 stN=v=>{const n=parseInt(v,10);return Number.isFinite(n)&&n>=1&&n<=9999?n:0},
 /* رقم أول قضية في المحضر i: القيمة اليدوية إن وُجدت، وإلا يستمر الترقيم من آخر قضية في المحضر السابق (والأول يبدأ من 01). ov = المحضر قيد التحرير (غير المحفوظ) */
 baseOf=(k,i,ov)=>{const M=S[k].minutes;let n=1;for(let j=0;j<=i&&j<M.length+1;j++){const m=(j==i&&ov)?ov:M[j];if(!m)break;const s=stN(m.start);if(s)n=s;if(j==i)return n-1;n+=m.cases.length}return n-1},
 autoBase=(k,i)=>{const M=S[k].minutes;let n=1;for(let j=0;j<i&&j<M.length;j++){const s=stN(M[j].start);if(s)n=s;n+=M[j].cases.length}return n},
 /* رقم المحضر i: القيمة اليدوية (m.no) إن وُجدت، وإلا يلي رقم المحضر السابق (الأول يبدأ من 01). نفس آلية رقم أول قضية. الموضع في القائمة هو ترتيب المصفوفة فقط ولا يتغير بتغيير الرقم */
 noOf=(k,i,ov)=>{const M=S[k].minutes;let n=0;for(let j=0;j<=i&&j<M.length+1;j++){const m=(j==i&&ov)?ov:M[j];if(!m)break;const s=stN(m.no);n=s||n+1;if(j==i)return n}return n||i+1},
 autoNo=(k,i)=>i>0?noOf(k,i-1)+1:1,
 dupNo=(k,i,ov)=>{const M=S[k].minutes,n=noOf(k,i,ov);return M.some((x,j)=>j!=i&&noOf(k,j)==n)},
 bkKey=(k,mid)=>'ra_ed:'+SID+':'+k+':'+(mid||'new'),
 bkRm=(k,mid)=>{try{localStorage.removeItem(bkKey(k,mid))}catch(e){}},
 bkNow=()=>{if(!ED)return;try{localStorage.setItem(bkKey(ED.k,ED.mid),JSON.stringify(ED.m))}catch(e){}};

/* ===== تهيئة البيانات (آمنة ومتكررة، لا تحذف شيئًا) ===== */
X.mig=function(){S.disc??={};S.org??={};CMK.forEach(k=>{if(!Array.isArray(S[k].minutes))S[k].minutes=[]});const L=(S.disc.lists??={});['pl','jd','rs','cd','ar','mem'].forEach(x=>{if(!Array.isArray(L[x]))L[x]=[]});
/* مرة واحدة فقط: تعبئة قائمة الأعضاء الحاضرين من أسماء المحاضر السابقة (دون حذف أو تعديل أي محضر) */
if(!S.disc.memSeed){S.disc.memSeed=1;const sn=new Set(L.mem.map(x=>ck(x.name)));S.disc.minutes.forEach(m=>(m.members||[]).forEach(y=>{const n=String(y.n||'').trim().replace(/\s+/g,' ');if(n&&!sn.has(ck(n))){sn.add(ck(n));L.mem.push({id:uid(),name:n,role:String(y.r||'').trim()})}}))}};
X.busy=()=>!!ED;
X.reset=k=>{VW[k]='';CTAB='m';LQ=''};
X.resetAll=()=>{CMK.forEach(X.reset);ED=null};

/* ===== تنقية نص التقرير (Rich Text) ===== */
const OKB=new Set(['B','STRONG','I','EM','U','S','STRIKE','DEL','P','DIV','BR','SPAN','UL','OL','LI','H1','H2','H3','H4','BLOCKQUOTE','SUB','SUP']);
const DROP=new Set(['SCRIPT','STYLE','META','LINK','TITLE','HEAD','IFRAME','OBJECT','EMBED','SVG','IMG','VIDEO','AUDIO','CANVAS','FORM','INPUT','BUTTON','TEXTAREA','SELECT','NOSCRIPT','TEMPLATE','XML','O:P']);
const SZ={1:10,2:13,3:16,4:18,5:24,6:32,7:48};
function sStyle(st){const o=[];String(st||'').split(';').forEach(d=>{const i=d.indexOf(':');if(i<0)return;const p=d.slice(0,i).trim().toLowerCase(),v=d.slice(i+1).trim();if(!v||/url\(|expression|javascript|@import|\\|[<>]/i.test(v))return;
const ok=p=='font-family'?/^[\w\s,'"\-\u0600-\u06FF]+$/.test(v):p=='font-size'?/^\d+(\.\d+)?(px|pt|em|rem|%)$/i.test(v):(p=='color'||p=='background-color')?/^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\)|[a-z]+)$/i.test(v):p=='text-align'?/^(right|left|center|justify|start|end)$/i.test(v):p=='font-weight'?/^(bold|normal|[1-9]00)$/i.test(v):p=='font-style'?/^(italic|normal)$/i.test(v):(p=='text-decoration'||p=='text-decoration-line')?/^(underline|line-through|none|underline line-through|line-through underline)$/i.test(v):p=='direction'?/^(rtl|ltr)$/i.test(v):['text-indent','margin-right','margin-left','padding-right','padding-left'].includes(p)?/^-?\d+(\.\d+)?(px|pt|em|rem|%)$/i.test(v):p=='line-height'?/^\d+(\.\d+)?(px|pt|em|rem|%)?$/i.test(v):false;
if(ok)o.push(p+':'+v)});return o.join(';')}
function sNode(n,out){n.childNodes.forEach(c=>{if(c.nodeType==3){out.appendChild(document.createTextNode(c.nodeValue));return}if(c.nodeType!=1)return;const t=c.tagName;if(DROP.has(t))return;
if(t=='FONT'||OKB.has(t)){const e=document.createElement(t=='FONT'?'span':t.toLowerCase());let st=sStyle(c.getAttribute('style'));
if(t=='FONT'){const col=c.getAttribute('color'),fc=c.getAttribute('face'),sz=c.getAttribute('size');if(col&&/^(#[0-9a-f]{3,8}|[a-z]+)$/i.test(col))st+=';color:'+col;if(fc&&/^[\w\s,'"\-\u0600-\u06FF]+$/.test(fc))st+=';font-family:'+fc;if(sz&&SZ[+sz])st+=';font-size:'+SZ[+sz]+'px'}
st=st.replace(/^;/,'');if(st)e.setAttribute('style',st);const d=c.getAttribute('dir');if(d&&/^(rtl|ltr)$/i.test(d))e.setAttribute('dir',d.toLowerCase());
const al=c.getAttribute('align');if(al&&/^(right|left|center|justify)$/i.test(al)&&!/text-align/.test(st))e.style.textAlign=al.toLowerCase();sNode(c,e);out.appendChild(e)}else sNode(c,out)})}
function cleanHtml(h){const d=new DOMParser().parseFromString('<body>'+String(h||'')+'</body>','text/html'),o=document.createElement('div');sNode(d.body,o);return o.innerHTML}
X.clean=cleanHtml;

/* ===== تصاميم المحضر (ألوان الزخارف والعناوين والجداول) =====
   الاختيار محفوظ لكل لجنة على حدة في S.set.cth (وليس داخل المحاضر ولا القضايا)، فتغييره لا يمس أي بيانات محفوظة.
   الورقة بيضاء دائمًا في كل التصاميم (حتى التصميم الداكن) لضمان وضوح النص وجودة الطباعة.
   g=اللون الرئيسي، g2=لون التمييز، d=الشريط الداكن، th=خلفية رؤوس الجداول، td=خلفية الخلايا، tp=خلفية جدول الأشخاص */
const THEMES=[
{id:'brand',n:'هوية المشروع',g:'#0b6e4f',g2:'#1aa876',d:'#10262e',th:'#fbdcc8',td:'#fff6e0',tp:'#fffaf0'},
{id:'green',n:'أخضر',g:'#1b7f3b',g2:'#4cbb5f',d:'#0e2a17',th:'#d3ecd9',td:'#f0f9f2',tp:'#f7fcf8'},
{id:'red',n:'أحمر',g:'#a61b1f',g2:'#e2474b',d:'#2a0f10',th:'#f6d4d4',td:'#fff1ef',tp:'#fff8f7'},
{id:'blue',n:'أزرق',g:'#0d5aa7',g2:'#3a9ad9',d:'#0b2140',th:'#d3e4f6',td:'#eef5fc',tp:'#f6faff'},
{id:'dark',n:'داكن',g:'#262b36',g2:'#7b8497',d:'#12151c',th:'#d9dde5',td:'#f1f3f7',tp:'#f8f9fb'}];
const thOf=k=>{const id=S.set&&S.set.cth&&S.set.cth[k];return THEMES.find(t=>t.id==id)||THEMES[0]};
const thVars=t=>`--mc:${t.g};--mth:${t.th};--mtd:${t.td};--mtp:${t.tp}`;
const thSw=t=>`<span class="sw" aria-hidden="true"><i style="background:${t.d}"></i><i style="background:${t.g}"></i><i style="background:${t.g2}"></i><i style="background:${t.th}"></i></span>`;
const thPick=(k,title)=>`<div class="thp noprint" role="group" aria-label="${title}"><b>${title}</b>${THEMES.map(t=>`<button type="button" class="tho${t.id==thOf(k).id?' on':''}" aria-pressed="${t.id==thOf(k).id}" onclick="CMX.theme('${k}','${t.id}')">${thSw(t)}${t.n}</button>`).join('')}</div>`;
X.theme=(k,id)=>{if(!CM[k]||!THEMES.some(t=>t.id==id))return;S.set.cth={...(S.set.cth||{}),[k]:id};save();go()};
X.themeCard=()=>`<div class="cat thc"><b>تصميم محاضر اللجان (لون الخلفية والجداول)</b><p style="color:var(--mt);font-size:13px;margin:4px 0 0">يُطبَّق على المعاينة والطباعة وملف PDF لكل لجنة على حدة، ولا يغيّر المحاضر أو القضايا المحفوظة. الورقة تبقى بيضاء لضمان وضوح النص وجودة الطباعة.</p>${CMK.map(k=>thPick(k,CM[k].n)).join('')}</div>`;

/* ===== خلفية الصفحة (الزوايا الزخرفية) — تُولَّد مرة لكل تصميم وتُستعمل في المعاينة والطباعة وPDF ===== */
function mBg(t){t=t||THEMES[0];let u=MBGS[t.id];if(!u){const w=1240,h=1754,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);
const G=t.g,G2=t.g2,D=t.d,poly=(col,pts)=>{x.fillStyle=col;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill()};
/* أعلى اليسار: شريط داكن مائل مع خط تمييز */
poly(D,[[0,0],[w*.58,0],[w*.535,h*.021],[0,h*.021]]);poly(G2,[[0,h*.0245],[w*.5,h*.0245],[w*.485,h*.031],[0,h*.031]]);
/* أعلى اليمين: مثلث كبير مع حافة داكنة */
poly(G,[[w*.9,0],[w,0],[w,h*.058]]);poly(D,[[w*.82,0],[w*.9,0],[w,h*.058],[w,h*.07]]);poly(G2,[[w*.96,0],[w,0],[w,h*.025]]);
/* أسفل اليسار */
poly(G,[[0,h*.95],[w*.05,h],[0,h]]);poly(D,[[0,h*.935],[0,h*.95],[w*.05,h],[w*.1,h]]);
/* أسفل اليمين */
poly(D,[[w,h*.968],[w*.42,h*.968],[w*.4,h*.979],[w,h*.979]]);poly(G2,[[w,h*.9835],[w*.46,h*.9835],[w*.445,h*.9895],[w,h*.9895]]);poly(G,[[w,h*.93],[w,h],[w*.9,h]]);
/* إطار جانبي رفيع */
x.fillStyle=G;x.fillRect(0,h*.12,w*.008,h*.76);x.fillRect(w*.992,h*.14,w*.008,h*.74);
u=MBGS[t.id]=c.toDataURL('image/jpeg',.92)}
document.documentElement.style.setProperty('--mbg',`url(${u})`);return u}

/* ===== بناء مكونات المحضر (تُستعمل في المعاينة والطباعة وPDF) ===== */
const hdrH=k=>{const s=S.set;let L=[s.mh1,s.mh2,s.mh3].filter(Boolean);if(!L.length)L=[s.l1].filter(Boolean);
return `<div class="mhd">${s.logo?`<img src="${s.logo}" alt="">`:''}<div class="ml">${L.map((t,i)=>`<b${i==L.length-1?' class="g"':''}>${esc(t)}</b>`).join('')}</div></div><div class="mtt">${CM[k].n}</div>`};
const infoH=(k,m,i)=>`<div class="mif"><span>الجلسة : ${bdi(dmy(m.date))}</span><span>المحضر رقم : ${bdi(p2(noOf(k,i)))}${m.status=='draft'?' <i class="mdr">مسودة</i>':''}</span></div>`,
/* الأعضاء الحاضرون: لجنة الانضباط تعرضهم في جدول مستقل بعنوانه (منفصل عن جدول اللاعبين والمسيرين)، ولجنة التنظيم تبقى كما كانت (سطر واحد) */
memH=(k,m)=>{const L=(m.members||[]).filter(x=>x.n);if(!L.length)return '';
if(k!='disc')return `<div class="mmb">الأعضاء الحاضرون : ${L.map(x=>esc(x.n)+(x.r?' ('+esc(x.r)+')':'')).join('، ')}</div>`;
return `<div class="mat"><div class="mmh">الأعضاء الحاضرون</div><table class="mx mam"><colgroup><col style="width:12%"><col style="width:50%"><col style="width:38%"></colgroup><thead><tr><th>الرقم</th><th>الاسم واللقب</th><th>الصفة</th></tr></thead><tbody>${L.map((x,j)=>`<tr><td>${bdi(p2(j+1))}</td><td>${esc(x.n)}</td><td>${esc(x.r||'')}</td></tr>`).join('')}</tbody></table></div>`},
stH='<div class="mst">دراسة القضايا</div>';
const miniH=(k,m,i)=>`<div class="mmini"><span>${CM[k].n}</span><span>المحضر رقم : ${bdi(p2(noOf(k,i)))}</span><span>الجلسة : ${bdi(dmy(m.date))}</span></div>`;
const caseHead=(c,n)=>`<div class="mch"><div class="mca"><table class="mx mcr"><colgroup><col style="width:30%"><col></colgroup><tr><th>رقم القضية</th><td>${bdi(p2(n))}</td></tr><tr><th>المقابلة</th><td>${esc(c.t1)} – ${esc(c.t2)}</td></tr></table></div><div class="mcb"><table class="mx"><thead><tr><th>الصنف</th><th>التاريخ</th><th>الوقت</th><th>الملعب</th></tr></thead><tbody><tr><td>${esc(c.cat)}</td><td>${bdi(dmy(c.date))}</td><td>${bdi(c.time?ft(c.time):'')}</td><td>${esc(c.stad)}</td></tr></tbody></table></div></div>`;
const mCols='<colgroup>'+PCOL.map(c=>`<col style="width:${c[2]}%">`).join('')+'</colgroup>',
 pHead=()=>`<table class="mx mp mhh">${mCols}<thead><tr>${PCOL.map(c=>`<th>${c[1]}</th>`).join('')}</tr></thead></table>`,
 pCells=r=>PCOL.map(c=>c[0]=='lic'?`<td class="lic">${bdi(r.lic)}</td>`:`<td>${esc(r[c[0]])}</td>`).join('');
const caseH=(k,c,n)=>`<div class="mcs">${caseHead(c,n)}${CM[k].P&&c.rows&&c.rows.length?`<div class="tw"><table class="mx mp${rtEmpty(c.report)?'':' tj'}">${mCols}<thead><tr>${PCOL.map(x=>`<th>${x[1]}</th>`).join('')}</tr></thead><tbody>${c.rows.map(r=>`<tr>${pCells(r)}</tr>`).join('')}</tbody></table></div>`:''}${rtEmpty(c.report)?'':`<div class="mrp">${cleanHtml(c.report)}</div>`}</div>`;
const docH=(k,m,i)=>{const b=baseOf(k,i);return `<table class="mpt"><thead><tr><td class="sp"></td></tr></thead><tbody><tr><td>${hdrH(k)}${infoH(k,m,i)}${memH(k,m)}${stH}</td></tr>${m.cases.map((c,j)=>`<tr><td>${caseH(k,c,b+j+1)}</td></tr>`).join('')||'<tr><td class="em">لا توجد قضايا في هذا المحضر.</td></tr>'}</tbody><tfoot><tr><td class="sp">${pfoot()}</td></tr></tfoot></table><div class="mfx" aria-hidden="true"></div>`};

/* ===== الصفحات: قائمة المحاضر / القوائم / العرض ===== */
X.pg=function(k){X.mig();const w=h=>`<div class="cmw" style="--ca:${thOf(k).g}">${h}</div>`;if(ED&&ED.k==k)return w(edHtml());const m=VW[k]&&mById(k,VW[k]);if(m){mBg(thOf(k));return w(viewHtml(k,m))}VW[k]='';return w((k=='disc'&&CTAB=='l')?listsHtml():listHtml(k))};
const tabs=k=>k!='disc'?'':`<div class="bar noprint"><div class="seg" role="tablist" aria-label="أقسام لجنة الانضباط"><button type="button" role="tab" aria-selected="${CTAB=='m'}" class="${CTAB=='m'?'on':''}" onclick="CMX.tab('m')">المحاضر</button><button type="button" role="tab" aria-selected="${CTAB=='l'}" class="${CTAB=='l'?'on':''}" onclick="CMX.tab('l')">القوائم</button></div></div>`;
X.tab=t=>{CTAB=t;LQ='';go()};
function listHtml(k){const M=S[k].minutes,tc=M.reduce((a,m)=>a+m.cases.length,0);const rows=M.map((m,i)=>{const n=m.cases.length,a=baseOf(k,i)+1,z=a+n-1;const mem=m.members.filter(x=>x.n).map(x=>esc(x.n)+(x.r?' ('+esc(x.r)+')':'')).join('، ');
return `<tr><td data-l="المحضر"><b>${bdi(p2(noOf(k,i)))}</b>${dupNo(k,i)?' <span class="lb" title="رقم مكرر">⚠ مكرر</span>':''}${stN(m.no)?' <small class="sb2">(يدوي)</small>':''} <button class="btn sm" aria-label="تغيير رقم المحضر" title="تغيير رقم المحضر" onclick="CMX.renum('${k}','${m.id}')">✎</button></td><td data-l="تاريخ الجلسة">${bdi(dmy(m.date))}</td><td data-l="الأعضاء الحاضرون" style="white-space:normal;min-width:200px">${mem||'—'}</td><td data-l="القضايا">${n?(n==1?bdi(p2(a)):bdi(p2(a))+' – '+bdi(p2(z)))+` <small class="sb2">(${n})</small>`:'—'}</td><td data-l="الحالة">${m.status=='final'?'<span class="ok">✔ نهائي</span>':'<span class="lb">مسودة</span>'}</td><td class="ac"><button class="btn pr" onclick="CMX.view('${k}','${m.id}')">عرض</button><button class="btn" onclick="CMX.edit('${k}','${m.id}')">تعديل</button><button class="btn" onclick="CMX.pdf('${k}','${m.id}')">PDF</button><button class="btn" onclick="CMX.print('${k}','${m.id}')">طباعة</button><button class="btn dg" onclick="CMX.del('${k}','${m.id}')">حذف</button></td></tr>`}).join('');
return `${tabs(k)}<div class="bar noprint"><button class="btn pr" onclick="CMX.new('${k}')">+ محضر جديد</button><span style="color:var(--mt);font-size:13px;flex:1">${CM[k].n} — الموسم ${esc(seasonName())}: ${M.length} محضر، ${tc} قضية</span></div>${thPick(k,'تصميم المحاضر')}<div class="tw rtw"><table class="rt"><thead><tr><th>المحضر</th><th>تاريخ الجلسة</th><th>الأعضاء الحاضرون</th><th>القضايا</th><th>الحالة</th><th></th></tr></thead>${rows||'<tr><td colspan="6" class="em">لا توجد محاضر في هذا الموسم. اضغط «+ محضر جديد» للبدء.</td></tr>'}</table></div>${mOrderHtml(k)}`}
/* ===== ترتيب المحاضر يدويًا (سحب وإفلات أو أسهم): الترتيب الفعلي مستقل عن رقم المحضر ويُحفظ في قاعدة البيانات ===== */
function mOrderHtml(k){const M=S[k].minutes;if(M.length<2)return '';
return `<section class="fs ord noprint"><h4>ترتيب المحاضر</h4><p style="color:var(--mt);font-size:13px;margin:0 0 8px">اسحب المحضر من المقبض ⠿ (أو استعمل الأسهم) لتغيير موضعه في القائمة؛ يُحفظ الترتيب في قاعدة البيانات ويبقى ثابتًا بعد التحديث وتسجيل الخروج. تغيير <b>رقم</b> المحضر لا يغيّر موضعه، وتغيير الموضع لا يغيّر رقمه اليدوي. ملاحظة: أرقام القضايا التلقائية تتبع الترتيب؛ لتثبيت رقم قضية معيّن استعمل خانة «رقم أول قضية» في المحضر.</p><ol class="rol" id="mol">${M.map((m,j)=>`<li data-j="${j}"><span class="rgr" role="button" tabindex="0" aria-label="اسحب لإعادة الترتيب" title="اسحب لإعادة الترتيب">⠿</span><b class="rno">${p2(noOf(k,j))}</b><span class="rtx">${bdi(dmy(m.date))} — ${m.cases.length} قضية ${m.status=='final'?'':'<span class="lb">مسودة</span>'}</span><span class="rbt"><button type="button" class="btn" onclick="CMX.mMove('${k}',${j},-1)" aria-label="أعلى"${j==0?' disabled':''}>▲</button><button type="button" class="btn" onclick="CMX.mMove('${k}',${j},1)" aria-label="أسفل"${j==M.length-1?' disabled':''}>▼</button></span></li>`).join('')}</ol></section>`}
function mReorder(k,order){const M=S[k].minutes;if(order.length!=M.length||order.every((v,i)=>v==i))return;S[k].minutes=order.map(j=>M[j]);save();go();toast('تم حفظ الترتيب الجديد للمحاضر')}
X.mMove=(k,j,d)=>{const n=S[k].minutes.length,t=j+d;if(t<0||t>=n)return;const o=[...Array(n).keys()];o.splice(j,1);o.splice(t,0,j);mReorder(k,o)};
X.renum=(k,id)=>{const i=mIdx(k,id),m=S[k].minutes[i];if(!m)return;gform('تغيير رقم المحضر',[{k:'no',l:'رقم المحضر (اتركه فارغًا ليُحسب تلقائيًا بعد المحضر السابق — الحالي: '+p2(noOf(k,i))+')',t:'number'}],{no:stN(m.no)||''},v=>{const t=String(v.no||'').trim();if(t&&!stN(t))return $('#er').textContent='أدخل رقمًا صحيحًا بين 1 و9999';const n=stN(t);if(n)m.no=n;else delete m.no;save();closeM();go();toast(n?'تم تغيير رقم المحضر دون تغيير موضعه':'عاد الرقم تلقائيًا')})};
function viewHtml(k,m){const i=mIdx(k,m.id),id=m.id;return `<div class="bar noprint"><button class="btn" onclick="CMX.back('${k}')">← المحاضر</button><b style="flex:1;min-width:150px">${CM[k].n} — المحضر رقم ${p2(noOf(k,i))} ${m.status=='final'?'<span class="ok">✔ نهائي</span>':'<span class="lb">مسودة</span>'}</b><button class="btn pr" onclick="CMX.edit('${k}','${id}')">تعديل</button><button class="btn" onclick="CMX.pdf('${k}','${id}')">⬇ تحميل PDF</button><button class="btn" onclick="CMX.print('${k}','${id}')">طباعة</button><button class="btn dg" onclick="CMX.del('${k}','${id}')">حذف</button></div>${thPick(k,'تصميم المحضر')}<div class="pv mpv" style="${thVars(thOf(k))}">${docH(k,m,i)}</div>`}
X.view=(k,id)=>{VW[k]=id;go();scrollTo(0,0)};
X.back=k=>{VW[k]='';go()};
X.del=(k,id)=>{const i=mIdx(k,id),m=S[k].minutes[i];if(!m)return;ask(`حذف المحضر رقم ${p2(noOf(k,i))} نهائيًا${m.cases.length?' مع قضاياه ('+m.cases.length+')':''}؟ سيُعاد ترقيم المحاضر والقضايا اللاحقة تلقائيًا.`,()=>{S[k].minutes.splice(i,1);if(VW[k]==id)VW[k]='';save();go();toast('تم حذف المحضر وإعادة الترقيم')})};

/* ===== القوائم (لجنة الانضباط) ===== */
const byAr=(a,b)=>String(a).localeCompare(String(b),'ar');
function listsHtml(){const L=S.disc.lists,q=ck(LQ),all=[...L.pl].sort((a,b)=>byAr(a.name,b.name)),pl=all.filter(p=>!q||ck([p.lic,p.name,p.role,p.team].join(' ')).includes(q)),sh=pl.slice(0,150);
const sc=(k,n)=>`<div class="cat"><div class="bar" style="margin:0 0 8px"><b style="flex:1">${n} (${L[k].length})</b><button class="btn pr" onclick="CMX.lEdit('${k}')">+ إضافة</button></div><div class="ll">${[...L[k]].sort((a,b)=>byAr(a.v,b.v)).map(x=>`<div class="li"><span>${esc(x.v)}</span><span class="ac"><button class="btn" onclick="CMX.lEdit('${k}','${x.id}')">تعديل</button><button class="btn dg" onclick="CMX.lDel('${k}','${x.id}')">حذف</button></span></div>`).join('')||'<div class="em">لا توجد عناصر. تُضاف تلقائيًا عند حفظ المحاضر، أو يدويًا من هنا.</div>'}</div></div>`;
return `${tabs('disc')}<p style="color:var(--mt);font-size:13px;margin:0 0 10px">قوائم الموسم ${esc(seasonName())}: تُستعمل للاختيار السريع داخل المحاضر، وتُضاف إليها القيم الجديدة تلقائيًا عند حفظ المحضر (مسودة أو نهائيًا) دون تكرار.</p><div class="cat"><div class="bar" style="margin:0 0 8px"><b style="flex:1">اللاعبون والمسيرون (${L.pl.length})</b><label style="flex:0 1 260px;min-width:150px"><input id="lq" placeholder="بحث..." value="${esc(LQ)}" oninput="CMX.lq(this.value)"></label><button class="btn pr" onclick="CMX.lEdit('pl')">+ إضافة</button></div><div class="tw rtw"><table class="rt"><thead><tr><th>رقم الرخصة</th><th>الاسم واللقب</th><th>الصفة</th><th>الفريق</th><th></th></tr></thead>${sh.map(p=>`<tr><td data-l="رقم الرخصة">${bdi(p.lic)}</td><td data-l="الاسم واللقب"><b>${esc(p.name)}</b></td><td data-l="الصفة">${esc(p.role)}</td><td data-l="الفريق">${esc(p.team)}</td><td class="ac"><button class="btn" onclick="CMX.lEdit('pl','${p.id}')">تعديل</button><button class="btn dg" onclick="CMX.lDel('pl','${p.id}')">حذف</button></td></tr>`).join('')||'<tr><td colspan="5" class="em">'+(L.pl.length?'لا توجد نتائج مطابقة.':'لا توجد أسماء بعد. تُضاف تلقائيًا عند حفظ المحاضر، أو يدويًا من هنا.')+'</td></tr>'}</table></div>${pl.length>150?`<p class="em" style="padding:8px">يُعرض أول 150 نتيجة من ${pl.length} — استعمل البحث لتضييق القائمة.</p>`:''}</div>${memCard()}<div class="sgrid">${LSTN.map(x=>sc(x[0],x[1])).join('')}</div>`}
/* قائمة الأعضاء الحاضرين: مستقلة تمامًا عن اللاعبين والمسيرين (مصفوفة منفصلة S.disc.lists.mem)، بترتيب يدوي */
function memCard(){const A=S.disc.lists.mem;return `<div class="cat"><div class="bar" style="margin:0 0 8px"><b style="flex:1">الأعضاء الحاضرون (${A.length})</b><button class="btn pr" onclick="CMX.mEdit()">+ إضافة عضو</button></div><p style="color:var(--mt);font-size:13px;margin:0 0 8px">أعضاء لجنة الانضباط الذين يحضرون الجلسات. تُستعمل للاختيار السريع داخل المحضر وتظهر في جدول مستقل في المحضر والطباعة وPDF، ولا تختلط بقائمة اللاعبين والمسيرين. اسحب ⠿ لتغيير الترتيب.</p>${A.length?`<ol class="rol" id="meml">${A.map((x,j)=>`<li data-j="${j}"><span class="rgr" role="button" tabindex="0" aria-label="اسحب لإعادة الترتيب" title="اسحب لإعادة الترتيب">⠿</span><b class="rno">${p2(j+1)}</b><span class="rtx"><b>${esc(x.name)}</b>${x.role?' — '+esc(x.role):''}</span><span class="rbt"><button type="button" class="btn" onclick="CMX.mMv(${j},-1)" aria-label="أعلى"${j==0?' disabled':''}>▲</button><button type="button" class="btn" onclick="CMX.mMv(${j},1)" aria-label="أسفل"${j==A.length-1?' disabled':''}>▼</button><button class="btn" onclick="CMX.mEdit('${x.id}')">تعديل</button><button class="btn dg" onclick="CMX.mDel('${x.id}')">حذف</button></span></li>`).join('')}</ol>`:'<div class="em">لا يوجد أعضاء بعد. اضغط «+ إضافة عضو»، أو تُضاف الأسماء تلقائيًا عند حفظ المحاضر.</div>'}</div>`}
X.mEdit=id=>{const A=S.disc.lists.mem,o=id&&A.find(x=>x.id==id);gform((o?'تعديل عضو':'إضافة عضو حاضر'),[{k:'name',l:'الاسم واللقب',r:1},{k:'role',l:'الصفة (مثال: رئيس اللجنة، عضو، أمين)'}],o?{name:o.name,role:o.role||''}:{},v=>{const t=x=>String(x||'').trim().replace(/\s+/g,' '),n=t(v.name),r=t(v.role),E_=$('#er');if(!n)return E_.textContent='الاسم واللقب مطلوب';if(A.some(x=>(!o||x.id!=o.id)&&ck(x.name)==ck(n)))return E_.textContent='هذا العضو موجود مسبقًا في القائمة';
if(o){o.name=n;o.role=r}else A.push({id:uid(),name:n,role:r});save();closeM();go();toast('تم الحفظ — المحاضر المحفوظة تحتفظ بنصها كما كُتبت')})};
X.mDel=id=>ask('حذف هذا العضو من قائمة الأعضاء الحاضرين؟ المحاضر المحفوظة لا تتأثر ويبقى اسمه فيها.',()=>{const A=S.disc.lists;A.mem=A.mem.filter(x=>x.id!=id);S.disc.minutes.forEach(m=>(m.members||[]).forEach(y=>{if(y.id==id)delete y.id}));save();go()});
X.mMv=(j,d)=>{const A=S.disc.lists.mem,t=j+d;if(t<0||t>=A.length)return;const o=[...Array(A.length).keys()];o.splice(j,1);o.splice(t,0,j);memReorder(o)};
function memReorder(o){const A=S.disc.lists.mem;if(o.length!=A.length||o.every((v,i)=>v==i))return;S.disc.lists.mem=o.map(j=>A[j]);save();go()}
X.lq=v=>{LQ=v;go()};
X.lEdit=(k,id)=>{const L=S.disc.lists[k],o=id&&L.find(x=>x.id==id),isP=k=='pl',nm_=isP?'لاعب / مسير':(LSTN.find(x=>x[0]==k)||[])[1];
const f=isP?[{k:'lic',l:'رقم الرخصة'},{k:'name',l:'الاسم واللقب',r:1},{k:'role',l:'الصفة'},{k:'team',l:'الفريق'}]:[{k:'v',l:'القيمة',r:1}];
gform((o?'تعديل: ':'إضافة: ')+nm_,f,o?{...o}:{},v=>{const t=s=>String(s||'').trim().replace(/\s+/g,' '),E_=$('#er');
if(isP){const n={lic:t(v.lic),name:t(v.name),role:t(v.role),team:t(v.team)};if(!n.name)return E_.textContent='الاسم واللقب مطلوب';
if(L.some(x=>(!o||x.id!=o.id)&&((n.lic&&ck(x.lic)==ck(n.lic))||(ck(x.name)==ck(n.name)&&ck(x.team)==ck(n.team)))))return E_.textContent='يوجد شخص بنفس رقم الرخصة أو بنفس الاسم والفريق';
if(o)Object.assign(o,n);else L.push({id:uid(),...n})}
else{const n=t(v.v);if(!n)return E_.textContent='القيمة مطلوبة';if(L.some(x=>(!o||x.id!=o.id)&&ck(x.v)==ck(n)))return E_.textContent='هذه القيمة موجودة مسبقًا';if(o)o.v=n;else L.push({id:uid(),v:n})}
save();closeM();go();toast('تم الحفظ')})};
X.lDel=(k,id)=>ask('حذف هذا العنصر من القائمة؟ المحاضر المحفوظة لا تتأثر.',()=>{const L=S.disc.lists;L[k]=L[k].filter(x=>x.id!=id);save();go()});
/* التعلّم التلقائي: إضافة القيم الجديدة المُدخلة يدويًا إلى القوائم عند حفظ المحضر، مع منع التكرار */
function learn(m){const L=S.disc.lists;(m.members||[]).forEach(y=>{if(!y.n)return;let h=(y.id&&L.mem.find(x=>x.id==y.id))||L.mem.find(x=>ck(x.name)==ck(y.n));if(!h){h={id:uid(),name:y.n,role:y.r||''};L.mem.push(h)}else if(!h.role&&y.r)h.role=y.r;y.id=h.id});m.cases.forEach(c=>(c.rows||[]).forEach(r=>{
if(r.name){const nk=ck(r.name),lk=ck(r.lic),tk=ck(r.team);let p=lk?L.pl.find(x=>ck(x.lic)==lk):null;if(!p)p=L.pl.find(x=>ck(x.name)==nk&&(!x.team||!r.team||ck(x.team)==tk)&&(!x.lic||!r.lic));
if(p){['lic','role','team'].forEach(f=>{if(!p[f]&&r[f])p[f]=r[f]})}else L.pl.push({id:uid(),lic:r.lic,name:r.name,role:r.role,team:r.team})}
['jd','rs','cd','ar'].forEach(f=>{const v=r[f];if(v&&!L[f].some(x=>ck(x.v)==ck(v)))L[f].push({id:uid(),v})})}))}

/* ===== محرر المحضر ===== */
const edGet=p=>p.split('.').reduce((o,k)=>o==null?o:o[k],ED.m),
 edSet=(p,v)=>{const a=p.split('.'),l=a.pop(),o=a.reduce((o,k)=>o[k],ED.m);o[l]=v},
 edPull=()=>{if(!ED)return;PGE.querySelectorAll('[data-e]').forEach(e=>{try{edSet(e.dataset.e,e.classList.contains('rte')?e.innerHTML:e.value)}catch(_){}})},
 edDirty=()=>{if(!ED)return;ED.dirty=true;clearTimeout(BT);BT=setTimeout(bkNow,700)},
 autoH=t=>{t.style.height='auto';t.style.height=t.scrollHeight+'px'},
 setF=(p,v)=>{edSet(p,v);const e=PGE.querySelector(`[data-e="${p}"]`);if(e){e.value=v;if(e.classList.contains('ag'))autoH(e)}edDirty()};
const blankCase=k=>({id:uid(),t1:'',t2:'',cat:'',date:'',time:'',stad:'',rows:CM[k].P?[{lic:'',name:'',role:'',team:'',jd:'',rs:'',cd:'',ar:''}]:[],report:''});
function edOpen(k,mid,m){m.members=m.members&&m.members.length?m.members:[{n:'',r:''}];ED={k,mid,m,dirty:false};VW[k]='';let o=null;try{const b=localStorage.getItem(bkKey(k,mid));if(b){o=JSON.parse(b);if(!o||!Array.isArray(o.cases))o=null}}catch(e){}
page=k;go();scrollTo(0,0);
if(o)(()=>{openM('استعادة تعديلات غير محفوظة');setM('<p>وُجدت نسخة محلية بها تعديلات لم تُحفظ لهذا المحضر (ربما بسبب إغلاق الصفحة أو انقطاع الاتصال). هل تريد استعادتها؟</p>',[{t:'استعادة التعديلات',c:'pr',f:()=>{closeM();ED.m=o;ED.dirty=true;go()}},{t:'تجاهلها',f:()=>{closeM();bkRm(k,mid)}}])})()}
X.new=k=>{const M=S[k].minutes,last=M[M.length-1];edOpen(k,null,{id:uid(),date:today(),members:last?cl(last.members):[{n:'',r:''}],cases:[],status:'draft'})};
X.edit=(k,id)=>{const m=mById(k,id);if(!m)return;const c=cl(m);if(CM[k].P)c.cases.forEach(x=>{if(!Array.isArray(x.rows))x.rows=[]});edOpen(k,id,c)};
function edClose(){if(ED)bkRm(ED.k,ED.mid);ED=null}
/* مغادرة المحرر: تحذير عند وجود تعديلات غير محفوظة مع خيار حفظها كمسودة */
X.leave=cb=>{if(!ED||!ED.dirty){edClose();cb();return}
openM('تعديلات غير محفوظة');setM('<p>في هذا المحضر تعديلات لم تُحفظ بعد. ماذا تريد؟</p>',[{t:'حفظ كمسودة ثم المغادرة',c:'pr',f:()=>{closeM();if(X.save(false,true)!==false){edClose();cb()}}},{t:'مغادرة دون حفظ',c:'dg',f:()=>{closeM();edClose();cb()}},{t:'البقاء في المحضر',f:closeM}])};
X.close=()=>{const k=ED.k,id=ED.mid;X.leave(()=>{if(id&&mById(k,id))VW[k]=id;go();scrollTo(0,0)})};
addEventListener('beforeunload',e=>{if(ED&&ED.dirty){bkNow();e.preventDefault();e.returnValue=''}});

const fld=(p,l,o={})=>{const v=edGet(p)??'',a=`data-e="${p}"${o.fc?` data-fc="${o.fc}" autocomplete="off"`:''}`;return `<label>${l}${o.ta?`<textarea class="ag" rows="1" ${a}>${esc(v)}</textarea>`:`<input type="${o.t||'text'}" ${a} value="${esc(v)}"${o.ph?` placeholder="${esc(o.ph)}"`:''}>`}</label>`};
const cin=(p,fc,ta)=>{const v=edGet(p)??'',a=`data-e="${p}"${fc?` data-fc="${fc}" autocomplete="off"`:''}`;return ta?`<textarea class="ag" rows="1" ${a}>${esc(v)}</textarea>`:`<input ${a} value="${esc(v)}">`};
const svg=(b,z=16)=>`<svg width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${b}</svg>`;
const rb=(cmd,t,title)=>`<button type="button" class="rb" onmousedown="event.preventDefault()" onclick="CMX.rc(this,'${cmd}')" title="${title}" aria-label="${title}">${t}</button>`;
const RTB=`<div class="rtb noprint" role="toolbar" aria-label="تنسيق النص"><select onchange="CMX.rf(this)" aria-label="نوع الخط"><option value="">نوع الخط</option>${['Cairo','Tajawal','Amiri','Tahoma','Arial','Times New Roman'].map(f=>`<option value="${f}">${f}</option>`).join('')}</select><select onchange="CMX.rs(this)" aria-label="حجم الخط"><option value="">الحجم</option>${[12,14,16,18,20,24,28,32,40].map(s=>`<option value="${s}">${s}</option>`).join('')}</select>${rb('bold','<b>B</b>','عريض')}${rb('italic','<i>I</i>','مائل')}${rb('underline','<u>U</u>','تسطير')}${rb('strikeThrough','<s>S</s>','يتوسطه خط')}<label class="rb rcl" title="لون الخط"><span style="border-bottom:3px solid currentColor;line-height:1.1">A</span><input type="color" value="#000000" onchange="CMX.rcol(this,'foreColor')" aria-label="لون الخط"></label><label class="rb rcl" title="تمييز بلون"><span style="background:#ffe08a;color:#111;padding:0 4px;border-radius:3px">A</span><input type="color" value="#ffe08a" onchange="CMX.rcol(this,'hiliteColor')" aria-label="لون التمييز"></label><span class="rsep"></span>${rb('justifyRight',svg('<line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="9" y1="12" y2="12"/><line x1="21" x2="7" y1="18" y2="18"/>'),'محاذاة لليمين')}${rb('justifyCenter',svg('<line x1="21" x2="3" y1="6" y2="6"/><line x1="17" x2="7" y1="12" y2="12"/><line x1="19" x2="5" y1="18" y2="18"/>'),'توسيط')}${rb('justifyLeft',svg('<line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/>'),'محاذاة لليسار')}${rb('justifyFull',svg('<line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/>'),'ضبط')}<span class="rsep"></span>${rb('insertUnorderedList','•≡','قائمة نقطية')}${rb('insertOrderedList','1≡','قائمة مرقمة')}${rb('outdent','⇥','تقليل المسافة')}${rb('indent','⇤','زيادة المسافة')}<span class="rsep"></span>${rb('undo','↶','تراجع')}${rb('redo','↷','إعادة')}${rb('removeFormat','Tx','مسح التنسيق')}</div>`;
function edHtml(){const{k,m}=ED,C=CM[k],M=S[k].minutes,i=ED.mid?M.findIndex(x=>x.id==ED.mid):M.length,base=baseOf(k,i<0?M.length:i,m),n0=noOf(k,i<0?M.length:i,m);
const mem=m.members.map((x,j)=>`<div class="mrow">${fld(`members.${j}.n`,'الاسم واللقب',{fc:'mem'})}${fld(`members.${j}.r`,'الصفة',{fc:'role'})}<button type="button" class="btn dg" onclick="CMX.delMem(${j})" aria-label="حذف العضو">✕</button></div>`).join('');
const cs=m.cases.map((c,j)=>{const N=p2(base+j+1),pf=`cases.${j}`;
const rows=C.P?`<div class="cll">الأشخاص والمخالفات</div><div class="tw rtw"><table class="rt ptb"><colgroup><col style="width:4%"><col style="width:9%"><col style="width:15%"><col style="width:9%"><col style="width:12%"><col style="width:11%"><col style="width:12%"><col style="width:15%"><col style="width:8%"><col style="width:5%"></colgroup><thead><tr><th>#</th>${PCOL.map(x=>`<th>${x[1]}</th>`).join('')}<th></th></tr></thead><tbody>${c.rows.map((r,q)=>`<tr><td data-l="#">${q+1}</td>${PCOL.map(x=>`<td data-l="${x[1]}">${cin(`${pf}.rows.${q}.${x[0]}`,x[0]=='lic'?'plc':x[0]=='name'?'pl':x[0],x[0]=='rs'||x[0]=='cd'||x[0]=='jd')}</td>`).join('')}<td class="ac"><button type="button" class="btn dg" onclick="CMX.delRow(${j},${q})" aria-label="حذف السطر">✕</button></td></tr>`).join('')||'<tr><td colspan="10" class="em">لا توجد أسطر. اضغط «+ إضافة شخص».</td></tr>'}</tbody></table></div><div class="bar" style="margin:8px 0 14px"><button type="button" class="btn" onclick="CMX.addRow(${j})">+ إضافة شخص</button></div>`:'';
return `<div class="cat cc" id="cc${j}"><div class="cch"><b>القضية رقم ${p2(base+j+1)}</b><button type="button" class="btn dg" onclick="CMX.delCase(${j})">حذف القضية</button></div><div class="g3">${fld(`${pf}.t1`,'الفريق الأول',{fc:'team',ph:'اختر أو اكتب…'})}${fld(`${pf}.t2`,'الفريق الثاني',{fc:'team',ph:'اختر أو اكتب…'})}${fld(`${pf}.cat`,'الصنف',{fc:'cat'})}${fld(`${pf}.date`,'التاريخ',{t:'date'})}${fld(`${pf}.time`,'الوقت',{t:'time'})}${fld(`${pf}.stad`,'الملعب',{fc:'stad'})}</div>${rows}<div class="cll">${C.P?'تقرير القضية / ملاحظات (اختياري)':'تقرير القضية'}</div><div class="rtw2">${RTB}<div class="rte${C.P?'':' big'}" contenteditable="true" dir="rtl" spellcheck="false" role="textbox" aria-multiline="true" aria-label="تقرير القضية ${N}" data-e="${pf}.report">${cleanHtml(c.report)}</div></div></div>`}).join('');
return `<div class="edh"><button type="button" class="btn" onclick="CMX.close()">← رجوع</button><b class="edt">${C.n} — ${ED.mid?'تعديل المحضر':'محضر جديد'} رقم ${p2(n0)}</b>${m.status=='final'?'<span class="ok">✔ نهائي</span>':'<span class="lb">مسودة</span>'}${ED.dirty?'<span class="wn w" style="margin:0">● تعديلات غير محفوظة</span>':''}</div><section class="fs"><h4>معلومات الجلسة</h4><div class="g3">${fld('date','تاريخ الجلسة',{t:'date'})}<label>رقم المحضر${dupNo(k,i<0?M.length:i,m)?' <span class="lb">⚠ مكرر</span>':''}<input type="number" min="1" max="9999" step="1" inputmode="numeric" data-e="no" value="${esc(stN(m.no)||'')}" placeholder="تلقائي: ${p2(autoNo(k,i<0?M.length:i))}"></label><label>رقم أول قضية في المحضر<input type="number" min="1" max="9999" step="1" inputmode="numeric" data-e="start" value="${esc(stN(m.start)||'')}" placeholder="تلقائي: ${p2(autoBase(k,i<0?M.length:i))}"></label></div><div class="cll" style="margin-top:2px">الأعضاء الحاضرون</div>${mem}<div class="bar" style="margin:4px 0 10px"><button type="button" class="btn" onclick="CMX.addMem()">+ إضافة عضو</button>${k=='disc'?'<button type="button" class="btn" onclick="CMX.pickMem()">اختيار من قائمة الأعضاء الحاضرين</button>':''}</div></section><div class="cll" style="margin:6px 2px"><b>القضايا (${m.cases.length})</b>${m.cases.length?' — يبدأ ترقيمها من القضية رقم '+p2(base+1):''}</div>${cs||'<div class="em">لا توجد قضايا بعد. اضغط «+ إضافة قضية».</div>'}<div class="bar" style="margin-top:10px"><button type="button" class="btn pr" onclick="CMX.addCase()">+ إضافة قضية</button></div>${orderHtml(k,m,base)}<div class="edbar noprint"><button type="button" class="btn pr" onclick="CMX.save(true)">حفظ نهائي</button><button type="button" class="btn" onclick="CMX.save(false)">حفظ كمسودة</button><button type="button" class="btn cn" onclick="CMX.close()">إغلاق</button></div>`}
/* ===== قائمة ترتيب القضايا (سحب وإفلات + أزرار أعلى/أسفل) — رقم القضية يتبع موضعها الجديد ===== */
const cLabel=(k,c)=>{const t=[c.t1,c.t2].map(x=>String(x||'').trim());if(t[0]&&t[1])return t[0]+' – '+t[1];if(t[0]||t[1])return t[0]||t[1];const r=String(c.report||'').replace(/<[^>]*>|&nbsp;/g,' ').replace(/\s+/g,' ').trim();return r?(CM[k].P?'':'تقرير: ')+r.slice(0,48)+(r.length>48?'…':''):(CM[k].P?'مباراة بدون عنوان':'تقرير القضية (فارغ)')};
function orderHtml(k,m,base){if(m.cases.length<2)return '';return `<section class="fs ord noprint"><h4>ترتيب القضايا</h4><p style="color:var(--mt);font-size:13px;margin:0 0 8px">اسحب القضية من المقبض ⠿ (أو استعمل الأسهم) لتغيير ترتيبها؛ يتغير رقمها تلقائيًا حسب موضعها الجديد ويبدأ الترقيم من ${p2(base+1)}. اضغط «حفظ» لاعتماد الترتيب في المحضر وPDF والطباعة.</p><ol class="rol" id="rol">${m.cases.map((c,j)=>`<li data-j="${j}"><span class="rgr" role="button" tabindex="0" aria-label="اسحب لإعادة الترتيب" title="اسحب لإعادة الترتيب">⠿</span><b class="rno">${p2(base+j+1)}</b><span class="rtx">${esc(cLabel(k,c))}</span><span class="rbt"><button type="button" class="btn" onclick="CMX.mv(${j},-1)" aria-label="أعلى"${j==0?' disabled':''}>▲</button><button type="button" class="btn" onclick="CMX.mv(${j},1)" aria-label="أسفل"${j==m.cases.length-1?' disabled':''}>▼</button></span></li>`).join('')}</ol></section>`}
function ordApply(order){edPull();const cs=ED.m.cases;if(order.length!=cs.length||order.every((v,i)=>v==i))return;ED.m.cases=order.map(j=>cs[j]);edDirty();go();toast('أُعيد ترقيم القضايا حسب الترتيب الجديد')}
X.mv=(j,d)=>{edPull();const n=ED.m.cases.length,t=j+d;if(t<0||t>=n)return;const o=[...Array(n).keys()];o.splice(j,1);o.splice(t,0,j);ordApply(o)};
(()=>{let drag=null;
/* السحب بالتحويل (transform) دون نقل عقد DOM أثناءه، فيعمل بثبات مع الماوس واللمس؛ يُحسب الموضع الجديد عند الإفلات. يخدم ثلاث قوائم: ترتيب القضايا (rol) وترتيب المحاضر (mol) وقائمة الأعضاء الحاضرين (meml) */
const clr=()=>{drag&&[...drag.L.children].forEach(o=>o.classList.remove('dtop','dbot'))};
function slot(y){const L=drag.L,li=drag.li,sibs=[...L.children];let idx=sibs.length;for(let q=0;q<sibs.length;q++){const r=sibs[q].getBoundingClientRect(),off=sibs[q]==li?(drag.dy||0):0;if(y<r.top-off+r.height/2){idx=q;break}}return idx}
const DROP={rol:o=>{if(ED)ordApply(o)},mol:o=>mReorder(page,o),meml:o=>memReorder(o)};
PGE.addEventListener('pointerdown',e=>{const g=e.target.closest&&e.target.closest('.rgr');if(!g||e.button>0)return;const L=g.closest('ol.rol');if(!L||!DROP[L.id]||(L.id=='rol'&&!ED))return;const li=g.closest('li');drag={L,li,pid:e.pointerId,y0:e.clientY};li.classList.add('drg');try{g.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()});
PGE.addEventListener('pointermove',e=>{if(!drag||e.pointerId!=drag.pid)return;drag.dy=e.clientY-drag.y0;drag.li.style.transform=`translateY(${drag.dy}px)`;clr();const i=slot(e.clientY),sibs=[...drag.L.children];if(i<sibs.length)sibs[i].classList.add('dtop');else sibs[sibs.length-1].classList.add('dbot');
if(e.clientY<70)scrollBy(0,-12);else if(e.clientY>innerHeight-70)scrollBy(0,12)});
const fin=(e,ok)=>{if(!drag||e.pointerId!=drag.pid)return;const L=drag.L,li=drag.li,n=L.isConnected?L.children.length:0;let t=ok&&L.isConnected?slot(e.clientY):-1;const from=+li.dataset.j,id=L.id;li.classList.remove('drg');li.style.transform='';clr();drag=null;if(t<0)return;
const o=[...Array(n).keys()];o.splice(from,1);if(t>from)t--;o.splice(t,0,from);DROP[id](o)};
PGE.addEventListener('pointerup',e=>fin(e,true));PGE.addEventListener('pointercancel',e=>fin(e,false));
PGE.addEventListener('keydown',e=>{const g=e.target.closest&&e.target.closest('.rgr');if(!g)return;const L=g.closest('ol.rol');if(!L||(L.id=='rol'&&!ED))return;if(e.key=='ArrowUp'||e.key=='ArrowDown'){e.preventDefault();const j=+g.closest('li').dataset.j,d=e.key=='ArrowUp'?-1:1;if(L.id=='rol')X.mv(j,d);else if(L.id=='mol')X.mMove(page,j,d);else X.mMv(j,d)}})})();
X.addMem=()=>{edPull();ED.m.members.push({n:'',r:''});edDirty();go();const e=PGE.querySelector(`[data-e="members.${ED.m.members.length-1}.n"]`);e&&e.focus()};
X.pickMem=()=>{edPull();const A=S.disc.lists.mem,has=new Set(ED.m.members.map(x=>ck(x.n)).filter(Boolean)),av=A.filter(x=>!has.has(ck(x.name)));openM('اختيار الأعضاء الحاضرين');
setM(av.length?`<p style="margin:0 0 8px;font-size:13px;color:var(--mt)">حدّد الأعضاء الحاضرين في هذه الجلسة:</p><div class="ll" style="max-height:50vh">${av.map(x=>`<label class="ck" style="padding:6px 4px"><input type="checkbox" style="width:auto" data-pm="${x.id}" checked> <span><b>${esc(x.name)}</b>${x.role?' — '+esc(x.role):''}</span></label>`).join('')}</div>`:'<p class="em">لا يوجد أعضاء متاحون: كل أعضاء القائمة مضافون مسبقًا إلى هذا المحضر، أو القائمة فارغة (أضفهم من تبويب «القوائم»).</p>',
[...(av.length?[{t:'إضافة المحدد',c:'pr',f:()=>{const ids=[...mEl.querySelectorAll('[data-pm]:checked')].map(e=>e.dataset.pm);const pk=av.filter(x=>ids.includes(x.id));closeM();if(!pk.length)return;edPull();const ms=ED.m.members.filter(x=>String(x.n||'').trim()||String(x.r||'').trim());pk.forEach(x=>ms.push({n:x.name,r:x.role||'',id:x.id}));ED.m.members=ms;edDirty();go()}}]:[]),{t:'إلغاء',f:closeM}])};
X.delMem=j=>{edPull();ED.m.members.splice(j,1);if(!ED.m.members.length)ED.m.members.push({n:'',r:''});edDirty();go()};
X.addCase=()=>{edPull();ED.m.cases.push(blankCase(ED.k));edDirty();go();const j=ED.m.cases.length-1,e=PGE.querySelector(`[data-e="cases.${j}.t1"]`);if(e){e.focus();(document.getElementById('cc'+j)||e).scrollIntoView({block:'start',behavior:'smooth'})}};
X.delCase=j=>{edPull();const k=ED.k,i=ED.mid?S[k].minutes.findIndex(x=>x.id==ED.mid):S[k].minutes.length,n=baseOf(k,i<0?S[k].minutes.length:i,ED.m)+j+1;ask(`حذف القضية رقم ${p2(n)}؟ سيُعاد ترقيم القضايا اللاحقة تلقائيًا.`,()=>{edPull();ED.m.cases.splice(j,1);edDirty();go()})};
X.addRow=j=>{edPull();const c=ED.m.cases[j];c.rows.push({lic:'',name:'',role:'',team:'',jd:'',rs:'',cd:'',ar:''});edDirty();go();const e=PGE.querySelector(`[data-e="cases.${j}.rows.${c.rows.length-1}.lic"]`);e&&e.focus()};
X.delRow=(j,q)=>{edPull();const c=ED.m.cases[j],r=c.rows[q];const del=()=>{edPull();c.rows.splice(q,1);edDirty();go()};if(r&&Object.values(r).some(v=>String(v||'').trim()))ask('حذف هذا السطر؟',del);else del()};

/* ===== الحفظ (مسودة / نهائي) ===== */
X.save=(final,quiet)=>{edPull();const k=ED.k,P=CM[k].P,m=cl(ED.m),er=[],M=S[k].minutes,i0=ED.mid?M.findIndex(x=>x.id==ED.mid):-1;
m.date=String(m.date||'').trim();{const sn=stN(m.start);if(sn)m.start=sn;else delete m.start}{const nn=stN(m.no);if(nn)m.no=nn;else delete m.no}const base=baseOf(k,i0<0?M.length:i0,m);{const lm=S.disc.lists.mem||[],om=i0>=0?(M[i0].members||[]):[];m.members=m.members.map(x=>{const n=String(x.n||'').trim().replace(/\s+/g,' '),o={n,r:String(x.r||'').trim()};/* يبقى الربط بقائمة الأعضاء إن لم يُغيَّر الاسم المكتوب */if(P&&x.id&&(lm.some(y=>y.id==x.id&&ck(y.name)==ck(n))||om.some(z=>z.id==x.id&&ck(z.n)==ck(n))))o.id=x.id;return o}).filter(x=>x.n||x.r)}
m.cases.forEach(c=>{['t1','t2','cat','date','time','stad'].forEach(f=>c[f]=String(c[f]||'').trim());c.report=rtEmpty(c.report)?'':cleanHtml(c.report);
if(P)c.rows=(c.rows||[]).map(r=>{const o={};PCOL.forEach(x=>o[x[0]]=String(r[x[0]]||'').trim());return o}).filter(r=>Object.values(r).some(Boolean));else delete c.rows});
if(final){if(!m.date)er.push('تاريخ الجلسة مطلوب');if(!m.cases.length)er.push('أضف قضية واحدة على الأقل');
m.cases.forEach((c,j)=>{const n='القضية '+p2(base+j+1)+': ';if(!c.t1||!c.t2)er.push(n+'أدخل الفريقين');else if(ck(c.t1)==ck(c.t2))er.push(n+'لا يمكن اختيار الفريق نفسه مرتين');if(!c.date)er.push(n+'أدخل تاريخ المقابلة');if(P?!(c.rows.length||c.report):!c.report)er.push(n+(P?'أضف شخصًا واحدًا على الأقل أو اكتب تقريرًا':'اكتب تقرير القضية'))});
if(er.length){openM('تعذّر الحفظ النهائي');setM(`<p>أكمل البيانات التالية ثم أعد المحاولة، أو احفظ كمسودة الآن:</p><ul style="padding-inline-start:20px;margin:0;line-height:1.9">${er.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`,[{t:'حفظ كمسودة',c:'pr',f:()=>{closeM();X.save(false)}},{t:'متابعة التعديل',f:closeM}]);return false}}
m.status=final?'final':'draft';m.at=new Date().toISOString();
if(i0>=0)M[i0]=m;else M.push(m);
if(P)learn(m);const old=ED.mid;ED.mid=m.id;if(!old)bkRm(k,null);bkRm(k,m.id);save();
ED.m=cl(m);if(!ED.m.members.length)ED.m.members.push({n:'',r:''});ED.dirty=false;
if(final){ED=null;VW[k]=m.id;go();scrollTo(0,0);if(!quiet)toast('تم الحفظ النهائي للمحضر')}else{if(!quiet){go();toast('تم حفظ المسودة — يمكنك إكمالها لاحقًا')}}
return true};

/* ===== القوائم المنسدلة الذكية (اختيار من القائمة أو كتابة حرة) ===== */
const fl=document.createElement('div');fl.id='fcl';fl.className='cbl fcl';fl.hidden=true;document.body.appendChild(fl);
let FE=null,FA=0,FV=[],FN=false;
/* مصدر اقتراحات الأشخاص في جدول المخالفات: أعضاء الفرق المسجلون (فريقا القضية أولًا) ثم قائمة اللاعبين والمسيرين، دون تكرار الرخصة. بيانات الفرق تُقرأ فقط ولا تختلط بقائمة الأعضاء الحاضرين */
function plPool(t){const L=S.disc.lists,tn=id=>(S.teams.find(y=>y.id==id)||{}).name||'',mm=/^cases\.(\d+)\./.exec(t.dataset.e||''),c=mm&&ED&&ED.m.cases[+mm[1]],want=new Set();
if(c)[c.t1,c.t2].forEach(n=>{const x=n&&S.teams.find(y=>ck(y.name)==ck(n));if(x)want.add(x.id)});
const rs=[...(S.tm||[])].sort((a,b)=>(want.has(b.team)?1:0)-(want.has(a.team)?1:0)||byAr(a.name,b.name)).map(x=>({lic:x.lic,name:x.name,role:x.role,team:tn(x.team)})),ls=new Set(rs.map(p=>ck(p.lic)).filter(Boolean));
return[...rs,...L.pl.filter(p=>!(p.lic&&ls.has(ck(p.lic))))]}
function fcItems(t){const k=t.dataset.fc,L=S.disc.lists;
if(k=='team')return S.teams.map(x=>x.name).filter(Boolean).sort(byAr).map(n=>({t:n}));
if(k=='cat')return S.cats.map(x=>({t:x.name}));
if(k=='stad')return S.stad.map(x=>({t:x.name,s:x.loc||''}));
if(k=='role'){const s=new Set(ROLES0);L.pl.forEach(p=>p.role&&s.add(p.role));CMK.forEach(c=>S[c].minutes.forEach(m=>m.members.forEach(y=>y.r&&s.add(y.r))));return[...s].map(n=>({t:n}))}
if(k=='pl'||k=='plc'){const ps=plPool(t);return k=='pl'?ps.map(p=>({t:p.name,s:[p.lic,p.role,p.team].filter(Boolean).join(' · '),p})):ps.filter(p=>p.lic).map(p=>({t:p.lic,s:[p.name,p.role,p.team].filter(Boolean).join(' · '),p}))}
if(k=='mem'){const mp=new Map(),dm=ED&&ED.k=='disc';if(dm)L.mem.forEach(y=>mp.set(ck(y.name),{n:y.name,r:y.role||'',id:y.id}));CMK.forEach(c=>S[c].minutes.forEach(m=>m.members.forEach(y=>{if(y.n&&!mp.has(ck(y.n)))mp.set(ck(y.n),y)})));return[...mp.values()].map(y=>({t:y.n,s:y.r||'',r:y.r||'',id:y.id}))}
return L[k]?L[k].map(x=>({t:x.v})):[]}
function fcPlace(t){if(!t||!t.isConnected){fl.hidden=true;return}const r=t.getBoundingClientRect(),vh=innerHeight,w=Math.max(r.width,230),below=vh-r.bottom-12,above=r.top-12,up=below<200&&above>below;
fl.style.position='fixed';fl.style.insetInline='auto';fl.style.width=w+'px';fl.style.left=Math.max(6,Math.min(r.left,innerWidth-w-6))+'px';fl.style.maxHeight=Math.max(120,Math.min(260,up?above:below))+'px';
if(up){fl.style.top='auto';fl.style.bottom=(vh-r.top+4)+'px'}else{fl.style.bottom='auto';fl.style.top=(r.bottom+4)+'px'}}
function fcShow(t,all){FE=t;const tk=all?[]:ck(t.value).split(' ').filter(Boolean);FV=fcItems(t).filter(x=>!tk.length||tk.every(w=>ck(x.t+' '+(x.s||'')).includes(w))).slice(0,40);FN=false;
if(!FV.length){fl.hidden=true;return}FA=0;fl.innerHTML=FV.map((x,i)=>`<div class="cbo${i?'':' a'}" data-i="${i}"><b>${esc(x.t)}</b>${x.s?`<small>${esc(x.s)}</small>`:''}</div>`).join('');fl.hidden=false;fcPlace(t)}
function fcPick(i){const x=FV[i],t=FE;if(!x||!t)return;const p=t.dataset.e;setF(p,x.t);
if((t.dataset.fc=='pl'||t.dataset.fc=='plc')&&x.p){const b=p.replace(/\.(name|lic)$/,'');setF(b+'.name',x.p.name||'');setF(b+'.lic',x.p.lic||'');setF(b+'.role',x.p.role||'');setF(b+'.team',x.p.team||'')}
else if(t.dataset.fc=='mem'){const b=p.replace(/\.n$/,'');if(x.id)edSet(b+'.id',x.id);else try{edSet(b+'.id',undefined)}catch(_){}if(x.r&&!edGet(b+'.r'))setF(b+'.r',x.r)}
fl.hidden=true}
fl.onmousedown=e=>e.preventDefault();fl.onclick=e=>{const o=e.target.closest('.cbo');if(o)fcPick(+o.dataset.i)};
addEventListener('scroll',()=>{if(!fl.hidden)fcPlace(FE)},true);addEventListener('resize',()=>{if(!fl.hidden)fcPlace(FE)});

/* ===== مستمعات المحرر (تفويض أحداث على #pg) ===== */
const onEdit=e=>{const t=e.target;if(!ED||!t.dataset||!t.dataset.e)return;edSet(t.dataset.e,t.classList.contains('rte')?t.innerHTML:t.value);if(t.classList.contains('ag'))autoH(t);const was=ED.dirty;edDirty();if(!was)markDirty();if(t.dataset.fc)fcShow(t);if(e.type=='change'&&(t.dataset.e=='start'||t.dataset.e=='no')){edPull();go()}};
function markDirty(){const h=PGE.querySelector('.edh');if(h&&!h.querySelector('.wn'))h.insertAdjacentHTML('beforeend','<span class="wn w" style="margin:0">● تعديلات غير محفوظة</span>')}
PGE.addEventListener('input',onEdit);PGE.addEventListener('change',onEdit);
PGE.addEventListener('focusin',e=>{const t=e.target;if(ED&&t.dataset&&t.dataset.fc)fcShow(t,true)});
PGE.addEventListener('focusout',e=>{if(e.target.dataset&&e.target.dataset.fc)setTimeout(()=>{if(document.activeElement!==FE)fl.hidden=true},120)});
PGE.addEventListener('keydown',e=>{const t=e.target;if(!t.dataset||!t.dataset.fc||fl.hidden)return;
if(e.key=='ArrowDown'||e.key=='ArrowUp'){e.preventDefault();FN=true;FA=(FA+(e.key=='ArrowDown'?1:-1)+FV.length)%FV.length;fl.querySelectorAll('.cbo').forEach((el,i)=>el.classList.toggle('a',i==FA));const a=fl.querySelector('.a');a&&a.scrollIntoView({block:'nearest'})}
else if(e.key=='Enter'&&FN){e.preventDefault();fcPick(FA)}else if(e.key=='Escape'){e.stopPropagation();fl.hidden=true}else if(e.key=='Tab')fl.hidden=true});
PGE.addEventListener('paste',e=>{const t=e.target.closest&&e.target.closest('.rte');if(!t)return;e.preventDefault();const d=e.clipboardData,h=d.getData('text/html');document.execCommand('insertHTML',false,h?cleanHtml(h):esc(d.getData('text/plain')).replace(/\r?\n/g,'<br>'))});
document.addEventListener('selectionchange',()=>{const s=getSelection();if(!s.rangeCount)return;const r=s.getRangeAt(0),n=r.commonAncestorContainer,el=n.nodeType==1?n:n.parentElement;if(el&&el.closest&&el.closest('.rte'))RS=r.cloneRange()});
new MutationObserver(()=>{PGE.querySelectorAll('textarea.ag').forEach(autoH)}).observe(PGE,{childList:true});

/* ===== أوامر التنسيق ===== */
function rrun(el,fn){const w=el.closest('.rtw2'),ed=w&&w.querySelector('.rte');if(!ed)return;ed.focus();if(RS&&ed.contains(RS.commonAncestorContainer)){const s=getSelection();s.removeAllRanges();s.addRange(RS)}fn(ed);ed.dispatchEvent(new Event('input',{bubbles:true}))}
X.rc=(b,c)=>rrun(b,()=>{document.execCommand('styleWithCSS',false,true);document.execCommand(c,false,null)});
X.rf=s=>{if(!s.value)return;const v=s.value;rrun(s,()=>{document.execCommand('styleWithCSS',false,true);document.execCommand('fontName',false,v)});s.value=''};
X.rcol=(i,c)=>rrun(i,()=>{document.execCommand('styleWithCSS',false,true);document.execCommand(c,false,i.value)});
X.rs=s=>{const px=+s.value;if(!px)return;rrun(s,ed=>{const sel=getSelection();if(!sel.rangeCount||sel.isCollapsed){toast('حدّد النص أولًا لتغيير حجم الخط');return}document.execCommand('styleWithCSS',false,false);document.execCommand('fontSize',false,'7');
const ns=[];ed.querySelectorAll('font[size="7"]').forEach(f=>{const sp=document.createElement('span');sp.style.fontSize=px+'px';sp.innerHTML=f.innerHTML;sp.querySelectorAll('[style*="font-size"]').forEach(x=>x.style.fontSize='');f.replaceWith(sp);ns.push(sp)});if(ns.length){const r=document.createRange();r.setStartBefore(ns[0]);r.setEndAfter(ns[ns.length-1]);sel.removeAllRanges();sel.addRange(r);RS=r.cloneRange()}});s.value=''};

/* ===== الطباعة ===== */
X.print=(k,id)=>{if(ED){toast('احفظ المحضر أو أغلق المحرر قبل الطباعة');return}VW[k]=id;page=k;go();setTimeout(X.printNow,250)};
X.printNow=()=>{const s=document.createElement('style');s.id='mpg';s.textContent='@page{size:A4 portrait;margin:0}';document.head.appendChild(s);const ct=[...document.querySelectorAll('.mpv .ct')];ct.forEach(e=>{e.style.fontSize='12px';const sp=e.querySelector('span');if(sp&&sp.offsetWidth>650)e.style.fontSize=(12*650/sp.offsetWidth)+'px'});const done=()=>{s.remove();ct.forEach(e=>e.style.fontSize='');removeEventListener('afterprint',done)};addEventListener('afterprint',done);window.print()};

/* يصغّر خط خلية رقم الرخصة وحدها إن لم تتسع الرموز في سطر واحد (حماية للأحرف العريضة جدًا) */
const fitLic=root=>root.querySelectorAll('td.lic').forEach(td=>{const b=td.firstElementChild;if(!b)return;const cs=getComputedStyle(td),av=td.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),w=b.getBoundingClientRect().width;if(av>0&&w>av)td.style.fontSize=(parseFloat(cs.fontSize)*av/w*.97)+'px'});
/* ===== تصدير PDF (A4 عمودي): صفحات متعددة دون قص أي صف أو قضية قدر الإمكان ===== */
X.pdf=async(k,id)=>{let host,rtlOff=()=>{};try{if(ED&&ED.k==k&&ED.mid==id&&ED.dirty){toast('احفظ التعديلات أولًا ثم صدّر الملف');return}
if(!window.jspdf||!window.html2canvas)return toast('تعذر تحميل مكتبة PDF، تحقق من الاتصال');const m=mById(k,id);if(!m)return;if(window.pdfRtl)rtlOff=pdfRtl.on();/* رسم النص العربي باتجاه RTL على لوحات التصدير (الأقواس والفواصل) */
toast('جارٍ إنشاء الملف…');await document.fonts.ready;await Promise.all(FONTS.map(f=>document.fonts.load('700 16px "'+f+'"').catch(()=>0)));
const i=mIdx(k,id),base=baseOf(k,i),P=CM[k].P,W=760,PW=210,PH=297,MX=10,MT=14,MB=15,kk=(PW-2*MX)/W;
host=document.createElement('div');host.className='pv pdfx';const TH=thOf(k);host.style.cssText=`position:absolute;left:-20000px;top:0;width:${W}px;padding:0;border:0;background:transparent;color:#111;${thVars(TH)}`;document.body.appendChild(host);
const R=async html=>{host.innerHTML=html;fitLic(host);if(window.pdfRtl)pdfRtl.scan(host);const n=host.firstElementChild,c=await html2canvas(n,{scale:2,backgroundColor:null});return{c,h:c.height/2*kk}};
const F=await(async()=>{host.innerHTML=pfoot();if(window.pdfRtl)pdfRtl.scan(host);const n=host.firstElementChild;if(!n||!host.textContent.trim())return{c:null,h:0};const sp=n.querySelector('span');if(sp&&sp.offsetWidth>W-10)n.style.fontSize=(12*(W-10)/sp.offsetWidth)+'px';const c=await html2canvas(n,{scale:2,backgroundColor:null});return{c,h:c.height/2*kk}})();
const Hf=await R(`<div class="mhdw">${hdrH(k)}${infoH(k,m,i)}</div>`),Hs=await R(`<div class="mhdw">${memH(k,m)}${stH}</div>`),Hm=await R(miniH(k,m,i)),bg=mBg(TH);
const pdf=new jspdf.jsPDF({orientation:'p',unit:'mm',format:'a4'}),maxY=PH-MB-F.h-3;let y=0,ys=0;
const img=(u,yy)=>pdf.addImage(u.c.toDataURL('image/png'),'PNG',MX,yy,PW-2*MX,u.h);
const first=()=>{pdf.addImage(bg,'JPEG',0,0,PW,PH);img(Hf,MT);y=ys=MT+Hf.h+2};
const next=()=>{pdf.addPage();pdf.addImage(bg,'JPEG',0,0,PW,PH);img(Hm,MT);y=ys=MT+Hm.h+3};
const room=(h,keep)=>y+h+(keep||0)<=maxY||y<=ys+.5;
const slice=async u=>{const mm=u.h/u.c.height;let off=0;while(off<u.c.height){let av=maxY-y;if(av<15){next();av=maxY-y}const ph=Math.min(u.c.height-off,Math.floor(av/mm));if(ph<=0){next();continue}const c2=document.createElement('canvas');c2.width=u.c.width;c2.height=ph;const g=c2.getContext('2d');g.drawImage(u.c,0,off,u.c.width,ph,0,0,u.c.width,ph);pdf.addImage(c2.toDataURL('image/png'),'PNG',MX,y,PW-2*MX,ph*mm);y+=ph*mm;off+=ph;if(off<u.c.height)next()}};
const put=async(u,keep)=>{if(!room(u.h,keep))next();if(u.h>maxY-ys+.01)await slice(u);else{img(u,y);y+=u.h}};
first();await put(Hs,40);
for(let j=0;j<m.cases.length;j++){const c=m.cases[j],hd=await R(caseHead(c,base+j+1));
let th=null,rws=[];if(P&&c.rows&&c.rows.length){th=await R(pHead());const hasR=!rtEmpty(c.report);for(let q=0;q<c.rows.length;q++)rws.push(await R(`<table class="mx mp rw${q==c.rows.length-1&&!hasR?' ls':''}">${mCols}<tbody><tr>${pCells(c.rows[q])}</tr></tbody></table>`))}
await put(hd,th?Math.min(th.h+rws[0].h,60):0);
if(th){await put(th,rws[0].h);for(const r of rws){if(!room(r.h)){next();await put(th)}await put(r)}}
if(!rtEmpty(c.report)){const tmp=document.createElement('div');tmp.innerHTML=cleanHtml(c.report);const nodes=[];[...tmp.childNodes].forEach(n=>{if(n.nodeType==1&&(n.tagName=='UL'||n.tagName=='OL')){[...n.children].forEach((li,x)=>nodes.push({h:`<div class="mli"><span class="mk">${n.tagName=='OL'?(x+1)+'.':'•'}</span><div>${li.innerHTML}</div></div>`}))}else if(n.nodeType==1)nodes.push({h:n.outerHTML});else if(n.nodeType==3&&n.nodeValue.trim())nodes.push({h:`<div>${esc(n.nodeValue)}</div>`})});
const us=[];for(let q=0;q<nodes.length;q++){const h=nodes[q].h;us.push(await R(`<div class="mrp u${q==0?' f':''}${q==nodes.length-1?' l':''}${q==0&&th?' j':''}">${h}</div>`))}
pdf.setDrawColor(51,51,51);pdf.setLineWidth(.26);
for(let q=0;q<us.length;q++){const u=us[q];if(q>0&&!room(u.h)){pdf.line(MX,y,PW-MX,y);next();pdf.line(MX,y,PW-MX,y)}await put(u,q==0?Math.min(us[1]?us[1].h:0,40):0)}}
y+=4}
const np=pdf.getNumberOfPages();if(F.c)for(let p=1;p<=np;p++){pdf.setPage(p);pdf.addImage(F.c.toDataURL('image/png'),'PNG',MX,PH-MB-F.h,PW-2*MX,F.h)}
host.remove();host=null;
const a=document.createElement('a'),u=URL.createObjectURL(pdf.output('blob'));a.href=u;a.download=`محضر-${p2(noOf(k,i))}-${CM[k].n.replace(/\s+/g,'-')}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);toast('تم حفظ الملف')}
catch(e){console.error(e);toast('تعذر إنشاء الملف')}finally{rtlOff();host&&host.remove()}};
})();
