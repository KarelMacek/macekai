# Cameo Spike

Started as a technical spike validating whether a
[Spectacle](https://github.com/FormidableLabs/spectacle) presentation with a
persistent live-webcam overlay ("Cameo") is practical for presenting a webinar
through Microsoft Teams — now also the actual webinar deck, built on top of
that validated infrastructure.

Three camera modes, toggled with `C` / `F9` / `Esc`:

- **Cameo** (default) — small rounded rect, bottom-left, 16:9, stays above all slide content.
- **Hidden** — camera stream stays alive, shell just becomes invisible (no reacquire lag on return).
- **Focus** — camera becomes the main content; current slide blurs and dims behind it.

> **Two deliberate deviations from the original spec, found by actually testing it:**
> 1. Focus toggles on **`F9`**, not `F` (Vimium claims `F`) or `V` (Vimium's
>    default `v`/`V` also collided — it enters visual/caret-selection mode).
>    Vim-style browser extensions claim most of the alphabet, so a function
>    key sidesteps the whole class of collision.
> 2. The camera is **not mirrored** (`MIRROR_CAMERA = false` in `src/config/cameraConfig.ts`).
>    The spec's default of mirrored made sense for a presenter looking at their own
>    self-view, but this feed is what *listeners* see — they need the real,
>    non-mirrored orientation. Flip the one constant back if that's ever wrong.

## Install

```bash
npm install
```

## Develop

```bash
npm run dev
```

Opens on **http://localhost:5183** (fixed port, see `vite.config.ts`).

Useful query params:

| Param | Effect |
|---|---|
| `?mockCamera=1` | Never calls `getUserMedia`; renders a deterministic mock camera instead. Use this for local dev without a webcam and for all automated tests. |
| `?autostartCamera=1` | Requests real camera access on mount instead of waiting for the "Enable camera" button. |
| `?mode=cameo\|hidden\|focus` | Sets the initial camera mode. |
| `?controls=1` | Shows a small dev-only control panel (Enable/retry, Cameo, Hide, Focus buttons). |
| `?presenterMode=true` | Spectacle's own Presenter Mode (notes/timer/next-slide preview). This tab shows a private self-view instead of the shared camera — see below. |

Example: `http://localhost:5183/?mockCamera=1&controls=1`

## Checks

```bash
npm run lint        # ESLint
npm run typecheck    # tsc -b (project references, no emit)
npm run test         # Vitest — camera mode reducer unit tests
npm run build        # typecheck + production build
npm run check        # lint && typecheck && test && build
npm run test:e2e     # Playwright, Chromium, uses ?mockCamera=1 — no webcam needed
```

`npm run test:e2e` starts its own dev server on port 5183 automatically
(reusing one if already running) — you don't need `npm run dev` running first.

> **Sandboxed Linux environments only:** if Chromium fails to launch with
> `error while loading shared libraries: libasound.so.2`, the ALSA library is
> missing and there's no root to install it. Work around it by extracting the
> `.deb` locally and pointing `LD_LIBRARY_PATH` at it, e.g.:
> `apt-get download libasound2 && dpkg -x libasound2_*.deb extracted && export LD_LIBRARY_PATH=$PWD/extracted/usr/lib/x86_64-linux-gnu`

## What was implemented

- `src/camera/cameraModeReducer.ts` — the mode state machine (`cameo` / `hidden` / `focus` + `returnMode`), unit-tested for all required transitions in `cameraModeReducer.test.ts`.
- `src/camera/useCameraStream.ts` — `getUserMedia` lifecycle: video-only, preferred 1280×720/16:9 constraints with a fallback retry on `OverconstrainedError`, stream kept in a ref (survives mode switches, never reacquired), tracks stopped on unmount, guards against duplicate concurrent requests (including React Strict Mode's dev-only double-invoke).
- `src/hooks/usePresentationHotkeys.ts` — global `C`/`F9`/`Escape`, capture-phase, modifier-safe, ignores repeats and typing targets, doesn't interfere with Spectacle's own arrow/space/page navigation.
- `src/camera/CameraOverlay.tsx` — orchestrates shell, video, mock camera, permission prompt, error state, and the optional dev control panel.
- `src/camera/MockCamera.tsx` — deterministic gradient + silhouette + LEFT/RIGHT/MOCK CAMERA markers, used whenever `?mockCamera=1` so tests never touch a real camera.
- `src/presentation/WebinarDeck.tsx` — the actual webinar deck (built from `REFINED_OUTLINE.md`), with speaker talking points in `<Notes>` per slide for Presenter Mode. Alternates dark/light backgrounds throughout, which is what originally exercised the camera's legibility over both.
- `tests/camera-mode.spec.ts`, `tests/presentation-camera.spec.ts` — Playwright, covering all scenarios from the spec (default cameo geometry, hide/show, focus from cameo/hidden, escape, C-while-focused, modifier safety, slide navigation keeping the camera mounted, console-error check, and 4 deterministic screenshots).
- `src/camera/cameraChannel.ts` + `tests/presenter-mode-sync.spec.ts` — Presenter Mode dual-tab support, see below.

## Presenter Mode (dual-tab) support

Spectacle ships its own **Presenter Mode**: `Alt/Cmd+Shift+P`, or opening a URL with `?presenterMode=true`, gives a second, private view with speaker notes (`<Notes>` on a `<Slide>`), a timer, and a next-slide preview — while the plain tab (what you share to Teams) shows just the clean deck. It's a real second browser tab, and it does **not** know anything about our camera on its own.

That raises an ownership question this spike had to solve: **only the plain (audience-facing) tab may request/own the actual camera** — you don't want two tabs fighting over the webcam, and the presenter tab's popup shouldn't leak into the shared screen. But `C`/`F9`/`Escape` are naturally pressed in whichever tab the presenter is looking at (usually the presenter-mode tab), so that tab needs to *control* a camera it doesn't *own*.

How it's solved:
- **`isAudienceTab`** (`CameraOverlay.tsx`) is `false` whenever `?presenterMode=true` is in the URL. That tab never calls `getUserMedia` for the shared feed and never renders the synced cameo/hidden/focus overlay.
- **`src/camera/cameraChannel.ts`** wraps a `BroadcastChannel` (the same primitive Spectacle itself uses internally to sync slide navigation across tabs). Every C/F9/Escape press is resolved to a concrete resulting state *before* being applied or sent — never a relative "toggle" message — so both tabs always converge to the same state regardless of which one is a step behind. `tests/presenter-mode-sync.spec.ts` opens both tabs in one browser context and proves this both directions.
- **The presenter's own tab isn't left blind.** It shows its own private self-view camera preview (bottom-right, independent of the synced mode — just a local monitoring convenience, own `getUserMedia`/mock call) and a small **"Audience sees: _mode_"** status readout, so you never have to alt-tab to know or confirm what's currently live.

Try it locally: open `http://localhost:5183/?mockCamera=1` in one tab and `http://localhost:5183/?mockCamera=1&presenterMode=true` in another (same browser, any number of tabs) — press `C`/`F9`/`Escape` in either and watch the other update.

## Two real bugs this spike caught (worth knowing before trusting the CSS)

1. Every non-focus mode rule originally included an `inset: auto;` **after** its
   `left`/`bottom` declarations — `inset` is a shorthand for all four edges, so
   it silently overwrote the specific values just set above it, and the
   camera rendered completely off-screen. Fixed by dropping the redundant
   `inset` reset.
2. Sample slide 2's theme colors made its bullet list literally invisible
   (default list text color matched the light slide's own background). Fixed
   by explicitly setting `color="secondary"` on that `UnorderedList`.
   Worth remembering if more slides get added later.

## Manual local test checklist

1. `npm install`
2. `npm run dev`
3. Open `http://localhost:5183` in current Chrome or Edge.
4. Click **Enable camera**.
5. Confirm the browser asks only for camera, not microphone.
6. Confirm the live image appears bottom-left.
7. Confirm the image is cropped cleanly with no stretching.
8. Press `C` twice — confirm hiding and restoring is instantaneous (no re-permission, no reacquire delay).
9. Press `F9` twice — confirm the blurred-slide focus mode appears and returns correctly.
10. Hide the camera (`C`), press `F9` twice, confirm it returns to **hidden**, not cameo.
11. Change slides with arrow keys in every mode — camera should never remount or change mode.
12. Resize the browser to ~1920×1080, ~1440×900, and ~1280×720 — confirm camera placement stays sensible.
13. Deny camera access (browser permission prompt) and verify the error state's message and Retry button.
14. Grant permission via Retry and confirm it recovers.
15. Refresh and verify the app behaves predictably (prompt again, since permission grants aren't state we persist across reloads by design of this spike).

## Microsoft Teams test checklist

Purpose: verify what an **attendee** actually receives, not just what the presenter sees. Automated browser tests only prove browser behavior — this is the step that actually proves Teams compatibility, and it hasn't been run by an AI, only by hand.

Recommended setup:
- Desktop Chrome or Edge for the Spectacle presentation.
- Join a Teams test meeting; use Teams for microphone audio.
- Keep Teams' own camera **off** initially so the browser owns the webcam.
- Share the browser **window** (not the whole screen, not PowerPoint Live).
- Join as an attendee from a second device/account, muted, to prevent feedback.

Test sequence:
1. Start the presentation, enable its camera.
2. Share only the browser window.
3. On the attendee device, confirm the camera is visibly embedded inside the shared presentation.
4. Navigate at least 3 slides.
5. Press `C` — attendee sees the camera disappear; press `C` again — it returns.
6. Press `F9` — attendee sees: blurred current slide, dark overlay, large camera. Press `F9` again — returns to Cameo.
7. Hide the camera, enter Focus, exit Focus — confirm it returns **hidden**, not cameo.
8. Speak — confirm audio continues through Teams normally.
9. Record ~30 seconds if possible; review for camera smoothness, readable slide text, transition quality, speech/video sync, excessive cropping, and any accidentally-shared browser/Teams chrome.

Operational notes for the real webinar:
- Open the presentation and grant camera permission **before** attendees arrive.
- Keep the browser window at the intended sharing size — avoid changing zoom after visual checks.
- `C` = "look at the content." `F9` = "look at me."
- Keep the presentation tab active while sharing.
