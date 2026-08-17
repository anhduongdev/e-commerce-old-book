import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export const SESSION_COOKIE_NAME = 'session_token';

const BCRYPT_SALT_ROUNDS = 12;
const SESSION_TTL_DAYS = 30;
const INVALID_CREDENTIALS_MESSAGE =
  'Email/số điện thoại hoặc mật khẩu không đúng';

// Bcrypt hash so lookups on an unknown identifier still pay the bcrypt.compare
// cost — otherwise "no such account" would respond measurably faster than
// "wrong password", leaking which identifiers are registered via timing.
const DUMMY_HASH = bcrypt.hashSync(
  randomBytes(32).toString('hex'),
  BCRYPT_SALT_ROUNDS,
);

interface LoginResult {
  user: ReturnType<AuthService['toSafeUser']>;
  rawToken: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Cần cung cấp email hoặc số điện thoại');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    try {
      const user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
        },
      });

      return this.toSafeUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(this.buildDuplicateMessage(error));
      }
      throw error;
    }
  }

  async login(
    dto: LoginDto,
    meta: { userAgent?: string },
  ): Promise<LoginResult> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.identifier }, { phone: dto.identifier }] },
    });

    if (!user) {
      await bcrypt.compare(dto.password, DUMMY_HASH);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    // Checked only after the password is confirmed correct, so a caller
    // without valid credentials can't use this to probe which accounts
    // exist and are locked.
    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(
      Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash,
        // ipAddress intentionally left null: correctly encoding IPv4/IPv6
        // into VARBINARY(16) (INET6_ATON) plus a `trust proxy` decision for
        // production is out of scope for this endpoint.
        userAgent: meta.userAgent?.slice(0, 255),
        expiresAt,
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { user: this.toSafeUser(user), rawToken, expiresAt };
  }

  async me(rawToken?: string) {
    const user = await this.validateSession(rawToken);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toSafeUser(user);
  }

  async logout(rawToken?: string): Promise<void> {
    if (!rawToken) {
      return;
    }
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    await this.prisma.userSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async validateSession(rawToken?: string): Promise<User | null> {
    if (!rawToken) {
      return null;
    }

    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !session ||
      session.revokedAt !== null ||
      session.expiresAt < new Date() ||
      !session.user.isActive
    ) {
      return null;
    }

    return session.user;
  }

  private buildDuplicateMessage(
    error: Prisma.PrismaClientKnownRequestError,
  ): string {
    const rawTarget = error.meta?.target;
    const target = Array.isArray(rawTarget)
      ? rawTarget.join(',')
      : typeof rawTarget === 'string'
        ? rawTarget
        : '';

    if (target.includes('email')) {
      return 'Email đã được sử dụng';
    }
    if (target.includes('phone')) {
      return 'Số điện thoại đã được sử dụng';
    }
    return 'Email hoặc số điện thoại đã được sử dụng';
  }

  private toSafeUser(user: User) {
    return {
      id: user.id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
