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

### Fase D — UID-gebaseerde AccessController (gebouwd, 8 augustus 2026)

**Eerste wijziging ooit aan `stuctech-eng/orbit`.** De bestaande
2085-regel game-engine is byte-voor-byte ongewijzigd gebleven
(geverifieerd via diff) — alleen een nieuwe `#accessGate`-overlay +
klein verificatie-script ervóór, en een nieuwe, stateless
`api/verify-handoff-token.js` (geen Firestore-toegang in de game-repo).

Gebouwd, beide repo's:
- `orbit-platform`: `api/issue-access-token.js` — enige plek waar de
  entitlement daadwerkelijk tegen Firestore wordt gecontroleerd, geeft
  bij succes een kortlevend (120s) JWT terug (`{uid, gameId}`,
  symmetrisch ondertekend met `ACCESS_TOKEN_SECRET`)
- `orbit-platform`: `games.html` — "Play ORBIT" is geen kale link meer,
  vraagt bij elke klik een vers token aan
- `orbit`: `#accessGate`-overlay + `api/verify-handoff-token.js` —
  stateless, controleert alleen handtekening/`exp`/`gameId`, nooit
  Firestore. Game vertrouwt het platform als poortwachter
- Nieuw secret `ACCESS_TOKEN_SECRET`, zelfde waarde in beide
  Vercel-projecten
- Bewust vastgelegd residuaal risico (Fase D-addendum): een reeds
  uitgegeven token blijft tot 120s geldig ook ná een ingetrokken
  entitlement; symmetrisch secret is een bewuste tussenstap,
  asymmetrische signing (RS256) is gedocumenteerd als toekomstig
  verbeterpunt, niet nu gebouwd

**Scope, zoals afgesproken:** geen scores, geen leaderboards in deze
stap (nog niet genummerde, latere score/leaderboard-fase — niet te
verwarren met "Fase E" hieronder, dat is de same-origin PWA-fase).

**Status: functioneel geslaagd, getest door de gebruiker.** Alle drie
testscenario's bevestigd: normale flow (Play ORBIT → korte
`#accessGate`-flits → game start), directe game-URL zonder token
("Sign in required"-overlay, game niet speelbaar), hotfix op een
ontbrekend relatief importpad in `games.html` (`assets/firebase-init.js`
→ `./assets/firebase-init.js`, anders crasht de hele module stil —
geen enkele knop werd getekend).

**UX-aandachtspunt, opgelost in Fase E:** de iOS standalone/PWA-
ervaring ging verloren bij de domeinoverstap platform→game. Zie Fase E
hieronder voor de oplossing (same-origin via rewrite).

### Fase E — Same-Origin ORBIT PWA (geïmplementeerd + getest, 5 oktober 2026)

**Doel:** ORBIT bereikbaar maken onder `/orbit` op het platform-origin,
zodat de game als standalone iPhone-PWA kan functioneren zonder de
Safari-adresbalk-onderbreking uit het Fase D-aandachtspunt.
Voorafgegaan door een 17-secties audit (GO/NO-GO-advies: **B, ja met
beperkingen**).

**Mechanisme:** Vercel **external rewrite** (`vercel.json`) —
`/orbit/*` + `/api/verify-handoff-token` → de bestaande, onafhankelijke
game-productie-URL. Browser-origin blijft het platform.

**`stuctech-eng/orbit`: nul wijzigingen**, conform de harde regel uit
de implementatie-GO. Alle bestaande relatieve paden werken vanzelf
correct onder `/orbit`.

**Manifest-scope: bewust niet gewijzigd** — blijft open ontwerp-
vraagstuk (twee-apps-architectuur: ORBIT direct spelen vs. ORBIT
Platform voor account/games/profiel), hard block uit de GO.

**Debuggeschiedenis — bewaard omdat de uiteindelijke oorzaak niet
voor de hand lag:** na de eerste push werkte de rewrite voor kale
paden (`/orbit`, `/orbit/`) meteen, maar **elke aanvraag met een
`?token=...`-query-string gaf een kale Vercel 404** — ongeacht
tokeninhoud, lengte, of aanwezigheid van punten (allemaal apart
getest en uitgesloten). Twee tussentijdse pogingen losten het niet
op: (1) expliciete `Cache-Control: no-store`-headers toevoegen
(hypothese: edge-caching van external rewrites) — hielp niet; (2) de
overlappende exacte `/orbit`-regel verwijderen — potentieel
regressierisico, niet verder doorgezet. **Daadwerkelijke oorzaak:**
Vercel's automatische trailing-slash-normalisatie interfereerde met
de query-string vóórdat de rewrite-regels werden toegepast. Opgelost
met `"trailingSlash": false` expliciet in `vercel.json`, plus
`games.html`'s `ORBIT_GAME_URL` aangepast naar `/orbit` **zonder**
trailing slash (consistent met die instelling, voorkomt dat de eigen
link alsnog een interne redirect triggert).

