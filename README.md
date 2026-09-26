# 🚀 Trera – All-in-One QA & Agile Test Management Platform

<div align="center">

![Trera QA Banner](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80)

**Nền tảng Quản trị Dự án Agile & Quản lý Kiểm thử Phần mềm Chuyên sâu**  
*Sự kết hợp hoàn hảo giữa Jira Software + Xray Test Management + TestRail + Automation CI/CD Hub*

[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-blue.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/UI-Tailwind%20CSS%20v4-38B2AC.svg)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green.svg)](https://nodejs.org/)
[![Prisma ORM](https://img.shields.io/badge/ORM-Prisma%20v5-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Tính năng](#-tính-năng-nổi-bật) • [Kiến trúc Code](#-kiến-trúc-hệ-thống--codebase) • [Cài đặt](#️-hướng-dẫn-cài-đặt--khởi-động) • [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng-chi-tiết) • [Tích hợp CI/CD](#-tích-hợp-tự-động-hóa-cicd-với-repo-thật) • [API Reference](#-danh-sách-api-endpoints)

</div>

---

## 🌟 Giới Thiệu Về Trera

**Trera** là giải pháp phần mềm toàn diện giúp thu hẹp khoảng cách giữa **Đội ngũ Phát triển (Developers)** và **Đội ngũ Đảm bảo Chất lượng (QA/QC Engineers)**. Thay vì phải sử dụng nhiều công cụ phân mảnh (Jira để quản lý task, TestRail/Excel để viết test case, Postman/Cypress riêng lẻ), Trera tích hợp tất cả trên **một giao diện duy nhất**:

1. **Agile Issue Tracker**: Quản lý Sprint, Backlog, bảng Kanban kéo thả, Subtasks, Đính kèm ảnh/tệp Cloudinary, Thông báo Email & In-App thời gian thực.
2. **Test Repository**: Kho lưu trữ test case phân cấp theo cây thư mục, hỗ trợ cả Manual Test (bảng bước) lẫn BDD/Gherkin (Given-When-Then syntax highlighting), tái sử dụng Shared Steps, Import/Export Excel & CSV.
3. **Test Sets & Test Plans**: Gom nhóm bộ kiểm thử (Smoke, Regression) và lập kế hoạch kiểm thử theo phiên bản/Sprint.
4. **Execution Runner & 1-Click Bug Logging**: Trình chạy test tương tác, bấm giờ tự động (Stopwatch), đính kèm bằng chứng lỗi, và tính năng **1-Click Bug Logging** tự động tạo Bug trên Kanban khi ca test thất bại.
5. **Traceability Matrix & QA Dashboards**: Ma trận truy vết 3 chiều (User Story ↔ Test Cases ↔ Defects), đo lường độ bao phủ (Coverage %), và thuật toán thông minh phát hiện **Flaky Tests** (ca test chập chờn).
6. **Automation CI/CD & Granular RBAC**: Dual Authentication (JWT + API Token `tre_live_...`), bộ phân tích tệp kết quả **JUnit XML & Cucumber JSON**, tiếp nhận kết quả từ Playwright/Cypress/Jest/PyTest, Webhook sự kiện và phân quyền chi tiết 5 vai trò (`ADMIN`, `TEST_LEAD`, `TESTER`, `MEMBER`, `VIEWER`).

---

## ✨ Tính Năng Nổi Bật

### 1. 📋 Quản Lý Dự Án Agile & Kanban (Jira-Style)
- **Bảng Kanban trực quan**: Kéo thả mượt mà với thư viện `@dnd-kit`, phân loại theo 4 cột trạng thái: `Cần làm (TODO)`, `Đang làm (IN_PROGRESS)`, `Đang xem xét (IN_REVIEW)`, `Hoàn thành (DONE)`.
- **Sprint Management**: Quản lý vòng đời Sprint từ `PLANNING`, kích hoạt `ACTIVE` đến tổng kết `COMPLETED` (tự động chuyển các task dở dang về Backlog).
- **Chi tiết công việc (Issue Detail)**: Quản lý Story, Bug, Task, Subtask; gán người thực hiện, độ ưu tiên (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), nhãn (labels), hạn chót (Due Date).
- **Checklist & Đính kèm đa phương tiện**: Tạo danh sách công việc con (Subtasks), đính kèm hình ảnh và tệp tài liệu hỗ trợ lưu trữ **Cloudinary CDN** kèm cơ chế dự phòng lưu cục bộ (Local Disk Fallback).
- **Quy trình mời thành viên an toàn qua Email**: Gửi email kích hoạt kèm token xác nhận duy nhất, trang duyệt lời mời (Chấp nhận / Từ chối) và tự động thông báo kết quả về cho Project Owner.
- **Báo cáo tiến độ (Project Reports)**: Biểu đồ Burndown Chart SVG tương tác, phân bổ công việc theo trạng thái, độ ưu tiên và năng suất từng thành viên (Member Workload).

---

### 2. 🗂️ Kho Test Case (Test Repository)
- **Cấu trúc cây thư mục (Test Folder Tree)**: Phân cấp đa tầng (Folders / Sub-folders), hỗ trợ kéo thả sắp xếp thứ tự module tính năng.
- **Đa dạng loại kiểm thử**:
  - **Manual Test**: Bảng bước kiểm thử có cấu trúc gồm: Bước thực hiện (Action), Dữ liệu kiểm thử (Test Data), Kết quả mong đợi (Expected Result).
  - **BDD / Gherkin Test**: Trình soạn thảo kịch bản chuyên dụng theo cú pháp `Feature` - `Scenario` - `Given` - `When` - `Then` với tô màu cú pháp (Syntax Highlighting).
- **Bước dùng chung (Shared Steps & Preconditions)**: Định nghĩa các điều kiện tiên quyết (ví dụ: *"Đã đăng nhập tài khoản có quyền Admin"*) để tái sử dụng ở nhiều test case mà không cần gõ lại.
- **Import & Export linh hoạt**: Nhập/xuất danh sách test case từ tệp Excel (.xlsx) hoặc CSV, tự động bóc tách cấu trúc từng bước kiểm thử.
- **Quản lý phiên bản & Nhân bản**: Clone test case nhanh chóng, theo dõi lịch sử chỉnh sửa và người tạo.

---

### 3. 🎯 Gom Nhóm & Lập Kế Hoạch (Test Sets & Test Plans)
- **Bộ Kiểm Thử (Test Sets)**: Gom nhóm các ca kiểm thử theo mục đích cụ thể: `Smoke Test`, `Sanity Test`, `Regression Test`, `Security Test`. Một test case có thể thuộc nhiều bộ test khác nhau.
- **Kế Hoạch Kiểm Thử (Test Plans)**: 
  - Lập kế hoạch kiểm thử theo chu kỳ phát hành hoặc Sprint.
  - Thiết lập phiên bản đích (`Target Version`), mốc thời gian (`Milestone`), và phân công Tester phụ trách.
  - Tính năng **Nhập nhanh từ Test Set** chỉ với 1 cú click chuột.

---

### 4. ⚡ Thực Thi Kiểm Thử & 1-Click Bug Logging
- **Môi trường kiểm thử (Test Environments)**: Quản lý đa môi trường (`Staging Chrome`, `Production Web`, `Android App`, `API Staging`).
- **Trình chạy kiểm thử tập trung (Execution Runner Modal)**:
  - Đồng hồ bấm giờ tự động (**Stopwatch**) ghi nhận chính xác thời gian thực thi của từng ca kiểm thử.
  - Đánh dấu trạng thái từng bước: `PASSED`, `FAILED`, `BLOCKED`, `SKIPPED`.
  - Đính kèm bằng chứng lỗi (ảnh chụp màn hình, tệp log, video).
- **1-Click Bug Logging**: Khi có một bước kiểm thử thất bại, Tester chỉ cần bấm nút **"Tạo Bug ngay"**:
  - Hệ thống tự động trích xuất tên test case, bước thất bại, kết quả mong đợi và dữ liệu thực tế để tạo thành một Issue loại `BUG` trên Kanban Board.
  - Tự động thiết lập liên kết 2 chiều giữa Bug trên Kanban và đợt chạy kiểm thử (`TestRunDefect` & `TestCaseIssue`).

---

### 5. 🔍 Ma Trận Truy Vết 3 Chiều & Chỉ Số QA (Traceability & Dashboards)
- **Ma trận truy vết 3 chiều (3-Way Traceability Matrix)**:
  $$\text{User Story (Requirement)} \longleftrightarrow \text{Test Cases} \longleftrightarrow \text{Defects (Bugs)}$$
- **Tỷ lệ bao phủ kiểm thử (Requirement Coverage %)**: Đánh giá ngay tỷ lệ % yêu cầu đã được viết test case bảo vệ.
- **Phân loại chất lượng tự động (`QualityStatus`)**:
  - `PASSED` (Đạt): 100% test case liên kết đều Pass và không còn Bug nào đang mở.
  - `FAILED` (Có lỗi): Có ít nhất 1 test case Fail hoặc có Bug đang mở.
  - `BLOCKED` (Bị chặn): Có test case bị chặn và chưa có test nào Fail.
  - `UNTESTED` (Chưa chạy): Có test case nhưng chưa thực thi trong đợt chạy nào.
  - `NO_TESTS` (Chưa có test): Cảnh báo đỏ các User Story bị bỏ quên, chưa có ca kiểm thử nào.
- **Thuật toán thông minh phát hiện Flaky Tests**:
  - Phân tích chuỗi kết quả qua các đợt chạy theo thời gian.
  - Nhận diện các bước chuyển trạng thái đảo nghịch (**Flip Transitions**: Pass ➔ Fail ➔ Pass).
  - Tính toán tỷ lệ lật (`Flip Rate %`) và cảnh báo các ca test chập chờn do môi trường, dữ liệu hoặc bất đồng bộ.

---

### 6. 🤖 Tự Động Hóa CI/CD & Phân Quyền Nâng Cao (Granular RBAC)
- **Dual Authentication**: Hỗ trợ đồng thời đăng nhập người dùng (JWT) và xác thực máy (API Token `tre_live_...` được mã hóa SHA-256 trong cơ sở dữ liệu).
- **Parsers chuẩn tự động hóa**:
  - **JUnit XML Parser**: Tương thích hoàn toàn với Playwright, Cypress, Jest, PyTest, Selenium.
  - **Cucumber BDD JSON Parser**: Tương thích với các kịch bản Cucumber, SpecFlow.
- **Pipeline tự động**: Tự động sinh `TestRun`, cập nhật kết quả từng bước và tự động tạo Bug lên Kanban khi có ca test thất bại (`autoCreateDefects: true`).
- **Webhook Hub**: Đăng ký URL webhook, gửi chữ ký bảo mật `X-Trera-Secret`, hỗ trợ các sự kiện `TEST_RUN_COMPLETED`, `AUTOMATION_IMPORTED`, `BUG_AUTO_CREATED`, và tính năng **Test Ping** kiểm tra kết nối trực tiếp.
- **Granular RBAC (5 vai trò chuẩn quốc tế)**:
  - 👑 **ADMIN**: Toàn quyền cấu hình dự án, quản lý thành viên và API tokens.
  - 🎯 **TEST_LEAD**: Quản lý kế hoạch kiểm thử, duyệt đợt chạy, cấp API Token CI/CD.
  - 🧪 **TESTER**: Tạo/sửa test case, thực thi test run, tải kết quả tự động hóa lên, tạo Bug.
  - 💻 **MEMBER**: Lập trình viên — xem test case, nhận Bug từ QA, cập nhật tiến độ task.
  - 👁️ **VIEWER**: Khách / Stakeholder — quyền chỉ xem (Read-only), hệ thống tự động chặn 403 đối với mọi thao tác sửa đổi hay thực thi.

---

## 🏗️ Kiến Trúc Hệ Thống & Codebase

### 1. Sơ Đồ Kiến Trúc Tổng Thể

```mermaid
flowchart TB
    subgraph Clients["Tầng Client & Ngoại vi"]
        Web["🖥️ Web App (React 19 + TypeScript + Tailwind)"]
        CI["🤖 CI/CD Pipelines (GitHub Actions / GitLab CI / Jenkins)"]
        Curl["💻 Script / cURL / Postman"]
    end

    subgraph Gateway["Tầng API Gateway & Middleware"]
        AuthMid["Dual Auth (JWT Bearer & API Token 'tre_live_...')"]
        RBACMid["Granular RBAC (Admin, Test Lead, Tester, Member, Viewer)"]
        UploadMid["Multer (Memory/Disk Upload Handler)"]
    end

    subgraph CoreBackend["Tầng Dịch Vụ Backend (Node.js & Express)"]
        AgileCtrl["Agile Controllers (Sprint, Issue, Board, Comment)"]
        QACtrl["QA Controllers (Repository, Plans, Runner, Traceability)"]
        AutoCtrl["Automation Controller (JUnit XML & Cucumber Parsers)"]
        NotifyServ["Notification Service & Activity Logger"]
        EmailServ["Email Service (Nodemailer SMTP)"]
    end

    subgraph Storage["Tầng Dữ Liệu & Lưu Trữ"]
        Prisma["Prisma ORM Client Singleton"]
        PG[("🐘 PostgreSQL Database")]
        Cloudinary["☁️ Cloudinary CDN (Ảnh & File)"]
        Webhooks["📡 Webhooks Event Dispatcher"]
    end

    Clients --> Gateway
    Gateway --> CoreBackend
    CoreBackend --> Prisma
    Prisma --> PG
    CoreBackend --> Cloudinary
    CoreBackend --> EmailServ
    CoreBackend --> Webhooks
```

---

### 2. Entity Relationship Diagram (ERD) Hoàn Chỉnh

Dưới đây là thiết kế cơ sở dữ liệu chi tiết gồm 23 thực thể kết nối chặt chẽ:

```mermaid
erDiagram
    users ||--o{ projects : "owns"
    users ||--o{ project_members : "participates"
    projects ||--o{ project_members : "has"
    projects ||--o{ sprints : "contains"
    projects ||--o{ issues : "contains"
    projects ||--o{ test_folders : "contains"
    projects ||--o{ test_cases : "contains"
    projects ||--o{ test_sets : "contains"
    projects ||--o{ test_plans : "contains"
    projects ||--o{ test_runs : "contains"
    projects ||--o{ api_tokens : "has"
    projects ||--o{ webhooks : "has"

    sprints ||--o{ issues : "schedules"
    issues ||--o{ checklist_items : "has subtasks"
    issues ||--o{ attachments : "has files"
    issues ||--o{ comments : "has discussions"
    issues ||--o{ activities : "audited by"

    test_folders ||--o{ test_folders : "sub-folders"
    test_folders ||--o{ test_cases : "categorizes"
    test_cases ||--o{ test_steps : "defines steps"
    test_cases ||--o{ test_case_shared_steps : "reuses"
    test_shared_steps ||--o{ test_case_shared_steps : "used by"

    test_sets ||--o{ test_set_cases : "groups"
    test_cases ||--o{ test_set_cases : "included in"

    test_plans ||--o{ test_plan_cases : "targets"
    test_cases ||--o{ test_plan_cases : "planned in"

    test_runs ||--o{ test_run_results : "records"
    test_cases ||--o{ test_run_results : "executed as"
    test_run_results ||--o{ test_run_step_results : "step details"
    test_run_results ||--o{ test_run_defects : "causes"
    issues ||--o{ test_run_defects : "linked bug"

    test_cases ||--o{ test_case_issues : "covers"
    issues ||--o{ test_case_issues : "requirement"
```

---

### 3. Cấu Trúc Thư Mục Dự Án (Directory Structure)

```
Trera/
├── Backend/
│   ├── config/
│   │   ├── cloudinary.js          # Cấu hình SDK Cloudinary & multer-storage
│   │   └── prisma.js              # Prisma Client singleton instance
│   ├── controllers/
│   │   ├── ActivityController.js      # Lịch sử hoạt động dự án
│   │   ├── ApiTokenController.js      # CRUD API token CI/CD (SHA-256 hashing)
│   │   ├── AttachmentController.js    # Upload file ảnh/tài liệu (Cloudinary + Local)
│   │   ├── AuthController.js          # Đăng ký, đăng nhập JWT, Google OAuth
│   │   ├── AutomationController.js    # Tiếp nhận JUnit XML, Cucumber JSON, auto-bug
│   │   ├── CommentController.js       # Bình luận công việc
│   │   ├── IssueController.js         # CRUD issue, sắp xếp kéo thả Kanban, lọc
│   │   ├── ProjectController.js       # Quản lý dự án, lời mời, phân quyền RBAC
│   │   ├── QADashboardController.js   # Báo cáo QA, thuật toán Flaky Tests
│   │   ├── SprintController.js        # Vòng đời Sprint (Planning, Active, Complete)
│   │   ├── TestCaseController.js      # CRUD test case, versioning, shared steps, import/export
│   │   ├── TestFolderController.js    # Quản lý cây thư mục test case
│   │   ├── TestPlanController.js      # Kế hoạch test & bộ test (Test Sets)
│   │   ├── TestRunController.js       # Thực thi test run, runner modal, 1-click bug
│   │   ├── TraceabilityController.js  # Ma trận truy vết 3 chiều Requirement ↔ Test ↔ Bug
│   │   └── WebhookController.js       # Quản lý webhooks và test ping
│   ├── middleware/
│   │   ├── auth.js                    # Dual auth (JWT Bearer & tre_live_... API Token)
│   │   ├── projectAccess.js           # Kiểm tra quyền truy cập dự án & Granular RBAC
│   │   └── upload.js                  # Multer upload middleware
│   ├── prisma/
│   │   └── schema.prisma              # 23 Prisma models hoàn chỉnh
│   ├── services/
│   │   ├── automationParser.js        # Parser chuyên sâu cho JUnit XML & Cucumber JSON
│   │   ├── emailService.js            # Gửi email thông báo, mời thành viên (Nodemailer)
│   │   └── notificationService.js     # Tạo thông báo In-App & trigger email
│   ├── src/
│   │   ├── router/                    # Định tuyến Express RESTful
│   │   └── server.js                  # Entry point Backend server
│   └── package.json
│
└── Frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/                # UserAvatar, Badges, Modals dùng chung
    │   │   ├── kanban/                # KanbanColumn, IssueCard, IssueDetailModal
    │   │   ├── layout/                # Navbar, Sidebar, Subheader navigation
    │   │   ├── test-management/       # FolderTree, TestCaseModal, ImportExportModal
    │   │   ├── test-runner/           # ExecutionRunnerModal, TestRunDetailView
    │   │   └── traceability/          # LinkTestCaseModal, FlakyTimelineBadge
    │   ├── lib/
    │   │   ├── api.ts                 # Axios client instance (interceptor JWT)
    │   │   └── utils.ts               # Date formatter, classnames merging (clsx)
    │   ├── pages/
    │   │   ├── AutomationPage.tsx         # Trung tâm CI/CD, API Token, Upload XML, Webhooks
    │   │   ├── InvitationResponsePage.tsx # Trang chấp nhận / từ chối lời mời dự án
    │   │   ├── LoginPage.tsx              # Đăng nhập & Đăng nhập Google
    │   │   ├── ProjectActivityPage.tsx    # Dòng thời gian lịch sử hoạt động
    │   │   ├── ProjectBoardPage.tsx       # Bảng Kanban quản lý công việc
    │   │   ├── ProjectMembersPage.tsx     # Quản lý thành viên & phân quyền 5 vai trò
    │   │   ├── ProjectReportsPage.tsx     # Báo cáo Burndown Chart & thống kê Sprint
    │   │   ├── RegisterPage.tsx           # Đăng ký tài khoản
    │   │   ├── SprintBacklogPage.tsx      # Quản lý Backlog và lập kế hoạch Sprint
    │   │   ├── TestPlansPage.tsx          # Quản lý Bộ Test (Sets) & Kế hoạch Test (Plans)
    │   │   ├── TestRepositoryPage.tsx     # Kho Test Case phân cấp (Manual & BDD)
    │   │   └── TraceabilityPage.tsx       # Ma trận truy vết 3 chiều & QA Dashboards
    │   ├── store/
    │   │   ├── authStore.ts               # Zustand store quản lý người dùng
    │   │   ├── automationStore.ts         # Zustand store CI/CD, tokens, webhooks
    │   │   ├── issueStore.ts              # Zustand store issues, kanban drag-and-drop
    │   │   ├── projectStore.ts            # Zustand store projects & members
    │   │   ├── testPlanStore.ts           # Zustand store test sets & test plans
    │   │   ├── testRepositoryStore.ts     # Zustand store folder tree & test cases
    │   │   ├── testRunStore.ts            # Zustand store test execution & bug logging
    │   │   └── traceabilityStore.ts       # Zustand store matrix & QA metrics
    │   ├── App.tsx                    # React Router 7 route definitions
    │   └── main.tsx                   # Client entry point
    └── package.json
```

---

## ⚙️ Hướng Dẫn Cài Đặt & Khởi Động

### 1. Yêu Cầu Tiên Quyết
- **Node.js**: Phiên bản 18.x hoặc 20.x trở lên
- **PostgreSQL**: Phiên bản 14 trở lên đang chạy (cổng mặc định `5432`)
- **Trình quản lý gói**: `npm` hoặc `pnpm`

---

### 2. Cấu Hình & Khởi Động Backend

```bash
# 1. Di chuyển vào thư mục Backend
cd Trera/Backend

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Tạo file cấu hình môi trường .env
cp .env.example .env
```

Mở tệp `.env` và điền các thông số kết nối:

```env
# Kết nối PostgreSQL (thay đổi user, pass, database tương ứng)
DATABASE_URL="postgresql://postgres:password@localhost:5432/trera?schema=public"

# Cổng chạy Backend
PORT=5001
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"

# JSON Web Token Secret
JWT_SECRET="trera_super_secret_jwt_key_2026"
JWT_EXPIRES_IN="7d"

# Cấu hình gửi Mail qua Gmail SMTP (Sử dụng Mật khẩu ứng dụng - App Password)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your_email@gmail.com"
MAIL_PASS="your_16_digit_app_password"
MAIL_FROM="Trera Platform <your_email@gmail.com>"

# Cấu hình Cloudinary (Tùy chọn - nếu bỏ trống hệ thống tự lưu file cục bộ tại /uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

Đồng bộ cơ sở dữ liệu và khởi động:

```bash
# 4. Đẩy schema Prisma lên PostgreSQL
npx prisma db push

# 5. Khởi động server Backend (hỗ trợ tự reload khi sửa code)
npm run dev
# Server sẽ lắng nghe tại: http://localhost:5001
```

---

### 3. Cấu Hình & Khởi Động Frontend

Mở một cửa sổ Terminal mới:

```bash
# 1. Di chuyển vào thư mục Frontend
cd Trera/Frontend

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Tạo file cấu hình môi trường .env (nếu cần đổi cổng API)
# Mặc định Frontend kết nối tới http://localhost:5001
VITE_API_URL="http://localhost:5001/api"

# 4. Khởi động máy chủ phát triển Frontend
npm run dev
# Giao diện web sẵn sàng tại: http://localhost:5173
```

---

## 📖 Hướng Dẫn Sử Dụng Chi Tiết

### 1. Chu Trình Kiểm Thử Chuẩn (Standard QA Flow)

```mermaid
sequenceDiagram
    autonumber
    actor QA as QA Engineer / Tester
    participant Repo as Kho Test Case
    participant Plan as Kế Hoạch Test
    participant Runner as Execution Runner
    participant Board as Bảng Kanban
    participant Matrix as Ma Trận Truy Vết

    QA->>Repo: 1. Tạo thư mục & Soạn thảo Test Case (Manual / BDD)
    QA->>Plan: 2. Gom nhóm Test Set & Lập Kế Hoạch Sprint
    QA->>Runner: 3. Khởi chạy đợt test (Bấm giờ, ghi nhận bước Pass/Fail)
    Note over Runner,Board: Phát hiện lỗi tại bước 3
    QA->>Runner: 4. Bấm "1-Click Log Bug"
    Runner->>Board: Tự động tạo Issue loại BUG kèm liên kết đợt test
    QA->>Matrix: 5. Gắn Test Case vào User Story trên Backlog
    Matrix-->>QA: Hiển thị độ bao phủ 100%, chất lượng FAILED (do có Bug đang mở)
```

1. **Bước 1: Soạn Test Case**: Vào **Kho Test Case**, tạo thư mục theo tính năng, viết các bước kiểm thử hoặc kịch bản Gherkin.
2. **Bước 2: Lập Kế Hoạch**: Vào **Kế hoạch Test**, tạo bộ `Smoke Test` hoặc `Regression Test`, đưa vào kế hoạch kiểm thử của Sprint.
3. **Bước 3: Thực Thi**: Mở **Execution Runner**, tích chọn Đạt/Không đạt từng bước. Khi gặp lỗi, bấm **"Tạo Bug ngay"** để bắn thẳng sang Kanban cho lập trình viên sửa.
4. **Bước 4: Đánh Giá Chất Lượng**: Mở **Ma trận truy vết** để theo dõi tỷ lệ bao phủ yêu cầu của dự án.

---

## 🤖 Tích Hợp Tự Động Hóa CI/CD Với Repo Thật

Trera cung cấp cổng kết nối bảo mật cho phép bất kỳ pipeline nào (GitHub Actions, GitLab CI, Jenkins, Docker) tự động đẩy kết quả test về hệ thống sau mỗi lần build.

### 1. Tạo API Token
1. Truy cập tab **CI/CD & API** (`/projects/:id/automation`).
2. Bấm **+ Tạo Token mới**, chọn phạm vi `automation:write`, đặt tên và hạn sử dụng.
3. Sao chép chuỗi mã có tiền tố `tre_live_...` (Lưu ý: Chuỗi này chỉ xuất hiện 1 lần duy nhất).

---

### 2. Tích Hợp Với Playwright (E2E Test)

Trong tệp `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['junit', { outputFile: 'results/junit.xml' }] // Bật xuất báo cáo JUnit XML
  ],
});
```

Chạy test và đẩy kết quả tự động bằng cURL:
```bash
npx playwright test

