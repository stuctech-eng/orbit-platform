# AccessController v1 — Technisch Ontwerp

**Status: Ontwerp, GEEN implementatie. Vastgelegd 8 augustus 2026.**

Alle tien vragen uit `docs/access-controller-v1-onderzoek.md` beantwoord
met bewijs uit de bestaande code — geen aannames. Dit document is de
basis voor implementatie, maar **er verandert nog geen enkele regel in
de `orbit`-game-repo totdat de gebruiker dit ontwerp expliciet
goedkeurt.**

---

## De tien vragen, beantwoord

### 1. Hoe wordt de beta-sessie momenteel opgeslagen?
**Bevestigd in `pages/beta.html`:** `localStorage.orbit_beta_session` =
`{code, games, unlockedAt}` (JSON-string). Daarnaast een apart,
persistent `localStorage.orbit_client_id` — willekeurig gegenereerd
(`c_` + random + timestamp), wordt meegestuurd bij elke code-check.

### 2. Welke gegevens geeft Firebase terug bij een geldige code?
**Bevestigd in `api/check-code.js`:** `beta_codes/{code}`-document met
minimaal `status` ('active'/anders) en `expires` (Firestore Timestamp
— **bestaat al**). Bij een geldige check: `{valid: true, games: [...]}`
terug, en de server schrijft `usedBy: arrayUnion(clientId)` +
`lastUsedAt` naar het document.

### 3. Hoe lang is een sessie geldig?
**Bevinding, niet eerder opgemerkt:** op dit moment **helemaal niet
tijdgebonden aan de kant van de gebruiker.** `unlockedAt` wordt
opgeslagen maar nooit ergens tegen gecontroleerd — `account.html` en
(het nieuwe) `games.html` checken alleen of `session.code` bestaat,
nooit de leeftijd. Een eenmaal verkregen lokale sessie is dus **voor
altijd geldig**, zelfs als de onderliggende code in Firestore
later wordt ingetrokken of verloopt. Dit is een echt gat, niet alleen
een ontbrekende toekomstige functie — de huidige `expires`-check in
`check-code.js` gebeurt alleen op het moment van code-invoer, nooit
daarna.

### 4. Hoe wordt een gebruiker geïdentificeerd?
**Bevestigd:** er bestaat al een lichte device-identiteit —
`orbit_client_id` — die de server al ontvangt en al opslaat per code
(`usedBy`-array). Geen account-systeem, geen Firebase Auth. Voldoende
als basis voor sectie 4 van dit ontwerp (zie hieronder) — geen
zwaarder identiteitssysteem nodig voor v1.

### 5. Hoe kan ORBIT de sessie cryptografisch/server-side valideren?
**Ontwerpvoorstel:** `check-code.js` (platform) geeft, naast de
bestaande response, ook een **signed session token** terug (JWT,
server-side gesigneerd met een nieuw secret in Vercel Environment
Variables — nooit in gamecode). Token-payload: `{code, games,
clientId, issuedAt, expiresAt}`. Bij "Play ORBIT" wordt dit token als
querystring meegegeven: `?token=...`.

De game krijgt een **nieuwe, kleine serverless route in de eigen
`orbit`-repo** (bijv. `api/verify-token.js`) die alleen de
JWT-signature en `expiresAt` controleert — **geen Firestore-toegang
nodig in de game zelf**, dus voldoet aan spec §14 ("game mag nooit
rechtstreeks gevoelige Firebase-configuratie bevatten") én aan "de
game mag nooit zelf beta-codes beheren" (verifiëren van een
handtekening is geen codebeheer).

