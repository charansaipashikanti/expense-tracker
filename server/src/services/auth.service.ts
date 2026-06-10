import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser } from '../models/User';
import RefreshToken from '../models/RefreshToken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { SignupInput, LoginInput } from '../validators/auth.validator';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: Omit<IUser, 'password'>;
  tokens: TokenPair;
}

class AuthService {
  /**
   * Generate JWT access token
   */
  private generateAccessToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRY as any }
    );
  }

  /**
   * Generate refresh token and store in DB
   */
  private async generateRefreshToken(
    userId: string,
    rememberMe: boolean,
    userAgent?: string,
    ipAddress?: string
  ): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');

    // Expiry: 30 days for "Remember Me", otherwise 7 days
    const expiryDays = rememberMe ? 30 : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    await RefreshToken.create({
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return token;
  }

  /**
   * Generate access + refresh token pair
   */
  private async generateTokenPair(
    user: IUser,
    rememberMe: boolean,
    userAgent?: string,
    ipAddress?: string
  ): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(user._id.toString(), user.role);
    const refreshToken = await this.generateRefreshToken(
      user._id.toString(),
      rememberMe,
      userAgent,
      ipAddress
    );

    return { accessToken, refreshToken };
  }

  /**
   * Register a new user
   */
  async signup(data: SignupInput, userAgent?: string, ipAddress?: string): Promise<AuthResponse> {
    const emailVal = data.email?.trim() ? data.email.toLowerCase().trim() : undefined;
    const mobileVal = data.mobileNumber?.trim() ? data.mobileNumber.trim() : undefined;

    if (!emailVal && !mobileVal) {
      throw ApiError.badRequest('Either email or mobile number is required');
    }

    // Check if user exists
    if (emailVal) {
      const existingUser = await User.findOne({ email: emailVal });
      if (existingUser) {
        throw ApiError.conflict('An account with this email already exists');
      }
    }
    if (mobileVal) {
      const existingUser = await User.findOne({ mobileNumber: mobileVal });
      if (existingUser) {
        throw ApiError.conflict('An account with this mobile number already exists');
      }
    }

    // Create user
    const user = await User.create({
      name: data.name,
      email: emailVal,
      mobileNumber: mobileVal,
      password: data.password,
    });

    // Generate tokens
    const tokens = await this.generateTokenPair(user, false, userAgent, ipAddress);

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    return { user, tokens };
  }

  /**
   * Login user
   */
  async login(data: LoginInput, userAgent?: string, ipAddress?: string): Promise<AuthResponse> {
    // Find user with password
    const user = await User.findByIdentifier(data.identifier);
    if (!user) {
      throw ApiError.unauthorized('Invalid email/mobile or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been disabled. Contact admin.');
    }

    // Check password
    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email/mobile or password');
    }

    // Generate tokens
    const tokens = await this.generateTokenPair(
      user,
      data.rememberMe || false,
      userAgent,
      ipAddress
    );

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    return { user, tokens };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      isRevoked: false,
    });

    if (!storedToken) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      throw ApiError.unauthorized('Refresh token expired');
    }

    // Get user
    const user = await User.findById(storedToken.userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    // Rotate refresh token — revoke old, create new
    storedToken.isRevoked = true;
    await storedToken.save();

    const newAccessToken = this.generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = await this.generateRefreshToken(
      user._id.toString(),
      false,
      storedToken.userAgent,
      storedToken.ipAddress
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout — revoke refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { isRevoked: true }
    );
  }

  /**
   * Logout from all devices — revoke all refresh tokens for a user
   */
  async logoutAll(userId: string): Promise<void> {
    await RefreshToken.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: any): Promise<IUser> {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw ApiError.notFound('User not found');
    }

    // Validate inputs
    const emailVal = data.email?.trim() ? data.email.toLowerCase().trim() : undefined;
    const mobileVal = data.mobileNumber?.trim() ? data.mobileNumber.trim() : undefined;

    const finalEmail = data.email !== undefined ? emailVal : currentUser.email;
    const finalMobile = data.mobileNumber !== undefined ? mobileVal : currentUser.mobileNumber;

    if (!finalEmail && !finalMobile) {
      throw ApiError.badRequest('At least email or mobile number is required');
    }

    // Check uniqueness conflicts
    if (data.email !== undefined && emailVal) {
      const existing = await User.findOne({ email: emailVal, _id: { $ne: userId } });
      if (existing) {
        throw ApiError.conflict('An account with this email already exists');
      }
    }
    if (data.mobileNumber !== undefined && mobileVal) {
      const existing = await User.findOne({ mobileNumber: mobileVal, _id: { $ne: userId } });
      if (existing) {
        throw ApiError.conflict('An account with this mobile number already exists');
      }
    }

    // Prepare update payload
    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.email !== undefined) updatePayload.email = emailVal;
    if (data.mobileNumber !== undefined) updatePayload.mobileNumber = mobileVal;
    if (data.preferences !== undefined) updatePayload.preferences = data.preferences;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    // Revoke all refresh tokens on password change
    await this.logoutAll(userId);
  }
}

export const authService = new AuthService();
