type Props = {
  label: string;
  value: string | number;
};

export default function StatPanel({ label, value }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-800">{value}</div>
    </div>
  );
}
