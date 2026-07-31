import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { RefObject } from 'react';
import { cameraModeReducer, initialCameraPresentationState } from './cameraModeReducer';
import { useCameraStream } from './useCameraStream';
import { usePresentationHotkeys } from '../hooks/usePresentationHotkeys';
import { createCameraChannel } from './cameraChannel';
import { MockCamera } from './MockCamera';
import { CameraPermissionPrompt } from './CameraPermissionPrompt';
import { CameraError } from './CameraError';
import { DevControls } from './DevControls';
import { MIRROR_CAMERA } from '../config/cameraConfig';
import type { CameraMode, CameraModeAction, CameraPresentationState, CameraStreamState } from './cameraTypes';
import './camera.css';

export type CameraOverlayProps = {
  mock: boolean;
  autostart: boolean;
  initialMode?: CameraMode;
  showControls?: boolean;
  onModeChange?: (mode: CameraMode) => void;
  // False in Spectacle's Presenter Mode tab: that tab still runs the reducer
  // (so it can send C/F9/Escape presses to the audience tab) and shows its own
  // local self-view preview, but the styled cameo/hidden/focus overlay that's
  // actually shared to Teams only ever renders in the audience tab.
  isAudienceTab?: boolean;
};

function buildInitialState(initialMode?: CameraMode): CameraPresentationState {
  if (!initialMode) return initialCameraPresentationState;
  return { mode: initialMode, returnMode: initialMode === 'focus' ? 'cameo' : initialMode };
}

type CameraFeedProps = {
  cameraState: CameraStreamState;
  mock: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  requestCamera: () => void;
  errorMessage: string | null;
};

function CameraFeed({ cameraState, mock, videoRef, requestCamera, errorMessage }: CameraFeedProps) {
  const showVideo = cameraState === 'ready' && !mock;
  const showMock = cameraState === 'ready' && mock;
  const showPrompt = cameraState === 'idle' || cameraState === 'requesting';
  const showError = !showMock && !showVideo && !showPrompt && errorMessage !== null;

  return (
    <>
      <video
        ref={videoRef}
        data-testid="camera-video"
        autoPlay
        playsInline
        muted
        aria-label="Presenter camera"
        className="camera-video"
        style={{
          transform: MIRROR_CAMERA ? 'scaleX(-1)' : undefined,
          display: showVideo ? 'block' : 'none',
        }}
      />
      {showMock && <MockCamera />}
      {showPrompt && <CameraPermissionPrompt requesting={cameraState === 'requesting'} onEnable={requestCamera} />}
      {showError && errorMessage && <CameraError message={errorMessage} onRetry={requestCamera} />}
    </>
  );
}

export function CameraOverlay({
  mock,
  autostart,
  initialMode,
  showControls,
  onModeChange,
  isAudienceTab = true,
}: CameraOverlayProps) {
  const [presentationState, dispatch] = useReducer(cameraModeReducer, buildInitialState(initialMode));
  // Always a real local camera (mock or otherwise) -- in the presenter tab this
  // drives a private self-view preview, independent of the synced audience mode.
  const { state: cameraState, errorMessage, videoRef, requestCamera } = useCameraStream({ mock, autostart });

  const stateRef = useRef(presentationState);
  useEffect(() => {
    stateRef.current = presentationState;
  }, [presentationState]);

  // Every locally-triggered action is resolved to a concrete resulting state
  // (not just dispatched) so the exact same state can be broadcast to the other
  // tab -- syncing the *result*, like Spectacle's own slide-sync, avoids the two
  // tabs' relative toggles ever diverging from each other.
  const channelRef = useRef<ReturnType<typeof createCameraChannel> | null>(null);
  useEffect(() => {
    const channel = createCameraChannel((remoteState) => {
      dispatch({ type: 'SYNC_STATE', state: remoteState });
    });
    channelRef.current = channel;
    return () => channel.close();
  }, []);

  const dispatchAndSync = useCallback((action: CameraModeAction) => {
    const next = cameraModeReducer(stateRef.current, action);
    dispatch({ type: 'SYNC_STATE', state: next });
    channelRef.current?.broadcast(next);
  }, []);

  usePresentationHotkeys(presentationState.mode === 'focus', dispatchAndSync);

  useEffect(() => {
    onModeChange?.(presentationState.mode);
  }, [presentationState.mode, onModeChange]);

  if (!isAudienceTab) {
    return (
      <>
        <div className="presenter-status" data-testid="presenter-status">
          Audience sees: <strong>{presentationState.mode}</strong>
        </div>
        <div className="camera-shell camera-shell--self-view" data-testid="presenter-self-view">
          <CameraFeed
            cameraState={cameraState}
            mock={mock}
            videoRef={videoRef}
            requestCamera={requestCamera}
            errorMessage={errorMessage}
          />
        </div>
        {showControls && <DevControls dispatch={dispatchAndSync} onRequestCamera={requestCamera} />}
      </>
    );
  }

  return (
    <>
      <div
        className="camera-focus-dimmer"
        data-testid="camera-focus-dimmer"
        style={{ display: presentationState.mode === 'focus' ? 'block' : 'none' }}
      />
      <div
        className="camera-shell"
        data-testid="camera-shell"
        data-mode={presentationState.mode}
        data-camera-state={cameraState}
      >
        <CameraFeed
          cameraState={cameraState}
          mock={mock}
          videoRef={videoRef}
          requestCamera={requestCamera}
          errorMessage={errorMessage}
        />
      </div>
      {showControls && <DevControls dispatch={dispatchAndSync} onRequestCamera={requestCamera} />}
    </>
  );
}
