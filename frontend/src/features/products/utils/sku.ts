export function suggestSku(slug: string, volumeNumber?: number): string {
  const base = slug.trim() || "sp";
  if (!volumeNumber) return base;
  return `${base}-tap-${String(volumeNumber).padStart(3, "0")}`;
}
