import { Eye, EyeOff, Folder } from "lucide-react";

export function CategoryStatsCards({
  total,
  visible,
  hidden,
}: {
  total: number;
  visible: number;
  hidden: number;
}) {
  const cards = [
    { label: "Tổng danh mục", value: total, icon: Folder, tone: "bg-brand-100 text-brand-700" },
    { label: "Đang hiển thị", value: visible, icon: Eye, tone: "bg-emerald-100 text-emerald-700" },
    { label: "Đang ẩn", value: hidden, icon: EyeOff, tone: "bg-orange-100 text-orange-700" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
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
