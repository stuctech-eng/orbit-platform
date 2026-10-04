# AccessController v2 (UID-gebaseerd) — Technisch Ontwerp

**Status: Gebouwd, 8 augustus 2026. Vervangt `access-controller-v1-technisch-ontwerp.md` (codegebaseerd, nooit gebouwd — zie `docs/orbit-platform-master-spec-v1.md`-geschiedenis voor de reconciliation-reden).**

Dit document is de vastgelegde opvolger van het oorspronkelijke,
codegebaseerde AccessController-ontwerp. Na een reconciliation-audit
(Fase A) en een Identity/Auth/Access-architectuurontwerp (Fase B,
geleid tot Fase C: de centrale accountlaag) is dit ontwerp specifiek
voor de koppeling tussen `orbit-platform` en `stuctech-eng/orbit`.

---

## 1. Flow

```
PLATFORM (orbit-platform)                    GAME (stuctech-eng/orbit)
──────────────────────────                   ─────────────────────────
Login
  ↓
Play ORBIT (klik)
  ↓
POST /api/issue-access-token
  ↓
Auth UID + accountStatus +
entitlement ECHT gecontroleerd
(Firestore-read, bron van waarheid)
  ↓
JWT, 120 sec geldig
  ↓
window.location → game-URL?token=...  ──────→  JWT ontvangen
                                                  ↓
                                                handtekening + gameId
                                                + exp gecontroleerd
                                                (GEEN Firestore-read,
                                                vertrouwt op het
                                                platform als poortwachter)
                                                  ↓
                                                OK → game start
```

**Kernprincipe:** de entitlement wordt uitsluitend op het platform
gecontroleerd (`api/issue-access-token.js`), nooit in de game. De game
verifieert alleen het bewijs dat die controle al heeft plaatsgevonden.

## 2. Token-formaat

```json
{
  "uid": "firebase-uid",
  "gameId": "orbit",
  "iat": 1733654400,
  "exp": 1733654520
}
```

- Levensduur: 120 seconden vanaf uitgifte
- Algoritme: HS256, symmetrisch secret `ACCESS_TOKEN_SECRET`, zelfde
  waarde in beide Vercel-projecten
- Dekt uitsluitend de handoff zelf, niet de hele speelsessie

## 3. Wanneer wordt de entitlement daadwerkelijk gecontroleerd

**Alleen in `api/issue-access-token.js` op het platform** — bij elke
klik op "Play ORBIT", niet doorlopend tijdens het spelen. De game doet
dit nooit zelf. Een al uitgegeven token blijft geldig tot `exp`, ook
als de onderliggende entitlement in de tussentijd wordt ingetrokken —
dat effect wordt pas zichtbaar bij de eerstvolgende nieuwe token-
aanvraag. Dit is een bewuste consequentie van de offline-tolerante
game-ervaring (Fase B), niet een onopgemerkt gat.

## 4. Verificatie in de game

`api/verify-handoff-token.js`, stateless: controleert alleen
handtekening + `exp` + dat `gameId === 'orbit'`. Geen Firestore, geen
Firebase Admin SDK in de game-repo. Verlopen en ongeldig/vervalst
geven bewust dezelfde foutmelding terug (geen onderscheid lekken).

## 5. `#accessGate`-overlay

Hoogste z-index van de pagina (100, hoger dan de bestaande 15-30-reeks
van de game zelf), standaard zichtbaar via pure HTML/CSS (dus al
blokkerend vóór er ook maar iets van JS draait), `touch-action: none`.
Een apart, klein script — vóór de bestaande game-`<script>` — doet de
`verify-handoff-token`-aanroep en verbergt de overlay pas bij een
geldig resultaat.

**De bestaande 2085-regel game-IIFE is bij implementatie
geverifieerd met een byte-voor-byte diff: nul wijzigingen.**

## 6. Scenario's

| Scenario | Gedrag |
|---|---|
| Geen `?token=` in URL | "Sign in required" — geen code-invoerscherm meer als fallback (vervallen, conform Fase B: geen anonieme productie-toegang) |
| Verlopen token | "Access expired" |
| Ongeldige/vervalste handtekening | Zelfde melding als verlopen — geen onderscheid lekken |
| Token voor andere `gameId` | Geweigerd door de game's eigen check |
| Entitlement ingetrokken ná token-uitgifte, binnen de 120s | **Bekend, geaccepteerd risico** — token blijft nog werken tot `exp` |
| Zelfde token tweemaal snel gebruikt (twee tabbladen) | **Bekend, geaccepteerd risico** — geen single-use-afdwinging in v2 |

## 7. Multi-game

`api/issue-access-token.js` is al generiek (`gameId` als parameter).
Elke toekomstige game krijgt zijn eigen kleine, kopieerbare
`api/verify-handoff-token.js`. Geen platform- of schemawijziging nodig.

## 8. Secret-strategie — bewust vastgelegde tussenstap

**Nu:** symmetrisch (`ACCESS_TOKEN_SECRET`, HS256), zelfde waarde in
beide Vercel-projecten. **Risico, expliciet benoemd:** als de
Vercel-omgeving van één game ooit gecompromitteerd raakt, ligt het
signing-secret van het hele platform open.

**Vastgelegd toekomstig verbeterpunt, niet gebouwd:** asymmetrische
signing (RS256) — platform tekent met een private key, elke game
verifieert met een publieke key (bezit zelf nooit een geheim waarmee
tokens uitgegeven kunnen worden). Drop-in vervanging van alleen de
signing/verify-implementatie, de rest van de flow blijft identiek.

## 9. Wat behouden bleef uit het oude (v1, codegebaseerde) ontwerp

- JWT als querystring-mechanisme
- Stateless verificatie, geen Firestore in de game-repo
- `#accessGate`-overlay vóór de bestaande IIFE, die ongewijzigd blijft
- "Game beheert nooit zelf toegang" — nu geldt dat voor entitlements i.p.v. codes

## 10. Wat definitief is vervallen

- Payload gebaseerd op `{code, games, clientId}` → vervangen door `{uid, gameId}`
- `check-code.js` als token-uitgever → losgekoppeld, aparte `issue-access-token.js`
- Code-invoerscherm in de game als fallback bij directe URL-toegang

## 11. Aansluiting op toekomstige score-submission (Fase F)

Dezelfde `uid` uit het handoff-token is de identiteit die later voor
score-submission gebruikt zou worden — via een vers, apart token-
verzoek op het moment van submission, niet door het handoff-token te
hergebruiken (dat is na 120s toch dood). Niet verder uitgewerkt hier.

---

## Testinstructies (zie ook README.md)

1. `ACCESS_TOKEN_SECRET` instellen in beide Vercel-projecten, redeploy
2. Normale flow: ingelogd + geldige entitlement → "Play ORBIT" → korte
   `#accessGate`-flits → game start
3. Faaltest: directe game-URL zonder `?token=` → "Sign in required"
4. Faaltest: token ouder dan 120s → "Access expired"

## Volgende stap

Na bevestigd testen: Fase E/F (score-submission, leaderboards) — nog
niet gestart, expliciet buiten scope van Fase D.
