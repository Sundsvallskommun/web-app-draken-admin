import { Category as supportmanagementCategory, Type as supportmanagementType } from '@/data-contracts/supportmanagement/data-contracts';
import ApiResponse from '@/interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CategoryType implements supportmanagementType {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  escalationEmail?: string;
  @IsString()
  @IsOptional()
  createdAt?: string;
  @IsString()
  @IsOptional()
  updatedAt?: string;
}

export class Category implements supportmanagementCategory {
  @IsString()
  id: string;
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
  @ValidateNested({ each: true })
  @Type(() => CategoryType)
  @IsOptional()
  types?: CategoryType[];
  @IsString()
  @IsOptional()
  namespace?: string;
  @IsString()
  @IsOptional()
  createdAt?: string;
  @IsString()
  @IsOptional()
  updatedAt?: string;
}

export class CategoryDeleteApiResponse implements ApiResponse<boolean> {
  @IsBoolean()
  data: boolean;
  @IsString()
  message: string;
}

export class CategoriesApiResponse implements ApiResponse<Category[]> {
  @ValidateNested({ each: true })
  @Type(() => Category)
  data: Category[];
  @IsString()
  message: string;
}

export class CategoryApiResponse implements ApiResponse<Category> {
  @ValidateNested()
  @Type(() => Category)
  data: Category;
  @IsString()
  message: string;
}
