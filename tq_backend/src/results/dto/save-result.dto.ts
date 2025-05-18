import { IsNumber, IsPositive, Min, Max } from 'class-validator';

export class SaveResultDto {
  @IsNumber()
  @IsPositive()
  levelId: number;

  @IsNumber()
  @IsPositive()
  wpm: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  accuracy: number;

  @IsNumber()
  @IsPositive()
  completionTime: number; // in seconds

  @IsNumber()
  @Min(0)
  errorsCount: number;
}