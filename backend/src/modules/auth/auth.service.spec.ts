import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  const mockPrisma = {
    user: { findUnique: jest.fn(), create: jest.fn() },
  };
  const mockJwt = { sign: jest.fn().mockReturnValue('signed-jwt-token') };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJwt.sign.mockReturnValue('signed-jwt-token');
    service = new AuthService(
      mockPrisma as unknown as PrismaService,
      mockJwt as unknown as JwtService,
    );
  });

  describe('register', () => {
    it('creates a user, hashes the password, and returns a session', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashed-pw' as never);
      mockPrisma.user.create.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'Ana',
        passwordHash: 'hashed-pw',
      });

      const result = await service.register({ email: 'a@b.com', password: 'secret1', name: 'Ana' });

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('secret1', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { email: 'a@b.com', name: 'Ana', passwordHash: 'hashed-pw' },
      });
      expect(mockJwt.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'a@b.com' });
      expect(result).toEqual({
        accessToken: 'signed-jwt-token',
        user: { id: 'u1', email: 'a@b.com', name: 'Ana' },
      });
    });

    it('throws ConflictException when the e-mail already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });

      await expect(
        service.register({ email: 'a@b.com', password: 'secret1', name: 'Ana' }),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns a session for valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'Ana',
        passwordHash: 'hashed-pw',
      });
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.login({ email: 'a@b.com', password: 'secret1' });

      expect(mockedBcrypt.compare).toHaveBeenCalledWith('secret1', 'hashed-pw');
      expect(result.accessToken).toBe('signed-jwt-token');
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'x@y.com', password: 'secret1' })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'Ana',
        passwordHash: 'hashed-pw',
      });
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
