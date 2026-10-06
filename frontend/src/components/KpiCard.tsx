type Props = {
  title: string;
  value: string;
  accent?: string;
};

export default function KpiCard({ title, value, accent = 'bg-blue-600' }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
    </div>
  );
}
