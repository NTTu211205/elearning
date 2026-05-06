import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  BookOpen,
  Users,
  FileText,
  ChevronRight,
  GraduationCap,
  TrendingUp,
  SlidersHorizontal,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClassItem } from "@/types/class";
import { classService } from "@/services/classService";
import { useAuthStore } from "@/stores/useAuthStore";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getQuality = (avg: number | null) => {
  if (avg === null) return { label: "Chưa đánh giá", badge: "bg-muted/60 text-muted-foreground", barColor: "bg-muted",       pct: 0 };
  if (avg >= 8)    return { label: "Xuất sắc",       badge: "bg-green-100 text-green-700",       barColor: "bg-green-500",  pct: Math.round((avg / 10) * 100) };
  if (avg >= 6.5)  return { label: "Tốt",            badge: "bg-blue-100 text-blue-700",         barColor: "bg-blue-500",   pct: Math.round((avg / 10) * 100) };
  if (avg >= 5)    return { label: "Trung bình",      badge: "bg-yellow-100 text-yellow-700",     barColor: "bg-yellow-400", pct: Math.round((avg / 10) * 100) };
  return             { label: "Cần cải thiện",        badge: "bg-red-100 text-red-600",           barColor: "bg-red-500",    pct: Math.round((avg / 10) * 100) };
};

const subjectAccent: Record<number, { strip: string; avatar: string; badge: string }> = {
  1: { strip: "bg-blue-500",   avatar: "bg-blue-500",   badge: "bg-blue-50 text-blue-700"     },
  2: { strip: "bg-violet-500", avatar: "bg-violet-500", badge: "bg-violet-50 text-violet-700" },
  3: { strip: "bg-orange-500", avatar: "bg-orange-500", badge: "bg-orange-50 text-orange-700" },
};
const defaultAccent = { strip: "bg-primary", avatar: "bg-primary", badge: "bg-muted text-muted-foreground" };

// ─────────────────────────────────────────────
// Card component
// ─────────────────────────────────────────────
const ClassCard = ({ cls, onClick }: { cls: ClassItem; onClick: () => void }) => {
  const quality = getQuality(cls.avgScore);
  const accent  = subjectAccent[cls.subjectId] ?? defaultAccent;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 overflow-hidden"
    >
      <div className={cn("h-1.5 w-full", accent.strip)} />
      <div className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn("flex size-10 items-center justify-center rounded-xl text-white text-sm font-bold shrink-0", accent.avatar)}>
            {cls.name.slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-base leading-tight">Lớp {cls.name}</h3>
            <span className={cn("inline-flex items-center gap-1 mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium", accent.badge)}>
              <BookOpen className="size-3" />
              {cls.subjectName}
            </span>
          </div>

        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Users className="size-4 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">{cls.studentCount}</p>
              <p className="text-[10px] text-muted-foreground">Học sinh</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <FileText className="size-4 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">{cls.assignedTests}</p>
              <p className="text-[10px] text-muted-foreground">Đề thi</p>
            </div>
          </div>
        </div>

        {/* Avg score */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Điểm trung bình</span>
          <span className="text-xs font-semibold text-foreground">
            {cls.avgScore !== null ? `${cls.avgScore}/10` : "Chưa có dữ liệu"}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <span className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            cls.status === "active" ? "bg-green-50 text-green-700" : "bg-muted/60 text-muted-foreground"
          )}>
            {cls.status === "active" ? "Đang dạy" : "Đã kết thúc"}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
            Xem chi tiết <ChevronRight className="size-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Summary bar
