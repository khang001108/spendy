const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

// Default categories seeded per user (called after register)
const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Ăn uống",       icon: "🍜", color: "#f97316" },
  { name: "Di chuyển",     icon: "🚗", color: "#3b82f6" },
  { name: "Nhà ở",         icon: "🏠", color: "#8b5cf6" },
  { name: "Mua sắm",       icon: "🛍️", color: "#ec4899" },
  { name: "Giải trí",      icon: "🎮", color: "#14b8a6" },
  { name: "Sức khỏe",      icon: "💊", color: "#ef4444" },
  { name: "Giáo dục",      icon: "📚", color: "#f59e0b" },
  { name: "Hóa đơn",       icon: "💡", color: "#6366f1" },
  { name: "Khác",          icon: "📦", color: "#6b7280" },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Lương",         icon: "💼", color: "#10b981" },
  { name: "Thưởng",        icon: "🎁", color: "#f59e0b" },
  { name: "Đầu tư",        icon: "📈", color: "#3b82f6" },
  { name: "Freelance",     icon: "💻", color: "#8b5cf6" },
  { name: "Thu nhập khác", icon: "💰", color: "#14b8a6" },
];

async function seedUserCategories(userId) {
  const cats = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, type: "expense", userId })),
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, type: "income", userId })),
  ];
  for (const cat of cats) {
    await db.category.upsert({
      where: { name_userId: { name: cat.name, userId } },
      update: {},
      create: cat,
    });
  }
}

module.exports = { seedUserCategories, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES };
