import { cookies } from "next/headers";
import type { LoginResponse } from "@/features/auth/types/login.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
const SESSION_COOKIE_NAME = "session_token";

// Server Component only: reads the session cookie from the incoming request
// and asks the backend to validate it. A server-to-server fetch does not
// automatically carry the browser's cookies, so it's forwarded manually.
export async function getCurrentUser(): Promise<LoginResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error("getCurrentUser: failed to reach backend", error);
    return null;
  }
}
