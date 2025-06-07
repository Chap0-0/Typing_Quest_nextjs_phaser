import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { Result } from './entities/result.entity';
import { UsersModule } from '../users/users.module';
import { LevelsModule } from '../levels/levels.module';
import { AuthModule } from '../auth/auth.module';
import { AchievementsModule } from 'src/achievements/achievements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Result]),
    UsersModule,
    LevelsModule,
    AuthModule,
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}