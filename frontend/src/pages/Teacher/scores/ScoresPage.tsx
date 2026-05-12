import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  TrendingUp,
  Users,
  ShieldAlert,
  BarChart2,
  BookOpen,
  CheckCircle2,
  Medal,
  ChevronRight,
  Flame,
  GraduationCap,
  School,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { classService, type TeacherClass, type EnrolledStudent } from "@/services/classService";
import { testService, type ClassTest } from "@/services/testService";

// _____________________________________________
// Subject accent colours (by subjectId)
// _____________________________________________
const subjectAccent: Record<number, { tab: string; activeTab: string; strip: string }> = {
  1: { tab: "border-blue-200 text-blue-700",     activeTab: "bg-blue-500 text-white border-blue-500",     strip: "bg-blue-500"   },
  2: { tab: "border-violet-200 text-violet-700", activeTab: "bg-violet-500 text-white border-violet-500", strip: "bg-violet-500" },
  3: { tab: "border-orange-200 text-orange-700", activeTab: "bg-orange-500 text-white border-orange-500", strip: "bg-orange-500" },
  4: { tab: "border-green-200 text-green-700",   activeTab: "bg-green-500 text-white border-green-500",   strip: "bg-green-500"  },
};
const defaultAccent = {
  tab: "border-border text-muted-foreground",
  activeTab: "bg-primary text-white border-primary",
  strip: "bg-primary",
};

// _____________________________________________
// Score distribution histogram
// _____________________________________________
const BUCKETS = [
  { label: "0–2",  min: 0,  max: 2,     color: "bg-red-400",    textColor: "text-red-600"    },
  { label: "2–4",  min: 2,  max: 4,     color: "bg-orange-400", textColor: "text-orange-600" },
  { label: "4–5",  min: 4,  max: 5,     color: "bg-yellow-400", textColor: "text-yellow-600" },
  { label: "5–8",  min: 5,  max: 8,     color: "bg-blue-400",   textColor: "text-blue-600"   },
  { label: "8–10", min: 8,  max: 10.01, color: "bg-green-400",  textColor: "text-green-600"  },
];

