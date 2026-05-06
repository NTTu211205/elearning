import { useState } from "react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { useSubjectStore } from "@/stores/useSubjectStore";
import type { Subject } from "@/types/subject";
import { ModalContent } from "./ModalBase";

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  subject: Subject | null;
}

export function DeleteConfirmModal({ open, onClose, subject }: DeleteConfirmModalProps) {
  const { deleteSubject } = useSubjectStore();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!subject) return;
    setLoading(true);
    await deleteSubject(subject.id);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent
        title="Xác nhận xóa"
        description={`Bạn có chắc muốn xóa môn học "${subject?.name}"? Hành động này sẽ vô hiệu hóa môn học.`}
        onClose={onClose}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Đang xóa..." : "Xóa"}
          </Button>
        </div>
      </ModalContent>
    </Dialog.Root>
  );
}
