import { Role as supportmanagementRole } from '@/data-contracts/supportmanagement/data-contracts';
import { IsOptional, IsString } from 'class-validator';

export class RoleRequestDto implements supportmanagementRole {
  @IsString()
  name: string;
  @IsString()
  displayName: string;
  @IsString()
  namespace: string;
}

export class RoleUpdateDto {
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  namespace: string;
}
