import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TestSettings, TestType } from "@/types/test";

const settingsSchema = z
  .object({
    name: z.string().min(1, "Vui lòng nhập tên đề thi"),
    class_id: z.number().int().positive("Vui lòng chọn lớp học"),
    type: z.enum(["regular", "midterm", "final"]),
    turn: z.number().int().min(1, "Tối thiểu 1 lượt"),
    duration: z.number().int().min(1, "Tối thiểu 1 phút"),
    startAt: z.string().min(1, "Vui lòng chọn thời gian mở"),
    endAt: z.string().min(1, "Vui lòng chọn thời gian đóng"),
  })
  .refine((d) => !d.startAt || !d.endAt || d.endAt > d.startAt, {
    message: "Thời gian đóng phải sau thời gian mở",
    path: ["endAt"],
  });

type SettingsFormValues = z.infer<typeof settingsSchema>;

const TEST_TYPE_LABELS: Record<TestType, string> = {
  regular: "Quá trình (30%)",
  midterm: "Giữa kỳ (20%)",
  final: "Cuối kỳ (50%)",
};

export interface ClassOption {
  id: number;
  name: string;
}

interface TestSettingsModalProps {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  initialSettings?: TestSettings;
  classes: ClassOption[];
  onSave: (settings: TestSettings) => Promise<void>;
}

const fieldClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export const TestSettingsModal = ({
  open,
  onClose,
  initialName = "",
  initialSettings,
  classes,
  onSave,
}: TestSettingsModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (!open) return;
    if (initialSettings) {
      reset({
        name: initialSettings.name,
        class_id: initialSettings.class_id ?? undefined,
        type: initialSettings.type ?? "regular",
        turn: initialSettings.turn,
        duration: initialSettings.duration,
        startAt: initialSettings.startAt,
        endAt: initialSettings.endAt,
      });
    } else {
      reset({
        name: initialName,
        class_id: undefined,
        type: "regular",
        turn: 1,
        duration: 15,
        startAt: "",
        endAt: "",
      });
    }
  }, [open, initialSettings, initialName, reset]);

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      // Convert datetime-local values (local browser time) → UTC ISO strings
      // so the backend stores consistent UTC datetimes in MySQL.
      const toUTC = (local: string) => local ? new Date(local).toISOString() : local;
      await onSave({
        name: data.name,
        class_id: data.class_id,
        type: data.type,
        turn: data.turn,
        duration: data.duration,
        startAt: toUTC(data.startAt),
        endAt: toUTC(data.endAt),
      });
      onClose();
    } catch {
      // error already toasted in parent
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 animate-in fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <Dialog.Title className="text-base font-semibold text-foreground">
                Cài đặt đề thi
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mt-0.5">
                Cấu hình thông tin trước khi lưu và phát hành
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Tên đề thi <span className="text-destructive">*</span>
              </label>
              <Input placeholder="Ví dụ: Kiểm tra 15 phút - Chương 1" {...register("name")} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Lớp học <span className="text-destructive">*</span>
              </label>
              <select className={fieldClass} {...register("class_id", { valueAsNumber: true })}>
                <option value="">-- Chọn lớp --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.class_id && <p className="text-destructive text-xs">{errors.class_id.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Loại kiểm tra <span className="text-destructive">*</span>
              </label>
              <select className={fieldClass} {...register("type")}>
                {(Object.entries(TEST_TYPE_LABELS) as [TestType, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              {errors.type && <p className="text-destructive text-xs">{errors.type.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Số lượt làm <span className="text-destructive">*</span>
                </label>
                <Input type="number" min={1} {...register("turn", { valueAsNumber: true })} />
                {errors.turn && <p className="text-destructive text-xs">{errors.turn.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Thời gian làm (phút) <span className="text-destructive">*</span>
                </label>
                <Input type="number" min={1} {...register("duration", { valueAsNumber: true })} />
                {errors.duration && <p className="text-destructive text-xs">{errors.duration.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Thời gian mở <span className="text-destructive">*</span>
                </label>
                <input type="datetime-local" className={fieldClass} {...register("startAt")} />
                {errors.startAt && <p className="text-destructive text-xs">{errors.startAt.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Thời gian đóng <span className="text-destructive">*</span>
                </label>
                <input type="datetime-local" className={fieldClass} {...register("endAt")} />
                {errors.endAt && <p className="text-destructive text-xs">{errors.endAt.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu đề thi"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};