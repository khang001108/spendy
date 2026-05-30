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

  const budgets = await db.budget.findMany({
    where: { userId: session.user.id, month, year },
    include: { category: true },
  });

  // Calculate spent amount per category this month
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const results = await Promise.all(
    budgets.map(async (budget) => {
      const agg = await db.transaction.aggregate({
        where: {
          userId: session.user.id,
          categoryId: budget.categoryId,
          type: "expense",
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });
      const spent = agg._sum.amount || 0;
      return {
        ...budget,
        spent,
        remaining: budget.amount - spent,
        percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
      };
    })
  );

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, categoryId, month, year } = await req.json();
  if (!amount || !categoryId || !month || !year)
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });

  const budget = await db.budget.upsert({
    where: { userId_categoryId_month_year: { userId: session.user.id, categoryId, month, year } },
    update: { amount: parseFloat(amount) },
    create: {
      amount: parseFloat(amount),
      categoryId,
      month,
      year,
      userId: session.user.id,
    },
    include: { category: true },
  });

  return NextResponse.json(budget);
}
