import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TestListItem } from "@/types/test";

interface DeleteTestModalProps {
  test: TestListItem | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteTestModal = ({ test, onClose, onConfirm, loading = false }: DeleteTestModalProps) => {
  const open = Boolean(test);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 animate-in fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
          <div className="flex items-start justify-between gap-4 mb-4">
            <Dialog.Title className="text-base font-semibold text-foreground">
              Xóa đề thi
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-muted-foreground mb-5">
            Bạn có chắc chắn muốn xóa đề thi{" "}
            <span className="font-medium text-foreground">"{test?.name}"</span>? Hành động này
            không thể hoàn tác.
          </Dialog.Description>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={loading}>
              {loading ? "Đang xóa..." : "Xóa"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
