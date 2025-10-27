import { prisma } from '../../config/database';

type User = Awaited<ReturnType<typeof prisma.user.findUnique>>;

export interface CreateUserData {
  email: string;
  passwordHash: string;
}

export interface UpdateUserData {
  passwordHash?: string;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}

/**
 * Find user by reset token
 */
export async function findUserByResetToken(token: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date(), // Token must not be expired
      },
    },
  });
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserData): Promise<User> {
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
    },
  });
}

/**
 * Update user
 */
export async function updateUser(
  id: string,
  data: UpdateUserData
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data,
  });
}
