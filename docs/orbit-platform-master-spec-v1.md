# ORBIT Platform — Master Specification v1.0

**Status: Leidende specificatie, vastgelegd 8 augustus 2026**
**Bron: gebruiker — trekt eerdere losse beslissingen recht tot één
consistent geheel (platform ≠ game, demo vrij toegankelijk, echte game
beveiligd, Admin Console voor beheer, Firebase achter de schermen,
meerdere games en later Apple).**

Dit document is het volledige, oorspronkelijke specificatiedocument,
letterlijk bewaard. Zie `README.md` voor de actuele voortgang tegen dit
document, en `docs/access-controller-v1-onderzoek.md` voor de
uitwerking van sectie 13-16.

---

```
ORBIT PLATFORM — MASTER SPECIFICATION
=====================================
MASTER ARCHITECTURE / PRODUCT / UX / ACCESS / ROADMAP
Status: Definitive direction
Date: August 2026
============================================================
1. KERNBESLISSING — WAT ORBIT IS
============================================================
ORBIT bestaat uit twee fundamenteel gescheiden onderdelen:
1. ORBIT PLATFORM
2. ORBIT GAME
Deze mogen NIET worden samengevoegd.
Het platform is de voordeur, productpresentatie, game-catalogus, toegangspoort, accountlaag, trial/beta-laag en later commerciële laag.
De echte ORBIT-game blijft de bestaande PWA in de bestaande orbit-game repository.
DE ORBIT GAMECODE MAG NIET WORDEN GEKOPIEERD NAAR HET PLATFORM.
De bestaande ORBIT-game bevat een grote canvas/game-engine en blijft één enkele source of truth.
Architectuur:
ORBIT PLATFORM
    |
    |-- Home
    |-- What is ORBIT
    |-- Demo
    |-- Games
    |-- Beta / Trial Access
    |-- Account
    |-- Feedback
    |-- Admin Console
    |
    +----> ORBIT GAME PWA
              |
              +----> eigen repository
              +----> eigen deployment
              +----> eigen game-engine
              +----> eigen release cycle
============================================================
2. BELANGRIJKSTE ARCHITECTUURPRINCIPE
============================================================
Het platform bevat NOOIT de volledige game.
De knop:
    "Play ORBIT"
    of
    "Open ORBIT"
verwijst naar de live ORBIT-game-URL.
Bijvoorbeeld conceptueel:
ORBIT PLATFORM
      |
      +---- [ Play ORBIT ]
                    |
                    v
             LIVE ORBIT PWA
Dit voorkomt:
- dubbele gamecode
- dubbele onderhoudslast
- afwijkende versies
- deploymentproblemen
- een tweede source of truth
Een toekomstige Game 2 krijgt exact dezelfde behandeling:
ORBIT PLATFORM
    |
    +-- ORBIT ----> eigen repo / eigen deploy
    |
    +-- GAME 2 ---> eigen repo / eigen deploy
    |
    +-- GAME 3 ---> eigen repo / eigen deploy
============================================================
3. STACK — DEFINITIEVE KEUZE
============================================================
GEEN NEXT.JS voor het platform.
Het platform moet bewust simpel, licht en iPhone-first blijven.
Platform:
- plain HTML
- CSS
- vanilla JavaScript waar nodig
- Vercel hosting
- GitHub repository
- Working Copy voor iPhone-first development
- Vercel automatische deployments
- Firebase voor backend/data/auth wanneer nodig
- Vercel serverless API endpoints voor server-side acties
Geen onnodige build-complexiteit.
Doel:
GitHub push
    ->
Vercel
    ->
live platform
De ontwikkelworkflow moet volledig bruikbaar blijven vanaf iPhone via Working Copy.
============================================================
4. PLATFORM REPOSITORY
============================================================
Gebruik bij voorkeur een neutrale naam zoals:
orbit-platform
Niet orbit-website als het platform uiteindelijk meerdere games gaat bevatten.
Structuur:
orbit-platform/
|
├── index.html
├── games.html
|
├── pages/
│   ├── about.html
│   ├── demo.html
│   ├── beta.html
│   ├── account.html
│   └── feedback.html
|
├── admin/
│   ├── index.html
│   ├── members.html
│   ├── invites.html
│   ├── games.html
│   └── settings.html
|
├── assets/
│   ├── styles.css
│   ├── images/
│   └── icons/
|
└── api/
    ├── validate-access.js
    ├── create-invite.js
    ├── claim-invite.js
    ├── feedback.js
    └── ...

De exacte bestandsstructuur mag worden aangepast als daar een technische reden voor is, maar het principe blijft hetzelfde:
PLATFORM EN GAME ZIJN GESCHEIDEN.
============================================================
5. HUIDIGE STATUS
============================================================
De eerste fases van het platform zijn al gebouwd.
Er bestaat momenteel een beta-access flow waarbij een testcode kan worden ingevoerd.
Na bijvoorbeeld:
    TEST2026
komt de gebruiker op een scherm zoals:
    ORBIT
    Beta access active
    Welcome back.
    Your invite code TEST2026 is active on this device.
    ORBIT
    Unlocked via your beta code.
    [ Go to games ]
    [ Send feedback ]
Dit scherm is logisch als beta/member landing page.
De knop:
    Go to games
moet naar de Games-pagina gaan.
De Games-pagina toont momenteel ORBIT.
Belangrijk:
Een gebruiker met geldige beta/trial-toegang moet vanuit Games naar de ECHTE ORBIT PWA kunnen.
Dus:
Beta Access
    ->
Welcome / Access screen
    ->
Games
    ->
ORBIT
    ->
Play ORBIT
    ->
echte ORBIT PWA
============================================================
6. GAMES PAGINA
============================================================
De Games-pagina moet vanaf het begin multi-game-ready worden.
Momenteel staat er slechts één game:
ORBIT
Maar de architectuur mag niet hard-coded worden als "er bestaat maar één game".
Conceptueel:
GAMES
------------------------------------------------
ORBIT
Cognitive performance game
[ Play ORBIT ]
------------------------------------------------
Future:
------------------------------------------------
GAME 2
Description
[ Play ]
------------------------------------------------
------------------------------------------------
GAME 3
Description
[ Play ]
------------------------------------------------
Elke game is een afzonderlijk product/repository/deployment.
Het platform toont alleen:
- naam
- beschrijving
- status
- afbeelding/visual
- toegangstatus
- game-link
============================================================
7. DEMO — ZEER BELANGRIJK
============================================================
De DEMO moet vrij toegankelijk zijn.
Een bezoeker hoeft voor de demo:
- geen account te hebben
- geen invite-code te hebben
- geen beta-toegang te hebben
- geen Firebase-account te hebben
De demo moet ECHT werken.
Geen statische mockup.
Geen alleen video.
De bezoeker moet de kern van ORBIT daadwerkelijk kunnen ervaren.
Bijvoorbeeld:
- korte sessie
- beperkte hoeveelheid rondes
- scanner
- geheugen/prikkel
- selectie
- resultaat
De demo is een kennismaking met de kernmechaniek.
De volledige ORBIT-game blijft echter de bestaande ORBIT PWA.
De demo hoeft dus NIET de volledige ORBIT-engine te dupliceren.
Doel:
VISITOR
    ->
TRY ORBIT
    ->
korte echte demo
    ->
"I understand what ORBIT is"
    ->
"I want more"
============================================================
8. DEMO VS FULL GAME
============================================================
Dit onderscheid moet expliciet worden gehandhaafd.
DEMO:
- publiek
- kort
- geen account
- geen invite
- bedoeld voor kennismaking
FULL ORBIT:
- toegang vereist wanneer het product achter toegang zit
- volledige game
- volledige sessies
- volledige progression
- persoonlijke data wanneer geïmplementeerd
- toekomstige betaalde toegang
Flow:
WEBSITE
    |
    +-- TRY ORBIT
    |       |
    |       +--> FREE DEMO
    |
    +-- PLAY / FULL ORBIT
            |
            +--> ACCESS CHECK
                    |
                    +--> valid
                    |      |
                    |      +--> ORBIT PWA
                    |
                    +--> invalid
                           |
                           +--> Access / Trial
============================================================
9. COMMERCIËLE PRODUCTFLOW
============================================================
ORBIT moet uiteindelijk niet worden gezien als:
"een website met een link naar een game"
maar als:
"een platform waarop iemand ORBIT ontdekt, probeert, gebruikt en uiteindelijk toegang koopt."
Gewenste customer journey:
1. Discover
2. Understand
3. Try
4. Want more
5. Trial
6. Full use
7. Purchase
8. Return
9. Discover future games
Conceptueel:
ORBIT PLATFORM
      |
      v
DISCOVER ORBIT
      |
      v
TRY ORBIT
      |
      v
FREE DEMO
      |
      v
"I WANT MORE"
      |
      v
14-DAY TRIAL
      |
      v
FULL ORBIT
      |
      v
BUY / SUBSCRIBE
      |
      v
CONTINUE USING
============================================================
10. 14-DAY TRIAL
============================================================
Een 14-daagse trial is een mogelijke commerciële flow.
Niet hard-code als definitief businessmodel.
Het systeem moet flexibel genoeg zijn voor:
- Demo
- Beta
- Trial
- Promotional access
- Paid access
- Subscription
- Lifetime purchase
Gebruik daarom een generiek concept:
ACCESS
en niet uitsluitend:
BETA CODE
============================================================
11. ACCESS CODES
============================================================
Access codes moeten centraal beheerd kunnen worden.
Voorbeeld:
ORBIT-7K4P-X92L
Een code kan eigenschappen hebben zoals:
- game
- type
- status
- createdAt
- expiresAt
- maxUses
- usedCount
- claimedBy
- duration
- createdBy
Voorbeeld:
Game:
ORBIT
Type:
TRIAL
Duration:
14 days
Maximum uses:
1
Status:
ACTIVE
============================================================
12. ZEER BELANGRIJK — LINK DELEN
============================================================
Een game-URL mag NOOIT zelf als toegangsbewijs gelden.
De URL mag openbaar zijn.
Bijvoorbeeld:
https://orbit-game.vercel.app
Iemand mag deze URL doorsturen.
Maar de URL alleen geeft GEEN toegang.
De echte ORBIT PWA moet zelf controleren of de gebruiker een geldige toegang/session heeft.
Dus:
USER
  |
  v
ORBIT GAME URL
  |
  v
ACCESS GATE
  |
  v
VALID SESSION?
  |
  +---- NO ----> ACCESS SCREEN
  |
  +---- YES ---> GAME
============================================================
13. ACCESS CONTROL MOET IN DE GAME ZELF ZITTEN
============================================================
Dit is essentieel.
De platformwebsite mag niet de enige beveiligingslaag zijn.
Anders kan iemand:
website overslaan
    ->
direct naar game URL
    ->
game spelen
Dat mag niet wanneer volledige ORBIT achter toegang staat.
Daarom wordt in de bestaande ORBIT PWA een dunne nieuwe laag toegevoegd:
ACCESS CONTROLLER / ACCESS GATE
Dit is GEEN herbouw van de game.
De bestaande game-engine blijft intact.
Conceptueel:
ORBIT PWA
|
├── NEW: AccessController
│      |
│      +-- check existing session
│      +-- show access screen if needed
│      +-- validate access
│      +-- handle expiration
│      +-- create/refresh session
│
└── EXISTING ORBIT GAME ENGINE
       |
       +-- canvas
       +-- scanner
       +-- cognitive engine
       +-- scoring
       +-- difficulty
       +-- gameplay
============================================================
14. ACCESS VALIDATION
============================================================
De game mag NIET rechtstreeks gevoelige Firebase-configuratie of server credentials bevatten.
Gebruik:
ORBIT PWA
    |
    v
SECURE API
    |
    v
FIREBASE
    |
    v
ACCESS RESULT
Dus niet:
ORBIT PWA
    ->
direct database met gevoelige credentials
============================================================
15. ACCESS FLOW IN DE GAME
============================================================
Eerste keer:
OPEN ORBIT
    ->
ACCESS GATE
    ->
Enter access code
    ->
API validation
    ->
Firebase
    ->
valid?
    |
    +-- NO --> error
    |
    +-- YES
           ->
       create/activate session
           ->
       ORBIT GAME
Volgende keer:
OPEN ORBIT
    ->
existing valid session?
    |
    +-- YES --> GAME
    |
    +-- NO --> ACCESS GATE
============================================================
16. EXPIRATION
============================================================
Access moet tijdsgebonden kunnen zijn.
Bijvoorbeeld:
Trial started:
08-08-2026
Trial ends:
22-08-2026
Na expiration:
ACCESS EXPIRED
Your ORBIT trial has ended.
[ Continue with ORBIT ]
Deze controle moet server-side betrouwbaar zijn.
Niet uitsluitend vertrouwen op de klok van het apparaat.
============================================================
17. INVITE LINK — OPTIONEEL / TOEKOMST
============================================================
Naast codes kan later een invite-link worden gebruikt.
Bijvoorbeeld conceptueel:
orbit-platform/join/7K4P9X
De link kan:
- éénmalig zijn
- meerdere uses hebben
- aan een game gekoppeld zijn
- een trial activeren
- een expiration hebben
Na claim:
Status:
CLAIMED
Owner:
user/account
Een doorgestuurde invite-link mag daarna niet onbeperkt nieuwe accounts activeren als maxUses = 1.
============================================================
18. ADMIN CONSOLE
============================================================
Dit is een belangrijke uitbreiding.
De eigenaar/admin moet NIET handmatig in Firebase hoeven te werken.
Maak daarom een eigen:
ORBIT ADMIN
Dit is de interface waarmee de eigenaar alles beheert.
Conceptueel:
ORBIT ADMIN
Dashboard
Members
Access Codes
Games
Feedback
Settings
============================================================
19. ADMIN DASHBOARD
============================================================
Dashboard kan bijvoorbeeld tonen:
Members
Active trials
Active players
Expiring soon
Games
Feedback
Bijvoorbeeld:
MEMBERS          127
ACTIVE TRIALS     43
ACTIVE PLAYERS    81
EXPIRING SOON      7
============================================================
20. ADMIN — MEMBERS
============================================================
Admin moet members kunnen bekijken en beheren.
Velden:
- name
- email
- account status
- games
- access type
- trial start
- trial end
- subscription status
- createdAt
- last activity
Acties:
- add
- invite
- view
- disable
- revoke access
- extend trial
- reset access
- remove where appropriate
Wachtwoorden moeten NIET door de admin in plaintext worden opgeslagen of zichtbaar zijn.
Gebruik een veilige authentication-oplossing.
Bij voorkeur Firebase Authentication voor accountbeheer.
============================================================
21. ADMIN — ACCESS CODES
============================================================
Admin moet access codes kunnen aanmaken.
Voorbeeld:
[ + CREATE ACCESS ]
Game:
[ ORBIT ]
Type:
[ Trial ]
Duration:
[ 14 days ]
Maximum uses:
[ 1 ]
Expiration:
[ date ]
[ CREATE ]
Systeem genereert bijvoorbeeld:
ORBIT-7K4P-X92L
============================================================
22. ADMIN — ACCESS CODE MANAGEMENT
============================================================
Admin kan zien:
Code
Game
Type
Uses
Expires
Status
Voorbeeld:
ORBIT-7K4P
Trial
1 / 1
22 Aug
Claimed
ORBIT-92LM
Beta
0 / 1
31 Aug
Active
ORBIT-X81Q
Beta
7 / 10
31 Aug
Active
Acties:
- copy
- disable
- revoke
- extend
- inspect
============================================================
23. ADMIN — GAMES
============================================================
De admin moet later games kunnen beheren.
Voorbeeld:
ORBIT
Status: Live
Players: 81
GAME 2
Status: Coming soon
Players: 0
GAME 3
Status: Coming soon
Players: 0
Game metadata kan bevatten:
- game name
- slug
- description
- game URL
- image
- status
- access requirements
- release state
Maar:
DE GAMECODE ZELF BLIJFT IN DE EIGEN REPOSITORY.
============================================================
24. FIREBASE ROL
============================================================
Firebase is de backend/motor achter de schermen.
Admin hoeft normaal gesproken niet rechtstreeks in Firebase te werken.
Conceptuele data:
users
games
access_codes
access_grants
game_sessions
feedback
subscriptions (later)
leaderboards (later)
Firebase kan gebruiken:
Firebase Authentication
Firestore
Eventueel andere Firebase-services indien technisch nodig.
============================================================
25. MULTI-GAME DATA MODEL
============================================================
Het datamodel moet vanaf het begin multi-game-ready zijn.
Niet:
user -> ORBIT
maar:
user -> game access
Conceptueel:
users
  |
  +-- user_001
        |
        +-- game access: ORBIT
        +-- game access: GAME_2
games
  |
  +-- orbit
  +-- game_2
  +-- game_3
access_codes
  |
  +-- code_001 -> orbit
  +-- code_002 -> game_2
game_sessions
  |
  +-- user
  +-- game
  +-- session
  +-- result
============================================================
26. PLATFORM VS GAME — VERANTWOORDELIJKHEDEN
============================================================
PLATFORM:
- marketing
- uitleg
- demo
- games catalog
- accounts
- access management
- invites
- trials
- feedback
- admin
- purchase/subscription flow
- navigation
GAME:
- gameplay
- game engine
- scanner
- cognitive engine
- scoring
- difficulty
- game session
- gameplay UX
- game-specific results
FIREBASE / BACKEND:
- identity
- access
- users
- codes
- grants
- sessions
- feedback
- future commerce data
============================================================
27. GEEN DUBBELE GAME
============================================================
ABSOLUTE REGEL:
De volledige ORBIT-game mag nooit worden gekopieerd naar orbit-platform.
Als de bestaande ORBIT game 2000+ regels canvas/game-engine bevat:
NIET KOPIËREN.
Alleen:
Platform -> live ORBIT URL
De bestaande ORBIT repo blijft single source of truth.
============================================================
28. TOEKOMSTIGE APPLE/iOS ROUTE
============================================================
De architectuur moet toekomstige Apple-distributie niet blokkeren.
Huidige situatie:
ORBIT PWA
    |
    +-- iPhone Safari
    +-- Add to Home Screen
Toekomst:
ORBIT PWA / Web Game
    |
    v
native iOS wrapper / geschikte native laag
    |
    v
iPhone App
    |
    v
App Store
Capacitor of een andere geschikte oplossing kan later worden geëvalueerd.
Niet nu onnodig native bouwen.
Belangrijk:
De backend, accounts en access model moeten niet afhankelijk zijn van alleen Safari.
Dezelfde gebruiker/toegang moet later ook vanuit een iOS-app kunnen werken.
============================================================
29. UX / DESIGN PRINCIPES
============================================================
ORBIT moet premium, rustig, minimalistisch en professioneel aanvoelen.
Huidige richting:
- zwarte/donkere basis
- veel negatieve ruimte
- sterke typografie
- weinig visuele ruis
- subtiele borders
- rustige animaties
- duidelijke CTA's
- geen dashboard-overload
- geen goedkope "gaming website" uitstraling
De game zelf behoudt zijn eigen visuele identiteit.
Het platform mag verwant zijn, maar hoeft niet exact dezelfde UI te zijn.
============================================================
30. BELANGRIJKSTE CTA'S
============================================================
Voor publiek:
PRIMARY:
TRY ORBIT
SECONDARY:
EXPLORE GAMES
Voor gebruiker met toegang:
PRIMARY:
PLAY ORBIT
SECONDARY:
EXPLORE GAMES
Voor beta/trial:
ACCESS ACTIVE
PLAY ORBIT
Voor verlopen toegang:
TRIAL ENDED
CONTINUE WITH ORBIT
============================================================
31. GEWENSTE USER JOURNEYS
============================================================
A. NIEUWE BEZOEKER
Home
  ->
What is ORBIT
  ->
Try ORBIT
  ->
Free Demo
  ->
Result / experience
  ->
Try ORBIT for 14 days
  ->
Account / access
  ->
Full ORBIT
B. BETA TESTER MET CODE
Platform
  ->
Access code
  ->
Welcome back
  ->
Games
  ->
ORBIT
  ->
Play ORBIT
  ->
ORBIT PWA
  ->
existing valid session
  ->
Game
C. DIRECTE GAME LINK
Direct ORBIT PWA URL
  ->
Access Gate
  ->
valid session?
  |
  +-- YES --> Game
  |
  +-- NO --> Access
D. CODE DOORGESTUURD
User A krijgt code
  ->
User A claimt code
  ->
code status CLAIMED / usage updated
User B probeert dezelfde code
  ->
rejected if maxUses reached
============================================================
32. FASED BUILD — NIET ALLES TEGELIJK
============================================================
FASE 1 — PLATFORM PRESENTATION
Focus:
- Home
- Hero
- What is ORBIT
- Demo
- Games
- About
Doel:
Bezoeker begrijpt ORBIT en kan het ervaren.
FASE 2 — BETA ACCESS
- existing access flow verbeteren
- Games page
- ORBIT game link
- access model
- Firebase basis
- secure validation API
FASE 3 — ORBIT ACCESS GATE
Aanpassing in bestaande ORBIT PWA:
- AccessController
- session validation
- code entry
- expiration
- access denied state
NIET de game-engine herschrijven.
FASE 4 — ADMIN CONSOLE
- dashboard
- members
- access codes
- games
- feedback
- access revoke
- trial extension
FASE 5 — TRIAL
- 14-day trial
- account
- trial expiration
- conversion flow
FASE 6 — COMMERCE
Pas nadat product/usage is gevalideerd:
- purchase
- subscription
- payment provider
- entitlement management
FASE 7 — MULTI-GAME
- Game 2
- Game 3
- game-specific access
- shared account
- shared platform
FASE 8 — iOS / APP STORE
- native wrapper/evaluatie
- App Store
- account persistence
- same backend/access
============================================================
33. WAT NU NIET MOET GEBEUREN
============================================================
NIET:
- Next.js introduceren zonder noodzaak
- volledige ORBIT game kopiëren
- game-engine herschrijven
- Firebase direct vanuit publieke gamecode gebruiken voor gevoelige acties
- alleen website-toegang beveiligen
- game-URL als geheim behandelen
- alles tegelijk bouwen
- betalingen bouwen voordat de gebruikersflow is gevalideerd
- Admin afhankelijk maken van handmatig Firebase Console beheer
============================================================
34. BELANGRIJKSTE PRODUCTPRINCIPE
============================================================
De gebruiker moet ORBIT eerst kunnen ERVAREN.
Niet eerst:
- account
- code
- registratie
- betaling
maar:
DISCOVER
   ->
TRY
   ->
EXPERIENCE
   ->
WANT MORE
   ->
TRIAL
   ->
FULL ACCESS
   ->
BUY
============================================================
35. DEFINITIEVE ARCHITECTUUR IN ÉÉN OVERZICHT
============================================================
                    ORBIT PLATFORM
                          |
       +------------------+------------------+
       |                  |                  |
       v                  v                  v
     HOME               DEMO              GAMES
       |                  |                  |
       |                  |            +-----+-----+
       |                  |            |           |
       |                  |            v           v
       |                  |          ORBIT       GAME 2
       |                  |            |           |
       |                  |            |           |
       |                  +------------+-----------+
       |                               |
       v                               v
  TRIAL / ACCESS                 GAME LINK
       |                               |
       v                               v
    ACCOUNT                    ORBIT GAME PWA
       |                               |
       +---------------+---------------+
                       |
                       v
                 ACCESS CHECK
                       |
                       v
                 SECURE API
                       |
                       v
                    FIREBASE
                       |
       +---------------+----------------+
       |               |                |
       v               v                v
     USERS          ACCESS          SESSIONS
============================================================
36. DEFINITIEVE REGELS VOOR CLAUDE
============================================================
1. ORBIT Platform en ORBIT Game zijn twee afzonderlijke producten.
2. De bestaande ORBIT-game blijft in zijn bestaande repository.
3. De platformrepo bevat nooit de volledige ORBIT-gamecode.
4. Het platform linkt naar de live game.
5. De Games-pagina moet vanaf het begin multi-game-ready zijn.
6. De demo moet publiek en speelbaar zijn.
7. De volledige game kan achter toegang zitten.
8. De echte game moet zelf toegang controleren.
9. Een gedeelde game-URL mag nooit automatisch toegang geven.
10. Access codes zijn generiek en niet uitsluitend "beta codes".
11. Codes moeten expiration en usage limits ondersteunen.
12. Admin moet codes en members kunnen beheren zonder rechtstreeks Firebase te gebruiken.
13. Firebase is backend, niet de gebruikersinterface voor de eigenaar.
14. Gebruik secure server-side/API validation voor gevoelige access operations.
15. Bestaande game-engine zo veel mogelijk ongemoeid laten.
16. Voeg alleen een dunne Access Gate/AccessController toe aan de bestaande PWA.
17. Bouw niet meteen commerce als product-market fit nog niet gevalideerd is.
18. Houd 14-day trial als configureerbare mogelijkheid, niet als onwrikbare businessregel.
19. Architectuur moet meerdere games ondersteunen.
20. Architectuur moet toekomstige iPhone/App Store-distributie niet blokkeren.
21. Houd de huidige development workflow:
    iPhone -> Working Copy -> GitHub -> Vercel.
22. Geen Next.js voor het platform tenzij later een concrete technische reden ontstaat.
23. Elke nieuwe architectuurkeuze moet de eenvoud, onderhoudbaarheid en uitbreidbaarheid van het platform respecteren.
24. Werk incrementeel.
    Eerst de gebruikerservaring en customer journey goed.
    Daarna backend/access.
    Daarna admin.
    Daarna trial/commerce.
    Daarna multi-game uitbreiding.
25. Denk niet in termen van "een website bouwen".
    Denk in termen van:

    ORBIT PLATFORM
    = discovery + experience + access + games + users + future commerce.
============================================================
37. DIRECTE OPDRACHT
============================================================
Bouw niet blind alle onderdelen tegelijk.
Eerst:
1. Audit de bestaande platformcode.
2. Behoud wat al goed werkt.
3. Controleer de huidige beta-access flow.
4. Controleer de huidige Games-pagina.
5. Controleer de link naar de bestaande ORBIT PWA.
6. Maak de UX-flow logisch:
       Home -> Demo -> Trial/Access -> Games -> Play.
7. Maak onderscheid tussen:
       public demo
       authenticated/trial/beta full game.
8. Ontwerp daarna de AccessController voor de bestaande ORBIT PWA.
9. Ontwerp daarna Firebase data model + secure API.
10. Bouw daarna de Admin Console.
BELANGRIJK:
Verander de bestaande ORBIT-game alleen waar noodzakelijk voor de Access Gate.
De bestaande gameplay, Cognitive Engine, canvas-engine, scoring en difficulty logic moeten behouden blijven.
De architectuur moet klaar zijn voor:
- meerdere games
- accounts
- trials
- access codes
- admin management
- paid access
- iPhone app
- App Store
Maar bouw alleen wat op dit moment nodig is.
DOEL:
Een professionele ORBIT-productervaring waarbij:
Een onbekende bezoeker
    ->
ORBIT ontdekt
    ->
de demo echt speelt
    ->
enthousiast raakt
    ->
trial/access krijgt
    ->
de echte ORBIT-game opent
    ->
ORBIT regelmatig gebruikt
    ->
later klant wordt
    ->
en uiteindelijk ook andere ORBIT-games kan gebruiken.
============================================================
END OF MASTER SPECIFICATION
============================================================
```
