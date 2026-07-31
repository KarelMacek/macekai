import { describe, expect, it } from 'vitest';
import { cameraModeReducer } from './cameraModeReducer';
import type { CameraPresentationState } from './cameraTypes';

function state(mode: CameraPresentationState['mode'], returnMode: CameraPresentationState['returnMode']): CameraPresentationState {
  return { mode, returnMode };
}

describe('cameraModeReducer', () => {
  it('cameo + TOGGLE_HIDE -> hidden', () => {
    const result = cameraModeReducer(state('cameo', 'cameo'), { type: 'TOGGLE_HIDE' });
    expect(result.mode).toBe('hidden');
  });

  it('hidden + TOGGLE_HIDE -> cameo', () => {
    const result = cameraModeReducer(state('hidden', 'cameo'), { type: 'TOGGLE_HIDE' });
    expect(result.mode).toBe('cameo');
  });

  it('focus + TOGGLE_HIDE -> hidden, returnMode hidden', () => {
    const result = cameraModeReducer(state('focus', 'cameo'), { type: 'TOGGLE_HIDE' });
    expect(result.mode).toBe('hidden');
    expect(result.returnMode).toBe('hidden');
  });

  it('cameo + TOGGLE_FOCUS -> focus, return cameo', () => {
    const result = cameraModeReducer(state('cameo', 'cameo'), { type: 'TOGGLE_FOCUS' });
    expect(result.mode).toBe('focus');
    expect(result.returnMode).toBe('cameo');
  });

  it('hidden + TOGGLE_FOCUS -> focus, return hidden', () => {
    const result = cameraModeReducer(state('hidden', 'hidden'), { type: 'TOGGLE_FOCUS' });
    expect(result.mode).toBe('focus');
    expect(result.returnMode).toBe('hidden');
  });

  it('focus + TOGGLE_FOCUS -> stored return mode (cameo)', () => {
    const result = cameraModeReducer(state('focus', 'cameo'), { type: 'TOGGLE_FOCUS' });
    expect(result.mode).toBe('cameo');
  });

  it('focus + TOGGLE_FOCUS -> stored return mode (hidden)', () => {
    const result = cameraModeReducer(state('focus', 'hidden'), { type: 'TOGGLE_FOCUS' });
    expect(result.mode).toBe('hidden');
  });

  it('focus + Escape -> stored return mode', () => {
    const result = cameraModeReducer(state('focus', 'hidden'), { type: 'EXIT_FOCUS' });
    expect(result.mode).toBe('hidden');
  });

  it('non-focus + Escape -> unchanged', () => {
    const before = state('cameo', 'cameo');
    const result = cameraModeReducer(before, { type: 'EXIT_FOCUS' });
    expect(result).toEqual(before);
  });

  it('hidden + Escape -> unchanged', () => {
    const before = state('hidden', 'cameo');
    const result = cameraModeReducer(before, { type: 'EXIT_FOCUS' });
    expect(result).toEqual(before);
  });

  it('SYNC_STATE adopts the given state verbatim, ignoring the current one', () => {
    const before = state('cameo', 'cameo');
    const incoming = state('focus', 'hidden');
    const result = cameraModeReducer(before, { type: 'SYNC_STATE', state: incoming });
    expect(result).toEqual(incoming);
  });
});
