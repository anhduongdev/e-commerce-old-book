import type { Request } from 'express';

export const GUEST_CART_COOKIE_NAME = 'guest_cart_token';

export function getGuestCartToken(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[GUEST_CART_COOKIE_NAME];
}
