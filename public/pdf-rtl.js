/* ===== إصلاح اتجاه الأقواس والفواصل العربية في ملفات PDF (window.pdfRtl) =====
   السبب الجذري: html2canvas (1.4.1) لا يرسم الفقرة كاملة، بل يقسّم كل عقدة نصية إلى وحدات (كلمة + مسافة) ويرسم كل وحدة وحدها
   بـ ctx.fillText على لوحة canvas مفصولة عن الصفحة. الرموز المحايدة (الأقواس، الفواصل، النقطتان…) لا اتجاه لها بذاتها؛ يتحدد موضعها
   وشكلها (القوس المعكوس) من اتجاه الرسم فقط. فإذا رُسمت «(» وحدها باتجاه LTR بينما سياقها RTL ظهرت جهتها معكوسة، فيصير (10) إلى )10(.
   وتحدث الوحدة المنفردة حين يفصل الترميز القوس عن محتواه في عقد نصية مستقلة، مثل  (<span>10</span>)  أو  (<b>10</b>)  أو ما تنتجه bdi().
   المحاولة السابقة كانت تخمّن اتجاه كل وحدة من «قاموس كلمات» عام (النص نفسه ← اتجاهه)، فيتعارض الرمز «(» نفسه بين سياق RTL وسياق LTR في
   الصفحة الواحدة، ويسقط القرار إلى LTR فيعود الانعكاس.

   الحل (أثناء التصدير فقط، ولا يلمس الصفحة ولا البيانات): الاتجاه الصحيح معروف بدقة من DOM لكل عنصر نصي (direction المحسوب، وdir=rtl|ltr،
   و<bdi>/dir=auto بأول حرف قوي). عند التقاط html2canvas تُنسخ الصفحة إلى iframe ويُستدعى onclone؛ هناك نضيف إلى font-family كل عنصر نصي
   اسم خط وهميًا (bidirtlx / bidiltrx) يحمل اتجاهه. الاسم الوهمي لا يوجد فيُتجاهل ويُستعمل الخط الأصلي نفسه (لا يتغير الشكل ولا القياسات)،
   لكنه يظهر في ctx.font لحظة الرسم، فيضبط الخطّاف ctx.direction بدقة لكل وحدة، مهما قسّمها html2canvas.
   وللنصوص التي لا وسم عليها (احتياطًا) يُستعمل القاموس القديم، مع عدم فرض أي اتجاه عند التعارض.
   الاستعمال (كما هو):  const off=pdfRtl.on(); try{ pdfRtl.scan(host); ...html2canvas(...)... } finally{ off() }
   on() يغلّف window.html2canvas مؤقتًا ليضيف خطوة الوسم تلقائيًا إلى كل التقاط (ويُبقي onclone الخاص بالمستدعي)، وoff() يستعيد كل شيء. */
