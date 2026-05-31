"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, Lock, Download, Upload, Bell, CheckCircle, AlertCircle, Sun, Moon, Monitor, BellRing, BellOff, Smartphone, Trash2, AlertTriangle, UserX } from "lucide-react";
import { useTheme } from "@/app/providers";
import { usePushNotification } from "@/lib/usePushNotification";

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

function ConfirmModal({ title, description, confirmLabel, dangerous, onConfirm, onCancel }: {
  title: string; description: string; confirmLabel: string; dangerous?: boolean;
  onConfirm: (password: string) => void; onCancel: () => void;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800 p-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${dangerous ? "bg-red-100 dark:bg-red-900/40" : "bg-orange-100 dark:bg-orange-900/40"}`}>
          <AlertTriangle size={24} className={dangerous ? "text-red-600" : "text-orange-500"} />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">{description}</p>
        <div className="mb-4">
          <label className="label">Nhập mật khẩu để xác nhận</label>
          <input className="input" type="password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Hủy</button>
          <button
            disabled={!password || loading}
            onClick={async () => { setLoading(true); await onConfirm(password); setLoading(false); }}
            className={`flex-1 font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50 ${dangerous ? "btn-danger" : "bg-orange-500 hover:bg-orange-600 text-white"}`}>
            {loading ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const push = usePushNotification();

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "appearance" | "data" | "notifications" | "account">("profile");
  const [confirmModal, setConfirmModal] = useState<null | "data" | "account">(null);

  const [profile, setProfile] = useState({ name: "", avatar: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [passLoading, setPassLoading] = useState(false);
  const [notifSettings, setNotifSettings] = useState({ expenseReminder: true, expenseReminderTime: "20:00", goalReminder: true, budgetWarning: true, billReminder: false });
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [pushLoading, setPushLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch("/api/settings/profile").then(r => r.json()).then(d => { if (d && !d.error) setProfile({ name: d.name || "", avatar: d.avatar || "" }); }).catch(() => {});
    fetch("/api/settings/notifications").then(r => r.json()).then(d => { if (d && !d.error) setNotifSettings({ expenseReminder: d.expenseReminder ?? true, expenseReminderTime: d.expenseReminderTime ?? "20:00", goalReminder: d.goalReminder ?? true, budgetWarning: d.budgetWarning ?? true, billReminder: d.billReminder ?? false }); }).catch(() => { const s = localStorage.getItem("spendy_notif_settings"); if (s) { try { setNotifSettings(JSON.parse(s)); } catch {} } });
  }, []);

  async function saveProfile() {
    if (!profile.name.trim()) return showToast("Tên không được để trống", "error");
    setProfileLoading(true);
    try {
      const res = await fetch("/api/settings/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      if (res.ok) { showToast("Đã cập nhật hồ sơ"); window.dispatchEvent(new Event("spendy:profile_updated")); }
      else { const d = await res.json(); showToast(d.error || "Cập nhật thất bại", "error"); }
    } catch { showToast("Lỗi kết nối", "error"); } finally { setProfileLoading(false); }
  }

  async function changePassword() {
    if (!passwords.currentPassword || !passwords.newPassword) return showToast("Vui lòng điền đầy đủ", "error");
    if (passwords.newPassword !== passwords.confirm) return showToast("Mật khẩu xác nhận không khớp", "error");
    if (passwords.newPassword.length < 6) return showToast("Mật khẩu mới phải ít nhất 6 ký tự", "error");
    setPassLoading(true);
    try {
      const res = await fetch("/api/settings/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }) });
      const d = await res.json();
      if (res.ok) { showToast("Đã đổi mật khẩu thành công"); setPasswords({ currentPassword: "", newPassword: "", confirm: "" }); }
      else showToast(d.error || "Đổi mật khẩu thất bại", "error");
    } catch { showToast("Lỗi kết nối", "error"); } finally { setPassLoading(false); }
  }

  async function exportData(format: string) {
    setExportLoading(format);
    try {
      const url = format === "excel" ? "/api/settings/export-excel" : `/api/settings/export?format=${format}`;
      const res = await fetch(url);
      if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || "Xuất thất bại", "error"); return; }
      const blob = await res.blob();
      const ext = format === "excel" ? "xlsx" : format;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `spendy-${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click(); URL.revokeObjectURL(a.href);
      showToast(`Đã tải xuống file .${ext}`);
    } catch { showToast("Lỗi khi tải file", "error"); } finally { setExportLoading(null); }
  }

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const res = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const d = await res.json();
      if (res.ok) showToast(d.message || "Khôi phục thành công");
      else showToast(d.error || "Khôi phục thất bại", "error");
    } catch { showToast("File không hợp lệ", "error"); }
    e.target.value = "";
  }

  async function saveNotifSettings() {
    const res = await fetch("/api/settings/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(notifSettings) });
    localStorage.setItem("spendy_notif_settings", JSON.stringify(notifSettings));
    if (!res.ok) { showToast("Lỗi lưu cài đặt", "error"); return; }
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "✅ Cài đặt thông báo đã lưu", message: `Nhắc chi tiêu lúc ${notifSettings.expenseReminderTime}`, type: "expense_reminder" }) }).catch(() => {});
    showToast("Đã lưu cài đặt thông báo");
    window.dispatchEvent(new Event("spendy:notif_update"));
  }

  async function handleDeleteData(password: string) {
    const res = await fetch("/api/account?action=data", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const d = await res.json();
    if (res.ok) { showToast(d.message || "Đã xóa dữ liệu"); setConfirmModal(null); }
    else showToast(d.error || "Lỗi xóa dữ liệu", "error");
  }

  async function handleDeleteAccount(password: string) {
    const res = await fetch("/api/account?action=account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const d = await res.json();
    if (res.ok) { await signOut({ callbackUrl: "/auth/login" }); }
    else showToast(d.error || "Lỗi xóa tài khoản", "error");
  }

  async function handlePushToggle() {
    setPushLoading(true);
    try {
      if (push.status === "granted" && push.subscription) { await push.unsubscribe(); showToast("Đã tắt thông báo đẩy"); }
      else {
        const ok = await push.subscribe();
        if (ok) showToast("✅ Đã bật thông báo đẩy!");
        else if (push.status === "denied") showToast("Bị chặn — vào cài đặt trình duyệt để bật lại", "error");
        else showToast("Không thể bật thông báo", "error");
      }
    } finally { setPushLoading(false); }
  }

  async function sendTestPush() {
    setTestLoading(true);
    try {
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "🔔 Test thông báo Spendy", message: `Hoạt động tốt! (${new Date().toLocaleTimeString("vi-VN")})`, type: "expense_reminder" }) });
      window.dispatchEvent(new Event("spendy:notif_update"));
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🔔 Test thông báo Spendy", { body: `Hoạt động tốt! (${new Date().toLocaleTimeString("vi-VN")})`, icon: "/icon-256.png" });
      }
      showToast("Đã gửi thông báo test!");
    } catch { showToast("Lỗi gửi test", "error"); } finally { setTestLoading(false); }
  }

  const TABS = [
    { id: "profile",       label: "Hồ sơ",     icon: User },
    { id: "security",      label: "Bảo mật",    icon: Lock },
    { id: "appearance",    label: "Giao diện",  icon: Sun },
    { id: "data",          label: "Dữ liệu",    icon: Download },
    { id: "notifications", label: "Thông báo",  icon: Bell },
    { id: "account",       label: "Tài khoản",  icon: UserX },
  ] as const;

  const themeOptions = [
    { value: "light",  label: "Sáng",     icon: Sun,     desc: "Giao diện sáng" },
    { value: "dark",   label: "Tối",      icon: Moon,    desc: "Giao diện tối" },
    { value: "system", label: "Hệ thống", icon: Monitor, desc: "Theo thiết bị" },
  ] as const;

  const pushIsGranted = push.status === "granted" && !!push.subscription;
  const pushStatusLabel = {
    loading:     { text: "Đang kiểm tra...", color: "text-gray-400" },
    unsupported: { text: "Trình duyệt không hỗ trợ", color: "text-gray-400" },
    denied:      { text: "Đã bị chặn", color: "text-red-500" },
    default:     { text: "Chưa bật", color: "text-orange-500" },
    granted:     { text: pushIsGranted ? "Đang hoạt động ✓" : "Đã cấp quyền", color: "text-green-600 dark:text-green-400" },
  }[push.status];

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="page-title">Cài đặt</h1>
        <p className="page-subtitle">Quản lý tài khoản và tùy chỉnh ứng dụng</p>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex gap-1 border-b border-gray-100 dark:border-gray-800 overflow-x-auto pb-0 -mx-1 px-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === id
                ? "text-green-700 dark:text-green-400 border-green-500 bg-green-50 dark:bg-green-900/20"
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200"
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Profile ── */}
      {activeTab === "profile" && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Thông tin cá nhân</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-3xl select-none shrink-0">
              {profile.avatar || "👤"}
            </div>
            <div className="flex-1 min-w-0">
              <label className="label">Emoji avatar</label>
              <input className="input" value={profile.avatar} onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))} placeholder="Nhập emoji, VD: 🐱" maxLength={2} />
            </div>
          </div>
          <div>
            <label className="label">Tên hiển thị</label>
            <input className="input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Tên của bạn" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={session?.user?.email || ""} disabled />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Email không thể thay đổi</p>
          </div>
          <button onClick={saveProfile} disabled={profileLoading} className="btn-primary w-full">{profileLoading ? "Đang lưu..." : "Lưu thay đổi"}</button>
        </div>
      )}

      {/* ── Security ── */}
      {activeTab === "security" && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Đổi mật khẩu</h2>
          <div>
            <label className="label">Mật khẩu hiện tại</label>
            <input className="input" type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div>
            <label className="label">Mật khẩu mới</label>
            <input className="input" type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} />
          </div>
          <div>
            <label className="label">Xác nhận mật khẩu mới</label>
            <input className="input" type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
          </div>
          {passwords.newPassword && passwords.confirm && passwords.newPassword !== passwords.confirm && (
            <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={13} /> Mật khẩu không khớp</p>
          )}
          <button onClick={changePassword} disabled={passLoading} className="btn-primary w-full">{passLoading ? "Đang xử lý..." : "Đổi mật khẩu"}</button>
        </div>
      )}

      {/* ── Appearance ── */}
      {activeTab === "appearance" && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Giao diện</h2>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, icon: Icon, desc }) => (
              <button key={value} onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${theme === value ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                <Icon size={22} className={theme === value ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"} />
                <p className={`text-sm font-semibold ${theme === value ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>{label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">{desc}</p>
                {theme === value && <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Data ── */}
      {activeTab === "data" && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Xuất dữ liệu</h2>
            <div className="grid grid-cols-3 gap-3">
              {[{ format: "csv", label: "CSV", icon: "📄", desc: "Giao dịch" }, { format: "excel", label: "Excel", icon: "📊", desc: "3 sheets" }, { format: "json", label: "JSON", icon: "💾", desc: "Toàn bộ" }].map(({ format, label, icon, desc }) => (
                <button key={format} onClick={() => exportData(format)} disabled={exportLoading === format}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all disabled:opacity-50">
                  <span className="text-2xl">{icon}</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{exportLoading === format ? "..." : label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Khôi phục dữ liệu</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nhập file backup JSON. <span className="text-orange-500 font-medium">Dữ liệu trùng sẽ bị bỏ qua.</span></p>
            <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 cursor-pointer transition-all">
              <Upload size={20} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Chọn file backup (.json)</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Click để chọn file</p>
              </div>
              <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* ── Notifications ── */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pushIsGranted ? "bg-green-100 dark:bg-green-900/40" : "bg-gray-100 dark:bg-gray-800"}`}>
                  {pushIsGranted ? <BellRing size={20} className="text-green-600 dark:text-green-400" /> : <BellOff size={20} className="text-gray-400" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Thông báo đẩy (PWA)</p>
                  <p className={`text-xs mt-0.5 ${pushStatusLabel.color}`}>{pushStatusLabel.text}</p>
                </div>
              </div>
              {push.status !== "unsupported" && push.status !== "loading" && push.status !== "denied" && (
                <Toggle checked={pushIsGranted} onChange={handlePushToggle} />
              )}
            </div>
            {push.status === "denied" && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                <p className="font-medium mb-1">Thông báo bị chặn</p>
                <p className="text-xs">Click 🔒 trên thanh địa chỉ → Thông báo → Cho phép → Reload trang</p>
              </div>
            )}
            {pushIsGranted && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium mb-1"><Smartphone size={15} /> Đang hoạt động</div>
                  <p className="text-xs text-green-600 dark:text-green-500">Nhận thông báo kể cả khi đóng tab</p>
                </div>
                <button onClick={sendTestPush} disabled={testLoading} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                  <BellRing size={15} /> {testLoading ? "Đang gửi..." : "Gửi thông báo test"}
                </button>
              </div>
            )}
          </div>
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">Loại thông báo</h2>
              <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full font-medium">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Đang chạy
              </span>
            </div>
            <div className="space-y-3">
              {[
                { key: "expenseReminder", label: "Nhắc ghi chi tiêu", desc: "Nhắc hàng ngày lúc giờ đặt", icon: "💳" },
                { key: "goalReminder",    label: "Nhắc mục tiêu",     desc: "Cập nhật tiến độ mục tiêu",   icon: "🎯" },
                { key: "budgetWarning",   label: "Cảnh báo ngân sách",desc: "Khi chi tiêu ≥ 80%",          icon: "⚠️" },
                { key: "billReminder",    label: "Nhắc hóa đơn",      desc: "Thanh toán định kỳ",           icon: "📋" },
              ].map(({ key, label, desc, icon }) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <span className="text-xl shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
                  </div>
                  <Toggle checked={!!notifSettings[key as keyof typeof notifSettings]} onChange={() => setNotifSettings(s => ({ ...s, [key]: !s[key as keyof typeof s] }))} />
                </div>
              ))}
            </div>
            {notifSettings.expenseReminder && (
              <div>
                <label className="label">Giờ nhắc chi tiêu</label>
                <input className="input" type="time" value={notifSettings.expenseReminderTime} onChange={e => setNotifSettings(s => ({ ...s, expenseReminderTime: e.target.value }))} />
              </div>
            )}
            <button onClick={saveNotifSettings} className="btn-primary w-full">Lưu cài đặt thông báo</button>
          </div>
        </div>
      )}

      {/* ── Account ── */}
      {activeTab === "account" && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Xóa dữ liệu</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Xóa toàn bộ giao dịch, tài sản, ngân sách, mục tiêu — nhưng giữ lại tài khoản đăng nhập.</p>
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-xs text-orange-700 dark:text-orange-400">
              ⚠️ Hành động này <strong>không thể hoàn tác</strong>. Hãy backup dữ liệu trước!
            </div>
            <button onClick={() => setConfirmModal("data")} className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border-2 border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-semibold text-sm transition-all">
              <Trash2 size={16} /> Xóa toàn bộ dữ liệu
            </button>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Xóa tài khoản</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu. Không thể khôi phục.</p>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400">
              🚨 Tài khoản sẽ bị xóa vĩnh viễn. Bạn sẽ bị đăng xuất ngay lập tức.
            </div>
            <button onClick={() => setConfirmModal("account")} className="btn-danger flex items-center gap-2 w-full justify-center">
              <UserX size={16} /> Xóa tài khoản vĩnh viễn
            </button>
          </div>
        </div>
      )}

      {confirmModal === "data" && (
        <ConfirmModal
          title="Xóa toàn bộ dữ liệu?"
          description="Tất cả giao dịch, tài sản, ngân sách và mục tiêu sẽ bị xóa. Tài khoản vẫn được giữ lại."
          confirmLabel="Xóa dữ liệu"
          onConfirm={handleDeleteData}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {confirmModal === "account" && (
        <ConfirmModal
          title="Xóa tài khoản vĩnh viễn?"
          description="Toàn bộ tài khoản và dữ liệu sẽ bị xóa hoàn toàn. Không thể khôi phục!"
          confirmLabel="Xóa tài khoản"
          dangerous
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
