import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || "0");
  const year = parseInt(searchParams.get("year") || "0");
  const type = searchParams.get("type") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = { userId: session.user.id };
  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    where.date = { gte: start, lte: end };
  }
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;

  const transactions = await db.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, type, note, date, categoryId } = await req.json();
  if (!amount || !type || !categoryId)
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });

  const tx = await db.transaction.create({
    data: {
      amount: parseFloat(amount),
      type,
      note: note || "",
      date: date ? new Date(date) : new Date(),
      userId: session.user.id,
      categoryId,
    },
    include: { category: true },
  });

  return NextResponse.json(tx);
}
