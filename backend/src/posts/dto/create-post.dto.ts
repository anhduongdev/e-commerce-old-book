import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PostStatus } from '@prisma/client';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  @Matches(SLUG_PATTERN, {
    message: 'slug chỉ gồm chữ thường, số và dấu gạch ngang',
  })
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailUrl?: string;

  @IsEnum(PostStatus)
  status!: PostStatus;
}
