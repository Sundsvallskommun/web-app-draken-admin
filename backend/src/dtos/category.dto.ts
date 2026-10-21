import { EmptyStringToUndefined } from '@/utils/empty-string-to-undefined';
import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CategoryTypeDto {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @EmptyStringToUndefined()
  @IsEmail()
  @IsOptional()
  escalationEmail?: string;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
}

export class CategoryRequestDto {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
  @ValidateNested({ each: true })
  @Type(() => CategoryTypeDto)
  @IsOptional()
  types?: CategoryTypeDto[];
  @IsString()
  namespace: string;
}

export class CategoryUpdateDto {
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
  @ValidateNested({ each: true })
  @Type(() => CategoryTypeDto)
  @IsOptional()
  types?: CategoryTypeDto[];
  @IsString()
  @IsOptional()
  namespace?: string;
}
