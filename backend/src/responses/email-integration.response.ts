import ApiResponse from '@/interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class EmailIntegrationData {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @IsOptional()
  errandClosedEmailSender?: string;

  @IsString()
  @IsOptional()
  errandClosedEmailTemplate?: string;

  @IsString()
  @IsOptional()
  errandClosedEmailHTMLTemplate?: string;

  @IsString()
  @IsOptional()
  errandNewEmailSender?: string;

  @IsString()
  @IsOptional()
  errandNewEmailTemplate?: string;

  @IsString()
  @IsOptional()
  errandNewEmailHTMLTemplate?: string;

  @IsNumber()
  @IsOptional()
  daysOfInactivityBeforeReject?: number;

  @IsString()
  statusForNew: string;

  @IsString()
  @IsOptional()
  triggerStatusChangeOn?: string;

  @IsString()
  @IsOptional()
  statusChangeTo?: string;

  @IsString()
  @IsOptional()
  inactiveStatus?: string;

  @IsBoolean()
  @IsOptional()
  addSenderAsStakeholder?: boolean;

  @IsString()
  @IsOptional()
  stakeholderRole?: string;

  @IsString()
  @IsOptional()
  errandChannel?: string;

  @IsBoolean()
  ignoreAutoReply: boolean;

  @IsBoolean()
  ignoreNoReply: boolean;

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

export class EmailIntegrationApiResponse implements ApiResponse<EmailIntegrationData> {
  @ValidateNested()
  @Type(() => EmailIntegrationData)
  data: EmailIntegrationData;
  @IsString()
  message: string;
}
