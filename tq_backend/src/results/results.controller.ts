import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Query,
} from '@nestjs/common';
import { ResultsService } from './results.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { Request } from 'express';
import { SaveResultDto } from './dto/save-result.dto';

@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async saveResult(
    @Body() saveResultDto: SaveResultDto,
    @Req() req: Request,
  ) {
    const userId = req.user['sub'];
    
    const result = await this.resultsService.createResult(
      userId,
      saveResultDto.levelId,
      saveResultDto.cpm,
      saveResultDto.accuracy,
      saveResultDto.completionTime,
      saveResultDto.errorsCount,
    );

    const leaderboard = await this.resultsService.getLevelResults(saveResultDto.levelId, 5);

    return {
      success: true,
      result,
      leaderboard,
      userStats: await this.resultsService.getUserStats(userId),
    };
  }

  @Get('user')
  @UseGuards(AccessTokenGuard)
  getUserResults(@Req() req: Request) {
    const userId = req.user['sub'];
    return this.resultsService.getUserResultsWithLevels(userId);
  }

  @Get('user/stats')
  @UseGuards(AccessTokenGuard)
  getUserStats(@Req() req: Request) {
    const userId = req.user['sub'];
    return this.resultsService.getUserStats(userId);
  }

  @Get('level/:levelId')
  getLevelResults(
    @Param('levelId') levelId: string,
    @Query('limit') limit = '5',
  ) {
    return this.resultsService.getLevelResults(parseInt(levelId), parseInt(limit));
  }

    @Get('user/profile-stats')
  @UseGuards(AccessTokenGuard)
  async getUserProfileStats(@Req() req: Request) {
    const userId = req.user['sub'];
    
    const stats = await this.resultsService.getUserStats(userId);
    const results = await this.resultsService.getUserResultsWithLevels(userId);
    
    return {
      stats,
      results
    };
  }
}
