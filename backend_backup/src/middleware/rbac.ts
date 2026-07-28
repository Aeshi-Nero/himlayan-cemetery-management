import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  rcc: 80,
  engineer: 60,
  staff: 40,
};

export const RBAC = {
  ADMIN_ONLY: [UserRole.super_admin] as UserRole[],
  ADMIN_RCC: [UserRole.super_admin, UserRole.rcc] as UserRole[],
  ALL_AUTHENTICATED: [UserRole.super_admin, UserRole.rcc, UserRole.engineer, UserRole.staff] as UserRole[],
  ENGINEER_PLUS: [UserRole.super_admin, UserRole.rcc, UserRole.engineer] as UserRole[],
};

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions.' });
      return;
    }

    next();
  };
}

export function requireMinLevel(minRole: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const userLevel = ROLE_HIERARCHY[req.user.role];
    const minLevel = ROLE_HIERARCHY[minRole];

    if (userLevel < minLevel) {
      res.status(403).json({ success: false, error: 'Insufficient permissions.' });
      return;
    }

    next();
  };
}

export function requireOwnershipOrHigher(getOwnerId: (req: AuthenticatedRequest) => string | undefined) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const ownerId = getOwnerId(req);
    const userLevel = ROLE_HIERARCHY[req.user.role];
    const adminLevel = ROLE_HIERARCHY[UserRole.rcc];

    if (ownerId === req.user.userId || userLevel >= adminLevel) {
      next();
      return;
    }

    res.status(403).json({ success: false, error: 'Insufficient permissions.' });
  };
}