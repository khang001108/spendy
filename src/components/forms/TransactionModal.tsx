"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { formatVND } from "@/lib/utils";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  editTx?: any;
}

export function TransactionModal({ onClose, onSaved, editTx }: Props) {
  const [type, setType] = useState<"income" | "expense">(editTx?.type || "expense");
  const [amount, setAmount] = useState(editTx?.amount?.toString() || "");
  const [note, setNote] = useState(editTx?.note || "");
  const [date, setDate] = useState(editTx?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState(editTx?.categoryId || "");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Lock background scroll while modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  useEffect(() => {
    fetch(`/api/categories?type=${type}`).then((r) => r.json()).then((data) => {
      setCategories(data);
      if (!editTx) setCategoryId(data[0]?.id || "");
    });
  }, [type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { setError("Nhập số tiền hợp lệ"); return; }
    if (!categoryId) { setError("Chọn danh mục"); return; }
    setLoading(true); setError("");

    const body = { amount: parseFloat(amount), type, note, date, categoryId };
    const url = editTx ? `/api/transactions/${editTx.id}` : "/api/transactions";
    const method = editTx ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { onSaved(); onClose(); }
    else { const d = await res.json(); setError(d.error || "Lỗi"); }
    setLoading(false);
  }

  function handleAmountInput(val: string) {
    const clean = val.replace(/[^0-9]/g, "");
    setAmount(clean);
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 animate-[fade-in_0.2s_ease-out]">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800 modal-enter flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">
            {editTx ? "Sửa giao dịch" : "Thêm giao dịch"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {(["expense", "income"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  type === t
                    ? t === "expense" ? "bg-red-500 text-white" : "bg-green-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}>
                {t === "expense" ? "💸 Chi tiêu" : "💰 Thu nhập"}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="label">Số tiền (VND)</label>
            <input className="input text-xl font-bold" placeholder="0"
              value={amount ? parseInt(amount).toLocaleString("vi-VN") : ""}
              onChange={(e) => handleAmountInput(e.target.value.replace(/\./g, "").replace(/,/g, ""))}
            />
            {amount && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatVND(parseFloat(amount))}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="label">Danh mục</label>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {categories.map((cat) => (
                <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-xs ${
                    categoryId === cat.id
                      ? "border-green-400 bg-green-50 dark:bg-green-900/30"
                      : "border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}>
                  <span className="text-xl">{cat.icon}</span>
                  <span className="truncate w-full text-center text-gray-700 dark:text-gray-300">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="label">Ghi chú (tùy chọn)</label>
            <input className="input" placeholder="VD: Bữa trưa, tiền xăng..."
              value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {/* Date */}
          <div>
            <label className="label">Ngày</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? "Đang lưu..." : editTx ? "Cập nhật" : "Thêm giao dịch"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
