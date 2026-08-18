import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// Slug is deliberately omitted — immutable after creation.
export class UpdateSeriesDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

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

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
