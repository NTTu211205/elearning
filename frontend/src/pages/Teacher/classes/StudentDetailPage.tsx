import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { enrollmentStudentService } from "@/services/examService";
import type { StudentDetailInClass } from "@/types/exam";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  TrendingUp,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  BarChart2,
  Medal,
  Star,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";



// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const subjectAccent: Record<number, { strip: string; avatar: string; badge: string }> = {
  1: { strip: "bg-blue-500",   avatar: "bg-blue-500",   badge: "bg-blue-50 text-blue-700"     },
  2: { strip: "bg-violet-500", avatar: "bg-violet-500", badge: "bg-violet-50 text-violet-700" },
  3: { strip: "bg-orange-500", avatar: "bg-orange-500", badge: "bg-orange-50 text-orange-700" },
};
const defaultAccent = { strip: "bg-primary", avatar: "bg-primary", badge: "bg-muted text-muted-foreground" };

const getRankBadge = (score: number | null) => {
  if (score === null) return { label: "Chưa đánh giá", cls: "bg-muted/60 text-muted-foreground", barColor: "bg-muted", pct: 0 };
  if (score >= 8)   return { label: "Giỏi",        cls: "bg-green-100 text-green-700",   barColor: "bg-green-500",  pct: Math.round((score / 10) * 100) };
  if (score >= 6.5) return { label: "Khá",         cls: "bg-blue-100 text-blue-700",     barColor: "bg-blue-500",   pct: Math.round((score / 10) * 100) };
  if (score >= 5)   return { label: "Trung bình",  cls: "bg-yellow-100 text-yellow-700", barColor: "bg-yellow-400", pct: Math.round((score / 10) * 100) };
  return               { label: "Yếu",            cls: "bg-red-100 text-red-600",       barColor: "bg-red-500",    pct: Math.round((score / 10) * 100) };
};

const fmtDt = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

type TestResult = StudentDetailInClass["tests"][number];



