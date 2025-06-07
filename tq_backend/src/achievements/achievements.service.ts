import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { User } from '../users/entities/user.entity';
import { ResultsService } from '../results/results.service';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    @InjectRepository(Achievement)
    private achievementsRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchievementsRepository: Repository<UserAchievement>,
    private resultsService: ResultsService,
  ) {}

  async getAllAchievements(): Promise<Achievement[]> {
    return this.achievementsRepository.find();
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return this.userAchievementsRepository.find({
      where: { user_id: userId },
      relations: ['achievement'],
    });
  }

  async unlockAchievement(
    userId: number,
    achievementId: number,
  ): Promise<UserAchievement> {
    const existing = await this.userAchievementsRepository.findOne({
      where: { user_id: userId, achievement_id: achievementId },
    });

    if (existing) {
      return existing;
    }

    const userAchievement = this.userAchievementsRepository.create({
      user_id: userId,
      achievement_id: achievementId,
      unlocked_at: new Date(),
    });

    return this.userAchievementsRepository.save(userAchievement);
  }

  async checkAndUnlockAchievements(user: User): Promise<UserAchievement[]> {
      const achievements = await this.getAllAchievements();
      const userResults = await this.resultsService.getUserStats(user.user_id);
      const unlockedAchievements: UserAchievement[] = [];

      for (const achievement of achievements) {
          try {
              const shouldUnlock = await this.checkAchievementCondition(
                  user,
                  achievement,
                  userResults,
              );

              if (shouldUnlock) {
                  const unlocked = await this.unlockAchievement(
                      user.user_id,
                      achievement.achievement_id,
                  );
                  unlockedAchievements.push(unlocked);
              }
          } catch (error) {
              console.error(
                  `Error checking achievement ${achievement.achievement_id}:`,
                  error,
              );
          }
      }

      return unlockedAchievements;
  }

  private async checkAchievementCondition(
      user: User,
      achievement: Achievement,
      userResults: {
          totalResults: number;
          averageCpm: number;
          averageAccuracy: number;
          totalScore: number;
          totalErrors: number;
      },
  ): Promise<boolean> {
      const alreadyUnlocked = await this.userAchievementsRepository.findOne({
          where: {
              user_id: user.user_id,
              achievement_id: achievement.achievement_id,
          },
      });

      if (alreadyUnlocked) {
          return false;
      }

      switch (achievement.conditionType) {
          case 'level_completed':
                  userResults.totalResults >= achievement.conditionValue;
              return userResults.totalResults >= achievement.conditionValue;
          case 'cpm':
                  userResults.averageCpm >= achievement.conditionValue;
              return userResults.averageCpm >= achievement.conditionValue;
          case 'accuracy':
                  userResults.averageAccuracy >= achievement.conditionValue;
              return userResults.averageAccuracy >= achievement.conditionValue;
          default:
              return false;
      }
  }

  async isAchievementUnlocked(userId: number, achievementId: number): Promise<boolean> {
    const achievement = await this.userAchievementsRepository.findOne({
      where: {
        user_id: userId,
        achievement_id: achievementId,
      },
    });
    return !!achievement;
  }
}