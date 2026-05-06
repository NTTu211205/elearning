import api from "../lib/axios";
import type { TestListItem, Question, TestSettings, TestType } from "@/types/test";

type ApiResponse<T> = { message: string; data: T };

export interface CreateTestPayload {
  name: string;
  classId: number;
  createBy: number;
  turn: number;
  duration: number;
  startAt: string;
  endAt: string;
  numQuestion: number;
  type: TestType;
}

export interface UpdateTestPayload {
  name: string;
  classId: number;
  turn: number;
  duration: number;
  startAt: string;
  endAt: string;
  numQuestion: number;
  type: TestType;
}

export interface TestDetail extends TestSettings {
  id: number;
  num_question: number;
  createBy: number;
  class_id: number | null;
  type: TestType;
}

const formatDateForInput = (d: string | Date | null | undefined): string => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  // Convert UTC date → local browser time for datetime-local input
  // datetime-local expects "YYYY-MM-DDTHH:MM" in the user's LOCAL timezone.
  const localMs = dt.getTime() - dt.getTimezoneOffset() * 60_000;
  return new Date(localMs).toISOString().slice(0, 16);
};

export interface TestDetailFull {
  id: number;
  name: string;
  class_id: number;
  className: string;
  subjectId: number;
  subjectName: string;
  turn: number;
  duration: number;
  num_question: number;
  startAt: string;
  endAt: string;
  createBy: number;
  type: TestType;
}

export interface StudentResult {
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  subjectId: number;
  totalQuestions: number;
  score: number | null;
  submitAt: string | null;
}

export interface ClassTest {
  id: number;
  name: string;
  turn: number;
  startAt: string | null;
  endAt: string | null;
  duration: number;
  num_question: number;
  createdByName: string | null;
  submittedCount: number;
  avgScore: number | null;
  type: TestType;
}

export const testService = {
  /** Danh sách đề thi do một giáo viên tạo */
  getByCreator: async (creatorId: number): Promise<TestListItem[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/test/creator/${creatorId}`);
    return res.data.data.map((t) => ({
      id: t.id,
      name: t.name,
      class_id: t.class_id,
      className: t.className ?? null,
      turn: t.turn,
      startAt: t.startAt ?? null,
      endAt: t.endAt ?? null,
      duration: t.duration,
      questionCount: t.num_question ?? 0,
      type: (t.type ?? "regular") as TestType,
    }));
  },

  /** Chi tiết một đề thi (MySQL) */
  getById: async (id: number): Promise<TestDetail> => {
    const res = await api.get<ApiResponse<any>>(`/test/${id}`);
    const t = res.data.data;
    return {
      id: t.id,
      name: t.name,
      class_id: t.class_id ?? null,
      turn: t.turn,
      duration: t.duration,
      startAt: formatDateForInput(t.startAt),
      endAt: formatDateForInput(t.endAt),
      num_question: t.num_question,
      createBy: t.createBy,
      type: (t.type ?? "regular") as TestType,
    };
  },

  /** Tạo đề thi mới trong MySQL */
  create: async (payload: CreateTestPayload): Promise<{ id: number }> => {
    const res = await api.post<ApiResponse<{ id: number }>>("/test", payload);
    return res.data.data;
  },

  /** Cập nhật thông tin đề thi trong MySQL */
  update: async (id: number, payload: UpdateTestPayload): Promise<void> => {
    await api.put(`/test/${id}`, payload);
  },

  /** Xóa đề thi */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/test/${id}`);
  },

  /** Chi tiết đề thi kèm lớp + môn học (dùng cho trang detail) */
  getDetail: async (id: number): Promise<TestDetailFull> => {
    const res = await api.get<ApiResponse<any>>(`/test/${id}/detail`);
    const t = res.data.data;
    return {
      id: t.id,
      name: t.name,
      class_id: t.class_id,
      className: t.className ?? "",
      subjectId: t.subjectId ?? 0,
      subjectName: t.subjectName ?? "",
      turn: t.turn,
      duration: t.duration,
      num_question: t.num_question ?? 0,
      startAt: t.startAt ?? "",
      endAt: t.endAt ?? "",
      createBy: t.createBy,
      type: (t.type ?? "regular") as TestType,
    };
  },

  /** Kết quả làm bài của tất cả học sinh (trang detail) */
  getResults: async (testId: number): Promise<StudentResult[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/test/${testId}/results`);
    return res.data.data.map((r) => ({
      studentId: r.studentId,
      studentName: r.studentName,
      classId: r.classId,
      className: r.className,
      subjectId: r.subjectId ?? 0,
      totalQuestions: r.totalQuestions ?? 0,
      score: r.score !== null && r.score !== undefined ? Number(r.score) : null,
      submitAt: r.submitAt ?? null,
    }));
  },

  /** Lấy câu hỏi của đề thi từ MongoDB */
  getQuestions: async (testId: number): Promise<Question[]> => {
    const res = await api.get<ApiResponse<Question[]>>(`/test/${testId}/questions`);
    return res.data.data;
  },

  /** Danh sách đề thi theo lớp học (kèm thống kê nộp bài) */
  getByClass: async (classId: number): Promise<ClassTest[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/test/class/${classId}`);
    return res.data.data.map((t) => ({
      id: t.id,
      name: t.name,
      turn: t.turn,
      startAt: t.startAt ?? null,
      endAt: t.endAt ?? null,
      duration: t.duration,
      num_question: t.num_question ?? 0,
      createdByName: t.createdByName ?? null,
      submittedCount: t.submittedCount ?? 0,
      avgScore: t.avgScore !== null && t.avgScore !== undefined ? Number(t.avgScore) : null,
      type: (t.type ?? "regular") as TestType,
    }));
  },

  /** Lưu (thay thế) câu hỏi của đề thi vào MongoDB */
  saveQuestions: async (testId: number, questions: Question[]): Promise<void> => {
    await api.put(`/test/${testId}/questions`, { questions });
  },
};
