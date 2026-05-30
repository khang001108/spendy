import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "csv";

  const transactions = await db.transaction.findMany({
    where: { userId: session.user.id },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  if (format === "json") {
    // Backup full data
    const [categories, goals, assets, budgets] = await Promise.all([
      db.category.findMany({ where: { userId: session.user.id } }),
      db.goal.findMany({ where: { userId: session.user.id } }),
      db.asset.findMany({ where: { userId: session.user.id } }),
      db.budget.findMany({ where: { userId: session.user.id }, include: { category: true } }),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      transactions,
      categories,
      goals,
      assets,
      budgets,
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="spendy-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }

  // CSV export
  const rows = [
    ["Ngày", "Loại", "Danh mục", "Số tiền", "Ghi chú"].join(","),
    ...transactions.map((tx) =>
      [
        new Date(tx.date).toLocaleDateString("vi-VN"),
        tx.type === "income" ? "Thu" : "Chi",
        tx.category.name,
        tx.amount,
        `"${tx.note.replace(/"/g, '""')}"`,
      ].join(",")
    ),
  ].join("\n");

  return new NextResponse("\uFEFF" + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="spendy-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
