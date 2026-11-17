# ViperCue · visual walkthrough

ViperCue is a floating macOS interview companion with an animated viper-head mark. English is the default interface; Serbian is available for the interface, transcription, questions, and prepared answers.

## Meet-style concept scene

![ViperCue illustrative video interview](images/08-meet-promo.png)

This is a composed product illustration, not a recording of a Meet call. It shows a fictional AI-generated interviewer labeled John Doe, an edited portrait supplied by the creator labeled Peter Neuner, and an actual ViperCue interface capture. The original personal photo is not part of this repository. The editable layout is [meet-promo.html](meet-promo.html).

## Start a session

| Live setup | Mock setup |
| --- | --- |
| ![Live setup](images/01-setup.png) | ![Offline Mock setup](images/02-mock-setup.png) |

Live answers can use a local Markdown library, the user's own Codex CLI login, or an API key entered at runtime. Mock uses the microphone and the [bilingual practice deck](../src/data/mock-interview.md) with zero AI answer tokens.

## See the question and answer

| Live example | Mock practice example |
| --- | --- |
| ![Live question and suggested answer](images/03-live-en.png) | ![Mock question, spoken response and prepared answer](images/04-mock-practice.png) |

These are interface captures populated with demonstration content. They are not recordings of a real interview. In Mock, click **Start Mock**, answer aloud, use **Show Answer**, then **Next Question**. Voice commands include “show answer,” “next question,” and “start MOC” to repeat the current prompt.

## Review a session

![Example local analytics](images/05-dashboard-demo.png)

The dashboard image uses illustrative values. In use, the app computes the live answer count, token totals, average and 90th-percentile wait, recognition and answer times, and a separate practice summary from local history.

## Share a selected browser tab

![Illustrative local display and selected-tab stream](images/07-selected-tab-comparison.png)

This comparison combines a real Google.com tab screenshot with an actual ViperCue window screenshot. It is an **illustration of selected-tab sharing**, not a live Meet attendee capture. Google account controls, links, and avatar were hidden in the source tab image. Select a tab or window and inspect the meeting preview. Entire-screen sharing on macOS may include the overlay even with Electron content protection; see the [Electron API note](https://www.electronjs.org/docs/latest/api/browser-window/#winsetcontentprotectionenable-macos-windows).

The editable source for this comparison is [share-comparison.html](share-comparison.html).
