import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { FALLBACK_VIDEO_CONSTRAINTS, PREFERRED_VIDEO_CONSTRAINTS } from '../config/cameraConfig';
import type { CameraStreamState } from './cameraTypes';

const PERMISSION_DENIED_MESSAGE = 'Camera access was denied. Allow camera access in the browser and try again.';
const NO_DEVICE_MESSAGE = 'No camera was found.';
const UNAVAILABLE_MESSAGE = 'The camera could not be opened. Close other apps using it and try again.';
const INSECURE_CONTEXT_MESSAGE = 'Camera access requires localhost or HTTPS.';

export type UseCameraStreamOptions = {
  mock: boolean;
  autostart: boolean;
};

export type UseCameraStreamResult = {
  state: CameraStreamState;
  errorMessage: string | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  requestCamera: () => void;
};

export function useCameraStream({ mock, autostart }: UseCameraStreamOptions): UseCameraStreamResult {
  const [state, setState] = useState<CameraStreamState>(mock ? 'ready' : 'idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const requestInFlightRef = useRef(false);

  const attachStreamToVideo = useCallback((stream: MediaStream) => {
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    stream.getVideoTracks().forEach((track) => {
      track.addEventListener('ended', () => {
        streamRef.current = null;
        setState('error');
        setErrorMessage(UNAVAILABLE_MESSAGE);
      });
    });
  }, []);

  const requestCamera = useCallback(() => {
    if (mock) {
      setState('ready');
      setErrorMessage(null);
      return;
    }
    if (requestInFlightRef.current || streamRef.current) {
      setState('ready');
      return;
    }
    if (typeof window === 'undefined' || !window.isSecureContext) {
      setState('error');
      setErrorMessage(INSECURE_CONTEXT_MESSAGE);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unavailable');
      setErrorMessage(NO_DEVICE_MESSAGE);
      return;
    }

    requestInFlightRef.current = true;
    setState('requesting');
    setErrorMessage(null);

    navigator.mediaDevices
      .getUserMedia(PREFERRED_VIDEO_CONSTRAINTS)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'OverconstrainedError') {
          return navigator.mediaDevices.getUserMedia(FALLBACK_VIDEO_CONSTRAINTS);
        }
        throw err;
      })
      .then((stream) => {
        attachStreamToVideo(stream);
        setState('ready');
      })
      .catch((err: unknown) => {
        console.error('[camera] getUserMedia failed', err);
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError') {
            setState('permission-denied');
            setErrorMessage(PERMISSION_DENIED_MESSAGE);
            return;
          }
          if (err.name === 'NotFoundError') {
            setState('unavailable');
            setErrorMessage(NO_DEVICE_MESSAGE);
            return;
          }
        }
        setState('error');
        setErrorMessage(UNAVAILABLE_MESSAGE);
      })
      .finally(() => {
        requestInFlightRef.current = false;
      });
  }, [mock, attachStreamToVideo]);

  useEffect(() => {
    // Mock mode's 'ready' state is already set by useState's initializer above.
    if (mock) return;
    if (autostart) {
      // Intentional one-time mount action (?autostartCamera=1), not a state-sync effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      requestCamera();
    }
    // Autostart/mock only need to run once on mount; requestCamera is stable enough in practice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mock, autostart]);

  // Re-attach the held stream if the <video> element remounts (e.g. mode switch swaps DOM structure).
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  });

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  return { state, errorMessage, videoRef, requestCamera };
}
