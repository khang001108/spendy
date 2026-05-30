"use client";
import { useEffect, useState } from "react";
import { formatVND, formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, Wallet, Cpu, TrendingUp, TrendingDown } from "lucide-react";

type Asset = {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  purchaseDate?: string;
  purchasePrice: number;
  currentValue: number;
  note: string;
  image?: string;
};

const FINANCIAL_SUBTYPES = ["Tiền mặt", "VCB", "MB Bank", "Techcombank", "BIDV", "Momo", "ZaloPay", "VNPay", "Khác"];
const PHYSICAL_SUBTYPES = [ "Điện thoại", "Laptop", "Máy tính", "Máy tính bảng", "Xe đạp", "Xe máy", "Ô tô", "Vàng", "Trang sức", "Đất", "Nhà ở", "Chung cư", "Thiết bị công nghiệp", "Robot", "Máy in 3D", "Khác"];
function AssetModal({ asset, onClose, onSaved }: { asset?: Asset; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: asset?.name || "",
    type: asset?.type || "financial",
    subtype: asset?.subtype || "",
    purchaseDate: asset?.purchaseDate ? asset.purchaseDate.slice(0, 10) : "",
    purchasePrice: asset?.purchasePrice?.toString() || "0",
    currentValue: asset?.currentValue?.toString() || "0",
    note: asset?.note || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtypes = form.type === "financial" ? FINANCIAL_SUBTYPES : PHYSICAL_SUBTYPES;

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const url = asset ? `/api/assets/${asset.id}` : "/api/assets";
      const method = asset ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
            {asset ? "Chỉnh sửa tài sản" : "Thêm tài sản mới"}
          </h2>

          <div className="space-y-4">
            {/* Type toggle */}
            <div>
              <label className="label">Loại tài sản</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm(f => ({ ...f, type: "financial", subtype: "" }))}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${form.type === "financial" ? "bg-green-500 text-white border-green-500" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                >
                  💳 Tài chính
                </button>
                <button
                  onClick={() => setForm(f => ({ ...f, type: "physical", subtype: "" }))}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${form.type === "physical" ? "bg-blue-500 text-white border-blue-500" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                >
                  📦 Vật lý
                </button>
              </div>
            </div>

            <div>
              <label className="label">Tên tài sản</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Tài khoản VCB" />
            </div>

            <div>
              <label className="label">Phân loại</label>
              <select className="input" value={form.subtype} onChange={e => setForm(f => ({ ...f, subtype: e.target.value }))}>
                <option value="">-- Chọn --</option>
                {subtypes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Giá trị hiện tại (₫)</label>
              <input className="input" type="number" value={form.currentValue} onChange={e => setForm(f => ({ ...f, currentValue: e.target.value }))} />
            </div>

            <div>
              <label className="label">Giá mua ban đầu (₫)</label>
              <input className="input" type="number" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} />
            </div>

            <div>
              <label className="label">Ngày mua</label>
              <input className="input" type="date" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
            </div>

            <div>
              <label className="label">Ghi chú</label>
              <textarea className="input" rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
              <button onClick={handleSubmit} disabled={loading || !form.name} className="btn-primary flex-1">
                {loading ? "Đang lưu..." : asset ? "Cập nhật" : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | undefined>();

  async function load() {
    setLoading(true);
    const data = await fetch("/api/assets").then(r => r.json());
    setAssets(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deleteAsset(id: string) {
    if (!confirm("Xóa tài sản này?")) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    load();
  }

  const financial = assets.filter(a => a.type === "financial");
  const physical = assets.filter(a => a.type === "physical");
  const totalFinancial = financial.reduce((s, a) => s + a.currentValue, 0);
  const totalPhysical = physical.reduce((s, a) => s + a.currentValue, 0);
  const totalAssets = totalFinancial + totalPhysical;

  const gainLoss = assets.reduce((s, a) => s + (a.currentValue - a.purchasePrice), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tài sản</h1>
          <p className="text-gray-500 text-sm mt-0.5">Quản lý tài sản tài chính & vật lý</p>
        </div>
        <button onClick={() => { setEditAsset(undefined); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Thêm tài sản
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <p className="text-indigo-100 text-sm font-medium">Tổng tài sản</p>
          <p className="text-2xl font-bold mt-1">{formatVND(totalAssets)}</p>
          <div className={`flex items-center gap-1 mt-2 text-sm ${gainLoss >= 0 ? "text-green-200" : "text-red-200"}`}>
            {gainLoss >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {gainLoss >= 0 ? "+" : ""}{formatVND(gainLoss)} so với giá mua
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={18} className="text-green-100" />
            <p className="text-green-100 text-sm font-medium">Tài sản tài chính</p>
          </div>
          <p className="text-2xl font-bold">{formatVND(totalFinancial)}</p>
          <p className="text-green-100 text-xs mt-1">{financial.length} tài khoản</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0">
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={18} className="text-blue-100" />
            <p className="text-blue-100 text-sm font-medium">Tài sản vật lý</p>
          </div>
          <p className="text-2xl font-bold">{formatVND(totalPhysical)}</p>
          <p className="text-blue-100 text-xs mt-1">{physical.length} thiết bị</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}</div>
      ) : (
        <>
          {/* Financial Assets */}
          {financial.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wallet size={18} className="text-green-500" /> Tài sản tài chính
              </h2>
              <div className="divide-y divide-gray-50">
                {financial.map(asset => {
                  const gl = asset.currentValue - asset.purchasePrice;
                  return (
                    <div key={asset.id} className="flex items-center gap-3 py-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg">
                        {asset.subtype === "Tiền mặt" ? "💵" : asset.subtype?.includes("VCB") ? "🏦" : asset.subtype?.includes("MB") ? "🏧" : asset.subtype?.includes("Momo") ? "💜" : "💳"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{asset.name}</p>
                        <p className="text-xs text-gray-400">{asset.subtype || asset.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-sm">{formatVND(asset.currentValue)}</p>
                        {gl !== 0 && (
                          <p className={`text-xs ${gl > 0 ? "text-green-500" : "text-red-400"}`}>
                            {gl > 0 ? "+" : ""}{formatVND(gl)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditAsset(asset); setShowModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteAsset(asset.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Physical Assets */}
          {physical.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Cpu size={18} className="text-blue-500" /> Tài sản vật lý
              </h2>
              <div className="divide-y divide-gray-50">
                {physical.map(asset => {
                  const gl = asset.currentValue - asset.purchasePrice;
                  const depreciationPct = asset.purchasePrice > 0
                    ? ((asset.currentValue - asset.purchasePrice) / asset.purchasePrice) * 100
                    : 0;
                  return (
                    <div key={asset.id} className="flex items-center gap-3 py-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">
                        {asset.subtype?.includes("Laptop") ? "💻" : asset.subtype?.includes("Xe") ? "🛵" : asset.subtype?.includes("Ô tô") ? "🚗" : asset.subtype?.includes("Raspberry") ? "🍓" : "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{asset.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-400">{asset.subtype}</p>
                          {asset.purchaseDate && (
                            <p className="text-xs text-gray-300">· Mua {formatDate(asset.purchaseDate)}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-sm">{formatVND(asset.currentValue)}</p>
                        {depreciationPct !== 0 && (
                          <p className={`text-xs ${depreciationPct > 0 ? "text-green-500" : "text-orange-400"}`}>
                            {depreciationPct > 0 ? "+" : ""}{depreciationPct.toFixed(1)}%
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditAsset(asset); setShowModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteAsset(asset.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {assets.length === 0 && (
            <div className="card text-center py-16 text-gray-400">
              <p className="text-5xl mb-3">🏦</p>
              <p className="font-medium text-gray-600">Chưa có tài sản nào</p>
              <p className="text-sm mt-1">Thêm tài khoản ngân hàng, ví điện tử hoặc tài sản vật lý</p>
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto">
                + Thêm tài sản đầu tiên
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <AssetModal
          asset={editAsset}
          onClose={() => setShowModal(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
