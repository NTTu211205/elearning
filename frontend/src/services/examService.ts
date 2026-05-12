import api from "@/lib/axios";
import type {
  StudentClass,
  StartExamResult,
  ExamSession,
  ExamQuestion,
  AnswerItem,
  SubmitResult,
  SubmissionDetail,
  StudentDetailInClass,
} from "@/types/exam";

type ApiResponse<T> = { message: string; data: T };

export const enrollmentService = {
  getClassesWithTests: async (studentId: number): Promise<StudentClass[]> => {
    const res = await api.get<ApiResponse<StudentClass[]>>(
      `/enrollment/student/${studentId}/classes-with-tests`
    );
    return res.data.data;
  },
};

export const examService = {
  start: async (studentId: number, testId: number): Promise<StartExamResult> => {
    const res = await api.post<ApiResponse<StartExamResult>>("/exam/start", { studentId, testId });
    return res.data.data;
  },

  getSession: async (
    doexamId: number
  ): Promise<{ session: ExamSession; questionsForStudent: ExamQuestion[]; savedAnswers: AnswerItem[] }> => {
    const res = await api.get<ApiResponse<{ session: ExamSession; questionsForStudent: ExamQuestion[]; savedAnswers: AnswerItem[] }>>(
      `/exam/${doexamId}`
    );
    return res.data.data;
  },

  saveDraft: async (doexamId: number, answers: AnswerItem[]): Promise<void> => {
    await api.put(`/exam/${doexamId}/draft`, { answers });
  },

  submit: async (doexamId: number, answers: AnswerItem[]): Promise<SubmitResult> => {
    const res = await api.post<ApiResponse<SubmitResult>>(`/exam/${doexamId}/submit`, { answers });
    return res.data.data;
  },

  getResult: async (doexamId: number): Promise<SubmissionDetail> => {
    const res = await api.get<ApiResponse<SubmissionDetail>>(`/exam/${doexamId}/result`);
    return res.data.data;
  },

  getSubmissionByStudentTest: async (studentId: number, testId: number): Promise<SubmissionDetail> => {
    const res = await api.get<ApiResponse<SubmissionDetail>>(
      `/exam/result/student/${studentId}/test/${testId}`
    );
    return res.data.data;
  },
};

export const enrollmentStudentService = {
  getStudentDetailInClass: async (classId: number, studentId: number): Promise<StudentDetailInClass> => {
    const res = await api.get<ApiResponse<StudentDetailInClass>>(
      `/enrollment/class/${classId}/student/${studentId}/detail`
    );
    return res.data.data;
  },

  getMyRankInClass: async (
    classId: number,
    studentId: number
  ): Promise<{ rank: number | null; totalStudents: number | null; averageScore: number | null }> => {
    const res = await api.get(`/enrollment/class/${classId}/student/${studentId}/rank`);
    return res.data.data;
  },
};
