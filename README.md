# KAAVO FIT Starter (reconstruction, not original source)

A new portable React + TypeScript starter based on the handoff text. It is not the original Meta AI source and is not connected to the original deployment or database.

## Included
- Mobile-first dark emerald/mint/gold UI
- Today, Workouts, Meals, Track, Habits navigation
- Water and habit state stored in this browser's localStorage
- Reconstructed illustrative 2D squat canvas with front/side view, pause/resume, reset, speed selector, basic rep counter
- Basic English/Hindi toggle
- Explicit demo-only notices for premium, login, tracking and local data

## Not production-ready
No real authentication/OTP, multi-user backend, database migration, server-side authorization, payments, ad network, health integrations, all-70-exercise animation set, native app builds, or original source code.

## Run
Requires Node.js 20+ and npm:
```sh
npm install
npm run dev
```
For a production build:
```sh
npm run build
npm run preview
```
Open the URL printed by Vite.

## Files
- `src/App.tsx`: app screens, state, reconstructed squat canvas
- `src/styles.css`: design tokens and responsive layout
- `src/main.tsx`: React entry point
- `index.html`: app HTML entry point

Do not use this demo to collect sensitive user data or accept real payments. Add secure backend authentication, per-user authorization, secret management, backups, data export/deletion and tests before launch.
