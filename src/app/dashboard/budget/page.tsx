"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatVND, formatMonth, getCurrentMonth, formatDate } from "@/lib/utils";
import { Plus, Trash2, ChevronLeft, ChevronRight, AlertTriangle, X, TrendingDown, Receipt } from "lucide-react";

type Category = { id: string; name: string; icon: string; color: string };
type Budget = {
  id: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  category: Category;
  month: number;
  year: number;
};
type Transaction = {
  id: string;
  amount: number;
  type: string;
  note: string;
  date: string;
  category: Category;
};

function BudgetModal({ categories, month, year, onClose, onSaved }: {
  categories: Category[];
  month: number;
  year: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ categoryId: "", amount: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function handleSubmit() {
    if (!form.categoryId || !form.amount) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, month, year }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Lỗi xảy ra");
      } else {
        onSaved();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Thêm ngân sách</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Danh mục</label>
              <select className="input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Ngân sách (₫)</label>
              <input
                className="input"
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="VD: 3000000"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? "Đang lưu..." : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function BudgetDetailPanel({ budget, month, year, onClose }: {
  budget: Budget;
  month: number;
  year: number;
  onClose: () => void;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch(`/api/transactions?month=${month}&year=${year}&categoryId=${budget.category.id}&type=expense`)
      .then(r => r.json())
      .then(data => {
        // filter by categoryId client-side since API may not support it
        const filtered = Array.isArray(data)
          ? data.filter((tx: any) => tx.categoryId === budget.category.id || tx.category?.id === budget.category.id)
          : [];
        setTransactions(filtered);
      })
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, [budget.category.id, month, year]);

  const pct = Math.min(budget.percentage, 100);
  const isOver = budget.percentage > 100;
  const isNear = budget.percentage >= 80 && budget.percentage <= 100;
  const barColor = isOver ? "bg-red-500" : isNear ? "bg-orange-400" : "bg-green-500";

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[88dvh] animate-[fade-up_0.25s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{budget.category.icon}</span>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{budget.category.name}</p>
              <p className="text-xs text-gray-400">{formatMonth(month, year)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Budget summary */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Đã chi / Ngân sách</p>
              <p className="font-bold text-gray-900 dark:text-white text-sm">
                {formatVND(budget.spent)} <span className="text-gray-400 font-normal">/ {formatVND(budget.amount)}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">{isOver ? "Vượt" : "Còn lại"}</p>
              <p className={`font-bold text-sm ${isOver ? "text-red-500" : "text-green-500"}`}>
                {isOver ? "-" : "+"}{formatVND(Math.abs(budget.remaining))}
              </p>
            </div>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${pct}%`, backgroundColor: !isOver && !isNear ? budget.category.color : undefined }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-400">{budget.percentage.toFixed(0)}% đã dùng</p>
            {isOver && (
              <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                Vượt {(budget.percentage - 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Receipt size={12} /> Giao dịch trong tháng ({transactions.length})
            </p>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                      <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                    </div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <TrendingDown size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chưa có giao dịch nào trong tháng này</p>
              </div>
            ) : (
              <div className="space-y-1 divide-y divide-gray-50 dark:divide-gray-800">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 py-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: budget.category.color + "20" }}
                    >
                      {budget.category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {tx.note || budget.category.name}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-red-500 shrink-0">
                      -{formatVND(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [{ month, year }, setPeriod] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  async function load() {
    setLoading(true);
    const [b, c] = await Promise.all([
      fetch(`/api/budgets?month=${month}&year=${year}`).then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
    ]);
    setBudgets(Array.isArray(b) ? b : []);
    setCategories(Array.isArray(c) ? c.filter((cat: any) => cat.type === "expense") : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [month, year]);

  async function deleteBudget(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Xóa ngân sách này?")) return;
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    load();
  }

  function prevMonth() {
    setPeriod(({ month, year }) => month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year });
  }
  function nextMonth() {
    const now = getCurrentMonth();
    if (year > now.year || (year === now.year && month >= now.month)) return;
    setPeriod(({ month, year }) => month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year });
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudget = budgets.filter(b => b.percentage > 100);

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Ngân sách</h1>
          <p className="page-subtitle">Kiểm soát chi tiêu theo danh mục</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Thêm ngân sách
        </button>
      </div>

      {/* Month picker */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><ChevronLeft size={18} /></button>
        <span className="font-semibold text-gray-700 dark:text-gray-200 min-w-36 text-center capitalize">{formatMonth(month, year)}</span>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><ChevronRight size={18} /></button>
      </div>

      {/* Over budget warnings */}
      {overBudget.length > 0 && (
        <div className="card border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold mb-2">
            <AlertTriangle size={18} />
            {overBudget.length} danh mục vượt ngân sách!
          </div>
          <div className="space-y-1">
            {overBudget.map(b => (
              <p key={b.id} className="text-sm text-red-600 dark:text-red-400">
                {b.category.icon} {b.category.name}: chi {formatVND(b.spent)} / ngân sách {formatVND(b.amount)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Tổng đã chi / Tổng ngân sách</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {formatVND(totalSpent)} / {formatVND(totalBudget)}
            </span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${totalSpent / totalBudget > 1 ? "bg-red-500" : totalSpent / totalBudget > 0.8 ? "bg-orange-400" : "bg-green-500"}`}
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right">Còn lại: {formatVND(totalBudget - totalSpent)}</p>
        </div>
      )}

      {/* Budget list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
      ) : budgets.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📊</p>
          <p className="font-medium text-gray-600 dark:text-gray-300">Chưa có ngân sách nào</p>
          <p className="text-sm mt-1">Đặt giới hạn chi tiêu cho từng danh mục</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto">+ Thêm ngân sách</button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map(budget => {
            const pct = Math.min(budget.percentage, 100);
            const isOver = budget.percentage > 100;
            const isNear = budget.percentage >= 80 && budget.percentage <= 100;
            return (
              <div
                key={budget.id}
                onClick={() => setSelectedBudget(budget)}
                className={`card cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${isOver ? "border-red-200 dark:border-red-800" : "hover:border-gray-200 dark:hover:border-gray-700"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{budget.category.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{budget.category.name}</p>
                      <p className="text-xs text-gray-400">
                        {formatVND(budget.spent)} / {formatVND(budget.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOver && <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">Vượt!</span>}
                    {isNear && !isOver && <span className="text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">Gần hết</span>}
                    <span className={`text-sm font-bold ${isOver ? "text-red-600" : budget.remaining > 0 ? "text-green-600" : "text-gray-500"}`}>
                      {budget.remaining > 0 ? "+" : ""}{formatVND(budget.remaining)}
                    </span>
                    <button
                      onClick={(e) => deleteBudget(budget.id, e)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-red-500" : isNear ? "bg-orange-400" : "bg-green-500"}`}
                    style={{ width: `${pct}%`, backgroundColor: !isOver && !isNear ? budget.category.color : undefined }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">{budget.percentage.toFixed(0)}% đã dùng</p>
                  <p className="text-xs text-gray-400">Nhấn để xem chi tiết →</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <BudgetModal
          categories={categories}
          month={month}
          year={year}
          onClose={() => setShowModal(false)}
          onSaved={load}
        />
      )}

      {selectedBudget && (
        <BudgetDetailPanel
          budget={selectedBudget}
          month={month}
          year={year}
          onClose={() => setSelectedBudget(null)}
        />
      )}
    </div>
  );
}
