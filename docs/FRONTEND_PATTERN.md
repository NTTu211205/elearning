# FRONTEND PATTERN — E-Learning

> Patterns và conventions từ source code frontend thực tế.

---

## 1. Cấu Trúc Frontend

```
src/
├── App.tsx                 # Tất cả route definitions
├── main.tsx                # ReactDOM.render, providers
├── lib/
│   ├── axios.ts            # Axios instance + interceptor
│   ├── tokenManager.ts     # In-memory access token (module-level)
│   └── roleRouting.ts      # role → path, JWT payload decode
├── components/
│   ├── auth/               # ProtectedRoute, PublicRoute, UserMenu, etc.
│   ├── admin/layout/       # AdminLayout, AdminSidebar, AdminTopbar
│   ├── teacher/layout/     # TeacherLayout
│   └── ui/                 # button, input, label, loading, separator, etc.
├── pages/
│   ├── SignInPage.tsx
│   ├── Admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── [module]/
│   │   │   ├── [Module]ListPage.tsx   # trang chính
│   │   │   ├── constants.ts           # labels, colors, selectClass CSS
│   │   │   ├── schemas.ts             # Zod schemas + inferred types
│   │   │   └── modals/
│   │   │       ├── ModalBase.tsx      # ModalOverlay + ModalContent wrapper
│   │   │       ├── Create[X]Modal.tsx
│   │   │       ├── Edit[X]Modal.tsx
│   │   │       ├── [X]DetailModal.tsx
│   │   │       └── DeleteConfirmModal.tsx
│   ├── Teacher/...
│   ├── Student/...
│   └── shared/...
├── services/               # API call functions
├── stores/                 # Zustand stores
└── types/                  # TypeScript interfaces
```

---

## 2. Routing Pattern

### Định nghĩa trong `App.tsx`
```tsx
<BrowserRouter>
  <Routes>
    {/* Public: redirect nếu đã login */}
    <Route element={<PublicRoute />}>
      <Route path='/signin' element={<SignInPage />} />
    </Route>

    {/* Protected: redirect /signin nếu chưa login */}
    <Route element={<ProtectedRoute />}>
      <Route path='/' element={<RoleHomeRedirect />} />

      {/* Role-based: redirect về home nếu sai role */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path='/admin' element={<AdminDashboard />} />
          <Route path='/admin/users' element={<UserListPage />} />
          <Route path='/admin/subjects' element={<SubjectListPage />} />
          <Route path='/admin/classes' element={<AdminClassListPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
        <Route element={<TeacherLayout />}>
          <Route path='/teacher' element={<TeacherDashboard />} />
          {/* ... */}
        </Route>
      </Route>
    </Route>

    <Route path='*' element={<RoleHomeRedirect />} />
  </Routes>
</BrowserRouter>
```

### Quy tắc đặt path
- Admin: `/admin/[resource]` — ví dụ `/admin/users`, `/admin/subjects`
- Teacher: `/teacher/[resource]`
- Student: `/student/[resource]`
- Detail pages: `/teacher/classes/:id`, `/teacher/tests/:id`

---

## 3. Protected Route Pattern

### `ProtectedRoute.tsx`
```tsx
const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: Role[] }) => {
  const { accessToken, loading, refresh, user } = useAuthStore();
  const [isInitialization, setIsInitialization] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        if (!accessToken) await refresh(); // thử refresh nếu không có token
      } finally {
        setIsInitialization(false);
      }
    };
    init();
  }, [accessToken, refresh]);

  if (isInitialization || loading) return <Loading />;
  if (!accessToken) return <Navigate to="/signin" replace />;

  // Kiểm tra role
  const role = user?.role ?? getRoleFromAccessToken(accessToken);
  if (allowedRoles?.length && !allowedRoles.includes(role!)) {
    return <Navigate to={getDefaultPathByRole(role)} replace />;
  }

  return <Outlet />;
};
```

**Luồng:**
1. Mount → nếu không có `accessToken` → gọi `refresh()` (dùng refreshToken từ localStorage)
2. Sau refresh: nếu vẫn không có token → redirect `/signin`
3. Nếu có token nhưng sai role → redirect về trang home của role đó
4. Pass → render `<Outlet />`

### `PublicRoute.tsx`
- Logic tương tự nhưng ngược lại: nếu **đã có** `accessToken` → redirect về home của role.

---

## 4. Auth State Management

### Store: `useAuthStore.ts` (Zustand)
```ts
interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (token: string | null) => void;
  clearState: () => void;
  signIn: (email, password) => Promise<boolean>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}
```

