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

**Fase 2 — Live en geverifieerd** (7 augustus 2026)

- `pages/beta.html` — invite-code formulier, checkt tegen `/api/check-code` ✅ getest, werkt
- `pages/account.html` — leest lokale beta-sessie (`localStorage`), toont ontgrendelde games ✅ getest, werkt
- `pages/feedback.html` — feedbackformulier naar `/api/feedback` ✅ getest, werkt (schrijft naar Firestore `feedback/{id}`)
- `api/check-code.js` — Vercel serverless function, valideert code tegen Firestore `beta_codes/{code}` ✅ live
- `api/feedback.js` — Vercel serverless function, schrijft naar Firestore `feedback/{id}` ✅ live
- `package.json` — `firebase-admin` dependency voor de API-routes
- Firebase-project: `orbit-platform-3ec4a`, service account gekoppeld via Vercel Environment Variables
- Eén Vercel-project actief: `orbit-platform` (`orbit-platform-nine.vercel.app`) — duplicaat `orbit-platform-ohfk` is verwijderd

### Volgende stap

Fase 2 basis staat. Mogelijke vervolgstappen:
- Extra beta-codes aanmaken in Firestore voor echte testers (naast `TEST2026`)
- `pages/account.html` uitbreiden zodra er meer dan één game aan het platform hangt
- Overwegen: rate-limiting of eenmalig-gebruik op `beta_codes` als misbruik een zorg wordt

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
