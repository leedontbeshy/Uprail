import * as argon2 from 'argon2';

/**
 * Hash a password using Argon2
 * Uses time cost of 2 and memory cost of 19456 KiB as per security requirements
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    timeCost: 2,
    memoryCost: 19456, // 19 MiB
  });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
