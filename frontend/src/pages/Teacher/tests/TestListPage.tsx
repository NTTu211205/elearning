import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Plus, Search, Eye, Pencil, Trash2, Clock, CalendarDays, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TestListItem } from "@/types/test";
import { DeleteTestModal } from "./modals/DeleteTestModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { testService } from "@/services/testService";
import { toast } from "sonner";

const selectClass =
  "flex h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground";

const formatDateTime = (dt: string | null) => {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTestStatus = (startAt: string | null, endAt: string | null) => {
  const now = Date.now();
  const start = startAt ? new Date(startAt).getTime() : null;
  const end = endAt ? new Date(endAt).getTime() : null;
  if (!start || !end) return "unset";
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "open";
};

const TestStatusBadge = ({ startAt, endAt }: { startAt: string | null; endAt: string | null }) => {
  const status = getTestStatus(startAt, endAt);
  if (status === "unset")
    return (
      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
        Chưa cài đặt
      </span>
    );
  if (status === "upcoming")
    return (
      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
        Sắp diễn ra
      </span>
    );
  if (status === "ended")
    return (
      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
        Đã kết thúc
      </span>
    );
  return (
    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
      Đang mở
    </span>
  );
};

const TestListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<TestListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);

  const fetchTests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await testService.getByCreator(user.id);
      setTests(data);
    } catch {
      toast.error("Không thể tải danh sách đề thi");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // Danh sách lớp unique từ dữ liệu thật
  const classOptions = useMemo(() => {
    const map = new Map<number, string>();
    tests.forEach((t) => {
      if (t.class_id && t.className) map.set(t.class_id, t.className);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tests]);

  const filtered = useMemo(
    () =>
      tests.filter((t) => {
        const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
        const matchClass = classFilter === "all" || String(t.class_id) === classFilter;
        return matchSearch && matchClass;
      }),
    [tests, search, classFilter]
  );

  const LIMIT = 15;
  useEffect(() => { setPage(1); }, [search, classFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const currentItems = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await testService.delete(deleteTarget.id);
      setTests((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success("Đã xóa đề thi");
    } catch {
      toast.error("Xóa đề thi thất bại");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-sm font-semibold text-foreground">Quản lý đề thi</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {loading ? "Đang tải..." : `${tests.length} đề thi của bạn`}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm kiếm tên đề thi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <select
          className={cn(selectClass, "w-44 shrink-0")}
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="all">Tất cả lớp</option>
          {classOptions.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>

        <Button size="sm" onClick={() => navigate("/teacher/tests/new")} className="shrink-0">
          <Plus className="size-4" />
          Tạo đề thi
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["#", "Tên đề thi", "Lớp", "Số câu", "Thời gian", "Lượt làm", "Mở / Đóng", "Trạng thái", "Thao tác"].map(
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
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-muted animate-pulse mx-auto w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    {tests.length === 0 ? "Chưa có đề thi nào" : "Không tìm thấy đề thi nào"}
                  </td>
                </tr>
              ) : (
                currentItems.map((test, index) => (
                  <tr key={test.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-center w-10">
                      {(page - 1) * LIMIT + index + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap max-w-[200px] truncate">
                      {test.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-center whitespace-nowrap">
                      {test.className ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium">{test.questionCount ?? "—"}</span>
                      <span className="text-muted-foreground"> câu</span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Clock className="size-3" />
                        {test.duration ? `${test.duration} phút` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <RefreshCw className="size-3" />
                        {test.turn}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3 text-green-500" />
                          {formatDateTime(test.startAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3 text-red-400" />
                          {formatDateTime(test.endAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TestStatusBadge startAt={test.startAt} endAt={test.endAt} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className={cn(
                            "rounded p-1.5 text-muted-foreground transition-colors",
                            "hover:bg-blue-50 hover:text-blue-600"
                          )}
                          title="Xem chi tiết"
                          onClick={() => navigate(`/teacher/tests/${test.id}`)}
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          className={cn(
                            "rounded p-1.5 text-muted-foreground transition-colors",
                            "hover:bg-amber-50 hover:text-amber-600"
                          )}
                          title="Chỉnh sửa"
                          onClick={() => navigate(`/teacher/tests/${test.id}/edit`)}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          className={cn(
                            "rounded p-1.5 text-muted-foreground transition-colors",
                            "hover:bg-red-50 hover:text-red-600"
                          )}
                          title="Xóa"
                          onClick={() => setDeleteTarget(test)}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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

      <DeleteTestModal
        test={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
};

export default TestListPage;
