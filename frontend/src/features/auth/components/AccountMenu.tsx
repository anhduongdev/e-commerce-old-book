"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import { logoutUser } from "@/features/auth/services/logout";
import type { LoginResponse } from "@/features/auth/types/login.types";

export function AccountMenu({ user }: { user: LoginResponse }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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
    setLoggingOut(true);
    try {
      await logoutUser();
    } finally {
      setOpen(false);
      setLoggingOut(false);
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 text-sm text-brand-900"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-cream-dark">
          <User size={18} className="text-brand-700" aria-hidden="true" />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-xs text-brand-600">Tài khoản</span>
          <span className="font-medium">{user.fullName}</span>
        </span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg bg-white py-2 shadow-lg">
          <p className="truncate px-4 py-1.5 text-sm font-medium text-brand-900">
            {user.fullName}
          </p>
          {user.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 text-sm text-brand-900 hover:bg-brand-50"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard size={16} aria-hidden="true" />
              Trang quản trị
            </Link>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-brand-900 hover:bg-brand-50 disabled:opacity-60"
          >
            <LogOut size={16} aria-hidden="true" />
            {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
