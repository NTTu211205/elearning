import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  GraduationCap,
  FileText,
  Flame,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { classService, type TeacherClass } from "@/services/classService";

// ─────────────────────────────────────────────
// Subject colour accent — cycles through palette
// ─────────────────────────────────────────────
const STRIP_PALETTE = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-rose-500",
  "bg-amber-500",
];
const subjectStrip = (subjectId: number) =>
  STRIP_PALETTE[subjectId % STRIP_PALETTE.length];

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────
const TeacherDashboard = () => {
  const navigate  = useNavigate();
  const user      = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ").at(-1) ?? "Giao vien";
  const [classes, setClasses] = useState<TeacherClass[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    classService.getByTeacher(user.id).then(setClasses).catch(console.error);
  }, [user?.id]);

  const activeClasses = classes.filter((c) => c.status === "active");
  const totalTests    = classes.reduce((s, c) => s + c.totalTests, 0);
  const totalStudents = activeClasses.reduce((s, c) => s + c.totalStudents, 0);
  const validAvg      = classes.filter((c) => c.avgScore !== null);
  const overallAvg    = validAvg.length
    ? Math.round((validAvg.reduce((s, c) => s + (c.avgScore ?? 0), 0) / validAvg.length) * 10) / 10
    : null;

  return (
    <div className="flex flex-col gap-6">

      {/* Greeting */}
      <div>
        <h2 className="text-sm font-semibold text-foreground">Chào mừng quay lại {firstName}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Đây là tổng quan lớp học của bạn hôm nay.
        </p>
      </div>

      {/* 4 Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: GraduationCap, label: "Lớp đang dạy",  value: activeClasses.length,                         iconCls: "text-blue-500",   bgCls: "bg-blue-50",   onClick: () => navigate("/teacher/classes") },
          { icon: Users,         label: "Tổng học sinh",  value: totalStudents,                                iconCls: "text-violet-500", bgCls: "bg-violet-50", onClick: () => navigate("/teacher/classes") },
          { icon: FileText,      label: "Đề thi đã giao", value: totalTests,                                   iconCls: "text-amber-500",  bgCls: "bg-amber-50",  onClick: () => navigate("/teacher/tests")   },
          { icon: TrendingUp,    label: "Điểm TB chung",  value: overallAvg !== null ? `${overallAvg}` : "—", iconCls: "text-green-500",  bgCls: "bg-green-50",  onClick: () => navigate("/teacher/scores")  },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 text-left hover:shadow-sm hover:border-primary/30 transition-all group"
          >
            <div className={cn("flex size-9 items-center justify-center rounded-lg", item.bgCls)}>
              <item.icon className={cn("size-5", item.iconCls)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Two column: class list + quick actions */}
      <div className="grid gap-4 md:grid-cols-5">

        {/* Class list — 3 cols */}
        <div className="md:col-span-3 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Lớp học của tôi</h2>
            </div>
            <button
              onClick={() => navigate("/teacher/classes")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
            >
              Xem tất cả <ChevronRight className="size-3.5" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {classes.length === 0 ? (
              <p className="px-5 py-6 text-sm text-center text-muted-foreground">Chưa có lớp học nào.</p>
            ) : (
              [...classes]
                .sort((a, b) => (a.status === b.status ? 0 : a.status === "active" ? -1 : 1))
                .map((cls) => {
                  const strip = subjectStrip(cls.subjectId);
                  return (
                    <button
                      key={cls.id}
                      onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                      className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors text-left group"
                    >
                      <div className={cn("w-1 self-stretch rounded-full shrink-0", strip)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {cls.className}
                          </p>
                          {cls.status === "ended" && (
                            <span className="rounded-full bg-muted/60 text-muted-foreground px-1.5 py-0.5 text-[10px] font-medium shrink-0">
                              Đã kết thúc
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {cls.subjectName} · {cls.totalStudents} HS
                        </p>
                      </div>
                      <div className="text-center shrink-0">
                        <p className={cn("text-sm font-bold",
                          cls.avgScore === null  ? "text-muted-foreground"
                          : cls.avgScore >= 7   ? "text-green-600"
                          : cls.avgScore >= 5.5 ? "text-blue-600"
                          : "text-orange-500"
                        )}>
                          {cls.avgScore !== null ? cls.avgScore : "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">ĐTB</p>
                      </div>
                      <div className="text-center shrink-0 hidden sm:block">
                        <p className="text-sm font-bold text-foreground">{cls.totalTests}</p>
                        <p className="text-[10px] text-muted-foreground">Đề thi</p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  );
                })
            )}
          </div>
        </div>

        {/* Right panel — 2 cols */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* Overall avg card */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-4 text-green-500" />
              <span className="text-sm font-semibold text-foreground">Điểm TB toàn bộ lớp</span>
            </div>
            <p className={cn("text-4xl font-bold", overallAvg !== null ? "text-green-600" : "text-muted-foreground")}>
              {overallAvg !== null ? overallAvg : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              Tính từ {validAvg.length} lớp có dữ liệu điểm
            </p>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Truy cập nhanh</p>
            </div>
            <div className="divide-y divide-border">
              {[
                { icon: GraduationCap, label: "Quản lý lớp",   to: "/teacher/classes", iconCls: "text-blue-500"  },
                { icon: FileText,      label: "Đề thi",         to: "/teacher/tests",   iconCls: "text-amber-500" },
                { icon: Flame,         label: "Điểm & báo cáo", to: "/teacher/scores",  iconCls: "text-red-500"   },
              ].map((item) => (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors text-left group"
                >
                  <item.icon className={cn("size-4 shrink-0", item.iconCls)} />
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex-1">
                    {item.label}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TeacherDashboard;
