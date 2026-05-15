import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, Store } from "lucide-react";
import { Sidebar } from "../components/layout/sidebar";
import { ProductsProvider } from "../context/products-context";
import { AuthProvider, useAuth } from "../context/auth-context";
import { LoginScreen } from "../components/layout/login-screen";

function RootLayout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return <LoginScreen />;

  return (
    <ProductsProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex md:hidden items-center gap-3 px-4 py-3 shrink-0 bg-white border-b border-slate-200">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
              <Store size={14} className="text-white" />
            </div>
            <span className="font-semibold text-sm text-slate-800">POS System</span>
          </div>
        </div>

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed(c => !c)}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </ProductsProvider>
  );
}

function Root() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
}

export const Route = createRootRoute({ component: Root });
