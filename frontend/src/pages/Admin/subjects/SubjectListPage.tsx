import { useEffect, useState } from "react";
import { Plus, Search, Eye, Pencil, Trash2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubjectStore } from "@/stores/useSubjectStore";
import type { Subject } from "@/types/subject";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS, selectClass } from "./constants";
import { CreateSubjectModal } from "./modals/CreateSubjectModal";
import { EditSubjectModal } from "./modals/EditSubjectModal";
import { SubjectDetailModal } from "./modals/SubjectDetailModal";
import { DeleteConfirmModal } from "./modals/DeleteConfirmModal";

const SubjectListPage = () => {
  const { subjects, loading, filters, fetchSubjects, setFilters, getFilteredSubjects, toggleSubjectStatus } =
    useSubjectStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [detailSubject, setDetailSubject] = useState<Subject | null>(null);
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const filteredSubjects = getFilteredSubjects();

  const LIMIT = 15;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, [filters.search, filters.status]);
  const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / LIMIT));
  const currentItems = filteredSubjects.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Quản lý môn học</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {subjects.length} môn học trong hệ thống
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm kiếm tên môn học..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-8"
          />
        </div>

        <select
          className={cn(selectClass, "w-44 shrink-0")}
          value={filters.status}
          onChange={(e) =>
            setFilters({ status: e.target.value as typeof filters.status })
          }
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Ngừng hoạt động</option>
        </select>

        <Button size="sm" onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="size-4" />
          Thêm môn học
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["#", "Tên môn học", "Số buổi học", "Trạng thái", "Thao tác"].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
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
              {!loading && filteredSubjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Không tìm thấy môn học nào
                  </td>
                </tr>
              )}
              {!loading &&
                currentItems.map((subject, index) => (
                  <tr key={subject.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground w-12">{(page - 1) * LIMIT + index + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {subject.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{subject.lessons} buổi</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_COLORS[subject.status]
                        )}
                      >
                        {STATUS_LABELS[subject.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="d-flex justify-content-center align-items-center">
                        <button
                          onClick={() => setDetailSubject(subject)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          aria-label="Xem chi tiết"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          onClick={() => toggleSubjectStatus(subject.id)}
                          className={cn(
                            "rounded-md p-1.5 transition-colors",
                            subject.status === 1
                              ? "text-green-600 hover:bg-green-50"
                              : "text-red-500 hover:bg-red-50"
                          )}
                          aria-label={subject.status === 1 ? "Vô hiệu hóa" : "Kích hoạt"}
                          title={subject.status === 1 ? "Vô hiệu hóa" : "Kích hoạt"}
                        >
                          <Power className="size-4" />
                        </button>
                        <button
                          onClick={() => setEditSubject(subject)}
                          disabled={subject.status === 0}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Chỉnh sửa"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeleteSubject(subject)}
                          disabled={subject.status === 0}
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
      <CreateSubjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditSubjectModal
        open={!!editSubject}
        onClose={() => setEditSubject(null)}
        subject={editSubject}
      />
      <SubjectDetailModal
        open={!!detailSubject}
        onClose={() => setDetailSubject(null)}
        subject={detailSubject}
      />
      <DeleteConfirmModal
        open={!!deleteSubject}
        onClose={() => setDeleteSubject(null)}
        subject={deleteSubject}
      />
    </div>
  );
};

export default SubjectListPage;
