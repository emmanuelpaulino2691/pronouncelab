import { Button } from "./Button";
import { Dialog } from "./Dialog";

type ConfirmDeleteDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  isDeleting: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteDialog({
  isOpen,
  title,
  description,
  isDeleting,
  errorMessage,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      description={description}
      preventClose={isDeleting}
      className="max-w-lg"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            disabled={isDeleting}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </>
      }
    >
      {errorMessage && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errorMessage}
        </p>
      )}
      <p className="text-sm leading-6 text-slate-700">
        This action cannot be undone.
      </p>
    </Dialog>
  );
}
