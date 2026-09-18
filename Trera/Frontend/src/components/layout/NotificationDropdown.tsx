import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Rocket,
  Info,
  Clock,
} from "lucide-react";
import { useNotificationStore } from "../../store/notificationStore";
import type { AppNotification, NotificationType } from "../../store/notificationStore";
import UserAvatar from "../common/UserAvatar";

const formatTimeAgo = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
};

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "ISSUE_ASSIGNED":
      return (
        <div className="size-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <CheckCircle2 size={15} />
        </div>
      );
    case "ISSUE_STATUS_CHANGED":
      return (
        <div className="size-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <RefreshCw size={14} />
        </div>
      );
    case "COMMENT_ADDED":
      return (
        <div className="size-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <MessageSquare size={14} />
        </div>
      );
    case "SPRINT_STARTED":
      return (
        <div className="size-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <Rocket size={14} />
        </div>
      );
    default:
      return (
        <div className="size-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
          <Info size={14} />
        </div>
      );
  }
};

export const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  // Polling thông báo mỗi 30s khi đăng nhập
  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const displayedNotifications = filterUnread
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Chuông thông báo */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-hidden"
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-200/70 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-slate-800">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="text-[11px] font-medium bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1 text-[12px] text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer"
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck size={14} />
                <span>Đã đọc hết</span>
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center px-4 py-2 border-b border-slate-100 gap-2 text-[12px]">
            <button
              onClick={() => setFilterUnread(false)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                !filterUnread
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterUnread(true)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterUnread
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Chưa đọc {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {isLoading && displayedNotifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Đang tải thông báo...
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 px-4">
                <Bell size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium text-slate-600">Không có thông báo nào</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {filterUnread
                    ? "Bạn đã đọc tất cả thông báo rồi!"
                    : "Mọi hoạt động mới sẽ xuất hiện tại đây."}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group flex items-start gap-3 p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                    !notif.isRead ? "bg-indigo-50/30" : "bg-white"
                  }`}
                >
                  {/* Left: Icon or Actor Avatar */}
                  <div className="relative shrink-0">
                    {notif.actor ? (
                      <UserAvatar
                        name={notif.actor.name}
                        avatar={notif.actor.avatar}
                        size="sm"
                      />
                    ) : (
                      getNotificationIcon(notif.type)
                    )}
                    {!notif.isRead && (
                      <span className="absolute -top-0.5 -right-0.5 size-2 bg-indigo-600 rounded-full ring-2 ring-white" />
                    )}
                  </div>

                  {/* Middle: Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                      {notif.title}
                    </p>
                    <p className="text-[12px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
                      <Clock size={11} />
                      <span>{formatTimeAgo(notif.createdAt)}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Xóa thông báo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {displayedNotifications.length > 0 && (
            <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
              <span className="text-[11px] text-slate-400">
                Thông báo tự động kích hoạt khi có thay đổi
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
