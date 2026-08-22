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
    { label: "Tổng danh mục", value: total, icon: Folder, tone: "bg-primary-light text-primary" },
    { label: "Đang hiển thị", value: visible, icon: Eye, tone: "bg-success/10 text-success" },
    { label: "Đang ẩn", value: hidden, icon: EyeOff, tone: "bg-warning/10 text-warning" },
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
            <p className="text-2xl font-bold text-text">{value}</p>
            <p className="text-sm text-text-secondary">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
