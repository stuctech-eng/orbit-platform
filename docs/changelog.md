# ORBIT Platform — Changelog

Bijgehouden per feature/fix, nieuwste bovenaan — staande opdracht, geen aparte aankondiging nodig.

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
