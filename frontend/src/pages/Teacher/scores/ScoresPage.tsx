import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  AlertTriangle,
  ShieldAlert,
  Eye,
  BarChart2,
  BookOpen,
  CheckCircle2,
  XCircle,
  Medal,
  ChevronRight,
  Flame,
  GraduationCap,
  Mail,
  MailCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface StudentStat {
  studentId: number;
  studentName: string;
  classId: number;
  testScores: (number | null)[];   // score per test, null = not submitted
  avgScore: number | null;
  submittedCount: number;
  totalTests: number;
}

interface TestStat {
  testId: number;
  testName: string;
  passCount: number;
  failCount: number;
  submittedCount: number;
  avgScore: number | null;
}

interface ClassStats {
  classId: number;
  className: string;
  subjectName: string;
  subjectId: number;
  students: StudentStat[];
  tests: TestStat[];
  avgScore: number | null;
  passRate: number;
  failCount: number;
  atRiskCount: number;
}

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────
const CLASSES_META = [
  { classId: 1, className: "10A1", subjectName: "Toán học", subjectId: 1, studentCount: 32, testCount: 3, status: "active" as const },
  { classId: 2, className: "10A2", subjectName: "Toán học", subjectId: 1, studentCount: 30, testCount: 3, status: "active" as const },
  { classId: 3, className: "11B1", subjectName: "Vật lý",   subjectId: 2, studentCount: 28, testCount: 1, status: "ended"  as const },
  { classId: 4, className: "12C1", subjectName: "Hóa học",  subjectId: 3, studentCount: 25, testCount: 6, status: "active" as const },
];

const STUDENT_NAMES = [
  "Nguyễn Văn An","Trần Thị Bình","Lê Hoàng Cường","Phạm Thị Dung",
  "Hoàng Văn Em","Đặng Thị Phương","Bùi Quốc Giang","Vũ Thị Hoa",
  "Đỗ Văn Ích","Ngô Thị Kim","Lý Văn Long","Phan Thị Mai",
  "Trịnh Văn Nam","Cao Thị Oanh","Đinh Văn Phúc","Nguyễn Thị Quỳnh",
  "Lê Văn Rồng","Mai Thị Sen","Tô Văn Thắng","Chu Thị Uyên",
];

const TEST_NAMES_SHORT = [
  "KT 15' Ch.1","KT Giữa kỳ","KT Cuối kỳ","KT Ch.2","KT Nhanh","Thi thử",
];

const seededRand = (seed: number) => {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
};

const buildClassStats = (): ClassStats[] =>
  CLASSES_META.filter((meta) => meta.status === "active").map((meta) => {
    // Generate student test scores
    const students: StudentStat[] = Array.from({ length: meta.studentCount }, (_, i) => {
      const testScores: (number | null)[] = Array.from({ length: meta.testCount }, (_, t) => {
        const r = seededRand(meta.classId * 1000 + i * 37 + t * 13);
        const submitted = r() > 0.2;
        if (!submitted) return null;
        // bias some students to score low (bottom third)
        const base = i < Math.floor(meta.studentCount * 0.3)
          ? r() * 5         // bottom 30%: 0–5
          : r() * 10;       // rest: 0–10
        return Math.round(base * 10) / 10;
      });
      const valid = testScores.filter((s) => s !== null) as number[];
      const avg   = valid.length
        ? Math.round((valid.reduce((a, v) => a + v, 0) / valid.length) * 10) / 10
        : null;
      return {
        studentId:      meta.classId * 1000 + i,
        studentName:    STUDENT_NAMES[i % STUDENT_NAMES.length],
        classId:        meta.classId,
        testScores,
        avgScore:       avg,
        submittedCount: valid.length,
        totalTests:     meta.testCount,
      };
    });

    // Build test stats
    const tests: TestStat[] = Array.from({ length: meta.testCount }, (_, t) => {
      const scores = students.map((s) => s.testScores[t]).filter((s) => s !== null) as number[];
      const pass   = scores.filter((s) => s >= 5).length;
      const avg    = scores.length
        ? Math.round((scores.reduce((a, v) => a + v, 0) / scores.length) * 10) / 10
        : null;
      return {
        testId:         meta.classId * 10 + t + 1,
        testName:       TEST_NAMES_SHORT[t % TEST_NAMES_SHORT.length],
        passCount:      pass,
        failCount:      scores.length - pass,
        submittedCount: scores.length,
        avgScore:       avg,
      };
    });

    const withScore     = students.filter((s) => s.avgScore !== null);
    const passCount     = withScore.filter((s) => (s.avgScore ?? 0) >= 5).length;
    const failCount     = withScore.filter((s) => (s.avgScore ?? 0) < 5).length;
    const atRiskCount   = students.filter((s) => getRiskLevel(s) !== null).length;
    const avg           = withScore.length
      ? Math.round((withScore.reduce((a, s) => a + (s.avgScore ?? 0), 0) / withScore.length) * 10) / 10
      : null;
    const passRate      = withScore.length ? Math.round((passCount / withScore.length) * 100) : 0;

    return { classId: meta.classId, className: meta.className, subjectName: meta.subjectName, subjectId: meta.subjectId, students, tests, avgScore: avg, passRate, failCount, atRiskCount };
  });

