import { Controller, Get, Param, Post, Body, Put, Delete, UseGuards } from '@nestjs/common';
import { LevelsService } from './levels.service';
import { Level } from './entities/level.entity';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  findAll(): Promise<Level[]> {
    return this.levelsService.findAll();
  }

  @Get('random')
  findRandom(): Promise<Level> {
    return this.levelsService.findRandom();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Level> {
    return this.levelsService.findOne(+id);
  }

  @Post()
  @UseGuards(AccessTokenGuard, AdminGuard)
  create(@Body() levelData: Partial<Level>): Promise<Level> {
    return this.levelsService.create(levelData);
  }

  @Put(':id')
  @UseGuards(AccessTokenGuard, AdminGuard)
  update(@Param('id') id: string, @Body() levelData: Partial<Level>): Promise<Level> {
    return this.levelsService.update(+id, levelData);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, AdminGuard)
  remove(@Param('id') id: string): Promise<void> {
    return this.levelsService.remove(+id);
  }
}