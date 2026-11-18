/* ===== ترتيب التقارير وتصدير PDF (سحب وإفلات) — وحدة مستقلة: window.RPO =====
   - تغيّر ترتيب العرض داخل التقارير فقط (المعاينة، PDF البسيط، المعاينة المتقدمة، الطباعة).
   - لا تعدّل S.matches ولا التعيينات ولا الأصناف ولا المجموعات؛ تُحفظ الإعدادات في S.set.rpo فقط.
   - لكل نوع تقرير ترتيبه المستقل: p = برنامج بدون الحكام، r = برنامج مع تعيينات الحكام.
   - بنية الإعداد لكل نوع: {tm:'auto'|'manual', tabs:[مفاتيح الجداول], cats:[معرّفات الأصناف], grps:{صنف:[معرّفات المجموعات]},
       inner:'date'|'time'|'stad'|'manual' (الافتراضي العام), inn:{مفتاح الجدول:وضع}, man:{مفتاح الجدول:[معرّفات المقابلات]}}
   - مفتاح الجدول = الجولة|الصنف|المجموعة (نفس تجميع الجداول الحالي).
   تعتمد على: S, nm, gn, fd, esc, save, go, toast, ask (كلها موجودة في الواجهة). */
(function(){
const R=window.RPO={};
const kind=wr=>wr?'r':'p';
const INN={date:'حسب تاريخ المقابلة',time:'حسب توقيت المقابلة',stad:'حسب الملعب',manual:'يدوي (سحب وإفلات)'};
const key=m=>m.round+'|'+m.cat+'|'+m.grp;
const bl=(a,b)=>String(a).localeCompare(String(b));

/* ----- قراءة / كتابة الإعداد ----- */
function cfg(wr){const x=(S.set&&S.set.rpo&&S.set.rpo[kind(wr)])||{},o=v=>v&&typeof v=='object'&&!Array.isArray(v)?v:{};
return{tm:x.tm=='manual'?'manual':'auto',tabs:Array.isArray(x.tabs)?x.tabs:[],cats:Array.isArray(x.cats)?x.cats:[],grps:o(x.grps),inner:INN[x.inner]?x.inner:'date',inn:o(x.inn),man:o(x.man)}}
function mut(wr){S.set=S.set||{};if(!S.set.rpo||typeof S.set.rpo!='object')S.set.rpo={v:1};return S.set.rpo[kind(wr)]=cfg(wr)}

/* ----- الترتيب الفعلي ----- */
const catIdx=(c,id)=>{const i=c.cats.indexOf(id);return i>=0?i:c.cats.length+S.cats.findIndex(x=>x.id==id)};
function grpCmp(c,cat,a,b){const A=c.grps[cat]||[],ia=A.indexOf(a),ib=A.indexOf(b);if(ia>=0&&ib>=0)return ia-ib;if(ia>=0)return -1;if(ib>=0)return 1;return bl(gn(cat,a),gn(cat,b))}
const dt=(x,y)=>bl(x.date,y.date)||bl(x.time,y.time);
function innerSort(b,c){const mode=INN[c.inn[b.key]]?c.inn[b.key]:c.inner,sn=m=>nm('stad',m.stad);
const f=mode=='time'?(x,y)=>bl(x.time,y.time)||bl(x.date,y.date):mode=='stad'?(x,y)=>bl(sn(x),sn(y))||dt(x,y):dt,a=[...b.ms].sort(f);
if(mode=='manual'){const o=c.man[b.key]||[],ix=m=>{const i=o.indexOf(m.id);return i<0?1e9:i};return a.map((m,n)=>[m,n]).sort((x,y)=>ix(x[0])-ix(y[0])||x[1]-y[1]).map(x=>x[0])}
return a}
/* يُرجع الجداول مرتبة: [{key,round,cat,grp,ms:[مقابلات مرتبة]}] — القائمة الأصلية لا تُعدَّل */
R.blocks=function(list,wr){const c=cfg(wr),mp=new Map();
list.forEach(m=>{const k=key(m);if(!mp.has(k))mp.set(k,{key:k,round:m.round,cat:m.cat,grp:m.grp,ms:[]});mp.get(k).ms.push(m)});
const ri=id=>S.rounds.findIndex(x=>x.id==id);
let a=[...mp.values()].sort((x,y)=>ri(x.round)-ri(y.round)||catIdx(c,x.cat)-catIdx(c,y.cat)||(x.cat==y.cat?grpCmp(c,x.cat,x.grp,y.grp):0));
if(c.tm=='manual'&&c.tabs.length){const ix=k=>{const i=c.tabs.indexOf(k);return i<0?1e9:i};a=a.map((b,n)=>[b,n]).sort((x,y)=>ix(x[0].key)-ix(y[0].key)||x[1]-y[1]).map(x=>x[0])}
a.forEach(b=>b.ms=innerSort(b,c));return a};
R.order=(list,wr)=>[].concat(...R.blocks(list,wr).map(b=>b.ms));

/* ----- التعديل (كلها تحفظ في S.set.rpo فقط) ----- */
const done=(el,ns)=>{if(!ns)save();const x=el&&el.closest&&el.closest('.rpx');if(x&&window.RPX&&RPX.refresh)RPX.refresh();else{const y=scrollY;go();scrollTo(0,y)}};
function apply(name,ids,ds,wr,el){const c=mut(wr);
if(name=='tabs'){c.tabs=ids;c.tm='manual'}
else if(name=='cats'){if(c.tm=='manual')toast('عُدّل ترتيب الأصناف: الترتيب التلقائي للجداول مفعّل الآن');c.cats=ids;c.tm='auto'}
else if(name=='grps'){if(c.tm=='manual')toast('عُدّل ترتيب المجموعات: الترتيب التلقائي للجداول مفعّل الآن');c.grps[ds.cat]=ids;c.tm='auto'}
else if(name=='man'){c.man[ds.k]=ids;c.inn[ds.k]='manual'}
done(el)}

/* ----- الواجهة ----- */
const op={main:false,tabs:true,cats:false,grps:false,inn:false},SEL={};
const lbl=b=>`${esc(nm('rounds',b.round))} | ${esc(nm('cats',b.cat))} | ${esc(gn(b.cat,b.grp))}`;
const li=(id,txt,sub,cls)=>`<li data-id="${esc(id)}"${cls?` class="${cls}"`:''}><span class="rgr" title="اسحب لتغيير الترتيب" role="img" aria-label="مقبض السحب">☰</span><span class="rtx">${txt}</span>${sub?`<small class="rsb">${sub}</small>`:''}<span class="rbt"><button type="button" class="btn" data-a="up" aria-label="نقل للأعلى" title="للأعلى">▲</button><button type="button" class="btn" data-a="dn" aria-label="نقل للأسفل" title="للأسفل">▼</button></span></li>`;
const sec=(id,t,body)=>`<details data-rsec="${id}"${op[id]?' open':''}><summary>${t}</summary>${body}</details>`;
const modeOpts=(v,def)=>(def?`<option value="">${def}</option>`:'')+Object.keys(INN).map(k=>`<option value="${k}"${k==v?' selected':''}>${INN[k]}</option>`).join('');
/* wr: مع الحكام؟ — scope: قائمة المقابلات الظاهرة حاليًا في المعاينة (لتمييز الجداول خارج النطاق) */
R.panel=function(wr,scope){wr=!!wr;const c=cfg(wr),all=R.blocks(S.matches,wr),inS=new Set((scope||S.matches).map(key));
if(!all.length)return '';
const tabs=all.map(b=>li(b.key,lbl(b),`${b.ms.length} مقابلة${inS.has(b.key)?'':' — خارج نطاق المعاينة'}`,inS.has(b.key)?'':'off')).join('');
const cats=[...new Set(S.matches.map(m=>m.cat))].sort((a,b)=>catIdx(c,a)-catIdx(c,b));
const catL=cats.map(id=>li(id,esc(nm('cats',id)))).join('');
const grpL=cats.map(id=>{const gs=[...new Set(S.matches.filter(m=>m.cat==id).map(m=>m.grp))].sort((a,b)=>grpCmp(c,id,a,b));
return gs.length<2?'':`<div class="rpo-h">${esc(nm('cats',id))}</div><ol class="rpo-l" data-l="grps" data-cat="${esc(id)}">${gs.map(g=>li(g,esc(gn(id,g)))).join('')}</ol>`}).join('')||'<p class="rpo-n">لا توجد أصناف مقسّمة إلى أكثر من مجموعة.</p>';
const sk=all.some(b=>b.key==SEL[kind(wr)])?SEL[kind(wr)]:all[0].key,sb=all.find(b=>b.key==sk),mode=INN[c.inn[sk]]?c.inn[sk]:'';
const eff=mode||c.inner,mans=eff=='manual'?`<ol class="rpo-l" data-l="man" data-k="${esc(sk)}">${sb.ms.map(m=>li(m.id,`${esc(nm('teams',m.t1))} × ${esc(nm('teams',m.t2))}`,`${esc(fd(m.date))} — ${esc(m.time)} — ${esc(nm('stad',m.stad))}`)).join('')}</ol>`:'';
const inn=`<label>الترتيب الافتراضي للمقابلات داخل كل جدول<select data-a="inner">${modeOpts(c.inner)}</select></label>
<label>اختر جدولًا لتخصيص ترتيب مقابلاته<select data-a="sel">${all.map(b=>`<option value="${esc(b.key)}"${b.key==sk?' selected':''}>${lbl(b)}</option>`).join('')}</select></label>
<label>ترتيب مقابلات هذا الجدول<select data-a="inn">${modeOpts(mode,'حسب الإعداد الافتراضي')}</select></label>${mans}`;
return `<details class="rpo" data-wr="${wr?1:0}" data-rsec="main"${op.main?' open':''}><summary>⇅ ترتيب التقرير بالسحب والإفلات — ${wr?'مع تعيينات الحكام':'بدون الحكام'}</summary>
<p class="rpo-n">يغيّر هذا الترتيب شكل التقرير فقط (المعاينة وPDF والطباعة)، ولا يمس برمجة المقابلات ولا تعيينات الحكام. لكل نوع تقرير ترتيبه المستقل. اسحب المقبض ☰ أو استعمل الأسهم ▲▼ (مناسبة للهاتف).</p>
${sec('tabs',`الجداول (${all.length})`,`<label>طريقة ترتيب الجداول<select data-a="tm"><option value="auto"${c.tm=='auto'?' selected':''}>تلقائي (حسب ترتيب الأصناف والمجموعات)</option><option value="manual"${c.tm=='manual'?' selected':''}>يدوي (حسب القائمة أدناه)</option></select></label><ol class="rpo-l" data-l="tabs">${tabs}</ol>`)}
${sec('cats','ترتيب الأصناف',`<p class="rpo-n">يُطبَّق عند الترتيب التلقائي للجداول.</p><ol class="rpo-l" data-l="cats">${catL}</ol>`)}
${sec('grps','ترتيب المجموعات داخل كل صنف',`<p class="rpo-n">يُطبَّق عند الترتيب التلقائي للجداول.</p>${grpL}`)}
${sec('inn','ترتيب المقابلات داخل الجداول',inn)}
<div class="rpo-b"><button type="button" class="btn dg" data-a="reset">إعادة الترتيب الافتراضي</button></div></details>`};

/* ----- الأحداث (مفوّضة على المستند: تعمل في صفحة التقارير وفي نافذة المعاينة المتقدمة) ----- */
const root=e=>e.target.closest&&e.target.closest('.rpo'),WR=r=>r.dataset.wr=='1';
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.dataset&&d.dataset.rsec)op[d.dataset.rsec]=d.open},true);
document.addEventListener('change',e=>{const r=root(e),a=e.target.dataset&&e.target.dataset.a;if(!r||!a)return;const wr=WR(r),v=e.target.value;
if(a=='sel'){SEL[kind(wr)]=v;return done(e.target,1)}
const c=mut(wr);
if(a=='tm')c.tm=v=='manual'?'manual':'auto';else if(a=='inner')c.inner=INN[v]?v:'date';
else if(a=='inn'){const k=SEL[kind(wr)]||(R.blocks(S.matches,wr)[0]||{}).key;if(!k)return;if(INN[v])c.inn[k]=v;else delete c.inn[k]}
else return;
done(e.target)});
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.rpo button[data-a]');if(!b)return;const r=root(e),wr=WR(r),a=b.dataset.a;
if(a=='reset'){const f=()=>{if(S.set.rpo)delete S.set.rpo[kind(wr)];done(r)},m='إعادة ترتيب هذا التقرير إلى الوضع الافتراضي؟ لن تتأثر البرمجة ولا التعيينات.';typeof ask=='function'?ask(m,f):(confirm(m)&&f());return}
if(a=='up'||a=='dn'){const it=b.closest('li'),L=it&&it.parentNode;if(!L||!L.classList.contains('rpo-l'))return;const ids=[...L.children].map(x=>x.dataset.id),i=ids.indexOf(it.dataset.id),j=a=='up'?i-1:i+1;if(j<0||j>=ids.length)return;
ids.splice(i,1);ids.splice(j,0,it.dataset.id);apply(L.dataset.l,ids,L.dataset,wr,L)}});

