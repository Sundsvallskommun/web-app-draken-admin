import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";
import { FeatureFlags as _FeatureFlag } from '@prisma/client';

export class FeatureFlagRequestDto implements Partial<_FeatureFlag> {
  @IsInt()
  @IsOptional()
  id?: number;
  @IsString()
  name: string;
  @IsBoolean()
  enabled: boolean;
  @IsString()
  application: string;
  @IsString()
  namespace: string;
}

export class UpdateFeatureFlagDto implements Partial<_FeatureFlag> {
  @IsInt()
  @IsOptional()
  id?: number;
  @IsString()
  @IsOptional()
  name?: string;
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
  @IsString()
  @IsOptional()
  application?: string;
  @IsString()
  @IsOptional()
  namespace?: string;
}