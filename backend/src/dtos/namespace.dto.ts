import { NamespaceConfig } from '@/data-contracts/supportmanagement/data-contracts';
import { IsBoolean, IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class NamespaceRequestDto implements Partial<NamespaceConfig> {
  // Ends up as a path segment in the upstream url, so only allow what supportmanagement accepts.
  @IsString()
  @IsOptional()
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'namespace may only contain letters, digits, _ and -' })
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
