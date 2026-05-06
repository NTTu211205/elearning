import { useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Upload, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/userService";
import type { CreateUserPayload, BulkCreateResult } from "@/services/userService";
import { cn } from "@/lib/utils";
import { ModalContent } from "./ModalBase";
import { toast } from "sonner";

// ─── CSV columns (order matters) ─────────────────────────────
// name, email, role, password, phone, dob
// dob is optional — can be empty
const REQUIRED_HEADERS = ["name", "email", "role", "password", "phone"];

interface ParsedRow extends CreateUserPayload {
  _line: number;
}

interface ImportCSVModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

// ─── Parse CSV text → rows, errors ──────────────────────────
function parseCSV(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return { rows: [], errors: ["File CSV phải có ít nhất 1 dòng header và 1 dòng dữ liệu"] };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  // Check required headers
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return { rows: [], errors: [`File thiếu cột: ${missing.join(", ")}`] };
  }

  const idx = (col: string) => headers.indexOf(col);

  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  lines.slice(1).forEach((line, i) => {
    const lineNum = i + 2;
    // Handle quoted fields with commas inside
    const cols = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) ?? line.split(",");
    const get = (col: string) => (cols[idx(col)] ?? "").replace(/^"|"$/g, "").trim();

    const name     = get("name");
    const email    = get("email");
    const role     = get("role") as "student" | "teacher" | "admin";
    const password = get("password");
    const phone    = get("phone");
    const dob      = get("dob") || undefined;

    // Row-level validation
    const rowErrors: string[] = [];
    if (!name)                                  rowErrors.push("thiếu name");
    if (!email || !email.includes("@"))         rowErrors.push("email không hợp lệ");
    if (!["student", "teacher", "admin"].includes(role)) rowErrors.push("role phải là student/teacher/admin");
    if (!password || password.length < 6)       rowErrors.push("password ít nhất 6 ký tự");
    if (!phone || !/^\d{10}$/.test(phone))      rowErrors.push("phone phải đúng 10 chữ số");

    if (rowErrors.length > 0) {
      errors.push(`Dòng ${lineNum}: ${rowErrors.join("; ")}`);
    } else {
      rows.push({ _line: lineNum, name, email, role, password, phone, dob });
    }
  });

  return { rows, errors };
}

const ROLE_LABEL: Record<string, string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  admin: "Admin",
};

type Step = "upload" | "preview" | "result";

export function ImportCSVModal({ open, onClose, onImported }: ImportCSVModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<BulkCreateResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setStep("upload");
    setRows([]);
    setParseErrors([]);
    setFileName("");
    setResult(null);
    setParsing(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Vui lòng chọn file .csv");
      return;
    }
    setFileName(file.name);
    setParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows: parsed, errors } = parseCSV(text);
      setRows(parsed);
      setParseErrors(errors);
      setParsing(false);
      setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    try {
      // Strip _line before sending
      const payload = rows.map(({ _line: _, ...rest }) => rest);
      const res = await userService.bulkCreate(payload);
      setResult(res);
      setStep("result");
      if (res.success.length > 0) {
        onImported();
        toast.success(`Đã import thành công ${res.success.length} người dùng`);
      }
      if (res.failed.length > 0) {
        toast.warning(`${res.failed.length} dòng bị lỗi`);
      }
    } catch {
      toast.error("Import thất bại, vui lòng thử lại");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <ModalContent
        title="Import người dùng từ CSV"
        description={
          step === "upload"
            ? "Tải lên file CSV theo đúng định dạng"
            : step === "preview"
            ? `${fileName} — ${rows.length} dòng hợp lệ${parseErrors.length > 0 ? `, ${parseErrors.length} dòng lỗi` : ""}`
            : `Kết quả: ${result?.success.length ?? 0} thành công, ${result?.failed.length ?? 0} thất bại`
        }
        onClose={handleClose}
      >
        {/* ── STEP 1: Upload ── */}
        {step === "upload" && (
          <div className="flex flex-col gap-4">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer py-10 transition-colors",
                parsing ? "border-primary bg-primary/5 cursor-wait" : dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              {parsing ? (
                <>
                  <svg className="size-8 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm font-medium text-primary">Đang xử lý file...</p>
                </>
              ) : (
                <>
                  <Upload className="size-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Kéo thả file CSV vào đây</p>
                    <p className="text-xs text-muted-foreground mt-0.5">hoặc click để chọn file</p>
                  </div>
                </>
              )}
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} disabled={parsing} />
            </div>

            {/* Format guide */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold text-foreground mb-2">Định dạng file CSV:</p>
              <code className="block text-xs text-muted-foreground bg-background rounded px-3 py-2 font-mono border border-border">
                name,email,role,password,phone,dob<br />
                Nguyễn Văn A,vana@gmail.com,student,123456,0912345678,2003-05-20<br />
              </code>
              <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground list-disc list-inside">
                <li><strong>role</strong>: student | teacher | admin</li>
                <li><strong>password</strong>: ít nhất 6 ký tự</li>
                <li><strong>phone</strong>: đúng 10 chữ số</li>
                <li><strong>dob</strong>: định dạng YYYY-MM-DD (có thể bỏ trống)</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose}>Đóng</Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Preview ── */}
        {step === "preview" && (
          <div className="flex flex-col gap-4">
            {/* Parse errors */}
            {parseErrors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1 max-h-32 overflow-y-auto">
                <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                  <AlertCircle className="size-3.5" /> {parseErrors.length} dòng bị bỏ qua do lỗi:
                </p>
                {parseErrors.map((e, i) => (
                  <p key={i} className="text-xs text-destructive/80">{e}</p>
                ))}
              </div>
            )}

            {rows.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-4">
                Không có dòng hợp lệ để import
              </p>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        {["#", "Họ tên", "Email", "Vai trò", "SĐT", "Ngày sinh"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((r, i) => (
                        <tr key={r._line} className="hover:bg-muted/20">
                          <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{r.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{r.email}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex rounded-full px-2 py-0.5 bg-muted text-muted-foreground font-medium">
                              {ROLE_LABEL[r.role] ?? r.role}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{r.phone}</td>
                          <td className="px-3 py-2 text-muted-foreground">{r.dob ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-2 pt-1">
              <Button variant="outline" onClick={reset} disabled={importing}>
                Chọn file khác
              </Button>
              <Button onClick={handleImport} disabled={importing || rows.length === 0}>
                {importing ? "Đang import..." : `Import ${rows.length} người dùng`}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Result ── */}
        {step === "result" && result && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center gap-3">
                <CheckCircle2 className="size-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-green-700">{result.success.length}</p>
                  <p className="text-xs text-green-600">Thành công</p>
                </div>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
                <XCircle className="size-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{result.failed.length}</p>
                  <p className="text-xs text-red-500">Thất bại</p>
                </div>
              </div>
            </div>

            {result.failed.length > 0 && (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground">
                  Các dòng thất bại
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-border">
                  {result.failed.map((f) => (
                    <div key={f.email} className="px-3 py-2 flex items-start gap-2">
                      <XCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{f.email}</p>
                        <p className="text-xs text-destructive">{f.error}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={reset}>Import thêm</Button>
              <Button onClick={handleClose}>Đóng</Button>
            </div>
          </div>
        )}
      </ModalContent>
    </Dialog.Root>
  );
}
