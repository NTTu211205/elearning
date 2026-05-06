# PROJECT GUIDE — E-Learning

> Tài liệu tổng quan dự án. Viết dựa trên source code thực tế.

---

## 1. Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js (generator scaffold) |
| Primary DB | MySQL (promise pool via `mysql2`) |
| Secondary DB | MongoDB + Mongoose (cấu hình sẵn, chưa dùng nhiều) |
| Auth | JWT (`jsonwebtoken`), `bcryptjs` |
| Validation | `express-validator` (chỉ dùng ở user route) |
| Docs | Swagger UI (`swagger-ui-express`, `swagger-jsdoc`) |
| Mail | Nodemailer (`mailer.js` — cấu hình sẵn, chưa dùng) |
| CORS | `cors` package |
| Env | `dotenv` |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Routing | React Router v7 (`react-router`) |
| State | Zustand |
| HTTP | Axios |
| Forms | React Hook Form + Zod |
| UI components | Shadcn/ui style (custom) + Radix UI primitives |
| Styling | Tailwind CSS |
| Notifications | Sonner (toast) |
| Icons | Lucide React |

---

## 2. Cấu Trúc Thư Mục

```
Elearning/
├── backend/
│   ├── app.js                  # Express app, route mounting, middleware setup
│   ├── bin/www                 # HTTP server entry point
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── MySQLConnect.js     # Promise pool MySQL
│       │   └── MongoDBConnect.js   # Mongoose connect
│       ├── controllers/            # Request/response handlers
│       ├── middlewares/
│       │   ├── auth.middleware.js  # verifyToken, authorizeRole
│       │   ├── user.middleware.js  # express-validator rules
│       │   └── class.middleware.js # (hiện trống / chưa dùng)
│       ├── routes/                 # Express routers
│       ├── services/               # Business logic + DB queries
│       └── utils/
│           ├── swagger.js
│           └── mailer.js
│
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx                 # Route definitions
│       ├── main.tsx                # React root
│       ├── lib/
│       │   ├── axios.ts            # Axios instance + request interceptor
│       │   ├── tokenManager.ts     # In-memory access token store
│       │   └── roleRouting.ts      # Role → path mapping, JWT decode
│       ├── components/
│       │   ├── auth/               # ProtectedRoute, PublicRoute, etc.
│       │   ├── admin/layout/       # AdminLayout, AdminSidebar, AdminTopbar
│       │   ├── teacher/layout/     # TeacherLayout
│       │   └── ui/                 # Reusable UI components (Button, Input, etc.)
│       ├── pages/
│       │   ├── SignInPage.tsx
│       │   ├── ForgetPasswordPage.tsx
│       │   ├── Admin/
│       │   │   ├── AdminDashboard.tsx
│       │   │   ├── users/          # UserListPage + modals/
│       │   │   ├── subjects/       # SubjectListPage + modals/
│       │   │   └── classes/        # ClassListPage + modals/
│       │   ├── Teacher/            # TeacherDashboard, classes/, tests/, scores/
│       │   ├── Student/            # StudentDashboard
│       │   └── shared/             # SubmissionDetailPage
│       ├── services/               # API call functions (typed)
│       ├── stores/                 # Zustand stores
│       └── types/                  # TypeScript interfaces
│
└── databases/
    └── init.sql                    # DB schema + seed data
```

---

## 3. Luồng Đăng Nhập

```
[User nhập email/password]
        │
        ▼
[signin-form.tsx] → useAuthStore.signIn(email, password)
        │
        ▼
[authService.signIn()] → POST /auth/login
        │
        ▼
[auth.service.js]
  - Query MySQL: SELECT * FROM user WHERE email = ? AND status = 1
  - bcrypt.compare(password, hash)
  - generateToken(id, role, '1d')        → access token
  - generateToken(id, role, '30d')       → refresh token
  - INSERT INTO refresh_tokens (...)
  - Return { user, token, refreshToken }
        │
        ▼
[authService.signIn() nhận response]
  - localStorage.setItem('refreshToken', refreshToken)
  - return { user, accessToken: token }
        │
        ▼
[useAuthStore]
  - setToken(accessToken)  → lưu vào module-level biến trong tokenManager.ts
  - set({ accessToken, user })
        │
        ▼
[ProtectedRoute] nhận thấy accessToken có → render <Outlet />
[RoleHomeRedirect] → navigate đến /admin | /teacher | /student
```

