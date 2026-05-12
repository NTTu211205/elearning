import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Users, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { classService } from "@/services/classService";
import type { AdminClass } from "@/services/classService";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS, selectClass } from "./constants";
import { CreateClassModal } from "./modals/CreateClassModal";
import { EditClassModal } from "./modals/EditClassModal";
import { ManageStudentsModal } from "./modals/ManageStudentsModal";
import { toast } from "sonner";

const ClassListPage = () => {
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editClass, setEditClass] = useState<AdminClass | null>(null);
  const [manageClass, setManageClass] = useState<AdminClass | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "ended">("all");
  const [page, setPage] = useState(1);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await classService.getAll();
      setClasses(data);
    } catch {
      toast.error("Lỗi khi tải danh sách lớp học");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreated = (cls: AdminClass) => {
    setClasses((prev) => [cls, ...prev]);
  };

  const handleUpdated = (updated: Pick<AdminClass, "id" | "name" | "quantity" | "status">) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
    );
  };

  const handleStudentCountChange = (classId: number, delta: number) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId ? { ...c, studentCount: (c.studentCount ?? 0) + delta } : c
      )
    );
  };

  const filtered = classes.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.teacherName?.toLowerCase().includes(search.toLowerCase()) ||
      c.subjectName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const LIMIT = 15;
  useEffect(() => { setPage(1); }, [search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const currentItems = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Quản lý lớp học</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {classes.length} lớp học trong hệ thống
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm kiếm tên lớp, giáo viên, môn học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <select
          className={cn(selectClass, "w-44 shrink-0")}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="ended">Đã kết thúc</option>
        </select>

        <Button size="sm" onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="size-4" />
          Thêm lớp học
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["#", "Tên lớp", "Môn học", "Giáo viên", "Sĩ số / Ghi danh", "Trạng thái", "Ngày tạo", "Thao tác"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    Không tìm thấy lớp học nào
                  </td>
                </tr>
              )}
              {!loading &&
                currentItems.map((cls, idx) => (
                  <tr key={cls.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-center text-muted-foreground">{(page - 1) * LIMIT + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {cls.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {cls.subjectName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {cls.teacherName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {cls.studentCount} / {cls.quantity}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_COLORS[cls.status]
                        )}
                      >
                        {STATUS_LABELS[cls.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground whitespace-nowrap">
                      {new Date(cls.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setEditClass(cls)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Chỉnh sửa lớp học"
                        >
                          <Pencil className="size-3.5" />
                          Sửa
                        </button>
                        <button
                          onClick={() => setManageClass(cls)}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Quản lý sinh viên"
                        >
                          <Users className="size-3.5" />
                          Thêm
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

      <CreateClassModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          fetchClasses();
        }}
        onCreated={handleCreated}
      />
      <EditClassModal
        open={!!editClass}
        onClose={() => setEditClass(null)}
        cls={editClass}
        onUpdated={handleUpdated}
      />
      <ManageStudentsModal
        open={!!manageClass}
        onClose={() => setManageClass(null)}
        cls={manageClass}
        onStudentCountChange={handleStudentCountChange}
      />
    </div>
  );
};

export default ClassListPage;
