export const Role = {
  CLIENT: 'client',
  CONTENT_MANAGER: 'content_manager',
  WAREHOUSE: 'warehouse',
  ADMIN: 'admin',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ROLE_LIST: Role[] = [
  Role.CLIENT,
  Role.CONTENT_MANAGER,
  Role.WAREHOUSE,
  Role.ADMIN,
];

export function isRole(value: string): value is Role {
  return (ROLE_LIST as string[]).includes(value);
}
