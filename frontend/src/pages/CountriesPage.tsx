import { useEffect, useState } from 'react';
import api from '../services/api';

export default function CountriesPage() {
  const [query, setQuery] = useState('');
  const [countries, setCountries] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [converted, setConverted] = useState<any>(null);
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/countries', { params: { q: query } });
        setCountries(response.data?.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || 'Country data unavailable.');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleConvert = async () => {
    try {
      const response = await api.get('/api/currency/convert', { params: { amount, from, to } });
      setConverted(response.data?.data || null);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Currency conversion is temporarily unavailable.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Countries & Currency</h1>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Country lookup</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country or code"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
          />
          <div className="mt-4 grid gap-3">
            {countries.slice(0, 6).map((country) => (
              <button
                key={country.cca3 || country.name}
                onClick={() => setSelected(country)}
                className="rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{country.name}</span>
                  <span className="text-xs text-slate-500">{country.cca3}</span>
                </div>
                <div className="mt-1 text-sm text-slate-500">{country.region}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Currency conversion</h2>
          <div className="space-y-3">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
            <div className="grid grid-cols-2 gap-3">
              <input value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2" />
              <input value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2" />
            </div>
            <button onClick={handleConvert} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white">Convert</button>
            {converted ? (
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <div>Original: {converted.amount} {converted.source}</div>
                <div>Rate: {converted.rate}</div>
                <div>Converted: {converted.convertedAmount.toFixed(2)} {converted.target}</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {selected ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <img src={selected.flag} alt={selected.name} className="h-16 w-24 rounded object-cover" />
            <div>
              <h3 className="text-2xl font-semibold">{selected.name}</h3>
              <div className="text-slate-500">{selected.region} • Population {selected.population.toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs uppercase text-slate-500">Codes</div><div className="mt-1 font-semibold">{selected.cca2} / {selected.cca3}</div></div>
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs uppercase text-slate-500">Currencies</div><div className="mt-1 font-semibold">{selected.currencies.map((currency: any) => currency.code).join(', ')}</div></div>
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs uppercase text-slate-500">Languages</div><div className="mt-1 font-semibold">{selected.languages.join(', ')}</div></div>
          </div>
        </div>
      ) : null}

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      {loading ? <div className="text-sm text-slate-500">Searching countries…</div> : null}
    </div>
  );
}
