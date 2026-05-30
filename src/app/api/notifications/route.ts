import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import webpush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@spendy.app";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

async function sendPush(userId: string, title: string, body: string, type: string) {
  if (!vapidPublicKey || !vapidPrivateKey) return;
  try {
    const subs = await db.pushSubscription.findMany({ where: { userId } });
    const payload = JSON.stringify({
      title,
      body,
      type,
      url: "/dashboard/notifications",
      tag: type,
    });
    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }
      })
    );
  } catch {}
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json(notifications);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, message, type } = await req.json();
  if (!title || !type) return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });

  // Save to DB
  const notif = await db.notification.create({
    data: { title, message: message || "", type, userId: session.user.id },
  });

  // Send push notification (fire-and-forget)
  sendPush(session.user.id, title, message || "", type);

  return NextResponse.json(notif);
}
