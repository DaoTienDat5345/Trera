import rateLimit from "express-rate-limit";

/**
 * Kiểm tra xem request có mang theo CI/CD API Token ('tre_live_...') hay không.
 * Nếu có, request từ pipeline CI/CD sẽ được ưu tiên quota riêng biệt, tránh bị chặn nhầm.
 */
const isApiTokenRequest = (req) => {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers["x-api-key"];
  if (authHeader && authHeader.startsWith("Bearer tre_")) return true;
  if (apiKeyHeader && apiKeyHeader.startsWith("tre_")) return true;
  return false;
};

/**
 * 1. Global Rate Limiter:
 * Bảo vệ toàn bộ hệ thống API khỏi các cuộc tấn công HTTP Flood / DDoS từ Postman / cURL script.
 * Ngưỡng: 300 requests / 15 phút trên mỗi địa chỉ IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 300, // Tối đa 300 requests từ 1 IP trong 15 phút
  standardHeaders: true, // Trả về thông tin hạn ngạch trong header `RateLimit-*`
  legacyHeaders: false, // Tắt header cũ `X-RateLimit-*`
  skip: (req) => {
    // Miễn áp dụng cho health check và các request xác thực bằng API Token
    return req.path === "/api/health" || isApiTokenRequest(req);
  },
  handler: (req, res, _next, options) => {
    return res.status(options.statusCode).json({
      status: 429,
      error: "Too Many Requests",
      message: "Hệ thống phát hiện tần suất yêu cầu bất thường từ địa chỉ IP của bạn. Vui lòng thử lại sau 15 phút.",
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

/**
 * 2. Auth Rate Limiter (Brute-Force & CPU Exhaustion Protection):
 * Áp dụng riêng cho các endpoint nhạy cảm: Đăng nhập (`/api/auth/login`) và Đăng ký (`/api/auth/register`).
 * Chống kẻ tấn công dùng Postman spam băm mật khẩu bcrypt làm nghẽn 100% CPU hoặc dò mật khẩu tự động.
 * Ngưỡng nghiêm ngặt: 10 lần thử / 15 phút trên mỗi địa chỉ IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Tối đa 10 lần gọi trong 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    return res.status(options.statusCode).json({
      status: 429,
      error: "Too Many Requests",
      message: "Bạn đã vượt quá số lần thử đăng nhập/đăng ký cho phép (tối đa 10 lần / 15 phút). Để bảo vệ an toàn tài khoản và hệ thống, vui lòng chờ 15 phút trước khi thử lại.",
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

/**
 * 3. Email & Invitation Spam Limiter:
 * Áp dụng cho endpoint mời thành viên dự án qua email (`/api/projects/:id/members`).
 * Chống spam làm cạn kiệt hạn ngạch gửi mail của Gmail SMTP và tránh bị Google khóa tài khoản.
 * Ngưỡng: 15 lời mời / 1 giờ trên mỗi địa chỉ IP.
 */
export const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 15, // Tối đa 15 lời mời trong 1 giờ
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    return res.status(options.statusCode).json({
      status: 429,
      error: "Too Many Requests",
      message: "Bạn đã gửi quá nhiều lời mời thành viên trong thời gian ngắn (tối đa 15 lời mời / 1 giờ). Vui lòng thử lại sau.",
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

/**
 * 4. Public Invitation Response Limiter:
 * Áp dụng cho endpoint xác nhận/từ chối lời mời dự án (`/api/invitations/:token/respond`).
 * Ngưỡng: 20 requests / 15 phút.
 */
export const invitationResponseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    return res.status(options.statusCode).json({
      status: 429,
      error: "Too Many Requests",
      message: "Quá nhiều yêu cầu phản hồi lời mời. Vui lòng thử lại sau 15 phút.",
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});
