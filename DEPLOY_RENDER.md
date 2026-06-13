# نشر المشروع على Render

## 1. تجهيز Supabase

شغّل ملف `supabase_schema.sql` كاملًا داخل:

`Supabase Dashboard > SQL Editor`

هذه الخطوة تنشئ جداول `profiles` و`game_rooms` و`teams` وتفعّل Realtime.

## 2. رفع المشروع إلى GitHub

أنشئ مستودعًا فارغًا على GitHub، ثم نفّذ داخل مجلد المشروع:

```powershell
git init
git add .
git commit -m "Prepare game for Render deployment"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

استبدل `USERNAME` و`REPOSITORY` ببيانات مستودعك.

## 3. النشر على Render

1. افتح `https://dashboard.render.com`.
2. سجل الدخول بواسطة GitHub.
3. اختر `New > Blueprint`.
4. اختر مستودع المشروع.
5. سيقرأ Render ملف `render.yaml`.
6. وافق على إنشاء الخدمة وانتظر اكتمال البناء.

سيظهر رابط شبيه بهذا:

`https://maeraket-seyada.onrender.com`

## 4. ربط رابط Render مع Supabase Auth

من:

`Supabase Dashboard > Authentication > URL Configuration`

ضع رابط Render في `Site URL`:

`https://maeraket-seyada.onrender.com`

وأضف في `Redirect URLs`:

`https://maeraket-seyada.onrender.com/**`

اترك رابط التطوير أيضًا:

`http://localhost:3000/**`

## 5. اختبار الفريقين

1. افتح الموقع وسجل الدخول.
2. أنشئ غرفة من الصفحة الرئيسية.
3. افتح رابط الفريق الأول في جهاز أو متصفح مختلف.
4. افتح رابط الفريق الثاني في جهاز أو نافذة خاصة مختلفة.
5. يجب تسجيل حساب مختلف لكل مشارك إذا كانت الغرفة تطلب تسجيل الدخول.

الخطة المجانية في Render تدخل وضع السكون بعد 15 دقيقة من عدم الاستخدام، وقد يستغرق أول فتح قرابة دقيقة. هذا لا يحذف بيانات اللعبة لأنها محفوظة في Supabase.
