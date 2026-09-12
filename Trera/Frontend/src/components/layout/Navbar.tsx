import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Kanban, Plus, LogOut, FolderKanban, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { useAuthStore } from "../../store/authStore";
import UserAvatar from "../common/UserAvatar";

interface NavbarProps {
  onOpenCreateProject?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateProject }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/projects" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Kanban className="size-4.5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              Trera<span className="text-indigo-600">.</span>
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-2">
            <Link
              to="/projects"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/70 transition-colors"
            >
              <FolderKanban className="size-4 text-indigo-600" />
              <span>Dự án</span>
            </Link>
          </nav>
        </div>

        {/* Right: Actions & User Dropdown */}
        <div className="flex items-center gap-3">
          {onOpenCreateProject && (
            <Button
              onClick={onOpenCreateProject}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm gap-1.5 h-9 px-3.5"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Tạo dự án</span>
            </Button>
          )}

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <UserAvatar name={user?.name} avatar={user?.avatar} size="sm" />
              <ChevronDown className="size-3.5 text-slate-400 hidden sm:block" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 py-2 text-slate-800 z-50 animate-in fade-in slide-in-from-top-1">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                  <UserAvatar name={user?.name} avatar={user?.avatar} size="md" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/projects"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <FolderKanban className="size-4 text-slate-400" />
                    <span>Dự án của tôi</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Sparkles className="size-4 text-slate-400" />
                    <span>Hồ sơ & Cài đặt</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
                  >
                    <LogOut className="size-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
