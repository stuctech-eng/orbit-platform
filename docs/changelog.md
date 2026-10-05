# ORBIT Platform — Changelog

Bijgehouden per feature/fix, nieuwste bovenaan — staande opdracht, geen aparte aankondiging nodig.

---

## Fase D — Getest + UX-bevinding vastgelegd (8 augustus 2026)

**Hotfix:** `games.html` had een ongeldig relatief import-pad
(`assets/firebase-init.js` i.p.v. `./assets/firebase-init.js`) —
browsers staan "kale" module-specifiers niet toe zonder import map,
waardoor de hele module stil crashte en géén knop (ook niet de
fallback) getekend werd. Gecorrigeerd, enige wijziging in deze fix.

**Testresultaten, door de gebruiker bevestigd:**
- Normale flow (ingelogd, geldige entitlement) → "Play ORBIT" →
  `#accessGate`-flits → game start: **werkt**
- Directe game-URL zonder token (bestaande beginscherm-snelkoppeling
  van vóór Fase D) → "Sign in required"-overlay, game niet
  speelbaar: **werkt, zoals bedoeld**

**UX-bevinding, geen beveiligingsprobleem:** de oude, rechtstreekse
beginscherm-snelkoppeling naar de kale game-URL functioneerde vóór
Fase D als standalone/PWA-ervaring (geen adresbalk, volledig
schermvullend). Na Fase D wordt die snelkoppeling terecht
geblokkeerd — maar de noodzakelijke omweg via het platform
introduceert een Safari-adresbalk tijdens de domeinoverstap
(platform en game staan op aparte origins; iOS schakelt bij een
cross-origin-navigatie altijd naar volledige Safari-weergave over,
ook al is de bronpagina zelf standalone).

**Besluit:** `orbit-platform` wordt het officiële startpunt
(beginscherm-icoon → platform → Play ORBIT → game). De adresbalk
tijdens de overstap wordt voorlopig geaccepteerd. **Bijkomend
gevonden:** `orbit-platform` heeft zelf nog geen `manifest.json` of
`apple-touch-icon` — dat is nodig voordat een snelkoppeling naar het
platform er zelf app-achtig uitziet, nog niet gebouwd.

