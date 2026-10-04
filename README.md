# ORBIT Platform

Portal/website voor het ORBIT-ecosysteem. Beheert discovery, accounts, beta-toegang en community — bevat zelf nooit gamecode. Zie `ARCHITECTURE.md` voor de volledige harde regel en het Firebase-schema.

Live games linken altijd naar hun eigen repo/URL (bijv. ORBIT zelf: `stuctech-eng/orbit`).

---

## 🎯 Actieve Roadmap — lees dit eerst bij een nieuwe sessie

**Vastgelegd 8 augustus 2026, na de Master Specification v1.0
(`docs/orbit-platform-master-spec-v1.md`, leidende referentie — lees
die vóór je iets bouwt).** Bij elke nieuwe sessie: dit blok eerst
lezen, dan verder bij "Volgende stap", niet opnieuw om richting vragen.

### Belangrijke koerswijziging — Fase B/C reconciliation

Het oorspronkelijke, codegebaseerde AccessController-ontwerp (hieronder
nog gedocumenteerd als historisch artefact) is **nooit gebouwd**. Een
aparte reconciliation audit concludeerde dat dit ontwerp binnen
afzienbare tijd opnieuw ontworpen zou moeten worden zodra centrale
accounts nodig zijn. Besluit: eerst een centrale Identity/Auth/Access-
laag bouwen (Fase B/C), dáárna pas een nieuwe, UID-gebaseerde
AccessController (Fase D — vervangt het oude ontwerp hieronder).

### Fase C — Centrale accountlaag (gebouwd, 8 augustus 2026)

**Scope: uitsluitend `orbit-platform`. `stuctech-eng/orbit` blijft
volledig onaangeraakt — geen AccessController-token, geen scores,
geen wijziging aan de game in deze fase.**

Gebouwd:
- Firebase Authentication (Email/Password) — centrale identiteit
- `users/{uid}` — profiel (displayName, email, accountStatus), nooit
  client-schrijfbaar, uitsluitend via Admin SDK
- `displayNames/{naam}` — uniekheids-reservering via atomaire transactie
- E-mailverificatie **verplicht** vóór een account `active` wordt
- Beta-code-invoer verplaatst ín de account-flow (`pages/beta.html`
  vereist nu inloggen + geverifieerde e-mail) — geen losse,
  accountloze stap meer
- `entitlements/{uid}/games/{gameId}` — vervangt de oude, voor-altijd-
  geldige lokale sessie; `maxUses` wordt nu gehandhaafd bij het
  inwisselen van een code (loste twee bekende gaten uit de eerdere
  audit direct mee op)
- Account verwijderen: directe statuswijziging + ingetrokken
  entitlements, Firebase Auth-user blijft 30 dagen bestaan vóór
  definitieve opruiming (nog te bouwen: de scheduled cleanup-job zelf)
- `games.html` leest nu Firebase Auth-status + Firestore-entitlement
  i.p.v. `localStorage.orbit_beta_session`

Nieuwe bestanden: zie Repo-structuur onderaan.

**`api/check-code.js` is vervangen door `api/redeem-beta-code.js`** —
blijft als bestand staan (deprecation-notice erin), nergens meer
aangeroepen.

**Nog te doen, buiten scope van Fase C:**
- Firestore Rules (`firestore.rules` in dit repo vastgelegd als
  bedoelde staat) moeten **handmatig** in de Firebase Console geplakt
  worden — dat kan niet vanuit hier
- De 30-dagen-opruiming na accountverwijdering is nog geen gebouwde
  job, alleen de statuswijziging + entitlement-revoke
- Fase D — AccessController (UID-gebaseerd, vervangt het oude
  ontwerp hieronder) — nog niet gestart

### Historisch — oorspronkelijk Fase 3-traject (vóór de koerswijziging)

- [x] **Stap 1-5 — Audit.** Zie `docs/audit-2026-08-08.md`.
- [x] **Stap 6 — UX-flow (deel 1: portal).** `games.html` kreeg een
      dynamische Play ORBIT/Enter beta code-link — inmiddels zelf
      weer herzien in Fase C (zie boven, nu Firebase Auth-gebaseerd
      i.p.v. localStorage-gebaseerd).
- [x] **Stap 8 — AccessController ontwerpen (codegebaseerd).**
      `docs/access-controller-v1-technisch-ontwerp.md` — **dit ontwerp
      is niet gebouwd en wordt niet meer gebouwd in deze vorm**, zie
      koerswijziging hierboven. Het document blijft staan als
      referentie voor de tien beantwoorde onderzoeksvragen, die deels
      hergebruikt worden in het nieuwe, UID-gebaseerde Fase D-ontwerp.
