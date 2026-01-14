import { Role as supportmanagementRole } from '@/data-contracts/supportmanagement/data-contracts';
import { IsString } from 'class-validator';

export class RoleRequestDto implements supportmanagementRole {
  @IsString()
  name: string;
  @IsString()
  displayName: string;
  @IsString()
  namespace: string;
}
