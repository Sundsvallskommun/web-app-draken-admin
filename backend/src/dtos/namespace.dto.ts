import { NamespaceConfig } from '@/data-contracts/supportmanagement/data-contracts';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class NamespaceRequestDto implements Partial<NamespaceConfig> {
  @IsString()
  @IsOptional()
  namespace?: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  shortCode?: string;
  @IsBoolean()
  @IsOptional()
  accessControl?: boolean;
  @IsBoolean()
  @IsOptional()
  notifyReporter?: boolean;
  @IsNumber()
  @IsOptional()
  notificationTTLInDays?: number;
}
