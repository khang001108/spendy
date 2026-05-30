"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User, Lock, Download, Upload, Bell, CheckCircle, AlertCircle, Sun, Moon, Monitor, BellRing, BellOff, Smartphone } from "lucide-react";
import { useTheme } from "@/app/providers";
import { usePushNotification } from "@/lib/usePushNotification";

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-in slide-in-from-bottom-4 ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const push = usePushNotification();

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "appearance" | "data" | "notifications">("profile");

  // Profile
  const [profile, setProfile] = useState({ name: "", avatar: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password
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

  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [pushLoading, setPushLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch("/api/settings/profile")
      .then(r => r.json())
      .then(d => { if (d && !d.error) setProfile({ name: d.name || "", avatar: d.avatar || "" }); })
      .catch(() => {});
    const saved = localStorage.getItem("spendy_notif_settings");
    if (saved) { try { setNotifSettings(JSON.parse(saved)); } catch {} }
  }, []);

  async function saveProfile() {
    if (!profile.name.trim()) return showToast("Tên không được để trống", "error");
    setProfileLoading(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        showToast("Đã cập nhật hồ sơ");
        window.dispatchEvent(new Event("spendy:profile_updated"));
      } else {
        const d = await res.json();
        showToast(d.error || "Cập nhật thất bại", "error");
      }
    } catch { showToast("Lỗi kết nối", "error"); }
    finally { setProfileLoading(false); }
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
        body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }),
      });
      const d = await res.json();
      if (res.ok) {
        showToast("Đã đổi mật khẩu thành công");
        setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
      } else {
        showToast(d.error || "Đổi mật khẩu thất bại", "error");
      }
    } catch { showToast("Lỗi kết nối", "error"); }
    finally { setPassLoading(false); }
  }

  async function exportData(format: string) {
    setExportLoading(format);
    try {
      const url = format === "excel" ? "/api/settings/export-excel" : `/api/settings/export?format=${format}`;
      const res = await fetch(url);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || "Xuất thất bại", "error");
        return;
      }
      const blob = await res.blob();
      const ext = format === "excel" ? "xlsx" : format;
      const filename = `spendy-${new Date().toISOString().slice(0, 10)}.${ext}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast(`Đã tải xuống ${filename}`);
    } catch { showToast("Lỗi khi tải file", "error"); }
    finally { setExportLoading(null); }
  }

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (res.ok) showToast(d.message || "Khôi phục thành công");
      else showToast(d.error || "Khôi phục thất bại", "error");
    } catch { showToast("File không hợp lệ", "error"); }
    e.target.value = "";
  }

  async function saveNotifSettings() {
    localStorage.setItem("spendy_notif_settings", JSON.stringify(notifSettings));
    showToast("Đã lưu cài đặt thông báo");
    window.dispatchEvent(new Event("spendy:notif_update"));
  }

  async function handlePushToggle() {
    setPushLoading(true);
    try {
      if (push.status === "granted" && push.subscription) {
        await push.unsubscribe();
        showToast("Đã tắt thông báo đẩy");
      } else {
        const ok = await push.subscribe();
        if (ok) {
          showToast("✅ Đã bật thông báo đẩy! Bạn sẽ nhận thông báo kể cả khi đóng tab.");
        } else if (push.status === "denied") {
          showToast("Bạn đã chặn thông báo. Vào cài đặt trình duyệt để bật lại.", "error");
        } else {
          showToast("Không thể bật thông báo", "error");
        }
      }
    } finally { setPushLoading(false); }
  }

  async function sendTestPush() {
    setTestLoading(true);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🔔 Test thông báo Spendy",
          body: "Thông báo PWA đang hoạt động tốt!",
          type: "expense_reminder",
        }),
      });
      const d = await res.json();
      if (res.ok && d.sent > 0) showToast(`Đã gửi test push (${d.sent} thiết bị)`);
      else showToast(d.error || "Chưa có thiết bị đăng ký nhận push", "error");
    } catch { showToast("Lỗi gửi test", "error"); }
    finally { setTestLoading(false); }
  }

  const TABS = [
    { id: "profile",       label: "Hồ sơ",    icon: User },
    { id: "security",      label: "Bảo mật",   icon: Lock },
    { id: "appearance",    label: "Giao diện",  icon: Sun },
    { id: "data",          label: "Dữ liệu",   icon: Download },
    { id: "notifications", label: "Thông báo",  icon: Bell },
  ] as const;

  const themeOptions = [
    { value: "light",  label: "Sáng",     icon: Sun,     desc: "Giao diện sáng" },
    { value: "dark",   label: "Tối",      icon: Moon,    desc: "Giao diện tối" },
    { value: "system", label: "Hệ thống", icon: Monitor, desc: "Theo thiết bị" },
  ] as const;

  // Push status helpers
  const pushIsGranted = push.status === "granted" && !!push.subscription;
  const pushStatusLabel = {
    loading:     { text: "Đang kiểm tra...", color: "text-gray-400" },
    unsupported: { text: "Trình duyệt không hỗ trợ", color: "text-gray-400" },
    denied:      { text: "Đã bị chặn — mở cài đặt trình duyệt để bật", color: "text-red-500" },
    default:     { text: "Chưa bật", color: "text-orange-500" },
    granted:     { text: pushIsGranted ? "Đang hoạt động ✓" : "Đã cấp quyền nhưng chưa đăng ký", color: "text-green-600 dark:text-green-400" },
  }[push.status];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Quản lý tài khoản và tùy chỉnh ứng dụng</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 dark:border-gray-800 overflow-x-auto pb-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === id
                ? "text-green-700 dark:text-green-400 border-green-500 bg-green-50 dark:bg-green-900/20"
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200"
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── Profile ── */}
      {activeTab === "profile" && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Thông tin cá nhân</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-3xl select-none">
              {profile.avatar || "👤"}
            </div>
            <div className="flex-1">
              <label className="label">Emoji avatar</label>
              <input className="input" value={profile.avatar}
                onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))}
                placeholder="Nhập emoji, VD: 🐱" maxLength={2} />
            </div>
          </div>
          <div>
            <label className="label">Tên hiển thị</label>
            <input className="input" value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              placeholder="Tên của bạn" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input opacity-60 cursor-not-allowed" value={session?.user?.email || ""} disabled />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Email không thể thay đổi</p>
          </div>
          <button onClick={saveProfile} disabled={profileLoading} className="btn-primary w-full">
            {profileLoading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      )}

      {/* ── Security ── */}
      {activeTab === "security" && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Đổi mật khẩu</h2>
          <div>
            <label className="label">Mật khẩu hiện tại</label>
            <input className="input" type="password" value={passwords.currentPassword}
              onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div>
            <label className="label">Mật khẩu mới</label>
            <input className="input" type="password" value={passwords.newPassword}
              onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} />
          </div>
          <div>
            <label className="label">Xác nhận mật khẩu mới</label>
            <input className="input" type="password" value={passwords.confirm}
              onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
          </div>
          {passwords.newPassword && passwords.confirm && passwords.newPassword !== passwords.confirm && (
            <p className="text-red-500 text-xs flex items-center gap-1">
              <AlertCircle size={13} /> Mật khẩu xác nhận không khớp
            </p>
          )}
          <button onClick={changePassword} disabled={passLoading} className="btn-primary w-full">
            {passLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </div>
      )}

      {/* ── Appearance ── */}
      {activeTab === "appearance" && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Giao diện</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Chọn chủ đề màu sắc cho ứng dụng</p>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, icon: Icon, desc }) => (
              <button key={value} onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  theme === value
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}>
                <Icon size={24} className={theme === value ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"} />
                <p className={`text-sm font-semibold ${theme === value ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>{label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
                {theme === value && <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>}
              </button>
            ))}
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">Preview</p>
            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-900 dark:text-white">Card mẫu</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Văn bản mẫu</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="px-2 py-1 bg-green-500 text-white text-xs rounded-lg font-medium">Nút chính</div>
                <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg font-medium">Nút phụ</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Data ── */}
      {activeTab === "data" && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Xuất dữ liệu</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tải xuống giao dịch, tài sản và ngân sách</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { format: "csv",   label: "CSV",   icon: "📄", desc: "Giao dịch" },
                { format: "excel", label: "Excel", icon: "📊", desc: "3 sheets" },
                { format: "json",  label: "JSON",  icon: "💾", desc: "Toàn bộ" },
              ].map(({ format, label, icon, desc }) => (
                <button key={format} onClick={() => exportData(format)} disabled={exportLoading === format}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all disabled:opacity-50">
                  <span className="text-2xl">{icon}</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {exportLoading === format ? "Đang tải..." : label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
                  <Download size={14} className="text-gray-400" />
                </button>
              ))}
            </div>
          </div>
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Khôi phục dữ liệu</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nhập file backup JSON.
              <span className="text-orange-500 font-medium ml-1">Dữ liệu trùng lặp sẽ bị bỏ qua.</span>
            </p>
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

          {/* PWA Push Card */}
          <div className="card space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pushIsGranted ? "bg-green-100 dark:bg-green-900/40" : "bg-gray-100 dark:bg-gray-800"}`}>
                  {pushIsGranted
                    ? <BellRing size={20} className="text-green-600 dark:text-green-400" />
                    : <BellOff size={20} className="text-gray-400" />
                  }
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Thông báo đẩy (PWA)</p>
                  <p className={`text-xs mt-0.5 ${pushStatusLabel.color}`}>{pushStatusLabel.text}</p>
                </div>
              </div>

              {push.status !== "unsupported" && push.status !== "loading" && push.status !== "denied" && (
                <Toggle
                  checked={pushIsGranted}
                  onChange={handlePushToggle}
                />
              )}
            </div>

            {/* Bị chặn */}
            {push.status === "denied" && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                <p className="font-medium mb-1">Thông báo bị chặn bởi trình duyệt</p>
                <p className="text-xs">
                  Chrome: click 🔒 trên thanh địa chỉ → Thông báo → Cho phép.
                  Sau đó reload lại trang và bật lại.
                </p>
              </div>
            )}

            {/* Unsupported */}
            {push.status === "unsupported" && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
                Trình duyệt của bạn chưa hỗ trợ Web Push. Hãy dùng Chrome hoặc Edge.
              </div>
            )}

            {/* Info khi đã bật */}
            {pushIsGranted && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium mb-1">
                    <Smartphone size={15} /> Thông báo đẩy đang hoạt động
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    Bạn sẽ nhận được thông báo <strong>kể cả khi đóng tab</strong>, miễn là trình duyệt đang chạy.
                  </p>
                </div>

                <button
                  onClick={sendTestPush}
                  disabled={testLoading}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <BellRing size={15} />
                  {testLoading ? "Đang gửi..." : "Gửi thông báo test"}
                </button>
              </div>
            )}

            {/* Chưa bật, hướng dẫn */}
            {!pushIsGranted && push.status !== "denied" && push.status !== "unsupported" && push.status !== "loading" && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <p className="font-medium">Lợi ích của thông báo đẩy:</p>
                <p>✅ Nhận thông báo kể cả khi đóng tab Spendy</p>
                <p>✅ Cảnh báo vượt ngân sách tức thì</p>
                <p>✅ Nhắc ghi chi tiêu đúng giờ đã đặt</p>
              </div>
            )}
          </div>

          {/* In-app settings card */}
          <div className="card space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Loại thông báo</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Chọn loại thông báo bạn muốn nhận
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full font-medium shrink-0">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Đang chạy
              </span>
            </div>

            <div className="space-y-3">
              {[
                { key: "expenseReminder", label: "Nhắc ghi chi tiêu", desc: "Nhắc hàng ngày lúc giờ đã đặt", icon: "💳" },
                { key: "goalReminder",    label: "Nhắc mục tiêu tiết kiệm", desc: "Cập nhật tiến độ mục tiêu", icon: "🎯" },
                { key: "budgetWarning",   label: "Cảnh báo vượt ngân sách", desc: "Khi chi tiêu ≥ 80% ngân sách", icon: "⚠️" },
                { key: "billReminder",    label: "Nhắc hóa đơn", desc: "Các khoản thanh toán định kỳ", icon: "📋" },
              ].map(({ key, label, desc, icon }) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <span className="text-xl shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <Toggle
                    checked={!!notifSettings[key as keyof typeof notifSettings]}
                    onChange={() => setNotifSettings(s => ({ ...s, [key]: !s[key as keyof typeof s] }))}
                  />
                </div>
              ))}
            </div>

            {notifSettings.expenseReminder && (
              <div>
                <label className="label">Giờ nhắc chi tiêu</label>
                <input className="input" type="time"
                  value={notifSettings.expenseReminderTime}
                  onChange={e => setNotifSettings(s => ({ ...s, expenseReminderTime: e.target.value }))} />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Thông báo sẽ gửi lúc {notifSettings.expenseReminderTime} mỗi ngày
                </p>
              </div>
            )}

            <button onClick={saveNotifSettings} className="btn-primary w-full">
              Lưu cài đặt thông báo
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
