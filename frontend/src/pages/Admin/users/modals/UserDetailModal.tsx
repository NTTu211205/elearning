import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, ROLE_COLORS, formatDob } from "../constants";
import { ModalContent } from "./ModalBase";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

export function UserDetailModal({ open, onClose, user }: UserDetailModalProps) {
  if (!user) return null;

  const rows: { label: string; value: string }[] = [
    { label: "ID", value: String(user.id) },
    { label: "Họ tên", value: user.name },
    { label: "Email", value: user.email },
    { label: "Số điện thoại", value: user.phone ?? "—" },
    { label: "Ngày sinh", value: formatDob(user.dob) },
    { label: "Ngày tạo", value: user.createdAt ?? "—" },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent title="Chi tiết người dùng" onClose={onClose}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar name={user.name} size="lg" />
            <div>
              <p className="text-base font-semibold text-foreground">{user.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ROLE_COLORS[user.role])}>
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border divide-y divide-border">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center px-4 py-2.5">
                <span className="w-36 shrink-0 text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm text-foreground">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>Đóng</Button>
          </div>
        </div>
      </ModalContent>
    </Dialog.Root>
  );
}
