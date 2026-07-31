import type { CameraPresentationState } from './cameraTypes';

// Spectacle's own Presenter Mode (Alt/Cmd+Shift+P, or ?presenterMode=true) opens
// a second tab/window: the audience-facing tab (shared to Teams) and the
// presenter's private notes/timer tab. Both run this same app, but only the
// audience tab may own the camera (see CameraOverlay's `isAudienceTab`) --
// C/F9/Escape are usually pressed in the *presenter* tab, so camera mode has to
// be mirrored across tabs. Spectacle syncs its own slide navigation the same
// way (see its internal useBroadcastChannel), so this mirrors that pattern
// rather than inventing a new one.
const CHANNEL_NAME = 'cameo-spike-camera-sync';

type SyncMessage = { source: string; state: CameraPresentationState };

// One random id per tab so a tab can ignore the messages it broadcast itself.
const TAB_ID = Math.random().toString(36).slice(2);

export function createCameraChannel(onRemoteState: (state: CameraPresentationState) => void) {
  if (typeof BroadcastChannel === 'undefined') {
    // Older browsers / non-browser test environments: sync is simply unavailable.
    return { broadcast: () => {}, close: () => {} };
  }

  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent<SyncMessage>) => {
    if (event.data.source === TAB_ID) return;
    onRemoteState(event.data.state);
  };

  return {
    broadcast(state: CameraPresentationState) {
      channel.postMessage({ source: TAB_ID, state } satisfies SyncMessage);
    },
    close() {
      channel.close();
    },
  };
}
