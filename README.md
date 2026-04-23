# 📚 E-Learning Platform

Hệ thống quản lý học tập trực tuyến (E-Learning) được xây dựng theo kiến trúc **3 tầng** với:
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MySQL 8.0 (dữ liệu quan hệ) + MongoDB Atlas (dữ liệu linh hoạt)

---

## 📁 Cấu trúc dự án

```
project/
├── backend/                  # Node.js + Express API server
│   ├── src/
│   │   ├── config/           # Cấu hình kết nối MySQL & MongoDB
│   │   ├── controllers/      # Xử lý logic request
│   │   ├── middlewares/      # Auth middleware (JWT)
│   │   ├── models/           # Data models
│   │   ├── routes/           # Định nghĩa API routes
│   │   ├── services/         # Business logic
│   │   └── utils/            # Swagger config & tiện ích
│   ├── Dockerfile
│   ├── app.js
│   └── package.json
├── frontend/                 # React + Vite client app
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
├── databases/
│   └── init.sql              # Schema khởi tạo MySQL
├── docker-compose.yml        # Cấu hình Docker toàn bộ stack
└── README.md
```

---

## 🗄️ Database Schema

Hệ thống sử dụng **hai cơ sở dữ liệu**:

### MySQL — `ElearningDatabase`
| Bảng | Mô tả |
|------|-------|
| `user` | Người dùng (admin, teacher, student) |
| `subject` | Môn học |
| `class` | Lớp học (liên kết subject & teacher) |
| `enrollment` | Đăng ký lớp học của sinh viên |
| `test` | Bài kiểm tra trong lớp |
| `doexam` | Lịch sử làm bài kiểm tra |
| `refresh_tokens` | JWT refresh token |

### MongoDB Atlas
Lưu trữ dữ liệu động và tài liệu phi cấu trúc (câu hỏi, kết quả chi tiết, v.v).

---

## 🚀 Cách chạy dự án

### Phương án 1 — Docker Compose (Khuyến nghị)

> ✅ Cách đơn giản nhất, không cần cài Node.js hay MySQL thủ công.

**Yêu cầu:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã được cài và đang chạy

**Các bước:**

```bash
# 1. Clone dự án
git clone <repository-url>
cd project

# 2. Khởi động toàn bộ stack
docker compose up --build
```

Sau khi khởi động thành công:

| Dịch vụ | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| API Docs (Swagger) | http://localhost:5000/api-docs |
| MySQL | localhost:3307 |

**Dừng dịch vụ:**
```bash
docker compose down
```

**Dừng và xóa toàn bộ dữ liệu (reset):**
```bash
docker compose down -v
```

---

### Phương án 2 — Chạy thủ công (Development Mode)

#### Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
|---------|---------------------|
| Node.js | v20+ |
| npm | v10+ |
| MySQL | v8.0 |
| Git | Bất kỳ |

#### Bước 1 — Khởi tạo MySQL Database

```bash
# Đăng nhập vào MySQL (nhập mật khẩu khi được hỏi)
mysql -u root -p

# Tạo database và chạy schema
CREATE DATABASE ElearningDatabase;
USE ElearningDatabase;
source /đường/dẫn/đến/project/databases/init.sql;
exit;
```

Hoặc dùng một lệnh:
```bash
mysql -u root -p ElearningDatabase < databases/init.sql
```

#### Bước 2 — Cài đặt và chạy Backend

```bash
cd backend

# Cài dependencies
npm install

# Tạo file .env từ mẫu
cp .env.example .env   # (nếu có) hoặc tạo file .env thủ công
```

Nội dung file `backend/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<mật_khẩu_mysql_của_bạn>
DB_NAME=ElearningDatabase
DB_PORT=3306
MONGODB_URI=<mongodb_connection_string>
JWT_SECRET=<chuỗi_bí_mật_tùy_chọn>
```

```bash
# Khởi động backend (development)
npm start
```

Backend sẽ chạy tại: **http://localhost:5000**

#### Bước 3 — Cài đặt và chạy Frontend

