import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/auth/UserMenu";

interface AdminTopbarProps {
  onMenuClick: () => void;
}

const AdminTopbar = ({ onMenuClick }: AdminTopbarProps) => {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-[var(--topbar-border)] bg-[var(--topbar)] px-4 text-[var(--topbar-foreground)]">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-[var(--topbar-foreground)] opacity-80 hover:bg-[var(--topbar-accent)] hover:opacity-100"
        onClick={onMenuClick}
        aria-label="Mở menu"
      >
        <Menu className="size-5" />
      </Button>

      <div className="flex-1" />

      <UserMenu />
    </header>
  );
};

export default AdminTopbar;
