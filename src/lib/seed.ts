import { db } from "./db";

const EXPENSE_CATS = [
  { name: "Ăn uống",    icon: "🍜", color: "#f97316" },
  { name: "Di chuyển",  icon: "🚗", color: "#3b82f6" },
  { name: "Nhà ở",      icon: "🏠", color: "#8b5cf6" },
  { name: "Mua sắm",    icon: "🛍️", color: "#ec4899" },
  { name: "Giải trí",   icon: "🎮", color: "#14b8a6" },
  { name: "Sức khỏe",   icon: "💊", color: "#ef4444" },
  { name: "Giáo dục",   icon: "📚", color: "#f59e0b" },
  { name: "Hóa đơn",    icon: "💡", color: "#6366f1" },
  { name: "Khác",       icon: "📦", color: "#6b7280" },
];

const INCOME_CATS = [
  { name: "Lương",          icon: "💼", color: "#10b981" },
  { name: "Thưởng",         icon: "🎁", color: "#f59e0b" },
  { name: "Đầu tư",         icon: "📈", color: "#3b82f6" },
  { name: "Freelance",      icon: "💻", color: "#8b5cf6" },
  { name: "Thu nhập khác",  icon: "💰", color: "#14b8a6" },
];

export async function seedUserCategories(userId: string) {
  const all = [
    ...EXPENSE_CATS.map((c) => ({ ...c, type: "expense", userId })),
    ...INCOME_CATS.map((c) => ({ ...c, type: "income", userId })),
  ];
  for (const cat of all) {
    await db.category.upsert({
      where: { name_userId: { name: cat.name, userId } },
      update: {},
      create: cat,
    });
  }
}
