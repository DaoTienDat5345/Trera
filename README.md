# 🚀 Trera – Jira-like Issue Tracker

> Ứng dụng quản lý công việc theo phong cách Jira với Kanban Board, Sprint Management, Comments và Activity Log.

## Tech Stack

| Layer | Công nghệ |
|-------|----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS, shadcn/ui, @dnd-kit |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL + Prisma ORM v5 |
| **Auth** | JWT + bcryptjs |
| **Email** | Nodemailer (Gmail SMTP) |
| **State** | Zustand |

---

## 📊 Entity Relationship Diagram

```mermaid
erDiagram
    users {
        string  id          PK
        string  name
        string  email       UK
        string  password
        datetime createdAt
        datetime updatedAt
    }

    projects {
        string  id          PK
        string  name
        string  description
        string  key         UK  "e.g. TRE"
        string  ownerId     FK
        datetime createdAt
        datetime updatedAt
    }

    project_members {
        string  id          PK
        enum    role            "ADMIN | MEMBER"
        string  projectId   FK
        string  userId      FK
        datetime createdAt
    }

    sprints {
        string   id         PK
        string   name
        string   goal
        enum     status         "PLANNING | ACTIVE | COMPLETED"
        datetime startDate
        datetime endDate
        string   projectId  FK
        datetime createdAt
        datetime updatedAt
    }

    issues {
        string   id          PK
        string   title
        string   description
        enum     status          "TODO | IN_PROGRESS | IN_REVIEW | DONE"
        enum     priority        "LOW | MEDIUM | HIGH | URGENT"
        enum     type            "BUG | FEATURE | TASK | IMPROVEMENT"
        int      order
        datetime dueDate
        datetime completedAt
        string   projectId   FK
        string   sprintId    FK  "nullable → backlog"
        string   reporterId  FK
        datetime createdAt
        datetime updatedAt
    }

    issue_assignees {
        string   issueId     FK
        string   userId      FK
        datetime assignedAt
    }

    issue_labels {
        string id       PK
        string label        "e.g. frontend, urgent"
        string issueId  FK
    }

    comments {
        string   id         PK
        string   content
        string   issueId    FK
        string   authorId   FK
        datetime createdAt
        datetime updatedAt
    }

    activities {
        string   id         PK
        string   action         "created_issue | changed_status | assigned | commented ..."
        json     metadata       "{ from, to, value, ... }"
        string   projectId  FK
        string   issueId    FK  "nullable"
        string   actorId    FK
        datetime createdAt
    }

    %% ── Relationships ──────────────────────────────────────────────────
    users           ||--o{ projects         : "owns"
    users           ||--o{ project_members  : "member of"
    projects        ||--o{ project_members  : "has members"

    projects        ||--o{ sprints          : "has sprints"
    projects        ||--o{ issues           : "contains"
    projects        ||--o{ activities       : "activity log"

    sprints         ||--o{ issues           : "groups"

    users           ||--o{ issues           : "reported by"
    issues          ||--o{ issue_assignees  : "assigned to"
    users           ||--o{ issue_assignees  : "is assignee"

    issues          ||--o{ issue_labels     : "tagged with"
    issues          ||--o{ comments         : "has"
    users           ||--o{ comments         : "wrote"

    issues          ||--o{ activities       : "tracked by"
    users           ||--o{ activities       : "performed by"
```

---

## 🗂️ Database Schema – Chi tiết

### Enums

| Enum | Giá trị |
|------|--------|
| `ProjectMemberRole` | `ADMIN`, `MEMBER` |
| `SprintStatus` | `PLANNING`, `ACTIVE`, `COMPLETED` |
| `IssueStatus` | `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE` |
| `Priority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `IssueType` | `BUG`, `FEATURE`, `TASK`, `IMPROVEMENT` |

### Indexes

| Table | Index | Mục đích |
|-------|-------|---------|
| `users` | `email` (UNIQUE) | Đăng nhập |
| `projects` | `key` (UNIQUE) | Project identifier |
| `project_members` | `(projectId, userId)` (UNIQUE) | Tránh trùng member |
| `issues` | `(projectId, status)` | Kanban filter |
| `issues` | `(projectId, sprintId)` | Sprint filter |
| `issues` | `(projectId, priority)` | Priority filter |
| `issue_labels` | `(issueId, label)` (UNIQUE) | Tránh trùng label |
| `comments` | `issueId` | Load comments của issue |
| `activities` | `(projectId, createdAt DESC)` | Activity log |
| `activities` | `issueId` | Activity của issue |

### Cascade Rules

| Quan hệ | Hành động khi xoá |
|---------|------------------|
| Project bị xoá | → Cascade: sprints, issues, members, activities |
| Sprint bị xoá | → SetNull: `issues.sprintId` (issue về backlog) |
| Issue bị xoá | → Cascade: assignees, labels, comments, activities |
| User bị xoá | → Cascade: memberships, assignees |

---

## 📁 Cấu trúc thư mục

```
Trera/
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Prisma schema
│   │   └── migrations/            # Migration files
│   ├── config/
│   │   └── prisma.js              # Prisma Client singleton
│   ├── controllers/               # Route handlers
│   ├── src/
│   │   ├── router/                # Express routes
│   │   └── server.js              # Entry point
│   ├── middleware/                # Auth, projectAccess
│   ├── services/                  # emailService, etc.
│   └── .env                       # Environment variables
│
└── Frontend/
    ├── src/
    │   ├── pages/                 # Các trang chính
    │   ├── components/            # UI components
    │   ├── store/                 # Zustand stores
    │   └── lib/                   # Axios instance, utils
    └── ...
```

---

## ⚙️ Cài đặt & Chạy

### Yêu cầu
- Node.js ≥ 18
- PostgreSQL ≥ 14

### Backend

```bash
cd Backend

# Cài dependencies
npm install

# Cấu hình môi trường
cp .env.example .env
# Điền DATABASE_URL, JWT_SECRET, MAIL_* vào .env

# Chạy migration
npx prisma@5.22.0 migrate dev

# Khởi động server
npm run dev
```

### Frontend

```bash
cd Frontend

# Cài dependencies
pnpm install

# Khởi động
pnpm dev
```

### Prisma Studio (xem database trực quan)

```bash
cd Backend
npx prisma@5.22.0 studio --schema=prisma/schema.prisma
```

---

## 🔑 Environment Variables

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/trera?schema=public"

# Server
PORT=5001
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Email (Gmail App Password)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM="Trera <your_email@gmail.com>"
```

---

## 📡 API Endpoints

| Group | Base URL | Mô tả |
|-------|---------|-------|
| Auth | `/api/auth` | Đăng ký, đăng nhập, profile |
| Projects | `/api/projects` | CRUD project, quản lý member |
| Sprints | `/api/projects/:id/sprints` | Quản lý sprint |
| Issues | `/api/projects/:id/issues` | CRUD issue, reorder |
| Comments | `/api/issues/:id/comments` | Comment trên issue |

> Xem chi tiết tại file `API Design.xlsx`

---

## 📧 Email Notifications

| Sự kiện | Người nhận |
|---------|-----------|
| Đăng ký tài khoản | User mới |
| Được mời vào project | Người được mời |
| Được assign issue | Assignee mới |
| Comment mới trên issue | Assignees + Reporter |
| Status issue thay đổi | Tất cả assignees |