// Types for student exam functionality

export interface StudentTest {
  testId: number;
  testName: string;
  maxTurns: number;
  startAt: string | null;
  endAt: string | null;
  duration: number; // minutes
  numQuestion: number;
  doneTurns: number;
  bestScore: number | null;
  ongoingDoexamId: number | null;
}

export interface StudentClass {
  classId: number;
  className: string;
  classStatus: "active" | "ended";
  subjectName: string;
  averageScore: number | null;
  tests: StudentTest[];
}

// Exam session (in-progress)
export interface AnswerItem {
  questionId: string;
  chosenIndex: number | null;
}

export interface ExamQuestion {
  id: string;
  text: string;
  options: { label: string; text: string }[];
  type: string;
}

export interface ExamSession {
  doexamId: number;
  testId: number;
  testName: string;
  duration: number;
  numQuestion: number;
  endAt: string | null;
  attendAt: string;
  turn: number;
}

export interface StartExamResult {
  doexamId: number;
  isResume: boolean;
  attendAt: string;
  savedAnswers: AnswerItem[];
}

export interface SubmitResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  wrongCount: number;
  skippedCount: number;
}

// Submission review (shared between student and teacher)
export interface SubmissionAnswerRecord {
  questionIndex: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  chosenIndex: number | null;
}

export interface SubmissionSession {
  id: number;
  student_id: number;
  test_id: number;
  score: number;
  submitAt: string;
  turn: number;
  testName: string;
  duration: number;
  num_question: number;
  className: string;
  subjectName: string;
  studentName: string;
}

export interface SubmissionDetail {
  session: SubmissionSession;
  answers: SubmissionAnswerRecord[];
}

// Student detail in class (for teacher's student detail page)
export interface StudentTestResult {
  testId: number;
  testName: string;
  questionCount: number;
  duration: number;
  startAt: string | null;
  endAt: string | null;
  score: number | null;
  submitAt: string | null;
  turn: number | null;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
}

export interface StudentProfile {
  studentId: number;
  studentName: string;
  email: string;
  phone: string | null;
  dob: string | null;
  classId: number;
  className: string;
  subjectName: string;
  subjectId: number;
  averageScore: number | null;
}

export interface StudentDetailInClass {
  profile: StudentProfile;
  tests: StudentTestResult[];
}
