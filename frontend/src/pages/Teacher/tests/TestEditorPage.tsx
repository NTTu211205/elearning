import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  Circle,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Question, QuestionOption, TestSettings } from "@/types/test";
import { TestSettingsModal } from "./modals/TestSettingsModal";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { classService } from "@/services/classService";
import { testService } from "@/services/testService";
import type { ClassOption } from "./modals/TestSettingsModal";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const makeOption = (label: string): QuestionOption => ({ label, text: "" });

const makeQuestion = (): Question => ({
  id: crypto.randomUUID(),
  text: "",
  options: OPTION_LABELS.slice(0, 4).map(makeOption),
  correctIndex: 0,
  type: "multiple_choice",
});

/** Tạo text preview định dạng Azota từ danh sách câu hỏi */
const generateTextFormat = (questions: Question[]): string =>
  questions
    .map((q, i) => {
      const lines = [`câu ${i + 1}: ${q.text}`];
      q.options.forEach((opt, j) => {
        lines.push(`${j === q.correctIndex ? "*" : ""}${opt.label}. ${opt.text}`);
      });
      return lines.join("\n");
    })
    .join("\n\n");

/**
 * Parse text định dạng:
 *   câu 1: [nội dung câu hỏi]
 *   *A. [đáp án đúng]
 *   B. [đáp án sai]
 */
const parseTextFormat = (raw: string): Question[] => {
  const questions: Question[] = [];
  let current: Question | null = null;

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const qMatch = line.match(/^câu\s+\d+:\s*(.*)/i);
    if (qMatch) {
      if (current) questions.push(current);
      current = { id: crypto.randomUUID(), text: qMatch[1].trim(), options: [], correctIndex: 0, type: "multiple_choice" };
      continue;
    }

    const optMatch = line.match(/^(\*?)([A-Fa-f])\.\s+(.*)/);
    if (optMatch && current) {
      const isCorrect = optMatch[1] === "*";
      current.options.push({ label: optMatch[2].toUpperCase(), text: optMatch[3].trim() });
      if (isCorrect) current.correctIndex = current.options.length - 1;
    }
  }

  if (current) questions.push(current);
  return questions;
};

/** Điểm mỗi câu = 10 / tổng số câu (làm tròn 2 chữ số) */
const scorePerQuestion = (total: number) =>
  total === 0 ? 0 : Math.round((10 / total) * 100) / 100;

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

interface QuestionFormPanelProps {
  question: Question;
  index: number;
  total: number;
  onUpdate: (q: Question) => void;
  onGoTo: (i: number) => void;
  onAddQuestion: () => void;
  onDeleteQuestion: () => void;
}

