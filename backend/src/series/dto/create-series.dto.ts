import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class CreateSeriesDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  @Matches(SLUG_PATTERN, {
    message: 'slug chỉ gồm chữ thường, số và dấu gạch ngang',
  })
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  author?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  publisher?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  totalVolumes?: number;

  @IsBoolean()
  isActive!: boolean;
}
