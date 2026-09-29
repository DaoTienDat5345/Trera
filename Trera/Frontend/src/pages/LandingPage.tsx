import React from "react";
import { Link } from "react-router";
import {
  Kanban,
  Zap,
  ShieldCheck,
  Mail,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/button";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-indigo-50/70 via-slate-50/40 to-transparent blur-3xl -z-10 pointer-events-none" />

      {/* ─── NAVIGATION BAR ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Kanban className="size-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Trera<span className="text-indigo-600">.</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Tính năng
            </a>
            <a href="#kanban-preview" className="hover:text-indigo-600 transition-colors">
              Giao diện Board
            </a>
            <a href="#why-trera" className="hover:text-indigo-600 transition-colors">
              Lợi thế
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium">
                Đăng nhập
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm shadow-indigo-200">
                Bắt đầu ngay
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ───────────────────────────────────────────────── */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-8 animate-fade-in">
          <Sparkles className="size-3.5" />
          <span>Giải pháp Jira & Trello thế hệ mới cho nhóm hiện đại</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
          Quản lý công việc trực quan, <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            vận hành Sprint chuẩn Scrum.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Kết hợp sự mượt mà của thẻ kéo thả Kanban với kỷ luật vòng đời Sprint của Jira.
          Tối ưu hóa hiệu suất với cơ sở dữ liệu PostgreSQL quan hệ tốc độ cao.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-base px-8 h-12 shadow-lg shadow-indigo-200 gap-2">
              Dùng thử miễn phí
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <a href="#kanban-preview" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 text-base px-8 h-12">
              Xem bảng tương tác
            </Button>
          </a>
        </div>

        {/* Micro stats */}
        <div className="mt-12 flex items-center justify-center gap-8 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-600" /> PostgreSQL & Prisma
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-600" /> Email Notification
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-600" /> Kéo thả Kanban
          </span>
        </div>
      </section>

      {/* ─── LIVE KANBAN MOCKUP PREVIEW ─────────────────────────────────── */}
      <section id="kanban-preview" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-900/5 p-2 sm:p-3 shadow-2xl shadow-slate-200">
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 text-white">
            {/* Mockup Header */}
            <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded-full bg-rose-500/80" />
                  <div className="size-3 rounded-full bg-amber-500/80" />
                  <div className="size-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-4 w-px bg-slate-800 mx-1" />
                <span className="text-xs font-mono font-medium text-slate-300">
                  Dự án: E-Commerce App [TRE]
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-semibold uppercase border border-indigo-700/50">
                  Sprint 1 · Active
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="hidden sm:inline">Chế độ xem:</span>
                <span className="px-2 py-1 rounded bg-slate-800 text-white font-medium">
                  Kanban
                </span>
                <span className="px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer">
                  Danh sách
                </span>
              </div>
            </div>

            {/* Mockup Columns */}
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900">
              {/* Cột TO DO */}
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-slate-400" />
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Cần làm (To Do)
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    2
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-sm">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                      <span className="text-indigo-400 font-semibold">TRE-101</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-sans text-[10px] font-medium border border-amber-500/20">
                        Medium
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-200 mb-3">
                      Tích hợp cổng thanh toán Stripe & VNPay
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="size-3 text-slate-500" /> 15 Th9
                      </div>
                      <div className="size-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                        AT
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-sm">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                      <span className="text-indigo-400 font-semibold">TRE-102</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-sans text-[10px] font-medium border border-emerald-500/20">
                        Low
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-200 mb-3">
                      Thêm bộ lọc theo khoảng giá sản phẩm
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        #filter
                      </span>
                      <div className="size-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[10px]">
                        DL
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột IN PROGRESS */}
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                      Đang làm (In Progress)
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-900">
                    1
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg bg-slate-900 border border-blue-900/60 shadow-md shadow-blue-950/30">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                      <span className="text-indigo-400 font-semibold">TRE-103</span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 font-sans text-[10px] font-semibold border border-rose-500/30">
                        <Flame className="size-3" /> Urgent
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-100 mb-3">
                      Tối ưu tốc độ tải giỏ hàng xuống dưới 50ms
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-400">
                        <Zap className="size-3" /> Đang tối ưu hóa
                      </div>
                      <div className="size-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                        NL
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột DONE */}
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                      Đã xong (Done)
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-900">
                    2
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                      <span className="text-slate-500 line-through">TRE-098</span>
                      <span className="text-emerald-400 text-xs">✓</span>
                    </div>
                    <p className="text-sm font-medium text-slate-400 line-through mb-2">
                      Xác thực đăng ký và gửi email chào mừng
                    </p>
                    <span className="text-[10px] text-emerald-500 font-mono">
                      Hoàn thành 08 Th9
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                      <span className="text-slate-500 line-through">TRE-099</span>
                      <span className="text-emerald-400 text-xs">✓</span>
                    </div>
                    <p className="text-sm font-medium text-slate-400 line-through mb-2">
                      Khởi tạo Database Schema PostgreSQL 10 bảng
                    </p>
                    <span className="text-[10px] text-emerald-500 font-mono">
                      Hoàn thành 08 Th9
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ──────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-3">
              Tính năng nổi bật
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight">
              Mọi công cụ cần thiết để quản lý dự án thành công
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="size-11 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                <Kanban className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Kanban kéo thả</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Kéo thả thẻ trực quan theo thời gian thực. Cập nhật vị trí và trạng thái tức thì không cần tải lại trang.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="size-11 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-5">
                <Layers className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Sprint & Backlog</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Vòng đời Sprint chuẩn Scrum. Khi kết thúc Sprint, các công việc chưa xong tự động chuyển về Backlog.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="size-11 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                <Mail className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Thông báo tự động</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Gửi email tự động khi bạn được giao việc, khi có bình luận mới hoặc khi trạng thái công việc được cập nhật.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="size-11 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Phân quyền chặt chẽ</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hỗ trợ vai trò Owner, Admin và Member. Bảo mật API với JWT và cơ chế bảo vệ cascade delete toàn vẹn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION BANNER ──────────────────────────────────────── */}
      <section className="py-20 bg-indigo-600 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">
            Sẵn sàng làm chủ tiến độ công việc của nhóm bạn?
          </h2>
          <p className="text-indigo-100 text-lg max-w-xl mx-auto mb-8 font-normal">
            Bắt đầu miễn phí ngay hôm nay. Không yêu cầu thẻ tín dụng, thiết lập dự án chỉ trong 30 giây.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 font-bold px-8 h-12 shadow-lg gap-2">
              Tạo tài khoản Trera ngay
              <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-slate-200 bg-white text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              T
            </div>
            <span className="font-semibold text-slate-800 text-sm">Trera</span>
            <span>— Jira & Trello Clone System</span>
          </div>
          <p>© {new Date().getFullYear()} Trera. Bản quyền thuộc về đội ngũ phát triển.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
