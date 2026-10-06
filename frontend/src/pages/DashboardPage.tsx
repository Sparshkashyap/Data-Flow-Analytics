import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import KpiCard from '../components/KpiCard';
import api from '../services/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        const [summaryRes, categoryRes, productRes] = await Promise.all([
          api.get('/api/analytics/summary'),
          api.get('/api/analytics/categories'),
          api.get('/api/analytics/products'),
        ]);

        if (ignore) return;

        const summaryData = summaryRes.data?.data || {};
        setSummary(summaryData);
        setCategoryData((categoryRes.data?.data || []).map((item: any) => ({
          name: item.category,
          revenue: Number(item.totalRevenue || 0),
          qty: Number(item.totalQuantity || 0),
        })));
        setProductData((productRes.data?.data || []).map((item: any) => ({
          name: item.productName || item.productId,
          revenue: Number(item.totalRevenue || 0),
          qty: Number(item.totalQuantity || 0),
        })));

        const orderedDates = Object.entries(summaryData.revenueByDate || {}).map(([date, value]) => ({
          date,
          revenue: Number(value || 0),
        }));
        setRevenueSeries(orderedDates);
      } catch (err: any) {
        if (!ignore) {
          setError(err?.response?.data?.error?.message || 'Failed to load analytics data.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const donutData = useMemo(() => 
    categoryData.map((item) => ({
      name: item.name,
      value: item.revenue,
    })),
  [categoryData]);

  if (loading) {
    return <div className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">Loading dashboard…</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  if (!summary) {
    return <div className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">No data available.</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-500">Operational data quality and business performance</p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Orders" value={String(summary.totalOrders || 0)} accent="bg-blue-600" />
        <KpiCard title="Total Revenue" value={`$${Number(summary.totalRevenue || 0).toLocaleString()}`} accent="bg-emerald-500" />
        <KpiCard title="Total Items" value={String(summary.totalItems || 0)} accent="bg-violet-500" />
        <KpiCard title="Average Order Value" value={`$${Number(summary.averageOrderValue || 0).toLocaleString()}`} accent="bg-amber-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Revenue over time</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Revenue by category</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Top products</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Category totals</h2>
          <div className="space-y-3">
            {categoryData.map((item) => (
              <div key={item.name} className="rounded-lg bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-slate-600">${Number(item.revenue || 0).toLocaleString()}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${Math.min(100, (item.revenue / Math.max(...categoryData.map((entry) => entry.revenue), 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
