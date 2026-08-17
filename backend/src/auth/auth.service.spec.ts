import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, User, UserSession } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type SessionWithUser = UserSession & { user: User };

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      create: jest.Mock<Promise<User>, [Prisma.UserCreateArgs]>;
      findFirst: jest.Mock<Promise<User | null>, [Prisma.UserFindFirstArgs]>;
      update: jest.Mock<Promise<User>, [Prisma.UserUpdateArgs]>;
    };
    userSession: {
      create: jest.Mock<Promise<UserSession>, [Prisma.UserSessionCreateArgs]>;
      findUnique: jest.Mock<
        Promise<SessionWithUser | null>,
        [Prisma.UserSessionFindUniqueArgs]
      >;
      updateMany: jest.Mock<
        Promise<Prisma.BatchPayload>,
        [Prisma.UserSessionUpdateManyArgs]
      >;
    };
  };

  const buildUser = (overrides: Partial<User> = {}): User => ({
    id: 1n,
    fullName: 'Nguyen Van A',
    email: 'a@example.com',
    phone: null,
    passwordHash: 'hashed',
    role: 'CUSTOMER',
    isActive: true,
    emailVerifiedAt: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const buildSession = (
    overrides: Partial<SessionWithUser> = {},
  ): SessionWithUser => ({
    id: 1n,
    userId: 1n,
    tokenHash: createHash('sha256').update('raw-token').digest('hex'),
    userAgent: null,
    ipAddress: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    revokedAt: null,
    createdAt: new Date(),
    user: buildUser(),
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn<Promise<User>, [Prisma.UserCreateArgs]>(),
        findFirst: jest.fn<Promise<User | null>, [Prisma.UserFindFirstArgs]>(),
        update: jest.fn<Promise<User>, [Prisma.UserUpdateArgs]>(),
      },
      userSession: {
        create: jest.fn<Promise<UserSession>, [Prisma.UserSessionCreateArgs]>(),
        findUnique: jest.fn<
          Promise<SessionWithUser | null>,
          [Prisma.UserSessionFindUniqueArgs]
        >(),
        updateMany: jest.fn<
          Promise<Prisma.BatchPayload>,
          [Prisma.UserSessionUpdateManyArgs]
        >(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AuthService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  const baseDto: RegisterDto = {
    fullName: 'Nguyen Van A',
    email: 'a@example.com',
    password: 'password123',
  };

  it('creates a user and strips the password hash from the response', async () => {
    prisma.user.create.mockResolvedValue(buildUser());

    const result = await service.register(baseDto);

    expect(result).not.toHaveProperty('passwordHash');
    expect(result.id).toBe('1');
    expect(result.email).toBe(baseDto.email);
    const createArgs = prisma.user.create.mock.calls[0][0];
    expect(createArgs.data.fullName).toBe(baseDto.fullName);
    expect(createArgs.data.email).toBe(baseDto.email);
  });

  it('rejects when both email and phone are missing', async () => {
    await expect(
      service.register({ ...baseDto, email: undefined }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('maps a duplicate email into a ConflictException', async () => {
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate entry', {
        code: 'P2002',
        clientVersion: '6.19.3',
        meta: { target: 'users.uq_users_email' },
      }),
    );

    await expect(service.register(baseDto)).rejects.toThrow(ConflictException);
  });

  describe('login', () => {
    const password = 'password123';
    const loginDto: LoginDto = { identifier: 'a@example.com', password };

    it('rejects an unknown identifier', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.login(loginDto, {})).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.userSession.create).not.toHaveBeenCalled();
    });

    it('rejects a wrong password with the same message as an unknown identifier', async () => {
      const passwordHash = await bcrypt.hash(password, 4);

      prisma.user.findFirst.mockResolvedValue(null);
      let unknownIdentifierMessage: string | undefined;
      try {
        await service.login(
          { ...loginDto, identifier: 'nobody@example.com' },
          {},
        );
      } catch (error) {
        unknownIdentifierMessage = (error as UnauthorizedException).message;
      }

      prisma.user.findFirst.mockResolvedValue(buildUser({ passwordHash }));
      let wrongPasswordMessage: string | undefined;
      try {
        await service.login({ ...loginDto, password: 'wrong-password' }, {});
      } catch (error) {
        wrongPasswordMessage = (error as UnauthorizedException).message;
      }

      expect(wrongPasswordMessage).toBe(unknownIdentifierMessage);
      expect(prisma.userSession.create).not.toHaveBeenCalled();
    });

    it('rejects a correct password for an inactive account without creating a session', async () => {
      const passwordHash = await bcrypt.hash(password, 4);
      prisma.user.findFirst.mockResolvedValue(
        buildUser({ passwordHash, isActive: false }),
      );

      await expect(service.login(loginDto, {})).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.userSession.create).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('creates a session and returns the sanitized user on success', async () => {
      const passwordHash = await bcrypt.hash(password, 4);
      const user = buildUser({ passwordHash });
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.userSession.create.mockResolvedValue({} as UserSession);
      prisma.user.update.mockResolvedValue(user);

      const result = await service.login(loginDto, { userAgent: 'jest' });

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.id).toBe('1');
      expect(result.rawToken).toMatch(/^[a-f0-9]{64}$/);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());

      const sessionArgs = prisma.userSession.create.mock.calls[0][0];
      expect(sessionArgs.data.userId).toBe(user.id);
      expect(sessionArgs.data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
      expect(sessionArgs.data.userAgent).toBe('jest');

      const updateArgs = prisma.user.update.mock.calls[0][0];
      expect(updateArgs.where).toEqual({ id: user.id });
    });
  });

  describe('me', () => {
    it('rejects when no token is provided', async () => {
      await expect(service.me(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.userSession.findUnique).not.toHaveBeenCalled();
    });

    it('rejects an unknown token', async () => {
      prisma.userSession.findUnique.mockResolvedValue(null);
      await expect(service.me('raw-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects an expired session', async () => {
      prisma.userSession.findUnique.mockResolvedValue(
        buildSession({ expiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(service.me('raw-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a revoked session', async () => {
      prisma.userSession.findUnique.mockResolvedValue(
        buildSession({ revokedAt: new Date() }),
      );
      await expect(service.me('raw-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a session belonging to an inactive user', async () => {
      prisma.userSession.findUnique.mockResolvedValue(
        buildSession({ user: buildUser({ isActive: false }) }),
      );
      await expect(service.me('raw-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns the sanitized user for a valid session', async () => {
      prisma.userSession.findUnique.mockResolvedValue(buildSession());

      const result = await service.me('raw-token');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe('1');
      const findArgs = prisma.userSession.findUnique.mock.calls[0][0];
      expect(findArgs.where.tokenHash).toBe(
        createHash('sha256').update('raw-token').digest('hex'),
      );
    });
  });

  describe('logout', () => {
    it('does nothing when no token is provided', async () => {
      await service.logout(undefined);
      expect(prisma.userSession.updateMany).not.toHaveBeenCalled();
    });

    it('revokes the matching session', async () => {
      prisma.userSession.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('raw-token');

      const args = prisma.userSession.updateMany.mock.calls[0][0];
      expect(args.where.tokenHash).toBe(
        createHash('sha256').update('raw-token').digest('hex'),
      );
      expect(args.where.revokedAt).toBeNull();
      expect(args.data.revokedAt).toBeInstanceOf(Date);
    });

    it('does not throw for an unknown token', async () => {
      prisma.userSession.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.logout('unknown-token')).resolves.toBeUndefined();
    });
  });
});
