import { Eye, EyeOff, Layers, Library } from "lucide-react";

export function SeriesStatsCards({
  total,
  visible,
  hidden,
  totalVolumes,
}: {
  total: number;
  visible: number;
  hidden: number;
  totalVolumes: number;
}) {
  const cards = [
    { label: "Tổng series", value: total, icon: Library, tone: "bg-brand-100 text-brand-700" },
    { label: "Đang hiển thị", value: visible, icon: Eye, tone: "bg-emerald-100 text-emerald-700" },
    { label: "Đang ẩn", value: hidden, icon: EyeOff, tone: "bg-orange-100 text-orange-700" },
    { label: "Tổng số tập", value: totalVolumes, icon: Layers, tone: "bg-brand-100 text-brand-700" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm"
        >
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
            <Icon size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-2xl font-bold text-brand-900">{value}</p>
            <p className="text-sm text-brand-600">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
