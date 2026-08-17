import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}