const ScoreHistogram = ({ students }: { students: EnrolledStudent[] }) => {
  const withScore = students.filter((s) => s.averageScore !== null);
  const counts    = BUCKETS.map((b) =>
    withScore.filter((s) => (s.averageScore ?? 0) >= b.min && (s.averageScore ?? 0) < b.max).length
  );
  const maxCount  = Math.max(...counts, 1);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2" style={{ height: 100 }}>
        {BUCKETS.map((b, i) => (
          <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
            <span className={cn("text-xs font-bold", counts[i] > 0 ? b.textColor : "text-muted-foreground")}>
              {counts[i]}
            </span>
            <div className="w-full flex items-end" style={{ height: 72 }}>
              <div
                className={cn("w-full rounded-t transition-all duration-700", b.color)}
                style={{ height: `${(counts[i] / maxCount) * 100}%`, minHeight: counts[i] > 0 ? 4 : 0 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {BUCKETS.map((b) => (
          <span key={b.label} className="flex-1 text-[11px] text-muted-foreground text-center font-medium">{b.label}</span>
        ))}
      </div>
    </div>
  );
};

// _____________________________________________
// Per-test pass/fail horizontal bar
// _____________________________________________
const TestPassRateBar = ({ test, total }: { test: ClassTest; total: number }) => {
  const passCount = test.passCount;
  const failCount = test.submittedCount - passCount;
  const notSubmit = total - test.submittedCount;
  const passRate  = test.submittedCount > 0 ? Math.round((passCount / test.submittedCount) * 100) : 0;

  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-xs text-foreground font-medium truncate min-w-[90px] max-w-[120px]" title={test.name}>
        {test.name}
      </span>
      <div className="flex-1 flex items-center gap-1 min-w-0">
        <div className="flex-1 flex h-5 rounded-full overflow-hidden bg-muted/40">
          {test.submittedCount > 0 && (
            <>
              <div
                className="bg-green-400 flex items-center justify-center transition-all duration-700"
                style={{ width: `${(passCount / total) * 100}%` }}
                title={`Dat: ${passCount}`}
              >
                {passCount > 2 && <span className="text-[10px] text-white font-bold">{passCount}</span>}
              </div>
              <div
                className="bg-red-400 flex items-center justify-center transition-all duration-700"
                style={{ width: `${(failCount / total) * 100}%` }}
                title={`Rot: ${failCount}`}
              >
                {failCount > 2 && <span className="text-[10px] text-white font-bold">{failCount}</span>}
              </div>
            </>
          )}
          <div
            className="bg-muted transition-all duration-700"
            style={{ width: `${(notSubmit / total) * 100}%` }}
            title={`Chua nop: ${notSubmit}`}
          />
        </div>
        <span className={cn(
          "text-xs font-bold shrink-0 w-9 text-right",
          passRate >= 80 ? "text-green-600" : passRate >= 60 ? "text-blue-600" : passRate >= 40 ? "text-yellow-600" : "text-red-500"
        )}>
          {test.submittedCount > 0 ? `${passRate}%` : "-"}
        </span>
      </div>
    </div>
  );
};

// _____________________________________________
// Bottom students - SQL Window Function
// _____________________________________________
interface BottomStudent {
  studentId: number;
  studentName: string;
  averageScore: number;
  percentileRank: number;
  rowRank: number;
  totalWithScore: number;
}

const BottomStudentsTable = ({ classId }: { classId: number }) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<BottomStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ message: string; data: BottomStudent[] }>(`/enrollment/class/${classId}/bottom-students`)
      .then((res) => setStudents(res.data.data ?? []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <span className="text-sm animate-pulse">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
        <CheckCircle2 className="size-10 text-green-400 opacity-70" />
        <p className="text-sm font-medium">Không có học sinh nào dưới 5 điểm</p>
        <p className="text-xs">Tất cả học sinh đều đạt điểm hoặc chưa có dữ liệu điểm</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 font-medium">
          <ShieldAlert className="size-3" />{students.length} học sinh dưới ngưỡng
        </span>
        <span className="ml-auto text-muted-foreground">
          Top {students.length} / {students[0]?.totalWithScore ?? 0} hs có điểm
        </span>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">Hạng</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Học sinh</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Điểm TB</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phân vị (P)</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((s) => (
                <tr key={s.studentId} className="hover:bg-muted/20 transition-colors bg-red-50/20">
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center size-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                      {s.rowRank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-red-400">
                        {s.studentName.split(" ").at(-1)?.[0] ?? "?"}
                      </div>
                      <p className="font-medium text-foreground truncate">{s.studentName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className={cn(
                        "text-base font-bold",
                        s.averageScore < 3 ? "text-red-600" :
                        s.averageScore < 4 ? "text-orange-600" : "text-yellow-600"
                      )}>
                        {s.averageScore}
                      </span>
                      <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            s.averageScore < 3 ? "bg-red-400" :
                            s.averageScore < 4 ? "bg-orange-400" : "bg-yellow-400"
                          )}
                          style={{ width: `${(s.averageScore / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      s.percentileRank <= 10 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                    )}>
                      P{s.percentileRank}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => navigate(`/teacher/students/${classId}/${s.studentId}`)}
                      className="flex items-center justify-center size-7 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors mx-auto"
                      title="Xem hồ sơ học sinh"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// _____________________________________________
// Per-class summary cards
// _____________________________________________
interface ClassSummaryData {
  totalStudents: number;
  avgScore: number | null;
  passRate: number;
  atRiskCount: number;
}

const ClassSummaryCards = ({ data }: { data: ClassSummaryData }) => {
  const items = [
    {
      icon: Users,        label: "Học sinh",      value: String(data.totalStudents),
      sub: "trong lớp",   iconCls: "text-blue-500",    bgCls: "bg-blue-50",
    },
    {
      icon: TrendingUp,   label: "Điểm TB",       value: data.avgScore !== null ? String(data.avgScore) : "—",
      sub: "/10 điểm",    iconCls: "text-green-600",   bgCls: "bg-green-50",
    },
    {
      icon: CheckCircle2, label: "Tỉ lệ đạt",     value: `${data.passRate}%`,
      sub: "≥ 5 điểm",    iconCls: "text-emerald-600", bgCls: "bg-emerald-50",
    },
    {
      icon: Flame,        label: "Cần can thiệp", value: String(data.atRiskCount),
      sub: "học sinh rủi ro", iconCls: "text-orange-500", bgCls: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
          <div className={cn("flex size-8 items-center justify-center rounded-lg", item.bgCls)}>
            <item.icon className={cn("size-4 shrink-0", item.iconCls)} />
          </div>
          <div>
            <p className={cn(
              "text-2xl font-bold",
              item.label === "Cần can thiệp" && data.atRiskCount > 0 ? "text-orange-500" : "text-foreground"
            )}>
              {item.value}
            </p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-[10px] text-muted-foreground/70">{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// _____________________________________________
// Global summary (derived from TeacherClass list)
// _____________________________________________
const GlobalSummary = ({ classes }: { classes: TeacherClass[] }) => {
  const activeClasses    = classes.filter((c) => c.status === "active");
  const totalStudents    = activeClasses.reduce((a, c) => a + c.totalStudents, 0);
  const classesWithScore = activeClasses.filter((c) => c.avgScore !== null);
  const totalWeighted    = classesWithScore.reduce((a, c) => a + c.totalStudents, 0);
  const globalAvg        = totalWeighted > 0
    ? Math.round(
        classesWithScore.reduce((a, c) => a + (c.avgScore ?? 0) * c.totalStudents, 0)
        / totalWeighted * 10
      ) / 10
    : null;
  const worstClass = [...activeClasses]
    .filter((c) => c.avgScore !== null)
    .sort((a, b) => (a.avgScore ?? 10) - (b.avgScore ?? 10))[0];

  return (
    <div className="rounded-xl border border-border bg-gradient-to-r from-card to-muted/10 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="size-5 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Tổng quan toàn bộ lớp</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">{totalStudents}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tổng học sinh</p>
        </div>
        <div className="text-center">
          <p className={cn(
            "text-3xl font-bold",
            globalAvg === null ? "text-muted-foreground" :
            globalAvg >= 6.5 ? "text-green-600" : globalAvg >= 5 ? "text-blue-600" : "text-red-500"
          )}>
            {globalAvg ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">ĐTB chung</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-500">{activeClasses.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Lớp đang hoạt động</p>
        </div>
      </div>
      {worstClass && (worstClass.avgScore ?? 10) < 6.5 && (
        <div className="flex items-center gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
          <Flame className="size-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700">
            Lớp <span className="font-bold">{worstClass.className}</span> có ĐTB thấp nhất:{" "}
            <span className="font-bold">{worstClass.avgScore}</span> — cần chú ý!
          </p>
        </div>
      )}
    </div>
  );
};

// _____________________________________________
// Page
// _____________________________________________
const ScoresPage = () => {
  const { user } = useAuthStore();

  const [classes, setClasses]                   = useState<TeacherClass[]>([]);
  const [classesLoading, setClassesLoading]     = useState(true);
  const [selectedClassId, setSelectedClassId]   = useState<number | null>(null);
  const [students, setStudents]                 = useState<EnrolledStudent[]>([]);
  const [tests, setTests]                       = useState<ClassTest[]>([]);
  const [loadedClassId, setLoadedClassId]       = useState<number | null>(null);

  const classDataLoading = selectedClassId !== null && loadedClassId !== selectedClassId;

  // Load teacher classes on mount
  useEffect(() => {
    if (!user?.id) return;
    classService
      .getByTeacher(user.id)
      .then((data) => {
        setClasses(data);
        const firstActive = data.find((c) => c.status === "active");
        if (firstActive) setSelectedClassId(firstActive.id);
      })
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false));
  }, [user?.id]);

  // Load students + tests when selected class changes
  useEffect(() => {
    if (!selectedClassId) return;
    Promise.all([
      classService.getStudentsByClass(selectedClassId),
      testService.getByClass(selectedClassId),
    ])
      .then(([s, t]) => { setStudents(s); setTests(t); setLoadedClassId(selectedClassId); })
      .catch(() => { setStudents([]); setTests([]); setLoadedClassId(selectedClassId); });
  }, [selectedClassId]);

  const activeClasses = useMemo(() => classes.filter((c) => c.status === "active"), [classes]);

  const selectedClass = useMemo(
    () => activeClasses.find((c) => c.id === selectedClassId) ?? null,
    [activeClasses, selectedClassId]
  );

  // Compute per-class stats from fetched students
  const classSummary = useMemo((): ClassSummaryData => {
    const withScore   = students.filter((s) => s.averageScore !== null);
    const passCount   = withScore.filter((s) => (s.averageScore ?? 0) >= 5).length;
    const atRiskCount = withScore.filter((s) => (s.averageScore ?? 0) < 5).length;
    const avgScore    = withScore.length
      ? Math.round(
          (withScore.reduce((a, s) => a + (s.averageScore ?? 0), 0) / withScore.length) * 10
        ) / 10
      : null;
    const passRate    = withScore.length ? Math.round((passCount / withScore.length) * 100) : 0;
    return { totalStudents: students.length, avgScore, passRate, atRiskCount };
  }, [students]);

  const accent = selectedClass
    ? (subjectAccent[selectedClass.subjectId] ?? defaultAccent)
    : defaultAccent;

  if (classesLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <span className="text-sm animate-pulse">Đang tải danh sách lớp...</span>
      </div>
    );
  }

  if (activeClasses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-muted-foreground">
        <School className="size-10 opacity-30" />
        <p className="text-sm">Chưa có lớp học nào đang hoạt động</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="text-sm font-semibold text-foreground">Điểm số & Phân tích</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Đánh giá chất lượng học tập, phát hiện học sinh có nguy cơ rớt môn
        </p>
      </div>

      {/* Global summary */}
      <GlobalSummary classes={classes} />

      {/* Class tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <GraduationCap className="size-4 text-muted-foreground shrink-0" />
        {activeClasses.map((cls) => {
          const isActive = cls.id === selectedClassId;
          const ac       = subjectAccent[cls.subjectId] ?? defaultAccent;
          return (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              title={cls.subjectName}
              className={cn(
                "relative flex flex-col items-center rounded-xl px-4 py-1.5 text-sm font-medium border transition-all",
                isActive ? ac.activeTab : ac.tab + " hover:bg-muted/40"
              )}
            >
              <span>{cls.className}</span>
              <span className="text-[11px] font-normal opacity-70 leading-tight">{cls.subjectName}</span>
            </button>
          );
        })}
      </div>

      {/* Colour strip */}
      <div className={cn("h-1 rounded-full", accent.strip)} />

      {classDataLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <span className="text-sm animate-pulse">Đang tải dữ liệu lớp...</span>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <ClassSummaryCards data={classSummary} />

          {/* Two-column charts */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Histogram */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Phân bố điểm trung bình</h3>
                <span className="ml-auto text-xs text-muted-foreground">
                  {students.filter((s) => s.averageScore !== null).length} / {students.length} hs có điểm
                </span>
              </div>
              <ScoreHistogram students={students} />
              <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
                {BUCKETS.map((b) => (
                  <span key={b.label} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className={cn("size-2.5 rounded-sm inline-block", b.color)} />{b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Pass rate per test */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">Tỉ lệ đạt theo đề thi</h3>
              </div>
              {tests.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <BookOpen className="size-7 opacity-30" />
                  <p className="text-xs">Chưa có đề thi nào</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {tests.map((t) => (
                    <TestPassRateBar key={t.id} test={t} total={students.length} />
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground border-t border-border pt-2">
                <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-green-400 inline-block" />Đạt</span>
                <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-red-400 inline-block" />Rớt</span>
                <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-muted inline-block" />Chưa nộp</span>
              </div>
            </div>
          </div>

          {/* Bottom students */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Medal className="size-4 text-red-500" />
              <h3 className="text-base font-semibold text-foreground">
                Học sinh điểm yếu — Lớp {selectedClass?.className}
              </h3>
              <span className="text-xs text-muted-foreground">(Top 10 · ĐTB ≤ 5)</span>
            </div>
            {selectedClassId && (
              <BottomStudentsTable key={selectedClassId} classId={selectedClassId} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ScoresPage;