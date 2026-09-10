export interface StudentUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student';
  isActive: boolean;
  profilePicture: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Student {
  _id: string;
  userId: string | StudentUser;
  studentId: string;
  rollNumber: string;
  className: string;
  section: string;
  isActive: boolean;
  user?: StudentUser;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStudentUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profilePicture?: string | null;
}

export interface CreateStudentData {
  user: CreateStudentUserData;
  rollNumber: string;
  className: string;
  section: string;
}

export interface UpdateStudentUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  profilePicture?: string | null;
}

export interface UpdateStudentData {
  user?: UpdateStudentUserData;
  rollNumber?: string;
  className?: string;
  section?: string;
}

export interface StudentApiResponse {
  message: string;
  student: Student;
}
