import { PrismaClient } from "@prisma/client";
import { sendInvitationRequestEmail, sendInvitationResultEmail } from "../services/emailService.js";

const prisma = new PrismaClient();
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";
const INVITE_EXPIRE_DAYS = 7;

/**
 * Gui loi moi vao du an (thay the addMember truc tiep)
 * POST /api/projects/:id/members
 */
export const sendInvitation = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { email, role = "MEMBER" } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Vui long nhap dia chi email cua thanh vien." });
    }

    const cleanRole = role.toUpperCase();
    if (!["ADMIN", "MEMBER"].includes(cleanRole)) {
      return res.status(400).json({ message: "Vai tro chi co the la ADMIN hoac MEMBER." });
    }

    const cleanEmail = email.trim().toLowerCase();

    const targetUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return res.status(404).json({
        message: "Khong tim thay nguoi dung voi email nay. Nguoi dung can dang ky tai khoan Trera truoc.",
      });
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUser.id } },
    });

    if (existingMember) {
      return res.status(409).json({ message: "Nguoi dung nay da la thanh vien cua du an." });
    }

    if (targetUser.id === req.project.ownerId) {
      return res.status(400).json({ message: "Khong the moi chu so huu du an." });
    }

    const existingInvitation = await prisma.projectInvitation.findFirst({
      where: {
        projectId,
        invitedUserId: targetUser.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return res.status(409).json({
        message: "Da co loi moi dang cho xac nhan cho nguoi dung nay. Vui long doi ho phan hoi.",
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRE_DAYS);

    const invitation = await prisma.projectInvitation.create({
      data: {
        projectId,
        invitedUserId: targetUser.id,
        invitedById: req.user.id,
        role: cleanRole,
        expiresAt,
      },
    });

    sendInvitationRequestEmail({
      invitedUser: targetUser,
      project: req.project,
      inviterName: req.user.name,
      token: invitation.token,
      role: cleanRole,
      frontendUrl: FRONTEND_URL,
    }).catch((err) => console.error("Loi gui email loi moi:", err.message));

    return res.status(201).json({
      message: `Da gui loi moi toi "${targetUser.name}" (${targetUser.email}). Ho se nhan duoc email xac nhan de quyet dinh tham gia.`,
      invitation: {
        id: invitation.id,
        token: invitation.token,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        invitedUser: { name: targetUser.name, email: targetUser.email },
        role: cleanRole,
      },
    });
  } catch (error) {
    console.error("Loi gui loi moi:", error);
    return res.status(500).json({ message: "Loi he thong khi gui loi moi." });
  }
};

/**
 * Lay thong tin loi moi theo token (public)
 * GET /api/invitations/:token
 */
export const getInvitationByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.projectInvitation.findUnique({
      where: { token },
      include: {
        project: { select: { id: true, name: true, key: true, description: true } },
        invitedUser: { select: { id: true, name: true, email: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!invitation) {
      return res.status(404).json({ message: "Loi moi khong ton tai hoac da bi xoa." });
    }

    if (invitation.status === "PENDING" && new Date() > invitation.expiresAt) {
      await prisma.projectInvitation.update({
        where: { token },
        data: { status: "EXPIRED" },
      });
      return res.status(410).json({
        status: "EXPIRED",
        message: "Loi moi nay da het han. Vui long yeu cau quan tri vien gui loi moi moi.",
      });
    }

    return res.status(200).json({
      status: invitation.status,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      project: invitation.project,
      invitedUser: invitation.invitedUser,
      invitedBy: invitation.invitedBy,
    });
  } catch (error) {
    console.error("Loi lay thong tin loi moi:", error);
    return res.status(500).json({ message: "Loi he thong." });
  }
};

/**
 * Phan hoi loi moi (chap nhan / tu choi)
 * POST /api/invitations/:token/respond  body: { action: "accept" | "decline" }
 */
export const respondToInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { action } = req.body;

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ message: "Hanh dong khong hop le. Phai la 'accept' hoac 'decline'." });
    }

    const invitation = await prisma.projectInvitation.findUnique({
      where: { token },
      include: {
        project: { select: { id: true, name: true, key: true, description: true, ownerId: true } },
        invitedUser: { select: { id: true, name: true, email: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!invitation) {
      return res.status(404).json({ message: "Loi moi khong ton tai hoac da bi xoa." });
    }

    if (invitation.status !== "PENDING") {
      const messages = {
        ACCEPTED: "Loi moi nay da duoc chap nhan truoc do.",
        DECLINED: "Loi moi nay da bi tu choi truoc do.",
        EXPIRED: "Loi moi nay da het han.",
      };
      return res.status(409).json({
        status: invitation.status,
        message: messages[invitation.status] || "Loi moi da duoc xu ly.",
      });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.projectInvitation.update({ where: { token }, data: { status: "EXPIRED" } });
      return res.status(410).json({
        status: "EXPIRED",
        message: "Loi moi nay da het han.",
      });
    }

    const accepted = action === "accept";

    await prisma.$transaction(async (tx) => {
      await tx.projectInvitation.update({
        where: { token },
        data: { status: accepted ? "ACCEPTED" : "DECLINED" },
      });

      if (accepted) {
        const alreadyMember = await tx.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: invitation.projectId,
              userId: invitation.invitedUserId,
            },
          },
        });

        if (!alreadyMember) {
          await tx.projectMember.create({
            data: {
              projectId: invitation.projectId,
              userId: invitation.invitedUserId,
              role: invitation.role,
            },
          });

          await tx.activity.create({
            data: {
              projectId: invitation.projectId,
              actorId: invitation.invitedUserId,
              action: "accepted_invitation",
              metadata: {
                memberId: invitation.invitedUserId,
                memberName: invitation.invitedUser.name,
                role: invitation.role,
                invitedBy: invitation.invitedBy.name,
              },
            },
          });
        }
      }
    });

    const owner = await prisma.user.findUnique({
      where: { id: invitation.project.ownerId },
      select: { id: true, name: true, email: true },
    });

    sendInvitationResultEmail({
      owner,
      invitedUser: invitation.invitedUser,
      project: invitation.project,
      accepted,
    }).catch((err) => console.error("Loi gui email ket qua loi moi:", err.message));

    return res.status(200).json({
      status: accepted ? "ACCEPTED" : "DECLINED",
      message: accepted
        ? `Ban da chap nhan tham gia du an "${invitation.project.name}" thanh cong!`
        : `Ban da tu choi loi moi tham gia du an "${invitation.project.name}".`,
      project: accepted ? invitation.project : undefined,
    });
  } catch (error) {
    console.error("Loi phan hoi loi moi:", error);
    return res.status(500).json({ message: "Loi he thong khi xu ly loi moi." });
  }
};

