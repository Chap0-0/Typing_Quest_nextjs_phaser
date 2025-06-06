import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result } from './entities/result.entity';

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(Result)
    private resultsRepository: Repository<Result>,
  ) {}

  async createResult(
    userId: number,
    levelId: number,
    cpm: number,
    accuracy: number,
    completionTime: number,
    errorsCount: number,
    
  ): Promise<Result> {
    const score = this.calculateScore(cpm, accuracy, errorsCount, completionTime);

    const result = this.resultsRepository.create({
      user: { user_id: userId },
      level: { level_id: levelId },
      cpm,
      accuracy,
      completion_time: completionTime,
      errors_count: errorsCount,
      score,
    });

    return this.resultsRepository.save(result);
  }

  private calculateScore(
      cpm: number,
      accuracy: number,
      errorsCount: number,
      completionTime: number,
  ): number {
      const accuracyMultiplier = accuracy / 100;
      const timeMultiplier = 1 + (1 - completionTime / 180);
      const errorsPenalty = errorsCount * 5;

      const score = cpm * accuracyMultiplier * timeMultiplier - errorsPenalty;
      
      return Math.max(0, Math.round(score));
  }

  async getUserResults(userId: number): Promise<Result[]> {
    return this.resultsRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.user', 'user')
      .where('user.user_id = :userId', { userId })
      .orderBy('result.achieved_at', 'DESC')
      .getMany();
  }

  async getLevelResults(levelId: number, limit = 5): Promise<any[]> {
      return this.resultsRepository
          .createQueryBuilder('result')
          .leftJoinAndSelect('result.user', 'user')
          .where('result.level_id = :levelId', { levelId })
          .select([
              'result.score as score',
              'result.cpm as cpm',
              'result.accuracy as accuracy',
              'result.completion_time as completionTime',
              'user.username as username'
          ])
          .orderBy('result.score', 'DESC')
          .limit(limit)
          .getRawMany();
  }

  async getUserStats(userId: number): Promise<{
    totalResults: number;
    averageCpm: number;
    averageAccuracy: number;
    totalScore: number;
    totalErrors: number;
  }> {
    const stats = await this.resultsRepository
      .createQueryBuilder('result')
      .select('COUNT(result.result_id)', 'totalResults')
      .addSelect('AVG(result.cpm)', 'averageCpm')
      .addSelect('AVG(result.accuracy)', 'averageAccuracy')
      .addSelect('SUM(result.score)', 'totalScore')
      .addSelect('SUM(result.errors_count)', 'totalErrors')
      .where('result.user_id = :userId', { userId })
      .getRawOne();

    return {
      totalResults: parseInt(stats.totalResults) || 0,
      averageCpm: parseFloat(stats.averageCpm) || 0,
      averageAccuracy: parseFloat(stats.averageAccuracy) || 0,
      totalScore: parseInt(stats.totalScore) || 0,
      totalErrors: parseInt(stats.totalErrors) || 0,
    };
  }

  async getUserResultsWithLevels(userId: number): Promise<any[]> {
    return this.resultsRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.level', 'level')
      .where('result.user_id = :userId', { userId })
      .orderBy('result.achieved_at', 'DESC')
      .getMany();
  }
}