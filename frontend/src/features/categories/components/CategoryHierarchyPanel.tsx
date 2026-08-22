import { ChevronDown, Folder } from "lucide-react";
import type { Category } from "@/features/categories/types/category.types";

export function CategoryHierarchyPanel({ categories }: { categories: Category[] }) {
  const roots = categories
    .filter((c) => c.level === 1)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-serif text-lg font-bold text-text">Cấu trúc phân cấp</h3>
      <ul className="mt-4 space-y-1">
        {roots.map((root) => {
          const children = categories
            .filter((c) => c.parentId === root.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          return (
            <li key={root.id}>
              <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text hover:bg-primary-lightest">
                <Folder size={16} className="text-text-secondary" aria-hidden="true" />
                <span className="flex-1 truncate">{root.name}</span>
                {children.length > 0 ? (
                  <ChevronDown size={14} className="text-text-secondary" aria-hidden="true" />
                ) : null}
              </div>
              {children.length > 0 ? (
                <ul className="ml-6 space-y-1 border-l border-border pl-3">
                  {children.map((child) => (
                    <li
                      key={child.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-secondary hover:bg-primary-lightest"
                    >
                      <Folder size={14} aria-hidden="true" />
                      <span className="truncate">{child.name}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
        {roots.length === 0 ? (
          <p className="text-sm text-text-secondary">Chưa có danh mục nào.</p>
        ) : null}
      </ul>
    </div>
  );
}
