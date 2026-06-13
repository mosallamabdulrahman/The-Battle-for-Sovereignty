# رفع معركة سيادة على استضافة cPanel مشتركة

## هل سيعمل المشروع كاملًا؟

نعم، سيعمل تسجيل الحسابات وتأكيد البريد وتسجيل الدخول وإنشاء الغرف ودخول
الفريقين والمزامنة الفورية، بشرط أن توفر الاستضافة:

- `Setup Node.js App` أو `Application Manager`، وليس PHP فقط.
- Node.js 20 أو 22.
- إمكانية تشغيل `npm install` و`npm run build`.
- تطبيق Node.js يعمل باستمرار بواسطة Passenger.
- نطاق يعمل بشهادة HTTPS.

قاعدة البيانات وAuth وRealtime تعمل على Supabase مباشرة. لذلك لا تحتاج MySQL
من cPanel، ولا تحتاج فتح WebSocket داخل خادم cPanel. متصفح كل لاعب يتصل
بـ Supabase عبر HTTPS/WSS.

إذا كانت الاستضافة تسمح فقط برفع ملفات داخل `public_html` ولا يوجد بها
Node.js App، فلا تستخدم هذه الطريقة. النسخة الثابتة قد تعمل حاليًا لأن أغلب
المنطق في المتصفح، لكنها ليست طريقة مضمونة لكل خصائص Next.js الحالية أو
المستقبلية.

## فحص الاستضافة قبل الرفع

تأكد من وجود واحد من الخيارين داخل cPanel:

- `Software > Setup Node.js App`
- `Software > Application Manager`

الإعدادات المطلوبة:

```text
Node.js version: 20 أو 22
Application mode: Production
Application root: maeraket-seyada
Application URL: https://your-domain.com
Application startup file: app.js
```

إذا لم يظهر خيار Node.js، اسأل الدعم:

```text
هل الخطة تدعم Node.js 20 أو 22 مع Passenger، وتشغيل Next.js production
application، وأوامر npm install وnpm run build؟
```

## تجهيز Supabase أولًا

1. افتح `Supabase Dashboard > SQL Editor`.
2. شغّل ملف `supabase_schema.sql` كاملًا مرة واحدة.
3. تأكد من ظهور الجداول:

```text
profiles
game_rooms
teams
```

4. افتح `Database > Replication` أو إعدادات Realtime.
5. تأكد أن `game_rooms` و`teams` مضافان إلى `supabase_realtime`.

## رفع ملفات المشروع

أنشئ مجلدًا خارج `public_html`، مثل:

```text
/home/CPANEL_USER/maeraket-seyada
```

ارفع ملفات المشروع إليه. لا ترفع هذه المجلدات:

```text
node_modules
.next
.git
```

لا تضع المشروع كله داخل `public_html`؛ Passenger سيربط الدومين بمجلد
التطبيق من إعدادات Node.js.

## إنشاء تطبيق Node.js

من `Setup Node.js App` اختر `Create Application` ثم استخدم:

```text
Node.js version: 20 أو 22
Application mode: Production
Application root: maeraket-seyada
Application URL: الدومين أو الـ subdomain
Application startup file: app.js
```

أنشئ Subdomain منفصلًا مثل `game.example.com` إذا كان الدومين الرئيسي عليه
WordPress أو مشروع آخر.

## متغيرات البيئة

أضف المتغيرات التالية داخل إعدادات تطبيق Node.js قبل البناء:

```text
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://fzmhkozxlixmbmaubkys.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_62PjGb8ihac7RgeYSCWWdg_bces3jxX
```

مفتاح `anon` عام ومسموح وجوده في الواجهة. لا تضف مطلقًا مفتاح
`service_role` إلى المشروع أو cPanel.

متغيرات `NEXT_PUBLIC_*` تُدمج أثناء `npm run build`. عند تغييرها يجب إعادة
البناء، وليس إعادة التشغيل فقط.

المشروع لا يحتاج تنزيل Google Fonts أثناء البناء، لذلك لن يفشل البناء إذا
كانت الاستضافة تمنع اتصال Node.js بخوادم الخطوط الخارجية.

