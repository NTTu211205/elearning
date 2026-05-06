import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router";
import Loading from "@/components/ui/loading";
import { getDefaultPathByRole, getRoleFromAccessToken } from "@/lib/roleRouting";

const PublicRoute = () => {
    const { accessToken , loading, refresh, user} = useAuthStore();
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
        return <Loading />
    }

    if (accessToken) {
        const role = user?.role ?? getRoleFromAccessToken(accessToken);
        return <Navigate to={getDefaultPathByRole(role)} replace />
    }

    // Nếu chưa có accessToken, cho phép truy cập vào route con
    return <Outlet />
}
    
export default PublicRoute;