// ─────────────────────────────────────────────
// Risk helpers
// ─────────────────────────────────────────────
type RiskLevel = "danger" | "warning" | "watch" | null;

const getRiskLevel = (s: StudentStat): RiskLevel => {
  const missingRatio = s.totalTests > 0 ? (s.totalTests - s.submittedCount) / s.totalTests : 0;
  if (s.avgScore === null) return missingRatio >= 0.5 ? "danger" : "warning";
  if (s.avgScore < 4)  return "danger";
  if (s.avgScore < 5 || missingRatio >= 0.5) return "danger";
  if (s.avgScore < 5.5 || missingRatio >= 0.3) return "warning";
  if (s.avgScore < 6.5 || missingRatio >= 0.15) return "watch";
  return null;
};

const RISK_CONFIG: Record<NonNullable<RiskLevel>, {
  label: string; badgeCls: string; iconCls: string; rowCls: string; icon: React.ElementType;
}> = {
  danger:  { label: "Nguy hiểm", badgeCls: "bg-red-100 text-red-700 border border-red-200",      iconCls: "text-red-500",    rowCls: "bg-red-50/30",     icon: Flame         },
  warning: { label: "Cảnh báo",  badgeCls: "bg-orange-100 text-orange-700 border border-orange-200", iconCls: "text-orange-500", rowCls: "bg-orange-50/30",  icon: ShieldAlert   },
  watch:   { label: "Theo dõi",  badgeCls: "bg-yellow-100 text-yellow-700 border border-yellow-200", iconCls: "text-yellow-600", rowCls: "bg-yellow-50/20",  icon: AlertTriangle },
};

// ─────────────────────────────────────────────
// Trend helper — compare last two submitted test scores
// ─────────────────────────────────────────────
const getTrend = (s: StudentStat): "up" | "down" | "flat" | null => {
  const submitted = s.testScores.filter((v): v is number => v !== null);
  if (submitted.length < 2) return null;
  const diff = submitted[submitted.length - 1] - submitted[submitted.length - 2];
  if (diff > 0.5) return "up";
  if (diff < -0.5) return "down";
  return "flat";
};

const TrendIcon = ({ trend }: { trend: "up" | "down" | "flat" | null }) => {
  if (!trend) return null;
  if (trend === "up")   return <TrendingUp   className="size-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="size-4 text-red-400"  />;
  return <Minus className="size-4 text-muted-foreground" />;
};

// ─────────────────────────────────────────────
// Subject accent
// ─────────────────────────────────────────────
const subjectAccent: Record<number, { tab: string; activeTab: string; strip: string }> = {
  1: { tab: "border-blue-200 text-blue-700",   activeTab: "bg-blue-500 text-white border-blue-500",   strip: "bg-blue-500"   },
  2: { tab: "border-violet-200 text-violet-700", activeTab: "bg-violet-500 text-white border-violet-500", strip: "bg-violet-500" },
  3: { tab: "border-orange-200 text-orange-700", activeTab: "bg-orange-500 text-white border-orange-500", strip: "bg-orange-500" },
};
const defaultAccent = { tab: "border-border text-muted-foreground", activeTab: "bg-primary text-white border-primary", strip: "bg-primary" };

