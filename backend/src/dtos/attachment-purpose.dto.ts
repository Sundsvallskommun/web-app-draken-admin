import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class AttachmentPurposeRequestDto {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsInt()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
  @IsString()
  namespace: string;
}

export class AttachmentPurposeUpdateDto {
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsInt()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
  @IsString()
  @IsOptional()
  namespace?: string;
}
