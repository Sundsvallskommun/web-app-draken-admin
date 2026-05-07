import { ContactReason as supportmanagementContactReason } from '@/data-contracts/supportmanagement/data-contracts';
import ApiResponse from '@/interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ContactReason implements supportmanagementContactReason {
  @IsString()
  id: string;
  @IsString()
  reason: string;
  @IsString()
  @IsOptional()
  displayName?: string;
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

export class ContactReasonDeleteApiResponse implements ApiResponse<boolean> {
  @IsBoolean()
  data: boolean;
  @IsString()
  message: string;
}

export class ContactReasonsApiResponse implements ApiResponse<ContactReason[]> {
  @ValidateNested({ each: true })
  @Type(() => ContactReason)
  data: ContactReason[];
  @IsString()
  message: string;
}

export class ContactReasonApiResponse implements ApiResponse<ContactReason> {
  @ValidateNested()
  @Type(() => ContactReason)
  data: ContactReason;
  @IsString()
  message: string;
}
