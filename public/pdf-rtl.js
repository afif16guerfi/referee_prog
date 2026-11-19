/* ===== إصلاح الأقواس والفواصل العربية في ملفات PDF (window.pdfRtl) =====
   السبب: html2canvas (1.4.1) يقسّم النص إلى كلمات ويرسم كل كلمة وحدها بـ ctx.fillText على لوحة canvas منفصلة عن الصفحة،
   فيكون اتجاه الرسم فيها LTR دائمًا رغم أن الصفحة dir=rtl. والكلمة المحاطة بقوس مثل «(رئيس» أو «اللجنة)،» تحتوي رموزًا محايدة
   (قوس، فاصلة، نقطة، نقطتان) يتحدد موضعها وشكلها (القوس المعكوس) باتجاه الرسم، فتنقلب جهتها وتتزحزح المسافات؛
   أما في التطبيق فالمتصفح يعرضها سليمة لأن الفقرة RTL.
   الحل (أثناء التصدير فقط، دون تعديل DOM ولا البيانات): يُرسم باتجاه rtl كل نص يحتوي أحرفًا عربية/عبرية، وكذلك كل كلمة
   تقع في سياق RTL في الصفحة (تُسجَّل قبل الالتقاط بـ scan). أما نصوص سياق LTR (مثل عناصر <bdi> للتواريخ والأرقام وأرقام الرخص)
   فتبقى LTR كما كانت.
   الاستعمال:  const off=pdfRtl.on(); try{ pdfRtl.scan(host); ...html2canvas... } finally{ off() }
   يُستعاد getContext الأصلي عند off(). */
(function(){
const AR=/[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/,STRONG=/[A-Za-z\u00C0-\u024F\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
let depth=0,orig=null,reg=new Map();
/* اتجاه نص داخل الصفحة: <bdi>/dir=auto يُحدَّد بأول حرف قوي، ثم dir الصريح، وإلا الاتجاه المحسوب */
function dirOf(node,root){
  for(let el=node.parentElement;el;el=el.parentElement){
    const d=(el.getAttribute('dir')||'').toLowerCase();
    if(el.tagName==='BDI'||d==='auto'){const s=el.textContent,i=s.search(STRONG);return i<0?'ltr':AR.test(s[i])?'rtl':'ltr'}
    if(d==='rtl'||d==='ltr')return d;
    if(el===root)break;
  }
  return getComputedStyle(node.parentElement).direction==='rtl'?'rtl':'ltr';
}
/* تسجيل كلمات النصوص ذات سياق RTL / LTR تحت root (يُستدعى بعد بناء المحتوى وقبل الالتقاط) */
function scan(root){
  reg=new Map();if(!root)return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode())){
    const t=n.nodeValue;if(!t||!t.trim()||!n.parentElement)continue;
    const d=dirOf(n,root)==='rtl'?'r':'l';
    t.split(/\s+/).forEach(k=>{if(!k)return;const e=reg.get(k)||{r:0,l:0};e[d]++;reg.set(k,e)});
  }
}
function isRtl(t){
  t=String(t);if(AR.test(t))return true;
  return t.split(/\s+/).some(k=>{if(!k)return false;const e=reg.get(k);return !!e&&e.r>0&&e.l===0});
}
function on(){
  if(depth++===0){
    reg=new Map();orig=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(...a){
      const c=orig.apply(this,a);
      if(a[0]==='2d'&&c&&!c.__pdfRtl){
        c.__pdfRtl=1;const f=c.fillText;
        c.fillText=function(t,...r){try{this.direction=isRtl(t)?'rtl':'ltr'}catch(e){}return f.call(this,t,...r)};
      }
      return c;
    };
  }
  let done=false;
  return()=>{if(done)return;done=true;if(--depth===0&&orig){HTMLCanvasElement.prototype.getContext=orig;orig=null;reg=new Map()}};
}
window.pdfRtl={on,scan,isRtl};
})();
