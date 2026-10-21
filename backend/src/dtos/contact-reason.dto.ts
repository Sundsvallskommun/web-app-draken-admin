import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ContactReasonRequestDto {
  @IsString()
  reason: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
  @IsString()
  namespace: string;
}

export class ContactReasonUpdateDto {
  @IsString()
  @IsOptional()
  reason?: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
  @IsString()
  @IsOptional()
  namespace?: string;
}
