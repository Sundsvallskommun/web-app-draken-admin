import ApiResponse from '@/interfaces/api-service.interface';
import { ClientUser } from '@/interfaces/users.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';

export class Permissions {
  @IsBoolean()
  canUseAdminPanel: boolean;
}

export class User implements ClientUser {
  @IsString()
  name: string;
  @IsString()
  username: string;
  // @IsEnum(InternalRoleEnum)
  // role: InternalRole;
  @ValidateNested()
  @Type(() => Permissions)
  permissions: Permissions;
}

export class UserApiResponse implements ApiResponse<User> {
  @ValidateNested()
  @Type(() => User)
  data: User;
  @IsString()
  message: string;
}