**Status: volledig getest door de gebruiker, alle scenario's
bevestigd:**
- `/orbit?token=...` (ongeldig token) → correcte "Access expired"-
  melding, bewijst dat de query-string nu goed wordt doorgegeven
- "Play ORBIT" vanuit `games.html` → `#accessGate`-flits → **game
  start daadwerkelijk**, adresbalk blijft op het platform-origin

**Resterend ontwerpvraagstuk, bewust niet opgelost:** de twee-apps/
PWA-scope-vraag (zie Fase D hierboven) — of, en hoe, `orbit-platform`
zelf ooit een eigen `manifest.json` krijgt, en of de game's
`manifest.json`-scope ooit verbreed wordt. Apart te beslissen.

### Volgende stap

Fase D en Fase E zijn beide gebouwd én getest. Volgende mogelijke
stappen: het twee-apps/PWA-scope-ontwerpvraagstuk oplossen, of
beginnen aan een nog niet genummerde score/leaderboard-fase.

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

**Fase D — UID-gebaseerde AccessController — Functioneel getest** (8 augustus 2026)

- `api/issue-access-token.js` (platform), `api/verify-handoff-token.js` + `#accessGate` (game) ✅ live, getest
- Bestaande game-engine (`stuctech-eng/orbit`) geverifieerd byte-identiek, geen regel gewijzigd
- Hotfix: ontbrekend relatief importpad in `games.html` gecorrigeerd (`./assets/firebase-init.js`)
- **UX-aandachtspunt: opgelost door Fase E hieronder**

**Fase E — Same-Origin ORBIT PWA — Volledig getest** (5 oktober 2026)

- `vercel.json` — external rewrite `/orbit/*` + `/api/verify-handoff-token` naar de game, `"trailingSlash": false` ✅ live, getest
- `games.html` — `ORBIT_GAME_URL` naar `/orbit` (zonder trailing slash) ✅ getest
- `stuctech-eng/orbit` — **nul wijzigingen**, bevestigd niet nodig
- **Opgeloste bug tijdens testen:** query-strings (zoals het token) gaven aanvankelijk een kale Vercel 404 door Vercel's automatische trailing-slash-redirect-gedrag — zie roadmap-sectie bovenaan voor de volledige uitzoekgeschiedenis
- Alle testscenario's bevestigd door de gebruiker: directe `/orbit?token=...`, en de volledige "Play ORBIT"-flow met game-start

---

## Volgende stap ná deze push (Fase D-testinstructies)

1. **`ACCESS_TOKEN_SECRET` instellen in BEIDE Vercel-projecten** —
   `orbit-platform` én `orbit` (de game). Zelfde waarde in beide,
   anders slaagt de verificatie nooit. Vercel → project → Settings →
   Environment Variables → naam `ACCESS_TOKEN_SECRET`, waarde: zie
   losse chat-aanlevering (geheim, staat niet in dit bestand). Daarna
   **Redeploy** op beide projecten.
2. Testen: inloggen (bestaand account van Fase C-test) → `games.html`
   → "Play ORBIT" klikken → moet doorsturen naar de game-URL met
   `?token=...` → de game zou de `#accessGate`-overlay heel kort
   moeten tonen en dan vrijgeven
3. **Faaltest:** open de game-URL rechtstreeks, zonder `?token=` —
   moet "Sign in required" tonen, niet de game zelf
4. **Faaltest:** wacht >120 seconden na het klikken op "Play ORBIT"
   voordat je de link opent (bijv. kopieer de URL, wacht, plak in een
   nieuw tabblad) — moet "Access expired" tonen

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
vercel.json               ← nieuw, Fase E — same-origin rewrite naar de game (trailingSlash: false)
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
  issue-access-token.js         ← nieuw, Fase D
docs/
  orbit-platform-master-spec-v1.md
  audit-2026-08-08.md
  access-controller-v1-onderzoek.md
  access-controller-v1-technisch-ontwerp.md
  changelog.md
```
