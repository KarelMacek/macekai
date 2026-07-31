export type CameraPermissionPromptProps = {
  requesting: boolean;
  onEnable: () => void;
};

export function CameraPermissionPrompt({ requesting, onEnable }: CameraPermissionPromptProps) {
  return (
    <div className="camera-placeholder" data-testid="camera-permission-prompt">
      <p className="camera-placeholder__text">
        {requesting ? 'Requesting camera access…' : 'Enable presenter camera'}
      </p>
      <button
        type="button"
        className="camera-placeholder__button"
        onClick={onEnable}
        disabled={requesting}
      >
        Enable camera
      </button>
    </div>
  );
}