const QuestionFormPanel = ({
  question,
  index,
  total,
  onUpdate,
  onGoTo,
  onAddQuestion,
  onDeleteQuestion,
}: QuestionFormPanelProps) => {
  const score = scorePerQuestion(total);

  const setQuestionText = (text: string) => onUpdate({ ...question, text });

  const setOptionText = (optIdx: number, text: string) => {
    const options = question.options.map((o, i) => (i === optIdx ? { ...o, text } : o));
    onUpdate({ ...question, options });
  };

  const setCorrect = (optIdx: number) => onUpdate({ ...question, correctIndex: optIdx });

  const addOption = () => {
    if (question.options.length >= 6) return;
    const label = OPTION_LABELS[question.options.length];
    onUpdate({ ...question, options: [...question.options, makeOption(label)] });
  };

  const removeOption = (optIdx: number) => {
    if (question.options.length <= 2) return;
    const options = question.options.filter((_, i) => i !== optIdx);
    const correctIndex =
      question.correctIndex >= options.length ? options.length - 1 : question.correctIndex;
    onUpdate({ ...question, options, correctIndex });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Question header bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <span className="text-sm font-semibold text-foreground whitespace-nowrap">
          Câu {index + 1}:
        </span>
        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium whitespace-nowrap">
          {score} điểm
        </span>
        <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs font-medium">
          Trắc nghiệm
        </span>
        <div className="flex-1" />
        <button
          title="Xóa câu hỏi này"
          onClick={onDeleteQuestion}
          disabled={total === 1}
          className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Question text */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <textarea
          value={question.text}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Nhập nội dung câu hỏi..."
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Options */}
      <div className="px-4 py-2 flex flex-col gap-2 flex-1">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctIndex;
          return (
            <div key={opt.label} className="flex items-center gap-2 group">
              {/* Correct answer tick */}
              <button
                type="button"
                title={isCorrect ? "Đáp án đúng" : "Chọn làm đáp án đúng"}
                onClick={() => setCorrect(i)}
                className="shrink-0 text-muted-foreground"
              >
                {isCorrect ? (
                  <CheckCircle2 className="size-5 text-primary" />
                ) : (
                  <Circle className="size-5 hover:text-primary transition-colors" />
                )}
              </button>

              {/* Letter badge */}
              <span
                className={cn(
                  "flex shrink-0 size-7 items-center justify-center rounded border text-xs font-bold transition-colors",
                  isCorrect
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground"
                )}
              >
                {opt.label}
              </span>

              {/* Option input */}
              <Input
                value={opt.text}
                onChange={(e) => setOptionText(i, e.target.value)}
                placeholder={`Đáp án ${opt.label}...`}
                className={cn(
                  "flex-1 h-8 text-sm",
                  isCorrect && "border-primary ring-1 ring-primary/30"
                )}
              />

              {/* Remove option */}
              <button
                type="button"
                onClick={() => removeOption(i)}
                disabled={question.options.length <= 2}
                className="shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all disabled:hidden"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          );
        })}

        {question.options.length < 6 && (
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors pl-9 mt-1"
          >
            <Plus className="size-3.5" />
            Thêm đáp án
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={index === 0}
            onClick={() => onGoTo(index - 1)}
          >
            <ChevronLeft className="size-4" />
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={index === total - 1}
            onClick={() => onGoTo(index + 1)}
          >
            Tiếp
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button size="sm" onClick={onAddQuestion}>
          <Plus className="size-4" />
          Thêm câu
        </Button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Text preview panel (right side)
// ─────────────────────────────────────────────
interface TextPanelProps {
  text: string;
  activeQuestionIndex: number;
  onChange: (text: string) => void;
}

const TextPanel = ({ text, activeQuestionIndex, onChange }: TextPanelProps) => {
  const lines = text.split("\n");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <span className="text-xs text-muted-foreground font-medium">
          Định dạng văn bản • Câu đang chỉnh: {activeQuestionIndex + 1}
        </span>
        <span className="text-xs text-muted-foreground">
          * = đáp án đúng
        </span>
      </div>
      <div className="flex flex-1 overflow-hidden font-mono text-sm">
        {/* Line numbers */}
        <div className="select-none shrink-0 flex flex-col items-end pr-3 pl-3 py-3 text-muted-foreground/50 bg-muted/20 text-xs leading-[1.6rem]">
          {lines.map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>

        {/* Editable textarea */}
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="flex-1 resize-none bg-transparent px-3 py-3 text-xs leading-[1.6rem] focus-visible:outline-none font-mono text-foreground"
          placeholder={`câu 1: Nội dung câu hỏi\n*A. Đáp án đúng\nB. Đáp án sai\nC. Đáp án sai\nD. Đáp án sai`}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Import modal
// ─────────────────────────────────────────────
const ImportModal = ({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-base font-semibold text-foreground mb-1">Import đề thi</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Chọn file .docx hoặc .pdf chứa nội dung câu hỏi theo định dạng:
          <br />
          <code className="text-xs bg-muted px-1 rounded">Câu 1: ...</code> và{" "}
          <code className="text-xs bg-muted px-1 rounded">*A. ...</code>
        </p>
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Nhấn để chọn file</span>
          <span className="text-xs text-muted-foreground">.docx, .pdf</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".docx,.pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onImport(e.target.files[0]);
              onClose();
            }
          }}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Question navigation sidebar (mini list)
// ─────────────────────────────────────────────
const QuestionNavList = ({
  questions,
  activeIndex,
  onSelect,
}: {
  questions: Question[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) => (
  <div className="flex flex-col overflow-y-auto h-full bg-muted/20 border-r border-border">
    <div className="px-3 py-2 border-b border-border shrink-0">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Danh sách câu
      </span>
    </div>
    <div className="flex flex-col gap-1 p-2">
      {questions.map((q, i) => (
        <button
          key={q.id}
          onClick={() => onSelect(i)}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
            i === activeIndex
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <GripVertical className="size-3 shrink-0 opacity-40" />
          <span className="shrink-0 font-mono">C{i + 1}</span>
          <span className="truncate opacity-70">{q.text || "(trống)"}</span>
        </button>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main editor page
// ─────────────────────────────────────────────
const TestEditorPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editTestId = id ? Number(id) : null;
  const { user } = useAuthStore();

  const [testName, setTestName] = useState("Nhập tên đề thi...");
  const [editingName, setEditingName] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([makeQuestion()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [goToInput, setGoToInput] = useState("1");

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [editSettings, setEditSettings] = useState<TestSettings | undefined>();
  const [loadingData, setLoadingData] = useState(false);

  // Text from right panel, synced from questions
  const [textValue, setTextValue] = useState(() => generateTextFormat([makeQuestion()]));

  const activeQuestion = questions[activeIndex] ?? questions[0];

  // ── Fetch teacher's classes
  useEffect(() => {
    if (!user) return;
    classService.getByTeacher(user.id)
      .then((data) => setClasses(data.map((c) => ({ id: c.id, name: c.className }))))
      .catch(() => {});
  }, [user]);

  // ── Load existing test data in edit mode
  useEffect(() => {
    if (!editTestId) return;
    const load = async () => {
      setLoadingData(true);
      try {
        const [testData, questionsData] = await Promise.all([
          testService.getById(editTestId),
          testService.getQuestions(editTestId),
        ]);
        setTestName(testData.name);
        setEditSettings({
          name: testData.name,
          class_id: testData.class_id,
          turn: testData.turn,
          duration: testData.duration,
          startAt: testData.startAt,
          endAt: testData.endAt,
        });
        if (questionsData.length > 0) {
          setQuestions(questionsData);
          setTextValue(generateTextFormat(questionsData));
          setActiveIndex(0);
          setGoToInput("1");
        }
      } catch {
        toast.error("Không thể tải dữ liệu đề thi");
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [editTestId]);

  // ── sync: questions → text (only update text when form changes, not when text changes)
  const syncTextFromQuestions = useCallback((qs: Question[]) => {
    setTextValue(generateTextFormat(qs));
  }, []);

  // ── Update a question from form panel
  const handleUpdateQuestion = (updated: Question) => {
    const qs = questions.map((q) => (q.id === updated.id ? updated : q));
    setQuestions(qs);
    syncTextFromQuestions(qs);
  };

  // ── Parse text from right panel → questions
  const handleTextChange = (raw: string) => {
    setTextValue(raw);
    const parsed = parseTextFormat(raw);
    if (parsed.length > 0) {
      setQuestions(parsed);
      if (activeIndex >= parsed.length) setActiveIndex(parsed.length - 1);
    }
  };

  const addQuestion = () => {
    const qs = [...questions, makeQuestion()];
    setQuestions(qs);
    setActiveIndex(qs.length - 1);
    setGoToInput(String(qs.length));
    syncTextFromQuestions(qs);
  };

  const deleteQuestion = () => {
    if (questions.length === 1) return;
    const qs = questions.filter((_, i) => i !== activeIndex);
    const newActive = Math.min(activeIndex, qs.length - 1);
    setQuestions(qs);
    setActiveIndex(newActive);
    setGoToInput(String(newActive + 1));
    syncTextFromQuestions(qs);
  };

  const goTo = (i: number) => {
    if (i < 0 || i >= questions.length) return;
    setActiveIndex(i);
    setGoToInput(String(i + 1));
  };

  const handleImport = (_file: File) => {
    toast.info("Import file đề thi đang được xử lý (chức năng cần backend).");
  };

  /** Gọi API lưu đề thi — được await bởi TestSettingsModal (isSubmitting) */
  const handleSaveSettings = async (settings: TestSettings): Promise<void> => {
    if (!user) throw new Error("Chưa đăng nhập");
    try {
      if (editTestId) {
        await testService.update(editTestId, {
          name: settings.name,
          classId: settings.class_id!,
          turn: settings.turn,
          duration: settings.duration,
          startAt: settings.startAt,
          endAt: settings.endAt,
          numQuestion: questions.length,
        });
        await testService.saveQuestions(editTestId, questions);
        toast.success("Cập nhật đề thi thành công");
      } else {
        const created = await testService.create({
          name: settings.name,
          classId: settings.class_id!,
          createBy: user.id,
          turn: settings.turn,
          duration: settings.duration,
          startAt: settings.startAt,
          endAt: settings.endAt,
          numQuestion: questions.length,
        });
        await testService.saveQuestions(created.id, questions);
        toast.success("Tạo đề thi thành công");
      }
      navigate("/teacher/tests");
    } catch (err) {
      toast.error("Lưu thất bại, vui lòng thử lại");
      throw err; // giữ modal mở
    }
  };

  // Sync go-to input when activeIndex changes externally
  useEffect(() => {
    setGoToInput(String(activeIndex + 1));
  }, [activeIndex]);

  if (loadingData) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        {/* Back */}
        <button
          onClick={() => navigate("/teacher/tests")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>

        {/* Test name */}
        {editingName ? (
          <input
            autoFocus
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
            className="flex-1 max-w-md rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        ) : (
          <button
            className="flex-1 max-w-md text-left text-sm font-medium text-foreground truncate rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
            onClick={() => setEditingName(true)}
            title="Nhấn để sửa tên"
          >
            {testName}
          </button>
        )}

        {/* Go to question */}
        <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
          <button
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="rounded p-1 hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs">Câu</span>
          <input
            value={goToInput}
            onChange={(e) => setGoToInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") goTo(Number(goToInput) - 1);
            }}
            className="w-10 rounded border border-input bg-background px-1.5 py-0.5 text-center text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <span className="text-xs">/ {questions.length}</span>
          <button
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === questions.length - 1}
            className="rounded p-1 hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Score info */}
        <span className="hidden lg:inline text-xs text-muted-foreground">
          {scorePerQuestion(questions.length)} điểm/câu • {questions.length} câu
        </span>

        {/* Import button */}
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
          <Upload className="size-4" />
          <span className="hidden sm:inline">Import</span>
        </Button>

        {/* Cancel */}
        <Button variant="outline" size="sm" onClick={() => navigate("/teacher/tests")}>
          Hủy
        </Button>

        {/* Continue → settings */}
        <Button size="sm" onClick={() => setSettingsOpen(true)}>
          Tiếp tục
        </Button>
      </header>

      {/* ── Main split-view ─────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question nav list */}
        <div className="hidden lg:flex w-44 shrink-0 flex-col overflow-hidden border-r border-border">
          <QuestionNavList
            questions={questions}
            activeIndex={activeIndex}
            onSelect={goTo}
          />
        </div>

        {/* Left: form panel */}
        <div className="flex flex-col w-[50%] min-w-0 border-r border-border overflow-hidden">
          <QuestionFormPanel
            question={activeQuestion}
            index={activeIndex}
            total={questions.length}
            onUpdate={handleUpdateQuestion}
            onGoTo={goTo}
            onAddQuestion={addQuestion}
            onDeleteQuestion={deleteQuestion}
          />
        </div>

        {/* Right: text panel */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TextPanel
            text={textValue}
            activeQuestionIndex={activeIndex}
            onChange={handleTextChange}
          />
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────── */}
      <TestSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialName={testName === "Nhập tên đề thi..." ? "" : testName}
        initialSettings={editSettings}
        classes={classes}
        onSave={handleSaveSettings}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
};

export default TestEditorPage;
