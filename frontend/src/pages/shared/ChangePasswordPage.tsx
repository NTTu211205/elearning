import { useState } from "react";
import { userService } from "@/services/userService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleShow = (field: keyof typeof show) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      toast.error("Vui lòng điền đầy đủ các trường");
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (form.oldPassword === form.newPassword) {
      toast.error("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }

    try {
      setLoading(true);
      await userService.changePassword(form.oldPassword, form.newPassword);
      toast.success("Đổi mật khẩu thành công");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đổi mật khẩu thất bại";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Đổi mật khẩu</h1>
            <p className="text-xs text-muted-foreground">Cập nhật mật khẩu đăng nhập của bạn</p>
          </div>
        </div>

        <hr className="border-border mb-6" />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Old password */}
          <div className="space-y-1">
            <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
            <div className="relative">
              <Input
                id="oldPassword"
                name="oldPassword"
                type={show.old ? "text" : "password"}
                value={form.oldPassword}
                onChange={handleChange}
                placeholder="Nhập mật khẩu hiện tại"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                onClick={() => toggleShow("old")}
                tabIndex={-1}
                aria-label="Toggle visibility"
              >
                {show.old ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={show.new ? "text" : "password"}
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Ít nhất 6 ký tự"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                onClick={() => toggleShow("new")}
                tabIndex={-1}
                aria-label="Toggle visibility"
              >
                {show.new ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={show.confirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
                className={`pr-10 ${
                  form.confirmPassword && form.confirmPassword !== form.newPassword
                    ? "border-destructive"
                    : ""
                }`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                onClick={() => toggleShow("confirm")}
                tabIndex={-1}
                aria-label="Toggle visibility"
              >
                {show.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {form.confirmPassword && form.confirmPassword !== form.newPassword && (
              <p className="text-xs text-destructive">Mật khẩu xác nhận không khớp</p>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
