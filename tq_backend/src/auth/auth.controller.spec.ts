import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';
import { UserSession } from '../users/entities/user-session.entity';
import { SessionService } from './session.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let sessionService: jest.Mocked<SessionService>;

  // Мок объекта Response для тестирования cookie
  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
            register: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            validateRefreshToken: jest.fn(),
            findSessionById: jest.fn(),
          },
        },
        {
          provide: RefreshTokenGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    sessionService = module.get(SessionService);
  });

  describe('login', () => {
    it('должен возвращать токены и устанавливать cookies', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };

      const mockTokens = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        session_id: 'session_id',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      authService.validateUser.mockResolvedValue({
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
      });
      authService.login.mockResolvedValue(mockTokens);

      const result = await controller.login(loginDto, mockResponse);

      expect(authService.validateUser).toHaveBeenCalledWith('testuser', 'password123');
      expect(authService.login).toHaveBeenCalled();
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'refresh_token', expect.any(Object));
      expect(mockResponse.cookie).toHaveBeenCalledWith('sessionId', 'session_id', expect.any(Object));
      expect(result).toEqual({
        accessToken: 'access_token',
        user: mockTokens.user,
      });
    });
  });

  describe('register', () => {
    it('должен регистрировать пользователя и возвращать токены', async () => {
      const registerDto: RegisterDto = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123!',
      };

      const mockTokens = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        session_id: 'session_id',
        user: {
          id: 2,
          username: 'newuser',
          email: 'new@example.com',
        },
      };

      authService.register.mockResolvedValue(mockTokens);

      const result = await controller.register(registerDto, mockResponse);

      expect(authService.register).toHaveBeenCalledWith('newuser', 'new@example.com', 'Password123!');
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'refresh_token', expect.any(Object));
      expect(mockResponse.cookie).toHaveBeenCalledWith('sessionId', 'session_id', expect.any(Object));
      expect(result).toEqual({
        accessToken: 'access_token',
        user: mockTokens.user,
      });
    });
  });

  describe('refreshTokens', () => {
    it('должен обновлять токены', async () => {
      const mockSession = {
        session_id: 'session_id',
        user_id: 1,
        refresh_token_hash: 'hashed_token',
        expires_at: new Date(Date.now() + 100000),
        created_at: new Date(),
        user: {
          user_id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
      } as UserSession;

      const mockTokens = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        session_id: 'new_session_id',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      authService.refreshTokens.mockResolvedValue(mockTokens);

      const mockRequest = {
        cookies: {
          refreshToken: 'old_refresh_token',
        },
        user: mockSession.user,
      } as any;

      const result = await controller.refreshTokens(mockSession, mockRequest, mockResponse);

      expect(authService.refreshTokens).toHaveBeenCalledWith('session_id', 'old_refresh_token');
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'new_refresh_token', expect.any(Object));
      expect(mockResponse.cookie).toHaveBeenCalledWith('sessionId', 'new_session_id', expect.any(Object));
      expect(result).toEqual({
        accessToken: 'new_access_token',
        user: mockTokens.user,
      });
    });
  });

  describe('logout', () => {
    it('должен выходить из системы и очищать cookies', async () => {
      const mockSession = {
        session_id: 'session_id',
      } as UserSession;

      authService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(mockSession, mockResponse);

      expect(authService.logout).toHaveBeenCalledWith('session_id');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('sessionId');
      expect(result).toEqual({ success: true });
    });
  });

  describe('checkAuth', () => {
    it('должен возвращать статус аутентификации', async () => {
      const mockRequest = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
      } as any;

      const result = await controller.checkAuth(mockRequest);

      expect(result).toEqual({
        authenticated: true,
        user: mockRequest.user,
      });
    });
  });
});