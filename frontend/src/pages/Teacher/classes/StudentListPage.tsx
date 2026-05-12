import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Users,
  GraduationCap,
  TrendingUp,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Medal,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface StudentRow {
  studentId: number;
  studentName: string;
  email: string;
  phone?: string;
  classId: number;
  className: string;
  subjectName: string;
  subjectId: number;
  avgScore: number | null;
  submittedTests: number;
  totalTests: number;
}

// ─────────────────────────────────────────────
// Mock data — cross-class student list
// ─────────────────────────────────────────────
const CLASSES = [
  { id: 1, name: "10A1", subjectName: "Toán học", subjectId: 1, totalTests: 3, status: "active" as const },
  { id: 2, name: "10A2", subjectName: "Toán học", subjectId: 1, totalTests: 3, status: "active" as const },
  { id: 3, name: "11B1", subjectName: "Vật lý",   subjectId: 2, totalTests: 1, status: "ended"  as const },
  { id: 4, name: "12C1", subjectName: "Hóa học",  subjectId: 3, totalTests: 6, status: "active" as const },
];

const NAMES = [
  "Nguyễn Văn An","Trần Thị Bình","Lê Hoàng Cường","Phạm Thị Dung",
  "Hoàng Văn Em","Đặng Thị Phương","Bùi Quốc Giang","Vũ Thị Hoa",
  "Đỗ Văn Ích","Ngô Thị Kim","Lý Văn Long","Phan Thị Mai",
  "Trịnh Văn Nam","Cao Thị Oanh","Đinh Văn Phúc","Nguyễn Thị Quỳnh",
  "Lê Văn Rồng","Mai Thị Sen","Tô Văn Thắng","Chu Thị Uyên",
];

const seededRand = (seed: number) => {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
};

const CLASS_SIZES: Record<number, number> = { 1: 32, 2: 30, 3: 28, 4: 25 };

const mockStudents: StudentRow[] = CLASSES.flatMap((cls) => {
  const count = CLASS_SIZES[cls.id];
  const rand  = seededRand(cls.id * 7919);
  return Array.from({ length: count }, (_, i) => {
    const submitted = Math.floor(rand() * (cls.totalTests + 1));
    const avg       = submitted > 0 ? Math.round(rand() * 100) / 10 : null;
    return {
      studentId:     cls.id * 1000 + i,
      studentName:   NAMES[i % NAMES.length],
      email:         `hs${cls.id * 100 + i}@school.edu.vn`,
      phone:         `09${Math.floor(rand() * 100000000).toString().padStart(8, "0")}`,
      classId:       cls.id,
      className:     cls.name,
      subjectName:   cls.subjectName,
      subjectId:     cls.subjectId,
      avgScore:      avg,
      submittedTests: submitted,
      totalTests:    cls.totalTests,
    };
  });
});

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const subjectAccent: Record<number, { badge: string; avatar: string }> = {
  1: { badge: "bg-blue-50 text-blue-700",     avatar: "bg-blue-500"   },
  2: { badge: "bg-violet-50 text-violet-700", avatar: "bg-violet-500" },
  3: { badge: "bg-orange-50 text-orange-700", avatar: "bg-orange-500" },
};
const defaultAccent = { badge: "bg-muted text-muted-foreground", avatar: "bg-primary" };

const getRankBadge = (score: number | null) => {
  if (score === null) return null;
  if (score >= 8)   return { label: "Giỏi",       cls: "bg-green-100 text-green-700"   };
  if (score >= 6.5) return { label: "Khá",        cls: "bg-blue-100 text-blue-700"     };
  if (score >= 5)   return { label: "Trung bình", cls: "bg-yellow-100 text-yellow-700" };
  return               { label: "Yếu",           cls: "bg-red-100 text-red-600"        };
};

// ─────────────────────────────────────────────
// Sort types
// ─────────────────────────────────────────────
type SortKey = "name" | "avgScore" | "submitted" | "class";
type SortDir = "asc" | "desc";
type RankFilter = "all" | "excellent" | "good" | "average" | "weak" | "none";

