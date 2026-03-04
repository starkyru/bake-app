export const PERMISSION_RESOURCES = [
  'users',
  'roles',
  'permissions',
  'orders',
  'products',
  'categories',
  'inventory',
  'ingredients',
  'locations',
  'recipes',
  'production',
  'finance',
  'reports',
  'notifications',
  'settings',
] as const;

export const PERMISSION_ACTIONS = ['read', 'create', 'update', 'delete'] as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
export type PermissionString = `${PermissionResource}:${PermissionAction}`;
