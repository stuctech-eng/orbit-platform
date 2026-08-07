# ORBIT Platform

Portal/website voor het ORBIT-ecosysteem. Beheert discovery, accounts, beta-toegang en community — bevat zelf nooit gamecode. Zie `ARCHITECTURE.md` voor de volledige harde regel en het Firebase-schema.

Live games linken altijd naar hun eigen repo/URL (bijv. ORBIT zelf: `stuctech-eng/orbit`).

---

## Status

**Fase 1 — Live**

- `index.html` — Platform Home met ambient canvas-hero (3 zwevende cellen)
- `pages/about.html` — "Wat is ORBIT" (Memory / Minimal / Adaptive)
- `pages/demo.html` — losse speelbare demo-ronde (bewuste kleine uitzondering op de architectuurregel, zie `ARCHITECTURE.md`)
- `games.html` — overzicht, nu alleen ORBIT, klaar voor uitbreiding
- `assets/styles.css`, `assets/ambient-cells.js` — gedeelde stijl + herbruikbare ambient-canvas

**Fase 2 — Gebouwd, wacht op Firebase-koppeling**

- `pages/beta.html` — invite-code formulier, checkt tegen `/api/check-code`
- `pages/account.html` — leest lokale beta-sessie (`localStorage`), toont ontgrendelde games
- `pages/feedback.html` — feedbackformulier naar `/api/feedback`
- `api/check-code.js` — Vercel serverless function, valideert code tegen Firestore `beta_codes/{code}`
- `api/feedback.js` — Vercel serverless function, schrijft naar Firestore `feedback/{id}`
- `package.json` — `firebase-admin` dependency voor de API-routes
- `.env.example` — welke Vercel environment variables nodig zijn

### Nog te doen voordat Fase 2 live werkt

1. Firebase-project aanmaken (of bestaand project gebruiken) met Firestore ingeschakeld
2. Service account genereren: Firebase Console → Project Settings → Service accounts → Generate new private key
3. De 3 velden uit die JSON (`project_id`, `client_email`, `private_key`) invullen als Environment Variables in Vercel — zie `.env.example`. **Nooit** als bestand committen.
4. Minstens één test-document aanmaken in Firestore: `beta_codes/TESTCODE` met `{ status: "active", games: ["orbit"] }`
5. Testen: `pages/beta.html` → code invoeren → moet doorsturen naar `account.html`

---

## Repo-structuur

Paden beginnen bij repo-root, geen projectnaam-prefix (zie MASTER SYSTEM sectie 8/9).

```
index.html
games.html
ARCHITECTURE.md
package.json
.env.example
pages/
  about.html
  demo.html
  beta.html
  account.html
  feedback.html
assets/
  styles.css
  ambient-cells.js
api/
  check-code.js
  feedback.js
```
