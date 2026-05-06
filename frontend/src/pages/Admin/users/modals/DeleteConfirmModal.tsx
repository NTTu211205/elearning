import { useState } from "react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/useUserStore";
import type { User } from "@/types/user";
import { ModalContent } from "./ModalBase";

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

export function DeleteConfirmModal({ open, onClose, user }: DeleteConfirmModalProps) {
  const { deleteUser } = useUserStore();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);
    await deleteUser(user.id);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent
        title="Xác nhận xóa"
        description={`Bạn có chắc muốn xóa tài khoản "${user?.name}"? Hành động này không thể hoàn tác.`}
        onClose={onClose}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Đang xóa..." : "Xóa"}
          </Button>
        </div>
      </ModalContent>
    </Dialog.Root>
  );
}
