# Automatic question gate

The app transcribes audio locally so it can decide whether a spoken segment is an interview question. It does not send each segment to Codex or the OpenAI API. The gate is implemented in [`src/question-gate.cjs`](../src/question-gate.cjs).

## States

| State | Behavior |
| --- | --- |
| Open | Direct substantive questions can start the interview immediately. Greetings and check-ins are ignored. |
| Introduction | Company or product introductions and agenda statements keep the app waiting; questions in this phase do not request answers. |
| Interview | Substantive questions request an answer; short repeat requests leave the existing answer visible. |

The gate enters **Interview** on a spoken transition such as “Let's move to my questions” or “Pređimo na pitanja.” The **Start questions** button can enter Interview if the transition is implicit. Manual Shift capture bypasses the phase gate for the captured segment. No fixed time offset is used.

This is a heuristic. Speech recognition errors, unannounced transitions and ambiguous prompts can still cause missed or unwanted suggestions. Future examples should be anonymized and turned into small expected-behavior tests rather than copied into the app or public repository.
