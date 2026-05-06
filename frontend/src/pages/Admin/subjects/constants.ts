export const STATUS_LABELS: Record<number, string> = {
  1: "Đang hoạt động",
  0: "Ngừng hoạt động",
};

export const STATUS_COLORS: Record<number, string> = {
  1: "bg-green-100 text-green-700",
  0: "bg-red-100 text-red-700",
};

export const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";
