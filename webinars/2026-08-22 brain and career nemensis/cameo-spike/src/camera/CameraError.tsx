export type CameraErrorProps = {
  message: string;
  onRetry: () => void;
};

export function CameraError({ message, onRetry }: CameraErrorProps) {
  return (
    <div className="camera-placeholder camera-placeholder--error" data-testid="camera-error">
      <p className="camera-placeholder__text">{message}</p>
      <button type="button" className="camera-placeholder__button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
