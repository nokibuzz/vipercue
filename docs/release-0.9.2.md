## Codex CLI connection fix

ViperCue can now use a Codex CLI installed under a custom Homebrew prefix or another nonstandard path. Select **Interview → Live → CODEX** or **Feedbacker → CODEX**, paste the path from `command -v codex` into **CODEX CLI PATH**, then click **TEST CODEX CONNECTION**. The selected path is saved locally and reused for answer generation and usage checks. Connection errors now identify whether the executable is missing or the CLI is not signed in with ChatGPT.

The Intel (`x64`) and Apple Silicon (`arm64`) DMGs remain ad-hoc signed and are **not notarized**. Follow the [macOS installation guide](https://github.com/nokibuzz/vipercue/blob/main/docs/macos-install.md) if Gatekeeper shows the standard “Apple cannot check” warning. Do not override a “will damage your computer” warning. See the [Codex connection guide](https://github.com/nokibuzz/vipercue/blob/main/docs/codex-connection.md) for setup and safe diagnostics.
