export default function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm ${
        highlight
          ? 'bg-brand-50 dark:bg-brand-900/20'
          : 'bg-white dark:bg-gray-900'
      }`}
    >
      <div className="mb-2 text-2xl">{icon}</div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      {sub && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}
