import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

let transporter = null;

const initTransporter = () => {
  if (transporter) return transporter;

  const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = process.env;

  if (!MAIL_USER || !MAIL_PASS || MAIL_USER === "your_email@gmail.com") {
    console.warn("⚠️ Nodemailer chưa được cấu hình đầy đủ trong .env. Email sẽ chỉ được log ra console.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: MAIL_HOST || "smtp.gmail.com",
    port: parseInt(MAIL_PORT || "587", 10),
    secure: parseInt(MAIL_PORT || "587", 10) === 465, // true for 465, false for other ports
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailClient = initTransporter();
    const mailFrom = process.env.MAIL_FROM || `"Trera" <no-reply@trera.local>`;

    if (!mailClient) {
      console.log(`📧 [MOCK EMAIL SENT] To: ${to} | Subject: "${subject}"`);
      return { mock: true };
    }

    const info = await mailClient.sendMail({
      from: mailFrom,
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ Email đã gửi tới ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Lỗi khi gửi email tới ${to}:`, error.message);
    // Không ném lỗi ra ngoài để tránh làm fail request chính
    return null;
  }
};

/**
 * Gửi email chào mừng khi người dùng đăng ký tài khoản thành công
 */
export const sendWelcomeEmail = async (user) => {
  const subject = "🎉 Chào mừng bạn đến với Trera!";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; rounded: 8px;">
      <h2 style="color: #2563eb; margin-top: 0;">Xin chào ${user.name},</h2>
      <p>Cảm ơn bạn đã tham gia <strong>Trera</strong> - công cụ quản lý dự án & Issue Tracker!</p>
      <p>Tài khoản của bạn đã sẵn sàng để tạo dự án, quản lý công việc và cộng tác cùng nhóm.</p>
      <div style="margin: 30px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" 
           style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Khám phá Trera ngay
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #e1e4e8; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280;">Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject,
    html,
    text: `Xin chào ${user.name},\nCảm ơn bạn đã tham gia Trera!`,
  });
};
