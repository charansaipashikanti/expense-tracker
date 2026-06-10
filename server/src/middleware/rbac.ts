import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import GroupMember from '../models/GroupMember';

/**
 * Require specific system-level role (e.g., superadmin)
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }

    next();
  };
};

/**
 * Require specific group-level role (admin or member)
 * Extracts groupId from req.params.groupId or req.body.groupId
 */
export const requireGroupRole = (...roles: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const groupId = req.params.groupId || req.body.groupId;
      if (!groupId) {
        throw ApiError.badRequest('Group ID is required');
      }

      // Super admin has access to everything
      if (req.user.role === 'superadmin') {
        return next();
      }

      const membership = await GroupMember.findOne({
        groupId,
        userId: req.user.userId,
        isActive: true,
      });

      if (!membership) {
        throw ApiError.forbidden('You are not a member of this group');
      }

      if (roles.length > 0 && !roles.includes(membership.role)) {
        throw ApiError.forbidden('You do not have the required role in this group');
      }

      // Attach group role to request for downstream use
      (req as any).groupRole = membership.role;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require group membership (any role)
 */
export const requireGroupMember = requireGroupRole();
