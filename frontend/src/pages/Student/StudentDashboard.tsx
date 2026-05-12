
import { useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ClipboardList,
  PlayCircle,
  Clock,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Trophy,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStudentStore } from "@/stores/useStudentStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { examService } from "@/services/examService";
import type { StudentTest } from "@/types/exam";

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

interface PendingCardProps {
  test: StudentTest;
  className: string;
  classId: number;
  studentId: number;
}

const PendingCard = ({ test, className, studentId }: PendingCardProps) => {
  const navigate = useNavigate();

  const handleStart = async () => {
    try {
      const result = await examService.start(studentId, test.testId);
      navigate(`/student/exam/${result.doexamId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể bắt đầu bài thi");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="d-flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{test.testName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{className}</p>
        </div>
        {test.ongoingDoexamId && (
          <span className="shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700">
            Đang làm
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" />
          {test.duration} phút
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="size-3.5" />
          {test.numQuestion} câu
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="size-3.5" />
          {test.doneTurns}/{test.maxTurns} lượt
        </span>
      </div>

      <div className="text-xs text-muted-foreground">
        Hết hạn: {formatDate(test.endAt)}
      </div>

      <button
        onClick={handleStart}
        className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-primary py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <PlayCircle className="size-4" />
        {test.ongoingDoexamId ? "Tiếp tục làm" : "Làm bài ngay"}
      </button>
    </div>
  );
};

const StudentDashboard = () => {
  const { classes, loading, fetchClasses, getPendingTests } = useStudentStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) fetchClasses(user.id);
  }, [user?.id, fetchClasses]);

  const pending = getPendingTests();

  const totalTests = classes.reduce((acc, c) => acc + c.tests.length, 0);
  const doneTasks = classes.reduce((acc, c) => acc + c.tests.reduce((a, t) => a + (t.doneTurns > 0 ? 1 : 0), 0), 0);
  const avgScore = (() => {
    const scores = classes.flatMap((c) => c.tests.map((t) => t.bestScore).filter((s): s is number => s !== null));
    if (scores.length === 0) return null;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  })();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Xin chào, {user?.name ?? "Học sinh"}!</h1>
        <p className="text-sm text-muted-foreground mt-1">Đây là tổng quan học tập của bạn</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: GraduationCap, label: "Lớp học", value: classes.length, color: "text-blue-600 bg-blue-50" },
          { icon: ClipboardList, label: "Tổng bài thi", value: totalTests, color: "text-purple-600 bg-purple-50" },
          { icon: CheckCircle2, label: "Đã hoàn thành", value: doneTasks, color: "text-green-600 bg-green-50" },
          { icon: Trophy, label: "Điểm TB tốt nhất", value: avgScore ?? "—", color: "text-yellow-600 bg-yellow-50" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className={cn("size-10 rounded-lg flex items-center justify-center shrink-0", stat.color)}>
              <stat.icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending tests */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="size-5 text-orange-500" />
          <h2 className="font-semibold">Bài thi đang mở ({pending.length})</h2>
        </div>

        {loading ? (
          <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
            Đang tải...
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground text-sm">
            Không có bài thi nào đang mở. Bạn đã hoàn thành tất cả bài thi trong thời hạn!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pending.map(({ test, className, classId }) => (
              <PendingCard
                key={test.testId}
                test={test}
                className={className}
                classId={classId}
                studentId={user!.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