(function(){
const AR=/[֐-ࣿיִ-﷿ﹰ-﻿]/,STRONG=/[A-Za-zÀ-ɏ֐-ࣿיִ-﷿ﹰ-﻿]/;
const TAG={rtl:'bidirtlx',ltr:'bidiltrx'},TAGRX=/(?:^|[\s,"'])bidi(rtl|ltr)x(?:$|[\s,"'])/;
let depth=0,orig=null,origH2C=null,wrapH2C=null,reg=new Map();

/* اتجاه العنصر الحاوي لنص: أقرب <bdi>/dir=auto (أول حرف قوي)، ثم dir الصريح، وإلا direction المحسوب (يعكس dir وCSS معًا) */
function dirOfEl(p,root,gcs){
  for(let el=p;el;el=el.parentElement){
    const d=(el.getAttribute&&el.getAttribute('dir')||'').toLowerCase();
    if(el.tagName==='BDI'||d==='auto'){const s=el.textContent,i=s.search(STRONG);return i<0?'ltr':AR.test(s[i])?'rtl':'ltr'}
    if(d==='rtl'||d==='ltr')return d;
    if(el===root)break;
  }
  return gcs(p).direction==='rtl'?'rtl':'ltr';
}

/* وسم اتجاه كل عنصر يحتوي نصًا مباشرًا (يُستدعى على النسخة المستنسخة فقط) */
function tag(doc,root){
  try{
    if(!doc||!root)return;
    const win=doc.defaultView||window,gcs=e=>win.getComputedStyle(e),seen=new Map();
    const note=p=>{
      if(!p||seen.has(p)||!p.style)return;
      seen.set(p,{d:dirOfEl(p,root,gcs),f:gcs(p).fontFamily});
    };
    const w=doc.createTreeWalker(root,4/* NodeFilter.SHOW_TEXT */);let n;
    while((n=w.nextNode())){if(n.nodeValue&&n.nodeValue.trim())note(n.parentElement)}
    root.querySelectorAll('input,textarea').forEach(note);
    /* القراءة كلها أولًا ثم الكتابة، حتى لا يلوّث وسمُ عنصرٍ الخطَّ المحسوب لأبنائه */
    seen.forEach((v,p)=>{const fam=(v.f||'').replace(/(^|,)\s*bidi(?:rtl|ltr)x\s*(?=,|$)/g,'$1').replace(/^\s*,\s*/,'').trim();
      p.style.setProperty('font-family',TAG[v.d]+(fam?', '+fam:''),'important')});
  }catch(e){}
}

/* ----- احتياطي: قاموس الكلمات لنصوص بلا وسم (يُسجَّل قبل الالتقاط بـ scan) ----- */
function scan(root){
  reg=new Map();if(!root)return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode())){
    const t=n.nodeValue;if(!t||!t.trim()||!n.parentElement)continue;
    const d=dirOfEl(n.parentElement,root,e=>getComputedStyle(e))==='rtl'?'r':'l';
    t.split(/\s+/).forEach(k=>{if(!k)return;const e=reg.get(k)||{r:0,l:0};e[d]++;reg.set(k,e)});
  }
}
/* اتجاه الرسم: 'rtl' | 'ltr' | null (null = لا نفرض شيئًا ونترك ما ضبطه html2canvas) */
function decide(t,font){
  const m=TAGRX.exec(font||'');if(m)return m[1];
  t=String(t);
  const ks=t.split(/\s+/).filter(Boolean).map(k=>reg.get(k)).filter(Boolean);
  if(ks.length&&ks.every(e=>e.l>0&&e.r===0))return 'ltr';
  if(AR.test(t)||ks.some(e=>e.r>0&&e.l===0))return 'rtl';
  return null;
}
function isRtl(t){return decide(t,'')==='rtl'}

/* ----- محركات لا تعكس شكل القوس (mirroring) عند ctx.direction='rtl' (يظهر )01( بدل (01)) -----
   كشف تلقائي مرة واحدة: نرسم «(» باتجاهين ونقارن البكسلات؛ إن تطابقا فالمحرك لا يعكس. عندها، وللوحدات المرسومة بـ rtl فقط، يُبدَّل
   شكل القوس عند الرسم (لا في DOM ولا البيانات) إذا كان مستواه في خوارزمية BiDi فرديًا (RTL)، أي حين يحيط به RTL/أرقام/حدّ الوحدة.
   أما القوس بين حرفين لاتينيين (مستوى زوجي) فلا يُبدَّل، كما يفعل المتصفح. */
const PAIR={'(':')',')':'(','[':']',']':'[','{':'}','}':'{','<':'>','>':'<','\u00AB':'\u00BB','\u00BB':'\u00AB','\u2039':'\u203A','\u203A':'\u2039'};
const LAT=/[A-Za-z\u00C0-\u02AF\u0370-\u058F]/,RR=/[0-9\u0660-\u0669\u06F0-\u06F9\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const cls=ch=>LAT.test(ch)?'L':RR.test(ch)?'R':PAIR[ch]?'B':'N';
function swapBr(t){
  const a=Array.from(String(t)),k=a.map(cls);let out=false;
  for(let i=0;i<a.length;i++){
    if(k[i]!=='B')continue;
    let p='R',n='R';
    for(let j=i-1;j>=0;j--)if(k[j]==='L'||k[j]==='R'){p=k[j];break}
    for(let j=i+1;j<a.length;j++)if(k[j]==='L'||k[j]==='R'){n=k[j];break}
    if((p===n?p:'R')==='R'){a[i]=PAIR[a[i]];out=true}
  }
  return out?a.join(''):String(t);
}
let mirrors=null;
function engineMirrors(){
  if(mirrors!==null)return mirrors;
  try{
    const c=document.createElement('canvas');c.width=c.height=32;const g=(orig?orig:HTMLCanvasElement.prototype.getContext).call(c,'2d',{willReadFrequently:true});
    const px=d=>{g.clearRect(0,0,32,32);g.font='24px sans-serif';g.textBaseline='alphabetic';g.textAlign='left';g.direction=d;g.fillText('(',6,24);return g.getImageData(0,0,32,32).data};
    const a=px('ltr'),b=px('rtl');let diff=0;for(let i=3;i<a.length;i+=4)if(a[i]!==b[i])diff++;
    mirrors=diff>0;
  }catch(e){mirrors=true}
  return mirrors;
}

function on(){
  if(depth++===0){
    reg=new Map();orig=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(...a){
      const c=orig.apply(this,a);
      if(a[0]==='2d'&&c&&!c.__pdfRtl){
        c.__pdfRtl=1;const f=c.fillText;
        c.fillText=function(t,...r){try{const d=decide(t,this.font);if(d){this.direction=d;if(d==='rtl'&&typeof t==='string'&&!(pdfRtl.forceMirror??engineMirrors()))t=swapBr(t)}}catch(e){}return f.call(this,t,...r)};
      }
      return c;
    };
    if(typeof window.html2canvas==='function'){
      origH2C=window.html2canvas;
      wrapH2C=function(el,o){
        o=Object.assign({},o);const u=o.onclone;
        o.onclone=function(d,e){let r;try{r=u&&u.apply(this,arguments)}finally{tag(d,e)}return r};
        return origH2C.call(this,el,o);
      };
      try{Object.assign(wrapH2C,origH2C)}catch(e){}
      window.html2canvas=wrapH2C;
    }
  }
  let done=false;
  return()=>{if(done)return;done=true;if(--depth===0){
    if(orig){HTMLCanvasElement.prototype.getContext=orig;orig=null}
    if(origH2C){if(window.html2canvas===wrapH2C)window.html2canvas=origH2C;origH2C=wrapH2C=null}
    reg=new Map()}};
}
window.pdfRtl={on,scan,isRtl,tag,swapBr,engineMirrors,forceMirror:undefined};
})();
