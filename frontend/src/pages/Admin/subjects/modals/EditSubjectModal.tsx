import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubjectStore } from "@/stores/useSubjectStore";
import type { UpdateSubjectPayload } from "@/stores/useSubjectStore";
import type { Subject } from "@/types/subject";
import { editSchema, type EditFormValues } from "../schemas";
import { ModalContent } from "./ModalBase";

interface EditSubjectModalProps {
  open: boolean;
  onClose: () => void;
  subject: Subject | null;
}

export function EditSubjectModal({ open, onClose, subject }: EditSubjectModalProps) {
  const { updateSubject } = useSubjectStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", lessons: 1 },
  });

  useEffect(() => {
    if (open && subject) {
      reset({ name: subject.name, lessons: subject.lessons });
    }
  }, [open, subject, reset]);

  const onSubmit = async (data: EditFormValues) => {
    if (!subject) return;
    const payload: UpdateSubjectPayload = { name: data.name, lessons: data.lessons };
    await updateSubject(subject.id, payload);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent
        title="Chỉnh sửa môn học"
        description={subject ? `Cập nhật thông tin cho môn "${subject.name}"` : undefined}
        onClose={onClose}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="es-name" className="text-sm font-medium text-foreground">
              Tên môn học <span className="text-destructive">*</span>
            </label>
            <Input id="es-name" placeholder="Toán học, Vật lý..." {...register("name")} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="es-lessons" className="text-sm font-medium text-foreground">
              Số buổi học <span className="text-destructive">*</span>
            </label>
            <Input
              id="es-lessons"
              type="number"
              min={1}
              {...register("lessons")}
            />
            {errors.lessons && <p className="text-destructive text-xs">{errors.lessons.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Dialog.Root>
  );
}
