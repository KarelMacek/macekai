/**
 * Deterministic stand-in for the real camera feed, used in tests and local dev
 * via ?mockCamera=1 so screenshots/Playwright never depend on a physical webcam.
 * Makes cropping/mirroring visible via the LEFT/RIGHT markers.
 */
export function MockCamera() {
  return (
    <div className="mock-camera" data-testid="mock-camera">
      <span className="mock-camera__side-label mock-camera__side-label--left">LEFT</span>
      <svg
        className="mock-camera__silhouette"
        viewBox="0 0 100 100"
        role="img"
        aria-label="Mock presenter silhouette"
      >
        <circle cx="50" cy="34" r="18" fill="white" fillOpacity="0.92" />
        <path d="M14 96c2-24 18-38 36-38s34 14 36 38z" fill="white" fillOpacity="0.92" />
      </svg>
      <span className="mock-camera__side-label mock-camera__side-label--right">RIGHT</span>
      <span className="mock-camera__tag">MOCK CAMERA</span>
    </div>
  );
}
