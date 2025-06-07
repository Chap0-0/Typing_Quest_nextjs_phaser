import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from './session.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserSession } from '../users/entities/user-session.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let sessionService: jest.Mocked<SessionService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneByUsername: jest.fn(),
            findOneById: jest.fn(),
            createUser: jest.fn(),
            updateLastLogin: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            createSession: jest.fn(),
            validateRefreshToken: jest.fn(),
            findSessionById: jest.fn(),
            deleteSession: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    sessionService = module.get(SessionService);
  });

  describe('validateUser', () => {
    it('должен возвращать пользователя без пароля при валидных учетных данных', async () => {
      const mockUser = {
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        created_at: new Date(),
        last_login: null,
        sessions: [],
        results: [],
        achievements: [],
      } as User;

      usersService.findOneByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'password123');

      expect(usersService.findOneByUsername).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(result).toEqual({
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        achievements: [],
        created_at: expect.any(Date),
        last_login: null,
        results: [],
        sessions: [],
      });
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(1);
    });

    it('должен выбрасывать UnauthorizedException, если пользователь не найден', async () => {
      usersService.findOneByUsername.mockResolvedValue(null);

      await expect(service.validateUser('testuser', 'password123')).rejects.toThrow(
        new UnauthorizedException('Неверное имя пользователя или пароль'),
      );
    });

    it('должен выбрасывать UnauthorizedException, если пароль неверный', async () => {
      const mockUser = {
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        created_at: new Date(),
        last_login: null,
        sessions: [],
        results: [],
        achievements: [],
      } as User;

      usersService.findOneByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('testuser', 'wrong_password')).rejects.toThrow(
        new UnauthorizedException('Неверное имя пользователя или пароль'),
      );
    });
  });

  describe('login', () => {
    it('должен возвращать токены и создавать сессию', async () => {
      const mockUser = {
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
      };

      jwtService.sign.mockImplementation((payload, options) => {
        if (options?.expiresIn === '15m') return 'access_token';
        if (options?.expiresIn === '30d') return 'refresh_token';
        return '';
      });

      sessionService.createSession.mockResolvedValue({
        session_id: 'session_id',
        user_id: 1,
        refresh_token_hash: 'hashed_refresh_token',
        created_at: new Date(),
        expires_at: new Date(),
        user: mockUser as User,
      } as UserSession);

      const result = await service.login(mockUser as User);

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          username: 'testuser',
          sub: 1,
          email: 'test@example.com',
        },
        { expiresIn: '15m' },
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          username: 'testuser',
          sub: 1,
          email: 'test@example.com',
        },
        { expiresIn: '30d' },
      );
      expect(sessionService.createSession).toHaveBeenCalledWith(1, 'refresh_token');
      expect(result).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        session_id: 'session_id',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
      });
    });
  });

  describe('refreshTokens', () => {
    it('должен возвращать новые токены при валидном refresh token', async () => {
      const mockSession = {
        session_id: 'old_session_id',
        user_id: 1,
        refresh_token_hash: 'hashed_token',
        created_at: new Date(),
        expires_at: new Date(Date.now() + 100000),
        user: {
          user_id: 1,
          username: 'testuser',
          email: 'test@example.com',
        } as User,
      } as UserSession;

      const mockUser = {
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        created_at: new Date(),
        last_login: null,
        sessions: [],
        results: [],
        achievements: [],
      } as User;

      sessionService.validateRefreshToken.mockResolvedValue(true);
      sessionService.findSessionById.mockResolvedValue(mockSession);
      usersService.findOneById.mockResolvedValue(mockUser);
      jwtService.sign.mockImplementation((payload, options) => {
        if (options?.expiresIn === '15m') return 'new_access_token';
        if (options?.expiresIn === '30d') return 'new_refresh_token';
        return '';
      });
      sessionService.createSession.mockResolvedValue({
        session_id: 'new_session_id',
        user_id: 1,
        refresh_token_hash: 'hashed_new_refresh_token',
        created_at: new Date(),
        expires_at: new Date(),
        user: mockUser,
      } as UserSession);

      const result = await service.refreshTokens('old_session_id', 'old_refresh_token');

      expect(sessionService.validateRefreshToken).toHaveBeenCalledWith('old_session_id', 'old_refresh_token');
      expect(sessionService.findSessionById).toHaveBeenCalledWith('old_session_id');
      expect(usersService.findOneById).toHaveBeenCalledWith(1);
      expect(sessionService.deleteSession).toHaveBeenCalledWith('old_session_id');
      expect(sessionService.createSession).toHaveBeenCalledWith(1, 'new_refresh_token');
      expect(result).toEqual({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        session_id: 'new_session_id',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
      });
    });

    it('должен выбрасывать UnauthorizedException, если refresh token недействителен', async () => {
      sessionService.validateRefreshToken.mockResolvedValue(false);

      await expect(service.refreshTokens('session_id', 'invalid_token')).rejects.toThrow(
        new UnauthorizedException('Недействительный refresh token'),
      );
    });

    it('должен выбрасывать UnauthorizedException, если сессия истекла', async () => {
      const expiredSession = {
        session_id: 'expired_session',
        user_id: 1,
        refresh_token_hash: 'hashed_token',
        created_at: new Date(),
        expires_at: new Date(Date.now() - 100000),
        user: {
          user_id: 1,
          username: 'testuser',
          email: 'test@example.com',
        } as User,
      } as UserSession;

      sessionService.validateRefreshToken.mockResolvedValue(true);
      sessionService.findSessionById.mockResolvedValue(expiredSession);

      await expect(service.refreshTokens('expired_session', 'old_refresh_token')).rejects.toThrow(
        new UnauthorizedException('Сессия истекла'),
      );
    });
  });

  describe('logout', () => {
    it('должен удалять сессию', async () => {
      await service.logout('session_id');
      expect(sessionService.deleteSession).toHaveBeenCalledWith('session_id');
    });
  });

  describe('register', () => {
    it('должен создавать пользователя и возвращать токены', async () => {
      const mockUser = {
        user_id: 1,
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashed_password',
        created_at: new Date(),
        last_login: null,
        sessions: [],
        results: [],
        achievements: [],
      } as User;

      usersService.createUser.mockResolvedValue(mockUser);
      jest.spyOn(service, 'login').mockResolvedValue({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        session_id: 'session_id',
        user: {
          id: 1,
          username: 'newuser',
          email: 'new@example.com',
        },
      });

      const result = await service.register('newuser', 'new@example.com', 'Password123!');

      expect(usersService.createUser).toHaveBeenCalledWith('newuser', 'new@example.com', 'Password123!');
      expect(result).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        session_id: 'session_id',
        user: {
          id: 1,
          username: 'newuser',
          email: 'new@example.com',
        },
      });
    });
  });
});