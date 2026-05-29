import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  // Monthly transactions
  const txs = await db.transaction.findMany({
    where: { userId: session.user.id, date: { gte: start, lte: end } },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  const totalIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Category breakdown (expense)
  const catMap: Record<string, { name: string; icon: string; color: string; total: number }> = {};
  for (const tx of txs.filter((t) => t.type === "expense")) {
    const id = tx.categoryId;
    if (!catMap[id]) catMap[id] = { name: tx.category.name, icon: tx.category.icon, color: tx.category.color, total: 0 };
    catMap[id].total += tx.amount;
  }
  const categoryBreakdown = Object.values(catMap).sort((a, b) => b.total - a.total);

  // Daily chart
  const dailyMap: Record<string, { date: string; income: number; expense: number }> = {};
  for (const tx of txs) {
    const key = tx.date.toISOString().slice(0, 10);
    if (!dailyMap[key]) dailyMap[key] = { date: key, income: 0, expense: 0 };
    dailyMap[key][tx.type as "income" | "expense"] += tx.amount;
  }
  const dailyChart = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // Last 6 months chart
  const monthly = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const ms = new Date(d.getFullYear(), d.getMonth(), 1);
    const me = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const rows = await db.transaction.findMany({
      where: { userId: session.user.id, date: { gte: ms, lte: me } },
      select: { amount: true, type: true },
    });
    monthly.push({
      label: `${d.getMonth() + 1}/${d.getFullYear()}`,
      income: rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0),
      expense: rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0),
    });
  }

  return NextResponse.json({ totalIncome, totalExpense, balance: totalIncome - totalExpense, categoryBreakdown, dailyChart, monthly });
}
