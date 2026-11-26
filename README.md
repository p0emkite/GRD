# GRD — v0.6 / Loop Arena & Bench
Static K-pop random defense game. GitHub Pages: main / root.

- Game: index.html
- Creator Studio: studio.html — edit groups, members, photos, logos, full-screen debut art and audio; URL or file upload.
- Studio save is browser-local (IndexedDB, same origin). Export catalog.json and commit it at repository root for shared publication; browser-local drafts take precedence. Use only media you have rights to.
- Round clock runs automatically; next wave button unlocks after the field and pending spawns are clear.
- Member upgrades: deterministic Lv.1–8. Group evolution: two identical groups of equal star tier become one next tier (1★ + 1★ → 2★; 2★ + 2★ → 3★). No gold or chance for evolution; drag identical deployed groups together or use evolve button.
- Group-specific gold upgrades: +0 to +7, shared by all copies of that group within the run; member invested gold becomes group-specific upgrade credit. Evolution retains the shared multiplier and credit. Temporary tuning: star attack multipliers 1 / 2.5 / 6.25; gold multiplier 1 + 0.35 × upgrade level.
- First group acquisition per run (including gamble) pauses combat for up to 6.5 seconds with full-screen reveal; skip/Escape resumes. Repeat acquisitions display group logo or name with audio on field for 2.8 seconds without pausing. Unconfigured assets fall back to text; audio requires a valid registered clip and browser playback permission.
- Original SCX-derived wave values and existing game economy are unchanged except group evolution and group upgrades. Full-round balance and live browser QA remain to be done.

## Files
src/data.js — baseline groups and waves; src/catalog.js — shared catalog/storage; src/game.js — game logic; src/visuals.js — field rendering; src/reveal.js and reveal.css — debut effects; src/studio.js — creator controls; src/style.css — UI.

## v0.6 — Loop Arena & Bench
- 6 × 3 board, 18 physical tiles, one idol per tile. All tiles usable from the beginning.
- Stage level 1–6: capacity 8/10/12/14/16/18. Expansion costs 300/500/900/1500/2400 G (total 5600 G). No automatic expansion.
- Casting fills available deployment capacity, then sends new units to an unlimited bench. Bench stacks duplicates, supports sort/filter and horizontal scrolling.
- Drag between field and bench, swap at capacity, move on the field, or merge equal-tier identical groups. Tap a bench unit then a field tile to deploy/swap. Stacked duplicates can evolve using the detail panel.
- Closed clockwise track: enemies loop until killed. Life/leak system removed. Defeat at 60 enemies or a boss exceeding its 75-second individual timer. Final victory requires all 30 batches cleared.
- Existing wave HP/count, reward economy and group investment/evolution retained. Attack ranges adjusted for tile geometry; costs and boss timer provisional. Logic-only test coverage: capacity progression, cap enforcement, swap, bench return, merge, loop, defeat. Live browser QA and full-run balance not yet completed.
- src/controls.js and src/bench.css implement stage controls and bench.
