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