// ─────────────────────────────────────────────
// Test result card (simplified — links to SubmissionDetailPage)
// ─────────────────────────────────────────────
const TestResultCard = ({
  result, classId, studentId,
}: {
  result: TestResult; classId: number; studentId: number;
}) => {
  const navigate  = useNavigate();
  const rank      = getRankBadge(result.score);
  const submitted = result.score !== null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex size-9 items-center justify-center rounded-lg shrink-0",
          submitted ? "bg-amber-100" : "bg-muted/40"
        )}>
          <FileText className={cn("size-4", submitted ? "text-amber-600" : "text-muted-foreground")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{result.testName}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <BookOpen className="size-3" />{result.questionCount} câu
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />{result.duration} phút
            </span>
            {result.submitAt && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3" />Nộp lúc {fmtDt(result.submitAt)}
              </span>
            )}
          </div>
        </div>
        {submitted ? (
          <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", rank.cls)}>
            {result.score}/10
          </span>
        ) : (
          <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
            Chưa nộp
          </span>
        )}
      </div>

      {/* Stats (submitted only) */}
      {submitted && (
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-700">{result.correctCount}</p>
              <p className="text-[10px] text-green-600/70">Đúng</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
            <XCircle className="size-4 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-600">{result.wrongCount}</p>
              <p className="text-[10px] text-red-500/70">Sai</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <AlertTriangle className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">{result.skippedCount}</p>
              <p className="text-[10px] text-muted-foreground">Bỏ qua</p>
            </div>
          </div>
        </div>
      )}

      {/* View detail button */}
      {submitted && (
        <button
          onClick={() => navigate(`/teacher/submission/${classId}/${studentId}/${result.testId}`)}
          className="flex items-center justify-center gap-2 w-full h-8 rounded-lg border border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
        >
          <ExternalLink className="size-3.5" />
          Xem chi tiết bài làm
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
const StudentDetailPage = () => {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<StudentDetailInClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [testFilter, setTestFilter] = useState<"all" | "submitted" | "missing">("all");

  useEffect(() => {
    if (!classId || !studentId) return;
    const load = async () => {
      try {
        const data = await enrollmentStudentService.getStudentDetailInClass(
          Number(classId),
          Number(studentId)
        );
        setDetail(data);
      } catch {
        toast.error("Không thể tải thông tin học sinh");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classId, studentId]);

  // useMemo must be called unconditionally before any early returns
  const visibleTests = useMemo(() => {
    const testResults = detail?.tests ?? [];
    if (testFilter === "submitted") return testResults.filter((r) => r.score !== null);
    if (testFilter === "missing")   return testResults.filter((r) => r.score === null);
    return testResults;
  }, [detail, testFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Đang tải thông tin học sinh...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <GraduationCap className="size-12 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Không tìm thấy học sinh</p>
        <button onClick={() => navigate(-1)} className="text-sm text-primary hover:underline">
          Quay lại
        </button>
      </div>
    );
  }

  const { profile, tests: testResults } = detail;
  const accent = subjectAccent[profile.subjectId] ?? defaultAccent;

  const submittedResults = testResults.filter((r) => r.score !== null);
  const avgScore = profile.averageScore;
  const rank      = getRankBadge(avgScore);
  const correct   = submittedResults.reduce((a, r) => a + r.correctCount, 0);
  const total     = submittedResults.reduce((a, r) => a + r.questionCount, 0);
  const accuracy  = total > 0 ? Math.round((correct / total) * 100) : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="size-4" />
        Quay lại danh sách học sinh
      </button>

      {/* Profile card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className={cn("h-2", accent.strip)} />
        <div className="p-6 flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className={cn("size-20 rounded-2xl text-white flex items-center justify-center text-3xl font-bold", accent.avatar)}>
              {profile.studentName.split(" ").at(-1)?.[0] ?? "?"}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground">{profile.studentName}</h2>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium mt-1", accent.badge)}>
                <GraduationCap className="size-3" />Lớp {profile.className} · {profile.subjectName}
              </span>
            </div>
          </div>

          {/* Info grid */}
          <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2.5 rounded-xl bg-muted/30 px-3 py-2.5">
              <Mail className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
                <p className="text-sm font-medium text-foreground">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-muted/30 px-3 py-2.5">
              <Phone className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Điện thoại</p>
                <p className="text-sm font-medium text-foreground">{profile.phone ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-muted/30 px-3 py-2.5">
              <CalendarDays className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ngày sinh</p>
                <p className="text-sm font-medium text-foreground">
                  {profile.dob
                    ? new Date(profile.dob).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-muted/30 px-3 py-2.5">
              <BookOpen className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Môn học</p>
                <p className="text-sm font-medium text-foreground">{profile.subjectName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Avg score */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Star className="size-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Điểm trung bình</span>
          </div>
          <div className="flex items-end gap-1">
            <span className={cn("text-3xl font-bold leading-none",
              avgScore === null ? "text-muted-foreground" :
              avgScore >= 8 ? "text-green-600" :
              avgScore >= 5 ? "text-blue-600" : "text-red-500"
            )}>
              {avgScore !== null ? avgScore.toFixed(2) : "—"}
            </span>
            {avgScore !== null && <span className="text-sm text-muted-foreground mb-0.5">/10</span>}
          </div>
          <span className={cn("inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium", rank.cls)}>
            {rank.label}
          </span>
        </div>

        {/* Accuracy */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Tỉ lệ câu đúng</span>
          </div>
          <p className={cn("text-3xl font-bold",
            accuracy === null ? "text-muted-foreground" :
            accuracy >= 80 ? "text-green-600" :
            accuracy >= 50 ? "text-blue-600" : "text-red-500"
          )}>
            {accuracy !== null ? `${accuracy}%` : "—"}
          </p>
          <span className="text-xs text-muted-foreground">{correct}/{total} câu đúng</span>
        </div>

        {/* Submitted */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Bài đã nộp</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-foreground leading-none">{submittedResults.length}</span>
            <span className="text-sm text-muted-foreground mb-0.5">/{testResults.length}</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${testResults.length > 0 ? (submittedResults.length / testResults.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Missing */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <XCircle className="size-4 text-red-400" />
            <span className="text-xs text-muted-foreground">Bài chưa nộp</span>
          </div>
          <p className={cn("text-3xl font-bold",
            testResults.length - submittedResults.length === 0 ? "text-green-600" : "text-red-500"
          )}>
            {testResults.length - submittedResults.length}
          </p>
          {testResults.length - submittedResults.length === 0
            ? <span className="text-xs text-green-600">Hoàn thành tất cả</span>
            : <span className="text-xs text-muted-foreground">bài kiểm tra còn thiếu</span>
          }
        </div>
      </div>

      {/* Test results */}
      <div className="flex flex-col gap-3">
        {/* Header + filter */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Medal className="size-4 text-amber-500" />
            Lịch sử bài kiểm tra
          </h2>
          <div className="flex items-center gap-1.5">
            {(["all", "submitted", "missing"] as const).map((key) => {
              const labels = { all: "Tất cả", submitted: "Đã nộp", missing: "Chưa nộp" };
              return (
                <button
                  key={key}
                  onClick={() => setTestFilter(key)}
                  className={cn(
                    "h-7 rounded-full px-3 text-xs font-medium transition-colors border",
                    testFilter === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {labels[key]}
                </button>
              );
            })}
          </div>
        </div>

        {visibleTests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground rounded-xl border border-border bg-card">
            <BarChart2 className="size-8 opacity-30" />
            <p className="text-sm">Không có bài kiểm tra</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleTests.map((r) => (
              <TestResultCard key={r.testId} result={r} classId={Number(classId)} studentId={Number(studentId)} />
            ))}
          </div>
        )}
      </div>

      {/* Teacher note / evaluation */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <User className="size-4 text-primary" />
          Nhận xét của giáo viên
        </h3>
        <textarea
          rows={4}
          placeholder={`Nhập nhận xét về học sinh ${profile.studentName}...`}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Nhận xét sẽ được lưu và hiển thị cho học sinh</p>
          <button className="h-8 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Lưu nhận xét
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailPage;
