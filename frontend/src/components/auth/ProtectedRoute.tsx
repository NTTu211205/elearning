import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import Loading from "../ui/loading";
import { getDefaultPathByRole, getRoleFromAccessToken } from "@/lib/roleRouting";
import type { Role } from "@/types/user";

type ProtectedRouteProps = {
  allowedRoles?: Role[];
};

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { accessToken, loading, refresh, user } = useAuthStore();
  const [isInitialization, setIsInitialization] = useState(true);

  useEffect(() => {
    // có thể xảy ra khi refresh trang
    const init = async () => {
            try {
                if (!accessToken) {
                    await refresh();
                }   
            } finally {
                setIsInitialization(false);
            }
        }
    init();
  }, [accessToken, refresh]);

  if (isInitialization || loading) {
    return <Loading />;
  }

  if (!accessToken) {
    return <Navigate to="/signin" replace />;
  }

  const role = user?.role ?? getRoleFromAccessToken(accessToken);
  if (allowedRoles?.length && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={getDefaultPathByRole(role)} replace />;
  }

  // Nếu đã có accessToken, cho phép truy cập vào route con
  return <Outlet />;
};

export default ProtectedRoute;