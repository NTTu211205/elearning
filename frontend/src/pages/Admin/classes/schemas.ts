import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(2, "Tên lớp ít nhất 2 ký tự"),
  subjectId: z.coerce.number().int().positive("Vui lòng chọn môn học"),
  teacherId: z.coerce.number().int().positive("Vui lòng chọn giáo viên"),
  quantity: z.coerce.number().int("Sĩ số phải là số nguyên").min(1, "Sĩ số ít nhất là 1"),
  status: z.enum(["active", "ended"]).default("active"),
});

export const editClassSchema = z.object({
  name: z.string().min(2, "Tên lớp ít nhất 2 ký tự"),
  quantity: z.coerce.number().int("Sĩ số phải là số nguyên").min(1, "Sĩ số ít nhất là 1"),
  status: z.enum(["active", "ended"]),
});

export type EditClassFormValues = z.infer<typeof editClassSchema>;
export type CreateClassFormValues = z.infer<typeof createClassSchema>;
