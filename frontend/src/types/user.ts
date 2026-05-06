type Role = "student" | "teacher" | "admin";

interface User {
  id: number;
  name: string;
  role: Role;
  email: string;
  status?: number;  // tinyint: 1=active, 0=inactive
  avatar?: string;
  dob?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type { User, Role };