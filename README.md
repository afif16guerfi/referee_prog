# نظام تعيينات الحكام

تطبيق ويب (Express + MongoDB). **كل البيانات محفوظة في قاعدة MongoDB** على الخادم، وليس في المتصفح. المتصفح يحتفظ فقط برمز الدخول المؤقت (يُحذف بإغلاق التبويب).

## الهيكل
- `server.js` — الخادم وواجهة `/api` (دخول، إعداد أول حساب، قراءة/حفظ البيانات)
- `public/index.html` — الواجهة
- `render.yaml` — إعداد النشر على Render
- `.env.example` — أمثلة المتغيرات

## المواسم الرياضية
- لكل موسم بيانات مستقلة تمامًا، وتُحفظ في MongoDB كوثيقة منفصلة (`season:<id>`) مع فهرس المواسم (`seasons`).
- عند أول تشغيل بعد التحديث تُنسخ البيانات القديمة (وثيقة `state`) تلقائيًا إلى الموسم **2026 / 2027**. الوثيقة القديمة تبقى كما هي كنسخة احتياطية ولا تُحذف.
- من الأعلى تختار الموسم، ومن صفحة «المواسم الرياضية» تضيف موسمًا جديدًا (يبدأ فارغًا مع نسخ إعدادات الترويسة فقط) أو تعدّل اسمه.

## المتغيرات المطلوبة
| المتغير | الوصف |
|---|---|
| `MONGODB_URI` | رابط الاتصال بـ MongoDB Atlas |
| `JWT_SECRET` | نص عشوائي طويل لتوقيع الجلسات |
| `SETUP_CODE` | رمز سري يُستخدم مرة واحدة لإنشاء حساب المدير |
| `DB_NAME` | اختياري، الافتراضي `referee_assign` |

## التشغيل محليًا (Node 20.6+)
```bash
npm install
cp .env.example .env   # ثم عدّل القيم
npm run start:local
```
افتح http://localhost:3000 — في أول مرة أدخل اسم مستخدم وكلمة مرور و`SETUP_CODE`.

## الرفع على GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```
ملف `.env` مستثنى عبر `.gitignore` فلن تُرفع أسرارك.

## النشر على Render
1. New → Blueprint (أو Web Service) واربطه بمستودع GitHub.
2. أضف `MONGODB_URI` و`SETUP_CODE` (و`JWT_SECRET` يُولَّد تلقائيًا).
3. في MongoDB Atlas: Network Access → اسمح بعنوان Render (أو `0.0.0.0/0`).
