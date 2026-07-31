import { useMemo, useState } from 'react';
import { WebinarDeck } from './presentation/WebinarDeck';
import { CameraOverlay } from './camera/CameraOverlay';
import type { CameraMode } from './camera/cameraTypes';
import './App.css';

function useQueryParams(): URLSearchParams {
  return useMemo(() => new URLSearchParams(window.location.search), []);
}

function parseInitialMode(params: URLSearchParams): CameraMode | undefined {
  const raw = params.get('mode');
  if (raw === 'cameo' || raw === 'hidden' || raw === 'focus') return raw;
  return undefined;
}

export default function App() {
  const params = useQueryParams();
  const mock = params.get('mockCamera') === '1';
  const autostart = params.get('autostartCamera') === '1';
  const showControls = params.get('controls') === '1';
  const initialMode = useMemo(() => parseInitialMode(params), [params]);
  // Spectacle's own Presenter Mode ("Alt/Cmd+Shift+P" or ?presenterMode=true)
  // is a second tab for the presenter's private notes/timer view. Only the
  // *other* tab (the plain one, shared to Teams) may own the camera.
  const isAudienceTab = params.get('presenterMode') !== 'true';

  const [mode, setMode] = useState<CameraMode>(initialMode ?? 'cameo');

  return (
    <div className="app-root">
      <WebinarDeck focusActive={mode === 'focus'} />
      <CameraOverlay
        mock={mock}
        autostart={autostart}
        initialMode={initialMode}
        showControls={showControls}
        onModeChange={setMode}
        isAudienceTab={isAudienceTab}
      />
    </div>
  );
}
