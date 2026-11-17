## Native Intel and Apple Silicon previews

This release has separate macOS DMGs for Intel (`x64`) and Apple Silicon (`arm64`). The arm64 app, local Whisper speech engine, and Shift helper are built together on an Apple Silicon runner. Both packages pass automated tests, architecture checks, local code-signature verification, and a synthetic speech transcription smoke test.

The DMGs use ad-hoc signatures because this project does not yet have an Apple Developer ID certificate. They are **not notarized**. macOS Gatekeeper may show an "Apple cannot check" warning for a downloaded DMG. Follow the [macOS installation guide](https://github.com/nokibuzz/vipercue/blob/main/docs/macos-install.md) for Apple's Open Anyway procedure or build from source on your Mac. Do not override a "will damage your computer" warning.

Native Apple Silicon package behavior still needs a live workshop test on a user's Mac. Please report the Mac chip, macOS version, and exact warning or crash message if installation or audio capture fails.
