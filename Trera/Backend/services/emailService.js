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

/**
 * Gửi email khi người dùng được mời vào một dự án
 */
export const sendProjectInviteEmail = async ({ invitedUser, project, inviterName, role }) => {
  const subject = `📌 Bạn đã được mời tham gia dự án "${project.name}" trên Trera`;
  const roleText = role === "ADMIN" ? "Quản trị viên (Admin)" : "Thành viên (Member)";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-top: 0;">Lời mời tham gia dự án</h2>
      <p>Xin chào <strong>${invitedUser.name}</strong>,</p>
      <p><strong>${inviterName}</strong> vừa thêm bạn vào dự án <strong>${project.name}</strong> (${project.key}) với vai trò: <strong>${roleText}</strong>.</p>
      ${project.description ? `<p style="background: #f8fafc; padding: 10px; border-left: 4px solid #2563eb; font-style: italic;">"${project.description}"</p>` : ""}
      <div style="margin: 25px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/projects/${project.id}" 
           style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Truy cập dự án ngay
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #e1e4e8; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280;">Bạn nhận được email này vì tài khoản ${invitedUser.email} được gán vào dự án trên Trera.</p>
    </div>
  `;

  return sendEmail({
    to: invitedUser.email,
    subject,
    html,
    text: `Xin chào ${invitedUser.name},\nBạn đã được thêm vào dự án ${project.name} (${project.key}) với vai trò ${roleText}.`,
  });
};

/**
 * Gửi email khi người dùng được phân công (assign) vào một Issue
 */
export const sendIssueAssignedEmail = async ({ user, issue, project, assignerName }) => {
  const subject = `🎯 [${project.key}] Bạn vừa được giao việc: "${issue.title}"`;
  const priorityLabels = {
    LOW: "Thấp",
    MEDIUM: "Trung bình",
    HIGH: "Cao",
    URGENT: "Khẩn cấp 🚨",
  };
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-top: 0;">Bạn vừa được giao một công việc mới</h2>
      <p>Xin chào <strong>${user.name}</strong>,</p>
      <p><strong>${assignerName}</strong> vừa phân công công việc cho bạn trong dự án <strong>${project.name}</strong>:</p>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 15px 0;">
        <h3 style="margin: 0 0 10px 0; color: #1e293b;">${issue.title}</h3>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Độ ưu tiên:</strong> ${priorityLabels[issue.priority] || issue.priority}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Loại công việc:</strong> ${issue.type}</p>
        ${issue.dueDate ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Hạn chót:</strong> ${new Date(issue.dueDate).toLocaleDateString("vi-VN")}</p>` : ""}
        ${issue.description ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #475569;">${issue.description}</p>` : ""}
      </div>

      <div style="margin: 25px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/projects/${project.id}/issues/${issue.id}" 
           style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Xem chi tiết công việc
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #e1e4e8; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280;">Email thông báo tự động từ hệ thống Trera.</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject,
    html,
    text: `Xin chào ${user.name},\n${assignerName} vừa giao việc "${issue.title}" cho bạn trong dự án ${project.name}.`,
  });
};

/**
 * Gửi email khi trạng thái Issue thay đổi
 */
