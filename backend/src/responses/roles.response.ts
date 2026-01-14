import { Role as supportmanagementRole } from '@/data-contracts/supportmanagement/data-contracts';
import ApiResponse from '@/interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

export class Role implements supportmanagementRole {
  @IsString()
  id: string;
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  createdAt?: string;
  @IsString()
  @IsOptional()
  updatedAt?: string;
}

export class RoleDeleteApiResponse implements ApiResponse<boolean> {
  @IsBoolean()
  data: boolean;
  @IsString()
  message: string;
}

export class RolesApiResponse implements ApiResponse<Role[]> {
  @ValidateNested({ each: true })
  @Type(() => Role)
  data: Role[];
  @IsString()
  message: string;
}
export class RoleApiResponse implements ApiResponse<Role> {
  @ValidateNested()
  @Type(() => Role)
  data: Role;
  @IsString()
  message: string;
}
