type QuestionType = "multiple_choice";
type TestType = "regular" | "midterm" | "final";

interface QuestionOption {
  label: string; // "A", "B", "C", "D"
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  correctIndex: number; // 0-based
  type: QuestionType;
}

interface TestSettings {
  name: string;
  class_id: number | null;
  turn: number;
  duration: number; // minutes
  startAt: string; // ISO string or ""
  endAt: string;
  type: TestType;
}

interface Test extends TestSettings {
  id?: number;
  questions: Question[];
}

interface TestListItem {
  id: number;
  name: string;
  class_id: number | null;
  className?: string;
  turn: number;
  startAt: string | null;
  endAt: string | null;
  questionCount?: number;
  duration?: number;
  type?: TestType;
}

export type { Question, QuestionOption, QuestionType, Test, TestSettings, TestListItem, TestType };
