import ApiResponse from '@/interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class AttachmentPurpose {
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

export class AttachmentPurposeDeleteApiResponse implements ApiResponse<boolean> {
  @IsBoolean()
  data: boolean;
  @IsString()
  message: string;
}

export class AttachmentPurposesApiResponse implements ApiResponse<AttachmentPurpose[]> {
  @ValidateNested({ each: true })
  @Type(() => AttachmentPurpose)
  data: AttachmentPurpose[];
  @IsString()
  message: string;
}

export class AttachmentPurposeApiResponse implements ApiResponse<AttachmentPurpose> {
  @ValidateNested()
  @Type(() => AttachmentPurpose)
  data: AttachmentPurpose;
  @IsString()
  message: string;
}
