# macOS installation and Gatekeeper

## Why the GitHub DMG is blocked

The ViperCue 0.9.4 release has separate **Intel x64** and **Apple Silicon arm64** DMGs. Both are ad-hoc signed but **not notarized**. This project has no Developer ID signing identity, so the downloaded DMGs cannot pass Apple's Gatekeeper verification without a user exception. GitHub hosting does not sign or notarize an app. The standard “Apple cannot check” warning does not prove the app contains malware; it means Apple has not verified this build.

For a regular downloadable app that opens on other Macs without an exception, the release must be signed with an Apple **Developer ID Application** certificate, submitted to Apple's notary service, and stapled after approval. That requires an Apple Developer account and signing credentials. See [Apple's Developer ID guide](https://developer.apple.com/developer-id/) and [notarization documentation](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution).

## If you downloaded a DMG

If the alert says **“Apple cannot check [the app] for malicious software”**, and you trust this repository and the downloaded file, Apple documents this route:

1. Open the DMG and drag **ViperCue.app** to Applications. If you already chose **Move to Trash**, restore the app or download it again.
2. Try to open ViperCue once.
3. Open **System Settings → Privacy & Security**, scroll to Security, and choose **Open Anyway** for ViperCue. Confirm with your Mac password. Apple says this option is available for about an hour after the blocked open attempt.

See [Apple's official instructions](https://support.apple.com/en-us/102445). If the message instead says **“will damage your computer”** or **“is damaged and can’t be opened”**, do not use a security override or remove quarantine flags. Note the exact wording and use the source build below. Managed Macs may also enforce an organization's app policy.

Download the [arm64 DMG](https://github.com/nokibuzz/vipercue/releases/download/v0.9.4/ViperCue-0.9.4-arm64.dmg) for an M-series Mac or the [x64 DMG](https://github.com/nokibuzz/vipercue/releases/download/v0.9.4/ViperCue-0.9.4-x64.dmg) for Intel. The [release page](https://github.com/nokibuzz/vipercue/releases/tag/v0.9.4) includes SHA-256 checksums; compare them with `shasum -a 256 ~/Downloads/ViperCue-0.9.4-arm64.dmg` (or the x64 filename).

## Build and install locally (Intel or Apple Silicon)

Use **macOS 13 (Ventura) or newer** and a native Terminal with **Node.js 22.12 or newer**. [Electron 44 and later require macOS 13+](https://www.electronjs.org/docs/latest/breaking-changes/#removed-macos-12-support). On Apple Silicon, `node -p 'process.arch'` must print `arm64`. If it prints `x64`, install an arm64 Node.js and retry without Rosetta. You also need Git, CMake, and Xcode Command Line Tools. With Homebrew installed:

```bash
xcode-select --install
brew install cmake
git clone https://github.com/nokibuzz/vipercue.git
cd vipercue
npm install
npm run install:local
open "$HOME/Applications/ViperCue.app"
```

`install:local` builds the bundled Whisper binary and model and then packages ViperCue for the current Mac. It verifies that the app, Whisper, and Shift helper match the active architecture, ad-hoc signs the local app, and installs into your user-level `~/Applications` directory. A previous local copy is saved under `~/Library/Application Support/ViperCue/local-install-backups/`. The first build downloads the model and can take several minutes. The generated app is in `dist/mac/` on Intel or `dist/mac-arm64/` on Apple Silicon; the installed app is built locally and is not the downloaded GitHub DMG. Run `npm run dist:mac` separately if you also need a DMG and ZIP.

To run directly from the checkout without installing an app bundle, use `npm start` after `npm install`.

Offline Interview, Mock, and the Offline ASMA checklist need no AI account. Codex feedback uses the user's own installed Codex CLI login. Claude API and OpenAI API use the user's own provider key. See the [Codex connection guide](codex-connection.md) or [Claude API connection guide](claude-connection.md) for setup.
