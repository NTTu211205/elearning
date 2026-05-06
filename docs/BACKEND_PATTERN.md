# BACKEND PATTERN — E-Learning

> Patterns và conventions từ source code backend thực tế.

---

## 1. Kiến Trúc Tổng Quan

```
Request
  │
  ▼
app.js          ← mount routes, global middleware (cors, json, cookieParser)
  │
  ▼
routes/         ← định nghĩa endpoints, gắn middleware, gọi controller
  │
  ▼
middlewares/    ← auth check, validation (chạy trước controller)
  │
  ▼
controllers/    ← destructure req, gọi service, trả res
  │
  ▼
services/       ← business logic + truy vấn DB trực tiếp (không có repo layer riêng)
  │
  ▼
MySQLConnect.js ← promise pool (mysql2)
```

**Không có repository layer** — service gọi `db.execute()` trực tiếp.

---

## 2. Route → Controller → Service Flow

### Route (`src/routes/class.route.js`)
```js
router.post('/', classController.addClass);
router.get('/', classController.getAllClass);
router.get('/teacher/:teacherId', classController.getClassByTeacher);
router.get('/:id', classController.getClass);
router.put('/:id', classController.update);
router.delete('/:id', classController.deleteClass);
```
- Dùng Express Router
- Gắn middleware **trước** controller nếu cần: `router.post('/', verifyToken, authorizeRole('admin'), controller.fn)`
- **Hiện tại**: hầu hết routes đang bỏ middleware để test (commented out)

### Controller (`src/controllers/class.controller.js`)
```js
const addClass = async (req, res) => {
    try {
        const { subjectId, teacherId, quantity, name, status } = req.body;
        const result = await classService.createClass({ subjectId, teacherId, quantity, name, status });
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
```
- Luôn dùng `try/catch`
- Destructure params từ `req.body`, `req.params`, `req.query` ngay đầu hàm
- Gọi service, không có logic nghiệp vụ ở đây
- Thành công: `res.status(200).json({ message: 'Success', data: result })`
- Lỗi: `res.status(400).json({ message: error.message })`

### Service (`src/services/class.service.js`)
```js
const createClass = async (classData) => {
    const { subjectId, teacherId, quantity, name, status } = classData;

    // validate
    const subject = await subjectService.getSubject(subjectId);
    if (!subject) throw new Error('Subject not valid');

    const teacher = await userService.getTeacherById(teacherId);
    if (!teacher) throw new Error('Teacher not valid');

    const [newClass] = await db.execute(
        'INSERT INTO class(subject_id, teacher_id, quantity, name, status) VALUES (?, ?, ?, ?, ?)',
        [subjectId, teacherId, quantity, name, status ?? 'active']
    );

    return { id: newClass.insertId, subjectId, teacherId, quantity, name, status: status ?? 'active' };
};
```
- **Throw Error** trực tiếp khi validate thất bại — controller sẽ catch
- Không bao `try/catch` trong service (trừ auth.service vì cần phân biệt loại JWT error)
- Gọi service khác để validate (cross-service dependency)
- Trả về object data sạch (không trả raw DB row nếu không cần)

---

## 3. Response Format

### Thành công
```json
{
  "message": "Success",
  "data": { ... }
}
```

### Lỗi
```json
{
  "message": "Error message mô tả lỗi"
}
```

### HTTP Status codes
| Tình huống | Status |
|---|---|
| Thành công | `200` |
| Lỗi input / business logic | `400` |
| Chưa đăng nhập (token missing) | `401` |
| Không có quyền (wrong role) | `403` |
| Không tìm thấy (route không tồn tại) | `404` |
| Lỗi server | `500` (qua error handler trong app.js) |

---

## 4. Middleware Auth

### `verifyToken` — xác thực JWT
```js
// auth.middleware.js
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: "Token not found" });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, role, iat, exp }
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError')
            return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
        return res.status(403).json({ message: "Token invalid" });
    }
};
```
- Sau khi pass, `req.user` có `{ id, role }`

### `authorizeRole(...roles)` — phân quyền theo role
```js
const authorizeRole = (...allowedRole) => (req, res, next) => {
    if (!allowedRole.includes(req.user.role))
        return res.status(403).json({ message: "Not permission" });
    next();
};
```

### Cách dùng trong route
```js
// Chỉ admin mới xóa được user
router.delete('/:id', verifyToken, authorizeRole('admin'), userController.deleteUser);

// Teacher hoặc admin
router.post('/', verifyToken, authorizeRole('teacher', 'admin'), testController.addTest);
```

---

## 5. Validation Pattern

