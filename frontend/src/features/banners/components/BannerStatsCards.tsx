import { CalendarClock, Eye, EyeOff, Image as ImageIcon } from "lucide-react";

export function BannerStatsCards({
  total,
  active,
  scheduled,
  disabled,
}: {
  total: number;
  active: number;
  scheduled: number;
  disabled: number;
}) {
  const cards = [
    { label: "Tổng banner", value: total, icon: ImageIcon, tone: "bg-primary-light text-primary" },
    { label: "Đang hiển thị", value: active, icon: Eye, tone: "bg-success/10 text-success" },
    {
      label: "Đã lên lịch",
      value: scheduled,
      icon: CalendarClock,
      tone: "bg-secondary-light text-secondary-dark",
    },
    { label: "Đã tắt", value: disabled, icon: EyeOff, tone: "bg-warning/10 text-warning" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
