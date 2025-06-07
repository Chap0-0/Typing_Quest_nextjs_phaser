import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionService } from '../session.service';
import { Request } from 'express';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.cookies?.sessionId;
    const refreshToken = request.cookies?.refreshToken;

    if (!sessionId || !refreshToken) {
      throw new UnauthorizedException('Сессия не найдена');
    }

    const session = await this.sessionService.findSessionById(sessionId);
    if (!session) {
      throw new UnauthorizedException('Недействительная сессия');
    }

    if (new Date(session.expires_at) < new Date()) {
      throw new UnauthorizedException('Сессия истекла');
    }

    const isValid = await this.sessionService.validateRefreshToken(sessionId, refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Недействительный refresh token');
    }

    request.session = session;
    return true;
  }
}