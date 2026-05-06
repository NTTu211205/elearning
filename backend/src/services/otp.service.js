const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/MySQLConnect');
const redis = require('../config/RedisConnect');
const { sendOTPEmail } = require('../utils/mailer');

const OTP_TTL      = 300;   // 5 phút - thời gian sống của OTP
const COOLDOWN_TTL = 120;   // 2 phút - thời gian chờ gửi lại
const RESET_TTL    = 600;   // 10 phút - thời gian sống của reset token
const MAX_ATTEMPTS = 5;     // số lần nhập sai tối đa

const otpKey      = (email) => `otp:${email}`;
const cooldownKey = (email) => `otp:cooldown:${email}`;
const resetKey    = (token) => `otp:reset:${token}`;

// ─── Tạo 6 chữ số ngẫu nhiên ─────────────────────────────────────────────────
const generateOTP = () =>
    String(Math.floor(100000 + Math.random() * 900000));

// ─── Gửi OTP qua email ────────────────────────────────────────────────────────
const sendOTP = async (email) => {
    // Kiểm tra cooldown (chặn spam)
    const ttlCooldown = await redis.ttl(cooldownKey(email));
    if (ttlCooldown > 0) {
        const err = new Error(`Vui lòng chờ ${ttlCooldown} giây trước khi gửi lại`);
        err.ttl = ttlCooldown;
        throw err;
    }

    // Kiểm tra email tồn tại
    const [users] = await db.execute(
        'SELECT id FROM user WHERE email = ? AND status = 1', [email]
    );
    if (users.length === 0) {
        throw new Error('Email không tồn tại trong hệ thống');
    }

    // Sinh OTP, hash và lưu Redis
    const otp  = generateOTP();
    const hash = await bcrypt.hash(otp, 10);

    await redis.set(otpKey(email),      JSON.stringify({ hash, attempts: 0 }), 'EX', OTP_TTL);
    await redis.set(cooldownKey(email), '1',                                    'EX', COOLDOWN_TTL);

    await sendOTPEmail(email, otp);
    return true;
};

// ─── Xác thực OTP ─────────────────────────────────────────────────────────────
const verifyOTP = async (email, otp) => {
    const raw = await redis.get(otpKey(email));
    if (!raw) {
        throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới');
    }

    const data = JSON.parse(raw);

    // Đã vượt quá số lần cho phép
    if (data.attempts >= MAX_ATTEMPTS) {
        await redis.del(otpKey(email));
        throw new Error('Đã vượt quá số lần thử. Vui lòng yêu cầu mã mới');
    }

    // Tăng số lần thử, cập nhật lại Redis (giữ nguyên TTL)
    data.attempts += 1;
    const remainingTTL = await redis.ttl(otpKey(email));
    await redis.set(otpKey(email), JSON.stringify(data), 'EX', Math.max(remainingTTL, 1));

    // So sánh OTP
    const isMatch = await bcrypt.compare(otp, data.hash);
    if (!isMatch) {
        const remaining = MAX_ATTEMPTS - data.attempts;
        if (remaining <= 0) {
            await redis.del(otpKey(email));
            const err = new Error('Mã OTP không đúng. Đã hết số lần thử, vui lòng yêu cầu mã mới');
            err.remaining = 0;
            throw err;
        }
        const err = new Error(`Mã OTP không đúng. Còn ${remaining} lần thử`);
        err.remaining = remaining;
        throw err;
    }

    // OTP hợp lệ → cấp reset token
    const token = crypto.randomBytes(32).toString('hex');
    await redis.set(resetKey(token), email, 'EX', RESET_TTL);
    await redis.del(otpKey(email));

    return { resetToken: token };
};

// ─── Đặt lại mật khẩu ────────────────────────────────────────────────────────
const resetPassword = async (token, newPassword) => {
    const email = await redis.get(resetKey(token));
    if (!email) {
        throw new Error('Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thực hiện lại');
    }

    const hash = await bcrypt.hash(newPassword, 10);
    const [result] = await db.execute(
        'UPDATE user SET password = ? WHERE email = ? AND status = 1', [hash, email]
    );
    if (result.affectedRows === 0) {
        throw new Error('Cập nhật mật khẩu thất bại');
    }

    await redis.del(resetKey(token));
    return true;
};

module.exports = { sendOTP, verifyOTP, resetPassword };
