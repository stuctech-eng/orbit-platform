# ORBIT Platform

Portal/website voor het ORBIT-ecosysteem. Beheert discovery, accounts, beta-toegang en community — bevat zelf nooit gamecode. Zie `ARCHITECTURE.md` voor de volledige harde regel en het Firebase-schema.

Live games linken altijd naar hun eigen repo/URL (bijv. ORBIT zelf: `stuctech-eng/orbit`).

---

## 🎯 Actieve Roadmap — lees dit eerst bij een nieuwe sessie

**Vastgelegd 8 augustus 2026, na de Master Specification v1.0
(`docs/orbit-platform-master-spec-v1.md`, leidende referentie — lees
die vóór je iets bouwt).** Bij elke nieuwe sessie: dit blok eerst
lezen, dan verder bij "Volgende stap", niet opnieuw om richting vragen.

### Voortgang tegen de Master Spec (§37, "Directe opdracht")
- [x] **Stap 1-5 — Audit.** Zie `docs/audit-2026-08-08.md`. Twee gaten
      gevonden: `games.html` miste een "Play ORBIT"-link; de echte
      `orbit`-game heeft geen enkele toegangscontrole (direct
      speelbaar op `https://orbit-rho-ruby.vercel.app/`, bevestigd
      getest).
- [x] **Stap 6 — UX-flow logisch maken (deel 1: portal).**
      `games.html` toont nu dynamisch **Play ORBIT** (geldige lokale
      beta-sessie) of **Enter beta code** (geen sessie), naast
      "Try the demo" die altijd zichtbaar blijft. **Harde grens,
      letterlijk gerespecteerd:** alleen `games.html` gewijzigd — geen
      wijziging aan `beta.html`/`check-code.js`/Firebase-schema/de
      echte `orbit`-game/de demo. Game-URL centraal in dit ene bestand
      (niet verspreid hardcoded). Getest: alle vijf localStorage-
      scenario's gesimuleerd (leeg/lege string/kapotte JSON/geldige
      sessie/sessie zonder code) — alle vijf correct.
      **Nadrukkelijk: dit is UX/navigatie, GEEN beveiliging** —
      localStorage is client-side aanpasbaar. De echte controle moet
      in de game zelf komen (zie hieronder).
- [ ] **Stap 8 — AccessController ontwerpen.**
      Onderzoeksplan met de tien te beantwoorden vragen staat klaar:
      `docs/access-controller-v1-onderzoek.md`. **Nog niet
      beantwoord, nog geen code.** Dit vergt eerst antwoorden op alle
      tien vragen (hoe wordt de sessie opgeslagen, hoe lang geldig,
      cryptografische validatie, wat bij een directe game-URL, etc.),
      dan een apart "Technisch Ontwerp"-document, en pas ná
      goedkeuring code in de `orbit`-repo.
- [ ] Stap 9 — Firebase data model + secure API voor access-validatie
      uitbreiden (expiration, revocation) — volgt uit stap 8
- [ ] Stap 10 — Admin Console — Fase 4, nog niet gestart

### Volgende stap
De tien onderzoeksvragen uit `docs/access-controller-v1-onderzoek.md`
één voor één beantwoorden, met bewijs uit de bestaande code — geen
aannames. Resultaat: een apart "AccessController v1 — Technisch
Ontwerp"-document. **Pas na expliciet akkoord van de gebruiker op dát
ontwerp mag er code in de `orbit`-game-repo veranderen** — dat repo
blijft tot dan toe volledig onaangeraakt.

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

**Fase 3 — ORBIT Access Gate (gestart 8 augustus 2026)**

- `games.html` — dynamische Play ORBIT/Enter beta code-link ✅ live, zie roadmap hierboven
- AccessController in de echte `orbit`-game — ⏳ onderzoeksfase, zie roadmap hierboven

### Volgende stap (oorspronkelijk, nu verwerkt in de roadmap-sectie bovenaan)

~~Fase 2 basis staat. Mogelijke vervolgstappen: extra beta-codes,
account.html uitbreiden, rate-limiting overwegen.~~ Zie "🎯 Actieve
Roadmap" bovenaan dit document voor de actuele, geldende volgende stap.

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
docs/
  orbit-platform-master-spec-v1.md
  audit-2026-08-08.md
  access-controller-v1-onderzoek.md
  changelog.md
```
