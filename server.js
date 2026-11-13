const express=require('express'),{MongoClient}=require('mongodb'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken'),path=require('path');
const {MONGODB_URI,JWT_SECRET,SETUP_CODE,DB_NAME='referee_assign',PORT=3000}=process.env;
if(!MONGODB_URI||!JWT_SECRET||!SETUP_CODE){console.error('Missing env: MONGODB_URI, JWT_SECRET, SETUP_CODE');process.exit(1)}
const app=express();app.disable('x-powered-by');app.set('trust proxy',1);app.use(express.json({limit:'15mb'}));
app.use((q,r,n)=>{r.set({'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'same-origin'});n()});
let col;const A=()=>col.findOne({_id:'admin'}),tok=u=>jwt.sign({u},JWT_SECRET,{expiresIn:'12h'}),W=f=>(q,r,n)=>f(q,r,n).catch(n);
const bad=new Map();
const limit=(q,r,n)=>{const b=bad.get(q.ip);if(b&&b.until>Date.now())return r.status(429).json({error:'محاولات كثيرة. حاول بعد قليل.'});n()};
const fail=ip=>{const b=bad.get(ip)||{n:0};b.n++;if(b.n>=5)b.until=Date.now()+60000*Math.min(b.n-4,15);bad.set(ip,b)};
const auth=(q,r,n)=>{try{q.user=jwt.verify((q.headers.authorization||'').slice(7),JWT_SECRET);n()}catch(e){r.status(401).json({error:'غير مصرح'})}};
app.get('/api/status',W(async(q,r)=>r.json({setup:!!await A()})));
app.post('/api/setup',limit,W(async(q,r)=>{const{u,p,code}=q.body||{};if(await A())return r.status(409).json({error:'الحساب موجود مسبقًا'});if(code!==SETUP_CODE){fail(q.ip);return r.status(403).json({error:'رمز الإعداد غير صحيح'})}
if(!u||!p||String(p).length<8)return r.status(400).json({error:'اسم المستخدم وكلمة مرور (8 أحرف على الأقل) مطلوبان'});const n=String(u).trim();await col.insertOne({_id:'admin',u:n,h:await bcrypt.hash(String(p),12)});r.json({token:tok(n),u:n})}));
app.post('/api/login',limit,W(async(q,r)=>{const{u,p}=q.body||{},a=await A();const ok=a&&u===a.u&&await bcrypt.compare(String(p||''),a.h);if(!ok){fail(q.ip);return r.status(401).json({error:'اسم المستخدم أو كلمة المرور غير صحيحة'})}bad.delete(q.ip);r.json({token:tok(a.u),u:a.u})}));
/* ===== المواسم الرياضية =====
 kv: {_id:'seasons', list:[{id,name}], active:id}  و  {_id:'season:<id>', data:{...}}
 الوثيقة القديمة {_id:'state'} لا تُحذف ولا تُعدَّل أبدًا (نسخة احتياطية)، وتُنسخ مرة واحدة إلى موسم 2026 / 2027 */
const DEF_ID='y2026',DEF_NAME='2026 / 2027',SK=id=>'season:'+id;
const dup=e=>e&&e.code===11000;
async function ensureSeasons(){let s=await col.findOne({_id:'seasons'});if(s)return s;
const old=await col.findOne({_id:'state'});
try{await col.updateOne({_id:SK(DEF_ID)},{$setOnInsert:{data:old&&old.data?old.data:null,at:new Date(),migrated:!!(old&&old.data)}},{upsert:true})}catch(e){if(!dup(e))throw e}
try{await col.updateOne({_id:'seasons'},{$setOnInsert:{list:[{id:DEF_ID,name:DEF_NAME}],active:DEF_ID}},{upsert:true})}catch(e){if(!dup(e))throw e}
return col.findOne({_id:'seasons'})}
const validData=d=>d&&typeof d==='object'&&Array.isArray(d.matches);
const cleanName=v=>String(v==null?'':v).trim().slice(0,60);
const pub=s=>({seasons:s.list,active:s.active});
app.get('/api/seasons',auth,W(async(q,r)=>r.json(pub(await ensureSeasons()))));
app.post('/api/seasons',auth,W(async(q,r)=>{const s=await ensureSeasons(),name=cleanName(q.body&&q.body.name),d=q.body&&q.body.data;
if(!name)return r.status(400).json({error:'اسم الموسم مطلوب'});
if(d!=null&&!validData(d))return r.status(400).json({error:'بيانات غير صالحة'});
if(s.list.some(x=>x.name.toLowerCase()===name.toLowerCase()))return r.status(409).json({error:'يوجد موسم بهذا الاسم'});
const id='s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
await col.insertOne({_id:SK(id),data:d||null,at:new Date()});
const u=await col.findOneAndUpdate({_id:'seasons'},{$push:{list:{id,name}}},{returnDocument:'after'});
r.json({...pub(u.value||u),id})}));
app.post('/api/seasons/active',auth,W(async(q,r)=>{const s=await ensureSeasons(),id=q.body&&q.body.id;
if(!s.list.some(x=>x.id===id))return r.status(404).json({error:'الموسم غير موجود'});
await col.updateOne({_id:'seasons'},{$set:{active:id}});r.json({ok:true,active:id})}));
app.put('/api/seasons/:id',auth,W(async(q,r)=>{const s=await ensureSeasons(),name=cleanName(q.body&&q.body.name),id=q.params.id;
if(!s.list.some(x=>x.id===id))return r.status(404).json({error:'الموسم غير موجود'});
if(!name)return r.status(400).json({error:'اسم الموسم مطلوب'});
if(s.list.some(x=>x.id!==id&&x.name.toLowerCase()===name.toLowerCase()))return r.status(409).json({error:'يوجد موسم بهذا الاسم'});
await col.updateOne({_id:'seasons','list.id':id},{$set:{'list.$.name':name}});r.json({ok:true})}));
const sid=async(q,r)=>{const s=await ensureSeasons(),id=q.query.season||s.active;if(!s.list.some(x=>x.id===id)){r.status(404).json({error:'الموسم غير موجود'});return null}return id};
app.get('/api/data',auth,W(async(q,r)=>{const id=await sid(q,r);if(!id)return;const d=await col.findOne({_id:SK(id)});r.json({data:d?d.data:null,season:id})}));
app.put('/api/data',auth,W(async(q,r)=>{const id=await sid(q,r);if(!id)return;const d=q.body&&q.body.data;if(!validData(d))return r.status(400).json({error:'بيانات غير صالحة'});
await col.updateOne({_id:SK(id)},{$set:{data:d,at:new Date()}},{upsert:true});r.json({ok:true})}));
app.post('/api/account',auth,W(async(q,r)=>{const{cur,u,p}=q.body||{},a=await A();if(!await bcrypt.compare(String(cur||''),a.h))return r.status(403).json({error:'كلمة المرور الحالية غير صحيحة'});if(p&&String(p).length<8)return r.status(400).json({error:'كلمة المرور الجديدة قصيرة (8 أحرف على الأقل)'});const n=String(u||a.u).trim();await col.updateOne({_id:'admin'},{$set:{u:n,h:p?await bcrypt.hash(String(p),12):a.h}});r.json({ok:true,u:n})}));
app.use(express.static(path.join(__dirname,'public')));
app.use((e,q,r,n)=>{console.error(e);r.status(500).json({error:'خطأ في الخادم'})});
MongoClient.connect(MONGODB_URI).then(c=>{col=c.db(DB_NAME).collection('kv');return ensureSeasons().then(()=>app.listen(PORT,()=>console.log('listening on '+PORT)))}).catch(e=>{console.error('Mongo connection failed:',e.message);process.exit(1)});
