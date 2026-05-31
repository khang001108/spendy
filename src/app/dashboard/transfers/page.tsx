"use client";
import { useEffect, useState } from "react";
import { formatVND, formatDate } from "@/lib/utils";
import { Plus, ArrowRight, Trash2 } from "lucide-react";

type Asset = { id: string; name: string; type: string; subtype?: string; currentValue: number };
type Transfer = {
  id: string;
  amount: number;
  note: string;
  date: string;
  fromAsset: Asset;
  toAsset: Asset;
};

function TransferModal({ assets, onClose, onSaved }: { assets: Asset[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    fromAssetId: "",
    toAssetId: "",
    amount: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fromAsset = assets.find(a => a.id === form.fromAssetId);

  async function handleSubmit() {
    if (!form.fromAssetId || !form.toAssetId || !form.amount) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (form.fromAssetId === form.toAssetId) {
      setError("Tài sản nguồn và đích không được giống nhau");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-800">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Chuyển tài sản</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Từ tài sản</label>
              <select className="input" value={form.fromAssetId} onChange={e => setForm(f => ({ ...f, fromAssetId: e.target.value }))}>
                <option value="">-- Chọn tài sản nguồn --</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatVND(a.currentValue)})
                  </option>
                ))}
              </select>
              {fromAsset && (
                <p className="text-xs text-gray-400 mt-1">Số dư: {formatVND(fromAsset.currentValue)}</p>
              )}
            </div>

            <div>
              <label className="label">Đến tài sản</label>
              <select className="input" value={form.toAssetId} onChange={e => setForm(f => ({ ...f, toAssetId: e.target.value }))}>
                <option value="">-- Chọn tài sản đích --</option>
                {assets.filter(a => a.id !== form.fromAssetId).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Số tiền (₫)</label>
              <input
                className="input"
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <label className="label">Ngày</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>

            <div>
              <label className="label">Ghi chú</label>
              <input className="input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Tùy chọn" />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? "Đang xử lý..." : "Chuyển"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function load() {
    setLoading(true);
    const [t, a] = await Promise.all([
      fetch("/api/transfers").then(r => r.json()),
      fetch("/api/assets").then(r => r.json()),
    ]);
    setTransfers(Array.isArray(t) ? t : []);
    setAssets(Array.isArray(a) ? a : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deleteTransfer(id: string) {
    if (!confirm("Xóa lệnh chuyển này? Số dư tài sản sẽ được hoàn lại.")) return;
    await fetch(`/api/transfers/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Chuyển tài sản</h1>
          <p className="page-subtitle">Chuyển tiền giữa các tài khoản & ví</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={assets.length < 2}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={18} /> Tạo lệnh chuyển
        </button>
      </div>

      {assets.length < 2 && (
        <div className="card bg-amber-50 border-amber-200 text-amber-700 text-sm">
          ⚠️ Bạn cần thêm ít nhất 2 tài sản để tạo lệnh chuyển.
          <a href="/dashboard/assets" className="underline ml-1 font-medium">Thêm tài sản →</a>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Lịch sử chuyển</h2>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">↔️</p>
            <p className="text-sm">Chưa có lệnh chuyển nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {transfers.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 py-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="text-center min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tx.fromAsset.name}</p>
                    <p className="text-xs text-gray-400 truncate">{tx.fromAsset.subtype}</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-400 shrink-0" />
                  <div className="text-center min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tx.toAsset.name}</p>
                    <p className="text-xs text-gray-400 truncate">{tx.toAsset.subtype}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-blue-600 text-sm">{formatVND(tx.amount)}</p>
                  <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                  {tx.note && <p className="text-xs text-gray-400 truncate max-w-[100px]">{tx.note}</p>}
                </div>
                <button onClick={() => deleteTransfer(tx.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <TransferModal assets={assets} onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  );
}
