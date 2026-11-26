# GRD — NEON ENCORE | Native desktop preview 0.1

Native Java 17+ desktop client, not a browser or WebView. Java2D renders an animated, scalable 1440 × 900 game scene. Combat logic lives in Battle.java, independent of Swing. This is an incremental migration: the existing web client and Creator Studio remain operational.

## Run on Windows
Install Java 17 or newer (JDK for compiling). From this directory run:
```powershell
.\build.ps1
java -jar build/GRD-Neon-Encore.jar
```
Or use the prebuilt JAR from the Native build workflow artifact. A JRE 17+ is required for the JAR. The Windows workflow also produces a portable app image including a runtime if packaging succeeds.

## Run on Linux/macOS
```sh
sh build.sh
java -jar build/GRD-Neon-Encore.jar
```
Test without opening a window: `java -jar build/GRD-Neon-Encore.jar --self-test`.
Render a deterministic native preview: `java -Djava.awt.headless=true -jar build/GRD-Neon-Encore.jar --preview preview.png`.

## Implemented
- Native landscape lobby, mode selection (Easy, Normal, Hard, Hell, Endless), 3 preferred groups + random pool up to 12.
- 18 locked/unlocked tiles, stage expansion, bench paging and drag movement/swapping/merging, casting types, batch and auto casting, selected artist stats, upgrades and shared group investment, automatic combination/merge, team training.
- Existing wave HP/rewards, loop path, boss patterns, group skills, group duplicate penalties, generation/agency/unit synergies, boss augment choices, end result.
- Animated arena lights, energy track, colored tokens, glow/hit effects, damage/crit text, full-screen debut and short repeat notice.
- Reads the public GRD catalog and HTTPS image URLs from existing Creator Studio on startup, offline bundled fallback. No Supabase secret credentials. Native client supports images readable by standard ImageIO (PNG/JPEG/GIF); unsupported formats fall back to placeholders.

## Migration boundary
This preview does not replace the v0.9.2 web client. It does not yet implement signed-in account profiles, leaderboard, daily snapshot, save/resume, hidden combinations, audio/BGM, all studio media formats, or Android/iOS targets. No native account progress is written to Supabase. Native balance is provisional and not yet validated over complete runs. Keep using the web client for those features. The pure Java combat model is designed to be reusable in a future libGDX mobile/desktop renderer. Native PC builds use standard JDK only.
