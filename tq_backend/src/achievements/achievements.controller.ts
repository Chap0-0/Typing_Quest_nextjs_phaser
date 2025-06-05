import {
  Controller,
  Get,
  UseGuards,
  Req,
  Post,
  Param,
} from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { Request } from 'express';
import { AdminGuard } from '../auth/guards/admin.guard';
import { User } from 'src/users/entities/user.entity';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  getAllAchievements() {
    return this.achievementsService.getAllAchievements();
  }

  @Get('user')
  @UseGuards(AccessTokenGuard)
  getUserAchievements(@Req() req: Request) {
    const userId = req.user['sub'];
    return this.achievementsService.getUserAchievements(userId);
  }

  @Get('user/:achievementId/status')
  @UseGuards(AccessTokenGuard)
  async getAchievementStatus(
    @Req() req: Request,
    @Param('achievementId') achievementId: string,
  ) {
    const userId = req.user['sub'];
    return {
      unlocked: await this.achievementsService.isAchievementUnlocked(
        userId,
        +achievementId,
      ),
    };
  }

  @Post('check')
  @UseGuards(AccessTokenGuard)
  async checkAchievements(@Req() req: Request) {
      console.log('User from request:', req.user);
      const userId = req.user['sub']; // Используем sub вместо user.user_id
      const user = { user_id: userId } as User; // Создаем объект пользователя с правильным полем
      return this.achievementsService.checkAndUnlockAchievements(user);
  }

  @Post(':id/unlock')
  @UseGuards(AccessTokenGuard, AdminGuard)
  async unlockAchievement(
    @Param('id') achievementId: string,
    @Req() req: Request,
  ) {
    const userId = req.user['sub'];
    return this.achievementsService.unlockAchievement(
      userId,
      +achievementId,
    );
  }
}