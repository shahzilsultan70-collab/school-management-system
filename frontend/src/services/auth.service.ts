import api from './api';
import type { LoginResponse, User } from '../types/auth';

export interface LoginCredentials {
  email: string;
  password: string;
}

const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);

    const { access_token, user } = response.data;

    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('access_token');

    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  getUser(): User | null {
    const user = localStorage.getItem('user');

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as User;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  clearAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
};

export default authService;
