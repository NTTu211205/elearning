interface ClassItem {
  id: number;
  name: string;
  subjectName: string;
  subjectId: number;
  studentCount: number;
  assignedTests: number;
  avgScore: number | null;
  createdAt: string;
  status: "active" | "ended";
}

interface ClassStudent {
  studentId: number;
  studentName: string;
  email: string;
  phone?: string;
  dob?: string;
  avgScore: number | null;
  submittedTests: number;
  totalTests: number;
}

interface ClassTestSummary {
  testId: number;
  testName: string;
  questionCount: number;
  duration: number;
  turn: number;
  startAt: string | null;
  endAt: string | null;
  submittedCount: number;
  avgScore: number | null;
}

export type { ClassItem, ClassStudent, ClassTestSummary };
