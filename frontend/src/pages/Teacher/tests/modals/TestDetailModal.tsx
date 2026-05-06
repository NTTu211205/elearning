import { useState, useMemo } from "react";
import { Dialog } from "radix-ui";
import { X, ArrowUpDown, ArrowUp, ArrowDown, Trophy, Users, TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TestListItem } from "@/types/test";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface StudentResult {
  studentId: number;
  studentName: string;
  score: number;          // 0-10
  correctCount: number;
  totalQuestions: number;
  submitAt: string;
  turn: number;
}

interface QuestionStat {
  index: number;         // 1-based
  correctCount: number;
  incorrectCount: number;
}

type SortKey = "name" | "score" | "correct" | "submitAt";
type SortDir = "asc" | "desc";
type ScoreFilter = "all" | "pass" | "fail" | "excellent";

// ─────────────────────────────────────────────
// Mock data generator (thay bằng API sau)
// ─────────────────────────────────────────────
const generateMockResults = (testId: number, questionCount: number): StudentResult[] => {
  const names = [
    "Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Cường", "Phạm Thị Dung",
    "Hoàng Văn Em", "Đặng Thị Phương", "Bùi Quốc Giang", "Vũ Thị Hoa",
    "Đỗ Văn Ích", "Ngô Thị Kim", "Lý Văn Long", "Phan Thị Mai",
    "Trịnh Văn Nam", "Cao Thị Oanh", "Đinh Văn Phúc",
  ];
  return names.map((name, i) => {
    const correct = Math.floor(Math.random() * (questionCount + 1));
    const score = Math.round((correct / questionCount) * 10 * 10) / 10;
    return {
      studentId: 100 + i + (testId * 10),
      studentName: name,
      score,
      correctCount: correct,
      totalQuestions: questionCount,
      submitAt: new Date(Date.now() - Math.random() * 3600000 * 48).toISOString(),
      turn: 1,
    };
  });
};

const generateQuestionStats = (results: StudentResult[], questionCount: number): QuestionStat[] =>
  Array.from({ length: questionCount }, (_, i) => {
    const correctCount = results.filter(() => Math.random() > 0.38).length;
    return { index: i + 1, correctCount, incorrectCount: results.length - correctCount };
  });

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

