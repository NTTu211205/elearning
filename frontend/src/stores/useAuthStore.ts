import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { setToken } from "@/lib/tokenManager";
import type { AuthState } from "@/types/store";

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,

  setAccessToken: (accessToken) => {
    setToken(accessToken);
    set({ accessToken });
  },
  clearState: () => {
    setToken(null);
    set({ accessToken: null, user: null, loading: false });
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true });
      const { accessToken, user } = await authService.signIn(email, password);
      get().setAccessToken(accessToken);
      set({ user });
      toast.success("Đăng nhập thành công");
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập!");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await authService.signOut();
    } catch {
      // lỗi API logout không quan trọng, vẫn clear state
    } finally {
      get().clearState();
      toast.success("Đăng xuất thành công");
    }
  },

  refresh: async () => {
    try {
      set({ loading: true });
      const { accessToken } = await authService.refresh();
      get().setAccessToken(accessToken);
      const user = await authService.getProfile();
      set({ user });
    } catch (error) {
      console.error(error);
      get().clearState();
    } finally {
      set({ loading: false });
    }
  },
}));