# Connect ViperCue to Codex CLI

ViperCue uses the **Codex CLI installed on this Mac**. It does not use the Codex session from another computer and does not ask you to paste a token. Mock mode uses only the bundled question deck, so choose **Interview → Live** or **Feedbacker** to use Codex.

1. In Terminal on the same Mac, run:

   ```bash
   command -v codex
   codex --version
   codex login status
   ```

2. `command -v codex` should print an absolute path, such as `/opt/homebrew/bin/codex`. If it prints nothing, install the [Codex CLI](https://learn.chatgpt.com/docs/codex/cli) and open a new Terminal window. If `codex login status` does not report ChatGPT sign-in, run `codex login` and complete the browser sign-in with the ChatGPT account you intend to use. A Codex CLI login using an API key is a different billing method and is not accepted by ViperCue's Codex option.
3. In ViperCue 0.9.2 or later, select **Interview → Live → CODEX** (or **Feedbacker → CODEX**). Click **TEST CODEX CONNECTION**. If automatic detection fails, paste the exact path from step 1 into **CODEX CLI PATH**, or use **BROWSE…**, then test again. The path is saved locally on this Mac. Start the session after the connection test succeeds.

ViperCue first checks the selected path, then common macOS locations including `/opt/homebrew/bin/codex`, `/usr/local/bin/codex`, and `~/.local/bin/codex`. An app opened from Finder often has a different `PATH` from Terminal, and a Homebrew installation under a custom prefix may need the explicit path. An older executable in a standard location can also be selected accidentally; entering the path from `command -v codex` removes that ambiguity.

If `codex login status` reports ChatGPT but ViperCue still fails, report the **exact ViperCue error**, the output of the three commands above, and whether you opened the app from Finder or Terminal. Redact any email address or user name before sharing. **Never share** `~/.codex/auth.json`, an API key, or a login token.