**Onderzoek naar same-origin/platformering (platform + game onder
één domein) wordt uitgesteld tot een aparte architectuurfase** — raakt
routing, Vercel-configuratie, PWA-installatie, token-overdracht en
mogelijk de huidige repo-architectuur (twee losse repo's/deployments).
Expliciet niet nu aangepakt.

---

## Fase D — UID-gebaseerde AccessController, eerste wijziging aan `stuctech-eng/orbit` (8 augustus 2026)

**Ontwerp vastgesteld na één correctieronde:** de entitlement-check
gebeurt uitsluitend op het platform (`issue-access-token.js`), nooit
in de game — de game vertrouwt alleen op het ondertekende token. Het
risico van één gedeeld symmetrisch secret is expliciet vastgelegd,
met asymmetrische signing (RS256) als gedocumenteerd, niet-gebouwd
toekomstig verbeterpunt.

**Gebouwd, beide repo's, uitsluitend deze scope — geen scores, geen
leaderboards, geen Fase E/F:**

- `orbit-platform/api/issue-access-token.js` — verifieert idToken,
  checkt `users/{uid}.accountStatus` + `entitlements/{uid}/games/{gameId}`
  tegen Firestore (de enige plek waar dat gebeurt), geeft bij succes
  een JWT terug (`{uid, gameId}`, 120s geldig, HS256 met
  `ACCESS_TOKEN_SECRET`)
- `orbit-platform/games.html` — "Play ORBIT" vraagt nu bij elke klik
  een vers token aan i.p.v. een kale link te zijn
- `orbit/api/verify-handoff-token.js` — **eerste serverless function
  ooit in deze repo**, stateless, geen Firestore/Admin SDK, controleert
  alleen handtekening + `exp` + `gameId === 'orbit'`
- `orbit/index.html` — nieuwe `#accessGate`-overlay (hoogste z-index,
  standaard zichtbaar via pure CSS, `touch-action: none`) + klein
  verificatie-script, **vóór** de bestaande game-engine ingevoegd.
  **Geverifieerd met een byte-voor-byte diff: de bestaande 2085-regel
  IIFE is nul bytes gewijzigd.**
- `orbit/package.json` — nieuw bestand (bestond nog niet), alleen
  `jsonwebtoken` als dependency
- Nieuw secret `ACCESS_TOKEN_SECRET`, bedoeld voor beide
  Vercel-projecten (nog handmatig in te stellen, zie README)

**Bewust benoemde beperkingen, niet opgelost in dit ontwerp:**
- Een reeds uitgegeven token blijft tot 120s geldig, ook ná een
  tussentijds ingetrokken entitlement — alleen de eerstvolgende nieuwe
  token-aanvraag ondervindt het gevolg daarvan
- Geen single-use-afdwinging — hetzelfde token kan in theorie twee
  keer binnen het venster gebruikt worden (twee tabbladen) — vergt
  server-side `jti`-tracking, bewust buiten scope
- Directe toegang tot de game-URL zonder token: geen code-invoerscherm
  meer als fallback (verviel bewust, conform Fase B — geen anonieme
  productie-toegang meer), alleen een verwijzing terug naar het platform

**Status: gebouwd, nog niet getest in productie** — wacht op het
instellen van `ACCESS_TOKEN_SECRET` in beide Vercel-projecten, zie
README voor de testinstructies (inclusief twee expliciete faaltests).

---

## Fase B/C — Reconciliation, Identity/Auth-ontwerp + bouw (8 augustus 2026)

**Koerswijziging ten opzichte van het eerdere Fase 3-traject.** Een
reconciliation-audit stelde vast dat het bestaande, codegebaseerde
AccessController-ontwerp (klaar voor GO op dat moment) binnen
afzienbare tijd opnieuw ontworpen zou moeten worden zodra centrale
accounts nodig zijn — precies het risico dat voorkomen moest worden.
Besluit: dat ontwerp **niet bouwen**, eerst een centrale Identity/
Auth/Access-laag (Firebase Auth + UID) ontwerpen en bouwen.

**Fase B — architectuur vastgesteld:**
- Identiteit = Firebase Auth UID, niet een beta-code
- `users/{uid}` = profiel, nooit identiteit/wachtwoord
- `beta_codes` blijft bestaan als invoermechanisme voor een
  `entitlements/{uid}/{gameId}`-document, niet meer de entitlement zelf
- Demo blijft altijd vrij toegankelijk; productiegame vereist account +
  geldige entitlement (geen anonieme toegang meer); lokale gameplay na
  validatie blijft offline werken
- Firebase Auth is de enige bron van waarheid over identiteit;
  `users/{uid}.accountStatus` is een platform-lifecycle-registratie,
  geen eigen tweede autoriteit

**Fase C — technisch ontwerp + bouw, uitsluitend binnen `orbit-platform`:**
- Firebase Authentication (Email/Password), e-mailverificatie
  **verplicht** vóór een account `active` wordt
- `users/{uid}`, `displayNames/{naam}` (uniekheids-reservering via
  atomaire transactie, ook bij naamswijziging)
- Beta-code-invoer verplaatst ín de account-flow — geen losse,
  accountloze stap meer; `entitlements/{uid}/games/{gameId}` vervangt
  de oude, voor-altijd-geldige lokale sessie
- `maxUses` wordt nu gehandhaafd bij het inwisselen van een code —
  lost het gat uit de eerdere audit direct op
- Account verwijderen: directe statuswijziging + ingetrokken
  entitlements; Firebase Auth-user blijft 30 dagen bestaan vóór
  definitieve opruiming (de scheduled cleanup-job zelf is nog niet
  gebouwd — expliciet benoemd als vervolgstap)
- Nieuwe pagina's: `pages/register.html`, `pages/login.html`; herbouwd:
  `pages/beta.html`, `pages/account.html`; herzien: `games.html`
  (Firebase Auth + Firestore-entitlement i.p.v. `localStorage`)
- Nieuwe serverless functions: `api/create-profile.js`,
  `api/confirm-verification.js`, `api/update-displayname.js`,
  `api/redeem-beta-code.js`, `api/request-account-deletion.js` — alle
  vijf met dezelfde Admin SDK-init-stijl als de bestaande functions
- `api/check-code.js` vervangen door `api/redeem-beta-code.js` —
  blijft als bestand staan (deprecation-notice), nergens meer
  aangeroepen, geen verwijdering nodig over Working Copy
- `firestore.rules` vastgelegd in de repo als bedoelde staat — **moet
  nog handmatig in de Firebase Console geplakt worden**, kan niet
  vanuit hier worden toegepast
- **Status: live en end-to-end geverifieerd door de gebruiker.**
  Firestore Rules toegepast in de Console, volledige flow getest:
  registreren → e-mail verifiëren → inloggen → beta-code invoeren →
  entitlement toegekend → "Play ORBIT" zichtbaar → profiel correct
  in `account.html`
- `stuctech-eng/orbit` (de game zelf) volledig onaangeraakt — dat is
  Fase D, nog niet gestart

---

## Fase 3, Stap 1 — Master Specification + Audit + games.html-fix (8 augustus 2026)

**Master Specification v1.0 vastgelegd** — `docs/orbit-platform-master-spec-v1.md`, volledige, letterlijke tekst bewaard als leidend referentiedocument. Trekt eerdere losse beslissingen recht tot één geheel (platform ≠ game, demo vrij toegankelijk, echte game beveiligd, Admin Console, Firebase achter de schermen, meerdere games, later Apple).

**Audit uitgevoerd** — `docs/audit-2026-08-08.md`, conform spec §37 stap 1-5. Bevestigde wat al goed was (platform/game-scheiding, multi-game Firebase-schema, demo, beta-flow — allemaal al zo gebouwd). Twee gaten gevonden, geen aannames:
1. `games.html` had geen "Play ORBIT"-link — alleen een demo-knop
2. De echte `orbit`-game (`https://orbit-rho-ruby.vercel.app/`) heeft **geen enkele toegangscontrole** — rechtstreeks getest en bevestigd direct speelbaar zonder code/sessie

**`games.html` gefixt** — binnen een harde, vooraf afgesproken scope:
- Alleen dit bestand gewijzigd — geen wijziging aan `beta.html`, `check-code.js`, Firebase-schema, de echte `orbit`-game, of de demo
- Nieuwe logica: geldige lokale beta-sessie (`localStorage.orbit_beta_session`, zelfde criterium als `account.html` al gebruikt: `session.code` aanwezig) → **Play ORBIT** naar de echte game-URL; geen geldige sessie → **Enter beta code** naar `beta.html`. "Try the demo" blijft in beide gevallen zichtbaar
- Game-URL centraal in één `const` binnen dit bestand — niet verspreid hardcoded (bewust nog niet naar een gedeeld config-bestand verplaatst, dat is pas nodig zodra een tweede bestand de URL ook nodig heeft)
- **Expliciet géén beveiliging** — puur UX/navigatie. `localStorage` is client-side aanpasbaar, dus dit voorkomt niets voor een kwaadwillende gebruiker. De echte controle moet in de game zelf komen (AccessController, zie hieronder)
- Getest: alle vijf realistische `localStorage`-scenario's gesimuleerd in Node (geen sessie, lege string, kapotte JSON, geldige sessie, sessie zonder `code`-veld) — alle vijf gaven het correcte pad

**AccessController-onderzoeksplan vastgelegd** — `docs/access-controller-v1-onderzoek.md`. Tien vragen (opslag, geldigheidsduur, identificatie, cryptografische validatie, expiration, directe-URL-scenario, doorgestuurde-URL-scenario, multi-game-herbruikbaarheid, engine-scheiding), nog geen van alle beantwoord. **Geen code in de `orbit`-game-repo tot elke vraag beantwoord is én de gebruiker akkoord geeft op het resulterende Technisch Ontwerp.**


## Fase 3, Stap 2 — AccessController Technisch Ontwerp (8 augustus 2026)

**Alle tien onderzoeksvragen beantwoord** — `docs/access-controller-v1-technisch-ontwerp.md`. Elke vraag met bewijs uit de bestaande code (`beta.html`, `check-code.js`, `orbit`-repo's `index.html`), geen aannames.

**Twee nieuwe gaten gevonden tijdens het onderzoek zelf, niet eerder opgemerkt:**
1. Een lokale beta-sessie is momenteel **voor altijd geldig** na één succesvolle code-check — nooit een hernieuwde controle, ook niet als de code later verloopt of wordt ingetrokken in Firestore.
2. `check-code.js` handhaaft geen `maxUses` — een code kan op dit moment onbeperkt vaak gebruikt worden, ondanks dat de spec dit als kernveld van een access-code beschrijft (§11).

**Live bevestigd door de gebruiker (8 augustus 2026):** de directe game-URL (`https://orbit-rho-ruby.vercel.app/`) is inderdaad volledig open — getest door de URL in een nieuw, leeg privé-tabblad te openen na het spelen via de portal-flow. Geen enkele controle, exact het scenario dat de audit al voorspelde.

**Ontwerp, kernpunten:**
- Signed JWT-token (nieuw secret `ACCESS_TOKEN_SECRET`), uitgegeven door `check-code.js` bij een geldige code, meegegeven aan "Play ORBIT" als `?token=...`
- Nieuwe, kleine `api/verify-token.js` in de `orbit`-repo — verifieert alleen de handtekening, heeft zelf geen Firestore-toegang nodig
- AccessController als nieuwe overlay (`#accessGate`), naar het voorbeeld van de al-bestaande overlay-patronen (welkomstscherm/pauzemenu/tutorial) in de game zelf — **de bestaande 2085-regel game-IIFE wordt geen letter gewijzigd**
- Eerlijk benoemde beperking: lost het "directe URL"-probleem op, niet het "doorgestuurde token"-scenario volledig (vergt de aparte maxUses-fix)

**Status: ontwerp compleet, ter goedkeuring. Nog GEEN code in de `orbit`-game-repo — wacht op expliciet akkoord.**
