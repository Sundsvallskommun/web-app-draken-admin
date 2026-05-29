import { Type } from 'class-transformer';
import { IsEmail, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CategoryTypeDto {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsEmail()
  @IsOptional()
  escalationEmail?: string;
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
  @ValidateNested({ each: true })
  @Type(() => CategoryTypeDto)
  @IsOptional()
  types?: CategoryTypeDto[];
  @IsString()
  namespace: string;
}
