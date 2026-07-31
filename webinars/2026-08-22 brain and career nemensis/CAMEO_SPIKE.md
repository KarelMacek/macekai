Spectacle is an actively maintained React presentation library. Use a Vite React TypeScript project, browser camera access through `getUserMedia()`, and Playwright for real-browser interaction tests. Camera access requires permission and a secure context; `localhost` counts as secure. ([GitHub][1])

Paste this directly into Claude Code:

```text
Build a minimal but polished technical spike: a Spectacle presentation with a PowerPoint-Cameo-like live webcam embedded into the presentation.

The objective is to validate whether this setup is practical for presenting a webinar through Microsoft Teams.

Do not build the actual webinar content. Build only enough sample slides and infrastructure to test the presentation experience efficiently.

Do not ask me questions. Choose sensible defaults, implement the complete spike, run all available automated checks, and then give me the exact commands and a short manual testing checklist.

==================================================
1. CORE USER EXPERIENCE
==================================================

Create a Spectacle presentation with a persistent live-camera layer.

The camera has three presentation modes:

1. CAMEO MODE
   - Default mode.
   - Live camera appears in the bottom-left corner.
   - Rounded rectangle, not a circle.
   - Approximately 20% of the presentation viewport width.
   - 16:9 aspect ratio.
   - Camera image should use object-fit: cover.
   - Give it a subtle light border and strong but tasteful shadow.
   - It must remain above all Spectacle slide content.
   - It must not move when slides change.

2. HIDDEN MODE
   - Camera is visually hidden.
   - The webcam MediaStream must remain active.
   - Do not stop and reacquire the camera when switching modes.
   - Returning to Cameo or Focus mode should therefore be immediate.
   - The video element should remain mounted.

3. FOCUS MODE
   - This means: “Now I am the main content.”
   - The current presentation slide remains visible in the background.
   - Blur the slide significantly.
   - Slightly scale the blurred slide so blurred edges do not appear.
   - Add a dark translucent overlay over the slide.
   - Show the camera as a very large rounded rectangle above it.
   - Leave a small visible margin around the camera so the blurred slide
     can still be perceived.
   - Target geometry:
       left/right margin: approximately 4vw
       top/bottom margin: approximately 4vh
   - Camera should fill the resulting area using object-fit: cover.
   - The result should feel cinematic and intentional, not like a debug view.

Use short CSS transitions of approximately 200–250 ms. Respect
prefers-reduced-motion.

==================================================
2. KEYBOARD CONTROLS
==================================================

Implement these global keyboard shortcuts:

C:
- Cameo mode -> Hidden mode
- Hidden mode -> Cameo mode
- Focus mode -> Hidden mode

F:
- From Cameo mode -> Focus mode
- From Hidden mode -> Focus mode
- From Focus mode -> return to the mode active before entering Focus mode

Escape:
- When in Focus mode, return to the mode active before entering Focus mode.
- Outside Focus mode, do not interfere with Spectacle or browser behavior.

Keyboard requirements:

- Handle uppercase and lowercase identically.
- Ignore repeated keydown events.
- Do not activate shortcuts while the user is typing inside:
  input, textarea, select, or contenteditable.
- Do not activate shortcuts when Ctrl, Meta, or Alt is pressed.
  For example, Ctrl+F must remain browser Find.
- Register the listener in capture mode so the C and F shortcuts win over
  possible presentation-level handlers.
- For handled C/F events, call preventDefault and stopPropagation.
- Do not break Spectacle navigation using arrow keys, Page Up, Page Down,
  Space, or other normal controls.

Implement the mode behavior as a small explicit reducer or state machine.
Do not spread mode transition logic across multiple components.

Suggested state:

type CameraMode = 'cameo' | 'hidden' | 'focus';

type CameraPresentationState = {
  mode: CameraMode;
  returnMode: 'cameo' | 'hidden';
};

Suggested transitions:

C:
- focus -> hidden, returnMode hidden
- cameo -> hidden
- hidden -> cameo

F:
- cameo -> focus, returnMode cameo
- hidden -> focus, returnMode hidden
- focus -> returnMode

Escape:
- focus -> returnMode
- otherwise unchanged

Write unit tests for these transitions.

==================================================
3. CAMERA IMPLEMENTATION
==================================================

Use navigator.mediaDevices.getUserMedia.

Request video only. Never request microphone access because Teams should remain
responsible for webinar audio.

Preferred initial constraints:

{
  audio: false,
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    aspectRatio: { ideal: 16 / 9 },
    facingMode: 'user'
  }
}

If this request fails because the constraints cannot be satisfied, retry once
with:

{
  audio: false,
  video: true
}

The video element must have:

- autoPlay
- playsInline
- muted
- srcObject assigned directly to the MediaStream
- an accessible label
- object-fit: cover

Mirror the camera horizontally by default because this is a presenter-facing
experience. Put the setting in one obvious constant so it can easily be
changed later.

Camera lifecycle:

- Do not request the same stream multiple times concurrently.
- Store the active MediaStream in a ref.
- Keep the stream alive when the camera is hidden.
- Stop every MediaStreamTrack when the camera component unmounts.
- Also handle a track ending unexpectedly.
- Avoid React Strict Mode causing two simultaneous camera requests.
- Provide a restart/retry action after an error.
- Do not repeatedly prompt for permission after an error unless the user
  explicitly clicks Retry.

Camera states:

- idle
- requesting
- ready
- permission-denied
- unavailable
- error

Handle at least these cases:

- navigator.mediaDevices is missing
- insecure context
- NotAllowedError
- NotFoundError
- NotReadableError
- OverconstrainedError
- generic unexpected error

User-facing messages should be short and useful:

Permission denied:
“Camera access was denied. Allow camera access in the browser and try again.”

No device:
“No camera was found.”

Camera unavailable:
“The camera could not be opened. Close other apps using it and try again.”

Insecure context:
“Camera access requires localhost or HTTPS.”

Do not expose raw exception details in the presentation UI. Log useful
technical details to the console in development.

==================================================
4. CAMERA PERMISSION FLOW
==================================================

Do not immediately throw an ugly browser permission prompt over an unexplained
presentation.

Initially show a small, polished camera placeholder in the Cameo position with:

- text: “Enable presenter camera”
- one button: “Enable camera”

The first click should request camera permission.

After permission has previously been granted during the same page session,
switching modes must not require further interaction.

For quick development, support an optional query parameter:

?autostartCamera=1

When present, request camera access on mount.

Default behavior without this parameter must use the explicit Enable button.

==================================================
5. TEST AND MOCK MODE
==================================================

Automated tests must not require a physical webcam or camera permission.

Add:

?mockCamera=1

In mock-camera mode:

- Never call getUserMedia.
- Render a deterministic mock-camera surface inside the exact same camera
  shell.
- The mock surface should make cropping and mirroring visible.
- Use a simple generated visual:
    - colored gradient
    - centered presenter silhouette or initials
    - visible “LEFT” and “RIGHT” markers
    - small “MOCK CAMERA” label
- Do not use a remote image.
- Keep it deterministic for screenshot tests.

Also support:

?mode=cameo
?mode=hidden
?mode=focus

These parameters set the initial visual mode for development and screenshots.

Add:

?controls=1

When enabled, show a small development-only control panel with buttons:

- Enable/retry camera
- Cameo
- Hide
- Focus

The control panel must not appear by default and must be visually separate
from the shared presentation content.

==================================================
6. SPECTACLE PRESENTATION
==================================================

Use the currently installed public Spectacle API. Inspect the package types or
official examples rather than guessing deprecated APIs.

Create at least five sample slides:

1. Dark title slide
2. Light slide with a heading and short bullet list
3. Slide with a large diagram-like layout
4. Visually busy slide to test camera legibility
5. Final slide with minimal content

The slides exist only to test:

- Cameo contrast over light and dark backgrounds
- Bottom-left placement
- Focus-mode blur
- Slide navigation
- Camera persistence between slides
- Camera rendering during transitions

Use a 16:9 presentation layout.

Wrap the Spectacle Deck in a presentation layer:

<div data-testid="presentation-layer">
  <Deck>...</Deck>
</div>

Place the camera layer outside this element so blur applied to the
presentation layer never blurs the camera.

Do not remount the camera when the active slide changes.

The focus-mode structure should effectively be:

root
├── presentation layer
│   └── Spectacle Deck
├── focus dimmer
└── camera layer

==================================================
7. VISUAL SPECIFICATION
==================================================

Use CSS, CSS modules, or styled components already compatible with the
project. Do not add Tailwind solely for this spike.

Suggested Cameo CSS:

position: fixed;
left: clamp(18px, 2.2vw, 42px);
bottom: clamp(18px, 2.2vh, 36px);
width: clamp(220px, 20vw, 440px);
aspect-ratio: 16 / 9;
border-radius: clamp(16px, 1.5vw, 28px);
overflow: hidden;
background: #090b10;
border: 3px solid rgba(255, 255, 255, 0.82);
box-shadow:
  0 24px 70px rgba(0, 0, 0, 0.42),
  0 4px 16px rgba(0, 0, 0, 0.3);
z-index: 1001;

Suggested Focus CSS:

position: fixed;
inset: 4vh 4vw;
width: auto;
height: auto;
aspect-ratio: auto;
border-radius: clamp(20px, 2vw, 36px);
z-index: 1001;

Focus background:

presentation layer:
filter: blur(18px);
transform: scale(1.035);

dimmer:
position: fixed;
inset: 0;
background: rgba(4, 8, 18, 0.58);
z-index: 1000;

Camera:
z-index: 1001;

The camera shell should carry:

data-testid="camera-shell"
data-mode="cameo|hidden|focus"
data-camera-state="idle|requesting|ready|permission-denied|unavailable|error"

The presentation layer should carry:

data-testid="presentation-layer"
data-focus-active="true|false"

Hidden mode:

- Keep the component mounted.
- Use opacity: 0 and visibility: hidden.
- Disable pointer events.
- Do not use display: none if it causes video interruption.
- Ensure it cannot accidentally cover slide controls while hidden.

==================================================
8. PROJECT STRUCTURE
==================================================

Use a clear structure similar to:

src/
  App.tsx
  main.tsx

  presentation/
    WebinarDeck.tsx
    presentationTheme.ts
    presentation.css

  camera/
    CameraOverlay.tsx
    CameraPermissionPrompt.tsx
    CameraError.tsx
    MockCamera.tsx
    useCameraStream.ts
    cameraModeReducer.ts
    cameraTypes.ts
    camera.css

  hooks/
    usePresentationHotkeys.ts

  config/
    cameraConfig.ts

  test/
    setup.ts

tests/
  camera-mode.spec.ts
  presentation-camera.spec.ts

Names can vary slightly, but keep camera acquisition, presentation state, and
visual rendering separated.

Do not introduce Redux, Zustand, a backend, or any other unnecessary
architecture.

==================================================
9. AUTOMATED TESTING
==================================================

Set up:

- TypeScript checking
- ESLint
- unit tests using Vitest
- React Testing Library where appropriate
- Playwright for browser-level interaction tests

Add package scripts:

npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run check

npm run check should run:

1. lint
2. typecheck
3. unit tests
4. production build

Playwright may remain a separate command if browser installation makes it too
slow for every check.

Unit-test the complete camera mode reducer:

- cameo + C -> hidden
- hidden + C -> cameo
- focus + C -> hidden
- cameo + F -> focus, return cameo
- hidden + F -> focus, return hidden
- focus + F -> stored return mode
- focus + Escape -> stored return mode
- non-focus + Escape -> unchanged

Playwright tests must run using mockCamera=1.

Required browser tests:

1. DEFAULT CAMEO
   - Open /?mockCamera=1
   - Camera shell is visible.
   - data-mode is cameo.
   - Camera width is between 18% and 22% of viewport width at 1920×1080,
     unless constrained by the specified min/max.
   - Camera is in the lower-left quadrant.
   - Aspect ratio is approximately 16:9.

2. HIDE AND SHOW
   - Press C.
   - Camera mode becomes hidden.
   - Element remains in the DOM.
   - Press C again.
   - Camera returns to cameo.

3. FOCUS FROM CAMEO
   - Press F.
   - Camera mode becomes focus.
   - Presentation layer reports focus active.
   - Dimmer is visible.
   - Camera occupies at least 85% of viewport width and 75% of viewport
     height.
   - Press F.
   - Return to cameo.

4. FOCUS FROM HIDDEN
   - Press C to hide.
   - Press F.
   - Camera becomes focus.
   - Press F again.
   - Camera returns to hidden, not cameo.

5. ESCAPE
   - Enter focus from cameo.
   - Press Escape.
   - Return to cameo.

6. C WHILE FOCUSED
   - Enter focus.
   - Press C.
   - Camera becomes hidden.
   - Focus blur and dimmer disappear.

7. MODIFIER SAFETY
   - Press Control+F.
   - Application mode does not change.
   - Press Meta+F where supported.
   - Application mode does not change.

8. PRESENTATION NAVIGATION
   - Record identifying text from the first slide.
   - Press ArrowRight.
   - Verify the second slide appears.
   - Verify the camera shell remains mounted.
   - Verify camera mode remains unchanged.
   - Repeat while in Cameo mode and after exiting Focus mode.

9. CONSOLE
   - Fail the test on unexpected console errors.
   - Mock-camera mode should not generate media-device errors.

10. VISUAL SCREENSHOTS
   Capture deterministic screenshots at 1920×1080 for:
   - Cameo mode on dark slide
   - Cameo mode on light slide
   - Hidden mode
   - Focus mode

Disable or neutralize CSS animations in screenshot tests.

Use stable data-testid selectors instead of brittle CSS selectors.

==================================================
10. MANUAL LOCAL TEST CHECKLIST
==================================================

Add this checklist to README.md:

Local browser test:

1. Run npm install.
2. Run npm run dev.
3. Open the localhost URL in current Chrome or Edge.
4. Click Enable camera.
5. Confirm the browser asks only for camera, not microphone.
6. Confirm the live image appears bottom-left.
7. Confirm the image is cropped cleanly and has no stretching.
8. Press C twice.
9. Confirm hiding and restoring is instantaneous.
10. Press F twice.
11. Confirm the blurred-slide focus mode appears and returns correctly.
12. Hide the camera, press F twice, and confirm it returns to hidden.
13. Change slides with arrow keys in every mode.
14. Resize the browser to approximately:
    - 1920×1080
    - 1440×900
    - 1280×720
15. Confirm camera placement remains useful.
16. Deny camera access and verify the error state.
17. Restore browser permission and verify Retry works.
18. Refresh and verify the app behaves predictably.

==================================================
11. MICROSOFT TEAMS TEST CHECKLIST
==================================================

Add a separate Teams checklist to README.md.

The purpose is to verify what an attendee actually receives, not merely what
the presenter sees.

Recommended setup:

- Use desktop Chrome or Edge for the Spectacle presentation.
- Join a Teams test meeting.
- Use Teams for microphone audio.
- Keep Teams camera off for the initial test so the browser can own the webcam.
- Share the browser presentation window itself.
- Do not use PowerPoint Live for this test.
- Join the meeting from a second device or second account as an attendee.
- Mute the second device to prevent feedback.

Test sequence:

1. Start the Spectacle presentation and enable its camera.
2. Share only the browser window containing the presentation.
3. On the attendee device, confirm the camera is visibly embedded inside the
   shared presentation.
4. Navigate through at least three slides.
5. Press C and confirm the attendee sees the camera disappear.
6. Press C and confirm it returns.
7. Press F and confirm the attendee sees:
   - blurred current slide
   - dark overlay
   - large camera
8. Press F and confirm it returns to Cameo mode.
9. Hide camera, enter Focus, exit Focus, and confirm it returns hidden.
10. Speak and confirm audio continues through Teams.
11. Record approximately 30 seconds if recording is available.
12. Review the recording for:
    - camera smoothness
    - readable slide text
    - transition quality
    - synchronization between speech and video
    - excessive camera cropping
    - any browser or Teams UI accidentally included in the shared window

Document likely operational guidance:

- Open the presentation before the webinar.
- Grant camera permission before attendees arrive.
- Keep the browser window at the intended sharing size.
- Use C for “look at the content.”
- Use F for “look at me.”
- Avoid changing browser zoom after visual checks.
- Keep the presentation tab active while sharing.

==================================================
12. NON-GOALS
==================================================

Do not implement:

- microphone capture
- recording
- streaming infrastructure
- OBS integration
- PowerPoint export
- PDF export
- presenter notes
- audience polls
- camera device picker
- draggable camera positioning
- resizable camera
- multiple camera layouts
- backend services
- authentication
- webinar content
- production deployment

These can be considered only after this spike proves useful.

==================================================
13. IMPLEMENTATION ORDER
==================================================

Work in this order to minimize wasted effort:

1. Inspect the existing directory and package manager.
2. Check the installed Node version.
3. Scaffold or adapt a Vite React TypeScript project.
4. Install Spectacle.
5. Create the sample Deck.
6. Implement the reducer and test it.
7. Implement mock-camera rendering.
8. Implement Cameo, Hidden, and Focus layouts.
9. Implement keyboard shortcuts.
10. Add Playwright tests using mockCamera=1.
11. Implement real getUserMedia camera acquisition.
12. Add error and permission states.
13. Run lint, typecheck, tests, build, and Playwright.
14. Fix all failures.
15. Update README.
16. Report results.

Do not begin real-camera work until the visual state machine works using the
mock camera.

==================================================
14. DEFINITION OF DONE
==================================================

The spike is done only when:

- npm run check passes.
- Playwright tests pass in Chromium.
- Production build succeeds.
- Spectacle slide navigation still works.
- Camera component remains mounted across slide navigation and visual modes.
- C and F behave exactly as specified.
- Focus mode returns to the correct previous state.
- Automated tests require no webcam.
- Real-camera mode works on localhost after permission is granted.
- The camera never requests microphone permission.
- README contains exact local and Teams test instructions.
- There are no unexplained console errors.
- No unnecessary features or dependencies were added.

At the end, output:

1. A concise summary of what was implemented.
2. The resulting file structure.
3. Exact commands to run:
   - installation
   - development
   - checks
   - Playwright
4. Results of each check you actually ran.
5. Any limitation you observed.
6. The five-minute manual test sequence I should perform next.

Do not claim that Teams integration works unless it was manually tested in
Teams. Automated browser tests prove only the browser presentation behavior.
```

[1]: https://github.com/formidablelabs/spectacle "GitHub - FormidableLabs/spectacle: A React-based library for creating sleek presentations using JSX syntax that gives you the ability to live demo your code. · GitHub"
