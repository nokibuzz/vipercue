# Connect Claude API to ViperCue

ViperCue uses the Claude Messages API with **your own Anthropic Console API key**. It does not need the Claude Code CLI. A Claude.ai subscription login is not a connection option for third-party apps; Anthropic directs product developers to API key authentication. See [Anthropic's credential-use guidance](https://code.claude.com/docs/en/legal-and-compliance#authentication-and-credential-use).

1. Create a workspace-scoped API key in the [Anthropic Console](https://platform.claude.com/settings/keys). API usage is billed to your Console account separately from a Claude.ai subscription.
2. In ViperCue, select **Interview → Live → CLAUDE API** or **Feedbacker → CLAUDE API**.
3. Paste the key into **ANTHROPIC API KEY** and click **TEST CLAUDE CONNECTION**. The test checks access to the fast Claude Haiku model without generating an answer.
4. Start the session. ViperCue transcribes speech locally, then sends the detected question, optional experience profile, and relevant previous question to the Claude API. In Feedbacker, it sends the ASMA prompt with the captured workshop speech. Answers stream back to the overlay; token counts and timing stay in local history.

The key is held in app memory only for the active session and is cleared from the input after the session starts. It is not written to local history or the repository. ViperCue does not show your account's remaining balance; use the [Claude Console Usage page](https://platform.claude.com/usage) for provider-side usage and cost details. If the connection test fails, report the error text without sharing the API key.
