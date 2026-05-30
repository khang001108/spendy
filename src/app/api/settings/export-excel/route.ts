import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// NOTE: xlsx package must be installed: npm install xlsx
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const XLSX = await import("xlsx");

    const [transactions, assets, budgets] = await Promise.all([
      db.transaction.findMany({
        where: { userId: session.user.id },
        include: { category: true },
        orderBy: { date: "desc" },
      }),
      db.asset.findMany({ where: { userId: session.user.id } }),
      db.budget.findMany({
        where: { userId: session.user.id },
        include: { category: true },
      }),
    ]);

    const wb = XLSX.utils.book_new();

    // Sheet 1: Transactions
    const txData = transactions.map(tx => ({
      "Ngày": new Date(tx.date).toLocaleDateString("vi-VN"),
      "Loại": tx.type === "income" ? "Thu" : "Chi",
      "Danh mục": tx.category.name,
      "Số tiền": tx.amount,
      "Ghi chú": tx.note,
    }));
    const txSheet = XLSX.utils.json_to_sheet(txData);
    txSheet["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, txSheet, "Giao dịch");

    // Sheet 2: Assets
    const assetData = assets.map(a => ({
      "Tên": a.name,
      "Loại": a.type === "financial" ? "Tài chính" : "Vật lý",
      "Phân loại": a.subtype || "",
      "Ngày mua": a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString("vi-VN") : "",
      "Giá mua": a.purchasePrice,
      "Giá hiện tại": a.currentValue,
      "Lãi/Lỗ": a.currentValue - a.purchasePrice,
      "Ghi chú": a.note,
    }));
    const assetSheet = XLSX.utils.json_to_sheet(assetData);
    assetSheet["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, assetSheet, "Tài sản");

    // Sheet 3: Budgets
    const budgetData = budgets.map(b => ({
      "Tháng/Năm": `${b.month}/${b.year}`,
      "Danh mục": b.category.name,
      "Ngân sách": b.amount,
    }));
    const budgetSheet = XLSX.utils.json_to_sheet(budgetData);
    XLSX.utils.book_append_sheet(wb, budgetSheet, "Ngân sách");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="spendy-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Lỗi tạo file Excel. Đảm bảo đã cài package xlsx." }, { status: 500 });
  }
}
