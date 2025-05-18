import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
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
  async create(
    @Body() saveResultDto: SaveResultDto,
    @Req() req: Request,
  ) {
    const userId = req.user['sub'];
    const result = await this.resultsService.createResult(
      userId,
      saveResultDto.levelId,
      saveResultDto.wpm,
      saveResultDto.accuracy,
      saveResultDto.completionTime,
      saveResultDto.errorsCount,
    );

    return {
      success: true,
      result,
    };
  }

  @Get('user')
  @UseGuards(AccessTokenGuard)
  getUserResults(@Req() req: Request) {
    const userId = req.user['sub'];
    return this.resultsService.getUserResults(userId);
  }

  @Get('user/stats')
  @UseGuards(AccessTokenGuard)
  getUserStats(@Req() req: Request) {
    const userId = req.user['sub'];
    return this.resultsService.getUserStats(userId);
  }

  @Get('level/:levelId')
  getLevelResults(@Param('levelId') levelId: string) {
    return this.resultsService.getLevelResults(+levelId);
  }
}