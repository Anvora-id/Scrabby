# 25: Build does nothing on some devices

Status: done
Blocked by: none

## Report (2026-09-26)

On the Vercel app (https://scrabby-two.vercel.app), pressing Build does nothing at all on some devices and works on others. In one case it took several clicks before a Build started. Which device and browser failed, and whether the "Build now?" dialog opened, is not known yet.

## Ruled out

- **The server.** A POST to `/api/agent` answers with `data: {"type":"start"}` in about 0.34 s and streams normally.
- **The "Nothing new to build" message on its own.** It hides and shows again on every other click (see below), but the user saw no message at all.

## Suspects

A split decides between them: does the "Build now?" dialog open?

**A. No dialog: `press()` throws with no visible error.**
- `press()` in `src/slots/BuildButton.tsx` is `async`, so a throw inside it becomes an unhandled rejection. The only trace is `Uncaught (in promise)` in the console.
- `buildProblem()` → `instructionDocument()` → `warnings()` can throw on unusual saved Project data. Examples: `TRAIT_TYPES[t.type].valueKind` for an unknown Trait type (`src/instructions/document.ts:31`), `t.value.trim()` on a missing value, `to!.name`, `topBlock(p)!`.
- Each browser keeps its own Project in IndexedDB. That explains why the failure is per device, and why it repeats on every click.

**B. The dialog opens, then nothing happens after Build is confirmed.**
- The button stays enabled and shows no "Building…" until the server's `start` event arrives (`src/build.ts:52`, `runBuild`).
- During that wait (IndexedDB lookup, cold start, a slow network), a second press opens the dialog again. Its confirm then does nothing, because `busy` is still true.
- `fetch('/api/agent')` has no timeout (`src/agent.ts:44`). If the request hangs before `start`, `busy` never clears. Every later Build press then does nothing until the page is reloaded.
- A throw inside `build()` only logs `The Build failed to run` to the console (`BuildButton.tsx`, `build()`).
- `readAgentStream` creates `TextDecoderStream` outside its try block (`src/agent.ts:71`). On browsers without it, the Build fails with only a console error.

**Smaller issues found on the way**
- The Build bubble hides and shows again on every other click. `press()` sets the bubble, then the window `click` listener closes it in the same click. Confirmed live: 3 clicks gave shown, hidden, shown.
- The Build button moves down 4px on press (`.button:active` in `src/slots/Build.module.css`). A press that starts in the top 4px ends outside the button, so the click is lost.
- The Preview: if the Service Worker fails to store the files, `stored` in `preview/shell.ts` never resolves, and the Preview stays blank with no message.

## Next time it happens

1. On the failing device, press Build once and note whether the "Build now?" dialog opens.
2. Open the console: F12 on desktop, `chrome://inspect` for Android, Safari Web Inspector from a Mac for an iPhone.
3. Press Build again and copy any red line. `Uncaught (in promise)` with a stack means A. `The Build failed to run`, or no error with the dialog open, means B.
4. Note the browser, its version and the device.
5. For A, use Download code or copy the Project from IndexedDB (`scrabby` → `projects`) to reproduce it locally.

## Possible fixes (not applied)

- Show "Building…" and disable the button from the confirm until `runBuild` settles.
- Catch errors in `press()` and `build()` and show them, instead of logging them only.
- Time out the wait for `start` and end it as `unreachable`.
- Ignore clicks on the Build button in the bubble's window click listener.

## Answer

- B3 covers suspect B: from the confirm until `start` the button reads "Starting…" and is disabled, a 15 s deadline ends a hanging request, and every failure before `start` is a red "did not start" card; `busy` always clears.
- A: a throw while reading the plan in `press()` shows the bubble "Something went wrong before Bob could start, so this Build didn't start." A throw while reading Bob's answer (no `TextDecoderStream`, say) or taking the files in ends on a failed card: `start` before Bob starts, `broken` after.
- The bubble no longer hides on every other click. A press that starts in the button's top 4px still clicks: a `::before` strip keeps the old top edge while it is pressed.
- The Preview shows its "can't start" card when the Service Worker doesn't store the files within 10 s.
