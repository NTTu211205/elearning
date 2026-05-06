import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/stores/useUserStore";
import type { UpdateUserPayload } from "@/stores/useUserStore";
import type { User } from "@/types/user";
import { cn } from "@/lib/utils";
import { editSchema, type EditFormValues } from "../schemas";
import { ROLE_LABELS, dobToInputValue } from "../constants";
import { ModalContent } from "./ModalBase";

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

export function EditUserModal({ open, onClose, user }: EditUserModalProps) {
  const { updateUser } = useUserStore();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<EditFormValues>({
      resolver: zodResolver(editSchema),
      defaultValues: { name: "", email: "", phone: "", dob: "" },
    });

  useEffect(() => {
    if (open && user) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        dob: dobToInputValue(user.dob),
      });
    }
  }, [open, user, reset]);

  const onSubmit = async (data: EditFormValues) => {
    if (!user) return;
    const payload: UpdateUserPayload = {
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      dob: data.dob || undefined,
    };
    await updateUser(user.id, payload);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent
        title="Chỉnh sửa người dùng"
        description={user ? `Cập nhật thông tin cho ${user.name}` : undefined}
        onClose={onClose}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="e-name" className="text-sm font-medium text-foreground">
              Họ tên <span className="text-destructive">*</span>
            </label>
            <Input id="e-name" placeholder="Nguyễn Văn A" {...register("name")} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="e-email" className="text-sm font-medium text-foreground">
              Email <span className="text-destructive">*</span>
            </label>
            <Input id="e-email" type="email" placeholder="m@example.com" {...register("email")} />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>

          {/* Role chỉ hiển thị, không cho sửa */}
          {user && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Vai trò</label>
              <div className={cn("h-9 flex items-center px-2.5 rounded-md border border-input bg-muted text-sm text-muted-foreground")}>
                {ROLE_LABELS[user.role]}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="e-phone" className="text-sm font-medium text-foreground">Số điện thoại</label>
              <Input id="e-phone" placeholder="09xxxxxxxx" {...register("phone")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="e-dob" className="text-sm font-medium text-foreground">Ngày sinh</label>
              <Input id="e-dob" type="date" {...register("dob")} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>Lưu thay đổi</Button>
          </div>
        </form>
      </ModalContent>
    </Dialog.Root>
  );
}
