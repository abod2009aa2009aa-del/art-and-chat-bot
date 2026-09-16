# ALYSSA CYBER Deployment Guide

This project is ready for repository-based deployment to a hosting platform that supports TanStack Start and server routes.

## 1. GitHub sync

1. Connect the existing GitHub repository to Lovable.
2. Select the existing `main` branch.
3. Sync the latest commit from GitHub; do not create a second project or repository.
4. Confirm the platform build is based on the synced commit.

## 2. Required environment variables

Set these variables in the platform environment before publishing or running the app:

- `TELEGRAM_BOT_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY`
- `GIT_COMMIT` (recommended: deployed Git commit used by `/api/health`)

Optional, only for authorized exam security work:

- `EXAM_MODE`
- `EXAM_TARGET_URL`
- `EXAM_TARGET_DOMAIN`
- `EXAM_TARGET_IP`
- `EXAM_START_TIME`
- `EXAM_END_TIME`
- `ALLOWED_TEST_CATEGORIES`
- `ALLOWED_SERVICES`
- `SECURITY_RATE_LIMIT_PER_MINUTE`

The Telegram webhook secret is derived from `TELEGRAM_BOT_TOKEN` as
`sha256("tg-webhook:" + token)` encoded with base64url. Set Telegram's
`X-Telegram-Bot-Api-Secret-Token` to that derived value; no separate secret
variable is read by the webhook.

Do not commit any secrets to the repository.

## 3. Supabase

1. Apply each migration in `supabase/migrations` once, in filename order.
2. Confirm the tables used by ALYSSA exist before runtime use, including `alyssa_memory_summaries`.
3. Keep RLS enabled and service-role access aligned with the project access model.

## 4. Telegram

1. Set the Telegram webhook URL to `<deployment-origin>/api/public/telegram/webhook`.
2. Ensure the bot token is configured in the platform environment.
3. Set the derived webhook secret described above.
4. Verify `/api/health`, then verify `/api/public/telegram/webhook` receives updates.

## 5. Deployment and verification

1. Sync GitHub to the platform.
2. Confirm `main` and the latest commit are selected.
3. Configure environment variables and apply Supabase migrations.
4. Deploy or publish the application.
5. Validate `/api/health` returns runtime info without exposing secrets.
6. Configure Telegram's webhook and verify the bot route live.

## 6. Production checks

- `npm test -- --run`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `git diff --check`

These checks are the local proof that the repository is ready for deployment.

The actual live deployment, Supabase migration application, and bot runtime require a platform with the necessary external credentials and access. This repository can prove build and local health behavior, but it cannot prove external deployment from a credential-free environment.
