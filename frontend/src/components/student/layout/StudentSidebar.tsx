import { NavLink } from "react-router";
import {
  LayoutDashboard,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard",  icon: LayoutDashboard, to: "/student" },
  { label: "Lớp học",    icon: GraduationCap,   to: "/student/classes" },
];

interface StudentSidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const StudentSidebar = ({ open, onClose, collapsed, onToggleCollapse }: StudentSidebarProps) => {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar",
          "transition-all duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:z-auto lg:translate-x-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-sidebar-border transition-all duration-300",
            collapsed ? "justify-center px-0" : "gap-2 px-5"
          )}
        >
          <GraduationCap className="size-6 text-sidebar-primary shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-base font-bold text-sidebar-foreground tracking-tight truncate">
                E-Learning
              </span>
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors shrink-0"
                title="Thu gọn"
              >
                <ChevronLeft className="size-4" />
              </button>
            </>
          )}
          {collapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              title="Mở rộng"
            >
              <ChevronRight className="size-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto py-4 space-y-0.5",
            collapsed ? "px-2" : "px-3"
          )}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/student"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  isActive && "bg-sidebar-accent text-sidebar-foreground",
                  collapsed && "justify-center px-2"
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="size-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default StudentSidebar;
