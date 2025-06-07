import { IsNumber, IsPositive } from 'class-validator';

export class SaveResultDto {
  @IsNumber()
  @IsPositive()
  levelId: number;

  @IsNumber()
  cpm: number;

  @IsNumber()
  accuracy: number;

  @IsNumber()
  completionTime: number;

  @IsNumber()
  @IsPositive()
  errorsCount: number;
  
  @IsNumber()
  @IsPositive()
  score: number;
}