/** SVG radial progress ring */
const RadialProgress = ({
  value,
  size = 64,
  stroke = 6,
  color = "hsl(var(--primary))",
}: {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  color?: string;
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/50" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
};

/** Stat card with radial ring */
const StatCard = ({
  label, value, sub, pct, icon: Icon, color,
}: {
  label: string; value: string; sub?: string;
  pct: number; icon: React.ElementType; color: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
    <div className="relative flex items-center justify-center shrink-0">
      <RadialProgress value={pct} color={color} />
      <Icon className="absolute size-4" style={{ color }} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
    </div>
  </div>
);

/** Score distribution histogram — 5 buckets */
const ScoreHistogram = ({ results }: { results: StudentResult[] }) => {
  const buckets = [
    { label: "0–2", min: 0, max: 2, color: "bg-red-400" },
    { label: "2–4", min: 2, max: 4, color: "bg-orange-400" },
    { label: "4–6", min: 4, max: 6, color: "bg-yellow-400" },
    { label: "6–8", min: 6, max: 8, color: "bg-blue-400" },
    { label: "8–10", min: 8, max: 10.01, color: "bg-green-400" },
  ];
  const counts = buckets.map((b) => results.filter((r) => r.score >= b.min && r.score < b.max).length);
  const max = Math.max(...counts, 1);

  return (
    <div className="flex flex-col gap-3 h-full">
      <h3 className="text-sm font-semibold text-foreground">Phân bố điểm số</h3>
      <div className="flex items-end gap-2 flex-1 min-h-0">
        {buckets.map((b, i) => (
          <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs font-medium text-foreground">{counts[i]}</span>
            <div className="w-full flex items-end" style={{ height: 120 }}>
              <div
                className={cn("w-full rounded-t transition-all duration-700", b.color)}
                style={{ height: `${(counts[i] / max) * 100}%`, minHeight: counts[i] > 0 ? 4 : 0 }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {buckets.map((b) => (
          <span key={b.label} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className={cn("inline-block size-2 rounded-full", b.color)} />
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Per-question correct rate — horizontal stacked bars */
const QuestionChart = ({ stats, total }: { stats: QuestionStat[]; total: number }) => (
  <div className="flex flex-col gap-2 h-full overflow-y-auto">
    <h3 className="text-sm font-semibold text-foreground shrink-0">Tỉ lệ đúng từng câu</h3>
    <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
      {stats.map((q) => {
        const correctPct = total > 0 ? Math.round((q.correctCount / total) * 100) : 0;
        const incorrectPct = 100 - correctPct;
        return (
          <div key={q.index} className="flex items-center gap-2">
            <span className="w-9 shrink-0 text-right text-xs text-muted-foreground font-mono">
              C{q.index}
            </span>
            <div className="flex-1 flex h-4 rounded overflow-hidden bg-muted/40">
              {correctPct > 0 && (
                <div
                  className="bg-green-400 transition-all duration-700 flex items-center justify-center"
                  style={{ width: `${correctPct}%` }}
                  title={`Đúng: ${q.correctCount} (${correctPct}%)`}
                >
                  {correctPct >= 20 && (
                    <span className="text-[9px] font-medium text-white leading-none">{correctPct}%</span>
                  )}
                </div>
              )}
              {incorrectPct > 0 && (
                <div
                  className="bg-red-300 transition-all duration-700 flex items-center justify-center"
                  style={{ width: `${incorrectPct}%` }}
                  title={`Sai: ${q.incorrectCount} (${incorrectPct}%)`}
                >
                  {incorrectPct >= 20 && (
                    <span className="text-[9px] font-medium text-white leading-none">{incorrectPct}%</span>
                  )}
                </div>
              )}
            </div>
            <span className="w-8 shrink-0 text-xs text-muted-foreground">{correctPct}%</span>
          </div>
        );
      })}
    </div>
    <div className="flex gap-3 shrink-0 mt-1">
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="inline-block size-2 rounded-full bg-green-400" /> Đúng
      </span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="inline-block size-2 rounded-full bg-red-300" /> Sai
      </span>
    </div>
  </div>
);

/** Sortable icon button */
const SortButton = ({
  col, current, dir, onClick,
}: {
  col: SortKey; current: SortKey; dir: SortDir;
  onClick: (k: SortKey) => void;
}) => (
  <button
    onClick={() => onClick(col)}
    className="ml-1 inline-flex text-muted-foreground hover:text-foreground transition-colors"
  >
    {current !== col ? (
      <ArrowUpDown className="size-3" />
    ) : dir === "asc" ? (
      <ArrowUp className="size-3 text-primary" />
    ) : (
      <ArrowDown className="size-3 text-primary" />
    )}
  </button>
);

const SCORE_FILTER_LABELS: Record<ScoreFilter, string> = {
  all: "Tất cả",
  excellent: "Giỏi (≥8)",
  pass: "Đạt (≥5)",
  fail: "Chưa đạt (<5)",
};

const scoreFilterFn = (r: StudentResult, f: ScoreFilter) => {
  if (f === "excellent") return r.score >= 8;
  if (f === "pass") return r.score >= 5 && r.score < 8;
  if (f === "fail") return r.score < 5;
  return true;
};

const ScoreBadge = ({ score }: { score: number }) => {
  if (score >= 8) return <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">{score}</span>;
  if (score >= 5) return <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">{score}</span>;
  return <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600">{score}</span>;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

// ─────────────────────────────────────────────
// Main modal
// ─────────────────────────────────────────────
interface TestDetailModalProps {
  test: TestListItem | null;
  onClose: () => void;
}

export const TestDetailModal = ({ test, onClose }: TestDetailModalProps) => {
  const open = Boolean(test);
  const qCount = test?.questionCount ?? 10;

  // Stable mock data per test
  const results = useMemo(
    () => (test ? generateMockResults(test.id, qCount) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [test?.id]
  );
  const questionStats = useMemo(() => generateQuestionStats(results, qCount), [results, qCount]);

  // ── Filters & sort ──
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [nameSearch, setNameSearch] = useState("");

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let rows = results.filter(
      (r) =>
        scoreFilterFn(r, scoreFilter) &&
        r.studentName.toLowerCase().includes(nameSearch.toLowerCase())
    );
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "score") cmp = a.score - b.score;
      else if (sortKey === "correct") cmp = a.correctCount - b.correctCount;
      else if (sortKey === "name") cmp = a.studentName.localeCompare(b.studentName, "vi");
      else if (sortKey === "submitAt") cmp = new Date(a.submitAt).getTime() - new Date(b.submitAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [results, scoreFilter, nameSearch, sortKey, sortDir]);

  // ── Summary stats ──
  const avg = results.length ? Math.round((results.reduce((s, r) => s + r.score, 0) / results.length) * 10) / 10 : 0;
  const passCount = results.filter((r) => r.score >= 5).length;
  const passRate = results.length ? Math.round((passCount / results.length) * 100) : 0;
  const highest = results.length ? Math.max(...results.map((r) => r.score)) : 0;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 animate-in fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[96vw] max-w-5xl max-h-[92vh] -translate-x-1/2 -translate-y-1/2
            rounded-2xl border border-border bg-background shadow-2xl animate-in fade-in-0 zoom-in-95
            flex flex-col overflow-hidden"
        >
          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border shrink-0">
            <div>
              <Dialog.Title className="text-base font-bold text-foreground">{test?.name}</Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                {test?.className ?? "Chưa có lớp"} · {qCount} câu · {test?.duration ?? "—"} phút · {results.length} học sinh đã nộp
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Học sinh nộp bài" value={String(results.length)}
                sub="tổng số" pct={(results.length / 30) * 100}
                icon={Users} color="hsl(217,91%,60%)" />
              <StatCard label="Điểm trung bình" value={String(avg)}
                sub="trên 10" pct={(avg / 10) * 100}
                icon={TrendingUp} color="hsl(142,76%,36%)" />
              <StatCard label="Tỉ lệ đạt" value={`${passRate}%`}
                sub={`${passCount}/${results.length} học sinh`} pct={passRate}
                icon={Target} color={passRate >= 50 ? "hsl(142,76%,36%)" : "hsl(0,84%,60%)"} />
              <StatCard label="Điểm cao nhất" value={String(highest)}
                sub="trên 10" pct={(highest / 10) * 100}
                icon={Trophy} color="hsl(38,92%,50%)" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4" style={{ minHeight: 220 }}>
                <ScoreHistogram results={results} />
              </div>
              <div className="rounded-xl border border-border bg-card p-4 overflow-hidden" style={{ maxHeight: 260 }}>
                <QuestionChart stats={questionStats} total={results.length} />
              </div>
            </div>

            {/* Student table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Table toolbar */}
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
                <input
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  placeholder="Tìm học sinh..."
                  className="h-8 w-44 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <div className="flex gap-1 flex-wrap">
                  {(Object.keys(SCORE_FILTER_LABELS) as ScoreFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setScoreFilter(f)}
                      className={cn(
                        "h-7 rounded-full px-3 text-xs font-medium transition-colors border",
                        scoreFilter === f
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {SCORE_FILTER_LABELS[f]}
                    </button>
                  ))}
                </div>
                <span className="ml-auto text-xs text-muted-foreground">{filtered.length} kết quả</span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Học sinh
                        <SortButton col="name" current={sortKey} dir={sortDir} onClick={toggleSort} />
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Điểm
                        <SortButton col="score" current={sortKey} dir={sortDir} onClick={toggleSort} />
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Đúng / Tổng
                        <SortButton col="correct" current={sortKey} dir={sortDir} onClick={toggleSort} />
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                        Tiến độ
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                        Nộp lúc
                        <SortButton col="submitAt" current={sortKey} dir={sortDir} onClick={toggleSort} />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                          Không có kết quả phù hợp
                        </td>
                      </tr>
                    )}
                    {filtered.map((r, i) => {
                      const correctPct = Math.round((r.correctCount / r.totalQuestions) * 100);
                      return (
                        <tr key={r.studentId} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">{i + 1}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                {r.studentName.split(" ").at(-1)?.[0] ?? "?"}
                              </div>
                              <span className="font-medium text-foreground text-sm">{r.studentName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <ScoreBadge score={r.score} />
                          </td>
                          <td className="px-4 py-2.5 text-center text-sm">
                            <span className="text-green-600 font-medium">{r.correctCount}</span>
                            <span className="text-muted-foreground"> / {r.totalQuestions}</span>
                          </td>
                          <td className="px-4 py-2.5 hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    correctPct >= 80 ? "bg-green-400" : correctPct >= 50 ? "bg-blue-400" : "bg-red-400"
                                  )}
                                  style={{ width: `${correctPct}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8 shrink-0">{correctPct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                            {formatDate(r.submitAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
