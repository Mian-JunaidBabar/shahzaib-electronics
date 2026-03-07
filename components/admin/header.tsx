"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useAuth } from "@/context/auth-context";

function formatLabel(segment: string) {
  const cleaned = segment.replace(/\[|\]/g, "").replace(/-/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export default function AdminHeader() {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  // const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleProfileClick = () => {
    router.push("/admin/dashboard/settings");
  };

  // Build breadcrumbs from the current path
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, idx) => ({
    href: "/" + segments.slice(0, idx + 1).join("/"),
    label: formatLabel(seg),
  }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLogout = () => {
    logout();
    window.location.href = "/admin/auth/login";
  };

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-slate-600"
        >
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center gap-2">
              {index > 0 && (
                <span className="material-symbols-outlined text-[14px]">
                  chevron_right
                </span>
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-sm font-semibold text-slate-900">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden sm:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-muted-foreground">
            search
          </span>
          <input
            className="h-9 w-64 rounded-md border border-border bg-muted/50 pl-9 pr-4 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            placeholder="Search..."
            type="text"
            aria-label="Search"
          />
        </div>

        {/* User Profile Button */}
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-2 p-1.5 rounded-full cursor-pointer"
        >
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name || "Avatar"}
              width={36}
              height={36}
              className="rounded-full object-cover flex-shrink-0"
              sizes="36px"
              priority={false}
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center">
              <span className="font-bold text-xs text-white">
                {user?.name?.charAt(0) || "A"}
              </span>
            </div>
          )}
          <span className="hidden sm:block text-sm font-medium text-foreground">
            {user?.name || "Admin"}
          </span>
        </button>
      </div>
    </header>
  );
}
