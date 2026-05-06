import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubjectStore } from "@/stores/useSubjectStore";
import type { CreateSubjectPayload } from "@/stores/useSubjectStore";
import { createSchema, type CreateFormValues } from "../schemas";
import { ModalContent } from "./ModalBase";

interface CreateSubjectModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateSubjectModal({ open, onClose }: CreateSubjectModalProps) {
  const { createSubject } = useSubjectStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", lessons: 1 },
  });

  useEffect(() => {
    if (open) reset({ name: "", lessons: 1 });
  }, [open, reset]);

  const onSubmit = async (data: CreateFormValues) => {
    const payload: CreateSubjectPayload = { name: data.name, lessons: data.lessons };
    await createSubject(payload);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent
        title="Thêm môn học"
        description="Điền thông tin để tạo môn học mới"
        onClose={onClose}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cs-name" className="text-sm font-medium text-foreground">
              Tên môn học <span className="text-destructive">*</span>
            </label>
            <Input id="cs-name" placeholder="Toán học, Vật lý..." {...register("name")} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cs-lessons" className="text-sm font-medium text-foreground">
              Số buổi học <span className="text-destructive">*</span>
            </label>
            <Input
              id="cs-lessons"
              type="number"
              min={1}
              placeholder="30"
              {...register("lessons")}
            />
            {errors.lessons && <p className="text-destructive text-xs">{errors.lessons.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo..." : "Tạo môn học"}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Dialog.Root>
  );
}
