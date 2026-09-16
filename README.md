# ALYSSA CYBER

بوت Telegram هندسي موحد باللهجة العربية والعربية الفصحى والإنجليزية. المستخدم يرسل الهدف، وتختار أليسا مسار الفهم والأدوات والتحقق داخليًا.

لا تحفظ الأسرار في Git. كان هذا المستودع يحتوي سابقًا على قيمة توكن Telegram مكشوفة؛ يجب تدوير ذلك الاعتماد من BotFather فورًا، ثم وضع التوكن الجديد في بيئة التشغيل فقط.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://art-and-chat-bot.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/556e56fa-b9fd-4d1d-aea7-e3af411504cf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Architecture

- `src/routes/api/public/telegram/webhook.ts`: بوابة Telegram، التحقق من webhook، وتجميع الرسائل والوسائط.
- `src/lib/alyssa/orchestrator.server.ts`: العقل المركزي، اختيار الأدوات، دورة التنفيذ، وحالة المهمة.
- `src/lib/alyssa/capability-router.ts`: تصنيف الهدف داخليًا إلى قدرات مثل Python وWeb وDatabase وSecurity.
- `src/lib/alyssa/tools.server.ts`: سجل الأدوات الحقيقي مع التحقق والتسجيل والنتائج المنظمة.
- `src/lib/alyssa/store.server.ts`: المشاريع والملفات والإصدارات والمهام والسجلات في Supabase.
- `src/lib/alyssa/scope-guard.server.ts`: يمنع الفحص الأمني النشط خارج نطاق امتحان مصرّح به.
- `supabase/migrations`: مخطط الرسائل والمشاريع والملفات والإصدارات والمهام والسجلات.

الواجهة `/` حاليًا صفحة تعريفية بسيطة. التشغيل الأساسي يتم عبر Telegram، وليس عبر لوحة ويب.

## Environment

المتغيرات الأساسية:

```sh
TELEGRAM_BOT_TOKEN=
OWNER_TELEGRAM_ID=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
LOVABLE_API_KEY=
GEMINI_API_KEY=
```

للامتحان الأمني المصرح فقط:

```sh
EXAM_MODE=false
EXAM_TARGET_URL=
EXAM_TARGET_DOMAIN=
EXAM_TARGET_IP=
EXAM_SCOPE=
EXAM_START_TIME=
EXAM_END_TIME=
ALLOWED_SERVICES=
ALLOWED_TEST_CATEGORIES=
```

لا تستخدم `SUPABASE_SERVICE_ROLE_KEY` في المتصفح أو أي كود عميل.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

التحقق المتاح في المشروع:

```sh
npm test
npm run lint
npm run build
```

## Telegram Webhook

وجه Telegram إلى:

```text
https://<deployment-host>/api/public/telegram/webhook
```

يجب أن يرسل Telegram Header `X-Telegram-Bot-Api-Secret-Token` مشتقًا من التوكن. لا تسجل التوكن أو قيمة الـsecret في السجلات.

## Security Mode

الفحص النشط لا يعمل إلا عندما يكون `EXAM_MODE=true` ويكون الهدف مطابقًا لأحد الأهداف المصرحة. كل أداة أمنية يجب أن تمر عبر ScopeGuard. إذا لم يكن النطاق مضبوطًا، ترجع الأداة رفضًا واضحًا بدل تنفيذ أو تخمين نتيجة.

## Secret Rotation

إذا ظهر اعتماد في Git أو السجلات:

1. ألغِ الاعتماد من الجهة المصدرة، مثل BotFather أو مزود الذكاء.
2. أنشئ قيمة جديدة في secret manager أو بيئة النشر.
3. افحص التاريخ والنسخ المنشورة بحثًا عن القيمة القديمة.
4. لا تضع القيمة الجديدة في README أو `.env` المتتبع.
