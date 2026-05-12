import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { classService } from "@/services/classService";
import type { AdminClass } from "@/services/classService";
import { editClassSchema, type EditClassFormValues } from "../schemas";
import { selectClass } from "../constants";
import { ModalContent } from "./ModalBase";
import { toast } from "sonner";

interface EditClassModalProps {
  open: boolean;
  onClose: () => void;
  cls: AdminClass | null;
  onUpdated: (updated: Pick<AdminClass, "id" | "name" | "quantity" | "status">) => void;
}

export function EditClassModal({ open, onClose, cls, onUpdated }: EditClassModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditClassFormValues>({
    resolver: zodResolver(editClassSchema),
  });

  // Populate form when modal opens with a class
  useEffect(() => {
    if (cls) {
      reset({
        name: cls.name,
        quantity: cls.quantity,
        status: cls.status,
      });
    }
  }, [cls, reset]);

  const onSubmit = async (values: EditClassFormValues) => {
    if (!cls) return;
    if (values.quantity < cls.studentCount) {
      toast.error(`Sĩ số không được nhỏ hơn số học sinh hiện tại (${cls.studentCount} học sinh)`);
      return;
    }
    try {
      await classService.update(cls.id, {
        ...values,
        // pass-through unchanged required fields
        subjectId: cls.subjectId,
        teacherId: cls.teacherId,
      });
      toast.success("Cập nhật lớp học thành công");
      onUpdated({ id: cls.id, name: values.name, quantity: values.quantity, status: values.status });
      onClose();
    } catch {
      toast.error("Cập nhật thất bại, vui lòng thử lại");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent title="Chỉnh sửa lớp học" onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Tên lớp */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Tên lớp</Label>
            <Input id="edit-name" placeholder="VD: Lớp A1" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Sĩ số tối đa */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-quantity">Sĩ số tối đa</Label>
            <Input
              id="edit-quantity"
              type="number"
              min={1}
              placeholder="VD: 40"
              {...register("quantity")}
            />
            {errors.quantity && (
              <p className="text-xs text-destructive">{errors.quantity.message}</p>
            )}
          </div>

          {/* Trạng thái */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-status">Trạng thái</Label>
            <select id="edit-status" className={selectClass} {...register("status")}>
              <option value="active">Đang hoạt động</option>
              <option value="ended">Đã kết thúc</option>
            </select>
            {errors.status && (
              <p className="text-xs text-destructive">{errors.status.message}</p>
            )}
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
