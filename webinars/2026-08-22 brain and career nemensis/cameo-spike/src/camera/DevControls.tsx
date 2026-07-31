import type { CameraModeAction } from './cameraTypes';

export type DevControlsProps = {
  dispatch: (action: CameraModeAction) => void;
  onRequestCamera: () => void;
};

/**
 * Development-only control panel, shown via ?controls=1. Visually separate from
 * the shared presentation content and never rendered by default.
 */
export function DevControls({ dispatch, onRequestCamera }: DevControlsProps) {
  return (
    <div className="dev-controls" data-testid="dev-controls">
      <button type="button" onClick={onRequestCamera}>
        Enable / retry camera
      </button>
      <button type="button" onClick={() => dispatch({ type: 'SET_MODE', mode: 'cameo' })}>
        Cameo
      </button>
      <button type="button" onClick={() => dispatch({ type: 'SET_MODE', mode: 'hidden' })}>
        Hide
      </button>
      <button type="button" onClick={() => dispatch({ type: 'SET_MODE', mode: 'focus' })}>
        Focus
      </button>
    </div>
  );
}
