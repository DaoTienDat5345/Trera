import { prisma } from "../config/prisma.js";
import { uploadFileToStorage, deleteFileFromStorage } from "../config/upload.js";
import { emitToProject } from "../config/socket.js";

/**
 * Tải lên tệp đính kèm (cho Issue hoặc cho ChecklistItem)
 */
export const uploadAttachment = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { checklistItemId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Vui lòng chọn tệp để tải lên." });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { project: true },
    });

    if (!issue) {
      return res.status(404).json({ message: "Công việc không tồn tại." });
    }

    // Nếu có checklistItemId, kiểm tra tồn tại
    if (checklistItemId) {
      const chk = await prisma.checklistItem.findUnique({
        where: { id: checklistItemId },
      });
      if (!chk) {
        return res.status(404).json({ message: "Mục việc con không tồn tại." });
      }
    }

    // Tải tệp lên Cloudinary hoặc Local
    const originalName = Buffer.from(file.originalname, "latin1").toString("utf8"); // Sửa lỗi font tiếng Việt
    const uploadResult = await uploadFileToStorage(file.buffer, originalName, file.mimetype);

    // Lưu vào database
    const attachment = await prisma.attachment.create({
      data: {
        filename: uploadResult.filename,
        originalName: originalName,
        mimeType: file.mimetype,
        size: file.size,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        issueId,
        checklistItemId: checklistItemId || null,
        uploaderId: req.user.id,
      },
      include: {
        uploader: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Phát sóng real-time
    emitToProject(issue.projectId, "issue:attachment:created", {
      issueId,
      attachment,
    });

    return res.status(201).json({
      message: "Tải lên tệp đính kèm thành công!",
      attachment,
    });
  } catch (error) {
    console.error("Lỗi tải lên attachment:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tải tệp lên: " + error.message });
  }
};

/**
 * Xoá tệp đính kèm
 */
export const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        issue: { select: { id: true, projectId: true } },
      },
    });

    if (!attachment) {
      return res.status(404).json({ message: "Tệp đính kèm không tồn tại." });
    }

    // Xoá file vật lý trên Cloudinary / Local
    await deleteFileFromStorage(attachment.publicId, attachment.filename);

    // Xoá DB
    await prisma.attachment.delete({
      where: { id },
    });

    // Phát sóng real-time
    emitToProject(attachment.issue.projectId, "issue:attachment:deleted", {
      issueId: attachment.issueId,
      attachmentId: id,
    });

    return res.status(200).json({
      message: "Đã xoá tệp đính kèm thành công!",
    });
  } catch (error) {
    console.error("Lỗi xoá attachment:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xoá tệp đính kèm." });
  }
};
