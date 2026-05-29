"use client";
import { useEffect, useState } from "react";
import { formatVND, formatDate } from "@/lib/utils";
import { Plus, Trash2, Pencil, Target, CheckCircle2 } from "lucide-react";

const ICONS = ["🎯","🏠","🚗","✈️","💻","📱","💍","🎓","🏖️","🐕","💪","🎸","👶","🌏","💊"];
const COLORS = ["#10b981","#3b82f6","#8b5cf6","#f97316","#ec4899","#14b8a6","#f59e0b","#ef4444"];

function GoalModal({ goal, onClose, onSaved }: { goal?: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: goal?.name || "", icon: goal?.icon || "🎯", targetAmount: goal?.targetAmount?.toString() || "",
    savedAmount: goal?.savedAmount?.toString() || "0", deadline: goal?.deadline?.slice(0, 10) || "",
    color: goal?.color || "#10b981",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body = { ...form, targetAmount: parseFloat(form.targetAmount), savedAmount: parseFloat(form.savedAmount || "0") };
    const url = goal ? `/api/goals/${goal.id}` : "/api/goals";
    const method = goal ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { onSaved(); onClose(); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="font-bold text-gray-900 mb-4">{goal ? "Sửa mục tiêu" : "Tạo mục tiêu mới"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tên mục tiêu</label>
            <input className="input" placeholder="VD: Mua xe, Du lịch Nhật..." value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div>
            <label className="label">Biểu tượng</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ico) => (
                <button key={ico} type="button" onClick={() => setForm({ ...form, icon: ico })}
                  className={`text-2xl p-1.5 rounded-lg border-2 transition-all ${form.icon === ico ? "border-green-400 bg-green-50" : "border-transparent hover:bg-gray-50"}`}>
                  {ico}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Màu</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full border-4 transition-all ${form.color === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Mục tiêu (VND)</label>
              <input className="input" type="number" placeholder="10000000" value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} required min="1" />
            </div>
            <div>
              <label className="label">Đã tiết kiệm</label>
              <input className="input" type="number" placeholder="0" value={form.savedAmount}
                onChange={(e) => setForm({ ...form, savedAmount: e.target.value })} min="0" />
            </div>
          </div>

          <div>
            <label className="label">Deadline (tùy chọn)</label>
            <input className="input" type="date" value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Hủy</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Đang lưu..." : goal ? "Cập nhật" : "Tạo mục tiêu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddSavingsModal({ goal, onClose, onSaved }: { goal: any; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const newSaved = goal.savedAmount + parseFloat(amount);
    await fetch(`/api/goals/${goal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...goal, savedAmount: newSaved }),
    });
    onSaved(); onClose();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="font-bold text-gray-900 mb-1">Thêm tiết kiệm</h2>
        <p className="text-sm text-gray-400 mb-4">Mục tiêu: {goal.name} {goal.icon}</p>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="label">Số tiền thêm vào (VND)</label>
            <input className="input text-lg" type="number" placeholder="0" value={amount}
              onChange={(e) => setAmount(e.target.value)} required min="1" />
            {amount && <p className="text-xs text-gray-400 mt-1">
              Tổng: {formatVND(goal.savedAmount + parseFloat(amount || "0"))} / {formatVND(goal.targetAmount)}
            </p>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Hủy</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">Thêm</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editGoal, setEditGoal] = useState<any>(null);
  const [addSavings, setAddSavings] = useState<any>(null);

  async function load() {
    setLoading(true);
    const g = await fetch("/api/goals").then((r) => r.json());
    setGoals(Array.isArray(g) ? g : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Xóa mục tiêu này?")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    load();
  }

  async function handleComplete(goal: any) {
    await fetch(`/api/goals/${goal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...goal, status: goal.status === "completed" ? "active" : "completed" }),
    });
    load();
  }

  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mục tiêu tiết kiệm</h1>
          <p className="text-gray-500 text-sm">Đặt mục tiêu và theo dõi tiến trình</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Tạo mục tiêu
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">{[1,2,3,4].map(i=><div key={i} className="card h-40 animate-pulse bg-gray-100"/>)}</div>
      ) : active.length === 0 && completed.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">🎯</div>
          <p className="text-gray-600 font-medium">Chưa có mục tiêu nào</p>
          <p className="text-gray-400 text-sm mt-1">Hãy đặt mục tiêu tiết kiệm đầu tiên!</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">+ Tạo mục tiêu</button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Target size={16}/> Đang thực hiện ({active.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {active.map((goal) => {
                  const pct = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100);
                  const remaining = goal.targetAmount - goal.savedAmount;
                  const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000) : null;
                  return (
                    <div key={goal.id} className="card relative overflow-hidden group">
                      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: goal.color + "30" }} />
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{goal.icon}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{goal.name}</p>
                            {daysLeft !== null && (
                              <p className={`text-xs ${daysLeft < 0 ? "text-red-500" : daysLeft < 30 ? "text-orange-500" : "text-gray-400"}`}>
                                {daysLeft < 0 ? `Quá hạn ${Math.abs(daysLeft)} ngày` : `Còn ${daysLeft} ngày`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setAddSavings(goal)} className="p-1.5 hover:bg-green-50 text-green-400 hover:text-green-600 rounded-lg" title="Thêm tiết kiệm">💵</button>
                          <button onClick={() => handleComplete(goal)} className="p-1.5 hover:bg-green-50 text-green-400 hover:text-green-600 rounded-lg"><CheckCircle2 size={14}/></button>
                          <button onClick={() => setEditGoal(goal)} className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg"><Pencil size={14}/></button>
                          <button onClick={() => handleDelete(goal.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg"><Trash2 size={14}/></button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{pct.toFixed(0)}%</span>
                          <span>{formatVND(remaining)} còn lại</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: goal.color }} />
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="font-semibold" style={{ color: goal.color }}>{formatVND(goal.savedAmount)}</span>
                        <span className="text-gray-400">{formatVND(goal.targetAmount)}</span>
                      </div>

                      <button onClick={() => setAddSavings(goal)}
                        className="mt-3 w-full py-1.5 text-xs font-medium rounded-lg border border-dashed transition-colors hover:bg-gray-50"
                        style={{ borderColor: goal.color, color: goal.color }}>
                        + Thêm tiết kiệm
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm">
                <CheckCircle2 size={15} className="text-green-500" /> Đã hoàn thành ({completed.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {completed.map((goal) => (
                  <div key={goal.id} className="card opacity-70 flex items-center gap-3">
                    <span className="text-2xl">{goal.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-700 line-through">{goal.name}</p>
                      <p className="text-xs text-green-600">✓ {formatVND(goal.savedAmount)}</p>
                    </div>
                    <button onClick={() => handleDelete(goal.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && <GoalModal onClose={() => setShowCreate(false)} onSaved={load} />}
      {editGoal && <GoalModal goal={editGoal} onClose={() => setEditGoal(null)} onSaved={load} />}
      {addSavings && <AddSavingsModal goal={addSavings} onClose={() => setAddSavings(null)} onSaved={load} />}
    </div>
  );
}