/**
 * Lay danh sach loi moi cua du an
 * GET /api/projects/:id/invitations
 */
export const getProjectInvitations = async (req, res) => {
  try {
    const projectId = req.params.id;

    const invitations = await prisma.projectInvitation.findMany({
      where: { projectId },
      include: {
        invitedUser: { select: { id: true, name: true, email: true, avatar: true } },
        invitedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ invitations });
  } catch (error) {
    console.error("Loi lay danh sach loi moi:", error);
    return res.status(500).json({ message: "Loi he thong." });
  }
};

/**
 * Huy loi moi dang cho
 * DELETE /api/projects/:id/invitations/:invitationId
 */
export const cancelInvitation = async (req, res) => {
  try {
    const { id: projectId, invitationId } = req.params;

    const invitation = await prisma.projectInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.projectId !== projectId) {
      return res.status(404).json({ message: "Khong tim thay loi moi." });
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({ message: "Chi co the huy loi moi dang cho xac nhan." });
    }

    await prisma.projectInvitation.update({
      where: { id: invitationId },
      data: { status: "EXPIRED" },
    });

    return res.status(200).json({ message: "Da huy loi moi thanh cong." });
  } catch (error) {
    console.error("Loi huy loi moi:", error);
    return res.status(500).json({ message: "Loi he thong." });
  }
};
