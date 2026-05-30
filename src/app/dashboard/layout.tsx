"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, ArrowLeftRight, Target, BarChart3, LogOut,
  Wallet, ArrowRightLeft, PieChart, Bell, Settings, Sun, Moon, Monitor
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

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const options = [
    { value: "light",  label: "Sáng",      icon: Sun },
    { value: "dark",   label: "Tối",       icon: Moon },
    { value: "system", label: "Hệ thống",  icon: Monitor },
  ] as const;

  const current = options.find(o => o.value === theme) || options[2];
  const CurrentIcon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
      >
        <CurrentIcon size={15} />
        <span className="flex-1 text-left">{current.label}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-20 py-1">
            {options.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => { setTheme(value); setOpen(false); }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors",
                  theme === value
                    ? "text-green-600 bg-green-50 dark:bg-green-900/30"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
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

  // Use ProfileContext so avatar updates immediately after saving in Settings
  const { avatar, name } = useProfile();

  // Fallback: session name/initial while profile loads
  const displayName = name || session?.user?.name || "";
  const displayAvatar = avatar;
  const displayInitial = displayName.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status]);

  function refreshUnread() {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setUnreadCount(data.filter((n: any) => !n.read).length);
      })
      .catch(() => {});
  }

  useEffect(() => {
    refreshUnread();
  }, [pathname]);

  // Listen for new notifications from scheduler
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

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">Spendy</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Quản lý tài chính</p>
            </div>
          </div>
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
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {isNotif && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
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
            {/* Avatar: show emoji if set, else initial letter */}
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center font-bold text-green-700 dark:text-green-400 text-sm shrink-0 select-none">
              {displayAvatar || displayInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-6 min-h-screen">
        {children}
      </main>
    </div>
  );
}
