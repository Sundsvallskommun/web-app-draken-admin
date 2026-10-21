import ApiResponse from '@/interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class MeasureType {
  @IsString()
  id: string;
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsArray()
  @IsString({ each: true })
  measureGroups: string[];
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
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

export class MeasureTypeDeleteApiResponse implements ApiResponse<boolean> {
  @IsBoolean()
  data: boolean;
  @IsString()
  message: string;
}

export class MeasureTypesApiResponse implements ApiResponse<MeasureType[]> {
  @ValidateNested({ each: true })
  @Type(() => MeasureType)
  data: MeasureType[];
  @IsString()
  message: string;
}

export class MeasureTypeApiResponse implements ApiResponse<MeasureType> {
  @ValidateNested()
  @Type(() => MeasureType)
  data: MeasureType;
  @IsString()
  message: string;
}
