type ConfirmationModalProps = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  return (
    <div className="confirmation-modal" role="presentation" onClick={onCancel}>
      <div
        className="confirmation-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        aria-describedby="confirmation-modal-description"
        onClick={event => event.stopPropagation()}
      >
        <h3 id="confirmation-modal-title">{title}</h3>
        <p id="confirmation-modal-description">{description}</p>
        <div className="confirmation-modal__actions">
          <button type="button" className="archive-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="archive-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}