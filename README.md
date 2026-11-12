# KAAVO FIT — Slice 1

Separate development project for the KAAVO FIT app shell. This is a reconstruction, not the original Meta AI project.

## Included
- React 18 + TypeScript + Vite
- Responsive header and bottom navigation
- Right-side drawer with Wallet and Rewards only in the drawer
- English and Hindi (Devanagari) language toggle
- Light/dark theme toggle
- Toast messages and empty states
- No live payments, ads, or backend integration

## Run locally
Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build check
```bash
npm run build
npm run preview
```

## Important limitations
- This slice is a UI shell only; workout, progress, profile, wallet and rewards content are placeholders.
- Language/theme are in-memory only and reset after refresh.
- Uses system fonts; no runtime CDN is required.
- No backend, analytics, payments, ad SDK, or account system is included.
- Do not deploy as the final app or connect real payments before full testing and explicit approval.
