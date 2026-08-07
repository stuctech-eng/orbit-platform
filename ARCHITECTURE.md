# ORBIT Platform — Architecture

## Hard Principle

**The platform never contains game code.**

The platform manages discovery, accounts, beta access, and community.
Every game is an independent product with its own repository, its own
release cycle, and its own URL.

```
Platform (orbit-platform)
│
├── Home
├── Games
│    ├── ORBIT  ─────────► orbit-game.vercel.app   (repo: stuctech-eng/orbit)
│    ├── Game 2 ─────────► game2.vercel.app        (repo: stuctech-eng/game-2)
│    └── Game 3 ─────────► game3.vercel.app        (repo: stuctech-eng/game-3)
│
├── Beta
├── Account
└── Feedback
```

GitHub stays one repo per product, never a monorepo:

```
orbit-platform      ← this repo — website/portal only
orbit-game          ← ORBIT itself (existing repo: stuctech-eng/orbit)
game-2              ← future game
game-3              ← future game
```

### Why

- One source of truth per game — a bugfix in ORBIT never touches this repo
- Each game deploys and versions independently
- Adding a new game to the platform is a card + metadata change here, nothing more
- If a game later moves to the App Store, the platform barely changes
- No monorepo coupling, no shared build step between products that don't need one

### What this means in practice

- `games.html` and any future game detail page link OUT to each game's own
  live URL — they never embed, iframe, or duplicate that game's source
- The demo on `pages/demo.html` is a deliberate, tiny exception: it's a
  self-contained marketing preview (~150 lines), not a copy of ORBIT's real
  engine. It shares only the visual language (Soft Pearl cells, scanner
  look), never the actual gameplay/ladder/engine code from the `orbit` repo
- If a change here ever requires editing a game's repo, that's a sign the
  boundary has been crossed — stop and reconsider

---

## Firebase schema (generic from day one)

Kept game-agnostic so adding a second or third game never requires a
migration:

```
games/{gameId}                     e.g. games/orbit, games/game2
  ├── metadata (name, url, status)
  └── settings

users/{userId}

beta_codes/{code}
  ├── games: ['orbit', 'game2']    which game(s) this code unlocks
  ├── status: active | revoked
  └── usedBy, createdAt, expires

game_sessions/{gameId}/{userId}/{sessionId}
  └── per-play session data, if a game wants it

leaderboards/{gameId}
  └── scores, per-game, never mixed across games

feedback/{id}
  └── gameId (optional — platform-level feedback has none), message, contact
```

Not built yet (Phase 2) — documented now so the shape never needs to change
when it is.

---

*This document governs `orbit-platform` only. Each game's own repository
keeps its own architecture doc (e.g. `orbit`'s `docs/ORBIT_DESIGN_BIBLE.md`).*
