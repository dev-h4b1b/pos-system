import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart2, ChevronLeft, ChevronRight, LayoutGrid, LogOut, Package, Receipt, Settings, Store, X } from "lucide-react";
import { useAuth } from "../../context/auth-context";
import type { Role } from "../../context/auth-context";
import { cn } from "../../lib/utils";

const allNavItems = [
  { to: "/", icon: LayoutGrid, label: "Terminal", exact: true, roles: ["user"] as Role[] },
  { to: "/orders", icon: Receipt, label: "Orders", exact: false, roles: ["user", "admin"] as Role[] },
  { to: "/products", icon: Package, label: "Products", exact: false, roles: ["admin"] as Role[] },
  { to: "/reports", icon: BarChart2, label: "Reports", exact: false, roles: ["admin"] as Role[] },
  { to: "/settings", icon: Settings, label: "Settings", exact: false, roles: ["admin"] as Role[] },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function NavContent({ collapsed, onLinkClick }: { collapsed: boolean; onLinkClick?: () => void }) {
  const { user, logout } = useAuth();
  const { location } = useRouterState();
  const role = user?.role ?? "user";
  const navItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-2.5 border-b border-slate-100">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
            style={role === "admin"
              ? { backgroundColor: "#eef2ff", color: "#4338ca" }
              : { backgroundColor: "#f1f5f9", color: "#475569" }}
          >
            {role}
          </span>
          <span className="ml-2 text-xs text-slate-400">{user?.username}</span>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, exact }) => {
          const isActive = exact
            ? location.pathname === to
            : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact }}
              title={collapsed ? label : undefined}
              onClick={onLinkClick}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-slate-100">
        <button
          onClick={logout}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "flex w-full items-center rounded-lg text-sm font-medium transition-colors text-slate-500 hover:bg-slate-100 hover:text-slate-700",
            collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
        {!collapsed && (
          <p className="text-xs mt-2 px-3 text-slate-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        )}
      </div>
    </>
  );
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* ── Mobile overlay drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            onClick={onMobileClose}
          />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col bg-white border-r border-slate-200">
            <div className="flex items-center justify-between px-4 py-4 shrink-0 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                  <Store size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight text-slate-800">POS System</p>
                  <p className="text-xs text-slate-400">Tech Shop</p>
                </div>
              </div>
              <button
                onClick={onMobileClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            <NavContent collapsed={false} onLinkClick={onMobileClose} />
          </aside>
        </div>
      )}

      {/* ── Desktop static sidebar ── */}
      <aside
        className="hidden md:flex flex-col shrink-0 bg-white border-r border-slate-200 transition-all duration-300"
        style={{ width: collapsed ? "64px" : "224px" }}
      >
        {/* Header */}
        <div
          className="flex items-center px-3 py-4 shrink-0 border-b border-slate-100"
          style={{ justifyContent: collapsed ? "center" : "space-between" }}
        >
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                <Store size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight text-slate-800 truncate">POS System</p>
                <p className="text-xs text-slate-400 truncate">Tech Shop</p>
              </div>
            </div>
          )}
          <button
            onClick={onToggle}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 text-slate-400"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <NavContent collapsed={collapsed} />
      </aside>
    </>
  );
}
