# Geometry Jump v0.6.0

Android wrapper for Famidash, the community-made Geometry Dash demake for the Nintendo Entertainment System. The previous Canvas prototype is no longer the gameplay source: the app runs the NES ROM using the JSNES emulator.

## What changed in v0.6.0
- Uses the Famidash NES ROM as the game itself rather than approximating its mechanics in a separate Canvas game.
- JSNES is bundled into the app at build time; installed builds do not need an internet connection to run the emulator.
- The release workflow downloads the Famidash Demo 5 ROM, checks its NES header and expected 786,448-byte size, and packages it into the APK.
- Adds a touchscreen NES controller, keyboard input, pause/resume, and ROM file-picker fallback.
- App display name: Geometry Jump v0.6.0 (versionCode 8).

## Controls
- Jump/action: Space, Up Arrow, W, X or the on-screen A button.
- Start: Enter or the on-screen START button.
- Directional pad: arrow keys and the on-screen D-pad. I provides D-pad Up when Up Arrow is mapped to jump.
- B: Z or the on-screen B button.
- Android back toggles pause/resume.

## Build
The CI workflows install JSNES 2.1.0 and esbuild, bundle the emulator, download and validate the ROM, then compile the APK with Java 17 and Gradle.

- [Build workflow and APK artifact](https://github.com/Sfj3861/Geometry-Jump/actions)
- [Published releases](https://github.com/Sfj3861/Geometry-Jump/releases)
- [JSNES source and Apache 2.0 licence](https://github.com/bfirsh/jsnes)
- [Famidash source and MIT licence](https://github.com/tfdsoft/famidash)

A local Android build without the CI preparation steps will show a ROM picker instead of embedding the game. To prepare it locally, run npm install, npm run build:nes, and place a compatible Famidash ROM at app/src/main/assets/famidash.nes before running Gradle.

## Attribution and scope
Famidash is a fan-made NES demake of Geometry Dash. Geometry Jump is an unofficial Android wrapper and is not affiliated with RobTop Games. See THIRD_PARTY_NOTICES.md and the bundled licence files.