const RANK_FILTERS: { key: RankFilter; label: string }[] = [
  { key: "all",       label: "Tất cả"    },
  { key: "excellent", label: "Giỏi ≥8"   },
  { key: "good",      label: "Khá 6.5–8" },
  { key: "average",   label: "TB 5–6.5"  },
  { key: "weak",      label: "Yếu <5"    },
  { key: "none",      label: "Chưa đánh giá" },
];

const matchRank = (score: number | null, f: RankFilter) => {
  if (f === "all")       return true;
  if (f === "none")      return score === null;
  if (score === null)    return false;
  if (f === "excellent") return score >= 8;
  if (f === "good")      return score >= 6.5 && score < 8;
  if (f === "average")   return score >= 5 && score < 6.5;
  if (f === "weak")      return score < 5;
  return true;
};

// ─────────────────────────────────────────────
// Summary bar
// ─────────────────────────────────────────────
const SummaryBar = ({ students }: { students: StudentRow[] }) => {
  const withScore  = students.filter((s) => s.avgScore !== null);
  const avg        = withScore.length
    ? Math.round((withScore.reduce((a, s) => a + (s.avgScore ?? 0), 0) / withScore.length) * 10) / 10
    : null;
  const passCount  = withScore.filter((s) => (s.avgScore ?? 0) >= 5).length;
  const passRate   = withScore.length ? Math.round((passCount / withScore.length) * 100) : 0;

  const items = [
    { icon: Users,        label: "Tổng học sinh",   value: String(students.length),                           color: "text-blue-500"   },
    { icon: GraduationCap,label: "Số lớp",           value: String(CLASSES.length),                             color: "text-violet-500" },
    { icon: TrendingUp,   label: "Điểm TB chung",    value: avg !== null ? String(avg) : "—",                   color: "text-green-600"  },
    { icon: Medal,        label: "Tỉ lệ đạt",        value: withScore.length ? `${passRate}%` : "—",             color: "text-amber-500"  },
    { icon: FileText,     label: "Chưa làm bài",     value: String(students.filter((s) => s.submittedTests === 0).length), color: "text-red-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
// Sort icon (module-level to avoid render-time component creation)
// ─────────────────────────────────────────────
const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) =>
  sortKey !== col
    ? <ArrowUpDown className="size-3 ml-1 text-muted-foreground" />
    : sortDir === "asc"
      ? <ArrowUp className="size-3 ml-1 text-primary" />
      : <ArrowDown className="size-3 ml-1 text-primary" />;

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
const StudentListPage = () => {
  const navigate = useNavigate();

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "ended">("all");
  const [classFilter,  setClassFilter]  = useState<number | "all">("all");
  const [rankFilter,   setRankFilter]   = useState<RankFilter>("all");
  const [sortKey,      setSortKey]      = useState<SortKey>("name");
  const [sortDir,      setSortDir]      = useState<SortDir>("asc");
  const [page,         setPage]         = useState(1);

  const PAGE_SIZE = 15;

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let rows = mockStudents.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        s.studentName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone ?? "").includes(q);
      const matchClass = classFilter === "all" || s.classId === classFilter;
      return matchSearch && matchClass && matchRank(s.avgScore, rankFilter);
    });

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")      cmp = a.studentName.localeCompare(b.studentName, "vi");
      else if (sortKey === "class")     cmp = a.className.localeCompare(b.className, "vi");
      else if (sortKey === "avgScore")  cmp = (a.avgScore ?? -1) - (b.avgScore ?? -1);
      else if (sortKey === "submitted") cmp = a.submittedTests - b.submittedTests;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [search, classFilter, rankFilter, sortKey, sortDir]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="text-sm font-semibold text-foreground">Học sinh</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Danh sách học sinh trong tất cả lớp bạn phụ trách
        </p>
      </div>

      <SummaryBar students={mockStudents} />

      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Row 0: status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "active", "ended"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setClassFilter("all"); setPage(1); }}
              className={cn(
                "h-7 rounded-full px-3 text-xs font-medium border transition-colors",
                statusFilter === s
                  ? s === "active" ? "bg-green-500 text-white border-green-500"
                    : s === "ended" ? "bg-slate-400 text-white border-slate-400"
                    : "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {s === "all" ? "Tất cả lớp" : s === "active" ? "Đang dạy" : "Đã kết thúc"}
            </button>
          ))}
        </div>

        {/* Row 1: search + class picker */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm tên, email, SĐT..."
              className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="size-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground shrink-0">Lớp:</span>
            {(["all" as const, ...CLASSES.filter((c) => statusFilter === "all" || c.status === statusFilter).map((c) => c.id)]).map((key) => {
              const label = key === "all" ? "Tất cả" : CLASSES.find((c) => c.id === key)!.name;
              return (
                <button
                  key={key}
                  onClick={() => { setClassFilter(key); setPage(1); }}
                  className={cn(
                    "h-7 rounded-full px-3 text-xs font-medium transition-colors border",
                    classFilter === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: rank filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Medal className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground shrink-0">Xếp loại:</span>
          {RANK_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setRankFilter(f.key); setPage(1); }}
              className={cn(
                "h-7 rounded-full px-3 text-xs font-medium transition-colors border",
                rankFilter === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} học sinh</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
                <th
                  className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => toggleSort("name")}
                >
                  <span className="flex items-center">Học sinh <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Liên hệ</th>
                <th
                  className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => toggleSort("class")}
                >
                  <span className="inline-flex items-center justify-center">Lớp <SortIcon col="class" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th
                  className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => toggleSort("avgScore")}
                >
                  <span className="inline-flex items-center justify-center">Điểm TB <SortIcon col="avgScore" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Xếp loại</th>
                <th
                  className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => toggleSort("submitted")}
                >
                  <span className="inline-flex items-center justify-center">Bài thi <SortIcon col="submitted" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="size-8 opacity-30 mx-auto mb-2" />
                    Không tìm thấy học sinh nào
                  </td>
                </tr>
              )}
              {paginated.map((s, i) => {
                const rank   = getRankBadge(s.avgScore);
                const accent = subjectAccent[s.subjectId] ?? defaultAccent;
                const globalIdx = (page - 1) * PAGE_SIZE + i + 1;

                return (
                  <tr
                    key={`${s.classId}-${s.studentId}`}
                    className="hover:bg-muted/20 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/teacher/students/${s.classId}/${s.studentId}`)}
                  >
                    <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">{globalIdx}</td>

                    {/* Name + avatar */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("size-8 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0", accent.avatar)}>
                          {s.studentName.split(" ").at(-1)?.[0] ?? "?"}
                        </div>
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">{s.studentName}</span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                      {s.phone && <p className="text-xs text-muted-foreground">{s.phone}</p>}
                    </td>

                    {/* Class */}
                    <td className="px-4 py-2.5 text-center">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", accent.badge)}>
                        {s.className}
                      </span>
                    </td>

                    {/* Avg score */}
                    <td className="px-4 py-2.5 text-center">
                      {s.avgScore !== null ? (
                        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold",
                          s.avgScore >= 8 ? "bg-green-100 text-green-700" :
                          s.avgScore >= 5 ? "bg-blue-100 text-blue-700"   : "bg-red-100 text-red-600"
                        )}>
                          {s.avgScore}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Rank */}
                    <td className="px-4 py-2.5 text-center">
                      {rank ? (
                        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", rank.cls)}>
                          {rank.label}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Submitted */}
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="flex-1 max-w-[60px] bg-muted rounded-full h-1.5 overflow-hidden hidden sm:block">
                          <div
                            className={cn("h-full rounded-full",
                              s.submittedTests === 0 ? "bg-muted" :
                              s.submittedTests < s.totalTests ? "bg-amber-400" : "bg-green-500"
                            )}
                            style={{ width: `${(s.submittedTests / Math.max(s.totalTests, 1)) * 100}%` }}
                          />
                        </div>
                        <span className={cn("text-xs font-medium",
                          s.submittedTests === 0 ? "text-muted-foreground" :
                          s.submittedTests < s.totalTests ? "text-amber-600" : "text-green-600"
                        )}>
                          {s.submittedTests}/{s.totalTests}
                        </span>
                      </div>
                    </td>

                    {/* Arrow */}
                    <td className="px-4 py-2.5 text-center">
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary mx-auto transition-colors" />
                    </td>
                  </tr>
                );
              })}
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
    </div>
  );
};

export default StudentListPage;
