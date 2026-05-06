import { Dialog } from "radix-ui";
import { X } from "lucide-react";

export function ModalOverlay() {
  return (
    <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 animate-in fade-in-0" />
  );
}

export function ModalContent({ children, title, description, onClose }: {
  children: React.ReactNode;
  title: string;
  description?: string;
  onClose: () => void;
}) {
  return (
    <Dialog.Portal>
      <ModalOverlay />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <Dialog.Title className="text-base font-semibold text-foreground">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="text-sm text-muted-foreground mt-0.5">
                {description}
              </Dialog.Description>
            )}
          </div>
          <Dialog.Close asChild>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Đóng"
            >
              <X className="size-4" />
            </button>
          </Dialog.Close>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
