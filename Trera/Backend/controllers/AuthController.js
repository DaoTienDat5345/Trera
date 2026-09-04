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
