import { Camera, ShieldCheck } from "lucide-react";
import {
  CONDITION_OPTIONS,
  ConditionGradeBadge,
} from "@/features/products/components/ConditionGradeBadge";

const CONDITION_DESCRIPTIONS: Record<string, string> = {
  NEW: "Sách chưa qua sử dụng, còn nguyên như mới xuất bản.",
  LIKE_NEW: "Đã đọc rất ít, gần như không có dấu vết sử dụng.",
  GOOD: "Có dấu hiệu đã đọc nhẹ, bìa và ruột sách còn chắc chắn.",
  FAIR: "Sách cũ rõ, có thể ố vàng hoặc sờn gáy nhưng vẫn đọc tốt.",
  WORN: "Sách đã cũ nhiều, có thể lem mực hoặc bong gáy nhẹ.",
};

export function ConditionTrustSection() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lightest">
            <ShieldCheck size={20} className="text-primary-dark" aria-hidden="true" />
          </span>
          <div>
            <p className="font-serif font-semibold text-text">Ghi rõ tình trạng thật</p>
            <p className="mt-1 text-sm text-text-secondary">
              Mỗi tập sách đều được xếp hạng tình trạng và có ghi chú riêng mô
              tả chính xác những gì bạn sẽ nhận được — không phóng đại, không
              giấu lỗi.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-light">
            <Camera size={20} className="text-secondary-dark" aria-hidden="true" />
          </span>
          <div>
            <p className="font-serif font-semibold text-text">Ưu tiên ảnh chụp thật</p>
            <p className="mt-1 text-sm text-text-secondary">
              Chúng tôi ưu tiên đăng ảnh chụp thực tế cuốn sách bạn sẽ nhận
              được. Khi chưa có ảnh thật, sản phẩm sẽ được đánh dấu rõ
              &quot;Ảnh minh họa&quot;.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-text">Các mức tình trạng</p>
        <ul className="space-y-3">
          {CONDITION_OPTIONS.map((option) => (
            <li key={option.value} className="flex items-start gap-3">
              <ConditionGradeBadge grade={option.value} />
              <span className="text-sm text-text-secondary">
                {CONDITION_DESCRIPTIONS[option.value]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
