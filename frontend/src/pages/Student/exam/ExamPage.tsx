import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Send,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { examService } from "@/services/examService";
import type { ExamQuestion, AnswerItem, ExamSession } from "@/types/exam";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

// ── SubmitModal ───────────────────────────────────────────────────────────────

interface SubmitModalProps {
  total: number;
  answered: number;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}

const SubmitModal = ({ total, answered, onConfirm, onCancel, submitting }: SubmitModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div className="w-full max-w-sm mx-4 rounded-xl border bg-card p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="size-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Xác nhận nộp bài</h3>
          <p className="text-sm text-muted-foreground">Bạn không thể thay đổi sau khi nộp</p>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-3 mb-5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Đã trả lời:</span>
          <span className="font-medium text-green-600">{answered}/{total}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-muted-foreground">Chưa trả lời:</span>
          <span className="font-medium text-orange-600">{total - answered}/{total}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors"
        >
          Quay lại
        </button>
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {submitting ? (
            <>
              <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang nộp...
            </>
          ) : (
            <>
              <Send className="size-4" />
              Nộp bài
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

// ── ExamPage ──────────────────────────────────────────────────────────────────

const ExamPage = () => {
  const { doexamId } = useParams<{ doexamId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<ExamSession | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const draftDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load session ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!doexamId) return;
    const load = async () => {
      try {
        const data = await examService.getSession(Number(doexamId));
        setSession(data.session);
        setQuestions(data.questionsForStudent);

        // Merge saved answers with question list
        const merged: AnswerItem[] = data.questionsForStudent.map((q) => {
          const saved = data.savedAnswers.find((a) => a.questionId === q.id);
          return { questionId: q.id, chosenIndex: saved?.chosenIndex ?? null };
        });
        setAnswers(merged);

        // Calculate remaining time
        const elapsed = Math.floor(
          (Date.now() - new Date(data.session.attendAt).getTime()) / 1000
        );
        const totalSecs = data.session.duration * 60;
        const remaining = Math.max(0, totalSecs - elapsed);
        setTimeLeft(remaining);
      } catch {
        toast.error("Không thể tải phiên làm bài");
        navigate("/student/classes");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doexamId, navigate]);

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || submitted) return;
    countdownTimer.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownTimer.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, submitted]);

  // ── Draft save (debounced 800ms after each answer selection) ────────────
  const doSaveDraft = useCallback(
    async (currentAnswers: AnswerItem[]) => {
      if (!doexamId || submitted) return;
      setSaving(true);
      try {
        await examService.saveDraft(Number(doexamId), currentAnswers);
      } catch {
        // silent fail
      } finally {
        setSaving(false);
      }
    },
    [doexamId, submitted]
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleChoose = (chosenIndex: number) => {
    setAnswers((prev) => {
      const next = prev.map((a, i) => (i === currentIdx ? { ...a, chosenIndex } : a));
      // Debounce auto-save: 800ms after last selection
      if (draftDebounce.current) clearTimeout(draftDebounce.current);
      draftDebounce.current = setTimeout(() => doSaveDraft(next), 800);
      return next;
    });
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (submitting) return;
    setShowSubmitModal(false);
    setSubmitting(true);
    clearInterval(countdownTimer.current!);
    if (draftDebounce.current) clearTimeout(draftDebounce.current);
    try {
      const result = await examService.submit(Number(doexamId), answers);
      setSubmitted(true);
      if (autoSubmit) {
        toast.info(`Hết giờ! Đã tự động nộp bài. Điểm: ${result.score}`);
      } else {
        toast.success(`Nộp bài thành công! Điểm: ${result.score}`);
      }
      // Navigate to result view
      navigate(`/student/exam/${doexamId}/result`, { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Nộp bài thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          Đang tải đề thi...
        </div>
      </div>
    );
  }

  if (!session || questions.length === 0) return null;

  const answered = answers.filter((a) => a.chosenIndex !== null).length;
  const timerDanger = timeLeft <= 300; // 5 phút cuối

  const currentQuestion = questions[currentIdx];
  const currentAnswer = answers[currentIdx];

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* ── Topbar ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="size-5 text-primary shrink-0" />
          <span className="font-semibold text-sm truncate">{session.testName}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            — Lượt {session.turn}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {saving && <span className="text-xs text-muted-foreground animate-pulse">Đang lưu...</span>}

          {/* Timer */}
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-mono font-bold border",
              timerDanger
                ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
                : "bg-muted border-border text-foreground"
            )}
          >
            <Clock className="size-4 shrink-0" />
            {formatTime(timeLeft)}
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            <Send className="size-4" />
            <span className="hidden sm:inline">Nộp bài</span>
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question panel */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl mx-auto">
            {/* Question */}
            <div className="rounded-xl border border-border bg-card p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                  Câu {currentIdx + 1} / {questions.length}
                </span>
              </div>
              <p className="text-base font-medium leading-relaxed whitespace-pre-wrap">
                {currentQuestion.text}
              </p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2">
              {currentQuestion.options.map((opt, i) => {
                const selected = currentAnswer?.chosenIndex === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleChoose(i)}
                    disabled={submitting}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                      selected
                        ? "border-primary bg-primary/5 text-primary font-medium shadow-sm"
                        : "border-border bg-card hover:border-primary/50 hover:bg-accent/40"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 size-6 shrink-0 rounded-full border flex items-center justify-center text-xs font-bold",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      {OPTION_LABELS[i] ?? i + 1}
                    </span>
                    <span className="leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Prev / Next */}
            <div className="flex items-center justify-between mt-5">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-accent transition-colors"
              >
                <ChevronLeft className="size-4" />
                Câu trước
              </button>
              <span className="text-xs text-muted-foreground">
                {answered}/{questions.length} đã trả lời
              </span>
              <button
                onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                disabled={currentIdx === questions.length - 1}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-accent transition-colors"
              >
                Câu sau
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </main>

        {/* Question navigator panel */}
        <aside className="hidden lg:flex w-52 xl:w-60 shrink-0 flex-col border-l border-border bg-card overflow-y-auto p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Danh sách câu hỏi
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {questions.map((_, i) => {
              const ans = answers[i];
              const isDone = ans?.chosenIndex !== null;
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={cn(
                    "aspect-square rounded-lg text-xs font-medium transition-all border",
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground"
                      : isDone
                      ? "border-green-300 bg-green-50 text-green-700"
                      : "border-border bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-green-100 border border-green-300 shrink-0" />
              Đã trả lời ({answered})
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-muted border border-border shrink-0" />
              Chưa trả lời ({questions.length - answered})
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-primary border border-primary shrink-0" />
              Câu hiện tại
            </div>
          </div>

          <div className="mt-auto pt-4">
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              <CheckCircle2 className="size-4" />
              Nộp bài
            </button>
          </div>
        </aside>
      </div>

      {/* Submit modal */}
      {showSubmitModal && (
        <SubmitModal
          total={questions.length}
          answered={answered}
          onConfirm={() => handleSubmit(false)}
          onCancel={() => setShowSubmitModal(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
};

export default ExamPage;
