import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ProductsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/api/analytics/products');
        setItems(response.data?.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || 'Unable to load products.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-slate-900">Products</h1>
      {loading ? (
        <div className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">Loading products…</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3">Product ID</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Quantity Sold</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Orders</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.productId} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-blue-600">{item.productId}</td>
                  <td className="px-4 py-3">{item.productName}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{item.totalQuantity}</td>
                  <td className="px-4 py-3">${Number(item.totalRevenue || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">{item.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