curl -X POST "http://localhost:5001/api/projects/<PROJECT_ID>/automation/junit" \
  -H "Authorization: Bearer tre_live_YOUR_TOKEN" \
  -F "file=@results/junit.xml" \
  -F "autoCreateDefects=true"
```

---

### 3. Tích Hợp Tự Động Hóa Hoàn Toàn Với GitHub Actions

Tạo tệp `.github/workflows/qa_pipeline.yml` trong repo của bạn:

```yaml
name: Continuous Testing & QA Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  run-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run Automated Tests
        run: npm run test:e2e
        continue-on-error: true # Tiếp tục để vẫn upload kết quả dù có test fail

      - name: Send Test Results to Trera QA Platform
        run: |
          curl -X POST "${{ secrets.TRERA_URL }}/api/projects/${{ secrets.TRERA_PROJECT_ID }}/automation/junit" \
            -H "Authorization: Bearer ${{ secrets.TRERA_API_TOKEN }}" \
            -F "file=@results/junit.xml" \
            -F "autoCreateDefects=true"
```

> **Kết quả đạt được**: Mỗi khi code được push lên GitHub, toàn bộ kết quả kiểm thử tự động xuất hiện trên Trera. Các ca kiểm thử thất bại sẽ **tự động sinh Bug trên bảng Kanban** kèm toàn bộ stacktrace lỗi giúp đội ngũ xử lý ngay lập tức!

---

## 📡 Danh Sách API Endpoints

Hệ thống cung cấp hơn 50 RESTful endpoints được bảo vệ bởi middleware xác thực và phân quyền:

### 1. Xác thực & Tài khoản (`/api/auth`)
- `POST /api/auth/register` – Đăng ký tài khoản mới.
- `POST /api/auth/login` – Đăng nhập hệ thống (trả về JWT).
- `GET /api/auth/me` – Lấy thông tin tài khoản hiện tại.
- `GET /api/auth/google` – Đăng nhập nhanh qua tài khoản Google OAuth.

### 2. Dự án & Thành viên (`/api/projects`)
- `GET /api/projects` – Danh sách dự án tham gia.
- `POST /api/projects` – Tạo dự án mới.
- `GET /api/projects/:id` – Chi tiết dự án.
- `PUT /api/projects/:id` – Cập nhật cấu hình dự án.
- `DELETE /api/projects/:id` – Xóa dự án (Chỉ Admin/Owner).
- `POST /api/projects/:id/invitations` – Gửi email mời thành viên kèm vai trò.
- `PUT /api/projects/:id/members/:userId/role` – Cập nhật vai trò thành viên (Granular RBAC).
- `DELETE /api/projects/:id/members/:userId` – Xóa thành viên khỏi dự án.

### 3. Quản lý Issue & Kanban (`/api/projects/:id/issues`)
- `GET /api/projects/:id/issues` – Danh sách công việc (hỗ trợ lọc theo sprint, status, priority).
- `POST /api/projects/:id/issues` – Tạo công việc mới.
- `PUT /api/projects/:id/issues/reorder` – Cập nhật thứ tự sắp xếp kéo thả Kanban.
- `PUT /api/projects/:id/issues/:issueId` – Chỉnh sửa chi tiết công việc.
- `DELETE /api/projects/:id/issues/:issueId` – Xóa công việc.

### 4. Kho Test Case (`/api/projects/:projectId/...`)
- `GET /api/projects/:projectId/folders` – Lấy cây thư mục test case.
- `POST /api/projects/:projectId/folders` – Tạo thư mục mới.
- `GET /api/projects/:projectId/cases` – Danh sách test case (hỗ trợ lọc theo thư mục).
- `POST /api/projects/:projectId/cases` – Tạo ca kiểm thử (Manual hoặc BDD).
- `POST /api/projects/:projectId/cases/import` – Nhập test case từ tệp Excel/CSV.
- `GET /api/projects/:projectId/cases/export` – Xuất test case ra file Excel/CSV.
- `GET /api/projects/:projectId/shared-steps` – Danh sách bước kiểm thử dùng chung.

### 5. Kế Hoạch Kiểm Thử (`/api/projects/:projectId/...`)
- `GET /api/projects/:projectId/sets` – Danh sách bộ kiểm thử (Test Sets).
- `POST /api/projects/:projectId/sets` – Tạo bộ kiểm thử.
- `GET /api/projects/:projectId/plans` – Danh sách kế hoạch kiểm thử (Test Plans).
- `POST /api/projects/:projectId/plans` – Tạo kế hoạch kiểm thử mới.

### 6. Thực Thi Kiểm Thử (`/api/projects/:projectId/...`)
- `POST /api/projects/:projectId/runs` – Tạo đợt chạy kiểm thử mới (Test Run).
- `GET /api/projects/:projectId/runs/:runId` – Chi tiết đợt chạy kèm trạng thái từng bước.
- `PUT /api/projects/:projectId/runs/:runId/cases/:caseId` – Cập nhật kết quả chạy từng bước.
- `POST /api/projects/:projectId/runs/:runId/defects` – 1-Click Bug Logging từ đợt chạy.

### 7. Ma Trận Truy Vết & QA Dashboards (`/api/projects/:projectId/...`)
- `GET /api/projects/:projectId/traceability` – Ma trận truy vết 3 chiều Requirement ↔ Test ↔ Bug.
- `POST /api/projects/:projectId/traceability/link` – Gắn Test Case vào User Story.
- `POST /api/projects/:projectId/traceability/unlink` – Gỡ liên kết Test Case.
- `GET /api/projects/:projectId/qa-metrics` – Bộ chỉ số độ bao phủ và phân tích Bug.
- `GET /api/projects/:projectId/qa-metrics/flaky-tests` – Danh sách ca kiểm thử bất ổn định (Flaky Tests).

### 8. Tự Động Hóa CI/CD, Tokens & Webhooks (`/api/projects/:projectId/...`)
- `GET /api/projects/:projectId/tokens` – Danh sách API Tokens.
- `POST /api/projects/:projectId/tokens` – Tạo API Token CI/CD mới (`tre_live_...`).
- `DELETE /api/projects/:projectId/tokens/:tokenId` – Thu hồi (Revoke) API Token.
- `POST /api/projects/:projectId/automation/junit` – Nộp kết quả tự động dạng JUnit XML.
- `POST /api/projects/:projectId/automation/cucumber` – Nộp kết quả tự động dạng Cucumber JSON.
- `GET /api/projects/:projectId/automation/summary` – Thống kê các đợt chạy tự động.
- `GET /api/projects/:projectId/webhooks` – Danh sách Webhooks đã cấu hình.
- `POST /api/projects/:projectId/webhooks` – Tạo Webhook sự kiện.
- `POST /api/projects/:projectId/webhooks/:webhookId/test` – Gửi ping kiểm tra kết nối Webhook.

---

## 🧪 Kiểm Thử Hệ Thống (Automated Test Suites)

Toàn bộ hệ thống Trera đã được kiểm thử tự động tích hợp 100% thông qua các kịch bản kiểm thử toàn diện:

```bash
# Di chuyển vào Backend
cd Trera/Backend

