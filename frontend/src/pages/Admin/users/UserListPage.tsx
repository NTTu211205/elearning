import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Eye, Pencil, Trash2, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/stores/useUserStore";
import type { CreateUserPayload, UpdateUserPayload } from "@/stores/useUserStore";
import type { User, Role } from "@/types/user";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Chuyển đổi yyyy-mm-dd (từ DB) → dd-mm-yyyy để hiển thị */
function formatDob(dob?: string): string {
  if (!dob) return "—";
  const parts = dob.split("-");
  if (parts.length !== 3) return dob;
  const [y, m, d] = parts;
  return `${d}-${m}-${y}`;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<Role, string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  admin: "Admin",
};

const ROLE_COLORS: Record<Role, string> = {
  student: "bg-blue-100 text-blue-700",
  teacher: "bg-purple-100 text-purple-700",
  admin: "bg-orange-100 text-orange-700",
};

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2, "Họ tên ít nhất 2 ký tự"),
  email: z.email("Email không hợp lệ"),
  role: z.enum(["student", "teacher", "admin"]),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
  phone: z.string().optional(),
  dob: z.string().optional(),
});

const editSchema = z.object({
  name: z.string().min(2, "Họ tên ít nhất 2 ký tự"),
  email: z.email("Email không hợp lệ"),
  phone: z.string().optional(),
  dob: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;

// ─── Reusable styled select ───────────────────────────────────────────────────

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

// ─── Modal base ──────────────────────────────────────────────────────────────

function ModalOverlay() {
  return (
    <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 animate-in fade-in-0" />
  );
}

function ModalContent({ children, title, description, onClose }: {
  children: React.ReactNode;
  title: string;
  description?: string;
  onClose: () => void;
}) {
  return (
    <Dialog.Portal>
      <ModalOverlay />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <Dialog.Title className="text-base font-semibold text-foreground">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="text-sm text-muted-foreground mt-0.5">
                {description}
              </Dialog.Description>
            )}
          </div>
          <Dialog.Close asChild>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Đóng"
            >
              <X className="size-4" />
            </button>
          </Dialog.Close>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateUserModal({ open, onClose }: CreateUserModalProps) {
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

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

function EditUserModal({ open, onClose, user }: EditUserModalProps) {
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
        dob: user.dob ?? "",
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

          {/* Role chỉ hiển thị, không cho sửa (backend không hỗ trợ update role) */}
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

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

function UserDetailModal({ open, onClose, user }: UserDetailModalProps) {
  if (!user) return null;

  const rows: { label: string; value: string | undefined }[] = [
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
          {/* Avatar + role badge */}
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold select-none">
              {user.name.trim().split(" ").slice(-2).map((n) => n[0]).join("").toUpperCase()}
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">{user.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ROLE_COLORS[user.role])}>
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>
          </div>

          {/* Info grid */}
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

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

function DeleteConfirmModal({ open, onClose, user }: DeleteConfirmModalProps) {
  const { deleteUser } = useUserStore();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);
    await deleteUser(user.id);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent
        title="Xác nhận xóa"
        description={`Bạn có chắc muốn xóa tài khoản "${user?.name}"? Hành động này không thể hoàn tác.`}
        onClose={onClose}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Đang xóa..." : "Xóa"}
          </Button>
        </div>
      </ModalContent>
    </Dialog.Root>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const UserListPage = () => {
  const { users, loading, filters, fetchUsers, setFilters, getFilteredUsers } = useUserStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = getFilteredUsers();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý người dùng</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} người dùng trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* TODO: implement CSV import — parse file, call POST /users/bulk to create nhiều user cùng lúc */}
          <Button size="sm" variant="outline" disabled title="Chức năng import CSV đang phát triển">
            <Upload className="size-4" />
            Import CSV
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Thêm người dùng
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm kiếm tên, email..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-8"
          />
        </div>
        <select
          className={cn(selectClass, "w-full sm:w-44")}
          value={filters.role}
          onChange={(e) => setFilters({ role: e.target.value as typeof filters.role })}
        >
          <option value="all">Tất cả vai trò</option>
          <option value="student">Học sinh</option>
          <option value="teacher">Giáo viên</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Họ tên", "Email", "Vai trò", "Thao tác"].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              )}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              )}
              {!loading &&
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", ROLE_COLORS[user.role])}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetailUser(user)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          aria-label="Xem chi tiết"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          onClick={() => setEditUser(user)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          aria-label="Chỉnh sửa"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeleteUser(user)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          aria-label="Xóa"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserModal open={!!editUser} onClose={() => setEditUser(null)} user={editUser} />
      <UserDetailModal open={!!detailUser} onClose={() => setDetailUser(null)} user={detailUser} />
      <DeleteConfirmModal open={!!deleteUser} onClose={() => setDeleteUser(null)} user={deleteUser} />
    </div>
  );
};

export default UserListPage;
