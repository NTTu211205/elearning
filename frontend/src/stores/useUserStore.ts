import { create } from "zustand";
import { toast } from "sonner";
import { userService } from "@/services/userService";
import type { CreateUserPayload, UpdateUserPayload } from "@/services/userService";
import type { User, Role } from "@/types/user";

export type RoleFilter = Role | "all";

// Re-export so UserListPage can still import these types from the store
export type { CreateUserPayload, UpdateUserPayload };

interface UserFilters {
  search: string;
  role: RoleFilter;
  status: "all" | "active" | "inactive";
}

interface UserState {
  users: User[];
  loading: boolean;
  selectedUser: User | null;
  filters: UserFilters;

  fetchUsers: () => Promise<void>;
  createUser: (data: CreateUserPayload) => Promise<void>;
  bulkCreateUsers: (users: CreateUserPayload[]) => Promise<{ successCount: number; failCount: number }>;
  updateUser: (id: number, data: UpdateUserPayload) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  toggleUserStatus: (id: number) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  setFilters: (filters: Partial<UserFilters>) => void;
  getFilteredUsers: () => User[];
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  selectedUser: null,
  filters: { search: "", role: "all", status: "all" },

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const users = await userService.getAll();
      set({ users });
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải danh sách người dùng");
    } finally {
      set({ loading: false });
    }
  },

  createUser: async (data) => {
    set({ loading: true });
    try {
      const newUser = await userService.create(data);
      set((state) => ({ users: [...state.users, newUser] }));
      toast.success("Tạo người dùng thành công");
    } catch (error) {
      console.error(error);
      toast.error("Tạo người dùng thất bại");
    } finally {
      set({ loading: false });
    }
  },

  bulkCreateUsers: async (users) => {
    set({ loading: true });
    try {
      const result = await userService.bulkCreate(users);
      const successCount = result.success.length;
      const failCount = result.failed.length;
      if (successCount > 0) {
        const newUsers = result.success.map((s) => s.data).filter(Boolean) as User[];
        set((state) => ({ users: [...state.users, ...newUsers] }));
      }
      return { successCount, failCount };
    } catch (error) {
      console.error(error);
      toast.error("Import CSV thất bại");
      return { successCount: 0, failCount: users.length };
    } finally {
      set({ loading: false });
    }
  },

  // TODO: bulkCreateUsers - call POST /users/bulk with parsed CSV rows

  updateUser: async (id, data) => {
    set({ loading: true });
    try {
      const updated = await userService.update(id, data);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, ...updated } : u)),
      }));
      toast.success("Cập nhật người dùng thành công");
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật người dùng thất bại");
    } finally {
      set({ loading: false });
    }
  },

  deleteUser: async (id) => {
    set({ loading: true });
    try {
      await userService.delete(id);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, status: 0 } : u)),
      }));
      toast.success("Đã vô hiệu hóa người dùng");
    } catch (error) {
      console.error(error);
      toast.error("Xoá người dùng thất bại");
    } finally {
      set({ loading: false });
    }
  },

  toggleUserStatus: async (id) => {
    try {
      const updated = await userService.toggleStatus(id);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, status: updated.status } : u)),
      }));
      toast.success(updated.status === 1 ? "Kích hoạt thành công" : "Vô hiệu hóa thành công");
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật trạng thái thất bại");
    }
  },

  setSelectedUser: (user) => set({ selectedUser: user }),

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  getFilteredUsers: () => {
    const { users, filters } = get();
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        u.email.toLowerCase().includes(filters.search.toLowerCase());
      const matchRole = filters.role === "all" || u.role === filters.role;
      const matchStatus =
        filters.status === "all" ||
        (filters.status === "active" ? u.status === 1 : u.status === 0);
      return matchSearch && matchRole && matchStatus;
    });
  },
}));
