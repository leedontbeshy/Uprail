import { hashPassword, verifyPassword } from '../../utils/password.util';
import { generateToken } from '../../utils/jwt.util';
import { sendPasswordResetEmail } from '../../utils/email.util';
import * as userRepository from './user.repository';
import { randomBytes } from 'crypto';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    createdAt: Date;
  };
  token: string;
}

/**
 * Register a new user
 * @throws Error if email already exists
 */
export async function register(
  email: string,
  password: string
): Promise<AuthResponse> {
  // Check if user already exists
  const existingUser = await userRepository.findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await userRepository.createUser({
    email,
    passwordHash,
  });

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
}

/**
 * Login user
 * @throws Error if credentials are invalid
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  // Find user
  const user = await userRepository.findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValidPassword = await verifyPassword(user.passwordHash, password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
}

/**
 * Request password reset
 * Sends reset email if user exists
 */
export async function forgotPassword(email: string): Promise<void> {
  // Find user
  const user = await userRepository.findUserByEmail(email);
  
  // Always return success to prevent email enumeration
  if (!user) {
    return;
  }

  // Generate reset token (32 bytes = 64 hex characters)
  const resetToken = randomBytes(32).toString('hex');
  
  // Set token expiry to 1 hour from now
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  // Update user with reset token
  await userRepository.updateUser(user.id, {
    resetToken,
    resetTokenExpiry,
  });

  // Send reset email
  await sendPasswordResetEmail(user.email, resetToken);
}

/**
 * Reset password with token
 * @throws Error if token is invalid or expired
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  // Find user by reset token
  const user = await userRepository.findUserByResetToken(token);
  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update user password and clear reset token
  await userRepository.updateUser(user.id, {
    passwordHash,
    resetToken: null,
    resetTokenExpiry: null,
  });
}
