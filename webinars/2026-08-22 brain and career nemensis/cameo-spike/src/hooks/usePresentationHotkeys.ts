import { useEffect, useRef } from 'react';
import type { CameraModeAction } from '../camera/cameraTypes';

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (EDITABLE_TAGS.has(target.tagName)) return true;
  return target.isContentEditable;
}

/**
 * Global C / F9 / Escape shortcuts for the camera overlay.
 * Focus toggles on F9, not a letter key -- Vimium (and similar vim-style
 * extensions) claims most of the alphabet (f/F, v/V, hjkl, r/R, t, etc.),
 * so a function key sidesteps that whole class of collision.
 * Registered in the capture phase so it wins over Spectacle's own key handling,
 * while still leaving Spectacle's arrow/space/page navigation untouched.
 */
export function usePresentationHotkeys(isFocusMode: boolean, dispatch: (action: CameraModeAction) => void) {
  const isFocusModeRef = useRef(isFocusMode);

  useEffect(() => {
    isFocusModeRef.current = isFocusMode;
  }, [isFocusMode]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if (key === 'c') {
        event.preventDefault();
        event.stopPropagation();
        dispatch({ type: 'TOGGLE_HIDE' });
        return;
      }

      if (key === 'f9') {
        event.preventDefault();
        event.stopPropagation();
        dispatch({ type: 'TOGGLE_FOCUS' });
        return;
      }

      if (event.key === 'Escape') {
        // Outside focus mode, stay out of Spectacle/browser's way entirely.
        if (!isFocusModeRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        dispatch({ type: 'EXIT_FOCUS' });
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [dispatch]);
}
