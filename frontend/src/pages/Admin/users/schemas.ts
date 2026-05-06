import { z } from "zod";

export const createSchema = z.object({
  name: z.string().min(2, "Họ tên ít nhất 2 ký tự"),
  email: z.email("Email không hợp lệ"),
  role: z.enum(["student", "teacher", "admin"]),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
  phone: z.string().optional(),
  dob: z.string().optional(),
});

export const editSchema = z.object({
  name: z.string().min(2, "Họ tên ít nhất 2 ký tự"),
  email: z.email("Email không hợp lệ"),
  phone: z.string().optional(),
  dob: z.string().optional(),
});

export type CreateFormValues = z.infer<typeof createSchema>;
export type EditFormValues = z.infer<typeof editSchema>;
