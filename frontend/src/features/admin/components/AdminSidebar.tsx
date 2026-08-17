"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Folder,
  FileText,
  Home,
  Mail,
  Settings,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Tổng quan", icon: Home },
  { href: "/admin/products", label: "Sản phẩm", icon: Tag },
  { href: "/admin/categories", label: "Danh mục", icon: Folder },
  { href: "/admin/series", label: "Bộ truyện", icon: BookOpen },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
  { href: "/admin/customers", label: "Khách hàng", icon: Users },
  { href: "/admin/content", label: "Nội dung", icon: FileText },
  { href: "/admin/sell-requests", label: "Yêu cầu bán sách", icon: Mail },
  { href: "/admin/settings", label: "Cài đặt", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-brand-100 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <Image src="/logo-icon.png" alt="Tiệm Sách Xưa" width={32} height={32} className="rounded-full" />
        <div className="leading-tight">
          <p className="font-serif text-lg font-bold text-brand-900">Tiệm Sách Xưa</p>
          <p className="text-xs text-brand-600">Sách cũ – Truyện tranh – Giá trị mới</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-brand-100 font-medium text-brand-900"
                  : "text-brand-600 hover:bg-brand-50 hover:text-brand-900"
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-brand-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Image src="/logo-icon.png" alt="" width={28} height={28} className="rounded-full" aria-hidden="true" />
          <div className="leading-tight">
            <p className="text-sm font-medium text-brand-900">Tiệm Sách Xưa</p>
            <p className="text-xs text-brand-600">Lan tỏa tri thức xanh</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
