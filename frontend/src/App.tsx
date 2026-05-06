import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { useEffect } from "react";
import SignInPage from "./pages/SignInPage";
import ForgetPasswordPage from "./pages/ForgetPasswordPage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import UserListPage from "./pages/Admin/users/UserListPage";
import SubjectListPage from "./pages/Admin/subjects/SubjectListPage";
import AdminClassListPage from "./pages/Admin/classes/ClassListPage";
import StudentDashboard from "./pages/Student/StudentDashboard";
import StudentClassesPage from "./pages/Student/classes/StudentClassesPage";
import ExamPage from "./pages/Student/exam/ExamPage";
import ExamResultPage from "./pages/Student/exam/ExamResultPage";
import TeacherDashboard from "./pages/Teacher/TeacherDashboard";
import TestListPage from "./pages/Teacher/tests/TestListPage";
import TestEditorPage from "./pages/Teacher/tests/TestEditorPage";
import TestDetailPage from "./pages/Teacher/tests/TestDetailPage";
import ClassListPage from "./pages/Teacher/classes/ClassListPage";
import ClassDetailPage from "./pages/Teacher/classes/ClassDetailPage";
import StudentDetailPage from "./pages/Teacher/classes/StudentDetailPage";
import SubmissionDetailPage from "./pages/shared/SubmissionDetailPage";
import ProfilePage from "./pages/shared/ProfilePage";
import ChangePasswordPage from "./pages/shared/ChangePasswordPage";
import ScoresPage from "./pages/Teacher/scores/ScoresPage";
import AdminLayout from "./components/admin/layout/AdminLayout";
import TeacherLayout from "./components/teacher/layout/TeacherLayout";
import StudentLayout from "./components/student/layout/StudentLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import { Navigate } from "react-router";
import { useAuthStore } from "./stores/useAuthStore";
import { getDefaultPathByRole, getRoleFromAccessToken } from "./lib/roleRouting";

const RoleHomeRedirect = () => {
  const { accessToken, user } = useAuthStore();
  const role = user?.role ?? getRoleFromAccessToken(accessToken);

  return <Navigate to={getDefaultPathByRole(role)} replace />;
};

function App() {
  const clearState = useAuthStore((state) => state.clearState);

  useEffect(() => {
    const onSessionExpired = () => {
      clearState();
    };

    window.addEventListener("auth:session-expired", onSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", onSessionExpired);
    };
  }, [clearState]);

  return <>
  <Toaster richColors/>
  <BrowserRouter>
    <Routes>
      {/* public routes */}
      <Route element={<PublicRoute />}>
        <Route path='/signin' element={<SignInPage/>} />
        <Route path='/forget-password' element={<ForgetPasswordPage />} />
      </Route>

      {/* protected admin routes */}
      <Route element={<ProtectedRoute />}>
        <Route path='/' element={<RoleHomeRedirect />} />

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route element={<AdminLayout />}>
            <Route path='/admin' element={<AdminDashboard />} />
            <Route path='/admin/users' element={<UserListPage />} />
            <Route path='/admin/subjects' element={<SubjectListPage />} />
            <Route path='/admin/classes' element={<AdminClassListPage />} />
            <Route path='/admin/profile' element={<ProfilePage />} />
            <Route path='/admin/change-password' element={<ChangePasswordPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
          <Route element={<TeacherLayout />}>
            <Route path='/teacher' element={<TeacherDashboard />} />
            <Route path='/teacher/tests' element={<TestListPage />} />
            <Route path='/teacher/tests/:id' element={<TestDetailPage />} />
            <Route path='/teacher/classes' element={<ClassListPage />} />
            <Route path='/teacher/classes/:id' element={<ClassDetailPage />} />
            <Route path='/teacher/students/:classId/:studentId' element={<StudentDetailPage />} />
            <Route path='/teacher/submission/:classId/:studentId/:testId' element={<SubmissionDetailPage />} />
            <Route path='/teacher/scores' element={<ScoresPage />} />
            <Route path='/teacher/profile' element={<ProfilePage />} />
            <Route path='/teacher/change-password' element={<ChangePasswordPage />} />
          </Route>
          {/* Editor dùng full-screen layout riêng, không dùng TeacherLayout */}
          <Route path='/teacher/tests/new' element={<TestEditorPage />} />
          <Route path='/teacher/tests/:id/edit' element={<TestEditorPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          {/* Exam pages use full-screen layout (no sidebar) */}
          <Route path='/student/exam/:doexamId' element={<ExamPage />} />
          <Route path='/student/exam/:doexamId/result' element={<ExamResultPage />} />

          {/* Pages with StudentLayout sidebar */}
          <Route element={<StudentLayout />}>
            <Route path='/student' element={<StudentDashboard />} />
            <Route path='/student/classes' element={<StudentClassesPage />} />
            <Route path='/student/submission/:classId/:studentId/:testId' element={<SubmissionDetailPage />} />
            <Route path='/student/profile' element={<ProfilePage />} />
            <Route path='/student/change-password' element={<ChangePasswordPage />} />
          </Route>
        </Route>

        <Route path='*' element={<RoleHomeRedirect />} />
      </Route>
    </Routes>
  </BrowserRouter>
  </>
}

export default App
