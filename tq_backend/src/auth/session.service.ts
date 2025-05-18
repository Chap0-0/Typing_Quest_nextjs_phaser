import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from '../users/entities/user-session.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
  ) {}

  async createSession(userId: number, refreshToken: string): Promise<UserSession> {
    // Хешируем refresh token перед сохранением в БД
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    
    // Устанавливаем срок действия сессии (например, 30 дней)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const session = this.sessionRepository.create({
      session_id: uuidv4(),
      user_id: userId,
      refresh_token_hash: refreshTokenHash,
      expires_at: expiresAt,
    });

    return this.sessionRepository.save(session);
  }

  async findSessionById(sessionId: string): Promise<UserSession | undefined> {
    return this.sessionRepository.findOne({ 
      where: { session_id: sessionId },
      relations: ['user'],
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete(sessionId);
  }

  async deleteAllUserSessions(userId: number): Promise<void> {
    await this.sessionRepository.delete({ user_id: userId });
  }

  async validateRefreshToken(sessionId: string, refreshToken: string): Promise<boolean> {
    const session = await this.findSessionById(sessionId);
    if (!session) return false;

    return bcrypt.compare(refreshToken, session.refresh_token_hash);
  }
}