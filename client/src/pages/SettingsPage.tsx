import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Settings,
  User,
  Mail,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  Save,
  CheckCircle,
  BellRing
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { api } from '@/lib/api';
import type { ApiResponse, User as UserType } from '@/types';

// Validation schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email').toLowerCase().trim().optional().or(z.literal('')),
  mobileNumber: z.string().regex(/^\+?[0-9]{10,15}$/, 'Please enter a valid mobile number').trim().optional().or(z.literal('')),
  emailNotifications: z.boolean(),
}).refine((data) => data.email || data.mobileNumber, {
  message: 'Either email or mobile number is required',
  path: ['email'],
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [activeTheme, setActiveTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (user?.preferences?.theme as 'light' | 'dark' | 'system') || 'system';
  });

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      mobileNumber: user?.mobileNumber || '',
      emailNotifications: user?.preferences?.emailNotifications ?? true,
    },
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema) as any,
  });

  const onUpdateProfile = async (data: ProfileForm) => {
    try {
      setIsUpdatingProfile(true);
      const response = await api.patch<ApiResponse<UserType>>('/auth/profile', {
        name: data.name,
        email: data.email || undefined,
        mobileNumber: data.mobileNumber || undefined,
        preferences: {
          ...user?.preferences,
          emailNotifications: data.emailNotifications,
          theme: activeTheme,
        },
      });
      updateUser(response.data.data);
      toast.success('Profile preferences updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    try {
      setIsUpdatingPassword(true);
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      resetPassword();
      toast.success('Password changed successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setActiveTheme(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System choice
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-brand-500" />
          Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal settings, room credentials, and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Info & Preferences */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile form card */}
          <div className="bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/85 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" />
              General Preferences
            </h3>

            <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    {...registerProfile('name')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  />
                  {profileErrors.name && (
                    <p className="mt-1 text-xs text-red-500">{profileErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="text"
                    {...registerProfile('email')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                    placeholder="you@example.com"
                  />
                  {profileErrors.email && (
                    <p className="mt-1 text-xs text-red-500">{profileErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    {...registerProfile('mobileNumber')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                    placeholder="+919876543210"
                  />
                  {profileErrors.mobileNumber && (
                    <p className="mt-1 text-xs text-red-500">{profileErrors.mobileNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Theme Settings */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-2.5">
                  App Appearance
                </label>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {[
                    { key: 'light', label: 'Light', icon: Sun },
                    { key: 'dark', label: 'Dark', icon: Moon },
                    { key: 'system', label: 'System', icon: Sparkles }
                  ].map((theme) => {
                    const Icon = theme.icon;
                    const isSelected = activeTheme === theme.key;
                    return (
                      <button
                        key={theme.key}
                        type="button"
                        onClick={() => handleThemeChange(theme.key as any)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-extrabold'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/30 text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {theme.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification toggle */}
              <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-850 rounded-2xl max-w-md">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  {...registerProfile('emailNotifications')}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-650 focus:ring-brand-500"
                />
                <div>
                  <label htmlFor="emailNotifications" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 cursor-pointer">
                    <BellRing className="w-4 h-4 text-brand-500" />
                    Email Notifications
                  </label>
                  <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-0.5">
                    Receive weekly updates on monthly carry-forwards and new settlements.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-4 py-2 gradient-bg text-white text-xs font-bold rounded-xl hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isUpdatingProfile ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Profile details & Change Password */}
        <div className="space-y-6">
          {/* User detail info card */}
          <div className="bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/85 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-500" />
              Role & Status
            </h3>
            <div className="space-y-4 text-xs font-semibold">
              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-450">Account Status</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-450">User Role</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-450">
                  {user?.role === 'superadmin' ? 'Super Admin' : 'User'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-450">Member Since</span>
                <span className="text-slate-700 dark:text-slate-350">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Change password card */}
          <div className="bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/85 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-6 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-brand-500" />
              Change Password
            </h3>

            <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...registerPassword('currentPassword')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-[10px] text-red-505">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    {...registerPassword('newPassword')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-455 hover:text-slate-655 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-[10px] text-red-505">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  {...registerPassword('confirmPassword')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  placeholder="••••••••"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-[10px] text-red-505">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full py-2.5 px-4 bg-brand-500 text-white rounded-xl text-xs font-bold hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 mt-6 shadow-md shadow-brand-500/10"
              >
                <KeyRound className="w-4 h-4" />
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
