"use client";
import { useEffect, useState } from "react";
import { formatVND, getCurrentMonth, formatMonth } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid,
} from "recharts";

const RADIAN = Math.PI / 180;

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

function fmtTooltip(val: number) {
  return formatVND(val);
}

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [{ month, year }, setPeriod] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const s = await fetch(`/api/stats?month=${month}&year=${year}`).then((r) => r.json());
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
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thống kê</h1>
          <p className="text-gray-500 text-sm">Phân tích thu chi chi tiết</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18}/></button>
          <span className="font-semibold text-gray-700 min-w-36 text-center capitalize">{formatMonth(month, year)}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={18}/></button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">{[1,2,3,4].map(i=><div key={i} className="card h-64 animate-pulse bg-gray-100"/>)}</div>
      ) : !stats ? null : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Thu nhập", val: stats.totalIncome, color: "text-green-600", bg: "bg-green-50" },
              { label: "Chi tiêu", val: stats.totalExpense, color: "text-red-500", bg: "bg-red-50" },
              { label: "Số dư", val: stats.balance, color: stats.balance>=0?"text-blue-600":"text-orange-500", bg: "bg-blue-50" },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className={`card ${bg} border-0`}>
                <p className="text-gray-500 text-sm">{label}</p>
                <p className={`text-xl font-bold mt-1 ${color}`}>{formatVND(val)}</p>
              </div>
            ))}
          </div>

          {/* Daily line chart */}
          {stats.dailyChart?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Thu chi theo ngày</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }}
                    tickFormatter={(d) => d.slice(8)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1e6).toFixed(0)}M`} />
                  <Tooltip formatter={fmtTooltip} labelFormatter={(l) => `Ngày ${l.slice(8)}/${l.slice(5, 7)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} dot={false} name="Thu nhập" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={false} name="Chi tiêu" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie chart */}
            {stats.categoryBreakdown?.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-4">Chi tiêu theo danh mục</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={stats.categoryBreakdown} dataKey="total" nameKey="name"
                      cx="50%" cy="50%" outerRadius={90} labelLine={false} label={CustomLabel}>
                      {stats.categoryBreakdown.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={fmtTooltip} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {stats.categoryBreakdown.slice(0, 5).map((cat: any) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.icon} {cat.name}
                      </span>
                      <span className="font-medium text-gray-700">{formatVND(cat.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly bar chart */}
            {stats.monthly?.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-4">6 tháng gần đây</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.monthly} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1e6).toFixed(0)}M`} />
                    <Tooltip formatter={fmtTooltip} />
                    <Legend />
                    <Bar dataKey="income" fill="#22c55e" name="Thu nhập" radius={[4,4,0,0]} />
                    <Bar dataKey="expense" fill="#ef4444" name="Chi tiêu" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category breakdown table */}
          {stats.categoryBreakdown?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Chi tiết danh mục chi tiêu</h2>
              <div className="space-y-2">
                {stats.categoryBreakdown.map((cat: any) => {
                  const pct = stats.totalExpense > 0 ? (cat.total / stats.totalExpense) * 100 : 0;
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 text-gray-700">
                          <span>{cat.icon}</span>{cat.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-xs">{pct.toFixed(1)}%</span>
                          <span className="font-semibold text-gray-900">{formatVND(cat.total)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
