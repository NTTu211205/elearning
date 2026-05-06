import { create } from "zustand";
import { toast } from "sonner";
import { enrollmentService } from "@/services/examService";
import type { StudentClass, StudentTest } from "@/types/exam";

interface StudentState {
  classes: StudentClass[];
  loading: boolean;
  fetchClasses: (studentId: number) => Promise<void>;
  getPendingTests: () => { test: StudentTest; className: string; classId: number }[];
}

export const useStudentStore = create<StudentState>((set, get) => ({
  classes: [],
  loading: false,

  fetchClasses: async (studentId) => {
    set({ loading: true });
    try {
      const classes = await enrollmentService.getClassesWithTests(studentId);
      set({ classes });
    } catch {
      toast.error("Không thể tải danh sách lớp học");
    } finally {
      set({ loading: false });
    }
  },

  getPendingTests: () => {
    const now = new Date();
    const result: { test: StudentTest; className: string; classId: number }[] = [];

    for (const cls of get().classes) {
      for (const test of cls.tests) {
        if (!test.startAt || !test.endAt) continue;
        const start = new Date(test.startAt);
        const end = new Date(test.endAt);
        if (now < start || now > end) continue;
        // còn lượt làm chưa hoàn thành
        const remaining = test.maxTurns - test.doneTurns;
        if (remaining <= 0) continue;
        result.push({ test, className: cls.className, classId: cls.classId });
      }
    }

    return result;
  },
}));
