import api from './api';

import type {
  Teacher,
  CreateTeacherData,
  UpdateTeacherData,
  TeacherCreateResponse,
  TeacherActionResponse,
} from '../types/teacher';

const teacherService = {
  async getAll(): Promise<Teacher[]> {
    const response = await api.get<Teacher[]>('/teachers');

    return response.data;
  },

  async getOne(id: string): Promise<Teacher> {
    const response = await api.get<Teacher>(`/teachers/${id}`);

    return response.data;
  },

  async create(data: CreateTeacherData): Promise<Teacher> {
    const response = await api.post<TeacherCreateResponse>('/teachers', data);

    return response.data.teacher;
  },

  async update(id: string, data: UpdateTeacherData): Promise<Teacher> {
    const response = await api.patch<Teacher>(`/teachers/${id}`, data);

    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/teachers/${id}`);
  },

  async activate(id: string): Promise<Teacher> {
    const response = await api.patch<TeacherActionResponse>(
      `/teachers/${id}/activate`,
    );

    return response.data.teacher;
  },

  async deactivate(id: string): Promise<Teacher> {
    const response = await api.patch<TeacherActionResponse>(
      `/teachers/${id}/deactivate`,
    );

    return response.data.teacher;
  },
};

export default teacherService;
