import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/helpers';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.signup(
    req.body,
    req.headers['user-agent'],
    req.ip
  );

  res.status(201).json(
    ApiResponse.created(result, 'Account created successfully')
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(
    req.body,
    req.headers['user-agent'],
    req.ip
  );

  res.json(ApiResponse.ok(result, 'Login successful'));
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const tokens = await authService.refreshAccessToken(refreshToken);

  res.json(ApiResponse.ok(tokens, 'Token refreshed'));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  res.json(ApiResponse.ok(null, 'Logged out successfully'));
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  await authService.logoutAll((req as any).user.userId);

  res.json(ApiResponse.ok(null, 'Logged out from all devices'));
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getProfile((req as any).user.userId);

  res.json(ApiResponse.ok(user));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.updateProfile((req as any).user.userId, req.body);

  res.json(ApiResponse.ok(user, 'Profile updated'));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(
    (req as any).user.userId,
    currentPassword,
    newPassword
  );

  res.json(ApiResponse.ok(null, 'Password changed. Please login again.'));
});