---

## 4. Cơ Chế Refresh Token

### Khi nào refresh?
- `ProtectedRoute` và `PublicRoute` đều gọi `useAuthStore.refresh()` khi mount nếu **không có accessToken** (xảy ra khi F5 refresh trang, do accessToken chỉ lưu in-memory).

### Luồng refresh:
```
[ProtectedRoute/PublicRoute mount, accessToken = null]
        │
        ▼
useAuthStore.refresh()
        │
        ▼
authService.refresh()
  - Đọc oldRefreshToken từ localStorage
  - POST /auth/refresh-token { oldRefreshToken }
        │
        ▼
[auth.service.js]
  - jwt.verify(oldRefreshToken)
  - Query refresh_tokens table
  - Tạo newToken + newRefreshToken
  - DELETE old refresh token
  - INSERT new refresh token
  - Return { newToken, newRefreshToken }
        │
        ▼
[authService.refresh()]
  - localStorage.setItem('refreshToken', newRefreshToken)
  - return { accessToken: newToken }
        │
        ▼
[useAuthStore]
  - setToken(newToken)
  - GET /users/profile → set({ user })
```

### Lưu ý quan trọng:
- **Access token**: lưu in-memory (`tokenManager.ts`) — bị xóa khi reload trang.
- **Refresh token**: lưu `localStorage` — tồn tại qua reload.
- Axios interceptor tự gắn `Authorization: Bearer <token>` vào mọi request (`axios.ts`).
- Hiện tại **không có** response interceptor để tự động retry khi 401 — xử lý thủ công qua ProtectedRoute init.

---

## 5. Danh Sách Module Hiện Có

| Module | Backend route | Frontend page | Tính năng |
|---|---|---|---|
| Auth | `/auth` | SignInPage, ForgetPasswordPage | Login, logout, refresh token |
| User | `/users` | Admin/users/ | CRUD người dùng, soft delete |
| Subject | `/subject` | Admin/subjects/ | CRUD môn học, soft delete |
| Class | `/class` | Admin/classes/, Teacher/classes/ | CRUD lớp học |
| Enrollment | `/enrollment` | (qua class detail) | Ghi danh sinh viên vào lớp |
| Test | `/test` | Teacher/tests/ | CRUD đề thi |
| DoExam | (trong MongoDB) | shared/SubmissionDetailPage | Làm bài, nộp bài |
| Scores | — | Teacher/scores/ | Xem điểm |

---

## 6. Coding Convention

### Backend
- File name: `[entity].controller.js`, `[entity].service.js`, `[entity].route.js`
- Function name: camelCase — `createUser`, `getAllUser`, `deleteClass`
- Destructure từ `req.body` / `req.params` ngay đầu controller
- Không dùng `try/catch` ở service — throw Error trực tiếp, controller catch và trả 400
- SQL: dùng `db.execute(query, params)` — parameterized query (chống injection)

### Frontend
- File name: PascalCase cho component (`UserListPage.tsx`), camelCase cho util (`roleRouting.ts`)
- Service file: `[entity]Service.ts` — export một object constant với các async functions
- Store file: `use[Entity]Store.ts` — Zustand
- Type file: `[entity].ts` trong `/types/`
- Page pattern: 1 list page + thư mục `modals/` chứa các modal CRUD
- Import alias: `@/` trỏ vào `src/`

---

## 7. Cách Thêm Feature Mới

### Backend (ví dụ: thêm module `score`)
1. Tạo `src/services/score.service.js` — viết các hàm DB
2. Tạo `src/controllers/score.controller.js` — gọi service, trả response
3. Tạo `src/routes/score.route.js` — định nghĩa endpoints
4. Mount vào `app.js`: `app.use('/score', scoreRouter)`

### Frontend (ví dụ: thêm trang admin Score)
1. Tạo `src/types/score.ts` — định nghĩa interface
2. Tạo `src/services/scoreService.ts` — các hàm gọi API
3. (Nếu cần) Tạo `src/stores/useScoreStore.ts` — Zustand store
4. Tạo `src/pages/Admin/scores/ScoreListPage.tsx` — list page
5. Tạo `src/pages/Admin/scores/modals/` — các modal CRUD
6. Thêm route vào `App.tsx` trong `<Route element={<AdminLayout />}>`
7. Thêm nav item vào `AdminSidebar.tsx`
