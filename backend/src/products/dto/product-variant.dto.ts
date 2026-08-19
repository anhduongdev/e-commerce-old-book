import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ConditionGrade } from '@prisma/client';

// One row = one tập (volume) or, when volumeNumber is omitted, the single
// sellable unit for a standalone book. tempKey is a frontend-generated key
// (not persisted) used to wire a new variant's images before it has a real id.
export class ProductVariantDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  tempKey?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  sku!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  volumeNumber?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  compareAtPrice?: number;

  @IsEnum(ConditionGrade)
  conditionGrade!: ConditionGrade;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  conditionNote?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  weightGram?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsBoolean()
  isActive!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number;
}