export const sendStatusChangedEmail = async ({ users, issue, project, fromStatus, toStatus, updaterName }) => {
  const statusLabels = {
    TODO: "Cần làm (To Do)",
    IN_PROGRESS: "Đang thực hiện (In Progress)",
    IN_REVIEW: "Đang xem xét (In Review)",
    DONE: "Đã hoàn thành (Done) ✅",
  };

  const subject = `🔄 [${project.key}] Trạng thái cập nhật: "${issue.title}" [${statusLabels[toStatus] || toStatus}]`;

  for (const user of users) {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-top: 0;">Trạng thái công việc đã thay đổi</h2>
        <p>Xin chào <strong>${user.name}</strong>,</p>
        <p><strong>${updaterName}</strong> vừa chuyển trạng thái công việc <strong>"${issue.title}"</strong>:</p>
        
        <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin: 15px 0; display: inline-block; font-weight: bold;">
          <span style="color: #64748b;">${statusLabels[fromStatus] || fromStatus}</span>
          <span style="margin: 0 10px;">➔</span>
          <span style="color: #16a34a;">${statusLabels[toStatus] || toStatus}</span>
        </div>

        <div style="margin: 25px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/projects/${project.id}/issues/${issue.id}" 
             style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Xem chi tiết
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e1e4e8; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280;">Email thông báo tự động từ hệ thống Trera.</p>
      </div>
    `;

    sendEmail({
      to: user.email,
      subject,
      html,
      text: `Công việc "${issue.title}" đã được đổi trạng thái sang "${statusLabels[toStatus] || toStatus}".`,
    }).catch((err) => console.error("Lỗi gửi mail đổi status:", err.message));
  }
};

/**
 * Gửi email khi có bình luận mới trên Issue
 */
export const sendCommentNotificationEmail = async ({ users, comment, issue, project, commenterName }) => {
  const subject = `💬 [${project.key}] Bình luận mới trên: "${issue.title}"`;

  for (const user of users) {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-top: 0;">Có bình luận mới</h2>
        <p>Xin chào <strong>${user.name}</strong>,</p>
        <p><strong>${commenterName}</strong> vừa để lại bình luận trên công việc <strong>"${issue.title}"</strong>:</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #8b5cf6; margin: 15px 0;">
          <p style="margin: 0; font-size: 14px; white-space: pre-wrap; color: #1e293b;">${comment.content}</p>
        </div>

        <div style="margin: 25px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/projects/${project.id}/issues/${issue.id}" 
             style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Xem và phản hồi
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e1e4e8; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280;">Email thông báo tự động từ hệ thống Trera.</p>
      </div>
    `;

    sendEmail({
      to: user.email,
      subject,
      html,
      text: `${commenterName} vừa bình luận trên "${issue.title}":\n"${comment.content}"`,
    }).catch((err) => console.error("Lỗi gửi mail comment:", err.message));
  }
};



/**
 * Gửi email mời xác nhận tham gia dự án (có nút Chấp nhận / Từ chối)
 */