### 6. Wat gebeurt er bij verlopen/ingetrokken toegang?
**Ontwerp:** de AccessController (zie vraag 10) roept `verify-token`
aan bij elke page-load, vóór de game zichtbaar wordt — dit lost
meteen het gat uit vraag 3 op (niet langer "voor altijd geldig na één
check"). Bij ongeldig/verlopen: het bestaande overlay-patroon toont
het spec-scherm uit §16 ("ACCESS EXPIRED... Continue with ORBIT").

### 7. Wat gebeurt er als iemand alleen de directe game-URL opent?
**Bevestigd probleem (getest door de gebruiker, 8 augustus 2026):**
op dit moment niets — de game laadt gewoon. **Na dit ontwerp:** geen
`token`-parameter in de URL → AccessController toont een
code-invoerscherm (spec §15, "Enter access code" → eigen validatie via
`verify-token` of een vergelijkbare route) in plaats van de game.

### 8. Wat gebeurt er als iemand de URL doorstuurt naar iemand anders?
**Eerlijke, expliciet benoemde beperking van dit ontwerp:** een
doorgestuurd `?token=...` zou, zolang het token geldig is, ook bij de
ontvanger werken — een token is niet hard aan één device gebonden
(alleen aan het `clientId` waarmee het is uitgegeven, dat de ontvanger
niet per se heeft, maar de game-kant controleert dat in v1 niet
apart). **De echte bescherming tegen doorsturen hoort op codeniveau te
zitten** (`maxUses`), niet op tokenniveau — en dat ontbreekt op dit
moment ook (zie Bijkomende bevinding hieronder). Dit ontwerp lost het
"directe URL"-probleem (vraag 7) op, niet het "doorgestuurde
code/token"-probleem volledig — dat vergt een aparte, kleine
uitbreiding van `check-code.js` (maxUses-check toevoegen), buiten de
scope van de AccessController zelf.

### 9. Hoe kunnen toekomstige games dezelfde infrastructuur hergebruiken?
**Ontwerp:** het token bevat al `games: [...]` (rechtstreeks
overgenomen uit de bestaande Firestore-data). Elke toekomstige game
hoeft alleen zijn eigen `verify-token`-route te hebben (klein, kopieer-
baar sjabloon) en te checken of zijn eigen `gameId` in de
`games`-array van het token zit. Geen wijziging aan het platform of
Firebase-schema nodig voor Game 2/3.

### 10. Hoe voorkom je dat de bestaande ORBIT-engine verbouwd moet worden?
**Bevestigd via `index.html`:** de game is één grote, zelfuitvoerende
IIFE (2085 regels, script vanaf regel 464) — precies zoals de spec
voorspelde. **Maar:** dezelfde codebase gebruikt al een
overlay-patroon met z-index-lagen (welkomstscherm, pauzemenu,
tutorial-overlay op z-index 30, bevestigd in de eigen changelog).

**Ontwerp:** een nieuwe `#accessGate`-overlay, **hoger** dan alle
bestaande overlays, standaard zichtbaar via pure HTML/CSS (dus al
blokkerend vóór er ook maar iets van JS draait). Een klein, apart
script — vóór de bestaande grote `<script>`-tag, of als eerste regels
erbinnen zonder de rest te wijzigen — doet de `verify-token`-check en
verbergt de overlay pas bij een geldig resultaat. **De bestaande
IIFE wordt letterlijk geen regel gewijzigd** — hij initialiseert
gewoon zoals altijd, maar blijft visueel/interactief geblokkeerd
(`touch-action: none`, hoogste z-index) totdat de overlay verdwijnt.

---

## Bijkomende bevinding — los van de tien vragen, wel relevant

`check-code.js` handhaaft nergens een `maxUses`-limiet, ondanks dat
spec §11/§21-22 dit als kernveld van een access-code beschrijft. Op
dit moment kan één code onbeperkt vaak gebruikt worden (alleen
`status`/`expires` worden gecontroleerd). Niet in scope van de
AccessController zelf, wel een aanbeveling voor een latere, kleine
uitbreiding van `check-code.js`.

---

## Wat dit ontwerp NIET doet

- Geen wijziging aan `orbit`-repo — dit is nog steeds alleen een
  ontwerp
- Lost niet het "doorgestuurde code/token"-scenario volledig op (zie
  vraag 8) — dat vergt een aparte `maxUses`-uitbreiding
- Geen Admin Console (dat is spec-stap 10, volgt hierna)

## Volgende stap

Dit ontwerp ter goedkeuring aan de gebruiker voorleggen. **Pas na
expliciet akkoord:**
1. Nieuw secret (`ACCESS_TOKEN_SECRET`) in beide Vercel-projecten
2. `check-code.js` uitbreiden: token genereren en meegeven in de
   response (kleine, additieve wijziging — bestaande response-velden
   blijven staan)
3. `games.html`: token meegeven in de "Play ORBIT"-URL
4. Nieuwe route in de `orbit`-repo: `api/verify-token.js`
5. Nieuwe overlay + klein script in `orbit`'s `index.html`, vóór de
   bestaande engine — geen enkele bestaande regel wijzigen
