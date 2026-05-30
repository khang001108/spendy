import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setting = await db.notifSetting.findUnique({
    where: { userId: session.user.id },
  });

  // Return defaults if not set
  return NextResponse.json(setting || {
    expenseReminder: true,
    expenseReminderTime: "20:00",
    goalReminder: true,
    budgetWarning: true,
    billReminder: false,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { expenseReminder, expenseReminderTime, goalReminder, budgetWarning, billReminder } = await req.json();

  const setting = await db.notifSetting.upsert({
    where: { userId: session.user.id },
    update: {
      expenseReminder: !!expenseReminder,
      expenseReminderTime: expenseReminderTime || "20:00",
      goalReminder: !!goalReminder,
      budgetWarning: !!budgetWarning,
      billReminder: !!billReminder,
    },
    create: {
      userId: session.user.id,
      expenseReminder: !!expenseReminder,
      expenseReminderTime: expenseReminderTime || "20:00",
      goalReminder: !!goalReminder,
      budgetWarning: !!budgetWarning,
      billReminder: !!billReminder,
    },
  });

  return NextResponse.json(setting);
}