export const sendInvitationRequestEmail = async ({
  invitedUser,
  project,
  inviterName,
  token,
  role,
  frontendUrl,
}) => {
  const roleText = role === "ADMIN" ? "Quản trị viên (Admin)" : "Thành viên (Member)";
  const acceptUrl = `${frontendUrl}/invitations/${token}?action=accept`;
  const declineUrl = `${frontendUrl}/invitations/${token}?action=decline`;

  const subject = `📬 Lời mời tham gia dự án "${project.name}" trên Trera`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-top: 0;">Bạn nhận được lời mời tham gia dự án</h2>
      <p>Xin chào <strong>${invitedUser.name}</strong>,</p>
      <p><strong>${inviterName}</strong> đã mời bạn tham gia dự án <strong>${project.name}</strong> (${project.key}) với vai trò: <strong>${roleText}</strong>.</p>
      ${project.description ? `<p style="background: #f8fafc; padding: 10px; border-left: 4px solid #2563eb; font-style: italic;">"${project.description}"</p>` : ""}
      <p style="color: #64748b; font-size: 14px;">⏳ Lời mời này sẽ hết hạn sau <strong>7 ngày</strong>. Vui lòng phản hồi sớm.</p>
      <div style="margin: 30px 0; display: flex; gap: 12px;">
        <a href="${acceptUrl}"
           style="background-color: #16a34a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 12px;">
          ✅ Chấp nhận lời mời
        </a>
        <a href="${declineUrl}"
           style="background-color: #dc2626; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          ❌ Từ chối
        </a>
      </div>
      <p style="font-size: 13px; color: #64748b;">Hoặc truy cập trang phản hồi: <a href="${frontendUrl}/invitations/${token}">${frontendUrl}/invitations/${token}</a></p>
      <hr style="border: none; border-top: 1px solid #e1e4e8; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280;">Nếu bạn không nhận ra yêu cầu này, hãy bỏ qua email này.</p>
    </div>
  `;

  return sendEmail({
    to: invitedUser.email,
    subject,
    html,
    text: `Xin chào ${invitedUser.name},\n${inviterName} mời bạn vào dự án ${project.name} với vai trò ${roleText}.\nChấp nhận: ${acceptUrl}\nTừ chối: ${declineUrl}`,
  });
};

/**
 * Gửi email kết quả lời mời tham gia dự án (tới cả owner và người được mời)
 */
export const sendInvitationResultEmail = async ({
  owner,
  invitedUser,
  project,
  accepted,
}) => {
  const resultText = accepted ? "chấp nhận ✅" : "từ chối ❌";
  const resultColor = accepted ? "#16a34a" : "#dc2626";

  // Email gửi cho owner
  const ownerSubject = `📌 ${invitedUser.name} đã ${resultText} lời mời vào dự án "${project.name}"`;
  const ownerHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-top: 0;">Cập nhật lời mời dự án</h2>
      <p>Xin chào <strong>${owner.name}</strong>,</p>
      <p>Thành viên <strong>${invitedUser.name}</strong> (${invitedUser.email}) đã <strong style="color: ${resultColor};">${resultText}</strong> lời mời tham gia dự án <strong>${project.name}</strong>.</p>
      ${accepted
        ? `<p style="color: #16a34a;">🎉 Họ đã được thêm vào dự án và có thể bắt đầu cộng tác ngay!</p>
           <div style="margin: 25px 0;">
             <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/projects/${project.id}/members"
                style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
               Xem danh sách thành viên
             </a>
           </div>`
        : `<p style="color: #64748b;">Bạn có thể gửi lại lời mời bất cứ lúc nào từ trang quản lý thành viên.</p>`
      }
      <hr style="border: none; border-top: 1px solid #e1e4e8; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280;">Email thông báo tự động từ hệ thống Trera.</p>
    </div>
  `;

  // Email gửi cho người được mời
  const inviteeSubject = accepted
    ? `🎉 Bạn đã tham gia dự án "${project.name}" thành công!`
    : `❌ Bạn đã từ chối lời mời vào dự án "${project.name}"`;
  const inviteeHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px;">
      <h2 style="color: ${resultColor}; margin-top: 0;">${accepted ? "Chào mừng bạn đến với dự án!" : "Đã từ chối lời mời"}</h2>
      <p>Xin chào <strong>${invitedUser.name}</strong>,</p>
      ${accepted
        ? `<p>Bạn đã <strong style="color: #16a34a;">chấp nhận</strong> lời mời tham gia dự án <strong>${project.name}</strong>. Hãy đăng nhập để bắt đầu cộng tác!</p>
           <div style="margin: 25px 0;">
             <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/projects/${project.id}"
                style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
               Vào dự án ngay
             </a>
           </div>`
        : `<p>Bạn đã <strong style="color: #dc2626;">từ chối</strong> lời mời tham gia dự án <strong>${project.name}</strong>. Lời mời đã được đóng lại.</p>
           <p style="color: #64748b;">Nếu bạn muốn tham gia sau, hãy liên hệ người quản lý dự án.</p>`
      }
      <hr style="border: none; border-top: 1px solid #e1e4e8; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280;">Email thông báo tự động từ hệ thống Trera.</p>
    </div>
  `;

  // Gửi đồng thời cho cả hai
  await Promise.allSettled([
    sendEmail({ to: owner.email, subject: ownerSubject, html: ownerHtml, text: ownerSubject }),
    sendEmail({ to: invitedUser.email, subject: inviteeSubject, html: inviteeHtml, text: inviteeSubject }),
  ]);
};

