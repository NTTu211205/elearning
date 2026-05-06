import type { User } from "@/types/user";
import api from "../lib/axios";

type LoginData = {
  user: User;
  token: string;
};

type RefreshData = {
  newToken: string;
};

export const authService = {
  getProfile: async (): Promise<User> => {
    const res = await api.get<{ message: string; data: User }>("/users/profile");
    return res.data.data;
  },

  signIn: async (email: string, password: string) => {
    const res = await api.post<{ message: string; data: LoginData }>("/auth/login", { email, password });
    const { user, token } = res.data.data;

    return { user, accessToken: token };
  },

  signOut: async () => {
    await api.post("/auth/logout");
  },

  refresh: async () => {
    const res = await api.post<{ message: string; data: RefreshData }>("/auth/refresh-token");
    const { newToken } = res.data.data;

    return { accessToken: newToken };
  },
};