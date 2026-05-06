import api from "../lib/axios";

export interface TeacherClass {
  id: number;
  className: string;
  subjectName: string;
  subjectId: number;
  totalStudents: number;
  totalTests: number;
  avgScore: number | null;
  status: "active" | "ended";
  createdAt: string;
}

export interface AdminClass {
  id: number;
  name: string;
  quantity: number;
  status: "active" | "ended";
  createdAt: string;
  updatedAt: string;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  teacherName: string;
  studentCount: number;
}

export interface CreateClassPayload {
  name: string;
  subjectId: number;
  teacherId: number;
  quantity: number;
  status?: "active" | "ended";
}

export interface UpdateClassPayload {
  name: string;
  quantity: number;
  status: "active" | "ended";
  // keep existing values for required backend fields
  subjectId: number;
  teacherId: number;
}

export interface EnrolledStudent {
  id: number;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  averageScore: number | null;
  totalExamsDone?: number;
}

export interface ClassDetail {
  id: number;
  name: string;
  quantity: number;
  status: "active" | "ended";
  createdAt: string;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  teacherName: string;
  studentCount: number;
  totalTests: number;
  avgScore: number | null;
}

type ApiResponse<T> = { message: string; data: T };

export const classService = {
  getByTeacher: async (teacherId: number): Promise<TeacherClass[]> => {
    const res = await api.get<ApiResponse<TeacherClass[]>>(`/class/teacher/${teacherId}`);
    return res.data.data;
  },

  getAll: async (): Promise<AdminClass[]> => {
    const res = await api.get<ApiResponse<AdminClass[]>>("/class");
    return res.data.data;
  },

  create: async (payload: CreateClassPayload): Promise<AdminClass> => {
    const res = await api.post<ApiResponse<AdminClass>>("/class", payload);
    return res.data.data;
  },

  update: async (id: number, payload: UpdateClassPayload): Promise<void> => {
    await api.put(`/class/${id}`, payload);
  },

  getStudentsByClass: async (classId: number): Promise<EnrolledStudent[]> => {
    const res = await api.get<ApiResponse<EnrolledStudent[]>>(`/enrollment/class/${classId}`);
    return res.data.data;
  },

  getDetail: async (classId: number): Promise<ClassDetail> => {
    const res = await api.get<ApiResponse<ClassDetail>>(`/class/${classId}/detail`);
    return res.data.data;
  },

  enrollStudents: async (classId: number, studentIds: number[]): Promise<{ enrolled: number[]; failed: { studentId: number; reason: string }[] }> => {
    const res = await api.post<ApiResponse<{ enrolled: number[]; failed: { studentId: number; reason: string }[] }>>(
      "/enrollment/bulk",
      { classId, studentIds }
    );
    return res.data.data;
  },
};
