export interface TeacherUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'teacher';
  isActive: boolean;
  profilePicture?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Teacher {
  _id: string;
  userId: string | TeacherUser;
  employeeId: string;
  qualification: string;
  phone: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeacherData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  qualification: string;
  phone: string;
}

export interface UpdateTeacherData {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  qualification?: string;
  phone?: string;
}

export interface TeacherCreateResponse {
  message: string;
  teacher: Teacher;
}

export interface TeacherActionResponse {
  message: string;
  teacher: Teacher;
}
