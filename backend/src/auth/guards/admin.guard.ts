import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth.service';
import { getSessionCookie } from '../session-cookie.util';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const user = await this.authService.validateSession(getSessionCookie(req));

    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Yêu cầu quyền quản trị');
    }

    req.user = user;
    return true;
  }
}
