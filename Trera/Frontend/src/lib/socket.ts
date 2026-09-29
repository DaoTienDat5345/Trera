import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:5001";

let socket: Socket | null = null;

/**
 * Lấy hoặc khởi tạo socket client singleton
 */
export const getSocket = (): Socket => {
  if (!socket) {
    const token = sessionStorage.getItem("trera_token") || localStorage.getItem("trera_token");
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

/**
 * Kết nối socket với token xác thực
 */
export const connectSocket = (customToken?: string): Socket => {
  const token = customToken || sessionStorage.getItem("trera_token") || localStorage.getItem("trera_token");
  const s = getSocket();

  if (token) {
    s.auth = { token };
  }

  if (!s.connected) {
    s.connect();
  }

  return s;
};

/**
 * Ngắt kết nối socket khi đăng xuất
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Tham gia phòng dự án để nhận real-time bảng Kanban
 */
export const joinProjectRoom = (projectId: string) => {
  const s = getSocket();
  if (s.connected) {
    s.emit("project:join", projectId);
  } else {
    s.once("connect", () => {
      s.emit("project:join", projectId);
    });
  }
};

/**
 * Rời khỏi phòng dự án khi chuyển trang
 */
export const leaveProjectRoom = (projectId: string) => {
  const s = getSocket();
  if (s.connected) {
    s.emit("project:leave", projectId);
  }
};
