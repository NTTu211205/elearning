import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ArrowLeft,
  GraduationCap,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { examService, type QuestionStat } from "@/services/examService";

type ApiResponse<T> = { message: string; data: T };

interface AnswerRecord {
  questionIndex: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  chosenIndex: number | null;
}

interface ExamResultData {
  session: {
    test_id: number;
    testName: string;
    duration: number;
    num_question: number;
    score: number;
    submitAt: string;
    className: string;
    subjectName: string;
    turn: number;
  };
  answers: AnswerRecord[];
}

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const ExamResultPage = () => {
  const { doexamId } = useParams<{ doexamId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ExamResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([]);

  useEffect(() => {
    if (!doexamId) return;
    api
      .get<ApiResponse<ExamResultData>>(`/exam/${doexamId}/result`)
      .then((res) => {
        setData(res.data.data);
        return examService.getQuestionStats(res.data.data.session.test_id);
      })
      .then((stats) => setQuestionStats(stats))
      .catch(() => navigate("/student/classes", { replace: true }))
      .finally(() => setLoading(false));
  }, [doexamId, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!data) return null;

  const { session, answers } = data;
  const correct = answers.filter((a) => a.chosenIndex !== null && a.chosenIndex === a.correctIndex).length;
  const wrong = answers.filter((a) => a.chosenIndex !== null && a.chosenIndex !== a.correctIndex).length;
  const skipped = answers.filter((a) => a.chosenIndex === null).length;
  const percent = Math.round((correct / answers.length) * 100);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Back */}
        <button
          onClick={() => navigate("/student/classes")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="size-4" />
          Quay lại lớp học
        </button>

        {/* Score card */}
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap className="size-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{session.className} • {session.subjectName}</span>
          </div>
          <h1 className="text-xl font-bold mb-1">{session.testName}</h1>
          <p className="text-xs text-muted-foreground mb-5">Lượt {session.turn}</p>

          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="size-8 text-yellow-500" />
            <span className="text-5xl font-bold tabular-nums">{session.score}</span>
            <span className="text-xl text-muted-foreground">/10</span>
          </div>

          <div className="w-full bg-muted rounded-full h-2.5 mb-5 overflow-hidden">
            <div
              className={cn(
                "h-2.5 rounded-full transition-all",
                percent >= 80 ? "bg-green-500" : percent >= 50 ? "bg-yellow-400" : "bg-red-500"
              )}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="size-4" />
              <span className="font-medium">{correct}</span>
              <span className="text-muted-foreground">đúng</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-500">
              <XCircle className="size-4" />
              <span className="font-medium">{wrong}</span>
              <span className="text-muted-foreground">sai</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MinusCircle className="size-4" />
              <span className="font-medium">{skipped}</span>
              <span>bỏ qua</span>
            </div>
          </div>
        </div>

        {/* Answers review */}
        <h2 className="text-base font-semibold">Chi tiết từng câu</h2>
        <div className="flex flex-col gap-3">
          {answers.map((a) => {
            const isCorrect = a.chosenIndex !== null && a.chosenIndex === a.correctIndex;
            const isWrong = a.chosenIndex !== null && a.chosenIndex !== a.correctIndex;
            const isSkipped = a.chosenIndex === null;
            const stat = questionStats.find((s) => s.questionOrder === a.questionIndex);

            return (
              <div
                key={a.questionIndex}
                className={cn(
                  "rounded-xl border p-4",
                  isCorrect ? "border-green-200 bg-green-50/50" :
                  isWrong   ? "border-red-200 bg-red-50/50" :
                              "border-border bg-muted/30"
                )}
              >
                <div className="flex items-start gap-2 mb-3">
                  {isCorrect && <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />}
                  {isWrong && <XCircle className="size-4 text-red-500 mt-0.5 shrink-0" />}
                  {isSkipped && <MinusCircle className="size-4 text-muted-foreground mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      <span className="text-muted-foreground mr-1">Câu {a.questionIndex + 1}.</span>
                      {a.questionText}
                    </p>
                    {stat !== undefined && (
                      <span className={cn(
                        "inline-flex items-center gap-1 mt-1 text-[10px] font-medium rounded-full px-2 py-0.5",
                        stat.failRate >= 70 ? "bg-red-100 text-red-600" :
                        stat.failRate >= 50 ? "bg-orange-100 text-orange-600" :
                        stat.failRate >= 30 ? "bg-yellow-100 text-yellow-600" :
                        "bg-green-100 text-green-600"
                      )}>
                        <AlertTriangle className="size-2.5" />
                        {stat.failRate}% lớp làm sai
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid gap-1.5 pl-6">
                  {a.options.map((opt, i) => {
                    const isCorrectOpt = i === a.correctIndex;
                    const isChosen = i === a.chosenIndex;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm border",
                          isCorrectOpt
                            ? "border-green-300 bg-green-100 text-green-800 font-medium"
                            : isChosen
                            ? "border-red-300 bg-red-100 text-red-700"
                            : "border-transparent bg-transparent text-muted-foreground"
                        )}
                      >
                        <span className="font-medium w-4 shrink-0">{OPTION_LABELS[i]}</span>
                        <span>{opt}</span>
                        {isCorrectOpt && <CheckCircle2 className="size-3.5 ml-auto text-green-600 shrink-0" />}
                        {isChosen && !isCorrectOpt && <XCircle className="size-3.5 ml-auto text-red-500 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExamResultPage;
