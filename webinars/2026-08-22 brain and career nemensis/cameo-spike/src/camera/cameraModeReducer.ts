import type { CameraModeAction, CameraPresentationState } from './cameraTypes';

export const initialCameraPresentationState: CameraPresentationState = {
  mode: 'cameo',
  returnMode: 'cameo',
};

export function cameraModeReducer(
  state: CameraPresentationState,
  action: CameraModeAction,
): CameraPresentationState {
  switch (action.type) {
    case 'TOGGLE_HIDE': {
      if (state.mode === 'focus') {
        return { mode: 'hidden', returnMode: 'hidden' };
      }
      if (state.mode === 'cameo') {
        return { ...state, mode: 'hidden' };
      }
      // hidden -> cameo
      return { ...state, mode: 'cameo' };
    }
    case 'TOGGLE_FOCUS': {
      if (state.mode === 'focus') {
        return { mode: state.returnMode, returnMode: state.returnMode };
      }
      // cameo or hidden -> focus, remembering where we came from
      return { mode: 'focus', returnMode: state.mode };
    }
    case 'EXIT_FOCUS': {
      if (state.mode === 'focus') {
        return { mode: state.returnMode, returnMode: state.returnMode };
      }
      return state;
    }
    case 'SET_MODE': {
      if (action.mode === 'focus') {
        return { mode: 'focus', returnMode: state.returnMode };
      }
      return { mode: action.mode, returnMode: action.mode };
    }
    case 'SYNC_STATE':
      return action.state;
    default:
      return state;
  }
}
