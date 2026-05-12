import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Users, TrendingUp, Target, Trophy, Search,
  FileText, Clock, CalendarDays, BookOpen, ArrowUpDown,
  ArrowUp, ArrowDown, GraduationCap, CheckCircle2, XCircle,
  BarChart2, Pencil, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { testService, type TestDetailFull, type StudentResult } from "@/services/testService";
import { examService, type QuestionStat } from "@/services/examService";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const subjectAccent: Record<number, { badge: string; avatar: string }> = {
  1: { badge: "bg-blue-50 text-blue-700 border-blue-200",      avatar: "bg-blue-500"    },
  2: { badge: "bg-violet-50 text-violet-700 border-violet-200", avatar: "bg-violet-500"  },
  3: { badge: "bg-orange-50 text-orange-700 border-orange-200", avatar: "bg-orange-500"  },
};
const defaultAccent = { badge: "bg-muted text-muted-foreground border-border", avatar: "bg-primary" };

const getTestStatus = (startAt: string, endAt: string) => {
  const now = Date.now();
  const s = new Date(startAt).getTime();
  const e = new Date(endAt).getTime();
  if (now < s) return "upcoming";
  if (now > e) return "ended";
  return "open";
};

const fmtDt = (iso: string) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const fmtShort = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

type SortKey = "name" | "score" | "correct" | "submitAt";
type SortDir = "asc" | "desc";
type ScoreFilter = "all" | "excellent" | "pass" | "fail" | "pending";

const SCORE_FILTER_LABELS: Record<ScoreFilter, string> = {
  all: "Tất cả", excellent: "Giỏi ≥8", pass: "Đạt 5–8", fail: "Chưa đạt <5", pending: "Chưa nộp",
};

const scoreFilterFn = (r: StudentResult, f: ScoreFilter) => {
  if (f === "pending")   return r.score === null;
  if (f === "excellent") return r.score !== null && r.score >= 8;
  if (f === "pass")      return r.score !== null && r.score >= 5 && r.score < 8;
  if (f === "fail")      return r.score !== null && r.score < 5;
  return true;
};

// ─────────────────────────────────────────────
// Score histogram
// ─────────────────────────────────────────────
const BUCKET_COLORS = [
  "bg-red-800","bg-red-600","bg-red-500","bg-orange-500","bg-orange-400",
  "bg-yellow-400","bg-lime-400","bg-green-400","bg-green-500","bg-emerald-500","bg-emerald-600",
];

