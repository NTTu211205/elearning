type Role = "student" | "teacher" | "admin";
type UserStatus = "active" | "inactive";

interface User {
  id: number;
  name: string;
  role: Role;
  email: string;
  status?: UserStatus;
  avatar?: string;
  dob?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type { User, Role, UserStatus };