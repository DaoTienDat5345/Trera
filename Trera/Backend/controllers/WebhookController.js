import { prisma } from "../config/prisma.js";

/**
 * Lấy danh sách Webhooks của dự án
 * GET /api/projects/:projectId/webhooks
 */
export const getWebhooks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const webhooks = await prisma.webhook.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ webhooks });
  } catch (error) {
    console.error("Lỗi lấy danh sách webhook:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách webhook." });
  }
};

/**
 * Tạo mới Webhook
 * POST /api/projects/:projectId/webhooks
 */
export const createWebhook = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, url, secret, events = ["TEST_RUN_COMPLETED"] } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Tên Webhook không được để trống." });
    }

    if (!url || !url.startsWith("http")) {
      return res.status(400).json({ message: "URL Webhook không hợp lệ (phải bắt đầu bằng http:// hoặc https://)." });
    }

    const webhook = await prisma.webhook.create({
      data: {
        name: name.trim(),
        url: url.trim(),
        secret: secret ? secret.trim() : null,
        events: Array.isArray(events) && events.length > 0 ? events : ["TEST_RUN_COMPLETED"],
        projectId,
      },
    });

    return res.status(201).json({
      message: "Tạo Webhook thành công.",
      webhook,
    });
  } catch (error) {
    console.error("Lỗi tạo webhook:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo webhook." });
  }
};

/**
 * Cập nhật Webhook
 * PUT /api/projects/:projectId/webhooks/:webhookId
 */
export const updateWebhook = async (req, res) => {
  try {
    const { projectId, webhookId } = req.params;
    const { name, url, secret, events, isActive } = req.body;

    const existing = await prisma.webhook.findFirst({
      where: { id: webhookId, projectId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Webhook không tồn tại." });
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (url !== undefined) data.url = url.trim();
    if (secret !== undefined) data.secret = secret ? secret.trim() : null;
    if (events !== undefined && Array.isArray(events)) data.events = events;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.webhook.update({
      where: { id: webhookId },
      data,
    });

    return res.status(200).json({
      message: "Cập nhật Webhook thành công.",
      webhook: updated,
    });
  } catch (error) {
    console.error("Lỗi cập nhật webhook:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật webhook." });
  }
};

/**
 * Xóa Webhook
 * DELETE /api/projects/:projectId/webhooks/:webhookId
 */
export const deleteWebhook = async (req, res) => {
  try {
    const { projectId, webhookId } = req.params;

    const existing = await prisma.webhook.findFirst({
      where: { id: webhookId, projectId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Webhook không tồn tại." });
    }

    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    return res.status(200).json({ message: "Đã xóa Webhook thành công." });
  } catch (error) {
    console.error("Lỗi xóa webhook:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xóa webhook." });
  }
};

/**
 * Gửi ping thử nghiệm Webhook
 * POST /api/projects/:projectId/webhooks/:webhookId/test
 */
export const testWebhook = async (req, res) => {
  try {
    const { projectId, webhookId } = req.params;

    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, projectId },
    });

    if (!webhook) {
      return res.status(404).json({ message: "Webhook không tồn tại." });
    }

    const payload = {
      event: "PING",
      timestamp: new Date().toISOString(),
      projectId,
      message: "Kiểm tra kết nối Webhook từ Trera QA Platform",
    };

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Trera-Event": "PING",
          ...(webhook.secret ? { "X-Trera-Secret": webhook.secret } : {}),
        },
        body: JSON.stringify(payload),
      });

      return res.status(200).json({
        message: `Đã gửi thử nghiệm. Mã phản hồi HTTP: ${response.status}`,
        statusCode: response.status,
        ok: response.ok,
      });
    } catch (netErr) {
      return res.status(400).json({
        message: `Không thể kết nối tới URL webhook: ${netErr.message}`,
        ok: false,
      });
    }
  } catch (error) {
    console.error("Lỗi kiểm tra webhook:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi kiểm tra webhook." });
  }
};
