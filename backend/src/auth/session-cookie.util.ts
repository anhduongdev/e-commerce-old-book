import type { Request } from 'express';
import { SESSION_COOKIE_NAME } from './auth.service';

export function getSessionCookie(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[SESSION_COOKIE_NAME];
}
