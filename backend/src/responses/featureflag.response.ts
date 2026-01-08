import ApiResponse from '@/interfaces/api-service.interface';
import { FeatureFlags as _FeatureFlag } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

export class FeatureFlag implements Partial<_FeatureFlag> {
  @IsInt()
  id: number;
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  value?: string;
  @IsBoolean()
  enabled: boolean;
  @IsString()
  application: string;
  @IsString()
  namespace: string;
}

export class FeatureFlagDeleteApiResponse implements ApiResponse<boolean> {
  @IsBoolean()
  data: boolean;
  @IsString()
  message: string;
}

export class FeatureFlagsApiResponse implements ApiResponse<FeatureFlag[]> {
  @ValidateNested({ each: true })
  @Type(() => FeatureFlag)
  data: FeatureFlag[];
  @IsString()
  message: string;
}
export class FeatureFlagApiResponse implements ApiResponse<FeatureFlag> {
  @ValidateNested()
  @Type(() => FeatureFlag)
  data: FeatureFlag;
  @IsString()
  message: string;
}
