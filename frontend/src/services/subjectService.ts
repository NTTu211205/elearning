import type { Subject } from "@/types/subject";
import api from "../lib/axios";

export interface CreateSubjectPayload {
  name: string;
  lessons: number;
}

export interface UpdateSubjectPayload {
  name: string;
  lessons: number;
}

type ApiResponse<T> = { message: string; data: T };

export const subjectService = {
  getAll: async (): Promise<Subject[]> => {
    const res = await api.get<ApiResponse<Subject[]>>("/subject");
    return res.data.data;
  },

  getById: async (id: number): Promise<Subject> => {
    const res = await api.get<ApiResponse<Subject>>(`/subject/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateSubjectPayload): Promise<Subject> => {
    const res = await api.post<ApiResponse<Subject>>("/subject", payload);
    return res.data.data;
  },

  update: async (id: number, payload: UpdateSubjectPayload): Promise<Subject> => {
    const res = await api.put<ApiResponse<Subject>>(`/subject/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/subject/${id}`);
  },
};