/* سحب وإفلات بمؤشرات (Pointer Events): يعمل بالماوس واللمس والقلم؛ الموضع يُحسب عند الإفلات دون نقل عقد DOM أثناء السحب */
let D=null;
const clr=()=>D&&[...D.L.children].forEach(o=>o.classList.remove('dtop','dbot'));
function slot(y){const s=[...D.L.children];for(let q=0;q<s.length;q++){const r=s[q].getBoundingClientRect(),off=s[q]==D.li?(D.dy||0):0;if(y<r.top-off+r.height/2)return q}return s.length}
function scrollP(el){for(let n=el.parentElement;n;n=n.parentElement){const o=getComputedStyle(n).overflowY;if((o=='auto'||o=='scroll')&&n.scrollHeight>n.clientHeight+2)return n}return null}
document.addEventListener('pointerdown',e=>{const g=e.target.closest&&e.target.closest('.rpo .rgr');if(!g||e.button>0)return;const it=g.closest('li'),L=it&&it.parentNode;if(!L||!L.classList.contains('rpo-l'))return;
D={L,li:it,pid:e.pointerId,y0:e.clientY,dy:0,sc:scrollP(L),r:L.closest('.rpo')};it.classList.add('drg');try{g.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()});
document.addEventListener('pointermove',e=>{if(!D||e.pointerId!=D.pid)return;D.dy=e.clientY-D.y0;D.li.style.transform=`translateY(${D.dy}px)`;clr();
const i=slot(e.clientY),s=[...D.L.children];if(i<s.length)s[i].classList.add('dtop');else s[s.length-1].classList.add('dbot');
if(D.sc){const r=D.sc.getBoundingClientRect();if(e.clientY<r.top+50)D.sc.scrollTop-=12;else if(e.clientY>r.bottom-50)D.sc.scrollTop+=12}
else if(e.clientY<70)scrollBy(0,-12);else if(e.clientY>innerHeight-70)scrollBy(0,12)});
function fin(e,ok){if(!D||e.pointerId!=D.pid)return;const d=D,t0=ok&&d.L.isConnected?slot(e.clientY):-1;D=null;/* الموضع يُحسب قبل إزالة الإزاحة */
d.li.classList.remove('drg');d.li.style.transform='';[...d.L.children].forEach(o=>o.classList.remove('dtop','dbot'));if(t0<0)return;
const ids=[...d.L.children].map(x=>x.dataset.id),from=ids.indexOf(d.li.dataset.id);let t=t0;
ids.splice(from,1);if(t>from)t--;if(t==from)return;ids.splice(t,0,d.li.dataset.id);apply(d.L.dataset.l,ids,d.L.dataset,WR(d.r),d.L)}
document.addEventListener('pointerup',e=>fin(e,true));document.addEventListener('pointercancel',e=>fin(e,false));
})();
