# GRD — v0.9 / World Tour
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

## v0.7 — Spotlight & Balance
- Action dock with one-click and up-to-five normal/group recruits; focus selector, persistent completion count, member collection/selection and one-member-missing alerts.
- General casting costs 1 ticket; 65% missing-member branch (if any), otherwise full pool. Group casting costs 2 tickets for up to 5 members, 1 for 6+; missing-member branch 35% (2–3), 70% (4–5), 88% (6+). All branches can still yield duplicates via the full pool. Gamble costs 5: unconditional 18% one-star, 1.8% two-star, 0.2% three-star, 80% failure.
- Group base damage = 38 × member count^1.28 × limited original-data factor. Deployed duplicate group damage factors, sorted by star then acquisition order: 100%, 72%, 50%, 35%, 27%, 20% thereafter. Shared gold upgrades and deterministic star merges retained.
- Team training: eight levels, +12 percentage points of base attack multiplier each. Costs 1500/2500/4000/6000/8500/11500/15000/19000 G. Late kill/wave gold reduced; original wave HP, timing, 18-slot capacity and three currencies unchanged.
- Nine group-specific song-title-inspired combat skills (no songs bundled); generic skill by role for additional groups. Damage/critical numbers, area bursts, skill labels, boss banners and kill streaks.
- Simulation QA: fixed seeds 21/73/119, automated recruitment/merges/upgrades/expansion, no manual positioning, optional training from R12. Final training-enabled run results: normal 3/3 clears, Davichi-only 0/3 (all R30), gamble 2/3, IZ*ONE-only 3/3, Davichi opening then general at R8 3/3. This is a small tuning sample, not a live playtest or a proof of equal balance. All nine skills, batch purchases, duplicate penalty, training and merge preservation passed logic tests.
- src/balance.js contains tuning and combat skills; src/update.css contains new UI. Existing creator studio assets retained. Deployed browser graphics/audio and mobile touch QA still pending.

## v0.8 — Creator Studio 2.0
- Server-published GRD catalog in Supabase, isolated from ITM content; GRD media bucket and independent administrator allowlist initialized from the existing ITM studio admins.
- Log in with the existing ITM administrator ID/password. Public game reads the latest published catalog on load; reset/new game reloads it. Running games keep their original snapshot. On server errors game falls back to local or bundled data.
- Image/audio upload, crop/preview, group metadata and combat/skill overrides, search, bulk JSON import/export and legacy local catalog migration. Save publishes the full snapshot using a revision check. Media is publicly readable, write access is admin-only. Removing a reference does not automatically delete the stored object.
- Initial catalog: 9 groups. No media rights or assets are assumed. Do not enter passwords in chat or commit secret keys.
- Migration SQL: supabase/grd_creator_studio_v2.sql (already applied to the existing shared project; do not rerun blindly). Database role checks passed in a rolled-back transaction. Real administrator sign-in, upload, crop and browser QA remain to be tested by the owner.

## v0.9 — World Tour
- Run setup: select up to three preferred groups and fill up to twelve from the published catalog; daily mode uses a shared KST-date server-frozen catalog and seeded random pool. Current initial catalog has nine teams; additional groups are managed in Creator Studio.
- Six modes (20/30/40/50 rounds, endless, daily), extended wave progression, six boss patterns, 11 selectable perks after nonfinal bosses, generation/agency/unit synergies, six configured hidden recipes (available only if both parent groups exist in the run pool). Hidden groups are fictional GRD combinations and require two three-star groups.
- Batch/automatic combine and merge, manual and automatic three-star lock, duplicate bench sale, next wave preview, damage totals/average DPS, end lineup, local auto-save/resume, volume controls and optional user-provided BGM, skip seen reveals.
- Independent GRD signup/login via grd-register Edge Function, separate auth namespace and app metadata, private player profile, opt-in unverified public leaderboard. Guest profile and saved games are local; signed-in profiles sync to server, run saves remain local. No permanent combat power from XP. Cosmetic gold border unlocked by a clear.
- Existing ITM login is no longer authorized for GRD editing. Create a GRD account first, then the owner must explicitly authorize that account in private.grd_studio_admins; do not auto-promote a public signup. Infrastructure remains shared, identity/content/permissions are separate.
- Three new migrations have been applied to the shared project. Logic tests cover pool/hidden recipe/synergy/augment, boss damage and summons, modes, deterministic RNG, lock, cast batch, save/restore, profile, daily snapshot and denial of ITM administrator access. Actual signed-in browser upload and full-run game balance are not yet tested. Leaderboard is client-reported, not anti-cheat verified.

