"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Search, User } from "lucide-react";
import { logoutUser } from "@/features/auth/services/logout";
import type { LoginResponse } from "@/features/auth/types/login.types";

export function AdminTopbar({ user }: { user: LoginResponse }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleLogout() {
    try {
      await logoutUser();
    } finally {
      setOpen(false);
      router.push("/");
      router.refresh();
    }
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-bg px-6 py-3">
      <div className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-bg-secondary px-3 py-2">
        <Search size={16} className="text-text-secondary" aria-hidden="true" />
        <input
          type="search"
          placeholder="Tìm kiếm nhanh..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
        />
        <kbd className="rounded border border-border bg-bg px-1.5 py-0.5 text-xs text-text-secondary">
          Ctrl + K
        </kbd>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative text-primary"
          aria-label="Thông báo"
        >
          <Bell size={20} aria-hidden="true" />
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
            3
          </span>
        </button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 text-sm text-text"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-secondary">
              <User size={18} className="text-primary" aria-hidden="true" />
            </span>
            <span>
              Xin chào, <span className="font-medium">{user.fullName}</span>
            </span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>

          {open ? (
            <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-lg bg-bg py-2 shadow-lg">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text hover:bg-primary-lightest"
              >
                <LogOut size={16} aria-hidden="true" />
                Đăng xuất
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
