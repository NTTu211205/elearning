import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard",    icon: LayoutDashboard, to: "/admin" },
  { label: "Người dùng",   icon: Users,           to: "/admin/users" },
  { label: "Môn học",      icon: BookOpen,        to: "/admin/subjects" },
  { label: "Lớp học",      icon: GraduationCap,   to: "/admin/classes" },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const AdminSidebar = ({ open, onClose, collapsed, onToggleCollapse }: AdminSidebarProps) => {
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
        {/* ── Header ── */}
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
        </div>

        {/* ── Nav ── */}
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
              end={item.to === "/admin"}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-lg py-2.5 text-sm font-medium transition-all",
                  collapsed ? "justify-center px-2" : "gap-3 px-3",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )
              }
            >
              <item.icon className="size-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div
          className={cn(
            "shrink-0 border-t border-sidebar-border",
            collapsed ? "flex items-center justify-center py-3 px-2" : "px-5 py-3"
          )}
        >
          {collapsed ? (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              title="Mở rộng"
            >
              <ChevronRight className="size-4" />
            </button>
          ) : (
            <p className="text-xs text-sidebar-foreground/40">Admin Panel v1.0</p>
          )}
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
