import { useEffect, useState } from "react";
import { Users, GraduationCap, BookOpen, TrendingUp, Library, CheckCircle2 } from "lucide-react";
import { userService } from "@/services/userService";
import { classService } from "@/services/classService";
import { subjectService } from "@/services/subjectService";
import type { AdminClass } from "@/services/classService";
import { cn } from "@/lib/utils";

interface Stats {
  totalUsers: number;
  students: number;
  teachers: number;
  activeClasses: number;
  totalClasses: number;
  totalSubjects: number;
}

const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  ended: "bg-gray-100 text-gray-500",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Đang hoạt động",
  ended: "Đã kết thúc",
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentClasses, setRecentClasses] = useState<AdminClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [users, classes, subjects] = await Promise.all([
          userService.getAll(),
          classService.getAll(),
          subjectService.getAll(),
        ]);

        setStats({
          totalUsers: users.length,
          students: users.filter((u) => u.role === "student").length,
          teachers: users.filter((u) => u.role === "teacher").length,
          activeClasses: classes.filter((c) => c.status === "active").length,
          totalClasses: classes.length,
          totalSubjects: subjects.length,
        });

        setRecentClasses(classes.slice(0, 6));
      } catch {
        // silently fail — dashboard is read-only
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    {
      label: "Tổng người dùng",
      value: stats?.totalUsers,
      icon: Users,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Học sinh",
      value: stats?.students,
      icon: GraduationCap,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: "Giáo viên",
      value: stats?.teachers,
      icon: BookOpen,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "Lớp đang hoạt động",
      value: stats?.activeClasses,
      icon: TrendingUp,
      color: "text-orange-600 bg-orange-100",
    },
    {
      label: "Tổng lớp học",
      value: stats?.totalClasses,
      icon: CheckCircle2,
      color: "text-sky-600 bg-sky-100",
    },
    {
      label: "Môn học",
      value: stats?.totalSubjects,
      icon: Library,
      color: "text-rose-600 bg-rose-100",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Tổng quan hệ thống E-Learning</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-5 flex items-center gap-3"
          >
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${card.color}`}
            >
              <card.icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-tight">
                {loading ? (
                  <span className="inline-block h-7 w-10 rounded bg-muted animate-pulse" />
                ) : (
                  card.value ?? "—"
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* User role distribution */}
      {stats && stats.totalUsers > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-sm text-foreground mb-3">Phân bố người dùng</h3>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            <div
              className="bg-purple-400 rounded-l-full"
              style={{ width: `${(stats.students / stats.totalUsers) * 100}%` }}
              title={`Học sinh: ${stats.students}`}
            />
            <div
              className="bg-green-400"
              style={{ width: `${(stats.teachers / stats.totalUsers) * 100}%` }}
              title={`Giáo viên: ${stats.teachers}`}
            />
            <div
              className="bg-blue-400 rounded-r-full flex-1"
              title={`Admin: ${stats.totalUsers - stats.students - stats.teachers}`}
            />
          </div>
          <div className="flex gap-5 mt-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-purple-400" />
              Học sinh ({stats.students})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-green-400" />
              Giáo viên ({stats.teachers})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-blue-400" />
              Admin ({stats.totalUsers - stats.students - stats.teachers})
            </span>
          </div>
        </div>
      )}

      {/* Recent classes */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Lớp học gần đây</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Đang tải...</div>
        ) : recentClasses.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Chưa có lớp học nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Tên lớp", "Môn học", "Giáo viên", "Sinh viên", "Trạng thái", "Ngày tạo"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                    {cls.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {cls.subjectName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {cls.teacherName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {cls.studentCount} / {cls.quantity}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        STATUS_COLOR[cls.status]
                      )}
                    >
                      {STATUS_LABEL[cls.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(cls.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
