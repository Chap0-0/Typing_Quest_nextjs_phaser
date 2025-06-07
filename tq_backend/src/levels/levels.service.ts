import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Level } from './entities/level.entity';

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(Level)
    private levelsRepository: Repository<Level>,
  ) {}

  async findAll(): Promise<Level[]> {
    return this.levelsRepository.find();
  }

  async findOne(id: number): Promise<Level> {
    return this.levelsRepository.findOne({ where: { level_id: id } });
  }

  async create(levelData: Partial<Level>): Promise<Level> {
    const level = this.levelsRepository.create(levelData);
    return this.levelsRepository.save(level);
  }

  async update(id: number, levelData: Partial<Level>): Promise<Level> {
    await this.levelsRepository.update(id, levelData);
    return this.levelsRepository.findOne({ where: { level_id: id } });
  }

  async remove(id: number): Promise<void> {
    await this.levelsRepository.delete(id);
  }

  async findRandom(): Promise<Level> {
    const count = await this.levelsRepository.count();
    const randomIndex = Math.floor(Math.random() * count);
    const [level] = await this.levelsRepository.find({
      take: 1,
      skip: randomIndex,
    });
    return level;
  }
}