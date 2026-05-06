import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Users,
  FileText,
  CalendarDays,
  TrendingUp,
  BarChart2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  Medal,
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { classService } from "@/services/classService";
import { testService } from "@/services/testService";
import type { ClassDetail } from "@/services/classService";
import type { StudentResult } from "@/services/testService";
import type { ClassStudent, ClassTestSummary } from "@/types/class";

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const fmtDt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

const fmtScore = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return "—";
  const n = Number(score);
  if (isNaN(n)) return "—";
  return parseFloat(n.toFixed(2)).toString();
};

const getTestStatus = (startAt: string | null, endAt: string | null) => {
  const now = Date.now();
  const s = startAt ? new Date(startAt).getTime() : null;
  const e = endAt ? new Date(endAt).getTime() : null;
  if (!s || !e) return "unset";
  if (now < s) return "upcoming";
  if (now > e) return "ended";
  return "open";
};

const StatCard = ({ icon: Icon, label, value, sub, iconColor }: {
  icon: React.ElementType; label: string; value: string; sub?: string; iconColor: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
    <div className={cn("flex size-10 items-center justify-center rounded-lg shrink-0", iconColor.replace("text-", "bg-").replace(/-([\d]+)$/, "-100"))}>
      <Icon className={cn("size-5", iconColor)} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  </div>
);

const getQuality = (avg: number | null) => {
  if (avg === null) return { label: "Chưa đánh giá", textColor: "text-muted-foreground", bgColor: "bg-muted/30",  barColor: "bg-muted"      };
  if (avg >= 8)    return { label: "Xuất sắc",       textColor: "text-green-600",        bgColor: "bg-green-50",  barColor: "bg-green-500"  };
  if (avg >= 6.5)  return { label: "Tốt",            textColor: "text-blue-600",         bgColor: "bg-blue-50",   barColor: "bg-blue-500"   };
  if (avg >= 5)    return { label: "Trung bình",      textColor: "text-yellow-600",       bgColor: "bg-yellow-50", barColor: "bg-yellow-400" };
  return             { label: "Cần cải thiện",        textColor: "text-red-600",          bgColor: "bg-red-50",    barColor: "bg-red-500"    };
};

const MiniHistogram = ({ students }: { students: ClassStudent[] }) => {
  const buckets = [
    { label: "0-2",  min: 0, max: 2,     color: "bg-red-400"    },
    { label: "2-4",  min: 2, max: 4,     color: "bg-orange-400" },
    { label: "4-6",  min: 4, max: 6,     color: "bg-yellow-400" },
    { label: "6-8",  min: 6, max: 8,     color: "bg-blue-400"   },
    { label: "8-10", min: 8, max: 10.01, color: "bg-green-400"  },
  ];
  const withScore = students.filter((s) => s.avgScore !== null);
  const counts = buckets.map((b) => withScore.filter((s) => (s.avgScore ?? 0) >= b.min && (s.avgScore ?? 0) < b.max).length);
  const max = Math.max(...counts, 1);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-1.5" style={{ height: 80 }}>
        {buckets.map((b, i) => (
          <div key={b.label} className="flex flex-1 flex-col items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground">{counts[i]}</span>
            <div className="w-full flex items-end" style={{ height: 60 }}>
              <div className={cn("w-full rounded-t", b.color)} style={{ height: `${(counts[i] / max) * 100}%`, minHeight: counts[i] > 0 ? 3 : 0 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {buckets.map((b) => (
          <span key={b.label} className="text-[10px] text-muted-foreground flex-1 text-center">{b.label}</span>
        ))}
      </div>
    </div>
  );
};

const OverviewTab = ({ cls, students, tests }: { cls: ClassDetail; students: ClassStudent[]; tests: ClassTestSummary[] }) => {
  const withScore      = students.filter((s) => s.avgScore !== null);
  const avg            = withScore.length
    ? Math.round((withScore.reduce((a, s) => a + (s.avgScore ?? 0), 0) / withScore.length) * 10) / 10
    : null;
  const passCount      = withScore.filter((s) => (s.avgScore ?? 0) >= 5).length;
  const passRate       = withScore.length ? Math.round((passCount / withScore.length) * 100) : 0;
  const completedTests = tests.filter((t) => getTestStatus(t.startAt, t.endAt) === "ended").length;
  const quality        = getQuality(avg);
  const top3           = [...students]
    .filter((s) => s.avgScore !== null)
    .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users}      label="Học sinh"       value={String(cls.studentCount)}  sub="đang theo học"                      iconColor="text-blue-500"   />
        <StatCard icon={FileText}   label="Đề thi đã giao" value={String(cls.totalTests)}     sub={`${completedTests} da ket thuc`}    iconColor="text-amber-500"  />
        <StatCard icon={Medal}      label="Chất lượng"     value={quality.label}                                                      iconColor="text-violet-500" />
        <StatCard icon={TrendingUp} label="Tỉ lệ đạt"      value={`${passRate}%`}             sub={`${passCount}/${withScore.length} hs`} iconColor="text-green-500" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">Phân bố điểm trung bình</h3>
          {withScore.length > 0 ? (
            <MiniHistogram students={students} />
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <BarChart2 className="size-8 opacity-30" />
              <span className="text-sm">Chưa có dữ liệu điểm</span>
            </div>
          )}
          {avg !== null && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-2">
              <Medal className="size-3.5 text-amber-500" />
              <span>Điểm TB lớp:</span>
              <span className={cn("font-bold", quality.textColor)}>{fmtScore(avg)}</span>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">Chất lượng lớp học</h3>
          <div className={cn("flex items-center gap-3 rounded-xl p-3", quality.bgColor)}>
            <div className={cn("flex size-12 items-center justify-center rounded-xl font-bold text-base text-white shrink-0", quality.barColor)}>
              {fmtScore(avg)}
            </div>
            <div>
              <p className={cn("font-bold text-sm", quality.textColor)}>{quality.label}</p>
              <p className="text-xs text-muted-foreground">Điểm trung bình lớp</p>
            </div>
          </div>
          {top3.length > 0 && (
            <>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Top học sinh</p>
              <div className="flex flex-col gap-2">
                {top3.map((s, i) => (
                  <div key={s.studentId} className="flex items-center gap-2">
                    <span className={cn("flex size-6 items-center justify-center rounded-full text-xs font-bold text-white shrink-0",
                      i === 0 ? "bg-yellow-400" : i === 1 ? "bg-slate-400" : "bg-amber-600"
                    )}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-foreground truncate">{s.studentName}</span>
                    <span className={cn("text-sm font-bold",
                      (s.avgScore ?? 0) >= 8 ? "text-green-600" : (s.avgScore ?? 0) >= 5 ? "text-blue-600" : "text-red-500"
                    )}>
                      {fmtScore(s.avgScore)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <h3 className="text-sm font-semibold text-foreground">Đề thi gần đây</h3>
        </div>
        <div className="divide-y divide-border">
          {tests.slice(0, 4).map((t) => {
            const status = getTestStatus(t.startAt, t.endAt);
            return (
              <div key={t.testId} className="flex items-center gap-3 px-4 py-3">
                <FileText className="size-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.testName}</p>
                  <p className="text-xs text-muted-foreground">{t.questionCount} câu · {t.duration} phút</p>
                </div>
                {status === "ended" && (
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                    {t.submittedCount} nộp · TB: {fmtScore(t.avgScore)}
                  </span>
                )}
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                  status === "open"     ? "bg-green-100 text-green-700"  :
                  status === "upcoming" ? "bg-blue-100 text-blue-700"    :
                  "bg-muted text-muted-foreground"
                )}>
                  {status === "open" ? "Đang mở" : status === "upcoming" ? "Sắp diễn ra" : status === "ended" ? "Đã kết thúc" : "—"}
                </span>
              </div>
            );
          })}
          {tests.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Chưa có đề thi nào</div>
          )}
        </div>
      </div>
    </div>
  );
};

type RankFilter     = "all" | "excellent" | "good" | "average" | "weak";
type StudentSortKey = "name" | "avgScore" | "submitted";
type StudentSortDir = "asc" | "desc";

const RANK_FILTERS: { key: RankFilter; label: string }[] = [
  { key: "all",       label: "Tất cả"    },
  { key: "excellent", label: "Giỏi ≥8"  },
  { key: "good",      label: "Khá 6.5–8" },
  { key: "average",   label: "TB 5-6.5"  },
  { key: "weak",      label: "Yếu <5"    },
];

const matchRank = (score: number | null, filter: RankFilter) => {
  if (filter === "all") return true;
  if (score === null) return false;
  if (filter === "excellent") return score >= 8;
  if (filter === "good")      return score >= 6.5 && score < 8;
  if (filter === "average")   return score >= 5   && score < 6.5;
  if (filter === "weak")      return score < 5;
  return true;
};

const getRankBadge = (score: number | null) => {
  if (score === null) return null;
  if (score >= 8)   return { label: "Giỏi",       cls: "bg-green-100 text-green-700"   };
  if (score >= 6.5) return { label: "Khá",        cls: "bg-blue-100 text-blue-700"     };
  if (score >= 5)   return { label: "Trung bình", cls: "bg-yellow-100 text-yellow-700" };
  return               { label: "Yếu",            cls: "bg-red-100 text-red-600"       };
};

const StudentsTab = ({ students, classId }: { students: ClassStudent[]; classId: number }) => {
  const navigate = useNavigate();
  const [search,  setSearch]  = useState("");
  const [rank,    setRank]    = useState<RankFilter>("all");
  const [sortKey, setSortKey] = useState<StudentSortKey>("name");
  const [sortDir, setSortDir] = useState<StudentSortDir>("asc");

  const toggle = (key: StudentSortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let rows = students.filter(
      (s) => s.studentName.toLowerCase().includes(search.toLowerCase()) && matchRank(s.avgScore, rank)
    );
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")      cmp = a.studentName.localeCompare(b.studentName, "vi");
      if (sortKey === "avgScore")  cmp = (a.avgScore ?? -1) - (b.avgScore ?? -1);
      if (sortKey === "submitted") cmp = a.submittedTests - b.submittedTests;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [students, search, rank, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: StudentSortKey }) =>
    sortKey !== col
      ? <ArrowUpDown className="size-3 ml-1 text-muted-foreground" />
      : sortDir === "asc"
        ? <ArrowUp className="size-3 ml-1 text-primary" />
        : <ArrowDown className="size-3 ml-1 text-primary" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm học sinh..."
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {RANK_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setRank(f.key)}
              className={cn(
                "h-7 rounded-full px-3 text-xs font-medium transition-colors border",
                rank === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">{filtered.length} học sinh</span>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none" onClick={() => toggle("name")}>
                  <span className="flex items-center">Học sinh <SortIcon col="name" /></span>
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Liên hệ</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none" onClick={() => toggle("avgScore")}>
                  <span className="inline-flex items-center justify-center">Điểm TB <SortIcon col="avgScore" /></span>
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Xếp loại</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none" onClick={() => toggle("submitted")}>
                  <span className="inline-flex items-center justify-center">Bài thi <SortIcon col="submitted" /></span>
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Không tìm thấy học sinh</td></tr>
              )}
              {filtered.map((s, i) => {
                const rankBadge = getRankBadge(s.avgScore);
                return (
                  <tr key={s.studentId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {s.studentName.split(" ").at(-1)?.[0] ?? "?"}
                        </div>
                        <span className="font-medium text-foreground">{s.studentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                      {s.phone && <p className="text-xs text-muted-foreground">{s.phone}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {s.avgScore !== null ? (
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          s.avgScore >= 8 ? "bg-green-100 text-green-700" :
                          s.avgScore >= 5 ? "bg-blue-100 text-blue-700"   : "bg-red-100 text-red-600"
                        )}>
                          {fmtScore(s.avgScore)}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {rankBadge ? (
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", rankBadge.cls)}>
                          {rankBadge.label}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {s.submittedTests > 0
                          ? <CheckCircle2 className="size-3.5 text-green-500" />
                          : <XCircle className="size-3.5 text-muted-foreground" />}
                        <span className={cn("text-xs font-medium",
                          s.submittedTests > 0 ? "text-green-600" : "text-muted-foreground"
                        )}>
                          {s.submittedTests}/{s.totalTests}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => navigate(`/teacher/students/${classId}/${s.studentId}`)}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Xem chi tiết"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TestsTab = ({
  tests,
  students,
  classId: _classId,
}: {
  tests: ClassTestSummary[];
  students: ClassStudent[];
  classId: number;
}) => {
  const navigate = useNavigate();
  const [expandedTest,     setExpandedTest]     = useState<number | null>(null);
  const [submissionSubTab, setSubmissionSubTab] = useState<"submitted" | "pending">("submitted");
  const [submissionsCache, setSubmissionsCache] = useState<Record<number, StudentResult[]>>({});
  const [loadingTest,      setLoadingTest]      = useState<number | null>(null);

  const toggleExpand = async (testId: number) => {
    if (expandedTest === testId) {
      setExpandedTest(null);
      return;
    }
    setExpandedTest(testId);
    setSubmissionSubTab("submitted");
    if (!submissionsCache[testId]) {
      setLoadingTest(testId);
      try {
        const results = await testService.getResults(testId);
        setSubmissionsCache((prev) => ({ ...prev, [testId]: results }));
      } catch {
        setSubmissionsCache((prev) => ({ ...prev, [testId]: [] }));
      } finally {
        setLoadingTest(null);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tests.length} đề thi trong lớp</p>
        <Button size="sm" onClick={() => navigate("/teacher/tests/new")}>
          <Plus className="size-4 mr-1" /> Tạo đề thi mới
        </Button>
      </div>

      {tests.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <FileText className="size-10 opacity-30" />
          <p className="text-sm">Chưa có đề thi nào được giao cho lớp này</p>
          <Button size="sm" variant="outline" onClick={() => navigate("/teacher/tests/new")}>
            <Plus className="size-4 mr-1" /> Tạo đề thi đầu tiên
          </Button>
        </div>
      )}

      {tests.map((t) => {
        const status          = getTestStatus(t.startAt, t.endAt);
        const showSubmissions = status === "ended" || status === "open";
        const isExpanded      = expandedTest === t.testId;
        const submissions     = submissionsCache[t.testId] ?? [];
        const submittedIds    = new Set(submissions.map((r) => r.studentId));
        const submittedList   = submissions.filter((r) => r.score !== null);
        const pendingList     = students.filter((s) => !submittedIds.has(s.studentId));

        return (
          <div key={t.testId} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 shrink-0">
                  <FileText className="size-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-foreground text-sm">{t.testName}</h4>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => navigate(`/teacher/tests/${t.testId}/edit`)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="size-3" />{t.questionCount} câu
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />{t.duration} phút
                    </span>
                  </div>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  status === "open"     ? "bg-green-100 text-green-700"    :
                  status === "upcoming" ? "bg-blue-100 text-blue-700"      :
                  "bg-muted text-muted-foreground"
                )}>
                  {status === "open" ? "Đang mở" : status === "upcoming" ? "Sắp diễn ra" : status === "ended" ? "Đã kết thúc" : "Chưa cài đặt"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3 text-green-500" />Mở: {fmtDt(t.startAt)}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3 text-red-400" />Đóng: {fmtDt(t.endAt)}
                </span>
              </div>

              {showSubmissions && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-border pt-3">
                  <div>
                    <p className="font-bold text-foreground text-sm">{t.submittedCount}/{students.length}</p>
                    <p className="text-muted-foreground">Đã nộp</p>
                  </div>
                  <div>
                    <p className={cn("font-bold text-sm",
                      t.avgScore !== null && t.avgScore >= 8 ? "text-green-600" :
                      t.avgScore !== null && t.avgScore >= 5 ? "text-blue-600"  :
                      t.avgScore !== null                    ? "text-red-500"   :
                      "text-muted-foreground"
                    )}>
                      {fmtScore(t.avgScore)}
                    </p>
                    <p className="text-muted-foreground">Điểm TB</p>
                  </div>
                  <div>
                    <button
                      onClick={() => toggleExpand(t.testId)}
                      className="flex flex-col items-center gap-0.5 w-full hover:text-primary transition-colors"
                    >
                      <p className="font-bold text-sm">{isExpanded ? "Xếp lại" : "Xem"}</p>
                      <p className="text-muted-foreground">Nộp bài</p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isExpanded && showSubmissions && (
              <div className="border-t border-border bg-muted/10">
                <div className="flex border-b border-border px-4">
                  <button
                    onClick={() => setSubmissionSubTab("submitted")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors",
                      submissionSubTab === "submitted"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <CheckCircle2 className="size-3.5" />
                    Da nop ({submittedList.length})
                  </button>
                  <button
                    onClick={() => setSubmissionSubTab("pending")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors",
                      submissionSubTab === "pending"
                        ? "border-destructive text-destructive"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <XCircle className="size-3.5" />
                    Chua nop ({pendingList.length})
                  </button>
                </div>

                <div className="divide-y divide-border max-h-64 overflow-y-auto">
                  {loadingTest === t.testId ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">Đang tải...</div>
                  ) : submissionSubTab === "submitted" ? (
                    submittedList.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">Chưa có học sinh nào nộp bài</div>
                    ) : (
                      submittedList.map((sub, i) => (
                        <div key={sub.studentId} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                          <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                            {sub.studentName.split(" ").at(-1)?.[0] ?? "?"}
                          </div>
                          <span className="flex-1 text-sm font-medium text-foreground truncate">{sub.studentName}</span>
                          <span className={cn("text-xs font-bold rounded-full px-2 py-0.5",
                            (sub.score ?? 0) >= 8 ? "bg-green-100 text-green-700" :
                            (sub.score ?? 0) >= 5 ? "bg-blue-100 text-blue-700"   : "bg-red-100 text-red-600"
                          )}>
                            {fmtScore(sub.score)}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">{fmtDt(sub.submitAt)}</span>
                        </div>
                      ))
                    )
                  ) : (
                    pendingList.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">Tất cả học sinh đã nộp bài</div>
                    ) : (
                      pendingList.map((s, i) => (
                        <div key={s.studentId} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                          <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                            {s.studentName.split(" ").at(-1)?.[0] ?? "?"}
                          </div>
                          <span className="flex-1 text-sm font-medium text-foreground truncate">{s.studentName}</span>
                          <span className="text-xs text-red-500 font-medium">Chưa nộp</span>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

type ClassTab = "overview" | "students" | "tests";

const TABS: { key: ClassTab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Tổng quan", icon: BarChart2 },
  { key: "students", label: "Học sinh",  icon: Users     },
  { key: "tests",    label: "Đề thi",    icon: FileText  },
];

const subjectColor: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-violet-500",
  3: "bg-orange-500",
};

const ClassDetailPage = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const classId  = Number(id);

  const [activeTab, setActiveTab] = useState<ClassTab>("overview");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [cls,       setCls]       = useState<ClassDetail | null>(null);
  const [students,  setStudents]  = useState<ClassStudent[]>([]);
  const [tests,     setTests]     = useState<ClassTestSummary[]>([]);

  useEffect(() => {
    if (!classId || isNaN(classId)) return;
    setLoading(true);
    setError(null);

    Promise.all([
      classService.getDetail(classId),
      classService.getStudentsByClass(classId),
      testService.getByClass(classId),
    ])
      .then(([clsData, enrolledStudents, classTests]) => {
        setCls(clsData);

        const mappedTests: ClassTestSummary[] = classTests.map((t) => ({
          testId:         t.id,
          testName:       t.name,
          questionCount:  t.num_question,
          duration:       t.duration,
          turn:           t.turn,
          startAt:        t.startAt,
          endAt:          t.endAt,
          submittedCount: t.submittedCount,
          avgScore:       t.avgScore,
        }));
        setTests(mappedTests);

        const totalTests = classTests.length;
        const mappedStudents: ClassStudent[] = enrolledStudents.map((s) => ({
          studentId:      s.id,
          studentName:    s.name,
          email:          s.email,
          phone:          s.phone,
          dob:            s.dob,
          avgScore:       s.averageScore,
          submittedTests: Number(s.totalExamsDone ?? 0),
          totalTests,
        }));
        setStudents(mappedStudents);
      })
      .catch((err) => setError(err?.response?.data?.message ?? err.message ?? "Lỗi tải dữ liệu"))
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="h-2 w-full bg-muted animate-pulse" />
          <div className="px-6 py-4 flex gap-4">
            <div className="size-14 rounded-xl bg-muted animate-pulse shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-5 w-40 rounded bg-muted animate-pulse" />
              <div className="h-4 w-64 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <GraduationCap className="size-12 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">{error ?? "Không tìm thấy lớp học"}</p>
        <button onClick={() => navigate("/teacher/classes")} className="text-sm text-primary hover:underline">
          Quay lại danh sách lớp
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/teacher/classes")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Danh sách lớp
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className={cn("h-2", subjectColor[cls.subjectId] ?? "bg-primary")} />
        <div className="px-6 py-4 flex flex-wrap items-center gap-4">
          <div className={cn("flex size-14 items-center justify-center rounded-xl text-white text-xl font-bold shrink-0", subjectColor[cls.subjectId] ?? "bg-primary")}>
            {cls.name.slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">Lớp {cls.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <BookOpen className="size-3.5" />{cls.subjectName}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="size-3.5" />{cls.studentCount} học sinh
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarDays className="size-3.5" />Tạo {fmt(cls.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-border gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "overview" && <OverviewTab cls={cls} students={students} tests={tests} />}
        {activeTab === "students" && <StudentsTab students={students} classId={cls.id} />}
        {activeTab === "tests"    && <TestsTab tests={tests} students={students} classId={cls.id} />}
      </div>
    </div>
  );
};

export default ClassDetailPage;