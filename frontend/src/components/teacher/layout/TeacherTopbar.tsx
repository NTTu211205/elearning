import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/auth/UserMenu";

interface TeacherTopbarProps {
  onMenuClick: () => void;
}

const TeacherTopbar = ({ onMenuClick }: TeacherTopbarProps) => {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-sidebar-border bg-sidebar px-4">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
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

export default TeacherTopbar;
