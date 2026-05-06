import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { Search, UserCheck, UserX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { classService } from "@/services/classService";
import { userService } from "@/services/userService";
import type { AdminClass, EnrolledStudent } from "@/services/classService";
import type { User } from "@/types/user";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ModalContent } from "./ModalBase";

interface ManageStudentsModalProps {
  open: boolean;
  onClose: () => void;
  cls: AdminClass | null;
  onStudentCountChange: (classId: number, delta: number) => void;
}

export function ManageStudentsModal({
  open,
  onClose,
  cls,
  onStudentCountChange,
}: ManageStudentsModalProps) {
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"enrolled" | "add">("enrolled");
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !cls) return;
    setTab("enrolled");
    setSearch("");
    setSelectedIds([]);

    const load = async () => {
      setLoadingData(true);
      try {
        const [enrolledData, users] = await Promise.all([
          classService.getStudentsByClass(cls.id),
          userService.getAll(),
        ]);
        setEnrolled(enrolledData);
        setAllStudents(users.filter((u) => u.role === "student"));
      } catch {
        toast.error("Lỗi khi tải dữ liệu sinh viên");
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [open, cls]);

  const enrolledIds = new Set(enrolled.map((e) => e.id));

  // Students not yet enrolled
  const availableStudents = allStudents.filter((s) => !enrolledIds.has(s.id));

  const filteredEnrolled = enrolled.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAvailable = availableStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEnroll = async () => {
    if (!cls || selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      const result = await classService.enrollStudents(cls.id, selectedIds);
      const count = result.enrolled.length;
      const failCount = result.failed.length;

      if (count > 0) {
        toast.success(`Đã thêm ${count} sinh viên vào lớp`);
        // refresh enrolled list
        const updated = await classService.getStudentsByClass(cls.id);
        setEnrolled(updated);
        setSelectedIds([]);
        onStudentCountChange(cls.id, count);
        setTab("enrolled");
      }
      if (failCount > 0) {
        toast.warning(`${failCount} sinh viên không thể thêm (đã ghi danh hoặc lỗi)`);
      }
    } catch {
      toast.error("Thêm sinh viên thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent
        title={cls ? `Sinh viên lớp: ${cls.name}` : "Quản lý sinh viên"}
        description={cls ? `${cls.subjectName ?? ""}${cls.teacherName ? ` — GV: ${cls.teacherName}` : ""}` : undefined}
        onClose={onClose}
        wide
      >
        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-border">
          <button
            onClick={() => { setTab("enrolled"); setSearch(""); setSelectedIds([]); }}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              tab === "enrolled"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Đã ghi danh ({enrolled.length})
          </button>
          <button
            onClick={() => { setTab("add"); setSearch(""); }}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              tab === "add"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Thêm sinh viên ({availableStudents.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {loadingData ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Đang tải...</div>
        ) : tab === "enrolled" ? (
          /* ── Enrolled students list ── */
          <div className="max-h-72 overflow-y-auto rounded-md border border-border divide-y divide-border">
            {filteredEnrolled.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {enrolled.length === 0 ? "Chưa có sinh viên nào trong lớp" : "Không tìm thấy"}
              </p>
            )}
            {filteredEnrolled.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                <UserCheck className="size-4 shrink-0 text-green-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                </div>
                {s.averageScore != null && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    ĐTB: {s.averageScore}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* ── Add students tab ── */
          <>
            {selectedIds.length > 0 && (
              <p className="text-xs text-primary font-medium mb-2">
                Đã chọn {selectedIds.length} sinh viên
              </p>
            )}
            <div className="max-h-64 overflow-y-auto rounded-md border border-border divide-y divide-border">
              {filteredAvailable.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {availableStudents.length === 0
                    ? "Tất cả sinh viên đã được ghi danh"
                    : "Không tìm thấy"}
                </p>
              )}
              {filteredAvailable.map((s) => {
                const selected = selectedIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSelect(s.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                      selected ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                    )}
                  >
                    {selected ? (
                      <UserCheck className="size-4 shrink-0 text-primary" />
                    ) : (
                      <UserX className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 font-medium truncate">{s.name}</span>
                    <span className="text-muted-foreground text-xs shrink-0">{s.email}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Đóng
              </Button>
              <Button
                onClick={handleEnroll}
                disabled={submitting || selectedIds.length === 0}
              >
                {submitting
                  ? "Đang thêm..."
                  : `Thêm ${selectedIds.length > 0 ? selectedIds.length + " " : ""}sinh viên`}
              </Button>
            </div>
          </>
        )}

        {tab === "enrolled" && (
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        )}
      </ModalContent>
    </Dialog.Root>
  );
}
