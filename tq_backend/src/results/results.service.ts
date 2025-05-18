import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result } from './entities/result.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(Result)
    private resultsRepository: Repository<Result>,
  ) {}

  async createResult(
    userId: number,
    levelId: number,
    wpm: number,
    accuracy: number,
    completionTime: number,
    errorsCount: number,
  ): Promise<Result> {
    // Рассчитываем score на основе параметров
    const score = this.calculateScore(wpm, accuracy, errorsCount, completionTime);

    const result = this.resultsRepository.create({
      user_id: userId,
      level_id: levelId,
      wpm,
      accuracy,
      completion_time: completionTime,
      errors_count: errorsCount,
      score,
    });

    return this.resultsRepository.save(result);
  }

  private calculateScore(
    wpm: number,
    accuracy: number,
    errorsCount: number,
    completionTime: number,
  ): number {
    // Простая формула для расчета очков
    const accuracyMultiplier = accuracy / 100;
    const timeMultiplier = 1 + (1 - completionTime / 180); // Нормализуем время (180 сек = 3 мин)
    const errorsPenalty = errorsCount * 5;

    return Math.round(wpm * accuracyMultiplier * timeMultiplier - errorsPenalty);
  }

  async getUserResults(userId: number): Promise<Result[]> {
    return this.resultsRepository.find({
      where: { user_id: userId },
      relations: ['level'],
      order: { achieved_at: 'DESC' },
    });
  }

  async getLevelResults(levelId: number): Promise<Result[]> {
    return this.resultsRepository.find({
      where: { level_id: levelId },
      relations: ['user'],
      order: { score: 'DESC' },
      take: 10, // Топ-10 результатов для уровня
    });
  }

  async getUserStats(userId: number): Promise<{
    totalResults: number;
    averageWpm: number;
    averageAccuracy: number;
    highestScore: number;
  }> {
    const stats = await this.resultsRepository
      .createQueryBuilder('result')
      .select('COUNT(result.result_id)', 'totalResults')
      .addSelect('AVG(result.wpm)', 'averageWpm')
      .addSelect('AVG(result.accuracy)', 'averageAccuracy')
      .addSelect('MAX(result.score)', 'highestScore')
      .where('result.user_id = :userId', { userId })
      .getRawOne();

    return {
      totalResults: parseInt(stats.totalResults) || 0,
      averageWpm: parseFloat(stats.averageWpm) || 0,
      averageAccuracy: parseFloat(stats.averageAccuracy) || 0,
      highestScore: parseInt(stats.highestScore) || 0,
    };
  }
}