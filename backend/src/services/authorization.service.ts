import { ADMIN_PANEL_GROUP } from '@/config';
import { Permissions, InternalRole, ADRole } from '@interfaces/auth.interface';

// export function authorizeGroups(groups) {
//   const authorizedGroupsList = AUTHORIZED_GROUPS.split(',');
//   const groupsList = groups.split(',').map((g: string) => g.toLowerCase());
//   return authorizedGroupsList.some(authorizedGroup => groupsList.includes(authorizedGroup));
// }

export const defaultPermissions: () => Permissions = () => ({
  canUseAdminPanel: false,
});

enum RoleOrderEnum {
  'app_read',
  'app_admin',
}

const roles = new Map<InternalRole, Partial<Permissions>>([
  [
    'app_admin',
    {
      canUseAdminPanel: true,
    },
  ],
  ['app_read', {}],
]);

type RoleADMapping = {
  [key: string]: InternalRole;
};
const getRoleADMapping = (): RoleADMapping => {
  const mapping: RoleADMapping = {
    sg_appl_app_read: 'app_read',
  };
  if (ADMIN_PANEL_GROUP) {
    mapping[ADMIN_PANEL_GROUP.toLowerCase()] = 'app_admin';
  }
  return mapping;
};

/**
 *
 * @param groups Array of groups/roles
 * @param internalGroups Whether to use internal groups or external group-mappings
 * @returns collected permissions for all matching role groups
 */
export const getPermissions = (groups: InternalRole[] | string[], internalGroups = false): Permissions => {
  const permissions: Permissions = defaultPermissions();
  const roleADMapping = getRoleADMapping();
  groups.forEach(group => {
    const groupLower = group.toLowerCase();
    const role = internalGroups ? (groupLower as InternalRole) : (roleADMapping[groupLower] as InternalRole);
    if (roles.has(role)) {
      const groupPermissions = roles.get(role);
      Object.keys(groupPermissions).forEach(permission => {
        if (groupPermissions[permission] === true) {
          permissions[permission] = true;
        }
      });
    }
  });
  return permissions;
};

/**
 * Ensures to return only the role with most permissions
 * @param groups List of AD roles
 * @returns role with most permissions
 */
export const getRole = (groups: string[]) => {
  const roleADMapping = getRoleADMapping();
  if (groups.length == 1) return roleADMapping[groups[0].toLowerCase()];

  const mappedRoles: InternalRole[] = [];
  groups.forEach(group => {
    const groupLower = group.toLowerCase();
    const role = roleADMapping[groupLower];
    if (role) {
      mappedRoles.push(role);
    }
  });

  return mappedRoles.sort((a, b) => (RoleOrderEnum[a] > RoleOrderEnum[b] ? 1 : 0))[0];
};
