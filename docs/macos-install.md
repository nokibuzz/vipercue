# macOS installation and Gatekeeper

## Why the GitHub DMG is blocked

The current ViperCue 0.9.0 DMG contains an **unsigned, unnotarized Intel x64 app**. The project machine has no valid Developer ID signing identity, so the published DMG cannot pass Apple's Gatekeeper checks on another Mac. GitHub hosting does not sign or notarize an app. This warning does not prove the app contains malware; it means Apple has not verified this build.

For a regular downloadable app that opens on other Macs without an exception, the release must be signed with an Apple **Developer ID Application** certificate, submitted to Apple's notary service, and stapled after approval. That requires an Apple Developer account and signing credentials. See [Apple's Developer ID guide](https://developer.apple.com/developer-id/) and [notarization documentation](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution).

## If you downloaded the Intel DMG

If the alert says **“Apple cannot check [the app] for malicious software”**, and you trust this repository and the downloaded file, Apple documents this route:

1. Open the DMG and drag **ViperCue.app** to Applications. If you already chose **Move to Trash**, restore the app or download it again.
2. Try to open ViperCue once.
3. Open **System Settings → Privacy & Security**, scroll to Security, and choose **Open Anyway** for ViperCue. Confirm with your Mac password. Apple says this option is available for about an hour after the blocked open attempt.

See [Apple's official instructions](https://support.apple.com/en-us/102445). If the message instead says **“will damage your computer”** or **“is damaged and can’t be opened”**, do not use a security override or remove quarantine flags. Note the exact wording and use the source build below. Managed Macs may also enforce an organization's app policy.

The release DMG's SHA-256 is `71948c847bcf289da2b078d130c42c5f013a42ae366fbd10f27df08f3a2e4c20`. You can compare it with `shasum -a 256 ~/Downloads/ViperCue-0.9.0.dmg`.

## Build and install locally (Intel or Apple Silicon)

Use a native Terminal and **Node.js 22.12 or newer**. On Apple Silicon, `node -p 'process.arch'` must print `arm64`. If it prints `x64`, install an arm64 Node.js and retry without Rosetta. You also need Git, CMake, and Xcode Command Line Tools. With Homebrew installed:

```bash
xcode-select --install
brew install cmake
git clone https://github.com/nokibuzz/vipercue.git
cd vipercue
npm install
npm run install:local
open "$HOME/Applications/ViperCue.app"
```

`install:local` builds the bundled Whisper binary and model and then packages ViperCue for the current Mac. It verifies that the app and Whisper match the active architecture and installs into your user-level `~/Applications` directory. A previous local copy is saved under `~/Library/Application Support/ViperCue/local-install-backups/`. The first build downloads the model and can take several minutes. The generated app is in `dist/mac/`; the app installed by this command is built locally and is not the downloaded GitHub DMG. Run `npm run dist:mac` separately if you also need a DMG and ZIP.

To run directly from the checkout without installing an app bundle, use `npm start` after `npm install`.

Offline Interview, Mock, and the Offline ASMA checklist need no AI account. Codex feedback uses the user's own installed Codex CLI login; API mode needs their own API key.
