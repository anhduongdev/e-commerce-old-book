export function formatPriceVnd(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  return `${num.toLocaleString("vi-VN")}₫`;
}
