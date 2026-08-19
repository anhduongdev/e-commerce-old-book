export function formatPriceVnd(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  return `${num.toLocaleString("vi-VN")}₫`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
