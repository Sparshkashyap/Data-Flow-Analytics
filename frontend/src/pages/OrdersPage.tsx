import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/orders', {
          params: { page, limit, search },
        });

        const payload = response.data?.data || { items: [], pagination: { totalPages: 1 } };
        setOrders(payload.items || []);
        setTotalPages(payload.pagination?.totalPages || 1);
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || 'Unable to load orders.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, limit, search]);

  const formatted = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        total: Number(order.line_total || 0),
      })),
    [orders],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-500">Search and filter order detail</p>
        </div>
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
          placeholder="Search orders"
        />
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">Loading orders…</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Order Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Shipment</th>
              </tr>
            </thead>
            <tbody>
              {formatted.map((order) => (
                <tr key={`${order.order_id}-${order.product_id}`} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-blue-600">{order.order_id}</td>
                  <td className="px-4 py-3">{order.customer_name || order.customer_id}</td>
                  <td className="px-4 py-3">{order.order_date}</td>
                  <td className="px-4 py-3">{order.quantity}</td>
                  <td className="px-4 py-3">${Number(order.line_total || order.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">{order.shipment_status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