## v0.9.1 — Independent display names
- New accounts choose a unique nickname (2–16 Korean/Latin letters, digits, underscore; case-insensitive uniqueness). Existing accounts choose or edit it in Producer Profile. Login ID remains unchanged and is not used as a public display name.
- Scores require the registered nickname; renaming updates previous public scores. The verified owner account has been separately authorized for GRD Studio. SQL role/rename/score tests were rolled back after verification.

## v0.9.2 — Stage Unlocks & Auto Casting
- Physical tile unlocks replace independent free placement: the original automatic placement priority is the unlock order (8/10/12/14/16/18), including the agency augment. Mint tiles are open; gray hatched lock tiles reject placement. Existing saves relocate units from newly locked tiles to open vacancies or the bench if necessary.
- Casting dock has four labeled cards, explicit per-draw/batch costs, current ticket/diamond totals, focus progress, dynamic gamble chance, and a mobile two-column layout.
- Opt-in auto casting for normal/group/gamble (one attempt per 0.8 active real-time seconds, independent of game speed). Waits for tickets and resumes automatically, stops when toggled off, mode change, game end, new run or resumed save. Pauses during dialogs/reveals, dragging, selection popup, and hidden tab. Automatic casts preserve current unit selection; targeted diamond casting remains manual.
- Logic tests passed for unlock tiers, locked-slot rejection, old save migration, agency unlock, capacity swap, all three auto casting modes, ticket limits, pause guards and selection retention. Browser visual QA not yet performed.

## Native desktop preview — NEON ENCORE
A separate real Java client is under [native/](native/README.md). The existing Pages game and Creator Studio remain unchanged. Native desktop artifacts are built by the Native desktop workflow; feature parity and mobile release are not yet complete.

## v0.9.3 — NEON ENCORE (web)
The browser edition is the primary GRD game. JavaScript/Canvas 2D and CSS deliver the new navy/mint concert arena, dimensional stage tiles, animated beams and track lighting, high-DPI rendering (up to 2x), portrait frames, combat sparks, and redesigned lobby, HUD, casting, bench, dialogs and reveal presentation. Existing game rules, accounts, studio and save data are unchanged; all existing DOM IDs and inline action bindings were retained. The separate native prototype is archived in native/ for reference, not required for playing GRD. Renderer smoke test covered high-DPI resizing, selected/dragging units, open/locked tiles, enemies and effects using a mock Canvas context; live device visual QA is separate.

## v0.9.4 — Viewport-first combat UI
Casting is permanently visible at the top of the right column on desktop (two-column button cards), independent of the collection/log tab. Selected unit actions are below casting; board, wave controls, stage expansion and bench occupy the left column. Desktop layout uses viewport height, with an independently scrolling side panel and an aspect-ratio-preserving board fitted into the remaining space. Mobile stacks casting immediately after the board and wave controls, before bench and unit details. Automatic casting/combining/evolution/lock controls are together. Canvas backing resolution uses actual CSS size × DPR × 1.35, rounded up to quarter scale and capped at 3× logical dimensions; excessive glow was reduced. All 109 prior IDs and 53 inline event bindings preserved. Resolution and markup checks passed; actual browser/device QA is separate.