### Token storage
| Token | Lưu ở đâu | Xóa khi nào |
|---|---|---|
| Access token | Module-level (`tokenManager.ts`) | Reload trang, logout |
| Refresh token | `localStorage` key `"refreshToken"` | Logout, refresh xong |

### `tokenManager.ts`
```ts
let _token: string | null = null;
export const setToken = (token: string | null) => { _token = token; };
export const getToken = () => _token;
```
- Axios interceptor đọc `getToken()` để gắn header — tránh circular import với store.

---

## 5. API Call Pattern

### Axios instance (`lib/axios.ts`)
```ts
const api = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000" : "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Service file pattern (`services/userService.ts`)
```ts
type ApiResponse<T> = { message: string; data: T };

export const userService = {
  getAll: async (): Promise<User[]> => {
    const res = await api.get<ApiResponse<User[]>>("/users");
    return res.data.data;
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    const res = await api.post<ApiResponse<User>>("/users", payload);
    return res.data.data;
  },

  update: async (id: number, payload: UpdateUserPayload): Promise<User> => {
    const res = await api.put<ApiResponse<User>>(`/users/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
```

**Quy tắc:**
- Export object constant (không dùng class)
- Generic `ApiResponse<T>` để unwrap `res.data.data`
- Define payload interface trong cùng file service, re-export nếu cần
- Không xử lý toast/error trong service — để store xử lý

---

## 6. Zustand Store Pattern

```ts
// stores/useSubjectStore.ts
interface SubjectState {
  subjects: Subject[];
  loading: boolean;
  filters: { search: string; status: "all" | "active" | "inactive" };

  fetchSubjects: () => Promise<void>;
  createSubject: (data: CreateSubjectPayload) => Promise<void>;
  updateSubject: (id: number, data: UpdateSubjectPayload) => Promise<void>;
  deleteSubject: (id: number) => Promise<void>;
  setFilters: (filters: Partial<SubjectFilters>) => void;
  getFilteredSubjects: () => Subject[];
}

export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: [],
  loading: false,
  filters: { search: "", status: "all" },

  fetchSubjects: async () => {
    set({ loading: true });
    try {
      const subjects = await subjectService.getAll();
      set({ subjects });
    } catch (error) {
      toast.error("Lỗi khi tải danh sách môn học");
    } finally {
      set({ loading: false });
    }
  },

  createSubject: async (data) => {
    set({ loading: true });
    try {
      const newSubject = await subjectService.create(data);
      set((state) => ({ subjects: [...state.subjects, newSubject] }));
      toast.success("Tạo môn học thành công");
    } catch {
      toast.error("Tạo môn học thất bại");
    } finally {
      set({ loading: false });
    }
  },
}));
```

**Quy tắc store:**
- `set({ loading: true })` trước async, `finally { set({ loading: false }) }`
- `toast.success/error` ở store, không ở component
- Update state optimistically sau create/update (thêm vào array, không re-fetch)
- `getFiltered[Entity]()` — selector function trong store thay vì useMemo ở component

---

## 7. CRUD Page Pattern

### List Page (`[Module]ListPage.tsx`)
```tsx
const SubjectListPage = () => {
  const { subjects, loading, filters, fetchSubjects, setFilters, getFilteredSubjects } = useSubjectStore();

  // Local state chỉ cho UI modal
  const [createOpen, setCreateOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const filteredSubjects = getFilteredSubjects();

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      {/* Toolbar: search + filter + action buttons — cùng 1 hàng */}
      {/* Table: thead + tbody */}
      {/* Modals */}
      <CreateSubjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditSubjectModal open={!!editSubject} onClose={() => setEditSubject(null)} subject={editSubject} />
      <DeleteConfirmModal open={!!deleteSubject} onClose={() => setDeleteSubject(null)} subject={deleteSubject} />
    </div>
  );
};
```

**Quy tắc:**
- State `null` = modal đóng, `object` = modal mở với data
- `open={!!editSubject}` — boolean từ nullable
- `onClose={() => setEditSubject(null)}` — reset về null để đóng

---

## 8. Form Handling Pattern

### Dùng React Hook Form + Zod

**Schema (`schemas.ts`):**
```ts
import { z } from "zod";

export const createSchema = z.object({
  name: z.string().min(2, "Tên môn học ít nhất 2 ký tự"),
  lessons: z.coerce.number().int("Phải là số nguyên").min(1, "Ít nhất 1"),
});

export type CreateFormValues = z.infer<typeof createSchema>;
```

**Modal form:**
```tsx
const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateFormValues>({
  resolver: zodResolver(createSchema),
  defaultValues: { name: "", lessons: 1 },
});

// Reset khi modal mở
useEffect(() => {
  if (open) reset({ name: "", lessons: 1 });
}, [open, reset]);

const onSubmit = async (data: CreateFormValues) => {
  await createSubject(data);
  onClose();
};

// Render
<form onSubmit={handleSubmit(onSubmit)}>
  <Input {...register("name")} />
  {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? "Đang tạo..." : "Tạo"}
  </Button>
</form>
```

**Quy tắc:**
- Schema và inferred types đặt trong `schemas.ts` cùng module
- `useEffect` reset form mỗi khi `open` thay đổi
- `isSubmitting` từ `formState` để disable nút tránh double submit
- Error message hiện ngay dưới field bằng `errors.[field].message`
- Dùng `z.coerce.number()` cho số (input HTML trả về string)

---

## 9. Modal Pattern

### `ModalBase.tsx` (wrapper chung)
```tsx
export function ModalContent({ children, title, description, onClose }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 animate-in fade-in-0" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
        {/* Header: title + close button */}
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
```

### Dùng trong modal
```tsx
<Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
  <ModalContent title="Thêm môn học" description="..." onClose={onClose}>
    {/* form content */}
  </ModalContent>
</Dialog.Root>
```

**Quy tắc:**
- `Dialog.Root` ở modal component, `ModalContent` wraps children
- `onOpenChange={(v) => !v && onClose()}` — đóng khi click overlay hoặc ESC
- Mỗi module có `ModalBase.tsx` riêng (copy từ module khác)

---

## 10. UI Component Pattern

### Shared components (`src/components/ui/`)
- `Button` — props: `variant` (`default`, `outline`, `destructive`), `size` (`sm`, `default`)
- `Input` — standard input, forward ref
- `Label` — for attribute
- `Loading` — spinner toàn màn hình (dùng trong ProtectedRoute)

### Select (native HTML)
Dùng `<select>` thông thường, style từ constant:
```ts
// constants.ts
export const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring";
```

### Tailwind conventions
- Layout: `flex flex-col gap-6` cho page
- Card: `rounded-xl border border-border bg-card p-6`
- Table: `rounded-lg border border-border overflow-hidden`
- Badge/tag: `inline-flex rounded-full px-2 py-0.5 text-xs font-medium`
- Muted text: `text-muted-foreground`
- Destructive: `text-destructive`, `hover:bg-destructive/10`

---

## 11. Cách Thêm Page Mới Đúng Style

Ví dụ: thêm trang `/admin/scores` cho admin.

### Bước 1: Thêm type
```ts
// src/types/score.ts
interface Score {
  id: number;
  studentId: number;
  testId: number;
  score: number;
}
export type { Score };
```

### Bước 2: Thêm service
```ts
// src/services/scoreService.ts
import api from "../lib/axios";
type ApiResponse<T> = { message: string; data: T };

export const scoreService = {
  getAll: async () => {
    const res = await api.get<ApiResponse<Score[]>>("/score");
    return res.data.data;
  },
};
```

### Bước 3: (Nếu cần) Thêm store
```ts
// src/stores/useScoreStore.ts
export const useScoreStore = create<ScoreState>((set, get) => ({
  scores: [],
  loading: false,
  fetchScores: async () => { /* ... */ },
}));
```

### Bước 4: Tạo page + modals
```
src/pages/Admin/scores/
  ScoreListPage.tsx
  constants.ts
  schemas.ts
  modals/
    ModalBase.tsx       ← copy từ subjects/modals/ModalBase.tsx
    CreateScoreModal.tsx
```

### Bước 5: Thêm route vào `App.tsx`
```tsx
import ScoreListPage from "./pages/Admin/scores/ScoreListPage";

// trong <Route element={<AdminLayout />}>
<Route path='/admin/scores' element={<ScoreListPage />} />
```

### Bước 6: Thêm nav item vào `AdminSidebar.tsx`
```tsx
const navItems = [
  { label: "Điểm số", icon: BarChart, to: "/admin/scores" },
];
```

---

## 12. Import Alias

Dùng `@/` thay vì relative path:
```ts
import { Button } from "@/components/ui/button";     // ✅
import { Button } from "../../../components/ui/button"; // ❌
```

Cấu hình trong `vite.config.ts` và `tsconfig.app.json`.
