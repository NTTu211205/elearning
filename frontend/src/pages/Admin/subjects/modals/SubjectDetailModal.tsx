import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import type { Subject } from "@/types/subject";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS } from "../constants";
import { ModalContent } from "./ModalBase";

interface SubjectDetailModalProps {
  open: boolean;
  onClose: () => void;
  subject: Subject | null;
}

export function SubjectDetailModal({ open, onClose, subject }: SubjectDetailModalProps) {
  if (!subject) return null;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "ID", value: String(subject.id) },
    { label: "Tên môn học", value: subject.name },
    { label: "Số buổi học", value: `${subject.lessons} buổi` },
    {
      label: "Trạng thái",
      value: (
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
            STATUS_COLORS[subject.status]
          )}
        >
          {STATUS_LABELS[subject.status]}
        </span>
      ),
    },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent title="Chi tiết môn học" onClose={onClose}>
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border divide-y divide-border">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center px-4 py-2.5">
                <span className="w-36 shrink-0 text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm text-foreground">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </ModalContent>
    </Dialog.Root>
  );
}
