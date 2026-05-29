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
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Giao dịch</h1>
        <button onClick={() => { setEditTx(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Thêm
        </button>
      </div>

      {/* Month picker + filters */}
      <div className="card space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18}/></button>
          <span className="font-semibold text-gray-700 min-w-36 text-center capitalize">{formatMonth(month, year)}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={18}/></button>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8 py-2" placeholder="Tìm kiếm..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {[["all","Tất cả"],["expense","Chi tiêu"],["income","Thu nhập"]].map(([v,l])=>(
              <button key={v} onClick={() => setTypeFilter(v)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${typeFilter===v?"bg-gray-900 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Summary row */}
        <div className="flex gap-4 pt-1 text-sm">
          <span className="text-green-600 font-semibold">Thu: {formatVND(totalIncome)}</span>
          <span className="text-red-500 font-semibold">Chi: {formatVND(totalExpense)}</span>
          <span className={`font-semibold ${totalIncome-totalExpense>=0?"text-blue-600":"text-orange-500"}`}>
            Còn: {formatVND(totalIncome-totalExpense)}
          </span>
        </div>
      </div>

      {/* List */}
      <div className="card">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i=><div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse"/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🔍</p>
            <p>Không có giao dịch nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-3 group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: tx.category.color + "20" }}>
                  {tx.category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.note || tx.category.name}</p>
                  <p className="text-xs text-gray-400">{tx.category.name} · {formatDate(tx.date)}</p>
                </div>
                <span className={`font-bold text-sm flex-shrink-0 ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                  {tx.type === "income" ? "+" : "-"}{formatVND(tx.amount)}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditTx(tx); setShowModal(true); }}
                    className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(tx.id)}
                    className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <TransactionModal onClose={() => { setShowModal(false); setEditTx(null); }} onSaved={load} editTx={editTx} />}
    </div>
  );
}
