import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const backup = await req.json();
    if (!backup.categories) {
      return NextResponse.json({ error: "File backup không hợp lệ" }, { status: 400 });
    }

    const userId = session.user.id;
    const counts = { categories: 0, transactions: 0, goals: 0, assets: 0, budgets: 0 };

    // ── 1. Categories (phải restore trước vì transactions phụ thuộc) ──────
    const categoryIdMap: Record<string, string> = {}; // old id → new id

    for (const cat of backup.categories || []) {
      const existing = await db.category.upsert({
        where: { name_userId: { name: cat.name, userId } },
        update: { icon: cat.icon, color: cat.color },
        create: {
          name: cat.name,
          icon: cat.icon || "💰",
          color: cat.color || "#6366f1",
          type: cat.type,
          userId,
        },
      });
      categoryIdMap[cat.id] = existing.id;
      counts.categories++;
    }

    // ── 2. Transactions ───────────────────────────────────────────────────
    for (const tx of backup.transactions || []) {
      const newCategoryId = categoryIdMap[tx.categoryId];
      if (!newCategoryId) continue; // skip nếu category không map được

      await db.transaction.create({
        data: {
          amount: tx.amount,
          type: tx.type,
          note: tx.note || "",
          date: new Date(tx.date),
          categoryId: newCategoryId,
          userId,
        },
      }).catch(() => {}); // bỏ qua nếu lỗi duplicate
      counts.transactions++;
    }

    // ── 3. Goals ─────────────────────────────────────────────────────────
    for (const goal of backup.goals || []) {
      await db.goal.create({
        data: {
          name: goal.name,
          icon: goal.icon || "🎯",
          targetAmount: goal.targetAmount,
          savedAmount: goal.savedAmount || 0,
          deadline: goal.deadline ? new Date(goal.deadline) : null,
          color: goal.color || "#10b981",
          status: goal.status || "active",
          userId,
        },
      }).catch(() => {});
      counts.goals++;
    }

    // ── 4. Assets ─────────────────────────────────────────────────────────
    for (const asset of backup.assets || []) {
      await db.asset.create({
        data: {
          name: asset.name,
          type: asset.type,
          subtype: asset.subtype || null,
          purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : null,
          purchasePrice: asset.purchasePrice || 0,
          currentValue: asset.currentValue || 0,
          note: asset.note || "",
          userId,
        },
      }).catch(() => {});
      counts.assets++;
    }

    // ── 5. Budgets ────────────────────────────────────────────────────────
    for (const budget of backup.budgets || []) {
      const newCategoryId = categoryIdMap[budget.categoryId];
      if (!newCategoryId) continue;

      await db.budget.upsert({
        where: {
          userId_categoryId_month_year: {
            userId,
            categoryId: newCategoryId,
            month: budget.month,
            year: budget.year,
          },
        },
        update: { amount: budget.amount },
        create: {
          amount: budget.amount,
          month: budget.month,
          year: budget.year,
          categoryId: newCategoryId,
          userId,
        },
      }).catch(() => {});
      counts.budgets++;
    }

    return NextResponse.json({
      ok: true,
      message: `Khôi phục thành công! ${counts.categories} danh mục, ${counts.transactions} giao dịch, ${counts.goals} mục tiêu, ${counts.assets} tài sản, ${counts.budgets} ngân sách`,
      counts,
    });
  } catch (err) {
    console.error("Restore error:", err);
    return NextResponse.json({ error: "Lỗi khi khôi phục dữ liệu" }, { status: 500 });
  }
}
