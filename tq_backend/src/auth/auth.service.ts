import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SessionService } from './session.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private sessionService: SessionService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Неверное имя пользователя или пароль');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверное имя пользователя или пароль');
    }

    // Обновляем время последнего входа
    await this.usersService.updateLastLogin(user.user_id);

    // Возвращаем пользователя без пароля
    const { password_hash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { 
      username: user.username, 
      sub: user.user_id,
      email: user.email,
    };

    // Генерируем access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    // Генерируем refresh token
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    // Создаем сессию в базе данных
    const session = await this.sessionService.createSession(user.user_id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      session_id: session.session_id,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async refreshTokens(sessionId: string, refreshToken: string) {
    // Проверяем валидность refresh token
    const isValid = await this.sessionService.validateRefreshToken(sessionId, refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Недействительный refresh token');
    }

    // Получаем сессию
    const session = await this.sessionService.findSessionById(sessionId);
    if (!session || new Date(session.expires_at) < new Date()) {
      throw new UnauthorizedException('Сессия истекла');
    }

    // Получаем пользователя
    const user = await this.usersService.findOneById(session.user_id);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Генерируем новые токены
    const payload = { 
      username: user.username, 
      sub: user.user_id,
      email: user.email,
    };

    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const newRefreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    // Удаляем старую сессию и создаем новую
    await this.sessionService.deleteSession(sessionId);
    const newSession = await this.sessionService.createSession(user.user_id, newRefreshToken);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      session_id: newSession.session_id,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async logout(sessionId: string) {
    await this.sessionService.deleteSession(sessionId);
  }

  async register(username: string, email: string, password: string) {
    const user = await this.usersService.createUser(username, email, password);
    return this.login(user);
  }
}