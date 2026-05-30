"use client";
import { useEffect, useState } from "react";
import { formatVND, formatMonth, getCurrentMonth } from "@/lib/utils";
import { Plus, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Thêm ngân sách</h2>
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
    </div>
  );
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [{ month, year }, setPeriod] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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

  async function deleteBudget(id: string) {
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
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ngân sách</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kiểm soát chi tiêu theo danh mục</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Thêm ngân sách
        </button>
      </div>

      {/* Month picker */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
        <span className="font-semibold text-gray-700 min-w-36 text-center capitalize">{formatMonth(month, year)}</span>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
      </div>

      {/* Over budget warnings */}
      {overBudget.length > 0 && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
            <AlertTriangle size={18} />
            {overBudget.length} danh mục vượt ngân sách!
          </div>
          <div className="space-y-1">
            {overBudget.map(b => (
              <p key={b.id} className="text-sm text-red-600">
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
            <span className="text-sm text-gray-600">Tổng đã chi / Tổng ngân sách</span>
            <span className="font-bold text-gray-900">
              {formatVND(totalSpent)} / {formatVND(totalBudget)}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
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
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}</div>
      ) : budgets.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📊</p>
          <p className="font-medium text-gray-600">Chưa có ngân sách nào</p>
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
              <div key={budget.id} className={`card ${isOver ? "border-red-200" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{budget.category.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{budget.category.name}</p>
                      <p className="text-xs text-gray-400">
                        {formatVND(budget.spent)} / {formatVND(budget.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOver && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Vượt!</span>}
                    {isNear && !isOver && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Gần hết</span>}
                    <span className={`text-sm font-bold ${isOver ? "text-red-600" : budget.remaining > 0 ? "text-green-600" : "text-gray-500"}`}>
                      {budget.remaining > 0 ? "+" : ""}{formatVND(budget.remaining)}
                    </span>
                    <button onClick={() => deleteBudget(budget.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-red-500" : isNear ? "bg-orange-400" : "bg-green-500"}`}
                    style={{ width: `${pct}%`, backgroundColor: !isOver && !isNear ? budget.category.color : undefined }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">{budget.percentage.toFixed(0)}% đã dùng</p>
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
    </div>
  );
}
