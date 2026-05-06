import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  BookOpen,
  Clock,
  ChevronRight,
  PlayCircle,
  Eye,
  Trophy,
  RotateCcw,
  CalendarDays,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStudentStore } from "@/stores/useStudentStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { examService } from "@/services/examService";
import type { StudentClass, StudentTest } from "@/types/exam";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type TestStatus = "upcoming" | "active" | "ended" | "no_turns";

function getTestStatus(test: StudentTest): TestStatus {
  const now = new Date();
  if (!test.startAt || !test.endAt) return "ended";
  const start = new Date(test.startAt);
  const end = new Date(test.endAt);
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  if (test.doneTurns >= test.maxTurns) return "no_turns";
  return "active";
}

const statusLabel: Record<TestStatus, { text: string; cls: string }> = {
  upcoming: { text: "Chưa mở",    cls: "bg-blue-100 text-blue-700" },
  active:   { text: "Đang mở",    cls: "bg-green-100 text-green-700" },
  ended:    { text: "Đã đóng",    cls: "bg-gray-100 text-gray-500" },
  no_turns: { text: "Hết lượt",   cls: "bg-orange-100 text-orange-600" },
};

// ── TestRow ───────────────────────────────────────────────────────────────────

interface TestRowProps {
  test: StudentTest;
  classId: number;
  studentId: number;
}

const TestRow = ({ test, classId, studentId }: TestRowProps) => {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const status = getTestStatus(test);
  const canStart = status === "active";
  const hasDone = test.doneTurns > 0;

  const handleStart = async () => {
    setStarting(true);
    try {
      const result = await examService.start(studentId, test.testId);
      navigate(`/student/exam/${result.doexamId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể bắt đầu bài thi");
    } finally {
      setStarting(false);
    }
  };

  const handleReview = () => {
    // Xem lại bài làm tốt nhất — cần doexamId của lượt điểm cao nhất
    // Ta điều hướng qua submission page shared với classId, studentId, testId
    navigate(`/student/submission/${classId}/${studentId}/${test.testId}`);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border bg-card p-4 hover:bg-accent/30 transition-colors">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground truncate">{test.testName}</span>
          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", statusLabel[status].cls)}>
            {statusLabel[status].text}
          </span>
          {test.ongoingDoexamId && (
            <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700">
              Đang làm dở
            </span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {test.duration} phút
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5" />
            {test.numQuestion} câu
          </span>
          <span className="flex items-center gap-1">
            <RotateCcw className="size-3.5" />
            {test.doneTurns}/{test.maxTurns} lượt
          </span>
          {test.bestScore !== null && (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <Trophy className="size-3.5" />
              Điểm tốt nhất: {test.bestScore}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {formatDate(test.startAt)} — {formatDate(test.endAt)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 shrink-0">
        {hasDone && (
          <button
            onClick={handleReview}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            <Eye className="size-4" />
            Xem lại
          </button>
        )}
        {canStart && (
          <button
            onClick={handleStart}
            disabled={starting}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            <PlayCircle className="size-4" />
            {test.ongoingDoexamId ? "Tiếp tục" : starting ? "Đang mở..." : "Làm bài"}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const StudentClassesPage = () => {
  const { classes, loading, fetchClasses } = useStudentStore();
  const { user } = useAuthStore();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) fetchClasses(user.id);
  }, [user?.id, fetchClasses]);

  useEffect(() => {
    if (classes.length > 0 && selectedClassId === null) {
      setSelectedClassId(classes[0].classId);
    }
  }, [classes, selectedClassId]);

  const selectedClass: StudentClass | undefined = classes.find(
    (c) => c.classId === selectedClassId
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Đang tải...
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <GraduationCap className="size-10 opacity-40" />
        <p>Bạn chưa được đăng ký lớp học nào.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Lớp học</h1>
        <p className="text-sm text-muted-foreground mt-1">Chọn lớp để xem bài kiểm tra</p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Class list */}
        <div className="lg:w-72 shrink-0">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Danh sách lớp ({classes.length})
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {classes.map((cls) => (
                <li key={cls.classId}>
                  <button
                    onClick={() => setSelectedClassId(cls.classId)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      "hover:bg-accent/50",
                      selectedClassId === cls.classId && "bg-accent text-accent-foreground"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{cls.className}</p>
                      <p className="text-xs text-muted-foreground truncate">{cls.subjectName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cls.tests.length} bài thi
                        {cls.classStatus === "ended" && (
                          <span className="ml-1.5 text-orange-500">(Đã kết thúc)</span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Test list */}
        <div className="flex-1 min-w-0">
          {selectedClass ? (
            <div className="flex flex-col gap-4">
              {/* Class header */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="size-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{selectedClass.className}</h2>
                    <p className="text-sm text-muted-foreground">{selectedClass.subjectName}</p>
                  </div>
                  <span
                    className={cn(
                      "ml-auto inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      selectedClass.classStatus === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {selectedClass.classStatus === "active" ? "Đang hoạt động" : "Đã kết thúc"}
                  </span>
                </div>
              </div>

              {/* Tests */}
              {selectedClass.tests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground rounded-xl border border-border">
                  <AlertCircle className="size-8 opacity-40" />
                  <p className="text-sm">Lớp này chưa có bài kiểm tra nào.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedClass.tests.map((test) => (
                    <TestRow
                      key={test.testId}
                      test={test}
                      classId={selectedClass.classId}
                      studentId={user!.id}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StudentClassesPage;