// ─────────────────────────────────────────────
const SummaryBar = ({ classes }: { classes: ClassItem[] }) => {
  const totalStudents = classes.reduce((s, c) => s + c.studentCount, 0);
  const totalTests = classes.reduce((s, c) => s + c.assignedTests, 0);
  const validAvg = classes.filter((c) => c.avgScore !== null);
  const overallAvg = validAvg.length
    ? Math.round((validAvg.reduce((s, c) => s + (c.avgScore ?? 0), 0) / validAvg.length) * 10) / 10
    : null;

  const items = [
    { icon: GraduationCap, label: "Lớp đang dạy", value: String(classes.filter((c) => c.status === "active").length), color: "text-blue-500" },
    { icon: Users, label: "Tổng học sinh", value: String(totalStudents), color: "text-violet-500" },
    { icon: FileText, label: "Đề thi đã giao", value: String(totalTests), color: "text-amber-500" },
    { icon: TrendingUp, label: "Điểm TB chung", value: overallAvg !== null ? String(overallAvg) : "—", color: "text-green-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <item.icon className={cn("size-5 shrink-0", item.color)} />
          <div>
            <p className="text-xl font-bold text-foreground leading-tight">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// Sort options
// ─────────────────────────────────────────────
type SortOption = "newest" | "oldest" | "quality";
const SORT_LABELS: Record<SortOption, string> = {
  newest:  "Mới nhất",
  oldest:  "Cũ nhất",
  quality: "Chất lượng",
};

// ─────────────────────────────────────────────
// Filter Modal
// ─────────────────────────────────────────────
interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  subjects: { id: number; name: string }[];
  subjectFilter: number | null;
  onSubjectChange: (id: number | null) => void;
  activeCount: number;
  onReset: () => void;
}
const FilterModal = ({
  open, onClose, sort, onSortChange,
  subjects, subjectFilter, onSubjectChange,
  activeCount, onReset,
}: FilterModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  if (!open) return null;
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full sm:max-w-sm bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Lọc & Sắp xếp</span>
            {activeCount > 0 && (
              <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5">
                {activeCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted transition-colors">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-5">
          {/* Subject filter */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Môn học</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onSubjectChange(null)}
                className={cn(
                  "h-7 rounded-full px-3 text-xs font-medium border transition-colors",
                  subjectFilter === null
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                Tất cả môn
              </button>
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSubjectChange(subjectFilter === s.id ? null : s.id)}
                  className={cn(
                    "h-7 rounded-full px-3 text-xs font-medium border transition-colors flex items-center gap-1.5",
                    subjectFilter === s.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {subjectFilter === s.id && <Check className="size-3" />}
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sắp xếp theo</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <button
                  key={key}
                  onClick={() => onSortChange(key)}
                  className={cn(
                    "h-7 rounded-full px-3 text-xs font-medium border transition-colors flex items-center gap-1.5",
                    sort === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {sort === key && <Check className="size-3" />}
                  {SORT_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
          <button
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Đặt lại
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
const ClassListPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "ended">("all");
  const [subjectFilter, setSubjectFilter] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    classService
      .getByTeacher(user.id)
      .then((data) =>
        setClasses(
          data.map((c) => ({
            id: c.id,
            name: c.className,
            subjectName: c.subjectName,
            subjectId: c.subjectId,
            studentCount: c.totalStudents,
            assignedTests: c.totalTests,
            avgScore: c.avgScore,
            createdAt: c.createdAt,
            status: c.status,
          }))
        )
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Unique subjects from loaded classes
  const subjects = useMemo(() => {
    const map = new Map<number, string>();
    classes.forEach((c) => { if (!map.has(c.subjectId)) map.set(c.subjectId, c.subjectName); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [classes]);

  const sorted = useMemo(() => {
    let arr = [...classes];
    if (statusFilter !== "all")    arr = arr.filter((c) => c.status === statusFilter);
    if (subjectFilter !== null)    arr = arr.filter((c) => c.subjectId === subjectFilter);
    if (sort === "newest")  arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === "oldest")  arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (sort === "quality") arr.sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1));
    return arr;
  }, [sort, statusFilter, subjectFilter, classes]);

  // Count active non-default filters (excludes status)
  const activeFilterCount = (subjectFilter !== null ? 1 : 0) + (sort !== "newest" ? 1 : 0);

  const handleReset = () => {
    setSort("newest");
    setSubjectFilter(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Lớp học của tôi</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Quản lý các lớp bạn đang phụ trách</p>
      </div>

      <SummaryBar classes={classes} />

      {/* Controls — single row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status pills */}
        {(["all", "active", "ended"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "h-7 rounded-full px-3 text-xs font-medium border transition-colors",
              statusFilter === s
                ? s === "active" ? "bg-green-500 text-white border-green-500"
                  : s === "ended" ? "bg-slate-400 text-white border-slate-400"
                  : "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {s === "all" ? "Tất cả" : s === "active" ? "Đang dạy" : "Đã kết thúc"}
          </button>
        ))}

        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* Filter & Sort button */}
        <button
          onClick={() => setShowModal(true)}
          className={cn(
            "h-7 rounded-full px-3 text-xs font-medium border transition-colors flex items-center gap-1.5",
            activeFilterCount > 0
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          Lọc & Sắp xếp
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-white/30 text-[10px] font-bold px-1 leading-[14px]">
              {activeFilterCount}
            </span>
          )}
        </button>

        <span className="ml-auto text-xs text-muted-foreground shrink-0">{sorted.length} lớp</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-center text-sm text-muted-foreground py-10">Đang tải dữ liệu...</p>
        ) : sorted.length === 0 ? (
          <p className="col-span-full text-center text-sm text-muted-foreground py-10">Không có lớp học nào.</p>
        ) : (
          sorted.map((cls) => (
            <ClassCard key={cls.id} cls={cls} onClick={() => navigate(`/teacher/classes/${cls.id}`)} />
          ))
        )}
      </div>

      <FilterModal
        open={showModal}
        onClose={() => setShowModal(false)}
        sort={sort}
        onSortChange={setSort}
        subjects={subjects}
        subjectFilter={subjectFilter}
        onSubjectChange={setSubjectFilter}
        activeCount={activeFilterCount}
        onReset={handleReset}
      />
    </div>
  );
};

export default ClassListPage;
