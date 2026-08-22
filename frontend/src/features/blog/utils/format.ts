export function formatBlogDate(value: string): string {
  return new Date(value).toLocaleDateString("vi-VN");
}
