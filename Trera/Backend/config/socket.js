import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  // Middleware xác thực JWT token
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const secret = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production";
      const decoded = jwt.verify(token, secret);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // Tự động tham gia phòng cá nhân
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Tham gia phòng dự án để nhận real-time bảng Kanban & hoạt động
    socket.on("project:join", (projectId) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
      }
    });

    // Rời phòng dự án
    socket.on("project:leave", (projectId) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io chưa được khởi tạo!");
  }
  return io;
};

/**
 * Gửi sự kiện tới 1 người dùng cụ thể
 */
export const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Gửi sự kiện tới toàn bộ thành viên đang mở dự án (có thể loại trừ socket người gửi)
 */
export const emitToProject = (projectId, event, data, excludeSocketId = null) => {
  if (io && projectId) {
    if (excludeSocketId) {
      io.to(`project:${projectId}`).except(excludeSocketId).emit(event, data);
    } else {
      io.to(`project:${projectId}`).emit(event, data);
    }
  }
};
