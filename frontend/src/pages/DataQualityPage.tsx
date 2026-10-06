import { useEffect, useState } from 'react';
import api from '../services/api';

export default function DataQualityPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/api/data-quality');
        setData(response.data?.data || null);
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || 'Unable to load quality data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">Loading data quality…</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  if (!data) return <div className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">No quality data found.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Data Quality</h1>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Total records</div><div className="mt-2 text-2xl font-bold">{data.totalOrders || 0}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Valid records</div><div className="mt-2 text-2xl font-bold">{data.validRecords || 0}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Invalid records</div><div className="mt-2 text-2xl font-bold">{data.invalidRecords || 0}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Missing values</div><div className="mt-2 text-2xl font-bold">{data.missingValues || 0}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Unmatched products</div><div className="mt-2 text-2xl font-bold">{data.unmatchedProducts || 0}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Unmatched shipments</div><div className="mt-2 text-2xl font-bold">{data.unmatchedShipments || 0}</div></div>
      </div>

      {data.details && data.details.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Issue</th>
              </tr>
            </thead>
            <tbody>
              {data.details.map((item: any, index: number) => (
                <tr key={`${item.type}-${item.id}-${index}`} className="border-t border-slate-200">
                  <td className="px-4 py-3">{item.type}</td>
                  <td className="px-4 py-3">{item.id}</td>
                  <td className="px-4 py-3 text-red-700">{item.issue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl bg-emerald-50 p-4 text-emerald-700">No invalid records found.</div>
      )}
    </div>
  );
}
