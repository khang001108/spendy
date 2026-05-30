"use client";
import { useEffect, useState } from "react";

export type PushStatus = "unsupported" | "denied" | "granted" | "default" | "loading";

export function usePushNotification() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission as PushStatus);

    // Register SW and check existing subscription
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(async (reg) => {
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          setSubscription(existing);
          setStatus("granted");
        } else {
          setStatus(Notification.permission as PushStatus);
        }
      })
      .catch(() => setStatus("unsupported"));
  }, []);

  async function subscribe(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error("VAPID public key not set");
        return false;
      }

      // Convert VAPID public key from base64url to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Save to server
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      if (res.ok) {
        setSubscription(sub);
        setStatus("granted");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Push subscribe error:", err);
      setStatus(Notification.permission as PushStatus);
      return false;
    }
  }

  async function unsubscribe(): Promise<void> {
    if (!subscription) return;
    try {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
      setSubscription(null);
      setStatus("default");
    } catch (err) {
      console.error("Unsubscribe error:", err);
    }
  }

  return { status, subscription, subscribe, unsubscribe };
}
