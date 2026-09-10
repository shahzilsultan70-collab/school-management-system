export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  profilePicture: string | null;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  user: User;
}
