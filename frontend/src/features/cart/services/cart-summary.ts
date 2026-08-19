import { cookies } from "next/headers";
import type { CartSummary } from "@/features/cart/types/cart.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
const SESSION_COOKIE_NAME = "session_token";
const GUEST_CART_COOKIE_NAME = "guest_cart_token";

const EMPTY_SUMMARY: CartSummary = { itemCount: 0, subtotal: "0" };

// Server Component only — mirrors frontend/src/features/auth/services/session.ts.
// Forwards whichever of the two relevant cookies exist (session_token for a
// logged-in user, guest_cart_token for an anonymous cart) since a
// server-to-server fetch doesn't automatically carry the browser's cookies.
export async function getCartSummary(): Promise<CartSummary> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const guestToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;

  const cookiePairs = [
    sessionToken ? `${SESSION_COOKIE_NAME}=${sessionToken}` : null,
    guestToken ? `${GUEST_CART_COOKIE_NAME}=${guestToken}` : null,
  ].filter((pair): pair is string => pair !== null);

  if (cookiePairs.length === 0) {
    return EMPTY_SUMMARY;
  }

  try {
    const res = await fetch(`${API_URL}/cart/summary`, {
      headers: { Cookie: cookiePairs.join("; ") },
      cache: "no-store",
    });
    if (!res.ok) {
      return EMPTY_SUMMARY;
    }
    return await res.json();
  } catch (error) {
    console.error("getCartSummary: failed to reach backend", error);
    return EMPTY_SUMMARY;
  }
}
