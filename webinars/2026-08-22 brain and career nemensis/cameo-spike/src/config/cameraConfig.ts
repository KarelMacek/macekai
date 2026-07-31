// Video is shown to listeners, not the presenter's own self-view, so it must NOT
// be mirrored -- attendees should see the real orientation. Flip via this one constant.
export const MIRROR_CAMERA = false;

export const PREFERRED_VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    aspectRatio: { ideal: 16 / 9 },
    facingMode: 'user',
  },
};

export const FALLBACK_VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: true,
};
