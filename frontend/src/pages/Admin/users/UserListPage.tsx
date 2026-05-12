import { useEffect, useState, useRef } from "react";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Eye, Pencil, Trash2, X, Upload, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/stores/useUserStore";
import type { CreateUserPayload, UpdateUserPayload } from "@/stores/useUserStore";
import type { User, Role } from "@/types/user";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Chuyển ISO string hoặc yyyy-mm-dd → dd/mm/yyyy để hiển thị */
function formatDob(dob?: string): string {
  if (!dob) return "—";
  const date = new Date(dob);
  if (!isNaN(date.getTime())) {
    const d = String(date.getUTCDate()).padStart(2, "0");
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const y = date.getUTCFullYear();
    return `${d}/${m}/${y}`;
  }
  return dob;
}

/** Chuyển ISO datetime string → dd/mm/yyyy HH:mm để hiển thị */
function formatDateTime(dt?: string): string {
  if (!dt) return "—";
  const date = new Date(dt);
  if (isNaN(date.getTime())) return "—";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${d}/${m}/${y} ${hh}:${mm}`;
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

const USER_STATUS_LABELS: Record<number, string> = { 1: "Hoạt động", 0: "Vô hiệu" };
const USER_STATUS_COLORS: Record<number, string> = {
  1: "bg-green-100 text-green-700",
  0: "bg-red-100 text-red-600",
};

// CSV default password if missing
const CSV_DEFAULT_PASS = "123456";

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
    { label: "Ngày tạo", value: formatDateTime(user.createdAt) },
    { label: "Cập nhật lúc", value: formatDateTime(user.updatedAt) },
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

// ─── CSV Import Modal ─────────────────────────────────────────────────────────

interface CsvRow {
  name: string; email: string; role: string; password: string; phone?: string; dob?: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return {
      name: row.name ?? "",
      email: row.email ?? "",
      role: row.role ?? "student",
      password: row.password || CSV_DEFAULT_PASS,
      phone: row.phone || undefined,
      dob: row.dob || undefined,
    } as CsvRow;
  }).filter((r) => r.name && r.email);
}

interface CsvImportModalProps { open: boolean; onClose: () => void; }

function CsvImportModal({ open, onClose }: CsvImportModalProps) {
  const { bulkCreateUsers } = useUserStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ successCount: number; failCount: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => { if (open) { setRows([]); setResult(null); setDragging(false); } }, [open]);

  const processText = (text: string) => {
    setRows(parseCsv(text));
    setResult(null);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processText(ev.target?.result as string);
    reader.readAsText(file, "utf-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.name.endsWith(".csv")) return;
    const reader = new FileReader();
    reader.onload = (ev) => processText(ev.target?.result as string);
    reader.readAsText(file, "utf-8");
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    const r = await bulkCreateUsers(rows as CreateUserPayload[]);
    setResult(r);
    setImporting(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent title="Import người dùng từ CSV"
        description="Cột bắt buộc: name, email, role, password. Tuỳ chọn: phone, dob."
        onClose={onClose}>
        <div className="flex flex-col gap-4">
          {/* Drop zone */}
          {!rows.length && !result && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 cursor-pointer transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <Upload className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Kéo thả file CSV vào đây</p>
              <p className="text-xs text-muted-foreground">hoặc nhấp để chọn file</p>
              <input
                ref={fileRef} type="file" accept=".csv" onChange={handleFile}
                className="hidden"
              />
            </div>
          )}

          {/* Change file button when rows loaded */}
          {rows.length > 0 && !result && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setRows([]); if (fileRef.current) fileRef.current.value = ""; }}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Chọn file khác
              </button>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
            </div>
          )}

          {rows.length > 0 && !result && (
            <div className="rounded-lg border border-border overflow-hidden max-h-52 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    {["Họ tên", "Email", "Vai trò", "SĐT"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-3 py-1.5">{r.name}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{r.email}</td>
                      <td className="px-3 py-1.5">
                        <span className={cn("rounded-full px-1.5 text-xs font-medium", ROLE_COLORS[(r.role as Role) ?? "student"])}>
                          {ROLE_LABELS[(r.role as Role) ?? "student"] ?? r.role}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">{r.phone ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rows.length > 0 && !result && (
            <p className="text-sm text-muted-foreground">Tìm thấy <strong>{rows.length}</strong> dòng dữ liệu</p>
          )}

          {result && (
            <div className="rounded-lg border border-border p-4 flex flex-col gap-1 text-sm">
              <p className="text-green-600 font-medium">✓ Tạo thành công: {result.successCount} tài khoản</p>
              {result.failCount > 0 && (
                <p className="text-red-600">✗ Thất bại: {result.failCount} tài khoản (email đã tồn tại hoặc dữ liệu lỗi)</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Đóng</Button>
            {!result && (
              <Button onClick={handleImport} disabled={rows.length === 0 || importing}>
                {importing ? "Đang import..." : `Import ${rows.length > 0 ? `(${rows.length})` : ""}`}
              </Button>
            )}
          </div>
        </div>
      </ModalContent>
    </Dialog.Root>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const UserListPage = () => {
  const { users, loading, filters, fetchUsers, setFilters, getFilteredUsers, toggleUserStatus } = useUserStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = getFilteredUsers();

  const LIMIT = 15;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / LIMIT));
  const currentUsers = filteredUsers.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Quản lý người dùng</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {users.length} người dùng trong hệ thống
        </p>
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm kiếm tên, email..."
            value={filters.search}
            onChange={(e) => { setFilters({ search: e.target.value }); setPage(1); }}
            className="pl-8"
          />
        </div>
        <select
          className={cn(selectClass, "w-full sm:w-44")}
          value={filters.role}
          onChange={(e) => { setFilters({ role: e.target.value as typeof filters.role }); setPage(1); }}
        >
          <option value="all">Tất cả vai trò</option>
          <option value="student">Học sinh</option>
          <option value="teacher">Giáo viên</option>
          <option value="admin">Admin</option>
        </select>
        <select
          className={cn(selectClass, "w-full sm:w-44")}
          value={filters.status}
          onChange={(e) => { setFilters({ status: e.target.value as typeof filters.status }); setPage(1); }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Vô hiệu</option>
        </select>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" />
            Import CSV
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Thêm người dùng
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Họ tên", "Email", "Vai trò", "Trạng thái", "Thao tác"].map((col) => (
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
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              )}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              )}
              {!loading &&
                currentUsers.map((user) => (
                  <tr key={user.id} className={cn("hover:bg-muted/30 transition-colors", user.status === 0 && "opacity-60")}>
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
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        USER_STATUS_COLORS[user.status ?? 1]
                      )}>
                        {USER_STATUS_LABELS[user.status ?? 1]}
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
                          disabled={user.status === 0}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Chỉnh sửa"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={cn(
                            "rounded-md p-1.5 transition-colors",
                            user.status === 1
                              ? "text-green-600 hover:bg-green-50"
                              : "text-red-500 hover:bg-red-50"
                          )}
                          aria-label={user.status === 1 ? "Vô hiệu hóa" : "Kích hoạt"}
                          title={user.status === 1 ? "Vô hiệu hóa" : "Kích hoạt"}
                        >
                          <Power className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeleteUser(user)}
                          disabled={user.status === 0}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-sm text-muted-foreground hover:bg-muted disabled:opacity-40"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="text-muted-foreground text-sm px-1">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={cn(
                    "h-8 min-w-[32px] rounded-md border text-sm font-medium transition-colors",
                    page === p
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-sm text-muted-foreground hover:bg-muted disabled:opacity-40"
          >
            ›
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserModal open={!!editUser} onClose={() => setEditUser(null)} user={editUser} />
      <UserDetailModal open={!!detailUser} onClose={() => setDetailUser(null)} user={detailUser} />
      <DeleteConfirmModal open={!!deleteUser} onClose={() => setDeleteUser(null)} user={deleteUser} />
      <CsvImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
};

export default UserListPage;
