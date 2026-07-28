import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { authConfig } from '../config/auth';
import { logger } from '../utils/logger';
import { JwtPayload } from '../types';

export class AuthService {
  async register(data: { email: string; password: string; fullName: string; role?: string }) {
    const existing = await db.getClient().user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw Object.assign(new Error('Email already registered.'), { statusCode: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, authConfig.bcryptSaltRounds);

    const user = await db.getClient().user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role: (data.role as any) || 'staff',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(email: string, password: string) {
    const user = await db.getClient().user.findUnique({ where: { email } });
    if (!user) {
      throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
    }

    if (!user.isActive) {
      throw Object.assign(new Error('Account is deactivated. Contact administrator.'), { statusCode: 403 });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
    }

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const signOptions = { expiresIn: authConfig.jwtExpiresIn } as jwt.SignOptions;
    const accessToken = jwt.sign(payload, authConfig.jwtSecret, signOptions);
    const refreshSignOptions = { expiresIn: authConfig.jwtRefreshExpiresIn } as jwt.SignOptions;
    const refreshToken = jwt.sign(payload, authConfig.jwtRefreshSecret, refreshSignOptions);

    await db.getClient().activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        module: 'AUTH',
        description: `User ${user.email} logged in.`,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, authConfig.jwtRefreshSecret) as JwtPayload;
      const user = await db.getClient().user.findUnique({ where: { id: decoded.userId } });
      if (!user || !user.isActive) {
        throw Object.assign(new Error('Invalid refresh token.'), { statusCode: 401 });
      }

      const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
      const newAccessToken = jwt.sign(payload, authConfig.jwtSecret, { expiresIn: authConfig.jwtExpiresIn } as jwt.SignOptions);
      const newRefreshToken = jwt.sign(payload, authConfig.jwtRefreshSecret, { expiresIn: authConfig.jwtRefreshExpiresIn } as jwt.SignOptions);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw Object.assign(new Error('Invalid refresh token.'), { statusCode: 401 });
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await db.getClient().user.findUnique({ where: { id: userId } });
    if (!user) {
      throw Object.assign(new Error('User not found.'), { statusCode: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw Object.assign(new Error('Current password is incorrect.'), { statusCode: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, authConfig.bcryptSaltRounds);
    await db.getClient().user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }

  async getProfile(userId: string) {
    const user = await db.getClient().user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw Object.assign(new Error('User not found.'), { statusCode: 404 });
    }

    return user;
  }
}