import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  Gift,
  Heart,
  Home,
  Search,
  ShoppingCart,
  Tag,
  Truck,
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { AccountMenu } from "@/features/auth/components/AccountMenu";
import { getCurrentUser } from "@/features/auth/services/session";
import { getCartSummary } from "@/features/cart/services/cart-summary";
import { formatPriceVnd } from "@/features/catalog/utils/format";

const PROMO_ITEMS = [
  { icon: Truck, label: "Miễn phí vận chuyển cho đơn từ 200.000đ" },
  { icon: BookOpen, label: "Sách cũ chất lượng – Giá tốt mỗi ngày" },
  { icon: Gift, label: "Tích điểm đổi quà cho thành viên" },
  { icon: Heart, label: "Ủng hộ sách cũ – Lan tỏa tri thức xanh" },
];

const BOOK_CATEGORIES = [
  "Văn học",
  "Kỹ năng sống",
  "Kinh tế",
  "Thiếu nhi",
  "Lịch sử",
];

const NAV_LINKS = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/danh-muc-sach", label: "Danh mục sách", icon: BookOpen, hasDropdown: true },
  { href: "/truyen-tranh", label: "Truyện tranh" },
  { href: "/sach-cu", label: "Sách cũ" },
  { href: "/blog", label: "Blog" },
  { href: "/ban-sach-cho-shop", label: "Bán sách cho shop", icon: Tag },
];

export async function Header() {
  const [user, cart] = await Promise.all([getCurrentUser(), getCartSummary()]);

  return (
    <header className="border-b border-brand-100">
      <div className="hidden bg-brand-900 text-white md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-4 py-2 text-xs">
          {PROMO_ITEMS.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2">
              <Icon size={14} aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-cream">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4">
          <Logo />

          <div className="flex min-w-[180px] flex-1 items-center overflow-hidden rounded-full border border-brand-100 bg-white">
            <input
              type="search"
              placeholder="Tìm kiếm sách, tác giả, thể loại..."
              className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-brand-600/60"
            />
            <select
              aria-label="Chọn danh mục tìm kiếm"
              className="border-l border-brand-100 bg-transparent px-3 py-2 text-sm text-brand-700 outline-none"
              defaultValue="all"
            >
              <option value="all">Tất cả</option>
              {BOOK_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="Tìm kiếm"
              className="flex h-full items-center bg-brand-700 px-4 py-2.5 text-white transition-colors hover:bg-brand-900"
            >
              <Search size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <AccountMenu user={user} />
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm text-brand-900"
              >
                <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-full border border-brand-100 bg-cream-dark">
                  <Image
                    src="/logo-icon.png"
                    alt="Tài khoản"
                    fill
                    sizes="36px"
                    className="object-contain p-0.5"
                  />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-xs text-brand-600">Tài khoản</span>
                  <span className="font-medium">Đăng nhập</span>
                </span>
              </Link>
            )}

            <Link
              href="/gio-hang"
              className="flex items-center gap-2 text-sm text-brand-900"
            >
              <span className="relative">
                <ShoppingCart size={22} aria-hidden="true" />
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-700 text-[10px] font-semibold text-white">
                  {cart.itemCount}
                </span>
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-xs text-brand-600">Giỏ hàng</span>
                <span className="font-medium">{formatPriceVnd(cart.subtotal)}</span>
              </span>
            </Link>
          </div>
        </div>
      </div>

      <nav className="border-t border-brand-100 bg-cream text-brand-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4">
          {NAV_LINKS.map(({ href, label, icon: Icon, hasDropdown }) => (
            <div key={href} className="group relative">
              <Link
                href={href}
                className="flex items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-brand-50"
              >
                {Icon ? <Icon size={16} aria-hidden="true" /> : null}
                {label}
                {hasDropdown ? (
                  <ChevronDown size={14} aria-hidden="true" />
                ) : null}
              </Link>

              {hasDropdown ? (
                <div className="invisible absolute left-0 top-full z-10 w-56 rounded-b-lg bg-white py-2 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                  {BOOK_CATEGORIES.map((category) => (
                    <Link
                      key={category}
                      href={`/danh-muc-sach/${category}`}
                      className="block px-4 py-2 text-sm text-brand-900 hover:bg-brand-50"
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </nav>
    </header>
  );
}
