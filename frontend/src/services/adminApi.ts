import axios from 'axios';
import { AdminTask } from '../types/index';

// CREATE DEDICATED ADMIN AXIOS INSTANCE (FIXES PRIVATE API ACCESS)
const adminApi = axios.create({
  baseURL: '/api/admin',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface TaskStats {
  totalTasks: number;
  activeTasks: number;
  byDifficulty: Record<string, number>;
  byCategory: Record<string, number>;
  byLanguage: Record<string, number>;
  recentTasks: any[];
}

export const adminApiService = {
  getAllTasks: async (params?: any) => {
    const response = await adminApi.get('/tasks', { params });
    return response.data;
  },
  getTaskById: async (id: string) => {
    const response = await adminApi.get(`/tasks/${id}`);
    return response.data;
  },
  createTask: async (taskData: Partial<AdminTask>) => {
    const response = await adminApi.post('/tasks', taskData);
    return response.data;
  },
  updateTask: async (id: string, taskData: Partial<AdminTask>) => {
    const response = await adminApi.put(`/tasks/${id}`, taskData);
    return response.data;
  },
  deleteTask: async (id: string) => {
    const response = await adminApi.delete(`/tasks/${id}`);
    return response.data;
  },
  restoreTask: async (id: string) => {
    const response = await adminApi.post(`/tasks/${id}/restore`);
    return response.data;
  },
  getStats: async () => {
    const response = await adminApi.get('/tasks/stats');
    return response.data;
  },
  bulkDelete: async (taskIds: string[]) => {
    const response = await adminApi.post('/tasks/bulk-delete', { taskIds });
    return response.data;
  },
  
  generateTestScript: async (data: any) => {
    const response = await adminApi.post('/tasks/generate-test-script', data);
    return response.data;
  },
};
