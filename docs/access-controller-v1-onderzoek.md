# AccessController v1 — Onderzoeksplan

**Status: Onderzoek, GEEN implementatie. Vastgelegd 8 augustus 2026.**

Volgens Master Specification §37, stap 8: eerst het contract bepalen
tussen Platform → ORBIT-game → Firebase, vóórdat er ook maar één regel
in de bestaande `orbit`-game-repository verandert.

## Kernontwerpregel (gebruiker, letterlijk)

> De platformlaag bepaalt wie toegang heeft. De game bepaalt vóór het
> spelen of die toegang geldig is.

En:

> De game mag nooit zelf beta-codes beheren. Dus geen tweede
> beta-code-systeem in ORBIT.

## Contractdiagram

```
USER
 │
 ▼
ORBIT PLATFORM
 │
 │ geldige beta-code
 │
 ▼
ACCESS SESSION
 │
 │ signed/validated session
 ▼
ORBIT GAME
 │
 ├── valid → PLAY
 │
 └── invalid/expired → ACCESS DENIED
```

## De tien onderzoeksvragen (nog te beantwoorden, in deze volgorde)

1. **Hoe wordt de beta-sessie momenteel opgeslagen?**
   Bekend, deels: `localStorage.orbit_beta_session` op het platform,
   vorm `{code, games: [...]}`. Nog te onderzoeken: is dit voldoende
   voor een cryptografisch te valideren sessie, of moet dit veranderen?

2. **Welke gegevens geeft Firebase terug bij een geldige code?**
   Te onderzoeken in `api/check-code.js` en het `beta_codes/{code}`-
   document zelf — welke velden zijn er al (status, games, expires),
   welke ontbreken voor sectie 16 (expiration) van de spec?

3. **Hoe lang is een sessie geldig?**
   Nog niet vastgelegd nergens — geen `expiresAt` op de huidige
   lokale sessie. Vergt een besluit: sessie-duur, en of dat per
   code-type (beta/trial/paid) kan verschillen (spec §10-11).

4. **Hoe wordt een gebruiker geïdentificeerd?**
   Op dit moment: geen account-systeem, alleen een code in
   localStorage. Onderzoeken: is een lichte vorm van identiteit nodig
   (bijv. een device-ID) vóór er cryptografisch gevalideerd kan
   worden, of kan de sessie zelf als enige identiteit dienen?

5. **Hoe kan ORBIT de sessie cryptografisch/server-side valideren?**
   De kern van de AccessController. Te onderzoeken: een signed token
   (bijv. JWT) uitgegeven door een platform-API, geverifieerd door een
   nieuwe, kleine API-route in de `orbit`-repo zelf — zonder dat de
   game rechtstreeks Firebase-credentials nodig heeft (spec §14).

6. **Wat gebeurt er bij verlopen/ingetrokken toegang?**
   Spec §16 geeft het gewenste scherm ("ACCESS EXPIRED... Continue
   with ORBIT"). Te ontwerpen: waar checkt de game dit — bij elke
   sessie-start, of periodiek tijdens het spelen?

7. **Wat gebeurt er als iemand alleen de directe game-URL opent?**
   Spec §12/13 kernvraag. Antwoord moet zijn: AccessController
   toont een toegangsscherm, geen automatische toegang — dit is de
   kern van waarom dit onderzoek bestaat (zie Audit, punt 2).

8. **Wat gebeurt er als iemand de URL doorstuurt naar iemand anders?**
   Spec §12: de URL zelf mag nooit toegang geven. Te bevestigen dat de
   AccessController dit al afdekt zodra vraag 5 een ontwerp heeft —
   geen apart mechanisme nodig als de sessie zelf al aan het apparaat/
   de sessie gebonden is, niet aan de URL.

9. **Hoe kunnen toekomstige games dezelfde infrastructuur hergebruiken?**
   Het Firebase-schema is al game-agnostisch (`games/{gameId}`,
   `beta_codes` met een `games`-array). Te onderzoeken: kan de
   AccessController zelf ook als herbruikbare, kleine module
   ontworpen worden (bijv. één klein script dat elke toekomstige game
   kan importeren), zodat Game 2/3 niet elk hun eigen versie bouwen?

10. **Hoe voorkom je dat de bestaande ORBIT-engine verbouwd moet worden?**
    **Essentieel, letterlijk uit de opdracht:** de AccessController
    moet vóór de game-engine zitten, niet erin verweven worden. Te
    ontwerpen: een duidelijke, dunne grens — bijv. de
    AccessController rendert zijn eigen scherm en roept de bestaande
    game pas aan (of toont 'm pas) na een geslaagde check, zonder ook
    maar één bestaande functie in de Cognitive Engine/canvas-engine
    aan te raken.

## Wat dit document NIET doet

Geen van deze tien vragen wordt hier beantwoord — dat is de volgende
stap, ná akkoord op dit onderzoeksplan. Geen code, geen wijziging aan
`orbit-platform` of `orbit`.

## Volgende stap

Elke vraag hierboven één voor één beantwoorden, met bewijs uit de
bestaande code (niet aannemen) — resultaat wordt "AccessController
v1 — Technisch Ontwerp", een apart document. Pas na akkoord van de
gebruiker op dát ontwerp mag er code in de `orbit`-repo veranderen.
