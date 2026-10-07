import { User } from '@prisma/client';

export type UserDto = Omit<User, 'passwordHash'>;

/** Strips the password hash before a user is ever returned to a client. */
export function toUserDto(user: User): UserDto {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

export function toUserDtoList(users: User[]): UserDto[] {
  return users.map(toUserDto);
}
