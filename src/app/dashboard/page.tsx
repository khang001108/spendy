"use client";
import { useEffect, useState } from "react";
import { formatVND, formatDate, getCurrentMonth, formatMonth } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { TransactionModal } from "@/components/forms/TransactionModal";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [{ month, year }, setPeriod] = useState(getCurrentMonth());
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [s, t] = await Promise.all([
      fetch(`/api/stats?month=${month}&year=${year}`).then((r) => r.json()),
      fetch(`/api/transactions?month=${month}&year=${year}&limit=8`).then((r) => r.json()),
    ]);
    setStats(s); setTransactions(t);
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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
          <p className="text-gray-500 text-sm mt-0.5">Chào mừng trở lại! 👋</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Thêm giao dịch
        </button>
      </div>

      {/* Month picker */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-gray-700 min-w-36 text-center capitalize">
          {formatMonth(month, year)}
        </span>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i=><div key={i} className="card h-28 animate-pulse bg-gray-100"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Thu nhập</p>
                <p className="text-2xl font-bold mt-1">{formatVND(stats?.totalIncome || 0)}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-xl"><TrendingUp size={22} /></div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-rose-600 text-white border-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Chi tiêu</p>
                <p className="text-2xl font-bold mt-1">{formatVND(stats?.totalExpense || 0)}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-xl"><TrendingDown size={22} /></div>
            </div>
          </div>

          <div className={`card text-white border-0 bg-gradient-to-br ${(stats?.balance||0)>=0?"from-blue-500 to-indigo-600":"from-orange-500 to-amber-600"}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Số dư</p>
                <p className="text-2xl font-bold mt-1">{formatVND(stats?.balance || 0)}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-xl"><Wallet size={22} /></div>
            </div>
          </div>
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
                    <span className="text-sm font-semibold text-gray-900">{formatVND(cat.total)}</span>
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
          <h2 className="font-semibold text-gray-900">Giao dịch gần đây</h2>
          <Link href="/dashboard/transactions" className="text-sm text-green-600 hover:underline font-medium">
            Xem tất cả →
          </Link>
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
          <div className="divide-y divide-gray-50">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: tx.category.color + "20" }}>
                  {tx.category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
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
