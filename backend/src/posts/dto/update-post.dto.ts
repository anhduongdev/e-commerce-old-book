import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PostStatus } from '@prisma/client';

// Slug is deliberately omitted — immutable after creation.
export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

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

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}