## v0.10 — ENCORE EVOLUTION
- First-run contextual guidance, first round starts manually after at least one deployed unit. Subsequent waves remain automatic.
- Opt-in automation: focus/all/custom auto combination, protected target materials; vacant/power/synergy deployment, locked units preserved. Auto evolution remains optional.
- HARD/HELL/ENDLESS: MYTHIC ascension from R20 (3-star group, 8,000 G or 6,500 G for hidden, 3 diamonds), personal mastery from R25 (up to +8). Hidden creation inherits 35% of each parent's paid/inherited group enhancement investment once per parent per run; mythic units are not consumed in hidden recipes. Existing save schema is migrated with defaults.
- 40 augments (common/rare/legend), six special enemy archetypes with distinct mechanics and art, revised boss warning effects, duplicate penalties, difficulty curves and late economy. Current leaderboard remains client-reported; historical scores from prior rules are not directly comparable.
- Original SVG venue, portrait frame and enemy atlases, PixiJS 8.14.3 WebGL sprite/particle layer loaded asynchronously from pinned CDN, Canvas HD fallback uses the same artwork. Existing studio media, independent accounts, browser play and viewport-first layout remain. No shortcut/context-menu/fullscreen changes.
- Logic checks passed; initial Normal trials 11/15 clears, after higher-mode retuning HARD 3/3, HELL 2/3 and ENDLESS R52–56 (default 9-group catalog; mocked presentation, scripted strategy). Live GPU/browser testing is a separate check.

## Creator Studio 2.1
- Reusable generation, agency and country dropdown choices, with add dialogs. Extra choices persist in catalog metadataOptions after normal public save; existing group values are preserved.
- One-click combat/skill recommendations use the same base attack, interval, range and default skill profiles as the game. Type-specific fields and descriptions follow actual combat behavior; reset restores automatic defaults. No balance changes or catalog publication by the code update itself.

## v0.11 / Season 02
Manual group ultimates, quality settings, three arena skins, mobile detail sheet, explicit cloud save/restore and IndexedDB migration, Season 02 score namespace, Studio 3.0 CSV import and catalog audit, custom hidden recipes/synergy pairs and ultimate controls. Legacy rankings remain available. The balance audit is a base-stat/expected recruitment model, not a full wave simulation. Cloud saves are explicit snapshots (not simultaneous multiplayer sync).

## v0.11.2 — Premium venue and art direction
A real orthographic Three.js stadium with modeled trusses, audience, stage platforms, LED rails, PBR materials and baked high-resolution texture; three venue skins retain exact existing collision and placement geometry. Temporary WebGL rendering is disposed after baking; low quality and missing WebGL/CDN use the previous Canvas art. Original crest, concert key visual and unified UI art. No gameplay or account changes.

### v0.11.3 — Baked venue delivery
All three 1800×840 WebP renders are included as local game assets; quality settings downsample the same art instead of dropping it. Three.js is only an optional fallback when the local asset is absent. The regular art regression runs with external requests blocked. Set GRD_BAKE=1 to test the original scene generator.

## v0.12 Season 03 — Board-only economy
No bench; recruitment requires an open slot, including automatic, batch, gamble and diamond selection. Start 1,600G; normal 100G, group 100–200G, gamble 500G, base member resale 50G. Diamonds remain special currency. Prior saves convert only after confirmation; excess units settle at sale value and converted runs are excluded from new rankings. Ten-second first wave, hover stats, radial actions, sell zone, original synthesized music/SFX and independent audio toggles, automatic portrait crop with drag/wheel. No third-party NCS recordings bundled. Existing logo and full-screen reveal artwork retain original aspect ratio.

### v0.12.1 — Performance icons and quick repeat reveal
All 40 performance augments now have individual SVG pictograms, with rarity, title and effect in vertical order. Repeated group debut flash lasts 450ms (was 2.8s); only the initial 6.5s cinematic plays the registered debut track and owns the simulation pause.

### v0.12.2 — Battle polish
Removed targeted group casting (including automation); normal, gamble and diamond choice remain. Contract perk now increases missing-member probability. Repeat debut 300ms, logo only, first debut audio uses game BGM volume. Added group rank impact, role/skill/ultimate SFX, auto ultimate, wordmark, stable radial buttons, and coordinate-based drag merge. Existing locked cards remain protected. Season 03 stays active.
