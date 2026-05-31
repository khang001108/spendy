import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function getMonthStats(userId: string, month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  const txs = await db.transaction.findMany({
    where: { userId, date: { gte: start, lte: end } },
    include: { category: true },
    orderBy: { date: "asc" },
  });
  const income = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { txs, income, expense };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const userId = session.user.id;

  // ── Tháng hiện tại ────────────────────────────────────────────────────
  const { txs, income: totalIncome, expense: totalExpense } = await getMonthStats(userId, month, year);

  // ── Tháng trước (so sánh) ─────────────────────────────────────────────
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const { income: prevIncome, expense: prevExpense } = await getMonthStats(userId, prevMonth, prevYear);

  const compareMonth = {
    prevMonth, prevYear,
    prevIncome, prevExpense,
    incomeDiff: totalIncome - prevIncome,
    expenseDiff: totalExpense - prevExpense,
    incomePct: prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : null,
    expensePct: prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : null,
  };

  // ── So sánh năm (12 tháng hiện tại vs 12 tháng năm trước) ────────────
  const yearStats: { month: number; income: number; expense: number }[] = [];
  const prevYearStats: { month: number; income: number; expense: number }[] = [];

  for (let m = 1; m <= 12; m++) {
    const curr = await getMonthStats(userId, m, year);
    yearStats.push({ month: m, income: curr.income, expense: curr.expense });
    const prev = await getMonthStats(userId, m, year - 1);
    prevYearStats.push({ month: m, income: prev.income, expense: prev.expense });
  }

  const yearTotal = { income: yearStats.reduce((s, m) => s + m.income, 0), expense: yearStats.reduce((s, m) => s + m.expense, 0) };
  const prevYearTotal = { income: prevYearStats.reduce((s, m) => s + m.income, 0), expense: prevYearStats.reduce((s, m) => s + m.expense, 0) };

  const compareYear = {
    year, prevYear: year - 1,
    yearTotal, prevYearTotal,
    incomeDiff: yearTotal.income - prevYearTotal.income,
    expenseDiff: yearTotal.expense - prevYearTotal.expense,
    incomePct: prevYearTotal.income > 0 ? ((yearTotal.income - prevYearTotal.income) / prevYearTotal.income) * 100 : null,
    expensePct: prevYearTotal.expense > 0 ? ((yearTotal.expense - prevYearTotal.expense) / prevYearTotal.expense) * 100 : null,
    monthly: yearStats.map((m, i) => ({
      label: `T${m.month}`,
      income: m.income,
      expense: m.expense,
      prevIncome: prevYearStats[i].income,
      prevExpense: prevYearStats[i].expense,
    })),
  };

  // ── Category breakdown ────────────────────────────────────────────────
  const catMap: Record<string, any> = {};
  for (const tx of txs.filter(t => t.type === "expense")) {
    const id = tx.categoryId;
    if (!catMap[id]) catMap[id] = { name: tx.category.name, icon: tx.category.icon, color: tx.category.color, total: 0, count: 0 };
    catMap[id].total += tx.amount;
    catMap[id].count++;
  }
  const categoryBreakdown = Object.values(catMap).sort((a, b) => b.total - a.total);

  // ── Daily chart ───────────────────────────────────────────────────────
  const dailyMap: Record<string, any> = {};
  for (const tx of txs) {
    const key = tx.date.toISOString().slice(0, 10);
    if (!dailyMap[key]) dailyMap[key] = { date: key, income: 0, expense: 0 };
    dailyMap[key][tx.type as "income" | "expense"] += tx.amount;
  }
  const dailyChart = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // ── Last 6 months ─────────────────────────────────────────────────────
  const monthly = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const r = await getMonthStats(userId, d.getMonth() + 1, d.getFullYear());
    monthly.push({ label: `${d.getMonth() + 1}/${d.getFullYear()}`, income: r.income, expense: r.expense });
  }

  return NextResponse.json({
    totalIncome, totalExpense,
    balance: totalIncome - totalExpense,
    categoryBreakdown, dailyChart, monthly,
    compareMonth, compareYear,
  });
}