// ─────────────────────────────────────────────
// Score distribution histogram
// ─────────────────────────────────────────────
const BUCKETS = [
  { label: "0–2",  min: 0,  max: 2,     color: "bg-red-400",    textColor: "text-red-600"    },
  { label: "2–4",  min: 2,  max: 4,     color: "bg-orange-400", textColor: "text-orange-600" },
  { label: "4–5",  min: 4,  max: 5,     color: "bg-yellow-400", textColor: "text-yellow-600" },
  { label: "5–8",  min: 5,  max: 8,     color: "bg-blue-400",   textColor: "text-blue-600"   },
  { label: "8–10", min: 8,  max: 10.01, color: "bg-green-400",  textColor: "text-green-600"  },
];

const ScoreHistogram = ({ students }: { students: StudentStat[] }) => {
  const withScore = students.filter((s) => s.avgScore !== null);
  const counts    = BUCKETS.map((b) =>
    withScore.filter((s) => (s.avgScore ?? 0) >= b.min && (s.avgScore ?? 0) < b.max).length
  );
  const maxCount  = Math.max(...counts, 1);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2" style={{ height: 100 }}>
        {BUCKETS.map((b, i) => (
          <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
            <span className={cn("text-xs font-bold", counts[i] > 0 ? b.textColor : "text-muted-foreground")}>
              {counts[i]}
            </span>
            <div className="w-full flex items-end" style={{ height: 72 }}>
              <div
                className={cn("w-full rounded-t transition-all duration-700", b.color)}
                style={{ height: `${(counts[i] / maxCount) * 100}%`, minHeight: counts[i] > 0 ? 4 : 0 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {BUCKETS.map((b) => (
          <span key={b.label} className="flex-1 text-[11px] text-muted-foreground text-center font-medium">{b.label}</span>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Per-test pass/fail horizontal bar
// ─────────────────────────────────────────────
const TestPassRateBar = ({ test, total }: { test: TestStat; total: number }) => {
  const passRate  = test.submittedCount > 0 ? Math.round((test.passCount / test.submittedCount) * 100) : 0;
  const notSubmit = total - test.submittedCount;

  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-xs text-foreground font-medium truncate min-w-[90px] max-w-[120px]" title={test.testName}>
        {test.testName}
      </span>
      <div className="flex-1 flex items-center gap-1 min-w-0">
        {/* Stacked bar: pass / fail / missing */}
        <div className="flex-1 flex h-5 rounded-full overflow-hidden bg-muted/40">
          {test.submittedCount > 0 && (
            <>
              <div
                className="bg-green-400 flex items-center justify-center transition-all duration-700"
                style={{ width: `${(test.passCount / total) * 100}%` }}
                title={`Đạt: ${test.passCount}`}
              >
                {test.passCount > 2 && <span className="text-[10px] text-white font-bold">{test.passCount}</span>}
              </div>
              <div
                className="bg-red-400 flex items-center justify-center transition-all duration-700"
                style={{ width: `${(test.failCount / total) * 100}%` }}
                title={`Rớt: ${test.failCount}`}
              >
                {test.failCount > 2 && <span className="text-[10px] text-white font-bold">{test.failCount}</span>}
              </div>
            </>
          )}
          <div
            className="bg-muted flex items-center justify-center transition-all duration-700"
            style={{ width: `${(notSubmit / total) * 100}%` }}
            title={`Chưa nộp: ${notSubmit}`}
          />
        </div>
        <span className={cn(
          "text-xs font-bold shrink-0 w-9 text-right",
          passRate >= 80 ? "text-green-600" : passRate >= 60 ? "text-blue-600" : passRate >= 40 ? "text-yellow-600" : "text-red-500"
        )}>
          {test.submittedCount > 0 ? `${passRate}%` : "—"}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Percentile rank helper
// ─────────────────────────────────────────────
const getPercentileRank = (student: StudentStat, allStudents: StudentStat[]): number | null => {
  if (student.avgScore === null) return null;
  const withScore = allStudents.filter((s) => s.avgScore !== null);
  if (withScore.length === 0) return null;
  const below = withScore.filter((s) => (s.avgScore ?? 0) < (student.avgScore ?? 0)).length;
  return Math.round((below / withScore.length) * 100);
};

// ─────────────────────────────────────────────
// Bottom-N risk table
// ─────────────────────────────────────────────
const RiskTable = ({ students, classId }: { students: StudentStat[]; classId: number }) => {
  const navigate = useNavigate();
  const [emailedIds, setEmailedIds] = useState<Set<number>>(new Set());
  const [bulkSentCount, setBulkSentCount] = useState<number | null>(null);

  const atRisk = useMemo(() => {
    return students
      .map((s) => ({
        ...s,
        risk:       getRiskLevel(s),
        trend:      getTrend(s),
        percentile: getPercentileRank(s, students),
      }))
      .filter((s) => s.risk !== null)
      .sort((a, b) => {
        const riskOrder: Record<NonNullable<RiskLevel>, number> = { danger: 0, warning: 1, watch: 2 };
        const ro = riskOrder[(a.risk as NonNullable<RiskLevel>)] - riskOrder[(b.risk as NonNullable<RiskLevel>)];
        if (ro !== 0) return ro;
        return (a.avgScore ?? -1) - (b.avgScore ?? -1);
      })
      .slice(0, 10);
  }, [students]);

  const handleSendEmail = (studentId: number) => {
    setEmailedIds((prev) => new Set([...prev, studentId]));
  };

  const handleBulkSend = () => {
    const dangerIds = atRisk.filter((s) => s.risk === "danger").map((s) => s.studentId);
    const unsentCount = dangerIds.filter((id) => !emailedIds.has(id)).length;
    setEmailedIds((prev) => new Set([...prev, ...dangerIds]));
    if (unsentCount > 0) setBulkSentCount(unsentCount);
  };

  if (atRisk.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
        <CheckCircle2 className="size-10 text-green-400 opacity-70" />
        <p className="text-sm font-medium">Tất cả học sinh đều ổn!</p>
        <p className="text-xs">Không có học sinh nào trong vùng nguy hiểm</p>
      </div>
    );
  }

  const dangerCount  = atRisk.filter((s) => s.risk === "danger").length;
  const warningCount = atRisk.filter((s) => s.risk === "warning").length;
  const watchCount   = atRisk.filter((s) => s.risk === "watch").length;
  const unsentDanger = atRisk.filter((s) => s.risk === "danger" && !emailedIds.has(s.studentId)).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Risk legend + bulk email */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {dangerCount  > 0 && <span className="flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 px-2.5 py-1 border border-red-200 font-medium"><Flame className="size-3" />{dangerCount} Nguy hiểm</span>}
        {warningCount > 0 && <span className="flex items-center gap-1.5 rounded-full bg-orange-100 text-orange-700 px-2.5 py-1 border border-orange-200 font-medium"><ShieldAlert className="size-3" />{warningCount} Cảnh báo</span>}
        {watchCount   > 0 && <span className="flex items-center gap-1.5 rounded-full bg-yellow-100 text-yellow-700 px-2.5 py-1 border border-yellow-200 font-medium"><AlertTriangle className="size-3" />{watchCount} Theo dõi</span>}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-muted-foreground">Hiển thị {atRisk.length} / {students.length} học sinh</span>
          {dangerCount > 0 && (
            <button
              onClick={handleBulkSend}
              disabled={unsentDanger === 0}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all",
                unsentDanger === 0
                  ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                  : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              )}
            >
              {unsentDanger === 0 ? <MailCheck className="size-3.5" /> : <Mail className="size-3.5" />}
              {unsentDanger === 0 ? "Đã gửi tất cả" : `Gửi email cảnh báo (${unsentDanger})`}
            </button>
          )}
        </div>
      </div>

      {/* Bulk sent success banner */}
      {bulkSentCount !== null && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
          <MailCheck className="size-4 text-green-600 shrink-0" />
          <p className="text-xs text-green-700">
            Đã gửi email cảnh báo điểm số thấp đến{" "}
            <span className="font-bold">{bulkSentCount}</span> học sinh nguy hiểm.
          </p>
          <button onClick={() => setBulkSentCount(null)} className="ml-auto text-green-400 hover:text-green-600 text-base leading-none">×</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-8">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Học sinh</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mức rủi ro</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Điểm TB</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Xu hướng</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đã nộp</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Điểm từng bài</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {atRisk.map((s, i) => {
                const cfg      = RISK_CONFIG[s.risk!];
                const RiskIcon = cfg.icon;
                const missing  = s.totalTests - s.submittedCount;
                const emailed  = emailedIds.has(s.studentId);
                const canEmail = s.risk === "danger" || s.risk === "warning";

                return (
                  <tr
                    key={s.studentId}
                    className={cn("hover:bg-muted/20 transition-colors", cfg.rowCls)}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3 text-center text-xs text-muted-foreground font-medium">{i + 1}</td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("size-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                          s.risk === "danger" ? "bg-red-400" : s.risk === "warning" ? "bg-orange-400" : "bg-yellow-400"
                        )}>
                          {s.studentName.split(" ").at(-1)?.[0] ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{s.studentName}</p>
                          {missing > 0 && (
                            <p className="text-[10px] text-red-500 font-medium">Thiếu {missing} bài</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Risk badge */}
                    <td className="px-4 py-3 text-center">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", cfg.badgeCls)}>
                        <RiskIcon className="size-3" />
                        {cfg.label}
                      </span>
                    </td>

                    {/* Avg score */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn("text-base font-bold",
                          s.avgScore === null ? "text-muted-foreground" :
                          s.avgScore < 4  ? "text-red-600"    :
                          s.avgScore < 5  ? "text-orange-600" :
                          s.avgScore < 6.5 ? "text-yellow-600" : "text-blue-600"
                        )}>
                          {s.avgScore !== null ? s.avgScore : "—"}
                        </span>
                        {s.avgScore !== null && (
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn("h-full rounded-full",
                                s.avgScore < 4  ? "bg-red-400"    :
                                s.avgScore < 5  ? "bg-orange-400" :
                                s.avgScore < 6.5 ? "bg-yellow-400" : "bg-blue-400"
                              )}
                              style={{ width: `${(s.avgScore / 10) * 100}%` }}
                            />
                          </div>
                        )}
                        {s.percentile !== null && (
                          <span
                            className={cn(
                              "text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none",
                              s.percentile <= 10
                                ? "bg-red-100 text-red-600"
                                : "bg-muted text-muted-foreground"
                            )}
                            title="Phân vị trong lớp (percentile)"
                          >
                            P{s.percentile}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Trend */}
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center">
                        <TrendIcon trend={s.trend} />
                        {s.trend === null && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </td>

                    {/* Submitted */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {s.submittedCount < s.totalTests
                          ? <XCircle className="size-3.5 text-red-400" />
                          : <CheckCircle2 className="size-3.5 text-green-500" />
                        }
                        <span className={cn("text-xs font-medium",
                          s.submittedCount === 0 ? "text-red-500" :
                          s.submittedCount < s.totalTests ? "text-orange-500" : "text-green-600"
                        )}>
                          {s.submittedCount}/{s.totalTests}
                        </span>
                      </div>
                    </td>

                    {/* Mini score chips */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1 justify-center flex-wrap">
                        {s.testScores.map((sc, ti) => (
                          <span
                            key={ti}
                            className={cn(
                              "inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold min-w-[28px]",
                              sc === null        ? "bg-muted/60 text-muted-foreground"    :
                              sc >= 8             ? "bg-green-100 text-green-700"          :
                              sc >= 5             ? "bg-blue-100 text-blue-700"            :
                              sc >= 3             ? "bg-orange-100 text-orange-700"        :
                              "bg-red-100 text-red-600"
                            )}
                            title={sc === null ? "Chưa nộp" : String(sc)}
                          >
                            {sc !== null ? sc : "—"}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Email button */}
                    <td className="px-4 py-3 text-center">
                      {canEmail ? (
                        <button
                          onClick={() => handleSendEmail(s.studentId)}
                          disabled={emailed}
                          className={cn(
                            "flex items-center justify-center size-7 rounded-lg transition-colors mx-auto",
                            emailed
                              ? "bg-green-50 text-green-500 cursor-default"
                              : "hover:bg-red-50 text-muted-foreground hover:text-red-500"
                          )}
                          title={emailed ? "Đã gửi email cảnh báo" : "Gửi email cảnh báo điểm số"}
                        >
                          {emailed ? <MailCheck className="size-4" /> : <Mail className="size-4" />}
                        </button>
                      ) : (
                        <span className="text-muted-foreground/30 text-xs">—</span>
                      )}
                    </td>

                    {/* Detail link */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/teacher/students/${classId}/${s.studentId}`)}
                        className="flex items-center justify-center size-7 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors mx-auto"
                        title="Xem hồ sơ học sinh"
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

      {/* Risk explanation */}
      <div className="rounded-xl border border-border bg-muted/10 p-3">
        <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
          <Eye className="size-3.5" />Tiêu chí đánh giá rủi ro
        </p>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Flame className="size-3 text-red-500" />Nguy hiểm: Điểm TB &lt; 5 hoặc &lt; 50% bài đã nộp</span>
          <span className="flex items-center gap-1.5"><ShieldAlert className="size-3 text-orange-500" />Cảnh báo: Điểm TB &lt; 5.5 hoặc thiếu ≥30% bài</span>
          <span className="flex items-center gap-1.5"><AlertTriangle className="size-3 text-yellow-500" />Theo dõi: Điểm TB &lt; 6.5 hoặc thiếu ≥15% bài</span>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-2 flex items-center gap-1.5 border-t border-border pt-2">
          <Mail className="size-3" />
          <strong>P (Percentile):</strong> phân vị trong lớp. <span className="text-red-500 font-semibold">P≤10</span> = nhóm 10% thấp nhất — ưu tiên gửi email cảnh báo.
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Class overview stats
// ─────────────────────────────────────────────
const ClassSummaryCards = ({ cls }: { cls: ClassStats }) => {
  const items = [
    {
      icon: Users,      label: "Học sinh",     value: String(cls.students.length),
      sub: "trong lớp",  iconCls: "text-blue-500", bgCls: "bg-blue-50",
    },
    {
      icon: TrendingUp, label: "Điểm TB",      value: cls.avgScore !== null ? String(cls.avgScore) : "—",
      sub: "/10 điểm",   iconCls: "text-green-600", bgCls: "bg-green-50",
    },
    {
      icon: CheckCircle2, label: "Tỉ lệ đạt",  value: `${cls.passRate}%`,
      sub: "≥ 5 điểm",    iconCls: "text-emerald-600", bgCls: "bg-emerald-50",
    },
    {
      icon: XCircle,    label: "Học sinh rớt", value: String(cls.failCount),
      sub: "dưới 5 điểm", iconCls: "text-red-500", bgCls: "bg-red-50",
    },
    {
      icon: Flame,      label: "Cần can thiệp", value: String(cls.atRiskCount),
      sub: "học sinh rủi ro", iconCls: "text-orange-500", bgCls: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
          <div className={cn("flex size-8 items-center justify-center rounded-lg", item.bgCls)}>
            <item.icon className={cn("size-4 shrink-0", item.iconCls)} />
          </div>
          <div>
            <p className={cn("text-2xl font-bold",
              item.label === "Học sinh rớt" && cls.failCount > 0 ? "text-red-500" :
              item.label === "Cần can thiệp" && cls.atRiskCount > 0 ? "text-orange-500" :
              "text-foreground"
            )}>
              {item.value}
            </p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-[10px] text-muted-foreground/70">{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// Overall stats across all classes
// ─────────────────────────────────────────────
const GlobalSummary = ({ classes }: { classes: ClassStats[] }) => {
  const totalStudents = classes.reduce((a, c) => a + c.students.length, 0);
  const allWithScore  = classes.flatMap((c) => c.students.filter((s) => s.avgScore !== null));
  const globalAvg     = allWithScore.length
    ? Math.round((allWithScore.reduce((a, s) => a + (s.avgScore ?? 0), 0) / allWithScore.length) * 10) / 10
    : null;
  const globalFail    = classes.reduce((a, c) => a + c.failCount, 0);
  const globalRisk    = classes.reduce((a, c) => a + c.atRiskCount, 0);
  const worstClass    = [...classes].sort((a, b) => (a.passRate ?? 0) - (b.passRate ?? 0))[0];

  return (
    <div className="rounded-xl border border-border bg-gradient-to-r from-card to-muted/10 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="size-5 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Tổng quan toàn bộ lớp</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">{totalStudents}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tổng học sinh</p>
        </div>
        <div className="text-center">
          <p className={cn("text-3xl font-bold",
            globalAvg === null ? "text-muted-foreground" :
            globalAvg >= 6.5 ? "text-green-600" : globalAvg >= 5 ? "text-blue-600" : "text-red-500"
          )}>
            {globalAvg ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">ĐTB chung</p>
        </div>
        <div className="text-center">
          <p className={cn("text-3xl font-bold", globalFail > 0 ? "text-red-500" : "text-green-600")}>
            {globalFail}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">HS rớt môn</p>
        </div>
        <div className="text-center">
          <p className={cn("text-3xl font-bold", globalRisk > 0 ? "text-orange-500" : "text-green-600")}>
            {globalRisk}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">HS có nguy cơ</p>
        </div>
      </div>

      {worstClass && worstClass.passRate < 80 && (
        <div className="flex items-center gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
          <Flame className="size-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700">
            Lớp <span className="font-bold">{worstClass.className}</span> có tỉ lệ đạt thấp nhất:{" "}
            <span className="font-bold">{worstClass.passRate}%</span> — cần chú ý!
          </p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
const ACTIVE_CLASSES_META = CLASSES_META.filter((m) => m.status === "active");
const allClassStats = buildClassStats();

const ScoresPage = () => {
  const [activeClass, setActiveClass] = useState<number>(ACTIVE_CLASSES_META[0].classId);

  const cls = useMemo(
    () => allClassStats.find((c) => c.classId === activeClass)!,
    [activeClass]
  );

  const accent = subjectAccent[cls.subjectId] ?? defaultAccent;

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="text-sm font-semibold text-foreground">Điểm số & Phân tích</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Đánh giá chất lượng học tập, phát hiện học sinh có nguy cơ rớt môn
        </p>
      </div>

      {/* Global summary */}
      <GlobalSummary classes={allClassStats} />

      {/* Class tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <GraduationCap className="size-4 text-muted-foreground shrink-0" />
        {ACTIVE_CLASSES_META.map((meta) => {
          const isActive = meta.classId === activeClass;
          const ac       = subjectAccent[meta.subjectId] ?? defaultAccent;
          const stat     = allClassStats.find((c) => c.classId === meta.classId);
          return (
            <button
              key={meta.classId}
              onClick={() => setActiveClass(meta.classId)}
              className={cn(
                "relative h-9 rounded-xl px-4 text-sm font-medium border transition-all",
                isActive ? ac.activeTab : ac.tab + " hover:bg-muted/40"
              )}
            >
              {meta.className}
              <span className={cn("ml-1.5 text-xs opacity-70")}>· {meta.subjectName.slice(0,4)}.</span>
              {/* Red dot if has danger students */}
              {(stat?.students.some((s) => getRiskLevel(s) === "danger")) && (
                <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-red-500 border-2 border-background" />
              )}
            </button>
          );
        })}
      </div>

      {/* Class strip banner */}
      <div className={cn("h-1 rounded-full", accent.strip)} />

      {/* Per-class summary cards */}
      <ClassSummaryCards cls={cls} />

      {/* Two-column: histogram + pass rate bars */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Distribution */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Phân bố điểm trung bình</h3>
            <span className="ml-auto text-xs text-muted-foreground">
              {cls.students.filter((s) => s.avgScore !== null).length} / {cls.students.length} hs có điểm
            </span>
          </div>
          <ScoreHistogram students={cls.students} />
          {/* Legend */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
            {BUCKETS.map((b) => (
              <span key={b.label} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className={cn("size-2.5 rounded-sm inline-block", b.color)} />{b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Pass rate per test */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">Tỉ lệ đạt theo đề thi</h3>
          </div>
          {cls.tests.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <BookOpen className="size-7 opacity-30" />
              <p className="text-xs">Chưa có đề thi nào</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cls.tests.map((t) => (
                <TestPassRateBar key={t.testId} test={t} total={cls.students.length} />
              ))}
            </div>
          )}
          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground border-t border-border pt-2">
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-green-400 inline-block" />Đạt</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-red-400 inline-block" />Rớt</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-muted inline-block" />Chưa nộp</span>
          </div>
        </div>
      </div>

      {/* Risk / bottom students */}
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Medal className="size-4 text-red-500" />
          <h3 className="text-base font-semibold text-foreground">
            Học sinh có nguy cơ — Lớp {cls.className}
          </h3>
          <span className="text-xs text-muted-foreground">(Top 10 cần can thiệp)</span>
        </div>
        <RiskTable students={cls.students} classId={cls.classId} />
      </div>
    </div>
  );
};

export default ScoresPage;
