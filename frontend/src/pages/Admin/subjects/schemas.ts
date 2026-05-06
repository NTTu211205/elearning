import { z } from "zod";

export const createSchema = z.object({
  name: z.string().min(2, "Tên môn học ít nhất 2 ký tự"),
  lessons: z.coerce.number().int("Số buổi học phải là số nguyên").min(1, "Số buổi học ít nhất là 1"),
});

export const editSchema = z.object({
  name: z.string().min(2, "Tên môn học ít nhất 2 ký tự"),
  lessons: z.coerce.number().int("Số buổi học phải là số nguyên").min(1, "Số buổi học ít nhất là 1"),
});

export type CreateFormValues = z.infer<typeof createSchema>;
export type EditFormValues = z.infer<typeof editSchema>;
