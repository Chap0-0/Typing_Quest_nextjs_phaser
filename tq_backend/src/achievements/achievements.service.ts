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

      console.log('Checking achievements for user:', user.user_id);
      console.log('User stats:', userResults);

      for (const achievement of achievements) {
          try {
              console.log(`Checking achievement ${achievement.achievement_id}: ${achievement.title}`);
              
              const shouldUnlock = await this.checkAchievementCondition(
                  user,
                  achievement,
                  userResults,
              );

              console.log(`Should unlock: ${shouldUnlock}`);

              if (shouldUnlock) {
                  console.log(`Unlocking achievement ${achievement.achievement_id} for user ${user.user_id}`);
                  const unlocked = await this.unlockAchievement(
                      user.user_id,
                      achievement.achievement_id,
                  );
                  unlockedAchievements.push(unlocked);
                  console.log(`Achievement unlocked:`, unlocked);
              }
          } catch (error) {
              console.error(
                  `Error checking achievement ${achievement.achievement_id}:`,
                  error,
              );
          }
      }

      console.log('Unlocked achievements:', unlockedAchievements);
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
      // Проверяем, есть ли уже такое достижение у пользователя
      const alreadyUnlocked = await this.userAchievementsRepository.findOne({
          where: {
              user_id: user.user_id,
              achievement_id: achievement.achievement_id,
          },
      });

      if (alreadyUnlocked) {
          console.log(`Achievement ${achievement.achievement_id} already unlocked`);
          return false;
      }

      console.log(`Checking condition for achievement ${achievement.achievement_id}`);
      console.log(`Type: ${achievement.conditionType}, Value: ${achievement.conditionValue}`);
      console.log(`User stats:`, userResults);

      switch (achievement.conditionType) {
          case 'level_completed':
              console.log(`Levels completed: ${userResults.totalResults} >= ${achievement.conditionValue}?`,
                  userResults.totalResults >= achievement.conditionValue);
              return userResults.totalResults >= achievement.conditionValue;
          case 'cpm':
              console.log(`cpm: ${userResults.averageCpm} >= ${achievement.conditionValue}?`,
                  userResults.averageCpm >= achievement.conditionValue);
              return userResults.averageCpm >= achievement.conditionValue;
          case 'accuracy':
              console.log(`Accuracy: ${userResults.averageAccuracy} >= ${achievement.conditionValue}?`,
                  userResults.averageAccuracy >= achievement.conditionValue);
              return userResults.averageAccuracy >= achievement.conditionValue;
          default:
              console.log(`Unknown condition type: ${achievement.conditionType}`);
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