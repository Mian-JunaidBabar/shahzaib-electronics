"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import SignOutButton from "@/components/admin/sign-out-button";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    section: "Management",
    items: [
      { href: "/admin/dashboard", icon: "dashboard", label: "Dashboard" },
      {
        href: "/admin/dashboard/orders",
        icon: "shopping_cart",
        label: "Orders",
      },
      {
        href: "/admin/dashboard/bookings",
        icon: "calendar_today",
        label: "Bookings",
      },
      {
        href: "/admin/dashboard/inventory",
        icon: "inventory_2",
        label: "Inventory",
      },
      {
        href: "/admin/dashboard/categories",
        icon: "category",
        label: "Categories",
      },
      {
        href: "/admin/dashboard/services",
        icon: "build",
        label: "Services",
      },
      {
        href: "/admin/dashboard/customers",
        icon: "people",
        label: "Customers",
      },
    ],
  },
  {
    section: "Configuration",
    items: [
      { href: "/admin/dashboard/team", icon: "group", label: "Team" },
      {
        href: "/admin/dashboard/settings",
        icon: "settings",
        label: "Settings",
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "border-r border-border bg-white hidden md:flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 overflow-hidden"
        >
          <span className="material-symbols-outlined text-[24px]! text-primary shrink-0">
            directions_car
          </span>
          {!isCollapsed && (
            <h2 className="text-foreground text-lg font-bold tracking-tight whitespace-nowrap">
              Shahzaib Autos
            </h2>
          )}
        </Link>
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-gray-100 transition-colors shrink-0"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-2 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((section) => (
          <div key={section.section}>
            {!isCollapsed && (
              <div className="px-3 mb-2 mt-4 first:mt-0 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {section.section}
              </div>
            )}
            {isCollapsed && <div className="h-2" />}
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isCollapsed && "justify-center px-2",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:text-slate-900 hover:bg-gray-100",
                )}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* User info + Sign Out */}
      <div
        className={cn(
          "p-4 border-t border-border space-y-3",
          isCollapsed && "p-2",
        )}
      >
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-sm font-bold text-primary">
                  {user?.name?.charAt(0) || "A"}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-slate-900 truncate">
                  {user?.name || "Admin User"}
                </span>
                <span className="text-xs text-slate-500 truncate">
                  {user?.email || "admin@shahzaibautos.com"}
                </span>
              </div>
            </div>
            <SignOutButton />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              <span className="text-sm font-bold text-primary">
                {user?.name?.charAt(0) || "A"}
              </span>
            </div>
            <SignOutButton collapsed />
          </div>
        )}
      </div>
    </aside>
  );
}
