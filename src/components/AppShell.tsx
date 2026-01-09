"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/products", label: "Products" },
  { href: "/dashboard/stores", label: "Stores" },
  { href: "/dashboard/stock", label: "Stock" }
];

export default function AppShell({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <Button variant="secondary" size="sm" onClick={() => setMobileOpen(true)}>
          Menu
        </Button>
        <div style={{ fontWeight: 700 }}>Enterprise</div>
        <Button variant="secondary" size="sm" onClick={onLogout}>
          Sign out
        </Button>
      </div>

      <aside className="sidebar">
        <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 18 }}>
          Enterprise
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          Inventory Admin
        </div>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${active ? "active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
        <div style={{ flex: 1 }} />
        <Button variant="secondary" onClick={onLogout}>
          Sign out
        </Button>
      </aside>

      <div
        className={`sidebar-backdrop ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside className={`sidebar sidebar-drawer ${mobileOpen ? "open" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 18 }}>
              Enterprise
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Inventory Admin
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setMobileOpen(false)}>
            Close
          </Button>
        </div>
        <div style={{ height: 12 }} />
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${active ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          );
        })}
        <div style={{ flex: 1 }} />
        <Button variant="secondary" onClick={onLogout}>
          Sign out
        </Button>
      </aside>

      <main className="main">
        <div className="page-container">{children}</div>
      </main>
    </div>
  );
}
