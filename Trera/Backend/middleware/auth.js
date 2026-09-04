import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

export const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập hoặc token không được cung cấp.",
      });
    }

    const secret = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production";
    
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({
        message: "Token không hợp lệ hoặc đã hết hạn.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Người dùng liên kết với token này không còn tồn tại.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Lỗi xác thực middleware auth:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xác thực tài khoản." });
  }
};
