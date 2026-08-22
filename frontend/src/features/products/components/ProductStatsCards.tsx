import { Eye, EyeOff, PackageX, Pencil, Tag } from "lucide-react";

export function ProductStatsCards({
  total,
  active,
  draft,
  hidden,
  outOfStock,
}: {
  total: number;
  active: number;
  draft: number;
  hidden: number;
  outOfStock: number;
}) {
  const cards = [
    { label: "Tổng sản phẩm", value: total, icon: Tag, tone: "bg-primary-light text-primary" },
    { label: "Đang bán", value: active, icon: Eye, tone: "bg-success/10 text-success" },
    { label: "Bản nháp", value: draft, icon: Pencil, tone: "bg-bg-secondary text-text-secondary" },
    { label: "Đang ẩn", value: hidden, icon: EyeOff, tone: "bg-warning/10 text-warning" },
    { label: "Hết hàng", value: outOfStock, icon: PackageX, tone: "bg-error/10 text-error" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
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
