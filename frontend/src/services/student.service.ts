import api from './api';

import type {
  Student,
  CreateStudentData,
  UpdateStudentData,
  StudentApiResponse,
} from '../types/student';

const studentService = {
  async getAll(): Promise<Student[]> {
    const response = await api.get<Student[]>('/students');

    return response.data;
  },

  async getOne(id: string): Promise<Student> {
    const response = await api.get<Student>(`/students/${id}`);

    return response.data;
  },

  async create(data: CreateStudentData): Promise<Student> {
    const response = await api.post<StudentApiResponse>('/students', data);

    return response.data.student;
  },

  async update(id: string, data: UpdateStudentData): Promise<Student> {
    const response = await api.patch<StudentApiResponse>(
      `/students/${id}`,
      data,
    );

    return response.data.student;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/students/${id}`);
  },

  async activate(id: string): Promise<Student> {
    const response = await api.patch<StudentApiResponse>(
      `/students/${id}/activate`,
    );

    return response.data.student;
  },

  async deactivate(id: string): Promise<Student> {
    const response = await api.patch<StudentApiResponse>(
      `/students/${id}/deactivate`,
    );

    return response.data.student;
  },
};

export default studentService;
