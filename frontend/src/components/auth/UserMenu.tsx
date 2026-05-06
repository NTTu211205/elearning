import { DropdownMenu } from "radix-ui";
import { User, KeyRound, LogOut, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";

const menuItemClass =
  "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-muted focus:bg-muted select-none";

const UserMenu = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/signin");
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="User menu"
        >
          <UserAvatar name={user?.name} size="sm" />
          <span className="hidden sm:block text-foreground max-w-[140px] truncate">
            {user?.name ?? "Người dùng"}
          </span>
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-56 rounded-lg border border-border bg-card p-1 shadow-lg"
        >
          {/* Thông tin user */}
          {(user?.name || user?.email) && (
            <>
              <div className="px-3 py-2 mb-1">
                {user.name && (
                  <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                )}
                {user.email && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
            </>
          )}

          <DropdownMenu.Item
            className={menuItemClass}
            onSelect={() => {
              // TODO: navigate to profile page
            }}
          >
            <User className="size-4 shrink-0" />
            Thông tin cá nhân
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={menuItemClass}
            onSelect={() => {
              // TODO: open change password modal
            }}
          >
            <KeyRound className="size-4 shrink-0" />
            Đổi mật khẩu
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            className={cn(menuItemClass, "text-destructive focus:text-destructive focus:bg-destructive/10")}
            onSelect={handleLogout}
          >
            <LogOut className="size-4 shrink-0" />
            Đăng xuất
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default UserMenu;