# 1. Kiểm thử Kho Test Case & Bước dùng chung (14/14 tests passed)
node scratch/test_test_repository.mjs

# 2. Kiểm thử Bộ Test & Kế hoạch kiểm thử (14/14 tests passed)
node scratch/test_test_plans.mjs

# 3. Kiểm thử Trình chạy Test & 1-Click Bug Logging (14/14 tests passed)
node scratch/test_test_runs.mjs

# 4. Kiểm thử Ma trận truy vết & Thuật toán Flaky Tests (14/14 tests passed)
node scratch/test_traceability_metrics.mjs

# 5. Kiểm thử Tự động hóa CI/CD, Dual Auth & Phân quyền RBAC (12/12 tests passed)
node scratch/test_automation_cicd.mjs
```

---

## 👥 Ma Trận Phân Quyền Chi Tiết (Granular RBAC Matrix)

| Chức năng | ADMIN | TEST_LEAD | TESTER | MEMBER | VIEWER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Quản lý dự án & Cấu hình chung | ✅ | ❌ | ❌ | ❌ | ❌ |
| Mời & Điều chỉnh vai trò thành viên | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tạo & Thu hồi API Token CI/CD | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lập kế hoạch kiểm thử (Test Plans) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tạo / Chỉnh sửa ca kiểm thử (Test Cases) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Thực thi kiểm thử (Execution Runner) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Nộp kết quả kiểm thử tự động (CI/CD) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Tạo Bug từ kết quả kiểm thử (1-Click) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Quản lý công việc trên Kanban Board | ✅ | ✅ | ✅ | ✅ | ❌ |
| Xem dữ liệu, Báo cáo & Ma trận truy vết | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🤝 Đóng Góp & Phát Triển (Contributing)

Mọi sự đóng góp nhằm phát triển nền tảng Trera ngày một hoàn thiện hơn đều được hoan nghênh:
1. Fork dự án về tài khoản cá nhân.
2. Tạo nhánh tính năng mới (`git checkout -b feature/AmazingFeature`).
3. Commit các thay đổi của bạn (`git commit -m 'Add some AmazingFeature'`).
4. Đẩy lên nhánh của bạn (`git push origin feature/AmazingFeature`).
5. Tạo một **Pull Request** để được xem xét và tích hợp.

---

## 📄 Bản Quyền (License)

Dự án được phân phối dưới giấy phép **MIT License**. Bạn hoàn toàn có thể tự do sử dụng, chỉnh sửa và triển khai cho các dự án thương mại hoặc nội bộ của tổ chức.

---

<div align="center">

**Xây dựng với ❤️ bởi Đội ngũ Kỹ sư Trera**  
*Nâng tầm chất lượng phần mềm thông qua quy trình kiểm thử hiện đại!*

</div>