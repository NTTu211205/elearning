import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { authService } from "@/services/authService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, KeyRound, Eye, EyeOff, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Step = "email" | "otp" | "password" | "done";

const RESEND_SECONDS = 120;

// Trích xuất message lỗi từ axios response
const getErrMsg = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
  (err instanceof Error ? err.message : fallback);

const stepLabels = ["Email", "Xác thực", "Mật khẩu"];
const stepOrder: Step[] = ["email", "otp", "password", "done"];

const ForgetPasswordPage = () => {
  const navigate = useNavigate();

  const [step, setStep]             = useState<Step>("email");
  const [email, setEmail]           = useState("");
  const [resetToken, setResetToken] = useState("");
  const [digits, setDigits]         = useState<string[]>(Array(6).fill(""));
  const [newPass, setNewPass]       = useState({ password: "", confirm: "" });
  const [showPass, setShowPass]     = useState({ password: false, confirm: false });
  const [loading, setLoading]       = useState(false);
  const [countdown, setCountdown]   = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── countdown timer ────────────────────────────────────────────────────────
  const startCountdown = useCallback((seconds: number) => {
    setCountdown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Step 1: Gửi OTP ────────────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      setLoading(true);
      await authService.forgotPassword(email.trim().toLowerCase());
      setStep("otp");
      startCountdown(RESEND_SECONDS);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      toast.success("Đã gửi mã OTP đến email của bạn");
    } catch (err) {
      toast.error(getErrMsg(err, "Gửi OTP thất bại"));
    } finally {
      setLoading(false);
    }
  };

  // ── OTP digit input handlers ───────────────────────────────────────────────
  const handleDigitInput = (i: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) setTimeout(() => inputRefs.current[i + 1]?.focus(), 0);
  };

  const handleDigitKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits]; next[i] = ""; setDigits(next);
      } else if (i > 0) {
        const next = [...digits]; next[i - 1] = ""; setDigits(next);
        setTimeout(() => inputRefs.current[i - 1]?.focus(), 0);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("");
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
    setDigits(next);
    setTimeout(() => inputRefs.current[Math.min(pasted.length, 5)]?.focus(), 0);
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < 6) { toast.error("Vui lòng nhập đủ 6 chữ số"); return; }
    try {
      setLoading(true);
      const { resetToken: token } = await authService.verifyOTP(email.trim().toLowerCase(), otp);
      setResetToken(token);
      setStep("password");
    } catch (err) {
      toast.error(getErrMsg(err, "Mã OTP không đúng"));
      setDigits(Array(6).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    try {
      setLoading(true);
      await authService.forgotPassword(email.trim().toLowerCase());
      setDigits(Array(6).fill(""));
      startCountdown(RESEND_SECONDS);
      toast.success("Đã gửi lại mã OTP");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(getErrMsg(err, "Gửi lại thất bại"));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset password ────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.password.length < 6) { toast.error("Mật khẩu phải có ít nhất 6 ký tự"); return; }
    if (newPass.password !== newPass.confirm) { toast.error("Mật khẩu xác nhận không khớp"); return; }
    try {
      setLoading(true);
      await authService.resetPassword(resetToken, newPass.password);
      setStep("done");
    } catch (err) {
      toast.error(getErrMsg(err, "Đặt lại mật khẩu thất bại"));
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const currentStepIdx = stepOrder.indexOf(step);
  const isStepDone = (i: number) => currentStepIdx > i;
  const isStepActive = (i: number) => currentStepIdx === i;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">

          {/* ── Header bar ─────────────────────────────────────────────────── */}
          <div className="bg-primary px-6 py-4">
            <p className="text-sm font-semibold text-primary-foreground">E-Learning</p>
            <h2 className="text-lg font-bold mt-0.5">Quên mật khẩu</h2>
          </div>

          <div className="p-6">
            {/* ── Step indicator (chỉ khi chưa done) ─────────────────────── */}
            {step !== "done" && (
              <div className="flex items-center mb-8">
                {stepLabels.map((label, i) => (
                  <div key={i} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors
                        ${isStepActive(i) ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                          isStepDone(i)   ? "bg-primary/20 text-primary" :
                                            "bg-muted text-muted-foreground"}`}>
                        {isStepDone(i) ? "✓" : i + 1}
                      </div>
                      <span className={`text-[10px] font-medium whitespace-nowrap
                        ${isStepActive(i) ? "text-primary" :
                          isStepDone(i)   ? "text-primary/70" :
                                            "text-muted-foreground"}`}>
                        {label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div className={`h-px flex-1 mx-1 mb-4 transition-colors
                        ${isStepDone(i) ? "bg-primary/40" : "bg-border"}`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ══════════════ STEP 1: Email ══════════════ */}
            {step === "email" && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <Mail className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Nhập địa chỉ email</p>
                    <p className="text-xs text-muted-foreground">Chúng tôi sẽ gửi mã OTP xác thực đến email của bạn</p>
                  </div>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fp-email">Email đăng ký</Label>
                    <Input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      autoFocus
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Đang gửi..." : "Gửi mã OTP"}
                  </Button>
                  <div className="text-center pt-1">
                    <Link to="/signin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowLeft className="size-3.5" /> Quay lại đăng nhập
                    </Link>
                  </div>
                </form>
              </>
            )}

            {/* ══════════════ STEP 2: OTP ══════════════ */}
            {step === "otp" && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <ShieldCheck className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Nhập mã xác thực</p>
                    <p className="text-xs text-muted-foreground">
                      Đã gửi mã 6 chữ số đến{" "}
                      <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </div>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  {/* 6 digit boxes */}
                  <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => handleDigitInput(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(i, e)}
                        className={`h-12 w-10 rounded-lg border-2 text-center text-xl font-bold outline-none transition-all select-none
                          focus:ring-2 focus:ring-primary/30
                          ${d
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-input bg-background text-foreground focus:border-primary"
                          }`}
                      />
                    ))}
                  </div>

                  {/* Info + countdown */}
                  <div className="text-center space-y-1.5">
                    <p className="text-xs text-muted-foreground">
                      Mã có hiệu lực trong <span className="font-semibold text-foreground">5 phút</span>,
                      tối đa <span className="font-semibold text-foreground">5 lần</span> nhập sai
                    </p>
                    {countdown > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Gửi lại sau{" "}
                        <span className="font-mono font-semibold text-foreground tabular-nums">
                          {formatTime(countdown)}
                        </span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading}
                        className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
                      >
                        {loading ? "Đang gửi..." : "Gửi lại mã OTP"}
                      </button>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || digits.join("").length < 6}
                  >
                    {loading ? "Đang xác thực..." : "Xác nhận"}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => { setStep("email"); setDigits(Array(6).fill("")); }}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="size-3.5" /> Đổi email
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ══════════════ STEP 3: New password ══════════════ */}
            {step === "password" && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <KeyRound className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Tạo mật khẩu mới</p>
                    <p className="text-xs text-muted-foreground">Mật khẩu mới phải có ít nhất 6 ký tự</p>
                  </div>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fp-pass">Mật khẩu mới</Label>
                    <div className="relative">
                      <Input
                        id="fp-pass"
                        type={showPass.password ? "text" : "password"}
                        value={newPass.password}
                        onChange={(e) => setNewPass((p) => ({ ...p, password: e.target.value }))}
                        placeholder="Ít nhất 6 ký tự"
                        className="pr-10"
                        autoFocus
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPass((p) => ({ ...p, password: !p.password }))}
                        tabIndex={-1}
                      >
                        {showPass.password ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fp-confirm">Xác nhận mật khẩu</Label>
                    <div className="relative">
                      <Input
                        id="fp-confirm"
                        type={showPass.confirm ? "text" : "password"}
                        value={newPass.confirm}
                        onChange={(e) => setNewPass((p) => ({ ...p, confirm: e.target.value }))}
                        placeholder="Nhập lại mật khẩu mới"
                        className={`pr-10 ${
                          newPass.confirm && newPass.confirm !== newPass.password
                            ? "border-destructive focus-visible:border-destructive"
                            : ""
                        }`}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPass((p) => ({ ...p, confirm: !p.confirm }))}
                        tabIndex={-1}
                      >
                        {showPass.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {newPass.confirm && newPass.confirm !== newPass.password && (
                      <p className="text-xs text-destructive">Mật khẩu xác nhận không khớp</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                  </Button>
                </form>
              </>
            )}

            {/* ══════════════ DONE ══════════════ */}
            {step === "done" && (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 className="size-16 text-green-500 mb-4" />
                <h2 className="text-lg font-semibold text-foreground">Đặt lại thành công!</h2>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                  Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại.
                </p>
                <Button className="w-full" onClick={() => navigate("/signin")}>
                  Đăng nhập ngay
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgetPasswordPage;
