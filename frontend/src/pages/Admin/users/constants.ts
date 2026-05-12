import type { Role } from "@/types/user";

export const ROLE_LABELS: Record<Role, string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  admin: "Admin",
};

export const ROLE_COLORS: Record<Role, string> = {
  student: "bg-blue-100 text-blue-700",
  teacher: "bg-purple-100 text-purple-700",
  admin: "bg-orange-100 text-orange-700",
};

export const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

/** Chuyển ISO string hoặc yyyy-mm-dd → dd/mm/yyyy để hiển thị */
export function formatDob(dob?: string): string {
  if (!dob) return "—";
  const date = new Date(dob);
  if (!isNaN(date.getTime())) {
    const d = String(date.getUTCDate()).padStart(2, "0");
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const y = date.getUTCFullYear();
    return `${d}/${m}/${y}`;
  }
  return dob;
}

/** Chuyển ISO datetime string → dd/mm/yyyy HH:mm để hiển thị */
export function formatDateTime(dt?: string): string {
  if (!dt) return "—";
  const date = new Date(dt);
  if (isNaN(date.getTime())) return "—";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${d}/${m}/${y} ${hh}:${mm}`;
}

/** Chuyển ISO string → yyyy-mm-dd cho input[type=date] */
export function dobToInputValue(dob?: string): string {
  if (!dob) return "";
  const date = new Date(dob);
  if (!isNaN(date.getTime())) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return dob;
}
