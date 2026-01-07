import { Permissions } from '@interfaces/auth.interface';

export type User = {
  // personId: string;
  username: string;
  name: string;
  givenName: string;
  surname: string;
  role?: string;
  permissions: Permissions;
};

export type ClientUser = {
  name: string;
  username: string;
  permissions: Permissions;
};
