export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border border-brand-100 px-3 py-1.5 text-sm text-brand-900 disabled:opacity-40"
      >
        ‹
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            p === page
              ? "bg-brand-700 text-white"
              : "border border-brand-100 text-brand-900 hover:bg-brand-50"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border border-brand-100 px-3 py-1.5 text-sm text-brand-900 disabled:opacity-40"
      >
        ›
      </button>
    </div>
  );
}
