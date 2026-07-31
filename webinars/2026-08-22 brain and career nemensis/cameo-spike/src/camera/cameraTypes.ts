export type CameraMode = 'cameo' | 'hidden' | 'focus';

export type CameraPresentationState = {
  mode: CameraMode;
  returnMode: 'cameo' | 'hidden';
};

// Named by effect, not by key -- the bound key (see usePresentationHotkeys) has
// already changed twice (F, then V, both clashed with Vimium; now F9).
export type CameraModeAction =
  | { type: 'TOGGLE_HIDE' }
  | { type: 'TOGGLE_FOCUS' }
  | { type: 'EXIT_FOCUS' }
  // Dev-controls-only: force a specific mode directly, bypassing keyboard semantics.
  | { type: 'SET_MODE'; mode: CameraMode }
  // Cross-tab sync only (see cameraChannel.ts): adopt a resulting state verbatim,
  // never derived from the current state, so presenter/audience tabs always converge.
  | { type: 'SYNC_STATE'; state: CameraPresentationState };

export type CameraStreamState =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'permission-denied'
  | 'unavailable'
  | 'error';
