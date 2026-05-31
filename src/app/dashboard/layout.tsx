"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, ArrowLeftRight, Target, BarChart3, LogOut,
  Wallet, ArrowRightLeft, PieChart, Bell, Settings, Sun, Moon,
  Monitor, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, useProfile } from "@/app/providers";

const NAV = [
  { href: "/dashboard",               label: "Tổng quan",    icon: LayoutDashboard },
  { href: "/dashboard/transactions",  label: "Giao dịch",    icon: ArrowLeftRight },
  { href: "/dashboard/assets",        label: "Tài sản",      icon: Wallet },
  { href: "/dashboard/transfers",     label: "Chuyển khoản", icon: ArrowRightLeft },
  { href: "/dashboard/budget",        label: "Ngân sách",    icon: PieChart },
  { href: "/dashboard/goals",         label: "Mục tiêu",     icon: Target },
  { href: "/dashboard/stats",         label: "Thống kê",     icon: BarChart3 },
  { href: "/dashboard/notifications", label: "Thông báo",    icon: Bell },
  { href: "/dashboard/settings",      label: "Cài đặt",      icon: Settings },
];

// Mobile bottom nav chỉ hiện 5 mục quan trọng nhất
const MOBILE_NAV = [
  { href: "/dashboard",               label: "Tổng quan", icon: LayoutDashboard },
  { href: "/dashboard/transactions",  label: "Giao dịch", icon: ArrowLeftRight },
  { href: "/dashboard/assets",        label: "Tài sản",   icon: Wallet },
  { href: "/dashboard/notifications", label: "Thông báo", icon: Bell },
  { href: "/dashboard/settings",      label: "Cài đặt",   icon: Settings },
];

function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const options = [
    { value: "light",  label: "Sáng",     icon: Sun },
    { value: "dark",   label: "Tối",      icon: Moon },
    { value: "system", label: "Hệ thống", icon: Monitor },
  ] as const;

  const current = options.find(o => o.value === theme) || options[2];
  const CurrentIcon = current.icon;

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
        <CurrentIcon size={15} />
        {!collapsed && <span className="flex-1 text-left">{current.label}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-20 py-1">
            {options.map(({ value, label, icon: Icon }) => (
              <button key={value} onClick={() => { setTheme(value); setOpen(false); }}
                className={cn("flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors",
                  theme === value
                    ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}>
                <Icon size={15} /> {label}
                {theme === value && <span className="ml-auto text-green-500">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { avatar, name } = useProfile();

  const displayName = name || session?.user?.name || "";
  const displayAvatar = avatar;
  const displayInitial = displayName.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status]);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  function refreshUnread() {
    fetch(`/api/notifications?t=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setUnreadCount(data.filter((n: any) => !n.read).length);
      }).catch(() => {});
  }

  useEffect(() => { refreshUnread(); }, [pathname]);
  useEffect(() => {
    const handler = () => refreshUnread();
    window.addEventListener("spendy:notif_update", handler);
    return () => window.removeEventListener("spendy:notif_update", handler);
  }, []);

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-4xl animate-bounce">💰</div>
    </div>
  );

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
        <span className="text-3xl shrink-0">💰</span>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">Spendy</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Quản lý tài chính</p>
        </div>
        {/* Close button on mobile */}
        <button onClick={() => setMobileMenuOpen(false)}
          className="ml-auto p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden">
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const isNotif = href === "/dashboard/notifications";
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              )}>
              <Icon size={17} className="shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {isNotif && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
        <ThemeToggle />
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center font-bold text-green-700 dark:text-green-400 text-sm shrink-0">
            {displayAvatar || displayInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
          <LogOut size={16} /> Đăng xuất
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col fixed h-full z-20">
        <SidebarContent />
      </aside>

      {/* ── MOBILE: Hamburger button ── */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800">
        <Menu size={20} className="text-gray-700 dark:text-gray-300" />
      </button>

      {/* ── MOBILE: Slide-in drawer ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-gray-900 flex flex-col h-full shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 md:ml-60 min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden h-14 flex items-center justify-center border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
          <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>💰</span> Spendy
          </span>
          {unreadCount > 0 && (
            <Link href="/dashboard/notifications"
              className="absolute right-4 p-2 text-gray-500 dark:text-gray-400">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Link>
          )}
        </div>

        <div className="p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-nav">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const isNotif = href === "/dashboard/notifications";
          return (
            <Link key={href} href={href} className={cn("mobile-nav-item", active && "active")}>
              <div className="relative">
                <Icon size={22} />
                {isNotif && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
              <span className="mobile-nav-label">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