- [ ] Stap 9 (origineel) — vervangen door Fase D (nieuw ontwerp nodig)
- [ ] Stap 10 — Admin Console — Fase 4, nog niet gestart

### Volgende stap

Fase D: UID-gebaseerd AccessController-ontwerp voor de `orbit`-game-
repo (vervangt het oude codegebaseerde ontwerp). Nog niet gestart.
**Pas na expliciet akkoord op dát ontwerp mag er code in de
`orbit`-game-repo veranderen** — dat repo blijft tot dan toe volledig
onaangeraakt.

---

## Status

**Fase 1 — Live**

- `index.html` — Platform Home met ambient canvas-hero (3 zwevende cellen)
- `pages/about.html` — "Wat is ORBIT" (Memory / Minimal / Adaptive)
- `pages/demo.html` — losse speelbare demo-ronde (bewuste kleine uitzondering op de architectuurregel, zie `ARCHITECTURE.md`)
- `games.html` — overzicht, nu alleen ORBIT
- `assets/styles.css`, `assets/ambient-cells.js` — gedeelde stijl + herbruikbare ambient-canvas

**Fase 2 — Live** (7 augustus 2026, deels vervangen door Fase C)

- `pages/feedback.html` — feedbackformulier naar `/api/feedback` ✅ werkt, ongewijzigd
- `api/feedback.js` ✅ live, ongewijzigd
- `api/check-code.js` — ⚠️ vervangen door `api/redeem-beta-code.js`, zie Fase C
- Firebase-project: `orbit-platform-3ec4a`, service account gekoppeld via Vercel Environment Variables
- Eén Vercel-project actief: `orbit-platform` (`orbit-platform-nine.vercel.app`)

**Fase C — Centrale accountlaag — Live en geverifieerd** (8 augustus 2026)

- Firebase Authentication, `users/{uid}`, `displayNames/{naam}`, `entitlements/{uid}/games/{gameId}` ✅ live
- `pages/register.html`, `pages/login.html` — nieuw ✅ getest, werkt
- `pages/beta.html`, `pages/account.html` — herbouwd ✅ getest, werkt
- `games.html` — Firebase Auth-gebaseerde check ✅ getest, toont correct "Play ORBIT" na geldige entitlement
- `firestore.rules` — toegepast in de Firebase Console ✅ bevestigd werkend (reads/writes slagen)
- **End-to-end geverifieerd door de gebruiker:** registreren → e-mail verifiëren → inloggen → beta-code `TEST2026` invoeren → entitlement toegekend → "Play ORBIT" zichtbaar → profiel correct in `account.html`

**Let op `TEST2026`:** dit testdocument heeft geen `maxUses`-veld — wordt door `redeem-beta-code.js` behandeld als onbeperkt bruikbaar (bewust backward-compatible gedrag). Voor een echte `maxUses`-test: een nieuw testdocument aanmaken met een `maxUses`-veld (number).

**Nog open, buiten scope van Fase C (zie roadmap-sectie bovenaan):**
- De 30-dagen-opruiming na accountverwijdering is nog geen gebouwde job
- Fase D — AccessController (UID-gebaseerd) voor de `orbit`-game-repo zelf, nog niet gestart

---

## Repo-structuur

Paden beginnen bij repo-root, geen projectnaam-prefix (zie MASTER SYSTEM sectie 8/9).

```
index.html
games.html
ARCHITECTURE.md
package.json
.env.example
firestore.rules          ← nieuw, Fase C — handmatig toepassen in Console
pages/
  about.html
  demo.html
  register.html          ← nieuw, Fase C
  login.html              ← nieuw, Fase C
  beta.html                ← herbouwd, Fase C
  account.html              ← herbouwd, Fase C
  feedback.html
assets/
  styles.css
  ambient-cells.js
  firebase-init.js        ← nieuw, Fase C — publieke client-config
api/
  check-code.js            ← vervangen, blijft staan (deprecated)
  feedback.js
  create-profile.js        ← nieuw, Fase C
  confirm-verification.js   ← nieuw, Fase C
  update-displayname.js      ← nieuw, Fase C
  redeem-beta-code.js         ← nieuw, Fase C
  request-account-deletion.js  ← nieuw, Fase C
docs/
  orbit-platform-master-spec-v1.md
  audit-2026-08-08.md
  access-controller-v1-onderzoek.md
  access-controller-v1-technisch-ontwerp.md
  changelog.md
```
