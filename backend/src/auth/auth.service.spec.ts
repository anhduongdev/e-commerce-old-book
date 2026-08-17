import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, User } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { create: jest.Mock<Promise<User>, [Prisma.UserCreateArgs]> };
  };

  beforeEach(async () => {
    prisma = {
      user: { create: jest.fn<Promise<User>, [Prisma.UserCreateArgs]>() },
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
    prisma.user.create.mockResolvedValue({
      id: 1n,
      fullName: baseDto.fullName,
      email: baseDto.email,
      phone: null,
      passwordHash: 'hashed',
      role: 'CUSTOMER',
      isActive: true,
      emailVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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
});
