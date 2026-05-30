import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import webpush from "web-push";

// Bảo vệ endpoint này bằng secret key
const CRON_SECRET = process.env.CRON_SECRET;

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@spendy.app";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  type: string
) {
  if (!vapidPublicKey || !vapidPrivateKey) return 0;

  const subs = await db.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return 0;

  const payload = JSON.stringify({
    title,
    body,
    type,
    url: "/dashboard/notifications",
    tag: type,
  });

  const results = await Promise.allSettled(
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
        throw err;
      }
    })
  );

  return results.filter((r) => r.status === "fulfilled").length;
}

export async function GET(req: NextRequest) {
  // Kiểm tra secret (Render gọi với header Authorization)
  const authHeader = req.headers.get("authorization");
  const secret = authHeader?.replace("Bearer ", "") || req.nextUrl.searchParams.get("secret");

  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({
      ok: false,
      error: "VAPID keys not configured. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to environment variables.",
    });
  }

  // Lấy giờ hiện tại theo Vietnam timezone
  const now = new Date();
  const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const hhmm = `${String(vnTime.getHours()).padStart(2, "0")}:${String(vnTime.getMinutes()).padStart(2, "0")}`;
  const today = vnTime.toDateString();

  let totalSent = 0;
  let totalNotifs = 0;
  const log: string[] = [];

  // Lấy tất cả users có push subscription
  const usersWithSubs = await db.pushSubscription.findMany({
    select: { userId: true },
    distinct: ["userId"],
  });

  for (const { userId } of usersWithSubs) {
    // Lấy notification settings của user (lưu trong NotifSetting table)
    const settings = await getUserNotifSettings(userId);
    if (!settings) continue;

    // ── 1. Expense reminder ────────────────────────────────────────────────
    if (settings.expenseReminder && settings.expenseReminderTime === hhmm) {
      // Kiểm tra đã gửi hôm nay chưa (tránh gửi 2 lần nếu cron chạy trùng)
      const alreadySent = await db.notification.findFirst({
        where: {
          userId,
          type: "expense_reminder",
          createdAt: { gte: new Date(vnTime.toDateString()) },
          title: { contains: "Nhắc ghi chi tiêu" },
        },
      });

      if (!alreadySent) {
        const title = "Nhắc ghi chi tiêu 💳";
        const body = "Bạn đã ghi chi tiêu hôm nay chưa? Đừng quên ghi lại!";

        // Lưu vào DB
        await db.notification.create({
          data: { title, message: body, type: "expense_reminder", userId },
        });

        // Gửi push
        const sent = await sendPushToUser(userId, title, body, "expense_reminder");
        totalSent += sent;
        totalNotifs++;
        log.push(`[${hhmm}] expense_reminder → user ${userId.slice(0, 8)} (sent: ${sent})`);
      }
    }

    // ── 2. Budget warning (check mỗi giờ, phút :00) ───────────────────────
    if (settings.budgetWarning && vnTime.getMinutes() === 0) {
      const month = vnTime.getMonth() + 1;
      const year = vnTime.getFullYear();

      // Lấy tất cả budgets của user tháng này
      const budgets = await db.budget.findMany({
        where: { userId, month, year },
        include: { category: true },
      });

      for (const budget of budgets) {
        // Tính spent
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        const agg = await db.transaction.aggregate({
          where: { userId, categoryId: budget.categoryId, type: "expense", date: { gte: start, lte: end } },
          _sum: { amount: true },
        });
        const spent = agg._sum.amount || 0;
        const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        if (pct < 80) continue;

        // Kiểm tra đã gửi trong 3 giờ qua chưa
        const recentlySent = await db.notification.findFirst({
          where: {
            userId,
            type: "budget_warning",
            title: { contains: budget.category.name },
            createdAt: { gte: new Date(Date.now() - 3 * 60 * 60 * 1000) },
          },
        });
        if (recentlySent) continue;

        const isOver = pct >= 100;
        const title = isOver
          ? `⚠️ Vượt ngân sách: ${budget.category.name}`
          : `🔶 Gần hết ngân sách: ${budget.category.name}`;
        const body = `Đã dùng ${pct.toFixed(0)}% — ${spent.toLocaleString("vi-VN")}đ / ${budget.amount.toLocaleString("vi-VN")}đ`;

        await db.notification.create({
          data: { title, message: body, type: "budget_warning", userId },
        });

        const sent = await sendPushToUser(userId, title, body, "budget_warning");
        totalSent += sent;
        totalNotifs++;
        log.push(`[budget] ${budget.category.name} ${pct.toFixed(0)}% → user ${userId.slice(0, 8)} (sent: ${sent})`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    time: hhmm,
    timezone: "Asia/Ho_Chi_Minh",
    usersChecked: usersWithSubs.length,
    notificationsCreated: totalNotifs,
    pushSent: totalSent,
    log,
  });
}

// Lấy notification settings của user từ DB
async function getUserNotifSettings(userId: string) {
  const setting = await db.notifSetting.findUnique({ where: { userId } });
  if (!setting) return null;
  return {
    expenseReminder: setting.expenseReminder,
    expenseReminderTime: setting.expenseReminderTime,
    goalReminder: setting.goalReminder,
    budgetWarning: setting.budgetWarning,
    billReminder: setting.billReminder,
  };
}
