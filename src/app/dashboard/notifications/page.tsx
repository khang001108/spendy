"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff, Check, CheckCheck, Trash2 } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

const TYPE_ICONS: Record<string, string> = {
  expense_reminder: "💳",
  goal: "🎯",
  budget_warning: "⚠️",
  bill: "📋",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetch("/api/notifications").then(r => r.json()).catch(() => []);
    setNotifications(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Auto-refresh khi có thông báo mới từ scheduler
    const handler = () => load();
    window.addEventListener("spendy:notif_update", handler);
    return () => window.removeEventListener("spendy:notif_update", handler);
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    load();
    window.dispatchEvent(new Event("spendy:notif_update"));
  }

  async function markAllRead() {
    await fetch("/api/notifications/all", { method: "PATCH" });
    load();
    // Cập nhật badge trên sidebar ngay lập tức
    window.dispatchEvent(new Event("spendy:notif_update"));
  }

  async function deleteNotif(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    load();
    window.dispatchEvent(new Event("spendy:notif_update"));
  }

  async function clearAll() {
    if (!confirm("Xóa tất cả thông báo?")) return;
    await fetch("/api/notifications/all", { method: "DELETE" });
    load();
    window.dispatchEvent(new Event("spendy:notif_update"));
  }

  const unread = notifications.filter(n => !n.read).length;

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date);
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell size={22} /> Thông báo
            {unread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread}</span>
            )}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Nhắc nhở và cảnh báo tài chính</p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
              <CheckCheck size={16} /> Đọc tất cả
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="btn-secondary flex items-center gap-2 text-sm text-red-500 hover:text-red-600">
              <Trash2 size={16} /> Xóa tất cả
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-16">
          <BellOff size={48} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
          <p className="font-medium text-gray-600 dark:text-gray-400">Không có thông báo</p>
          <p className="text-sm mt-1 text-gray-400 dark:text-gray-500">
            Thông báo sẽ hiển thị khi bạn lưu cài đặt thông báo hoặc vượt ngân sách
          </p>
          <a href="/dashboard/settings" className="inline-block mt-4 text-green-600 dark:text-green-400 text-sm font-medium hover:underline">
            → Vào Cài đặt → Thông báo
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`card flex items-start gap-3 transition-all ${
                !notif.read
                  ? "border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/10"
                  : ""
              }`}
            >
              <div className="text-2xl mt-0.5 shrink-0">{TYPE_ICONS[notif.type] || "🔔"}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold flex items-center gap-1.5 ${notif.read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white"}`}>
                  {notif.title}
                  {!notif.read && <span className="w-2 h-2 bg-blue-500 rounded-full inline-block shrink-0" />}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatTime(notif.createdAt)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {!notif.read && (
                  <button
                    onClick={() => markRead(notif.id)}
                    className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-blue-400 hover:text-blue-600 transition-colors"
                    title="Đánh dấu đã đọc"
                  >
                    <Check size={14} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotif(notif.id)}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">💡 Tùy chỉnh thông báo</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Bật/tắt thông báo trong{" "}
          <a href="/dashboard/settings" className="text-green-600 dark:text-green-400 underline">Cài đặt → Thông báo</a>
        </p>
      </div>
    </div>
  );
}
