const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Gửi email chứa mã OTP đặt lại mật khẩu
 * @param {string} to - Email người nhận
 * @param {string} otp - Mã OTP 6 chữ số
 */
const sendOTPEmail = async (to, otp) => {
    const from = `"E-Learning" <${process.env.SMTP_USER}>`;

    await transporter.sendMail({
        from,
        to,
        subject: '[E-Learning] Mã OTP đặt lại mật khẩu',
        html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <div style="background: #2563eb; border-radius: 8px 8px 0 0; padding: 20px 24px;">
                <h2 style="color: #fff; margin: 0; font-size: 20px;">E-Learning</h2>
            </div>
            <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; padding: 24px;">
                <p style="margin-top: 0; color: #374151; font-size: 15px;">Bạn đã yêu cầu đặt lại mật khẩu. Sử dụng mã OTP bên dưới:</p>
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
                    <span style=" white-space: nowrap; font-size: 32px; font-weight: 700; letter-spacing: 12px; color: #1d4ed8; font-family: monospace;">
                        ${otp}
                    </span>
                </div>
                <ul style="color: #6b7280; font-size: 13px; padding-left: 20px; margin: 0;">
                    <li>Mã có hiệu lực trong <strong>5 phút</strong></li>
                    <li>Giới hạn <strong>5 lần nhập</strong> sai</li>
                    <li>Không chia sẻ mã này với bất kỳ ai</li>
                </ul>
                <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0; margin-top: 20px;">
                    Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
                </p>
            </div>
        </div>
        `,
    });
};

module.exports = { sendOTPEmail, transporter };
