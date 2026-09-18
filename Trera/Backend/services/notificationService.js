import { prisma } from "../config/prisma.js";
import {
  sendIssueAssignedEmail,
  sendStatusChangedEmail,
  sendCommentNotificationEmail,
  sendEmail,
} from "./emailService.js";
import { emitToUser } from "../config/socket.js";

/**
 * Helper: Lấy danh sách Quản trị viên của dự án (Owner + ProjectMember có role ADMIN)
 */
export const getProjectAdmins = async (projectId) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          where: { role: "ADMIN" },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!project) return [];

    const adminMap = new Map();
    if (project.owner) {
      adminMap.set(project.owner.id, project.owner);
    }
    if (project.members && project.members.length > 0) {
      project.members.forEach((m) => {
        if (m.user) {
          adminMap.set(m.user.id, m.user);
        }
      });
    }

    return Array.from(adminMap.values());
  } catch (error) {
    console.error("Lỗi getProjectAdmins:", error.message);
    return [];
  }
};

/**
 * Thông báo khi giao việc (assign)
 * - In-App cho từng Assignee
 * - Email cho từng Assignee
 * - Email cho Quản trị viên dự án (Admin)
 */
export const notifyAssignment = async ({
  actorId,
  actorName,
  assigneeIds,
  issue,
  project,
}) => {
  try {
    if (!assigneeIds || assigneeIds.length === 0) return;

    const validAssigneeIds = assigneeIds.filter((id) => id !== actorId);
    if (validAssigneeIds.length === 0) return;

    // 1. In-App Notifications cho các Assignees
    const notifsData = validAssigneeIds.map((userId) => ({
      userId,
      actorId,
      type: "ISSUE_ASSIGNED",
      title: "🎯 Bạn vừa được giao việc mới",
      message: `${actorName || "Một thành viên"} đã giao việc "${issue.title}" cho bạn trong dự án ${project.name}.`,
      link: `/projects/${project.id}`,
    }));

    await prisma.notification.createMany({ data: notifsData });

    notifsData.forEach((n) => {
      emitToUser(n.userId, "notification:new", {
        ...n,
        id: "temp-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        actor: { id: actorId, name: actorName },
        createdAt: new Date().toISOString(),
        isRead: false,
      });
    });

    // 2. Lấy thông tin user các assignees để gửi mail
    const assignees = await prisma.user.findMany({
      where: { id: { in: validAssigneeIds } },
      select: { id: true, name: true, email: true },
    });

    // Gửi email cho từng người được giao việc
    for (const assignee of assignees) {
      sendIssueAssignedEmail({
        user: assignee,
        issue,
        project,
        assignerName: actorName,
      }).catch((err) => console.error("Lỗi gửi mail assign:", err.message));
    }

    // 3. Gửi email thông báo cho các Quản trị viên (Admin) của dự án
    const admins = await getProjectAdmins(project.id);
    const assignedUserNames = assignees.map((u) => u.name).join(", ");

    for (const admin of admins) {
      // Tránh gửi nếu admin chính là người giao hoặc là người vừa được gán
      if (admin.id !== actorId && !validAssigneeIds.includes(admin.id)) {
        sendEmail({
          to: admin.email,
          subject: `📋 [${project.key}] Admin: Giao việc thành công - "${issue.title}"`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px;">
              <h2 style="color: #4f46e5; margin-top: 0;">Thông báo Quản trị viên</h2>
              <p>Xin chào <strong>${admin.name}</strong>,</p>
              <p><strong>${actorName}</strong> vừa phân công công việc trong dự án <strong>${project.name}</strong>:</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #4f46e5; margin: 15px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1e293b;">${issue.title}</h3>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Người được giao:</strong> ${assignedUserNames || "Chưa xác định"}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Trạng thái:</strong> ${issue.status}</p>
              </div>
              <div style="margin: 25px 0;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/projects/${project.id}" 
                   style="background-color: #4f46e5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Xem dự án
                </a>
              </div>
              <p style="font-size: 12px; color: #6b7280;">Bạn nhận được email này vì bạn là Quản trị viên của dự án ${project.name}.</p>
            </div>
          `,
          text: `Admin: ${actorName} đã giao việc "${issue.title}" cho ${assignedUserNames} trong dự án ${project.name}.`,
        }).catch((err) => console.error("Lỗi gửi mail admin assign:", err.message));
      }
    }
  } catch (error) {
    console.error("Lỗi notifyAssignment:", error.message);
  }
};

/**
 * Thông báo khi trạng thái Issue thay đổi
 * - In-App cho Reporter + Assignees
 * - Email cho Assignees + Reporter + Admins
 */
export const notifyStatusChange = async ({
  actorId,
  actorName,
  issue,
  oldStatus,
  newStatus,
  project,
}) => {
  try {
    const statusLabels = {
      TODO: "Cần làm",
      IN_PROGRESS: "Đang làm",
      IN_REVIEW: "Đang review",
      DONE: "Hoàn thành ✅",
    };

    // 1. Gom danh sách người nhận In-App: Reporter + Assignees (loại trừ actor)
    const inAppRecipients = new Set();
    if (issue.reporterId && issue.reporterId !== actorId) {
      inAppRecipients.add(issue.reporterId);
    }
    if (issue.assignees && issue.assignees.length > 0) {
      issue.assignees.forEach((a) => {
        const uid = a.userId || a.user?.id;
        if (uid && uid !== actorId) inAppRecipients.add(uid);
      });
    }

    if (inAppRecipients.size > 0) {
      const notifsData = Array.from(inAppRecipients).map((userId) => ({
        userId,
        actorId,
        type: "ISSUE_STATUS_CHANGED",
        title: "🔄 Trạng thái công việc thay đổi",
        message: `${actorName || "Một thành viên"} đã chuyển "${issue.title}" từ [${statusLabels[oldStatus] || oldStatus}] sang [${statusLabels[newStatus] || newStatus}].`,
        link: `/projects/${project.id}`,
      }));

      await prisma.notification.createMany({ data: notifsData });

      notifsData.forEach((n) => {
        emitToUser(n.userId, "notification:new", {
          ...n,
          id: "temp-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
          actor: { id: actorId, name: actorName },
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      });
    }

    // 2. Gom danh sách người nhận Email: Assignees + Reporter + Admins
    const emailRecipientsMap = new Map();

    if (issue.reporter && issue.reporter.id !== actorId) {
      emailRecipientsMap.set(issue.reporter.id, issue.reporter);
    }
    if (issue.assignees && issue.assignees.length > 0) {
      issue.assignees.forEach((a) => {
        const u = a.user;
        if (u && u.id !== actorId) emailRecipientsMap.set(u.id, u);
      });
    }

    const admins = await getProjectAdmins(project.id);
    admins.forEach((admin) => {
      if (admin.id !== actorId) {
        emailRecipientsMap.set(admin.id, admin);
      }
    });

    const targetUsers = Array.from(emailRecipientsMap.values());
    if (targetUsers.length > 0) {
      sendStatusChangedEmail({
        users: targetUsers,
        issue,
        project,
        fromStatus: oldStatus,
        toStatus: newStatus,
        updaterName: actorName,
      });
    }
  } catch (error) {
    console.error("Lỗi notifyStatusChange:", error.message);
  }
};

/**
 * Thông báo khi có bình luận mới
 * - In-App cho Reporter + Assignees
 * - Email cho Assignees + Reporter + Admins
 */
export const notifyComment = async ({
  actorId,
  actorName,
  comment,
  issue,
  project,
}) => {
  try {
    // 1. In-App Notifications cho Reporter + Assignees (loại trừ commenter)
    const inAppRecipients = new Set();
    if (issue.reporterId && issue.reporterId !== actorId) {
      inAppRecipients.add(issue.reporterId);
    }
    if (issue.assignees && issue.assignees.length > 0) {
      issue.assignees.forEach((a) => {
        const uid = a.userId || a.user?.id;
        if (uid && uid !== actorId) inAppRecipients.add(uid);
      });
    }

    const snippet = comment.content.length > 60 ? comment.content.slice(0, 60) + "..." : comment.content;

    if (inAppRecipients.size > 0) {
      const notifsData = Array.from(inAppRecipients).map((userId) => ({
        userId,
        actorId,
        type: "COMMENT_ADDED",
        title: "💬 Bình luận mới trên công việc",
        message: `${actorName || "Một thành viên"} đã bình luận trên "${issue.title}": "${snippet}"`,
        link: `/projects/${project.id}`,
      }));

      await prisma.notification.createMany({ data: notifsData });

      notifsData.forEach((n) => {
        emitToUser(n.userId, "notification:new", {
          ...n,
          id: "temp-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
          actor: { id: actorId, name: actorName },
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      });
    }

    // 2. Email cho Assignees + Reporter + Admins
    const emailRecipientsMap = new Map();

    if (issue.reporter && issue.reporter.id !== actorId) {
      emailRecipientsMap.set(issue.reporter.id, issue.reporter);
    }
    if (issue.assignees && issue.assignees.length > 0) {
      issue.assignees.forEach((a) => {
        const u = a.user;
        if (u && u.id !== actorId) emailRecipientsMap.set(u.id, u);
      });
    }

    const admins = await getProjectAdmins(project.id);
    admins.forEach((admin) => {
      if (admin.id !== actorId) {
        emailRecipientsMap.set(admin.id, admin);
      }
    });

    const targetUsers = Array.from(emailRecipientsMap.values());
    if (targetUsers.length > 0) {
      sendCommentNotificationEmail({
        users: targetUsers,
        comment,
        issue,
        project,
        commenterName: actorName,
      }).catch((err) => console.error("Lỗi gửi mail comment:", err.message));
    }
  } catch (error) {
    console.error("Lỗi notifyComment:", error.message);
  }
};

/**
 * Thông báo khi bắt đầu Sprint mới
 * - In-App cho toàn bộ thành viên dự án
 */
export const notifySprintStarted = async ({
  actorId,
  actorName,
  sprint,
  project,
  memberIds = [],
}) => {
  try {
    const validMemberIds = memberIds.filter((id) => id !== actorId);
    if (validMemberIds.length === 0) return;

    const notifsData = validMemberIds.map((userId) => ({
      userId,
      actorId,
      type: "SPRINT_STARTED",
      title: "🚀 Sprint mới đã bắt đầu!",
      message: `${actorName || "Quản trị viên"} đã bắt đầu Sprint "${sprint.name}" trong dự án ${project.name}.`,
      link: `/projects/${project.id}/sprints`,
    }));

    await prisma.notification.createMany({ data: notifsData });

    notifsData.forEach((n) => {
      emitToUser(n.userId, "notification:new", {
        ...n,
        id: "temp-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        actor: { id: actorId, name: actorName },
        createdAt: new Date().toISOString(),
        isRead: false,
      });
    });
  } catch (error) {
    console.error("Lỗi notifySprintStarted:", error.message);
  }
};
