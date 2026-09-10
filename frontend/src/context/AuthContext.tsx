import { createContext, useContext, useState, type ReactNode } from 'react';

import authService from '../services/auth.service';

import type { LoginCredentials } from '../services/auth.service';

import type { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(authService.getUser());

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    authService.isAuthenticated(),
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);

    try {
      const response = await authService.login(credentials);

      setUser(response.user);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
