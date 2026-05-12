import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { classService } from "@/services/classService";
import { userService } from "@/services/userService";
import { subjectService } from "@/services/subjectService";
import type { User } from "@/types/user";
import type { Subject } from "@/types/subject";
import { createClassSchema, type CreateClassFormValues } from "../schemas";
import { selectClass } from "../constants";
import { ModalContent } from "./ModalBase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AdminClass } from "@/services/classService";

interface CreateClassModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (cls: AdminClass) => void;
}

export function CreateClassModal({ open, onClose, onCreated }: CreateClassModalProps) {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [createdClassId, setCreatedClassId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClassFormValues>({
    resolver: zodResolver(createClassSchema) as Resolver<CreateClassFormValues>,
    defaultValues: { name: "", subjectId: 0, teacherId: 0, quantity: 30, status: "active" },
  });

  useEffect(() => {
    if (!open) return;
    reset({ name: "", subjectId: 0, teacherId: 0, quantity: 30, status: "active" });
    setSelectedStudentIds([]);
    setStudentSearch("");
    setCreatedClassId(null);

    (async () => {
      try {
        const users = await userService.getAll();
        setTeachers(users.filter((u) => u.role === "teacher" && u.status !== 0));
        setStudents(users.filter((u) => u.role === "student"));
        const subs = await subjectService.getAll();
        setSubjects(subs);
      } catch {
        toast.error("Lỗi khi tải dữ liệu");
      }
    })();
  }, [open, reset]);

  const onSubmit = async (data: CreateClassFormValues) => {
    try {
      const cls = await classService.create({
        name: data.name,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        quantity: data.quantity,
        status: data.status,
      });
      setCreatedClassId(cls.id);
      onCreated(cls);
      toast.success("Tạo lớp học thành công");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e instanceof Error ? e.message : "Tạo lớp học thất bại");
      toast.error(msg);
    }
  };

  const toggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleEnroll = async () => {
    if (!createdClassId || selectedStudentIds.length === 0) return;
    setEnrollLoading(true);
    try {
      const result = await classService.enrollStudents(createdClassId, selectedStudentIds);
      const count = result.enrolled.length;
      const failCount = result.failed.length;
      const fullCount = result.failed.filter((f) => f.reason === "Class is full").length;
      const otherFailCount = failCount - fullCount;
      if (count > 0) toast.success(`Đã thêm ${count} sinh viên vào lớp`);
      if (fullCount > 0) toast.warning(`Lớp đã đủ sĩ số. ${fullCount} sinh viên không thể thêm`);
      if (otherFailCount > 0) toast.warning(`${otherFailCount} sinh viên không thể thêm`);
      onClose();
    } catch {
      toast.error("Thêm sinh viên thất bại");
    } finally {
      setEnrollLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent
        title={createdClassId ? "Thêm sinh viên vào lớp" : "Tạo lớp học mới"}
        description={
          createdClassId
            ? "Chọn sinh viên muốn ghi danh vào lớp (có thể bỏ qua)"
            : "Điền thông tin để tạo lớp học mới"
        }
        onClose={onClose}
        wide
      >
        {!createdClassId ? (
          /* ── Step 1: Class info form ── */
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Tên lớp <span className="text-destructive">*</span>
                </label>
                <Input placeholder="VD: CSDT-K20A" {...register("name")} />
                {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Môn học <span className="text-destructive">*</span>
                </label>
                <select className={selectClass} {...register("subjectId")}>
                  <option value={0}>-- Chọn môn học --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.subjectId && (
                  <p className="text-destructive text-xs">{errors.subjectId.message}</p>
                )}
              </div>

              {/* Teacher */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Giáo viên <span className="text-destructive">*</span>
                </label>
                <select className={selectClass} {...register("teacherId")}>
                  <option value={0}>-- Chọn giáo viên --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {errors.teacherId && (
                  <p className="text-destructive text-xs">{errors.teacherId.message}</p>
                )}
              </div>

              {/* Quantity */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Sĩ số <span className="text-destructive">*</span>
                </label>
                <Input type="number" min={1} placeholder="30" {...register("quantity")} />
                {errors.quantity && (
                  <p className="text-destructive text-xs">{errors.quantity.message}</p>
                )}
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Trạng thái</label>
                <select className={selectClass} {...register("status")}>
                  <option value="active">Đang hoạt động</option>
                  <option value="ended">Đã kết thúc</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang tạo..." : "Tạo lớp học"}
              </Button>
            </div>
          </form>
        ) : (
          /* ── Step 2: Enroll students ── */
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm sinh viên theo tên, email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Selected count badge */}
            {selectedStudentIds.length > 0 && (
              <p className="text-xs text-primary font-medium">
                Đã chọn {selectedStudentIds.length} sinh viên
              </p>
            )}

            {/* Student list */}
            <div className="max-h-64 overflow-y-auto rounded-md border border-border divide-y divide-border">
              {filteredStudents.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Không tìm thấy sinh viên
                </p>
              )}
              {filteredStudents.map((s) => {
                const selected = selectedStudentIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleStudent(s.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                      selected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {selected ? (
                      <UserCheck className="size-4 shrink-0 text-primary" />
                    ) : (
                      <UserX className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 font-medium">{s.name}</span>
                    <span className="text-muted-foreground text-xs">{s.email}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose} disabled={enrollLoading}>
                Bỏ qua
              </Button>
              <Button
                onClick={handleEnroll}
                disabled={enrollLoading || selectedStudentIds.length === 0}
              >
                {enrollLoading
                  ? "Đang thêm..."
                  : `Thêm ${selectedStudentIds.length} sinh viên`}
              </Button>
            </div>
          </div>
        )}
      </ModalContent>
    </Dialog.Root>
  );
}
