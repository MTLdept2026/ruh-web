# Ruh Web

Standalone web/PWA project for Ruh. This folder contains the browser-facing app shell and assets so the original `ruh-app` directory can stay focused on the iOS build.

## Run locally

```bash
cd /Users/mherwanto/Desktop/ruh-web
npm install
npm run dev:netlify
```

Then open the local Netlify URL it prints, usually `http://localhost:8888`.

## What is included

- The full web app shell copied from the shared `www/` bundle
- Local vendor assets for Tailwind, React, Babel, Adhan, icons, and fonts
- PWA manifest, service worker, and deployment headers

## Notes

- Prayer reminders are now backed by Netlify Functions + Netlify Blobs + Web Push.
- On iPhone and iPad, users need to install Ruh to the Home Screen and enable reminders from the installed app.
- When you deploy, bump the version in both `index.html` and `version.json` so the cache-busting flow stays in sync.

## Environment variables

Set these in Netlify before enabling prayer reminders in production:

- `VAPID_SUBJECT`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

Example subject: `mailto:founders@yourdomain.com`
There is also a starter template at `.env.example`.

## Reminder backend

- `/.netlify/functions/push-config` exposes the public VAPID key to the client.
- `/.netlify/functions/push-subscription` stores or deletes web-push subscriptions and the next reminder schedule.
- `push-dispatch` is a scheduled Netlify Function that runs every minute and sends due reminders.
