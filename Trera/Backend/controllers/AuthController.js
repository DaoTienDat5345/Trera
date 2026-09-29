import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { sendWelcomeEmail } from "../services/emailService.js";

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập họ và tên." });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập địa chỉ email." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Địa chỉ email không đúng định dạng." });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất 6 ký tự." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email này đã được đăng ký tài khoản." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = generateToken(newUser.id);

    // Gửi email chào mừng ngầm, không block flow nếu lỗi
    sendWelcomeEmail(newUser).catch((err) =>
      console.error("Lỗi gửi welcome email:", err.message)
    );

    return res.status(201).json({
      message: "Đăng ký tài khoản thành công!",
      user: newUser,
      token,
    });
  } catch (error) {
    console.error("Lỗi đăng ký tài khoản:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi đăng ký tài khoản." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mật khẩu." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác." });
    }

    const token = generateToken(user.id);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      message: "Đăng nhập thành công!",
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi đăng nhập." });
  }
};

export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin cá nhân:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy thông tin người dùng." });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên hiển thị không được để trống." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name.trim(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "Cập nhật thông tin thành công!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi cập nhật thông tin cá nhân:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật thông tin." });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải chứa ít nhất 6 ký tự." });
    }

    // Lấy user kèm password hash từ DB
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu hiện tại không chính xác." });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi đổi mật khẩu." });
  }
};

// Google OAuth callback — được gọi sau khi Passport xác thực thành công
export const googleCallback = (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=google_failed`
      );
    }

    const token = generateToken(user.id);

    // Tạo safe user object (không có password, googleId)
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Encode user data vào URL để frontend đọc
    const userEncoded = encodeURIComponent(JSON.stringify(safeUser));
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    return res.redirect(
      `${frontendUrl}/auth/callback?token=${token}&user=${userEncoded}`
    );
  } catch (error) {
    console.error("Lỗi Google OAuth callback:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontendUrl}/login?error=server_error`);
  }
};
