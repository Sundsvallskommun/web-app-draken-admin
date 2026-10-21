import { Role as supportmanagementRole } from '@/data-contracts/supportmanagement/data-contracts';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class RoleRequestDto implements supportmanagementRole {
  @IsString()
  name: string;
  @IsString()
  displayName: string;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
  @IsString()
  namespace: string;
}

export class RoleUpdateDto {
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
