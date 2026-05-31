"use client";
import { useEffect, useState } from "react";
import { formatVND, formatDate, getCurrentMonth, formatMonth } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, Plus, ChevronLeft, ChevronRight, Cpu, PiggyBank, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { TransactionModal } from "@/components/forms/TransactionModal";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [{ month, year }, setPeriod] = useState(getCurrentMonth());
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [s, t, a, b] = await Promise.all([
      fetch(`/api/stats?month=${month}&year=${year}`).then(r => r.json()),
      fetch(`/api/transactions?month=${month}&year=${year}&limit=8`).then(r => r.json()),
      fetch("/api/assets").then(r => r.json()),
      fetch(`/api/budgets?month=${month}&year=${year}`).then(r => r.json()),
    ]);
    setStats(s);
    setTransactions(t);
    setAssets(Array.isArray(a) ? a : []);
    setBudgets(Array.isArray(b) ? b : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [month, year]);

  function prevMonth() {
    setPeriod(({ month, year }) => month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year });
  }
  function nextMonth() {
    const now = getCurrentMonth();
    if (year > now.year || (year === now.year && month >= now.month)) return;
    setPeriod(({ month, year }) => month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year });
  }

  const financialAssets = assets.filter(a => a.type === "financial");
  const physicalAssets = assets.filter(a => a.type === "physical");
  const totalFinancial = financialAssets.reduce((s: number, a: any) => s + a.currentValue, 0);
  const totalPhysical = physicalAssets.reduce((s: number, a: any) => s + a.currentValue, 0);
  const totalAssets = totalFinancial + totalPhysical;

  const overBudgetCount = budgets.filter((b: any) => b.percentage > 100).length;
  const totalBudget = budgets.reduce((s: number, b: any) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s: number, b: any) => s + b.spent, 0);
  const budgetRemaining = totalBudget - totalSpent;
  const savings = (stats?.totalIncome || 0) - (stats?.totalExpense || 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tổng quan</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Chào mừng trở lại! 👋</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Thêm giao dịch
        </button>
      </div>

      {/* Month picker */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-gray-700 min-w-36 text-center capitalize">{formatMonth(month, year)}</span>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Asset overview (only when assets exist) */}
      {!loading && assets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
            <p className="text-indigo-100 text-sm font-medium">Tổng tài sản</p>
            <p className="text-2xl font-bold mt-1">{formatVND(totalAssets)}</p>
            <div className="flex gap-3 mt-2 text-xs text-indigo-200">
              <span>TC: {formatVND(totalFinancial)}</span>
              <span>VL: {formatVND(totalPhysical)}</span>
            </div>
          </div>
          <Link href="/dashboard/assets" className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 hover:scale-[1.01] transition-transform">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-green-100" />
              <p className="text-green-100 text-sm font-medium">Tài chính</p>
            </div>
            <p className="text-2xl font-bold">{formatVND(totalFinancial)}</p>
            <p className="text-green-100 text-xs mt-1">{financialAssets.length} tài khoản</p>
          </Link>
          <Link href="/dashboard/assets" className="card bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 hover:scale-[1.01] transition-transform">
            <div className="flex items-center gap-2 mb-1">
              <Cpu size={16} className="text-blue-100" />
              <p className="text-blue-100 text-sm font-medium">Vật lý</p>
            </div>
            <p className="text-2xl font-bold">{formatVND(totalPhysical)}</p>
            <p className="text-blue-100 text-xs mt-1">{physicalAssets.length} thiết bị</p>
          </Link>
        </div>
      )}

      {/* Monthly summary */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card h-28 animate-pulse bg-gray-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Thu tháng này</p>
                <p className="text-2xl font-bold mt-1">{formatVND(stats?.totalIncome || 0)}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-xl"><TrendingUp size={22} /></div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-rose-600 text-white border-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Chi tháng này</p>
                <p className="text-2xl font-bold mt-1">{formatVND(stats?.totalExpense || 0)}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-xl"><TrendingDown size={22} /></div>
            </div>
          </div>

          <div className={`card text-white border-0 bg-gradient-to-br ${savings >= 0 ? "from-blue-500 to-indigo-600" : "from-orange-500 to-amber-600"}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Tiết kiệm tháng</p>
                <p className="text-2xl font-bold mt-1">{formatVND(savings)}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-xl"><PiggyBank size={22} /></div>
            </div>
          </div>
        </div>
      )}

      {/* Budget status (when budgets exist) */}
      {!loading && budgets.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              Ngân sách tháng
              {overBudgetCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={12} /> {overBudgetCount} vượt
                </span>
              )}
            </h2>
            <Link href="/dashboard/budget" className="text-sm text-green-600 hover:underline font-medium">Xem chi tiết →</Link>
          </div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-gray-500">Đã chi / Ngân sách</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatVND(totalSpent)} / {formatVND(totalBudget)}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${totalBudget > 0 && totalSpent / totalBudget > 1 ? "bg-red-500" : totalBudget > 0 && totalSpent / totalBudget > 0.8 ? "bg-orange-400" : "bg-green-500"}`}
              style={{ width: totalBudget > 0 ? `${Math.min((totalSpent / totalBudget) * 100, 100)}%` : "0%" }}
            />
          </div>
          {budgetRemaining > 0 && (
            <p className="text-xs text-gray-400 mt-1.5 text-right">Còn lại: {formatVND(budgetRemaining)}</p>
          )}
        </div>
      )}

      {/* Category breakdown */}
      {!loading && stats?.categoryBreakdown?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Chi tiêu theo danh mục</h2>
          <div className="space-y-3">
            {stats.categoryBreakdown.slice(0, 5).map((cat: any) => {
              const pct = stats.totalExpense > 0 ? (cat.total / stats.totalExpense) * 100 : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 flex items-center gap-1.5">
                      <span>{cat.icon}</span>{cat.name}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatVND(cat.total)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Giao dịch gần đây</h2>
          <Link href="/dashboard/transactions" className="text-sm text-green-600 hover:underline font-medium">Xem tất cả →</Link>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">Chưa có giao dịch nào tháng này</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-green-600 text-sm font-medium hover:underline">
              + Thêm giao dịch đầu tiên
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: tx.category.color + "20" }}>
                  {tx.category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {tx.note || tx.category.name}
                  </p>
                  <p className="text-xs text-gray-400">{tx.category.name} · {formatDate(tx.date)}</p>
                </div>
                <span className={`font-semibold text-sm ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                  {tx.type === "income" ? "+" : "-"}{formatVND(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <TransactionModal onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  );
}