## تثبيت وبناء المشروع

إذا توفر زر `Run NPM Install` استخدمه. بعد ذلك افتح Terminal داخل cPanel:

```bash
cd ~/maeraket-seyada
npm ci
npm run build
```

إذا فشل `npm ci` بسبب قيود الاستضافة استخدم:

```bash
npm install
npm run build
```

بعد نجاح البناء ارجع إلى صفحة تطبيق Node.js واضغط:

```text
Restart Application
```

نقطة تشغيل Passenger هي `app.js`. للتجربة اليدوية فقط يمكن تشغيل:

```bash
npm run start:cpanel
```

لكن لا تترك هذا الأمر مفتوحًا في Terminal؛ Passenger هو الذي يدير التطبيق.

## إعداد الدومين داخل Supabase

بعد معرفة رابط الموقع النهائي، افتح:

`Supabase Dashboard > Authentication > URL Configuration`

ضع:

```text
Site URL:
https://game.example.com

Redirect URLs:
https://game.example.com/**
http://localhost:3000/**
```

استبدل `game.example.com` بدومينك الحقيقي. يجب أن تكون شهادة SSL مفعّلة قبل
اختبار تأكيد البريد أو استعادة كلمة المرور.

## اختبار النظام كاملًا

1. افتح الموقع وسجل حساب الحكم ثم أكد البريد.
2. سجل الدخول وتأكد من ظهور أيقونة المستخدم والاسم في الهيدر.
3. اختر التصنيفات والأدوات وأنشئ غرفة.
4. افتح رابط الفريق الأول على جهاز أو نافذة خاصة.
5. افتح رابط الفريق الثاني على جهاز أو نافذة خاصة أخرى.
6. سجل حسابًا مختلفًا لكل فريق إذا طلبت الصفحة تسجيل الدخول.
7. حرّك وحدات الفريق الأول وتأكد أن التحديث يظهر عند الحكم.
8. كرر الاختبار مع الفريق الثاني ثم أعلن جاهزية الفريقين.

## تحديث المشروع لاحقًا

ارفع الملفات المعدلة، ثم نفّذ:

```bash
cd ~/maeraket-seyada
npm ci
npm run build
mkdir -p tmp
touch tmp/restart.txt
```

يمكن بدل آخر أمر الضغط على `Restart Application` من cPanel.

## أشهر الأخطاء

### ظهور 503 Service Unavailable

- راجع أن Startup File هو `app.js`.
- تأكد أن `npm run build` نجح وأن مجلد `.next` موجود.
- تأكد أن `NODE_ENV=production`.
- راجع `stderr.log` أو سجل أخطاء تطبيق Node.js.

### الموقع يعمل لكن CSS أو JavaScript يعطي 404

- لا تنقل مجلد `.next` يدويًا بعد البناء.
- أعد تنفيذ `npm run build`.
- أعد تشغيل التطبيق.
- تأكد أن Application URL مربوط بجذر التطبيق الصحيح.

### تأكيد البريد يرجع إلى localhost

- صحح `Site URL` و`Redirect URLs` داخل Supabase.
- أعد إرسال رسالة التأكيد بعد حفظ الإعداد.

### إنشاء الغرفة يعطي خطأ relation does not exist

- ملف `supabase_schema.sql` لم يُنفذ أو نُفذ على مشروع Supabase مختلف.

### الفريقان لا يتزامنان

- تأكد من تفعيل Realtime لجدولي `game_rooms` و`teams`.
- تأكد أن الحسابات مسجلة وأن RLS policies موجودة.
- جرّب من جهازين بدل تبويبين يستخدمان الحساب نفسه.

## ملاحظة موارد الاستضافة المشتركة

تشغيل واجهة المشروع خفيف نسبيًا لأن البيانات والمزامنة على Supabase. مع ذلك،
قد توقف بعض شركات الاستضافة عمليات Node.js عند تجاوز الذاكرة أو CPU. إذا كان
التطبيق يعيد التشغيل باستمرار أو يعطي 503 رغم صحة الإعداد، فالمشكلة غالبًا من
حدود الخطة المشتركة وليست من منطق اللعبة.
