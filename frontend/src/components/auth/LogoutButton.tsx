import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "ghost" | "secondary" | "link";
  showIcon?: boolean;
  label?: string;
}

const LogoutButton = ({
  variant = "ghost",
  showIcon = true,
  label = "Đăng xuất",
}: LogoutButtonProps) => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/signin");
  };

  return (
    <Button variant={variant} onClick={handleLogout}>
      {showIcon && <LogOut className="size-4" />}
      {label}
    </Button>
  );
};

export default LogoutButton;
