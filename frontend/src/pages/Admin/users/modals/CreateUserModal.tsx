import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/stores/useUserStore";
import type { CreateUserPayload } from "@/stores/useUserStore";
import { createSchema, type CreateFormValues } from "../schemas";
import { selectClass } from "../constants";
import { ModalContent } from "./ModalBase";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateUserModal({ open, onClose }: CreateUserModalProps) {
  const { createUser } = useUserStore();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<CreateFormValues>({
      resolver: zodResolver(createSchema),
      defaultValues: { name: "", email: "", role: "student", password: "", phone: "", dob: "" },
    });

  useEffect(() => {
    if (open) reset({ name: "", email: "", role: "student", password: "", phone: "", dob: "" });
  }, [open, reset]);

  const onSubmit = async (data: CreateFormValues) => {
    const payload: CreateUserPayload = {
      name: data.name,
      email: data.email,
      role: data.role,
      password: data.password,
      phone: data.phone || undefined,
      dob: data.dob || undefined,
    };
    await createUser(payload);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent title="Thêm người dùng" description="Điền thông tin để tạo tài khoản mới" onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-name" className="text-sm font-medium text-foreground">
              Họ tên <span className="text-destructive">*</span>
            </label>
            <Input id="c-name" placeholder="Nguyễn Văn A" {...register("name")} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-email" className="text-sm font-medium text-foreground">
              Email <span className="text-destructive">*</span>
            </label>
            <Input id="c-email" type="email" placeholder="m@example.com" {...register("email")} />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-password" className="text-sm font-medium text-foreground">
              Mật khẩu <span className="text-destructive">*</span>
            </label>
            <Input id="c-password" type="password" placeholder="Tối thiểu 6 ký tự" {...register("password")} />
            {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-role" className="text-sm font-medium text-foreground">
              Vai trò <span className="text-destructive">*</span>
            </label>
            <select id="c-role" className={selectClass} {...register("role")}>
              <option value="student">Học sinh</option>
              <option value="teacher">Giáo viên</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="c-phone" className="text-sm font-medium text-foreground">Số điện thoại</label>
              <Input id="c-phone" placeholder="09xxxxxxxx" {...register("phone")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="c-dob" className="text-sm font-medium text-foreground">Ngày sinh</label>
              <Input id="c-dob" type="date" {...register("dob")} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>Tạo tài khoản</Button>
          </div>
        </form>
      </ModalContent>
    </Dialog.Root>
  );
}
