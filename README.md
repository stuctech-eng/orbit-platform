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

**Fase 2 — Nog te bouwen**

- `pages/beta.html` — invite-codes via Firebase Firestore (`beta_codes/{code}`)
- `pages/account.html`
- `pages/feedback.html`
- `/api/check-code.js` (Vercel serverless function)
- `/api/feedback.js` (Vercel serverless function)
- Firebase-schema: zie `ARCHITECTURE.md` (game-agnostisch: `games/`, `users/`, `beta_codes/`, `game_sessions/`, `leaderboards/`, `feedback/`)

---

## Volgende stap

Fase 2 starten: Firebase-project koppelen, `beta.html` + `/api/check-code.js` bouwen als eerste onderdeel (invite-flow is de basis waarop account/feedback voortbouwen).

---

## Repo-structuur

Paden beginnen bij repo-root, geen projectnaam-prefix (zie MASTER SYSTEM sectie 8/9).
