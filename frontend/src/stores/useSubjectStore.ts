import { create } from "zustand";
import { toast } from "sonner";
import { subjectService } from "@/services/subjectService";
import type { CreateSubjectPayload, UpdateSubjectPayload } from "@/services/subjectService";
import type { Subject } from "@/types/subject";

export type { CreateSubjectPayload, UpdateSubjectPayload };

interface SubjectFilters {
  search: string;
  status: "all" | "active" | "inactive";
}

interface SubjectState {
  subjects: Subject[];
  loading: boolean;
  filters: SubjectFilters;

  fetchSubjects: () => Promise<void>;
  createSubject: (data: CreateSubjectPayload) => Promise<void>;
  updateSubject: (id: number, data: UpdateSubjectPayload) => Promise<void>;
  deleteSubject: (id: number) => Promise<void>;
  setFilters: (filters: Partial<SubjectFilters>) => void;
  getFilteredSubjects: () => Subject[];
}

export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: [],
  loading: false,
  filters: { search: "", status: "all" },

  fetchSubjects: async () => {
    set({ loading: true });
    try {
      const subjects = await subjectService.getAll();
      set({ subjects });
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải danh sách môn học");
    } finally {
      set({ loading: false });
    }
  },

  createSubject: async (data) => {
    set({ loading: true });
    try {
      const newSubject = await subjectService.create(data);
      set((state) => ({ subjects: [...state.subjects, newSubject] }));
      toast.success("Tạo môn học thành công");
    } catch (error) {
      console.error(error);
      toast.error("Tạo môn học thất bại");
    } finally {
      set({ loading: false });
    }
  },

  updateSubject: async (id, data) => {
    set({ loading: true });
    try {
      const updated = await subjectService.update(id, data);
      set((state) => ({
        subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...updated } : s)),
      }));
      toast.success("Cập nhật môn học thành công");
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật môn học thất bại");
    } finally {
      set({ loading: false });
    }
  },

  deleteSubject: async (id) => {
    set({ loading: true });
    try {
      await subjectService.delete(id);
      set((state) => ({
        subjects: state.subjects.map((s) => (s.id === id ? { ...s, status: 0 } : s)),
      }));
      toast.success("Xóa môn học thành công");
    } catch (error) {
      console.error(error);
      toast.error("Xóa môn học thất bại");
    } finally {
      set({ loading: false });
    }
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  getFilteredSubjects: () => {
    const { subjects, filters } = get();
    return subjects.filter((s) => {
      const matchSearch =
        filters.search === "" ||
        s.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchStatus =
        filters.status === "all" ||
        (filters.status === "active" ? s.status === 1 : s.status === 0);
      return matchSearch && matchStatus;
    });
  },
}));
