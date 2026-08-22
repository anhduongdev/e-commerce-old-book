import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

// Slug is deliberately omitted — immutable after creation.
export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  metaDescription?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
