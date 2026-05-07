import { IsOptional, IsString } from 'class-validator';

export class ContactReasonRequestDto {
  @IsString()
  reason: string;
  @IsString()
  @IsOptional()
  displayName?: string;
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
  @IsString()
  namespace: string;
}
