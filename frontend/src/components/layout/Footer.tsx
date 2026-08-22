import Link from "next/link";
import { Globe, Mail, MapPin, Phone, Send } from "lucide-react";
import { Logo } from "@/components/common/Logo";

const SUPPORT_LINKS = [
  "Hướng dẫn mua hàng",
  "Chính sách vận chuyển",
  "Chính sách đổi trả",
  "Câu hỏi thường gặp",
  "Liên hệ hỗ trợ",
];

const ABOUT_LINKS = [
  "Giới thiệu Tiệm Sách Xưa",
  "Bán sách cho shop",
  "Quy chế hoạt động",
  "Điều khoản sử dụng",
  "Chính sách bảo mật",
];

const SOCIAL_LINKS = [
  { label: "Facebook", initials: "Fb" },
  { label: "Instagram", initials: "Ig" },
  { label: "TikTok", initials: "Tt" },
  { label: "YouTube", initials: "Yt" },
];

const PAYMENT_BADGES = ["Visa", "Mastercard", "MoMo", "ZaloPay"];

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-text-secondary">
            Chúng tôi kết nối những người yêu sách, lan tỏa giá trị tri thức
            bền vững.
          </p>
          <div className="mt-4 flex gap-3">
            {SOCIAL_LINKS.map(({ label, initials }) => (
              <Link
                key={label}
                href="#"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                {initials}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-text">
            HỖ TRỢ KHÁCH HÀNG
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-text-secondary">
            {SUPPORT_LINKS.map((label) => (
              <li key={label}>
                <Link href="#" className="hover:text-primary-dark">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-text">
            VỀ CHÚNG TÔI
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-text-secondary">
            {ABOUT_LINKS.map((label) => (
              <li key={label}>
                <Link href="#" className="hover:text-primary-dark">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-text">
            LIÊN HỆ
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              Số 8, Ngõ 131 Thái Hà, Đống Đa, Hà Nội
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0" aria-hidden="true" />
              1900 8888 26 (8:00 - 21:00)
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0" aria-hidden="true" />
              lienhe@tiemsachxua.vn
            </li>
            <li className="flex items-center gap-2">
              <Globe size={16} className="shrink-0" aria-hidden="true" />
              www.tiemsachxua.vn
            </li>
          </ul>

          <h3 className="mt-6 text-sm font-semibold tracking-wide text-text">
            ĐĂNG KÝ NHẬN TIN
          </h3>
          <form className="mt-3 flex overflow-hidden rounded-full border border-border bg-white">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-text-muted"
            />
            <button
              type="submit"
              aria-label="Đăng ký nhận tin"
              className="flex items-center bg-primary px-4 text-white hover:bg-primary-dark"
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs text-text-secondary">
          <span>© 2024 Tiệm Sách Xưa. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-2">
            {PAYMENT_BADGES.map((badge) => (
              <span
                key={badge}
                className="rounded border border-border bg-white px-2 py-1 font-medium text-primary-dark"
              >
                {badge}
              </span>
            ))}
            <span className="rounded border border-border bg-white px-2 py-1 font-medium text-primary-dark">
              Đã thông báo Bộ Công Thương
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
