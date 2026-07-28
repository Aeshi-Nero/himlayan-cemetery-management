import { env } from './env';

export const authConfig = {
  jwtSecret: env.jwtSecret,
  jwtRefreshSecret: env.jwtRefreshSecret,
  jwtExpiresIn: env.jwtExpiresIn,
  jwtRefreshExpiresIn: env.jwtRefreshExpiresIn,
  bcryptSaltRounds: 12,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecialChar: true,
  },
  accountLockout: {
    maxAttempts: 5,
    lockoutDurationMs: 15 * 60 * 1000,
  },
};