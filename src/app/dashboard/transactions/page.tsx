"use client";
import { useEffect, useState } from "react";
import { formatVND, formatDate, getCurrentMonth, formatMonth } from "@/lib/utils";
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { TransactionModal } from "@/components/forms/TransactionModal";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [{ month, year }, setPeriod] = useState(getCurrentMonth());
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const t = await fetch(`/api/transactions?month=${month}&year=${year}&limit=200`).then((r) => r.json());
    setTransactions(Array.isArray(t) ? t : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [month, year]);

  async function handleDelete(id: string) {
    if (!confirm("Xóa giao dịch này?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = transactions.filter((tx) => {
    const matchType = typeFilter === "all" || tx.type === typeFilter;
    const matchSearch = !filter || tx.note?.toLowerCase().includes(filter.toLowerCase()) || tx.category.name.toLowerCase().includes(filter.toLowerCase());
    return matchType && matchSearch;
  });

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  function prevMonth() {
    setPeriod(({ month, year }) => month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year });
  }
  function nextMonth() {
    const now = getCurrentMonth();
    if (year > now.year || (year === now.year && month >= now.month)) return;
    setPeriod(({ month, year }) => month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Giao dịch</h1>
        <button
          onClick={() => { setEditTx(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Thêm
        </button>
      </div>

      {/* Filters card */}
      <div className="card space-y-3 !p-4">
        {/* Month picker */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm capitalize">
            {formatMonth(month, year)}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Search + type filter */}
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-8 !py-2 !text-xs"
              placeholder="Tìm kiếm..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
            {[["all","Tất cả"],["expense","Chi tiêu"],["income","Thu nhập"]].map(([v, l]) => (
              <button key={v} onClick={() => setTypeFilter(v)}
                className={`px-2.5 py-2 text-xs font-medium transition-colors ${
                  typeFilter === v
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="flex gap-3 pt-0.5 text-xs flex-wrap">
          <span className="text-green-600 dark:text-green-400 font-semibold">Thu: {formatVND(totalIncome)}</span>
          <span className="text-red-500 dark:text-red-400 font-semibold">Chi: {formatVND(totalExpense)}</span>
          <span className={`font-semibold ${totalIncome - totalExpense >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-500"}`}>
            Còn: {formatVND(totalIncome - totalExpense)}
          </span>
        </div>
      </div>

      {/* List */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="space-y-px p-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse mb-2" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm">Không có giao dịch nào</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-green-600 dark:text-green-400 text-sm font-medium hover:underline">
              + Thêm giao dịch
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {filtered.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: tx.category.color + "22" }}
                >
                  {tx.category.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {tx.note || tx.category.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {tx.category.name} · {formatDate(tx.date)}
                  </p>
                </div>

                {/* Amount */}
                <span className={`font-bold text-sm flex-shrink-0 ${tx.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                  {tx.type === "income" ? "+" : "-"}{formatVND(tx.amount)}
                </span>

                {/* Actions — visible on hover (desktop) or always on mobile touch */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 sm:transition-opacity touch-action-auto">
                  <button
                    onClick={() => { setEditTx(tx); setShowModal(true); }}
                    className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TransactionModal
          onClose={() => { setShowModal(false); setEditTx(null); }}
          onSaved={load}
          editTx={editTx}
        />
      )}
    </div>
  );
}
