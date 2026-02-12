import { Request } from 'express';
import { User } from '@interfaces/users.interface';

export interface DataStoredInToken {
  id: number;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

// export interface Representing {
//   organizationName: string;
//   organizationNumber: string;
//   organizationId: string;
// }

export interface RequestWithUser extends Request {
  user: User;
  // representing?: Representing;
}

export interface Permissions {
  canUseAdminPanel: boolean;
}

/** AD roles - dynamically configured via ADMIN_PANEL_GROUP env variable */
export type ADRole = string;

/** Internal roles */
export type InternalRole = 'app_admin' | 'app_read';
export enum InternalRoleEnum {
  'app_read',
  'app_admin',
}
