"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User, Lock, Download, Upload, Bell, CheckCircle, AlertCircle } from "lucide-react";

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "data" | "notifications">("profile");

  // Profile state
  const [profile, setProfile] = useState({ name: "", avatar: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [passLoading, setPassLoading] = useState(false);

  // Notifications
  const [notifSettings, setNotifSettings] = useState({
    expenseReminder: true,
    expenseReminderTime: "20:00",
    goalReminder: true,
    budgetWarning: true,
    billReminder: false,
  });

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    fetch("/api/settings/profile")
      .then(r => r.json())
      .then(d => setProfile({ name: d.name || "", avatar: d.avatar || "" }));

    // Load notification settings from localStorage
    const saved = localStorage.getItem("spendy_notif_settings");
    if (saved) setNotifSettings(JSON.parse(saved));
  }, []);

  async function saveProfile() {
    setProfileLoading(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) showToast("Đã cập nhật hồ sơ");
      else showToast("Cập nhật thất bại", "error");
    } finally {
      setProfileLoading(false);
    }
  }

  async function changePassword() {
    if (!passwords.currentPassword || !passwords.newPassword)
      return showToast("Vui lòng điền đầy đủ", "error");
    if (passwords.newPassword !== passwords.confirm)
      return showToast("Mật khẩu xác nhận không khớp", "error");
    if (passwords.newPassword.length < 6)
      return showToast("Mật khẩu mới phải ít nhất 6 ký tự", "error");

    setPassLoading(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        showToast("Đã đổi mật khẩu thành công");
        setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
      } else {
        showToast(d.error || "Đổi mật khẩu thất bại", "error");
      }
    } finally {
      setPassLoading(false);
    }
  }

  function exportData(format: string) {
    window.location.href = `/api/settings/export?format=${format}`;
  }

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (res.ok) showToast(d.message || "Khôi phục thành công");
      else showToast(d.error || "Khôi phục thất bại", "error");
    } catch {
      showToast("File không hợp lệ", "error");
    }
    e.target.value = "";
  }

  function saveNotifSettings() {
    localStorage.setItem("spendy_notif_settings", JSON.stringify(notifSettings));
    showToast("Đã lưu cài đặt thông báo");
  }

  const TABS = [
    { id: "profile", label: "Hồ sơ", icon: User },
    { id: "security", label: "Bảo mật", icon: Lock },
    { id: "data", label: "Dữ liệu", icon: Download },
    { id: "notifications", label: "Thông báo", icon: Bell },
  ] as const;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-500 text-sm mt-0.5">Quản lý tài khoản và tùy chỉnh ứng dụng</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-gray-100 pb-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-all ${
              activeTab === id
                ? "text-green-700 border-green-500 bg-green-50"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === "profile" && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Thông tin cá nhân</h2>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl">
              {profile.avatar || "👤"}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Emoji avatar</p>
              <input
                className="input"
                value={profile.avatar}
                onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))}
                placeholder="Nhập emoji, VD: 🐱"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <label className="label">Tên hiển thị</label>
            <input
              className="input"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              placeholder="Tên của bạn"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input className="input bg-gray-50 text-gray-400" value={session?.user?.email || ""} disabled />
            <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
          </div>

          <button onClick={saveProfile} disabled={profileLoading} className="btn-primary w-full">
            {profileLoading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      )}

      {/* Security tab */}
      {activeTab === "security" && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Đổi mật khẩu</h2>

          <div>
            <label className="label">Mật khẩu hiện tại</label>
            <input
              className="input"
              type="password"
              value={passwords.currentPassword}
              onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Mật khẩu mới</label>
            <input
              className="input"
              type="password"
              value={passwords.newPassword}
              onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Xác nhận mật khẩu mới</label>
            <input
              className="input"
              type="password"
              value={passwords.confirm}
              onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
            />
          </div>

          <button onClick={changePassword} disabled={passLoading} className="btn-primary w-full">
            {passLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </div>
      )}

      {/* Data tab */}
      {activeTab === "data" && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Xuất dữ liệu</h2>
            <p className="text-sm text-gray-500">Tải xuống toàn bộ dữ liệu giao dịch của bạn</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => exportData("csv")}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={16} /> Export CSV
              </button>
              <button
                onClick={() => window.location.href = "/api/settings/export-excel"}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={16} /> Export Excel
              </button>
              <button
                onClick={() => exportData("json")}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={16} /> Backup JSON
              </button>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Khôi phục dữ liệu</h2>
            <p className="text-sm text-gray-500">
              Nhập file backup JSON để khôi phục danh mục và tài sản.
              <span className="text-orange-500 font-medium ml-1">Dữ liệu trùng lặp sẽ bị bỏ qua.</span>
            </p>
            <label className="btn-secondary flex items-center gap-2 cursor-pointer w-fit">
              <Upload size={16} /> Chọn file backup
              <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === "notifications" && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-gray-900">Cài đặt thông báo</h2>

          {[
            { key: "expenseReminder", label: "Nhắc ghi chi tiêu hàng ngày", desc: "Thông báo nhắc bạn ghi lại chi tiêu mỗi tối" },
            { key: "goalReminder", label: "Nhắc nhở mục tiêu tiết kiệm", desc: "Cập nhật tiến độ mục tiêu hàng tuần" },
            { key: "budgetWarning", label: "Cảnh báo vượt ngân sách", desc: "Thông báo khi chi tiêu gần hoặc vượt ngân sách" },
            { key: "billReminder", label: "Nhắc hóa đơn", desc: "Nhắc các khoản cần thanh toán định kỳ" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => setNotifSettings(s => ({ ...s, [key]: !s[key as keyof typeof s] }))}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${notifSettings[key as keyof typeof notifSettings] ? "bg-green-500" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifSettings[key as keyof typeof notifSettings] ? "translate-x-5" : ""}`} />
              </button>
            </div>
          ))}

          {notifSettings.expenseReminder && (
            <div>
              <label className="label">Giờ nhắc chi tiêu</label>
              <input
                className="input"
                type="time"
                value={notifSettings.expenseReminderTime}
                onChange={e => setNotifSettings(s => ({ ...s, expenseReminderTime: e.target.value }))}
              />
            </div>
          )}

          <button onClick={saveNotifSettings} className="btn-primary w-full">Lưu cài đặt</button>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
