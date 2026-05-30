"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, ArrowLeftRight, Target, BarChart3, LogOut,
  User, Wallet, ArrowRightLeft, PieChart, Bell, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status]);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUnreadCount(data.filter((n: any) => !n.read).length);
        }
      }).catch(() => {});
  }, [pathname]);

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-bounce">💰</div>
    </div>
  );

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <p className="font-bold text-gray-900 text-lg leading-tight">Spendy</p>
              <p className="text-xs text-gray-400">Quản lý tài chính</p>
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
                  active ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-sm">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors">
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
