import type { User, Role } from "@/types/user";
import api from "../lib/axios";

export interface CreateUserPayload {
  name: string;
  email: string;
  role: Role;
  password: string;
  phone?: string;
  dob?: string;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  phone?: string;
  dob?: string;
}

export interface BulkCreateResult {
  success: boolean;
  email: string;
  data?: User;
  error?: string;
}

type ApiResponse<T> = { message: string; data: T };

export const userService = {
  getAll: async (): Promise<User[]> => {
    const res = await api.get<ApiResponse<User[]>>("/users");
    return res.data.data;
  },

  getById: async (id: number): Promise<User> => {
    const res = await api.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    const res = await api.post<ApiResponse<User>>("/users", payload);
    return res.data.data;
  },

  // TODO: implement bulk create from CSV
  bulkCreate: async (users: CreateUserPayload[]): Promise<{ success: { email: string; data: User }[]; failed: { email: string; error: string }[] }> => {
    const res = await api.post<ApiResponse<{ success: { email: string; data: User }[]; failed: { email: string; error: string }[] }>>('/users/bulk', { users });
    return res.data.data;
  },

  toggleStatus: async (id: number): Promise<{ id: number; status: number }> => {
    const res = await api.patch<ApiResponse<{ id: number; status: number }>>(`/users/${id}/status`);
    return res.data.data;
  },

  update: async (id: number, payload: UpdateUserPayload): Promise<User> => {
    const res = await api.put<ApiResponse<User>>(`/users/${id}`, payload);
    return res.data.data;
  },

  updateProfile: async (payload: { name: string; phone?: string; dob?: string }): Promise<User> => {
    const res = await api.put<ApiResponse<User>>("/users/profile", payload);
    return res.data.data;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await api.put("/users/password", { oldPassword, newPassword });
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};