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
    { label: "Tổng sản phẩm", value: total, icon: Tag, tone: "bg-brand-100 text-brand-700" },
    { label: "Đang bán", value: active, icon: Eye, tone: "bg-emerald-100 text-emerald-700" },
    { label: "Bản nháp", value: draft, icon: Pencil, tone: "bg-slate-100 text-slate-700" },
    { label: "Đang ẩn", value: hidden, icon: EyeOff, tone: "bg-orange-100 text-orange-700" },
    { label: "Hết hàng", value: outOfStock, icon: PackageX, tone: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
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
