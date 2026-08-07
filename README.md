# ORBIT Platform

Portal/website voor het ORBIT-ecosysteem. Beheert discovery, accounts, beta-toegang en community — bevat zelf nooit gamecode. Zie `ARCHITECTURE.md` voor de volledige harde regel en het Firebase-schema.

Live games linken altijd naar hun eigen repo/URL (bijv. ORBIT zelf: `stuctech-eng/orbit`).

---

## Status

**Fase 1 — Live** (root-structuur gecorrigeerd op 7 augustus 2026)

- `index.html` — Platform Home met ambient canvas-hero (3 zwevende cellen)
- `pages/about.html` — "Wat is ORBIT" (Memory / Minimal / Adaptive)
- `pages/demo.html` — losse speelbare demo-ronde (bewuste kleine uitzondering op de architectuurregel, zie `ARCHITECTURE.md`)
- `games.html` — overzicht, nu alleen ORBIT, klaar voor uitbreiding
- `assets/styles.css`, `assets/ambient-cells.js` — gedeelde stijl + herbruikbare ambient-canvas
- Plain HTML/CSS/JS, geen framework — zelfde iPhone-first/Working Copy-aanpak als ORBIT zelf

**Fase 2 — In uitvoering**

- ✅ `pages/beta.html` — invite-codes via Firebase Firestore (`beta_codes/{code}`)
- ✅ `/api/check-code.js` (Vercel serverless function)
- ✅ `pages/account.html` — registreren & inloggen via Firebase Auth (e-mail/wachtwoord)
- ✅ `pages/feedback.html` — authenticated feedbackformulier
- ✅ `/api/feedback.js` (Vercel serverless function)
- Firebase-schema: zie `ARCHITECTURE.md` (game-agnostisch: `games/`, `users/`, `beta_codes/`, `game_sessions/`, `leaderboards/`, `feedback/`)

---

## Volgende stap

Publieke Firebase clientconfig beschikbaar maken via runtime window-properties of `/api/firebase-config` (`ORBIT_FB_API_KEY`/`FIREBASE_API_KEY`, `ORBIT_FB_AUTH_DOMAIN`/`FIREBASE_AUTH_DOMAIN`, `ORBIT_FB_PROJECT_ID`/`FIREBASE_PROJECT_ID`) en in Vercel de server-side admin env vars instellen: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

---

## Repo-structuur

Paden beginnen bij repo-root, geen projectnaam-prefix (zie MASTER SYSTEM sectie 8/9).
