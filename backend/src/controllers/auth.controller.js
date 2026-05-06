const authService = require('../services/auth.service');
const { REFRESH_COOKIE_NAME, getRefreshCookieOptions } = require('../utils/authCookie');

const sendAuthError = (res, error, fallbackStatus = 400) => {
    const status = error.status || fallbackStatus;
    const code = error.code || 'AUTH_ERROR';

    return res.status(status).json({
        message: error.message,
        code,
    });
};

const login = async(req, res) => {
    const {email, password} = req.body;

    try {
        const result = await authService.login(email, password);
        const { refreshToken, ...payload } = result;

        res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
        
        res.status(200).json({
            message: 'Success',
            data: payload
        });
    }
    catch(error) {
        return sendAuthError(res, error);
    }
}

const logout = async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    try {
        if (refreshToken) {
            await authService.logout(refreshToken);
        }

        res.clearCookie(REFRESH_COOKIE_NAME, {
            ...getRefreshCookieOptions(),
            maxAge: undefined,
            expires: new Date(0),
        });

        res.status(200).json({message: "Success"});
    }
    catch (error) {
        return sendAuthError(res, error);
    }
}

const refreshToken = async (req, res) => {
    const oldRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!oldRefreshToken) {
        return res.status(401).json({
            message: 'Refresh token not found',
            code: 'AUTH_REFRESH_TOKEN_NOT_FOUND',
        });
    }

    try {
        const result = await authService.refreshToken(oldRefreshToken);
        const { newRefreshToken, ...payload } = result;

        res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshCookieOptions());

        res.status(200).json({message: "success", data: payload});
    }
    catch (error) {
        return sendAuthError(res, error);
    }
}

// ─── Forgot password (gửi OTP) ────────────────────────────────────────────────
const otpService = require('../services/otp.service');

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email là bắt buộc' });

    try {
        await otpService.sendOTP(email.trim().toLowerCase());
        res.status(200).json({ message: 'Mã OTP đã được gửi đến email của bạn' });
    } catch (error) {
        const status = error.ttl ? 429 : 400;
        res.status(status).json({ message: error.message, ttl: error.ttl });
    }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email và OTP là bắt buộc' });

    try {
        const result = await otpService.verifyOTP(email.trim().toLowerCase(), String(otp));
        res.status(200).json({ message: 'Xác thực thành công', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message, remaining: error.remaining });
    }
};

// ─── Reset password ───────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return res.status(400).json({ message: 'Thiếu thông tin' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });

    try {
        await otpService.resetPassword(resetToken, newPassword);
        res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { login, logout, refreshToken, forgotPassword, verifyOTP, resetPassword };