"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

export function SearchBar({
  initialValue,
  onSearch,
}: {
  initialValue: string;
  onSearch: (value: string | undefined) => void;
}) {
  const [trackedInitialValue, setTrackedInitialValue] = useState(initialValue);
  const [value, setValue] = useState(initialValue);

  // Đồng bộ khi initialValue đổi từ bên ngoài (vd bấm "Xóa bộ lọc") — điều
  // chỉnh state ngay trong lúc render thay vì dùng effect, theo khuyến nghị
  // của React để tránh render thừa.
  if (initialValue !== trackedInitialValue) {
    setTrackedInitialValue(initialValue);
    setValue(initialValue);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      // Không cho tìm kiếm bằng chuỗi rỗng — nếu đang có filter tìm kiếm thì
      // cho phép xóa nó, nhưng không bao giờ gửi một lượt tìm kiếm rỗng mới.
      if (initialValue) onSearch(undefined);
      return;
    }
    onSearch(trimmed);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-w-[220px] flex-1 items-center overflow-hidden rounded-full border border-brand-100 bg-white"
    >
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tìm theo tên sách, tác giả, NXB..."
        className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-brand-600/60"
      />
      <button
        type="submit"
        aria-label="Tìm kiếm"
        className="flex h-full items-center bg-brand-700 px-4 py-2.5 text-white transition-colors hover:bg-brand-900"
      >
        <Search size={16} aria-hidden="true" />
      </button>
    </form>
  );
}
