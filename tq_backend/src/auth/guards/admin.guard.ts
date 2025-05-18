import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    // Здесь должна быть ваша логика проверки ролей
    // В данном примере просто проверяем наличие флага isAdmin
    if (user && user['isAdmin']) {
      return true;
    }

    throw new ForbiddenException('Требуются права администратора');
  }
}