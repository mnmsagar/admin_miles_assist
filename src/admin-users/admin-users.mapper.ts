import { AdminUser } from '@prisma/client';

export type AdminUserDto = Omit<AdminUser, 'passwordHash'>;

/** Strips the password hash before an admin user is returned to a client. */
export function toAdminUserDto(user: AdminUser): AdminUserDto {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}