const ScoreHistogram = ({ results }: { results: StudentResult[] }) => {
  const submitted = results.filter((r) => r.score !== null);
  const counts = Array.from({ length: 11 }, (_, i) =>
    submitted.filter((r) => Math.round(r.score ?? 0) === i).length
  );
  const max = Math.max(...counts, 1);
  return (
    <div className="flex flex-col gap-3 h-full">
      <h3 className="text-sm font-semibold text-foreground">Phân bố điểm số</h3>
      {submitted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <BarChart2 className="size-8 opacity-30" />
          <p className="text-sm">Chưa có dữ liệu điểm</p>
        </div>
      ) : (
        <>
          <div className="flex items-end gap-0.5 flex-1" style={{ minHeight: 110 }}>
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-0.5 min-w-0">
                <span className="text-[10px] font-medium text-foreground leading-none">
                  {counts[i] > 0 ? counts[i] : ""}
                </span>
                <div className="w-full flex items-end" style={{ height: 90 }}>
                  <div
                    className={cn("w-full rounded-t transition-all duration-700", BUCKET_COLORS[i])}
                    style={{ height: `${(counts[i] / max) * 100}%`, minHeight: counts[i] > 0 ? 4 : 0 }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{i}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border">
            <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-red-500" /> Yếu</span>
            <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-yellow-400" /> TB</span>
            <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-emerald-500" /> Giỏi</span>
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Radial ring
// ─────────────────────────────────────────────
const Ring = ({ value, color, size = 56, stroke = 5 }: { value: number; color: string; size?: number; stroke?: number }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/40" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
};

// ─────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────
const StatCard = ({
  label, value, sub, pct, icon: Icon, color,
}: { label: string; value: string; sub?: string; pct: number; icon: React.ElementType; color: string }) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
    <div className="relative flex items-center justify-center shrink-0">
      <Ring value={pct} color={color} />
      <Icon className="absolute size-4" style={{ color }} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Score badge
// ─────────────────────────────────────────────
const ScoreBadge = ({ score }: { score: number | null }) => {
  if (score === null) return <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">Chưa nộp</span>;
  if (score >= 8) return <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">{score.toFixed(1)}</span>;
  if (score >= 5) return <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">{score.toFixed(1)}</span>;
  return <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600">{score.toFixed(1)}</span>;
};

// ─────────────────────────────────────────────
// Question fail-rate chart
// ─────────────────────────────────────────────
const QuestionFailRateChart = ({ stats }: { stats: QuestionStat[] }) => {
  if (stats.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
        <AlertTriangle className="size-8 opacity-30" />
        <p className="text-sm">Chưa có học sinh nào nộp bài</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {stats.map((s, i) => (
        <div key={s.questionId} className="flex items-center gap-3 group">
          <span className="w-6 text-xs font-bold text-muted-foreground text-right shrink-0">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground truncate mb-1 group-hover:text-clip" title={s.questionText}>
              {s.questionText}
            </p>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  s.failRate >= 70 ? "bg-red-500" :
                  s.failRate >= 50 ? "bg-orange-400" :
                  s.failRate >= 30 ? "bg-yellow-400" :
                  "bg-green-400"
                )}
                style={{ width: `${s.failRate}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn(
              "text-xs font-bold tabular-nums w-10 text-right",
              s.failRate >= 70 ? "text-red-600" :
              s.failRate >= 50 ? "text-orange-500" :
              s.failRate >= 30 ? "text-yellow-600" :
              "text-green-600"
            )}>
              {s.failRate}%
            </span>
            <span className="text-[10px] text-muted-foreground w-14 shrink-0">
              {s.total - s.correct}/{s.total} sai
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} />
);

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
const TestDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const testId = Number(id);

  const [loading, setLoading] = useState(true);
  const [testMeta, setTestMeta] = useState<TestDetailFull | null>(null);
  const [allResults, setAllResults] = useState<StudentResult[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([]);

  const [scoreFilter, setScoreFilter]   = useState<ScoreFilter>("all");
  const [nameSearch, setNameSearch]     = useState("");
  const [sortKey, setSortKey]           = useState<SortKey>("score");
  const [sortDir, setSortDir]           = useState<SortDir>("desc");

  const fetchData = useCallback(async () => {
    if (!testId) return;
    setLoading(true);
    try {
      const [meta, results, stats] = await Promise.all([
        testService.getDetail(testId),
        testService.getResults(testId),
        examService.getQuestionStats(testId),
      ]);
      setTestMeta(meta);
      setAllResults(results);
      setQuestionStats(stats);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể tải dữ liệu đề thi");
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const tableRows = useMemo(() => {
    let rows = allResults.filter(
      (r) => scoreFilterFn(r, scoreFilter) && r.studentName.toLowerCase().includes(nameSearch.toLowerCase())
    );
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "score")    cmp = (a.score ?? -1) - (b.score ?? -1);
      if (sortKey === "correct") {
        const ca = a.score !== null ? Math.round((a.score / 10) * (a.totalQuestions || 10)) : -1;
        const cb = b.score !== null ? Math.round((b.score / 10) * (b.totalQuestions || 10)) : -1;
        cmp = ca - cb;
      }
      if (sortKey === "name")     cmp = a.studentName.localeCompare(b.studentName, "vi");
      if (sortKey === "submitAt") cmp = (a.submitAt ?? "").localeCompare(b.submitAt ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [allResults, scoreFilter, nameSearch, sortKey, sortDir]);

  // ── Stats ──
  const submitted    = allResults.filter((r) => r.score !== null);
  const avg          = submitted.length
    ? Math.round((submitted.reduce((s, r) => s + (r.score ?? 0), 0) / submitted.length) * 10) / 10
    : null;
  const passCount    = submitted.filter((r) => (r.score ?? 0) >= 5).length;
  const passRate     = submitted.length ? Math.round((passCount / submitted.length) * 100) : 0;
  const highest      = submitted.length ? Math.max(...submitted.map((r) => r.score ?? 0)) : null;

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey !== col
      ? <ArrowUpDown className="size-3 ml-1 text-muted-foreground" />
      : sortDir === "asc"
        ? <ArrowUp className="size-3 ml-1 text-primary" />
        : <ArrowDown className="size-3 ml-1 text-primary" />;

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!testMeta) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <FileText className="size-12 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Không tìm thấy đề thi</p>
        <button onClick={() => navigate("/teacher/tests")} className="text-sm text-primary hover:underline">
          Quay lại danh sách đề thi
        </button>
      </div>
    );
  }

  const accent     = subjectAccent[testMeta.subjectId] ?? defaultAccent;
  const status     = getTestStatus(testMeta.startAt, testMeta.endAt);
  const statusMeta = {
    ended:    { label: "Đã kết thúc", cls: "bg-muted text-muted-foreground" },
    open:     { label: "Đang mở",     cls: "bg-green-100 text-green-700"    },
    upcoming: { label: "Sắp diễn ra", cls: "bg-blue-100 text-blue-700"      },
  }[status];

  return (
    <div className="flex flex-col gap-5">

      {/* ── Back / Edit ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/teacher/tests")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Danh sách đề thi
        </button>
        <button
          onClick={() => navigate(`/teacher/tests/${testMeta.id}/edit`)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-600 transition-colors border border-border rounded-lg px-3 py-1.5 hover:border-amber-400 hover:bg-amber-50"
        >
          <Pencil className="size-3.5" />
          Chỉnh sửa
        </button>
      </div>

      {/* ── Test info banner ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary via-blue-400 to-violet-400" />
        <div className="px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <FileText className="size-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="flex flex-wrap items-start gap-2">
              <h2 className="text-lg font-bold text-foreground flex-1 min-w-0">{testMeta.name}</h2>
              <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", statusMeta.cls)}>
                {statusMeta.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><BookOpen className="size-3.5" />{testMeta.num_question} câu hỏi</span>
              <span className="flex items-center gap-1"><Clock className="size-3.5" />{testMeta.duration} phút</span>
              <span className="flex items-center gap-1"><GraduationCap className="size-3.5" />{allResults.length} học sinh</span>
              <span className="flex items-center gap-1"><CalendarDays className="size-3.5 text-green-500" />Mở: {fmtDt(testMeta.startAt)}</span>
              <span className="flex items-center gap-1"><CalendarDays className="size-3.5 text-red-400" />Đóng: {fmtDt(testMeta.endAt)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", accent.badge)}>
                <GraduationCap className="size-3" />
                {testMeta.className}
                {testMeta.subjectName ? ` · ${testMeta.subjectName}` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Học sinh đã nộp" value={`${submitted.length}/${allResults.length}`}
          sub={`${allResults.length - submitted.length} chưa nộp`}
          pct={allResults.length > 0 ? (submitted.length / allResults.length) * 100 : 0}
          icon={Users} color="hsl(217,91%,60%)"
        />
        <StatCard
          label="Điểm trung bình" value={avg !== null ? avg.toFixed(1) : "—"}
          sub="trên 10"
          pct={avg !== null ? (avg / 10) * 100 : 0}
          icon={TrendingUp} color="hsl(142,76%,36%)"
        />
        <StatCard
          label="Tỉ lệ đạt" value={submitted.length > 0 ? `${passRate}%` : "—"}
          sub={submitted.length > 0 ? `${passCount}/${submitted.length} học sinh` : "chưa có dữ liệu"}
          pct={passRate}
          icon={Target} color={passRate >= 50 ? "hsl(142,76%,36%)" : "hsl(0,84%,60%)"}
        />
        <StatCard
          label="Điểm cao nhất" value={highest !== null ? highest.toFixed(1) : "—"}
          sub="trên 10"
          pct={highest !== null ? (highest / 10) * 100 : 0}
          icon={Trophy} color="hsl(38,92%,50%)"
        />
      </div>

      {/* ── Score histogram + Question fail rate (side by side) ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4" style={{ minHeight: 220 }}>
          <ScoreHistogram results={allResults} />
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <AlertTriangle className="size-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-foreground">Tỉ lệ sai theo câu hỏi</h3>
            <span className="ml-auto text-xs text-muted-foreground">
              {questionStats.length > 0 ? `${questionStats.length} câu` : ""}
            </span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
            <QuestionFailRateChart stats={questionStats} />
          </div>
        </div>
      </div>

      {/* ── Student table ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Tìm học sinh..."
              className="h-8 w-44 rounded-md border border-input bg-background pl-8 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(Object.keys(SCORE_FILTER_LABELS) as ScoreFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setScoreFilter(f)}
                className={cn(
                  "h-7 rounded-full px-3 text-xs font-medium transition-colors border",
                  scoreFilter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {SCORE_FILTER_LABELS[f]}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-muted-foreground shrink-0">{tableRows.length} học sinh</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
                <th
                  className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => toggleSort("name")}
                >
                  <span className="flex items-center">Học sinh <SortIcon col="name" /></span>
                </th>
                <th
                  className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => toggleSort("score")}
                >
                  <span className="inline-flex items-center justify-center">Điểm <SortIcon col="score" /></span>
                </th>
                <th
                  className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => toggleSort("correct")}
                >
                  <span className="inline-flex items-center justify-center">Đúng / Tổng <SortIcon col="correct" /></span>
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Tiến độ
                </th>
                <th
                  className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell cursor-pointer select-none"
                  onClick={() => toggleSort("submitAt")}
                >
                  <span className="inline-flex items-center justify-center">Nộp lúc <SortIcon col="submitAt" /></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tableRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    {allResults.length === 0 ? "Chưa có học sinh nào trong lớp" : "Không có kết quả phù hợp"}
                  </td>
                </tr>
              )}
              {tableRows.map((r, i) => {
                const total       = r.totalQuestions || testMeta.num_question;
                const correct     = r.score !== null ? Math.round((r.score / 10) * total) : 0;
                const correctPct  = r.score !== null ? Math.round((correct / total) * 100) : 0;
                const rowAccent   = subjectAccent[r.subjectId] ?? defaultAccent;
                return (
                  <tr key={`${r.classId}-${r.studentId}`} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("size-7 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0", rowAccent.avatar)}>
                          {r.studentName.split(" ").at(-1)?.[0] ?? "?"}
                        </div>
                        <span className="font-medium text-foreground">{r.studentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <ScoreBadge score={r.score} />
                    </td>
                    <td className="px-4 py-2.5 text-center text-sm">
                      {r.score !== null ? (
                        <>
                          <span className="text-green-600 font-medium">{correct}</span>
                          <span className="text-muted-foreground"> / {total}</span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      {r.score !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                correctPct >= 80 ? "bg-green-400" : correctPct >= 50 ? "bg-blue-400" : "bg-red-400"
                              )}
                              style={{ width: `${correctPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 shrink-0 text-right">{correctPct}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-center">
                          <XCircle className="size-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Chưa nộp</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                      {r.submitAt ? (
                        <span className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="size-3 text-green-500" />
                          {fmtShort(r.submitAt)}
                        </span>
                      ) : (
                        <span className="text-red-400">Chưa nộp</span>
                      )}
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

export default TestDetailPage;