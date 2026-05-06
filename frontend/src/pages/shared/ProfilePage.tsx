import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { userService } from "@/services/userService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { toast } from "sonner";
import type { User } from "@/types/user";

const ROLE_LABEL: Record<string, string> = {
  admin: "Quản trị viên",
  teacher: "Giáo viên",
  student: "Học sinh",
};

export default function ProfilePage() {
  const { user, refresh } = useAuthStore();

  const [form, setForm] = useState({ name: "", phone: "", dob: "" });
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<User | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        phone: user.phone ?? "",
        dob: user.dob ? user.dob.slice(0, 10) : "",
      });
      setProfileData(user);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Tên không được để trống");
      return;
    }
    try {
      setLoading(true);
      const updated = await userService.updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        dob: form.dob || undefined,
      });
      setProfileData(updated);
      // sync auth store
      await refresh();
      toast.success("Cập nhật thông tin thành công");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const data = profileData ?? user;

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        {/* Avatar + tên + role */}
        <div className="flex items-center gap-4 mb-6">
          <UserAvatar name={data?.name} size="lg" />
          <div>
            <p className="text-lg font-semibold text-foreground">{data?.name}</p>
            <span className="inline-block mt-0.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {ROLE_LABEL[data?.role ?? ""] ?? data?.role}
            </span>
          </div>
        </div>

        <hr className="border-border mb-6" />

        {/* Read-only fields */}
        <div className="mb-4 space-y-1">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <p className="text-sm text-foreground font-medium">{data?.email}</p>
          <p className="text-xs text-muted-foreground">Email không thể thay đổi.</p>
        </div>

        {/* Editable form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Họ và tên</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Họ và tên"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Số điện thoại"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="dob">Ngày sinh</Label>
            <Input
              id="dob"
              name="dob"
              type="date"
              value={form.dob}
              onChange={handleChange}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
