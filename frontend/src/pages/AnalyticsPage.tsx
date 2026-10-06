import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';
import StatPanel from '../components/StatPanel';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes, categoriesRes, productsRes] = await Promise.all([
          api.get('/api/analytics/summary'),
          api.get('/api/analytics/categories'),
          api.get('/api/analytics/products'),
        ]);

        setSummary(summaryRes.data?.data || {});
        setCategories(categoriesRes.data?.data || []);
        setProducts(productsRes.data?.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || 'Unable to load analytics.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">Loading analytics…</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <StatPanel label="Total Revenue" value={`$${Number(summary.totalRevenue || 0).toLocaleString()}`} />
        <StatPanel label="Average Order Value" value={`$${Number(summary.averageOrderValue || 0).toLocaleString()}`} />
        <StatPanel label="Total Items" value={summary.totalItems || 0} />
        <StatPanel label="Orders" value={summary.totalOrders || 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Revenue by category</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalRevenue" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Revenue by product</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={products.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="productName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalRevenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
