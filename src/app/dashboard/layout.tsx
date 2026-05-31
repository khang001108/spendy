"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, ArrowLeftRight, Target, BarChart3, LogOut,
  Wallet, ArrowRightLeft, PieChart, Bell, Settings, Sun, Moon,
  Monitor, X, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, useProfile } from "@/app/providers";

// Desktop sidebar — tất cả menu
const NAV_FULL = [
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

// Mobile bottom nav — 5 mục chính
const NAV_MOBILE = [
  { href: "/dashboard",               label: "Tổng quan", icon: LayoutDashboard },
  { href: "/dashboard/transactions",  label: "Giao dịch", icon: ArrowLeftRight },
  { href: "/dashboard/assets",        label: "Tài sản",   icon: Wallet },
  { href: "/dashboard/goals",         label: "Mục tiêu",  icon: Target },
  { href: "/dashboard/settings",      label: "Cài đặt",   icon: Settings },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const opts = [
    { value: "light",  label: "Sáng",     icon: Sun },
    { value: "dark",   label: "Tối",      icon: Moon },
    { value: "system", label: "Hệ thống", icon: Monitor },
  ] as const;
  const cur = opts.find(o => o.value === theme) || opts[2];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
        <cur.icon size={15} />
        <span className="flex-1 text-left">{cur.label}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-20 py-1">
            {opts.map(({ value, label, icon: Icon }) => (
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { avatar, name } = useProfile();

  const displayName = name || session?.user?.name || "";
  const displayInitial = displayName.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status]);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  function refreshUnread() {
    fetch(`/api/notifications?t=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setUnreadCount(data.filter((n: any) => !n.read).length);
      }).catch(() => {});
  }
  useEffect(() => { refreshUnread(); }, [pathname]);
  useEffect(() => {
    window.addEventListener("spendy:notif_update", refreshUnread);
    return () => window.removeEventListener("spendy:notif_update", refreshUnread);
  }, []);

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-4xl animate-bounce">💰</div>
    </div>
  );

  // ── Desktop Sidebar ──────────────────────────────────────────────────────
  const DesktopSidebar = (
    <aside className="hidden md:flex w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col fixed h-full z-20">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
        <span className="text-3xl">💰</span>
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">Spendy</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Quản lý tài chính</p>
        </div>
      </div>
      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_FULL.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 hover:translate-x-0.5"
              )}>
              <Icon size={17} className={cn("shrink-0 transition-all duration-200", active ? "scale-110" : "scale-100")} />
              <span className="flex-1 truncate">{label}</span>
              {href === "/dashboard/notifications" && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unreadCount}</span>
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
            {avatar || displayInitial}
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
    </aside>
  );

  // ── Mobile Drawer (slide từ trái) ────────────────────────────────────────
  const MobileDrawer = drawerOpen ? (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
      {/* Drawer panel */}
      <div className="relative w-72 max-w-[80vw] bg-white dark:bg-gray-900 flex flex-col h-full shadow-2xl animate-[slide-in-left_0.25s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-gray-900 dark:text-white">Spendy</span>
          </div>
          <button onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* All nav items */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_FULL.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={cn("flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}>
                <Icon size={18} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {href === "/dashboard/notifications" && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + theme + logout */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <ThemeToggle />
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center font-bold text-green-700 dark:text-green-400 text-sm shrink-0">
              {avatar || displayInitial}
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
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {DesktopSidebar}
      {MobileDrawer}

      {/* ── MOBILE LAYOUT ── */}
      <div className="md:hidden flex flex-col h-screen">
        {/* Top bar — fixed height 52px */}
        <header className="shrink-0 h-13 flex items-center justify-between px-3 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
          >
            <span className="text-xl">💰</span>
            <span className="font-bold text-gray-900 dark:text-white text-base">Spendy</span>
          </button>

          <div className="flex items-center gap-1">
            <Link href="/dashboard/notifications"
              className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Bell size={20} className="text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center font-bold text-green-700 dark:text-green-400 text-xs">
              {avatar || displayInitial}
            </div>
          </div>
        </header>

        {/* Content — scroll area, chiếm hết không gian còn lại */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-3 pb-4">
            {children}
          </div>
        </main>

        {/* Bottom nav — fixed 56px */}
        <nav className="shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-stretch">
          {NAV_MOBILE.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative",
                  "transition-all duration-200",
                  active
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400 dark:text-gray-500"
                )}>
                <div className={cn(
                  "relative transition-all duration-200",
                  active ? "scale-110" : "scale-100"
                )}>
                  <Icon
                    size={21}
                    className={cn(
                      "transition-all duration-300",
                      active ? "stroke-[2.5px]" : "stroke-[1.75px]"
                    )}
                  />
                </div>
                <span className={cn(
                  "text-[10px] font-medium leading-none transition-all duration-200",
                  active ? "text-green-600 dark:text-green-400 font-semibold" : "text-gray-400 dark:text-gray-500"
                )}>
                  {label}
                </span>
                <span className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-green-500 rounded-full transition-all duration-300",
                  active ? "w-8 opacity-100" : "w-0 opacity-0"
                )} />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:block md:ml-60">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
