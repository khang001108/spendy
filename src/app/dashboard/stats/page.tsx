"use client";
import { useEffect, useState } from "react";
import { formatVND, getCurrentMonth, formatMonth } from "@/lib/utils";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid,
} from "recharts";

const RADIAN = Math.PI / 180;
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">{(percent * 100).toFixed(0)}%</text>;
}

function fmtM(v: number) { return `${(v / 1e6).toFixed(1)}M`; }
function fmtTip(val: number) { return [formatVND(val)]; }

function DiffBadge({ pct, diff }: { pct: number | null; diff: number }) {
  if (pct === null) return <span className="text-xs text-gray-400">Chưa có dữ liệu</span>;
  const up = diff >= 0;
  const Icon = pct === 0 ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
      up ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30"
         : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30"
    }`}>
      <Icon size={11} />
      {up ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [{ month, year }, setPeriod] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"month" | "year">("month");

  async function load() {
    setLoading(true);
    const s = await fetch(`/api/stats?month=${month}&year=${year}`).then(r => r.json());
    setStats(s);
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
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Thống kê</h1>
          <p className="page-subtitle">Phân tích thu chi chi tiết</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <span className="font-semibold text-gray-700 dark:text-gray-200 min-w-32 text-center text-sm capitalize">
            {formatMonth(month, year)}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tab: Tháng / Năm */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {(["month", "year"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                       : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}>
            {t === "month" ? "Theo tháng" : "Theo năm"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card h-48 animate-pulse bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : !stats ? null : tab === "month" ? (
        // ═══════════════ TAB THÁNG ═══════════════
        <div className="space-y-5">
          {/* Summary 3 cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Thu nhập", val: stats.totalIncome, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
              { label: "Chi tiêu", val: stats.totalExpense, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
              { label: "Số dư",    val: stats.balance,     color: stats.balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className={`card ${bg} border-0 !p-4`}>
                <p className="text-gray-500 dark:text-gray-400 text-xs">{label}</p>
                <p className={`text-base font-bold mt-1 ${color}`}>{formatVND(val)}</p>
              </div>
            ))}
          </div>

          {/* So sánh tháng trước */}
          {stats.compareMonth && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                So sánh với tháng {stats.compareMonth.prevMonth}/{stats.compareMonth.prevYear}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Thu nhập", curr: stats.totalIncome, prev: stats.compareMonth.prevIncome, diff: stats.compareMonth.incomeDiff, pct: stats.compareMonth.incomePct },
                  { label: "Chi tiêu", curr: stats.totalExpense, prev: stats.compareMonth.prevExpense, diff: stats.compareMonth.expenseDiff, pct: stats.compareMonth.expensePct },
                ].map(({ label, curr, prev, diff, pct }) => (
                  <div key={label} className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                    <p className="font-bold text-gray-900 dark:text-white">{formatVND(curr)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Trước: {formatVND(prev)}</p>
                    <div className="flex items-center gap-2">
                      <DiffBadge pct={pct} diff={diff} />
                      <span className="text-xs text-gray-400">{diff >= 0 ? "+" : ""}{formatVND(diff)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily line chart */}
          {stats.dailyChart?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Thu chi theo ngày</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(8)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtM} width={36} />
                  <Tooltip formatter={fmtTip} labelFormatter={l => `Ngày ${l.slice(8)}/${l.slice(5, 7)}`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} dot={false} name="Thu nhập" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={false} name="Chi tiêu" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie */}
            {stats.categoryBreakdown?.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Chi theo danh mục</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={stats.categoryBreakdown} dataKey="total" nameKey="name"
                      cx="50%" cy="50%" outerRadius={80} labelLine={false} label={CustomLabel}>
                      {stats.categoryBreakdown.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={fmtTip} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {stats.categoryBreakdown.slice(0, 5).map((cat: any) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="truncate">{cat.icon} {cat.name}</span>
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white shrink-0 ml-2">{formatVND(cat.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6 months bar */}
            {stats.monthly?.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">6 tháng gần đây</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stats.monthly} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtM} width={36} />
                    <Tooltip formatter={fmtTip} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="income" fill="#22c55e" name="Thu" radius={[4,4,0,0]} />
                    <Bar dataKey="expense" fill="#ef4444" name="Chi" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category table */}
          {stats.categoryBreakdown?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Chi tiết danh mục</h2>
              <div className="space-y-3">
                {stats.categoryBreakdown.map((cat: any) => {
                  const pct = stats.totalExpense > 0 ? (cat.total / stats.totalExpense) * 100 : 0;
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 min-w-0">
                          <span>{cat.icon}</span>
                          <span className="truncate">{cat.name}</span>
                          <span className="text-gray-400 dark:text-gray-500 text-xs shrink-0">({cat.count} lần)</span>
                        </span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-gray-400 text-xs">{pct.toFixed(1)}%</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{formatVND(cat.total)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        // ═══════════════ TAB NĂM ═══════════════
        <div className="space-y-5">
          {/* Year summary */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: `Tổng thu ${year}`, val: stats.compareYear?.yearTotal?.income, color: "text-green-600 dark:text-green-400" },
              { label: `Tổng chi ${year}`, val: stats.compareYear?.yearTotal?.expense, color: "text-red-500 dark:text-red-400" },
            ].map(({ label, val, color }) => (
              <div key={label} className="card">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`text-lg font-bold mt-1 ${color}`}>{formatVND(val || 0)}</p>
              </div>
            ))}
          </div>

          {/* So sánh năm */}
          {stats.compareYear && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                So sánh {year} với {year - 1}
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: "Thu nhập", curr: stats.compareYear.yearTotal.income, prev: stats.compareYear.prevYearTotal.income, diff: stats.compareYear.incomeDiff, pct: stats.compareYear.incomePct },
                  { label: "Chi tiêu", curr: stats.compareYear.yearTotal.expense, prev: stats.compareYear.prevYearTotal.expense, diff: stats.compareYear.expenseDiff, pct: stats.compareYear.expensePct },
                ].map(({ label, curr, prev, diff, pct }) => (
                  <div key={label} className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                    <p className="font-bold text-gray-900 dark:text-white">{formatVND(curr)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Năm trước: {formatVND(prev)}</p>
                    <div className="flex items-center gap-2">
                      <DiffBadge pct={pct} diff={diff} />
                      <span className="text-xs text-gray-400">{diff >= 0 ? "+" : ""}{formatVND(diff)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Year bar chart with prev year */}
              {stats.compareYear.monthly?.length > 0 && (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.compareYear.monthly} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtM} width={36} />
                    <Tooltip formatter={fmtTip} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="income" fill="#22c55e" name={`Thu ${year}`} radius={[3,3,0,0]} />
                    <Bar dataKey="expense" fill="#ef4444" name={`Chi ${year}`} radius={[3,3,0,0]} />
                    <Bar dataKey="prevIncome" fill="#86efac" name={`Thu ${year - 1}`} radius={[3,3,0,0]} />
                    <Bar dataKey="prevExpense" fill="#fca5a5" name={`Chi ${year - 1}`} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Monthly breakdown for the year */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Từng tháng trong {year}</h2>
            <div className="space-y-2">
              {stats.compareYear?.monthly?.map((m: any, i: number) => {
                const balance = m.income - m.expense;
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8 shrink-0">T{i + 1}</span>
                    <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                      <span className="text-green-600 dark:text-green-400">{m.income > 0 ? formatVND(m.income) : "—"}</span>
                      <span className="text-red-500 dark:text-red-400">{m.expense > 0 ? formatVND(m.expense) : "—"}</span>
                      <span className={balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-500"}>
                        {m.income > 0 || m.expense > 0 ? (balance >= 0 ? "+" : "") + formatVND(balance) : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-8">Tổng</span>
                <div className="flex-1 grid grid-cols-3 gap-2 text-xs font-bold">
                  <span className="text-green-600 dark:text-green-400">{formatVND(stats.compareYear?.yearTotal?.income || 0)}</span>
                  <span className="text-red-500 dark:text-red-400">{formatVND(stats.compareYear?.yearTotal?.expense || 0)}</span>
                  <span className="text-blue-600 dark:text-blue-400">{formatVND((stats.compareYear?.yearTotal?.income || 0) - (stats.compareYear?.yearTotal?.expense || 0))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
