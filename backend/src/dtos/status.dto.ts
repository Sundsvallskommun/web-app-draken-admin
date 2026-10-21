import { Status as supportmanagementStatus } from '@/data-contracts/supportmanagement/data-contracts';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class StatusRequestDto implements supportmanagementStatus {
  @IsString()
  name: string;
  @IsString()
  namespace: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  externalDisplayName?: string;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
}

export class StatusUpdateDto {
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  externalDisplayName?: string;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
  @IsString()
  @IsOptional()
  namespace?: string;
}
