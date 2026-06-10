import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api, tokenManager } from '@/lib/api';
import type { User, AuthResponse, LoginRequest, SignupRequest, ApiResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user on mount
  const fetchUser = useCallback(async () => {
    const token = tokenManager.getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.get<ApiResponse<User>>('/auth/profile');
      setUser(data.data);
    } catch {
      tokenManager.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (loginData: LoginRequest) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', loginData);
    const { user: userData, tokens } = data.data;
    tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
    setUser(userData);
  };

  const signup = async (signupData: SignupRequest) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/signup', signupData);
    const { user: userData, tokens } = data.data;
    tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore errors on logout
    } finally {
      tokenManager.clearTokens();
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
