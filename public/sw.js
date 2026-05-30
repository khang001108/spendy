// Spendy Service Worker — PWA Push Notifications
const CACHE_NAME = "spendy-v1";

// ─── Install & Activate ───────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ─── Push Event — fired when server sends a push ──────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Spendy", body: event.data.text() };
  }

  const options = {
    body: data.body || data.message || "",
    icon: "/icon-256.png",
    badge: "/icon-256.png",
    tag: data.tag || data.type || "spendy",
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/dashboard/notifications",
      type: data.type,
    },
    actions: [
      { action: "open", title: "Xem ngay" },
      { action: "dismiss", title: "Bỏ qua" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Spendy 💰", options)
  );
});

// ─── Notification Click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/dashboard/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// ─── Background Sync (optional) ──────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  // Future: sync offline transactions
});