### Dùng `express-validator` (chỉ có ở `user.middleware.js`)
```js
const userCreationValidation = [
    body('name').trim().notEmpty().withMessage('Name is not null'),
    body('email').trim().isEmail().withMessage('Email is not valid'),
    body('role').trim().isIn(['student', 'teacher', 'admin']).withMessage('Role is not valid'),
    body('password').trim().isLength({ min: 6 }).withMessage('Password must have at least 6 characters'),
    body('phone').trim().isLength({ min: 10, max: 10 }).isNumeric(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ message: errors.array()[0].msg });
        next();
    }
];
```

### Validation thủ công trong service (phổ biến hơn)
```js
const teacher = await userService.getTeacherById(teacherId);
if (!teacher) throw new Error('Teacher not valid');
```
- Các module khác (class, subject, test, enrollment) dùng throw Error trong service thay vì middleware validation.

---

## 6. Error Handling Pattern

### Trong service: throw Error
```js
if (result.affectedRows === 0) throw new Error('Class not found');
```

### Trong controller: catch và trả 400
```js
catch (error) {
    res.status(400).json({ message: error.message });
}
```

### Global error handler (app.js)
```js
app.use(function(err, req, res, next) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
});
```
- Catch lỗi 404 route không tồn tại → `next(createError(404))`

---

## 7. Database Pattern

### MySQL Connection (`config/MySQLConnect.js`)
- Dùng `mysql2/promise` — tất cả query là async/await
- `db.execute(sql, params)` — parameterized (chống SQL injection)
- Trả về `[rows, fields]` — thường destructure lấy `[result]`

```js
const [result] = await db.execute('SELECT * FROM user WHERE id = ?', [id]);
// result là array rows hoặc OkPacket
```

### Soft Delete vs Hard Delete
| Entity | Pattern |
|---|---|
| User | Soft delete: `UPDATE user SET status = 0` |
| Subject | Soft delete: `UPDATE subject SET status = 0` |
| Class | Hard delete: `DELETE FROM class` |
| Test | Hard delete: `DELETE FROM test` |
| Refresh token | Hard delete: `DELETE FROM refresh_tokens` |

### Cross-service calls
```js
// enrollment.service.js gọi user.service.js và class.service.js để validate
const user = await userService.getUserById(studentId);
await classService.getClassById(classId);
```

---

## 8. Naming Convention

| Thứ | Convention | Ví dụ |
|---|---|---|
| File | `[entity].[layer].js` | `user.service.js`, `class.controller.js` |
| Function service create | `create[Entity]` | `createClass`, `createUser` |
| Function service read | `get[Entity]ById`, `getAll[Entity]` | `getClassById`, `getAllUser` |
| Function service update | `update[Entity]` | `updateClass` |
| Function service delete | `delete[Entity]` | `deleteClass` |
| Controller | `add[Entity]`, `get[Entity]`, `update`, `delete[Entity]` | `addClass`, `getClass` |
| Route params | camelCase | `teacherId`, `classId` |
| DB columns | snake_case | `subject_id`, `teacher_id`, `createdAt` |
| Body params | camelCase | `subjectId`, `teacherId` |

---

## 9. Route Naming (app.js mounts)

| Entity | Mount path |
|---|---|
| User | `/users` |
| Auth | `/auth` |
| Subject | `/subject` ← singular |
| Class | `/class` ← singular |
| Enrollment | `/enrollment` |
| Test | `/test` |

> **Quan trọng**: Backend dùng **singular** (`/class`, `/subject`, `/test`). Frontend phải gọi đúng.

---

## 10. Cách Tạo Module Mới

Ví dụ thêm module `notification`:

```
1. src/services/notification.service.js
   - createNotification(data)
   - getNotificationsByUser(userId)
   - markAsRead(id)
   - deleteNotification(id)

2. src/controllers/notification.controller.js
   - addNotification(req, res)
   - getNotifications(req, res)
   - markRead(req, res)
   - deleteNotification(req, res)

3. src/routes/notification.route.js
   - router.post('/', verifyToken, notificationController.addNotification)
   - router.get('/:userId', verifyToken, notificationController.getNotifications)

4. app.js
   - const notificationRouter = require('./src/routes/notification.route')
   - app.use('/notification', notificationRouter)
```

**Template controller:**
```js
const notificationService = require('../services/notification.service');

const addNotification = async (req, res) => {
    try {
        const { userId, message } = req.body;
        const result = await notificationService.createNotification({ userId, message });
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
```

**Template service:**
```js
const db = require('../config/MySQLConnect');

const createNotification = async ({ userId, message }) => {
    const [result] = await db.execute(
        'INSERT INTO notification (user_id, message) VALUES (?, ?)',
        [userId, message]
    );
    return { id: result.insertId, userId, message };
};
```
