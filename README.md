# Geometry Jump v0.5.1

Original open-source rhythm-platformer fan project for Android. The Android host is a WebView; the game runs in a self-contained Canvas 2D engine.

## Rebuild in v0.5.1
- Replaced the previous procedural prototype with a new engine, simulation loop, UI states and stage progression.
- 12 progressive original levels, unlocks, best-progress tracking and attempt counters saved locally.
- Cube, ship, UFO and gravity-ball modes; mirror sections; mini/big portals; jump pads and interactive orbs.
- Keyboard, mouse, touch and Android hardware-key input.
- Pause, retry, level select, options/credits screens and generated sound effects.
- Responsive logical-resolution rendering, fixed-step simulation and bounded frame accumulator.
- Practice mode now saves checkpoints and respawns there after a collision.
- Ship portals now provide an initial flight buffer instead of starting at floor height.
- No remote music or runtime package dependencies; no official GD assets, layouts or music.

## Controls
- Jump: Space, Up Arrow, W, mouse or touch.
- Ship: hold the jump input to rise, release to fall.
- Ball: press to flip gravity. UFO: press for each impulse.
- Pause: P; retry: R; sound: M; hitbox overlay: H; menu: Esc or Android back.
- Mobile: tap the play area. Pause and menu controls are in the top corners.

## Historical inspiration (not an exact remake)
- 1.0: cube, spikes, blocks and gaps.
- 1.1: mirror mode.
- 1.2: gravity-ball mode.
- 1.3: blue jump pads and orbs.
- 1.4: visual variety and ship-style play.
- 1.5: UFO, pink pads/orbs, icon variety and editor improvements.

References: [update history](https://geometrydash.wiki.gg/es/wiki/Actualizaciones) and [Update 1.5](https://geometrydash.wiki.gg/wiki/Update_1.5).

## Build
- [Build Android APK workflow](https://github.com/Sfj3861/Geometry-Jump/actions)
- [Releases](https://github.com/Sfj3861/Geometry-Jump/releases)
- Android Gradle Plugin 8.7.3; Java 17; debug APK via Gradle assembleDebug.

## Versioning
App name format: Geometry Jump vX.Y.Z. This update is v0.5.1 (versionCode 7).

## License
See LICENSE and THIRD_PARTY_NOTICES.md. Unofficial fan project, not affiliated with RobTop Games.