Mở terminal mới:

```bash
cd frontend

# Cài dependencies
npm install

# Khởi động frontend (development với HMR)
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:5173**

---

## 🌐 API Endpoints

### Authentication — `/auth`
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/auth/login` | Đăng nhập, nhận JWT |
| POST | `/auth/logout` | Đăng xuất |
| POST | `/auth/refresh-token` | Làm mới access token |

### Users — `/users`
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/users` | Lấy danh sách người dùng |
| GET | `/users/:id` | Lấy thông tin user |
| POST | `/users` | Tạo user mới |
| PUT | `/users/:id` | Cập nhật user |
| DELETE | `/users/:id` | Xóa user |

### Subjects — `/subject`
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/subject` | Lấy danh sách môn học |
| POST | `/subject` | Tạo môn học mới |
| PUT | `/subject/:id` | Cập nhật môn học |
| DELETE | `/subject/:id` | Xóa môn học |

### Classes — `/class`
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/class` | Lấy danh sách lớp học |
| POST | `/class` | Tạo lớp học mới |

> 📖 Xem đầy đủ tài liệu API tại: **http://localhost:5000/api-docs**

---

## 🔧 Biến môi trường

### Backend (`backend/.env`)

| Biến | Mô tả | Giá trị mặc định |
|------|-------|-----------------|
| `DB_HOST` | Host MySQL | `localhost` |
| `DB_USER` | User MySQL | `root` |
| `DB_PASSWORD` | Mật khẩu MySQL | _(bắt buộc)_ |
| `DB_NAME` | Tên database | `ElearningDatabase` |
| `DB_PORT` | Port MySQL | `3306` |
| `MONGODB_URI` | MongoDB connection string | _(bắt buộc)_ |
| `JWT_SECRET` | Khóa bí mật ký JWT | _(bắt buộc)_ |
| `PORT` | Port backend | `5000` |

---

## 🛠️ Script hữu ích

### Backend
```bash
cd backend
npm start          # Chạy production
```

### Frontend
```bash
cd frontend
npm run dev        # Chạy development (HMR)
npm run build      # Build production bundle
npm run preview    # Preview bản build
npm run lint       # Kiểm tra lỗi ESLint
```

### Docker
```bash
# Xem log các container
docker compose logs -f

# Xem log từng dịch vụ
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Rebuild một dịch vụ cụ thể
docker compose up --build backend

# Truy cập vào container MySQL
docker exec -it database mysql -u root -p
```

---

## ❗ Xử lý sự cố thường gặp

### Backend không kết nối được MySQL
- Kiểm tra MySQL đang chạy (`brew services list` trên macOS)
- Kiểm tra đúng `DB_HOST`, `DB_PORT`, `DB_PASSWORD` trong `.env`
- Nếu dùng Docker: đảm bảo service `db` healthy trước khi `backend` khởi động (đã được cấu hình `depends_on`)

### Lỗi "Access denied" MySQL
```bash
# Cấp quyền cho user root kết nối từ bất kỳ host
mysql -u root -p
ALTER USER 'root'@'%' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON ElearningDatabase.* TO 'root'@'%';
FLUSH PRIVILEGES;
```

### Frontend không gọi được API
- Kiểm tra Backend đang chạy tại port `5000`
- Kiểm tra cấu hình CORS trong `backend/app.js`
- Kiểm tra URL gọi API trong code frontend

### Port đã bị sử dụng
```bash
# Kiểm tra và kill process đang dùng port
lsof -ti:5000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
lsof -ti:3307 | xargs kill -9
```

---

## 🧰 Công nghệ sử dụng

| Thành phần | Công nghệ |
|-----------|-----------|
| Frontend | React 19, Vite 8 |
| Backend | Node.js 20, Express 4 |
| Cơ sở dữ liệu quan hệ | MySQL 8.0 |
| Cơ sở dữ liệu tài liệu | MongoDB Atlas |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| API Documentation | Swagger UI (swagger-jsdoc) |
| Containerization | Docker, Docker Compose |
