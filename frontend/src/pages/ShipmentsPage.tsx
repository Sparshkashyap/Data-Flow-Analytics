import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/api/shipments');
        setShipments(response.data?.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || 'Unable to load shipments.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-slate-900">Shipments</h1>
      {loading ? (
        <div className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">Loading shipments…</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : shipments.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">Shipment data not loaded. Upload Shipment.xml to enable shipment analytics.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3">Shipment ID</th>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Shipment Date</th>
                <th className="px-4 py-3">Delivery Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment) => (
                <tr key={shipment.shipment_id || shipment.order_id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{shipment.shipment_id || '—'}</td>
                  <td className="px-4 py-3">{shipment.order_id || '—'}</td>
                  <td className="px-4 py-3">{shipment.shipment_date || '—'}</td>
                  <td className="px-4 py-3">{shipment.delivery_date || '—'}</td>
                  <td className="px-4 py-3">{shipment.shipment_status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
