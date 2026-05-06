import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore"
import { useNavigate } from "react-router";
import { getDefaultPathByRole } from "@/lib/roleRouting";

// tạo một zod schema để validate form
const SignInSchema = z.object({
  email: z.email("Vui lòng nhập email hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

// tham chiếu kiểu dữ liệu của form từ zod schema
type SignInFormValues = z.infer<typeof SignInSchema>;

// tạo component form đăng nhập
export function SignInForm({ className, ...props }: React.ComponentProps<"form">) {

  const { signIn } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // sử dụng react-hook-form để quản lý trạng thái và validate form
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInFormValues>({
    resolver: zodResolver(SignInSchema),
  });

  const onSubmit = async (data: SignInFormValues) => {
    const { email, password } = data;
    const isSuccess = await signIn(email, password);

    if (!isSuccess) {
      return;
    }

    const role = useAuthStore.getState().user?.role;
    navigate(getDefaultPathByRole(role), { replace: true });
  };

  return (
    <form className={cn("flex flex-col gap-4", className)} {...props} 
    onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="text-2xl font-bold leading-tight text-foreground">
            Đăng nhập vào tài khoản của bạn
          </div>
          <div className="text-sm text-balance text-muted-foreground">
            Ứng dụng elearning dành cho giáo viên và học sinh
          </div>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            {...register("email")}
            className="bg-background"
          />
          {errors.email && (
                  <p className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
                )}
        </Field>
        <Field> 
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              {...register("password")}
              className="bg-background pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <a
            href="#"
            className="block text-right text-sm underline-offset-4 hover:underline"
          >
            Quên mật khẩu?
          </a>
          {errors.password && (
                  <p className="text-destructive text-sm">
                    {errors.password.message}
                  </p>
                )}
        </Field>
        <Field>
          <Button type="submit" disabled={isSubmitting}>Đăng nhập</Button>
        </Field>
        <p className="text-center text-sm text-muted-foreground">
          © 2026 LMS Pro. All rights reserved.
        </p>
      </FieldGroup>
    </form>
  )
}
