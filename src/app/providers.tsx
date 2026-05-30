"use client";
import { SessionProvider } from "next-auth/react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────
type Theme = "light" | "dark" | "system";
interface ThemeCtx { theme: Theme; resolvedTheme: "light" | "dark"; setTheme: (t: Theme) => void; }
export const ThemeContext = createContext<ThemeCtx>({ theme: "system", resolvedTheme: "light", setTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

// ─── Profile ──────────────────────────────────────────────────────────────────
interface ProfileCtx { avatar: string; name: string; refresh: () => void; }
export const ProfileContext = createContext<ProfileCtx>({ avatar: "", name: "", refresh: () => {} });
export const useProfile = () => useContext(ProfileContext);

// ─── In-app notification scheduler (fires push via API) ───────────────────────
function useNotifScheduler() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFiredRef = useRef<Record<string, string>>({});

  const checkAndFire = useCallback(async () => {
    try {
      const raw = localStorage.getItem("spendy_notif_settings");
      if (!raw) return;
      const settings = JSON.parse(raw);

      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const today = now.toDateString();

      // ── Expense reminder ──────────────────────────────────────────────────
      if (settings.expenseReminder && settings.expenseReminderTime === hhmm) {
        const key = `expense_${today}`;
        if (!lastFiredRef.current[key]) {
          lastFiredRef.current[key] = "1";
          const title = "Nhắc ghi chi tiêu 💳";
          const body = `Bạn đã ghi chi tiêu hôm nay chưa?`;
          // Lưu vào DB
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, message: body, type: "expense_reminder" }),
          });
          // Hiện Web Notification trực tiếp (không cần VAPID)
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, {
              body,
              icon: "/icon-256.png",
              badge: "/icon-256.png",
              tag: "expense-reminder",
            });
          }
          window.dispatchEvent(new Event("spendy:notif_update"));
        }
      }

      // ── Budget warning (once per hour) ────────────────────────────────────
      if (settings.budgetWarning && now.getMinutes() === 0) {
        const key = `budget_${today}_${now.getHours()}`;
        if (!lastFiredRef.current[key]) {
          lastFiredRef.current[key] = "1";
          const m = now.getMonth() + 1;
          const y = now.getFullYear();
          const res = await fetch(`/api/budgets?month=${m}&year=${y}`);
          if (res.ok) {
            const budgets = await res.json();
            const over = Array.isArray(budgets) ? budgets.filter((b: any) => b.percentage >= 80) : [];
            for (const b of over) {
              const isOver = b.percentage >= 100;
              const title = isOver
                ? `⚠️ Vượt ngân sách: ${b.category.name}`
                : `🔶 Gần hết ngân sách: ${b.category.name}`;
              const body = `Đã dùng ${b.percentage.toFixed(0)}% (${Number(b.spent).toLocaleString("vi-VN")}đ / ${Number(b.amount).toLocaleString("vi-VN")}đ)`;
              await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, message: body, type: "budget_warning" }),
              });
              // Hiện Web Notification trực tiếp
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(title, {
                  body,
                  icon: "/icon-256.png",
                  badge: "/icon-256.png",
                  tag: `budget-${b.category.name}`,
                });
              }
            }
            if (over.length > 0) window.dispatchEvent(new Event("spendy:notif_update"));
          }
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    checkAndFire();
    intervalRef.current = setInterval(checkAndFire, 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [checkAndFire]);
}

// ─── Service Worker registration ──────────────────────────────────────────────
function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(reg => console.log("[SW] Registered:", reg.scope))
      .catch(err => console.warn("[SW] Registration failed:", err));
  }, []);
}

// ─── Theme Provider ───────────────────────────────────────────────────────────
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (localStorage.getItem("spendy_theme") as Theme) || "system";
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  function applyTheme(t: Theme) {
    const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    setResolvedTheme(dark ? "dark" : "light");
  }

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("spendy_theme", t);
    applyTheme(t);
  }

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

// ─── Profile Provider ─────────────────────────────────────────────────────────
function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState({ avatar: "", name: "" });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/profile");
      if (res.ok) {
        const d = await res.json();
        setProfile({ avatar: d.avatar || "", name: d.name || "" });
      }
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("spendy:profile_updated", handler);
    return () => window.removeEventListener("spendy:profile_updated", handler);
  }, [refresh]);

  return (
    <ProfileContext.Provider value={{ avatar: profile.avatar, name: profile.name, refresh }}>
      {children}
    </ProfileContext.Provider>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
function AppShell({ children }: { children: React.ReactNode }) {
  useServiceWorker();
  useNotifScheduler();
  return <>{children}</>;
}

// ─── Root Providers ───────────────────────────────────────────────────────────
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ProfileProvider>
          <AppShell>
            {children}
          </AppShell>
        </ProfileProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
