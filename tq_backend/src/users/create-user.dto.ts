import { IsString, MinLength, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsString()
  readonly nickname: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  @MinLength(6)
  readonly password: string;
}