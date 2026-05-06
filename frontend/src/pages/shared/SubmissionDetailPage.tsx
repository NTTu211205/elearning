/*  SubmissionDetailPage.tsx
 *  Shared "review exam" page used by both teacher and student routes.
 *  Route params: classId (optional), studentId, testId
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  BarChart2,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Trophy,
  User,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { examService } from "@/services/examService";
import type { SubmissionDetail, SubmissionAnswerRecord } from "@/types/exam";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
type AnswerRecord = SubmissionAnswerRecord;
const LABEL = ["A", "B", "C", "D", "E"];

const getScoreRank = (score: number) => {
  if (score >= 8)   return { label: "Giỏi",       cls: "bg-green-100 text-green-700",   bar: "bg-green-500",  text: "text-green-600"  };
  if (score >= 6.5) return { label: "Khá",         cls: "bg-blue-100 text-blue-700",     bar: "bg-blue-500",   text: "text-blue-600"   };
  if (score >= 5)   return { label: "Trung bình",  cls: "bg-yellow-100 text-yellow-700", bar: "bg-yellow-400", text: "text-yellow-600" };
  return               { label: "Yếu",            cls: "bg-red-100 text-red-600",       bar: "bg-red-500",    text: "text-red-600"    };
};

const fmtDt = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// ─────────────────────────────────────────────
// Question navigator strip
// ─────────────────────────────────────────────
const QuestionNavigator = ({ answers }: { answers: AnswerRecord[] }) => (
  <div className="flex flex-wrap gap-1.5">
    {answers.map((a) => {
      const isCorrect = a.chosenIndex === a.correctIndex;
      const isSkipped = a.chosenIndex === null;
      return (
        <button
          key={a.questionIndex}
          title={`Câu ${a.questionIndex}: ${isSkipped ? "Bỏ qua" : isCorrect ? "Đúng" : "Sai"}`}
          onClick={() =>
            document.getElementById(`q-${a.questionIndex}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
          className={cn(
            "size-7 rounded-md text-xs font-bold transition-colors",
            isSkipped  ? "bg-muted text-muted-foreground hover:bg-muted/70"  :
            isCorrect  ? "bg-green-500 text-white hover:bg-green-600"         :
            "bg-red-400 text-white hover:bg-red-500"
          )}
        >
          {a.questionIndex}
        </button>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────
// Single answer card
// ─────────────────────────────────────────────
const AnswerCard = ({ answer }: { answer: AnswerRecord }) => {
  const isCorrect = answer.chosenIndex === answer.correctIndex;
  const isSkipped = answer.chosenIndex === null;

  return (
    <div
      id={`q-${answer.questionIndex}`}
      className={cn(
        "rounded-xl border p-4 flex flex-col gap-3 transition-colors",
        isSkipped  ? "border-border bg-muted/10"          :
        isCorrect  ? "border-green-200 bg-green-50/40"    :
        "border-red-200 bg-red-50/40"
      )}
    >
      {/* Question header */}
      <div className="flex items-start gap-3">
        <span className={cn(
          "min-w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
          isSkipped  ? "bg-muted text-muted-foreground"  :
          isCorrect  ? "bg-green-500 text-white"          :
          "bg-red-400 text-white"
        )}>
          {answer.questionIndex}
        </span>
        <p className="text-sm font-medium text-foreground leading-snug pt-0.5">
          {answer.questionText}
        </p>
        <span className="ml-auto shrink-0">
          {isSkipped  ? <AlertTriangle className="size-4 text-muted-foreground" /> :
           isCorrect  ? <CheckCircle2  className="size-4 text-green-500" />        :
           <XCircle   className="size-4 text-red-400" />}
        </span>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-1.5 pl-10">
        {answer.options.map((opt, idx) => {
          const isThisCorrect = idx === answer.correctIndex;
          const isThisChosen  = idx === answer.chosenIndex;
          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm border",
                isThisCorrect && isThisChosen  ? "bg-green-200 border-green-300 font-medium"         :
                isThisCorrect                  ? "bg-green-100 border-green-200 font-medium"          :
                isThisChosen && !isThisCorrect ? "bg-red-100 border-red-200 font-medium"              :
                "bg-background border-border/40 text-muted-foreground"
              )}
            >
              <span className={cn(
                "size-5 min-w-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                isThisCorrect ? "bg-green-500 text-white" :
                isThisChosen  ? "bg-red-400 text-white"   :
                "bg-muted text-muted-foreground"
              )}>
                {LABEL[idx]}
              </span>
              <span className="flex-1 leading-tight">{opt}</span>
              {isThisCorrect && <CheckCircle2 className="size-3.5 text-green-600 shrink-0" />}
              {isThisChosen && !isThisCorrect && <XCircle className="size-3.5 text-red-500 shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Verdict note */}
      {!isCorrect && !isSkipped && (
        <p className="text-xs text-red-500 mt-2 pl-9">
          Bạn chọn <span className="font-bold">{LABEL[answer.chosenIndex!]}</span> —
          Đáp án đúng: <span className="font-bold text-green-700">{LABEL[answer.correctIndex]}: {answer.options[answer.correctIndex]}</span>
        </p>
      )}
      {isSkipped && (
        <p className="text-xs text-muted-foreground mt-2 pl-9">
          Không trả lời —
          Đáp án đúng: <span className="font-bold text-green-700">{LABEL[answer.correctIndex]}: {answer.options[answer.correctIndex]}</span>
        </p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Filter tabs
// ─────────────────────────────────────────────
type AnswerFilter = "all" | "correct" | "wrong" | "skipped";

const FILTER_LABELS: { key: AnswerFilter; label: string; icon: React.FC<{ className?: string }>; activeClass: string }[] = [
  { key: "all",     label: "Tất cả",  icon: BarChart2,     activeClass: "bg-primary text-primary-foreground border-primary"           },
  { key: "correct", label: "Đúng",    icon: CheckCircle2,  activeClass: "bg-green-500 text-white border-green-500"                    },
  { key: "wrong",   label: "Sai",     icon: XCircle,       activeClass: "bg-red-400 text-white border-red-400"                        },
  { key: "skipped", label: "Bỏ qua",  icon: AlertTriangle, activeClass: "bg-muted-foreground text-white border-muted-foreground"      },
];

// ─────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────
const SubmissionDetailPage = () => {
  const { studentId, testId } = useParams<{
    classId: string; studentId: string; testId: string;
  }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AnswerFilter>("all");

  useEffect(() => {
    if (!studentId || !testId) return;
    const load = async () => {
      try {
        const result = await examService.getSubmissionByStudentTest(
          Number(studentId),
          Number(testId)
        );
        setData(result);
      } catch {
        toast.error("Không tìm thấy bài làm của học sinh này");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId, testId]);

  // useMemo must be unconditional — before any early returns
  const answers = data?.answers ?? [];
  const visibleAnswers = useMemo(() => {
    switch (filter) {
      case "correct": return answers.filter((a) => a.chosenIndex === a.correctIndex);
      case "wrong":   return answers.filter((a) => a.chosenIndex !== null && a.chosenIndex !== a.correctIndex);
      case "skipped": return answers.filter((a) => a.chosenIndex === null);
      default:        return answers;
    }
  }, [answers, filter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Đang tải kết quả bài làm...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <BarChart2 className="size-12 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Không tìm thấy bài làm</p>
        <button onClick={() => navigate(-1)} className="text-sm text-primary hover:underline">
          Quay lại
        </button>
      </div>
    );
  }

  const { session, answers: rawAnswers } = data;
  const correctCount = rawAnswers.filter((a) => a.chosenIndex === a.correctIndex).length;
  const skippedCount = rawAnswers.filter((a) => a.chosenIndex === null).length;
  const wrongCount   = rawAnswers.length - correctCount - skippedCount;
  const accuracy     = rawAnswers.length > 0 ? Math.round((correctCount / rawAnswers.length) * 100) : 0;
  const rank         = getScoreRank(session.score);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="size-4" />
        Quay lại
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
        <div className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className={cn(
            "flex flex-col items-center justify-center size-24 rounded-2xl shrink-0 font-bold",
            session.score >= 8   ? "bg-green-500 text-white" :
            session.score >= 6.5 ? "bg-blue-500 text-white"  :
            session.score >= 5   ? "bg-yellow-400 text-white" : "bg-red-400 text-white"
          )}>
            <span className="text-4xl leading-none">{session.score}</span>
            <span className="text-xs opacity-80 mt-0.5">/10</span>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div>
              <h1 className="text-lg font-bold text-foreground">{session.testName}</h1>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold mt-0.5", rank.cls)}>
                <Trophy className="size-3" />
                {rank.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User         className="size-3.5" />{session.studentName}</span>
              <span className="flex items-center gap-1"><GraduationCap className="size-3.5" />Lớp {session.className} · {session.subjectName}</span>
              <span className="flex items-center gap-1"><BookOpen     className="size-3.5" />{session.num_question} câu</span>
              <span className="flex items-center gap-1"><Clock        className="size-3.5" />{session.duration} phút</span>
              <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />Nộp lúc {fmtDt(session.submitAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex flex-col gap-1">
          <CheckCircle2 className="size-5 text-green-500" />
          <p className="text-2xl font-bold text-green-700">{correctCount}</p>
          <p className="text-xs text-green-600/80">Câu đúng</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex flex-col gap-1">
          <XCircle className="size-5 text-red-400" />
          <p className="text-2xl font-bold text-red-600">{wrongCount}</p>
          <p className="text-xs text-red-500/80">Câu sai</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col gap-1">
          <AlertTriangle className="size-5 text-muted-foreground" />
          <p className="text-2xl font-bold text-foreground">{skippedCount}</p>
          <p className="text-xs text-muted-foreground">Bỏ qua</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
          <BarChart2 className="size-5 text-primary" />
          <p className={cn("text-2xl font-bold", rank.text)}>{accuracy}%</p>
          <p className="text-xs text-muted-foreground">Tỉ lệ đúng</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Điểm số</span>
          <span className={cn("font-bold", rank.text)}>{session.score}/10 — {rank.label}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-1000", rank.bar)}
            style={{ width: `${session.score * 10}%` }}
          />
        </div>
      </div>

      {/* Navigator */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Bản đồ câu hỏi</h3>
        <QuestionNavigator answers={rawAnswers} />
      </div>

      {/* Answer list */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-semibold text-foreground">Chi tiết từng câu</h2>
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTER_LABELS.map((f) => {
              const Icon = f.icon;
              const counts: Record<AnswerFilter, number> = {
                all:     rawAnswers.length,
                correct: correctCount,
                wrong:   wrongCount,
                skipped: skippedCount,
              };
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "flex items-center gap-1.5 h-7 rounded-full px-3 text-xs font-medium border transition-colors",
                    filter === f.key ? f.activeClass : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="size-3" />
                  {f.label}
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    filter === f.key ? "bg-white/20" : "bg-muted"
                  )}>
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {visibleAnswers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 rounded-xl border border-border bg-card text-muted-foreground">
            <CheckCircle2 className="size-8 opacity-30" />
            <p className="text-sm">Không có câu nào trong mục này</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleAnswers.map((a) => (
              <AnswerCard key={a.questionIndex} answer={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionDetailPage;
